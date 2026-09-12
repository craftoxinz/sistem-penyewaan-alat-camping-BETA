import { Head, Link, usePage } from '@inertiajs/react';
import {
    DollarSign,
    ShoppingBag,
    Clock,
    Layers,
    Tent,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    PlusCircle,
    PackageCheck,
    ArrowLeftRight,
} from 'lucide-react';
import React from 'react';
import {
    RentalStatusBadge,
    PaymentStatusBadge,
} from '@/components/status-badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah, formatDate } from '@/lib/formatters';
import type { Rental, Equipment, User } from '@/types';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin',
    },
];

interface DashboardProps {
    stats: {
        monthRevenue: number;
        totalRevenue: number;
        pendingDpCount: number;
        readyPickupCount: number;
        activeRentalsCount: number;
        totalRentalsCount: number;
        totalUnits: number;
        rentedUnits: number;
        availableUnits: number;
        maintenanceUnits: number;
    };
    topEquipment: Equipment[];
    recentRentals: Rental[];
}

export default function AdminDashboard({
    stats,
    topEquipment,
    recentRentals,
}: DashboardProps) {
    const page = usePage<{ auth: { user: User } }>();
    const user = page.props.auth?.user;

    const isGudang = user?.role === 'petugas_gudang';
    const isKasir = user?.role === 'kasir';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={
                    isGudang
                        ? 'Dashboard Gudang - CampRental'
                        : isKasir
                          ? 'Dashboard Kasir - CampRental'
                          : 'Dashboard Admin - CampRental'
                }
            />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Welcome & Quick Action Bar */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isGudang
                                ? 'Dashboard Operasional Gudang'
                                : isKasir
                                  ? 'Dashboard Kasir & Transaksi'
                                  : 'Dashboard Operasional Rental'}
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {isGudang
                                ? 'Monitoring kesiapan unit fisik, serah terima alat, dan logistik inventaris.'
                                : isKasir
                                  ? 'Monitoring verifikasi uang muka (DP), pelunasan COD, dan kasir transaksi.'
                                  : 'Ringkasan pemesanan, verifikasi pembayaran, operasional unit, dan inventaris.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isGudang ? (
                            <>
                                <Button
                                    size="sm"
                                    asChild
                                    className="gap-1.5 bg-zinc-900 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900"
                                >
                                    <Link href="/admin/units">
                                        <Layers className="h-3.5 w-3.5" />
                                        <span>Unit Fisik & QR</span>
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="gap-1.5 text-xs"
                                >
                                    <Link href="/admin/inventory-logs">
                                        <ArrowLeftRight className="h-3.5 w-3.5" />
                                        <span>Log Mutasi</span>
                                    </Link>
                                </Button>
                            </>
                        ) : isKasir ? (
                            <>
                                <Button
                                    size="sm"
                                    asChild
                                    className="gap-1.5 bg-zinc-900 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900"
                                >
                                    <Link href="/admin/rentals">
                                        <ShoppingBag className="h-3.5 w-3.5" />
                                        <span>Verifikasi Pesanan</span>
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="gap-1.5 text-xs"
                                >
                                    <Link href="/admin/reports/payments">
                                        <DollarSign className="h-3.5 w-3.5" />
                                        <span>Laporan Kasir</span>
                                    </Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    size="sm"
                                    asChild
                                    className="gap-1.5 bg-zinc-900 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900"
                                >
                                    <Link href="/admin/equipment/create">
                                        <PlusCircle className="h-3.5 w-3.5" />
                                        <span>Tambah Alat</span>
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="gap-1.5 text-xs"
                                >
                                    <Link href="/admin/rentals">
                                        <ShoppingBag className="h-3.5 w-3.5" />
                                        <span>Kelola Pesanan</span>
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* KPI Metrics Grid (4 cards) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Card 1: Revenue (or Unit Siap Ambil for Gudang) */}
                    {isGudang ? (
                        <Card className="border-border shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Siap Diserahterimakan
                                </CardTitle>
                                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                    <PackageCheck className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                <div className="font-variant-numeric text-xl font-extrabold tabular-nums">
                                    {stats.readyPickupCount} Pesanan
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Menunggu pengambilan oleh penyewa
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-border shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Pendapatan Bulan Ini
                                </CardTitle>
                                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                    <DollarSign className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                <div className="font-variant-numeric text-xl font-extrabold tabular-nums">
                                    {formatRupiah(stats.monthRevenue)}
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Total akumulasi: {formatRupiah(stats.totalRevenue)}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Pending DP Verifications */}
                    <Card className="border-border shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Butuh Verifikasi DP
                            </CardTitle>
                            <div className="rounded-lg bg-amber-50 p-2 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                <Clock className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <div className="flex items-center gap-2 text-xl font-extrabold">
                                <span>{stats.pendingDpCount}</span>
                                {stats.pendingDpCount > 0 && (
                                    <Badge className="h-5 bg-amber-500 px-1.5 text-[10px] text-white">
                                        Perlu Ditinjau
                                    </Badge>
                                )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                {stats.readyPickupCount} pesanan siap diambil
                            </p>
                        </CardContent>
                    </Card>

                    {/* Active Rentals */}
                    <Card className="border-border shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Sedang Disewa
                            </CardTitle>
                            <div className="rounded-lg bg-blue-50 p-2 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                                <ShoppingBag className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <div className="text-xl font-extrabold">
                                {stats.activeRentalsCount} Pesanan
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Total {stats.totalRentalsCount} transaksi sewa
                            </p>
                        </CardContent>
                    </Card>

                    {/* Physical Units Status */}
                    <Card className="border-border shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Unit Fisik Inventaris
                            </CardTitle>
                            <div className="rounded-lg bg-zinc-100 p-2 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                                <Layers className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <div className="text-xl font-extrabold">
                                {stats.availableUnits} / {stats.totalUnits}{' '}
                                <span className="text-xs font-normal text-muted-foreground">
                                    Tersedia
                                </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                {stats.rentedUnits} disewa •{' '}
                                {stats.maintenanceUnits} perbaikan
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Middle Content: Recent Orders & Top Equipment */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Recent Orders (8 cols) */}
                    <Card className="border-border shadow-none lg:col-span-8">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-sm font-bold">
                                    Pesanan Masuk Terbaru
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Daftar transaksi penyewaan terbaru yang
                                    perlu dipantau.
                                </CardDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="gap-1 text-xs"
                            >
                                <Link href="/admin/rentals">
                                    <span>Lihat Semua</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
                                    <thead>
                                        <tr className="border-y border-border bg-muted/50 text-muted-foreground">
                                            <th className="px-4 py-2.5 font-semibold whitespace-nowrap">
                                                Invoice
                                            </th>
                                            <th className="px-4 py-2.5 font-semibold whitespace-nowrap">
                                                Penyewa
                                            </th>
                                            <th className="px-4 py-2.5 font-semibold whitespace-nowrap">
                                                Periode
                                            </th>
                                            <th className="px-4 py-2.5 font-semibold whitespace-nowrap">
                                                Total
                                            </th>
                                            <th className="px-4 py-2.5 font-semibold whitespace-nowrap">
                                                Status Sewa
                                            </th>
                                            <th className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {recentRentals.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="py-8 text-center text-muted-foreground whitespace-nowrap"
                                                >
                                                    Belum ada pesanan sewa
                                                    masuk.
                                                </td>
                                            </tr>
                                        ) : (
                                            recentRentals.map((rental) => (
                                                <tr
                                                    key={rental.id}
                                                    className="hover:bg-muted/30"
                                                >
                                                    <td className="px-4 py-3 font-mono font-bold text-foreground whitespace-nowrap">
                                                        {rental.invoice_number}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                                                        <div>
                                                            {rental.user?.name}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            {rental.user
                                                                ?.phone ||
                                                                rental.user
                                                                    ?.email}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                                        {formatDate(
                                                            rental.start_date,
                                                        )}{' '}
                                                        -{' '}
                                                        {formatDate(
                                                            rental.end_date,
                                                        )}
                                                    </td>
                                                    <td className="font-variant-numeric px-4 py-3 font-semibold tabular-nums whitespace-nowrap">
                                                        {formatRupiah(
                                                            rental.total_price,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <RentalStatusBadge
                                                            status={
                                                                rental.rental_status
                                                            }
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            asChild
                                                            className="h-7 px-2.5 text-xs"
                                                        >
                                                            <Link
                                                                href={`/admin/rentals?search=${rental.invoice_number}`}
                                                            >
                                                                Detail
                                                            </Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Rented Equipment Ranking (4 cols) */}
                    <Card className="border-border shadow-none lg:col-span-4">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold">
                                Alat Paling Sering Disewa
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Peringkat popularitas peralatan camping.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {topEquipment.length === 0 ? (
                                <div className="py-8 text-center text-xs text-muted-foreground">
                                    Belum ada data penyewaan alat.
                                </div>
                            ) : (
                                topEquipment.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2.5 text-xs"
                                    >
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                                                {index + 1}
                                            </span>
                                            <div className="min-w-0">
                                                <div className="truncate font-semibold text-foreground">
                                                    {item.name}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {item.category?.name}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className="shrink-0 text-[11px] font-semibold"
                                        >
                                            {item.rental_items_count}x disewa
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
