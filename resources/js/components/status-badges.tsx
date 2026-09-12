import React from 'react';
import { Shield, CreditCard, Layers, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type {
    RentalStatus,
    RentalPaymentStatus,
    DepositStatus,
    EquipmentUnitStatus,
    EquipmentUnitCondition,
} from '@/types';

export function RentalStatusBadge({ status }: { status: RentalStatus }) {
    switch (status) {
        case 'pending_dp':
            return (
                <Badge
                    variant="outline"
                    className="border-amber-500/30 bg-amber-50 font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                >
                    Menunggu Verifikasi DP
                </Badge>
            );
        case 'confirmed':
        case 'ready_pickup':
            return (
                <Badge
                    variant="outline"
                    className="border-blue-500/30 bg-blue-50 font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                >
                    Siap Diambil
                </Badge>
            );
        case 'active':
            return (
                <Badge
                    variant="outline"
                    className="border-amber-500/40 bg-amber-100 font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
                >
                    Sedang Disewa
                </Badge>
            );
        case 'completed':
            return (
                <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                    Selesai / Dikembalikan
                </Badge>
            );
        case 'cancelled':
            return (
                <Badge
                    variant="outline"
                    className="border-rose-500/30 bg-rose-50 font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                >
                    Dibatalkan
                </Badge>
            );
        case 'defaulted':
            return (
                <Badge
                    variant="outline"
                    className="border-rose-600/50 bg-rose-100 font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-200"
                >
                    Bermasalah / Barang Hilang
                </Badge>
            );
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
}

export function UserStatusBadge({
    status = 'active',
}: {
    status?: 'active' | 'suspended';
}) {
    if (status === 'suspended') {
        return (
            <Badge
                variant="outline"
                className="border-rose-500/40 bg-rose-50 font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
            >
                Ditangguhkan (Suspended)
            </Badge>
        );
    }

    return (
        <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
            Aktif
        </Badge>
    );
}

export function UserRoleBadge({
    role = 'customer',
}: {
    role?: 'admin' | 'kasir' | 'petugas_gudang' | 'customer' | string;
}) {
    switch (role) {
        case 'admin':
            return (
                <Badge
                    variant="outline"
                    className="border-purple-500/30 bg-purple-50 font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 gap-1"
                >
                    <Shield className="h-3 w-3" />
                    <span>Administrator</span>
                </Badge>
            );
        case 'kasir':
            return (
                <Badge
                    variant="outline"
                    className="border-amber-500/30 bg-amber-50 font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 gap-1"
                >
                    <CreditCard className="h-3 w-3" />
                    <span>Kasir & Keuangan</span>
                </Badge>
            );
        case 'petugas_gudang':
            return (
                <Badge
                    variant="outline"
                    className="border-blue-500/30 bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 gap-1"
                >
                    <Layers className="h-3 w-3" />
                    <span>Petugas Gudang</span>
                </Badge>
            );
        case 'customer':
        default:
            return (
                <Badge
                    variant="outline"
                    className="border-zinc-300 bg-zinc-50 font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 gap-1"
                >
                    <UserCheck className="h-3 w-3" />
                    <span>Pelanggan</span>
                </Badge>
            );
    }
}

export function PaymentStatusBadge({
    status,
}: {
    status: RentalPaymentStatus;
}) {
    switch (status) {
        case 'pending_dp':
            return (
                <Badge
                    variant="outline"
                    className="border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                >
                    Menunggu Verifikasi DP
                </Badge>
            );
        case 'dp_verified':
            return (
                <Badge
                    variant="outline"
                    className="border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                >
                    DP Terverifikasi
                </Badge>
            );
        case 'paid_in_full':
            return (
                <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                    Lunas (DP + COD)
                </Badge>
            );
        case 'dp_rejected':
            return (
                <Badge
                    variant="outline"
                    className="border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                >
                    DP Ditolak
                </Badge>
            );
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
}

export function DepositStatusBadge({ status }: { status: DepositStatus }) {
    switch (status) {
        case 'unpaid':
            return (
                <Badge variant="outline" className="text-muted-foreground">
                    Belum Bayar
                </Badge>
            );
        case 'held':
            return (
                <Badge
                    variant="outline"
                    className="border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                >
                    Ditahan Sebagai Jaminan
                </Badge>
            );
        case 'refunded':
            return (
                <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                    Telah Dikembalikan (Refund)
                </Badge>
            );
        case 'forfeited':
            return (
                <Badge
                    variant="outline"
                    className="border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                >
                    Disita / Ganti Rugi
                </Badge>
            );
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
}

export function UnitStatusBadge({ status }: { status: EquipmentUnitStatus }) {
    switch (status) {
        case 'tersedia':
            return (
                <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                    Tersedia
                </Badge>
            );
        case 'disewa':
            return (
                <Badge
                    variant="outline"
                    className="border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                >
                    Sedang Disewa
                </Badge>
            );
        case 'maintenance':
            return (
                <Badge
                    variant="outline"
                    className="border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                >
                    Maintenance
                </Badge>
            );
        case 'afkir':
            return (
                <Badge
                    variant="outline"
                    className="border-zinc-400 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                >
                    Afkir / Rusak Total
                </Badge>
            );
        case 'hilang':
            return (
                <Badge
                    variant="outline"
                    className="border-rose-600 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                >
                    Hilang / Tidak Kembali
                </Badge>
            );
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
}

export function UnitConditionBadge({
    condition,
}: {
    condition: EquipmentUnitCondition;
}) {
    switch (condition) {
        case 'baik':
            return (
                <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                    Kondisi Baik
                </Badge>
            );
        case 'butuh_perbaikan':
            return (
                <Badge
                    variant="outline"
                    className="border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                >
                    Butuh Perbaikan
                </Badge>
            );
        case 'rusak':
            return (
                <Badge
                    variant="outline"
                    className="border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                >
                    Rusak
                </Badge>
            );
        case 'hilang':
            return (
                <Badge
                    variant="outline"
                    className="border-rose-600 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                >
                    Hilang
                </Badge>
            );
        default:
            return <Badge variant="secondary">{condition}</Badge>;
    }
}
