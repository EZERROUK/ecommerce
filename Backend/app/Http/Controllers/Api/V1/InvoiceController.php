<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Invoice::query();

        ApiQuery::applySearch($query, $request->query('search'), [
            'number',
            'status',
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('client_id')) {
            $query->where('client_id', $request->query('client_id'));
        }

        ApiQuery::applyIncludes($query, $request, ['lines', 'client', 'currency', 'statusHistories'], []);
        ApiQuery::applySort($query, $request->query('sort'), ['created_at', 'date', 'number', 'total_ttc', 'status', 'id'], '-created_at');

        $invoices = $query->paginate(ApiQuery::perPage($request));

        return InvoiceResource::collection($invoices)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $query = Invoice::query();
        ApiQuery::applyIncludes($query, $request, ['lines', 'client', 'currency', 'statusHistories'], ['lines']);

        $invoice = $query->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new InvoiceResource($invoice),
        ]);
    }
}
