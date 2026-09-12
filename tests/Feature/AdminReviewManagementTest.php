<?php

use App\Models\Equipment;
use App\Models\Review;
use App\Models\User;
use Database\Seeders\CampingRentalSeeder;

beforeEach(function () {
    $this->seed(CampingRentalSeeder::class);
});

test('customer can submit review for completed rental (SRS-F-014)', function () {
    $customer = User::where('role', 'customer')->first();
    $rental = createTestRental(['user_id' => $customer->id, 'rental_status' => 'completed']);

    $equipment = $rental->items->first()->equipment;

    $response = $this->actingAs($customer)->post(route('reviews.store'), [
        'rental_id' => $rental->id,
        'equipment_id' => $equipment->id,
        'rating' => 5,
        'comment' => 'Tenda sangat bersih, kokoh dan mudah dipasang!',
    ]);

    $response->assertRedirect();
    $review = Review::where('rental_id', $rental->id)
        ->where('equipment_id', $equipment->id)
        ->where('user_id', $customer->id)
        ->first();

    expect($review)->not->toBeNull();
    expect($review->rating)->toBe(5);
    expect($review->comment)->toBe('Tenda sangat bersih, kokoh dan mudah dipasang!');
    expect($review->is_visible)->toBeTrue();
});

test('customer can revise existing review', function () {
    $customer = User::where('role', 'customer')->first();
    $rental = createTestRental(['user_id' => $customer->id, 'rental_status' => 'completed']);

    $equipment = $rental->items->first()->equipment;

    // Create initial review
    $this->actingAs($customer)->post(route('reviews.store'), [
        'rental_id' => $rental->id,
        'equipment_id' => $equipment->id,
        'rating' => 4,
        'comment' => 'Bagus sekali',
    ]);

    // Revise review
    $response = $this->actingAs($customer)->post(route('reviews.store'), [
        'rental_id' => $rental->id,
        'equipment_id' => $equipment->id,
        'rating' => 5,
        'comment' => 'Revisi: Ternyata sangat nyaman dan komplit!',
    ]);

    $response->assertRedirect();
    $review = Review::where('rental_id', $rental->id)
        ->where('equipment_id', $equipment->id)
        ->first();

    expect($review->rating)->toBe(5);
    expect($review->comment)->toBe('Revisi: Ternyata sangat nyaman dan komplit!');
});

test('customer cannot review rental that is not completed', function () {
    $customer = User::where('role', 'customer')->first();
    $rental = createTestRental(['user_id' => $customer->id, 'rental_status' => 'active']);

    $equipment = $rental->items->first()->equipment;

    $response = $this->actingAs($customer)->post(route('reviews.store'), [
        'rental_id' => $rental->id,
        'equipment_id' => $equipment->id,
        'rating' => 5,
        'comment' => 'Test review on active rental',
    ]);

    $response->assertSessionHas('error');
});

test('customer cannot review equipment not in their rental', function () {
    $customer = User::where('role', 'customer')->first();
    $rental = createTestRental(['user_id' => $customer->id, 'rental_status' => 'completed']);

    $rentedEquipmentIds = $rental->items->pluck('equipment_id')->toArray();
    $otherEquipment = Equipment::whereNotIn('id', $rentedEquipmentIds)->first();

    $response = $this->actingAs($customer)->post(route('reviews.store'), [
        'rental_id' => $rental->id,
        'equipment_id' => $otherEquipment->id,
        'rating' => 5,
        'comment' => 'Test review on wrong equipment',
    ]);

    $response->assertSessionHas('error');
});

test('non-admin is forbidden from accessing admin review management', function () {
    $customer = User::where('role', 'customer')->first();

    $response = $this->actingAs($customer)->get(route('admin.reviews.index'));
    $response->assertForbidden();
});

test('admin can access review management and view analytics', function () {
    $admin = User::where('role', 'admin')->first();

    $response = $this->actingAs($admin)->get(route('admin.reviews.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/reviews/index')
        ->has('reviews')
        ->has('stats')
        ->has('equipmentList')
        ->has('filters')
    );
});

test('admin can toggle review visibility', function () {
    $admin = User::where('role', 'admin')->first();
    $customer = User::where('role', 'customer')->first();
    $rental = createTestRental(['user_id' => $customer->id, 'rental_status' => 'completed']);
    $equipment = $rental->items->first()->equipment;

    $review = Review::create([
        'rental_id' => $rental->id,
        'equipment_id' => $equipment->id,
        'user_id' => $customer->id,
        'rating' => 5,
        'comment' => 'Test review',
        'is_visible' => true,
    ]);

    $initialStatus = $review->is_visible;

    $response = $this->actingAs($admin)->patch(route('admin.reviews.toggle_visibility', $review->id));
    $response->assertRedirect();

    $review->refresh();
    expect($review->is_visible)->toBe(! $initialStatus);
});

test('admin can delete a review', function () {
    $admin = User::where('role', 'admin')->first();
    $customer = User::where('role', 'customer')->first();
    $rental = createTestRental(['user_id' => $customer->id, 'rental_status' => 'completed']);
    $equipment = $rental->items->first()->equipment;

    $review = Review::create([
        'rental_id' => $rental->id,
        'equipment_id' => $equipment->id,
        'user_id' => $customer->id,
        'rating' => 5,
        'comment' => 'Test review to delete',
        'is_visible' => true,
    ]);
    $reviewId = $review->id;

    $response = $this->actingAs($admin)->delete(route('admin.reviews.destroy', $reviewId));
    $response->assertRedirect();

    expect(Review::find($reviewId))->toBeNull();
});

test('hidden review is not displayed in public catalog', function () {
    $customer = User::where('role', 'customer')->first();
    $rental = createTestRental(['user_id' => $customer->id, 'rental_status' => 'completed']);
    $equipment = $rental->items->first()->equipment;

    $review = Review::create([
        'rental_id' => $rental->id,
        'equipment_id' => $equipment->id,
        'user_id' => $customer->id,
        'rating' => 5,
        'comment' => 'Test hidden review',
        'is_visible' => false,
    ]);

    $response = $this->get(route('catalog.show', $equipment->slug));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('catalog/show')
        ->where('equipment.reviews', fn ($reviews) => collect($reviews)->pluck('id')->doesntContain($review->id))
    );
});
