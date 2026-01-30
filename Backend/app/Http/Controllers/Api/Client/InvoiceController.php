<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class InvoiceController extends Controller
{
    /**
     * Liste des factures du client
     */
    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min(100, $perPage));

        $invoices = Invoice::query()
            ->with(['lines'])
            ->where('user_id', Auth::id())
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return InvoiceResource::collection($invoices)
            ->additional(['success' => true]);
    }

    /**
     * Détail d’une facture
     */
    public function show(Request $request, $id)
    {
        $invoice = Invoice::query()
            ->with('lines')
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new InvoiceResource($invoice),
        ]);
    }
}
