<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\BlogPostRequest;
use App\Models\BlogPost;
use App\Support\BlogContentSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BlogPostController extends Controller
{
    public function index(Request $request): Response
    {
        $query = BlogPost::query()->latest('created_at');

        if ($request->filled('search')) {
            $s = trim((string) $request->string('search'));
            $query->where(function ($q) use ($s) {
                $q->where('title', 'like', "%{$s}%")
                    ->orWhere('slug', 'like', "%{$s}%")
                    ->orWhere('author_name', 'like', "%{$s}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', (string) $request->string('status'));
        }

        $posts = $query
            ->paginate($request->integer('per_page', 15))
            ->appends($request->all())
            ->through(fn (BlogPost $p) => [
                'id' => $p->id,
                'title' => $p->title,
                'slug' => $p->slug,
                'status' => $p->status,
                'category' => $p->category,
                'author_name' => $p->author_name,
                'published_at' => $p->published_at?->toDateTimeString(),
                'banner_url' => $p->banner_path ? Storage::url($p->banner_path) : null,
                'created_at' => $p->created_at?->toDateTimeString(),
                'updated_at' => $p->updated_at?->toDateTimeString(),
            ]);

        return Inertia::render('BlogPosts/Index', [
            'posts' => $posts,
            'filters' => $request->only(['search', 'status']),
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('BlogPosts/Create');
    }

    public function store(BlogPostRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $topics = is_array($data['topics'] ?? null) ? array_values(array_filter(array_map('trim', $data['topics']))) : [];
        $sources = is_array($data['sources'] ?? null) ? array_values($data['sources']) : [];
        $content = BlogContentSanitizer::sanitize($data['content'] ?? null);

        $post = BlogPost::create([
            'user_id' => $request->user()?->id,
            'author_name' => $data['author_name'] ?? ($request->user()?->name ?? null),
            'title' => $data['title'],
            'slug' => $data['slug'],
            'category' => $data['category'],
            'excerpt' => $data['excerpt'] ?? null,
            'content' => $content,
            'topics' => $topics ?: null,
            'sources' => $sources ?: null,
            'status' => $data['status'],
            'published_at' => $data['status'] === 'published'
                ? ($data['published_at'] ?? now())
                : null,
        ]);

        if ($request->hasFile('banner')) {
            $path = $request->file('banner')->storeAs(
                "blog/posts/{$post->id}",
                'banner.' . $request->file('banner')->getClientOriginalExtension(),
                'public'
            );
            $post->update(['banner_path' => $path]);
        }

        return redirect()
            ->route('blog-posts.edit', $post)
            ->with('success', 'Article créé.');
    }

    public function show(BlogPost $blogPost): Response
    {
        return Inertia::render('BlogPosts/Show', [
            'post' => $this->serialize($blogPost),
        ]);
    }

    public function edit(BlogPost $blogPost): Response
    {
        return Inertia::render('BlogPosts/Edit', [
            'post' => $this->serialize($blogPost),
        ]);
    }

    public function update(BlogPostRequest $request, BlogPost $blogPost): RedirectResponse
    {
        $data = $request->validated();

        $topics = is_array($data['topics'] ?? null) ? array_values(array_filter(array_map('trim', $data['topics']))) : [];
        $sources = is_array($data['sources'] ?? null) ? array_values($data['sources']) : [];
        $content = BlogContentSanitizer::sanitize($data['content'] ?? null);

        $blogPost->fill([
            'author_name' => $data['author_name'] ?? $blogPost->author_name,
            'title' => $data['title'],
            'slug' => $data['slug'],
            'category' => $data['category'],
            'excerpt' => $data['excerpt'] ?? null,
            'content' => $content,
            'topics' => $topics ?: null,
            'sources' => $sources ?: null,
            'status' => $data['status'],
            'published_at' => $data['status'] === 'published'
                ? ($data['published_at'] ?? ($blogPost->published_at ?? now()))
                : null,
        ]);

        if (($data['remove_banner'] ?? false) && $blogPost->banner_path) {
            Storage::disk('public')->delete($blogPost->banner_path);
            $blogPost->banner_path = null;
        }

        if ($request->hasFile('banner')) {
            if ($blogPost->banner_path) {
                Storage::disk('public')->delete($blogPost->banner_path);
            }
            $path = $request->file('banner')->storeAs(
                "blog/posts/{$blogPost->id}",
                'banner.' . $request->file('banner')->getClientOriginalExtension(),
                'public'
            );
            $blogPost->banner_path = $path;
        }

        $blogPost->save();

        return back()->with('success', 'Article mis à jour.');
    }

    public function destroy(BlogPost $blogPost): RedirectResponse
    {
        $blogPost->delete();

        return redirect()
            ->route('blog-posts.index')
            ->with('success', 'Article supprimé.');
    }

    private function serialize(BlogPost $p): array
    {
        return [
            'id' => $p->id,
            'author_name' => $p->author_name,
            'title' => $p->title,
            'slug' => $p->slug,
            'category' => $p->category,
            'excerpt' => $p->excerpt,
            'content' => $p->content,
            'topics' => $p->topics ?? [],
            'sources' => $p->sources ?? [],
            'status' => $p->status,
            'published_at' => $p->published_at?->format('Y-m-d\TH:i'),
            'banner_url' => $p->banner_path ? Storage::url($p->banner_path) : null,
            'created_at' => $p->created_at?->toDateTimeString(),
            'updated_at' => $p->updated_at?->toDateTimeString(),
        ];
    }
}
