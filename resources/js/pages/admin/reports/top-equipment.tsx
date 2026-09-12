import React from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
    Award,
    Flame,
    Star,
    Tent,
    TrendingUp,
    AlertTriangle,
    Layers,
    Package,
} from 'lucide-react';
import { BreadcrumbItem } from '@/types';
import { ReportFilterBar } from '@/components/reports/report-filter-bar';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Laporan & Analitik',
        href: '/admin/reports/revenue',
    },
    {
        title: 'Alat Camping Terlaris',
        href: '/admin/reports/top-equipment',
    },
];

interface TopEquipmentProps {
    rankedEquipment: Array<{
        id: number;
        name: string;
        slug: string;
        image_url?: string;
        category_name: string;
        price_per_day: number;
        period_rental_count: number;
        period_quantity_rented: number;
        period_revenue_generated: number;
        total_units_count: number;
        available_units_count: number;
        average_rating: number;
        reviews_count: number;
    }>;
    lowDemandEquipment: Array<{
        id: number;
        name: string;
        slug: string;
        image_url?: string;
        category_name: string;
        price_per_day: number;
        period_rental_count: number;
        period_quantity_rented: number;
        period_revenue_generated: number;
        total_units_count: number;
        available_units_count: number;
        average_rating: number;
        reviews_count: number;
    }>;
    categoriesShare: Array<{
        id: number;
        name: string;
        total_equipment: number;
        total_quantity_rented: number;
        total_revenue: number;
    }>;
    categories: Array<{
        id: number;
        name: string;
    }>;
    filters: {
        start_date: string;
        end_date: string;
        category_id?: string;
    };
}

const topChartConfig: ChartConfig = {
    period_quantity_rented: {
        label: 'Total Unit Tersewa',
        color: '#10b981',
    },
};

export default function TopEquipmentReport({
    rankedEquipment,
    lowDemandEquipment,
    categoriesShare,
    categories,
    filters,
}: TopEquipmentProps) {
    // Export CSV logic
    const handleExportCsv = () => {
        const headers = ['Peringkat', 'Nama Alat', 'Kategori', 'Tarif / Hari (Rp)', 'Frekuensi Pesanan', 'Total Unit Keluar', 'Total Omset Sewa (Rp)', 'Stok Fisik', 'Rating Rata-rata'];
        const rows = rankedEquipment.map((eq, idx) => [
            idx + 1,
            `"${eq.name.replace(/"/g, '""')}"`,
            eq.category_name,
            eq.price_per_day,
            eq.period_rental_count,
            eq.period_quantity_rented,
            eq.period_revenue_generated,
            `${eq.available_units_count}/${eq.total_units_count}`,
            eq.average_rating > 0 ? `${eq.average_rating} (${eq.reviews_count} ulasan)` : 'Belum ada',
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `laporan_alat_terlaris_${filters.start_date}_sd_${filters.end_date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calculate Summary Metrics
    const totalUnitsRentedPeriod = rankedEquipment.reduce((acc, it) => acc + it.period_quantity_rented, 0);
    const totalRevenueGeneratedPeriod = rankedEquipment.reduce((acc, it) => acc + it.period_revenue_generated, 0);
    const topCategory = categoriesShare.length > 0 ? categoriesShare[0] : null;
    const top5Equipment = rankedEquipment.slice(0, 5).map((e) => ({
        name: e.name.length > 18 ? e.name.substring(0, 18) + '...' : e.name,
        period_quantity_rented: e.period_quantity_rented,
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Alat Camping Terlaris - Admin" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Page Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Laporan Alat Camping Terlaris</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Analisis produk terpopuler, perolehan omset per alat, tingkat kepuasan ulasan penyewa, dan deteksi alat berkurang peminat.
                        </p>
                    </div>
                </div>

                {/* Printable Header Title */}
                <div className="hidden print:block border-b border-border pb-4 space-y-1">
                    <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase">CampTrack &bull; Sistem Penyewaan Alat Camping</div>
                    <h1 className="text-xl font-bold">LAPORAN ALAT CAMPING TERLARIS & PERINGKAT POPULARITAS</h1>
                    <p className="text-xs text-muted-foreground">
                        Periode: {formatDate(filters.start_date)} s/d {formatDate(filters.end_date)} &bull; Dicetak pada: {new Date().toLocaleString('id-ID')}
                    </p>
                </div>

                {/* Filter Bar with Category Select */}
                <ReportFilterBar
                    routePath="/admin/reports/top-equipment"
                    startDate={filters.start_date}
                    endDate={filters.end_date}
                    extraParams={{ category_id: filters.category_id }}
                    onExportCsv={handleExportCsv}
                >
                    <div className="space-y-1 flex-1 w-full">
                        <Label className="text-xs font-semibold">Kategori Alat:</Label>
                        <Select
                            value={filters.category_id || 'all'}
                            onValueChange={(val) => {
                                router.get(
                                    '/admin/reports/top-equipment',
                                    {
                                        start_date: filters.start_date,
                                        end_date: filters.end_date,
                                        category_id: val === 'all' ? undefined : val,
                                    },
                                    { preserveState: true }
                                );
                            }}
                        >
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Semua Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kategori</SelectItem>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={c.id.toString()}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </ReportFilterBar>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Total Unit Keluar Tersewa
                            </CardTitle>
                            <Flame className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-extrabold text-foreground font-variant-numeric tabular-nums">
                                {totalUnitsRentedPeriod} Unit
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Dari {rankedEquipment.length} jenis alat camping
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Total Omset Alat Tersewa
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-variant-numeric tabular-nums">
                                {formatRupiah(totalRevenueGeneratedPeriod)}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Kontribusi pendapatan kotor sewa
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Kategori Terfavorit
                            </CardTitle>
                            <Award className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-extrabold text-foreground truncate">
                                {topCategory ? topCategory.name : '-'}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                {topCategory ? `${topCategory.total_quantity_rented} unit keluar (${formatRupiah(topCategory.total_revenue)})` : 'Belum ada data'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Perlu Perhatian / Promo
                            </CardTitle>
                            <AlertTriangle className="h-4 w-4 text-rose-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-extrabold text-foreground">
                                {lowDemandEquipment.length} Alat
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                &le; 1 unit tersewa selama periode ini
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Top 5 Chart Visual */}
                {top5Equipment.length > 0 && (
                    <Card className="border-border shadow-none print:hidden">
                        <CardHeader className="pb-2 border-b border-border">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Flame className="h-4 w-4 text-amber-500" />
                                <span>Grafik 5 Alat Paling Banyak Disewa (Unit)</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-6">
                            <ChartContainer config={topChartConfig} className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={top5Equipment} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                                        <YAxis tickLine={false} axisLine={false} />
                                        <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                                        <Bar dataKey="period_quantity_rented" fill="#10b981" radius={[4, 4, 0, 0]} name="Total Unit Disewa" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Main Content Tabs */}
                <Tabs defaultValue="ranking" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-md h-9 bg-muted print:hidden">
                        <TabsTrigger value="ranking" className="text-xs font-semibold">
                            🏆 Peringkat Alat Terlaris
                        </TabsTrigger>
                        <TabsTrigger value="low" className="text-xs font-semibold">
                            ⚠️ Alat Kurang Laku ({lowDemandEquipment.length})
                        </TabsTrigger>
                        <TabsTrigger value="category" className="text-xs font-semibold">
                            📊 Share Kategori
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Ranking Table */}
                    <TabsContent value="ranking" className="mt-4">
                        <Card className="border-border shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold">Daftar Peringkat Seluruh Alat Camping</CardTitle>
                                <CardDescription className="text-xs">
                                    Diurutkan berdasarkan total unit fisik yang keluar tersewa dan omset yang dihasilkan.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-muted/50 border-b border-border text-muted-foreground">
                                                <th className="py-2.5 px-4 font-semibold text-center w-12 whitespace-nowrap">Rank</th>
                                                <th className="py-2.5 px-4 font-semibold whitespace-nowrap">Nama Alat Camping</th>
                                                <th className="py-2.5 px-4 font-semibold whitespace-nowrap">Kategori</th>
                                                <th className="py-2.5 px-4 font-semibold text-right whitespace-nowrap">Tarif / Hari</th>
                                                <th className="py-2.5 px-4 font-semibold text-center whitespace-nowrap">Frekuensi Transaksi</th>
                                                <th className="py-2.5 px-4 font-semibold text-center whitespace-nowrap">Total Unit Keluar</th>
                                                <th className="py-2.5 px-4 font-semibold text-right whitespace-nowrap">Total Omset Sewa</th>
                                                <th className="py-2.5 px-4 font-semibold text-center whitespace-nowrap">Stok Unit Fisik</th>
                                                <th className="py-2.5 px-4 font-semibold text-center whitespace-nowrap">Rating Ulasan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {rankedEquipment.map((eq, idx) => (
                                                <tr key={eq.id} className="hover:bg-muted/20 transition-colors">
                                                    <td className="py-3 px-4 text-center font-extrabold whitespace-nowrap">
                                                        {idx === 0 ? (
                                                            <Badge className="bg-amber-500 text-white text-[10px]">#1</Badge>
                                                        ) : idx === 1 ? (
                                                            <Badge className="bg-slate-400 text-white text-[10px]">#2</Badge>
                                                        ) : idx === 2 ? (
                                                            <Badge className="bg-amber-700 text-white text-[10px]">#3</Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground font-semibold">#{idx + 1}</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-foreground whitespace-nowrap">
                                                        {eq.name}
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                                                        {eq.category_name}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-variant-numeric tabular-nums text-muted-foreground whitespace-nowrap">
                                                        {formatRupiah(eq.price_per_day)}
                                                    </td>
                                                    <td className="py-3 px-4 text-center font-medium whitespace-nowrap">
                                                        {eq.period_rental_count}x sewa
                                                    </td>
                                                    <td className="py-3 px-4 text-center font-extrabold text-foreground whitespace-nowrap">
                                                        <Badge variant="secondary" className="font-bold">
                                                            {eq.period_quantity_rented} unit
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-extrabold font-variant-numeric tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                        {formatRupiah(eq.period_revenue_generated)}
                                                    </td>
                                                    <td className="py-3 px-4 text-center whitespace-nowrap">
                                                        <span className="text-[11px] text-muted-foreground">
                                                            <strong className="text-foreground">{eq.available_units_count}</strong> / {eq.total_units_count}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center whitespace-nowrap">
                                                        {eq.reviews_count > 0 ? (
                                                            <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                                                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                                                <span>{eq.average_rating}</span>
                                                                <span className="text-[10px] text-muted-foreground font-normal">({eq.reviews_count})</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] text-muted-foreground">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab 2: Low Demand Table */}
                    <TabsContent value="low" className="mt-4">
                        <Card className="border-border shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                                    <span>Daftar Alat Kurang Laku (Low Demand)</span>
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Alat yang belum pernah disewa atau hanya disewa &le; 1 kali pada rentang tanggal ini. Dapat dievaluasi untuk strategi bundling, diskon, atau penyesuaian harga sewa.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-muted/50 border-b border-border text-muted-foreground">
                                                <th className="py-2.5 px-4 font-semibold whitespace-nowrap">Nama Alat</th>
                                                <th className="py-2.5 px-4 font-semibold whitespace-nowrap">Kategori</th>
                                                <th className="py-2.5 px-4 font-semibold text-right whitespace-nowrap">Tarif / Hari</th>
                                                <th className="py-2.5 px-4 font-semibold text-center whitespace-nowrap">Unit Tersewa</th>
                                                <th className="py-2.5 px-4 font-semibold text-right whitespace-nowrap">Pemasukan</th>
                                                <th className="py-2.5 px-4 font-semibold text-center whitespace-nowrap">Stok Fisik Tersedia</th>
                                                <th className="py-2.5 px-4 font-semibold text-center whitespace-nowrap">Status Kepuasan Ulasan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {lowDemandEquipment.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="text-center py-8 text-emerald-600 font-medium whitespace-nowrap">
                                                        Semua alat camping aktif tersewa dengan baik pada periode ini!
                                                    </td>
                                                </tr>
                                            ) : (
                                                lowDemandEquipment.map((eq) => (
                                                    <tr key={eq.id} className="hover:bg-muted/20">
                                                        <td className="py-3 px-4 font-semibold text-foreground whitespace-nowrap">
                                                            {eq.name}
                                                        </td>
                                                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                                                            {eq.category_name}
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-variant-numeric tabular-nums text-muted-foreground whitespace-nowrap">
                                                            {formatRupiah(eq.price_per_day)}
                                                        </td>
                                                        <td className="py-3 px-4 text-center font-bold text-rose-600 whitespace-nowrap">
                                                            {eq.period_quantity_rented} unit
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-variant-numeric tabular-nums text-muted-foreground whitespace-nowrap">
                                                            {formatRupiah(eq.period_revenue_generated)}
                                                        </td>
                                                        <td className="py-3 px-4 text-center font-medium whitespace-nowrap">
                                                            {eq.available_units_count} / {eq.total_units_count} unit
                                                        </td>
                                                        <td className="py-3 px-4 text-center whitespace-nowrap">
                                                            {eq.reviews_count > 0 ? (
                                                                <span className="text-[11px] font-bold text-amber-600">★ {eq.average_rating} ({eq.reviews_count})</span>
                                                            ) : (
                                                                <span className="text-[10px] text-muted-foreground">Belum ada review</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab 3: Category Share */}
                    <TabsContent value="category" className="mt-4">
                        <Card className="border-border shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold">Distribusi Kontribusi per Kategori Alat</CardTitle>
                                <CardDescription className="text-xs">
                                    Perbandingan pangsa omset dan volume unit tersewa antar kategori.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-muted/50 border-b border-border text-muted-foreground">
                                                <th className="py-2.5 px-4 font-semibold whitespace-nowrap">Nama Kategori</th>
                                                <th className="py-2.5 px-4 font-semibold text-center whitespace-nowrap">Jumlah Model Alat</th>
                                                <th className="py-2.5 px-4 font-semibold text-center whitespace-nowrap">Total Unit Keluar</th>
                                                <th className="py-2.5 px-4 font-semibold text-right whitespace-nowrap">Total Omset Kategori</th>
                                                <th className="py-2.5 px-4 font-semibold text-right whitespace-nowrap">Pangsa Omset (%)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {categoriesShare.map((cat) => {
                                                const sharePercent = totalRevenueGeneratedPeriod > 0
                                                    ? ((cat.total_revenue / totalRevenueGeneratedPeriod) * 100).toFixed(1)
                                                    : '0.0';

                                                return (
                                                    <tr key={cat.id} className="hover:bg-muted/20">
                                                        <td className="py-3 px-4 font-semibold text-foreground whitespace-nowrap">
                                                            {cat.name}
                                                        </td>
                                                        <td className="py-3 px-4 text-center text-muted-foreground whitespace-nowrap">
                                                            {cat.total_equipment} model
                                                        </td>
                                                        <td className="py-3 px-4 text-center font-bold text-foreground whitespace-nowrap">
                                                            {cat.total_quantity_rented} unit
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-bold font-variant-numeric tabular-nums text-foreground whitespace-nowrap">
                                                            {formatRupiah(cat.total_revenue)}
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-semibold text-emerald-600 whitespace-nowrap">
                                                            {sharePercent}%
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
