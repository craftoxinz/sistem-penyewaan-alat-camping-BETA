<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EquipmentUnit;
use App\Models\Rental;
use App\Models\RentalItem;
use App\Models\RentalItemUnit;
use App\Models\UnitLog;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RentalOrderController extends Controller
{
    /**
     * Display the centralized order management table (SRS-F-008).
     */
    public function index(Request $request): Response
    {
        // ── Month filter for "Selesai Bulan Ini" stats card ─────────────────────
        $statsMonth = $request->input('stats_month'); // format: YYYY-MM  (optional)
        $statsYear = $statsMonth ? (int) substr($statsMonth, 0, 4) : now()->year;
        $statsMonthNum = $statsMonth ? (int) substr($statsMonth, 5, 2) : now()->month;

        // ── Aggregate stats (single query) ──────────────────────────────────────
        $rawStats = Rental::query()->selectRaw("
            COUNT(*) AS total,
            SUM(CASE WHEN rental_status = 'pending_dp'   THEN 1 ELSE 0 END) AS pending_dp,
            SUM(CASE WHEN rental_status = 'ready_pickup' THEN 1 ELSE 0 END) AS ready_pickup,
            SUM(CASE WHEN rental_status = 'active'       THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN rental_status = 'completed'    THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN rental_status = 'cancelled'    THEN 1 ELSE 0 END) AS cancelled,
            SUM(CASE WHEN rental_status = 'defaulted'    THEN 1 ELSE 0 END) AS defaulted
        ")->first();

        // Overdue: active rentals where end_date has passed (DB-agnostic via Eloquent)
        $overdue = Rental::where('rental_status', 'active')
            ->whereDate('end_date', '<', now()->toDateString())
            ->count();

        // Expired Schedule: unconfirmed/ready rentals where start_date has passed without handover
        $expiredSchedule = Rental::whereIn('rental_status', ['pending_dp', 'ready_pickup'])
            ->whereDate('start_date', '<', now()->toDateString())
            ->count();

        // Completed within the selected month (based on returned_at)
        $completedThisMonth = Rental::where('rental_status', 'completed')
            ->whereYear('returned_at', $statsYear)
            ->whereMonth('returned_at', $statsMonthNum)
            ->count();

        $stats = [
            'total' => (int) ($rawStats->total ?? 0),
            'pending_dp' => (int) ($rawStats->pending_dp ?? 0),
            'ready_pickup' => (int) ($rawStats->ready_pickup ?? 0),
            'active' => (int) ($rawStats->active ?? 0),
            'completed' => (int) ($rawStats->completed ?? 0),
            'completed_this_month' => $completedThisMonth,
            'cancelled' => (int) ($rawStats->cancelled ?? 0),
            'defaulted' => (int) ($rawStats->defaulted ?? 0),
            'overdue' => $overdue,
            'expired_schedule' => $expiredSchedule,
            'stats_month' => sprintf('%04d-%02d', $statsYear, $statsMonthNum),
        ];

        // ── Rentals paginated list ───────────────────────────────────────────────
        $query = Rental::query()->with([
            'user',
            'items.equipment.availableUnits',
            'items.itemUnits.equipmentUnit',
            'reviews',
        ]);

        if ($request->input('status') === 'expired_schedule') {
            $query->whereIn('rental_status', ['pending_dp', 'ready_pickup'])
                ->whereDate('start_date', '<', now()->toDateString());
        } elseif ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('rental_status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('booking_code', 'like', "%{$search}%")
                    ->orWhere('invoice_number', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = (int) $request->input('per_page', 5);
        if (! in_array($perPage, [5, 10, 20, 50, 100])) {
            $perPage = 5;
        }

        $rentals = $query->latest()->paginate($perPage)->withQueryString();

        return Inertia::render('admin/rentals/index', [
            'rentals' => $rentals,
            'stats' => $stats,
            'filters' => [
                'status' => $request->input('status', 'all'),
                'search' => $request->input('search', ''),
                'per_page' => $perPage,
                'stats_month' => sprintf('%04d-%02d', $statsYear, $statsMonthNum),
            ],
        ]);
    }

    /**
     * Verify down payment bank transfer receipt (SRS-F-016).
     */
    public function verifyDp(Request $request, Rental $rental): RedirectResponse
    {
        $request->validate([
            'action' => ['required', 'in:approve,reject'],
            'admin_notes' => ['nullable', 'string', 'max:500'],
        ]);

        $action = $request->input('action');
        $notes = $request->input('admin_notes');

        if ($action === 'approve') {
            $rental->update([
                'payment_status' => 'dp_verified',
                'rental_status' => 'ready_pickup',
                'deposit_status' => 'held',
                'dp_verified_at' => now(),
                'admin_notes' => $notes ?: 'Bukti transfer DP diverifikasi dan valid.',
            ]);

            return back()->with('success', "Pembayaran DP untuk {$rental->invoice_number} berhasil diverifikasi. Pesanan siap diserahterimakan.");
        } else {
            $rental->update([
                'payment_status' => 'dp_rejected',
                'rental_status' => 'cancelled',
                'admin_notes' => $notes ?: 'Bukti transfer DP tidak valid atau ditolak.',
            ]);

            return back()->with('success', "Pembayaran DP untuk {$rental->invoice_number} telah ditolak dan pesanan dibatalkan.");
        }
    }

    /**
     * Process equipment handover: assign specific units via dropdown and settle COD (SRS-F-010, SRS-F-017).
     */
    public function handover(Request $request, Rental $rental): RedirectResponse
    {
        $request->validate([
            'assignments' => ['required', 'array'],
            'assignments.*.rental_item_id' => ['required', 'exists:rental_items,id'],
            'assignments.*.unit_ids' => ['required', 'array'],
            'assignments.*.unit_ids.*' => ['required', 'exists:equipment_units,id'],
            'assignments.*.notes_out' => ['nullable', 'string'],
            'admin_notes' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($request, $rental) {
            $admin = $request->user();
            $now = now();

            foreach ($request->input('assignments') as $assignment) {
                $rentalItemId = $assignment['rental_item_id'];
                $notesOut = $assignment['notes_out'] ?? 'Kondisi serah terima baik & lengkap.';

                foreach ($assignment['unit_ids'] as $unitId) {
                    $unit = EquipmentUnit::findOrFail($unitId);

                    // Check if unit is available
                    if ($unit->status !== 'tersedia') {
                        throw new \Exception("Unit {$unit->unit_code} saat ini berstatus {$unit->status} dan tidak dapat diserahterimakan.");
                    }

                    // Create assignment record
                    RentalItemUnit::create([
                        'rental_item_id' => $rentalItemId,
                        'equipment_unit_id' => $unit->id,
                        'condition_out' => $unit->condition,
                        'notes_out' => $notesOut,
                        'handover_at' => $now,
                    ]);

                    // Update unit status
                    $unit->update(['status' => 'disewa']);

                    // Create Unit Log (SRS-F-011)
                    UnitLog::create([
                        'equipment_unit_id' => $unit->id,
                        'rental_id' => $rental->id,
                        'user_id' => $admin->id,
                        'type' => 'handover',
                        'condition_before' => $unit->condition,
                        'condition_after' => $unit->condition,
                        'notes' => "Serah terima unit kepada {$rental->user->name}. {$notesOut}",
                        'created_at' => $now,
                    ]);
                }
            }

            // Settle COD and activate rental (SRS-F-017)
            $rental->update([
                'payment_status' => 'paid_in_full',
                'rental_status' => 'active',
                'cod_paid_at' => $now,
                'handover_at' => $now,
                'admin_notes' => $request->input('admin_notes') ?: 'Pelunasan COD tunai telah diterima dan unit diserahterimakan.',
            ]);
        });

        return back()->with('success', "Serah terima unit untuk {$rental->invoice_number} berhasil dicatat dan status pesanan aktif!");
    }

    /**
     * Process equipment return: record condition, update unit status, calculate fines, and refund deposit (SRS-F-007, SRS-F-010, SRS-F-011).
     */
    public function returnOrder(Request $request, Rental $rental): RedirectResponse
    {
        $request->validate([
            'returns' => ['required', 'array'],
            'returns.*.rental_item_unit_id' => ['required', 'exists:rental_item_units,id'],
            'returns.*.condition_in' => ['required', 'in:baik,butuh_perbaikan,rusak,hilang'],
            'returns.*.notes_in' => ['nullable', 'string'],
            'returns.*.damage_fee' => ['nullable', 'numeric', 'min:0'],
            'late_days' => ['nullable', 'integer', 'min:0'],
            'late_fee' => ['nullable', 'numeric', 'min:0'],
            'damage_fee' => ['nullable', 'numeric', 'min:0'],
            'total_fine' => ['nullable', 'numeric', 'min:0'],
            'additional_charge_paid' => ['nullable', 'numeric', 'min:0'],
            'fine_payment_status' => ['nullable', 'string', 'in:none,settled_from_deposit,paid_extra_cash,unpaid_defaulted'],
            'deposit_status' => ['required', 'in:refunded,forfeited'],
            'deposit_refund_amount' => ['required', 'numeric', 'min:0'],
            'admin_notes' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($request, $rental) {
            $admin = $request->user();
            $now = now();
            $sumUnitDamageFee = 0;

            foreach ($request->input('returns') as $ret) {
                $itemUnit = RentalItemUnit::with('equipmentUnit')->findOrFail($ret['rental_item_unit_id']);
                $unit = $itemUnit->equipmentUnit;
                $conditionIn = $ret['condition_in'];
                $notesIn = $ret['notes_in'] ?? 'Pengembalian unit selesai.';
                $unitDamageFee = isset($ret['damage_fee']) ? (float) $ret['damage_fee'] : 0;
                $sumUnitDamageFee += $unitDamageFee;

                $itemUnit->update([
                    'condition_in' => $conditionIn,
                    'notes_in' => $notesIn,
                    'damage_fee' => $unitDamageFee,
                    'returned_at' => $now,
                ]);

                // Determine new status for physical unit
                $newUnitStatus = match ($conditionIn) {
                    'hilang' => 'afkir',
                    'rusak' => 'maintenance',
                    'butuh_perbaikan' => 'maintenance',
                    default => 'tersedia',
                };

                $unit->update([
                    'condition' => $conditionIn === 'hilang' ? 'rusak' : $conditionIn,
                    'status' => $newUnitStatus,
                ]);

                // Create Unit Log (SRS-F-011)
                $fineNote = $unitDamageFee > 0 ? ' (Denda: Rp '.number_format($unitDamageFee, 0, ',', '.').')' : '';
                UnitLog::create([
                    'equipment_unit_id' => $unit->id,
                    'rental_id' => $rental->id,
                    'user_id' => $admin->id,
                    'type' => $conditionIn === 'hilang' ? 'condition_update' : 'return',
                    'condition_before' => $itemUnit->condition_out,
                    'condition_after' => $conditionIn,
                    'notes' => "Pengembalian unit dari {$rental->user->name}. Kondisi: {$conditionIn}. {$notesIn}{$fineNote}",
                    'created_at' => $now,
                ]);
            }

            $lateDays = (int) $request->input('late_days', 0);
            $lateFee = (float) $request->input('late_fee', 0);
            $damageFee = $request->has('damage_fee') ? (float) $request->input('damage_fee') : $sumUnitDamageFee;
            $totalFine = (float) $request->input('total_fine', $lateFee + $damageFee);
            $additionalChargePaid = (float) $request->input('additional_charge_paid', 0);
            $finePaymentStatus = $request->input('fine_payment_status', $totalFine > 0 ? 'settled_from_deposit' : 'none');

            // Update rental deposit, fines, and completion status (SRS-F-007)
            $rental->update([
                'rental_status' => 'completed',
                'deposit_status' => $request->input('deposit_status'),
                'deposit_refund_amount' => $request->input('deposit_refund_amount'),
                'late_days' => $lateDays,
                'late_fee' => $lateFee,
                'damage_fee' => $damageFee,
                'total_fine' => $totalFine,
                'additional_charge_paid' => $additionalChargePaid,
                'fine_payment_status' => $finePaymentStatus,
                'returned_at' => $now,
                'admin_notes' => $request->input('admin_notes') ?: 'Proses pengembalian unit selesai dan jaminan deposit/denda telah diselesaikan.',
            ]);
        });

        return back()->with('success', "Pengembalian unit untuk {$rental->invoice_number} berhasil dicatat dan transaksi selesai!");
    }

    /**
     * Mark rental as defaulted (e.g. renter ran away or lost all equipment).
     */
    public function markAsDefaulted(Request $request, Rental $rental): RedirectResponse
    {
        $request->validate([
            'admin_notes' => ['required', 'string', 'max:500'],
            'suspend_user' => ['nullable', 'boolean'],
        ]);

        DB::transaction(function () use ($request, $rental) {
            $admin = $request->user();
            $now = now();

            // Mark all assigned physical units as lost/afkir
            $rental->load('items.itemUnits.equipmentUnit');
            foreach ($rental->items as $item) {
                foreach ($item->itemUnits as $iu) {
                    $iu->update([
                        'condition_in' => 'hilang',
                        'notes_in' => 'Barang tidak dikembalikan / dibawa kabur oleh penyewa.',
                        'returned_at' => $now,
                    ]);

                    if ($iu->equipmentUnit) {
                        $iu->equipmentUnit->update([
                            'condition' => 'rusak',
                            'status' => 'afkir',
                        ]);

                        UnitLog::create([
                            'equipment_unit_id' => $iu->equipmentUnit->id,
                            'rental_id' => $rental->id,
                            'user_id' => $admin->id,
                            'type' => 'condition_update',
                            'condition_before' => $iu->condition_out,
                            'condition_after' => 'hilang',
                            'notes' => "Unit dinyatakan hilang (Transaksi Defaulted/Bermasalah: {$rental->booking_code}).",
                            'created_at' => $now,
                        ]);
                    }
                }
            }

            // Forfeit entire deposit and set status to defaulted
            $rental->update([
                'rental_status' => 'defaulted',
                'deposit_status' => 'forfeited',
                'deposit_refund_amount' => 0,
                'fine_payment_status' => 'unpaid_defaulted',
                'returned_at' => $now,
                'admin_notes' => $request->input('admin_notes'),
            ]);

            // Suspend user if requested (default true)
            if ($request->boolean('suspend_user', true)) {
                $rental->user->update(['status' => 'suspended']);
            }
        });

        return back()->with('success', "Pesanan {$rental->invoice_number} berhasil ditandai sebagai bermasalah/hilang dan deposit disita penuh.");
    }

    /**
     * Reschedule rental dates for unconfirmed / pending / ready_pickup orders.
     */
    public function reschedule(Request $request, Rental $rental): RedirectResponse
    {
        if (in_array($rental->rental_status, ['active', 'completed', 'cancelled', 'defaulted'])) {
            return back()->with('error', 'Hanya pesanan yang belum diserahterimakan (menunggu DP / siap ambil) yang dapat dijadwalkan ulang.');
        }

        $request->validate([
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'admin_notes' => ['nullable', 'string', 'max:500'],
        ]);

        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $rental->load('items.equipment');

        // Verify stock availability for each item on new date range
        foreach ($rental->items as $item) {
            $equipment = $item->equipment;
            $totalUnits = $equipment->getTotalUsableUnits();

            // Booked units by other active rentals in this date range
            $otherBookedQty = RentalItem::where('equipment_id', $equipment->id)
                ->where('rental_id', '!=', $rental->id)
                ->whereHas('rental', function ($q) use ($startDate, $endDate) {
                    $q->whereIn('rental_status', ['pending_dp', 'confirmed', 'ready_pickup', 'active'])
                        ->where('start_date', '<=', $endDate)
                        ->where('end_date', '>=', $startDate);
                })
                ->sum('quantity');

            $availableForNewDates = max(0, $totalUnits - (int) $otherBookedQty);

            if ($item->quantity > $availableForNewDates) {
                return back()->with('error', "Stok alat '{$equipment->name}' tidak mencukupi untuk rentang tanggal baru ({$item->quantity} diminta, {$availableForNewDates} tersedia).");
            }
        }

        // Recalculate duration & price
        $startCarbon = Carbon::parse($startDate)->startOfDay();
        $endCarbon = Carbon::parse($endDate)->startOfDay();
        $totalDays = max(1, (int) $startCarbon->diffInDays($endCarbon));

        $subtotalRent = 0;
        $totalDeposit = 0;

        foreach ($rental->items as $item) {
            $equipment = $item->equipment;
            $pricePerDay = (float) $equipment->price_per_day;
            $depositPerUnit = (float) $equipment->deposit_per_unit;
            $itemSubtotal = $pricePerDay * $item->quantity * $totalDays;
            $itemDeposit = $depositPerUnit * $item->quantity;

            $item->update([
                'price_per_day' => $pricePerDay,
                'subtotal_price' => $itemSubtotal,
                'deposit_amount' => $itemDeposit,
            ]);

            $subtotalRent += $itemSubtotal;
            $totalDeposit += $itemDeposit;
        }

        $totalPrice = $subtotalRent + $totalDeposit;
        $dpPaid = (float) $rental->dp_amount;
        $remainingAmount = max(0, $totalPrice - $dpPaid);

        $notes = $request->input('admin_notes');
        $auditNote = "Jadwal sewa diperbarui ke {$startDate} s/d {$endDate} ({$totalDays} hari). ".($notes ? "Catatan: {$notes}" : '');

        $rental->update([
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_days' => $totalDays,
            'subtotal_price' => $subtotalRent,
            'total_deposit' => $totalDeposit,
            'total_price' => $totalPrice,
            'remaining_amount' => $remainingAmount,
            'admin_notes' => $rental->admin_notes ? ($rental->admin_notes.' | '.$auditNote) : $auditNote,
        ]);

        return back()->with('success', "Pesanan {$rental->invoice_number} berhasil dijadwalkan ulang ke {$startDate} s/d {$endDate}!");
    }

    /**
     * Cancel an order with specific DP resolution (refund DP, forfeit DP / no-show, or standard cancel).
     */
    public function cancelOrder(Request $request, Rental $rental): RedirectResponse
    {
        if (in_array($rental->rental_status, ['active', 'completed', 'defaulted'])) {
            return back()->with('error', 'Pesanan aktif atau selesai tidak dapat dibatalkan melalui alur ini.');
        }

        $request->validate([
            'cancellation_type' => ['required', 'in:refund_dp,forfeit_dp,standard'],
            'admin_notes' => ['required', 'string', 'max:500'],
        ]);

        $type = $request->input('cancellation_type');
        $notes = $request->input('admin_notes');

        $depositStatus = match ($type) {
            'refund_dp' => 'refunded',
            'forfeit_dp' => 'forfeited',
            default => 'unpaid',
        };

        $prefix = match ($type) {
            'refund_dp' => '[REFUND DP] ',
            'forfeit_dp' => '[DP HANGUS / NO-SHOW] ',
            default => '[PEMBATALAN STANDAR] ',
        };

        $rental->update([
            'rental_status' => 'cancelled',
            'deposit_status' => $depositStatus,
            'admin_notes' => $prefix.$notes,
        ]);

        $message = match ($type) {
            'refund_dp' => "Pesanan {$rental->invoice_number} berhasil dibatalkan dan status pengembalian DP (Refund) telah dicatat.",
            'forfeit_dp' => "Pesanan {$rental->invoice_number} berhasil dibatalkan karena No-Show / DP Disita (Hangus).",
            default => "Pesanan {$rental->invoice_number} berhasil dibatalkan.",
        };

        return back()->with('success', $message);
    }
}
