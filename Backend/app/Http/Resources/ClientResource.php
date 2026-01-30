<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'            => $this->id,
            'company_name'  => $this->company_name,
            'contact_name'  => $this->contact_name,
            'full_name'     => $this->full_name,
            'email'         => $this->email,
            'phone'         => $this->phone,
            'address'       => $this->address,
            'city'          => $this->city,
            'postal_code'   => $this->postal_code,
            'country'       => $this->country,
            'ice'           => $this->ice,
            'rc'            => $this->rc,
            'patente'       => $this->patente,
            'cnss'          => $this->cnss,
            'if_number'     => $this->if_number,
            'tax_regime'    => $this->tax_regime,
            'is_tva_subject'=> $this->is_tva_subject,
            'is_active'     => $this->is_active,
            'notes'         => $this->notes,
            'created_by'    => $this->created_by,
            'updated_by'    => $this->updated_by,
            'created_at'    => optional($this->created_at)?->format('Y-m-d H:i'),
            'updated_at'    => optional($this->updated_at)?->format('Y-m-d H:i'),
            'deleted_at'    => optional($this->deleted_at)?->format('Y-m-d H:i'),

            'quotes_count'  => $this->whenCounted('quotes'),
            'orders_count'  => $this->whenCounted('orders'),
        ];
    }
}
