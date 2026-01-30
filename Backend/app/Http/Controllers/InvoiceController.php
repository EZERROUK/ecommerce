<?php

namespace App\Http\Controllers;

use App\Actions\ConvertQuoteToInvoiceAction;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Quote;
use App\Models\Product;
use App\Models\TaxRate;
use App\Models\Currency;
use App\Models\FinancialTransaction;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    /**
     * Listing + filtres + pagination
     */
    public function index(Request $request): Response
    {
        $perPage = (int) $request->input('per_page', 15);

        $filters = [
            'search'        => $request->string('search')->toString() ?: null,
            'invoice_number'=> $request->string('invoice_number')->toString() ?: null,
            'status'        => $request->string('status')->toString() ?: null,
            'client_id'     => $request->string('client_id')->toString() ?: null,
            'total_ttc'     => $request->string('total_ttc')->toString() ?: null,
            'total_ttc_min' => $request->string('total_ttc_min')->toString() ?: null,
            'total_ttc_max' => $request->string('total_ttc_max')->toString() ?: null,
        ];

        $query = Invoice::with('client')->withCount('lines');

        if ($filters['search']) {
            $s = $filters['search'];
            $query->where(function ($q) use ($s) {
                $q->where('number', 'like', "%{$s}%")
                  ->orWhereHas('client', fn($c) => $c->where('company_name', 'like', "%{$s}%"));
            });
        }

        if ($filters['invoice_number']) {
            $n = $filters['invoice_number'];
            $query->where('number', 'like', "%{$n}%");
        }

        if ($filters['status']) {
            $query->where('status', $filters['status']);
        }
        if ($filters['client_id']) {
            $query->where('client_id', $filters['client_id']);
        }

        if ($filters['total_ttc'] !== null && $filters['total_ttc'] !== '') {
            $query->where('total_ttc', '=', (float) $filters['total_ttc']);
        } else {
            $min = $filters['total_ttc_min'];
            $max = $filters['total_ttc_max'];

            if ($min !== null && $min !== '') {
                $query->where('total_ttc', '>=', (float) $min);
            }
            if ($max !== null && $max !== '') {
                $query->where('total_ttc', '<=', (float) $max);
            }
        }

        if ($perPage === -1) {
            $perPage = max((int) (clone $query)->count(), 1);
        }

        $invoices = $query
            ->orderByDesc('date')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (Invoice $inv) {
                return [
                    'id'             => $inv->id,
                    'invoice_number' => $inv->number,
                    'invoice_date'   => optional($inv->date)->toDateString(),
                    'status'         => $inv->status,
                    'subtotal_ht'    => (float) $inv->total_ht,
                    'total_tax'      => (float) $inv->total_tva,
                    'total_ttc'      => (float) $inv->total_ttc,
                    'currency'       => [
                        'code'   => config('app.currency_code', 'MAD'),
                        'symbol' => config('app.currency_symbol', 'MAD'),
                    ],
                    'client' => [
                        'id'           => $inv->client?->id,
                        'company_name' => $inv->client?->company_name,
                        'contact_name' => $inv->client?->contact_name ?? null,
                    ],
                    'user'        => null,
                    'items_count' => (int) ($inv->lines_count ?? 0),
                    'deleted_at'  => $inv->deleted_at,
                    'created_at'  => $inv->created_at?->toDateTimeString(),
                ];
            });

        return Inertia::render('Invoices/Index', [
            'invoices' => $invoices,
            'clients'  => Client::select('id', 'company_name')->orderBy('company_name')->get(),
            'filters'  => $filters,
            'statuses' => Invoice::statuses(),
        ]);
    }

    /**
     * Affichage détaillé d'une facture
     */
    public function show(string $id): Response
    {
        $invoice = Invoice::with([
            'client:id,company_name,contact_name',
            'lines.product:id,sku,name',
            'statusHistories.user:id,name',
            'financialTransactions',
        ])->findOrFail($id);

        $currencyCode   = config('app.currency_code',  'MAD');
        $currencySymbol = config('app.currency_symbol','MAD');

        $items = $invoice->lines->map(function ($ln) {
            return [
                'id'                     => $ln->id,
                'product_name_snapshot'  => $ln->designation ?? ($ln->product->name ?? ''),
                'product_sku_snapshot'   => $ln->product->sku ?? '',
                'quantity'               => (float) ($ln->quantity ?? 0),
                'unit_price_ht_snapshot' => $ln->unit_price_ht !== null ? (float) $ln->unit_price_ht : null,
                'tax_rate_snapshot'      => $ln->tax_rate      !== null ? (float) $ln->tax_rate      : null,
                'unit_price_ht'          => $ln->unit_price_ht !== null ? (float) $ln->unit_price_ht : null,
                'tax_rate'               => $ln->tax_rate      !== null ? (float) $ln->tax_rate      : null,
                'product'                => $ln->product ? ['name' => $ln->product->name, 'sku' => $ln->product->sku] : null,
            ];
        })->values();

        $histories = $invoice->statusHistories->sortBy('created_at')->values();

        $statusHistories = [];
        $prev = null;
        foreach ($histories as $h) {
            $statusHistories[] = [
                'from_status' => $h->from_status ?? $prev,
                'to_status'   => $h->to_status ?? $h->status,
                'comment'     => $h->comment ?? null,
                'created_at'  => $h->created_at?->toISOString(),
                'user'        => $h->relationLoaded('user') && $h->user ? ['name' => $h->user->name] : null,
            ];
            $prev = $h->to_status ?? $h->status;
        }

        $paidAmount = (float) $invoice->paid_amount;
        $remaining  = (float) $invoice->remaining_amount;

        $payload = [
            'id'               => $invoice->id,
            'invoice_number'   => $invoice->number ?? $invoice->invoice_number ?? '',
            'status'           => (string) $invoice->status,
            'invoice_date'     => optional($invoice->date)->toDateString(),
            'due_date'         => optional($invoice->due_date)->toDateString(),
            'currency_code'    => $currencyCode,
            'currency_symbol'  => $currencySymbol,
            'client'           => [
                'id'            => $invoice->client?->id,
                'company_name'  => $invoice->client?->company_name ?? '',
                'contact_name'  => $invoice->client?->contact_name ?? null,
            ],
            'items'            => $items,
            'terms_conditions' => $invoice->terms_conditions ?? null,
            'notes'            => $invoice->notes ?? null,
            'internal_notes'   => $invoice->internal_notes ?? null,
            'status_histories' => $statusHistories,
            'is_overdue'       => $invoice->isOverdue(),

            'total_ttc'        => (float) ($invoice->total_ttc ?? 0),
            'paid_amount'      => $paidAmount,
            'remaining_amount' => $remaining,
        ];

        return Inertia::render('Invoices/Show', [
            'invoice'  => $payload,
            'statuses' => Invoice::statuses(),
        ]);
    }

    /**
     * Export PDF d'une facture
     */
    public function exportPdf(string $id)
    {
        $invoice = Invoice::with(['client','lines.product','currency'])->findOrFail($id);
        $pdf = Pdf::loadView('pdf.invoice', compact('invoice'));

        return $pdf->stream("Facture_{$invoice->number}.pdf");
    }

    /**
     * Édition d'une facture (seulement en brouillon)
     */
    public function edit(string $id): Response|RedirectResponse
    {
        $invoice = Invoice::with(['client', 'lines.product'])->findOrFail($id);

        if (!$invoice->canBeEdited()) {
            return redirect()
                ->route('invoices.show', $invoice)
                ->with('error', 'Seules les factures en brouillon peuvent être modifiées.');
        }

        return Inertia::render('Invoices/Edit', [
            'invoice'    => $invoice,
            'clients'    => Client::active()->orderBy('company_name')->get(),
            'products'   => Product::with(['brand','category','currency','taxRate'])
                                   ->where('is_active', true)
                                   ->orderBy('name')
                                   ->get(),
            'currencies' => Currency::all(),
            'taxRates'   => TaxRate::all(),
            'statuses'   => Invoice::statuses(),
        ]);
    }

    /**
     * Mise à jour d'une facture
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        $invoice = Invoice::findOrFail($id);

        if (!$invoice->canBeEdited()) {
            return back()->with('error', 'Seules les factures en brouillon peuvent être modifiées.');
        }

        $data = $request->validate([
            'client_id'             => 'required|exists:clients,id',
            'date'                  => 'required|date',
            'due_date'              => 'required|date|after_or_equal:date',
            'notes'                 => 'nullable|string',
            'terms_conditions'      => 'nullable|string',
            'items'                 => 'required|array|min:1',
            'items.*.product_id'    => 'required|exists:products,id',
            'items.*.quantity'      => 'required|numeric|min:0.01',
            'items.*.unit_price_ht' => 'required|numeric|min:0',
            'items.*.tax_rate'      => 'required|numeric|min:0|max:100',
        ]);

        $invoice->update([
            'client_id'        => $data['client_id'],
            'date'             => $data['date'],
            'due_date'         => $data['due_date'],
            'notes'            => $data['notes'] ?? null,
            'terms_conditions' => $data['terms_conditions'] ?? null,
        ]);

        $invoice->lines()->delete();

        foreach ($data['items'] as $item) {
            $product = Product::findOrFail($item['product_id']);

            $invoice->lines()->create([
                'product_id'        => $product->id,
                'designation'       => $product->name,
                'quantity'          => $item['quantity'],
                'unit_price_ht'     => $item['unit_price_ht'],
                'tax_rate'          => $item['tax_rate'],
                'line_total_ht'     => $item['quantity'] * $item['unit_price_ht'],
            ]);
        }

        $invoice->load('lines');
        $invoice->calculateTotals();

        return redirect()
            ->route('invoices.show', $invoice)
            ->with('success', 'Facture mise à jour avec succès.');
    }

    /**
     * Changement de statut (avec historique)
     */
    public function changeStatus(Request $request, string $id): RedirectResponse
    {
        $invoice = Invoice::findOrFail($id);

        $data = $request->validate([
            'status'  => ['required','string', Rule::in(Invoice::statuses())],
            'comment' => ['nullable','string'],
        ]);

        $allowedTransitions = [
            Invoice::STATUS_DRAFT          => [Invoice::STATUS_SENT, Invoice::STATUS_ISSUED, Invoice::STATUS_CANCELLED],
            Invoice::STATUS_SENT           => [Invoice::STATUS_ISSUED, Invoice::STATUS_PAID, Invoice::STATUS_PARTIALLY_PAID, Invoice::STATUS_CANCELLED],
            Invoice::STATUS_ISSUED         => [Invoice::STATUS_PAID, Invoice::STATUS_PARTIALLY_PAID, Invoice::STATUS_CANCELLED],
            Invoice::STATUS_PARTIALLY_PAID => [Invoice::STATUS_PAID, Invoice::STATUS_CANCELLED],
            Invoice::STATUS_PAID           => [Invoice::STATUS_REFUNDED],
            Invoice::STATUS_CANCELLED      => [],
            Invoice::STATUS_REFUNDED       => [],
        ];

        $currentStatus = (string) $invoice->status;
        $newStatus     = (string) $data['status'];

        if (!isset($allowedTransitions[$currentStatus]) || !in_array($newStatus, $allowedTransitions[$currentStatus], true)) {
            return back()->with('error', 'Transition de statut non autorisée.');
        }

        $from = $currentStatus;
        $invoice->update(['status' => $newStatus]);

        $invoice->statusHistories()->create([
            'user_id'     => Auth::id(),
            'from_status' => $from,
            'to_status'   => $newStatus,
            'comment'     => $data['comment'] ?? null,
        ]);

        // Remboursement → création du décaissement associé
        if ($newStatus === Invoice::STATUS_REFUNDED) {
            $amountToRefund = (float) $invoice->paid_amount; // ce qui était encaissé

            if ($amountToRefund > 0.01) {
                FinancialTransaction::createRefundForInvoice(
                    $invoice,
                    $amountToRefund,
                    $data['comment'] ?? null
                );
            }
        }

        return back()->with('success', 'Statut de la facture mis à jour.');
    }

    /**
     * Duplication d'une facture
     */
    public function duplicate(string $id): RedirectResponse
    {
        $original = Invoice::with('lines')->findOrFail($id);

        $duplicate = $original->replicate();
        $duplicate->number   = Invoice::generateInvoiceNumber();
        $duplicate->status   = Invoice::STATUS_DRAFT;
        $duplicate->date     = now()->toDateString();
        $duplicate->due_date = now()->addDays(30)->toDateString();
        $duplicate->save();

        foreach ($original->lines as $line) {
            $newLine = $line->replicate();
            $newLine->invoice_id = $duplicate->id;
            $newLine->save();
        }

        return redirect()
            ->route('invoices.show', $duplicate)
            ->with('success', 'Facture dupliquée avec succès.');
    }

    /**
     * Marquer comme payée (ET créer l'encaissement pour le reste)
     */
    public function markAsPaid(Request $request, string $id): RedirectResponse
    {
        $invoice = Invoice::findOrFail($id);

        $data = $request->validate([
            'comment' => ['nullable', 'string'],
        ]);

        $eligible = in_array($invoice->status, [
            Invoice::STATUS_SENT,
            Invoice::STATUS_ISSUED,
            Invoice::STATUS_PARTIALLY_PAID,
        ], true) || $invoice->isOverdue();

        if (!$eligible) {
            return back()->with('error', 'Cette facture ne peut pas être marquée comme payée.');
        }

        $alreadyPaid = (float) $invoice->paid_amount;
        $totalTtc    = (float) ($invoice->total_ttc ?? 0);
        $remaining   = max(0, $totalTtc - $alreadyPaid);

        // 👉 Enregistrement automatique du reste à encaisser
        if ($remaining > 0.01) {
            $paidAt = now()->toDateString();

            FinancialTransaction::create([
                'direction'           => 'in',
                'context'             => 'invoice_payment',
                'invoice_id'          => $invoice->id,
                'client_id'           => $invoice->client_id,
                'provider_id'         => null,
                'expense_category_id' => null,
                'amount'              => $remaining,
                'currency'            => config('app.currency_code', 'MAD'),
                'due_date'            => $paidAt,
                'paid_at'             => $paidAt,
                'status'              => 'paid',
                'payment_method'      => null,
                'reference'           => $invoice->number,
                'label'               => 'Encaissement complet facture '.$invoice->number,
                'notes'               => null,
                'created_by'          => $request->user()->id,
            ]);
        }

        $from = (string) $invoice->status;
        $invoice->update(['status' => Invoice::STATUS_PAID]);

        $invoice->statusHistories()->create([
            'user_id'     => Auth::id(),
            'from_status' => $from,
            'to_status'   => Invoice::STATUS_PAID,
            'comment'     => $data['comment'] ?? 'Facture marquée comme payée',
        ]);

        return back()->with('success', 'Facture marquée comme payée.');
    }

    /**
     * Enregistrer un encaissement (partiel ou total via la fenêtre "Encaisser")
     */
    public function recordPayment(Request $request, string $id): RedirectResponse
    {
        $invoice = Invoice::findOrFail($id);

        $eligible = in_array($invoice->status, [
            Invoice::STATUS_SENT,
            Invoice::STATUS_ISSUED,
            Invoice::STATUS_PARTIALLY_PAID,
        ], true) || $invoice->isOverdue();

        if (!$eligible) {
            return back()->with('error', 'Cette facture ne peut pas recevoir de nouvel encaissement.');
        }

        $alreadyPaid = (float) $invoice->paid_amount;
        $totalTtc    = (float) ($invoice->total_ttc ?? 0);
        $remaining   = max(0, $totalTtc - $alreadyPaid);

        if ($remaining <= 0) {
            return back()->with('error', 'Cette facture est déjà totalement encaissée.');
        }

        $data = $request->validate([
            'amount'         => ['required', 'numeric', 'min:0.01', 'max:'.$remaining],
            'paid_at'        => ['nullable', 'date'],
            'payment_method' => ['nullable', 'string'],
            'reference'      => ['nullable', 'string'],
            'label'          => ['nullable', 'string'],
        ]);

        $paidAt  = $data['paid_at'] ?? now()->toDateString();
        $amount  = (float) $data['amount'];

        FinancialTransaction::create([
            'direction'           => 'in',
            'context'             => 'invoice_payment',
            'invoice_id'          => $invoice->id,
            'client_id'           => $invoice->client_id,
            'provider_id'         => null,
            'expense_category_id' => null,
            'amount'              => $amount,
            'currency'            => config('app.currency_code', 'MAD'),
            'due_date'            => $paidAt,
            'paid_at'             => $paidAt,
            'status'              => 'paid',
            'payment_method'      => $data['payment_method'] ?? null,
            'reference'           => $data['reference'] ?? null,
            'label'               => $data['label'] ?? ('Encaissement facture '.$invoice->number),
            'notes'               => null,
            'created_by'          => $request->user()->id,
        ]);

        $newPaid      = $alreadyPaid + $amount;
        $newRemaining = max(0, $totalTtc - $newPaid);

        $fromStatus = (string) $invoice->status;
        $toStatus   = $newRemaining <= 0.01
            ? Invoice::STATUS_PAID
            : Invoice::STATUS_PARTIALLY_PAID;

        if ($toStatus !== $fromStatus) {
            $invoice->update(['status' => $toStatus]);

            $invoice->statusHistories()->create([
                'user_id'     => Auth::id(),
                'from_status' => $fromStatus,
                'to_status'   => $toStatus,
                'comment'     => sprintf(
                    'Encaissement de %s (reste: %s)',
                    number_format($amount, 2, ',', ' '),
                    number_format($newRemaining, 2, ',', ' ')
                ),
            ]);
        }

        return back()->with('success', 'Encaissement enregistré.');
    }

    /**
     * Envoyer la facture
     */
    public function send(Request $request, string $id): RedirectResponse
    {
        $invoice = Invoice::findOrFail($id);

        $data = $request->validate([
            'comment' => ['nullable', 'string'],
        ]);

        if (!in_array($invoice->status, [Invoice::STATUS_DRAFT, Invoice::STATUS_CANCELLED], true)) {
            return back()->with('error', 'Cette facture ne peut pas être envoyée.');
        }

        $from = (string) $invoice->status;
        $invoice->update(['status' => Invoice::STATUS_SENT]);

        $invoice->statusHistories()->create([
            'user_id'     => Auth::id(),
            'from_status' => $from,
            'to_status'   => Invoice::STATUS_SENT,
            'comment'     => $data['comment'] ?? 'Facture envoyée au client',
        ]);

        return back()->with('success', 'Facture envoyée avec succès.');
    }

    /**
     * Envoyer un rappel de paiement
     */
    public function sendReminder(string $id): RedirectResponse
    {
        $invoice = Invoice::findOrFail($id);

        if (!$invoice->isOverdue()) {
            return back()->with('error', 'Seules les factures en retard (échéance dépassée) peuvent recevoir un rappel.');
        }

        // TODO: logiques d'envoi du rappel

        return back()->with('success', 'Rappel de paiement envoyé avec succès.');
    }

    /**
     * Réouvrir une facture remboursée
     */
    public function reopen(Request $request, string $id): RedirectResponse
    {
        $invoice = Invoice::findOrFail($id);

        if (!$invoice->canBeReopened()) {
            return back()->with('error', 'Seules les factures remboursées peuvent être réouvertes.');
        }

        $data = $request->validate([
            'comment' => ['nullable', 'string'],
        ]);

        $from = (string) $invoice->status;
        $invoice->update(['status' => Invoice::STATUS_DRAFT]);

        $invoice->statusHistories()->create([
            'user_id'     => Auth::id(),
            'from_status' => $from,
            'to_status'   => Invoice::STATUS_DRAFT,
            'comment'     => $data['comment'] ?? 'Facture réouverte et remise en brouillon',
        ]);

        return back()->with('success', 'Facture réouverte avec succès.');
    }

    /**
     * Conversion d'un devis en facture
     */
    public function convertFromQuote(Quote $quote, ConvertQuoteToInvoiceAction $action): RedirectResponse
    {
        $quote->load('items');

        $invoice = $action->handle($quote);

        return redirect()
            ->route('invoices.show', $invoice->id)
            ->with('success', 'Facture créée à partir du devis.');
    }

    /**
     * Suppression soft-delete
     */
    public function destroy(string $id): RedirectResponse
    {
        $invoice = Invoice::findOrFail($id);

        if (!$invoice->canBeDeleted()) {
            return back()->with('error', 'Seules les factures en brouillon ou annulées peuvent être supprimées.');
        }

        $invoice->delete();

        return redirect()
            ->route('invoices.index')
            ->with('success', 'Facture supprimée.');
    }
}
