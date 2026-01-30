<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SupportTicketResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'        => $this->id,
            'subject'   => $this->title ?? $this->subject,
            'status'    => $this->status,
            'priority'  => $this->priority,
            'created_at'=> $this->created_at->format('Y-m-d H:i'),

            'messages' => SupportTicketMessageResource::collection(
                $this->whenLoaded('comments')
            )
        ];
    }
}
