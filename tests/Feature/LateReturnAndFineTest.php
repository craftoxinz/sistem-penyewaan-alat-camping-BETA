<?php

use App\Models\Equipment;
use App\Models\User;
use Database\Seeders\CampingRentalSeeder;

beforeEach(function () {
    $this->seed(CampingRentalSeeder::class);
});

test('admin can process return with late fee and damage fee deducting deposit', function () {
    $admin = User::where('role', 'admin')->first();
    $rental = createTestRental(['rental_status' => 'active']);

    $returns = [];
    foreach ($rental->items as $item) {
        foreach ($item->itemUnits as $iu) {
            $returns[] = [
                'rental_item_unit_id' => $iu->id,
                'condition_in' => 'butuh_perbaikan',
                'notes_in' => 'Ada kotoran dan jahitan terlepas sedikit.',
            ];
        }
    }

    $lateDays = 2;
    $lateFee = 50000;
    $damageFee = 25000;
    $totalFine = $lateFee + $damageFee;
    $totalDeposit = (float) $rental->total_deposit;
    $expectedRefund = max(0, $totalDeposit - $totalFine);

    $response = $this->actingAs($admin)->post(route('admin.rentals.return', $rental->id), [
        'returns' => $returns,
        'late_days' => $lateDays,
        'late_fee' => $lateFee,
        'damage_fee' => $damageFee,
        'total_fine' => $totalFine,
        'additional_charge_paid' => 0,
        'fine_payment_status' => 'settled_from_deposit',
        'deposit_status' => $expectedRefund > 0 ? 'refunded' : 'forfeited',
        'deposit_refund_amount' => $expectedRefund,
        'admin_notes' => 'Denda dipotong langsung dari deposit.',
    ]);

    $response->assertRedirect();
    $rental->refresh();

    expect($rental->rental_status)->toBe('completed');
    expect((int) $rental->late_days)->toBe(2);
    expect((float) $rental->late_fee)->toEqual(50000.0);
    expect((float) $rental->damage_fee)->toEqual(25000.0);
    expect((float) $rental->total_fine)->toEqual(75000.0);
    expect((float) $rental->deposit_refund_amount)->toEqual($expectedRefund);
    expect($rental->fine_payment_status)->toBe('settled_from_deposit');
});

test('admin can process return with fines exceeding deposit requiring extra payment', function () {
    $admin = User::where('role', 'admin')->first();
    $rental = createTestRental(['rental_status' => 'active']);

    $returns = [];
    foreach ($rental->items as $item) {
        foreach ($item->itemUnits as $iu) {
            $returns[] = [
                'rental_item_unit_id' => $iu->id,
                'condition_in' => 'rusak',
                'notes_in' => 'Kain robek parah.',
            ];
        }
    }

    $damageFee = (float) $rental->total_deposit + 100000;
    $extraPaid = 100000;

    $response = $this->actingAs($admin)->post(route('admin.rentals.return', $rental->id), [
        'returns' => $returns,
        'late_days' => 0,
        'late_fee' => 0,
        'damage_fee' => $damageFee,
        'total_fine' => $damageFee,
        'additional_charge_paid' => $extraPaid,
        'fine_payment_status' => 'paid_extra_cash',
        'deposit_status' => 'forfeited',
        'deposit_refund_amount' => 0,
        'admin_notes' => 'Deposit disita dan penyewa bayar tunai biaya tambahan.',
    ]);

    $response->assertRedirect();
    $rental->refresh();

    expect($rental->rental_status)->toBe('completed');
    expect($rental->deposit_status)->toBe('forfeited');
    expect((float) $rental->deposit_refund_amount)->toEqual(0.0);
    expect((float) $rental->additional_charge_paid)->toEqual(100000.0);
    expect($rental->fine_payment_status)->toBe('paid_extra_cash');
});

test('admin can record lost item condition updating unit to afkir status', function () {
    $admin = User::where('role', 'admin')->first();
    $rental = createTestRental(['rental_status' => 'active']);
    $targetItemUnit = $rental->items->first()->itemUnits->first();
    $unit = $targetItemUnit->equipmentUnit;

    $returns = [];
    foreach ($rental->items as $item) {
        foreach ($item->itemUnits as $iu) {
            $returns[] = [
                'rental_item_unit_id' => $iu->id,
                'condition_in' => $iu->id === $targetItemUnit->id ? 'hilang' : 'baik',
                'notes_in' => $iu->id === $targetItemUnit->id ? 'Unit hilang di lokasi camp.' : 'Lengkap',
            ];
        }
    }

    $response = $this->actingAs($admin)->post(route('admin.rentals.return', $rental->id), [
        'returns' => $returns,
        'late_days' => 0,
        'late_fee' => 0,
        'damage_fee' => 200000,
        'total_fine' => 200000,
        'additional_charge_paid' => 0,
        'fine_payment_status' => 'settled_from_deposit',
        'deposit_status' => 'forfeited',
        'deposit_refund_amount' => 0,
        'admin_notes' => 'Ganti rugi barang hilang.',
    ]);

    $response->assertRedirect();
    $unit->refresh();

    expect($unit->status)->toBe('afkir');
    expect($unit->condition)->toBe('rusak');
});

test('admin can mark rental as defaulted seizes deposit and suspends user account', function () {
    $admin = User::where('role', 'admin')->first();
    $rental = createTestRental(['rental_status' => 'active']);
    $renter = $rental->user;

    $response = $this->actingAs($admin)->post(route('admin.rentals.defaulted', $rental->id), [
        'admin_notes' => 'Penyewa kabur tidak dapat dihubungi dan barang tidak kembali.',
        'suspend_user' => true,
    ]);

    $response->assertRedirect();
    $rental->refresh();
    $renter->refresh();

    expect($rental->rental_status)->toBe('defaulted');
    expect($rental->deposit_status)->toBe('forfeited');
    expect((float) $rental->deposit_refund_amount)->toEqual(0.0);
    expect($rental->fine_payment_status)->toBe('unpaid_defaulted');
    expect($renter->status)->toBe('suspended');
    expect($renter->isSuspended())->toBeTrue();
});

test('suspended user is blocked from making new bookings', function () {
    $customer = User::where('role', 'customer')->first();
    $customer->update(['status' => 'suspended']);

    $equipment = Equipment::first();

    $response = $this->actingAs($customer)->post(route('bookings.store'), [
        'start_date' => now()->addDays(2)->format('Y-m-d'),
        'end_date' => now()->addDays(4)->format('Y-m-d'),
        'customer_notes' => 'Booking test',
        'items' => [
            [
                'equipment_id' => $equipment->id,
                'quantity' => 1,
            ],
        ],
    ]);

    $response->assertSessionHasErrors(['user']);
});

test('admin can manually suspend and unsuspend user via user management', function () {
    $admin = User::where('role', 'admin')->first();
    $customer = User::where('role', 'customer')->first();

    // Suspend user
    $suspendResponse = $this->actingAs($admin)->put(route('admin.users.update', $customer->id), [
        'name' => $customer->name,
        'email' => $customer->email,
        'role' => 'customer',
        'status' => 'suspended',
    ]);

    $suspendResponse->assertRedirect(route('admin.users.index'));
    $customer->refresh();
    expect($customer->status)->toBe('suspended');
    expect($customer->isSuspended())->toBeTrue();

    // Unsuspend user
    $unsuspendResponse = $this->actingAs($admin)->put(route('admin.users.update', $customer->id), [
        'name' => $customer->name,
        'email' => $customer->email,
        'role' => 'customer',
        'status' => 'active',
    ]);

    $unsuspendResponse->assertRedirect(route('admin.users.index'));
    $customer->refresh();
    expect($customer->status)->toBe('active');
    expect($customer->isActive())->toBeTrue();
});
