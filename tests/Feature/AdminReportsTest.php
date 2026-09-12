<?php

use App\Models\User;
use Database\Seeders\CampingRentalSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(CampingRentalSeeder::class);
});

test('non-admin user is forbidden from accessing all report endpoints', function () {
    $customer = User::where('role', 'customer')->first();

    $this->actingAs($customer)->get(route('admin.reports.revenue'))->assertForbidden();
    $this->actingAs($customer)->get(route('admin.reports.top_equipment'))->assertForbidden();
    $this->actingAs($customer)->get(route('admin.reports.payments'))->assertForbidden();
    $this->actingAs($customer)->get(route('admin.reports.inventory'))->assertForbidden();
    $this->actingAs($customer)->get(route('admin.reports.customers'))->assertForbidden();
});

test('admin accessing base reports index redirects to revenue report', function () {
    $admin = User::where('role', 'admin')->first();

    $response = $this->actingAs($admin)->get(route('admin.reports.index'));
    $response->assertRedirect(route('admin.reports.revenue'));
});

test('admin can view revenue report with daily and monthly aggregations (SRS-F-012)', function () {
    $admin = User::where('role', 'admin')->first();

    $response = $this->actingAs($admin)->get(route('admin.reports.revenue'));
    $response->assertOk();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/reports/revenue')
        ->has('dailyRevenue')
        ->has('monthlyRevenue')
        ->has('summaryTotals', fn (Assert $summary) => $summary
            ->has('totalDpInflow')
            ->has('totalCodInflow')
            ->has('totalFineInflow')
            ->has('totalForfeitedInflow')
            ->has('totalInflow')
            ->has('totalRefundOutflow')
            ->has('netCashFlow')
            ->has('codOutstandingAmount')
            ->has('codOutstandingCount')
            ->has('fineOutstandingAmount')
            ->has('fineOutstandingCount')
            ->has('depositHeldAmount')
            ->has('depositHeldCount')
            ->has('dpTransactionCount')
            ->has('codTransactionCount')
            ->etc()
        )
        ->has('filters')
    );
});

test('admin can view top equipment report with category filter and ranking (SRS-F-012, SRS-F-014)', function () {
    $admin = User::where('role', 'admin')->first();

    $response = $this->actingAs($admin)->get(route('admin.reports.top_equipment'));
    $response->assertOk();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/reports/top-equipment')
        ->has('rankedEquipment')
        ->has('lowDemandEquipment')
        ->has('categoriesShare')
        ->has('categories')
        ->has('filters')
    );
});

test('admin can view payment status report and pending DP queue (SRS-F-016)', function () {
    $admin = User::where('role', 'admin')->first();

    $response = $this->actingAs($admin)->get(route('admin.reports.payments'));
    $response->assertOk();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/reports/payments')
        ->has('pendingDpRentals')
        ->has('transactions')
        ->has('paymentMetrics', fn (Assert $metrics) => $metrics
            ->has('pendingDpCount')
            ->has('verifiedDpTotal')
            ->has('codPaidTotal')
            ->has('depositHeldTotal')
            ->has('statusCounts')
            ->etc()
        )
        ->has('filters')
    );
});

test('admin can view unit utilization and health report with anomaly detection (SRS-NF-008, SRS-F-011)', function () {
    $admin = User::where('role', 'admin')->first();

    $response = $this->actingAs($admin)->get(route('admin.reports.inventory'));
    $response->assertOk();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/reports/inventory')
        ->has('conditionSummary', fn (Assert $cond) => $cond
            ->has('baik')
            ->has('butuh_perbaikan')
            ->has('rusak')
        )
        ->has('statusSummary', fn (Assert $stat) => $stat
            ->has('tersedia')
            ->has('disewa')
            ->has('maintenance')
            ->has('afkir')
        )
        ->has('unitFatigueList')
        ->has('anomalies')
        ->has('equipmentUtilization')
        ->has('recentMaintenanceLogs')
        ->has('totalUnitsCount')
    );
});

test('admin can view customer history report with LTV and repeat order statistics', function () {
    $admin = User::where('role', 'admin')->first();

    $response = $this->actingAs($admin)->get(route('admin.reports.customers'));
    $response->assertOk();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/reports/customers')
        ->has('customers')
        ->has('metrics', fn (Assert $metrics) => $metrics
            ->has('totalCustomers')
            ->has('repeatCustomersCount')
            ->has('repeatRate')
            ->has('totalCustomerSpend')
            ->has('averageLtv')
        )
        ->has('filters')
    );
});
