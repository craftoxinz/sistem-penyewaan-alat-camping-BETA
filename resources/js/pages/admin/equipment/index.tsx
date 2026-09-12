import { Head, Link, router } from '@inertiajs/react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Layers,
    Tent,
    ExternalLink,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/formatters';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import type { Brand, Category, Equipment, PaginatedData } from '@/types';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inventaris Alat',
        href: '/admin/equipment',
    },
    {
        title: 'Master Alat Camping',
        href: '/admin/equipment',
    },
];

interface EquipmentIndexProps {
    equipment: PaginatedData<Equipment>;
    categories: Category[];
    brands?: Brand[];
    filters: {
        category: string;
        brand?: string;
        search: string;
        per_page?: number;
    };
}

export default function EquipmentIndex({
    equipment,
    categories,
    brands = [],
    filters,
}: EquipmentIndexProps) {
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<Equipment | null>(null);
    const [deleting, setDeleting] = useState<boolean>(false);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const search = formData.get('search') as string;
        router.get(
            '/admin/equipment',
            { ...filters, search },
            { preserveState: true },
        );
    };

    const handleCategoryFilter = (catId: string) => {
        router.get(
            '/admin/equipment',
            {
                ...filters,
                category: catId === 'all' ? '' : catId,
            },
            { preserveState: true },
        );
    };

    const handleBrandFilter = (brandId: string) => {
        router.get(
            '/admin/equipment',
            {
                ...filters,
                brand: brandId === 'all' ? '' : brandId,
            },
            { preserveState: true },
        );
    };

    const openDeleteDialog = (item: Equipment) => {
        setItemToDelete(item);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!itemToDelete) {
            return;
        }

        setDeleting(true);
        router.delete(`/admin/equipment/${itemToDelete.id}`, {
            onSuccess: () => {
                setDeleteModalOpen(false);
                toast.success(
                    `Data alat '${itemToDelete.name}' berhasil dihapus.`,
                );
            },
            onError: () => toast.error('Gagal menghapus data alat.'),
            onFinish: () => setDeleting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Master Alat Camping - Admin" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Master Alat Camping
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Kelola model alat camping, spesifikasi, tarif harian,
                            dan status ketersediaan armada unit.
                        </p>
                    </div>
                    <Button
                        size="sm"
                        asChild
                        className="gap-1.5 bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                        <Link href="/admin/equipment/create">
                            <Plus className="h-4 w-4" />
                            <span>Tambah Alat Baru</span>
                        </Link>
                    </Button>
                </div>

                {/* Filter & Search Bar */}
                <Card className="border-border shadow-none">
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <form
                                onSubmit={handleSearch}
                                className="flex flex-1 gap-2"
                            >
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        name="search"
                                        defaultValue={filters.search}
                                        placeholder="Cari nama alat camping..."
                                        className="h-9 pl-9 text-xs"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    size="sm"
                                    variant="secondary"
                                    className="h-9 px-4 text-xs font-semibold"
                                >
                                    Cari
                                </Button>
                            </form>

                            <div className="flex gap-2">
                                <div className="w-44">
                                    <Select
                                        value={filters.category || 'all'}
                                        onValueChange={handleCategoryFilter}
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Semua Kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Semua Kategori
                                            </SelectItem>
                                            {categories.map((cat) => (
                                                <SelectItem
                                                    key={cat.id}
                                                    value={cat.id.toString()}
                                                >
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="w-44">
                                    <Select
                                        value={filters.brand || 'all'}
                                        onValueChange={handleBrandFilter}
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Semua Brand" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Semua Brand
                                            </SelectItem>
                                            {brands.map((b) => (
                                                <SelectItem
                                                    key={b.id}
                                                    value={b.id.toString()}
                                                >
                                                    {b.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Equipment Table */}
                <Card className="border-border shadow-none">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                            Alat Camping
                                        </th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                            Kategori
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                                            Tarif / Hari
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                                            Deposit
                                        </th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                            Stok Unit Armada
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {equipment.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="py-12 text-center text-muted-foreground"
                                            >
                                                Tidak ada data alat camping yang
                                                cocok.
                                            </td>
                                        </tr>
                                    ) : (
                                        equipment.data.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                                                            {item.image_url ? (
                                                                <img
                                                                    src={
                                                                        item.image_url
                                                                    }
                                                                    alt={
                                                                        item.name
                                                                    }
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                                                    <Tent className="h-5 w-5 opacity-30" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-semibold text-foreground">
                                                                {item.name}
                                                            </div>
                                                            <div className="font-mono text-[11px] text-muted-foreground">
                                                                /{item.slug}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {item.category?.name}
                                                        </Badge>
                                                        {item.brand && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="border border-violet-500/20 bg-violet-50 text-[10px] font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                                                            >
                                                                {item.brand.name}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="font-variant-numeric px-4 py-3 text-right font-semibold text-foreground tabular-nums whitespace-nowrap">
                                                    {formatRupiah(
                                                        item.price_per_day,
                                                    )}
                                                </td>
                                                <td className="font-variant-numeric px-4 py-3 text-right font-medium text-muted-foreground tabular-nums whitespace-nowrap">
                                                    {formatRupiah(
                                                        item.deposit_per_unit,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-foreground">
                                                                {
                                                                    item.total_units_count
                                                                }{' '}
                                                                Unit Total
                                                            </span>
                                                            <Link
                                                                href={`/admin/units?equipment_id=${item.id}`}
                                                                className="inline-flex items-center gap-0.5 text-[11px] text-blue-600 hover:underline"
                                                            >
                                                                <Layers className="h-3 w-3" />
                                                                Kelola Unit
                                                            </Link>
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground">
                                                            <span className="font-medium text-emerald-600">
                                                                {
                                                                    item.available_units_count
                                                                }{' '}
                                                                Tersedia
                                                            </span>{' '}
                                                            •{' '}
                                                            <span className="font-medium text-amber-600">
                                                                {
                                                                    item.rented_units_count
                                                                }{' '}
                                                                Disewa
                                                            </span>{' '}
                                                            •{' '}
                                                            <span className="font-medium text-rose-600">
                                                                {
                                                                    item.maintenance_units_count
                                                                }{' '}
                                                                Rusak/Maint.
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            asChild
                                                            className="h-8 w-8 p-0"
                                                            title="Lihat Halaman Publik"
                                                        >
                                                            <Link
                                                                href={`/catalog/${item.slug}`}
                                                                target="_blank"
                                                            >
                                                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            asChild
                                                            className="h-8 w-8 p-0"
                                                            title="Edit Data Alat"
                                                        >
                                                            <Link
                                                                href={`/admin/equipment/${item.id}/edit`}
                                                            >
                                                                <Edit2 className="h-3.5 w-3.5" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            onClick={() =>
                                                                openDeleteDialog(
                                                                    item,
                                                                )
                                                            }
                                                            title="Hapus Alat"
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

                {/* Pagination Links */}
                <DataTablePagination pagination={equipment} />
            </div>

            {/* Confirm Delete Dialog */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">
                            Konfirmasi Hapus Data Alat
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Apakah Anda yakin ingin menghapus{' '}
                            <strong>{itemToDelete?.name}</strong>? Seluruh data
                            unit fisik terkait juga akan terhapus. Tindakan ini
                            tidak dapat dibatalkan.
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
                            {deleting ? 'Menghapus...' : 'Ya, Hapus Alat'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
