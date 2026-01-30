<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CurrencyResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'code'       => $this->code,
            'name'       => $this->name,
            'symbol'     => $this->symbol,
            'created_at' => optional($this->created_at)?->format('Y-m-d H:i'),
            'updated_at' => optional($this->updated_at)?->format('Y-m-d H:i'),
            'deleted_at' => optional($this->deleted_at)?->format('Y-m-d H:i'),
        ];
    }
}
