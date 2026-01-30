<?php

namespace App\Http\Controllers;

use App\Models\ProductReview;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductReviewController extends Controller
{
    public function index(Request $request): Response
    {
        $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', Rule::in(ProductReview::statuses())],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = ProductReview::query()
            ->with(['product:id,name,slug']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $query
            ->orderByRaw(
                "case status when ? then 0 when ? then 1 when ? then 2 else 3 end",
                [
                    ProductReview::STATUS_PENDING,
                    ProductReview::STATUS_APPROVED,
                    ProductReview::STATUS_REJECTED,
                ]
            )
            ->orderByDesc('created_at');

        if ($request->filled('search')) {
            $search = (string) $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('author_name', 'like', "%{$search}%")
                    ->orWhere('author_email', 'like', "%{$search}%")
                    ->orWhere('comment', 'like', "%{$search}%")
                    ->orWhereHas('product', function ($p) use ($search) {
                        $p->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $reviews = $query
            ->paginate($request->integer('per_page', 15))
            ->appends($request->all());

        return Inertia::render('ProductReviews/Index', [
            'reviews' => $reviews,
            'filters' => $request->only(['search', 'status', 'per_page']),
            'statuses' => ProductReview::statuses(),
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
                'info' => session('info'),
            ],
        ]);
    }

    public function approve(Request $request, ProductReview $review): RedirectResponse
    {
        $validated = $request->validate([
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        if ($review->status === ProductReview::STATUS_APPROVED) {
            return back()->with('info', 'Avis déjà approuvé.');
        }

        $review->update([
            'status' => ProductReview::STATUS_APPROVED,
            'moderated_by' => Auth::id(),
            'moderated_at' => now(),
            'moderation_note' => $validated['note'] ?? null,
        ]);

        return back()->with('success', 'Avis approuvé.');
    }

    public function reject(Request $request, ProductReview $review): RedirectResponse
    {
        $validated = $request->validate([
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        if ($review->status === ProductReview::STATUS_REJECTED) {
            return back()->with('info', 'Avis déjà refusé.');
        }

        $review->update([
            'status' => ProductReview::STATUS_REJECTED,
            'moderated_by' => Auth::id(),
            'moderated_at' => now(),
            'moderation_note' => $validated['note'] ?? null,
        ]);

        return back()->with('success', 'Avis refusé.');
    }

    public function destroy(ProductReview $review): RedirectResponse
    {
        $review->delete();

        return back()->with('success', 'Avis supprimé.');
    }
}
