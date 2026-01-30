<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PriceHistoryResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'            => $this->id,
            'product_id'    => $this->product_id,
            'price'         => $this->price,
            'currency_code' => $this->currency_code,
            'starts_at'     => optional($this->starts_at)?->format('Y-m-d H:i'),
            'ends_at'       => optional($this->ends_at)?->format('Y-m-d H:i'),
            'created_at'    => optional($this->created_at)?->format('Y-m-d H:i'),

            'product' => $this->whenLoaded('product', fn () => ['id' => $this->product?->id, 'sku' => $this->product?->sku, 'name' => $this->product?->name]),
            'currency'=> $this->whenLoaded('currency', fn () => ['code' => $this->currency?->code, 'symbol' => $this->currency?->symbol, 'name' => $this->currency?->name]),
        ];
    }
}
