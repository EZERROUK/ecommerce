<?php

namespace App\Http\Controllers;

use App\Http\Requests\ClientRequest;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Client::query()
            ->withTrashed()
            ->withCount(['quotes', 'orders']);

        /* ------------------------------------------------------------------ */
        /*                               FILTRES                               */
        /* ------------------------------------------------------------------ */

        // Filtres champs dédiés (ceux envoyés par ton front)
        foreach (['company_name', 'contact_name', 'email', 'ice'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, 'like', '%' . $request->input($field) . '%');
            }
        }

        // Recherche globale
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                    ->orWhere('contact_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('ice', 'like', "%{$search}%");
            });
        }

        // Régime fiscal
        if ($request->filled('tax_regime')) {
            $query->where('tax_regime', $request->input('tax_regime'));
        }

        // Statut (3 états : actif / inactif / désactivé (soft-deleted))
        if ($request->filled('status')) {
            $status = $request->input('status');

            if ($status === 'active') {
                $query->whereNull('deleted_at')->where('is_active', true);
            } elseif ($status === 'inactive') {
                $query->whereNull('deleted_at')->where('is_active', false);
            } elseif ($status === 'deleted') {
                $query->onlyTrashed();
            }
        }

        // Date de création (YYYY-MM-DD)
        if ($request->filled('date_start') && $request->filled('date_end')) {
            $start = $request->input('date_start') . ' 00:00:00';
            $end = $request->input('date_end') . ' 23:59:59';
            $query->whereBetween('created_at', [$start, $end]);
        }

        /* ------------------------------------------------------------------ */
        /*                                 TRI                                 */
        /* ------------------------------------------------------------------ */

        $sort = $request->input('sort', 'company_name');
        $dir = $request->input('dir', 'asc') === 'desc' ? 'desc' : 'asc';

        $allowedSorts = ['company_name', 'contact_name', 'email', 'created_at', 'quotes_count', 'orders_count'];
        if (!in_array($sort, $allowedSorts, true)) {
            $sort = 'company_name';
        }

        $query->orderBy($sort, $dir);

        /* ------------------------------------------------------------------ */
        /*                              PAGINATION                              */
        /* ------------------------------------------------------------------ */

        $perPageRequested = (int) $request->input('per_page', 15);

        // "Tous les enregistrements" => on force une pagination sur la taille totale
        // (ainsi last_page=1 et total OK)
        if ($perPageRequested === -1) {
            $total = (int) $query->count();
            $perPage = max(1, $total);
        } else {
            $perPage = max(1, $perPageRequested);
        }

        $clients = $query
            ->paginate($perPage)
            ->appends($request->query());

        $filters = $request->only([
            'search',
            'company_name',
            'contact_name',
            'email',
            'ice',
            'tax_regime',
            'status',
            'date_start',
            'date_end',
        ]);

        // On renvoie aussi le per_page demandé (pour que le select reste bien sur "Tous")
        $filters['per_page'] = $perPageRequested;

        return Inertia::render('Clients/Index', [
            'clients' => $clients,
            'filters' => $filters,
            'sort' => $sort,
            'dir' => $dir,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Clients/Create');
    }

    public function store(ClientRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // Créateur (forcé côté serveur)
        $validated['created_by'] = $request->user()->id;

        Client::create($validated);

        return redirect()
            ->route('clients.index')
            ->with('success', 'Client créé avec succès.');
    }

    public function show(Client $client): Response
    {
        $client->load([
            'creator:id,name',
            'updater:id,name',
            'quotes' => function ($query) {
                $query->latest()
                    ->take(10)
                    ->select('id', 'client_id', 'quote_number', 'status', 'total_ttc', 'currency_code', 'created_at');
            },
            'orders' => function ($query) {
                $query->latest()
                    ->take(10)
                    ->select('id', 'client_id', 'order_number', 'status', 'total_ttc', 'currency_code', 'created_at');
            },
        ]);

        return Inertia::render('Clients/Show', [
            'client' => $client,
        ]);
    }

    public function edit(Client $client): Response
    {
        return Inertia::render('Clients/Edit', [
            'client' => $client,
        ]);
    }

    public function update(ClientRequest $request, Client $client): RedirectResponse
    {
        $validated = $request->validated();

        // Updater (forcé côté serveur)
        $validated['updated_by'] = $request->user()->id;

        $client->update($validated);

        return redirect()
            ->route('clients.index')
            ->with('success', 'Client mis à jour avec succès.');
    }

    public function destroy(Client $client): RedirectResponse
    {
        $client->delete();

        return back()->with('success', 'Client supprimé.');
    }

    public function restore($id): RedirectResponse
    {
        $client = Client::withTrashed()->findOrFail($id);
        $client->restore();

        return back()->with('success', 'Client restauré.');
    }
}
