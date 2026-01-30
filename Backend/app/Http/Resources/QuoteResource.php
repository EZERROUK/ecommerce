<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class QuoteResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'             => $this->id,
            'quote_number'   => $this->quote_number,
            'reference'      => $this->quote_number,
            'status'         => $this->status,
            'quote_date'     => optional($this->quote_date)?->toDateString(),
            'valid_until'    => optional($this->valid_until)?->toDateString(),
            'currency_code'  => $this->currency_code,
            'subtotal_ht'    => $this->subtotal_ht,
            'total_tax'      => $this->total_tax,
            'discount_total' => $this->discount_total,
            'total_ttc'      => $this->total_ttc,
            'created_at'     => optional($this->created_at)?->format('Y-m-d H:i'),
            'updated_at'     => optional($this->updated_at)?->format('Y-m-d H:i'),

            'items' => QuoteItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
