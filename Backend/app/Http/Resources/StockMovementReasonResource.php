<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class StockMovementReasonResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'type'        => $this->type,
            'type_label'  => $this->type_label,
            'description' => $this->description,
            'is_active'   => $this->is_active,
            'created_at'  => optional($this->created_at)?->format('Y-m-d H:i'),
            'updated_at'  => optional($this->updated_at)?->format('Y-m-d H:i'),
            'deleted_at'  => optional($this->deleted_at)?->format('Y-m-d H:i'),
        ];
    }
}
