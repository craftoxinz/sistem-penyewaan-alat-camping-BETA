import { Head, Link, router } from '@inertiajs/react';
import {
    Star,
    MessageSquare,
    Eye,
    EyeOff,
    Trash2,
    Search,
    Filter,
    Tent,
    User as UserIcon,
    Calendar,
    Receipt,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    ExternalLink,
    ThumbsUp,
    RotateCcw,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatDateTime } from '@/lib/formatters';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import type { Review, Equipment, BreadcrumbItem, PaginatedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Manajemen Akun',
        href: '/admin/reviews',
    },
    {
        title: 'Ulasan & Rating',
        href: '/admin/reviews',
    },
];

interface ReviewsIndexProps {
    reviews: PaginatedData<Review>;
    equipmentList: Array<{ id: number; name: string }>;
    stats: {
        total_reviews: number;
        avg_rating: number;
        visible_count: number;
        hidden_count: number;
        critical_count?: number;
        positive_count?: number;
        satisfaction_rate?: number;
        rating_breakdown: Record<number, { count: number; percentage: number }>;
    };
    filters: {
        rating: string;
        visibility: string;
        equipment_id: string;
        search: string;
        per_page?: number;
    };
}

export default function ReviewsIndex({
    reviews,
    equipmentList,
    stats,
    filters,
}: ReviewsIndexProps) {
    const [search, setSearch] = useState<string>(filters.search || '');
    const [ratingFilter, setRatingFilter] = useState<string>(filters.rating || 'all');
    const [visibilityFilter, setVisibilityFilter] = useState<string>(filters.visibility || 'all');
    const [equipmentFilter, setEquipmentFilter] = useState<string>(filters.equipment_id || 'all');

    // Delete Confirmation State
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [selectedReviewForDelete, setSelectedReviewForDelete] = useState<Review | null>(null);
    const [submittingDelete, setSubmittingDelete] = useState<boolean>(false);

    // Apply Filter Helper
    const applyFilters = (overrides: Partial<typeof filters> = {}) => {
        router.get(
            '/admin/reviews',
            {
                search: overrides.search !== undefined ? overrides.search : search,
                rating: overrides.rating !== undefined ? overrides.rating : ratingFilter,
                visibility: overrides.visibility !== undefined ? overrides.visibility : visibilityFilter,
                equipment_id: overrides.equipment_id !== undefined ? overrides.equipment_id : equipmentFilter,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    // Toggle Visibility Action
    const handleToggleVisibility = (review: Review) => {
        router.patch(
            `/admin/reviews/${review.id}/toggle-visibility`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        review.is_visible
                            ? 'Ulasan disembunyikan dari katalog publik.'
                            : 'Ulasan kembali ditampilkan di katalog publik.'
                    );
                },
                onError: () => {
                    toast.error('Gagal memperbarui status moderasi ulasan.');
                },
            }
        );
    };

    // Open Delete Modal
    const openDeleteModal = (review: Review) => {
        setSelectedReviewForDelete(review);
        setDeleteModalOpen(true);
    };

    // Confirm Delete Action
    const handleConfirmDelete = () => {
        if (!selectedReviewForDelete) return;

        setSubmittingDelete(true);
        router.delete(`/admin/reviews/${selectedReviewForDelete.id}`, {
            onSuccess: () => {
                toast.success('Ulasan berhasil dihapus.');
                setDeleteModalOpen(false);
                setSelectedReviewForDelete(null);
            },
            onError: () => {
                toast.error('Gagal menghapus ulasan.');
            },
            onFinish: () => setSubmittingDelete(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Ulasan & Rating - Admin Panel" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Star className="h-6 w-6 text-amber-500 fill-current" />
                            <span>Kelola Ulasan & Rating Pelanggan</span>
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Pantau penilaian kepuasan penyewa, moderasi komentar ulasan, dan publikasi testimoni katalog.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild className="text-xs">
                            <Link href="/">
                                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                Buka Katalog Publik
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Rating Metrics & Star Breakdown Grid (Opsi B: Compact 2-Panel) */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    {/* Left: Overall Score & Moderation Breakdown (5 cols) */}
                    <Card className="border-border bg-card lg:col-span-5 flex flex-col justify-between shadow-xs">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                                    <span>Indeks Kepuasan & Moderasi</span>
                                </CardTitle>
                                <Badge variant="outline" className="text-[10px] font-semibold border-amber-500/30 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20">
                                    {stats.satisfaction_rate ?? 100}% Kepuasan
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-baseline gap-3">
                                <span className="font-mono text-4xl font-extrabold tracking-tight text-foreground">
                                    {stats.avg_rating > 0 ? stats.avg_rating.toFixed(1) : '0.0'}
                                </span>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1 text-amber-500">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star
                                                key={s}
                                                className={`h-4 w-4 ${
                                                    s <= Math.round(stats.avg_rating)
                                                        ? 'fill-current'
                                                        : 'text-zinc-300 dark:text-zinc-700'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Rata-rata dari <strong>{stats.total_reviews}</strong> ulasan terverifikasi
                                    </div>
                                </div>
                            </div>

                            {/* 3 Interactive Status Pills */}
                            <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-xs">
                                {/* Tampil Publik */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newVis = visibilityFilter === 'visible' ? 'all' : 'visible';
                                        setVisibilityFilter(newVis);
                                        applyFilters({ visibility: newVis });
                                    }}
                                    className={`rounded-xl border p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                                        visibilityFilter === 'visible'
                                            ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                                            : 'border-emerald-500/20 bg-emerald-50/40 hover:border-emerald-500/40 dark:bg-emerald-950/20'
                                    }`}
                                >
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                        <span className="truncate">Publik</span>
                                    </div>
                                    <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5 tabular-nums">
                                        {stats.visible_count}
                                    </div>
                                    <div className="text-[9px] text-emerald-700/70 dark:text-emerald-400/70 truncate">
                                        Aktif katalog
                                    </div>
                                </button>

                                {/* Disembunyikan */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newVis = visibilityFilter === 'hidden' ? 'all' : 'hidden';
                                        setVisibilityFilter(newVis);
                                        applyFilters({ visibility: newVis });
                                    }}
                                    className={`rounded-xl border p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                                        visibilityFilter === 'hidden'
                                            ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
                                            : 'border-amber-500/20 bg-amber-50/40 hover:border-amber-500/40 dark:bg-amber-950/20'
                                    }`}
                                >
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <EyeOff className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                        <span className="truncate">Tertahan</span>
                                    </div>
                                    <div className="text-lg font-extrabold text-amber-700 dark:text-amber-400 mt-0.5 tabular-nums">
                                        {stats.hidden_count}
                                    </div>
                                    <div className="text-[9px] text-amber-700/70 dark:text-amber-400/70 truncate">
                                        Disembunyikan
                                    </div>
                                </button>

                                {/* Rating Kritis (≤ 3★) */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newRating = ratingFilter === '1' ? 'all' : '1';
                                        setRatingFilter(newRating);
                                        applyFilters({ rating: newRating });
                                    }}
                                    className={`rounded-xl border p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                                        (stats.critical_count ?? 0) > 0
                                            ? 'border-rose-300 bg-rose-50/50 hover:border-rose-400 dark:border-rose-900/40 dark:bg-rose-950/20'
                                            : 'border-border/60 bg-muted/30 hover:border-border'
                                    }`}
                                >
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <AlertTriangle className={`h-3 w-3 ${(stats.critical_count ?? 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'}`} />
                                        <span className="truncate">Kritis ≤3★</span>
                                    </div>
                                    <div className={`text-lg font-extrabold mt-0.5 tabular-nums ${(stats.critical_count ?? 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'}`}>
                                        {stats.critical_count ?? 0}
                                    </div>
                                    <div className="text-[9px] text-muted-foreground truncate">
                                        {(stats.critical_count ?? 0) > 0 ? 'Perlu evaluasi' : 'Kondisi aman'}
                                    </div>
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right: Star Distribution Bars (7 cols) */}
                    <Card className="border-border bg-card lg:col-span-7 shadow-xs flex flex-col justify-between">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-semibold text-muted-foreground">
                                    Distribusi Penilaian Bintang
                                </CardTitle>
                                {ratingFilter !== 'all' && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setRatingFilter('all');
                                            applyFilters({ rating: 'all' });
                                        }}
                                        className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                                    >
                                        <RotateCcw className="h-3 w-3" />
                                        <span>Reset Filter Bintang ({ratingFilter}★)</span>
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {[5, 4, 3, 2, 1].map((star) => {
                                const item = stats.rating_breakdown[star] || { count: 0, percentage: 0 };
                                const isFiltered = ratingFilter === star.toString();

                                const starColors: Record<number, { text: string; bg: string }> = {
                                    5: { text: 'text-amber-500', bg: 'bg-amber-500' },
                                    4: { text: 'text-amber-400', bg: 'bg-amber-400' },
                                    3: { text: 'text-yellow-500', bg: 'bg-yellow-500' },
                                    2: { text: 'text-orange-500', bg: 'bg-orange-500' },
                                    1: { text: 'text-red-500', bg: 'bg-red-500' },
                                };

                                return (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => {
                                            const newRating = isFiltered ? 'all' : star.toString();
                                            setRatingFilter(newRating);
                                            applyFilters({ rating: newRating });
                                        }}
                                        className={`w-full flex items-center gap-3 rounded-lg px-2 py-1.5 transition-all text-left text-xs ${
                                            isFiltered
                                                ? 'bg-amber-500/10 ring-1 ring-amber-500/40 font-semibold'
                                                : 'hover:bg-muted/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1 w-14 shrink-0 font-medium">
                                            <span className="font-bold tabular-nums">{star}</span>
                                            <Star className={`h-3.5 w-3.5 ${starColors[star]?.text || 'text-amber-500'} fill-current`} />
                                        </div>

                                        {/* Progress bar */}
                                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${starColors[star]?.bg || 'bg-amber-500'}`}
                                                style={{ width: `${item.percentage}%` }}
                                            />
                                        </div>

                                        <div className="w-24 shrink-0 text-right font-mono text-[11px] text-muted-foreground">
                                            <strong className="text-foreground">{item.count}</strong> ({item.percentage}%)
                                        </div>
                                    </button>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                    {/* Search Input */}
                    <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Cari komentar, pelanggan, invoice..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8 pl-8 text-xs"
                        />
                    </form>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Rating Filter */}
                        <Select
                            value={ratingFilter}
                            onValueChange={(val) => {
                                setRatingFilter(val);
                                applyFilters({ rating: val });
                            }}
                        >
                            <SelectTrigger className="h-8 w-36 text-xs">
                                <SelectValue placeholder="Rating Bintang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Bintang</SelectItem>
                                <SelectItem value="5">5 Bintang (⭐⭐⭐⭐⭐)</SelectItem>
                                <SelectItem value="4">4 Bintang (⭐⭐⭐⭐)</SelectItem>
                                <SelectItem value="3">3 Bintang (⭐⭐⭐)</SelectItem>
                                <SelectItem value="2">2 Bintang (⭐⭐)</SelectItem>
                                <SelectItem value="1">1 Bintang (⭐)</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Visibility Moderation Filter */}
                        <Select
                            value={visibilityFilter}
                            onValueChange={(val) => {
                                setVisibilityFilter(val);
                                applyFilters({ visibility: val });
                            }}
                        >
                            <SelectTrigger className="h-8 w-36 text-xs">
                                <SelectValue placeholder="Status Moderasi" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="visible">Tampil Publik</SelectItem>
                                <SelectItem value="hidden">Disembunyikan</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Equipment Filter */}
                        <Select
                            value={equipmentFilter}
                            onValueChange={(val) => {
                                setEquipmentFilter(val);
                                applyFilters({ equipment_id: val });
                            }}
                        >
                            <SelectTrigger className="h-8 w-44 text-xs">
                                <SelectValue placeholder="Pilih Alat Camping" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Alat Camping</SelectItem>
                                {equipmentList.map((eq) => (
                                    <SelectItem key={eq.id} value={eq.id.toString()}>
                                        {eq.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Reset Filters */}
                        {(ratingFilter !== 'all' || visibilityFilter !== 'all' || equipmentFilter !== 'all' || search !== '') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearch('');
                                    setRatingFilter('all');
                                    setVisibilityFilter('all');
                                    setEquipmentFilter('all');
                                    router.get('/admin/reviews', {}, { preserveState: true, replace: true });
                                }}
                                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            >
                                Reset
                            </Button>
                        )}
                    </div>
                </div>

                {/* Reviews Data Table */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
                            <thead>
                                <tr className="border-b border-border bg-muted/60 text-muted-foreground">
                                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Pelanggan</th>
                                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Alat Camping</th>
                                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Penilaian & Komentar</th>
                                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Transaksi Sewa</th>
                                    <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Status Moderasi</th>
                                    <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {reviews.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground whitespace-nowrap">
                                            <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-40" />
                                            <div className="font-semibold text-foreground">Tidak Ada Ulasan Ditemukan</div>
                                            <p className="mt-1 text-xs">
                                                Belum ada ulasan pelanggan yang sesuai dengan kriteria filter saat ini.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    reviews.data.map((review) => (
                                        <tr key={review.id} className="hover:bg-muted/20 transition-colors">
                                            {/* Column 1: Customer */}
                                            <td className="px-4 py-3 align-top whitespace-nowrap">
                                                <div className="space-y-0.5">
                                                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                                                        <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span>{review.user?.name}</span>
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        {review.user?.email}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{formatDate(review.created_at || '')}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 2: Equipment */}
                                            <td className="px-4 py-3 align-top whitespace-nowrap">
                                                <div className="space-y-1">
                                                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                                                        <Tent className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <Link
                                                            href={`/catalog/${review.equipment?.slug}`}
                                                            target="_blank"
                                                            className="hover:underline hover:text-primary flex items-center gap-1"
                                                        >
                                                            <span>{review.equipment?.name}</span>
                                                            <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                                                        </Link>
                                                    </div>
                                                    {review.equipment?.category && (
                                                        <Badge variant="secondary" className="text-[10px] font-normal">
                                                            {review.equipment.category.name}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Column 3: Rating & Comment */}
                                            <td className="px-4 py-3 align-top max-w-md whitespace-nowrap">
                                                <div className="space-y-1.5">
                                                    {/* Stars */}
                                                    <div className="flex items-center gap-1">
                                                        <div className="flex items-center text-amber-500">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Star
                                                                    key={s}
                                                                    className={`h-3.5 w-3.5 ${
                                                                        s <= review.rating
                                                                            ? 'fill-current'
                                                                            : 'text-zinc-300 dark:text-zinc-700'
                                                                    }`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="font-bold text-foreground text-xs ml-1">
                                                            {review.rating}.0
                                                        </span>
                                                    </div>

                                                    {/* Comment */}
                                                    {review.comment ? (
                                                        <p className="text-xs text-foreground/90 leading-relaxed bg-muted/30 p-2 rounded-lg border border-border/40">
                                                            "{review.comment}"
                                                        </p>
                                                    ) : (
                                                        <span className="text-[11px] text-muted-foreground italic">
                                                            Tidak ada komentar tertulis.
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Column 4: Rental Invoice */}
                                            <td className="px-4 py-3 align-top whitespace-nowrap">
                                                {review.rental ? (
                                                    <div className="space-y-0.5">
                                                        <Link
                                                            href={`/bookings/${review.rental.id}`}
                                                            target="_blank"
                                                            className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                                        >
                                                            <span>{review.rental.invoice_number}</span>
                                                            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                                                        </Link>
                                                        <div className="text-[10px] text-muted-foreground font-mono">
                                                            {review.rental.booking_code}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>

                                            {/* Column 5: Moderation Status */}
                                            <td className="px-4 py-3 align-top text-center whitespace-nowrap">
                                                {review.is_visible ? (
                                                    <Badge className="bg-emerald-600 text-white text-[10px] font-semibold">
                                                        <Eye className="mr-1 h-3 w-3" />
                                                        Tampil Publik
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-950/30 text-[10px] font-semibold">
                                                        <EyeOff className="mr-1 h-3 w-3" />
                                                        Disembunyikan
                                                    </Badge>
                                                )}
                                            </td>

                                            {/* Column 6: Actions */}
                                            <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Toggle Visibility */}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleToggleVisibility(review)}
                                                        className={`h-7 text-xs ${
                                                            review.is_visible
                                                                ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                                        }`}
                                                    >
                                                        {review.is_visible ? (
                                                            <>
                                                                <EyeOff className="mr-1 h-3 w-3" />
                                                                Sembunyikan
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Eye className="mr-1 h-3 w-3" />
                                                                Tampilkan
                                                            </>
                                                        )}
                                                    </Button>

                                                    {/* Delete Review */}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => openDeleteModal(review)}
                                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
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

                    {/* Pagination */}
                    <DataTablePagination pagination={reviews} />
                </div>
            </div>

            {/* DELETE CONFIRMATION MODAL */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
                            <Trash2 className="h-5 w-5" />
                            <span>Hapus Ulasan Pelanggan</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Apakah Anda yakin ingin menghapus ulasan ini secara permanen? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedReviewForDelete && (
                        <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1.5 text-xs">
                            <div className="font-semibold text-foreground">
                                Ulasan oleh: {selectedReviewForDelete.user?.name}
                            </div>
                            <div className="text-muted-foreground">
                                Alat: {selectedReviewForDelete.equipment?.name} ({selectedReviewForDelete.rating} Bintang)
                            </div>
                            {selectedReviewForDelete.comment && (
                                <p className="text-[11px] italic text-muted-foreground bg-card p-2 rounded border border-border/50">
                                    "{selectedReviewForDelete.comment}"
                                </p>
                            )}
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteModalOpen(false)}
                            disabled={submittingDelete}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleConfirmDelete}
                            disabled={submittingDelete}
                        >
                            {submittingDelete ? 'Menghapus...' : 'Hapus Ulasan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
