<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ProductImageResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'         => $this->id,
            'product_id' => $this->product_id,
            'path'       => $this->path,
            'url'        => $this->path ? Storage::url($this->path) : null,
            'is_primary' => (bool) $this->is_primary,
            'created_at' => optional($this->created_at)?->format('Y-m-d H:i'),
            'deleted_at' => optional($this->deleted_at)?->format('Y-m-d H:i'),
        ];
    }
}
