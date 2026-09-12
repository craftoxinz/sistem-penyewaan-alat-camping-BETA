import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save, Plus, Trash2, UploadCloud, ShieldAlert } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { Brand, Category, Equipment } from '@/types';
import type { BreadcrumbItem } from '@/types';

interface EquipmentFormProps {
    categories: Category[];
    brands?: Brand[];
    equipment: Equipment | null;
}

export default function EquipmentForm({
    categories,
    brands = [],
    equipment,
}: EquipmentFormProps) {
    const isEdit = !!equipment;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Inventaris Alat',
            href: '/admin/equipment',
        },
        {
            title: 'Master Alat Camping',
            href: '/admin/equipment',
        },
        {
            title: isEdit ? `Edit: ${equipment.name}` : 'Tambah Alat Baru',
            href: isEdit
                ? `/admin/equipment/${equipment.id}/edit`
                : '/admin/equipment/create',
        },
    ];

    const [name, setName] = useState<string>(equipment?.name || '');
    const [categoryId, setCategoryId] = useState<string>(
        equipment?.category_id?.toString() || '',
    );
    const [brandId, setBrandId] = useState<string>(
        equipment?.brand_id ? equipment.brand_id.toString() : 'none',
    );
    const [pricePerDay, setPricePerDay] = useState<string>(
        equipment?.price_per_day?.toString() || '',
    );
    const [depositPerUnit, setDepositPerUnit] = useState<string>(
        equipment?.deposit_per_unit?.toString() || '0',
    );
    const [fineMinorDamage, setFineMinorDamage] = useState<string>(
        equipment?.fine_minor_damage?.toString() || '0',
    );
    const [fineHeavyDamage, setFineHeavyDamage] = useState<string>(
        equipment?.fine_heavy_damage?.toString() || '0',
    );
    const [fineLost, setFineLost] = useState<string>(
        equipment?.fine_lost?.toString() || '0',
    );
    const [description, setDescription] = useState<string>(
        equipment?.description || '',
    );
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(
        equipment?.image_url || null,
    );
    const [isActive, setIsActive] = useState<boolean>(
        equipment ? equipment.is_active : true,
    );
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Specifications Key-Value Array
    const initialSpecs = equipment?.specifications
        ? Object.entries(equipment.specifications).map(([key, value]) => ({
              key,
              value,
          }))
        : [
              { key: 'Kapasitas', value: '' },
              { key: 'Bahan/Material', value: '' },
              { key: 'Berat', value: '' },
          ];

    const [specs, setSpecs] =
        useState<Array<{ key: string; value: string }>>(initialSpecs);

    const handleAddSpecRow = () => {
        setSpecs([...specs, { key: '', value: '' }]);
    };

    const handleRemoveSpecRow = (index: number) => {
        setSpecs(specs.filter((_, i) => i !== index));
    };

    const handleSpecChange = (
        index: number,
        field: 'key' | 'value',
        val: string,
    ) => {
        const updated = [...specs];
        updated[index][field] = val;
        setSpecs(updated);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setImageFile(f);
            setImagePreview(URL.createObjectURL(f));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!categoryId) {
            toast.error('Pilih kategori alat terlebih dahulu.');

            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('category_id', categoryId);
        if (brandId && brandId !== 'none') {
            formData.append('brand_id', brandId);
        }
        formData.append('price_per_day', pricePerDay);
        formData.append('deposit_per_unit', depositPerUnit);
        formData.append('fine_minor_damage', fineMinorDamage || '0');
        formData.append('fine_heavy_damage', fineHeavyDamage || '0');
        formData.append('fine_lost', fineLost || '0');
        formData.append('description', description);
        formData.append('is_active', isActive ? '1' : '0');

        if (imageFile) {
            formData.append('image', imageFile);
        }

        // Convert specs array to Record<string, string>
        specs.forEach((item) => {
            if (item.key.trim() && item.value.trim()) {
                formData.append(
                    `specifications[${item.key.trim()}]`,
                    item.value.trim(),
                );
            }
        });

        setSubmitting(true);

        if (isEdit) {
            formData.append('_method', 'PUT');
            router.post(`/admin/equipment/${equipment.id}`, formData, {
                forceFormData: true,
                onSuccess: () =>
                    toast.success('Data alat camping berhasil diperbarui!'),
                onError: (err) => {
                    const firstError = Object.values(err)[0] as string;
                    toast.error(
                        firstError || 'Gagal memperbarui alat camping.',
                    );
                },
                onFinish: () => setSubmitting(false),
            });
        } else {
            router.post('/admin/equipment', formData, {
                forceFormData: true,
                onSuccess: () =>
                    toast.success('Alat camping baru berhasil ditambahkan!'),
                onError: (err) => {
                    const firstError = Object.values(err)[0] as string;
                    toast.error(firstError || 'Gagal menambahkan alat camping.');
                },
                onFinish: () => setSubmitting(false),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={
                    isEdit
                        ? `Edit ${equipment.name} - Admin`
                        : 'Tambah Alat Camping - Admin'
                }
            />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isEdit
                                ? 'Edit Data Alat Camping'
                                : 'Tambah Alat Camping Baru'}
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Isi detail spesifikasi, tarif harian sewa, deposit
                            jaminan, dan gambar produk.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-1.5 text-xs"
                    >
                        <Link href="/admin/equipment">
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>Kembali</span>
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info Card */}
                    <Card className="border-border shadow-none">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold">
                                Informasi Utama Alat
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Nama, kategori, brand merk, dan deskripsi produk untuk
                                katalog penyewa.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="space-y-1.5 sm:col-span-1">
                                    <Label
                                        htmlFor="name"
                                        className="text-xs font-semibold"
                                    >
                                        Nama Alat Camping *
                                    </Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        placeholder="Contoh: Tenda Dome Arpenaz 4.1"
                                        className="h-9 text-xs"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-1">
                                    <Label className="text-xs font-semibold">
                                        Kategori Alat *
                                    </Label>
                                    <Select
                                        value={categoryId}
                                        onValueChange={setCategoryId}
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Pilih Kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
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

                                <div className="space-y-1.5 sm:col-span-1">
                                    <Label className="text-xs font-semibold">
                                        Brand / Merk (Opsional)
                                    </Label>
                                    <Select
                                        value={brandId}
                                        onValueChange={setBrandId}
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Pilih Brand (Opsional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                Tanpa Brand / Generic
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

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="price"
                                        className="text-xs font-semibold"
                                    >
                                        Tarif Sewa Per Hari (Rp) *
                                    </Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={pricePerDay}
                                        onChange={(e) =>
                                            setPricePerDay(e.target.value)
                                        }
                                        placeholder="45000"
                                        className="h-9 font-mono text-xs"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="deposit"
                                        className="text-xs font-semibold"
                                    >
                                        Uang Jaminan Deposit Per Unit (Rp) *
                                    </Label>
                                    <Input
                                        id="deposit"
                                        type="number"
                                        value={depositPerUnit}
                                        onChange={(e) =>
                                            setDepositPerUnit(e.target.value)
                                        }
                                        placeholder="50000"
                                        className="h-9 font-mono text-xs"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Standar Tarif Denda Kerusakan & Kehilangan */}
                            <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                                <div className="flex items-start gap-2.5">
                                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                    <div>
                                        <h4 className="text-xs font-bold text-foreground">
                                            Standar Tarif Denda Kerusakan & Kehilangan
                                        </h4>
                                        <p className="text-[11px] text-muted-foreground">
                                            Tarif acuan otomatis saat barang dikembalikan oleh penyewa. Sistem akan otomatis mengisi denda sesuai tingkat kerusakan unit dan jenis barang, namun admin tetap dapat menyesuaikannya bila diperlukan.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="space-y-1 rounded-lg border border-border/70 bg-card p-2.5">
                                        <Label
                                            htmlFor="fine_minor"
                                            className="text-[11px] font-semibold text-foreground flex items-center justify-between"
                                        >
                                            <span>Kerusakan Ringan/Sedang</span>
                                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">Butuh Servis</span>
                                        </Label>
                                        <Input
                                            id="fine_minor"
                                            type="number"
                                            value={fineMinorDamage}
                                            onChange={(e) =>
                                                setFineMinorDamage(e.target.value)
                                            }
                                            placeholder="Contoh: 150000"
                                            className="h-8 font-mono text-xs"
                                            min="0"
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            Sobek kecil, resleting macet, tali putus, kotor butuh laundry.
                                        </p>
                                    </div>

                                    <div className="space-y-1 rounded-lg border border-border/70 bg-card p-2.5">
                                        <Label
                                            htmlFor="fine_heavy"
                                            className="text-[11px] font-semibold text-foreground flex items-center justify-between"
                                        >
                                            <span>Kerusakan Berat</span>
                                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-normal">Rusak Parah</span>
                                        </Label>
                                        <Input
                                            id="fine_heavy"
                                            type="number"
                                            value={fineHeavyDamage}
                                            onChange={(e) =>
                                                setFineHeavyDamage(e.target.value)
                                            }
                                            placeholder="Contoh: 350000"
                                            className="h-8 font-mono text-xs"
                                            min="0"
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            Frame patah, kain robek besar/terbakar, komponen rusak total.
                                        </p>
                                    </div>

                                    <div className="space-y-1 rounded-lg border border-border/70 bg-card p-2.5">
                                        <Label
                                            htmlFor="fine_lost"
                                            className="text-[11px] font-semibold text-foreground flex items-center justify-between"
                                        >
                                            <span>Kehilangan / Afkir</span>
                                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-normal">Ganti Baru</span>
                                        </Label>
                                        <Input
                                            id="fine_lost"
                                            type="number"
                                            value={fineLost}
                                            onChange={(e) =>
                                                setFineLost(e.target.value)
                                            }
                                            placeholder="Contoh: 650000"
                                            className="h-8 font-mono text-xs"
                                            min="0"
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            Unit hilang, tidak dikembalikan, atau rusak total tak bisa diperbaiki.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="description"
                                    className="text-xs font-semibold"
                                >
                                    Deskripsi Lengkap *
                                </Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLTextAreaElement>,
                                    ) => setDescription(e.target.value)}
                                    placeholder="Jelaskan fitur, keunggulan, kapasitas, dan instruksi ringkas pemakaian..."
                                    className="h-28 resize-none text-xs"
                                    required
                                />
                            </div>

                            {/* Photo Upload & Preview */}
                            <div className="space-y-2 pt-2">
                                <Label className="text-xs font-semibold">
                                    Foto Produk
                                </Label>
                                <div className="flex flex-col items-start gap-4 sm:flex-row">
                                    {imagePreview && (
                                        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 space-y-1.5">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="h-9 cursor-pointer text-xs file:text-xs"
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            Format: JPG, PNG, WEBP (Maksimal
                                            3MB).
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox
                                    id="is_active"
                                    checked={isActive}
                                    onCheckedChange={(checked) =>
                                        setIsActive(!!checked)
                                    }
                                />
                                <Label
                                    htmlFor="is_active"
                                    className="cursor-pointer text-xs font-medium"
                                >
                                    Tampilkan di katalog publik (Aktif)
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Specifications Card */}
                    <Card className="border-border shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-sm font-bold">
                                    Spesifikasi Teknis
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Tambahkan atribut spesifikasi seperti
                                    dimensi, material, kapasitas, dll.
                                </CardDescription>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddSpecRow}
                                className="h-8 gap-1 text-xs"
                            >
                                <Plus className="h-3 w-3" />
                                <span>Tambah Baris</span>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {specs.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2"
                                >
                                    <Input
                                        placeholder="Nama Spesifikasi (mis. Material)"
                                        value={item.key}
                                        onChange={(e) =>
                                            handleSpecChange(
                                                idx,
                                                'key',
                                                e.target.value,
                                            )
                                        }
                                        className="h-9 flex-1 text-xs"
                                    />
                                    <Input
                                        placeholder="Nilai (mis. 20D Nylon 4000mm)"
                                        value={item.value}
                                        onChange={(e) =>
                                            handleSpecChange(
                                                idx,
                                                'value',
                                                e.target.value,
                                            )
                                        }
                                        className="h-9 flex-1 text-xs"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveSpecRow(idx)}
                                        className="h-9 w-9 shrink-0 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Submit Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            asChild
                        >
                            <Link href="/admin/equipment">Batal</Link>
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={submitting}
                            className="gap-1.5 bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                        >
                            <Save className="h-3.5 w-3.5" />
                            <span>
                                {submitting
                                    ? 'Menyimpan...'
                                    : isEdit
                                      ? 'Perbarui Alat'
                                      : 'Simpan Alat Baru'}
                            </span>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
