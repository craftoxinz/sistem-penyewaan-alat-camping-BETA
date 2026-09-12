import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Users,
    UserCheck,
    Repeat,
    DollarSign,
    Search,
    MessageSquare,
    Printer,
    Download,
    Calendar,
    Crown,
} from 'lucide-react';
import { BreadcrumbItem } from '@/types';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Laporan & Analitik',
        href: '/admin/reports/revenue',
    },
    {
        title: 'Riwayat Penyewa',
        href: '/admin/reports/customers',
    },
];

interface CustomersReportProps {
    customers: Array<{
        id: number;
        name: string;
        email: string;
        phone: string;
        total_rentals_count: number;
        completed_rentals_count: number;
        active_rentals_count: number;
        total_spent: number;
        first_rental_date?: string;
        last_rental_date?: string;
        is_repeat_customer: boolean;
    }>;
    metrics: {
        totalCustomers: number;
        repeatCustomersCount: number;
        repeatRate: number;
        totalCustomerSpend: number;
        averageLtv: number;
    };
    filters: {
        search?: string;
        start_date: string;
        end_date: string;
    };
}

export default function CustomersReport({
    customers,
    metrics,
    filters,
}: CustomersReportProps) {
    const [search, setSearch] = useState<string>(filters.search || '');
    const [custPage, setCustPage] = useState(1);
    const [custPerPage, setCustPerPage] = useState(5);

    const paginatedCustomers = useMemo(() => {
        const start = (custPage - 1) * custPerPage;
        return customers.slice(start, start + custPerPage);
    }, [customers, custPage, custPerPage]);

    const custLastPage = Math.max(1, Math.ceil(customers.length / custPerPage));

    const custPaginationMeta = {
        current_page: custPage,
        last_page: custLastPage,
        per_page: custPerPage,
        total: customers.length,
        from: customers.length === 0 ? 0 : (custPage - 1) * custPerPage + 1,
        to: Math.min(custPage * custPerPage, customers.length),
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/reports/customers',
            {
                search: search || undefined,
            },
            { preserveState: true }
        );
    };

    // Export CSV logic
    const handleExportCsv = () => {
        const headers = ['Peringkat LTV', 'Nama Pelanggan', 'Email', 'No Telepon/WA', 'Total Pesanan', 'Pesanan Selesai', 'Total Belanja (LTV)', 'Status Loyalitas', 'Sewa Terakhir'];
        const rows = customers.map((c, idx) => [
            idx + 1,
            `"${c.name.replace(/"/g, '""')}"`,
            c.email,
            `"${c.phone}"`,
            c.total_rentals_count,
            c.completed_rentals_count,
            c.total_spent,
            c.is_repeat_customer ? 'Repeat Customer' : 'Pelanggan Baru',
            c.last_rental_date || '-',
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `laporan_pelanggan_dan_loyalitas.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Pelanggan & Loyalitas - Admin" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Pelanggan & Riwayat Sewa</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Peringkat pelanggan setia (repeat order), riwayat akumulasi transaksi, dan data kontak penyewa.
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
                    <h1 className="text-xl font-bold">LAPORAN PELANGGAN & RIWAYAT TRANSAKSI LOYALITAS</h1>
                    <p className="text-xs text-muted-foreground">
                        Total Pelanggan: {metrics.totalCustomers} Penyewa &bull; Dicetak pada: {new Date().toLocaleString('id-ID')}
                    </p>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Total Pelanggan Aktif
                            </CardTitle>
                            <Users className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-extrabold text-foreground font-variant-numeric tabular-nums">
                                {metrics.totalCustomers} Orang
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Akun terdaftar dengan role customer
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Repeat Customer (Loyal)
                            </CardTitle>
                            <Repeat className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-variant-numeric tabular-nums">
                                {metrics.repeatCustomersCount} Orang ({metrics.repeatRate}%)
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Menyewa lebih dari 1 kali
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Total Akumulasi Belanja
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-violet-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-extrabold text-foreground font-variant-numeric tabular-nums">
                                {formatRupiah(metrics.totalCustomerSpend)}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Nilai total pesanan terverifikasi
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Rata-rata Nilai Pelanggan (LTV)
                            </CardTitle>
                            <Crown className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-variant-numeric tabular-nums">
                                {formatRupiah(metrics.averageLtv)}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Lifetime value per customer
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search & Filter Toolbar */}
                <Card className="border-border shadow-none print:hidden">
                    <CardContent className="p-4">
                        <form onSubmit={handleSearch} className="flex gap-2 items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nama pelanggan, email, atau nomor WhatsApp..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>
                            <Button type="submit" size="sm" className="h-9 text-xs font-semibold">
                                Cari
                            </Button>
                            {filters.search && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSearch('');
                                        router.get('/admin/reports/customers');
                                    }}
                                    className="h-9 text-xs"
                                >
                                    Reset
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Customer Table */}
                <Card className="border-border shadow-none">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold">Peringkat Pelanggan Berdasarkan Nilai Transaksi (LTV)</CardTitle>
                        <CardDescription className="text-xs">
                            Pelanggan dengan frekuensi dan nilai total transaksi sewa tertinggi.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border text-muted-foreground">
                                        <th className="py-2.5 px-4 font-semibold text-center w-12 whitespace-nowrap">Rank</th>
                                        <th className="py-2.5 px-4 font-semibold whitespace-nowrap">Nama Pelanggan</th>
                                        <th className="py-2.5 px-4 font-semibold whitespace-nowrap">Email & Kontak WA</th>
                                        <th className="py-2.5 px-4 font-semibold text-center whitespace-nowrap">Status Loyalitas</th>
                                        <th className="py-2.5 px-4 font-semibold text-center whitespace-nowrap">Total Sewa</th>
                                        <th className="py-2.5 px-4 font-semibold text-center whitespace-nowrap">Selesai / Aktif</th>
                                        <th className="py-2.5 px-4 font-semibold text-right whitespace-nowrap">Total Belanja (LTV)</th>
                                        <th className="py-2.5 px-4 font-semibold text-center whitespace-nowrap">Sewa Terakhir</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {customers.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-8 text-muted-foreground whitespace-nowrap">
                                                Tidak ada data pelanggan yang sesuai dengan kriteria pencarian.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedCustomers.map((cust, idx) => (
                                            <tr key={cust.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="py-3 px-4 text-center font-bold whitespace-nowrap">
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
                                                    {cust.name}
                                                </td>
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    <div className="text-foreground">{cust.email}</div>
                                                    {cust.phone && cust.phone !== '-' ? (
                                                        <a
                                                            href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 mt-0.5 font-mono"
                                                        >
                                                            <MessageSquare className="h-3 w-3" />
                                                            <span>{cust.phone}</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                                    {cust.is_repeat_customer ? (
                                                        <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                                                            <Repeat className="h-3 w-3" />
                                                            <span>Repeat ({cust.total_rentals_count}x)</span>
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px]">
                                                            Pelanggan Baru
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center font-bold whitespace-nowrap">
                                                    {cust.total_rentals_count} pesanan
                                                </td>
                                                <td className="py-3 px-4 text-center text-muted-foreground whitespace-nowrap">
                                                    <strong className="text-emerald-600">{cust.completed_rentals_count}</strong> selesai /{' '}
                                                    <strong className="text-blue-600">{cust.active_rentals_count}</strong> aktif
                                                </td>
                                                <td className="py-3 px-4 text-right font-extrabold font-variant-numeric tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                    {formatRupiah(cust.total_spent)}
                                                </td>
                                                <td className="py-3 px-4 text-center text-muted-foreground whitespace-nowrap">
                                                    {cust.last_rental_date ? formatDate(cust.last_rental_date) : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination for Customers Table */}
                <DataTablePagination
                    pagination={custPaginationMeta}
                    onPageChange={(page) => setCustPage(page)}
                    onPerPageChange={(pp) => { setCustPerPage(pp); setCustPage(1); }}
                />
            </div>
        </AppLayout>
    );
}
