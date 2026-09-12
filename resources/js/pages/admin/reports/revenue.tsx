import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { formatRupiah, formatDate, formatDateTime } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowDownLeft, ArrowUpRight, Wallet, CreditCard, TrendingUp, TrendingDown,
    AlertCircle, Clock, ShieldAlert, Banknote,
    ChevronDown, ChevronUp, Layers, Info, CheckCircle2, Plus,
    FileText, ReceiptText, PieChart as PieIcon, Scale,
    Trash2, Edit, AlertTriangle, ArrowRightLeft, HelpCircle,
} from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { ReportFilterBar } from "@/components/reports/report-filter-bar";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, LineChart, Line, ReferenceLine, Cell, PieChart, Pie, Area, AreaChart
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseFormDialog, type ExpenseItem } from "@/components/reports/expense-form-dialog";
import { toast } from "sonner";

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Laporan & Analitik", href: "/admin/reports/revenue" },
    { title: "Laporan Keuangan", href: "/admin/reports/revenue" },
];

interface DailyRow {
    date: string;
    dp_count: number;
    cod_count: number;
    dp_inflow: number;
    cod_inflow: number;
    fine_inflow: number;
    forfeited_inflow: number;
    total_inflow: number;
    cash_in: number;
    refund_outflow: number;
    expense_outflow: number;
    total_outflow: number;
    net_cash: number;
    gross_revenue: number;
    net_profit: number;
}

interface MonthlyRow {
    month_number: number;
    month_name: string;
    dp_inflow: number;
    cod_inflow: number;
    fine_inflow: number;
    forfeited_inflow: number;
    total_inflow: number;
    cash_in: number;
    refund_outflow: number;
    expense_outflow: number;
    total_outflow: number;
    net_cash: number;
    gross_revenue: number;
    net_profit: number;
}

interface CashLogItem {
    id: string;
    datetime: string;
    date: string;
    type: "cash_in" | "cash_out";
    category: string;
    category_label: string;
    reference_code: string;
    invoice_number: string;
    description: string;
    party_name: string;
    amount: number;
    payment_method: string;
}

interface ExpenseCategories {
    pemeliharaan_alat: number;
    perlengkapan_alat: number;
    operasional_toko: number;
    gaji_karyawan: number;
    lain_lain: number;
}

interface SummaryTotals {
    totalDpInflow: number;
    totalCodInflow: number;
    totalFineInflow: number;
    totalForfeitedInflow: number;
    totalInflow: number;
    totalRefundOutflow: number;
    netCashFlow: number;
    codOutstandingAmount: number;
    codOutstandingCount: number;
    fineOutstandingAmount: number;
    fineOutstandingCount: number;
    depositHeldAmount: number;
    depositHeldCount: number;
    dpTransactionCount: number;
    codTransactionCount: number;

    // Rich financial metrics
    totalCashIn: number;
    totalPaidExpenses: number;
    totalUnpaidExpenses: number;
    totalExpenses: number;
    totalCashOut: number;
    grossRevenue: number;
    netProfit: number;
    profitMargin: number;
    expenseCategories: ExpenseCategories;
    totalReceivables: number;
    totalPayables: number;
    totalFineCharged: number;
    fineSettledFromDeposit: number;
    pureForfeitedInflow?: number;
    totalFineReceived?: number;
    cashLogsCount: number;
    expensesCount: number;
}

interface Props {
    dailyRevenue: DailyRow[];
    monthlyRevenue: MonthlyRow[];
    summaryTotals: SummaryTotals;
    cashLogs: CashLogItem[];
    expensesList: ExpenseItem[];
    filters: { start_date: string; end_date: string };
}

const monthlyChartConfig: ChartConfig = {
    cash_in: { label: "Kas Masuk (Cash-In)", color: "#10b981" },
    expense_outflow: { label: "Beban Operasional", color: "#f59e0b" },
    refund_outflow: { label: "Refund Jaminan", color: "#f43f5e" },
    net_profit: { label: "Laba Bersih", color: "#6366f1" },
};

const dailyChartConfig: ChartConfig = {
    cash_in: { label: "Kas Masuk", color: "#10b981" },
    total_outflow: { label: "Kas Keluar", color: "#f43f5e" },
    net_cash: { label: "Arus Kas Bersih", color: "#3b82f6" },
};

const EXPENSE_COLORS: Record<string, string> = {
    pemeliharaan_alat: "#3b82f6",
    perlengkapan_alat: "#10b981",
    operasional_toko: "#f59e0b",
    gaji_karyawan: "#8b5cf6",
    lain_lain: "#64748b",
};

const EXPENSE_LABELS: Record<string, string> = {
    pemeliharaan_alat: "Pemeliharaan & Laundry",
    perlengkapan_alat: "Perlengkapan & Sparepart",
    operasional_toko: "Operasional & Utilitas",
    gaji_karyawan: "Upah / Gaji Karyawan",
    lain_lain: "Biaya Lain-lain",
};

const fmt = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}jt`
        : v >= 1_000 ? `${(v / 1_000).toFixed(0)}rb` : String(v);

const ChartCustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-border/80 bg-card/95 backdrop-blur-sm shadow-xl p-3 text-xs min-w-[200px]">
            <p className="font-bold text-foreground border-b border-border/50 pb-1.5 mb-2">{label}</p>
            <div className="space-y-1.5">
                {payload.map((p: any) => (
                    <div key={p.dataKey} className="flex justify-between items-center gap-4">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
                            <span>{p.name}</span>
                        </span>
                        <span className="font-semibold tabular-nums text-foreground">
                            {formatRupiah(p.value)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function RevenueReport({
    dailyRevenue,
    monthlyRevenue,
    summaryTotals,
    cashLogs,
    expensesList,
    filters,
}: Props) {
    const [chartView, setChartView] = useState<"daily" | "monthly">("monthly");
    const [showAllDaily, setShowAllDaily] = useState(false);
    const [logFilter, setLogFilter] = useState<"all" | "cash_in" | "cash_out">("all");
    const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
    const [showAccountingGuide, setShowAccountingGuide] = useState(false);

    const chronoDaily = [...dailyRevenue].reverse().map((d) => ({
        ...d,
        shortDate: d.date.split("-").slice(1).join("/"),
    }));

    const displayedDaily = showAllDaily ? dailyRevenue : dailyRevenue.slice(0, 10);
    const year = new Date().getFullYear();

    const isProfitPos = summaryTotals.netProfit >= 0;
    const isCashFlowPos = summaryTotals.netCashFlow >= 0;

    // Filter cash logs
    const filteredCashLogs = cashLogs.filter((log) => {
        if (logFilter === "all") return true;
        return log.type === logFilter;
    });

    // Filter expenses list
    const filteredExpenses = expensesList.filter((e) => {
        if (expenseCategoryFilter === "all") return true;
        return e.category === expenseCategoryFilter;
    });

    // Pie data for expenses
    const expensePieData = Object.entries(summaryTotals.expenseCategories || {})
        .filter(([_, val]) => val > 0)
        .map(([key, value]) => ({
            name: EXPENSE_LABELS[key] || key,
            value,
            color: EXPENSE_COLORS[key] || "#64748b",
        }));

    const handleCreateExpense = () => {
        setEditingExpense(null);
        setDialogOpen(true);
    };

    const handleEditExpense = (expense: ExpenseItem) => {
        setEditingExpense(expense);
        setDialogOpen(true);
    };

    const handleDeleteExpense = (expense: ExpenseItem) => {
        if (confirm(`Hapus catatan pengeluaran "${expense.title}" (${formatRupiah(expense.amount)})?`)) {
            router.delete(`/admin/expenses/${expense.id}`, {
                preserveScroll: true,
                onSuccess: () => toast.success("Catatan pengeluaran berhasil dihapus."),
            });
        }
    };

    const handleExport = () => {
        const rows = [
            ["=== LAPORAN KEUANGAN SISTEM PENYEWAAN ALAT CAMPING ==="],
            [`Periode: ${filters.start_date} s/d ${filters.end_date}`],
            [""],
            ["1. RINGKASAN EKSEKUTIF KEUANGAN"],
            ["Komponen", "Nilai (IDR)"],
            ["Total Pendapatan Kotor (Gross Revenue)", summaryTotals.grossRevenue],
            ["Total Beban Operasional Usaha", summaryTotals.totalExpenses],
            ["Laba / (Rugi) Bersih Usaha (Net Profit)", summaryTotals.netProfit],
            ["Margin Laba Bersih (%)", `${summaryTotals.profitMargin}%`],
            ["Total Kas Masuk Riil (Cash-In)", summaryTotals.totalCashIn],
            ["Total Kas Keluar Riil (Cash-Out)", summaryTotals.totalCashOut],
            ["Arus Kas Bersih (Net Cash Flow)", summaryTotals.netCashFlow],
            ["Total Piutang Usaha Toko", summaryTotals.totalReceivables],
            ["Total Hutang & Deposit Titipan", summaryTotals.totalPayables],
            [""],
            ["2. REKAPITULASI HARIAN"],
            ["Tanggal", "DP Masuk", "Pelunasan COD", "Denda Tunai", "Total Kas Masuk", "Refund Jaminan", "Beban Operasional", "Total Kas Keluar", "Arus Kas Bersih", "Pendapatan Kotor", "Laba Bersih"],
            ...dailyRevenue.map((x) => [
                x.date,
                x.dp_inflow,
                x.cod_inflow,
                x.fine_inflow,
                x.cash_in,
                x.refund_outflow,
                x.expense_outflow,
                x.total_outflow,
                x.net_cash,
                x.gross_revenue,
                x.net_profit,
            ]),
            [""],
            ["3. LOG TRANSAKSI MUTASI KAS"],
            ["Waktu", "Tipe", "Kategori", "No Referensi", "Pihak Terkait", "Keterangan", "Metode", "Nominal (IDR)"],
            ...cashLogs.map((l) => [
                l.datetime,
                l.type === "cash_in" ? "KAS MASUK" : "KAS KELUAR",
                l.category_label,
                l.invoice_number || l.reference_code,
                l.party_name,
                l.description,
                l.payment_method,
                l.amount,
            ]),
        ];

        const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.map((val) => `"${val}"`).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `laporan_keuangan_lengkap_${filters.start_date}_sd_${filters.end_date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Keuangan Komprehensif - Admin" />
            <div className="flex flex-1 flex-col gap-6 p-6">

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Laporan Keuangan &amp; Arus Kas</h1>
                            <Badge variant="outline" className="text-[11px] font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                                Cash Flow &amp; P&amp;L
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Pemantauan arus kas fisik masuk/keluar (cash-in/out), laporan laba rugi rental, serta tata kelola jaminan deposit dan beban operasional toko.
                        </p>
                    </div>

                    {/* Header Action Buttons */}
                    <div className="flex items-center gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAccountingGuide(!showAccountingGuide)}
                            className="text-xs gap-1.5 h-9"
                        >
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{showAccountingGuide ? "Tutup Panduan" : "Panduan Konsep"}</span>
                        </Button>

                        <Button
                            type="button"
                            onClick={handleCreateExpense}
                            size="sm"
                            className="text-xs font-semibold gap-1.5 h-9 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Catat Beban Operasional</span>
                        </Button>
                    </div>
                </div>

                {/* Collapsible Accounting Concept Guide */}
                {showAccountingGuide && (
                    <div className="rounded-xl border border-border/70 bg-card bg-linear-to-t from-muted/50 to-card dark:from-muted/20 p-4 text-xs transition-all shadow-xs">
                        <div className="flex items-center justify-between pb-3 border-b border-border/50">
                            <div className="flex items-center gap-2 font-semibold text-foreground">
                                <Layers className="h-4 w-4 text-primary" />
                                <span>Panduan Standar Akuntansi &amp; Arus Kas Rental Alat Camping</span>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAccountingGuide(false)}
                                className="h-7 text-xs text-muted-foreground"
                            >
                                Tutup
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-3.5">
                            <div className="p-3 rounded-lg border border-border/60 bg-muted/20">
                                <span className="font-semibold text-foreground block text-[11px] uppercase tracking-wider mb-1">
                                    1. Uang Kas (Cash Flow)
                                </span>
                                <p className="text-muted-foreground text-[11px] leading-relaxed">
                                    Mengukur aliran uang tunai/rekening fisik yang riil diterima (Kas Masuk) dan dikeluarkan (Kas Keluar) di kasir toko.
                                </p>
                            </div>
                            <div className="p-3 rounded-lg border border-border/60 bg-muted/20">
                                <span className="font-semibold text-foreground block text-[11px] uppercase tracking-wider mb-1">
                                    2. Pendapatan Kotor (Gross Revenue)
                                </span>
                                <p className="text-muted-foreground text-[11px] leading-relaxed">
                                    Total omzet hak milik toko atas sewa alat pokok, denda keterlambatan, dan deposit jaminan yang disita sebagai ganti rugi.
                                </p>
                            </div>
                            <div className="p-3 rounded-lg border border-border/60 bg-muted/20">
                                <span className="font-semibold text-foreground block text-[11px] uppercase tracking-wider mb-1">
                                    3. Beban Operasional (OPEX)
                                </span>
                                <p className="text-muted-foreground text-[11px] leading-relaxed">
                                    Seluruh biaya untuk menjalankan rental, seperti laundry &amp; reparasi alat, pembelian cadangan, listrik/air/WiFi toko, dan upah karyawan.
                                </p>
                            </div>
                            <div className="p-3 rounded-lg border border-border/60 bg-muted/20">
                                <span className="font-semibold text-foreground block text-[11px] uppercase tracking-wider mb-1">
                                    4. Surplus Operasional (EBITDA)
                                </span>
                                <p className="text-muted-foreground text-[11px] leading-relaxed">
                                    Hasil usaha operasional berjalan (<em>Gross Revenue − Total Beban</em>). Belum memperhitungkan beban penyusutan (depresiasi) aset alat camping dan kewajiban pajak.
                                </p>
                            </div>
                            <div className="p-3 rounded-lg border border-border/60 bg-muted/20">
                                <span className="font-semibold text-foreground block text-[11px] uppercase tracking-wider mb-1">
                                    5. Deposit Jaminan Pelanggan
                                </span>
                                <p className="text-muted-foreground text-[11px] leading-relaxed">
                                    Dana titipan penyewa yang wajib dikembalikan penuh (refund) saat alat kembali utuh. <strong>Bukan</strong> pendapatan toko saat diterima.
                                </p>
                            </div>
                            <div className="p-3 rounded-lg border border-border/60 bg-muted/20">
                                <span className="font-semibold text-foreground block text-[11px] uppercase tracking-wider mb-1">
                                    6. Realisasi Denda &amp; Piutang
                                </span>
                                <p className="text-muted-foreground text-[11px] leading-relaxed">
                                    Denda dapat dipotong langsung dari deposit jaminan atau dibayar tunai. Denda yang belum dilunasi dicatat sebagai piutang toko.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Bar */}
                <ReportFilterBar
                    routePath="/admin/reports/revenue"
                    startDate={filters.start_date}
                    endDate={filters.end_date}
                    onExportCsv={handleExport}
                />

                {/* 6 Executive Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                    {/* Card 1: Pendapatan Kotor (Gross Revenue) */}
                    <div className="rounded-xl border border-border/70 bg-card bg-linear-to-t from-muted/50 to-card dark:from-muted/20 p-4 sm:p-5 shadow-xs transition-colors hover:border-border">
                        <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Pendapatan Kotor (Omzet)
                            </span>
                            {/* <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground">
                                +{summaryTotals.dpTransactionCount + summaryTotals.codTransactionCount} Transaksi
                            </span> */}
                        </div>
                        <div className="my-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                            {formatRupiah(summaryTotals.grossRevenue)}
                        </div>
                        <div className="space-y-0.5 pt-1">
                            <p className="text-xs font-semibold text-foreground">
                                Realisasi Hak Sewa &amp; Denda
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                Sewa pokok, denda masuk &amp; sitaan jaminan
                            </p>
                        </div>
                    </div>

                    {/* Card 2: Total Pengeluaran (Beban Usaha / OPEX) */}
                    <div className="rounded-xl border border-border/70 bg-card bg-linear-to-t from-muted/50 to-card dark:from-muted/20 p-4 sm:p-5 shadow-xs transition-colors hover:border-border">
                        <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Total Pengeluaran (Beban)
                            </span>
                            <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground">
                                {summaryTotals.expensesCount} Catatan Beban
                            </span>
                        </div>
                        <div className="my-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                            {formatRupiah(summaryTotals.totalExpenses)}
                        </div>
                        <div className="space-y-0.5 pt-1">
                            <p className="text-xs font-semibold text-foreground">
                                Beban Operasional (OPEX)
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                {summaryTotals.totalUnpaidExpenses > 0 ? `Hutang beban: ${formatRupiah(summaryTotals.totalUnpaidExpenses)}` : "Seluruh beban tercatat telah lunas"}
                            </p>
                        </div>
                    </div>

                    {/* Card 3: Surplus Operasional (EBITDA) */}
                    <div className="rounded-xl border border-border/70 bg-card bg-linear-to-t from-muted/50 to-card dark:from-muted/20 p-4 sm:p-5 shadow-xs transition-colors hover:border-border">
                        <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Surplus Operasional (EBITDA)
                            </span>
                            {/* <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground">
                                Margin: {summaryTotals.profitMargin}%
                            </span> */}
                        </div>
                        <div className={`my-2 text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${isProfitPos ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                            }`}>
                            {isProfitPos ? "+" : "−"}{formatRupiah(Math.abs(summaryTotals.netProfit))}
                        </div>
                        <div className="space-y-0.5 pt-1">
                            <p className={`text-xs font-semibold ${isProfitPos ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                {isProfitPos ? "Surplus Usaha" : "Defisit Usaha"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                *Sebelum beban penyusutan aset inventaris &amp; pajak
                            </p>
                        </div>
                    </div>

                    {/* Card 4: Deposit Jaminan Pelanggan */}
                    <div className="rounded-xl border border-border/70 bg-card bg-linear-to-t from-muted/50 to-card dark:from-muted/20 p-4 sm:p-5 shadow-xs transition-colors hover:border-border">
                        <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Deposit Jaminan (Titipan)
                            </span>
                            <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground">
                                {summaryTotals.depositHeldCount} Pesanan Aktif
                            </span>
                        </div>
                        <div className="my-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                            {formatRupiah(summaryTotals.depositHeldAmount)}
                        </div>
                        <div className="space-y-0.5 pt-1">
                            <p className="text-xs font-semibold text-foreground">
                                Liabilitas Titipan Aktif
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                Refund selesai: {formatRupiah(summaryTotals.totalRefundOutflow)}
                            </p>
                        </div>
                    </div>

                    {/* Card 5: Denda & Ganti Rugi */}
                    <div className="rounded-xl border border-border/70 bg-card bg-linear-to-t from-muted/50 to-card dark:from-muted/20 p-4 sm:p-5 shadow-xs transition-colors hover:border-border">
                        <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Denda &amp; Ganti Rugi
                            </span>
                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums ${summaryTotals.fineOutstandingAmount > 0 ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400" : "border-border/60 bg-muted/40 text-muted-foreground"
                                }`}>
                                {summaryTotals.fineOutstandingAmount > 0 ? "Ada Tunggakan" : "Lunas"}
                            </span>
                        </div>
                        <div className="my-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                            {formatRupiah(summaryTotals.totalFineCharged || summaryTotals.totalFineInflow)}
                        </div>
                        <div className="space-y-0.5 pt-1">
                            <p className="text-xs font-semibold text-foreground">
                                Masuk: {formatRupiah(summaryTotals.totalFineInflow + summaryTotals.fineSettledFromDeposit)}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                {summaryTotals.fineOutstandingAmount > 0 ? `Menunggak: ${formatRupiah(summaryTotals.fineOutstandingAmount)}` : "Tidak ada piutang denda tertunda"}
                            </p>
                        </div>
                    </div>

                    {/* Card 6: Arus Kas Bersih (Net Cash Flow) */}
                    <div className="rounded-xl border border-border/70 bg-card bg-linear-to-t from-muted/50 to-card dark:from-muted/20 p-4 sm:p-5 shadow-xs transition-colors hover:border-border">
                        <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Arus Kas Bersih (Cash Flow)
                            </span>
                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums ${isCashFlowPos ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                }`}>
                                {isCashFlowPos ? "Kas Positif" : "Kas Defisit"}
                            </span>
                        </div>
                        <div className={`my-2 text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${isCashFlowPos ? "text-foreground" : "text-rose-600 dark:text-rose-400"
                            }`}>
                            {isCashFlowPos ? "+" : "−"}{formatRupiah(Math.abs(summaryTotals.netCashFlow))}
                        </div>
                        <div className="space-y-0.5 pt-1">
                            <p className="text-xs font-semibold text-foreground">
                                In: {formatRupiah(summaryTotals.totalCashIn)} · Out: {formatRupiah(summaryTotals.totalCashOut)}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                Likuiditas uang kas fisik &amp; rekening toko
                            </p>
                        </div>
                    </div>

                </div>

                {/* Tabs Navigation */}
                <Tabs defaultValue="cash_flow" className="w-full space-y-6">
                    <TabsList className="bg-muted/40 p-1 rounded-xl border border-border/60 flex flex-wrap h-auto gap-1">
                        <TabsTrigger value="cash_flow" className="text-xs font-medium py-1.5 px-3 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                            Arus Kas
                        </TabsTrigger>
                        <TabsTrigger value="profit_loss" className="text-xs font-medium py-1.5 px-3 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                            Laba Rugi (P&amp;L)
                        </TabsTrigger>
                        <TabsTrigger value="cash_logs" className="text-xs font-medium py-1.5 px-3 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs gap-1.5">
                            <span>Log Mutasi Kas</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-muted/80 text-muted-foreground font-medium border border-border/40">
                                {cashLogs.length}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="deposit_fines" className="text-xs font-medium py-1.5 px-3 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                            Deposit &amp; Denda
                        </TabsTrigger>
                        <TabsTrigger value="expenses_ledger" className="text-xs font-medium py-1.5 px-3 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs gap-1.5">
                            <span>Buku Beban (OPEX)</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-muted/80 text-muted-foreground font-medium border border-border/40">
                                {expensesList.length}
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    {/* ========================================================================= */}
                    {/* TAB 1: ARUS KAS (CASH FLOW) */}
                    {/* ========================================================================= */}
                    <TabsContent value="cash_flow" className="space-y-6 m-0">

                        {/* Cash-In vs Cash-Out Comparison Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                            {/* Left: Cash Inflow */}
                            <Card className="border border-border/70 shadow-xs bg-card rounded-xl">
                                <CardHeader className="pb-3 border-b border-border/60">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                                Arus Kas Masuk (Cash-In)
                                            </CardTitle>
                                            <CardDescription className="text-[11px]">
                                                Uang riil yang disetor penyewa ke kasir / rekening toko
                                            </CardDescription>
                                        </div>
                                        <span className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                            {formatRupiah(summaryTotals.totalCashIn)}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-center justify-between text-xs py-2 border-b border-border/40">
                                        <div>
                                            <span className="font-medium text-foreground block">Penerimaan Uang Muka (DP 30%)</span>
                                            <span className="text-[11px] text-muted-foreground">Transfer bank terverifikasi</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold tabular-nums text-foreground">{formatRupiah(summaryTotals.totalDpInflow)}</span>
                                            <span className="block text-[10px] text-muted-foreground">{summaryTotals.dpTransactionCount} transaksi</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs py-2 border-b border-border/40">
                                        <div>
                                            <span className="font-medium text-foreground block">Pelunasan COD di Toko (70%)</span>
                                            <span className="text-[11px] text-muted-foreground">Pelunasan kasir saat ambil alat</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold tabular-nums text-foreground">{formatRupiah(summaryTotals.totalCodInflow)}</span>
                                            <span className="block text-[10px] text-muted-foreground">{summaryTotals.codTransactionCount} transaksi</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs py-2 border-b border-border/40">
                                        <div>
                                            <span className="font-medium text-foreground block">Denda Keterlambatan Dibayar Tunai</span>
                                            <span className="text-[11px] text-muted-foreground">Pelunasan denda tambahan kasir</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold tabular-nums text-foreground">{formatRupiah(summaryTotals.totalFineInflow)}</span>
                                            <span className="block text-[10px] text-muted-foreground">Kas masuk langsung</span>
                                        </div>
                                    </div>

                                    <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground border border-border/60">
                                        <span>Total uang kas toko bertambah sebesar <strong className="text-foreground font-semibold">{formatRupiah(summaryTotals.totalCashIn)}</strong> pada periode ini.</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Right: Cash Outflow */}
                            <Card className="border border-border/70 shadow-xs bg-card rounded-xl">
                                <CardHeader className="pb-3 border-b border-border/60">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                                                Arus Kas Keluar (Cash-Out)
                                            </CardTitle>
                                            <CardDescription className="text-[11px]">
                                                Uang riil yang dibayarkan / di-refund dari kas toko
                                            </CardDescription>
                                        </div>
                                        <span className="text-lg font-bold tabular-nums text-rose-600 dark:text-rose-400">
                                            {formatRupiah(summaryTotals.totalCashOut)}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-center justify-between text-xs py-2 border-b border-border/40">
                                        <div>
                                            <span className="font-medium text-foreground block">Pengembalian Deposit Jaminan (Refund)</span>
                                            <span className="text-[11px] text-muted-foreground">Uang jaminan dikembalikan ke penyewa</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold tabular-nums text-rose-600 dark:text-rose-400">{formatRupiah(summaryTotals.totalRefundOutflow)}</span>
                                            <span className="block text-[10px] text-muted-foreground">Pengembalian kasir</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs py-2 border-b border-border/40">
                                        <div>
                                            <span className="font-medium text-foreground block">Beban Operasional Toko Lunas (OPEX)</span>
                                            <span className="text-[11px] text-muted-foreground">Laundry, sparepart, toko &amp; upah</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold tabular-nums text-foreground">{formatRupiah(summaryTotals.totalPaidExpenses)}</span>
                                            <span className="block text-[10px] text-muted-foreground">Kas keluar lunas</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs py-2 border-b border-border/40 opacity-70">
                                        <div>
                                            <span className="font-medium text-muted-foreground block">Beban Belum Dibayar (Hutang Biaya)</span>
                                            <span className="text-[11px]">Belum memotong kas tunai saat ini</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-medium tabular-nums text-muted-foreground">{formatRupiah(summaryTotals.totalUnpaidExpenses)}</span>
                                            <span className="block text-[10px] text-muted-foreground">Belum kas keluar</span>
                                        </div>
                                    </div>

                                    <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground border border-border/60">
                                        <span>Total kas fisik yang keluar sebesar <strong className="text-foreground font-semibold">{formatRupiah(summaryTotals.totalCashOut)}</strong> pada periode ini.</span>
                                    </div>
                                </CardContent>
                            </Card>

                        </div>

                        {/* Chart Visualization */}
                        <Card className="border border-border/70 shadow-xs bg-card rounded-xl">
                            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60">
                                <div>
                                    <CardTitle className="text-sm font-bold text-foreground">
                                        Visualisasi Tren Finansial
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        {chartView === "monthly"
                                            ? `Perbandingan kas masuk vs beban operasional & refund bulanan tahun ${year}`
                                            : "Pergerakan arus kas masuk vs kas keluar harian pada rentang tanggal aktif"}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/60">
                                    <button
                                        type="button"
                                        onClick={() => setChartView("monthly")}
                                        className={`text-xs px-3 py-1 font-medium rounded-md transition-all ${chartView === "monthly" ? "bg-background shadow-xs text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        Bulanan ({year})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setChartView("daily")}
                                        className={`text-xs px-3 py-1 font-medium rounded-md transition-all ${chartView === "daily" ? "bg-background shadow-xs text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        Harian (Periode)
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-6">
                                {chartView === "monthly" ? (
                                    <ChartContainer config={monthlyChartConfig} className="h-72 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: -15, bottom: 0 }} barGap={4}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="stroke-border/40" />
                                                <XAxis dataKey="month_name" tick={{ fontSize: 11 }} />
                                                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} />
                                                <Tooltip content={<ChartCustomTooltip />} />
                                                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                                                <Bar dataKey="cash_in" name="Total Kas Masuk" fill="#10b981" maxBarSize={28} radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="expense_outflow" name="Beban Operasional" fill="#f59e0b" maxBarSize={28} radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="refund_outflow" name="Refund Jaminan" fill="#f43f5e" maxBarSize={28} radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                ) : chronoDaily.length === 0 ? (
                                    <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
                                        Belum ada aktivitas transaksi pada rentang tanggal ini.
                                    </div>
                                ) : (
                                    <ChartContainer config={dailyChartConfig} className="h-72 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chronoDaily} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="stroke-border/40" />
                                                <XAxis dataKey="shortDate" tick={{ fontSize: 10 }} />
                                                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} />
                                                <Tooltip content={<ChartCustomTooltip />} />
                                                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                                                <ReferenceLine y={0} stroke="currentColor" className="stroke-border" />
                                                <Line type="monotone" dataKey="cash_in" name="Kas Masuk" stroke="#10b981" strokeWidth={2} dot={false} />
                                                <Line type="monotone" dataKey="total_outflow" name="Kas Keluar" stroke="#f43f5e" strokeWidth={2} dot={false} />
                                                <Line type="monotone" dataKey="net_cash" name="Arus Kas Bersih" stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="4 4" dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* Daily Cash Flow Table */}
                        <Card className="border border-border/80 shadow-xs bg-card">
                            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60">
                                <div>
                                    <CardTitle className="text-sm font-bold text-foreground">Rekapitulasi Arus Kas Harian</CardTitle>
                                    <CardDescription className="text-xs">
                                        Rincian pergerakan kas masuk dan kas keluar berdasarkan tanggal aktual toko.
                                    </CardDescription>
                                </div>
                                {dailyRevenue.length > 0 && (
                                    <Badge variant="secondary" className="text-[10px] font-semibold self-start">
                                        {dailyRevenue.length} Hari Aktivitas
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent className="p-0">
                                {dailyRevenue.length === 0 ? (
                                    <div className="p-12 text-center text-xs text-muted-foreground">
                                        Tidak ada catatan transaksi keuangan pada periode terpilih.
                                    </div>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs whitespace-nowrap">
                                                <thead>
                                                    <tr className="border-b border-border/70 bg-muted/40">
                                                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Tanggal</th>
                                                        <th className="px-3 py-3 text-right font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">DP Masuk</th>
                                                        <th className="px-3 py-3 text-right font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Pelunasan COD</th>
                                                        <th className="px-3 py-3 text-right font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Denda Tunai</th>
                                                        <th className="px-3 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 uppercase text-[10px] tracking-wider">Total Kas Masuk</th>
                                                        <th className="px-3 py-3 text-right font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Refund Jaminan</th>
                                                        <th className="px-3 py-3 text-right font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Beban Ops</th>
                                                        <th className="px-3 py-3 text-right font-bold text-rose-600 dark:text-rose-400 uppercase text-[10px] tracking-wider">Total Kas Keluar</th>
                                                        <th className="px-4 py-3 text-right font-bold text-foreground uppercase text-[10px] tracking-wider">Arus Kas Bersih</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/60">
                                                    {displayedDaily.map((row) => {
                                                        const isRowPos = row.net_cash > 0;
                                                        const isRowNeg = row.net_cash < 0;

                                                        return (
                                                            <tr key={row.date} className="hover:bg-muted/30 transition-colors">
                                                                <td className="px-4 py-2.5 font-mono font-medium text-foreground">
                                                                    {row.date}
                                                                    {(row.dp_count > 0 || row.cod_count > 0) && (
                                                                        <span className="ml-1.5 text-[10px] text-muted-foreground">
                                                                            ({[row.dp_count > 0 ? `${row.dp_count} DP` : "", row.cod_count > 0 ? `${row.cod_count} COD` : ""].filter(Boolean).join(", ")})
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
                                                                    {row.dp_inflow > 0 ? formatRupiah(row.dp_inflow) : <span className="text-muted-foreground/30 font-mono">—</span>}
                                                                </td>
                                                                <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
                                                                    {row.cod_inflow > 0 ? formatRupiah(row.cod_inflow) : <span className="text-muted-foreground/30 font-mono">—</span>}
                                                                </td>
                                                                <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
                                                                    {row.fine_inflow > 0 ? formatRupiah(row.fine_inflow) : <span className="text-muted-foreground/30 font-mono">—</span>}
                                                                </td>
                                                                <td className="px-3 py-2.5 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                                                                    {row.cash_in > 0 ? formatRupiah(row.cash_in) : <span className="text-muted-foreground/40 font-mono">Rp 0</span>}
                                                                </td>
                                                                <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
                                                                    {row.refund_outflow > 0 ? formatRupiah(row.refund_outflow) : <span className="text-muted-foreground/30 font-mono">—</span>}
                                                                </td>
                                                                <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
                                                                    {row.expense_outflow > 0 ? formatRupiah(row.expense_outflow) : <span className="text-muted-foreground/30 font-mono">—</span>}
                                                                </td>
                                                                <td className="px-3 py-2.5 text-right tabular-nums font-bold text-rose-600 dark:text-rose-400">
                                                                    {row.total_outflow > 0 ? formatRupiah(row.total_outflow) : <span className="text-muted-foreground/40 font-mono">Rp 0</span>}
                                                                </td>
                                                                <td className="px-4 py-2.5 text-right tabular-nums font-bold">
                                                                    {isRowPos ? (
                                                                        <span className="text-emerald-600 dark:text-emerald-400">
                                                                            + {formatRupiah(row.net_cash)}
                                                                        </span>
                                                                    ) : isRowNeg ? (
                                                                        <span className="text-rose-600 dark:text-rose-400">
                                                                            − {formatRupiah(Math.abs(row.net_cash))}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-muted-foreground font-mono">Rp 0</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="border-t-2 border-border/80 bg-muted/40 font-semibold">
                                                        <td className="px-4 py-3 font-bold text-foreground uppercase text-[11px] tracking-wide">Total Periode</td>
                                                        <td className="px-3 py-3 text-right tabular-nums text-foreground">{formatRupiah(summaryTotals.totalDpInflow)}</td>
                                                        <td className="px-3 py-3 text-right tabular-nums text-foreground">{formatRupiah(summaryTotals.totalCodInflow)}</td>
                                                        <td className="px-3 py-3 text-right tabular-nums text-foreground">{formatRupiah(summaryTotals.totalFineInflow)}</td>
                                                        <td className="px-3 py-3 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(summaryTotals.totalCashIn)}</td>
                                                        <td className="px-3 py-3 text-right tabular-nums text-foreground">{formatRupiah(summaryTotals.totalRefundOutflow)}</td>
                                                        <td className="px-3 py-3 text-right tabular-nums text-foreground">{formatRupiah(summaryTotals.totalPaidExpenses)}</td>
                                                        <td className="px-3 py-3 text-right tabular-nums font-bold text-rose-600 dark:text-rose-400">{formatRupiah(summaryTotals.totalCashOut)}</td>
                                                        <td className={`px-4 py-3 text-right tabular-nums font-extrabold text-sm ${isCashFlowPos ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                                            }`}>
                                                            {summaryTotals.netCashFlow > 0 ? `+ ${formatRupiah(summaryTotals.netCashFlow)}` : summaryTotals.netCashFlow < 0 ? `− ${formatRupiah(Math.abs(summaryTotals.netCashFlow))}` : "Rp 0"}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                        {dailyRevenue.length > 10 && (
                                            <div className="flex justify-center p-3 border-t border-border/60">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setShowAllDaily(!showAllDaily)}
                                                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium"
                                                >
                                                    {showAllDaily ? (
                                                        <><ChevronUp className="h-3.5 w-3.5" /> Tampilkan lebih sedikit</>
                                                    ) : (
                                                        <><ChevronDown className="h-3.5 w-3.5" /> Tampilkan seluruh {dailyRevenue.length} hari</>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>

                    </TabsContent>

                    {/* ========================================================================= */}
                    {/* TAB 2: LAPORAN LABA RUGI (PROFIT & LOSS STATEMENT) */}
                    {/* ========================================================================= */}
                    <TabsContent value="profit_loss" className="space-y-6 m-0">

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* P&L Financial Ledger (2 Columns) */}
                            <div className="lg:col-span-2 space-y-4">
                                <Card className="border border-border/80 shadow-xs bg-card">
                                    <CardHeader className="border-b border-border/60 pb-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-sm font-bold text-foreground">
                                                    Laporan Laba Rugi Operasional (P&amp;L Statement)
                                                </CardTitle>
                                                <CardDescription className="text-xs">
                                                    Standar laporan kinerja keuangan sewa periode {formatDate(filters.start_date)} s/d {formatDate(filters.end_date)}
                                                </CardDescription>
                                            </div>
                                            <Badge variant="outline" className={`font-semibold ${isProfitPos
                                                ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                                                : "border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10"
                                                }`}>
                                                {isProfitPos ? "Surplus Usaha" : "Defisit Usaha"}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 sm:p-6 space-y-6 text-xs">

                                        {/* Section A: Revenue */}
                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between pb-1.5 border-b border-border font-bold text-foreground">
                                                <span className="uppercase text-[11px] tracking-wider text-muted-foreground">
                                                    I. Pendapatan Operasional (Gross Revenue)
                                                </span>
                                                <span className="text-[11px] text-muted-foreground uppercase">Subtotal</span>
                                            </div>

                                            <div className="flex items-center justify-between py-1.5 text-muted-foreground pl-2 border-b border-border/20">
                                                <div>
                                                    <span className="text-foreground font-medium block">1. Pendapatan Pokok Sewa Alat Camping</span>
                                                    <span className="text-[11px] text-muted-foreground">Uang Muka (DP) + Pelunasan Sewa di Toko (COD)</span>
                                                </div>
                                                <span className="font-semibold tabular-nums text-foreground">{formatRupiah(summaryTotals.totalDpInflow + summaryTotals.totalCodInflow)}</span>
                                            </div>

                                            <div className="flex items-center justify-between py-1.5 text-muted-foreground pl-2 border-b border-border/20">
                                                <div>
                                                    <span className="text-foreground font-medium block">2. Pendapatan Denda &amp; Ganti Rugi Alat</span>
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {summaryTotals.fineSettledFromDeposit > 0
                                                            ? `Dipungut dari jaminan: ${formatRupiah(summaryTotals.fineSettledFromDeposit)} + Tunai kasir: ${formatRupiah(summaryTotals.totalFineInflow)}`
                                                            : summaryTotals.totalFineInflow > 0
                                                                ? `Diterima tunai kasir: ${formatRupiah(summaryTotals.totalFineInflow)}`
                                                                : "Denda keterlambatan / kerusakan"}
                                                    </span>
                                                </div>
                                                <span className="font-semibold tabular-nums text-foreground">
                                                    {formatRupiah((summaryTotals.totalFineInflow || 0) + (summaryTotals.fineSettledFromDeposit || 0))}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between py-1.5 text-muted-foreground pl-2">
                                                <div>
                                                    <span className="text-foreground font-medium block">3. Deposit Sitaan Lainnya (Non-Denda)</span>
                                                    <span className="text-[11px] text-muted-foreground">Deposit hangus tanpa denda formal (misal penyewa kabur)</span>
                                                </div>
                                                <span className="font-semibold tabular-nums text-foreground">
                                                    {formatRupiah(summaryTotals.pureForfeitedInflow || 0)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between pt-2.5 pb-1 border-t border-border/60 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-2.5 py-1.5 rounded-lg">
                                                <span>TOTAL PENDAPATAN KOTOR (GROSS REVENUE)</span>
                                                <span className="text-sm tabular-nums">{formatRupiah(summaryTotals.grossRevenue)}</span>
                                            </div>
                                        </div>

                                        {/* Section B: Operating Expenses */}
                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between pb-1.5 border-b border-border font-bold text-foreground">
                                                <span className="uppercase text-[11px] tracking-wider text-muted-foreground">
                                                    II. Beban Pengeluaran Operasional (Operating Expenses)
                                                </span>
                                                <span className="text-[11px] text-muted-foreground uppercase">Subtotal</span>
                                            </div>

                                            <div className="flex items-center justify-between py-1 text-muted-foreground pl-2">
                                                <span>1. Beban Pemeliharaan, Reparasi &amp; Laundry Tenda/Alat</span>
                                                <span className="font-semibold tabular-nums text-foreground">{formatRupiah(summaryTotals.expenseCategories?.pemeliharaan_alat || 0)}</span>
                                            </div>

                                            <div className="flex items-center justify-between py-1 text-muted-foreground pl-2">
                                                <span>2. Beban Perlengkapan &amp; Suku Cadang (Pasak, Tali, Gas)</span>
                                                <span className="font-semibold tabular-nums text-foreground">{formatRupiah(summaryTotals.expenseCategories?.perlengkapan_alat || 0)}</span>
                                            </div>

                                            <div className="flex items-center justify-between py-1 text-muted-foreground pl-2">
                                                <span>3. Beban Operasional &amp; Utilitas Toko (Listrik, Air, Internet)</span>
                                                <span className="font-semibold tabular-nums text-foreground">{formatRupiah(summaryTotals.expenseCategories?.operasional_toko || 0)}</span>
                                            </div>

                                            <div className="flex items-center justify-between py-1 text-muted-foreground pl-2">
                                                <span>4. Beban Upah / Gaji Karyawan &amp; Lembur</span>
                                                <span className="font-semibold tabular-nums text-foreground">{formatRupiah(summaryTotals.expenseCategories?.gaji_karyawan || 0)}</span>
                                            </div>

                                            <div className="flex items-center justify-between py-1 text-muted-foreground pl-2">
                                                <span>5. Beban Operasional Lainnya &amp; Logistik</span>
                                                <span className="font-semibold tabular-nums text-foreground">{formatRupiah(summaryTotals.expenseCategories?.lain_lain || 0)}</span>
                                            </div>

                                            <div className="flex items-center justify-between pt-2.5 pb-1 border-t border-border/60 font-bold text-rose-600 dark:text-rose-400 bg-rose-500/5 px-2.5 py-1.5 rounded-lg">
                                                <span>TOTAL BEBAN USAHA (TOTAL OPERATING EXPENSES)</span>
                                                <span className="text-sm tabular-nums">− {formatRupiah(summaryTotals.totalExpenses)}</span>
                                            </div>
                                        </div>

                                        {/* Section C: EBITDA Result */}
                                        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${isProfitPos
                                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-950 dark:text-emerald-100"
                                            : "bg-rose-500/5 border-rose-500/20 text-rose-950 dark:text-rose-100"
                                            }`}>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                        III. Surplus / (Defisit) Operasional (EBITDA)
                                                    </span>
                                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md border border-border/60 bg-background text-muted-foreground">
                                                        Sebelum Penyusutan
                                                    </span>
                                                </div>
                                                <span className="text-xs text-muted-foreground mt-0.5 block">
                                                    Hasil operasional bersih sebelum memperhitungkan depresiasi unit aset rental &amp; beban pajak.
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${isProfitPos ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                                    }`}>
                                                    {isProfitPos ? "+ " : "− "}{formatRupiah(Math.abs(summaryTotals.netProfit))}
                                                </div>
                                                <span className="text-xs font-semibold text-muted-foreground mt-0.5 block">
                                                    Operating Margin: {summaryTotals.profitMargin}%
                                                </span>
                                            </div>
                                        </div>

                                    </CardContent>
                                </Card>
                            </div>

                            {/* Expense Distribution Donut Chart */}
                            <div className="space-y-4">
                                <Card className="border border-border/70 shadow-xs bg-card rounded-xl">
                                    <CardHeader className="pb-2 border-b border-border/60">
                                        <CardTitle className="text-xs font-bold text-foreground">
                                            Komposisi Beban Pengeluaran
                                        </CardTitle>
                                        <CardDescription className="text-[11px]">
                                            Distribusi alokasi anggaran operasional
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        {expensePieData.length === 0 ? (
                                            <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
                                                Belum ada beban tercatat pada periode ini.
                                            </div>
                                        ) : (
                                            <>
                                                <div className="h-48 w-full flex items-center justify-center">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={expensePieData}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={45}
                                                                outerRadius={75}
                                                                paddingAngle={3}
                                                                dataKey="value"
                                                            >
                                                                {expensePieData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip formatter={(val: any) => formatRupiah(val)} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>

                                                <div className="space-y-2 mt-3 pt-3 border-t border-border/60 text-xs">
                                                    {expensePieData.map((item) => (
                                                        <div key={item.name} className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                                                                <span className="text-muted-foreground">{item.name}</span>
                                                            </div>
                                                            <span className="font-semibold tabular-nums text-foreground">{formatRupiah(item.value)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                        </div>

                    </TabsContent>

                    {/* ========================================================================= */}
                    {/* TAB 3: LOG MUTASI KAS (CASH FLOW TRANSACTION LOGS) */}
                    {/* ========================================================================= */}
                    <TabsContent value="cash_logs" className="space-y-4 m-0">

                        <Card className="border border-border/70 shadow-xs bg-card rounded-xl">
                            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60">
                                <div>
                                    <CardTitle className="text-sm font-bold text-foreground">
                                        Buku Kas &amp; Log Mutasi Keuangan
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Catatan kronologis setiap uang masuk (DP, COD, denda) dan uang keluar (refund jaminan, pembayaran beban).
                                    </CardDescription>
                                </div>

                                {/* Filter Mutation Type */}
                                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/60 self-start sm:self-auto">
                                    <button
                                        type="button"
                                        onClick={() => setLogFilter("all")}
                                        className={`text-xs px-2.5 py-1 font-medium rounded-md transition-all ${logFilter === "all" ? "bg-background shadow-xs text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        Semua ({cashLogs.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLogFilter("cash_in")}
                                        className={`text-xs px-2.5 py-1 font-medium rounded-md transition-all ${logFilter === "cash_in" ? "bg-background shadow-xs text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        Kas Masuk (+)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLogFilter("cash_out")}
                                        className={`text-xs px-2.5 py-1 font-medium rounded-md transition-all ${logFilter === "cash_out" ? "bg-background shadow-xs text-rose-600 dark:text-rose-400 font-semibold" : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        Kas Keluar (−)
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {filteredCashLogs.length === 0 ? (
                                    <div className="p-12 text-center text-xs text-muted-foreground">
                                        Tidak ada catatan transaksi kas pada kategori ini.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs whitespace-nowrap">
                                            <thead>
                                                <tr className="border-b border-border/70 bg-muted/40">
                                                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Waktu</th>
                                                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Jenis Kas</th>
                                                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Kategori Alur</th>
                                                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">No. Referensi</th>
                                                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Pihak Terkait</th>
                                                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Keterangan</th>
                                                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Metode</th>
                                                    <th className="px-4 py-3 text-right font-semibold text-foreground uppercase text-[10px] tracking-wider">Nominal (Rp)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/60">
                                                {filteredCashLogs.map((log) => {
                                                    const isIn = log.type === "cash_in";
                                                    return (
                                                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                                            <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                                                                {log.datetime ? formatDateTime(log.datetime) : log.date}
                                                            </td>
                                                            <td className="px-3 py-2.5">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`text-[10px] font-semibold px-2 py-0.5 gap-1 ${isIn
                                                                        ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                                                                        : "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10"
                                                                        }`}
                                                                >
                                                                    {isIn ? (
                                                                        <><ArrowDownLeft className="h-3 w-3" /> Kas Masuk</>
                                                                    ) : (
                                                                        <><ArrowUpRight className="h-3 w-3" /> Kas Keluar</>
                                                                    )}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-3 py-2.5 font-medium text-foreground">
                                                                {log.category_label}
                                                            </td>
                                                            <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
                                                                {log.invoice_number || log.reference_code || "-"}
                                                            </td>
                                                            <td className="px-3 py-2.5 font-medium text-foreground">
                                                                {log.party_name}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-muted-foreground max-w-xs truncate">
                                                                {log.description}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-muted-foreground">
                                                                {log.payment_method}
                                                            </td>
                                                            <td className={`px-4 py-2.5 text-right tabular-nums font-bold text-xs ${isIn ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                                                }`}>
                                                                {isIn ? "+" : "−"}{formatRupiah(log.amount)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    </TabsContent>

                    {/* ========================================================================= */}
                    {/* TAB 4: DEPOSIT, DENDA & NERACA */}
                    {/* ========================================================================= */}
                    <TabsContent value="deposit_fines" className="space-y-6 m-0">

                        {/* Deposit & Fine Governance */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                            {/* Section 1: Customer Deposit Governance */}
                            <Card className="border border-border/70 shadow-xs bg-card rounded-xl">
                                <CardHeader className="pb-3 border-b border-border/60">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                                        Pengelolaan Deposit Jaminan Pelanggan
                                    </CardTitle>
                                    <CardDescription className="text-[11px]">
                                        Deposit adalah dana titipan penyewa (liabilitas toko) kecuali disita sebagai ganti rugi kerusakan.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3 text-xs">
                                    <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                                        <span className="font-medium text-foreground">Deposit Dikembalikan Utuh (Refund)</span>
                                        <span className="font-bold tabular-nums text-rose-600 dark:text-rose-400">{formatRupiah(summaryTotals.totalRefundOutflow)}</span>
                                    </div>

                                    <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                                        <span className="font-medium text-foreground">Deposit Dipotong untuk Bayar Denda</span>
                                        <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">{formatRupiah(summaryTotals.fineSettledFromDeposit)}</span>
                                    </div>

                                    <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                                        <span className="font-medium text-foreground">Deposit Disita Lainnya (Non-Denda)</span>
                                        <span className="font-bold tabular-nums text-foreground">{formatRupiah(summaryTotals.pureForfeitedInflow || 0)}</span>
                                    </div>

                                    <div className="flex items-center justify-between py-2 pt-2.5 border-t border-border font-bold">
                                        <span className="text-foreground">Deposit Aktif Sedang Dipegang Toko</span>
                                        <span className="font-bold tabular-nums text-foreground">{formatRupiah(summaryTotals.depositHeldAmount)}</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        {summaryTotals.depositHeldCount} pesanan aktif sedang memegang deposit jaminan. Uang ini merupakan kewajiban jangka pendek yang wajib di-refund jika unit inventaris kembali aman.
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Section 2: Realization of Fines */}
                            <Card className="border border-border/70 shadow-xs bg-card rounded-xl">
                                <CardHeader className="pb-3 border-b border-border/60">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                                        Realisasi Denda &amp; Kerusakan Alat
                                    </CardTitle>
                                    <CardDescription className="text-[11px]">
                                        Rekapitulasi sanksi keterlambatan pengembalian atau penggantian unit inventaris.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3 text-xs">
                                    <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                                        <span className="font-medium text-foreground">Total Nilai Denda Dikenakan</span>
                                        <span className="font-bold tabular-nums text-foreground">{formatRupiah(summaryTotals.totalFineCharged || summaryTotals.totalFineInflow)}</span>
                                    </div>

                                    <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                                        <span className="font-medium text-foreground">Denda Diserap dari Potongan Deposit</span>
                                        <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatRupiah(summaryTotals.fineSettledFromDeposit)}</span>
                                    </div>

                                    <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                                        <span className="font-medium text-foreground">Denda Tambahan Dibayar Tunai di Kasir</span>
                                        <span className="font-bold tabular-nums text-foreground">{formatRupiah(summaryTotals.totalFineInflow)}</span>
                                    </div>

                                    <div className="flex items-center justify-between py-2 pt-2.5 border-t border-border font-bold">
                                        <span className="text-foreground">Piutang Denda Menunggak / Belum Lunas</span>
                                        <span className="font-bold tabular-nums text-rose-600 dark:text-rose-400">{formatRupiah(summaryTotals.fineOutstandingAmount)}</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        {summaryTotals.fineOutstandingCount} kasus denda belum terselesaikan oleh pelanggan.
                                    </p>
                                </CardContent>
                            </Card>

                        </div>

                        {/* Receivables & Payables Position */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Left: Receivables */}
                            <Card className="border border-border/70 shadow-xs bg-card rounded-xl">
                                <CardHeader className="pb-3 border-b border-border/60">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                                            Piutang Usaha (Hak Belum Diterima)
                                        </CardTitle>
                                        <span className="font-bold tabular-nums text-sm text-orange-600 dark:text-orange-400">
                                            {formatRupiah(summaryTotals.totalReceivables)}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 space-y-2 text-xs">
                                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                                        <span>Pelunasan COD Tertunda (Belum serah terima)</span>
                                        <span className="font-semibold tabular-nums text-foreground">{formatRupiah(summaryTotals.codOutstandingAmount)}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                                        <span>Piutang Denda Belum Terbayar</span>
                                        <span className="font-semibold tabular-nums text-foreground">{formatRupiah(summaryTotals.fineOutstandingAmount)}</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground pt-1">
                                        Total uang yang menjadi hak toko namun masih tertahan di pelanggan.
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Right: Payables & Liabilities */}
                            <Card className="border border-border/70 shadow-xs bg-card rounded-xl">
                                <CardHeader className="pb-3 border-b border-border/60">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                                            Hutang &amp; Liabilitas (Kewajiban Toko)
                                        </CardTitle>
                                        <span className="font-bold tabular-nums text-sm text-rose-600 dark:text-rose-400">
                                            {formatRupiah(summaryTotals.totalPayables)}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 space-y-2 text-xs">
                                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                                        <span>Titipan Deposit Pelanggan (Pesanan Aktif)</span>
                                        <span className="font-semibold tabular-nums text-foreground">{formatRupiah(summaryTotals.depositHeldAmount)}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                                        <span>Hutang Beban Operasional Belum Lunas</span>
                                        <span className="font-semibold tabular-nums text-foreground">{formatRupiah(summaryTotals.totalUnpaidExpenses)}</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground pt-1">
                                        Kewajiban kas toko yang wajib dibayarkan / di-refund pada masa mendatang.
                                    </p>
                                </CardContent>
                            </Card>

                        </div>

                    </TabsContent>

                    {/* ========================================================================= */}
                    {/* TAB 5: BUKU BEBAN OPERASIONAL (EXPENSES LEDGER) */}
                    {/* ========================================================================= */}
                    <TabsContent value="expenses_ledger" className="space-y-4 m-0">

                        <Card className="border border-border/70 shadow-xs bg-card rounded-xl">
                            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60">
                                <div>
                                    <CardTitle className="text-sm font-bold text-foreground">
                                        Buku Pengeluaran Beban Operasional
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Daftar seluruh pencatatan pengeluaran operasional toko pada periode terpilih.
                                    </CardDescription>
                                </div>

                                <div className="flex items-center gap-2">
                                    <select
                                        value={expenseCategoryFilter}
                                        onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                                        className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground"
                                    >
                                        <option value="all">Semua Kategori</option>
                                        <option value="pemeliharaan_alat">Pemeliharaan &amp; Laundry</option>
                                        <option value="perlengkapan_alat">Perlengkapan &amp; Suku Cadang</option>
                                        <option value="operasional_toko">Operasional Toko</option>
                                        <option value="gaji_karyawan">Upah / Gaji</option>
                                        <option value="lain_lain">Lain-lain</option>
                                    </select>

                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleCreateExpense}
                                        className="h-8 text-xs font-semibold gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        <span>Tambah</span>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {filteredExpenses.length === 0 ? (
                                    <div className="p-12 text-center text-xs text-muted-foreground">
                                        Tidak ada catatan beban pengeluaran pada periode atau kategori ini.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs whitespace-nowrap">
                                            <thead>
                                                <tr className="border-b border-border/70 bg-muted/40">
                                                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">No. Beban</th>
                                                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Tanggal</th>
                                                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Kategori</th>
                                                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Keterangan</th>
                                                    <th className="px-3 py-3 text-right font-semibold text-foreground uppercase text-[10px] tracking-wider">Nominal (Rp)</th>
                                                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Metode</th>
                                                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Status</th>
                                                    <th className="px-3 py-3 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Dicatat Oleh</th>
                                                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/60">
                                                {filteredExpenses.map((expense) => (
                                                    <tr key={expense.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-2.5 font-mono text-[11px] font-medium text-foreground">
                                                            {expense.expense_number}
                                                        </td>
                                                        <td className="px-3 py-2.5 font-mono text-muted-foreground">
                                                            {expense.expense_date}
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <Badge variant="outline" className="text-[10px] font-medium">
                                                                {EXPENSE_LABELS[expense.category] || expense.category}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-3 py-2.5 font-medium text-foreground max-w-xs truncate">
                                                            {expense.title}
                                                            {expense.notes && (
                                                                <span className="block text-[10px] text-muted-foreground truncate">{expense.notes}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-bold tabular-nums text-foreground">
                                                            {formatRupiah(expense.amount)}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-muted-foreground">
                                                            {expense.payment_method === "cash" ? "Tunai Kasir" : "Transfer Bank"}
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <Badge
                                                                variant="outline"
                                                                className={`text-[10px] font-semibold ${expense.payment_status === "paid"
                                                                    ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                                                                    : "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                                                                    }`}
                                                            >
                                                                {expense.payment_status === "paid" ? "Lunas" : "Hutang Biaya"}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-muted-foreground">
                                                            {expense.user_name || "Admin"}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleEditExpense(expense)}
                                                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                                    title="Edit Pengeluaran"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDeleteExpense(expense)}
                                                                    className="h-7 w-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                                                    title="Hapus Pengeluaran"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    </TabsContent>

                </Tabs>

                {/* Expense Modal Dialog */}
                <ExpenseFormDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    expense={editingExpense}
                />

            </div>
        </AppLayout>
    );
}
