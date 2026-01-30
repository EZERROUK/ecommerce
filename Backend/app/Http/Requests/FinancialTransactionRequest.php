<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FinancialTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (!$user) {
            return false;
        }

        if ($this->isMethod('post')) {
            return $user->can('financial_transaction_create');
        }

        if (in_array($this->method(), ['PUT', 'PATCH'], true)) {
            return $user->can('financial_transaction_edit');
        }

        // Pour d'autres usages éventuels
        return true;
    }

    public function rules(): array
    {
        return [
            'direction'           => ['required', 'in:in,out'],
            'context'             => ['nullable', 'string', 'max:100'],

            'invoice_id'          => ['nullable', 'exists:invoices,id'],
            'client_id'           => ['nullable', 'exists:clients,id'],
            'provider_id'         => ['nullable', 'exists:providers,id'],
            'expense_category_id' => ['nullable', 'exists:expense_categories,id'],

            'amount'              => ['required', 'numeric', 'min:0.01'],
            'currency'            => ['nullable', 'string', 'size:3'],

            'due_date'            => ['nullable', 'date'],
            'paid_at'             => ['nullable', 'date'],

            'status'              => ['required', 'in:planned,paid,overdue,canceled'],
            'payment_method'      => ['nullable', 'string', 'max:50'],
            'reference'           => ['nullable', 'string', 'max:191'],
            'label'               => ['nullable', 'string', 'max:191'],
            'notes'               => ['nullable', 'string'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Devine la direction si non fournie
        if (!$this->filled('direction')) {
            if ($this->filled('invoice_id') || $this->filled('client_id')) {
                $this->merge(['direction' => 'in']);
            } elseif ($this->filled('provider_id') || $this->filled('expense_category_id')) {
                $this->merge(['direction' => 'out']);
            }
        }

        // Devine la devise si non fournie (à adapter si tu as AppSetting::default_currency)
        if (!$this->filled('currency')) {
            $this->merge(['currency' => 'MAD']);
        }

        // Si marqué payé et pas de paid_at fourni → on met maintenant
        if ($this->input('status') === 'paid' && !$this->filled('paid_at')) {
            $this->merge(['paid_at' => now()]);
        }
    }
}
