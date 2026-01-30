<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray($request)
    {
        $isPriceOnRequest = (bool) ($this->is_price_on_request ?? false);

        return [
            'id'          => $this->id,
            'sku'         => $this->sku,
            'name'        => $this->name,
            'slug'        => $this->slug,
            'condition'   => $this->condition,
            'is_price_on_request' => $isPriceOnRequest,
            'price'       => $isPriceOnRequest ? null : $this->price,
            'price_ht'    => $isPriceOnRequest ? null : $this->price_ht,
            'stock'       => $this->stock,
            'description' => $this->description,

            'category' => new CategoryResource($this->whenLoaded('category')),

            'documents' => ProductDocumentResource::collection(
                $this->whenLoaded('documents')
            ),

            'images' => ProductImageResource::collection(
                $this->whenLoaded('images')
            ),

            'attributes' => $this->whenLoaded('attributeValues', function () {
                return $this->attributeValues
                    ->loadMissing('attribute')
                    ->map(function ($value) {
                        return [
                            'name'  => $value->attribute?->name,
                            'value' => $value->value,
                        ];
                    })
                    ->values();
            }),
        ];
    }
}
