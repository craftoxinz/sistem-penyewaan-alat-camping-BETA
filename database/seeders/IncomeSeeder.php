<?php

namespace Database\Seeders;

use App\Models\Income;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class IncomeSeeder extends Seeder
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

        $sampleIncomes = [
            [
                'category' => 'penjualan_barang',
                'title' => 'Penjualan 4 Tabung Gas Kaleng Portabel & 2 Jas Hujan Ponco',
                'amount' => 95000,
                'days_ago' => 20,
                'payment_method' => 'cash',
                'payment_status' => 'received',
                'notes' => 'Penjualan langsung ke pendaki di kasir toko.',
            ],
            [
                'category' => 'jasa_layanan',
                'title' => 'Jasa Cuci & Laundry 2 Tenda Dome Milik Konsumen Luar',
                'amount' => 80000,
                'days_ago' => 16,
                'payment_method' => 'transfer',
                'payment_status' => 'received',
                'notes' => 'Layanan perawatan tenda pribadi bukan unit rental.',
            ],
            [
                'category' => 'penjualan_barang',
                'title' => 'Penjualan Tali Prusik 30m, Carabiner & Baterai AAA',
                'amount' => 65000,
                'days_ago' => 12,
                'payment_method' => 'cash',
                'payment_status' => 'received',
                'notes' => 'Perlengkapan habis pakai tambahan.',
            ],
            [
                'category' => 'modal_tambahan',
                'title' => 'Suntikan Tambahan Modal Kas Toko dari Pemilik',
                'amount' => 500000,
                'days_ago' => 9,
                'payment_method' => 'transfer',
                'payment_status' => 'received',
                'notes' => 'Setoran modal kas tambahan untuk likuiditas operasional kasir.',
            ],
            [
                'category' => 'pendapatan_bunga',
                'title' => 'Bagi Hasil / Pendapatan Bunga Rekening Giro Operasional Toko',
                'amount' => 25000,
                'days_ago' => 5,
                'payment_method' => 'transfer',
                'payment_status' => 'received',
                'notes' => 'Bunga tabungan operasional bank bulan berjalan.',
            ],
            [
                'category' => 'klaim_kompensasi',
                'title' => 'Ganti Rugi Ekspedisi Cargo Logistik atas Keterlambatan Pengiriman Sparepart',
                'amount' => 50000,
                'days_ago' => 3,
                'payment_method' => 'transfer',
                'payment_status' => 'received',
                'notes' => 'Klaim asuransi keterlambatan logistik pihak ketiga.',
            ],
            [
                'category' => 'lain_lain',
                'title' => 'Penjualan Pasak Aus & Potongan Frame Tenda Rusak (Scrap Metal)',
                'amount' => 35000,
                'days_ago' => 2,
                'payment_method' => 'cash',
                'payment_status' => 'received',
                'notes' => 'Penjualan besi/alumunium sisa inventaris rusak.',
            ],
            [
                'category' => 'jasa_layanan',
                'title' => 'Jasa Pasang & Bongkar 3 Tenda Rombongan Gathering (Belum Lunas)',
                'amount' => 150000,
                'days_ago' => 1,
                'payment_method' => 'transfer',
                'payment_status' => 'pending',
                'notes' => 'Tagihan jasa setting tenda event camp komunitas (status piutang pending).',
            ],
        ];

        foreach ($sampleIncomes as $idx => $inc) {
            $date = Carbon::today()->subDays($inc['days_ago'])->toDateString();
            $num = 'INC-'.date('Ym').'-'.str_pad((string) ($idx + 1), 4, '0', STR_PAD_LEFT);

            Income::firstOrCreate(
                ['income_number' => $num],
                [
                    'user_id' => $admin->id,
                    'category' => $inc['category'],
                    'title' => $inc['title'],
                    'amount' => $inc['amount'],
                    'income_date' => $date,
                    'payment_method' => $inc['payment_method'],
                    'payment_status' => $inc['payment_status'],
                    'notes' => $inc['notes'],
                ]
            );
        }
    }
}
