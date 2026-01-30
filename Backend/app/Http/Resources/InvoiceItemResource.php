<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceItemResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'            => $this->id,
            'product_id'    => $this->product_id,
            'designation'   => $this->designation,
            'quantity'      => $this->quantity,
            'unit_price_ht' => $this->unit_price_ht,
            'discount_rate' => $this->discount_rate,
            'tax_rate'      => $this->tax_rate,
            'line_total_ht' => $this->line_total_ht,

            // Aliases simples (compat front)
            'description'   => $this->designation,
            'unit_price'    => $this->unit_price_ht,
        ];
    }
}
