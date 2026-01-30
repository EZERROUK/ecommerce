<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\TicketComment;
use App\Models\TicketSlaPolicy;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    private const STATUSES = [
        'new',
        'open',
        'pending_customer',
        'pending_internal',
        'on_hold',
        'resolved',
        'closed',
        'cancelled',
    ];

    private const PRIORITIES = ['low', 'medium', 'high', 'critical'];

    public function index(Request $request): Response
    {
        $query = Ticket::query()
            ->with([
                'client:id,company_name,contact_name',
                'assignedTo:id,name',
            ])
            ->latest('updated_at');

        if ($request->filled('search')) {
            $s = trim((string) $request->string('search'));
            $query->where(function ($q) use ($s) {
                $q->where('code', 'like', "%{$s}%")
                    ->orWhere('title', 'like', "%{$s}%")
                    ->orWhere('description', 'like', "%{$s}%")
                    ->orWhereHas('client', fn ($c) => $c->where('company_name', 'like', "%{$s}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', (string) $request->string('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', (string) $request->string('priority'));
        }

        if ($request->filled('assigned_to_user_id')) {
            $query->where('assigned_to_user_id', (int) $request->integer('assigned_to_user_id'));
        }

        $tickets = $query
            ->paginate($request->integer('per_page', 15))
            ->appends($request->all())
            ->through(fn (Ticket $t) => [
                'id' => $t->id,
                'code' => $t->code,
                'title' => $t->title,
                'status' => $t->status,
                'priority' => $t->priority,
                'client' => $t->client ? [
                    'id' => $t->client->id,
                    'company_name' => $t->client->company_name,
                    'contact_name' => $t->client->contact_name,
                ] : null,
                'assigned_to' => $t->assignedTo ? [
                    'id' => $t->assignedTo->id,
                    'name' => $t->assignedTo->name,
                ] : null,
                'created_at' => $t->created_at?->toDateTimeString(),
                'updated_at' => $t->updated_at?->toDateTimeString(),
                'last_activity_at' => $t->last_activity_at?->toDateTimeString(),
            ]);

        return Inertia::render('Tickets/Index', [
            'tickets' => $tickets,
            'filters' => $request->only(['search', 'status', 'priority', 'assigned_to_user_id', 'per_page']),
            'agents' => User::select('id', 'name')->orderBy('name')->get(),
            'meta' => [
                'statuses' => self::STATUSES,
                'priorities' => self::PRIORITIES,
            ],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Tickets/Create', [
            'clients' => Client::select('id', 'company_name', 'contact_name')->orderBy('company_name')->get(),
            'meta' => [
                'statuses' => self::STATUSES,
                'priorities' => self::PRIORITIES,
            ],
        ]);
    }

    public function edit(Ticket $ticket): Response
    {
        $ticket->load('client:id,company_name,contact_name');

        return Inertia::render('Tickets/Edit', [
            'ticket' => [
                'id' => $ticket->id,
                'code' => $ticket->code,
                'client_id' => $ticket->client_id,
                'title' => $ticket->title,
                'description' => $ticket->description,
                'status' => $ticket->status,
                'priority' => $ticket->priority,
            ],
            'clients' => Client::select('id', 'company_name', 'contact_name')->orderBy('company_name')->get(),
            'meta' => [
                'statuses' => self::STATUSES,
                'priorities' => self::PRIORITIES,
            ],
        ]);
    }

    public function update(Request $request, Ticket $ticket): RedirectResponse
    {
        $data = $request->validate([
            'client_id' => 'required|integer|exists:clients,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'nullable|string|in:' . implode(',', self::PRIORITIES),
            'status' => 'nullable|string|in:' . implode(',', self::STATUSES),
        ]);

        $ticket->client_id = (int) $data['client_id'];
        $ticket->title = $data['title'];
        $ticket->description = $data['description'];

        // Compat: keep legacy columns in sync (older schema still has NOT NULL subject/message)
        $ticket->subject = $data['title'];
        $ticket->message = $data['description'];

        $ticket->priority = $data['priority'] ?? $ticket->priority;

        $nextStatus = $data['status'] ?? $ticket->status;
        $ticket->status = $nextStatus;
        $ticket->last_activity_at = now();

        if ($ticket->status === 'resolved' && $ticket->resolved_at === null) {
            $ticket->resolved_at = now();
        }
        if ($ticket->status === 'closed' && $ticket->closed_at === null) {
            $ticket->closed_at = now();
        }
        if ($ticket->status === 'cancelled' && $ticket->cancelled_at === null) {
            $ticket->cancelled_at = now();
        }

        $ticket->save();

        return redirect()->route('tickets.show', $ticket)->with('success', 'Ticket mis à jour.');
    }

    public function destroy(Ticket $ticket): RedirectResponse
    {
        $ticket->delete();

        return redirect()
            ->route('tickets.index')
            ->with('success', 'Ticket supprimé.');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'client_id' => 'required|integer|exists:clients,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'nullable|string|in:' . implode(',', self::PRIORITIES),
            'status' => 'nullable|string|in:' . implode(',', self::STATUSES),
        ]);

        // Force le statut à "new" à la création (même si le front envoie autre chose).
        $data['status'] = 'new';

        /** @var \App\Models\User $actor */
        $actor = $request->user();

        $ticket = DB::transaction(function () use ($data, $actor) {
            $year = (int) now()->format('Y');

            $maxSeq = (int) Ticket::query()
                ->where('code_year', $year)
                ->lockForUpdate()
                ->max('code_seq');

            $seq = $maxSeq + 1;
            $code = sprintf('T-%d-%06d', $year, $seq);

            $ticket = Ticket::create([
                'client_id' => (int) $data['client_id'],
                'user_id' => null,

                // Legacy columns (older schema)
                'subject' => $data['title'],
                'message' => $data['description'],

                'code_year' => $year,
                'code_seq' => $seq,
                'code' => $code,

                'title' => $data['title'],
                'description' => $data['description'],

                'status' => $data['status'] ?? 'new',
                'priority' => $data['priority'] ?? 'medium',

                'impact' => 'medium',
                'urgency' => 'medium',

                'source' => 'admin',
                'channel' => 'backoffice',

                'assigned_to_user_id' => null,
                'visible_to_client' => true,
                'internal_confidential' => false,

                'last_activity_at' => now(),
            ]);

            // SLA auto (optionnel) : priorité + catégorie (si affectée plus tard)
            $policy = TicketSlaPolicy::query()
                ->where('is_active', true)
                ->where(function ($q) use ($ticket) {
                    $q->whereNull('priority')->orWhere('priority', $ticket->priority);
                })
                ->where(function ($q) use ($ticket) {
                    $q->whereNull('ticket_category_id')->orWhere('ticket_category_id', $ticket->ticket_category_id);
                })
                ->orderByDesc('ticket_category_id')
                ->orderByDesc('priority')
                ->first();

            if ($policy) {
                $ticket->ticket_sla_policy_id = $policy->id;
                $ticket->first_response_due_at = now()->addMinutes((int) $policy->first_response_minutes);
                $ticket->resolution_due_at = now()->addMinutes((int) $policy->resolution_minutes);
                $ticket->save();
            }

            TicketComment::create([
                'ticket_id' => $ticket->id,
                'sender_id' => $actor->id,
                'sender_type' => 'staff',
                'visibility' => 'internal',
                'body' => $data['description'],
                // Compat: legacy column still exists and may be NOT NULL
                'message' => $data['description'],
            ]);

            return $ticket;
        });

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Ticket créé.');
    }

    public function show(Request $request, Ticket $ticket): Response
    {
        $canSeeInternal = $request->user()?->can('ticket_comment_internal') ?? false;

        $ticket->load([
            'client',
            'assignedTo:id,name',
            'comments' => function ($q) use ($canSeeInternal) {
                if (!$canSeeInternal) {
                    $q->where('visibility', 'public');
                }
                $q->with('sender:id,name')->orderBy('created_at');
            },
            'attachments.uploader:id,name',
        ]);

        return Inertia::render('Tickets/Show', [
            'ticket' => [
                'id' => $ticket->id,
                'code' => $ticket->code,
                'title' => $ticket->title,
                'description' => $ticket->description,
                'status' => $ticket->status,
                'priority' => $ticket->priority,
                'client' => $ticket->client ? [
                    'id' => $ticket->client->id,
                    'company_name' => $ticket->client->company_name,
                    'contact_name' => $ticket->client->contact_name,
                    'email' => $ticket->client->email,
                    'phone' => $ticket->client->phone,
                ] : null,
                'assigned_to' => $ticket->assignedTo ? [
                    'id' => $ticket->assignedTo->id,
                    'name' => $ticket->assignedTo->name,
                ] : null,
                'first_response_due_at' => $ticket->first_response_due_at?->toDateTimeString(),
                'resolution_due_at' => $ticket->resolution_due_at?->toDateTimeString(),
                'created_at' => $ticket->created_at?->toDateTimeString(),
                'updated_at' => $ticket->updated_at?->toDateTimeString(),
                'last_activity_at' => $ticket->last_activity_at?->toDateTimeString(),
            ],
            'comments' => $ticket->comments->map(fn (TicketComment $c) => [
                'id' => $c->id,
                'visibility' => $c->visibility,
                'sender_type' => $c->sender_type,
                'sender' => $c->sender ? ['id' => $c->sender->id, 'name' => $c->sender->name] : null,
                'body' => $c->body ?? $c->message,
                'created_at' => $c->created_at?->toDateTimeString(),
            ])->values(),
            'attachments' => $ticket->attachments->map(fn (TicketAttachment $a) => [
                'id' => $a->id,
                'original_name' => $a->original_name,
                'mime_type' => $a->mime_type,
                'size' => (int) $a->size,
                'uploaded_by' => $a->uploader ? ['id' => $a->uploader->id, 'name' => $a->uploader->name] : null,
                'created_at' => $a->created_at?->toDateTimeString(),
                'download_url' => route('tickets.attachments.download', ['ticket' => $ticket->id, 'attachment' => $a->id]),
                'delete_url' => route('tickets.attachments.delete', ['ticket' => $ticket->id, 'attachment' => $a->id]),
            ])->values(),
            'agents' => User::select('id', 'name')->orderBy('name')->get(),
            'meta' => [
                'statuses' => self::STATUSES,
                'priorities' => self::PRIORITIES,
            ],
        ]);
    }

    public function uploadAttachment(Request $request, Ticket $ticket): RedirectResponse
    {
        $validated = $request->validate([
            'file' => 'required|file|max:20480|mimes:pdf,png,jpg,jpeg,webp,txt,doc,docx,xls,xlsx,csv,zip',
        ]);

        $file = $validated['file'];
        $disk = 'public';

        $originalName = $file->getClientOriginalName();
        $safeName = Str::slug(pathinfo($originalName, PATHINFO_FILENAME));
        $ext = strtolower($file->getClientOriginalExtension() ?: 'bin');
        $filename = Str::uuid()->toString() . '-' . ($safeName ?: 'attachment') . '.' . $ext;

        $path = $file->storeAs("tickets/{$ticket->id}", $filename, $disk);

        TicketAttachment::create([
            'ticket_id' => $ticket->id,
            'ticket_comment_id' => null,
            'uploaded_by_user_id' => $request->user()->id,
            'disk' => $disk,
            'path' => $path,
            'original_name' => $originalName,
            'mime_type' => (string) ($file->getClientMimeType() ?? 'application/octet-stream'),
            'size' => (int) $file->getSize(),
        ]);

        $ticket->last_activity_at = now();
        $ticket->save();

        return back()->with('success', 'Pièce jointe ajoutée.');
    }

    public function downloadAttachment(Request $request, Ticket $ticket, TicketAttachment $attachment)
    {
        if ((int) $attachment->ticket_id !== (int) $ticket->id) {
            abort(404);
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $fs */
        $fs = Storage::disk($attachment->disk);

        if (!$fs->exists($attachment->path)) {
            abort(404);
        }

        return $fs->download($attachment->path, $attachment->original_name);
    }

    public function deleteAttachment(Request $request, Ticket $ticket, TicketAttachment $attachment): RedirectResponse
    {
        if ((int) $attachment->ticket_id !== (int) $ticket->id) {
            abort(404);
        }

        $attachment->delete();

        $ticket->last_activity_at = now();
        $ticket->save();

        return back()->with('success', 'Pièce jointe supprimée.');
    }

    public function addComment(Request $request, Ticket $ticket): RedirectResponse
    {
        $validated = $request->validate([
            'visibility' => 'required|string|in:public,internal',
            'body' => 'required|string',
        ]);

        $visibility = $validated['visibility'];

        if ($visibility === 'internal' && !$request->user()->can('ticket_comment_internal')) {
            abort(403);
        }

        if ($visibility === 'public' && !$request->user()->can('ticket_comment_public')) {
            abort(403);
        }

        TicketComment::create([
            'ticket_id' => $ticket->id,
            'sender_id' => $request->user()->id,
            'sender_type' => 'staff',
            'visibility' => $visibility,
            'body' => $validated['body'],
            // Compat: legacy column still exists and may be NOT NULL
            'message' => $validated['body'],
        ]);

        $ticket->last_activity_at = now();
        $ticket->save();

        return back()->with('success', 'Commentaire ajouté.');
    }

    public function changeStatus(Request $request, Ticket $ticket): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:' . implode(',', self::STATUSES),
        ]);

        $ticket->status = $validated['status'];
        $ticket->last_activity_at = now();

        if ($ticket->status === 'resolved' && $ticket->resolved_at === null) {
            $ticket->resolved_at = now();
        }
        if ($ticket->status === 'closed' && $ticket->closed_at === null) {
            $ticket->closed_at = now();
        }
        if ($ticket->status === 'cancelled' && $ticket->cancelled_at === null) {
            $ticket->cancelled_at = now();
        }

        $ticket->save();

        return back()->with('success', 'Statut mis à jour.');
    }

    public function assign(Request $request, Ticket $ticket): RedirectResponse
    {
        $validated = $request->validate([
            'assigned_to_user_id' => 'nullable|integer|exists:users,id',
        ]);

        $ticket->assigned_to_user_id = $validated['assigned_to_user_id'] ?? null;
        $ticket->last_activity_at = now();
        $ticket->save();

        return back()->with('success', 'Assignation mise à jour.');
    }
}
