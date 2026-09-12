import { Head, Link, router } from '@inertiajs/react';
import EquipmentAvailabilityCalendar from '@/components/catalog/equipment-availability-calendar';
import {
    Tent,
    Star,
    Calendar as CalendarIcon,
    ShieldCheck,
    Check,
    ShoppingBag,
    ArrowRight,
    Sparkles,
    User as UserIcon,
    History,
    MessageSquare,
    Info,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
    UnitConditionBadge,
    UnitStatusBadge,
} from '@/components/status-badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCart } from '@/hooks/use-cart';
import CustomerLayout from '@/layouts/customer-layout';
import { formatRupiah, formatDate, formatDateTime } from '@/lib/formatters';
import type { Equipment } from '@/types';

interface CatalogShowProps {
    equipment: Equipment;
    stats: {
        totalUnits: number;
        /** Date-aware available stock as of today – uses getAvailableStockForDates(today, today). */
        availableStockToday: number;
        avgRating: number;
        totalReviews: number;
    };
    calendarEvents: Array<{
        title: string;
        start: string;
        allDay: boolean;
        color: string;
        extendedProps: {
            available: boolean;
            remainingStock: number;
            totalUnits: number;
            bookedUnits: number;
        };
    }>;
}

export default function CatalogShow({
    equipment,
    stats,
    calendarEvents,
}: CatalogShowProps) {
    const { addItem } = useCart();
    const [quantity, setQuantity] = useState<number>(1);

    const pricePerDay =
        typeof equipment.price_per_day === 'string'
            ? parseFloat(equipment.price_per_day)
            : equipment.price_per_day;

    const depositPerUnit =
        typeof equipment.deposit_per_unit === 'string'
            ? parseFloat(equipment.deposit_per_unit)
            : equipment.deposit_per_unit;

    const subtotalRentPerDay = pricePerDay * quantity;
    const subtotalDeposit = depositPerUnit * quantity;

    const handleQuantityChange = (qty: number) => {
        const newQty = Math.max(1, qty);
        setQuantity(newQty);
    };

    const handleAddToCart = () => {
        addItem(equipment, quantity);
        toast.success(
            `${quantity}x ${equipment.name} berhasil ditambahkan ke keranjang!`,
            { position: 'bottom-right' },
        );
    };

    const handleDirectCheckout = () => {
        addItem(equipment, quantity);
        router.visit('/cart');
    };

    return (
        <CustomerLayout>
            <Head title={`${equipment.name} - Sewa Alat Camping`} />

            {/* Breadcrumb Navigation */}
            <div className="border-b border-border bg-muted/30">
                <div className="container mx-auto flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground sm:px-6 lg:px-8">
                    <Link href="/" className="hover:text-foreground">
                        Katalog
                    </Link>
                    <span>/</span>
                    <Link
                        href={`/?category=${equipment.category?.slug}`}
                        className="hover:text-foreground"
                    >
                        {equipment.category?.name}
                    </Link>
                    <span>/</span>
                    <span className="truncate font-medium text-foreground">
                        {equipment.name}
                    </span>
                </div>
            </div>

            <div className="container mx-auto space-y-10 px-4 py-8 sm:px-6 lg:px-8">
                {/* Top Section: Photos + Rental Form */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    {/* Left: Product Image & Highlights (7 cols) */}
                    <div className="space-y-6 lg:col-span-7">
                        <div className="relative aspect-16/10 overflow-hidden rounded-2xl border border-border bg-muted">
                            {equipment.image_url ? (
                                <img
                                    src={equipment.image_url}
                                    alt={equipment.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                    <Tent className="h-20 w-20 opacity-30" />
                                </div>
                            )}
                            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
                                <Badge className="bg-zinc-900/90 text-xs font-semibold text-white backdrop-blur-md shadow-sm">
                                    {equipment.category?.name}
                                </Badge>
                                {equipment.brand && (
                                    <Badge className="bg-violet-900/90 text-xs font-semibold text-white backdrop-blur-md shadow-sm">
                                        {equipment.brand.name}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Quick Trust Badges */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3">
                                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                                <div className="text-xs">
                                    <div className="font-semibold text-foreground">
                                        Unit Terawat
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                        QC sebelum serah terima
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3">
                                <div className="rounded-lg bg-blue-50 p-2 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <div className="text-xs">
                                    <div className="font-semibold text-foreground">
                                        Cukup DP 30%
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                        Pelunasan saat COD
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3">
                                <div className="rounded-lg bg-amber-50 p-2 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                                    <Star className="h-4 w-4" />
                                </div>
                                <div className="text-xs">
                                    <div className="font-semibold text-foreground">
                                        {stats.avgRating || '5.0'} / 5.0
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                        {stats.totalReviews} ulasan penyewa
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Booking Form & Pricing Card (5 cols) */}
                    <div className="lg:col-span-5">
                        <Card className="sticky top-20 border-border shadow-sm">
                            <CardContent className="space-y-5 p-6">
                                <div>
                                    {equipment.brand && (
                                        <div className="mb-1.5 flex items-center gap-1.5">
                                            <Link
                                                href={`/?brand=${equipment.brand.slug}`}
                                                className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline uppercase tracking-wider"
                                            >
                                                {equipment.brand.name}
                                            </Link>
                                        </div>
                                    )}
                                    <h1 className="text-xl leading-snug font-bold tracking-tight text-foreground sm:text-2xl">
                                        {equipment.name}
                                    </h1>
                                    <div className="mt-2 flex items-center gap-2 text-xs">
                                        {stats.availableStockToday > 0 ? (
                                            <Badge
                                                variant="outline"
                                                className="border-emerald-500/30 bg-emerald-50 font-semibold text-emerald-700 dark:border-emerald-700/30 dark:bg-emerald-950/30 dark:text-emerald-400"
                                            >
                                                {stats.availableStockToday} dari {stats.totalUnits} Unit Siap Disewa
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="border-amber-500/30 bg-amber-50 font-semibold text-amber-700 dark:border-amber-700/30 dark:bg-amber-950/30 dark:text-amber-400"
                                            >
                                                Stok Penuh / Sedang Disewa Semua
                                            </Badge>
                                        )}
                                        <span className="text-muted-foreground">•</span>
                                        <span className="text-muted-foreground">
                                            Cek tanggal Anda di bawah
                                        </span>
                                    </div>
                                </div>

                                {/* Price Box */}
                                <div className="flex items-baseline justify-between rounded-xl border border-border/80 bg-muted/60 p-4">
                                    <div>
                                        <span className="block text-xs text-muted-foreground">
                                            Tarif Sewa:
                                        </span>
                                        <span className="font-variant-numeric text-2xl font-extrabold text-foreground tabular-nums">
                                            {formatRupiah(pricePerDay)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {' '}
                                            /hari
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xs text-muted-foreground">
                                            Jaminan (Deposit):
                                        </span>
                                        <span className="font-variant-numeric text-sm font-semibold text-foreground tabular-nums">
                                            {formatRupiah(depositPerUnit)}
                                        </span>
                                        <span className="block text-[11px] text-muted-foreground">
                                            (Refund saat kembali)
                                        </span>
                                    </div>
                                </div>

                                {/* Quantity Picker Form */}
                                <div className="space-y-4 pt-1">
                                    <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/20 p-3">
                                        <div>
                                            <Label className="text-xs font-semibold block text-foreground">
                                                Jumlah Unit Sewa:
                                            </Label>
                                            <span className="text-[11px] text-muted-foreground">
                                                Tentukan kuantitas yang ingin disewa
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() =>
                                                    handleQuantityChange(
                                                        quantity - 1,
                                                    )
                                                }
                                                disabled={quantity <= 1}
                                            >
                                                -
                                            </Button>
                                            <span className="w-8 text-center text-sm font-bold tabular-nums">
                                                {quantity}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() =>
                                                    handleQuantityChange(
                                                        quantity + 1,
                                                    )
                                                }
                                            >
                                                +
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Info Banner regarding date selection in cart */}
                                    <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">
                                        <Info className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                                        <div className="space-y-0.5">
                                            <span className="font-semibold block">Penentuan Jadwal Trip</span>
                                            <p className="text-[11px] leading-relaxed text-emerald-700/90 dark:text-emerald-300/80">
                                                Rentang tanggal sewa & perhitungan hari dapat ditentukan sekaligus untuk seluruh alat di halaman Keranjang saat checkout.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Calculation Breakdown (Per Hari) */}
                                <div className="space-y-2 border-t border-border pt-3 text-xs">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Biaya Sewa ({quantity} unit):</span>
                                        <span className="font-variant-numeric font-semibold text-foreground tabular-nums">
                                            {formatRupiah(subtotalRentPerDay)}{' '}
                                            <span className="text-[11px] font-normal text-muted-foreground">/hari</span>
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Deposit Jaminan ({quantity} unit):</span>
                                        <span className="font-variant-numeric font-semibold text-foreground tabular-nums">
                                            {formatRupiah(subtotalDeposit)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t border-border/60 pt-2 text-xs text-muted-foreground">
                                        <span>Status Unit Fisik:</span>
                                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                            {stats.availableStockToday} unit siap pakai hari ini
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2 pt-2">
                                    <Button
                                        onClick={handleDirectCheckout}
                                        className="h-11 w-full gap-2 bg-zinc-900 font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                        Sewa Sekarang (Checkout)
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleAddToCart}
                                        className="h-10 w-full gap-2 text-xs font-semibold"
                                    >
                                        <ShoppingBag className="h-4 w-4" />
                                        Tambah ke Keranjang
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Bottom Section: Tabs (Deskripsi, Kalender FullCalendar, Riwayat Unit, Review) */}
                <div className="pt-6">
                    <Tabs defaultValue="description" className="w-full">
                        <TabsList className="grid h-11 w-full max-w-2xl grid-cols-4 bg-muted">
                            <TabsTrigger
                                value="description"
                                className="text-xs font-semibold"
                            >
                                Deskripsi & Spek
                            </TabsTrigger>
                            <TabsTrigger
                                value="calendar"
                                className="gap-1.5 text-xs font-semibold"
                            >
                                <CalendarIcon className="h-3.5 w-3.5" />
                                Kalender Stok
                            </TabsTrigger>
                            <TabsTrigger
                                value="units"
                                className="gap-1.5 text-xs font-semibold"
                            >
                                <History className="h-3.5 w-3.5" />
                                Riwayat Unit ({equipment.units?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger
                                value="reviews"
                                className="gap-1.5 text-xs font-semibold"
                            >
                                <MessageSquare className="h-3.5 w-3.5" />
                                Review ({equipment.reviews?.length || 0})
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab 1: Description & Specs */}
                        <TabsContent
                            value="description"
                            className="mt-6 space-y-6"
                        >
                            <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
                                <div>
                                    <h3 className="mb-2 text-base font-bold">
                                        Deskripsi Produk
                                    </h3>
                                    <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                                        {equipment.description}
                                    </p>
                                </div>

                                {equipment.specifications &&
                                    Object.keys(equipment.specifications)
                                        .length > 0 && (
                                        <div>
                                            <h3 className="mb-3 text-base font-bold">
                                                Spesifikasi Teknis
                                            </h3>
                                            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                                                {Object.entries(
                                                    equipment.specifications,
                                                ).map(([key, val]) => (
                                                    <div
                                                        key={key}
                                                        className="flex justify-between rounded-lg border border-border bg-muted/50 p-3"
                                                    >
                                                        <span className="font-medium text-muted-foreground">
                                                            {key}:
                                                        </span>
                                                        <span className="text-right font-semibold text-foreground">
                                                            {val}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </TabsContent>

                        {/* Tab 2: Availability Calendar (Interactive Native Calendar - SRS-F-004) */}
                        <TabsContent value="calendar" className="mt-6">
                            <EquipmentAvailabilityCalendar
                                events={calendarEvents}
                                totalUnits={stats.totalUnits}
                            />
                        </TabsContent>

                        {/* Tab 3: Unit Logs & Condition History (SRS-F-011) */}
                        <TabsContent value="units" className="mt-6 space-y-6">
                            <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
                                <div>
                                    <h3 className="mb-1 text-base font-bold">
                                        Daftar Unit Fisik & Kondisi Terkini
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Pelacakan transparansi riwayat pemakaian
                                        dan kondisi per unit alat fisik.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {equipment.units?.map((unit) => (
                                        <div
                                            key={unit.id}
                                            className="space-y-3 rounded-xl border border-border bg-muted/30 p-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="rounded-md bg-zinc-900 px-2.5 py-0.5 font-mono text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                                                    {unit.unit_code}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <UnitStatusBadge
                                                        status={unit.status}
                                                    />
                                                    <UnitConditionBadge
                                                        condition={
                                                            unit.condition
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            {unit.notes && (
                                                <p className="text-xs text-muted-foreground italic">
                                                    Catatan: {unit.notes}
                                                </p>
                                            )}

                                            {/* Unit History Logs */}
                                            {unit.unit_logs &&
                                                unit.unit_logs.length > 0 && (
                                                    <div className="space-y-2 border-t border-border pt-2">
                                                        <span className="block text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                                            Riwayat Pemakaian &
                                                            Perawatan:
                                                        </span>
                                                        <div className="space-y-1.5">
                                                            {unit.unit_logs
                                                                .slice(0, 3)
                                                                .map((log) => (
                                                                    <div
                                                                        key={
                                                                            log.id
                                                                        }
                                                                        className="flex items-start justify-between gap-2 rounded border border-border/80 bg-card p-2 text-xs"
                                                                    >
                                                                        <div>
                                                                            <span className="block font-medium text-foreground capitalize">
                                                                                {log.type ===
                                                                                'handover'
                                                                                    ? 'Serah Terima Sewa'
                                                                                    : log.type ===
                                                                                        'return'
                                                                                      ? 'Pengembalian Unit'
                                                                                      : 'Pemeriksaan Unit'}
                                                                            </span>
                                                                            <span className="text-[11px] text-muted-foreground">
                                                                                {log.notes ||
                                                                                    '-'}
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-[10px] whitespace-nowrap text-muted-foreground">
                                                                            {formatDate(
                                                                                log.created_at,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    </div>
                                                )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab 4: Reviews & Ratings (SRS-F-014) */}
                        <TabsContent value="reviews" className="mt-6">
                            <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-bold">
                                            Ulasan & Penilaian Penyewa
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Ulasan asli dari pelanggan yang
                                            telah selesai menyewa alat ini.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center text-amber-500">
                                            <Star className="h-5 w-5 fill-current" />
                                        </div>
                                        <span className="text-2xl font-black">
                                            {stats.avgRating || '5.0'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            / 5.0
                                        </span>
                                    </div>
                                </div>

                                {equipment.reviews &&
                                equipment.reviews.length > 0 ? (
                                    <div className="space-y-4">
                                        {equipment.reviews.map((rev) => (
                                            <div
                                                key={rev.id}
                                                className="space-y-2 rounded-xl border border-border bg-muted/20 p-4"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold dark:bg-zinc-800">
                                                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-semibold text-foreground">
                                                                {rev.user
                                                                    ?.name ||
                                                                    'Penyewa Terverifikasi'}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground">
                                                                {formatDate(
                                                                    rev.created_at,
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-0.5 text-amber-500">
                                                        {Array.from({
                                                            length: 5,
                                                        }).map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`h-3.5 w-3.5 ${
                                                                    i <
                                                                    rev.rating
                                                                        ? 'fill-current'
                                                                        : 'text-zinc-300 dark:text-zinc-700'
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="pl-10 text-xs leading-relaxed text-muted-foreground">
                                                    "{rev.comment}"
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center text-xs text-muted-foreground">
                                        Belum ada ulasan untuk alat ini. Jadilah
                                        penyewa pertama yang memberikan ulasan!
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </CustomerLayout>
    );
}
