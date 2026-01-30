<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\HolidayResource;
use App\Models\Holiday;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class HolidayController extends Controller
{
    public function index(Request $request)
    {
        $query = Holiday::query();

        ApiQuery::applySearch($query, $request->query('search'), ['name']);

        if ($request->filled('year')) {
            $query->whereYear('date', (int) $request->query('year'));
        }
        if ($request->filled('is_recurring')) {
            $query->where('is_recurring', filter_var($request->query('is_recurring'), FILTER_VALIDATE_BOOLEAN));
        }

        ApiQuery::applySort($query, $request->query('sort'), ['date', 'created_at', 'name', 'id'], 'date');

        $holidays = $query->paginate(ApiQuery::perPage($request));

        return HolidayResource::collection($holidays)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $holiday = Holiday::query()->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new HolidayResource($holiday),
        ]);
    }
}
