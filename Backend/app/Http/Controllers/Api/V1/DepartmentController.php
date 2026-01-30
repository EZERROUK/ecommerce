<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\DepartmentResource;
use App\Models\Department;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Department::query();

        ApiQuery::applySearch($query, $request->query('search'), ['name', 'description']);
        ApiQuery::applyIncludes($query, $request, ['head'], []);
        ApiQuery::applySort($query, $request->query('sort'), ['created_at', 'name', 'id'], 'name');

        $query->withCount(['employees']);

        $departments = $query->paginate(ApiQuery::perPage($request));

        return DepartmentResource::collection($departments)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $query = Department::query()->withCount(['employees']);
        ApiQuery::applyIncludes($query, $request, ['head', 'employees'], ['head']);

        $department = $query->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new DepartmentResource($department),
        ]);
    }
}
