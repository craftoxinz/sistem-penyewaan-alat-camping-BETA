<?php

namespace App\Http\Controllers;

use App\Http\Requests\BookingRequest;
use App\Models\Equipment;
use App\Models\Rental;
use App\Models\RentalItem;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    /**
     * Display the shopping cart / booking summary page.
     */
    public function cart(): Response
    {
        return Inertia::render('cart/index');
    }

    /**
     * Check real-time stock availability for items in the shopping cart.
     */
    public function checkCartAvailability(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'items' => ['required', 'array'],
            'items.*.equipment_id' => ['required', 'integer', 'exists:equipment,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $items = $request->input('items', []);

        $results = [];
        $allAvailable = true;

        foreach ($items as $item) {
            $equipment = Equipment::find($item['equipment_id']);
            if (! $equipment) {
                continue;
            }

            $requestedQty = (int) $item['quantity'];
            $availableStock = $equipment->getAvailableStockForDates($startDate, $endDate);
            $isAvailable = $availableStock >= $requestedQty;

            if (! $isAvailable) {
                $allAvailable = false;
            }

            $results[$equipment->id] = [
                'equipment_id' => $equipment->id,
                'name' => $equipment->name,
                'requested_quantity' => $requestedQty,
                'available_stock' => $availableStock,
                'is_available' => $isAvailable,
                'message' => $isAvailable
                    ? "Stok tersedia ({$availableStock} unit siap disewa)."
                    : ($availableStock > 0
                        ? "Hanya tersisa {$availableStock} unit untuk tanggal ini."
                        : 'Stok habis untuk tanggal ini.'),
            ];
        }

        return response()->json([
            'all_available' => $allAvailable,
            'items' => $results,
        ]);
    }

    /**
     * Store a new rental booking transaction.
     */
    public function store(BookingRequest $request): RedirectResponse
    {
        $user = $request->user();
        if ($user->isSuspended()) {
            throw ValidationException::withMessages([
                'user' => 'Akun Anda sedang ditangguhkan. Silakan hubungi admin rental untuk informasi lebih lanjut.',
            ]);
        }

        if (empty($user->phone) || empty($user->address)) {
            throw ValidationException::withMessages([
                'profile' => 'Silakan lengkapi nomor telepon dan alamat pada profil Anda sebelum melakukan pemesanan.',
            ]);
        }

        $startDate = Carbon::parse($request->input('start_date'));
        $endDate = Carbon::parse($request->input('end_date'));
        $totalDays = max(1, $startDate->diffInDays($endDate));

        $itemsData = $request->input('items');

        // Check availability and calculate totals within a database transaction
        $rental = DB::transaction(function () use ($user, $startDate, $endDate, $totalDays, $itemsData, $request) {
            $subtotalPrice = 0;
            $totalDeposit = 0;
            $preparedItems = [];

            foreach ($itemsData as $item) {
                $equipment = Equipment::findOrFail($item['equipment_id']);
                $qty = (int) $item['quantity'];

                // Overlap verification (SRS-NF-003)
                $availableStock = $equipment->getAvailableStockForDates(
                    $startDate->toDateString(),
                    $endDate->toDateString()
                );

                if ($availableStock < $qty) {
                    throw ValidationException::withMessages([
                        'items' => "Stok alat '{$equipment->name}' tidak mencukupi untuk rentang tanggal yang dipilih. Tersedia: {$availableStock} unit.",
                    ]);
                }

                $itemSubtotalPrice = $equipment->price_per_day * $qty * $totalDays;
                $itemSubtotalDeposit = $equipment->deposit_per_unit * $qty;

                $subtotalPrice += $itemSubtotalPrice;
                $totalDeposit += $itemSubtotalDeposit;

                $preparedItems[] = [
                    'equipment_id' => $equipment->id,
                    'quantity' => $qty,
                    'price_per_day' => $equipment->price_per_day,
                    'deposit_per_unit' => $equipment->deposit_per_unit,
                    'subtotal_price' => $itemSubtotalPrice,
                    'subtotal_deposit' => $itemSubtotalDeposit,
                ];
            }

            $totalPrice = $subtotalPrice + $totalDeposit;

            // Calculate DP / Full Payment amounts based on customer's choice
            $paymentType = $request->input('payment_type', 'dp'); // 'dp' or 'full'
            if ($paymentType === 'full') {
                // Full payment: customer transfers the entire total upfront (COD = 0)
                $dpAmount = $totalPrice;
                $remainingAmount = 0;
            } else {
                // Down payment: 30% of total price rounded to nearest thousand
                $dpAmount = (int) (ceil(($totalPrice * 0.3) / 1000) * 1000);
                $remainingAmount = $totalPrice - $dpAmount;
            }

            $bookingCode = 'BKG-'.Carbon::now()->format('Ymd').'-'.strtoupper(Str::random(4));
            $invoiceNumber = 'INV-'.Carbon::now()->format('Ymd').'-'.strtoupper(Str::random(4));

            $dpProofPath = null;
            $dpPaidAt = null;
            if ($request->hasFile('dp_proof')) {
                $dpProofPath = $request->file('dp_proof')->store('dp_proofs', 'public');
                $dpPaidAt = now();
            }

            $newRental = Rental::create([
                'user_id' => $user->id,
                'booking_code' => $bookingCode,
                'invoice_number' => $invoiceNumber,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'total_days' => $totalDays,
                'subtotal_price' => $subtotalPrice,
                'total_deposit' => $totalDeposit,
                'total_price' => $totalPrice,
                'dp_amount' => $dpAmount,
                'remaining_amount' => $remainingAmount,
                'payment_status' => 'pending_dp',
                'rental_status' => 'pending_dp',
                'deposit_status' => 'unpaid',
                'dp_proof_image' => $dpProofPath,
                'dp_paid_at' => $dpPaidAt,
                'customer_notes' => $request->input('customer_notes'),
            ]);

            foreach ($preparedItems as $item) {
                RentalItem::create([
                    'rental_id' => $newRental->id,
                    ...$item,
                ]);
            }

            return $newRental;
        });

        $isFullPayment = $rental->remaining_amount == 0;
        $successMessage = $isFullPayment
            ? 'Booking berhasil dibuat dengan opsi Bayar Lunas 100%! Silakan transfer ke rekening yang tertera dan unggah bukti pembayaran.'
            : 'Booking berhasil dibuat! Silakan lakukan transfer DP dan unggah bukti pembayaran.';

        return redirect()->route('bookings.show', $rental->id)->with('success', $successMessage);
    }

    /**
     * Display customer's booking transaction history (SRS-F-013).
     */
    public function myBookings(Request $request): Response
    {
        $user = $request->user();

        $query = Rental::where('user_id', $user->id)
            ->with(['items.equipment', 'reviews'])
            ->latest();

        if ($request->filled('status')) {
            $status = $request->input('status');
            // 'rescheduled' is a virtual filter: active bookings where admin_notes contain reschedule marker
            if ($status === 'rescheduled') {
                $query->whereNotIn('rental_status', ['active', 'completed', 'cancelled', 'defaulted'])
                    ->where('admin_notes', 'like', '%Jadwal sewa diperbarui%');
            } else {
                $query->where('rental_status', $status);
            }
        }

        $perPage = (int) $request->input('per_page', 5);
        if (! in_array($perPage, [5, 10, 20, 50, 100])) {
            $perPage = 5;
        }

        $rentals = $query->paginate($perPage)->withQueryString();

        return Inertia::render('bookings/index', [
            'rentals' => $rentals,
            'filters' => [
                'status' => $request->input('status', ''),
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Display the digital invoice and order details page (SRS-F-006).
     */
    public function show(Rental $rental, Request $request): Response
    {
        // Ensure user can only view their own rental unless internal staff (admin, kasir, petugas_gudang)
        if (! $request->user()->isStaff() && $rental->user_id !== $request->user()->id) {
            abort(403, 'Anda tidak berhak melihat invoice ini.');
        }

        $rental->load([
            'user',
            'items.equipment.category',
            'items.itemUnits.equipmentUnit',
            'reviews',
        ]);

        return Inertia::render('bookings/show', [
            'rental' => $rental,
        ]);
    }

    /**
     * Upload DP bank transfer receipt (SRS-F-015).
     */
    public function uploadDpProof(Request $request, Rental $rental): RedirectResponse
    {
        if ($rental->user_id !== $request->user()->id && ! $request->user()->isStaff()) {
            abort(403);
        }

        $request->validate([
            'dp_proof' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:3072'],
        ]);

        if ($rental->dp_proof_image) {
            Storage::disk('public')->delete($rental->dp_proof_image);
        }

        $path = $request->file('dp_proof')->store('dp_proofs', 'public');

        $rental->update([
            'dp_proof_image' => $path,
            'dp_paid_at' => now(),
            'payment_status' => 'pending_dp',
            'rental_status' => 'pending_dp',
        ]);

        return back()->with('success', 'Bukti transfer DP berhasil diunggah dan sedang menunggu verifikasi admin.');
    }
}
