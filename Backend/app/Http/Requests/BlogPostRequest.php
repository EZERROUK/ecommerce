<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BlogPostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $blogPost = $this->route('blogPost');

        return [
            'title'       => ['required', 'string', 'max:255'],
            'slug'        => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/i',
                Rule::unique('blog_posts', 'slug')->ignore($blogPost?->id),
            ],
            'category'    => ['required', 'string', 'max:100'],
            'author_name' => ['nullable', 'string', 'max:255'],

            'excerpt'     => ['nullable', 'string'],
            'content'     => ['nullable', 'string'],

            'topics'      => ['nullable', 'array'],
            'topics.*'    => ['string', 'max:60'],

            'sources'           => ['nullable', 'array'],
            'sources.*.label'   => ['nullable', 'string', 'max:255'],
            'sources.*.url'     => ['nullable', 'url', 'max:2048'],

            'status'      => ['required', Rule::in(['draft', 'published'])],
            'published_at'=> ['nullable', 'date'],

            'banner'      => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'remove_banner' => ['nullable', 'boolean'],
        ];
    }
}
