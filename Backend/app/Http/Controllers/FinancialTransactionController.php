<?php

namespace App\Http\Controllers;

use App\Http\Requests\FinancialTransactionRequest;
use App\Models\FinancialTransaction;
use App\Models\ExpenseCategory;
use App\Models\Client;
use App\Models\Provider;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Models\FinancialTransactionReminder;
use Illuminate\Support\Facades\Auth;

class FinancialTransactionController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', FinancialTransaction::class);

        $filters = $request->only([
            'direction',
            'status',
            'date_from',
            'date_to',
            'client_id',
            'provider_id',
        ]);

        $query = FinancialTransaction::query()
        ->with(['client', 'provider', 'invoice', 'expenseCategory'])
        ->withCount('reminders')
        ->addSelect([
            'last_reminder_at' => FinancialTransactionReminder::select('reminder_date')
                ->whereColumn('financial_transaction_id', 'financial_transactions.id')
                ->latest('reminder_date')
                ->limit(1),
        ])
        ->when($filters['direction'] ?? null, fn ($q, $v) => $q->where('direction', $v))
        ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
        ->when($filters['client_id'] ?? null, fn ($q, $v) => $q->where('client_id', $v))
        ->when($filters['provider_id'] ?? null, fn ($q, $v) => $q->where('provider_id', $v))
        ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('due_date', '>=', $v))
        ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('due_date', '<=', $v))
        ->orderByDesc('due_date');

        $transactions = $query->paginate(25)->withQueryString();

        $totalIn  = (clone $query)->in()->paid()->sum('amount');
        $totalOut = (clone $query)->out()->paid()->sum('amount');
        $net      = $totalIn - $totalOut;

        return Inertia::render('Financial/TransactionsIndex', [
            'transactions' => $transactions,
            'filters'      => $filters,
            'summary'      => [
                'total_in'  => $totalIn,
                'total_out' => $totalOut,
                'net'       => $net,
            ],
        ]);
    }

    public function create()
    {
        $this->authorize('create', FinancialTransaction::class);

        $expenseCategories = ExpenseCategory::query()
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $clients   = Client::orderBy('company_name')->get(['id', 'company_name']);
        $providers = Provider::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Financial/Transactions/Create', [
            'expenseCategories' => $expenseCategories,
            'clients'           => $clients,
            'providers'         => $providers,
        ]);
    }

    public function store(FinancialTransactionRequest $request)
    {
        $this->authorize('create', FinancialTransaction::class);

        $data = $request->validated();

        if (array_key_exists('amount', $data)) {
            $data['amount'] = number_format((float) $data['amount'], 2, '.', '');
        }
        $data['created_by'] = $request->user()->id;

        if (($data['status'] ?? null) === 'paid' && empty($data['paid_at'])) {
            $data['paid_at'] = now();
        }

        FinancialTransaction::create($data);

        return redirect()
            ->route('financial.transactions.index')
            ->with('success', 'Transaction enregistrée.');
    }

    public function storeReminder(Request $request, FinancialTransaction $transaction)
    {
        $this->authorize('update', $transaction); // ou une policy dédiée si tu veux

        $data = $request->validate([
            'reminder_date' => ['nullable', 'date'],
            'channel'       => ['nullable', 'string', 'max:50'],
            'note'          => ['nullable', 'string', 'max:5000'],
        ]);

        FinancialTransactionReminder::create([
            'financial_transaction_id' => $transaction->id,
            'reminder_date'            => $data['reminder_date'] ?? now(),
            'channel'                  => $data['channel'] ?? null,
            'note'                     => $data['note'] ?? null,
            'created_by'               => Auth::id(),
        ]);

        return back()->with('success', 'Relance enregistrée pour cette transaction.');
    }

    public function edit(FinancialTransaction $transaction)
    {
        $this->authorize('update', $transaction);

        $expenseCategories = ExpenseCategory::query()
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $clients   = Client::orderBy('company_name')->get(['id', 'company_name']);
        $providers = Provider::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Financial/Transactions/Edit', [
            'transaction'       => $transaction,
            'expenseCategories' => $expenseCategories,
            'clients'           => $clients,
            'providers'         => $providers,
        ]);
    }

    public function update(FinancialTransactionRequest $request, FinancialTransaction $transaction)
    {
        $this->authorize('update', $transaction);

        $data = $request->validated();

        if (array_key_exists('amount', $data)) {
            $data['amount'] = number_format((float) $data['amount'], 2, '.', '');
        }
        $data['updated_by'] = $request->user()->id;

        if (($data['status'] ?? null) === 'paid' && empty($transaction->paid_at) && empty($data['paid_at'])) {
            $data['paid_at'] = now();
        }

        $transaction->update($data);

        return redirect()
            ->route('financial.transactions.index')
            ->with('success', 'Transaction mise à jour.');
    }

    public function destroy(FinancialTransaction $transaction)
    {
        $this->authorize('delete', $transaction);

        $transaction->delete();

        return back()->with('success', 'Transaction supprimée.');
    }
}
