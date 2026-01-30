<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $query = Client::query();

        ApiQuery::applySearch($query, $request->query('search'), [
            'company_name',
            'contact_name',
            'email',
            'phone',
            'city',
            'ice',
        ]);

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        ApiQuery::applySort($query, $request->query('sort'), ['created_at', 'company_name', 'is_active', 'id'], '-created_at');

        $query->withCount(['quotes', 'orders']);

        $clients = $query->paginate(ApiQuery::perPage($request));

        return ClientResource::collection($clients)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $client = Client::query()
            ->withCount(['quotes', 'orders'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new ClientResource($client),
        ]);
    }
}
