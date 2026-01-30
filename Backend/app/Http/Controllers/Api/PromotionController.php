<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Promotion;
use App\Http\Resources\ProductResource;
use Carbon\Carbon;

class PromotionController extends Controller
{
    public function index()
    {
        $now = Carbon::now();

        $promotions = Promotion::query()
            ->with(['products' => function ($q) {
                $q->visible();
            }])
            ->where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
            })
            ->get();

        return response()->json([
            'success'    => true,
            'promotions' => $promotions->map(fn (Promotion $promotion) => [
                'id' => $promotion->id,
                'name' => $promotion->name,
                'description' => $promotion->description,
                'type' => $promotion->type,
                'priority' => $promotion->priority,
                'is_exclusive' => (bool) $promotion->is_exclusive,
                'starts_at' => $promotion->starts_at,
                'ends_at' => $promotion->ends_at,
                'products' => ProductResource::collection($promotion->products),
            ]),
        ]);
    }
}
