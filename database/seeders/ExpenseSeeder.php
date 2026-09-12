<?php

namespace Database\Seeders;

use App\Models\Expense;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ExpenseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first() ?? User::where('role', 'kasir')->first();

        if (! $admin) {
            return;
        }

        $sampleExpenses = [
            [
                'category' => 'pemeliharaan_alat',
                'title' => 'Laundry & Sanitasi 15 Sleeping Bag & Matras',
                'amount' => 150000,
                'days_ago' => 25,
                'payment_method' => 'transfer',
                'payment_status' => 'paid',
                'notes' => 'Pembersihan berkala pasca persewaan libur panjang.',
            ],
            [
                'category' => 'perlengkapan_alat',
                'title' => 'Beli Pasak Alumunium 30 pcs & Tali Prusik 50m',
                'amount' => 120000,
                'days_ago' => 22,
                'payment_method' => 'cash',
                'payment_status' => 'paid',
                'notes' => 'Penggantian pasak aus dan cadangan tenda.',
            ],
            [
                'category' => 'pemeliharaan_alat',
                'title' => 'Servis 4 Kompor Windproof & Ganti Seal Karet',
                'amount' => 85000,
                'days_ago' => 18,
                'payment_method' => 'cash',
                'payment_status' => 'paid',
                'notes' => 'Perbaikan pemantik dan penggantian seal tabung gas.',
            ],
            [
                'category' => 'operasional_toko',
                'title' => 'Tagihan Listrik PLN & Internet Toko Bulan Berjalan',
                'amount' => 350000,
                'days_ago' => 15,
                'payment_method' => 'transfer',
                'payment_status' => 'paid',
                'notes' => 'Biaya utilitas bulanan toko.',
            ],
            [
                'category' => 'perlengkapan_alat',
                'title' => 'Stok Gas Canister Portabel 1 Lusin & Baterai AAA',
                'amount' => 180000,
                'days_ago' => 10,
                'payment_method' => 'transfer',
                'payment_status' => 'paid',
                'notes' => 'Perlengkapan habis pakai untuk customer sewa alat masak.',
            ],
            [
                'category' => 'operasional_toko',
                'title' => 'Beli Plastik Packing Tenda, Lakban & Kertas Kasir',
                'amount' => 65000,
                'days_ago' => 8,
                'payment_method' => 'cash',
                'payment_status' => 'paid',
                'notes' => 'Kebutuhan administrasi dan serah terima unit.',
            ],
            [
                'category' => 'gaji_karyawan',
                'title' => 'Uang Lembur Petugas Kasir & Gudang Weekend',
                'amount' => 200000,
                'days_ago' => 5,
                'payment_method' => 'cash',
                'payment_status' => 'paid',
                'notes' => 'Lembur penerimaan barang kembali di hari Minggu.',
            ],
            [
                'category' => 'lain_lain',
                'title' => 'Bensin & Transport Belanja Suku Cadang Logistik',
                'amount' => 50000,
                'days_ago' => 2,
                'payment_method' => 'cash',
                'payment_status' => 'paid',
                'notes' => 'Pengambilan pesanan frame tenda dari distributor.',
            ],
            [
                'category' => 'pemeliharaan_alat',
                'title' => 'Reparasi Jahitan 2 Tenda Dome & Lem Seam Seal',
                'amount' => 95000,
                'days_ago' => 1,
                'payment_method' => 'cash',
                'payment_status' => 'unpaid',
                'notes' => 'Tagihan perbaikan dari tukang reparasi outdoor (belum lunas / hutang).',
            ],
        ];

        foreach ($sampleExpenses as $idx => $exp) {
            $date = Carbon::today()->subDays($exp['days_ago'])->toDateString();
            $num = 'EXP-'.date('Ym').'-'.str_pad((string) ($idx + 1), 4, '0', STR_PAD_LEFT);

            Expense::firstOrCreate(
                ['expense_number' => $num],
                [
                    'user_id' => $admin->id,
                    'category' => $exp['category'],
                    'title' => $exp['title'],
                    'amount' => $exp['amount'],
                    'expense_date' => $date,
                    'payment_method' => $exp['payment_method'],
                    'payment_status' => $exp['payment_status'],
                    'notes' => $exp['notes'],
                ]
            );
        }
    }
}
