<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\SupportTicketMessageResource;
use App\Http\Resources\SupportTicketResource;
use App\Models\Ticket;
use App\Models\TicketComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SupportTicketController extends Controller
{
    /**
     * Liste des tickets du client
     */
    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min(100, $perPage));

        $tickets = Ticket::query()
            ->where('user_id', Auth::id())
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return SupportTicketResource::collection($tickets)
            ->additional(['success' => true]);
    }

    /**
     * Création d’un ticket
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string'
        ]);

        $ticket = Ticket::create([
            'user_id'   => Auth::id(),
            'client_id' => Auth::user()->client_id,
            // Legacy columns
            'subject'   => $validated['subject'],
            'message'   => $validated['message'],
            'title'     => $validated['subject'],
            'description' => $validated['message'],
            'status'    => 'new',
            'priority'  => 'medium',
            'source'    => 'web',
        ]);

        TicketComment::create([
            'ticket_id'   => $ticket->id,
            'sender_id'   => Auth::id(),
            'sender_type' => 'client',
            'visibility'  => 'public',
            'body'        => $validated['message'],
            // Compat: legacy column still exists and may be NOT NULL
            'message'     => $validated['message'],
        ]);

        return response()->json([
            'success' => true,
            'data' => new SupportTicketResource($ticket)
        ]);
    }

    /**
     * Voir un ticket
     */
    public function show(Request $request, $id)
    {
        $ticket = Ticket::query()
            ->with(['comments' => function ($query) {
                $query->where('visibility', 'public')->orderBy('created_at');
            }])
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new SupportTicketResource($ticket)
        ]);
    }

    /**
     * Répondre à un ticket
     */
    public function reply(Request $request, $id)
    {
        $validated = $request->validate([
            'message' => 'required|string'
        ]);

        $ticket = Ticket::where('user_id', Auth::id())->findOrFail($id);

        $message = TicketComment::create([
            'ticket_id'   => $ticket->id,
            'sender_id'   => Auth::id(),
            'sender_type' => 'client',
            'visibility'  => 'public',
            'body'        => $validated['message'],
            // Compat: legacy column still exists and may be NOT NULL
            'message'     => $validated['message'],
        ]);

        return response()->json([
            'success' => true,
            'data' => new SupportTicketMessageResource($message)
        ]);
    }
}
