<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class BrandResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'slug'       => $this->slug,
            'created_at' => optional($this->created_at)?->format('Y-m-d H:i'),
            'updated_at' => optional($this->updated_at)?->format('Y-m-d H:i'),
            'deleted_at' => optional($this->deleted_at)?->format('Y-m-d H:i'),
        ];
    }
}
