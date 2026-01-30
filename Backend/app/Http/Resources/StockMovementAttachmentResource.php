<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class StockMovementAttachmentResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'               => $this->id,
            'stock_movement_id'=> $this->stock_movement_id,
            'filename'         => $this->filename,
            'path'             => $this->path,
            'mime_type'        => $this->mime_type,
            'size'             => $this->size,
            'url'              => $this->url,
            'formatted_size'   => $this->formatted_size,
            'is_image'         => $this->is_image,
            'is_pdf'           => $this->is_pdf,
            'created_at'       => optional($this->created_at)?->format('Y-m-d H:i'),
            'deleted_at'       => optional($this->deleted_at)?->format('Y-m-d H:i'),
        ];
    }
}
