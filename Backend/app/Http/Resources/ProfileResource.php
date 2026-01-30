<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'      => $this->id,
            'name'    => $this->name,
            'email'   => $this->email,

            'client'  => [
                'id'    => $this->client->id ?? null,
                'name'  => $this->client->name ?? null,
                'rc'    => $this->client->rc ?? null,
                'patente' => $this->client->patente ?? null,
            ],
        ];
    }
}
