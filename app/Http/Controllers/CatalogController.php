<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Equipment;
use App\Models\RentalItem;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    /**
     * Display the public camping equipment catalog.
     */
    public function index(Request $request): Response
    {
        $categories = Category::withCount('equipment')->get();
        $brands = Brand::where('is_active', true)->withCount('equipment')->orderBy('name')->get();

        $query = Equipment::query()
            ->where('is_active', true)
            ->with(['category', 'brand', 'units'])
            ->withCount([
                // Total physical fleet (all units)
                'units as total_units_count',
                // Usable fleet: excludes afkir/hilang and heavily damaged — this is the booking capacity ceiling
                'units as usable_units_count' => function ($q) {
                    $q->whereNotIn('status', ['afkir', 'hilang'])->where('condition', '!=', 'rusak');
                },
                // Currently "tersedia" (not assigned to any active rental right now physically)
                // NOTE: This alone does NOT reflect date-range availability
                'units as available_units_count' => function ($q) {
                    $q->where('status', 'tersedia')->where('condition', '!=', 'rusak');
                },
                'reviews' => function ($q) {
                    $q->where('is_visible', true);
                },
            ])
            ->withAvg([
                'reviews' => function ($q) {
                    $q->where('is_visible', true);
                },
            ], 'rating');

        // Filter by category
        if ($request->filled('category')) {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->input('category'));
            });
        }

        // Filter by brand
        if ($request->filled('brand')) {
            $query->whereHas('brand', function ($q) use ($request) {
                $q->where('slug', $request->input('brand'));
            });
        }

        // Search by keyword
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('brand', fn ($bq) => $bq->where('name', 'like', "%{$search}%"));
            });
        }

        // Sorting
        $sort = $request->input('sort', 'popular');
        match ($sort) {
            'price_asc' => $query->orderBy('price_per_day', 'asc'),
            'price_desc' => $query->orderBy('price_per_day', 'desc'),
            'newest' => $query->latest(),
            'rating' => $query->orderByDesc('reviews_avg_rating'),
            default => $query->withCount('rentalItems')->orderByDesc('rental_items_count'),
        };

        $perPage = (int) $request->input('per_page', 9);
        if (! in_array($perPage, [9, 12, 24])) {
            $perPage = 9;
        }

        $equipment = $query->paginate($perPage)->withQueryString();

        return Inertia::render('catalog/index', [
            'categories' => $categories,
            'brands' => $brands,
            'equipment' => $equipment,
            'filters' => [
                'category' => $request->input('category', ''),
                'brand' => $request->input('brand', ''),
                'search' => $request->input('search', ''),
                'sort' => $sort,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Display the specified equipment detail page with availability calendar.
     */
    public function show(Equipment $equipment): Response
    {
        $equipment->load([
            'category',
            'brand',
            'units.unitLogs.user',
            'reviews.user',
        ]);

        $totalUnits = $equipment->getTotalUsableUnits();
        // Real availability for today's date range (date-aware, not just physical status)
        $availableStockToday = $equipment->getAvailableStockForDates(
            Carbon::today()->toDateString(),
            Carbon::today()->toDateString()
        );

        // Calculate booked events for the next 60 days for FullCalendar
        $startDate = Carbon::today();
        $endDate = Carbon::today()->addDays(60);

        $activeRentals = RentalItem::where('equipment_id', $equipment->id)
            ->whereHas('rental', function ($query) use ($startDate, $endDate) {
                $query->whereIn('rental_status', ['pending_dp', 'confirmed', 'ready_pickup', 'active'])
                    ->where('start_date', '<=', $endDate->toDateString())
                    ->where('end_date', '>=', $startDate->toDateString());
            })
            ->with('rental')
            ->get();

        // Generate availability per day
        $calendarEvents = [];
        $period = CarbonPeriod::create($startDate, $endDate);

        foreach ($period as $date) {
            $dateStr = $date->toDateString();
            $bookedQty = $activeRentals->filter(function ($item) use ($dateStr) {
                return $item->rental->start_date <= $dateStr && $item->rental->end_date >= $dateStr;
            })->sum('quantity');

            $remainingStock = max(0, $totalUnits - (int) $bookedQty);

            $calendarEvents[] = [
                'title' => $remainingStock > 0 ? "Tersedia: {$remainingStock}" : 'Habis / Full',
                'start' => $dateStr,
                'allDay' => true,
                'color' => $remainingStock > 0 ? '#16A34A' : '#DC2626',
                'extendedProps' => [
                    'available' => $remainingStock > 0,
                    'remainingStock' => $remainingStock,
                    'totalUnits' => $totalUnits,
                    'bookedUnits' => $bookedQty,
                ],
            ];
        }

        $avgRating = round((float) $equipment->reviews()->where('is_visible', true)->avg('rating'), 1);
        $totalReviews = $equipment->reviews()->where('is_visible', true)->count();

        return Inertia::render('catalog/show', [
            'equipment' => $equipment,
            'stats' => [
                'totalUnits' => $totalUnits,
                'availableStockToday' => $availableStockToday,
                'avgRating' => $avgRating,
                'totalReviews' => $totalReviews,
            ],
            'calendarEvents' => $calendarEvents,
        ]);
    }

    /**
     * Check availability for a specific equipment and date range.
     */
    public function checkAvailability(Request $request, Equipment $equipment): JsonResponse
    {
        $request->validate([
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $requestedQty = (int) $request->input('quantity');

        $availableStock = $equipment->getAvailableStockForDates($startDate, $endDate);
        $isAvailable = $availableStock >= $requestedQty;

        return response()->json([
            'available' => $isAvailable,
            'availableStock' => $availableStock,
            'requestedQuantity' => $requestedQty,
            'message' => $isAvailable
                ? "Stok tersedia ({$availableStock} unit siap disewa)."
                : "Stok tidak mencukupi untuk tanggal tersebut (Tersedia: {$availableStock} unit).",
        ]);
    }
}
