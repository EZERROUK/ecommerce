<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PromotionCodeResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'             => $this->id,
            'promotion_id'   => $this->promotion_id,
            'code'           => $this->code,
            'max_redemptions'=> $this->max_redemptions,
            'max_per_user'   => $this->max_per_user,
            'uses'           => $this->uses,
            'starts_at'      => optional($this->starts_at)?->format('Y-m-d H:i'),
            'ends_at'        => optional($this->ends_at)?->format('Y-m-d H:i'),
            'is_active'      => $this->is_active,
            'created_at'     => optional($this->created_at)?->format('Y-m-d H:i'),
            'updated_at'     => optional($this->updated_at)?->format('Y-m-d H:i'),

            'promotion'      => $this->whenLoaded('promotion', fn () => ['id' => $this->promotion?->id, 'name' => $this->promotion?->name]),
        ];
    }
}
