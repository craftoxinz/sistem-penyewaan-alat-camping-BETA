import { Head, Link, router } from '@inertiajs/react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Layers,
    History,
    CheckCircle2,
    AlertCircle,
    User as UserIcon,
    QrCode,
    Printer,
    Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';
import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { QrCodeModal } from '@/components/qr-code-modal';
import {
    UnitStatusBadge,
    UnitConditionBadge,
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
import type { EquipmentUnit, UnitLog, BreadcrumbItem, PaginatedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inventaris Alat',
        href: '/admin/equipment',
    },
    {
        title: 'Unit Fisik Inventaris',
        href: '/admin/units',
    },
];

interface EquipmentListItem {
    id: number;
    name: string;
    last_unit_code?: string | null;
    suggested_prefix?: string;
    next_number?: number;
    pad_length?: number;
}

interface UnitsIndexProps {
    units: PaginatedData<EquipmentUnit>;
    equipmentList: EquipmentListItem[];
    recentLogs: UnitLog[];
    filters: {
        equipment_id: string;
        status: string;
        condition: string;
        search: string;
        per_page?: number;
    };
}

export default function UnitsIndex({
    units,
    equipmentList,
    recentLogs,
    filters,
}: UnitsIndexProps) {
    // Add / Edit Modal State
    const [unitModalOpen, setUnitModalOpen] = useState<boolean>(false);
    const [editingUnit, setEditingUnit] = useState<EquipmentUnit | null>(null);
    const [equipmentId, setEquipmentId] = useState<string>('');
    const [unitCode, setUnitCode] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(1);
    const [prefix, setPrefix] = useState<string>('');
    const [startNumber, setStartNumber] = useState<number>(1);
    const [padLength, setPadLength] = useState<number>(3);
    const [showCustomFormat, setShowCustomFormat] = useState<boolean>(false);
    const [condition, setCondition] = useState<string>('baik');
    const [status, setStatus] = useState<string>('tersedia');
    const [notes, setNotes] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Logs Drawer / Modal State
    const [logModalOpen, setLogModalOpen] = useState<boolean>(false);
    const [selectedUnitForLogs, setSelectedUnitForLogs] =
        useState<EquipmentUnit | null>(null);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [unitToDelete, setUnitToDelete] = useState<EquipmentUnit | null>(
        null,
    );
    const [deleting, setDeleting] = useState<boolean>(false);

    // QR Code Modal State
    const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);
    const [selectedUnitForQr, setSelectedUnitForQr] =
        useState<EquipmentUnit | null>(null);
    const [generatingBatchQr, setGeneratingBatchQr] = useState<boolean>(false);

    const handleBatchPrint = async () => {
        if (!units.data || units.data.length === 0) {
            toast.error('Tidak ada data unit yang dapat dicetak.');

            return;
        }

        setGeneratingBatchQr(true);

        try {
            const qrCards = await Promise.all(
                units.data.map(async (unit) => {
                    const dataUrl = await QRCode.toDataURL(unit.unit_code, {
                        width: 250,
                        margin: 1,
                        color: { dark: '#000000', light: '#ffffff' },
                    });

                    return {
                        ...unit,
                        qrDataUrl: dataUrl,
                    };
                }),
            );

            const printWindow = window.open('', '_blank');

            if (!printWindow) {
                toast.error(
                    'Gagal membuka jendela cetak. Pastikan pop-up diizinkan browser.',
                );

                return;
            }

            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Cetak Lembar Stiker QR Unit Inventaris</title>
                    <style>
                        @page {
                            size: A4 portrait;
                            margin: 10mm;
                        }
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                            margin: 0;
                            padding: 0;
                            background: #fff;
                        }
                        .sheet-header {
                            text-align: center;
                            font-size: 14px;
                            font-weight: 800;
                            margin-bottom: 12px;
                            border-bottom: 2px solid #000;
                            padding-bottom: 6px;
                        }
                        .grid {
                            display: grid;
                            grid-template-columns: repeat(3, 1fr);
                            gap: 8mm;
                        }
                        .label-card {
                            border: 1.5px solid #000;
                            border-radius: 6px;
                            padding: 6px;
                            text-align: center;
                            box-sizing: border-box;
                            page-break-inside: avoid;
                        }
                        .store-name {
                            font-size: 8px;
                            font-weight: 800;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            border-bottom: 1px dashed #777;
                            padding-bottom: 2px;
                            margin-bottom: 4px;
                        }
                        .qr-img {
                            width: 28mm;
                            height: 28mm;
                            margin: 0 auto;
                            display: block;
                        }
                        .unit-code {
                            font-family: monospace;
                            font-size: 12px;
                            font-weight: 900;
                            margin: 3px 0 1px 0;
                            background: #000;
                            color: #fff;
                            padding: 1px 5px;
                            border-radius: 3px;
                            display: inline-block;
                        }
                        .eq-name {
                            font-size: 10px;
                            font-weight: 700;
                            margin-top: 2px;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        }
                        .eq-cat {
                            font-size: 8px;
                            color: #555;
                        }
                    </style>
                </head>
                <body>
                    <div class="sheet-header">
                        CAMPING RENTAL &bull; LEMBAR STIKER QR CODE INVENTARIS FISIK (HALAMAN ${units.current_page})
                    </div>
                    <div class="grid">
                        ${qrCards
                            .map(
                                (c) => `
                            <div class="label-card">
                                <div class="store-name">CAMPING RENTAL &bull; FISIK</div>
                                <img class="qr-img" src="${c.qrDataUrl}" alt="${c.unit_code}" />
                                <div><span class="unit-code">${c.unit_code}</span></div>
                                <div class="eq-name">${c.equipment?.name || 'Alat'}</div>
                                <div class="eq-cat">${c.equipment?.category?.name || 'Inventaris'} &bull; ${c.condition.toUpperCase()}</div>
                            </div>
                        `,
                            )
                            .join('')}
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(() => window.close(), 500);
                        };
                    </script>
                </body>
                </html>
            `;

            printWindow.document.write(html);
            printWindow.document.close();
        } catch (err) {
            console.error('Error generating batch QR:', err);
            toast.error('Gagal membuat lembar cetak QR.');
        } finally {
            setGeneratingBatchQr(false);
        }
    };

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const search = formData.get('search') as string;
        router.get(
            '/admin/units',
            { ...filters, search },
            { preserveState: true },
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            '/admin/units',
            {
                ...filters,
                [key]: value === 'all' ? '' : value,
            },
            { preserveState: true },
        );
    };

    const updateEquipmentSelection = (eqIdStr: string) => {
        setEquipmentId(eqIdStr);
        const selected = equipmentList.find((e) => e.id.toString() === eqIdStr);
        if (selected) {
            const p = selected.suggested_prefix || 'EQP-';
            const num = selected.next_number || 1;
            const pad = selected.pad_length || 3;
            setPrefix(p);
            setStartNumber(num);
            setPadLength(pad);
            setUnitCode(`${p}${num.toString().padStart(pad, '0')}`);
        }
    };

    const selectedEquipment = useMemo(() => {
        return equipmentList.find((e) => e.id.toString() === equipmentId);
    }, [equipmentList, equipmentId]);

    const generatedCodes = useMemo(() => {
        if (editingUnit) {
            return [unitCode];
        }
        const codes: string[] = [];
        const effectivePrefix = prefix || 'EQP-';
        const start = startNumber || 1;
        const pad = padLength || 3;
        const count = Math.max(1, Math.min(50, quantity));
        for (let i = 0; i < count; i++) {
            const numStr = (start + i).toString().padStart(pad, '0');
            codes.push(`${effectivePrefix}${numStr}`);
        }
        return codes;
    }, [editingUnit, unitCode, prefix, startNumber, padLength, quantity]);

    const openCreateDialog = () => {
        setEditingUnit(null);
        setQuantity(1);
        setCondition('baik');
        setStatus('tersedia');
        setNotes('');
        setShowCustomFormat(false);

        const initialEqId =
            filters.equipment_id ||
            (equipmentList[0] ? equipmentList[0].id.toString() : '');
        updateEquipmentSelection(initialEqId);
        setUnitModalOpen(true);
    };

    const openEditDialog = (unit: EquipmentUnit) => {
        setEditingUnit(unit);
        setEquipmentId(unit.equipment_id.toString());
        setUnitCode(unit.unit_code);
        setCondition(unit.condition);
        setStatus(unit.status);
        setNotes(unit.notes || '');
        setUnitModalOpen(true);
    };

    const openLogsDialog = (unit: EquipmentUnit) => {
        setSelectedUnitForLogs(unit);
        setLogModalOpen(true);
    };

    const handleUnitSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        if (editingUnit) {
            const payload = {
                equipment_id: parseInt(equipmentId),
                unit_code: unitCode,
                condition,
                status,
                notes,
            };

            router.put(`/admin/units/${editingUnit.id}`, payload, {
                onSuccess: () => {
                    setUnitModalOpen(false);
                    toast.success(`Unit '${unitCode}' berhasil diperbarui.`);
                },
                onError: (err) => {
                    toast.error(
                        (Object.values(err)[0] as string) ||
                            'Gagal memperbarui unit.',
                    );
                },
                onFinish: () => setSubmitting(false),
            });
        } else {
            const payload = {
                equipment_id: parseInt(equipmentId),
                quantity,
                prefix,
                start_number: startNumber,
                unit_codes: generatedCodes,
                condition,
                status,
                notes,
            };

            router.post('/admin/units', payload, {
                onSuccess: () => {
                    setUnitModalOpen(false);
                    const msg =
                        quantity > 1
                            ? `Sebanyak ${quantity} unit fisik berhasil ditambahkan.`
                            : `Unit '${generatedCodes[0] || unitCode}' berhasil ditambahkan.`;
                    toast.success(msg);
                },
                onError: (err) => {
                    toast.error(
                        (Object.values(err)[0] as string) ||
                            'Gagal menambahkan unit.',
                    );
                },
                onFinish: () => setSubmitting(false),
            });
        }
    };

    const confirmDelete = () => {
        if (!unitToDelete) {
            return;
        }

        setDeleting(true);
        router.delete(`/admin/units/${unitToDelete.id}`, {
            onSuccess: () => {
                setDeleteModalOpen(false);
                toast.success(
                    `Unit '${unitToDelete.unit_code}' berhasil dihapus.`,
                );
            },
            onError: () => toast.error('Gagal menghapus unit.'),
            onFinish: () => setDeleting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Unit Inventaris Fisik - Admin" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Unit Fisik Inventaris
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Pencatatan kode unik per unit fisik dan audit riwayat pemakaian & kondisi alat.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleBatchPrint}
                            disabled={
                                generatingBatchQr || units.data.length === 0
                            }
                            className="gap-1.5 border-emerald-600/40 text-xs text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                            title="Cetak stiker QR code untuk seluruh unit di halaman ini"
                        >
                            <Printer className="h-4 w-4" />
                            <span>
                                {generatingBatchQr
                                    ? 'Menyiapkan...'
                                    : 'Cetak Lembar QR (Hal Ini)'}
                            </span>
                        </Button>
                        <Button
                            size="sm"
                            onClick={openCreateDialog}
                            className="gap-1.5 bg-zinc-900 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Tambah Unit Fisik</span>
                        </Button>
                    </div>
                </div>

                {/* Filter Controls */}
                <Card className="border-border shadow-none">
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
                                        placeholder="Cari kode unit..."
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
                                value={filters.equipment_id || 'all'}
                                onValueChange={(val) =>
                                    handleFilterChange('equipment_id', val)
                                }
                            >
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Pilih Tipe Alat" />
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

                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(val) =>
                                    handleFilterChange('status', val)
                                }
                            >
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Status Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Status
                                    </SelectItem>
                                    <SelectItem value="tersedia">
                                        Tersedia
                                    </SelectItem>
                                    <SelectItem value="disewa">
                                        Sedang Disewa
                                    </SelectItem>
                                    <SelectItem value="maintenance">
                                        Maintenance
                                    </SelectItem>
                                    <SelectItem value="afkir">Afkir</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.condition || 'all'}
                                onValueChange={(val) =>
                                    handleFilterChange('condition', val)
                                }
                            >
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Kondisi Fisik" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Kondisi
                                    </SelectItem>
                                    <SelectItem value="baik">Baik</SelectItem>
                                    <SelectItem value="butuh_perbaikan">
                                        Butuh Perbaikan
                                    </SelectItem>
                                    <SelectItem value="rusak">Rusak</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Units Table */}
                <Card className="border-border shadow-none">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                            Kode Unit
                                        </th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                            Tipe Alat Camping
                                        </th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                            Status Operasional
                                        </th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                            Kondisi Fisik
                                        </th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                            Catatan Unit
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {units.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="py-12 text-center text-muted-foreground"
                                            >
                                                Tidak ada unit fisik yang cocok
                                                dengan filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        units.data.map((unit) => (
                                            <tr
                                                key={unit.id}
                                                className="hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3 font-mono font-bold text-foreground whitespace-nowrap">
                                                    <span className="rounded bg-zinc-900 px-2 py-0.5 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900">
                                                        {unit.unit_code}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                                                    <div>
                                                        {unit.equipment?.name}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        {
                                                            unit.equipment
                                                                ?.category?.name
                                                        }
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <UnitStatusBadge
                                                        status={unit.status}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <UnitConditionBadge
                                                        condition={
                                                            unit.condition
                                                        }
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                                    {unit.notes || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 gap-1 border-emerald-600/30 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                                            onClick={() => {
                                                                setSelectedUnitForQr(
                                                                    unit,
                                                                );
                                                                setQrModalOpen(
                                                                    true,
                                                                );
                                                            }}
                                                            title="Lihat & Cetak Label QR-Code"
                                                        >
                                                            <QrCode className="h-3.5 w-3.5" />
                                                            <span>QR</span>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 gap-1 text-xs"
                                                            onClick={() =>
                                                                openLogsDialog(
                                                                    unit,
                                                                )
                                                            }
                                                            title="Riwayat Log Pemakaian"
                                                        >
                                                            <History className="h-3.5 w-3.5" />
                                                            <span>
                                                                Log (
                                                                {unit.unit_logs
                                                                    ?.length ||
                                                                    0}
                                                                )
                                                            </span>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() =>
                                                                openEditDialog(
                                                                    unit,
                                                                )
                                                            }
                                                            title={
                                                                unit.status ===
                                                                'disewa'
                                                                    ? 'Unit sedang disewa – tidak dapat diedit'
                                                                    : 'Edit Unit'
                                                            }
                                                            disabled={
                                                                unit.status ===
                                                                'disewa'
                                                            }
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            onClick={() => {
                                                                setUnitToDelete(
                                                                    unit,
                                                                );
                                                                setDeleteModalOpen(
                                                                    true,
                                                                );
                                                            }}
                                                            title={
                                                                unit.status ===
                                                                'disewa'
                                                                    ? 'Unit sedang disewa – tidak dapat dihapus'
                                                                    : 'Hapus Unit'
                                                            }
                                                            disabled={
                                                                unit.status ===
                                                                'disewa'
                                                            }
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
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
                <DataTablePagination pagination={units} />

                {/* Recent Unit Activity Logs Section (SRS-F-011) */}
                <Card className="border-border shadow-none">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-bold">
                            <History className="h-4 w-4 text-blue-600" />
                            <span>
                                Audit Riwayat Pemakaian & Kondisi Terakhir
                            </span>
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Log pencatatan otomatis saat serah terima,
                            pengembalian, dan pembaruan kondisi unit alat.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
                                <thead>
                                    <tr className="border-y border-border bg-muted/50 text-muted-foreground">
                                        <th className="px-4 py-2.5 font-semibold whitespace-nowrap">
                                            Waktu Log
                                        </th>
                                        <th className="px-4 py-2.5 font-semibold whitespace-nowrap">
                                            Tipe Aktivitas
                                        </th>
                                        <th className="px-4 py-2.5 font-semibold whitespace-nowrap">
                                            Unit Alat
                                        </th>
                                        <th className="px-4 py-2.5 font-semibold whitespace-nowrap">
                                            Kondisi Sebelum → Sesudah
                                        </th>
                                        <th className="px-4 py-2.5 font-semibold whitespace-nowrap">
                                            Catatan Pemeriksaan
                                        </th>
                                        <th className="px-4 py-2.5 font-semibold whitespace-nowrap">
                                            Petugas Admin
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {recentLogs.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="py-8 text-center text-muted-foreground"
                                            >
                                                Belum ada riwayat aktivitas unit
                                                tercatat.
                                            </td>
                                        </tr>
                                    ) : (
                                        recentLogs.map((log) => (
                                            <tr
                                                key={log.id}
                                                className="hover:bg-muted/20"
                                            >
                                                <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                                                    {formatDateTime(
                                                        log.created_at,
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[11px] capitalize"
                                                    >
                                                        {log.type === 'handover'
                                                            ? 'Serah Terima'
                                                            : log.type ===
                                                                'return'
                                                              ? 'Pengembalian'
                                                              : 'Update Kondisi'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-2.5 font-medium text-foreground whitespace-nowrap">
                                                    <span className="mr-1.5 font-mono font-bold">
                                                        {
                                                            log.equipment_unit
                                                                ?.unit_code
                                                        }
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground">
                                                        (
                                                        {
                                                            log.equipment_unit
                                                                ?.equipment
                                                                ?.name
                                                        }
                                                        )
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-foreground whitespace-nowrap">
                                                    <span className="capitalize">
                                                        {log.condition_before}
                                                    </span>{' '}
                                                    →{' '}
                                                    <span className="font-semibold capitalize">
                                                        {log.condition_after}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                                                    {log.notes || '-'}
                                                </td>
                                                <td className="px-4 py-2.5 font-medium text-foreground whitespace-nowrap">
                                                    {log.user?.name || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add / Edit Unit Modal Dialog */}
            <Dialog open={unitModalOpen} onOpenChange={setUnitModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleUnitSubmit}>
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold">
                                {editingUnit
                                    ? `Edit Unit: ${editingUnit.unit_code}`
                                    : 'Tambah Unit Fisik Baru'}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Masukkan kode unit unik dan status kesiapan operasional.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4 text-xs">
                            {/* Lock banner for rented units */}
                            {editingUnit?.status === 'disewa' && (
                                <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <div>
                                        <p className="text-xs font-semibold">
                                            Unit Sedang Disewa – Terkunci
                                        </p>
                                        <p className="mt-0.5 text-[11px]">
                                            Status hanya dapat diubah melalui
                                            menu{' '}
                                            <strong>
                                                Pesanan &amp; Serah Terima →
                                                Pengembalian
                                            </strong>{' '}
                                            setelah pelanggan mengembalikan
                                            alat.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {/* Info banner for decommissioned units */}
                            {editingUnit?.status === 'afkir' && (
                                <div className="flex items-start gap-2.5 rounded-lg border border-zinc-300 bg-zinc-100 p-3 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <div>
                                        <p className="text-xs font-semibold">
                                            Unit Diafkir
                                        </p>
                                        <p className="mt-0.5 text-[11px]">
                                            Unit yang sudah diafkir tidak dapat
                                            diaktifkan kembali. Anda hanya dapat
                                            memperbarui catatan kondisi.
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">
                                    Tipe Alat Camping *
                                </Label>
                                <Select
                                    value={equipmentId}
                                    onValueChange={updateEquipmentSelection}
                                    disabled={!!editingUnit}
                                >
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue placeholder="Pilih Tipe Alat" />
                                    </SelectTrigger>
                                    <SelectContent>
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
                                {!editingUnit && selectedEquipment && (
                                    <p className="text-[11px] text-muted-foreground">
                                        {selectedEquipment.last_unit_code ? (
                                            <>
                                                Unit terakhir terdaftar:{' '}
                                                <span className="font-mono font-bold text-foreground">
                                                    {selectedEquipment.last_unit_code}
                                                </span>
                                            </>
                                        ) : (
                                            'Belum ada unit fisik untuk alat ini (akan dimulai dari nomor 001).'
                                        )}
                                    </p>
                                )}
                            </div>

                            {!editingUnit ? (
                                <>
                                    {/* Quantity Stepper & Quick Pick */}
                                    <div className="space-y-1.5 rounded-lg border border-border bg-muted/20 p-3">
                                        <div className="flex items-center justify-between">
                                            <Label
                                                htmlFor="quantity"
                                                className="text-xs font-semibold"
                                            >
                                                Jumlah Unit yang Ditambahkan *
                                            </Label>
                                            <span className="text-[11px] font-bold text-primary">
                                                {quantity} Unit
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                            <div className="flex items-center rounded-md border border-border bg-background p-0.5">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-xs font-bold"
                                                    onClick={() =>
                                                        setQuantity(
                                                            Math.max(
                                                                1,
                                                                quantity - 1,
                                                            ),
                                                        )
                                                    }
                                                    disabled={quantity <= 1}
                                                >
                                                    -
                                                </Button>
                                                <Input
                                                    id="quantity"
                                                    type="number"
                                                    min={1}
                                                    max={50}
                                                    value={quantity}
                                                    onChange={(e) =>
                                                        setQuantity(
                                                            Math.max(
                                                                1,
                                                                Math.min(
                                                                    50,
                                                                    parseInt(
                                                                        e.target
                                                                            .value,
                                                                    ) || 1,
                                                                ),
                                                            ),
                                                        )
                                                    }
                                                    className="h-7 w-12 border-0 bg-transparent text-center font-mono text-xs font-bold shadow-none focus-visible:ring-0"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-xs font-bold"
                                                    onClick={() =>
                                                        setQuantity(
                                                            Math.min(
                                                                50,
                                                                quantity + 1,
                                                            ),
                                                        )
                                                    }
                                                    disabled={quantity >= 50}
                                                >
                                                    +
                                                </Button>
                                            </div>

                                            {/* Quick select buttons */}
                                            <div className="flex items-center gap-1">
                                                {[1, 3, 5, 10].map((q) => (
                                                    <Button
                                                        key={q}
                                                        type="button"
                                                        size="sm"
                                                        variant={
                                                            quantity === q
                                                                ? 'secondary'
                                                                : 'outline'
                                                        }
                                                        className="h-8 px-2.5 text-[11px]"
                                                        onClick={() =>
                                                            setQuantity(q)
                                                        }
                                                    >
                                                        +{q}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Auto Generated Unit Codes & Preview */}
                                    <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="flex items-center gap-1.5 text-xs font-semibold">
                                                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                                <span>
                                                    Kode Unit Otomatis
                                                </span>
                                            </Label>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowCustomFormat(
                                                        !showCustomFormat,
                                                    )
                                                }
                                                className="text-[11px] font-medium text-primary hover:underline"
                                            >
                                                {showCustomFormat
                                                    ? 'Tutup Kustomisasi'
                                                    : 'Kustomisasi Format'}
                                            </button>
                                        </div>

                                        {showCustomFormat && (
                                            <div className="grid grid-cols-2 gap-2 border-b border-border/60 pb-2">
                                                <div className="space-y-1">
                                                    <Label
                                                        htmlFor="custom_prefix"
                                                        className="text-[10px] text-muted-foreground"
                                                    >
                                                        Prefix Kode
                                                    </Label>
                                                    <Input
                                                        id="custom_prefix"
                                                        value={prefix}
                                                        onChange={(e) =>
                                                            setPrefix(
                                                                e.target.value.toUpperCase(),
                                                            )
                                                        }
                                                        className="h-8 font-mono text-xs"
                                                        placeholder="Misal: TND-4P-"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label
                                                        htmlFor="custom_start_number"
                                                        className="text-[10px] text-muted-foreground"
                                                    >
                                                        Nomor Mulai
                                                    </Label>
                                                    <Input
                                                        id="custom_start_number"
                                                        type="number"
                                                        min={1}
                                                        value={startNumber}
                                                        onChange={(e) =>
                                                            setStartNumber(
                                                                Math.max(
                                                                    1,
                                                                    parseInt(
                                                                        e.target
                                                                            .value,
                                                                    ) || 1,
                                                                ),
                                                            )
                                                        }
                                                        className="h-8 font-mono text-xs"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <span className="text-[11px] text-muted-foreground">
                                                Pratinjau Kode ({generatedCodes.length} unit):
                                            </span>
                                            <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto rounded-md border border-border/70 bg-background p-2">
                                                {generatedCodes
                                                    .slice(0, 10)
                                                    .map((code) => (
                                                        <Badge
                                                            key={code}
                                                            variant="secondary"
                                                            className="px-2 py-0.5 font-mono text-[11px] font-bold"
                                                        >
                                                            {code}
                                                        </Badge>
                                                    ))}
                                                {generatedCodes.length > 10 && (
                                                    <span className="self-center text-[11px] font-medium text-muted-foreground">
                                                        +{generatedCodes.length - 10} unit lainnya
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="unit_code"
                                        className="text-xs font-semibold"
                                    >
                                        Kode Unit Unik *
                                    </Label>
                                    <Input
                                        id="unit_code"
                                        value={unitCode}
                                        onChange={(e) =>
                                            setUnitCode(
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                        placeholder="Contoh: TND-4P-005 / KMP-004"
                                        className="h-9 font-mono text-xs font-bold"
                                        required
                                        disabled={
                                            editingUnit?.status === 'disewa'
                                        }
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">
                                        Kondisi Fisik *
                                    </Label>
                                    <Select
                                        value={condition}
                                        onValueChange={setCondition}
                                        disabled={
                                            editingUnit?.status === 'disewa'
                                        }
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="baik">
                                                Baik (Layak Pakai)
                                            </SelectItem>
                                            <SelectItem value="butuh_perbaikan">
                                                Butuh Perbaikan
                                            </SelectItem>
                                            <SelectItem value="rusak">
                                                Rusak
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">
                                        Status Operasional *
                                    </Label>
                                    <Select
                                        value={status}
                                        onValueChange={setStatus}
                                        disabled={
                                            editingUnit?.status === 'disewa'
                                        }
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {/* 'disewa' is never shown – set only via handover flow */}
                                            {editingUnit?.status ===
                                            'disewa' ? (
                                                // Show current locked state as read-only
                                                <SelectItem value="disewa">
                                                    Sedang Disewa (Terkunci)
                                                </SelectItem>
                                            ) : (
                                                <>
                                                    <SelectItem
                                                        value="tersedia"
                                                        disabled={
                                                            editingUnit?.status ===
                                                            'afkir'
                                                        }
                                                    >
                                                        Tersedia
                                                    </SelectItem>
                                                    <SelectItem
                                                        value="maintenance"
                                                        disabled={
                                                            editingUnit?.status ===
                                                            'afkir'
                                                        }
                                                    >
                                                        Maintenance / Servis
                                                    </SelectItem>
                                                    <SelectItem value="afkir">
                                                        Afkir (Tidak Aktif)
                                                    </SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="notes"
                                    className="text-xs font-semibold"
                                >
                                    Catatan Kondisi Unit (Opsional)
                                </Label>
                                <Textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLTextAreaElement>,
                                    ) => setNotes(e.target.value)}
                                    placeholder="Contoh: Frame lurus, kain inner bersih tanpa robekan..."
                                    className="h-20 resize-none text-xs"
                                    disabled={editingUnit?.status === 'disewa'}
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setUnitModalOpen(false)}
                            >
                                {editingUnit?.status === 'disewa'
                                    ? 'Tutup'
                                    : 'Batal'}
                            </Button>
                            {editingUnit?.status !== 'disewa' && (
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={submitting}
                                    className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                                >
                                    {submitting
                                        ? 'Menyimpan...'
                                        : editingUnit
                                          ? 'Simpan Perubahan'
                                          : quantity > 1
                                            ? `Simpan ${quantity} Unit Fisik Sekaligus`
                                            : 'Simpan Unit Fisik'}
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Individual Unit Logs Modal */}
            <Dialog open={logModalOpen} onOpenChange={setLogModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold">
                            <History className="h-4 w-4" />
                            <span>
                                Riwayat Pemakaian Unit:{' '}
                                {selectedUnitForLogs?.unit_code}
                            </span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Seluruh histori serah terima dan pengembalian untuk
                            unit ini.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-96 space-y-2 overflow-y-auto py-3 pr-1 text-xs">
                        {selectedUnitForLogs?.unit_logs &&
                        selectedUnitForLogs.unit_logs.length > 0 ? (
                            selectedUnitForLogs.unit_logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="space-y-1 rounded-lg border border-border bg-muted/20 p-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <Badge
                                            variant="secondary"
                                            className="text-[10px] capitalize"
                                        >
                                            {log.type === 'handover'
                                                ? 'Serah Terima'
                                                : log.type === 'return'
                                                  ? 'Pengembalian'
                                                  : 'Update Kondisi'}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatDateTime(log.created_at)}
                                        </span>
                                    </div>
                                    <div className="pt-0.5 text-xs font-medium text-foreground">
                                        {log.notes ||
                                            'Pemeriksaan rutin kondisi.'}
                                    </div>
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                        <span>
                                            Kondisi: {log.condition_before} →{' '}
                                            {log.condition_after}
                                        </span>
                                        <span>
                                            Petugas: {log.user?.name || 'Admin'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-muted-foreground">
                                Belum ada catatan riwayat pemakaian untuk unit
                                ini.
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setLogModalOpen(false)}
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Delete Unit Dialog */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">
                            Konfirmasi Hapus Unit
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Apakah Anda yakin ingin menghapus unit fisik{' '}
                            <strong>{unitToDelete?.unit_code}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteModalOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={deleting}
                            onClick={confirmDelete}
                        >
                            {deleting ? 'Menghapus...' : 'Ya, Hapus Unit'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Individual Unit QR Code & Print Modal */}
            <QrCodeModal
                open={qrModalOpen}
                onOpenChange={setQrModalOpen}
                unit={selectedUnitForQr}
            />
        </AppLayout>
    );
}
