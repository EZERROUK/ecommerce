<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProviderResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'contact_person' => $this->contact_person,
            'email'          => $this->email,
            'phone'          => $this->phone,
            'address'        => $this->address,
            'is_active'      => $this->is_active,
            'created_at'     => optional($this->created_at)?->format('Y-m-d H:i'),
            'updated_at'     => optional($this->updated_at)?->format('Y-m-d H:i'),
            'deleted_at'     => optional($this->deleted_at)?->format('Y-m-d H:i'),

            'stock_movements_count' => $this->whenCounted('stockMovements'),
        ];
    }
}
