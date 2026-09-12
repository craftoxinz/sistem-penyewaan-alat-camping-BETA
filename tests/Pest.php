<?php

use App\Models\Equipment;
use App\Models\EquipmentUnit;
use App\Models\Rental;
use App\Models\RentalItem;
use App\Models\RentalItemUnit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function createTestRental(array $overrides = []): Rental
{
    $customer = User::where('role', 'customer')->first() ?? User::factory()->create(['role' => 'customer']);
    $equipment = Equipment::first() ?? Equipment::factory()->create();
    $unit = EquipmentUnit::where('equipment_id', $equipment->id)->first();

    $rentalStatus = $overrides['rental_status'] ?? 'pending_dp';
    $paymentStatus = $overrides['payment_status'] ?? ($rentalStatus === 'active' || $rentalStatus === 'completed' ? 'paid_in_full' : ($rentalStatus === 'ready_pickup' ? 'dp_verified' : 'pending_dp'));

    $defaults = [
        'user_id' => $customer->id,
        'booking_code' => 'BKG-'.date('Ymd').'-'.strtoupper(substr(uniqid(), -4)),
        'invoice_number' => 'INV-'.date('Ymd').'-'.strtoupper(substr(uniqid(), -4)),
        'start_date' => now()->addDays(2)->format('Y-m-d'),
        'end_date' => now()->addDays(4)->format('Y-m-d'),
        'total_days' => 2,
        'subtotal_price' => 70000,
        'total_deposit' => 80000,
        'total_price' => 150000,
        'dp_amount' => 75000,
        'remaining_amount' => 75000,
        'payment_status' => $paymentStatus,
        'rental_status' => $rentalStatus,
        'deposit_status' => $rentalStatus === 'completed' ? 'refunded' : ($rentalStatus === 'defaulted' ? 'forfeited' : 'held'),
        'deposit_refund_amount' => $rentalStatus === 'completed' ? 80000 : 0,
        'dp_proof_image' => 'sample_dp_proof.jpg',
        'dp_paid_at' => in_array($rentalStatus, ['ready_pickup', 'active', 'completed', 'overdue', 'defaulted']) ? now()->subDays(3) : null,
        'dp_verified_at' => in_array($rentalStatus, ['ready_pickup', 'active', 'completed', 'overdue', 'defaulted']) ? now()->subDays(3) : null,
        'cod_paid_at' => in_array($rentalStatus, ['active', 'completed', 'overdue', 'defaulted']) ? now()->subDays(2) : null,
        'handover_at' => in_array($rentalStatus, ['active', 'completed', 'overdue', 'defaulted']) ? now()->subDays(2) : null,
        'returned_at' => $rentalStatus === 'completed' ? now() : null,
    ];

    $rental = Rental::create(array_merge($defaults, $overrides));

    $item = RentalItem::create([
        'rental_id' => $rental->id,
        'equipment_id' => $equipment->id,
        'quantity' => 1,
        'price_per_day' => 35000,
        'deposit_per_unit' => 40000,
        'subtotal_price' => 70000,
        'subtotal_deposit' => 40000,
    ]);

    if ($unit && in_array($rentalStatus, ['active', 'completed', 'overdue', 'defaulted'])) {
        RentalItemUnit::create([
            'rental_item_id' => $item->id,
            'equipment_unit_id' => $unit->id,
            'condition_out' => 'baik',
            'condition_in' => in_array($rentalStatus, ['completed', 'defaulted']) ? 'baik' : null,
            'handover_at' => now()->subDays(2),
        ]);
        if ($rentalStatus === 'active') {
            $unit->update(['status' => 'disewa']);
        }
    }

    return $rental->fresh(['items.itemUnits.equipmentUnit', 'items.equipment', 'user']);
}
