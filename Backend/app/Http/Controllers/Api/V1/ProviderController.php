<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProviderResource;
use App\Models\Provider;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class ProviderController extends Controller
{
    public function index(Request $request)
    {
        $query = Provider::query();

        ApiQuery::applySearch($query, $request->query('search'), [
            'name',
            'email',
            'phone',
            'contact_person',
        ]);

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        ApiQuery::applySort($query, $request->query('sort'), ['created_at', 'name', 'is_active', 'id'], '-created_at');

        $query->withCount(['stockMovements']);

        $providers = $query->paginate(ApiQuery::perPage($request));

        return ProviderResource::collection($providers)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $provider = Provider::query()
            ->withCount(['stockMovements'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new ProviderResource($provider),
        ]);
    }
}
