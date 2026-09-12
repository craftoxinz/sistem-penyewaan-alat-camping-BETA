<?php

use App\Models\Category;
use App\Models\Equipment;
use App\Models\EquipmentUnit;
use App\Models\Rental;
use App\Models\RentalItem;
use App\Models\RentalItemUnit;
use App\Models\User;
use Database\Seeders\CampingRentalSeeder;

beforeEach(function () {
    $this->seed(CampingRentalSeeder::class);
});

test('admin can set damage fine rates when creating equipment', function () {
    $admin = User::where('role', 'admin')->first();
    $category = Category::first();

    $response = $this->actingAs($admin)->post(route('admin.equipment.store'), [
        'name' => 'Tenda Dome Ekspedisi 6P',
        'category_id' => $category->id,
        'description' => 'Tenda ekspedisi tahan badai kapasitas 6 orang.',
        'price_per_day' => 80000,
        'deposit_per_unit' => 100000,
        'fine_minor_damage' => 200000,
        'fine_heavy_damage' => 450000,
        'fine_lost' => 900000,
        'is_active' => true,
    ]);

    $response->assertRedirect(route('admin.equipment.index'));

    $equipment = Equipment::where('name', 'Tenda Dome Ekspedisi 6P')->first();
    expect($equipment)->not->toBeNull();
    expect((float) $equipment->fine_minor_damage)->toEqual(200000.0);
    expect((float) $equipment->fine_heavy_damage)->toEqual(450000.0);
    expect((float) $equipment->fine_lost)->toEqual(900000.0);
});

test('seeded equipment has standard fine rates for tent and sleeping bag', function () {
    $tent = Equipment::where('slug', 'tenda-dome-arpenaz-41-4-orang')->first();
    $sleepingBag = Equipment::where('slug', 'sleeping-bag-bulu-angsa-mummy-consina')->first();

    expect($tent)->not->toBeNull();
    expect((float) $tent->fine_minor_damage)->toEqual(150000.0);
    expect((float) $tent->fine_heavy_damage)->toEqual(350000.0);
    expect((float) $tent->fine_lost)->toEqual(650000.0);

    expect($sleepingBag)->not->toBeNull();
    expect((float) $sleepingBag->fine_minor_damage)->toEqual(70000.0);
    expect((float) $sleepingBag->fine_heavy_damage)->toEqual(140000.0);
    expect((float) $sleepingBag->fine_lost)->toEqual(250000.0);
});

test('return order calculates itemized unit damage fees accurately for tent and sleeping bag', function () {
    $admin = User::where('role', 'admin')->first();
    $customer = User::where('role', 'customer')->first();

    $tent = Equipment::where('slug', 'tenda-dome-arpenaz-41-4-orang')->first();
    $sleepingBag = Equipment::where('slug', 'sleeping-bag-bulu-angsa-mummy-consina')->first();

    $tentUnit = EquipmentUnit::where('equipment_id', $tent->id)->first();
    $sbUnit = EquipmentUnit::where('equipment_id', $sleepingBag->id)->first();

    $rental = Rental::create([
        'user_id' => $customer->id,
        'booking_code' => 'BOOK-TEST-FINES',
        'invoice_number' => 'INV-TEST-FINES',
        'start_date' => now()->subDays(3)->format('Y-m-d'),
        'end_date' => now()->format('Y-m-d'),
        'total_days' => 3,
        'subtotal_price' => 189000,
        'total_deposit' => 300000,
        'total_price' => 489000,
        'dp_amount' => 489000,
        'remaining_amount' => 0,
        'payment_status' => 'paid_in_full',
        'rental_status' => 'active',
        'deposit_status' => 'held',
        'deposit_refund_amount' => 0,
    ]);

    $rentalItemTent = RentalItem::create([
        'rental_id' => $rental->id,
        'equipment_id' => $tent->id,
        'quantity' => 1,
        'price_per_day' => 45000,
        'deposit_per_unit' => 50000,
        'subtotal_price' => 135000,
        'subtotal_deposit' => 50000,
    ]);

    $rentalItemSb = RentalItem::create([
        'rental_id' => $rental->id,
        'equipment_id' => $sleepingBag->id,
        'quantity' => 1,
        'price_per_day' => 18000,
        'deposit_per_unit' => 25000,
        'subtotal_price' => 54000,
        'subtotal_deposit' => 25000,
    ]);

    $riuTent = RentalItemUnit::create([
        'rental_item_id' => $rentalItemTent->id,
        'equipment_unit_id' => $tentUnit->id,
        'condition_out' => 'baik',
        'handover_at' => now()->subDays(3),
    ]);

    $riuSb = RentalItemUnit::create([
        'rental_item_id' => $rentalItemSb->id,
        'equipment_unit_id' => $sbUnit->id,
        'condition_out' => 'baik',
        'handover_at' => now()->subDays(3),
    ]);

    // Tent is damaged (minor: 150000) and sleeping bag is damaged (minor: 70000)
    // Total damage = 150000 + 70000 = 220000
    // Total deposit = 300000 => Deposit refund = 300000 - 220000 = 80000
    $returns = [
        [
            'rental_item_unit_id' => $riuTent->id,
            'condition_in' => 'butuh_perbaikan',
            'notes_in' => 'Sobek kecil di flysheet tenda.',
            'damage_fee' => 150000,
        ],
        [
            'rental_item_unit_id' => $riuSb->id,
            'condition_in' => 'butuh_perbaikan',
            'notes_in' => 'Kotor lumpur pekat dan resleting macet.',
            'damage_fee' => 70000,
        ],
    ];

    $response = $this->actingAs($admin)->post(route('admin.rentals.return', $rental->id), [
        'returns' => $returns,
        'late_days' => 0,
        'late_fee' => 0,
        'damage_fee' => 220000,
        'total_fine' => 220000,
        'additional_charge_paid' => 0,
        'fine_payment_status' => 'settled_from_deposit',
        'deposit_status' => 'refunded',
        'deposit_refund_amount' => 80000,
        'admin_notes' => 'Denda kerusakan tenda dan sleeping bag dipotong dari jaminan deposit.',
    ]);

    $response->assertRedirect();
    $rental->refresh();

    expect($rental->rental_status)->toBe('completed');
    expect((float) $rental->damage_fee)->toEqual(220000.0);
    expect((float) $rental->total_fine)->toEqual(220000.0);
    expect((float) $rental->deposit_refund_amount)->toEqual(80000.0);
    expect($rental->fine_payment_status)->toBe('settled_from_deposit');

    // Verify per-unit damage fees are recorded
    $riuTent->refresh();
    $riuSb->refresh();
    expect((float) $riuTent->damage_fee)->toEqual(150000.0);
    expect((float) $riuSb->damage_fee)->toEqual(70000.0);
    expect($riuTent->condition_in)->toBe('butuh_perbaikan');
    expect($riuSb->condition_in)->toBe('butuh_perbaikan');
});
