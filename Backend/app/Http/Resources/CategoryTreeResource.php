<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CategoryTreeResource extends JsonResource
{
    public function toArray($request)
    {
        $children = [];
        if ($this->relationLoaded('childrenRecursive')) {
            $children = $this->childrenRecursive;
        } elseif ($this->relationLoaded('children')) {
            $children = $this->children;
        }

        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'slug'        => $this->slug,
            'description' => $this->description,

            // Sous-catégories (récursion)
            'children' => CategoryTreeResource::collection($children),
        ];
    }
}
