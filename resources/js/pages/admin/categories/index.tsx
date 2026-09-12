import { Head, router } from '@inertiajs/react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    FolderTree,
    Tent,
    Flame,
    BedDouble,
    Lightbulb,
    Backpack,
    Armchair,
    Compass,
    ShieldCheck,
    Sparkles,
    Mountain,
    HelpCircle,
    Layers,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import type { BreadcrumbItem, Category, PaginatedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inventaris Alat',
        href: '/admin/equipment',
    },
    {
        title: 'Kategori Alat',
        href: '/admin/categories',
    },
];

const ICON_PRESETS = [
    { name: 'Tent', icon: Tent, label: 'Tenda' },
    { name: 'BedDouble', icon: BedDouble, label: 'Sleeping Bag' },
    { name: 'Flame', icon: Flame, label: 'Kompor/Masak' },
    { name: 'Lightbulb', icon: Lightbulb, label: 'Lampu/Penerangan' },
    { name: 'Backpack', icon: Backpack, label: 'Carrier/Ransel' },
    { name: 'Armchair', icon: Armchair, label: 'Kursi/Meja' },
    { name: 'Compass', icon: Compass, label: 'Navigasi' },
    { name: 'Mountain', icon: Mountain, label: 'Gunung' },
    { name: 'ShieldCheck', icon: ShieldCheck, label: 'Proteksi' },
    { name: 'Sparkles', icon: Sparkles, label: 'Aksesoris' },
];

function getCategoryIconComponent(iconName?: string | null) {
    const found = ICON_PRESETS.find((p) => p.name === iconName);
    if (found) {
        const IconComponent = found.icon;
        return <IconComponent className="h-5 w-5" />;
    }
    return <FolderTree className="h-5 w-5" />;
}

interface CategoriesIndexProps {
    categories: PaginatedData<Category>;
    stats: {
        total_categories: number;
        total_categorized_equipment: number;
    };
    filters: {
        search: string;
        per_page?: number;
    };
}

export default function CategoriesIndex({
    categories,
    stats,
    filters,
}: CategoriesIndexProps) {
    // Form Modal state
    const [formModalOpen, setFormModalOpen] = useState<boolean>(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [name, setName] = useState<string>('');
    const [slug, setSlug] = useState<string>('');
    const [icon, setIcon] = useState<string>('Tent');
    const [description, setDescription] = useState<string>('');
    const [saving, setSaving] = useState<boolean>(false);

    // Delete Modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [deleting, setDeleting] = useState<boolean>(false);

    const openCreateModal = () => {
        setEditingCategory(null);
        setName('');
        setSlug('');
        setIcon('Tent');
        setDescription('');
        setFormModalOpen(true);
    };

    const openEditModal = (cat: Category) => {
        setEditingCategory(cat);
        setName(cat.name);
        setSlug(cat.slug);
        setIcon(cat.icon || 'Tent');
        setDescription(cat.description || '');
        setFormModalOpen(true);
    };

    const handleNameChange = (val: string) => {
        setName(val);
        if (!editingCategory) {
            // Auto generate slug
            const autoSlug = val
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            setSlug(autoSlug);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const payload = {
            name,
            slug,
            icon,
            description,
        };

        if (editingCategory) {
            router.put(`/admin/categories/${editingCategory.id}`, payload, {
                onSuccess: () => {
                    toast.success('Kategori berhasil diperbarui.');
                    setFormModalOpen(false);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    toast.error(typeof firstError === 'string' ? firstError : 'Gagal menyimpan kategori.');
                },
                onFinish: () => setSaving(false),
            });
        } else {
            router.post('/admin/categories', payload, {
                onSuccess: () => {
                    toast.success('Kategori baru berhasil ditambahkan.');
                    setFormModalOpen(false);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    toast.error(typeof firstError === 'string' ? firstError : 'Gagal membuat kategori.');
                },
                onFinish: () => setSaving(false),
            });
        }
    };

    const openDeleteDialog = (cat: Category) => {
        setCategoryToDelete(cat);
        setDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (!categoryToDelete) return;
        setDeleting(true);

        router.delete(`/admin/categories/${categoryToDelete.id}`, {
            onSuccess: () => {
                toast.success('Kategori berhasil dihapus.');
                setDeleteModalOpen(false);
                setCategoryToDelete(null);
            },
            onError: (err) => {
                const msg = err.error || 'Gagal menghapus kategori.';
                toast.error(msg);
            },
            onFinish: () => setDeleting(false),
        });
    };

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const search = formData.get('search') as string;
        router.get('/admin/categories', { search }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Kategori Alat Camping - Admin" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Kategori Alat Camping</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Kelola kategori alat camping untuk pengelompokan produk dan pencarian katalog.
                        </p>
                    </div>

                    <Button
                        type="button"
                        size="sm"
                        onClick={openCreateModal}
                        className="h-9 gap-1.5 bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shrink-0"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Tambah Kategori</span>
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Total Kategori
                            </CardTitle>
                            <FolderTree className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold font-variant-numeric tabular-nums text-foreground">
                                {stats.total_categories} Kategori
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Aktif digunakan pada katalog
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Total Produk Terkategori
                            </CardTitle>
                            <Tent className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold font-variant-numeric tabular-nums text-foreground">
                                {stats.total_categorized_equipment} Model Alat
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Terdistribusi di semua kategori
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none bg-card hidden lg:block">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Petunjuk
                            </CardTitle>
                            <HelpCircle className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Kategori yang masih memiliki produk tidak dapat dihapus secara langsung untuk mencegah data *orphan*.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter & Search Bar */}
                <Card className="border-border shadow-none bg-card">
                    <CardContent className="p-4">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    name="search"
                                    defaultValue={filters.search}
                                    placeholder="Cari nama kategori, slug, atau deskripsi..."
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>
                            <Button type="submit" size="sm" variant="secondary" className="h-9 text-xs font-semibold px-4">
                                Cari
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Categories Grid */}
                {categories.data.length === 0 ? (
                    <Card className="border-dashed border-border p-12 text-center">
                        <FolderTree className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                        <h3 className="text-sm font-bold">Belum Ada Kategori</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                            {filters.search ? 'Tidak ada kategori yang cocok dengan kata kunci pencarian.' : 'Mulai tambahkan kategori alat camping untuk mengelompokkan produk Anda.'}
                        </p>
                        {!filters.search && (
                            <Button
                                size="sm"
                                onClick={openCreateModal}
                                className="mt-4 h-8 text-xs font-semibold gap-1.5"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Tambah Kategori Sekarang</span>
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.data.map((cat) => (
                            <Card key={cat.id} className="border-border shadow-none flex flex-col justify-between hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
                                <CardHeader className="p-4 pb-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                                                {getCategoryIconComponent(cat.icon)}
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm font-bold text-foreground line-clamp-1">
                                                    {cat.name}
                                                </CardTitle>
                                                <CardDescription className="text-[11px] font-mono text-muted-foreground">
                                                    slug: {cat.slug}
                                                </CardDescription>
                                            </div>
                                        </div>

                                        <Badge variant="secondary" className="text-[10px] font-semibold shrink-0">
                                            {cat.equipment_count ?? 0} Alat
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-4 pt-0 space-y-3">
                                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                                        {cat.description || 'Tidak ada deskripsi.'}
                                    </p>

                                    <div className="flex items-center justify-end gap-1.5 border-t border-border pt-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditModal(cat)}
                                            className="h-7 text-xs font-semibold gap-1 px-2.5"
                                        >
                                            <Edit2 className="h-3 w-3" />
                                            <span>Edit</span>
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openDeleteDialog(cat)}
                                            className="h-7 text-xs font-semibold gap-1 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            <span>Hapus</span>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                <DataTablePagination pagination={categories} />
            </div>

            {/* Modal Form Tambah / Edit Kategori */}
            <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">
                            {editingCategory ? 'Edit Kategori Alat' : 'Tambah Kategori Baru'}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Isi detail kategori alat camping untuk pengelompokan produk.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Nama Kategori <span className="text-rose-500">*</span></Label>
                            <Input
                                type="text"
                                value={name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="Contoh: Tenda & Shelter"
                                className="h-9 text-xs"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Slug URL</Label>
                            <Input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="tenda-shelter (otomatis jika kosong)"
                                className="h-9 text-xs font-mono"
                            />
                            <p className="text-[10px] text-muted-foreground">Digunakan untuk parameter filter rute katalog.</p>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Ikon Kategori</Label>
                            <div className="grid grid-cols-5 gap-2 pt-1">
                                {ICON_PRESETS.map((preset) => {
                                    const IconComp = preset.icon;
                                    const isSelected = icon === preset.name;
                                    return (
                                        <button
                                            key={preset.name}
                                            type="button"
                                            onClick={() => setIcon(preset.name)}
                                            className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-colors ${
                                                isSelected
                                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold'
                                                    : 'border-border text-muted-foreground hover:bg-muted'
                                            }`}
                                            title={preset.label}
                                        >
                                            <IconComp className="h-4 w-4" />
                                            <span className="text-[9px] mt-1 line-clamp-1">{preset.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Deskripsi</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Keterangan singkat mengenai jenis alat dalam kategori ini..."
                                className="text-xs min-h-[70px]"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setFormModalOpen(false)}
                                className="text-xs"
                                disabled={saving}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={saving || !name.trim()}
                                className="text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                            >
                                {saving ? 'Menyimpan...' : editingCategory ? 'Simpan Perubahan' : 'Buat Kategori'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Konfirmasi Hapus Kategori */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-rose-600">
                            Konfirmasi Hapus Kategori
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {categoryToDelete && (categoryToDelete.equipment_count ?? 0) > 0 ? (
                                <span className="text-rose-600 font-medium block">
                                    Kategori "{categoryToDelete?.name}" masih memiliki <strong>{categoryToDelete?.equipment_count} alat camping</strong> terkait. Anda harus memindahkan atau menghapus alat tersebut terlebih dahulu sebelum dapat menghapus kategori ini.
                                </span>
                            ) : (
                                <span>
                                    Apakah Anda yakin ingin menghapus kategori <strong>"{categoryToDelete?.name}"</strong>? Tindakan ini tidak dapat dibatalkan.
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteModalOpen(false)}
                            className="text-xs"
                            disabled={deleting}
                        >
                            Tutup
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={deleting || ((categoryToDelete?.equipment_count ?? 0) > 0)}
                            className="text-xs font-semibold"
                        >
                            {deleting ? 'Menghapus...' : 'Hapus Kategori'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
