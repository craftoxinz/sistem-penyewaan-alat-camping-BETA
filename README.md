# 🏕️ Sistem Informasi Manajemen & Penyewaan Alat Camping (BETA)

Platform aplikasi web terpadu untuk tata kelola operasional dan keuangan bisnis persewaan perlengkapan outdoor & camping (*outdoor gear rental system*). Dibangun menggunakan ekosistem modern **Laravel 12**, **Inertia.js React (TypeScript)**, **Tailwind CSS v4**, dan **shadcn/ui**.

---

## 📋 Daftar Isi
- [Tentang Aplikasi](#-tentang-aplikasi)
- [Latar Belakang & Masalah yang Diselesaikan](#-latar-belakang--masalah-yang-diselesaikan)
- [Tech Stack](#-tech-stack)
- [Fitur Utama](#-fitur-utama)
- [Aktor Pengguna & Hak Akses (Role)](#-aktor-pengguna--hak-akses-role)
- [Struktur Database & Alur Transaksi](#-struktur-database--alur-transaksi)
- [Langkah Instalasi & Setup](#-langkah-instalasi--setup)
- [Akun Pengguna Demo](#-akun-pengguna-demo)
- [Struktur Direktori Proyek](#-struktur-direktori-proyek)
- [Pengujian Otomatis & Kualitas Kode](#-pengujian-otomatis--kualitas-kode)
- [Lisensi](#-lisensi)

---

## 📖 Tentang Aplikasi

**Sistem Penyewaan Alat Camping** adalah solusi *end-to-end* yang mendigitalisasi seluruh rantai bisnis rental outdoor gear, mulai dari katalog interaktif publik, pemesanan mandiri (*online booking*) dengan sistem Uang Muka (DP 30%), serah terima alat di toko dengan pelunasan COD (70%), tata kelola unit fisik inventaris ber-QR Code, inspeksi pengembalian & perhitungan denda otomatis per jenis alat, hingga pembukuan akuntansi terintegrasi (Arus Kas, Laba Rugi P&L, Beban Operasional OPEX, dan Pencatatan Pendapatan Mandiri Non-Sewa).

---

## 💡 Latar Belakang & Masalah yang Diselesaikan

Penyewaan alat camping konvensional kerap menghadapi sejumlah tantangan operasional:
1. **Pelacakan Fisik Unit yang Rentan Tertukar/Hilang**: Sulit melacak unit mana yang sedang disewa, rusak, atau dalam perawatan tanpa identifikasi unik per unit.
2. **Perhitungan Denda Kerusakan yang Abstrak & Acak**: Kerusakan tenda dome seringkali dinilai sembarangan tanpa standar harga yang jelas, menimbulkan perselisihan dengan pelanggan.
3. **Pencampuran Dana Jaminan (Deposit) dengan Omset Toko**: Deposit pelanggan sering dianggap sebagai pendapatan, padahal merupakan titipan liabilitas yang wajib dikembalikan penuh saat unit utuh.
4. **Ketiadaan Pembukuan Keuangan Operasional yang Komprehensif**: Arus kas masuk/keluar harian, beban laundry/perbaikan alat, tagihan listrik toko, serta pendapatan sampingan toko (seperti penjualan gas kaleng portable dan jasa cuci tenda konsumen luar) tidak tercatat dalam satu buku besar yang rapi.

Aplikasi ini hadir untuk menyelesaikan seluruh permasalahan tersebut melalui otomasi sistem yang terstruktur, transparan, dan sesuai standar tata kelola persewaan.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: [Laravel 12.x](https://laravel.com/) (PHP 8.4+)
- **Authentication**: [Laravel Fortify](https://laravel.com/docs/fortify) (2FA, TOTP, WebAuthn/Passkeys, Profile Management)
- **Type-safe Routing**: [Laravel Wayfinder](https://github.com/laravel/wayfinder) (Generasi otomatis fungsi typed router & controller actions ke TypeScript)
- **Database**: SQLite (default, zero-configuration) / Siap migrasi ke MySQL, MariaDB, atau PostgreSQL

### Frontend
- **SPA Bridge**: [Inertia.js v3 (React)](https://inertiajs.com/)
- **UI Library**: [React 19](https://react.dev/) dengan [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) dengan arsitektur utility modern
- **Komponen UI**: [shadcn/ui](https://ui.shadcn.com/) (dibangun di atas Radix UI primitives)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Visualisasi Data**: [Recharts](https://recharts.org/) untuk grafik arus kas, tren omset bulanan, dan komposisi pengeluaran
- **Hardware Scan**: [html5-qrcode](https://github.com/mebjas/html5-qrcode) untuk pemindaian QR Code unit fisik melalui webcam/kamera smartphone

### Testing & Code Standards
- **Testing Engine**: [Pest PHP 5](https://pestphp.com/) (156+ automated feature & unit tests passing)
- **Linter & Formatter**: [Laravel Pint](https://laravel.com/docs/pint) (PSR-12), Prettier, ESLint
- **Static Analysis**: [PHPStan / Larastan](https://github.com/larastan/larastan)

---

## ✨ Fitur Utama

### 1. 🏕️ Katalog Publik & Booking Online (Customer Facing)
- **Katalog Interaktif**: Pencarian alat camping, filter kategori (*Tenda, Sleeping Bag, Kompor, Penerangan, Carrier, dll.*), dan filter brand ternama (*Eiger, Consina, Rei, Naturehike, Dhaulagiri, Coleman*).
- **Cek Ketersediaan Real-Time**: Kalender ketersediaan dinamis per rentang tanggal peminjaman.
- **Sistem Keranjang & Checkout**: Penentuan tanggal sewa/kembali, kalkulasi otomatis biaya sewa harian dan deposit jaminan.
- **Sistem Pembayaran Bertahap**: Pembayaran Uang Muka (DP 30%) via transfer bank terverifikasi kasir, sisa pelunasan 70% dilakukan saat serah terima alat di toko (COD).

### 2. 📦 Tata Kelola Unit Fisik & QR Code (Inventory Tracking)
- **Nomor Seri & Kode Unit Unik**: Setiap unit fisik memiliki nomor seri mandiri (contoh: `UNT-TND-001`, `UNT-CMP-004`).
- **QR Code Generator & Scanner**: Setiap unit dilengkapi QR Code yang dapat dicetak menjadi stiker dan dipindai menggunakan scanner kamera bawaan toko untuk verifikasi kilat saat *pickup* maupun *return*.
- **Manajemen Status Unit**: Pelacakan status unit secara *real-time* (*Tersedia / Ready, Sedang Disewa / In Use, Perawatan / Maintenance, Rusak / Damaged, Hilang / Lost*).
- **Log Riwayat Mutasi**: Setiap perpindahan atau perubahan kondisi unit terekam kronologis dalam buku log mutasi gudang.

### 3. ⚖️ Manajemen Denda Otomatis & Standar Kerusakan
- **Denda Keterlambatan Otomatis**: Dihitung harian secara sistematis berdasarkan tarif sewa alat saat pengembalian melewati batas waktu.
- **Standar Denda Kerusakan per Jenis Alat**: Nilai ganti rugi kerusakan dikelompokkan secara terstandar per jenis kategori alat dengan tingkatan kerusakan (*Ringan, Sedang, Berat, Hilang / Total*), menghilangkan subjektivitas penentuan denda.
- **Penyelesaian Fleksibel**: Sanksi denda dapat dipotong langsung dari deposit jaminan pelanggan (*settled from deposit*) atau dibayarkan tunai kasir (*paid extra cash*).

### 4. 🛡️ Pengelolaan Deposit Jaminan Pelanggan
- **Tata Kelola Liabilitas**: Uang jaminan dicatat sebagai titipan (*liability*) toko selama pesanan aktif.
- **Mekanisme Pengembalian (Refund)**: Pengembalian deposit penuh saat seluruh peralatan kembali dalam kondisi utuh dan bersih.
- **Penyitaan Deposit (Forfeit)**: Eksekusi penyitaan deposit jika penyewa mangkir atau menyebabkan kerusakan fatal.

### 5. 💰 Laporan Keuangan Komprehensif, Arus Kas & P&L
- **Executive Metric Cards**: Pemantauan langsung Pendapatan Kotor (Omzet), Total Beban Usaha, Surplus Operasional (EBITDA), Deposit Jaminan Aktif, Realisasi Denda & Piutang, serta Arus Kas Bersih (*Net Cash Flow*).
- **Tab Arus Kas (Cash Flow)**: Perbandingan riil uang masuk (*cash-in*: DP, COD, denda tunai, pendapatan retail) vs uang keluar (*cash-out*: refund deposit jaminan & beban lunas).
- **Tab Laporan Laba Rugi (P&L Statement)**: Standar laporan kinerja usaha terperinci (Pendapatan Sewa, Pendapatan Retail & Jasa, Beban Operasional OPEX, Margin EBITDA).
- **Log Mutasi Arus Kas Real-Time**: Catatan kronologis setiap sen transaksi uang masuk dan keluar toko.
- **Buku Beban Operasional (OPEX)**: Pencatatan beban laundry/sanitasi, pembelian sparepart/pasak, utilitas listrik/air toko, upah karyawan, dan logistik.
- **Buku Pendapatan di Luar Sewa (Non-Rental Incomes)**: Fitur mandiri untuk mencatat penjualan retail (gas kaleng portabel, jas hujan, baterai), jasa cuci/servis tenda luar, suntikan modal pemilik toko, pendapatan bunga bank, klaim asuransi ekspedisi, dan penjualan scrap.
- **Ekspor Laporan**: Ekspor data laporan keuangan lengkap ke format CSV dan cetak laporan.

---

## 👥 Aktor Pengguna & Hak Akses (Role)

Aplikasi menerapkan sistem kontrol akses berbasis peran (*Role-Based Access Control / RBAC*):

| Role | Hak Akses Utama |
| :--- | :--- |
| **Administrator** | Akses penuh ke seluruh modul sistem, master data alat, brand, kategori, pengguna staf, laporan keuangan, analitik alat terlaris, dan moderasi ulasan. |
| **Kasir** | Pengelolaan pesanan sewa, verifikasi DP, proses pelunasan COD serah terima, penerimaan pengembalian alat, input denda, pencatatan beban operasional, dan pencatatan pendapatan. |
| **Petugas Gudang** | Manajemen unit fisik alat camping, penambahan unit serial baru, cetak stiker QR Code, pemindaian QR unit masuk/keluar, dan pemeliharaan kondisi barang. |
| **Customer** | Registrasi akun, penelusuran katalog, pemesanan sewa mandiri, upload bukti pembayaran DP, pemantauan riwayat status sewa, dan pengiriman ulasan alat. |

---

## 🔄 Struktur Database & Alur Transaksi

```
[ Pelanggan Booking Online ] 
            │
            ▼ (Transfer DP 30%)
[ Verifikasi Kasir ] ───► Status: Confirmed / Ready Pickup
            │
            ▼ (Pelanggan Datang ke Toko)
[ Serah Terima Alat (Pickup) ] ───► Scan QR Unit + Bayar Sisa 70% (COD) + Titip Deposit
            │
            ▼ (Masa Peminjaman Berjalan)
[ Pengembalian Alat (Return) ] ───► Inspeksi Kondisi Fisik Alat
            │
            ├─────────────────────────┬─────────────────────────┐
            ▼ (Kondisi Utuh)           ▼ (Terlambat / Rusak)     ▼ (Mangkir)
     [ Refund Deposit ]       [ Hitung Denda Otomatis ]   [ Sita Deposit ]
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
             [ Potong dari Deposit ]     [ Bayar Tunai di Kasir ]
```

---

## 🚀 Langkah Instalasi & Setup

Ikuti petunjuk di bawah untuk menginstal dan menjalankan aplikasi di lingkungan lokal Anda:

### 1. Prasyarat Sistem
- **PHP** >= 8.3 (dengan ekstensi `pdo_sqlite`, `mbstring`, `intl`, `bcmath`, `fileinfo`)
- **Composer** >= 2.x
- **Node.js** >= 20.x & **NPM**
- **Git**

### 2. Kloning Repositori
```bash
git clone https://github.com/craftoxinz/sistem-penyewaan-alat-camping-BETA.git
cd sistem-penyewaan-alat-camping-BETA
```

### 3. Setup Konfigurasi Lingkungan (`.env`)
Salin file konfigurasi contoh:
```bash
cp .env.example .env
```
*(Di Windows PowerShell: `copy .env.example .env`)*

Secara default, database menggunakan SQLite lokal yang sangat ringan dan tidak memerlukan konfigurasi server database tambahan.

### 4. Instalasi Dependensi Backend & Frontend
```bash
# Instalasi paket PHP Composer
composer install

# Instalasi paket JavaScript Node
npm install
```

### 5. Generate Application Key & Siapkan Database
```bash
# Generate encryption key
php artisan key:generate

# Jalankan migrasi dan seeder data demo lengkap
php artisan migrate --seed
```

> [!NOTE]
> Perintah `php artisan migrate --seed` akan secara otomatis membuat tabel-tabel sistem dan mengisi basis data dengan katalog alat camping, brand, inventaris fisik, pesanan aktif, catatan beban operasional, dan transaksi pendapatan demo.

### 6. Build Aset Frontend
```bash
# Untuk kompilasi aset produksi:
npm run build

# ATAU jalankan dev server vite untuk pengembangan aktif:
npm run dev
```

### 7. Jalankan Server Aplikasi
Jalankan development server Laravel:
```bash
php artisan serve
```

Buka peramban Anda di alamat: **`http://localhost:8000`**

---

## 🔑 Akun Pengguna Demo

Gunakan kredensial akun demo berikut untuk menguji masing-masing hak akses peran:

| Role | Email | Password | Kegunaan Uji Coba |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@camping.test` | `password` | Dashboard eksekutif, Laporan Keuangan, Master Data & Pengguna |
| **Kasir** | `kasir@camping.test` | `password` | Alur pelunasan COD, denda, catat pendapatan & beban operasional |
| **Petugas Gudang** | `gudang@camping.test` | `password` | Scanner QR unit, inspeksi alat, manajemen unit inventaris fisik |
| **Customer** | `customer@camping.test` | `password` | Katalog rental, simulasi pemesanan sewa, upload bukti transfer |

---

## 📁 Struktur Direktori Proyek

```
sistem-penyewaan-alat-camping-BETA/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/              # Controller Panel Admin (Laporan, Omset, Unit, Denda, Beban, Pendapatan)
│   │   │   ├── BookingController.php
│   │   │   ├── CatalogController.php
│   │   │   └── ReviewController.php
│   │   └── Middleware/             # Role middleware & verifikasi akses
│   └── Models/                     # Eloquent Models (Equipment, Unit, Rental, Expense, Income, FineRule, dll.)
├── database/
│   ├── migrations/                 # Skema tabel database sistem
│   └── seeders/                    # Seeder data master, unit inventaris, transaksi demo, beban, dan pendapatan
├── resources/
│   ├── js/
│   │   ├── components/             # Komponen UI Reusable (shadcn, form dialog, filter bar, navbar)
│   │   │   └── reports/            # Komponen dialog catat beban & pendapatan, filter tanggal laporan
│   │   ├── layouts/                # Layout admin dan publik
│   │   ├── pages/                  # Halaman Inertia React (Admin Dashboard, Katalog, Laporan, Booking, Auth)
│   │   └── lib/                    # Helper format rupiah, tanggal, utilities
│   └── css/                        # Tailwind CSS konfigurasi utama
├── routes/
│   └── web.php                     # Definisi rute aplikasi terorganisir berdasarkan middleware role
└── tests/
    └── Feature/                    # Test suite komprehensif Pest (156 tests passing)
```

---

## 🧪 Pengujian Otomatis & Kualitas Kode

Aplikasi mematuhi standar *Clean Code* dan didukung oleh pengujian otomatis komprehensif untuk memastikan reliabilitas transaksi keuangan dan alur sewa.

```bash
# Menjalankan seluruh test suite (156 tests passing)
php artisan test --compact

# Menjalankan pengujian khusus modul laporan keuangan dan pendapatan
php artisan test tests/Feature/AdminFinancialReportTest.php --compact

# Menjalankan formatter kode Laravel Pint
vendor/bin/pint --format agent

# Melakukan pengecekan tipe TypeScript pada frontend
npm run types:check
```

---

## 📄 Lisensi

Aplikasi ini dilisensikan di bawah lisensi open-source [MIT License](LICENSE).
Dikembangkan untuk kebutuhan operasional manajemen persewaan perlengkapan camping dan alam bebas.
