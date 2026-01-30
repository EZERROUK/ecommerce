<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'slug'        => $this->slug ?? null,
            'description' => $this->description ?? null,
            'parent_id'   => $this->parent_id ?? null,
            'is_active'   => isset($this->is_active) ? (bool) $this->is_active : null,
        ];
    }
}
