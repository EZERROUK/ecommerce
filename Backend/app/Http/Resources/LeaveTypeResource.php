<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class LeaveTypeResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'                  => $this->id,
            'code'                => $this->code,
            'name_fr'             => $this->name_fr,
            'name_ar'             => $this->name_ar,
            'requires_balance'    => (bool) $this->requires_balance,
            'requires_attachment' => (bool) $this->requires_attachment,
            'is_active'           => (bool) $this->is_active,
            'sort_order'          => $this->sort_order,
            'created_at'          => optional($this->created_at)?->format('Y-m-d H:i'),
            'updated_at'          => optional($this->updated_at)?->format('Y-m-d H:i'),
            'deleted_at'          => optional($this->deleted_at)?->format('Y-m-d H:i'),
        ];
    }
}
