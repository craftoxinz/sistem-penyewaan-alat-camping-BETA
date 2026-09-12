import { Head, router } from '@inertiajs/react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Tag,
    Globe,
    ExternalLink,
    CheckCircle2,
    XCircle,
    HelpCircle,
    Image as ImageIcon,
    UploadCloud,
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
import { Checkbox } from '@/components/ui/checkbox';
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
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import type { Brand, BreadcrumbItem, PaginatedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inventaris Alat',
        href: '/admin/equipment',
    },
    {
        title: 'Brand & Merk',
        href: '/admin/brands',
    },
];

interface BrandsIndexProps {
    brands: PaginatedData<Brand>;
    stats: {
        total_brands: number;
        active_brands: number;
        inactive_brands: number;
        total_branded_equipment: number;
    };
    filters: {
        search: string;
        status: string;
        per_page?: number;
    };
}

export default function BrandsIndex({
    brands,
    stats,
    filters,
}: BrandsIndexProps) {
    // Form Modal state
    const [formModalOpen, setFormModalOpen] = useState<boolean>(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [name, setName] = useState<string>('');
    const [slug, setSlug] = useState<string>('');
    const [websiteUrl, setWebsiteUrl] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [isActive, setIsActive] = useState<boolean>(true);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState<boolean>(false);

    // Delete Modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
    const [deleting, setDeleting] = useState<boolean>(false);

    const openCreateModal = () => {
        setEditingBrand(null);
        setName('');
        setSlug('');
        setWebsiteUrl('');
        setDescription('');
        setIsActive(true);
        setLogoFile(null);
        setLogoPreview(null);
        setFormModalOpen(true);
    };

    const openEditModal = (brand: Brand) => {
        setEditingBrand(brand);
        setName(brand.name);
        setSlug(brand.slug);
        setWebsiteUrl(brand.website_url || '');
        setDescription(brand.description || '');
        setIsActive(brand.is_active);
        setLogoFile(null);
        setLogoPreview(brand.logo_url || null);
        setFormModalOpen(true);
    };

    const handleNameChange = (val: string) => {
        setName(val);
        if (!editingBrand) {
            const autoSlug = val
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            setSlug(autoSlug);
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const formData = new FormData();
        formData.append('name', name);
        if (slug) formData.append('slug', slug);
        if (websiteUrl) formData.append('website_url', websiteUrl);
        if (description) formData.append('description', description);
        formData.append('is_active', isActive ? '1' : '0');
        if (logoFile) {
            formData.append('logo', logoFile);
        }

        if (editingBrand) {
            formData.append('_method', 'PUT');
            router.post(`/admin/brands/${editingBrand.id}`, formData, {
                onSuccess: () => {
                    toast.success('Brand berhasil diperbarui.');
                    setFormModalOpen(false);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    toast.error(typeof firstError === 'string' ? firstError : 'Gagal menyimpan brand.');
                },
                onFinish: () => setSaving(false),
            });
        } else {
            router.post('/admin/brands', formData, {
                onSuccess: () => {
                    toast.success('Brand baru berhasil ditambahkan.');
                    setFormModalOpen(false);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    toast.error(typeof firstError === 'string' ? firstError : 'Gagal membuat brand.');
                },
                onFinish: () => setSaving(false),
            });
        }
    };

    const openDeleteDialog = (brand: Brand) => {
        setBrandToDelete(brand);
        setDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (!brandToDelete) return;
        setDeleting(true);

        router.delete(`/admin/brands/${brandToDelete.id}`, {
            onSuccess: () => {
                toast.success('Brand berhasil dihapus.');
                setDeleteModalOpen(false);
                setBrandToDelete(null);
            },
            onError: (err) => {
                const msg = err.error || 'Gagal menghapus brand.';
                toast.error(msg);
            },
            onFinish: () => setDeleting(false),
        });
    };

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const search = formData.get('search') as string;
        router.get(
            '/admin/brands',
            { ...filters, search },
            { preserveState: true }
        );
    };

    const handleStatusFilter = (statusVal: string) => {
        router.get(
            '/admin/brands',
            { ...filters, status: statusVal },
            { preserveState: true }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Brand & Merk Alat - Admin" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Brand & Merk Alat Camping</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Kelola data brand dan merk perlengkapan outdoor untuk filter katalog dan spesifikasi alat.
                        </p>
                    </div>

                    <Button
                        type="button"
                        size="sm"
                        onClick={openCreateModal}
                        className="h-9 gap-1.5 bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shrink-0"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Tambah Brand</span>
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Total Brand
                            </CardTitle>
                            <Tag className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold font-variant-numeric tabular-nums text-foreground">
                                {stats.total_brands} Brand
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                {stats.active_brands} aktif &bull; {stats.inactive_brands} nonaktif
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Brand Aktif
                            </CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold font-variant-numeric tabular-nums text-emerald-600 dark:text-emerald-400">
                                {stats.active_brands} Brand
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Tampil pada opsi filter katalog
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Total Alat Ter-Merk
                            </CardTitle>
                            <Tag className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-extrabold font-variant-numeric tabular-nums text-foreground">
                                {stats.total_branded_equipment} Model Alat
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Terhubung dengan master data brand
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none bg-card hidden lg:block">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                                Info Brand
                            </CardTitle>
                            <HelpCircle className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Brand yang memiliki produk tidak dapat dihapus langsung sebelum produk diubah ke brand lain.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter & Search Bar */}
                <Card className="border-border shadow-none bg-card">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <form onSubmit={handleSearch} className="flex-1 w-full flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        name="search"
                                        defaultValue={filters.search}
                                        placeholder="Cari nama brand, slug, atau deskripsi..."
                                        className="pl-9 h-9 text-xs"
                                    />
                                </div>
                                <Button type="submit" size="sm" variant="secondary" className="h-9 text-xs font-semibold px-4">
                                    Cari
                                </Button>
                            </form>

                            <div className="w-full sm:w-48 shrink-0">
                                <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue placeholder="Semua Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Status</SelectItem>
                                        <SelectItem value="1">Aktif Saja</SelectItem>
                                        <SelectItem value="0">Nonaktif</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Brands Grid */}
                {brands.data.length === 0 ? (
                    <Card className="border-dashed border-border p-12 text-center">
                        <Tag className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                        <h3 className="text-sm font-bold">Belum Ada Brand</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                            {filters.search ? 'Tidak ada brand yang cocok dengan kata kunci pencarian.' : 'Mulai tambahkan brand atau merk alat camping yang Anda sewakan.'}
                        </p>
                        {!filters.search && (
                            <Button
                                size="sm"
                                onClick={openCreateModal}
                                className="mt-4 h-8 text-xs font-semibold gap-1.5"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Tambah Brand Sekarang</span>
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {brands.data.map((b) => (
                            <Card key={b.id} className="border-border shadow-none flex flex-col justify-between hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
                                <CardHeader className="p-4 pb-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            {b.logo_url ? (
                                                <div className="h-10 w-10 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                                                    <img
                                                        src={b.logo_url}
                                                        alt={b.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-10 w-10 rounded-lg bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-200 border border-border flex items-center justify-center font-bold text-sm shrink-0">
                                                    {b.name.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}

                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <CardTitle className="text-sm font-bold text-foreground line-clamp-1">
                                                        {b.name}
                                                    </CardTitle>
                                                    {b.is_active ? (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" title="Aktif" />
                                                    ) : (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" title="Nonaktif" />
                                                    )}
                                                </div>
                                                <CardDescription className="text-[11px] font-mono text-muted-foreground">
                                                    slug: {b.slug}
                                                </CardDescription>
                                            </div>
                                        </div>

                                        <Badge variant="secondary" className="text-[10px] font-semibold shrink-0">
                                            {b.equipment_count ?? 0} Alat
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-4 pt-0 space-y-3">
                                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                                        {b.description || 'Tidak ada deskripsi.'}
                                    </p>

                                    <div className="flex items-center justify-between border-t border-border pt-3">
                                        {b.website_url ? (
                                            <a
                                                href={b.website_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium truncate max-w-[150px]"
                                            >
                                                <Globe className="h-3 w-3 shrink-0" />
                                                <span className="truncate">Situs Resmi</span>
                                                <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                                            </a>
                                        ) : (
                                            <span className="text-[11px] text-muted-foreground italic">-</span>
                                        )}

                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEditModal(b)}
                                                className="h-7 text-xs font-semibold gap-1 px-2.5"
                                            >
                                                <Edit2 className="h-3 w-3" />
                                                <span>Edit</span>
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openDeleteDialog(b)}
                                                className="h-7 text-xs font-semibold gap-1 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                                <span>Hapus</span>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                <DataTablePagination pagination={brands} />
            </div>

            {/* Modal Form Tambah / Edit Brand */}
            <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">
                            {editingBrand ? 'Edit Brand / Merk' : 'Tambah Brand Baru'}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Lengkapi informasi brand atau merk perlengkapan outdoor.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Nama Brand <span className="text-rose-500">*</span></Label>
                            <Input
                                type="text"
                                value={name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="Contoh: Naturehike, Osprey, Eiger"
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
                                placeholder="naturehike (otomatis jika kosong)"
                                className="h-9 text-xs font-mono"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Website Resmi (Opsional)</Label>
                            <Input
                                type="url"
                                value={websiteUrl}
                                onChange={(e) => setWebsiteUrl(e.target.value)}
                                placeholder="https://example.com"
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Logo Brand</Label>
                            <div className="flex items-center gap-3">
                                {logoPreview ? (
                                    <div className="h-12 w-12 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                                        <img src={logoPreview} alt="Preview" className="h-full w-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="h-12 w-12 rounded-lg bg-muted border border-dashed border-border flex items-center justify-center text-muted-foreground shrink-0">
                                        <ImageIcon className="h-5 w-5" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="h-9 text-xs"
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-0.5">Format: JPG, PNG, WEBP, SVG (Maks. 2MB)</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Deskripsi</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Informasi mengenai profil merk atau produk unggulannya..."
                                className="text-xs min-h-[70px]"
                            />
                        </div>

                        <div className="flex items-center space-x-2 pt-1">
                            <Checkbox
                                id="is_active"
                                checked={isActive}
                                onCheckedChange={(checked) => setIsActive(!!checked)}
                            />
                            <Label htmlFor="is_active" className="text-xs font-medium cursor-pointer">
                                Brand Aktif (Tampil pada pilihan form alat dan filter katalog)
                            </Label>
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
                                {saving ? 'Menyimpan...' : editingBrand ? 'Simpan Perubahan' : 'Buat Brand'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Konfirmasi Hapus Brand */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-rose-600">
                            Konfirmasi Hapus Brand
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {brandToDelete && (brandToDelete.equipment_count ?? 0) > 0 ? (
                                <span className="text-rose-600 font-medium block">
                                    Brand "{brandToDelete?.name}" masih digunakan oleh <strong>{brandToDelete?.equipment_count} alat camping</strong>. Anda harus mengubah brand pada alat tersebut terlebih dahulu sebelum dapat menghapus brand ini.
                                </span>
                            ) : (
                                <span>
                                    Apakah Anda yakin ingin menghapus brand <strong>"{brandToDelete?.name}"</strong>? Tindakan ini tidak dapat dibatalkan.
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
                            disabled={deleting || ((brandToDelete?.equipment_count ?? 0) > 0)}
                            className="text-xs font-semibold"
                        >
                            {deleting ? 'Menghapus...' : 'Hapus Brand'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
