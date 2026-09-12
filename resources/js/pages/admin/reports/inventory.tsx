import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Wrench,
    Layers,
    ShieldAlert,
    Printer,
    Download,
    ArrowRight,
    Flame,
} from 'lucide-react';
import { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Laporan & Analitik',
        href: '/admin/reports/revenue',
    },
    {
        title: 'Utilisasi & Kondisi Unit',
        href: '/admin/reports/inventory',
    },
];

interface InventoryReportProps {
    conditionSummary: {
        baik: number;
        butuh_perbaikan: number;
        rusak: number;
    };
    statusSummary: {
        tersedia: number;
        disewa: number;
        maintenance: number;
        afkir: number;
    };
    unitFatigueList: Array<{
        id: number;
        unit_code: string;
        equipment_name: string;
        category_name: string;
        status: string;
        condition: string;
        maintenance_count: number;
        repair_count: number;
        total_rentals_count: number;
        fatigue_score: number;
        last_log?: {
            type: string;
            condition_before: string;
            condition_after: string;
            notes?: string;
            created_at: string;
        };
    }>;
    anomalies: Array<{
        id: number;
        unit_code: string;
        equipment_name: string;
        type: 'critical' | 'warning';
        title: string;
        description: string;
        suggested_action: string;
    }>;
    equipmentUtilization: Array<{
        id: number;
        name: string;
        category_name: string;
        total_units: number;
        available_units: number;
        rented_units: number;
        maintenance_units: number;
        utilization_rate: number;
    }>;
    recentMaintenanceLogs: Array<{
        id: number;
        unit_code: string;
        equipment_name: string;
        type?: string;
        condition_before: string;
        condition_after: string;
        notes?: string;
        admin_name: string;
        created_at: string;
    }>;
    totalUnitsCount: number;
}

export default function InventoryReport({
    conditionSummary,
    statusSummary,
    unitFatigueList,
    anomalies,
    equipmentUtilization,
    recentMaintenanceLogs,
    totalUnitsCount,
}: InventoryReportProps) {
    // Export CSV logic
    const handleExportCsv = () => {
        const headers = ['Kode Unit', 'Nama Alat Camping', 'Kategori', 'Status Operasional', 'Kondisi Fisik', 'Total Disewa', 'Jumlah Maintenance', 'Skor Fatigue Kelelahan'];
        const rows = unitFatigueList.map((u) => [
            u.unit_code,
            `"${u.equipment_name}"`,
            u.category_name,
            u.status,
            u.condition,
            u.total_rentals_count,
            u.maintenance_count,
            u.fatigue_score,
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `laporan_utilisasi_dan_kondisi_unit.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getConditionBadge = (condition: string) => {
        switch (condition) {
            case 'baik':
                return <Badge className="bg-emerald-600 text-white text-[10px]">Baik</Badge>;
            case 'butuh_perbaikan':
                return <Badge className="bg-amber-500 text-white text-[10px]">Butuh Perbaikan</Badge>;
            case 'rusak':
                return <Badge variant="destructive" className="text-[10px]">Rusak</Badge>;
            default:
                return <Badge variant="outline" className="text-[10px]">{condition}</Badge>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'tersedia':
                return <Badge variant="outline" className="border-emerald-500 text-emerald-600 text-[10px]">Tersedia</Badge>;
            case 'disewa':
                return <Badge className="bg-blue-600 text-white text-[10px]">Sedang Disewa</Badge>;
            case 'maintenance':
                return <Badge className="bg-purple-600 text-white text-[10px]">Maintenance</Badge>;
            case 'afkir':
                return <Badge variant="secondary" className="text-[10px]">Afkir / Nonaktif</Badge>;
            default:
                return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Utilisasi & Kondisi Armada - Admin" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Utilisasi & Kondisi Armada Inventaris</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Kesehatan fisik unit inventaris, analisis tingkat kelelahan alat (fatigue), dan status kesiapan operasional.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleExportCsv}
                            className="h-8 text-xs gap-1.5 font-medium"
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span>Ekspor CSV</span>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="h-8 text-xs gap-1.5 font-medium"
                        >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Cetak Laporan</span>
                        </Button>
                    </div>
                </div>

                {/* Printable Header Title */}
                <div className="hidden print:block border-b border-border pb-4 space-y-1">
                    <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase">CampTrack &bull; Sistem Penyewaan Alat Camping</div>
                    <h1 className="text-xl font-bold">LAPORAN KESEHATAN ARMADA & UTILISASI UNIT</h1>
                    <p className="text-xs text-muted-foreground">
                        Total Armada: {totalUnitsCount} Unit Fisik &bull; Dicetak pada: {new Date().toLocaleString('id-ID')}
                    </p>
                </div>

                {/* Data Anomaly Detection Banner (SRS-NF-008 Consistency Verification) */}
                {anomalies.length > 0 && (
                    <Card className="border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/20 shadow-none print:hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-rose-900 dark:text-rose-300 flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-rose-600 animate-bounce" />
                                <span>Deteksi Anomali Data Inventaris ({anomalies.length} Perhatian Ditemukan)</span>
                            </CardTitle>
                            <CardDescription className="text-xs text-rose-800/80 dark:text-rose-400/80">
                                Sistem mendeteksi adanya ketidaksesuaian status operasional dan kondisi fisik unit yang perlu diperbaiki.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3">
                            <div className="space-y-2 mt-1">
                                {anomalies.map((anom, idx) => (
                                    <div key={idx} className="bg-background/95 p-2.5 rounded-md border border-rose-200 dark:border-rose-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                                    {anom.unit_code}
                                                </Badge>
                                                <span className="font-bold text-foreground">{anom.title}</span>
                                                <span className="text-muted-foreground">({anom.equipment_name})</span>
                                            </div>
                                            <p className="text-muted-foreground text-[11px] mt-0.5">
                                                {anom.description} &bull; <strong className="text-rose-600">Saran:</strong> {anom.suggested_action}
                                            </p>
                                        </div>
                                        <Link href="/admin/units">
                                            <Button size="sm" variant="outline" className="h-7 text-[11px] shrink-0 gap-1 border-rose-400">
                                                <span>Perbaiki di Unit Fisik</span>
                                                <ArrowRight className="h-3 w-3" />
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Fleet Health Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Kondisi Fisik Baik
                            </CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-variant-numeric tabular-nums">
                                {conditionSummary.baik} Unit ({totalUnitsCount > 0 ? ((conditionSummary.baik / totalUnitsCount) * 100).toFixed(0) : 0}%)
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Siap sewa & tidak ada cacat
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Butuh Perbaikan / Rusak
                            </CardTitle>
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-variant-numeric tabular-nums">
                                {conditionSummary.butuh_perbaikan + conditionSummary.rusak} Unit
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                {conditionSummary.butuh_perbaikan} ringan &bull; {conditionSummary.rusak} rusak berat
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Unit Sedang Disewa
                            </CardTitle>
                            <Activity className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 font-variant-numeric tabular-nums">
                                {statusSummary.disewa} Unit ({totalUnitsCount > 0 ? ((statusSummary.disewa / totalUnitsCount) * 100).toFixed(0) : 0}%)
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Di tangan penyewa saat ini
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Unit Maintenance / Afkir
                            </CardTitle>
                            <Wrench className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-extrabold text-foreground font-variant-numeric tabular-nums">
                                {statusSummary.maintenance + statusSummary.afkir} Unit
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                {statusSummary.maintenance} bengkel &bull; {statusSummary.afkir} afkir
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Tabs */}
                <Tabs defaultValue="fatigue" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-md h-9 bg-muted print:hidden">
                        <TabsTrigger value="fatigue" className="text-xs font-semibold">
                            🛠️ Analisis Unit Fatigue
                        </TabsTrigger>
                        <TabsTrigger value="utilization" className="text-xs font-semibold">
                            📊 Utilisasi per Model
                        </TabsTrigger>
                        <TabsTrigger value="logs" className="text-xs font-semibold">
                            📋 Log Kondisi & Servis
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Unit Fatigue & Maintenance Frequency */}
                    <TabsContent value="fatigue" className="mt-4">
                        <Card className="border-border shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Flame className="h-4 w-4 text-rose-500" />
                                    <span>Peringkat Beban & Kelelahan Unit Fisik (Fatigue Score)</span>
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Mengidentifikasi unit spesifik yang paling sering digunakan atau paling sering masuk perbaikan untuk evaluasi peremajaan/penggantian.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-muted/50 border-b border-border text-muted-foreground">
                                                <th className="py-2.5 px-4 font-semibold">Kode Unit</th>
                                                <th className="py-2.5 px-4 font-semibold">Model Alat</th>
                                                <th className="py-2.5 px-4 font-semibold">Kategori</th>
                                                <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                                                <th className="py-2.5 px-4 font-semibold text-center">Kondisi</th>
                                                <th className="py-2.5 px-4 font-semibold text-center">Riwayat Sewa</th>
                                                <th className="py-2.5 px-4 font-semibold text-center">Total Perbaikan</th>
                                                <th className="py-2.5 px-4 font-semibold text-center">Fatigue Score</th>
                                                <th className="py-2.5 px-4 font-semibold">Catatan Terakhir</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {unitFatigueList.map((unit) => (
                                                <tr key={unit.id} className="hover:bg-muted/20">
                                                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                                                        {unit.unit_code}
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-foreground">
                                                        {unit.equipment_name}
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground">
                                                        {unit.category_name}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {getStatusBadge(unit.status)}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {getConditionBadge(unit.condition)}
                                                    </td>
                                                    <td className="py-3 px-4 text-center font-bold">
                                                        {unit.total_rentals_count}x
                                                    </td>
                                                    <td className="py-3 px-4 text-center font-bold text-amber-600">
                                                        {unit.maintenance_count}x
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <Badge
                                                            variant="outline"
                                                            className={`font-mono font-bold ${
                                                                unit.fatigue_score >= 10
                                                                    ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300'
                                                                    : unit.fatigue_score >= 5
                                                                    ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                            }`}
                                                        >
                                                            {unit.fatigue_score}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground max-w-xs truncate text-[11px]">
                                                        {unit.last_log ? `${unit.last_log.notes || 'Perubahan kondisi'} (${unit.last_log.created_at})` : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab 2: Equipment Utilization Rate */}
                    <TabsContent value="utilization" className="mt-4">
                        <Card className="border-border shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold">Tingkat Utilisasi per Model Alat Camping</CardTitle>
                                <CardDescription className="text-xs">
                                    Persentase unit yang aktif tersewa dibandingkan dengan total armada fisik yang dimiliki.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-muted/50 border-b border-border text-muted-foreground">
                                                <th className="py-2.5 px-4 font-semibold">Model Alat</th>
                                                <th className="py-2.5 px-4 font-semibold">Kategori</th>
                                                <th className="py-2.5 px-4 font-semibold text-center">Total Armada</th>
                                                <th className="py-2.5 px-4 font-semibold text-center">Tersedia</th>
                                                <th className="py-2.5 px-4 font-semibold text-center">Sedang Disewa</th>
                                                <th className="py-2.5 px-4 font-semibold text-center">Maintenance</th>
                                                <th className="py-2.5 px-4 font-semibold text-right">Tingkat Utilisasi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {equipmentUtilization.map((eq) => (
                                                <tr key={eq.id} className="hover:bg-muted/20">
                                                    <td className="py-3 px-4 font-semibold text-foreground">
                                                        {eq.name}
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground">
                                                        {eq.category_name}
                                                    </td>
                                                    <td className="py-3 px-4 text-center font-bold">
                                                        {eq.total_units} unit
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-emerald-600 font-semibold">
                                                        {eq.available_units}
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-blue-600 font-semibold">
                                                        {eq.rented_units}
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-purple-600 font-semibold">
                                                        {eq.maintenance_units}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <div className="w-16 bg-muted rounded-full h-2 overflow-hidden">
                                                                <div
                                                                    className={`h-full ${
                                                                        eq.utilization_rate > 70
                                                                            ? 'bg-emerald-500'
                                                                            : eq.utilization_rate > 30
                                                                            ? 'bg-blue-500'
                                                                            : 'bg-zinc-400'
                                                                    }`}
                                                                    style={{ width: `${eq.utilization_rate}%` }}
                                                                />
                                                            </div>
                                                            <span className="font-bold tabular-nums w-12 text-right">
                                                                {eq.utilization_rate}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab 3: Recent Maintenance Logs */}
                    <TabsContent value="logs" className="mt-4">
                        <Card className="border-border shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold">Log Kondisi & Pembaruan Unit Terbaru</CardTitle>
                                <CardDescription className="text-xs">
                                    Catatan perubahan kondisi fisik dan status unit yang dilakukan admin. Mencakup pendaftaran unit baru, pemeliharaan, hingga perubahan kondisi manual.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-muted/50 border-b border-border text-muted-foreground">
                                                <th className="py-2.5 px-4 font-semibold">Waktu Log</th>
                                                <th className="py-2.5 px-4 font-semibold">Kode Unit</th>
                                                <th className="py-2.5 px-4 font-semibold">Model Alat</th>
                                                <th className="py-2.5 px-4 font-semibold text-center">Jenis Mutasi</th>
                                                <th className="py-2.5 px-4 font-semibold text-center">Kondisi Sebelum</th>
                                                <th className="py-2.5 px-4 font-semibold text-center">Kondisi Sesudah</th>
                                                <th className="py-2.5 px-4 font-semibold">Catatan Tindakan</th>
                                                <th className="py-2.5 px-4 font-semibold">Petugas / Admin</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {recentMaintenanceLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                                                        Belum ada log maintenance tercatat.
                                                    </td>
                                                </tr>
                                            ) : (
                                                recentMaintenanceLogs.map((log) => (
                                                    <tr key={log.id} className="hover:bg-muted/20">
                                                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                                                            {log.created_at}
                                                        </td>
                                                        <td className="py-3 px-4 font-mono font-bold text-foreground">
                                                            {log.unit_code}
                                                        </td>
                                                        <td className="py-3 px-4 font-semibold text-foreground">
                                                            {log.equipment_name}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            {log.type === 'condition_update' ? (
                                                                <Badge variant="outline" className="border-violet-500 text-violet-600 text-[10px]">Pembaruan Kondisi</Badge>
                                                            ) : log.type === 'handover' ? (
                                                                <Badge className="bg-blue-600 text-white text-[10px]">Serah Terima</Badge>
                                                            ) : log.type === 'return' ? (
                                                                <Badge className="bg-emerald-600 text-white text-[10px]">Pengembalian</Badge>
                                                            ) : (
                                                                <Badge variant="secondary" className="text-[10px]">{log.type ?? 'Maintenance'}</Badge>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            {getConditionBadge(log.condition_before)}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            {getConditionBadge(log.condition_after)}
                                                        </td>
                                                        <td className="py-3 px-4 text-foreground">
                                                            {log.notes || '-'}
                                                        </td>
                                                        <td className="py-3 px-4 text-muted-foreground">
                                                            {log.admin_name}
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
                </Tabs>
            </div>
        </AppLayout>
    );
}
