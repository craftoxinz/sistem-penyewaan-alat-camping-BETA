<?php

use App\Models\Equipment;
use App\Models\EquipmentUnit;
use App\Models\User;
use Database\Seeders\CampingRentalSeeder;

beforeEach(function () {
    $this->seed(CampingRentalSeeder::class);
    $this->admin = User::where('role', 'admin')->first();
    $this->customer = User::where('role', 'customer')->first();
});

test('unauthenticated guest cannot access admin units index', function () {
    $response = $this->get(route('admin.units.index'));

    $response->assertRedirect(route('login'));
});

test('customer role cannot access admin units index', function () {
    $response = $this->actingAs($this->customer)->get(route('admin.units.index'));

    $response->assertForbidden();
});

test('admin can view physical units index page with equipment suggestions', function () {
    $response = $this->actingAs($this->admin)->get(route('admin.units.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/units/index')
        ->has('units')
        ->has('equipmentList')
        ->has('recentLogs')
        ->has('filters')
    );
});

test('admin can create a single physical unit manually', function () {
    $equipment = Equipment::first();

    $response = $this->actingAs($this->admin)->post(route('admin.units.store'), [
        'equipment_id' => $equipment->id,
        'unit_code' => 'TEST-MNL-001',
        'condition' => 'baik',
        'status' => 'tersedia',
        'notes' => 'Unit testing manual',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('equipment_units', [
        'equipment_id' => $equipment->id,
        'unit_code' => 'TEST-MNL-001',
        'condition' => 'baik',
        'status' => 'tersedia',
    ]);

    $this->assertDatabaseHas('unit_logs', [
        'user_id' => $this->admin->id,
        'type' => 'condition_update',
    ]);
});

test('admin can batch-create multiple physical units at once with auto-generated codes', function () {
    $equipment = Equipment::where('slug', 'tenda-arpenaz-4-person')->first() ?? Equipment::first();

    // Get current unit count for this equipment
    $initialCount = EquipmentUnit::where('equipment_id', $equipment->id)->count();

    $response = $this->actingAs($this->admin)->post(route('admin.units.store'), [
        'equipment_id' => $equipment->id,
        'quantity' => 3,
        'prefix' => 'TND-BATCH-',
        'start_number' => 10,
        'condition' => 'baik',
        'status' => 'tersedia',
        'notes' => 'Unit batch penambahan',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    // Verify all 3 units created in DB
    $this->assertDatabaseHas('equipment_units', [
        'equipment_id' => $equipment->id,
        'unit_code' => 'TND-BATCH-010',
    ]);
    $this->assertDatabaseHas('equipment_units', [
        'equipment_id' => $equipment->id,
        'unit_code' => 'TND-BATCH-011',
    ]);
    $this->assertDatabaseHas('equipment_units', [
        'equipment_id' => $equipment->id,
        'unit_code' => 'TND-BATCH-012',
    ]);

    $newCount = EquipmentUnit::where('equipment_id', $equipment->id)->count();
    expect($newCount)->toBe($initialCount + 3);
});

test('batch creation fails if any unit code is already taken', function () {
    $equipment = Equipment::first();

    // Create an existing unit
    EquipmentUnit::create([
        'equipment_id' => $equipment->id,
        'unit_code' => 'DUP-002',
        'condition' => 'baik',
        'status' => 'tersedia',
    ]);

    $response = $this->actingAs($this->admin)->post(route('admin.units.store'), [
        'equipment_id' => $equipment->id,
        'quantity' => 3,
        'prefix' => 'DUP-',
        'start_number' => 1, // Will try to generate DUP-001, DUP-002, DUP-003
        'condition' => 'baik',
        'status' => 'tersedia',
    ]);

    $response->assertSessionHasErrors('unit_code');

    // DUP-001 and DUP-003 must not exist because transaction rolls back
    $this->assertDatabaseMissing('equipment_units', [
        'unit_code' => 'DUP-001',
    ]);
    $this->assertDatabaseMissing('equipment_units', [
        'unit_code' => 'DUP-003',
    ]);
});
