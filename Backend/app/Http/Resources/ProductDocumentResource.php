<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProductDocumentResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'       => $this->id,
            'title'    => $this->title,
            'type'     => $this->type,
            'url'      => asset('storage/' . $this->file_path),
        ];
    }
}
