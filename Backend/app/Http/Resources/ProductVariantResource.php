<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'                => $this->id,
            'parent_product_id' => $this->parent_product_id,
            'sku'               => $this->sku,
            'price'             => $this->price,
            'stock_quantity'    => $this->stock_quantity,
            'variant_attributes'=> $this->variant_attributes,
            'is_active'         => $this->is_active,
            'display_name'      => $this->display_name,
            'effective_price'   => $this->effective_price,
            'created_at'        => optional($this->created_at)?->format('Y-m-d H:i'),
            'updated_at'        => optional($this->updated_at)?->format('Y-m-d H:i'),
            'deleted_at'        => optional($this->deleted_at)?->format('Y-m-d H:i'),

            'parent_product' => $this->whenLoaded('parentProduct', function () {
                return [
                    'id'   => $this->parentProduct?->id,
                    'sku'  => $this->parentProduct?->sku,
                    'name' => $this->parentProduct?->name,
                ];
            }),

            'images' => $this->whenLoaded('images'),
        ];
    }
}
