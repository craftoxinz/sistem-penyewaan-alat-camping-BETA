<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Equipment;
use App\Models\EquipmentUnit;
use App\Models\Expense;
use App\Models\Income;
use App\Models\Rental;
use App\Models\UnitLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * Redirect to the primary revenue report.
     */
    public function index(): RedirectResponse
    {
        return redirect()->route('admin.reports.revenue');
    }

    /**
     * 1. Laporan Keuangan Sederhana (Simple Financial Summary Report) - SRS-F-012
     *
     * Rekapitulasi keuangan sederhana berdasarkan tanggal transaksi penerimaan kasir/bank:
     *
     * Komponen:
     *  - Penerimaan Pendapatan : DP terverifikasi, pelunasan sewa di toko, denda diterima, deposit forfeited
     *  - Pengembalian Deposit  : Refund dana jaminan saat unit kembali aman & lengkap
     *  - Deposit Jaminan Aktif : Dana titipan pesanan aktif yang sedang berjalan
     *  - Piutang               : Pelunasan COD belum serah terima + denda belum diselesaikan
     */
    public function revenue(Request $request): Response
    {
        $startDate = $request->input('start_date', Carbon::today()->subDays(30)->toDateString());
        $endDate = $request->input('end_date', Carbon::today()->toDateString());

        $parsedStart = Carbon::parse($startDate)->startOfDay();
        $parsedEnd = Carbon::parse($endDate)->endOfDay();

        // === 1. BEBAN OPERASIONAL (EXPENSES) ===
        $allExpenses = Expense::with('user')
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->orderByDesc('expense_date')
            ->get();

        $paidExpenses = $allExpenses->where('payment_status', 'paid');
        $unpaidExpenses = $allExpenses->where('payment_status', 'unpaid');

        $totalExpenses = (float) $allExpenses->sum('amount');
        $totalPaidExpenses = (float) $paidExpenses->sum('amount');
        $totalUnpaidExpenses = (float) $unpaidExpenses->sum('amount');

        $expenseCategories = [
            'pemeliharaan_alat' => (float) $allExpenses->where('category', 'pemeliharaan_alat')->sum('amount'),
            'perlengkapan_alat' => (float) $allExpenses->where('category', 'perlengkapan_alat')->sum('amount'),
            'operasional_toko' => (float) $allExpenses->where('category', 'operasional_toko')->sum('amount'),
            'gaji_karyawan' => (float) $allExpenses->where('category', 'gaji_karyawan')->sum('amount'),
            'lain_lain' => (float) $allExpenses->where('category', 'lain_lain')->sum('amount'),
        ];

        $expensesList = $allExpenses->map(function ($e) {
            return [
                'id' => $e->id,
                'expense_number' => $e->expense_number,
                'category' => $e->category,
                'title' => $e->title,
                'amount' => (float) $e->amount,
                'expense_date' => $e->expense_date?->format('Y-m-d'),
                'payment_method' => $e->payment_method,
                'payment_status' => $e->payment_status,
                'notes' => $e->notes,
                'user_name' => $e->user?->name ?? 'Admin',
                'created_at' => $e->created_at?->toIso8601String(),
            ];
        })->values();

        // === 1.1 PENDAPATAN LAIN (OTHER INCOMES) ===
        $allIncomes = Income::with('user')
            ->whereBetween('income_date', [$startDate, $endDate])
            ->orderByDesc('income_date')
            ->get();

        $receivedIncomes = $allIncomes->where('payment_status', 'received');
        $pendingIncomes = $allIncomes->where('payment_status', 'pending');

        $totalIncomes = (float) $allIncomes->sum('amount');
        $totalReceivedIncomes = (float) $receivedIncomes->sum('amount');
        $totalPendingIncomes = (float) $pendingIncomes->sum('amount');

        $incomeCategories = [
            'penjualan_barang' => (float) $allIncomes->where('category', 'penjualan_barang')->sum('amount'),
            'jasa_layanan' => (float) $allIncomes->where('category', 'jasa_layanan')->sum('amount'),
            'modal_tambahan' => (float) $allIncomes->where('category', 'modal_tambahan')->sum('amount'),
            'pendapatan_bunga' => (float) $allIncomes->where('category', 'pendapatan_bunga')->sum('amount'),
            'klaim_kompensasi' => (float) $allIncomes->where('category', 'klaim_kompensasi')->sum('amount'),
            'lain_lain' => (float) $allIncomes->where('category', 'lain_lain')->sum('amount'),
        ];

        // Breakdown omset operasional non-sewa vs modal tambahan vs non-operasional
        $otherOperatingRevenue = (float) $receivedIncomes->whereIn('category', ['penjualan_barang', 'jasa_layanan'])->sum('amount');
        $nonOperatingRevenue = (float) $receivedIncomes->whereIn('category', ['pendapatan_bunga', 'klaim_kompensasi', 'lain_lain'])->sum('amount');
        $capitalInflow = (float) $receivedIncomes->where('category', 'modal_tambahan')->sum('amount');

        $incomesList = $allIncomes->map(function ($inc) {
            return [
                'id' => $inc->id,
                'income_number' => $inc->income_number,
                'category' => $inc->category,
                'title' => $inc->title,
                'amount' => (float) $inc->amount,
                'income_date' => $inc->income_date?->format('Y-m-d'),
                'payment_method' => $inc->payment_method,
                'payment_status' => $inc->payment_status,
                'notes' => $inc->notes,
                'user_name' => $inc->user?->name ?? 'Kasir / Toko',
                'created_at' => $inc->created_at?->toIso8601String(),
            ];
        })->values();

        // === 2. KAS MASUK (INFLOW) ===
        // DP masuk: berdasarkan tanggal verifikasi kasir
        $dpInflowRentals = Rental::with('user')
            ->whereBetween('dp_verified_at', [$parsedStart, $parsedEnd])
            ->whereNotNull('dp_verified_at')
            ->get();

        // COD masuk: berdasarkan tanggal pelunasan kasir
        $codInflowRentals = Rental::with('user')
            ->whereBetween('cod_paid_at', [$parsedStart, $parsedEnd])
            ->whereNotNull('cod_paid_at')
            ->get();

        // Denda dibayar tunai langsung di kasir
        $fineInflowRentals = Rental::with('user')
            ->whereBetween('returned_at', [$parsedStart, $parsedEnd])
            ->where('fine_payment_status', 'paid_extra_cash')
            ->whereNotNull('returned_at')
            ->get();

        // Deposit forfeited / disita toko (kompensasi kerusakan/kabur)
        $forfeitedRentals = Rental::with('user')
            ->whereBetween('returned_at', [$parsedStart, $parsedEnd])
            ->where('deposit_status', 'forfeited')
            ->whereNotNull('returned_at')
            ->get();

        // Rentals yang dikembalikan pada periode ini (untuk analisis denda & deposit)
        $returnedRentalsInPeriod = Rental::with('user')
            ->whereBetween('returned_at', [$parsedStart, $parsedEnd])
            ->whereNotNull('returned_at')
            ->get();

        // === 3. KAS KELUAR (OUTFLOW) ===
        // Refund deposit dikembalikan ke pelanggan
        $refundRentals = Rental::with('user')
            ->whereBetween('returned_at', [$parsedStart, $parsedEnd])
            ->where('deposit_status', 'refunded')
            ->whereNotNull('returned_at')
            ->get();

        // === 4. HITUNG AGREGASI KEUANGAN ===
        $totalDpInflow = (float) $dpInflowRentals->sum('dp_amount');
        $totalCodInflow = (float) $codInflowRentals->sum('remaining_amount');
        $totalFineInflow = (float) $fineInflowRentals->sum('additional_charge_paid');
        $totalForfeitedInflow = (float) $forfeitedRentals->sum(
            fn ($r) => max(0, (float) $r->total_deposit - (float) $r->deposit_refund_amount)
        );

        // Kas Masuk Riil (Uang Tunai / Transfer Masuk) = DP + COD + Denda Tunai + Pendapatan Lain Diterima
        $totalCashIn = $totalDpInflow + $totalCodInflow + $totalFineInflow + $totalReceivedIncomes;

        // Total Inflow gabungan (termasuk klaim deposit & pendapatan lain)
        $totalInflow = $totalDpInflow + $totalCodInflow + $totalFineInflow + $totalForfeitedInflow + $totalReceivedIncomes;

        // Kas Keluar Riil = Refund Jaminan + Beban Operasional Terbayar
        $totalRefundOutflow = (float) $refundRentals->sum('deposit_refund_amount');
        $totalCashOut = $totalRefundOutflow + $totalPaidExpenses;

        // Arus Kas Bersih (Net Cash Flow)
        $netCashFlow = $totalCashIn - $totalCashOut;

        // Pendapatan Pokok Sewa (Rental Gross Revenue)
        $rentalGrossRevenue = $totalDpInflow + $totalCodInflow + $totalFineInflow + $totalForfeitedInflow;

        // Pendapatan Kotor Usaha (Gross Revenue) = Sewa + Pendapatan Operasional Lainnya + Pendapatan Non-Operasional Lainnya
        $grossRevenue = $rentalGrossRevenue + $otherOperatingRevenue + $nonOperatingRevenue;

        // Laba / (Rugi) Bersih Usaha (Net Profit) = Gross Revenue - Total Beban Usaha
        $netProfit = $grossRevenue - $totalExpenses;
        $profitMargin = $grossRevenue > 0 ? round(($netProfit / $grossRevenue) * 100, 1) : 0;

        // === 5. ANALISIS DEPOSIT & DENDA ===
        $totalFineCharged = (float) $returnedRentalsInPeriod->sum('total_fine');
        $fineSettledFromDeposit = (float) $returnedRentalsInPeriod->sum(function ($r) {
            if ($r->fine_payment_status === 'settled_from_deposit') {
                return (float) $r->total_fine;
            }
            if ($r->fine_payment_status === 'paid_extra_cash') {
                return max(0, (float) $r->total_deposit - (float) $r->deposit_refund_amount);
            }

            return 0.0;
        });
        $pureForfeitedInflow = max(0, $totalForfeitedInflow - $fineSettledFromDeposit);
        $totalFineReceived = $totalFineInflow + $fineSettledFromDeposit;

        // === 6. PIUTANG & HUTANG USAHA ===
        // Piutang COD belum serah terima
        $codOutstandingRentals = Rental::whereNull('cod_paid_at')
            ->whereIn('rental_status', ['confirmed', 'ready_pickup', 'active'])
            ->where('payment_status', 'dp_verified')
            ->get();

        // Piutang Denda belum lunas
        $fineOutstandingRentals = Rental::where('total_fine', '>', 0)
            ->where(fn ($q) => $q->whereNull('fine_payment_status')
                ->orWhere('fine_payment_status', '!=', 'paid_extra_cash'))
            ->whereIn('rental_status', ['completed', 'defaulted'])
            ->get();

        // Deposit yang masih dipegang toko (pesanan aktif - Liabilitas/Hutang jaminan)
        $depositHeldRentals = Rental::where('deposit_status', 'held')
            ->whereIn('rental_status', ['confirmed', 'ready_pickup', 'active'])
            ->get();

        $codOutstandingAmount = (float) $codOutstandingRentals->sum('remaining_amount');
        $fineOutstandingAmount = (float) $fineOutstandingRentals->sum(
            fn ($r) => max(0, (float) $r->total_fine - (float) $r->additional_charge_paid)
        );
        $depositHeldAmount = (float) $depositHeldRentals->sum('total_deposit');

        $totalReceivables = $codOutstandingAmount + $fineOutstandingAmount + $totalPendingIncomes;
        $totalPayables = $depositHeldAmount + $totalUnpaidExpenses;

        // === 7. LOG MUTASI ARUS KAS KRONOLOGIS (CASH FLOW LOGS) ===
        $cashLogs = collect();

        foreach ($dpInflowRentals as $r) {
            $cashLogs->push([
                'id' => 'dp-'.$r->id,
                'datetime' => $r->dp_verified_at->toIso8601String(),
                'date' => $r->dp_verified_at->format('Y-m-d'),
                'type' => 'cash_in',
                'category' => 'dp_rental',
                'category_label' => 'Uang Muka (DP)',
                'reference_code' => $r->booking_code,
                'invoice_number' => $r->invoice_number,
                'description' => 'Penerimaan DP Sewa: '.$r->invoice_number,
                'party_name' => $r->user?->name ?? 'Pelanggan',
                'amount' => (float) $r->dp_amount,
                'payment_method' => 'Transfer Bank',
            ]);
        }

        foreach ($codInflowRentals as $r) {
            $cashLogs->push([
                'id' => 'cod-'.$r->id,
                'datetime' => $r->cod_paid_at->toIso8601String(),
                'date' => $r->cod_paid_at->format('Y-m-d'),
                'type' => 'cash_in',
                'category' => 'cod_rental',
                'category_label' => 'Pelunasan Sewa (COD)',
                'reference_code' => $r->booking_code,
                'invoice_number' => $r->invoice_number,
                'description' => 'Pelunasan Sewa di Toko: '.$r->invoice_number,
                'party_name' => $r->user?->name ?? 'Pelanggan',
                'amount' => (float) $r->remaining_amount,
                'payment_method' => 'Tunai Kasir',
            ]);
        }

        foreach ($fineInflowRentals as $r) {
            if ((float) $r->additional_charge_paid > 0) {
                $cashLogs->push([
                    'id' => 'fine-'.$r->id,
                    'datetime' => $r->returned_at->toIso8601String(),
                    'date' => $r->returned_at->format('Y-m-d'),
                    'type' => 'cash_in',
                    'category' => 'fine_cash',
                    'category_label' => 'Denda Tunai',
                    'reference_code' => $r->booking_code,
                    'invoice_number' => $r->invoice_number,
                    'description' => 'Pembayaran Denda Tambahan: '.$r->invoice_number,
                    'party_name' => $r->user?->name ?? 'Pelanggan',
                    'amount' => (float) $r->additional_charge_paid,
                    'payment_method' => 'Tunai Kasir',
                ]);
            }
        }

        foreach ($refundRentals as $r) {
            if ((float) $r->deposit_refund_amount > 0) {
                $cashLogs->push([
                    'id' => 'refund-'.$r->id,
                    'datetime' => $r->returned_at->toIso8601String(),
                    'date' => $r->returned_at->format('Y-m-d'),
                    'type' => 'cash_out',
                    'category' => 'deposit_refund',
                    'category_label' => 'Refund Jaminan',
                    'reference_code' => $r->booking_code,
                    'invoice_number' => $r->invoice_number,
                    'description' => 'Pengembalian Deposit Jaminan: '.$r->invoice_number,
                    'party_name' => $r->user?->name ?? 'Pelanggan',
                    'amount' => (float) $r->deposit_refund_amount,
                    'payment_method' => 'Tunai / Transfer',
                ]);
            }
        }

        foreach ($paidExpenses as $e) {
            $catLabel = match ($e->category) {
                'pemeliharaan_alat' => 'Pemeliharaan Alat',
                'perlengkapan_alat' => 'Perlengkapan Alat',
                'operasional_toko' => 'Operasional Toko',
                'gaji_karyawan' => 'Upah / Karyawan',
                default => 'Beban Lainnya',
            };

            $cashLogs->push([
                'id' => 'exp-'.$e->id,
                'datetime' => Carbon::parse($e->expense_date)->startOfDay()->toIso8601String(),
                'date' => $e->expense_date?->format('Y-m-d'),
                'type' => 'cash_out',
                'category' => 'expense_'.$e->category,
                'category_label' => 'Beban: '.$catLabel,
                'reference_code' => $e->expense_number,
                'invoice_number' => $e->expense_number,
                'description' => $e->title,
                'party_name' => $e->user?->name ?? 'Kasir / Toko',
                'amount' => (float) $e->amount,
                'payment_method' => $e->payment_method === 'cash' ? 'Tunai Kasir' : 'Transfer Bank',
            ]);
        }

        foreach ($receivedIncomes as $inc) {
            $catLabel = match ($inc->category) {
                'penjualan_barang' => 'Penjualan Retail',
                'jasa_layanan' => 'Jasa Layanan',
                'modal_tambahan' => 'Modal Tambahan',
                'pendapatan_bunga' => 'Pendapatan Bunga',
                'klaim_kompensasi' => 'Klaim Kompensasi',
                default => 'Pendapatan Lain',
            };

            $cashLogs->push([
                'id' => 'inc-'.$inc->id,
                'datetime' => Carbon::parse($inc->income_date)->startOfDay()->toIso8601String(),
                'date' => $inc->income_date?->format('Y-m-d'),
                'type' => 'cash_in',
                'category' => 'income_'.$inc->category,
                'category_label' => 'Masuk: '.$catLabel,
                'reference_code' => $inc->income_number,
                'invoice_number' => $inc->income_number,
                'description' => $inc->title,
                'party_name' => $inc->user?->name ?? 'Kasir / Toko',
                'amount' => (float) $inc->amount,
                'payment_method' => $inc->payment_method === 'cash' ? 'Tunai Kasir' : 'Transfer Bank',
            ]);
        }

        $cashLogs = $cashLogs->sortByDesc('datetime')->values();

        // === 8. RINCIAN HARIAN ===
        $dailyMap = [];

        foreach ($dpInflowRentals as $r) {
            $date = $r->dp_verified_at->format('Y-m-d');
            $dailyMap[$date]['dp_inflow'] = ($dailyMap[$date]['dp_inflow'] ?? 0.0) + (float) $r->dp_amount;
            $dailyMap[$date]['dp_count'] = ($dailyMap[$date]['dp_count'] ?? 0) + 1;
        }
        foreach ($codInflowRentals as $r) {
            $date = $r->cod_paid_at->format('Y-m-d');
            $dailyMap[$date]['cod_inflow'] = ($dailyMap[$date]['cod_inflow'] ?? 0.0) + (float) $r->remaining_amount;
            $dailyMap[$date]['cod_count'] = ($dailyMap[$date]['cod_count'] ?? 0) + 1;
        }
        foreach ($fineInflowRentals as $r) {
            $date = $r->returned_at->format('Y-m-d');
            $dailyMap[$date]['fine_inflow'] = ($dailyMap[$date]['fine_inflow'] ?? 0.0) + (float) $r->additional_charge_paid;
        }
        foreach ($forfeitedRentals as $r) {
            $date = $r->returned_at->format('Y-m-d');
            $forfeited = max(0, (float) $r->total_deposit - (float) $r->deposit_refund_amount);
            $dailyMap[$date]['forfeited_inflow'] = ($dailyMap[$date]['forfeited_inflow'] ?? 0.0) + $forfeited;
        }
        foreach ($refundRentals as $r) {
            $date = $r->returned_at->format('Y-m-d');
            $dailyMap[$date]['refund_outflow'] = ($dailyMap[$date]['refund_outflow'] ?? 0.0) + (float) $r->deposit_refund_amount;
        }
        foreach ($paidExpenses as $e) {
            $date = $e->expense_date?->format('Y-m-d');
            if ($date) {
                $dailyMap[$date]['expense_outflow'] = ($dailyMap[$date]['expense_outflow'] ?? 0.0) + (float) $e->amount;
            }
        }
        foreach ($receivedIncomes as $inc) {
            $date = $inc->income_date?->format('Y-m-d');
            if ($date) {
                $dailyMap[$date]['other_income_inflow'] = ($dailyMap[$date]['other_income_inflow'] ?? 0.0) + (float) $inc->amount;
                $dailyMap[$date]['other_income_count'] = ($dailyMap[$date]['other_income_count'] ?? 0) + 1;
            }
        }

        $dailyRevenue = collect($dailyMap)->map(function ($data, $date) {
            $dpIn = $data['dp_inflow'] ?? 0.0;
            $codIn = $data['cod_inflow'] ?? 0.0;
            $fineIn = $data['fine_inflow'] ?? 0.0;
            $forfeitedIn = $data['forfeited_inflow'] ?? 0.0;
            $otherIn = $data['other_income_inflow'] ?? 0.0;
            $refundOut = $data['refund_outflow'] ?? 0.0;
            $expenseOut = $data['expense_outflow'] ?? 0.0;

            $totalIn = $dpIn + $codIn + $fineIn + $forfeitedIn + $otherIn;
            $cashIn = $dpIn + $codIn + $fineIn + $otherIn;
            $cashOut = $refundOut + $expenseOut;

            return [
                'date' => $date,
                'dp_count' => $data['dp_count'] ?? 0,
                'cod_count' => $data['cod_count'] ?? 0,
                'other_income_count' => $data['other_income_count'] ?? 0,
                'dp_inflow' => $dpIn,
                'cod_inflow' => $codIn,
                'fine_inflow' => $fineIn,
                'forfeited_inflow' => $forfeitedIn,
                'other_income_inflow' => $otherIn,
                'total_inflow' => $totalIn,
                'cash_in' => $cashIn,
                'refund_outflow' => $refundOut,
                'expense_outflow' => $expenseOut,
                'total_outflow' => $cashOut,
                'net_cash' => $cashIn - $cashOut,
                'gross_revenue' => $totalIn,
                'net_profit' => $totalIn - $expenseOut,
            ];
        })->sortByDesc('date')->values();

        // === 9. TREN BULANAN TAHUN INI ===
        $currentYear = Carbon::today()->year;

        $monthlyDpRentals = Rental::whereYear('dp_verified_at', $currentYear)
            ->whereNotNull('dp_verified_at')->get();
        $monthlyCodRentals = Rental::whereYear('cod_paid_at', $currentYear)
            ->whereNotNull('cod_paid_at')->get();
        $monthlyFineRentals = Rental::whereYear('returned_at', $currentYear)
            ->where('fine_payment_status', 'paid_extra_cash')
            ->whereNotNull('returned_at')->get();
        $monthlyForfeitedRentals = Rental::whereYear('returned_at', $currentYear)
            ->where('deposit_status', 'forfeited')
            ->whereNotNull('returned_at')->get();
        $monthlyRefundRentals = Rental::whereYear('returned_at', $currentYear)
            ->where('deposit_status', 'refunded')
            ->whereNotNull('returned_at')->get();
        $monthlyExpenses = Expense::whereYear('expense_date', $currentYear)
            ->where('payment_status', 'paid')
            ->get();
        $monthlyIncomes = Income::whereYear('income_date', $currentYear)
            ->where('payment_status', 'received')
            ->get();

        $monthlyMap = [];
        foreach ($monthlyDpRentals as $r) {
            $m = (int) $r->dp_verified_at->format('n');
            $monthlyMap[$m]['dp_inflow'] = ($monthlyMap[$m]['dp_inflow'] ?? 0.0) + (float) $r->dp_amount;
        }
        foreach ($monthlyCodRentals as $r) {
            $m = (int) $r->cod_paid_at->format('n');
            $monthlyMap[$m]['cod_inflow'] = ($monthlyMap[$m]['cod_inflow'] ?? 0.0) + (float) $r->remaining_amount;
        }
        foreach ($monthlyFineRentals as $r) {
            $m = (int) $r->returned_at->format('n');
            $monthlyMap[$m]['fine_inflow'] = ($monthlyMap[$m]['fine_inflow'] ?? 0.0) + (float) $r->additional_charge_paid;
        }
        foreach ($monthlyForfeitedRentals as $r) {
            $m = (int) $r->returned_at->format('n');
            $forfeited = max(0, (float) $r->total_deposit - (float) $r->deposit_refund_amount);
            $monthlyMap[$m]['forfeited_inflow'] = ($monthlyMap[$m]['forfeited_inflow'] ?? 0.0) + $forfeited;
        }
        foreach ($monthlyRefundRentals as $r) {
            $m = (int) $r->returned_at->format('n');
            $monthlyMap[$m]['refund_outflow'] = ($monthlyMap[$m]['refund_outflow'] ?? 0.0) + (float) $r->deposit_refund_amount;
        }
        foreach ($monthlyExpenses as $e) {
            $m = (int) $e->expense_date->format('n');
            $monthlyMap[$m]['expense_outflow'] = ($monthlyMap[$m]['expense_outflow'] ?? 0.0) + (float) $e->amount;
        }
        foreach ($monthlyIncomes as $inc) {
            $m = (int) $inc->income_date->format('n');
            $monthlyMap[$m]['other_income_inflow'] = ($monthlyMap[$m]['other_income_inflow'] ?? 0.0) + (float) $inc->amount;
        }

        $monthlyRevenue = collect(range(1, 12))->map(function ($monthNum) use ($monthlyMap, $currentYear) {
            $data = $monthlyMap[$monthNum] ?? [];
            $dpIn = $data['dp_inflow'] ?? 0.0;
            $codIn = $data['cod_inflow'] ?? 0.0;
            $fineIn = $data['fine_inflow'] ?? 0.0;
            $forfeitedIn = $data['forfeited_inflow'] ?? 0.0;
            $otherIn = $data['other_income_inflow'] ?? 0.0;
            $refundOut = $data['refund_outflow'] ?? 0.0;
            $expenseOut = $data['expense_outflow'] ?? 0.0;

            $totalIn = $dpIn + $codIn + $fineIn + $forfeitedIn + $otherIn;
            $cashIn = $dpIn + $codIn + $fineIn + $otherIn;
            $cashOut = $refundOut + $expenseOut;

            return [
                'month_number' => $monthNum,
                'month_name' => Carbon::createFromDate($currentYear, $monthNum, 1)->translatedFormat('M'),
                'dp_inflow' => $dpIn,
                'cod_inflow' => $codIn,
                'fine_inflow' => $fineIn,
                'forfeited_inflow' => $forfeitedIn,
                'other_income_inflow' => $otherIn,
                'total_inflow' => $totalIn,
                'cash_in' => $cashIn,
                'refund_outflow' => $refundOut,
                'expense_outflow' => $expenseOut,
                'total_outflow' => $cashOut,
                'net_cash' => $cashIn - $cashOut,
                'gross_revenue' => $totalIn,
                'net_profit' => $totalIn - $expenseOut,
            ];
        });

        // === 10. SUMMARY TOTALS ===
        $summaryTotals = [
            // Kas Masuk (Lengkap & Kompatibel)
            'totalDpInflow' => $totalDpInflow,
            'totalCodInflow' => $totalCodInflow,
            'totalFineInflow' => $totalFineInflow,
            'totalForfeitedInflow' => $totalForfeitedInflow,
            'totalInflow' => $totalInflow,
            'totalCashIn' => $totalCashIn,

            // Kas Keluar (Lengkap & Kompatibel)
            'totalRefundOutflow' => $totalRefundOutflow,
            'totalPaidExpenses' => $totalPaidExpenses,
            'totalUnpaidExpenses' => $totalUnpaidExpenses,
            'totalExpenses' => $totalExpenses,
            'totalCashOut' => $totalCashOut,

            // Saldo Kas & Kinerja Laba Rugi
            'netCashFlow' => $netCashFlow,
            'grossRevenue' => $grossRevenue,
            'netProfit' => $netProfit,
            'profitMargin' => $profitMargin,
            'expenseCategories' => $expenseCategories,

            // Piutang
            'codOutstandingAmount' => $codOutstandingAmount,
            'codOutstandingCount' => $codOutstandingRentals->count(),
            'fineOutstandingAmount' => $fineOutstandingAmount,
            'fineOutstandingCount' => $fineOutstandingRentals->count(),
            'totalReceivables' => $totalReceivables,

            // Hutang & Titipan
            'depositHeldAmount' => $depositHeldAmount,
            'depositHeldCount' => $depositHeldRentals->count(),
            'totalPayables' => $totalPayables,

            // Analisis Denda & Deposit
            'totalFineCharged' => $totalFineCharged,
            'fineSettledFromDeposit' => $fineSettledFromDeposit,
            'pureForfeitedInflow' => $pureForfeitedInflow,
            'totalFineReceived' => $totalFineReceived,

            // Metadata & Counts
            'dpTransactionCount' => $dpInflowRentals->count(),
            'codTransactionCount' => $codInflowRentals->count(),
            'cashLogsCount' => $cashLogs->count(),
            'expensesCount' => $allExpenses->count(),
            'incomesCount' => $allIncomes->count(),

            // Pendapatan Lain (Incomes Breakdown)
            'totalIncomes' => $totalIncomes,
            'totalReceivedIncomes' => $totalReceivedIncomes,
            'totalPendingIncomes' => $totalPendingIncomes,
            'otherOperatingRevenue' => $otherOperatingRevenue,
            'nonOperatingRevenue' => $nonOperatingRevenue,
            'capitalInflow' => $capitalInflow,
            'incomeCategories' => $incomeCategories,
            'rentalGrossRevenue' => $rentalGrossRevenue,
        ];

        return Inertia::render('admin/reports/revenue', [
            'dailyRevenue' => $dailyRevenue,
            'monthlyRevenue' => $monthlyRevenue,
            'summaryTotals' => $summaryTotals,
            'cashLogs' => $cashLogs,
            'expensesList' => $expensesList,
            'incomesList' => $incomesList,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * 2. Laporan Alat Terlaris (Best-Selling Equipment Report) - SRS-F-012 & SRS-F-014
     */
    public function topEquipment(Request $request): Response
    {
        $startDate = $request->input('start_date', Carbon::today()->subDays(30)->toDateString());
        $endDate = $request->input('end_date', Carbon::today()->toDateString());
        $categoryId = $request->input('category_id');

        $parsedStart = Carbon::parse($startDate)->startOfDay();
        $parsedEnd = Carbon::parse($endDate)->endOfDay();

        $equipmentQuery = Equipment::with(['category', 'reviews' => function ($q) {
            $q->where('is_visible', true);
        }])
            ->withCount([
                'rentalItems as period_rental_count' => function ($q) use ($parsedStart, $parsedEnd) {
                    $q->whereHas('rental', function ($rq) use ($parsedStart, $parsedEnd) {
                        $rq->whereBetween('created_at', [$parsedStart, $parsedEnd])
                            ->whereIn('payment_status', ['dp_verified', 'paid_in_full']);
                    });
                },
                'units as total_units_count',
                'units as available_units_count' => function ($q) {
                    $q->where('status', 'tersedia')->where('condition', '!=', 'rusak');
                },
            ])
            ->withSum([
                'rentalItems as period_quantity_rented' => function ($q) use ($parsedStart, $parsedEnd) {
                    $q->whereHas('rental', function ($rq) use ($parsedStart, $parsedEnd) {
                        $rq->whereBetween('created_at', [$parsedStart, $parsedEnd])
                            ->whereIn('payment_status', ['dp_verified', 'paid_in_full']);
                    });
                },
            ], 'quantity')
            ->withSum([
                'rentalItems as period_revenue_generated' => function ($q) use ($parsedStart, $parsedEnd) {
                    $q->whereHas('rental', function ($rq) use ($parsedStart, $parsedEnd) {
                        $rq->whereBetween('created_at', [$parsedStart, $parsedEnd])
                            ->whereIn('payment_status', ['dp_verified', 'paid_in_full']);
                    });
                },
            ], 'subtotal_price');

        if ($categoryId) {
            $equipmentQuery->where('category_id', $categoryId);
        }

        $allEquipment = $equipmentQuery->get()->map(function ($item) {
            $avgRating = $item->reviews->avg('rating') ?? 0;
            $reviewsCount = $item->reviews->count();

            return [
                'id' => $item->id,
                'name' => $item->name,
                'slug' => $item->slug,
                'image_url' => $item->image_url,
                'category_name' => $item->category?->name ?? 'Uncategorized',
                'price_per_day' => (float) $item->price_per_day,
                'period_rental_count' => (int) $item->period_rental_count,
                'period_quantity_rented' => (int) ($item->period_quantity_rented ?? 0),
                'period_revenue_generated' => (float) ($item->period_revenue_generated ?? 0),
                'total_units_count' => (int) $item->total_units_count,
                'available_units_count' => (int) $item->available_units_count,
                'average_rating' => round((float) $avgRating, 1),
                'reviews_count' => $reviewsCount,
            ];
        });

        // Top Ranking by Quantity Rented / Revenue
        $rankedEquipment = $allEquipment->sortByDesc('period_quantity_rented')->values();

        // Low Demand Equipment (0 or fewest rentals during the period)
        $lowDemandEquipment = $allEquipment->filter(function ($item) {
            return $item['period_quantity_rented'] <= 1;
        })->sortBy('period_quantity_rented')->values();

        // Category Share Distribution
        $categoriesShare = Category::with('equipment')->get()->map(function ($cat) use ($allEquipment) {
            $catEquipment = $allEquipment->where('category_name', $cat->name);
            $totalRevenue = $catEquipment->sum('period_revenue_generated');
            $totalQuantity = $catEquipment->sum('period_quantity_rented');

            return [
                'id' => $cat->id,
                'name' => $cat->name,
                'total_equipment' => $catEquipment->count(),
                'total_quantity_rented' => $totalQuantity,
                'total_revenue' => $totalRevenue,
            ];
        })->sortByDesc('total_revenue')->values();

        $categories = Category::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('admin/reports/top-equipment', [
            'rankedEquipment' => $rankedEquipment,
            'lowDemandEquipment' => $lowDemandEquipment,
            'categoriesShare' => $categoriesShare,
            'categories' => $categories,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'category_id' => $categoryId,
            ],
        ]);
    }

    /**
     * 3. Laporan Status Pembayaran & DP (Payment Status Report) - SRS-F-016
     */
    public function payments(Request $request): Response
    {
        $startDate = $request->input('start_date', Carbon::today()->subDays(30)->toDateString());
        $endDate = $request->input('end_date', Carbon::today()->toDateString());
        $paymentStatus = $request->input('payment_status');

        $parsedStart = Carbon::parse($startDate)->startOfDay();
        $parsedEnd = Carbon::parse($endDate)->endOfDay();

        // 1. Actionable Items: Orders with DP waiting for verification today
        $pendingDpRentals = Rental::with('user')
            ->where('rental_status', 'pending_dp')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($rental) {
                return [
                    'id' => $rental->id,
                    'booking_code' => $rental->booking_code,
                    'invoice_number' => $rental->invoice_number,
                    'customer_name' => $rental->user?->name,
                    'customer_phone' => $rental->user?->phone ?? $rental->user?->email,
                    'dp_amount' => (float) $rental->dp_amount,
                    'total_price' => (float) $rental->total_price,
                    'dp_proof_image' => $rental->dp_proof_image,
                    'created_at' => $rental->created_at->toIso8601String(),
                ];
            });

        // 2. Query filtered transactions
        $transactionsQuery = Rental::with('user')
            ->whereBetween('created_at', [$parsedStart, $parsedEnd]);

        if ($paymentStatus) {
            $transactionsQuery->where('payment_status', $paymentStatus);
        }

        $transactions = $transactionsQuery->latest()->get()->map(function ($rental) {
            return [
                'id' => $rental->id,
                'booking_code' => $rental->booking_code,
                'invoice_number' => $rental->invoice_number,
                'customer_name' => $rental->user?->name,
                'customer_phone' => $rental->user?->phone ?? $rental->user?->email,
                'start_date' => $rental->start_date?->format('Y-m-d'),
                'end_date' => $rental->end_date?->format('Y-m-d'),
                'total_price' => (float) $rental->total_price,
                'dp_amount' => (float) $rental->dp_amount,
                'remaining_amount' => (float) $rental->remaining_amount,
                'total_deposit' => (float) $rental->total_deposit,
                'deposit_refund_amount' => (float) $rental->deposit_refund_amount,
                'payment_status' => $rental->payment_status,
                'rental_status' => $rental->rental_status,
                'deposit_status' => $rental->deposit_status,
                'dp_paid_at' => $rental->dp_paid_at?->toIso8601String(),
                'dp_verified_at' => $rental->dp_verified_at?->toIso8601String(),
                'cod_paid_at' => $rental->cod_paid_at?->toIso8601String(),
                'dp_proof_image' => $rental->dp_proof_image,
                'created_at' => $rental->created_at->toIso8601String(),
            ];
        });

        // 3. Cashflow and Payment Metrics in Period
        $periodRentals = Rental::whereBetween('created_at', [$parsedStart, $parsedEnd])->get();

        $paymentMetrics = [
            'pendingDpCount' => $pendingDpRentals->count(),
            'pendingDpAmount' => (float) $pendingDpRentals->sum('dp_amount'),
            'verifiedDpTotal' => (float) $periodRentals->whereIn('payment_status', ['dp_verified', 'paid_in_full'])->sum('dp_amount'),
            'codPaidTotal' => (float) $periodRentals->filter(fn ($r) => ! is_null($r->cod_paid_at))->sum('remaining_amount'),
            'codOutstandingTotal' => (float) $periodRentals->where('rental_status', 'ready_pickup')->whereNull('cod_paid_at')->sum('remaining_amount'),
            'depositHeldTotal' => (float) $periodRentals->whereIn('rental_status', ['confirmed', 'ready_pickup', 'active'])->sum('total_deposit'),
            'depositRefundedTotal' => (float) $periodRentals->where('deposit_status', 'refunded')->sum('deposit_refund_amount'),
            'depositForfeitedTotal' => (float) $periodRentals->where('deposit_status', 'forfeited')->sum(function ($r) {
                return max(0, (float) $r->total_deposit - (float) $r->deposit_refund_amount);
            }),
            'statusCounts' => [
                'pending_dp' => $periodRentals->where('payment_status', 'pending_dp')->count(),
                'dp_verified' => $periodRentals->where('payment_status', 'dp_verified')->count(),
                'paid_in_full' => $periodRentals->where('payment_status', 'paid_in_full')->count(),
                'dp_rejected' => $periodRentals->where('payment_status', 'dp_rejected')->count(),
            ],
        ];

        return Inertia::render('admin/reports/payments', [
            'pendingDpRentals' => $pendingDpRentals,
            'transactions' => $transactions,
            'paymentMetrics' => $paymentMetrics,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'payment_status' => $paymentStatus,
            ],
        ]);
    }

    /**
     * 4. Laporan Utilisasi & Kondisi Armada (Unit Utilization & Health Report) - SRS-NF-008 & SRS-F-011
     */
    public function inventory(Request $request): Response
    {
        $allUnits = EquipmentUnit::with(['equipment.category', 'unitLogs'])->get();

        // 1. Condition & Status Distribution
        $conditionSummary = [
            'baik' => $allUnits->where('condition', 'baik')->count(),
            'butuh_perbaikan' => $allUnits->where('condition', 'butuh_perbaikan')->count(),
            'rusak' => $allUnits->where('condition', 'rusak')->count(),
        ];

        $statusSummary = [
            'tersedia' => $allUnits->where('status', 'tersedia')->count(),
            'disewa' => $allUnits->where('status', 'disewa')->count(),
            'maintenance' => $allUnits->where('status', 'maintenance')->count(),
            'afkir' => $allUnits->where('status', 'afkir')->count(),
        ];

        // 2. Unit Fatigue & Maintenance Frequency Analysis
        // Note: manual condition changes are stored with type 'condition_update' in the database.
        $unitFatigueList = $allUnits->map(function ($unit) {
            $maintenanceLogsCount = $unit->unitLogs->where('type', 'condition_update')->count();
            $repairLogsCount = $unit->unitLogs->filter(fn ($l) => in_array($l->condition_after, ['butuh_perbaikan', 'rusak']))->count();
            $totalRentalsCount = $unit->rentalItemUnits()->count();

            return [
                'id' => $unit->id,
                'unit_code' => $unit->unit_code,
                'equipment_name' => $unit->equipment?->name ?? 'Unknown',
                'category_name' => $unit->equipment?->category?->name ?? 'Uncategorized',
                'status' => $unit->status,
                'condition' => $unit->condition,
                'maintenance_count' => $maintenanceLogsCount,
                'repair_count' => $repairLogsCount,
                'total_rentals_count' => $totalRentalsCount,
                'fatigue_score' => ($maintenanceLogsCount * 2) + ($repairLogsCount * 3) + $totalRentalsCount,
                'last_log' => $unit->unitLogs->first() ? [
                    'type' => $unit->unitLogs->first()->type,
                    'condition_before' => $unit->unitLogs->first()->condition_before,
                    'condition_after' => $unit->unitLogs->first()->condition_after,
                    'notes' => $unit->unitLogs->first()->notes,
                    'created_at' => $unit->unitLogs->first()->created_at->format('Y-m-d H:i'),
                ] : null,
            ];
        })->sortByDesc('fatigue_score')->values();

        // 3. Anomaly Detection (SRS-NF-008 Consistency Verification)
        $anomalies = [];

        foreach ($allUnits as $unit) {
            // Anomaly 1: Damaged unit but marked available for rental
            if ($unit->condition === 'rusak' && $unit->status === 'tersedia') {
                $anomalies[] = [
                    'id' => $unit->id,
                    'unit_code' => $unit->unit_code,
                    'equipment_name' => $unit->equipment?->name,
                    'type' => 'critical',
                    'title' => 'Unit Rusak Namun Berstatus Tersedia',
                    'description' => "Unit berkondisi 'Rusak' namun status operasional tercatat 'Tersedia'. Berisiko disewa pelanggan.",
                    'suggested_action' => "Ubah status ke 'maintenance' atau 'afkir'.",
                ];
            }

            // Anomaly 2: Marked rented but has no active unreturned rental assignment
            if ($unit->status === 'disewa') {
                $hasActiveRental = $unit->rentalItemUnits()->whereNull('returned_at')->exists();
                if (! $hasActiveRental) {
                    $anomalies[] = [
                        'id' => $unit->id,
                        'unit_code' => $unit->unit_code,
                        'equipment_name' => $unit->equipment?->name,
                        'type' => 'warning',
                        'title' => 'Unit Berstatus Disewa Tanpa Relasi Aktif',
                        'description' => "Unit berstatus 'Disewa' tetapi tidak ditemukan transaksi serah terima yang aktif.",
                        'suggested_action' => "Periksa mutasi keluar masuk barang dan ubah status ke 'tersedia'.",
                    ];
                }
            }
        }

        // 4. Equipment Utilization Summary
        $equipmentUtilization = Equipment::with(['category', 'units'])->get()->map(function ($eq) {
            $totalUnits = $eq->units->count();
            $availableUnits = $eq->units->where('status', 'tersedia')->where('condition', '!=', 'rusak')->count();
            $rentedUnits = $eq->units->where('status', 'disewa')->count();
            $maintenanceUnits = $eq->units->where('status', 'maintenance')->count();
            $utilizationRate = $totalUnits > 0 ? round(($rentedUnits / $totalUnits) * 100, 1) : 0;

            return [
                'id' => $eq->id,
                'name' => $eq->name,
                'category_name' => $eq->category?->name ?? 'Uncategorized',
                'total_units' => $totalUnits,
                'available_units' => $availableUnits,
                'rented_units' => $rentedUnits,
                'maintenance_units' => $maintenanceUnits,
                'utilization_rate' => $utilizationRate,
            ];
        })->sortByDesc('utilization_rate')->values();

        // 5. Recent 15 Condition & Maintenance Logs
        // Includes 'condition_update' (manual admin mutation) and 'maintenance' (legacy) types.
        $recentMaintenanceLogs = UnitLog::with(['equipmentUnit.equipment', 'user'])
            ->whereIn('type', ['condition_update', 'maintenance'])
            ->latest()
            ->take(15)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'unit_code' => $log->equipmentUnit?->unit_code,
                    'equipment_name' => $log->equipmentUnit?->equipment?->name,
                    'type' => $log->type,
                    'condition_before' => $log->condition_before,
                    'condition_after' => $log->condition_after,
                    'notes' => $log->notes,
                    'admin_name' => $log->user?->name ?? 'Administrator',
                    'created_at' => $log->created_at->format('Y-m-d H:i'),
                ];
            });

        return Inertia::render('admin/reports/inventory', [
            'conditionSummary' => $conditionSummary,
            'statusSummary' => $statusSummary,
            'unitFatigueList' => $unitFatigueList,
            'anomalies' => $anomalies,
            'equipmentUtilization' => $equipmentUtilization,
            'recentMaintenanceLogs' => $recentMaintenanceLogs,
            'totalUnitsCount' => $allUnits->count(),
        ]);
    }

    /**
     * 5. Laporan Pelanggan & Riwayat Sewa (Customer History & Loyalty) - Prioritas 6
     */
    public function customers(Request $request): Response
    {
        $search = $request->input('search');
        $startDate = $request->input('start_date', Carbon::today()->subDays(90)->toDateString());
        $endDate = $request->input('end_date', Carbon::today()->toDateString());

        $parsedStart = Carbon::parse($startDate)->startOfDay();
        $parsedEnd = Carbon::parse($endDate)->endOfDay();

        $customersQuery = User::where('role', 'customer')
            ->with(['rentals' => function ($q) {
                $q->whereIn('payment_status', ['dp_verified', 'paid_in_full']);
            }]);

        if ($search) {
            $customersQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $allCustomers = $customersQuery->get()->map(function ($user) {
            $validRentals = $user->rentals;
            $completedRentalsCount = $validRentals->where('rental_status', 'completed')->count();
            $activeRentalsCount = $validRentals->whereIn('rental_status', ['confirmed', 'ready_pickup', 'active'])->count();
            $totalSpent = (float) $validRentals->sum('subtotal_price');
            $latestRental = $validRentals->sortByDesc('created_at')->first();

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? '-',
                'total_rentals_count' => $validRentals->count(),
                'completed_rentals_count' => $completedRentalsCount,
                'active_rentals_count' => $activeRentalsCount,
                'total_spent' => $totalSpent,
                'first_rental_date' => $validRentals->min('created_at')?->format('Y-m-d'),
                'last_rental_date' => $latestRental ? $latestRental->created_at->format('Y-m-d') : null,
                'is_repeat_customer' => $validRentals->count() > 1,
            ];
        })->sortByDesc('total_spent')->values();

        $totalCustomers = $allCustomers->count();
        $repeatCustomersCount = $allCustomers->where('is_repeat_customer', true)->count();
        $repeatRate = $totalCustomers > 0 ? round(($repeatCustomersCount / $totalCustomers) * 100, 1) : 0;
        $totalCustomerSpend = $allCustomers->sum('total_spent');
        $averageLtv = $totalCustomers > 0 ? round($totalCustomerSpend / $totalCustomers, 2) : 0;

        $metrics = [
            'totalCustomers' => $totalCustomers,
            'repeatCustomersCount' => $repeatCustomersCount,
            'repeatRate' => $repeatRate,
            'totalCustomerSpend' => $totalCustomerSpend,
            'averageLtv' => $averageLtv,
        ];

        return Inertia::render('admin/reports/customers', [
            'customers' => $allCustomers,
            'metrics' => $metrics,
            'filters' => [
                'search' => $search,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }
}
