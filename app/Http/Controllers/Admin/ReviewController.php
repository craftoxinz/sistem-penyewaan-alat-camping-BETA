<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    /**
     * Display the centralized customer review management page.
     */
    public function index(Request $request): Response
    {
        $ratingFilter = $request->input('rating');
        $visibilityFilter = $request->input('visibility', 'all');
        $equipmentId = $request->input('equipment_id');
        $search = $request->input('search');

        $query = Review::with(['user', 'equipment.category', 'rental'])->latest();

        // Filter by Rating
        if ($request->filled('rating') && $ratingFilter !== 'all') {
            $query->where('rating', (int) $ratingFilter);
        }

        // Filter by Visibility
        if ($visibilityFilter === 'visible') {
            $query->where('is_visible', true);
        } elseif ($visibilityFilter === 'hidden') {
            $query->where('is_visible', false);
        }

        // Filter by Equipment
        if ($request->filled('equipment_id') && $equipmentId !== 'all') {
            $query->where('equipment_id', $equipmentId);
        }

        // Search by customer name, comment, or invoice
        if ($request->filled('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('comment', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))
                    ->orWhereHas('rental', fn ($rq) => $rq->where('invoice_number', 'like', "%{$search}%")->orWhere('booking_code', 'like', "%{$search}%"));
            });
        }

        $perPage = (int) $request->input('per_page', 5);
        if (! in_array($perPage, [5, 10, 20, 50, 100])) {
            $perPage = 5;
        }

        $reviews = $query->paginate($perPage)->withQueryString();

        // Summary Analytics
        $allReviews = Review::all();
        $totalReviews = $allReviews->count();
        $avgRating = $totalReviews > 0 ? round((float) $allReviews->avg('rating'), 2) : 0;
        $visibleCount = $allReviews->where('is_visible', true)->count();
        $hiddenCount = $allReviews->where('is_visible', false)->count();
        $criticalCount = $allReviews->where('rating', '<=', 3)->count();
        $positiveCount = $allReviews->where('rating', '>=', 4)->count();
        $satisfactionRate = $totalReviews > 0 ? round(($positiveCount / $totalReviews) * 100) : 0;

        // Star breakdown (5, 4, 3, 2, 1)
        $ratingBreakdown = [];
        for ($i = 5; $i >= 1; $i--) {
            $count = $allReviews->where('rating', $i)->count();
            $percentage = $totalReviews > 0 ? round(($count / $totalReviews) * 100, 1) : 0;
            $ratingBreakdown[$i] = [
                'count' => $count,
                'percentage' => $percentage,
            ];
        }

        $equipmentList = Equipment::where('is_active', true)->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('admin/reviews/index', [
            'reviews' => $reviews,
            'equipmentList' => $equipmentList,
            'stats' => [
                'total_reviews' => $totalReviews,
                'avg_rating' => $avgRating,
                'visible_count' => $visibleCount,
                'hidden_count' => $hiddenCount,
                'critical_count' => $criticalCount,
                'positive_count' => $positiveCount,
                'satisfaction_rate' => $satisfactionRate,
                'rating_breakdown' => $ratingBreakdown,
            ],
            'filters' => [
                'rating' => $ratingFilter ?? 'all',
                'visibility' => $visibilityFilter,
                'equipment_id' => $equipmentId ?? 'all',
                'search' => $search ?? '',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Toggle review visibility on public catalog (SRS-F-014).
     */
    public function toggleVisibility(Request $request, Review $review): RedirectResponse
    {
        $newStatus = ! $review->is_visible;
        $review->update(['is_visible' => $newStatus]);

        $statusText = $newStatus ? 'ditampilkan di katalog publik' : 'disembunyikan dari publik';

        return back()->with('success', "Ulasan dari {$review->user->name} berhasil {$statusText}.");
    }

    /**
     * Delete a spam / invalid review.
     */
    public function destroy(Review $review): RedirectResponse
    {
        $customerName = $review->user->name;
        $review->delete();

        return back()->with('success', "Ulasan dari {$customerName} berhasil dihapus.");
    }
}
