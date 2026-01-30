<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PromotionResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'                     => $this->id,
            'name'                   => $this->name,
            'description'            => $this->description,
            'type'                   => $this->type,
            'priority'               => $this->priority,
            'is_exclusive'           => $this->is_exclusive,
            'is_active'              => $this->is_active,
            'starts_at'              => optional($this->starts_at)?->format('Y-m-d H:i'),
            'ends_at'                => optional($this->ends_at)?->format('Y-m-d H:i'),
            'days_of_week'           => $this->days_of_week,
            'min_subtotal'           => $this->min_subtotal,
            'min_quantity'           => $this->min_quantity,
            'apply_scope'            => $this->apply_scope,
            'stop_further_processing'=> $this->stop_further_processing,
            'created_by'             => $this->created_by,
            'updated_by'             => $this->updated_by,
            'created_at'             => optional($this->created_at)?->format('Y-m-d H:i'),
            'updated_at'             => optional($this->updated_at)?->format('Y-m-d H:i'),
            'deleted_at'             => optional($this->deleted_at)?->format('Y-m-d H:i'),

            'actions'   => $this->whenLoaded('actions'),
            'codes'     => PromotionCodeResource::collection($this->whenLoaded('codes')),
            'products'  => $this->whenLoaded('products', fn () => $this->products->map(fn ($p) => ['id' => $p->id, 'sku' => $p->sku, 'name' => $p->name])),
            'categories'=> $this->whenLoaded('categories', fn () => $this->categories->map(fn ($c) => ['id' => $c->id, 'name' => $c->name, 'slug' => $c->slug])),
        ];
    }
}
