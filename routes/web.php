<?php

use App\Http\Controllers\Admin\BrandController as AdminBrandController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\EquipmentController as AdminEquipmentController;
use App\Http\Controllers\Admin\EquipmentUnitController as AdminEquipmentUnitController;
use App\Http\Controllers\Admin\ExpenseController as AdminExpenseController;
use App\Http\Controllers\Admin\FineController as AdminFineController;
use App\Http\Controllers\Admin\IncomeController as AdminIncomeController;
use App\Http\Controllers\Admin\InventoryLogController as AdminInventoryLogController;
use App\Http\Controllers\Admin\RentalOrderController as AdminRentalOrderController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\ReviewController as AdminReviewController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\ReviewController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public Catalog & Availability Routes (SRS-F-001, SRS-F-004)
Route::get('/', [CatalogController::class, 'index'])->name('home');
Route::get('/catalog/{equipment:slug}', [CatalogController::class, 'show'])->name('catalog.show');
Route::get('/catalog/{equipment:slug}/availability', [CatalogController::class, 'checkAvailability'])->name('catalog.availability');
Route::get('/cart', [BookingController::class, 'cart'])->name('cart.index');
Route::post('/cart/check-availability', [BookingController::class, 'checkCartAvailability'])->name('cart.check_availability');

// Authenticated Customer & Universal Routes (SRS-F-002, SRS-F-005, SRS-F-006, SRS-F-013, SRS-F-014, SRS-F-015)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function (Request $request) {
        if ($request->user()->isStaff()) {
            return redirect()->route('admin.dashboard');
        }

        return redirect()->route('bookings.index');
    })->name('dashboard');

    Route::get('/bookings', [BookingController::class, 'myBookings'])->name('bookings.index');
    Route::post('/bookings', [BookingController::class, 'store'])->name('bookings.store');
    Route::get('/bookings/{rental}', [BookingController::class, 'show'])->name('bookings.show');
    Route::post('/bookings/{rental}/dp-proof', [BookingController::class, 'uploadDpProof'])->name('bookings.dp_proof');
    Route::post('/reviews', [ReviewController::class, 'store'])->name('reviews.store');
});

// Internal Staff Panel Routes (Admin, Kasir, Petugas Gudang)
Route::middleware(['auth', 'verified', 'staff'])->prefix('admin')->name('admin.')->group(function () {
    // 1. Shared / Operational Dashboard
    Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard.index');

    // 2. Shared Rentals, Fines, & Equipment Catalog
    Route::get('/rentals', [AdminRentalOrderController::class, 'index'])->name('rentals.index');
    Route::post('/rentals/{rental}/verify-dp', [AdminRentalOrderController::class, 'verifyDp'])->name('rentals.verify_dp');
    Route::post('/rentals/{rental}/handover', [AdminRentalOrderController::class, 'handover'])->name('rentals.handover');
    Route::post('/rentals/{rental}/return', [AdminRentalOrderController::class, 'returnOrder'])->name('rentals.return');
    Route::post('/rentals/{rental}/defaulted', [AdminRentalOrderController::class, 'markAsDefaulted'])->name('rentals.defaulted');
    Route::post('/rentals/{rental}/reschedule', [AdminRentalOrderController::class, 'reschedule'])->name('rentals.reschedule');
    Route::post('/rentals/{rental}/cancel', [AdminRentalOrderController::class, 'cancelOrder'])->name('rentals.cancel');

    Route::get('/fines', [AdminFineController::class, 'index'])->name('fines.index');
    Route::post('/fines/{rental}/settle', [AdminFineController::class, 'settle'])->name('fines.settle');

    Route::resource('equipment', AdminEquipmentController::class)->names('equipment');
    Route::get('/reports/top-equipment', [AdminReportController::class, 'topEquipment'])->name('reports.top_equipment');

    // 3. Warehouse Staff & Admin Exclusive Routes (Logistik & Unit Fisik)
    Route::middleware(['role:admin,petugas_gudang'])->group(function () {
        Route::resource('categories', AdminCategoryController::class)->only(['index', 'store', 'update', 'destroy'])->names('categories');
        Route::resource('brands', AdminBrandController::class)->only(['index', 'store', 'update', 'destroy'])->names('brands');
        Route::get('/units/scan-lookup', [AdminEquipmentUnitController::class, 'scanLookup'])->name('units.scan_lookup');
        Route::resource('units', AdminEquipmentUnitController::class)->only(['index', 'store', 'update', 'destroy'])->names('units');
        Route::get('/inventory-logs', [AdminInventoryLogController::class, 'index'])->name('inventory_logs.index');
        Route::post('/inventory-logs', [AdminInventoryLogController::class, 'store'])->name('inventory_logs.store');
        Route::get('/reports/inventory', [AdminReportController::class, 'inventory'])->name('reports.inventory');
    });

    // 4. Cashier & Admin Exclusive Routes (Finansial, Omset & Kasir)
    Route::middleware(['role:admin,kasir'])->group(function () {
        Route::get('/reports/revenue', [AdminReportController::class, 'revenue'])->name('reports.revenue');
        Route::get('/reports/payments', [AdminReportController::class, 'payments'])->name('reports.payments');
        Route::get('/reports/customers', [AdminReportController::class, 'customers'])->name('reports.customers');
        Route::post('/expenses', [AdminExpenseController::class, 'store'])->name('expenses.store');
        Route::put('/expenses/{expense}', [AdminExpenseController::class, 'update'])->name('expenses.update');
        Route::delete('/expenses/{expense}', [AdminExpenseController::class, 'destroy'])->name('expenses.destroy');
        Route::post('/incomes', [AdminIncomeController::class, 'store'])->name('incomes.store');
        Route::put('/incomes/{income}', [AdminIncomeController::class, 'update'])->name('incomes.update');
        Route::delete('/incomes/{income}', [AdminIncomeController::class, 'destroy'])->name('incomes.destroy');
    });

    // 5. Administrator Exclusive Routes (Kelola Pengguna & Moderasi Ulasan)
    Route::middleware(['admin'])->group(function () {
        Route::resource('users', AdminUserController::class)->only(['index', 'store', 'update', 'destroy'])->names('users');
        Route::get('/reviews', [AdminReviewController::class, 'index'])->name('reviews.index');
        Route::patch('/reviews/{review}/toggle-visibility', [AdminReviewController::class, 'toggleVisibility'])->name('reviews.toggle_visibility');
        Route::delete('/reviews/{review}', [AdminReviewController::class, 'destroy'])->name('reviews.destroy');
    });

    // Reports index redirect helper
    Route::get('/reports', function (Request $request) {
        if ($request->user()->isPetugasGudang()) {
            return redirect()->route('admin.reports.inventory');
        }

        return redirect()->route('admin.reports.revenue');
    })->name('reports.index');
});

require __DIR__.'/settings.php';
