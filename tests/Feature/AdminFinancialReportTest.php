<?php

use App\Models\Expense;
use App\Models\Income;
use App\Models\User;
use Database\Seeders\CampingRentalSeeder;
use Database\Seeders\ExpenseSeeder;
use Database\Seeders\IncomeSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(CampingRentalSeeder::class);
    $this->seed(ExpenseSeeder::class);
    $this->seed(IncomeSeeder::class);
});

test('admin and kasir can view comprehensive financial report with profit-loss and cash logs', function () {
    $admin = User::where('role', 'admin')->first();
    $kasir = User::where('role', 'kasir')->first();

    foreach ([$admin, $kasir] as $user) {
        $response = $this->actingAs($user)->get(route('admin.reports.revenue'));
        $response->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('admin/reports/revenue')
            ->has('dailyRevenue')
            ->has('monthlyRevenue')
            ->has('cashLogs')
            ->has('expensesList')
            ->has('incomesList')
            ->has('summaryTotals', fn (Assert $summary) => $summary
                ->has('totalCashIn')
                ->has('totalCashOut')
                ->has('grossRevenue')
                ->has('netProfit')
                ->has('profitMargin')
                ->has('totalExpenses')
                ->has('totalPaidExpenses')
                ->has('totalUnpaidExpenses')
                ->has('expenseCategories')
                ->has('totalIncomes')
                ->has('totalReceivedIncomes')
                ->has('totalPendingIncomes')
                ->has('incomeCategories')
                ->has('incomesCount')
                ->has('totalReceivables')
                ->has('totalPayables')
                ->etc()
            )
            ->has('filters')
        );
    }
});

test('customer is forbidden from accessing revenue report', function () {
    $customer = User::where('role', 'customer')->first();

    $this->actingAs($customer)
        ->get(route('admin.reports.revenue'))
        ->assertForbidden();
});

test('staff can record a new operating expense', function () {
    $admin = User::where('role', 'admin')->first();

    $response = $this->actingAs($admin)->post(route('admin.expenses.store'), [
        'category' => 'pemeliharaan_alat',
        'title' => 'Reparasi 2 Zipper Tenda Dome 4P',
        'amount' => 75000,
        'expense_date' => now()->toDateString(),
        'payment_method' => 'cash',
        'payment_status' => 'paid',
        'notes' => 'Perbaikan resleting pintu utama',
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $this->assertDatabaseHas('expenses', [
        'title' => 'Reparasi 2 Zipper Tenda Dome 4P',
        'amount' => 75000.00,
        'category' => 'pemeliharaan_alat',
        'payment_status' => 'paid',
    ]);
});

test('staff can update an existing operating expense', function () {
    $admin = User::where('role', 'admin')->first();
    $expense = Expense::first();

    $response = $this->actingAs($admin)->put(route('admin.expenses.update', $expense->id), [
        'category' => 'operasional_toko',
        'title' => 'Tagihan Listrik Toko Revisi',
        'amount' => 380000,
        'expense_date' => $expense->expense_date->toDateString(),
        'payment_method' => 'transfer',
        'payment_status' => 'paid',
        'notes' => 'Penyesuaian tagihan akhir',
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $expense->refresh();
    expect($expense->title)->toBe('Tagihan Listrik Toko Revisi');
    expect((float) $expense->amount)->toEqual(380000.0);
    expect($expense->category)->toBe('operasional_toko');
});

test('staff can delete an operating expense', function () {
    $admin = User::where('role', 'admin')->first();
    $expense = Expense::first();
    $expenseId = $expense->id;

    $response = $this->actingAs($admin)->delete(route('admin.expenses.destroy', $expenseId));
    $response->assertRedirect();

    $this->assertDatabaseMissing('expenses', ['id' => $expenseId]);
});

test('staff can record a new income', function () {
    $admin = User::where('role', 'admin')->first();

    $response = $this->actingAs($admin)->post(route('admin.incomes.store'), [
        'category' => 'penjualan_barang',
        'title' => 'Penjualan 5 Gas Portabel & 2 Jas Hujan',
        'amount' => 115000,
        'income_date' => now()->toDateString(),
        'payment_method' => 'cash',
        'payment_status' => 'received',
        'notes' => 'Penjualan langsung di toko',
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $this->assertDatabaseHas('incomes', [
        'title' => 'Penjualan 5 Gas Portabel & 2 Jas Hujan',
        'amount' => 115000.00,
        'category' => 'penjualan_barang',
        'payment_status' => 'received',
    ]);
});

test('staff can update an existing income', function () {
    $admin = User::where('role', 'admin')->first();
    $income = Income::first();

    $response = $this->actingAs($admin)->put(route('admin.incomes.update', $income->id), [
        'category' => 'jasa_layanan',
        'title' => 'Jasa Cuci Tenda Konsumen (Update)',
        'amount' => 95000,
        'income_date' => $income->income_date->toDateString(),
        'payment_method' => 'transfer',
        'payment_status' => 'received',
        'notes' => 'Catatan revisi',
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $income->refresh();
    expect($income->title)->toBe('Jasa Cuci Tenda Konsumen (Update)');
    expect((float) $income->amount)->toEqual(95000.0);
    expect($income->category)->toBe('jasa_layanan');
});

test('staff can delete an income', function () {
    $admin = User::where('role', 'admin')->first();
    $income = Income::first();
    $incomeId = $income->id;

    $response = $this->actingAs($admin)->delete(route('admin.incomes.destroy', $incomeId));
    $response->assertRedirect();

    $this->assertDatabaseMissing('incomes', ['id' => $incomeId]);
});
