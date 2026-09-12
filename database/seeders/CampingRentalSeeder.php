<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Equipment;
use App\Models\EquipmentUnit;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CampingRentalSeeder extends Seeder
{
    /**
     * Run the database seeds for demo presentation.
     */
    public function run(): void
    {
        // 1. Demo User Accounts (4 Roles, 1 Account each)
        $usersData = [
            [
                'name' => 'Administrator Rental',
                'email' => 'admin@camping.test',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'phone' => '081234567890',
                'address' => 'Jl. Riau No. 45, Bandung',
                'status' => 'active',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Siti Rahmawati (Kasir)',
                'email' => 'kasir@camping.test',
                'password' => Hash::make('password'),
                'role' => 'kasir',
                'phone' => '081398765432',
                'address' => 'Jl. Buah Batu No. 88, Bandung',
                'status' => 'active',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Budi Santoso (Petugas Gudang)',
                'email' => 'gudang@camping.test',
                'password' => Hash::make('password'),
                'role' => 'petugas_gudang',
                'phone' => '081765432109',
                'address' => 'Jl. Kiaracondong No. 15, Bandung',
                'status' => 'active',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Randie Syaeful (Customer Demo)',
                'email' => 'customer@camping.test',
                'password' => Hash::make('password'),
                'role' => 'customer',
                'phone' => '085712345678',
                'address' => 'Jl. Soekarno Hatta No. 120, Bandung',
                'status' => 'active',
                'email_verified_at' => now(),
            ],
        ];

        foreach ($usersData as $uData) {
            User::firstOrCreate(['email' => $uData['email']], $uData);
        }

        // 2. 10 Categories
        $categoriesData = [
            [
                'name' => 'Tenda & Shelter',
                'slug' => 'tenda-shelter',
                'icon' => 'Tent',
                'description' => 'Tenda dome kapasitas 2-6 orang, flysheet tahan air, tarp shelter & pasak.',
            ],
            [
                'name' => 'Sleeping Bag & Matras',
                'slug' => 'sleeping-bag-matras',
                'icon' => 'BedDouble',
                'description' => 'Sleeping bag bulu angsa & polar, matras tiup otomatis, dan bantal camping.',
            ],
            [
                'name' => 'Alat Masak & Kompor',
                'slug' => 'alat-masak-kompor',
                'icon' => 'Flame',
                'description' => 'Kompor portable windproof, nesting cooking set, teko, dan alat makan outdoor.',
            ],
            [
                'name' => 'Penerangan & Lampu',
                'slug' => 'penerangan-lampu',
                'icon' => 'Lightbulb',
                'description' => 'Headlamp LED bertenaga tinggi, lentera gantung tenda tahan air & rechargeable.',
            ],
            [
                'name' => 'Carrier & Ransel',
                'slug' => 'carrier-ransel',
                'icon' => 'Backpack',
                'description' => 'Tas carrier kapasitas 40L - 65L dengan backsystem ergonomis dan raincover.',
            ],
            [
                'name' => 'Kursi & Meja Lipat',
                'slug' => 'kursi-meja-lipat',
                'icon' => 'Armchair',
                'description' => 'Kursi lipat ultralight, meja camping portable, trekking pole & hammock santai.',
            ],
            [
                'name' => 'Navigasi & Kompas',
                'slug' => 'navigasi-kompas',
                'icon' => 'Compass',
                'description' => 'Kompas bidik militer, altimeter digital, dan peta kontur pendakian.',
            ],
            [
                'name' => 'Perlengkapan Gunung & Trekking',
                'slug' => 'perlengkapan-gunung',
                'icon' => 'Mountain',
                'description' => 'Trekking pole carbon, gaiter anti pasir, crampon es, dan jas hujan ponco.',
            ],
            [
                'name' => 'Keselamatan & P3K Outdoor',
                'slug' => 'keselamatan-p3k',
                'icon' => 'ShieldCheck',
                'description' => 'First aid kit outdoor, thermal emergency blanket, peluit survival & flare.',
            ],
            [
                'name' => 'Aksesoris & Survival',
                'slug' => 'aksesoris-survival',
                'icon' => 'Sparkles',
                'description' => 'Pisau lipat multifungsi, pemantik api magnesium fire starter, dan tali paracord.',
            ],
        ];

        $categories = [];
        foreach ($categoriesData as $cData) {
            $categories[$cData['slug']] = Category::firstOrCreate(['slug' => $cData['slug']], $cData);
        }

        // 3. 10 Brands
        $brandsData = [
            [
                'name' => 'Eiger',
                'slug' => 'eiger',
                'logo_url' => null,
                'website_url' => 'https://eigeradventure.com',
                'description' => 'Brand petualangan dan perlengkapan outdoor iklim tropis nomor 1 di Indonesia.',
                'is_active' => true,
            ],
            [
                'name' => 'Consina',
                'slug' => 'consina',
                'logo_url' => null,
                'website_url' => 'https://shop.consina.com',
                'description' => 'Brand perlengkapan outdoor andalan para pendaki Indonesia untuk berbagai ekspedisi gunung.',
                'is_active' => true,
            ],
            [
                'name' => 'Arei Outdoor Gear',
                'slug' => 'arei-outdoor-gear',
                'logo_url' => null,
                'website_url' => 'https://areioutdoorgear.co.id',
                'description' => 'Produsen perlengkapan outdoor tangguh dengan harga bersahabat dan kualitas teruji.',
                'is_active' => true,
            ],
            [
                'name' => 'Naturehike',
                'slug' => 'naturehike',
                'logo_url' => 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=200&q=80',
                'website_url' => 'https://www.naturehike.com',
                'description' => 'Produsen perlengkapan outdoor dan tenda ultralight terkemuka dengan desain modern.',
                'is_active' => true,
            ],
            [
                'name' => 'Quechua',
                'slug' => 'quechua',
                'logo_url' => 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=200&q=80',
                'website_url' => 'https://www.decathlon.co.id',
                'description' => 'Merk perlengkapan camping dan hiking asal Prancis yang mengutamakan kepraktisan dan durabilitas.',
                'is_active' => true,
            ],
            [
                'name' => 'Osprey',
                'slug' => 'osprey',
                'logo_url' => 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=200&q=80',
                'website_url' => 'https://www.osprey.com',
                'description' => 'Brand carrier dan ransel pendakian premium legendaris dengan teknologi backsystem ternyaman.',
                'is_active' => true,
            ],
            [
                'name' => 'Deuter',
                'slug' => 'deuter',
                'logo_url' => null,
                'website_url' => 'https://www.deuter.com',
                'description' => 'Brand tas carrier ternama dari Jerman dengan sirkulasi udara Aircomfort terbaik.',
                'is_active' => true,
            ],
            [
                'name' => 'Fire-Maple',
                'slug' => 'fire-maple',
                'logo_url' => 'https://images.unsplash.com/photo-1470246973918-29a93221c455?w=200&q=80',
                'website_url' => 'https://www.fire-maple.com',
                'description' => 'Spesialis kompor outdoor, nesting set, dan peralatan masak camping ultralight berkualitas tinggi.',
                'is_active' => true,
            ],
            [
                'name' => 'Petzl',
                'slug' => 'petzl',
                'logo_url' => 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=200&q=80',
                'website_url' => 'https://www.petzl.com',
                'description' => 'Pabrikan alat keselamatan, headlamp penerangan, dan perlengkapan climbing profesional.',
                'is_active' => true,
            ],
            [
                'name' => 'Dhaulagiri',
                'slug' => 'dhaulagiri',
                'logo_url' => 'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=200&q=80',
                'website_url' => 'https://dhaulagiri.co.id',
                'description' => 'Brand outdoor terpercaya dengan varian matras, kursi lipat, nesting set, dan aksesoris kokoh.',
                'is_active' => true,
            ],
        ];

        $brands = [];
        foreach ($brandsData as $bData) {
            $brands[$bData['slug']] = Brand::firstOrCreate(['slug' => $bData['slug']], $bData);
        }

        // 4. 10 Master Equipment Items, masing-masing 20 Unit Fisik
        $equipmentData = [
            [
                'category_slug' => 'tenda-shelter',
                'brand_slug' => 'quechua',
                'name' => 'Tenda Dome Arpenaz 4.1 (4 Orang)',
                'slug' => 'tenda-dome-arpenaz-41-4-orang',
                'description' => 'Tenda keluarga 4 orang dengan ruang santai depan yang luas. Pemasangan mudah dengan frame berkode warna, flysheet tahan hujan hingga 2000mm PU.',
                'specifications' => [
                    'Kapasitas' => '4 Orang Dewasa',
                    'Dimensi Luar' => '240 x 210 x 140 cm',
                    'Material Flysheet' => 'Polyester 2000mm PU Coated',
                    'Frame' => 'Fiberglass 8.5mm Tahan Angin',
                    'Berat' => '3.8 kg',
                    'Kelengkapan' => 'Flysheet, Inner Tent, 12 Pasak, 4 Guyline, Tas Penyimpanan',
                ],
                'price_per_day' => 45000,
                'deposit_per_unit' => 50000,
                'fine_minor_damage' => 150000,
                'fine_heavy_damage' => 350000,
                'fine_lost' => 650000,
                'image_url' => 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80',
                'unit_code_prefix' => 'TND-4P',
            ],
            [
                'category_slug' => 'tenda-shelter',
                'brand_slug' => 'naturehike',
                'name' => 'Tenda Ultralight Cloud Up 2 (2 Orang)',
                'slug' => 'tenda-ultralight-naturehike-cloud-up-2',
                'description' => 'Tenda ultralight 2 orang berbobot ringan, ideal untuk pendakian tektok atau camping berdua. Menggunakan bahan 20D Nylon Silicone tahan badai.',
                'specifications' => [
                    'Kapasitas' => '2 Orang',
                    'Dimensi' => '210 x 125 x 100 cm',
                    'Material Flysheet' => '20D Nylon Silicone 4000mm Waterproof',
                    'Frame' => '7001 Aluminium Alloy',
                    'Berat' => '1.7 kg',
                    'Kelengkapan' => 'Flysheet, Inner Tent, Pasak Aluminium, Guyline, Footprint Mat',
                ],
                'price_per_day' => 35000,
                'deposit_per_unit' => 40000,
                'fine_minor_damage' => 120000,
                'fine_heavy_damage' => 300000,
                'fine_lost' => 550000,
                'image_url' => 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=800&q=80',
                'unit_code_prefix' => 'TND-UL',
            ],
            [
                'category_slug' => 'sleeping-bag-matras',
                'brand_slug' => 'consina',
                'name' => 'Sleeping Bag Bulu Angsa Mummy 0°C',
                'slug' => 'sleeping-bag-bulu-angsa-mummy-consina',
                'description' => 'Sleeping bag model mummy dengan isian bulu angsa sintetis tebal, mampu menahan suhu dingin ekstrem hingga 0°C di puncak gunung.',
                'specifications' => [
                    'Model' => 'Mummy dengan Penutup Kepala Serut',
                    'Panjang' => '215 x 75 cm',
                    'Material Luar' => 'Ripstop Nylon Tahan Angin & Percikan Air',
                    'Isian' => 'Down Synthetic Thermal Guard 400g/m²',
                    'Suhu Nyaman' => '0°C s/d 10°C',
                    'Berat' => '1.1 kg',
                ],
                'price_per_day' => 18000,
                'deposit_per_unit' => 25000,
                'fine_minor_damage' => 70000,
                'fine_heavy_damage' => 140000,
                'fine_lost' => 250000,
                'image_url' => 'https://images.unsplash.com/photo-1587574293340-e0011c4e8ecf?w=800&q=80',
                'unit_code_prefix' => 'SB-MUM',
            ],
            [
                'category_slug' => 'sleeping-bag-matras',
                'brand_slug' => 'dhaulagiri',
                'name' => 'Matras Tiup Otomatis Double Pad',
                'slug' => 'matras-tiup-otomatis-double-pad-dhaulagiri',
                'description' => 'Matras angin tiup otomatis (self-inflating) ukuran ganda untuk 2 orang dengan built-in pillow, memberikan kenyamanan tidur maksimal.',
                'specifications' => [
                    'Kapasitas' => '2 Orang (Double)',
                    'Dimensi' => '190 x 130 x 5 cm',
                    'Tipe' => 'Self-Inflating Valve + Built-in Pillow',
                    'Material' => '190T Polyester Pongee PVC Laminated',
                    'Berat' => '2.2 kg',
                ],
                'price_per_day' => 15000,
                'deposit_per_unit' => 20000,
                'fine_minor_damage' => 50000,
                'fine_heavy_damage' => 100000,
                'fine_lost' => 200000,
                'image_url' => 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?w=800&q=80',
                'unit_code_prefix' => 'MTR-DBL',
            ],
            [
                'category_slug' => 'alat-masak-kompor',
                'brand_slug' => 'fire-maple',
                'name' => 'Kompor Windproof Portable FMS-105',
                'slug' => 'kompor-ultralight-windproof-fire-maple-fms-105',
                'description' => 'Kompor gas portable dengan pelindung angin terintegrasi dan pemantik piezo elektrik. Api kencang, stabil, dan hemat gas kaleng hi-cook.',
                'specifications' => [
                    'Daya Api' => '3000 Watt / 10200 BTU',
                    'Fitur' => 'Built-in Windshield & Piezo Igniter',
                    'Konektor' => 'Kompatibel Gas Canister / Gas Kaleng',
                    'Material' => 'Stainless Steel & Tembaga Anti Karat',
                    'Berat' => '246 gram',
                ],
                'price_per_day' => 12000,
                'deposit_per_unit' => 15000,
                'fine_minor_damage' => 40000,
                'fine_heavy_damage' => 90000,
                'fine_lost' => 180000,
                'image_url' => 'https://images.unsplash.com/photo-1470246973918-29a93221c455?w=800&q=80',
                'unit_code_prefix' => 'KMP-WND',
            ],
            [
                'category_slug' => 'penerangan-lampu',
                'brand_slug' => 'petzl',
                'name' => 'Headlamp LED Actik Core 450 Lumens',
                'slug' => 'headlamp-led-actik-core-450-lumens-petzl',
                'description' => 'Senter kepala rechargeable multi-beam dengan cahaya putih terang 450 lumens dan lampu merah malam hari. Tahan hujan cuaca ekstrem (IPX4).',
                'specifications' => [
                    'Output Cahaya' => '450 Lumens (Jarak Sorot hingga 90 Meter)',
                    'Mode Cahaya' => 'Max Power, Standard, Max Autonomy, Red Light, Red Strobe',
                    'Baterai' => 'Rechargeable Core Battery (Micro USB) / 3x AAA',
                    'Water Resistance' => 'IPX4 Weather Resistant',
                    'Berat' => '75 gram',
                ],
                'price_per_day' => 15000,
                'deposit_per_unit' => 20000,
                'fine_minor_damage' => 50000,
                'fine_heavy_damage' => 120000,
                'fine_lost' => 250000,
                'image_url' => 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80',
                'unit_code_prefix' => 'LMP-ACT',
            ],
            [
                'category_slug' => 'carrier-ransel',
                'brand_slug' => 'osprey',
                'name' => 'Tas Carrier Atmos AG 65L',
                'slug' => 'tas-carrier-atmos-ag-65l-osprey',
                'description' => 'Tas gunung carrier kapasitas 65 liter dengan suspensi Anti-Gravity 3D mesh yang mendistribusikan beban secara sempurna ke pinggul.',
                'specifications' => [
                    'Kapasitas' => '65 Liter + 10L Ekstensi',
                    'Backsystem' => 'Anti-Gravity 3D Suspended Mesh Backpanel',
                    'Fitur' => 'Trekking Pole Attachment, Sleeping Bag Compartment, Raincover',
                    'Material' => '210D High Tenacity Nylon Dobby',
                    'Berat Kosong' => '2.1 kg',
                ],
                'price_per_day' => 35000,
                'deposit_per_unit' => 50000,
                'fine_minor_damage' => 150000,
                'fine_heavy_damage' => 400000,
                'fine_lost' => 900000,
                'image_url' => 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80',
                'unit_code_prefix' => 'CAR-ATM',
            ],
            [
                'category_slug' => 'carrier-ransel',
                'brand_slug' => 'deuter',
                'name' => 'Tas Carrier Futura Pro 40L',
                'slug' => 'tas-carrier-futura-pro-40l-deuter',
                'description' => 'Carrier ukuran medium 40L yang sangat cocok untuk pendakian 2-3 hari. Sistem sirkulasi udara Aircomfort menjaga punggung tetap kering.',
                'specifications' => [
                    'Kapasitas' => '40 Liter',
                    'Backsystem' => 'Deuter Aircomfort Sensic Pro System',
                    'Fitur' => 'VariFlex ECL Hip Fins, Bottom Compartment, Raincover',
                    'Material' => '210D Polyamide Recycled Ripstop',
                    'Berat' => '1.6 kg',
                ],
                'price_per_day' => 25000,
                'deposit_per_unit' => 35000,
                'fine_minor_damage' => 100000,
                'fine_heavy_damage' => 250000,
                'fine_lost' => 600000,
                'image_url' => 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
                'unit_code_prefix' => 'CAR-FUT',
            ],
            [
                'category_slug' => 'kursi-meja-lipat',
                'brand_slug' => 'arei-outdoor-gear',
                'name' => 'Kursi Lipat Camping Ultralight',
                'slug' => 'kursi-lipat-camping-ultralight-arei',
                'description' => 'Kursi lipat outdoor ringkas dengan frame aluminium kokoh, kuat menahan beban hingga 120 kg, dan mudah dilipat masuk ransel.',
                'specifications' => [
                    'Material Frame' => '7075 Aviation Aluminum Alloy',
                    'Kain' => '600D Tear-Resistant Oxford Fabric',
                    'Kapasitas Beban' => '120 kg',
                    'Berat Kursi' => '950 gram',
                    'Kelengkapan' => 'Kursi Lipat, Tas Kantong Jinjing',
                ],
                'price_per_day' => 10000,
                'deposit_per_unit' => 15000,
                'fine_minor_damage' => 35000,
                'fine_heavy_damage' => 75000,
                'fine_lost' => 150000,
                'image_url' => 'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=800&q=80',
                'unit_code_prefix' => 'KRS-ULT',
            ],
            [
                'category_slug' => 'perlengkapan-gunung',
                'brand_slug' => 'eiger',
                'name' => 'Trekking Pole Carbon Anti-Shock',
                'slug' => 'trekking-pole-carbon-anti-shock-eiger',
                'description' => 'Tongkat pendakian berbahan serat karbon ringan dengan sistem peredam kejut (anti-shock) untuk mengurangi beban tumpuan lutut saat menuruni bukit.',
                'specifications' => [
                    'Panjang' => '65 cm s/d 135 cm (Adjustable 3 Section)',
                    'Material Batang' => '100% Carbon Fiber + 7075 Alu Lower',
                    'Grip' => 'Ergonomic EVA Foam + Breathable Strap',
                    'Mekanisme Kunci' => 'Fast Quick-Lock System',
                    'Berat' => '210 gram per tongkat',
                ],
                'price_per_day' => 10000,
                'deposit_per_unit' => 15000,
                'fine_minor_damage' => 40000,
                'fine_heavy_damage' => 85000,
                'fine_lost' => 175000,
                'image_url' => 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
                'unit_code_prefix' => 'TRK-CRB',
            ],
        ];

        foreach ($equipmentData as $eqItem) {
            $cat = $categories[$eqItem['category_slug']];
            $brand = isset($eqItem['brand_slug']) && isset($brands[$eqItem['brand_slug']])
                ? $brands[$eqItem['brand_slug']]
                : null;

            $equipment = Equipment::updateOrCreate(
                ['slug' => $eqItem['slug']],
                [
                    'category_id' => $cat->id,
                    'brand_id' => $brand?->id,
                    'name' => $eqItem['name'],
                    'description' => $eqItem['description'],
                    'specifications' => $eqItem['specifications'],
                    'price_per_day' => $eqItem['price_per_day'],
                    'deposit_per_unit' => $eqItem['deposit_per_unit'],
                    'fine_minor_damage' => $eqItem['fine_minor_damage'],
                    'fine_heavy_damage' => $eqItem['fine_heavy_damage'],
                    'fine_lost' => $eqItem['fine_lost'],
                    'image_url' => $eqItem['image_url'],
                    'is_active' => true,
                ]
            );

            // Buat 20 unit fisik per alat dengan kode sequential (e.g. TND-4P-001 s/d TND-4P-020)
            for ($i = 1; $i <= 20; $i++) {
                $unitCode = $eqItem['unit_code_prefix'].'-'.str_pad($i, 3, '0', STR_PAD_LEFT);

                EquipmentUnit::firstOrCreate(
                    ['unit_code' => $unitCode],
                    [
                        'equipment_id' => $equipment->id,
                        'condition' => 'baik',
                        'status' => 'tersedia',
                        'notes' => 'Unit prima dalam kondisi bersih & lengkap siap pakai.',
                    ]
                );
            }
        }
    }
}
