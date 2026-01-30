<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BlogPostResource;
use App\Models\BlogPost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class BlogPostController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->integer('per_page', 20);
        $page = max(1, (int) $request->input('page', 1));
        $cacheKey = "api.blog-posts.index.v1.per_page={$perPage}.page={$page}";

        $payload = Cache::remember($cacheKey, now()->addMinutes(1), function () use ($perPage, $page) {
            $posts = BlogPost::query()
                ->published()
                ->orderByDesc('published_at')
                ->paginate($perPage, ['*'], 'page', $page);

            return BlogPostResource::collection($posts)
                ->additional(['success' => true])
                ->response()
                ->getData(true);
        });

        return response()
            ->json($payload)
            ->setSharedMaxAge(60)
            ->setMaxAge(60);
    }

    public function show(string $slug)
    {
        $payload = Cache::remember("api.blog-posts.show.v1.slug={$slug}", now()->addMinutes(5), function () use ($slug) {
            $post = BlogPost::query()
                ->published()
                ->where('slug', $slug)
                ->firstOrFail();

            return (new BlogPostResource($post))
                ->additional(['success' => true])
                ->response()
                ->getData(true);
        });

        return response()
            ->json($payload)
            ->setSharedMaxAge(300)
            ->setMaxAge(300);
    }
}
