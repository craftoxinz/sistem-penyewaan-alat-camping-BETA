<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Rental;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FineController extends Controller
{
    /**
     * Display the centralized fines and overdue management dashboard.
     */
    public function index(Request $request): Response
    {
        $tab = $request->input('tab', 'overdue');
        $search = $request->input('search');
        $paymentStatus = $request->input('payment_status');
        $today = Carbon::today()->toDateString();

        // 1. Base Query with Relations
        $baseQuery = Rental::with([
            'user',
            'items.equipment.availableUnits',
            'items.itemUnits.equipmentUnit',
            'reviews',
        ]);

        // 2. Filter by Tab
        $query = match ($tab) {
            'overdue' => (clone $baseQuery)
                ->where('rental_status', 'active')
                ->whereDate('end_date', '<', $today)
                ->orderBy('end_date', 'asc'),
            'history' => (clone $baseQuery)
                ->where('rental_status', 'completed')
                ->where('total_fine', '>', 0)
                ->latest('returned_at'),
            'defaulted' => (clone $baseQuery)
                ->where('rental_status', 'defaulted')
                ->latest('returned_at'),
            'all' => (clone $baseQuery)
                ->where(function ($q) use ($today) {
                    $q->where(function ($sub) use ($today) {
                        $sub->where('rental_status', 'active')
                            ->whereDate('end_date', '<', $today);
                    })
                        ->orWhere(function ($sub) {
                            $sub->where('rental_status', 'completed')
                                ->where('total_fine', '>', 0);
                        })
                        ->orWhere('rental_status', 'defaulted');
                })
                ->latest(),
            default => (clone $baseQuery)
                ->where('rental_status', 'active')
                ->whereDate('end_date', '<', $today)
                ->orderBy('end_date', 'asc'),
        };

        // 3. Search Filter
        if ($request->filled('search')) {
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

        // 4. Payment Status Filter (if applicable)
        if ($request->filled('payment_status') && $paymentStatus !== 'all') {
            $query->where('fine_payment_status', $paymentStatus);
        }

        $perPage = (int) $request->input('per_page', 5);
        if (! in_array($perPage, [5, 10, 20, 50, 100])) {
            $perPage = 5;
        }

        $rentals = $query->paginate($perPage)->withQueryString();

        // 5. Global Summary Statistics
        $activeOverdueRentals = Rental::with('items.equipment')
            ->where('rental_status', 'active')
            ->whereDate('end_date', '<', $today)
            ->get();

        $activeOverdueCount = $activeOverdueRentals->count();

        // Calculate estimated running fine for active overdue rentals
        $activeOverdueEstFine = 0;
        foreach ($activeOverdueRentals as $rental) {
            $days = max(1, Carbon::parse($rental->end_date)->startOfDay()->diffInDays(Carbon::today()->startOfDay()));
            $dailyRate = $rental->items->sum(fn ($item) => (float) ($item->equipment->price_per_day ?? 0) * $item->quantity);
            $activeOverdueEstFine += ($dailyRate * $days);
        }

        $totalFineCollected = (float) Rental::where('rental_status', 'completed')
            ->where('total_fine', '>', 0)
            ->sum('total_fine');

        $totalDefaultedLoss = (float) Rental::where('rental_status', 'defaulted')
            ->sum('total_price');

        $completedFineCasesCount = Rental::where('rental_status', 'completed')
            ->where('total_fine', '>', 0)
            ->count();

        $defaultedCasesCount = Rental::where('rental_status', 'defaulted')->count();

        $stats = [
            'active_overdue_count' => $activeOverdueCount,
            'active_overdue_est_fine' => $activeOverdueEstFine,
            'total_fine_collected' => $totalFineCollected,
            'total_defaulted_loss' => $totalDefaultedLoss,
            'completed_fine_cases_count' => $completedFineCasesCount,
            'defaulted_cases_count' => $defaultedCasesCount,
            'total_incidents' => $activeOverdueCount + $completedFineCasesCount + $defaultedCasesCount,
        ];

        return Inertia::render('admin/fines/index', [
            'rentals' => $rentals,
            'stats' => $stats,
            'filters' => [
                'tab' => $tab,
                'search' => $search ?? '',
                'payment_status' => $paymentStatus ?? 'all',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Settle additional fine payment for a rental (SRS-F-007).
     */
    public function settle(Request $request, Rental $rental): RedirectResponse
    {
        $request->validate([
            'additional_charge_paid' => ['required', 'numeric', 'min:0'],
            'admin_notes' => ['nullable', 'string', 'max:500'],
        ]);

        $paidAmount = (float) $request->input('additional_charge_paid');
        $notes = $request->input('admin_notes');

        $rental->update([
            'additional_charge_paid' => $paidAmount,
            'fine_payment_status' => 'paid_extra_cash',
            'admin_notes' => $notes ? ($rental->admin_notes." | Pelunasan denda: {$notes}") : $rental->admin_notes,
        ]);

        return back()->with('success', "Pelunasan tagihan denda untuk {$rental->invoice_number} berhasil dicatat!");
    }
}
