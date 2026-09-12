import { Head, router, usePage } from '@inertiajs/react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Users,
    Shield,
    UserCheck,
    Phone,
    MapPin,
    Calendar,
    ShoppingBag,
    UserX,
    User as UserIcon,
    CreditCard,
    Layers,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { UserStatusBadge, UserRoleBadge } from '@/components/status-badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
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
import type { BreadcrumbItem, User, PaginatedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Manajemen Akun',
        href: '/admin/users',
    },
    {
        title: 'Kelola Pengguna',
        href: '/admin/users',
    },
];

interface UserWithMeta extends User {
    rentals_count?: number;
}

interface UsersIndexProps {
    users: PaginatedData<UserWithMeta>;
    stats: {
        total_users: number;
        total_admins: number;
        total_cashiers?: number;
        total_warehouse_staff?: number;
        total_customers: number;
        active_renters: number;
        total_suspended: number;
    };
    filters: {
        search: string;
        role: string;
        status?: string;
    };
}

export default function UsersIndex({ users, stats, filters }: UsersIndexProps) {
    const page = usePage<{ auth: { user: User } }>();
    const currentAuthUser = page.props.auth?.user;

    // Form Modal state
    const [formModalOpen, setFormModalOpen] = useState<boolean>(false);
    const [editingUser, setEditingUser] = useState<UserWithMeta | null>(null);
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [role, setRole] = useState<'admin' | 'kasir' | 'petugas_gudang' | 'customer'>('customer');
    const [status, setStatus] = useState<'active' | 'suspended'>('active');
    const [phone, setPhone] = useState<string>('');
    const [address, setAddress] = useState<string>('');
    const [saving, setSaving] = useState<boolean>(false);

    // Delete Modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [userToDelete, setUserToDelete] = useState<UserWithMeta | null>(null);
    const [deleting, setDeleting] = useState<boolean>(false);

    const openCreateModal = () => {
        setEditingUser(null);
        setName('');
        setEmail('');
        setPassword('');
        setRole('customer');
        setStatus('active');
        setPhone('');
        setAddress('');
        setFormModalOpen(true);
    };

    const openEditModal = (target: UserWithMeta) => {
        setEditingUser(target);
        setName(target.name);
        setEmail(target.email);
        setPassword('');
        setRole(target.role);
        setStatus(target.status || 'active');
        setPhone(target.phone || '');
        setAddress(target.address || '');
        setFormModalOpen(true);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const payload: Record<string, string> = {
            name,
            email,
            role,
            status,
            phone,
            address,
        };

        if (password.trim()) {
            payload.password = password;
        }

        if (editingUser) {
            router.put(`/admin/users/${editingUser.id}`, payload, {
                onSuccess: () => {
                    toast.success('Data pengguna berhasil diperbarui.');
                    setFormModalOpen(false);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    toast.error(typeof firstError === 'string' ? firstError : 'Gagal memperbarui pengguna.');
                },
                onFinish: () => setSaving(false),
            });
        } else {
            router.post('/admin/users', payload, {
                onSuccess: () => {
                    toast.success('Pengguna baru berhasil ditambahkan.');
                    setFormModalOpen(false);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    toast.error(typeof firstError === 'string' ? firstError : 'Gagal menambahkan pengguna.');
                },
                onFinish: () => setSaving(false),
            });
        }
    };

    const handleToggleStatus = (target: UserWithMeta) => {
        if (target.id === currentAuthUser?.id) {
            toast.error('Anda tidak dapat menangguhkan akun Anda sendiri.');
            return;
        }

        const newStatus = target.status === 'suspended' ? 'active' : 'suspended';
        router.put(`/admin/users/${target.id}`, {
            name: target.name,
            email: target.email,
            role: target.role,
            status: newStatus,
            phone: target.phone || '',
            address: target.address || '',
        }, {
            onSuccess: () => {
                toast.success(newStatus === 'active' ? 'Akun berhasil diaktifkan kembali!' : 'Akun berhasil ditangguhkan.');
            },
            onError: (err) => {
                const msg = Object.values(err)[0] || 'Gagal mengubah status akun.';
                toast.error(typeof msg === 'string' ? msg : 'Gagal mengubah status.');
            },
        });
    };

    const openDeleteDialog = (target: UserWithMeta) => {
        setUserToDelete(target);
        setDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (!userToDelete) return;
        setDeleting(true);

        router.delete(`/admin/users/${userToDelete.id}`, {
            onSuccess: () => {
                toast.success('Pengguna berhasil dihapus.');
                setDeleteModalOpen(false);
                setUserToDelete(null);
            },
            onError: (err) => {
                const msg = err.error || 'Gagal menghapus pengguna.';
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
            '/admin/users',
            { ...filters, search },
            { preserveState: true }
        );
    };

    const handleRoleFilter = (roleVal: string) => {
        router.get(
            '/admin/users',
            { ...filters, role: roleVal === 'all' ? '' : roleVal },
            { preserveState: true }
        );
    };

    const handleStatusFilter = (statusVal: string) => {
        router.get(
            '/admin/users',
            { ...filters, status: statusVal === 'all' ? '' : statusVal },
            { preserveState: true }
        );
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Pengguna - Admin" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Kelola Pengguna</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Kelola akun Administrator, Kasir, Petugas Gudang, dan Pelanggan penyewa.
                        </p>
                    </div>

                    <Button
                        type="button"
                        size="sm"
                        onClick={openCreateModal}
                        className="h-9 gap-1.5 bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shrink-0"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Tambah Pengguna</span>
                    </Button>
                </div>

                {/* Stats Cards (5 Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-1.5 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase">
                                Total Pengguna
                            </CardTitle>
                            <Users className="h-4 w-4 text-zinc-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-extrabold font-variant-numeric tabular-nums text-foreground">
                                {stats.total_users} Akun
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                Seluruh akun terdaftar
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-1.5 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase">
                                Administrator
                            </CardTitle>
                            <Shield className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-extrabold font-variant-numeric tabular-nums text-purple-600 dark:text-purple-400">
                                {stats.total_admins} Admin
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                Superuser / Akses penuh
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-1.5 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase">
                                Kasir & Keuangan
                            </CardTitle>
                            <CreditCard className="h-4 w-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-extrabold font-variant-numeric tabular-nums text-amber-600 dark:text-amber-400">
                                {stats.total_cashiers || 0} Kasir
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                Transaksi DP & COD
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-1.5 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase">
                                Petugas Gudang
                            </CardTitle>
                            <Layers className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-extrabold font-variant-numeric tabular-nums text-blue-600 dark:text-blue-400">
                                {stats.total_warehouse_staff || 0} Staff
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                Logistik & Unit Fisik
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-none bg-card">
                        <CardHeader className="pb-1.5 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase">
                                Pelanggan Aktif
                            </CardTitle>
                            <UserCheck className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-extrabold font-variant-numeric tabular-nums text-emerald-700 dark:text-emerald-400">
                                {stats.total_customers - (stats.total_suspended || 0)} Akun
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                {stats.active_renters} pernah menyewa
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
                                        placeholder="Cari nama pengguna, email, atau no. telepon..."
                                        className="pl-9 h-9 text-xs"
                                    />
                                </div>
                                <Button type="submit" size="sm" variant="secondary" className="h-9 text-xs font-semibold px-4">
                                    Cari
                                </Button>
                            </form>

                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                                <div className="w-full sm:w-44 shrink-0">
                                    <Select value={filters.role || 'all'} onValueChange={handleRoleFilter}>
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Semua Peran" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Peran</SelectItem>
                                            <SelectItem value="admin">Administrator</SelectItem>
                                            <SelectItem value="kasir">Kasir & Keuangan</SelectItem>
                                            <SelectItem value="petugas_gudang">Petugas Gudang</SelectItem>
                                            <SelectItem value="customer">Pelanggan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="w-full sm:w-40 shrink-0">
                                    <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Semua Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Status</SelectItem>
                                            <SelectItem value="active">Aktif (Normal)</SelectItem>
                                            <SelectItem value="suspended">Ditangguhkan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card className="border-border shadow-none bg-card">
                    <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between border-b border-border">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <span>Daftar Akun Pengguna</span>
                            <Badge variant="secondary" className="font-mono text-xs">
                                {users.total} Data
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left whitespace-nowrap">
                                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold text-[10px]">
                                    <tr>
                                        <th className="px-4 py-3 whitespace-nowrap">Pengguna</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Peran (Role)</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Kontak & Alamat</th>
                                        <th className="px-4 py-3 text-center whitespace-nowrap">Total Sewa</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Terdaftar</th>
                                        <th className="px-4 py-3 text-right whitespace-nowrap">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {users.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground whitespace-nowrap">
                                                Tidak ada data pengguna yang sesuai dengan filter pencarian.
                                            </td>
                                        </tr>
                                    ) : (
                                        users.data.map((u) => {
                                            const isSelf = currentAuthUser?.id === u.id;
                                            const isSuspended = u.status === 'suspended';

                                            return (
                                                <tr key={u.id} className={`hover:bg-muted/30 transition-colors ${isSuspended ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''}`}>
                                                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${isSuspended ? 'bg-rose-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                                                                {u.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div className="truncate max-w-[180px]">
                                                                <div className="font-semibold text-foreground flex items-center gap-1.5">
                                                                    <span className="truncate">{u.name}</span>
                                                                    {isSelf && (
                                                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                                            Anda
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            <div className="text-[11px] text-muted-foreground truncate">
                                                                {u.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <UserRoleBadge role={u.role} />
                                                </td>

                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <UserStatusBadge status={u.status || 'active'} />
                                                </td>

                                                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                                    <div className="space-y-0.5">
                                                        {u.phone ? (
                                                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-foreground">
                                                                <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                                                                <span>{u.phone}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] italic text-muted-foreground/70">Tanpa no. telepon</span>
                                                        )}
                                                        {u.address && (
                                                            <div className="flex items-start gap-1.5 text-[11px] line-clamp-1 max-w-[200px]" title={u.address}>
                                                                <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                                                                <span className="truncate">{u.address}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <Badge variant="secondary" className="text-[10px] font-semibold">
                                                            {u.rentals_count ?? 0} Transaksi
                                                        </Badge>
                                                    </td>

                                                    <td className="px-4 py-3 text-[11px] text-muted-foreground whitespace-nowrap">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                                                            <span>{formatDate(u.created_at)}</span>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {!isSelf && (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleToggleStatus(u)}
                                                                    className={`h-7 text-xs font-semibold px-2.5 ${isSuspended ? 'border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400' : 'border-amber-500 text-amber-700 hover:bg-amber-50 dark:text-amber-400'}`}
                                                                    title={isSuspended ? 'Aktifkan kembali akun ini' : 'Tangguhkan akun ini'}
                                                                >
                                                                    {isSuspended ? 'Aktifkan' : 'Suspend'}
                                                                </Button>
                                                            )}

                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openEditModal(u)}
                                                                className="h-7 text-xs font-semibold gap-1 px-2.5"
                                                            >
                                                                <Edit2 className="h-3 w-3" />
                                                                <span>Edit</span>
                                                            </Button>

                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openDeleteDialog(u)}
                                                                disabled={isSelf}
                                                                className="h-7 text-xs font-semibold gap-1 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-30"
                                                                title={isSelf ? 'Anda tidak dapat menghapus akun sendiri' : 'Hapus pengguna'}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                                <span>Hapus</span>
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
                    </CardContent>
                </Card>

                {/* Pagination */}
                <DataTablePagination pagination={users} />
            </div>

            {/* Modal Form Tambah / Edit Pengguna */}
            <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">
                            {editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Lengkapi informasi profil akun administrator atau pelanggan penyewa.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Nama Lengkap <span className="text-rose-500">*</span></Label>
                            <Input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Contoh: Muhammad Rizki"
                                className="h-9 text-xs"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Alamat Email <span className="text-rose-500">*</span></Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nama@email.com"
                                className="h-9 text-xs"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">
                                    Peran Akun <span className="text-rose-500">*</span>
                                </Label>
                                <Select value={role} onValueChange={(val: 'admin' | 'kasir' | 'petugas_gudang' | 'customer') => setRole(val)}>
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue placeholder="Pilih Peran" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="customer">Pelanggan (Penyewa)</SelectItem>
                                        <SelectItem value="kasir">Kasir & Keuangan (Transaksi & Laporan)</SelectItem>
                                        <SelectItem value="petugas_gudang">Petugas Gudang (Operasional & Fisik)</SelectItem>
                                        <SelectItem value="admin">Administrator (Akses Penuh)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">
                                    Status Akun <span className="text-rose-500">*</span>
                                </Label>
                                <Select value={status} onValueChange={(val: 'active' | 'suspended') => setStatus(val)} disabled={editingUser?.id === currentAuthUser?.id}>
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue placeholder="Pilih Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Aktif (Normal)</SelectItem>
                                        <SelectItem value="suspended">Ditangguhkan (Suspended)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">
                                    {editingUser ? 'Password Baru (Opsional)' : 'Password Akun *'}
                                </Label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={editingUser ? 'Kosongkan jika tetap' : 'Min. 8 karakter'}
                                    className="h-9 text-xs font-mono"
                                    required={!editingUser}
                                    minLength={8}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">No. Telepon / WhatsApp</Label>
                                <Input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="081234567890"
                                    className="h-9 text-xs font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Alamat Domisili</Label>
                            <Textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Jl. Raya No. 123, Kota..."
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
                                disabled={saving || !name.trim() || !email.trim()}
                                className="text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                            >
                                {saving ? 'Menyimpan...' : editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Konfirmasi Hapus Pengguna */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-rose-600">
                            Konfirmasi Hapus Pengguna
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {userToDelete?.id === currentAuthUser?.id ? (
                                <span className="text-rose-600 font-medium block">
                                    Anda tidak dapat menghapus akun Anda sendiri yang sedang digunakan saat ini.
                                </span>
                            ) : (
                                <span>
                                    Apakah Anda yakin ingin menghapus akun pengguna <strong>"{userToDelete?.name}"</strong> ({userToDelete?.email})? Tindakan ini tidak dapat dibatalkan.
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
                            disabled={deleting || userToDelete?.id === currentAuthUser?.id}
                            className="text-xs font-semibold"
                        >
                            {deleting ? 'Menghapus...' : 'Hapus Pengguna'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
