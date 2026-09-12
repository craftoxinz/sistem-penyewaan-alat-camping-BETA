<?php

use App\Models\Equipment;
use App\Models\Rental;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\CampingRentalSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(CampingRentalSeeder::class);
});

test('authenticated customer can create a rental booking (SRS-F-005)', function () {
    $customer = User::where('role', 'customer')->first();
    $equipment = Equipment::first();

    $startDate = Carbon::today()->addDays(5)->toDateString();
    $endDate = Carbon::today()->addDays(7)->toDateString();

    $response = $this->actingAs($customer)->post(route('bookings.store'), [
        'start_date' => $startDate,
        'end_date' => $endDate,
        'customer_notes' => 'Tujuan camping di Gunung Puntang',
        'items' => [
            [
                'equipment_id' => $equipment->id,
                'quantity' => 1,
            ],
        ],
    ]);

    $rental = Rental::where('user_id', $customer->id)->latest('id')->first();
    expect($rental)->not->toBeNull();
    expect($rental->total_days)->toBe(2);
    expect($rental->rental_status)->toBe('pending_dp');
    expect($rental->booking_code)->toStartWith('BKG-');
    expect($rental->invoice_number)->toStartWith('INV-');

    $response->assertRedirect(route('bookings.show', $rental->id));
});

test('customer can upload DP proof image for their rental (SRS-F-015)', function () {
    Storage::fake('public');
    $customer = User::where('role', 'customer')->first();
    $rental = createTestRental(['user_id' => $customer->id, 'rental_status' => 'pending_dp']);

    $file = UploadedFile::fake()->image('bukti_transfer.jpg');

    $response = $this->actingAs($customer)->post(route('bookings.dp_proof', $rental->id), [
        'dp_proof' => $file,
    ]);

    $response->assertRedirect();
    $rental->refresh();
    expect($rental->dp_proof_image)->not->toBeNull();
});

test('system prevents booking when requested quantity exceeds available stock on overlapping dates (SRS-NF-003)', function () {
    $customer = User::where('role', 'customer')->first();
    $equipment = Equipment::first();
    $totalUnits = $equipment->getTotalUsableUnits();

    $startDate = Carbon::today()->addDays(10)->toDateString();
    $endDate = Carbon::today()->addDays(12)->toDateString();

    // Try booking more than total usable units
    $response = $this->actingAs($customer)->post(route('bookings.store'), [
        'start_date' => $startDate,
        'end_date' => $endDate,
        'items' => [
            [
                'equipment_id' => $equipment->id,
                'quantity' => $totalUnits + 10,
            ],
        ],
    ]);

    $response->assertSessionHasErrors();
});

test('system blocks second booking if all units are already booked on the same date range (SRS-NF-003)', function () {
    $customer1 = User::where('role', 'customer')->first();
    $customer2 = User::where('role', 'customer')->skip(1)->first() ?? $customer1;
    $equipment = Equipment::first();
    $totalUsable = $equipment->getTotalUsableUnits();

    $startDate = Carbon::today()->addDays(20)->toDateString();
    $endDate = Carbon::today()->addDays(22)->toDateString();

    // First booking takes all usable units
    $firstResponse = $this->actingAs($customer1)->post(route('bookings.store'), [
        'start_date' => $startDate,
        'end_date' => $endDate,
        'items' => [
            [
                'equipment_id' => $equipment->id,
                'quantity' => $totalUsable,
            ],
        ],
    ]);
    $firstResponse->assertRedirect(); // first booking succeeds

    // Second booking on the same date range should be rejected
    $secondResponse = $this->actingAs($customer2)->post(route('bookings.store'), [
        'start_date' => $startDate,
        'end_date' => $endDate,
        'items' => [
            [
                'equipment_id' => $equipment->id,
                'quantity' => 1,
            ],
        ],
    ]);
    $secondResponse->assertSessionHasErrors(['items']); // double-booking blocked
});

test('checkAvailability endpoint returns false when unit is fully booked on requested date range', function () {
    $customer = User::where('role', 'customer')->first();
    $equipment = Equipment::first();
    $totalUsable = $equipment->getTotalUsableUnits();

    $startDate = Carbon::today()->addDays(30)->toDateString();
    $endDate = Carbon::today()->addDays(32)->toDateString();

    // Book all units for those dates
    $this->actingAs($customer)->post(route('bookings.store'), [
        'start_date' => $startDate,
        'end_date' => $endDate,
        'items' => [['equipment_id' => $equipment->id, 'quantity' => $totalUsable]],
    ]);

    // Check availability via the API endpoint
    $response = $this->actingAs($customer)->getJson(
        route('catalog.availability', $equipment->slug)."?start_date={$startDate}&end_date={$endDate}&quantity=1"
    );

    $response->assertJson(['available' => false, 'availableStock' => 0]);
});

test('system blocks booking when customer profile is missing phone or address', function () {
    $incompleteUser = User::factory()->create([
        'role' => 'customer',
        'phone' => null,
        'address' => null,
    ]);
    $equipment = Equipment::first();

    $startDate = Carbon::today()->addDays(5)->toDateString();
    $endDate = Carbon::today()->addDays(7)->toDateString();

    $response = $this->actingAs($incompleteUser)->post(route('bookings.store'), [
        'start_date' => $startDate,
        'end_date' => $endDate,
        'items' => [
            [
                'equipment_id' => $equipment->id,
                'quantity' => 1,
            ],
        ],
    ]);

    $response->assertSessionHasErrors(['profile']);
});

test('customer can checkout a subset of items for separate rental dates independently', function () {
    $customer = User::where('role', 'customer')->first();
    $equipments = Equipment::take(3)->get();
    expect($equipments->count())->toBeGreaterThanOrEqual(2);

    $eq1 = $equipments[0];
    $eq2 = $equipments[1];

    // Batch 1: Checkout first equipment for Date Range 1 (5 days from now, duration 2 days)
    $startDate1 = Carbon::today()->addDays(5)->toDateString();
    $endDate1 = Carbon::today()->addDays(7)->toDateString();

    $response1 = $this->actingAs($customer)->post(route('bookings.store'), [
        'start_date' => $startDate1,
        'end_date' => $endDate1,
        'customer_notes' => 'Batch 1 - Trip Papandayan',
        'items' => [
            [
                'equipment_id' => $eq1->id,
                'quantity' => 1,
            ],
        ],
    ]);

    $rental1 = Rental::where('user_id', $customer->id)
        ->where('customer_notes', 'Batch 1 - Trip Papandayan')
        ->first();

    expect($rental1)->not->toBeNull();
    expect($rental1->total_days)->toBe(2);
    expect($rental1->items)->toHaveCount(1);
    expect($rental1->items->first()->equipment_id)->toBe($eq1->id);
    expect($rental1->items->first()->quantity)->toBe(1);
    $response1->assertRedirect(route('bookings.show', $rental1->id));

    // Batch 2: Checkout second equipment for Date Range 2 (12 days from now, duration 3 days)
    $startDate2 = Carbon::today()->addDays(12)->toDateString();
    $endDate2 = Carbon::today()->addDays(15)->toDateString();

    $response2 = $this->actingAs($customer)->post(route('bookings.store'), [
        'start_date' => $startDate2,
        'end_date' => $endDate2,
        'customer_notes' => 'Batch 2 - Trip Merbabu',
        'items' => [
            [
                'equipment_id' => $eq2->id,
                'quantity' => 1,
            ],
        ],
    ]);

    $rental2 = Rental::where('user_id', $customer->id)
        ->where('customer_notes', 'Batch 2 - Trip Merbabu')
        ->first();

    expect($rental2)->not->toBeNull();
    expect($rental2->total_days)->toBe(3);
    expect($rental2->items)->toHaveCount(1);
    expect($rental2->items->first()->equipment_id)->toBe($eq2->id);
    expect($rental2->items->first()->quantity)->toBe(1);
    expect($rental2->booking_code)->not->toBe($rental1->booking_code);
    expect($rental2->invoice_number)->not->toBe($rental1->invoice_number);
    $response2->assertRedirect(route('bookings.show', $rental2->id));
});

test('customer can choose full payment (100%) and remaining_amount is zero', function () {
    $customer = User::where('role', 'customer')->first();
    $equipment = Equipment::first();

    $startDate = Carbon::today()->addDays(10)->toDateString();
    $endDate = Carbon::today()->addDays(12)->toDateString();

    $this->actingAs($customer)->post(route('bookings.store'), [
        'start_date' => $startDate,
        'end_date' => $endDate,
        'payment_type' => 'full',
        'items' => [
            ['equipment_id' => $equipment->id, 'quantity' => 1],
        ],
    ]);

    $rental = Rental::where('user_id', $customer->id)->latest('id')->first();
    expect($rental)->not->toBeNull();
    expect((int) $rental->remaining_amount)->toBe(0);
    expect((int) $rental->dp_amount)->toBe((int) $rental->total_price);
});

test('customer full payment dp_amount equals total_price', function () {
    $customer = User::where('role', 'customer')->first();
    $equipment = Equipment::first();

    $startDate = Carbon::today()->addDays(15)->toDateString();
    $endDate = Carbon::today()->addDays(17)->toDateString();

    $this->actingAs($customer)->post(route('bookings.store'), [
        'start_date' => $startDate,
        'end_date' => $endDate,
        'payment_type' => 'full',
        'items' => [
            ['equipment_id' => $equipment->id, 'quantity' => 1],
        ],
    ]);

    $rental = Rental::where('user_id', $customer->id)->latest('id')->first();

    expect((int) $rental->dp_amount)->toBe((int) $rental->total_price);
    expect((int) $rental->remaining_amount)->toBe(0);
    expect((int) $rental->dp_amount + (int) $rental->remaining_amount)->toBe((int) $rental->total_price);
});

test('customer dp payment keeps 30% dp_amount and non-zero remaining', function () {
    $customer = User::where('role', 'customer')->first();
    $equipment = Equipment::first();

    $startDate = Carbon::today()->addDays(20)->toDateString();
    $endDate = Carbon::today()->addDays(22)->toDateString();

    $this->actingAs($customer)->post(route('bookings.store'), [
        'start_date' => $startDate,
        'end_date' => $endDate,
        'payment_type' => 'dp',
        'items' => [
            ['equipment_id' => $equipment->id, 'quantity' => 1],
        ],
    ]);

    $rental = Rental::where('user_id', $customer->id)->latest('id')->first();

    expect((int) $rental->remaining_amount)->toBeGreaterThan(0);
    expect((int) $rental->dp_amount)->toBeLessThan((int) $rental->total_price);
    expect((int) $rental->dp_amount + (int) $rental->remaining_amount)->toBe((int) $rental->total_price);
});

test('customer can filter bookings by cancelled status (myBookings)', function () {
    $customer = User::where('role', 'customer')->first();
    createTestRental(['user_id' => $customer->id, 'rental_status' => 'cancelled']);

    $response = $this->actingAs($customer)->get(route('bookings.index').'?status=cancelled');
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('bookings/index')
        ->has('rentals.data', 1)
    );
});

test('checkCartAvailability endpoint returns available true when stock is sufficient', function () {
    $equipment = Equipment::first();
    $startDate = Carbon::today()->addDays(5)->toDateString();
    $endDate = Carbon::today()->addDays(7)->toDateString();

    $response = $this->postJson(route('cart.check_availability'), [
        'start_date' => $startDate,
        'end_date' => $endDate,
        'items' => [
            [
                'equipment_id' => $equipment->id,
                'quantity' => 1,
            ],
        ],
    ]);

    $response->assertOk();
    $response->assertJson([
        'all_available' => true,
        'items' => [
            $equipment->id => [
                'equipment_id' => $equipment->id,
                'requested_quantity' => 1,
                'is_available' => true,
            ],
        ],
    ]);
});

test('checkCartAvailability endpoint returns available false when quantity exceeds available stock', function () {
    $equipment = Equipment::first();
    $totalUsable = $equipment->getTotalUsableUnits();
    $startDate = Carbon::today()->addDays(5)->toDateString();
    $endDate = Carbon::today()->addDays(7)->toDateString();

    $response = $this->postJson(route('cart.check_availability'), [
        'start_date' => $startDate,
        'end_date' => $endDate,
        'items' => [
            [
                'equipment_id' => $equipment->id,
                'quantity' => $totalUsable + 99,
            ],
        ],
    ]);

    $response->assertOk();
    $response->assertJson([
        'all_available' => false,
        'items' => [
            $equipment->id => [
                'equipment_id' => $equipment->id,
                'is_available' => false,
            ],
        ],
    ]);
});
