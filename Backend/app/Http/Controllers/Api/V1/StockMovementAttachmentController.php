<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\StockMovementAttachmentResource;
use App\Models\StockMovementAttachment;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class StockMovementAttachmentController extends Controller
{
    public function index(Request $request)
    {
        $query = StockMovementAttachment::query();

        if ($request->filled('stock_movement_id')) {
            $query->where('stock_movement_id', $request->query('stock_movement_id'));
        }

        ApiQuery::applySort($query, $request->query('sort'), ['created_at', 'size', 'id'], '-created_at');

        $attachments = $query->paginate(ApiQuery::perPage($request));

        return StockMovementAttachmentResource::collection($attachments)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $attachment = StockMovementAttachment::query()->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new StockMovementAttachmentResource($attachment),
        ]);
    }
}
