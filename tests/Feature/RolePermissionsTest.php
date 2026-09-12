<?php

use App\Models\Rental;
use App\Models\User;
use Database\Seeders\CampingRentalSeeder;

beforeEach(function () {
    $this->seed(CampingRentalSeeder::class);
    $this->admin = User::where('role', 'admin')->first();
    $this->cashier = User::where('role', 'kasir')->first();
    $this->warehouseStaff = User::where('role', 'petugas_gudang')->first();
    $this->customer = User::where('role', 'customer')->first();
    $this->rental = createTestRental(['rental_status' => 'active']);
});

test('customer cannot access any admin panel routes', function () {
    $this->actingAs($this->customer)->get(route('admin.dashboard'))->assertForbidden();
    $this->actingAs($this->customer)->get(route('admin.rentals.index'))->assertForbidden();
    $this->actingAs($this->customer)->get(route('admin.fines.index'))->assertForbidden();
    $this->actingAs($this->customer)->get(route('admin.equipment.index'))->assertForbidden();
    $this->actingAs($this->customer)->get(route('admin.units.index'))->assertForbidden();
    $this->actingAs($this->customer)->get(route('admin.users.index'))->assertForbidden();
    $this->actingAs($this->customer)->get(route('admin.reports.revenue'))->assertForbidden();
});

test('kasir can access cashier-related operational, financial, and digital invoice routes', function () {
    $rental = Rental::first();

    $this->actingAs($this->cashier)->get(route('admin.dashboard'))->assertOk();
    $this->actingAs($this->cashier)->get(route('admin.rentals.index'))->assertOk();
    $this->actingAs($this->cashier)->get(route('admin.fines.index'))->assertOk();
    $this->actingAs($this->cashier)->get(route('admin.equipment.index'))->assertOk();
    $this->actingAs($this->cashier)->get(route('admin.reports.revenue'))->assertOk();
    $this->actingAs($this->cashier)->get(route('admin.reports.payments'))->assertOk();
    $this->actingAs($this->cashier)->get(route('admin.reports.customers'))->assertOk();
    $this->actingAs($this->cashier)->get(route('admin.reports.top_equipment'))->assertOk();
    $this->actingAs($this->cashier)->get(route('bookings.show', $rental->id))->assertOk();
});

test('kasir is forbidden from warehouse and admin exclusive routes', function () {
    $this->actingAs($this->cashier)->get(route('admin.users.index'))->assertForbidden();
    $this->actingAs($this->cashier)->get(route('admin.reviews.index'))->assertForbidden();
    $this->actingAs($this->cashier)->get(route('admin.categories.index'))->assertForbidden();
    $this->actingAs($this->cashier)->get(route('admin.brands.index'))->assertForbidden();
    $this->actingAs($this->cashier)->get(route('admin.units.index'))->assertForbidden();
    $this->actingAs($this->cashier)->get(route('admin.inventory_logs.index'))->assertForbidden();
    $this->actingAs($this->cashier)->get(route('admin.reports.inventory'))->assertForbidden();
});

test('petugas gudang can access warehouse operational, inventory, and digital invoice routes', function () {
    $rental = Rental::first();

    $this->actingAs($this->warehouseStaff)->get(route('admin.dashboard'))->assertOk();
    $this->actingAs($this->warehouseStaff)->get(route('admin.rentals.index'))->assertOk();
    $this->actingAs($this->warehouseStaff)->get(route('admin.fines.index'))->assertOk();
    $this->actingAs($this->warehouseStaff)->get(route('admin.equipment.index'))->assertOk();
    $this->actingAs($this->warehouseStaff)->get(route('admin.categories.index'))->assertOk();
    $this->actingAs($this->warehouseStaff)->get(route('admin.brands.index'))->assertOk();
    $this->actingAs($this->warehouseStaff)->get(route('admin.units.index'))->assertOk();
    $this->actingAs($this->warehouseStaff)->get(route('admin.inventory_logs.index'))->assertOk();
    $this->actingAs($this->warehouseStaff)->get(route('admin.reports.inventory'))->assertOk();
    $this->actingAs($this->warehouseStaff)->get(route('admin.reports.top_equipment'))->assertOk();
    $this->actingAs($this->warehouseStaff)->get(route('bookings.show', $rental->id))->assertOk();
});

test('petugas gudang is forbidden from financial and admin exclusive routes', function () {
    $this->actingAs($this->warehouseStaff)->get(route('admin.users.index'))->assertForbidden();
    $this->actingAs($this->warehouseStaff)->get(route('admin.reviews.index'))->assertForbidden();
    $this->actingAs($this->warehouseStaff)->get(route('admin.reports.revenue'))->assertForbidden();
    $this->actingAs($this->warehouseStaff)->get(route('admin.reports.payments'))->assertForbidden();
    $this->actingAs($this->warehouseStaff)->get(route('admin.reports.customers'))->assertForbidden();
});

test('admin can access all internal routes without restriction', function () {
    $this->actingAs($this->admin)->get(route('admin.dashboard'))->assertOk();
    $this->actingAs($this->admin)->get(route('admin.rentals.index'))->assertOk();
    $this->actingAs($this->admin)->get(route('admin.equipment.index'))->assertOk();
    $this->actingAs($this->admin)->get(route('admin.units.index'))->assertOk();
    $this->actingAs($this->admin)->get(route('admin.inventory_logs.index'))->assertOk();
    $this->actingAs($this->admin)->get(route('admin.reports.revenue'))->assertOk();
    $this->actingAs($this->admin)->get(route('admin.reports.inventory'))->assertOk();
    $this->actingAs($this->admin)->get(route('admin.reviews.index'))->assertOk();
    $this->actingAs($this->admin)->get(route('admin.users.index'))->assertOk();
});
