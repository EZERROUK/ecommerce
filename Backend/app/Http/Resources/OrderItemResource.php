<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'                         => $this->id,
            'product_id'                 => $this->product_id,
            'product_name_snapshot'      => $this->product_name_snapshot,
            'product_sku_snapshot'       => $this->product_sku_snapshot,
            'product_description_snapshot'=> $this->product_description_snapshot,
            'quantity'                   => $this->quantity,
            'unit_price_ht_snapshot'     => $this->unit_price_ht_snapshot,
            'tax_rate_snapshot'          => $this->tax_rate_snapshot,
            'line_total_ht'              => $this->line_total_ht,
            'line_tax_amount'            => $this->line_tax_amount,
            'line_total_ttc'             => $this->line_total_ttc,
            'sort_order'                 => $this->sort_order,

            // Aliases simples (compat front)
            'description'                => $this->product_description_snapshot,
            'unit_price'                 => $this->unit_price_ht_snapshot,
        ];
    }
}
