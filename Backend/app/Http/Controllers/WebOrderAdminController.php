<?php

namespace App\Http\Controllers;

use App\Models\WebOrder;
use App\Models\WebOrderStatusHistory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WebOrderAdminController extends Controller
{
    public function index(Request $request): Response
    {
        $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', Rule::in(WebOrder::statuses())],
            'with_trashed' => ['nullable'],
            'only_trashed' => ['nullable'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = WebOrder::query()->withCount('items');

        if ($request->boolean('only_trashed')) {
            $query->onlyTrashed();
        } elseif ($request->boolean('with_trashed')) {
            $query->withTrashed();
        }

        if ($request->filled('search')) {
            $search = (string) $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_email', 'like', "%{$search}%")
                  ->orWhere('customer_phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $orders = $query
            ->latest()
            ->paginate($request->integer('per_page', 15))
            ->appends($request->all());

        return Inertia::render('WebOrders/Index', [
            'orders' => $orders,
            'filters' => $request->only(['search', 'status', 'with_trashed', 'only_trashed', 'per_page']),
            'statuses' => WebOrder::statuses(),
        ]);
    }

    public function show(int $id): Response
    {
        $order = WebOrder::withTrashed()
            ->with(['items', 'statusHistories.user'])
            ->findOrFail($id);

        return Inertia::render('WebOrders/Show', [
            'order' => $order,
            'statuses' => WebOrder::statuses(),
        ]);
    }

    public function changeStatus(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(WebOrder::statuses())],
            'comment' => ['required', 'string', 'max:500'],
        ]);

        $order = WebOrder::withTrashed()->findOrFail($id);
        $fromStatus = (string) $order->status;
        $toStatus = (string) $validated['status'];

        if ($fromStatus === $toStatus) {
            return back()->with('info', 'Statut inchangé.');
        }

        DB::transaction(function () use ($order, $fromStatus, $toStatus, $validated) {
            $order->update(['status' => $toStatus]);

            WebOrderStatusHistory::create([
                'web_order_id' => $order->id,
                'user_id' => Auth::id(),
                'from_status' => $fromStatus,
                'to_status' => $toStatus,
                'comment' => $validated['comment'],
                'metadata' => null,
            ]);
        });

        return back()->with('success', 'Statut mis à jour.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $order = WebOrder::findOrFail($id);
        $order->delete();

        return back()->with('success', 'Commande archivée (soft delete).');
    }

    public function restore(int $id): RedirectResponse
    {
        $order = WebOrder::withTrashed()->findOrFail($id);
        $order->restore();

        return back()->with('success', 'Commande restaurée.');
    }
}
