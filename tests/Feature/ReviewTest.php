<?php

use App\Models\Review;
use App\Models\User;
use Database\Seeders\CampingRentalSeeder;

beforeEach(function () {
    $this->seed(CampingRentalSeeder::class);
});

test('customer can submit review and rating for completed rental (SRS-F-014)', function () {
    $customer = User::where('role', 'customer')->first();
    $rental = createTestRental(['user_id' => $customer->id, 'rental_status' => 'completed']);

    $equipmentId = $rental->items->first()->equipment_id;

    $response = $this->actingAs($customer)->post(route('reviews.store'), [
        'rental_id' => $rental->id,
        'equipment_id' => $equipmentId,
        'rating' => 5,
        'comment' => 'Tenda sangat kokoh, bersih dan nyaman digunakan!',
    ]);

    $response->assertRedirect();
    $review = Review::where('rental_id', $rental->id)->where('equipment_id', $equipmentId)->first();
    expect($review)->not->toBeNull();
    expect($review->rating)->toBe(5);
});
