import { Head, Link, router } from '@inertiajs/react';
import {
    ClipboardList,
    Calendar,
    ArrowRight,
    FileText,
    Star,
    Tent,
    UploadCloud,
    CheckCircle2,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import {
    RentalStatusBadge,
    PaymentStatusBadge,
    DepositStatusBadge,
} from '@/components/status-badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
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
import { formatRupiah, formatDate } from '@/lib/formatters';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { Equipment } from '@/types';
import type { Rental, PaginatedData } from '@/types';

interface BookingsIndexProps {
    rentals: PaginatedData<Rental>;
    filters: {
        status: string;
        per_page?: number;
    };
}

export default function BookingsIndex({
    rentals,
    filters,
}: BookingsIndexProps) {
    const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
    const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
    const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
    const [rating, setRating] = useState<number>(5);
    const [comment, setComment] = useState<string>('');
    const [submittingReview, setSubmittingReview] = useState<boolean>(false);

    const handleFilterStatus = (status: string) => {
        router.get('/bookings', { status }, { preserveState: true });
    };

    const openReviewDialog = (rental: Rental) => {
        setSelectedRental(rental);

        if (rental.items && rental.items.length > 0) {
            setSelectedEquipmentId(rental.items[0].equipment_id.toString());
        }

        setRating(5);
        setComment('');
        setReviewModalOpen(true);
    };

    const submitReview = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedRental || !selectedEquipmentId) {
            return;
        }

        setSubmittingReview(true);
        router.post(
            '/reviews',
            {
                rental_id: selectedRental.id,
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

    return (
        <CustomerLayout>
            <Head title="Riwayat Pesanan Sewa Saya" />

            <div className="container mx-auto space-y-8 px-4 py-8 sm:px-6 lg:px-8">
                {/* Page Title */}
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                        Riwayat Transaksi Sewa
                    </h1>
                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                        Pantau status verifikasi DP, serah terima alat,
                        pelunasan COD, dan invoice digital Anda.
                    </p>
                </div>

                {/* Status Tabs Filter */}
                <div className="flex scrollbar-none items-center gap-1.5 overflow-x-auto border-b border-border pb-2 text-xs">
                    <Button
                        variant={!filters.status ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleFilterStatus('')}
                        className="h-8 rounded-full text-xs"
                    >
                        Semua ({rentals.total})
                    </Button>
                    <Button
                        variant={
                            filters.status === 'pending_dp'
                                ? 'default'
                                : 'ghost'
                        }
                        size="sm"
                        onClick={() => handleFilterStatus('pending_dp')}
                        className="h-8 rounded-full text-xs"
                    >
                        Menunggu Verifikasi DP
                    </Button>
                    <Button
                        variant={
                            filters.status === 'confirmed'
                                ? 'default'
                                : 'ghost'
                        }
                        size="sm"
                        onClick={() => handleFilterStatus('confirmed')}
                        className="h-8 rounded-full text-xs"
                    >
                        Dikonfirmasi
                    </Button>
                    <Button
                        variant={
                            filters.status === 'ready_pickup'
                                ? 'default'
                                : 'ghost'
                        }
                        size="sm"
                        onClick={() => handleFilterStatus('ready_pickup')}
                        className="h-8 rounded-full text-xs"
                    >
                        Siap Diambil
                    </Button>
                    <Button
                        variant={
                            filters.status === 'active' ? 'default' : 'ghost'
                        }
                        size="sm"
                        onClick={() => handleFilterStatus('active')}
                        className="h-8 rounded-full text-xs"
                    >
                        Sedang Disewa
                    </Button>
                    <Button
                        variant={
                            filters.status === 'completed' ? 'default' : 'ghost'
                        }
                        size="sm"
                        onClick={() => handleFilterStatus('completed')}
                        className="h-8 rounded-full text-xs"
                    >
                        Selesai
                    </Button>
                    <Button
                        variant={
                            filters.status === 'rescheduled' ? 'default' : 'ghost'
                        }
                        size="sm"
                        onClick={() => handleFilterStatus('rescheduled')}
                        className="h-8 rounded-full text-xs text-amber-600 hover:text-amber-700 data-[variant=default]:bg-amber-600 data-[variant=default]:text-white"
                    >
                        Dijadwalkan Ulang
                    </Button>
                    <Button
                        variant={
                            filters.status === 'cancelled' ? 'default' : 'ghost'
                        }
                        size="sm"
                        onClick={() => handleFilterStatus('cancelled')}
                        className="h-8 rounded-full text-xs text-rose-600 hover:text-rose-700"
                    >
                        Dibatalkan
                    </Button>
                </div>

                {/* Rentals List */}
                {rentals.data.length === 0 ? (
                    <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-dashed py-20 text-center">
                        <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground opacity-40" />
                        <h3 className="text-base font-bold">
                            Belum Ada Transaksi
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Anda belum memiliki riwayat penyewaan dalam status
                            ini.
                        </p>
                        <Button
                            asChild
                            size="sm"
                            className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        >
                            <Link href="/">Sewa Alat Sekarang</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {rentals.data.map((rental) => (
                            <Card
                                key={rental.id}
                                className="border-border transition-colors hover:border-zinc-400 dark:hover:border-zinc-600"
                            >
                                <CardContent className="space-y-4 p-5 sm:p-6">
                                    {/* Top Row: Invoice Number, Date, Status Badges */}
                                    <div className="flex flex-col justify-between gap-3 border-b border-border pb-3 sm:flex-row sm:items-center">
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded border border-border bg-zinc-100 px-2 py-0.5 font-mono text-sm font-bold text-foreground dark:bg-zinc-800">
                                                    Kode: {rental.booking_code}
                                                </span>
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    (Invoice:{' '}
                                                    {rental.invoice_number})
                                                </span>
                                                <RentalStatusBadge
                                                    status={
                                                        rental.rental_status
                                                    }
                                                />
                                            </div>
                                            <div className="text-[11px] text-muted-foreground">
                                                Dipesan pada:{' '}
                                                {formatDate(rental.created_at)}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-start sm:self-auto">
                                            <PaymentStatusBadge
                                                status={rental.payment_status}
                                            />
                                            <DepositStatusBadge
                                                status={rental.deposit_status}
                                            />
                                        </div>
                                    </div>

                                    {/* Middle Row: Rental Period & Itemized Summary */}
                                    <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-3">
                                        {/* Date details */}
                                        <div className="space-y-1 rounded-lg border border-border/60 bg-muted/40 p-3">
                                            <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                                <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                                                <span>
                                                    Periode Sewa (
                                                    {rental.total_days} Hari):
                                                </span>
                                            </div>
                                            <div className="pl-5 text-muted-foreground">
                                                {formatDate(rental.start_date)}{' '}
                                                s/d{' '}
                                                {formatDate(rental.end_date)}
                                            </div>
                                        </div>

                                        {/* Items summary */}
                                        <div className="space-y-1 rounded-lg border border-border/60 bg-muted/40 p-3 md:col-span-2">
                                            <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                                <Tent className="h-3.5 w-3.5 text-blue-600" />
                                                <span>Peralatan Disewa:</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 pl-5 text-muted-foreground">
                                                {rental.items?.map((item) => (
                                                    <Badge
                                                        key={item.id}
                                                        variant="secondary"
                                                        className="text-[11px] font-normal"
                                                    >
                                                        {item.quantity}x{' '}
                                                        {item.equipment?.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Row: Price Summary & Action Buttons */}
                                    <div className="flex flex-col justify-between gap-4 pt-2 sm:flex-row sm:items-center">
                                        <div className="space-y-0.5">
                                            <div className="text-xs text-muted-foreground">
                                                Total Transaksi:
                                            </div>
                                            <div className="font-variant-numeric text-lg font-bold text-foreground tabular-nums">
                                                {formatRupiah(
                                                    rental.total_price,
                                                )}
                                            </div>
                                            {Number(rental.remaining_amount) === 0 ? (
                                                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                                    ✓ Bayar Lunas (Transfer{' '}{formatRupiah(rental.dp_amount)}) • COD: Rp 0
                                                </div>
                                            ) : (
                                                <div className="text-[11px] text-muted-foreground">
                                                    (DP:{' '}
                                                    {formatRupiah(rental.dp_amount)}{' '}
                                                    • Sisa COD:{' '}
                                                    {formatRupiah(
                                                        rental.remaining_amount,
                                                    )}
                                                    )
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 self-start sm:self-auto">
                                            {rental.rental_status ===
                                                'completed' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        openReviewDialog(rental)
                                                    }
                                                    className="gap-1.5 border-amber-500/30 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                                >
                                                    <Star className="h-3.5 w-3.5 fill-current" />
                                                    Beri Ulasan
                                                </Button>
                                            )}

                                            <Button
                                                size="sm"
                                                asChild
                                                className="gap-1.5 bg-zinc-900 text-xs text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                            >
                                                <Link
                                                    href={`/bookings/${rental.id}`}
                                                >
                                                    <FileText className="h-3.5 w-3.5" />
                                                    <span>Lihat Invoice</span>
                                                    <ArrowRight className="h-3.5 w-3.5" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                <DataTablePagination pagination={rentals} />
            </div>

            {/* Rating & Review Dialog (SRS-F-014) */}
            <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={submitReview}>
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold">
                                Beri Ulasan & Rating Alat
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Bagikan pengalaman Anda menyewa alat camping ini
                                untuk membantu petualang lainnya.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4 text-xs">
                            {/* Equipment Selection */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">
                                    Pilih Alat Camping:
                                </Label>
                                <Select
                                    value={selectedEquipmentId}
                                    onValueChange={setSelectedEquipmentId}
                                >
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue placeholder="Pilih alat" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedRental?.items?.map((item) => (
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
                                <Label className="text-xs font-semibold">
                                    Penilaian Bintang:
                                </Label>
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
                                    <span className="ml-2 text-sm font-bold">
                                        {rating} / 5 Bintang
                                    </span>
                                </div>
                            </div>

                            {/* Comment */}
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="review_comment"
                                    className="text-xs font-semibold"
                                >
                                    Komentar / Pengalaman Anda:
                                </Label>
                                <Textarea
                                    id="review_comment"
                                    value={comment}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLTextAreaElement>,
                                    ) => setComment(e.target.value)}
                                    placeholder="Ceritakan kebersihan, kemudahan pemasangan, atau keandalan alat ini..."
                                    className="h-24 resize-none text-xs"
                                    required
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
                                className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                            >
                                {submittingReview
                                    ? 'Menyimpan...'
                                    : 'Kirim Ulasan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </CustomerLayout>
    );
}
