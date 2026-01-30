<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Http\Resources\CategoryTreeResource;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    /**
     * Renvoie l'arborescence complète des catégories (niveau illimité)
     */
    public function tree()
    {
        $payload = Cache::remember('api.categories.tree.v1', now()->addMinutes(5), function () {
            $categories = Category::query()
                ->active()
                ->public()
                ->with('childrenRecursive')
                ->whereNull('parent_id')   // racines
                ->orderBy('name')
                ->get();

            return [
                'success' => true,
                'data' => CategoryTreeResource::collection($categories)->resolve(),
            ];
        });

        return response()
            ->json($payload)
            ->setSharedMaxAge(300)
            ->setMaxAge(300);
    }

    /**
     * Renvoie une seule catégorie + son arbre enfant
     */
    public function show($id)
    {
        $payload = Cache::remember("api.categories.show.v1.id={$id}", now()->addMinutes(5), function () use ($id) {
            $category = Category::query()
                ->active()
                ->public()
                ->with('childrenRecursive')
                ->findOrFail($id);

            return [
                'success' => true,
                'data' => (new CategoryTreeResource($category))->resolve(),
            ];
        });

        return response()
            ->json($payload)
            ->setSharedMaxAge(300)
            ->setMaxAge(300);
    }
}
