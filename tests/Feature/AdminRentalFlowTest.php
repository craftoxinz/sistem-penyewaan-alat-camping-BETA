<?php

use App\Models\EquipmentUnit;
use App\Models\Rental;
use App\Models\User;
use Database\Seeders\CampingRentalSeeder;

beforeEach(function () {
    $this->seed(CampingRentalSeeder::class);
});

test('non-admin user is forbidden from accessing admin routes (SRS-NF-004)', function () {
    $customer = User::where('role', 'customer')->first();

    $response = $this->actingAs($customer)->get(route('admin.dashboard'));
    $response->assertForbidden();
});

test('admin can access dashboard and orders list (SRS-F-008)', function () {
    $admin = User::where('role', 'admin')->first();

    $response = $this->actingAs($admin)->get(route('admin.dashboard'));
    $response->assertOk();

    $ordersResponse = $this->actingAs($admin)->get(route('admin.rentals.index'));
    $ordersResponse->assertOk();
    $ordersResponse->assertInertia(
        fn ($page) => $page
            ->component('admin/rentals/index')
            ->has('stats')
            ->has('stats.total')
            ->has('stats.pending_dp')
            ->has('stats.ready_pickup')
            ->has('stats.active')
            ->has('stats.completed_this_month')
            ->has('stats.overdue')
            ->has('stats.defaulted')
            ->has('stats.stats_month')
            ->where('stats.total', Rental::count())
    );
});

test('admin can verify down payment to ready pickup status (SRS-F-016)', function () {
    $admin = User::where('role', 'admin')->first();
    $rental = createTestRental(['rental_status' => 'pending_dp']);

    $response = $this->actingAs($admin)->post(route('admin.rentals.verify_dp', $rental->id), [
        'action' => 'approve',
        'admin_notes' => 'Transfer DP BCA diverifikasi valid.',
    ]);

    $response->assertRedirect();
    $rental->refresh();
    expect($rental->payment_status)->toBe('dp_verified');
    expect($rental->rental_status)->toBe('ready_pickup');
});

test('admin can handover available units from dropdown and settle COD (SRS-F-010, SRS-F-017)', function () {
    $admin = User::where('role', 'admin')->first();
    $rental = createTestRental(['rental_status' => 'ready_pickup']);

    $assignments = [];
    foreach ($rental->items as $item) {
        $availableUnits = EquipmentUnit::where('equipment_id', $item->equipment_id)
            ->where('status', 'tersedia')
            ->take($item->quantity)
            ->pluck('id')
            ->toArray();

        $assignments[] = [
            'rental_item_id' => $item->id,
            'unit_ids' => $availableUnits,
            'notes_out' => 'Kondisi serah terima baik & lengkap.',
        ];
    }

    $response = $this->actingAs($admin)->post(route('admin.rentals.handover', $rental->id), [
        'assignments' => $assignments,
        'admin_notes' => 'Pelunasan COD tunai diterima.',
    ]);

    $response->assertRedirect();
    $rental->refresh();
    expect($rental->rental_status)->toBe('active');
    expect($rental->payment_status)->toBe('paid_in_full');
    expect($rental->cod_paid_at)->not->toBeNull();
});

test('admin can complete return, update unit condition logs, and refund deposit (SRS-F-007, SRS-F-010, SRS-F-011)', function () {
    $admin = User::where('role', 'admin')->first();
    $rental = createTestRental(['rental_status' => 'active']);

    $returns = [];
    foreach ($rental->items as $item) {
        foreach ($item->itemUnits as $iu) {
            $returns[] = [
                'rental_item_unit_id' => $iu->id,
                'condition_in' => 'baik',
                'notes_in' => 'Kembali lengkap & bersih.',
            ];
        }
    }

    $response = $this->actingAs($admin)->post(route('admin.rentals.return', $rental->id), [
        'returns' => $returns,
        'deposit_status' => 'refunded',
        'deposit_refund_amount' => $rental->total_deposit,
        'admin_notes' => 'Unit lengkap, deposit dikembalikan.',
    ]);

    $response->assertRedirect();
    $rental->refresh();
    expect($rental->rental_status)->toBe('completed');
    expect($rental->deposit_status)->toBe('refunded');
});

test('admin can view financial reports without query exceptions (SRS-F-012)', function () {
    $admin = User::where('role', 'admin')->first();

    $response = $this->actingAs($admin)->get(route('admin.reports.revenue'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/reports/revenue')
        ->has('dailyRevenue')
        ->has('monthlyRevenue')
        ->has('summaryTotals')
    );
});

test('admin can view inventory movement logs and record manual mutations (SRS-F-010, SRS-F-011)', function () {
    $admin = User::where('role', 'admin')->first();
    $unit = EquipmentUnit::first();

    // 1. View logs page
    $response = $this->actingAs($admin)->get(route('admin.inventory_logs.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/inventory-logs/index')
        ->has('logs')
        ->has('stats')
    );

    // 2. Record manual mutation (maintenance)
    $mutationResponse = $this->actingAs($admin)->post(route('admin.inventory_logs.store'), [
        'equipment_unit_id' => $unit->id,
        'type' => 'maintenance',
        'new_condition' => 'butuh_perbaikan',
        'new_status' => 'maintenance',
        'notes' => 'Frame patah perlu diganti komponen di bengkel.',
    ]);

    $mutationResponse->assertRedirect();
    $unit->refresh();
    expect($unit->status)->toBe('maintenance');
    expect($unit->condition)->toBe('butuh_perbaikan');
});
test('admin cannot manually update status of a unit that is currently rented out', function () {
    $admin = User::where('role', 'admin')->first();
    createTestRental(['rental_status' => 'active']);
    $rentedUnit = EquipmentUnit::where('status', 'disewa')->first();

    $response = $this->actingAs($admin)->put(route('admin.units.update', $rentedUnit->id), [
        'equipment_id' => $rentedUnit->equipment_id,
        'unit_code' => $rentedUnit->unit_code,
        'condition' => $rentedUnit->condition,
        'status' => 'tersedia', // trying to manually release it
        'notes' => 'Test override',
    ]);

    $response->assertSessionHasErrors('status');
    $rentedUnit->refresh();
    expect($rentedUnit->status)->toBe('disewa');
});

test('admin cannot set status to disewa manually — only via handover flow', function () {
    $admin = User::where('role', 'admin')->first();
    $availableUnit = EquipmentUnit::where('status', 'tersedia')->first();

    $response = $this->actingAs($admin)->put(route('admin.units.update', $availableUnit->id), [
        'equipment_id' => $availableUnit->equipment_id,
        'unit_code' => $availableUnit->unit_code,
        'condition' => $availableUnit->condition,
        'status' => 'disewa',
        'notes' => 'Test manual override',
    ]);

    $response->assertSessionHasErrors('status');
    $availableUnit->refresh();
    expect($availableUnit->status)->not->toBe('disewa');
});

test('admin cannot delete a unit that is currently rented out', function () {
    $admin = User::where('role', 'admin')->first();
    createTestRental(['rental_status' => 'active']);
    $rentedUnit = EquipmentUnit::where('status', 'disewa')->first();
    $unitId = $rentedUnit->id;

    $response = $this->actingAs($admin)->delete(route('admin.units.destroy', $rentedUnit->id));

    $response->assertSessionHasErrors('delete');
    expect(EquipmentUnit::find($unitId))->not->toBeNull();
});

test('admin cannot reactivate an afkir unit to tersedia or maintenance', function () {
    $admin = User::where('role', 'admin')->first();
    // Manually create an afkir unit for this test
    $afkirUnit = EquipmentUnit::where('status', 'tersedia')->first();
    $afkirUnit->update(['status' => 'afkir']);

    foreach (['tersedia', 'maintenance'] as $targetStatus) {
        $response = $this->actingAs($admin)->put(route('admin.units.update', $afkirUnit->id), [
            'equipment_id' => $afkirUnit->equipment_id,
            'unit_code' => $afkirUnit->unit_code,
            'condition' => $afkirUnit->condition,
            'status' => $targetStatus,
            'notes' => 'Coba diaktifkan kembali',
        ]);

        $response->assertSessionHasErrors('status');
    }

    $afkirUnit->refresh();
    expect($afkirUnit->status)->toBe('afkir');
});

test('admin can lookup unit details by unit_code for QR scanner', function () {
    $admin = User::where('role', 'admin')->first();
    $unit = EquipmentUnit::first();

    $response = $this->actingAs($admin)->get(route('admin.units.scan_lookup', ['unit_code' => $unit->unit_code]));

    $response->assertOk();
    $response->assertJson([
        'success' => true,
        'unit' => [
            'id' => $unit->id,
            'unit_code' => $unit->unit_code,
            'condition' => $unit->condition,
            'status' => $unit->status,
        ],
    ]);
});

test('admin lookup returns 404 when QR unit_code is invalid', function () {
    $admin = User::where('role', 'admin')->first();

    $response = $this->actingAs($admin)->get(route('admin.units.scan_lookup', ['unit_code' => 'NON-EXISTENT-999']));

    $response->assertNotFound();
    $response->assertJson([
        'success' => false,
    ]);
});

test('customer cannot access scan lookup endpoint', function () {
    $customer = User::where('role', 'customer')->first();
    $unit = EquipmentUnit::first();

    $response = $this->actingAs($customer)->get(route('admin.units.scan_lookup', ['unit_code' => $unit->unit_code]));

    $response->assertForbidden();
});
