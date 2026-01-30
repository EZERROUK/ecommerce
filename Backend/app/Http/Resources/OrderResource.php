<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'         => $this->id,
            'order_number'=> $this->order_number,
            'reference'  => $this->order_number,
            'status'     => $this->status,
            'order_date' => optional($this->order_date)?->toDateString(),
            'currency_code' => $this->currency_code,
            'subtotal_ht'=> $this->subtotal_ht,
            'total_tax'  => $this->total_tax,
            'total_ttc'  => $this->total_ttc,
            'created_at' => optional($this->created_at)?->format('Y-m-d H:i'),

            'items' => OrderItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
