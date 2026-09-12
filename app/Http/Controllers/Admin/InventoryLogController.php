<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\EquipmentUnit;
use App\Models\UnitLog;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class InventoryLogController extends Controller
{
    /**
     * Display the full inventory movement log (SRS-F-010, SRS-F-011).
     * Tracks items out (handover), items in (return), and maintenance mutations.
     */
    public function index(Request $request): Response
    {
        $type = $request->input('type');
        $search = $request->input('search');
        $equipmentId = $request->input('equipment_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $query = UnitLog::query()
            ->with([
                'equipmentUnit.equipment.category',
                'rental.user',
                'user',
            ]);

        if ($type && $type !== 'all') {
            $query->where('type', $type);
        }

        if ($equipmentId && $equipmentId !== 'all') {
            $query->whereHas('equipmentUnit', function ($q) use ($equipmentId) {
                $q->where('equipment_id', $equipmentId);
            });
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('notes', 'like', "%{$search}%")
                    ->orWhereHas('equipmentUnit', function ($uq) use ($search) {
                        $uq->where('unit_code', 'like', "%{$search}%")
                            ->orWhereHas('equipment', function ($eq) use ($search) {
                                $eq->where('name', 'like', "%{$search}%");
                            });
                    })
                    ->orWhereHas('rental', function ($rq) use ($search) {
                        $rq->where('booking_code', 'like', "%{$search}%")
                            ->orWhere('invoice_number', 'like', "%{$search}%")
                            ->orWhereHas('user', function ($uq) use ($search) {
                                $uq->where('name', 'like', "%{$search}%");
                            });
                    });
            });
        }

        if ($startDate) {
            $query->where('created_at', '>=', Carbon::parse($startDate)->startOfDay());
        }

        if ($endDate) {
            $query->where('created_at', '<=', Carbon::parse($endDate)->endOfDay());
        }

        $perPage = (int) $request->input('per_page', 5);
        if (! in_array($perPage, [5, 10, 15, 20, 50, 100])) {
            $perPage = 5;
        }

        $logs = $query->latest('id')->paginate($perPage)->withQueryString();

        // Summary counts
        $stats = [
            'total_out' => UnitLog::where('type', 'handover')->count(),
            'total_in' => UnitLog::where('type', 'return')->count(),
            'total_maintenance' => UnitLog::whereIn('type', ['condition_update', 'maintenance'])->count(),
            'total_logs' => UnitLog::count(),
            'today_out' => UnitLog::where('type', 'handover')->whereDate('created_at', Carbon::today())->count(),
            'today_in' => UnitLog::where('type', 'return')->whereDate('created_at', Carbon::today())->count(),
        ];

        $equipmentList = Equipment::select('id', 'name')->orderBy('name')->get();
        $unitsList = EquipmentUnit::with('equipment:id,name')->orderBy('unit_code')->get();

        return Inertia::render('admin/inventory-logs/index', [
            'logs' => $logs,
            'stats' => $stats,
            'equipmentList' => $equipmentList,
            'unitsList' => $unitsList,
            'filters' => [
                'type' => $type ?? 'all',
                'search' => $search ?? '',
                'equipment_id' => $equipmentId ?? 'all',
                'start_date' => $startDate ?? '',
                'end_date' => $endDate ?? '',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Store a manual inventory mutation log (e.g. maintenance, repair, condition check).
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'equipment_unit_id' => ['required', 'exists:equipment_units,id'],
            'type' => ['required', 'in:maintenance,condition_update,return'],
            'new_condition' => ['required', 'in:baik,butuh_perbaikan,rusak'],
            'new_status' => ['required', 'in:tersedia,disewa,maintenance,afkir'],
            'notes' => ['required', 'string', 'max:500'],
        ]);

        $unit = EquipmentUnit::findOrFail($validated['equipment_unit_id']);
        $conditionBefore = $unit->condition;

        // Update unit condition & status
        $unit->update([
            'condition' => $validated['new_condition'],
            'status' => $validated['new_status'],
            'notes' => $validated['notes'],
        ]);

        // Create log record
        UnitLog::create([
            'equipment_unit_id' => $unit->id,
            'rental_id' => null,
            'user_id' => Auth::id(),
            'type' => $validated['type'],
            'condition_before' => $conditionBefore,
            'condition_after' => $validated['new_condition'],
            'notes' => $validated['notes'],
        ]);

        return back()->with('success', "Mutasi keluar/masuk unit {$unit->unit_code} berhasil dicatat.");
    }
}
