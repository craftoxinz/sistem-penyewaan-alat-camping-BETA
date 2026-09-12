import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Printer,
    ArrowLeft,
    Tent,
    Calendar,
    UploadCloud,
    CheckCircle2,
    Clock,
    AlertCircle,
    User as UserIcon,
    Phone,
    MapPin,
    CreditCard,
    Shield,
    Star,
    MessageSquare,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import {
    RentalStatusBadge,
    PaymentStatusBadge,
    DepositStatusBadge,
} from '@/components/status-badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import CustomerLayout from '@/layouts/customer-layout';
import { formatRupiah, formatDate, formatDateTime } from '@/lib/formatters';
import type { Rental, User } from '@/types';

interface BookingShowProps {
    rental: Rental;
}

export default function BookingShow({ rental }: BookingShowProps) {
    const { auth } = usePage<{ auth: { user: User | null } }>().props;
    const isStaff = auth?.user && auth.user.role !== 'customer';

    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);

    // Review Modal State (SRS-F-014)
    const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
    const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
    const [rating, setRating] = useState<number>(5);
    const [comment, setComment] = useState<string>('');
    const [submittingReview, setSubmittingReview] = useState<boolean>(false);

    const openReviewDialog = (equipmentId?: number) => {
        const targetEqId = equipmentId
            ? equipmentId.toString()
            : rental.items?.[0]?.equipment_id?.toString() || '';
        setSelectedEquipmentId(targetEqId);

        const existingReview = rental.reviews?.find(
            (r) => r.equipment_id.toString() === targetEqId,
        );
        if (existingReview) {
            setRating(existingReview.rating);
            setComment(existingReview.comment || '');
        } else {
            setRating(5);
            setComment('');
        }
        setReviewModalOpen(true);
    };

    const handleEquipmentChangeForReview = (eqId: string) => {
        setSelectedEquipmentId(eqId);
        const existingReview = rental.reviews?.find(
            (r) => r.equipment_id.toString() === eqId,
        );
        if (existingReview) {
            setRating(existingReview.rating);
            setComment(existingReview.comment || '');
        } else {
            setRating(5);
            setComment('');
        }
    };

    const submitReview = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEquipmentId) {
            return;
        }

        setSubmittingReview(true);
        router.post(
            '/reviews',
            {
                rental_id: rental.id,
                equipment_id: parseInt(selectedEquipmentId),
                rating,
                comment,
            },
            {
                onSuccess: () => {
                    setReviewModalOpen(false);
                    toast.success(
                        'Ulasan dan rating Anda berhasil disimpan. Terima kasih!',
                    );
                },
                onError: (err) => {
                    toast.error(
                        (Object.values(err)[0] as string) ||
                            'Gagal menyimpan ulasan.',
                    );
                },
                onFinish: () => setSubmittingReview(false),
            },
        );
    };

    const handleUploadProof = (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            toast.error('Pilih file gambar bukti transfer terlebih dahulu.');

            return;
        }

        const formData = new FormData();
        formData.append('dp_proof', file);

        setUploading(true);
        router.post(`/bookings/${rental.id}/dp-proof`, formData, {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Bukti transfer DP berhasil diunggah!');
                setFile(null);
            },
            onError: (err) => {
                toast.error(
                    (Object.values(err)[0] as string) ||
                        'Gagal mengunggah bukti.',
                );
            },
            onFinish: () => setUploading(false),
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <CustomerLayout>
            <Head title={`Invoice ${rental.invoice_number} - CampRental`} />

            <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                {/* Top Action Bar (hidden when printing) */}
                <div className="flex items-center justify-between gap-4 print:hidden">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-xs"
                    >
                        <Link href={isStaff ? '/admin/rentals' : '/bookings'}>
                            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                            {isStaff ? 'Kembali ke Kelola Pesanan' : 'Kembali ke Pesanan Saya'}
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrint}
                        className="gap-1.5 text-xs"
                    >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Cetak Invoice</span>
                    </Button>
                </div>

                {/* Printable Invoice Container */}
                <Card className="border-border bg-card shadow-sm print:border-none print:shadow-none">
                    <CardContent className="space-y-8 p-6 sm:p-10">
                        {/* Header: Company & Invoice Info */}
                        <div className="flex flex-col justify-between gap-6 border-b border-border pb-6 sm:flex-row sm:items-start">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                                        <Tent className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg leading-none font-extrabold tracking-tight">
                                            CampRental
                                        </h2>
                                        <span className="text-[11px] text-muted-foreground">
                                            Sistem Penyewaan Alat Camping
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Jl. Riau No. 45, Bandung &bull; Telp/WA:
                                    0812-3456-7890
                                </p>
                            </div>

                            <div className="space-y-1 text-left sm:text-right">
                                <span className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    FAKTUR INVOICE RESMI
                                </span>
                                <div className="font-mono text-lg font-bold text-foreground">
                                    {rental.invoice_number}
                                </div>
                                <div className="font-mono text-xs font-medium text-foreground">
                                    Ref. Kode Booking:{' '}
                                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-bold dark:bg-zinc-800">
                                        {rental.booking_code}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Tanggal Terbit:{' '}
                                    {formatDate(rental.created_at)}
                                </div>
                                <div className="flex flex-wrap justify-start gap-1.5 pt-1 sm:justify-end">
                                    <RentalStatusBadge
                                        status={rental.rental_status}
                                    />
                                    <PaymentStatusBadge
                                        status={rental.payment_status}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Customer & Rental Schedule Info */}
                        <div className="grid grid-cols-1 gap-6 text-xs sm:grid-cols-2">
                            {/* Customer Details */}
                            <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
                                <span className="block text-xs font-semibold tracking-wider text-foreground uppercase">
                                    Informasi Penyewa:
                                </span>
                                <div className="space-y-1 text-muted-foreground">
                                    <div className="flex items-center gap-2 font-medium text-foreground">
                                        <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>{rental.user?.name}</span>
                                    </div>
                                    <div>Email: {rental.user?.email}</div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>{rental.user?.phone || '-'}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        <span>
                                            {rental.user?.address || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Schedule & Notes */}
                            <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
                                <span className="block text-xs font-semibold tracking-wider text-foreground uppercase">
                                    Jadwal Sewa & Catatan:
                                </span>
                                <div className="space-y-1.5 text-muted-foreground">
                                    <div className="flex justify-between">
                                        <span>Tanggal Mulai (Ambil):</span>
                                        <span className="font-semibold text-foreground">
                                            {formatDate(rental.start_date)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tanggal Selesai (Kembali):</span>
                                        <span className="font-semibold text-foreground">
                                            {formatDate(rental.end_date)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Durasi:</span>
                                        <span className="font-semibold text-foreground">
                                            {rental.total_days} Hari
                                        </span>
                                    </div>
                                    {rental.customer_notes && (
                                        <div className="pt-1 text-[11px] italic">
                                            Catatan: "{rental.customer_notes}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Itemized Table (SRS-F-006) */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-foreground">
                                Rincian Peralatan Disewa
                            </h3>
                            <div className="overflow-x-auto rounded-xl border border-border">
                                <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/60 text-muted-foreground">
                                            <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                                Alat Camping
                                            </th>
                                            <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">
                                                Qty
                                            </th>
                                            <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                                                Tarif / Hari
                                            </th>
                                            <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                                                Subtotal Sewa
                                            </th>
                                            <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                                                Jaminan (Deposit)
                                            </th>
                                            <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                                Unit Fisik
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {rental.items?.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-muted/20"
                                            >
                                                <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                                                    <div>
                                                        {item.equipment?.name}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        {
                                                            item.equipment
                                                                ?.category?.name
                                                        }
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center font-bold whitespace-nowrap">
                                                    {item.quantity}
                                                </td>
                                                <td className="font-variant-numeric px-4 py-3 text-right tabular-nums whitespace-nowrap">
                                                    {formatRupiah(
                                                        item.price_per_day,
                                                    )}
                                                </td>
                                                <td className="font-variant-numeric px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap">
                                                    {formatRupiah(
                                                        item.subtotal_price,
                                                    )}
                                                </td>
                                                <td className="font-variant-numeric px-4 py-3 text-right text-muted-foreground tabular-nums whitespace-nowrap">
                                                    {formatRupiah(
                                                        item.subtotal_deposit,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {item.item_units &&
                                                    item.item_units.length >
                                                        0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {item.item_units.map(
                                                                (iu) => (
                                                                    <span
                                                                        key={
                                                                            iu.id
                                                                        }
                                                                        className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900"
                                                                    >
                                                                        {
                                                                            iu
                                                                                .equipment_unit
                                                                                ?.unit_code
                                                                        }
                                                                    </span>
                                                                ),
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] text-muted-foreground italic">
                                                            Dipilih saat serah
                                                            terima
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Financial Totals Calculation Box */}
                        <div className="grid grid-cols-1 gap-6 pt-2 sm:grid-cols-2">
                            {/* Left: Deposit & COD Notes */}
                            <div className="space-y-3 text-xs">
                                <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-4">
                                    <div className="flex items-center justify-between font-semibold text-foreground">
                                        <span>Status Jaminan (Deposit):</span>
                                        <DepositStatusBadge
                                            status={rental.deposit_status}
                                        />
                                    </div>
                                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                                        Deposit sebesar{' '}
                                        <strong className="text-foreground">
                                            {formatRupiah(rental.total_deposit)}
                                        </strong>{' '}
                                        akan ditahan selama masa sewa dan
                                        dikembalikan penuh saat barang kembali
                                        lengkap & tidak rusak.
                                    </p>
                                    {rental.deposit_status === 'refunded' && (
                                        <div className="pt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                            ✓ Deposit telah dikembalikan:{' '}
                                            {formatRupiah(
                                                rental.deposit_refund_amount,
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Payment Breakdown */}
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal Biaya Sewa:</span>
                                    <span className="font-variant-numeric font-semibold text-foreground tabular-nums">
                                        {formatRupiah(rental.subtotal_price)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Total Deposit Jaminan:</span>
                                    <span className="font-variant-numeric font-semibold text-foreground tabular-nums">
                                        {formatRupiah(rental.total_deposit)}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t border-border pt-2 text-base font-extrabold text-foreground">
                                    <span>Grand Total:</span>
                                    <span className="font-variant-numeric tabular-nums">
                                        {formatRupiah(rental.total_price)}
                                    </span>
                                </div>

                                {Number(rental.total_fine || 0) > 0 && (
                                    <div className="space-y-1.5 rounded-xl border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-900/50 dark:bg-rose-950/20 text-xs">
                                        <div className="font-bold text-rose-800 dark:text-rose-300 flex items-center justify-between">
                                            <span>Denda & Ganti Rugi:</span>
                                            <span className="font-mono">{formatRupiah(rental.total_fine)}</span>
                                        </div>
                                        {Number(rental.late_fee || 0) > 0 && (
                                            <div className="flex justify-between text-muted-foreground text-[11px]">
                                                <span>• Denda Terlambat ({rental.late_days} hari):</span>
                                                <span className="font-mono">{formatRupiah(rental.late_fee)}</span>
                                            </div>
                                        )}
                                        {Number(rental.damage_fee || 0) > 0 && (
                                            <>
                                                <div className="flex justify-between text-muted-foreground text-[11px]">
                                                    <span>• Biaya Kerusakan / Kehilangan:</span>
                                                    <span className="font-mono">{formatRupiah(rental.damage_fee)}</span>
                                                </div>
                                                {rental.items?.flatMap((item) => item.item_units || []).some((iu) => Number(iu.damage_fee || 0) > 0) && (
                                                    <div className="ml-2 pl-2 border-l border-rose-300 dark:border-rose-900/60 space-y-0.5 text-[10px] text-muted-foreground">
                                                        {rental.items?.flatMap((item) =>
                                                            (item.item_units || [])
                                                                .filter((iu) => Number(iu.damage_fee || 0) > 0)
                                                                .map((iu) => (
                                                                    <div key={iu.id} className="flex justify-between">
                                                                        <span>
                                                                            - {iu.equipment_unit?.unit_code} ({item.equipment?.name}):
                                                                        </span>
                                                                        <span className="font-mono font-medium text-foreground">
                                                                            {formatRupiah(iu.damage_fee || 0)}
                                                                        </span>
                                                                    </div>
                                                                )),
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {Number(rental.additional_charge_paid || 0) > 0 && (
                                            <div className="flex justify-between text-rose-700 dark:text-rose-400 font-semibold text-[11px] border-t border-rose-200/60 pt-1">
                                                <span>Pelunasan Tagihan Tambahan Kasir:</span>
                                                <span className="font-mono">{formatRupiah(rental.additional_charge_paid)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="mt-2 space-y-2 rounded-xl border border-border/80 bg-zinc-100 p-3.5 dark:bg-zinc-800/90">
                                    {Number(rental.remaining_amount) === 0 ? (
                                        <>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                <CheckCircle2 className="h-4 w-4" />
                                                <span>Pembayaran Lunas 100% (Transfer di Muka)</span>
                                            </div>
                                            <div className="flex justify-between text-xs font-semibold text-foreground">
                                                <span>Total Ditransfer:</span>
                                                <span className="font-variant-numeric tabular-nums">
                                                    {formatRupiah(rental.dp_amount)}
                                                </span>
                                            </div>
                                            <div className="border-t border-border/60 pt-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                                                ✓ Saat ambil alat di toko — <strong>tidak ada sisa tagihan COD.</strong> Deposit jaminan akan dikembalikan utuh setelah pengembalian alat.
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                <span>Uang Muka (DP 30% Transfer):</span>
                                                <span className="font-variant-numeric tabular-nums">
                                                    {formatRupiah(rental.dp_amount)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs font-semibold text-foreground">
                                                <span>Pelunasan Sisa Tunai / COD:</span>
                                                <span className="font-variant-numeric tabular-nums">
                                                    {formatRupiah(rental.remaining_amount)}
                                                </span>
                                            </div>
                                            <div className="border-t border-border/60 pt-1 text-[10px] text-muted-foreground">
                                                {rental.cod_paid_at ? (
                                                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                                        ✓ Pelunasan COD telah lunas pada{' '}
                                                        {formatDateTime(rental.cod_paid_at)}
                                                    </span>
                                                ) : (
                                                    <span>*Sisa tagihan dibayarkan saat mengambil alat camping di toko.</span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* DP Transfer & Proof Upload Section (SRS-F-015, SRS-F-016) (Hidden when printing) */}
                        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 print:hidden">
                            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                                <CreditCard className="h-4 w-4 text-blue-600" />
                                <span>
                                    {Number(rental.remaining_amount) === 0
                                        ? 'Verifikasi Pembayaran Lunas (Full Payment)'
                                        : 'Verifikasi Pembayaran DP (Down Payment)'}
                                </span>
                            </h3>

                            <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
                                <div className="space-y-2 rounded-xl border border-blue-500/20 bg-blue-50/50 p-3.5 dark:bg-blue-950/20">
                                    <div className="font-semibold text-blue-950 dark:text-blue-200">
                                        Rekening Bank Resmi CampRental:
                                    </div>
                                    <div className="font-mono text-sm font-bold text-blue-900 dark:text-blue-300">
                                        BCA: 123-456-7890
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                        Atas Nama: PT CampRental Indonesia
                                    </div>
                                    <div className="text-[11px] font-semibold text-foreground">
                                        {Number(rental.remaining_amount) === 0
                                            ? 'Nominal yang harus ditransfer (Lunas):'
                                            : 'Nominal DP yang harus ditransfer:'}{' '}
                                        {formatRupiah(rental.dp_amount)}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {rental.dp_proof_image ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-400">
                                                <CheckCircle2 className="h-4 w-4" />
                                                <span>
                                                    Bukti transfer telah
                                                    diunggah
                                                </span>
                                            </div>
                                            <a
                                                href={`/storage/${rental.dp_proof_image}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block text-xs text-blue-600 underline"
                                            >
                                                Lihat Gambar Bukti Transfer
                                                Terunggah
                                            </a>
                                            <p className="text-[11px] text-muted-foreground">
                                                Status:{' '}
                                                {rental.dp_verified_at
                                                    ? 'Terverifikasi oleh Admin'
                                                    : 'Menunggu tinjauan admin'}
                                            </p>
                                        </div>
                                    ) : (
                                        <form
                                            onSubmit={handleUploadProof}
                                            className="space-y-3"
                                        >
                                            <div className="space-y-1">
                                                <Label
                                                    htmlFor="proof_file"
                                                    className="text-xs font-semibold"
                                                >
                                                    Unggah Foto Bukti Transfer:
                                                </Label>
                                                <Input
                                                    id="proof_file"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) =>
                                                        setFile(
                                                            e.target.files
                                                                ? e.target
                                                                      .files[0]
                                                                : null,
                                                        )
                                                    }
                                                    className="h-9 cursor-pointer text-xs file:text-xs"
                                                    required
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                size="sm"
                                                disabled={uploading || !file}
                                                className="w-full bg-zinc-900 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900"
                                            >
                                                {uploading
                                                    ? 'Mengunggah...'
                                                    : 'Kirim Bukti Transfer DP'}
                                            </Button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Customer Reviews Section (SRS-F-014) */}
                        {rental.rental_status === 'completed' && (
                            <div className="space-y-4 rounded-2xl border border-amber-500/30 bg-amber-50/30 p-5 dark:bg-amber-950/10 print:hidden">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                                            <Star className="h-4 w-4 text-amber-500 fill-current" />
                                            <span>Ulasan & Pengalaman Sewa Alat Camping</span>
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Bagikan ulasan dan rating peralatan yang Anda sewa untuk membantu petualang lainnya.
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => openReviewDialog()}
                                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 self-start sm:self-auto"
                                    >
                                        <Star className="h-3.5 w-3.5 fill-current" />
                                        <span>Beri / Edit Ulasan</span>
                                    </Button>
                                </div>

                                {/* List existing reviews */}
                                {rental.reviews && rental.reviews.length > 0 && (
                                    <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                                        {rental.reviews.map((rev) => {
                                            const eq = rental.items?.find((it) => it.equipment_id === rev.equipment_id)?.equipment;
                                            return (
                                                <div
                                                    key={rev.id}
                                                    className="rounded-xl border border-border bg-card p-3.5 space-y-1.5 text-xs shadow-xs"
                                                >
                                                    <div className="flex items-center justify-between font-semibold">
                                                        <span className="text-foreground">{eq?.name || 'Alat Camping'}</span>
                                                        <div className="flex items-center gap-0.5 text-amber-500">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Star
                                                                    key={s}
                                                                    className={`h-3.5 w-3.5 ${
                                                                        s <= rev.rating ? 'fill-current' : 'text-zinc-300 dark:text-zinc-700'
                                                                    }`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {rev.comment && (
                                                        <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                                                            "{rev.comment}"
                                                        </p>
                                                    )}
                                                    <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/40">
                                                        <span>Ulasan Anda</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => openReviewDialog(rev.equipment_id)}
                                                            className="text-blue-600 hover:underline font-medium"
                                                        >
                                                            Ubah Ulasan
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Review Dialog */}
            <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={submitReview}>
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold flex items-center gap-2">
                                <Star className="h-5 w-5 text-amber-500 fill-current" />
                                <span>Beri Ulasan & Rating Alat</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Bagikan pengalaman Anda menyewa alat camping ini untuk membantu petualang lainnya.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4 text-xs">
                            {/* Equipment Selection */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Pilih Alat Camping:</Label>
                                <Select
                                    value={selectedEquipmentId}
                                    onValueChange={handleEquipmentChangeForReview}
                                >
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue placeholder="Pilih alat" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rental.items?.map((item) => (
                                            <SelectItem
                                                key={item.equipment_id}
                                                value={item.equipment_id.toString()}
                                            >
                                                {item.equipment?.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Star Rating Picker */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Penilaian Bintang:</Label>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className="p-1 text-amber-500 transition-transform hover:scale-110"
                                        >
                                            <Star
                                                className={`h-6 w-6 ${
                                                    star <= rating
                                                        ? 'fill-current'
                                                        : 'text-zinc-300 dark:text-zinc-700'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                    <span className="ml-2 text-sm font-bold">{rating} / 5 Bintang</span>
                                </div>
                            </div>

                            {/* Comment */}
                            <div className="space-y-1.5">
                                <Label htmlFor="review_comment_show" className="text-xs font-semibold">
                                    Komentar / Ulasan Pengalaman (Opsional):
                                </Label>
                                <Textarea
                                    id="review_comment_show"
                                    rows={3}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Ceritakan kondisi alat, kemudahan penggunaan, atau saran Anda..."
                                    className="text-xs"
                                    maxLength={1000}
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setReviewModalOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={submittingReview}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                {submittingReview ? 'Menyimpan...' : 'Simpan Ulasan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </CustomerLayout>
    );
}
