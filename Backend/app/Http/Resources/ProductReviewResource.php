<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductReviewResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'author_name' => $this->author_name,
            'rating' => (int) $this->rating,
            'comment' => $this->comment,
            'created_at' => optional($this->created_at)->toISOString(),
        ];
    }
}
