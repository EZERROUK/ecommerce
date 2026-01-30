<?php

namespace App\Http\Controllers\Leave;

use App\Http\Controllers\Controller;
use App\Models\Holiday;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HolidayAdminController extends Controller
{
    public function index(Request $request)
    {
        $year = $request->integer('year') ?: (int) now()->year;

        $items = Holiday::query()
            ->whereYear('date', $year)
            ->orderBy('date')
            ->paginate((int) $request->query('per_page', 50))
            ->withQueryString();

        return Inertia::render('Leaves/Admin/Holidays/Index', [
            'items' => $items,
            'year' => $year,
        ]);
    }

    public function create(Request $request)
    {
        $year = $request->integer('year') ?: (int) now()->year;

        return Inertia::render('Leaves/Admin/Holidays/Create', [
            'year' => $year,
            'defaultDate' => Carbon::create($year, 1, 1)->toDateString(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'is_recurring' => ['boolean'],
        ]);

        $data['is_recurring'] = (bool) ($data['is_recurring'] ?? false);

        Holiday::create($data);

        $year = Carbon::parse($data['date'])->year;
        return redirect()->route('leaves.admin.holidays.index', ['year' => $year])->with('success', 'Jour férié créé.');
    }

    public function edit(Holiday $holiday)
    {
        return Inertia::render('Leaves/Admin/Holidays/Edit', [
            'item' => $holiday,
        ]);
    }

    public function update(Request $request, Holiday $holiday)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'is_recurring' => ['boolean'],
        ]);

        $data['is_recurring'] = (bool) ($data['is_recurring'] ?? false);

        $holiday->update($data);

        $year = Carbon::parse($data['date'])->year;
        return redirect()->route('leaves.admin.holidays.index', ['year' => $year])->with('success', 'Jour férié mis à jour.');
    }

    public function destroy(Holiday $holiday)
    {
        $holiday->delete();
        return back()->with('success', 'Jour férié supprimé (soft-delete).');
    }
}
