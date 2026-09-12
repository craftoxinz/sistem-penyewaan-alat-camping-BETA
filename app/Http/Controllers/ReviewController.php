<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReviewRequest;
use App\Models\Rental;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;

class ReviewController extends Controller
{
    /**
     * Store a customer review and rating for rented equipment (SRS-F-014).
     */
    public function store(ReviewRequest $request): RedirectResponse
    {
        $user = $request->user();
        $rental = Rental::findOrFail($request->input('rental_id'));

        if ($rental->user_id !== $user->id && ! $user->isAdmin()) {
            abort(403, 'Anda tidak berhak memberikan ulasan untuk pesanan ini.');
        }

        if ($rental->rental_status !== 'completed') {
            return back()->with('error', 'Ulasan hanya dapat diberikan setelah masa sewa selesai.');
        }

        // Verify equipment is part of this rental
        $hasItem = $rental->items()->where('equipment_id', $request->input('equipment_id'))->exists();
        if (! $hasItem) {
            return back()->with('error', 'Alat ini bukan bagian dari transaksi penyewaan Anda.');
        }

        Review::updateOrCreate(
            [
                'rental_id' => $rental->id,
                'equipment_id' => $request->input('equipment_id'),
                'user_id' => $user->id,
            ],
            [
                'rating' => $request->input('rating'),
                'comment' => $request->input('comment'),
                'is_visible' => true,
            ]
        );

        return back()->with('success', 'Terima kasih! Ulasan dan rating Anda berhasil disimpan.');
    }
}
