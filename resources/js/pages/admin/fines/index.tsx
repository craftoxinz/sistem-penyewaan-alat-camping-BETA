import { Head, Link, router } from '@inertiajs/react';
import {
    ShieldAlert,
    Clock,
    AlertTriangle,
    CheckCircle2,
    DollarSign,
    User as UserIcon,
    Phone,
    Calendar,
    Search,
    RotateCcw,
    Ban,
    Calculator,
    Eye,
    MessageCircle,
    Receipt,
    Layers,
    CreditCard,
    ArrowUpRight,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import {
    RentalStatusBadge,
    PaymentStatusBadge,
    DepositStatusBadge,
    UserStatusBadge,
} from '@/components/status-badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { formatRupiah, formatDate, formatDateTime } from '@/lib/formatters';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import type { Rental, EquipmentUnit, BreadcrumbItem, PaginatedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Menu Utama',
        href: '/admin',
    },
    {
        title: 'Denda & Keterlambatan',
        href: '/admin/fines',
    },
];

interface FinesIndexProps {
    rentals: PaginatedData<Rental>;
    stats: {
        active_overdue_count: number;
        active_overdue_est_fine: number;
        total_fine_collected: number;
        total_defaulted_loss: number;
        completed_fine_cases_count: number;
        defaulted_cases_count: number;
        total_incidents: number;
    };
    filters: {
        tab: string;
        search: string;
        payment_status: string;
        per_page?: number;
    };
}

export default function FinesIndex({ rentals, stats, filters }: FinesIndexProps) {
    const [search, setSearch] = useState<string>(filters.search || '');
    const [activeTab, setActiveTab] = useState<string>(filters.tab || 'overdue');
    const [paymentStatus, setPaymentStatus] = useState<string>(filters.payment_status || 'all');

    // Return Modal State
    const [returnModalOpen, setReturnModalOpen] = useState<boolean>(false);
    const [selectedRentalForReturn, setSelectedRentalForReturn] = useState<Rental | null>(null);
    const [unitReturns, setUnitReturns] = useState<
        Record<number, { condition_in: 'baik' | 'butuh_perbaikan' | 'rusak' | 'hilang'; notes_in: string; damage_fee: number }>
    >({});
    const [damageFee, setDamageFee] = useState<number>(0);
    const [returnNotes, setReturnNotes] = useState<string>('');
    const [submittingReturn, setSubmittingReturn] = useState<boolean>(false);

    // Defaulted Modal State
    const [defaultedModalOpen, setDefaultedModalOpen] = useState<boolean>(false);
    const [selectedRentalForDefaulted, setSelectedRentalForDefaulted] = useState<Rental | null>(null);
    const [defaultedNotes, setDefaultedNotes] = useState<string>('');
    const [suspendUserOnDefault, setSuspendUserOnDefault] = useState<boolean>(true);
    const [submittingDefaulted, setSubmittingDefaulted] = useState<boolean>(false);

    // Settle Modal State
    const [settleModalOpen, setSettleModalOpen] = useState<boolean>(false);
    const [selectedRentalForSettle, setSelectedRentalForSettle] = useState<Rental | null>(null);
    const [settleAmount, setSettleAmount] = useState<number>(0);
    const [settleNotes, setSettleNotes] = useState<string>('');
    const [submittingSettle, setSubmittingSettle] = useState<boolean>(false);

    // Handle Tab Change
    const handleTabChange = (newTab: string) => {
        setActiveTab(newTab);
        router.get(
            '/admin/fines',
            { tab: newTab, search, payment_status: paymentStatus },
            { preserveState: true, replace: true }
        );
    };

    // Handle Search Submit
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/fines',
            { tab: activeTab, search, payment_status: paymentStatus },
            { preserveState: true, replace: true }
        );
    };

    // Handle Payment Status Filter Change
    const handlePaymentStatusChange = (val: string) => {
        setPaymentStatus(val);
        router.get(
            '/admin/fines',
            { tab: activeTab, search, payment_status: val },
            { preserveState: true, replace: true }
        );
    };

    // Open Return Modal
    const openReturnModal = (rental: Rental) => {
        setSelectedRentalForReturn(rental);
        setDamageFee(0);
        setReturnNotes('');

        const initialReturns: Record<
            number,
            { condition_in: 'baik' | 'butuh_perbaikan' | 'rusak' | 'hilang'; notes_in: string; damage_fee: number }
        > = {};
        rental.items?.forEach((item) => {
            item.item_units?.forEach((iu) => {
                initialReturns[iu.id] = {
                    condition_in: 'baik',
                    notes_in: 'Kondisi pengembalian baik & lengkap.',
                    damage_fee: 0,
                };
            });
        });
        setUnitReturns(initialReturns);
        setReturnModalOpen(true);
    };

    const handleUnitConditionChange = (
        iuId: number,
        condition: 'baik' | 'butuh_perbaikan' | 'rusak' | 'hilang',
        equipment?: any,
    ) => {
        let autoFee = 0;
        if (condition === 'butuh_perbaikan') {
            autoFee = Number(equipment?.fine_minor_damage || 0);
        } else if (condition === 'rusak') {
            autoFee = Number(equipment?.fine_heavy_damage || 0);
        } else if (condition === 'hilang') {
            autoFee = Number(equipment?.fine_lost || 0);
        }

        const nextReturns = {
            ...unitReturns,
            [iuId]: {
                ...unitReturns[iuId],
                condition_in: condition,
                damage_fee: autoFee,
            },
        };
        setUnitReturns(nextReturns);

        const totalDmg = Object.values(nextReturns).reduce(
            (sum, u) => sum + (Number(u.damage_fee) || 0),
            0,
        );
        setDamageFee(totalDmg);
    };

    const handleUnitDamageFeeChange = (iuId: number, val: string) => {
        const fee = parseFloat(val) || 0;
        const nextReturns = {
            ...unitReturns,
            [iuId]: {
                ...unitReturns[iuId],
                damage_fee: fee,
            },
        };
        setUnitReturns(nextReturns);

        const totalDmg = Object.values(nextReturns).reduce(
            (sum, u) => sum + (Number(u.damage_fee) || 0),
            0,
        );
        setDamageFee(totalDmg);
    };

    // Calculate Late Fees for Return Modal
    const calculateLateFee = (rental: Rental | null) => {
        if (!rental) return { lateDays: 0, lateFee: 0 };
        const endDate = new Date(rental.end_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        if (today <= endDate) return { lateDays: 0, lateFee: 0 };

        const diffTime = today.getTime() - endDate.getTime();
        const lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const dailyRate = rental.items?.reduce((sum, item) => {
            const price = typeof item.price_per_day === 'string' ? parseFloat(item.price_per_day) : item.price_per_day;
            return sum + price * item.quantity;
        }, 0) || 0;

        const lateFee = lateDays * dailyRate;
        return { lateDays, lateFee };
    };

    // Handle Return Submit
    const handleReturnSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRentalForReturn) return;

        const payloadReturns = Object.entries(unitReturns).map(([iuId, val]) => ({
            rental_item_unit_id: parseInt(iuId),
            condition_in: val.condition_in,
            notes_in: val.notes_in,
            damage_fee: val.damage_fee || 0,
        }));

        const { lateDays, lateFee } = calculateLateFee(selectedRentalForReturn);
        const currentDamageFee = Number(damageFee) || 0;
        const totalFine = lateFee + currentDamageFee;
        const totalDeposit = Number(selectedRentalForReturn.total_deposit) || 0;
        const netRefund = totalDeposit - totalFine;

        const depositStatus = netRefund > 0 ? 'refunded' : 'forfeited';
        const depositRefundAmount = Math.max(0, netRefund);
        const additionalChargePaid = netRefund < 0 ? Math.abs(netRefund) : 0;
        const finePaymentStatus =
            totalFine > 0 ? (netRefund >= 0 ? 'settled_from_deposit' : 'paid_extra_cash') : 'none';

        setSubmittingReturn(true);
        router.post(
            `/admin/rentals/${selectedRentalForReturn.id}/return`,
            {
                returns: payloadReturns,
                late_days: lateDays,
                late_fee: lateFee,
                damage_fee: currentDamageFee,
                total_fine: totalFine,
                additional_charge_paid: additionalChargePaid,
                fine_payment_status: finePaymentStatus,
                deposit_status: depositStatus,
                deposit_refund_amount: depositRefundAmount,
                admin_notes: returnNotes || 'Pengembalian unit dan denda diproses via menu Denda & Keterlambatan.',
            },
            {
                onSuccess: () => {
                    toast.success('Pengembalian unit & denda berhasil diproses!');
                    setReturnModalOpen(false);
                    setSelectedRentalForReturn(null);
                },
                onError: (errors) => {
                    const firstErr = Object.values(errors)[0] as string;
                    toast.error(firstErr || 'Gagal memproses pengembalian unit.');
                },
                onFinish: () => setSubmittingReturn(false),
            }
        );
    };

    // Open Defaulted Modal
    const openDefaultedModal = (rental: Rental) => {
        setSelectedRentalForDefaulted(rental);
        setDefaultedNotes('');
        setSuspendUserOnDefault(true);
        setDefaultedModalOpen(true);
    };

    // Handle Defaulted Submit
    const handleDefaultedSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRentalForDefaulted) return;

        setSubmittingDefaulted(true);
        router.post(
            `/admin/rentals/${selectedRentalForDefaulted.id}/defaulted`,
            {
                admin_notes: defaultedNotes || 'Pesanan dinyatakan bermasalah/hilang oleh admin.',
                suspend_user: suspendUserOnDefault,
            },
            {
                onSuccess: () => {
                    toast.success('Pesanan ditandai sebagai defaulted dan deposit disita.');
                    setDefaultedModalOpen(false);
                    setSelectedRentalForDefaulted(null);
                },
                onError: (errors) => {
                    const firstErr = Object.values(errors)[0] as string;
                    toast.error(firstErr || 'Gagal memproses status defaulted.');
                },
                onFinish: () => setSubmittingDefaulted(false),
            }
        );
    };

    // Open Settle Modal
    const openSettleModal = (rental: Rental) => {
        setSelectedRentalForSettle(rental);
        setSettleAmount(Number(rental.additional_charge_paid || rental.total_fine || 0));
        setSettleNotes('');
        setSettleModalOpen(true);
    };

    // Handle Settle Submit
    const handleSettleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRentalForSettle) return;

        setSubmittingSettle(true);
        router.post(
            `/admin/fines/${selectedRentalForSettle.id}/settle`,
            {
                additional_charge_paid: settleAmount,
                admin_notes: settleNotes || 'Pelunasan tagihan denda kasir.',
            },
            {
                onSuccess: () => {
                    toast.success('Pelunasan denda berhasil dicatat!');
                    setSettleModalOpen(false);
                    setSelectedRentalForSettle(null);
                },
                onError: (errors) => {
                    const firstErr = Object.values(errors)[0] as string;
                    toast.error(firstErr || 'Gagal menyimpan pelunasan denda.');
                },
                onFinish: () => setSubmittingSettle(false),
            }
        );
    };

    // Generate WhatsApp Link Helper
    const getWhatsAppUrl = (rental: Rental) => {
        const phone = rental.user?.phone?.replace(/\D/g, '') || '';
        const normalizedPhone = phone.startsWith('0') ? `62${phone.slice(1)}` : phone;
        const overdueDays = rental.overdue_days || 0;
        const msg = encodeURIComponent(
            `Halo Kak ${rental.user?.name}, kami dari CampRental menginformasikan terkait pesanan sewa ${rental.invoice_number} (${rental.booking_code}) yang telah melewati batas waktu pengembalian (${formatDate(rental.end_date)} / ${overdueDays} hari keterlambatan). Mohon segera melakukan konfirmasi dan pengembalian unit alat camping ke toko kami. Terima kasih.`
        );
        return `https://wa.me/${normalizedPhone}?text=${msg}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Denda & Keterlambatan - Admin Panel" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Title */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Kelola Denda & Keterlambatan
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Monitoring pesanan lewat batas waktu sewa, denda keterlambatan, dan ganti rugi unit.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="text-xs"
                        >
                            <Link href="/admin/rentals">
                                <Receipt className="mr-1.5 h-3.5 w-3.5" />
                                Semua Transaksi Sewa
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* 4 Summary Stat Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Card 1: Active Overdue */}
                    <Card className="border-rose-300/80 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold text-rose-900 dark:text-rose-200">
                                Sedang Terlambat Aktif
                            </CardTitle>
                            <div className="rounded-lg bg-rose-100 p-2 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                                <Clock className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold text-rose-700 dark:text-rose-400">
                                {stats.active_overdue_count}{' '}
                                <span className="text-xs font-medium text-muted-foreground">Pesanan</span>
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                Estimasi denda: <strong className="text-rose-700 dark:text-rose-300 font-mono">{formatRupiah(stats.active_overdue_est_fine)}</strong>
                            </p>
                        </CardContent>
                    </Card>

                    {/* Card 2: Total Fines Collected */}
                    <Card className="border-emerald-300/80 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                                Total Denda Terkumpul
                            </CardTitle>
                            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                <DollarSign className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                                {formatRupiah(stats.total_fine_collected)}
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                Dari {stats.completed_fine_cases_count} transaksi selesai
                            </p>
                        </CardContent>
                    </Card>

                    {/* Card 3: Defaulted / Lost Loss */}
                    <Card className="border-amber-300/80 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                                Kasus Defaulted / Hilang
                            </CardTitle>
                            <div className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                <Ban className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-400">
                                {stats.defaulted_cases_count}{' '}
                                <span className="text-xs font-medium text-muted-foreground">Kasus</span>
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                Nilai disita: <span className="font-mono">{formatRupiah(stats.total_defaulted_loss)}</span>
                            </p>
                        </CardContent>
                    </Card>

                    {/* Card 4: Total Fine Incidents */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold text-muted-foreground">
                                Total Rekap Insiden
                            </CardTitle>
                            <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                                <AlertTriangle className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold text-foreground">
                                {stats.total_incidents}{' '}
                                <span className="text-xs font-medium text-muted-foreground">Kejadian</span>
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                Keterlambatan, kerusakan & hilang
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Bar & Tabs Navigation */}
                <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Tab Buttons */}
                        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-muted/40 p-1 text-xs">
                            <button
                                type="button"
                                onClick={() => handleTabChange('overdue')}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                                    activeTab === 'overdue'
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Clock className="h-3.5 w-3.5 text-rose-500" />
                                <span>Sedang Terlambat</span>
                                {stats.active_overdue_count > 0 && (
                                    <span className="ml-1 rounded-full bg-rose-600 px-1.5 py-0.2 font-mono text-[10px] font-bold text-white animate-pulse">
                                        {stats.active_overdue_count}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleTabChange('history')}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                                    activeTab === 'history'
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                <span>Riwayat Denda Selesai</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleTabChange('defaulted')}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                                    activeTab === 'defaulted'
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Ban className="h-3.5 w-3.5 text-amber-500" />
                                <span>Barang Hilang / Defaulted</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleTabChange('all')}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                                    activeTab === 'all'
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Receipt className="h-3.5 w-3.5 text-blue-500" />
                                <span>Semua Kasus</span>
                            </button>
                        </div>

                        {/* Search & Status Filter */}
                        <div className="flex flex-wrap items-center gap-2">
                            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Cari invoice, nama, telp..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-8 pl-8 text-xs"
                                />
                            </form>

                            {activeTab !== 'overdue' && (
                                <Select value={paymentStatus} onValueChange={handlePaymentStatusChange}>
                                    <SelectTrigger className="h-8 w-44 text-xs">
                                        <SelectValue placeholder="Status Pembayaran Denda" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Status Denda</SelectItem>
                                        <SelectItem value="settled_from_deposit">Potong dari Deposit</SelectItem>
                                        <SelectItem value="paid_extra_cash">Bayar Tunai Kasir</SelectItem>
                                        <SelectItem value="unpaid_defaulted">Belum Lunas / Defaulted</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
                            <thead>
                                <tr className="border-b border-border bg-muted/60 text-muted-foreground">
                                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Transaksi & Penyewa</th>
                                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Jadwal & Keterlambatan</th>
                                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Peralatan Disewa</th>
                                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Rincian Finansial & Denda</th>
                                    <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Aksi Tindakan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {rentals.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground whitespace-nowrap">
                                            <ShieldAlert className="mx-auto mb-2 h-8 w-8 opacity-40 text-emerald-600" />
                                            <div className="font-semibold text-foreground">
                                                {activeTab === 'overdue'
                                                    ? 'Tidak Ada Pesanan yang Terlambat!'
                                                    : 'Tidak Ada Data Denda Ditemukan'}
                                            </div>
                                            <p className="mt-1 text-xs">
                                                {activeTab === 'overdue'
                                                    ? 'Semua penyewa mengembalikan alat tepat waktu.'
                                                    : 'Tidak ada transaksi dengan kriteria filter yang dipilih.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    rentals.data.map((rental) => {
                                        const isOverdue = rental.is_overdue;
                                        const overdueDays = rental.overdue_days || rental.late_days || 0;
                                        const totalFine = Number(rental.total_fine || 0);

                                        return (
                                            <tr key={rental.id} className="hover:bg-muted/30 transition-colors">
                                                {/* Column 1: Transaction & User */}
                                                <td className="px-4 py-3 align-top whitespace-nowrap">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-mono text-xs font-bold text-foreground">
                                                                {rental.invoice_number}
                                                            </span>
                                                            <RentalStatusBadge status={rental.rental_status} />
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground">
                                                            Kode: <span className="font-mono font-medium">{rental.booking_code}</span>
                                                        </div>
                                                        <div className="pt-1 text-xs">
                                                            <div className="font-semibold text-foreground flex items-center gap-1">
                                                                <UserIcon className="h-3 w-3 text-muted-foreground" />
                                                                <span>{rental.user?.name}</span>
                                                                {rental.user?.status && (
                                                                    <UserStatusBadge status={rental.user.status} />
                                                                )}
                                                            </div>
                                                            {rental.user?.phone && (
                                                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                                    <Phone className="h-3 w-3" />
                                                                    <span>{rental.user.phone}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Column 2: Schedule & Overdue */}
                                                <td className="px-4 py-3 align-top whitespace-nowrap">
                                                    <div className="space-y-1">
                                                        <div className="text-[11px] text-muted-foreground">
                                                            <span>Jadwal Kembali:</span>{' '}
                                                            <strong className="text-foreground">{formatDate(rental.end_date)}</strong>
                                                        </div>

                                                        {rental.rental_status === 'active' && isOverdue && (
                                                            <div className="pt-1">
                                                                <Badge className="bg-rose-600 text-white font-bold text-[10px] animate-pulse">
                                                                    Terlambat {overdueDays} Hari
                                                                </Badge>
                                                            </div>
                                                        )}

                                                        {rental.rental_status === 'completed' && Number(rental.late_days || 0) > 0 && (
                                                            <div className="pt-1">
                                                                <Badge variant="outline" className="border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-950/40 text-[10px] font-semibold">
                                                                    Telat {rental.late_days} Hari
                                                                </Badge>
                                                            </div>
                                                        )}

                                                        {rental.returned_at && (
                                                            <div className="text-[10px] text-muted-foreground pt-1">
                                                                Dikembalikan: {formatDateTime(rental.returned_at)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Column 3: Equipment Items */}
                                                <td className="px-4 py-3 align-top whitespace-nowrap">
                                                    <div className="space-y-1 max-w-xs">
                                                        {rental.items?.map((item) => (
                                                            <div key={item.id} className="text-xs">
                                                                <div className="font-medium text-foreground">
                                                                    {item.quantity}x {item.equipment?.name}
                                                                </div>
                                                                {item.item_units && item.item_units.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 pt-0.5">
                                                                        {item.item_units.map((iu) => (
                                                                            <span
                                                                                key={iu.id}
                                                                                className="rounded bg-muted px-1.5 py-0.2 font-mono text-[10px] font-semibold text-muted-foreground"
                                                                            >
                                                                                {iu.equipment_unit?.unit_code}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>

                                                {/* Column 4: Financial & Fines */}
                                                <td className="px-4 py-3 align-top whitespace-nowrap">
                                                    <div className="space-y-1 text-xs">
                                                        {/* If Active & Overdue */}
                                                        {rental.rental_status === 'active' && (
                                                            <div>
                                                                <div className="text-[11px] text-muted-foreground">
                                                                    Deposit Jaminan: <strong className="font-mono text-foreground">{formatRupiah(rental.total_deposit)}</strong>
                                                                </div>
                                                                {isOverdue && (
                                                                    <div className="text-xs font-bold text-rose-700 dark:text-rose-400">
                                                                        Estimasi Denda: <span className="font-mono">{formatRupiah((rental.overdue_days || 1) * Number(rental.subtotal_price) / Math.max(1, rental.total_days))}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* If Completed with Fine */}
                                                        {rental.rental_status === 'completed' && (
                                                            <div>
                                                                <div className="font-bold text-rose-800 dark:text-rose-300 flex items-center justify-between">
                                                                    <span>Total Denda:</span>
                                                                    <span className="font-mono">{formatRupiah(rental.total_fine || 0)}</span>
                                                                </div>
                                                                {Number(rental.late_fee || 0) > 0 && (
                                                                    <div className="text-[11px] text-muted-foreground flex justify-between">
                                                                        <span>• Denda Telat ({rental.late_days}h):</span>
                                                                        <span className="font-mono">{formatRupiah(rental.late_fee)}</span>
                                                                    </div>
                                                                )}
                                                                {Number(rental.damage_fee || 0) > 0 && (
                                                                    <div className="text-[11px] text-muted-foreground flex justify-between">
                                                                        <span>• Biaya Kerusakan:</span>
                                                                        <span className="font-mono">{formatRupiah(rental.damage_fee)}</span>
                                                                    </div>
                                                                )}
                                                                <div className="text-[11px] pt-1 text-muted-foreground">
                                                                    Status: <span className="font-semibold text-foreground">{rental.fine_payment_status}</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* If Defaulted */}
                                                        {rental.rental_status === 'defaulted' && (
                                                            <div className="text-xs font-semibold text-rose-700 dark:text-rose-400 space-y-0.5">
                                                                <div>Status: Defaulted / Hilang</div>
                                                                <div className="text-[11px] text-muted-foreground">
                                                                    Deposit Disita: <span className="font-mono font-bold text-foreground">{formatRupiah(rental.total_deposit)}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Column 5: Actions */}
                                                <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                                                    <div className="flex flex-col items-end gap-1.5">
                                                        {/* WhatsApp Follow-up (If Active Overdue) */}
                                                        {rental.rental_status === 'active' && rental.user?.phone && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                asChild
                                                                className="h-7 text-xs border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                                            >
                                                                <a
                                                                    href={getWhatsAppUrl(rental)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <MessageCircle className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                                                                    Hubungi WA
                                                                </a>
                                                            </Button>
                                                        )}

                                                        {/* Return & Smart Settlement Button */}
                                                        {rental.rental_status === 'active' && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => openReturnModal(rental)}
                                                                className="h-7 text-xs bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                                                            >
                                                                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                                                                Proses Pengembalian
                                                            </Button>
                                                        )}

                                                        {/* Defaulted Button (If Active) */}
                                                        {rental.rental_status === 'active' && (
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => openDefaultedModal(rental)}
                                                                className="h-7 text-xs"
                                                            >
                                                                <Ban className="mr-1 h-3.5 w-3.5" />
                                                                Tandai Defaulted
                                                            </Button>
                                                        )}

                                                        {/* Settle Additional Cash Payment */}
                                                        {rental.rental_status === 'completed' && Number(rental.total_fine || 0) > 0 && rental.fine_payment_status !== 'settled_from_deposit' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => openSettleModal(rental)}
                                                                className="h-7 text-xs border-blue-500/30 text-blue-700 dark:text-blue-400"
                                                            >
                                                                <CreditCard className="mr-1 h-3.5 w-3.5" />
                                                                Update Pelunasan
                                                            </Button>
                                                        )}

                                                        {/* Invoice Detail Link */}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            asChild
                                                            className="h-7 text-xs text-muted-foreground"
                                                        >
                                                            <Link href={`/bookings/${rental.id}`}>
                                                                <Eye className="mr-1 h-3.5 w-3.5" />
                                                                Lihat Invoice
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <DataTablePagination pagination={rentals} />
                </div>
            </div>

            {/* RETURN MODAL WITH FINE CALCULATION & SMART DEPOSIT SETTLEMENT */}
            <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                            <RotateCcw className="h-5 w-5 text-emerald-600" />
                            <span>Pengembalian Unit & Penyelesaian Denda</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Periksa kondisi setiap unit fisik, hitung denda keterlambatan / kerusakan, dan selesaikan pengembalian uang jaminan deposit.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRentalForReturn && (
                        <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
                            {/* Summary Invoice & Overdue Alert */}
                            <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-mono text-sm font-bold text-foreground">
                                            {selectedRentalForReturn.invoice_number}
                                        </div>
                                        <div className="text-muted-foreground">
                                            Penyewa: <strong>{selectedRentalForReturn.user?.name}</strong> | Batas Kembali: {formatDate(selectedRentalForReturn.end_date)}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-muted-foreground text-[11px]">Deposit Ditahan:</div>
                                        <div className="font-mono font-bold text-foreground text-sm">
                                            {formatRupiah(selectedRentalForReturn.total_deposit)}
                                        </div>
                                    </div>
                                </div>

                                {(() => {
                                    const { lateDays, lateFee } = calculateLateFee(selectedRentalForReturn);
                                    if (lateDays > 0) {
                                        return (
                                            <div className="rounded-lg border border-rose-300 bg-rose-50/70 p-2.5 dark:border-rose-900/60 dark:bg-rose-950/30 flex items-start gap-2 text-rose-900 dark:text-rose-200">
                                                <Clock className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                                                <div className="text-[11px] leading-tight">
                                                    <strong>Keterlambatan Terdeteksi: {lateDays} Hari</strong>
                                                    <div className="text-muted-foreground dark:text-rose-300/80">
                                                        Denda keterlambatan dihitung otomatis: <strong className="font-mono">{formatRupiah(lateFee)}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>

                            {/* Condition Input for Each Assigned Unit */}
                            <div className="space-y-3">
                                <Label className="text-xs font-semibold">Kondisi Pengembalian Setiap Unit Fisik:</Label>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {selectedRentalForReturn.items?.map((item) =>
                                        item.item_units?.map((iu) => (
                                            <div
                                                key={iu.id}
                                                className="rounded-xl border border-border p-3 space-y-2 bg-card"
                                            >
                                                <div className="flex items-center justify-between font-semibold">
                                                    <div>
                                                        <span>{item.equipment?.name}</span>
                                                        <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                                                            [{iu.equipment_unit?.unit_code}]
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground font-normal">
                                                        Kondisi awal: <strong className="text-foreground">{iu.condition_out}</strong>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3 border-t border-border/50">
                                                    <div>
                                                        <Label className="text-[11px]">Kondisi Saat Kembali:</Label>
                                                        <Select
                                                            value={unitReturns[iu.id]?.condition_in || 'baik'}
                                                            onValueChange={(val: any) =>
                                                                handleUnitConditionChange(
                                                                    iu.id,
                                                                    val,
                                                                    item.equipment,
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger className="h-8 text-xs mt-1">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="baik">Baik & Utuh (Rp 0)</SelectItem>
                                                                <SelectItem value="butuh_perbaikan">
                                                                    Butuh Servis ({Number(item.equipment?.fine_minor_damage || 0) > 0 ? formatRupiah(item.equipment?.fine_minor_damage) : 'Rp 0'})
                                                                </SelectItem>
                                                                <SelectItem value="rusak">
                                                                    Rusak Berat ({Number(item.equipment?.fine_heavy_damage || 0) > 0 ? formatRupiah(item.equipment?.fine_heavy_damage) : 'Rp 0'})
                                                                </SelectItem>
                                                                <SelectItem value="hilang">
                                                                    Hilang / Afkir ({Number(item.equipment?.fine_lost || 0) > 0 ? formatRupiah(item.equipment?.fine_lost) : 'Rp 0'})
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div>
                                                        <Label className="text-[11px] flex items-center justify-between">
                                                            <span>Denda Unit (Rp):</span>
                                                            {unitReturns[iu.id]?.condition_in !== 'baik' && (
                                                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Otomatis / Edit</span>
                                                            )}
                                                        </Label>
                                                        <Input
                                                            type="number"
                                                            value={unitReturns[iu.id]?.damage_fee ?? 0}
                                                            onChange={(e) =>
                                                                handleUnitDamageFeeChange(iu.id, e.target.value)
                                                            }
                                                            min="0"
                                                            disabled={unitReturns[iu.id]?.condition_in === 'baik'}
                                                            className="h-8 text-xs mt-1 font-mono"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label className="text-[11px]">Catatan Kondisi Unit:</Label>
                                                        <Input
                                                            value={unitReturns[iu.id]?.notes_in || ''}
                                                            onChange={(e) =>
                                                                setUnitReturns((prev) => ({
                                                                    ...prev,
                                                                    [iu.id]: {
                                                                        ...prev[iu.id],
                                                                        notes_in: e.target.value,
                                                                    },
                                                                }))
                                                            }
                                                            placeholder="Catatan inspeksi..."
                                                            className="h-8 text-xs mt-1"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Additional Damage / Loss Fee */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold flex items-center justify-between">
                                    <span>Total Biaya Kerusakan / Ganti Rugi (Rp):</span>
                                    {Number(damageFee) > 0 && (
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Akumulasi Unit</span>
                                    )}
                                </Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={damageFee}
                                    onChange={(e) => setDamageFee(parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    className="h-8 text-xs font-mono"
                                />

                                {/* Itemized Damage Breakdown Pill List */}
                                {Object.entries(unitReturns).some(([_, d]) => Number(d.damage_fee || 0) > 0) && (
                                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs space-y-1.5 mt-2">
                                        <div className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
                                            <ShieldAlert className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                            <span>Rincian Denda Kerusakan Unit Fisik:</span>
                                        </div>
                                        <div className="space-y-1">
                                            {selectedRentalForReturn.items?.flatMap((item) =>
                                                (item.item_units || [])
                                                    .filter((iu) => Number(unitReturns[iu.id]?.damage_fee || 0) > 0)
                                                    .map((iu) => (
                                                        <div key={iu.id} className="flex justify-between items-center text-[11px] text-muted-foreground bg-background/60 rounded px-2 py-1">
                                                            <span className="flex items-center gap-1.5">
                                                                <span className="font-mono font-bold text-foreground">
                                                                    {iu.equipment_unit?.unit_code}
                                                                </span>
                                                                <span>({item.equipment?.name})</span>
                                                                <span className="text-[10px] rounded px-1.5 py-0.5 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-medium capitalize">
                                                                    {unitReturns[iu.id]?.condition_in.replace('_', ' ')}
                                                                </span>
                                                            </span>
                                                            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                                                                {formatRupiah(unitReturns[iu.id]?.damage_fee || 0)}
                                                            </span>
                                                        </div>
                                                    )),
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Smart Deposit Settlement Card */}
                            {(() => {
                                const { lateDays, lateFee } = calculateLateFee(selectedRentalForReturn);
                                const currentDamageFee = Number(damageFee) || 0;
                                const totalFine = lateFee + currentDamageFee;
                                const totalDeposit = Number(selectedRentalForReturn.total_deposit) || 0;
                                const net = totalDeposit - totalFine;

                                return (
                                    <div className="rounded-xl border border-border/80 bg-zinc-100 p-3.5 space-y-2 dark:bg-zinc-800/80">
                                        <div className="flex items-center justify-between text-xs font-bold text-foreground">
                                            <span>Kalkulasi Akhir Smart Settlement:</span>
                                        </div>
                                        <div className="space-y-1 text-[11px] text-muted-foreground">
                                            <div className="flex justify-between">
                                                <span>Uang Jaminan (Deposit):</span>
                                                <span className="font-mono text-foreground">{formatRupiah(totalDeposit)}</span>
                                            </div>
                                            <div className="flex justify-between text-rose-700 dark:text-rose-400">
                                                <span>Denda Keterlambatan ({lateDays} hari):</span>
                                                <span className="font-mono">- {formatRupiah(lateFee)}</span>
                                            </div>
                                            <div className="flex justify-between text-rose-700 dark:text-rose-400">
                                                <span>Biaya Kerusakan / Hilang:</span>
                                                <span className="font-mono">- {formatRupiah(currentDamageFee)}</span>
                                            </div>
                                            <div className="border-t border-border/60 pt-1 flex justify-between font-bold text-xs text-foreground">
                                                <span>Total Denda & Ganti Rugi:</span>
                                                <span className="font-mono text-rose-700 dark:text-rose-400">{formatRupiah(totalFine)}</span>
                                            </div>
                                        </div>

                                        <div className="border-t border-border/60 pt-2">
                                            {net >= 0 ? (
                                                <div className="flex items-center justify-between font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                                                    <span>Sisa Deposit Dikembalikan ke Penyewa:</span>
                                                    <span className="font-mono text-sm">{formatRupiah(net)}</span>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between font-bold text-rose-700 dark:text-rose-400 text-xs">
                                                        <span>Kekurangan Bayar (Wajib Dibayar Tunai Kasir):</span>
                                                        <span className="font-mono text-sm">{formatRupiah(Math.abs(net))}</span>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        *Seluruh deposit disita dan sisa tagihan denda dibayar tunai di kasir toko saat ini.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Admin Notes */}
                            <div className="space-y-1.5">
                                <Label className="text-xs">Catatan Admin:</Label>
                                <Textarea
                                    value={returnNotes}
                                    onChange={(e) => setReturnNotes(e.target.value)}
                                    placeholder="Catatan tambahan hasil inspeksi pengembalian..."
                                    rows={2}
                                    className="text-xs"
                                />
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setReturnModalOpen(false)}
                                    disabled={submittingReturn}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={submittingReturn}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {submittingReturn ? 'Menyimpan...' : 'Selesaikan Pengembalian'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* DEFAULTED / LOST MODAL */}
            <Dialog open={defaultedModalOpen} onOpenChange={setDefaultedModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
                            <Ban className="h-5 w-5" />
                            <span>Tandai Transaksi Defaulted / Hilang</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Gunakan opsi ini jika penyewa membawa kabur peralatan camping atau tidak dapat dihubungi sama sekali.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRentalForDefaulted && (
                        <form onSubmit={handleDefaultedSubmit} className="space-y-3 text-xs">
                            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 space-y-1 text-destructive">
                                <div className="font-bold">Konsekuensi Transaksi Defaulted:</div>
                                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                                    <li>Seluruh jaminan deposit ({formatRupiah(selectedRentalForDefaulted.total_deposit)}) otomatis disita 100%.</li>
                                    <li>Semua unit fisik yang diserahterimakan otomatis diubah statusnya menjadi <strong>Afkir (Hilang)</strong>.</li>
                                    <li>Akun penyewa (<strong>{selectedRentalForDefaulted.user?.name}</strong>) dapat otomatis ditangguhkan (suspended).</li>
                                </ul>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Alasan / Catatan Admin (Wajib):</Label>
                                <Textarea
                                    value={defaultedNotes}
                                    onChange={(e) => setDefaultedNotes(e.target.value)}
                                    placeholder="Contoh: Penyewa tidak dapat dihubungi setelah 7 hari dan unit tidak kembali..."
                                    required
                                    rows={3}
                                    className="text-xs"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="suspend_user"
                                    checked={suspendUserOnDefault}
                                    onChange={(e) => setSuspendUserOnDefault(e.target.checked)}
                                    className="rounded border-border"
                                />
                                <Label htmlFor="suspend_user" className="text-xs cursor-pointer">
                                    Tangguhkan (Suspend) akun penyewa dari booking berikutnya
                                </Label>
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDefaultedModalOpen(false)}
                                    disabled={submittingDefaulted}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    variant="destructive"
                                    disabled={submittingDefaulted}
                                >
                                    {submittingDefaulted ? 'Memproses...' : 'Konfirmasi Defaulted'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* SETTLE EXTRA CASH MODAL */}
            <Dialog open={settleModalOpen} onOpenChange={setSettleModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                            <span>Update Pelunasan Tagihan Kasir</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Catat pelunasan sisa denda atau kekurangan biaya perbaikan yang dibayarkan tunai oleh penyewa.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRentalForSettle && (
                        <form onSubmit={handleSettleSubmit} className="space-y-3 text-xs">
                            <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-1">
                                <div className="font-mono text-sm font-bold text-foreground">
                                    {selectedRentalForSettle.invoice_number}
                                </div>
                                <div className="text-muted-foreground">
                                    Penyewa: {selectedRentalForSettle.user?.name} | Total Denda: <strong className="font-mono text-rose-700 dark:text-rose-400">{formatRupiah(selectedRentalForSettle.total_fine || 0)}</strong>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Nominal Denda Dibayar Tunai (Rp):</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={settleAmount}
                                    onChange={(e) => setSettleAmount(parseFloat(e.target.value) || 0)}
                                    required
                                    className="h-8 text-xs"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs">Catatan Kasir / Pembayaran:</Label>
                                <Textarea
                                    value={settleNotes}
                                    onChange={(e) => setSettleNotes(e.target.value)}
                                    placeholder="Contoh: Diterima tunai oleh kasir..."
                                    rows={2}
                                    className="text-xs"
                                />
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSettleModalOpen(false)}
                                    disabled={submittingSettle}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={submittingSettle}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {submittingSettle ? 'Menyimpan...' : 'Simpan Pelunasan'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
