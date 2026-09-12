import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
    CreditCard,
    AlertCircle,
    CheckCircle2,
    Clock,
    DollarSign,
    ShieldAlert,
    ShieldCheck,
    ExternalLink,
    Image as ImageIcon,
    Receipt,
} from 'lucide-react';
import { BreadcrumbItem } from '@/types';
import { ReportFilterBar } from '@/components/reports/report-filter-bar';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Laporan & Analitik',
        href: '/admin/reports/revenue',
    },
    {
        title: 'Status Pembayaran & DP',
        href: '/admin/reports/payments',
    },
];

interface PaymentsReportProps {
    pendingDpRentals: Array<{
        id: number;
        booking_code: string;
        invoice_number: string;
        customer_name: string;
        customer_phone: string;
        dp_amount: number;
        total_price: number;
        dp_proof_image?: string;
        created_at: string;
    }>;
    transactions: Array<{
        id: number;
        booking_code: string;
        invoice_number: string;
        customer_name: string;
        customer_phone: string;
        start_date: string;
        end_date: string;
        total_price: number;
        dp_amount: number;
        remaining_amount: number;
        total_deposit: number;
        deposit_refund_amount: number;
        payment_status: string;
        rental_status: string;
        deposit_status: string;
        dp_paid_at?: string;
        dp_verified_at?: string;
        cod_paid_at?: string;
        dp_proof_image?: string;
        created_at: string;
    }>;
    paymentMetrics: {
        pendingDpCount: number;
        pendingDpAmount: number;
        verifiedDpTotal: number;
        codPaidTotal: number;
        codOutstandingTotal: number;
        depositHeldTotal: number;
        depositRefundedTotal: number;
        depositForfeitedTotal: number;
        statusCounts: {
            pending_dp: number;
            dp_verified: number;
            paid_in_full: number;
            dp_rejected: number;
        };
    };
    filters: {
        start_date: string;
        end_date: string;
        payment_status?: string;
    };
}

export default function PaymentsReport({
    pendingDpRentals,
    transactions,
    paymentMetrics,
    filters,
}: PaymentsReportProps) {
    const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
    const [isProofLoading, setIsProofLoading] = useState<boolean>(true);
    const [txPage, setTxPage] = useState(1);
    const [txPerPage, setTxPerPage] = useState(5);

    const paginatedTransactions = useMemo(() => {
        const start = (txPage - 1) * txPerPage;
        return transactions.slice(start, start + txPerPage);
    }, [transactions, txPage, txPerPage]);

    const txLastPage = Math.max(1, Math.ceil(transactions.length / txPerPage));

    const txPaginationMeta = {
        current_page: txPage,
        last_page: txLastPage,
        per_page: txPerPage,
        total: transactions.length,
        from: transactions.length === 0 ? 0 : (txPage - 1) * txPerPage + 1,
        to: Math.min(txPage * txPerPage, transactions.length),
    };

    const handleOpenProof = (url: string | null | undefined) => {
        if (!url) {
            return;
        }
        setIsProofLoading(true);
        setSelectedProofUrl(url);
    };

    const getProofImageUrl = (path: string | null | undefined): string => {
        if (!path) {
            return '';
        }
        if (
            path.startsWith('http://') ||
            path.startsWith('https://') ||
            path.startsWith('data:')
        ) {
            return path;
        }
        if (path.startsWith('/storage/')) {
            return path;
        }
        if (path.startsWith('/')) {
            return path;
        }
        return `/storage/${path}`;
    };

    // Export CSV logic
    const handleExportCsv = () => {
        const headers = ['Kode Booking', 'No Invoice', 'Penyewa', 'Tanggal Dibuat', 'Total Biaya (Rp)', 'DP (Rp)', 'Sisa COD (Rp)', 'Deposit (Rp)', 'Status Pembayaran', 'Status Deposit'];
        const rows = transactions.map((t) => [
            t.booking_code,
            t.invoice_number,
            `"${t.customer_name}"`,
            t.created_at.split('T')[0],
            t.total_price,
            t.dp_amount,
            t.remaining_amount,
            t.total_deposit,
            t.payment_status,
            t.deposit_status,
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `laporan_pembayaran_dp_${filters.start_date}_sd_${filters.end_date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getPaymentBadge = (status: string) => {
        switch (status) {
            case 'pending_dp':
                return <Badge className="bg-amber-500 text-white hover:bg-amber-600 text-[10px]">Menunggu Verifikasi DP</Badge>;
            case 'dp_verified':
                return <Badge className="bg-blue-600 text-white hover:bg-blue-700 text-[10px]">DP Terverifikasi</Badge>;
            case 'paid_in_full':
                return <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-[10px]">Lunas (Selesai COD)</Badge>;
            case 'dp_rejected':
                return <Badge variant="destructive" className="text-[10px]">DP Ditolak</Badge>;
            default:
                return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
        }
    };

    const getDepositBadge = (status: string) => {
        switch (status) {
            case 'held':
                return <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600">Ditahan</Badge>;
            case 'refunded':
                return <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600">Dikembalikan</Badge>;
            case 'forfeited':
                return <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-600">Denda / Ganti Rugi</Badge>;
            default:
                return <span className="text-muted-foreground text-[10px]">-</span>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Status Pembayaran & DP - Admin" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Page Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Status Pembayaran & DP</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Monitoring verifikasi transfer uang muka (DP 30%), saldo piutang COD di toko, dan rekonsiliasi pengembalian deposit.
                        </p>
                    </div>
                </div>

                {/* Actionable Pending DP Callout Banner */}
                {pendingDpRentals.length > 0 && (
                    <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 shadow-none print:hidden">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-amber-600 animate-pulse" />
                                    <span>Perlu Tindakan: {pendingDpRentals.length} Bukti Transfer DP Menunggu Verifikasi</span>
                                </CardTitle>
                                <span className="text-xs font-semibold text-amber-800 dark:text-amber-400 font-variant-numeric tabular-nums">
                                    Total: {formatRupiah(paymentMetrics.pendingDpAmount)}
                                </span>
                            </div>
                            <CardDescription className="text-xs text-amber-800/80 dark:text-amber-400/80">
                                Harap segera periksa mutasi rekening dan konfirmasi pesanan agar pelanggan dapat mengambil alat di toko.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                                {pendingDpRentals.slice(0, 6).map((item) => (
                                    <div key={item.id} className="bg-background/90 p-2.5 rounded-md border border-amber-300/40 text-xs flex items-center justify-between gap-2">
                                        <div className="truncate">
                                            <div className="font-bold text-foreground flex items-center gap-1.5">
                                                <span>{item.booking_code}</span>
                                                <Badge variant="secondary" className="text-[9px] px-1 py-0">{item.customer_name}</Badge>
                                            </div>
                                            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                                                DP: {formatRupiah(item.dp_amount)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {item.dp_proof_image && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenProof(item.dp_proof_image)}
                                                    className="h-7 w-7 p-0"
                                                    title="Lihat Bukti Transfer"
                                                >
                                                    <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                                                </Button>
                                            )}
                                            <Link href={`/admin/rentals`}>
                                                <Button size="sm" className="h-7 text-[10px] px-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold">
                                                    Verifikasi
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Printable Header Title */}
                <div className="hidden print:block border-b border-border pb-4 space-y-1">
                    <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase">CampTrack &bull; Sistem Penyewaan Alat Camping</div>
                    <h1 className="text-xl font-bold">LAPORAN STATUS PEMBAYARAN, UANG MUKA (DP) & DEPOSIT</h1>
                    <p className="text-xs text-muted-foreground">
                        Periode: {formatDate(filters.start_date)} s/d {formatDate(filters.end_date)} &bull; Dicetak pada: {new Date().toLocaleString('id-ID')}
                    </p>
                </div>

                {/* Filter Bar */}
                <ReportFilterBar
                    routePath="/admin/reports/payments"
                    startDate={filters.start_date}
                    endDate={filters.end_date}
                    extraParams={{ payment_status: filters.payment_status }}
                    onExportCsv={handleExportCsv}
                >
                    <div className="space-y-1 flex-1 w-full">
                        <Label className="text-xs font-semibold">Status Pembayaran:</Label>
                        <Select
                            value={filters.payment_status || 'all'}
                            onValueChange={(val) => {
                                router.get(
                                    '/admin/reports/payments',
                                    {
                                        start_date: filters.start_date,
                                        end_date: filters.end_date,
                                        payment_status: val === 'all' ? undefined : val,
                                    },
                                    { preserveState: true }
                                );
                            }}
                        >
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="pending_dp">Menunggu Verifikasi DP</SelectItem>
                                <SelectItem value="dp_verified">DP Terverifikasi</SelectItem>
                                <SelectItem value="paid_in_full">Lunas (COD Selesai)</SelectItem>
                                <SelectItem value="dp_rejected">DP Ditolak</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </ReportFilterBar>

                {/* Financial Health Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                DP Masuk Terverifikasi
                            </CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-variant-numeric tabular-nums">
                                {formatRupiah(paymentMetrics.verifiedDpTotal)}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                {paymentMetrics.statusCounts.dp_verified + paymentMetrics.statusCounts.paid_in_full} transaksi terkonfirmasi
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Pelunasan COD Diterima
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-extrabold text-foreground font-variant-numeric tabular-nums">
                                {formatRupiah(paymentMetrics.codPaidTotal)}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Sisa Belum Diambil: {formatRupiah(paymentMetrics.codOutstandingTotal)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Deposit Ditahan / Aktif
                            </CardTitle>
                            <ShieldAlert className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-variant-numeric tabular-nums">
                                {formatRupiah(paymentMetrics.depositHeldTotal)}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Pengembalian: {formatRupiah(paymentMetrics.depositRefundedTotal)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Deposit Dipotong / Denda
                            </CardTitle>
                            <Receipt className="h-4 w-4 text-rose-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-extrabold text-foreground font-variant-numeric tabular-nums">
                                {formatRupiah(paymentMetrics.depositForfeitedTotal)}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Kompensasi kerusakan/terlambat
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Transactions Table */}
                <Card className="border-border shadow-none">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <CardTitle className="text-sm font-bold">Rincian Transaksi Pembayaran & Deposit</CardTitle>
                                <CardDescription className="text-xs">
                                    Daftar transaksi sewa lengkap dengan status pembayaran uang muka dan jaminan deposit.
                                </CardDescription>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Total: <strong>{transactions.length}</strong> transaksi ditemukan
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border text-muted-foreground">
                                        <th className="py-2.5 px-4 font-semibold whitespace-nowrap">Kode & Invoice</th>
                                        <th className="py-2.5 px-4 font-semibold whitespace-nowrap">Penyewa</th>
                                        <th className="py-2.5 px-4 font-semibold text-right whitespace-nowrap">Total Tagihan</th>
                                        <th className="py-2.5 px-4 font-semibold text-right whitespace-nowrap">DP (30%)</th>
                                        <th className="py-2.5 px-4 font-semibold text-right whitespace-nowrap">Sisa COD</th>
                                        <th className="py-2.5 px-4 font-semibold text-right whitespace-nowrap">Deposit Jaminan</th>
                                        <th className="py-2.5 px-4 font-semibold text-center whitespace-nowrap">Status Bayar</th>
                                        <th className="py-2.5 px-4 font-semibold text-center whitespace-nowrap">Status Deposit</th>
                                        <th className="py-2.5 px-4 font-semibold text-center whitespace-nowrap">Bukti DP</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="text-center py-8 text-muted-foreground whitespace-nowrap">
                                                Tidak ada transaksi pembayaran pada rentang filter ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedTransactions.map((trx) => (
                                            <tr key={trx.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    <div className="font-bold text-foreground">{trx.booking_code}</div>
                                                    <div className="text-[10px] text-muted-foreground">{trx.invoice_number}</div>
                                                </td>
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    <div className="font-semibold text-foreground">{trx.customer_name}</div>
                                                    <div className="text-[10px] text-muted-foreground">{trx.customer_phone}</div>
                                                </td>
                                                <td className="py-3 px-4 text-right font-bold text-foreground font-variant-numeric tabular-nums whitespace-nowrap">
                                                    {formatRupiah(trx.total_price)}
                                                </td>
                                                <td className="py-3 px-4 text-right font-variant-numeric tabular-nums text-emerald-600 font-semibold whitespace-nowrap">
                                                    {formatRupiah(trx.dp_amount)}
                                                </td>
                                                <td className="py-3 px-4 text-right font-variant-numeric tabular-nums text-muted-foreground whitespace-nowrap">
                                                    {formatRupiah(trx.remaining_amount)}
                                                </td>
                                                <td className="py-3 px-4 text-right font-variant-numeric tabular-nums text-amber-600 whitespace-nowrap">
                                                    {formatRupiah(trx.total_deposit)}
                                                </td>
                                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                                    {getPaymentBadge(trx.payment_status)}
                                                </td>
                                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                                    {getDepositBadge(trx.deposit_status)}
                                                </td>
                                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                                    {trx.dp_proof_image ? (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleOpenProof(trx.dp_proof_image)}
                                                            className="h-7 text-[11px] gap-1 text-blue-600"
                                                        >
                                                            <ImageIcon className="h-3 w-3" />
                                                            <span>Lihat</span>
                                                        </Button>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground">-</span>
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

                {/* Pagination for Transactions Table */}
                <DataTablePagination
                    pagination={txPaginationMeta}
                    onPageChange={(page) => setTxPage(page)}
                    onPerPageChange={(pp) => { setTxPerPage(pp); setTxPage(1); }}
                />

                {/* Modal View Bukti Transfer with Skeleton Loading State */}
                <Dialog
                    open={!!selectedProofUrl}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedProofUrl(null);
                        }
                    }}
                >
                    <DialogContent className="max-w-md p-4">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-bold">Bukti Transfer Pembayaran DP</DialogTitle>
                        </DialogHeader>
                        {selectedProofUrl && (
                            <div className="mt-2 flex flex-col items-center justify-center space-y-3">
                                <div className="relative min-h-64 max-h-[70vh] w-full overflow-hidden rounded-md border border-border bg-muted/20 flex items-center justify-center p-2">
                                    {isProofLoading && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                                            <Skeleton className="h-full w-full rounded-md" />
                                        </div>
                                    )}
                                    <img
                                        src={getProofImageUrl(selectedProofUrl)}
                                        alt="Bukti Transfer DP"
                                        className={cn(
                                            'max-h-[60vh] max-w-full rounded-md object-contain shadow-xs transition-opacity duration-300',
                                            isProofLoading ? 'opacity-0' : 'opacity-100',
                                        )}
                                        onLoad={() => setIsProofLoading(false)}
                                        onError={(e) => {
                                            setIsProofLoading(false);
                                            const target = e.currentTarget;
                                            target.onerror = null;
                                            target.src =
                                                'https://placehold.co/600x400/1e293b/ffffff?text=Bukti+Transfer+Tidak+Ditemukan';
                                        }}
                                    />
                                </div>
                                <div className="flex items-center justify-between w-full pt-1">
                                    <a
                                        href={getProofImageUrl(selectedProofUrl)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        <span>Buka Gambar Penuh</span>
                                    </a>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedProofUrl(null)}
                                        className="text-xs"
                                    >
                                        Tutup
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
