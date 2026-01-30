<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use App\Models\Invoice;
use App\Models\FinancialTransactionReminder;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FinancialTransaction extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'direction',
        'context',
        'invoice_id',
        'client_id',
        'provider_id',
        'expense_category_id',
        'amount',
        'currency',
        'due_date',
        'paid_at',
        'status',
        'payment_method',
        'reference',
        'label',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'due_date' => 'date',
        'paid_at'  => 'datetime',
    ];

    /* ----------------------------------------------------------------------
     |  Relations
     * --------------------------------------------------------------------- */

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function provider()
    {
        return $this->belongsTo(Provider::class);
    }

    public function expenseCategory()
    {
        return $this->belongsTo(ExpenseCategory::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

        public function reminders(): HasMany
    {
        return $this->hasMany(FinancialTransactionReminder::class, 'financial_transaction_id');
    }


    /* ----------------------------------------------------------------------
     |  Scopes pratiques
     * --------------------------------------------------------------------- */

    public function scopeIn(Builder $query): Builder
    {
        return $query->where('direction', 'in');
    }

    public function scopeOut(Builder $query): Builder
    {
        return $query->where('direction', 'out');
    }

    public function scopePaid(Builder $query): Builder
    {
        return $query->where('status', 'paid');
    }

    public function scopePlanned(Builder $query): Builder
    {
        return $query->where('status', 'planned');
    }

    public function scopeOverdue(Builder $query): Builder
    {
        return $query->where('status', 'overdue');
    }

    /* ----------------------------------------------------------------------
     |  Encaissement lié à une facture
     * --------------------------------------------------------------------- */

    /**
     * Vérifie s'il existe déjà un encaissement (direction=in) pour cette facture.
     */
    public static function hasCashInForInvoice(Invoice $invoice): bool
    {
        return static::where('invoice_id', $invoice->id)
            ->where('direction', 'in')
            ->exists();
    }

    /**
     * Crée (ou retourne) une transaction d'encaissement basée sur une facture.
     * Utilisable si tu veux un encaissement "global" sur le total TTC.
     */
    public static function createFromInvoice(Invoice $invoice): self
    {
        // Éviter de dupliquer la ligne d'encaissement si elle existe déjà
        $existing = static::where('invoice_id', $invoice->id)
            ->where('direction', 'in')
            ->where('context', 'invoice_payment')
            ->first();

        if ($existing) {
            // S'assurer que le client est bien positionné même si plus ancien
            if (!$existing->client_id && $invoice->client_id) {
                $existing->client_id = $invoice->client_id;
                $existing->save();
            }

            return $existing;
        }

        return static::create([
            'direction'  => 'in',
            'context'    => 'invoice_payment',

            'invoice_id' => $invoice->id,
            'client_id'  => $invoice->client_id,

            'amount'   => (float) ($invoice->total_ttc ?? $invoice->total_ht ?? 0),
            'currency' => config('app.currency_code', 'MAD'),

            'due_date' => $invoice->due_date,
            'paid_at'  => now(),
            'status'   => 'paid',

            'payment_method' => null,
            'reference'      => $invoice->number,
            'label'          => 'Encaissement facture '.$invoice->number,
            'notes'          => 'Généré automatiquement à partir de la facture.',

            'created_by'     => Auth::id(),
        ]);
    }

    /* ----------------------------------------------------------------------
     |  Décaissement (remboursement) lié à une facture
     * --------------------------------------------------------------------- */

    /**
     * Crée (ou retourne) une transaction de remboursement (direction=out) pour une facture.
     */
    public static function createRefundForInvoice(Invoice $invoice, float $amount, ?string $comment = null): self
    {
        // On cherche un remboursement existant pour cette facture
        $existing = static::where('invoice_id', $invoice->id)
            ->where('direction', 'out')
            ->where('context', 'invoice_refund')
            ->first();

        if ($existing) {
            $dirty = false;

            // Si le client n'était pas renseigné avant, on le corrige
            if (!$existing->client_id && $invoice->client_id) {
                $existing->client_id = $invoice->client_id;
                $dirty = true;
            }

            // Si jamais le montant était à 0 et qu'on a maintenant un vrai montant
            if ((float) $existing->amount === 0.0 && $amount > 0) {
                $existing->amount = $amount;
                $dirty = true;
            }

            if ($dirty) {
                $existing->save();
            }

            return $existing;
        }

        // Nouveau décaissement
        return static::create([
            'direction'  => 'out',
            'context'    => 'invoice_refund',

            'invoice_id' => $invoice->id,
            'client_id'  => $invoice->client_id, // ✅ le client est bien récupéré

            'amount'   => $amount,
            'currency' => config('app.currency_code', 'MAD'),

            'due_date' => now()->toDateString(),
            'paid_at'  => now(),
            'status'   => 'paid',

            'payment_method' => null,
            'reference'      => $invoice->number,
            'label'          => 'Remboursement facture '.$invoice->number,
            'notes'          => $comment ?: 'Remboursement de la facture',

            'created_by'     => Auth::id(),
        ]);
    }
}
