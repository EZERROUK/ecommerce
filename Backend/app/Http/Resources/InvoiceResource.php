<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'          => $this->id,
            'number'      => $this->number,
            'reference'   => $this->number,
            'status'      => $this->status,
            'date'        => optional($this->date)?->toDateString(),
            'due_date'    => optional($this->due_date)?->toDateString(),
            'currency_id' => $this->currency_id,
            'total_ht'    => $this->total_ht,
            'total_tva'   => $this->total_tva,
            'total_ttc'   => $this->total_ttc,
            'created_at'  => optional($this->created_at)?->format('Y-m-d H:i'),

            'lines' => InvoiceItemResource::collection($this->whenLoaded('lines')),
            'items' => InvoiceItemResource::collection($this->whenLoaded('lines')),
        ];
    }
}
