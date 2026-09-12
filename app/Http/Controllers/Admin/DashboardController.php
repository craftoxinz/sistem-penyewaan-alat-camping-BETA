<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\EquipmentUnit;
use App\Models\Rental;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the central Admin Dashboard (SRS-F-008).
     */
    public function index(): Response
    {
        $today = Carbon::today();
        $startOfMonth = Carbon::today()->startOfMonth();

        // 1. Financial stats
        $monthRevenue = Rental::where('created_at', '>=', $startOfMonth)
            ->whereIn('payment_status', ['dp_verified', 'paid_in_full'])
            ->sum('subtotal_price');

        $totalRevenue = Rental::whereIn('payment_status', ['dp_verified', 'paid_in_full'])
            ->sum('subtotal_price');

        // 2. Operational stats
        $pendingDpCount = Rental::where('rental_status', 'pending_dp')->count();
        $readyPickupCount = Rental::where('rental_status', 'ready_pickup')->count();
        $activeRentalsCount = Rental::where('rental_status', 'active')->count();
        $totalRentalsCount = Rental::count();

        // 3. Inventory stats
        $totalUnits = EquipmentUnit::count();
        $rentedUnits = EquipmentUnit::where('status', 'disewa')->count();
        $availableUnits = EquipmentUnit::where('status', 'tersedia')->where('condition', '!=', 'rusak')->count();
        $maintenanceUnits = EquipmentUnit::whereIn('status', ['maintenance', 'afkir'])
            ->orWhere('condition', 'rusak')
            ->count();

        // 4. Top rented equipment
        $topEquipment = Equipment::with('category')
            ->withCount('rentalItems')
            ->orderByDesc('rental_items_count')
            ->take(5)
            ->get();

        // 5. Recent orders
        $recentRentals = Rental::with(['user', 'items.equipment'])
            ->latest()
            ->take(6)
            ->get();

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'monthRevenue' => (float) $monthRevenue,
                'totalRevenue' => (float) $totalRevenue,
                'pendingDpCount' => $pendingDpCount,
                'readyPickupCount' => $readyPickupCount,
                'activeRentalsCount' => $activeRentalsCount,
                'totalRentalsCount' => $totalRentalsCount,
                'totalUnits' => $totalUnits,
                'rentedUnits' => $rentedUnits,
                'availableUnits' => $availableUnits,
                'maintenanceUnits' => $maintenanceUnits,
            ],
            'topEquipment' => $topEquipment,
            'recentRentals' => $recentRentals,
        ]);
    }
}
