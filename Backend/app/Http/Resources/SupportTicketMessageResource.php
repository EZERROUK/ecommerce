<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SupportTicketMessageResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'         => $this->id,
            'sender'     => $this->sender_type,
            'message'    => $this->body ?? $this->message,
            'created_at' => $this->created_at->format('Y-m-d H:i'),
        ];
    }
}
