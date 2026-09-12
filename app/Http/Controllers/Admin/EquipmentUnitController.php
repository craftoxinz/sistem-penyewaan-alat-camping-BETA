<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\EquipmentUnitRequest;
use App\Models\Equipment;
use App\Models\EquipmentUnit;
use App\Models\UnitLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EquipmentUnitController extends Controller
{
    /**
     * Display a listing of physical equipment units and unit logs (SRS-F-009, SRS-F-011).
     */
    public function index(Request $request): Response
    {
        $equipmentList = Equipment::select('id', 'name', 'slug')
            ->with(['units' => function ($q) {
                $q->select('id', 'equipment_id', 'unit_code');
            }])
            ->orderBy('name')
            ->get()
            ->map(function ($eq) {
                $suggestion = $eq->getUnitCodeSuggestion(1);

                return [
                    'id' => $eq->id,
                    'name' => $eq->name,
                    'last_unit_code' => $suggestion['last_code'],
                    'suggested_prefix' => $suggestion['prefix'],
                    'next_number' => $suggestion['next_number'],
                    'pad_length' => $suggestion['pad_length'],
                ];
            });

        $query = EquipmentUnit::query()->with(['equipment', 'unitLogs.user']);

        if ($request->filled('equipment_id')) {
            $query->where('equipment_id', $request->input('equipment_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('condition')) {
            $query->where('condition', $request->input('condition'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('unit_code', 'like', "%{$search}%");
        }

        $perPage = (int) $request->input('per_page', 5);
        if (! in_array($perPage, [5, 10, 15, 20, 50, 100])) {
            $perPage = 5;
        }

        $units = $query->latest()->paginate($perPage)->withQueryString();

        // Recent unit activity logs
        $recentLogs = UnitLog::with(['equipmentUnit.equipment', 'user', 'rental'])
            ->latest()
            ->take(20)
            ->get();

        return Inertia::render('admin/units/index', [
            'units' => $units,
            'equipmentList' => $equipmentList,
            'recentLogs' => $recentLogs,
            'filters' => [
                'equipment_id' => $request->input('equipment_id', ''),
                'status' => $request->input('status', ''),
                'condition' => $request->input('condition', ''),
                'search' => $request->input('search', ''),
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Store newly created physical unit(s) in storage (SRS-F-009).
     */
    public function store(EquipmentUnitRequest $request): RedirectResponse
    {
        $equipmentId = (int) $request->input('equipment_id');
        $equipment = Equipment::findOrFail($equipmentId);
        $condition = $request->input('condition');
        $status = $request->input('status');
        $notes = $request->input('notes');
        $quantity = max(1, (int) $request->input('quantity', 1));

        // Determine codes to create
        $unitCodes = [];

        if ($request->filled('unit_codes') && is_array($request->input('unit_codes'))) {
            $unitCodes = array_map('trim', $request->input('unit_codes'));
        } elseif ($quantity > 1 || ! $request->filled('unit_code')) {
            $suggestion = $equipment->getUnitCodeSuggestion($quantity);
            $prefix = $request->filled('prefix') ? trim((string) $request->input('prefix')) : $suggestion['prefix'];
            $startNum = $request->filled('start_number') ? (int) $request->input('start_number') : $suggestion['next_number'];
            $padLen = $suggestion['pad_length'];

            for ($i = 0; $i < $quantity; $i++) {
                $numStr = str_pad((string) ($startNum + $i), $padLen, '0', STR_PAD_LEFT);
                $unitCodes[] = "{$prefix}{$numStr}";
            }
        } else {
            $unitCodes = [trim((string) $request->input('unit_code'))];
        }

        // Validate uniqueness of all unit codes
        $existingCodes = EquipmentUnit::whereIn('unit_code', $unitCodes)->pluck('unit_code')->toArray();
        if (! empty($existingCodes)) {
            $existingStr = implode(', ', $existingCodes);
            throw ValidationException::withMessages([
                'unit_code' => "Kode unit berikut sudah terdaftar dalam sistem: {$existingStr}",
            ]);
        }

        // Create units & audit logs in a single transaction
        $createdUnits = DB::transaction(function () use ($equipmentId, $unitCodes, $condition, $status, $notes, $request) {
            $units = [];
            foreach ($unitCodes as $code) {
                $unit = EquipmentUnit::create([
                    'equipment_id' => $equipmentId,
                    'unit_code' => $code,
                    'condition' => $condition,
                    'status' => $status,
                    'notes' => $notes,
                ]);

                UnitLog::create([
                    'equipment_unit_id' => $unit->id,
                    'user_id' => $request->user()->id,
                    'type' => 'condition_update',
                    'condition_before' => $unit->condition,
                    'condition_after' => $unit->condition,
                    'notes' => 'Pendaftaran unit baru: '.$unit->unit_code.($unit->notes ? ' - '.$unit->notes : ''),
                ]);

                $units[] = $unit;
            }

            return $units;
        });

        $count = count($createdUnits);
        if ($count === 1) {
            return back()->with('success', "Unit fisik '{$createdUnits[0]->unit_code}' berhasil ditambahkan.");
        }

        $firstCode = $createdUnits[0]->unit_code;
        $lastCode = $createdUnits[$count - 1]->unit_code;

        return back()->with('success', "Sebanyak {$count} unit fisik ('{$firstCode}' s/d '{$lastCode}') berhasil ditambahkan.");
    }

    /**
     * Update the specified physical unit in storage.
     *
     * Business rules for status transitions:
     * - 'disewa' → any: BLOCKED. Only released via the rental return flow.
     * - any → 'disewa': BLOCKED. Only assigned via the handover flow.
     * - 'afkir' → 'tersedia'/'disewa'/'maintenance': BLOCKED. Decommissioned units stay decommissioned.
     * - 'tersedia'/'maintenance' → 'maintenance'/'tersedia'/'afkir': Allowed.
     */
    public function update(EquipmentUnitRequest $request, EquipmentUnit $unit): RedirectResponse
    {
        $oldCondition = $unit->condition;
        $oldStatus = $unit->status;
        $newStatus = $request->input('status');

        // Rule 1: Unit sedang disewa tidak boleh diubah sama sekali.
        if ($oldStatus === 'disewa') {
            return back()->withErrors([
                'status' => "Unit '{$unit->unit_code}' sedang disewa oleh pelanggan. Perubahan status hanya dapat dilakukan melalui menu Pengembalian Pesanan.",
            ]);
        }

        // Rule 2: Status tidak boleh diubah menjadi 'disewa' secara manual.
        if ($newStatus === 'disewa') {
            return back()->withErrors([
                'status' => "Status 'Sedang Disewa' tidak dapat diatur secara manual. Gunakan alur Serah Terima Pesanan.",
            ]);
        }

        // Rule 3: Unit yang sudah diafkir tidak boleh dikembalikan ke status aktif.
        if ($oldStatus === 'afkir' && in_array($newStatus, ['tersedia', 'maintenance'])) {
            return back()->withErrors([
                'status' => "Unit '{$unit->unit_code}' sudah diafkir dan tidak dapat diaktifkan kembali. Daftarkan unit pengganti jika diperlukan.",
            ]);
        }

        $unit->update($request->validated());

        if ($oldCondition !== $unit->condition || $oldStatus !== $unit->status) {
            UnitLog::create([
                'equipment_unit_id' => $unit->id,
                'user_id' => $request->user()->id,
                'type' => 'condition_update',
                'condition_before' => $oldCondition,
                'condition_after' => $unit->condition,
                'notes' => "Perubahan status unit: {$oldStatus} → {$unit->status}. ".($request->input('notes') ?? ''),
            ]);
        }

        return back()->with('success', "Unit fisik '{$unit->unit_code}' berhasil diperbarui.");
    }

    /**
     * Remove the specified physical unit from storage.
     *
     * Cannot delete a unit that is currently rented out ('disewa').
     */
    public function destroy(EquipmentUnit $unit): RedirectResponse
    {
        if ($unit->status === 'disewa') {
            return back()->withErrors([
                'delete' => "Unit '{$unit->unit_code}' sedang disewa oleh pelanggan dan tidak dapat dihapus. Selesaikan proses pengembalian terlebih dahulu.",
            ]);
        }

        $code = $unit->unit_code;
        $unit->delete();

        return back()->with('success', "Unit fisik '{$code}' berhasil dihapus.");
    }

    /**
     * Look up physical equipment unit by QR code / unit_code for scanner operations (SRS-F-009, SRS-F-010).
     */
    public function scanLookup(Request $request): JsonResponse
    {
        $request->validate([
            'unit_code' => ['required', 'string'],
        ]);

        $code = trim($request->input('unit_code'));

        $unit = EquipmentUnit::with(['equipment.category', 'activeRentalItemUnit.rentalItem.rental.user'])
            ->where('unit_code', $code)
            ->first();

        if (! $unit) {
            return response()->json([
                'success' => false,
                'message' => "Unit fisik dengan kode '{$code}' tidak ditemukan dalam database inventaris.",
            ], 404);
        }

        $activeRental = null;
        if ($unit->activeRentalItemUnit && $unit->activeRentalItemUnit->rentalItem?->rental) {
            $rental = $unit->activeRentalItemUnit->rentalItem->rental;
            $activeRental = [
                'id' => $rental->id,
                'booking_code' => $rental->booking_code,
                'invoice_number' => $rental->invoice_number,
                'customer_name' => $rental->user?->name,
                'customer_phone' => $rental->user?->phone,
                'rental_status' => $rental->rental_status,
                'rental_item_unit_id' => $unit->activeRentalItemUnit->id,
            ];
        }

        return response()->json([
            'success' => true,
            'unit' => [
                'id' => $unit->id,
                'equipment_id' => $unit->equipment_id,
                'unit_code' => $unit->unit_code,
                'condition' => $unit->condition,
                'status' => $unit->status,
                'notes' => $unit->notes,
                'equipment' => [
                    'id' => $unit->equipment->id,
                    'name' => $unit->equipment->name,
                    'category' => $unit->equipment->category?->name,
                ],
                'active_rental' => $activeRental,
            ],
        ]);
    }
}
