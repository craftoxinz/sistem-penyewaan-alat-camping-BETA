<?php

use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\CampingRentalSeeder;

beforeEach(function () {
    $this->seed(CampingRentalSeeder::class);
});

test('non-admin user is forbidden from accessing fines management', function () {
    $customer = User::where('role', 'customer')->first();

    $response = $this->actingAs($customer)->get(route('admin.fines.index'));
    $response->assertForbidden();
});

test('admin can access fines management dashboard and view summary metrics', function () {
    $admin = User::where('role', 'admin')->first();

    $response = $this->actingAs($admin)->get(route('admin.fines.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/fines/index')
        ->has('stats')
        ->has('rentals')
        ->has('filters')
    );
});

test('active overdue rental appears in the overdue tab', function () {
    $admin = User::where('role', 'admin')->first();
    $rental = createTestRental([
        'rental_status' => 'active',
        'start_date' => Carbon::today()->subDays(6)->toDateString(),
        'end_date' => Carbon::today()->subDays(3)->toDateString(),
    ]);

    $response = $this->actingAs($admin)->get(route('admin.fines.index', ['tab' => 'overdue']));
    $response->assertOk();

    $rental->refresh();
    expect($rental->isOverdue())->toBeTrue();
    expect($rental->overdue_days)->toBeGreaterThanOrEqual(3);
});

test('completed rental with fine appears in the history tab', function () {
    $admin = User::where('role', 'admin')->first();
    $rental = createTestRental([
        'rental_status' => 'completed',
        'late_days' => 2,
        'late_fee' => 50000,
        'damage_fee' => 20000,
        'total_fine' => 70000,
        'fine_payment_status' => 'settled_from_deposit',
        'returned_at' => now(),
    ]);

    $response = $this->actingAs($admin)->get(route('admin.fines.index', ['tab' => 'history']));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('filters.tab', 'history')
    );
});

test('defaulted rental appears in the defaulted tab', function () {
    $admin = User::where('role', 'admin')->first();
    $rental = createTestRental([
        'rental_status' => 'defaulted',
        'deposit_status' => 'forfeited',
        'deposit_refund_amount' => 0,
        'fine_payment_status' => 'unpaid_defaulted',
        'returned_at' => now(),
    ]);

    $response = $this->actingAs($admin)->get(route('admin.fines.index', ['tab' => 'defaulted']));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('filters.tab', 'defaulted')
    );
});

test('admin can settle additional fine payment via fine controller', function () {
    $admin = User::where('role', 'admin')->first();
    $rental = createTestRental([
        'rental_status' => 'completed',
        'total_fine' => 150000,
        'additional_charge_paid' => 0,
        'fine_payment_status' => 'paid_extra_cash',
    ]);

    $response = $this->actingAs($admin)->post(route('admin.fines.settle', $rental->id), [
        'additional_charge_paid' => 150000,
        'admin_notes' => 'Pembayaran tunai denda diterima kasir.',
    ]);

    $response->assertRedirect();
    $rental->refresh();

    expect((float) $rental->additional_charge_paid)->toEqual(150000.0);
    expect($rental->fine_payment_status)->toBe('paid_extra_cash');
});
