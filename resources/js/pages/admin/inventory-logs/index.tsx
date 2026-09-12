import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeftRight,
    ArrowUpRight,
    ArrowDownLeft,
    Wrench,
    Search,
    Plus,
    Printer,
    FileText,
    History,
    CheckCircle2,
    Clock,
    User as UserIcon,
    Scan,
    QrCode,
    Layers,
    AlertCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { QrCodeScanner } from '@/components/qr-code-scanner';
import { UnitConditionBadge } from '@/components/status-badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatDateTime } from '@/lib/formatters';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { Equipment } from '@/types';
import type { UnitLog, EquipmentUnit, BreadcrumbItem, PaginatedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Menu Utama',
        href: '/admin',
    },
    {
        title: 'Log Mutasi Barang',
        href: '/admin/inventory-logs',
    },
];

interface InventoryLogsIndexProps {
    logs: PaginatedData<UnitLog>;
    stats: {
        total_out: number;
        total_in: number;
        total_maintenance: number;
        total_logs: number;
        today_out: number;
        today_in: number;
    };
    equipmentList: Array<{ id: number; name: string }>;
    unitsList: EquipmentUnit[];
    filters: {
        type: string;
        search: string;
        equipment_id: string;
        start_date: string;
        end_date: string;
        per_page?: number;
    };
}

export default function InventoryLogsIndex({
    logs,
    stats,
    equipmentList,
    unitsList,
    filters,
}: InventoryLogsIndexProps) {
    const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
    const [selectedUnitId, setSelectedUnitId] = useState<string>('');
    const [logType, setLogType] = useState<string>('maintenance');
    const [newCondition, setNewCondition] = useState<string>('baik');
    const [newStatus, setNewStatus] = useState<string>('tersedia');
    const [notes, setNotes] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);

    // QR Scan Mode for Manual Mutation
    const [mutationScanMode, setMutationScanMode] = useState<'manual' | 'scan'>(
        'manual',
    );
    const [scannedUnitDetails, setScannedUnitDetails] = useState<any | null>(
        null,
    );

    const handleMutationScan = async (scannedCode: string) => {
        try {
            const res = await fetch(
                `/admin/units/scan-lookup?unit_code=${encodeURIComponent(scannedCode)}`,
            );
            const data = await res.json();

            if (!res.ok || !data.success) {
                toast.error(
                    data.message || `Unit '${scannedCode}' tidak ditemukan.`,
                );

                return;
            }

            const unit = data.unit;

            if (unit.status === 'disewa') {
                toast.warning(
                    `Unit '${scannedCode}' sedang disewa oleh pelanggan (${unit.active_rental?.customer_name || 'Aktif'}). Mutasi manual hanya untuk unit yang ada di toko.`,
                );

                return;
            }

            setSelectedUnitId(unit.id.toString());
            setScannedUnitDetails(unit);
            setNewCondition(unit.condition);
            setNewStatus(
                unit.status === 'tersedia' ? 'maintenance' : 'tersedia',
            );
            toast.success(
                `✓ Unit '${unit.unit_code}' (${unit.equipment?.name}) siap dicatat mutasinya.`,
            );
        } catch (err) {
            console.error('Scan error:', err);
            toast.error('Gagal memeriksa kode unit di server.');
        }
    };

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const search = formData.get('search') as string;
        router.get(
            '/admin/inventory-logs',
            { ...filters, search },
            { preserveState: true },
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            '/admin/inventory-logs',
            {
                ...filters,
                [key]: value === 'all' ? '' : value,
            },
            { preserveState: true },
        );
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUnitId) {
            toast.error('Pilih unit barang yang akan dicatat mutasinya.');

            return;
        }

        setSubmitting(true);
        router.post(
            '/admin/inventory-logs',
            {
                equipment_unit_id: parseInt(selectedUnitId),
                type: logType,
                new_condition: newCondition,
                new_status: newStatus,
                notes,
            },
            {
                onSuccess: () => {
                    setCreateModalOpen(false);
                    setSelectedUnitId('');
                    setNotes('');
                    toast.success(
                        'Pencatatan mutasi keluar/masuk barang berhasil disimpan!',
                    );
                },
                onError: (err) => {
                    toast.error(
                        (Object.values(err)[0] as string) ||
                            'Gagal menyimpan mutasi barang.',
                    );
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const handlePrint = () => {
        window.print();
    };

    const getLogTypeBadge = (type: string) => {
        switch (type) {
            case 'handover':
                return (
                    <Badge className="gap-1 border-amber-300 bg-amber-100 text-[11px] font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>Barang Keluar (Sewa)</span>
                    </Badge>
                );
            case 'return':
                return (
                    <Badge className="gap-1 border-emerald-300 bg-emerald-100 text-[11px] font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                        <ArrowDownLeft className="h-3 w-3" />
                        <span>Barang Masuk (Kembali)</span>
                    </Badge>
                );
            case 'maintenance':
                return (
                    <Badge className="gap-1 border-blue-300 bg-blue-100 text-[11px] font-semibold text-blue-900 dark:bg-blue-950 dark:text-blue-300">
                        <Wrench className="h-3 w-3" />
                        <span>Mutasi Servis</span>
                    </Badge>
                );
            default:
                return (
                    <Badge
                        variant="outline"
                        className="gap-1 text-[11px] font-medium"
                    >
                        <History className="h-3 w-3" />
                        <span>Update Kondisi</span>
                    </Badge>
                );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pencatatan Keluar Masuk Barang - Admin" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Log Mutasi Inventaris
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Audit jejak pergerakan unit fisik, serah terima alat, pengembalian, dan pemeliharaan servis.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setMutationScanMode('scan');
                                setScannedUnitDetails(null);
                                setCreateModalOpen(true);
                            }}
                            className="gap-1.5 border-emerald-600/40 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                        >
                            <Scan className="h-3.5 w-3.5" />
                            <span>Scan QR Cepat</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="gap-1.5 text-xs"
                        >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Cetak Log Mutasi</span>
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => {
                                setMutationScanMode('manual');
                                setScannedUnitDetails(null);
                                setCreateModalOpen(true);
                            }}
                            className="gap-1.5 bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Catat Mutasi Manual</span>
                        </Button>
                    </div>
                </div>

                {/* Printable Header */}
                <div className="hidden border-b border-border pb-3 print:block">
                    <h1 className="text-xl font-bold">
                        BUKU CATATAN KELUAR MASUK BARANG & MUTASI INVENTARIS
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        CampRental Indonesia &bull; Dicetak pada:{' '}
                        {formatDateTime(new Date().toISOString())}
                    </p>
                </div>

                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
                    <Card className="border-border shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase">
                                <span>Barang Keluar (Handover)</span>
                                <ArrowUpRight className="h-4 w-4 text-amber-600" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                                {stats.total_out} Unit
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                {stats.today_out} unit keluar hari ini
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase">
                                <span>Barang Masuk (Kembali)</span>
                                <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                                {stats.total_in} Unit
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                {stats.today_in} unit masuk hari ini
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase">
                                <span>Mutasi Servis / Perbaikan</span>
                                <Wrench className="h-4 w-4 text-blue-600" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                                {stats.total_maintenance} Log
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                Pemeliharaan & cek kondisi
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase">
                                <span>Total Riwayat Mutasi</span>
                                <ArrowLeftRight className="h-4 w-4 text-zinc-600" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                                {stats.total_logs} Aktivitas
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                Seluruh audit trail unit tercatat
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Controls (Hidden in print) */}
                <Card className="border-border shadow-none print:hidden">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <form
                                onSubmit={handleSearch}
                                className="flex gap-2"
                            >
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        name="search"
                                        defaultValue={filters.search}
                                        placeholder="Cari kode unit, invoice, nama..."
                                        className="h-9 pl-9 text-xs"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    size="sm"
                                    variant="outline"
                                    className="h-9 text-xs"
                                >
                                    Cari
                                </Button>
                            </form>

                            <Select
                                value={filters.type || 'all'}
                                onValueChange={(val) =>
                                    handleFilterChange('type', val)
                                }
                            >
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Tipe Pergerakan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Jenis Mutasi
                                    </SelectItem>
                                    <SelectItem value="handover">
                                        📤 Barang Keluar (Sewa)
                                    </SelectItem>
                                    <SelectItem value="return">
                                        📥 Barang Masuk (Kembali)
                                    </SelectItem>
                                    <SelectItem value="maintenance">
                                        🔧 Mutasi Servis
                                    </SelectItem>
                                    <SelectItem value="condition_update">
                                        🔄 Update Kondisi
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.equipment_id || 'all'}
                                onValueChange={(val) =>
                                    handleFilterChange('equipment_id', val)
                                }
                            >
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Filter Tipe Alat" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Tipe Alat
                                    </SelectItem>
                                    {equipmentList.map((eq) => (
                                        <SelectItem
                                            key={eq.id}
                                            value={eq.id.toString()}
                                        >
                                            {eq.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-2">
                                <Input
                                    type="date"
                                    defaultValue={filters.start_date}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            'start_date',
                                            e.target.value,
                                        )
                                    }
                                    className="h-9 flex-1 text-xs"
                                    title="Dari Tanggal"
                                />
                                <span className="text-xs text-muted-foreground">
                                    -
                                </span>
                                <Input
                                    type="date"
                                    defaultValue={filters.end_date}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            'end_date',
                                            e.target.value,
                                        )
                                    }
                                    className="h-9 flex-1 text-xs"
                                    title="Sampai Tanggal"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Inventory Movement Log Table */}
                <Card className="border-border shadow-none">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                            Waktu Mutasi
                                        </th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                            Jenis Pergerakan
                                        </th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                            Unit Fisik Alat
                                        </th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                            Transaksi / Pelanggan
                                        </th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                            Perubahan Kondisi
                                        </th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                            Catatan Pemeriksaan
                                        </th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                            Petugas Admin
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {logs.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="py-12 text-center text-muted-foreground whitespace-nowrap"
                                            >
                                                Tidak ada riwayat pergerakan
                                                keluar/masuk barang yang cocok.
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.data.map((log) => (
                                            <tr
                                                key={log.id}
                                                className="hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                                    <div className="font-semibold text-foreground">
                                                        {formatDate(
                                                            log.created_at,
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {new Date(
                                                            log.created_at,
                                                        ).toLocaleTimeString(
                                                            'id-ID',
                                                            {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            },
                                                        )}{' '}
                                                        WIB
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {getLogTypeBadge(log.type)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="rounded bg-zinc-900 px-2 py-0.5 font-mono text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                                                            {
                                                                log
                                                                    .equipment_unit
                                                                    ?.unit_code
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="mt-0.5 font-medium text-foreground">
                                                        {
                                                            log.equipment_unit
                                                                ?.equipment
                                                                ?.name
                                                        }
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {log.rental ? (
                                                        <div>
                                                            <Link
                                                                href={`/bookings/${log.rental.id}`}
                                                                className="inline-flex items-center gap-1 font-mono font-bold text-blue-600 hover:underline"
                                                                target="_blank"
                                                            >
                                                                <FileText className="h-3 w-3" />
                                                                <span>
                                                                    {
                                                                        log
                                                                            .rental
                                                                            .invoice_number
                                                                    }
                                                                </span>
                                                            </Link>
                                                            <div className="mt-0.5 text-[11px] text-muted-foreground">
                                                                {
                                                                    log.rental
                                                                        .user
                                                                        ?.name
                                                                }{' '}
                                                                (
                                                                {log.rental.user
                                                                    ?.phone ||
                                                                    'Penyewa'}
                                                                )
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground italic">
                                                            Mutasi Internal Toko
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-muted-foreground capitalize">
                                                            {
                                                                log.condition_before
                                                            }
                                                        </span>
                                                        <span>→</span>
                                                        <span className="font-bold text-foreground capitalize">
                                                            {
                                                                log.condition_after
                                                            }
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="max-w-xs truncate px-4 py-3 text-foreground whitespace-nowrap">
                                                    {log.notes || '-'}
                                                </td>
                                                <td className="px-4 py-3 font-medium whitespace-nowrap text-foreground">
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <UserIcon className="h-3 w-3" />
                                                        <span>
                                                            {log.user?.name ||
                                                                'Administrator'}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                <DataTablePagination pagination={logs} className="print:hidden" />
            </div>

            {/* Manual Mutation Modal Dialog */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-lg">
                    <form
                        onSubmit={handleManualSubmit}
                        className="flex flex-1 flex-col overflow-hidden"
                    >
                        <DialogHeader className="shrink-0 border-b border-border bg-card p-4 sm:p-5">
                            <DialogTitle className="text-base font-bold">
                                Catat Mutasi Keluar/Masuk Barang Manual
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Catat pemindahan unit fisik untuk pemeliharaan
                                servis, selesai perbaikan, atau pergantian
                                status.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs sm:p-5">
                            {/* Mode Toggle Header */}
                            <div className="flex items-center justify-between border-b border-border pb-2">
                                <Label className="text-xs font-semibold">
                                    Metode Pilih Unit Fisik:
                                </Label>
                                <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/60 p-0.5">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            mutationScanMode === 'manual'
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        onClick={() =>
                                            setMutationScanMode('manual')
                                        }
                                        className="h-6 gap-1 px-2.5 text-[11px] font-medium"
                                    >
                                        <Layers className="h-3 w-3" />
                                        <span>Dropdown</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            mutationScanMode === 'scan'
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        onClick={() =>
                                            setMutationScanMode('scan')
                                        }
                                        className="h-6 gap-1 px-2.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
                                    >
                                        <Scan className="h-3 w-3" />
                                        <span>Scan QR-Code</span>
                                    </Button>
                                </div>
                            </div>

                            {/* QR Scanner for Mutation */}
                            {mutationScanMode === 'scan' && (
                                <QrCodeScanner
                                    isActive={
                                        createModalOpen &&
                                        mutationScanMode === 'scan'
                                    }
                                    onScan={handleMutationScan}
                                    placeholder="Arahkan kamera ke QR Code unit alat..."
                                    helperText="Scan QR Code pada fisik unit untuk memilihnya secara otomatis."
                                    autoPauseOnScan={true}
                                />
                            )}

                            {/* Scanned Unit Info Card if present */}
                            {scannedUnitDetails && (
                                <div className="flex items-center justify-between rounded-lg border border-emerald-500/50 bg-emerald-50/20 p-3 dark:bg-emerald-950/20">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="rounded bg-zinc-900 px-2 py-0.5 font-mono text-xs font-bold text-white">
                                                {scannedUnitDetails.unit_code}
                                            </span>
                                            <span className="font-semibold text-foreground">
                                                {
                                                    scannedUnitDetails.equipment
                                                        ?.name
                                                }
                                            </span>
                                        </div>
                                        <div className="mt-1 text-[11px] text-muted-foreground">
                                            Kategori:{' '}
                                            {
                                                scannedUnitDetails.equipment
                                                    ?.category
                                            }{' '}
                                            &bull; Status:{' '}
                                            {scannedUnitDetails.status} &bull;
                                            Kondisi:{' '}
                                            {scannedUnitDetails.condition}
                                        </div>
                                    </div>
                                    <Badge className="gap-1 bg-emerald-600 text-[10px] text-white">
                                        <CheckCircle2 className="h-3 w-3" />{' '}
                                        Terpilih
                                    </Badge>
                                </div>
                            )}

                            {/* Dropdown Selection */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">
                                    Pilih Unit Fisik Barang *
                                </Label>
                                <Select
                                    value={selectedUnitId}
                                    onValueChange={(val) => {
                                        setSelectedUnitId(val);
                                        const u = unitsList.find(
                                            (unit) =>
                                                unit.id.toString() === val,
                                        );

                                        if (u) {
                                            setScannedUnitDetails(null);
                                            setNewCondition(u.condition);
                                            setNewStatus(u.status);
                                        }
                                    }}
                                >
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue placeholder="Pilih unit kode..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {unitsList.map((u) => (
                                            <SelectItem
                                                key={u.id}
                                                value={u.id.toString()}
                                                disabled={u.status === 'disewa'}
                                            >
                                                {u.unit_code} -{' '}
                                                {u.equipment?.name} ({u.status}{' '}
                                                / {u.condition}){' '}
                                                {u.status === 'disewa'
                                                    ? '(Sedang Disewa)'
                                                    : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">
                                    Jenis Mutasi Pergerakan *
                                </Label>
                                <Select
                                    value={logType}
                                    onValueChange={setLogType}
                                >
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="maintenance">
                                            🔧 Kirim ke Pemeliharaan
                                            (Maintenance)
                                        </SelectItem>
                                        <SelectItem value="return">
                                            📥 Masuk Kembali ke Toko (Selesai
                                            Servis)
                                        </SelectItem>
                                        <SelectItem value="condition_update">
                                            🔄 Pembaruan Hasil Cek Kondisi
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Condition & Status After Mutation */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">
                                        Kondisi Fisik *
                                    </Label>
                                    <Select
                                        value={newCondition}
                                        onValueChange={setNewCondition}
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="baik">
                                                Baik (Layak Sewa)
                                            </SelectItem>
                                            <SelectItem value="butuh_perbaikan">
                                                Butuh Perbaikan (Servis)
                                            </SelectItem>
                                            <SelectItem value="rusak">
                                                Rusak / Tidak Layak
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">
                                        Status Operasional *
                                    </Label>
                                    <Select
                                        value={newStatus}
                                        onValueChange={setNewStatus}
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tersedia">
                                                Tersedia di Toko
                                            </SelectItem>
                                            <SelectItem value="maintenance">
                                                Dalam Maintenance
                                            </SelectItem>
                                            <SelectItem value="afkir">
                                                Afkir
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="mutation_notes"
                                    className="text-xs font-semibold"
                                >
                                    Catatan Mutasi / Pemeriksaan *
                                </Label>
                                <Textarea
                                    id="mutation_notes"
                                    value={notes}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLTextAreaElement>,
                                    ) => setNotes(e.target.value)}
                                    placeholder="Contoh: Frame bengkok diganti baru, kain tenda dibersihkan dan siap sewa kembali..."
                                    className="h-20 resize-none text-xs"
                                    required
                                />
                            </div>
                        </div>

                        <DialogFooter className="flex shrink-0 justify-end gap-2 border-t border-border bg-card p-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setCreateModalOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={submitting}
                                className="bg-zinc-900 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                            >
                                {submitting
                                    ? 'Menyimpan...'
                                    : 'Simpan Catatan Mutasi'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
