<?php

use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\CampingRentalSeeder;

beforeEach(function () {
    $this->seed(CampingRentalSeeder::class);
    $this->admin = User::where('role', 'admin')->first();
    $this->cashier = User::where('role', 'kasir')->first();
});

test('rental correctly identifies expired schedules for unconfirmed bookings past start date', function () {
    $rental = createTestRental(['rental_status' => 'pending_dp']);

    // Set start date to yesterday
    $rental->update([
        'start_date' => Carbon::yesterday()->toDateString(),
        'end_date' => Carbon::tomorrow()->toDateString(),
    ]);

    expect($rental->is_schedule_expired)->toBeTrue();

    // If active or completed, is_schedule_expired should be false
    $rental->update(['rental_status' => 'active']);
    expect($rental->is_schedule_expired)->toBeFalse();
});

test('admin or cashier can reschedule unconfirmed booking to new future dates', function () {
    $rental = createTestRental(['rental_status' => 'pending_dp']);

    $newStart = Carbon::today()->addDays(5)->toDateString();
    $newEnd = Carbon::today()->addDays(8)->toDateString(); // 3 days

    $response = $this->actingAs($this->cashier)->post(route('admin.rentals.reschedule', $rental->id), [
        'start_date' => $newStart,
        'end_date' => $newEnd,
        'admin_notes' => 'Jadwal diubah atas kesepakatan via WhatsApp',
    ]);

    $response->assertRedirect();
    $rental->refresh();

    expect($rental->start_date->toDateString())->toBe($newStart);
    expect($rental->end_date->toDateString())->toBe($newEnd);
    expect($rental->total_days)->toBe(3);
    expect($rental->admin_notes)->toContain('Jadwal sewa diperbarui');
});

test('admin or cashier can cancel order with full DP refund', function () {
    $rental = createTestRental(['rental_status' => 'ready_pickup']);

    $response = $this->actingAs($this->cashier)->post(route('admin.rentals.cancel', $rental->id), [
        'cancellation_type' => 'refund_dp',
        'admin_notes' => 'Toko membatalkan pesanan karena kendala operasional, DP telah ditransfer balik ke rek BCA penyewa.',
    ]);

    $response->assertRedirect();
    $rental->refresh();

    expect($rental->rental_status)->toBe('cancelled');
    expect($rental->deposit_status)->toBe('refunded');
    expect($rental->admin_notes)->toContain('[REFUND DP]');
    expect($rental->admin_notes)->toContain('DP telah ditransfer balik');
});

test('admin or cashier can cancel order with forfeited DP due to customer no-show', function () {
    $rental = createTestRental(['rental_status' => 'ready_pickup']);

    $response = $this->actingAs($this->admin)->post(route('admin.rentals.cancel', $rental->id), [
        'cancellation_type' => 'forfeit_dp',
        'admin_notes' => 'Penyewa tidak datang mengambil barang hingga masa sewa habis tanpa kabar (No-Show). DP disita toko.',
    ]);

    $response->assertRedirect();
    $rental->refresh();

    expect($rental->rental_status)->toBe('cancelled');
    expect($rental->deposit_status)->toBe('forfeited');
    expect($rental->admin_notes)->toContain('[DP HANGUS / NO-SHOW]');
    expect($rental->admin_notes)->toContain('No-Show');
});

test('reschedule rejects past start date', function () {
    $rental = createTestRental(['rental_status' => 'pending_dp']);

    $response = $this->actingAs($this->admin)->post(route('admin.rentals.reschedule', $rental->id), [
        'start_date' => Carbon::yesterday()->toDateString(),
        'end_date' => Carbon::tomorrow()->toDateString(),
    ]);

    $response->assertSessionHasErrors(['start_date']);
});
