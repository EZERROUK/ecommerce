<?php

namespace App\Http\Controllers\Leave;

use App\Http\Controllers\Controller;
use App\Models\LeaveType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveTypeAdminController extends Controller
{
    public function index(Request $request)
    {
        $items = LeaveType::query()
            ->orderBy('sort_order')
            ->orderBy('name_fr')
            ->paginate((int) $request->query('per_page', 20))
            ->withQueryString();

        return Inertia::render('Leaves/Admin/LeaveTypes/Index', [
            'items' => $items,
        ]);
    }

    public function create()
    {
        return Inertia::render('Leaves/Admin/LeaveTypes/Create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:leave_types,code'],
            'name_fr' => ['required', 'string', 'max:255'],
            'name_ar' => ['nullable', 'string', 'max:255'],
            'requires_balance' => ['boolean'],
            'requires_attachment' => ['boolean'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ]);

        $data['requires_balance'] = (bool) ($data['requires_balance'] ?? false);
        $data['requires_attachment'] = (bool) ($data['requires_attachment'] ?? false);
        $data['is_active'] = (bool) ($data['is_active'] ?? true);
        $data['sort_order'] = (int) ($data['sort_order'] ?? 0);

        LeaveType::create($data);

        return redirect()->route('leaves.admin.leave-types.index')->with('success', 'Type de congé créé.');
    }

    public function edit(LeaveType $leaveType)
    {
        return Inertia::render('Leaves/Admin/LeaveTypes/Edit', [
            'item' => $leaveType,
        ]);
    }

    public function update(Request $request, LeaveType $leaveType)
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:leave_types,code,' . $leaveType->id],
            'name_fr' => ['required', 'string', 'max:255'],
            'name_ar' => ['nullable', 'string', 'max:255'],
            'requires_balance' => ['boolean'],
            'requires_attachment' => ['boolean'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ]);

        $data['requires_balance'] = (bool) ($data['requires_balance'] ?? false);
        $data['requires_attachment'] = (bool) ($data['requires_attachment'] ?? false);
        $data['is_active'] = (bool) ($data['is_active'] ?? true);
        $data['sort_order'] = (int) ($data['sort_order'] ?? 0);

        $leaveType->update($data);

        return redirect()->route('leaves.admin.leave-types.index')->with('success', 'Type de congé mis à jour.');
    }

    public function destroy(LeaveType $leaveType)
    {
        $leaveType->delete();
        return back()->with('success', 'Type de congé désactivé (soft-delete).');
    }
}
