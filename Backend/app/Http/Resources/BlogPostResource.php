<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin \App\Models\BlogPost */
class BlogPostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $publishedAt = $this->published_at;

        return [
            'id' => (string) $this->id,
            'title' => (string) $this->title,
            'slug' => (string) $this->slug,
            'category' => (string) $this->category,
            'author' => $this->author_name,
            'excerpt' => $this->excerpt,
            'summary' => $this->excerpt,
            'content' => $this->content,
            'topics' => $this->topics ?? [],
            'sources' => $this->sources ?? [],
            'image' => $this->banner_path ? Storage::url($this->banner_path) : null,
            'banner_url' => $this->banner_path ? Storage::url($this->banner_path) : null,
            'published_at' => $publishedAt?->toISOString(),
            'date' => $publishedAt ? $publishedAt->format('d/m/Y') : null,
        ];
    }
}
