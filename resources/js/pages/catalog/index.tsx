import { Head, Link, router } from '@inertiajs/react';
import {
    Search,
    Star,
    Tent,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import CustomerLayout from '@/layouts/customer-layout';
import { formatRupiah } from '@/lib/formatters';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import type { Brand, Category, Equipment, PaginatedData } from '@/types';

interface CatalogIndexProps {
    categories: Category[];
    brands?: Brand[];
    equipment: PaginatedData<Equipment>;
    filters: {
        category: string;
        brand?: string;
        search: string;
        sort: string;
        per_page?: number;
    };
}

export default function CatalogIndex({
    categories,
    brands = [],
    equipment,
    filters,
}: CatalogIndexProps) {
    const handleCategoryClick = (categorySlug: string) => {
        router.get(
            '/',
            {
                ...filters,
                category: filters.category === categorySlug ? '' : categorySlug,
            },
            { preserveState: true },
        );
    };

    const handleBrandClick = (brandSlug: string) => {
        router.get(
            '/',
            {
                ...filters,
                brand: filters.brand === brandSlug ? '' : brandSlug,
            },
            { preserveState: true },
        );
    };

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const searchVal = formData.get('search') as string;
        router.get(
            '/',
            {
                ...filters,
                search: searchVal,
            },
            { preserveState: true },
        );
    };

    const handleSortChange = (value: string) => {
        router.get(
            '/',
            {
                ...filters,
                sort: value,
            },
            { preserveState: true },
        );
    };

    return (
        <CustomerLayout>
            <Head title="Katalog Sewa Alat Camping" />

            {/* Hero Section */}
            <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-slate-100/80 via-background to-background px-4 py-16 text-foreground transition-colors sm:px-6 lg:px-8 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 dark:text-white">
                <div className="absolute inset-0 bg-[radial-gradient(#0284c7_1.25px,transparent_1.25px)] opacity-30 [background-size:16px_16px] dark:bg-[radial-gradient(#38bdf8_1px,transparent_1px)] dark:opacity-20" />
                <div className="relative z-10 container mx-auto max-w-5xl space-y-4 text-center">
                    <Badge
                        variant="outline"
                        className="border-emerald-500/30 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-xs dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-400"
                    >
                        Perlengkapan Outdoor Bersih & Siap Pakai
                    </Badge>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl dark:text-white">
                        Sewa Alat Camping Mudah, Lengkap & Terpercaya
                    </h1>
                    <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base dark:text-zinc-400">
                        Jelajahi tenda dome, alat masak ultralight, carrier
                        ergonomis, dan berbagai peralatan outdoor terbaik untuk
                        pendakian dan kemah Anda.
                    </p>

                    {/* Search & Quick Filter Bar */}
                    <div className="mx-auto max-w-xl pt-4">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="search"
                                    name="search"
                                    defaultValue={filters.search}
                                    placeholder="Cari tenda, kompor, tas carrier, sleeping bag..."
                                    className="h-11 rounded-lg border-border bg-background/90 pl-10 text-sm text-foreground shadow-xs placeholder:text-muted-foreground focus-visible:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="h-11 bg-zinc-900 px-5 font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                            >
                                Cari
                            </Button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Catalog Content Container */}
            <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8 lg:flex-row">
                    {/* Sidebar Filter Categories */}
                    <aside className="w-full shrink-0 space-y-6 lg:w-64">
                        <div className="rounded-xl border border-border bg-card p-4">
                            <h2 className="mb-3 text-sm font-semibold">
                                Kategori Alat
                            </h2>
                            <div className="space-y-1">
                                <button
                                    onClick={() => handleCategoryClick('')}
                                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                                        !filters.category
                                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                                >
                                    <span>Semua Kategori</span>
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() =>
                                            handleCategoryClick(cat.slug)
                                        }
                                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                                            filters.category === cat.slug
                                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                    >
                                        <span className="truncate">
                                            {cat.name}
                                        </span>
                                        {cat.equipment_count !== undefined && (
                                            <span className="ml-2 text-[11px] opacity-70">
                                                ({cat.equipment_count})
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sidebar Filter Brands */}
                        {brands.length > 0 && (
                            <div className="rounded-xl border border-border bg-card p-4">
                                <h2 className="mb-3 text-sm font-semibold">
                                    Brand & Merk
                                </h2>
                                <div className="space-y-1">
                                    <button
                                        onClick={() => handleBrandClick('')}
                                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                                            !filters.brand
                                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                    >
                                        <span>Semua Brand</span>
                                    </button>
                                    {brands.map((b) => (
                                        <button
                                            key={b.id}
                                            onClick={() =>
                                                handleBrandClick(b.slug)
                                            }
                                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                                                filters.brand === b.slug
                                                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                        >
                                            <span className="truncate">
                                                {b.name}
                                            </span>
                                            {b.equipment_count !== undefined && (
                                                <span className="ml-2 text-[11px] opacity-70">
                                                    ({b.equipment_count})
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Rental Benefit Card */}
                        <div className="space-y-2.5 rounded-xl border border-border bg-muted/40 p-4 text-xs">
                            <h3 className="font-semibold text-foreground">
                                Kenapa Sewa di CampRental?
                            </h3>
                            <ul className="space-y-2 text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                    <span>
                                        Unit bersih, lengkap & dicuci setelah
                                        setiap pemakaian.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                    <span>
                                        Cukup DP 30% untuk mengunci tanggal
                                        sewa.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                    <span>
                                        Jaminan deposit aman & langsung
                                        dikembalikan saat unit kembali utuh.
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </aside>

                    {/* Main Products Grid */}
                    <div className="flex-1 space-y-6">
                        {/* Control Bar: Total Found & Sort */}
                        <div className="flex flex-col justify-between gap-4 border-b border-border pb-2 sm:flex-row sm:items-center">
                            <div className="text-sm text-muted-foreground">
                                Menampilkan{' '}
                                <span className="font-semibold text-foreground">
                                    {equipment.total}
                                </span>{' '}
                                alat camping
                                {filters.category && (
                                    <span> dalam kategori terpilih</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs whitespace-nowrap text-muted-foreground">
                                    Urutkan:
                                </span>
                                <Select
                                    value={filters.sort}
                                    onValueChange={handleSortChange}
                                >
                                    <SelectTrigger className="h-9 w-[180px] text-xs">
                                        <SelectValue placeholder="Urutkan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="popular">
                                            Paling Populer
                                        </SelectItem>
                                        <SelectItem value="newest">
                                            Terbaru
                                        </SelectItem>
                                        <SelectItem value="price_asc">
                                            Harga: Rendah ke Tinggi
                                        </SelectItem>
                                        <SelectItem value="price_desc">
                                            Harga: Tinggi ke Rendah
                                        </SelectItem>
                                        <SelectItem value="rating">
                                            Rating Tertinggi
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Product Cards Grid: 3 columns desktop, 1 col mobile */}
                        {equipment.data.length === 0 ? (
                            <div className="space-y-3 rounded-xl border border-dashed px-4 py-16 text-center">
                                <Tent className="mx-auto h-10 w-10 text-muted-foreground opacity-40" />
                                <h3 className="text-base font-semibold">
                                    Alat Tidak Ditemukan
                                </h3>
                                <p className="mx-auto max-w-sm text-xs text-muted-foreground">
                                    Tidak ada peralatan camping yang sesuai
                                    dengan filter atau kata kunci pencarian
                                    Anda.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.get('/')}
                                >
                                    Reset Filter
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {equipment.data.map((item) => {
                                    // usable_units_count = non-retired, non-lost, non-severely-damaged (booking ceiling)
                                    const usableCount = item.usable_units_count ?? 0;
                                    // available_units_count = currently physically 'tersedia' (can be 0 even when usable > 0)
                                    const availableCount = item.available_units_count ?? 0;
                                    const hasAnyStock = usableCount > 0;
                                    const avgRating = item.reviews_avg_rating
                                        ? parseFloat(
                                              item.reviews_avg_rating.toString(),
                                          ).toFixed(1)
                                        : null;

                                    return (
                                        <Card
                                            key={item.id}
                                            className="group flex flex-col overflow-hidden border-border transition-all hover:shadow-md"
                                        >
                                            {/* Product Image */}
                                            <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                                                {item.image_url ? (
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.name}
                                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                                                        <Tent className="h-12 w-12 opacity-30" />
                                                    </div>
                                                )}
                                                {/* Category & Brand Badges */}
                                                <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 items-center max-w-[70%]">
                                                    <Badge className="bg-zinc-900/85 text-[10px] font-medium text-white backdrop-blur-sm shadow-sm">
                                                        {item.category?.name}
                                                    </Badge>
                                                    {item.brand && (
                                                        <Badge className="bg-violet-900/85 text-[10px] font-medium text-white backdrop-blur-sm shadow-sm">
                                                            {item.brand.name}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {/* Availability Pill — shows fleet capacity, NOT date-specific */}
                                                <div className="absolute top-2.5 right-2.5">
                                                    {hasAnyStock ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-none bg-emerald-500/90 text-[10px] font-semibold text-white"
                                                        >
                                                            {usableCount} Unit
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-none bg-rose-600/90 text-[10px] font-semibold text-white"
                                                        >
                                                            Tidak Tersedia
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            <CardHeader className="space-y-1 p-4 pb-2">
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1 text-amber-500">
                                                        <Star className="h-3.5 w-3.5 fill-current" />
                                                        <span className="font-semibold text-foreground">
                                                            {avgRating ||
                                                                'Baru'}
                                                        </span>
                                                        {item.reviews_count ? (
                                                            <span className="text-[11px] text-muted-foreground">
                                                                (
                                                                {
                                                                    item.reviews_count
                                                                }
                                                                )
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                <h3 className="line-clamp-1 text-sm leading-snug font-semibold transition-colors group-hover:text-primary">
                                                    <Link
                                                        href={`/catalog/${item.slug}`}
                                                    >
                                                        {item.name}
                                                    </Link>
                                                </h3>
                                            </CardHeader>

                                            <CardContent className="flex flex-1 flex-col justify-between space-y-3 p-4 pt-0">
                                                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                                    {item.description}
                                                </p>

                                                <div className="flex items-baseline justify-between border-t border-border/60 pt-2">
                                                    <div>
                                                        <span className="block text-xs text-muted-foreground">
                                                            Harga Sewa:
                                                        </span>
                                                        <span className="font-variant-numeric text-base font-bold text-foreground tabular-nums">
                                                            {formatRupiah(
                                                                item.price_per_day,
                                                            )}
                                                        </span>
                                                        <span className="text-[11px] text-muted-foreground">
                                                            {' '}
                                                            /hari
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-[11px] text-muted-foreground">
                                                            Jaminan (Deposit):
                                                        </span>
                                                        <span className="font-variant-numeric text-xs font-medium text-muted-foreground tabular-nums">
                                                            {formatRupiah(
                                                                item.deposit_per_unit,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Stock info row – shows current availability vs total fleet */}
                                                <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-2">
                                                    <span className="flex items-center gap-1">
                                                        <span className={`h-1.5 w-1.5 rounded-full ${availableCount > 0 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                        <span>
                                                            {availableCount > 0
                                                                ? `${availableCount} sedang bebas`
                                                                : 'Semua sedang aktif'}
                                                        </span>
                                                    </span>
                                                    <span className="font-medium text-foreground">
                                                        {usableCount} unit total
                                                    </span>
                                                </div>
                                            </CardContent>

                                            <CardFooter className="grid grid-cols-2 gap-2 border-t-0 bg-transparent p-4 pt-0">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                    className="w-full text-xs font-medium"
                                                >
                                                    <Link
                                                        href={`/catalog/${item.slug}`}
                                                    >
                                                        Lihat Detail
                                                    </Link>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    asChild
                                                    className="w-full bg-zinc-900 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                                >
                                                    <Link
                                                        href={`/catalog/${item.slug}`}
                                                    >
                                                        Sewa
                                                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                                    </Link>
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination Links */}
                        <DataTablePagination pagination={equipment} pageSizeOptions={[9, 12, 24]} />
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
