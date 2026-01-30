<?php

namespace App\Http\Controllers;

use App\Models\TicketSlaPolicy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TicketSlaPolicyController extends Controller
{
    private function priorities(): array
    {
        return ['low', 'medium', 'high', 'critical'];
    }

    public function index(Request $request): Response
    {
        $query = TicketSlaPolicy::query()
            ->orderByDesc('is_active')
            ->orderBy('priority')
            ->orderBy('name');

        if ($request->filled('search')) {
            $s = trim((string) $request->string('search'));
            $query->where('name', 'like', "%{$s}%");
        }

        if ($request->filled('priority')) {
            $query->where('priority', (string) $request->string('priority'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', (bool) $request->boolean('is_active'));
        }

        $policies = $query
            ->paginate($request->integer('per_page', 10))
            ->appends($request->all())
            ->through(fn (TicketSlaPolicy $policy) => [
                'id' => $policy->id,
                'name' => $policy->name,
                'priority' => $policy->priority,
                'first_response_minutes' => $policy->first_response_minutes,
                'resolution_minutes' => $policy->resolution_minutes,
                'is_active' => (bool) $policy->is_active,
            ]);

        return Inertia::render('Tickets/SlaPolicies/Index', [
            'policies' => $policies,
            'meta' => [
                'priorities' => $this->priorities(),
            ],
            'filters' => $request->only(['search', 'priority', 'is_active', 'per_page', 'page']),
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Tickets/SlaPolicies/Create', [
            'meta' => [
                'priorities' => $this->priorities(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'priority' => ['required', 'string', 'in:' . implode(',', $this->priorities())],
            'first_response_minutes' => ['required', 'integer', 'min:1'],
            'resolution_minutes' => ['required', 'integer', 'min:1'],
            'is_active' => ['required', 'boolean'],
        ]);

        TicketSlaPolicy::create($validated);

        return redirect()
            ->route('tickets.sla-policies.index')
            ->with('success', 'Politique SLA créée.');
    }

    public function edit(TicketSlaPolicy $policy): Response
    {
        return Inertia::render('Tickets/SlaPolicies/Edit', [
            'policy' => [
                'id' => $policy->id,
                'name' => $policy->name,
                'priority' => $policy->priority,
                'first_response_minutes' => $policy->first_response_minutes,
                'resolution_minutes' => $policy->resolution_minutes,
                'is_active' => (bool) $policy->is_active,
            ],
            'meta' => [
                'priorities' => $this->priorities(),
            ],
        ]);
    }

    public function update(Request $request, TicketSlaPolicy $policy): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'priority' => ['required', 'string', 'in:' . implode(',', $this->priorities())],
            'first_response_minutes' => ['required', 'integer', 'min:1'],
            'resolution_minutes' => ['required', 'integer', 'min:1'],
            'is_active' => ['required', 'boolean'],
        ]);

        $policy->update($validated);

        return redirect()
            ->route('tickets.sla-policies.index')
            ->with('success', 'Politique SLA mise à jour.');
    }

    public function destroy(TicketSlaPolicy $policy): RedirectResponse
    {
        $policy->delete();

        return redirect()
            ->route('tickets.sla-policies.index')
            ->with('success', 'Politique SLA supprimée.');
    }
}
