import { Head, Link, usePage, router } from '@inertiajs/react';
import {
    ShoppingBag,
    Trash2,
    Calendar,
    ArrowRight,
    CheckCircle2,
    ShieldAlert,
    Tent,
    LogIn,
    CheckSquare,
    Square,
    Info,
    AlertTriangle,
    Loader2,
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/use-cart';
import CustomerLayout from '@/layouts/customer-layout';
import { formatRupiah } from '@/lib/formatters';
import type { User } from '@/types';

interface StockAvailabilityItem {
    equipment_id: number;
    name: string;
    requested_quantity: number;
    available_stock: number;
    is_available: boolean;
    message: string;
}

export default function CartIndex() {
    const { auth } = usePage<{ auth: { user: User | null } }>().props;
    const user = auth?.user;

    const {
        items,
        selectedIds,
        selectedItems,
        selectedItemCount,
        selectedSubtotalPrice,
        selectedTotalDeposit,
        selectedTotalPrice,
        selectedDpAmount,
        selectedRemainingAmount,
        selectedItemsBreakdown,
        isAllSelected,
        hasSelectedItems,
        toggleSelectItem,
        selectAll,
        unselectAll,
        isItemSelected,
        startDate,
        endDate,
        totalDays,
        itemCount,
        updateQuantity,
        removeItem,
        removeItems,
        clearCart,
        setStartDate,
        setEndDate,
    } = useCart();

    const [customerNotes, setCustomerNotes] = useState<string>('');
    const [paymentType, setPaymentType] = useState<'dp' | 'full'>('dp');
    const [dpProofFile, setDpProofFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Real-time stock checking state for selected items on the chosen date range
    const [stockChecking, setStockChecking] = useState<boolean>(false);
    const [stockResults, setStockResults] = useState<Record<number, StockAvailabilityItem>>({});
    const [allStockAvailable, setAllStockAvailable] = useState<boolean>(true);

    // Dynamically computed payment amounts based on paymentType selection
    const computedDpAmount = paymentType === 'full'
        ? selectedTotalPrice
        : selectedDpAmount;
    const computedRemainingAmount = paymentType === 'full'
        ? 0
        : selectedRemainingAmount;

    // Real-time stock availability verification when date range or selected items change
    useEffect(() => {
        if (!startDate || !endDate || selectedItems.length === 0) {
            setStockResults({});
            setAllStockAvailable(true);

            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
            return;
        }

        let isCancelled = false;
        const checkStock = async () => {
            setStockChecking(true);
            try {
                const csrfToken =
                    (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

                const res = await fetch('/cart/check-availability', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify({
                        start_date: startDate,
                        end_date: endDate,
                        items: selectedItems.map((i) => ({
                            equipment_id: i.equipment_id,
                            quantity: i.quantity,
                        })),
                    }),
                });

                if (!res.ok) {
                    return;
                }

                const data = await res.json();
                if (!isCancelled) {
                    setStockResults(data.items || {});
                    setAllStockAvailable(data.all_available ?? true);
                }
            } catch {
                // Silently fallback if network glitch occurs
            } finally {
                if (!isCancelled) {
                    setStockChecking(false);
                }
            }
        };

        const timer = setTimeout(checkStock, 300);

        return () => {
            isCancelled = true;
            clearTimeout(timer);
        };
    }, [startDate, endDate, selectedItems]);

    // Calculate minimum allowed dates for date pickers
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const minEndDate = useMemo(() => {
        if (!startDate) return today;
        const [year, month, day] = startDate.split('-').map(Number);
        if (!year || !month || !day) return today;
        return new Date(year, month - 1, day);
    }, [startDate, today]);

    const handleStartDateSelect = (newStart: string) => {
        setStartDate(newStart);
        // If end date is prior to the new start date, auto-sync end date
        if (endDate && newStart > endDate) {
            setEndDate(newStart);
        }
    };

    const handleEndDateSelect = (newEnd: string) => {
        setEndDate(newEnd);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setDpProofFile(e.target.files[0]);
        }
    };

    const handleToggleAll = () => {
        if (isAllSelected) {
            unselectAll();
        } else {
            selectAll();
        }
    };

    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error(
                'Silakan masuk (login) terlebih dahulu untuk melanjutkan pemesanan sewa.',
            );
            router.visit('/login');

            return;
        }

        if (!user.phone || !user.address) {
            toast.error(
                'Silakan lengkapi nomor telepon dan alamat pada profil Anda terlebih dahulu sebelum melakukan pemesanan.',
            );
            router.visit('/settings/profile');

            return;
        }

        if (items.length === 0) {
            toast.error('Keranjang sewa Anda masih kosong.');

            return;
        }

        if (!hasSelectedItems || selectedItems.length === 0) {
            toast.error('Silakan pilih minimal 1 alat camping untuk dicheckout.');

            return;
        }

        if (!startDate || !endDate) {
            toast.error('Harap tentukan tanggal mulai dan selesai sewa.');

            return;
        }

        if (!allStockAvailable) {
            toast.error(
                'Beberapa alat melebihi stok yang tersedia pada tanggal tersebut. Silakan sesuaikan jumlah atau tanggal sewa.',
            );

            return;
        }

        const formData = new FormData();
        formData.append('start_date', startDate);
        formData.append('end_date', endDate);
        formData.append('customer_notes', customerNotes);
        formData.append('payment_type', paymentType);

        const bookedEquipmentIds = selectedItems.map((i) => i.equipment_id);

        selectedItems.forEach((item, index) => {
            formData.append(
                `items[${index}][equipment_id]`,
                item.equipment_id.toString(),
            );
            formData.append(
                `items[${index}][quantity]`,
                item.quantity.toString(),
            );
        });

        if (dpProofFile) {
            formData.append('dp_proof', dpProofFile);
        }

        setSubmitting(true);

        router.post('/bookings', formData, {
            forceFormData: true,
            onSuccess: () => {
                // Synchronously remove only the checked out items from localStorage & cart
                removeItems(bookedEquipmentIds);
                toast.success(
                    `Pemesanan sewa berhasil dibuat untuk ${bookedEquipmentIds.length} jenis alat!`,
                );
            },
            onError: (errors) => {
                const firstKey = Object.keys(errors)[0];
                toast.error(
                    errors[firstKey] ||
                    'Terjadi kesalahan saat memproses booking.',
                );
                setSubmitting(false);
            },
            onFinish: () => setSubmitting(false),
        });
    };

    const remainingUnselectedCount = items.length - selectedItems.length;

    return (
        <CustomerLayout>
            <Head title="Keranjang & Checkout Sewa Alat Camping" />

            <div className="container mx-auto space-y-8 px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                                Keranjang & Formulir Booking
                            </h1>
                            {items.length > 0 && (
                                <Badge variant="secondary" className="font-bold">
                                    {itemCount} Total Unit
                                </Badge>
                            )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                            Pilih barang yang ingin dicheckout, tentukan tanggal sewa untuk paket tersebut, dan lakukan pembayaran DP 30%.
                        </p>
                    </div>
                    {items.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearCart}
                            className="self-start text-xs text-destructive hover:bg-destructive/10 hover:text-destructive sm:self-auto"
                        >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Kosongkan Keranjang
                        </Button>
                    )}
                </div>

                {items.length === 0 ? (
                    <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-dashed py-20 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <ShoppingBag className="h-8 w-8 opacity-40" />
                        </div>
                        <h2 className="text-lg font-bold">
                            Keranjang Sewa Anda Kosong
                        </h2>
                        <p className="mx-auto max-w-sm text-xs text-muted-foreground">
                            Anda belum memilih peralatan camping untuk disewa.
                            Silakan telusuri katalog kami untuk menemukan
                            perlengkapan yang Anda butuhkan.
                        </p>
                        <Button
                            asChild
                            className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        >
                            <Link href="/">
                                <Tent className="mr-2 h-4 w-4" />
                                Buka Katalog Alat
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <form
                        onSubmit={handleCheckout}
                        className="grid grid-cols-1 gap-8 lg:grid-cols-12"
                    >
                        {/* Left Column: Items List + Date Range Picker (7 cols) */}
                        <div className="space-y-6 lg:col-span-7">
                            {/* Date Picker Banner */}
                            <Card className="border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-none">
                                <CardContent className="space-y-3.5 p-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                            <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            <span>Rentang Tanggal Sewa (Untuk Barang Terpilih)</span>
                                        </div>
                                        <Badge variant="outline" className="text-[11px] font-semibold border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                                            {totalDays} Hari Sewa
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label
                                                htmlFor="cart_start_date"
                                                className="text-xs font-semibold"
                                            >
                                                Tanggal Mulai Sewa (Ambil Barang)
                                            </Label>
                                            <DatePicker
                                                id="cart_start_date"
                                                value={startDate}
                                                onChange={handleStartDateSelect}
                                                minDate={today}
                                                placeholder="Pilih tanggal mulai sewa"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label
                                                htmlFor="cart_end_date"
                                                className="text-xs font-semibold"
                                            >
                                                Tanggal Selesai Sewa (Kembali)
                                            </Label>
                                            <DatePicker
                                                id="cart_end_date"
                                                value={endDate}
                                                onChange={handleEndDateSelect}
                                                minDate={minEndDate}
                                                placeholder="Pilih tanggal selesai sewa"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                                        <Info className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        <span>Tanggal ini akan diterapkan pada pesanan untuk barang yang Anda centang di bawah.</span>
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Multi-item Selection Header & Cards */}
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2.5">
                                    <div className="flex items-center gap-3">
                                        <div
                                            onClick={handleToggleAll}
                                            className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-foreground hover:text-emerald-600 transition-colors"
                                        >
                                            <Checkbox
                                                checked={isAllSelected}
                                                onCheckedChange={handleToggleAll}
                                                className="h-4 w-4"
                                            />
                                            <span>Pilih Semua Alat</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            ({selectedItems.length} dari {items.length} jenis alat dicentang)
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {remainingUnselectedCount > 0 && (
                                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                                {remainingUnselectedCount} alat disimpan untuk checkout lain
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {items.map((item) => {
                                        const isSelected = isItemSelected(item.equipment_id);
                                        const price =
                                            typeof item.equipment
                                                .price_per_day === 'string'
                                                ? parseFloat(
                                                    item.equipment
                                                        .price_per_day,
                                                )
                                                : item.equipment.price_per_day;
                                        const deposit =
                                            typeof item.equipment
                                                .deposit_per_unit === 'string'
                                                ? parseFloat(
                                                    item.equipment
                                                        .deposit_per_unit,
                                                )
                                                : item.equipment
                                                    .deposit_per_unit;

                                        const itemRentTotal =
                                            price * item.quantity * totalDays;
                                        const itemDepositTotal =
                                            deposit * item.quantity;
                                        const itemGrandTotal =
                                            itemRentTotal + itemDepositTotal;

                                        const itemStock = stockResults[item.equipment_id];
                                        const hasStockIssue = itemStock && !itemStock.is_available;

                                        return (
                                            <div
                                                key={item.equipment_id}
                                                className={`flex flex-col items-start justify-between gap-4 rounded-xl border p-4 transition-all sm:flex-row sm:items-center ${
                                                    isSelected
                                                        ? hasStockIssue
                                                            ? 'border-rose-500/60 bg-rose-50/10 shadow-xs dark:border-rose-700/60 dark:bg-rose-950/10'
                                                            : 'border-emerald-500/40 bg-card shadow-xs dark:border-emerald-700/50'
                                                        : 'border-border bg-muted/20 opacity-70 hover:opacity-100'
                                                }`}
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    {/* Selection Checkbox */}
                                                    <div className="pt-0.5 sm:pt-0">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() =>
                                                                toggleSelectItem(item.equipment_id)
                                                            }
                                                            aria-label={`Pilih ${item.equipment.name}`}
                                                            className="h-4 w-4"
                                                        />
                                                    </div>

                                                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                                                        {item.equipment.image_url ? (
                                                            <img
                                                                src={item.equipment.image_url}
                                                                alt={item.equipment.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                                                <Tent className="h-6 w-6 opacity-30" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="truncate text-sm font-semibold text-foreground">
                                                                {item.equipment.name}
                                                            </h4>
                                                            {isSelected ? (
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`text-[10px] px-1.5 py-0 ${
                                                                        hasStockIssue
                                                                            ? 'border-rose-500/40 text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30'
                                                                            : 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                                                                    }`}
                                                                >
                                                                    {hasStockIssue ? 'Stok Kurang' : 'Akan Dicheckout'}
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                                                                    Disimpan
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        <div className="text-xs text-muted-foreground">
                                                            {formatRupiah(price)} /hari • Jaminan: {formatRupiah(deposit)} /unit
                                                        </div>

                                                        {/* Detailed Price Breakdown per Item */}
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                                                            <span>
                                                                Sewa ({totalDays} hr):{' '}
                                                                <strong className="text-foreground tabular-nums">
                                                                    {formatRupiah(itemRentTotal)}
                                                                </strong>
                                                            </span>
                                                            <span>•</span>
                                                            <span>
                                                                Deposit:{' '}
                                                                <strong className="text-foreground tabular-nums">
                                                                    {formatRupiah(itemDepositTotal)}
                                                                </strong>
                                                            </span>
                                                            <span>•</span>
                                                            <span>
                                                                Total:{' '}
                                                                <strong className="text-emerald-700 dark:text-emerald-400 tabular-nums">
                                                                    {formatRupiah(itemGrandTotal)}
                                                                </strong>
                                                            </span>
                                                        </div>

                                                        {/* Real-time Stock Issue Warning */}
                                                        {isSelected && hasStockIssue && (
                                                            <div className="mt-1 flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-50/90 px-2 py-1 text-[11px] font-semibold text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                                                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                                                                <span>{itemStock.message}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Quantity & Delete */}
                                                <div className="flex w-full shrink-0 items-center justify-between gap-3 sm:w-auto sm:justify-end">
                                                    <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item.equipment_id,
                                                                    item.quantity - 1,
                                                                )
                                                            }
                                                        >
                                                            -
                                                        </Button>
                                                        <span className="w-8 text-center text-xs font-bold">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item.equipment_id,
                                                                    item.quantity + 1,
                                                                )
                                                            }
                                                        >
                                                            +
                                                        </Button>
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={() =>
                                                            removeItem(
                                                                item.equipment_id,
                                                                )
                                                        }
                                                        title="Hapus dari keranjang"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Additional Booking Notes */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="notes"
                                    className="text-xs font-semibold"
                                >
                                    Catatan Tambahan untuk Admin (Opsional)
                                </Label>
                                <Textarea
                                    id="notes"
                                    value={customerNotes}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLTextAreaElement>,
                                    ) => setCustomerNotes(e.target.value)}
                                    placeholder="Contoh: Perkiraan tiba di toko pukul 14.00 WIB, tujuan camping ke Papandayan..."
                                    className="h-20 resize-none text-xs"
                                />
                            </div>
                        </div>

                        {/* Right Column: Checkout Summary & Payment Instructions (5 cols) */}
                        <div className="space-y-6 lg:col-span-5">
                            <Card className="sticky top-20 border-border shadow-sm">
                                <CardContent className="space-y-5 p-6">
                                    <div className="flex items-center justify-between border-b border-border pb-2">
                                        <h3 className="text-base font-bold text-foreground">
                                            Ringkasan Biaya Booking
                                        </h3>
                                        <Badge variant="secondary" className="text-[11px] font-bold">
                                            {selectedItemCount} Unit Dipilih
                                        </Badge>
                                    </div>

                                    {!hasSelectedItems ? (
                                        <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-50/40 p-4 text-center text-xs text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                                            <p className="font-semibold">Tidak ada alat yang dicentang</p>
                                            <p className="text-[11px] text-muted-foreground mt-1">
                                                Centang minimal 1 alat camping pada daftar di sebelah kiri untuk melihat rincian biaya dan melanjutkan checkout.
                                            </p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={selectAll}
                                                className="mt-3 h-8 text-xs font-semibold"
                                            >
                                                Pilih Semua Alat
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Trip Schedule Summary Banner */}
                                            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2.5 text-xs">
                                                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                                                    <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                                    Jadwal Trip:
                                                </span>
                                                <Badge variant="outline" className="font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                                                    {totalDays} Hari Sewa
                                                </Badge>
                                            </div>

                                            {/* Section: Rincian Biaya per Alat */}
                                            <div className="space-y-2 rounded-xl border border-border/80 bg-muted/20 p-3.5">
                                                <div className="flex items-center justify-between text-xs font-bold text-foreground pb-1.5 border-b border-border/60">
                                                    <span>Rincian Biaya per Alat</span>
                                                    <span className="text-[11px] font-normal text-muted-foreground">
                                                        {selectedItemsBreakdown.length} Jenis ({selectedItemCount} Unit)
                                                    </span>
                                                </div>
                                                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                                                    {selectedItemsBreakdown.map((item) => {
                                                        const stock = stockResults[item.equipment_id];
                                                        const hasStockIssue = stock && !stock.is_available;

                                                        return (
                                                            <div
                                                                key={item.equipment_id}
                                                                className="text-xs space-y-1 border-b border-border/40 pb-2 last:border-0 last:pb-0"
                                                            >
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <span className="font-semibold text-foreground line-clamp-1">
                                                                        {item.quantity}x {item.equipment.name}
                                                                    </span>
                                                                    <span className="font-variant-numeric font-bold text-foreground shrink-0 tabular-nums">
                                                                        {formatRupiah(item.itemGrandTotal)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                                                    <span>
                                                                        Sewa ({totalDays} hr):{' '}
                                                                        <strong className="text-foreground/90 font-medium">
                                                                            {formatRupiah(item.itemRentTotal)}
                                                                        </strong>
                                                                    </span>
                                                                    <span>
                                                                        Deposit:{' '}
                                                                        <strong className="text-foreground/90 font-medium">
                                                                            {formatRupiah(item.itemDepositTotal)}
                                                                        </strong>
                                                                    </span>
                                                                </div>
                                                                {hasStockIssue && (
                                                                    <div className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 pt-0.5">
                                                                        <AlertTriangle className="h-3 w-3 shrink-0" />
                                                                        <span>{stock.message}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Aggregated Totals */}
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between text-muted-foreground">
                                                    <span>Total Biaya Sewa ({selectedItemCount} unit, {totalDays} hr):</span>
                                                    <span className="font-variant-numeric font-semibold text-foreground tabular-nums">
                                                        {formatRupiah(selectedSubtotalPrice)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-muted-foreground">
                                                    <span>Total Deposit Jaminan:</span>
                                                    <span className="font-variant-numeric font-semibold text-foreground tabular-nums">
                                                        {formatRupiah(selectedTotalDeposit)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between border-t border-border pt-2.5 text-base font-extrabold text-foreground">
                                                    <span>Grand Total:</span>
                                                    <span className="font-variant-numeric tabular-nums text-emerald-600 dark:text-emerald-400">
                                                        {formatRupiah(selectedTotalPrice)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Prominent Stock Issue Warning */}
                                            {!allStockAvailable && (
                                                <div className="rounded-xl border border-rose-500/40 bg-rose-50/90 dark:bg-rose-950/40 p-3.5 text-xs text-rose-900 dark:text-rose-200 space-y-1">
                                                    <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
                                                        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                                                        <span>Stok Tidak Mencukupi</span>
                                                    </div>
                                                    <p className="text-[11px] leading-relaxed text-rose-800/90 dark:text-rose-300/90">
                                                        Beberapa alat yang Anda centang melebihi kuota stok yang tersedia pada rentang tanggal sewa ini. Mohon kurangi jumlah unit atau sesuaikan tanggal sewa sebelum melanjutkan.
                                                    </p>
                                                </div>
                                            )}

                                            {/* Payment Type Selection */}
                                            <div className="space-y-2.5">
                                                <Label className="text-xs font-semibold">Pilih Metode Pembayaran:</Label>
                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                    {/* Option A: DP 30% */}
                                                    <label
                                                        htmlFor="payment_dp"
                                                        className={`flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-3.5 transition-all ${
                                                            paymentType === 'dp'
                                                                 ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30'
                                                                 : 'border-border bg-muted/30 hover:border-amber-300 dark:hover:border-amber-700'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="radio"
                                                                id="payment_dp"
                                                                name="payment_type"
                                                                value="dp"
                                                                checked={paymentType === 'dp'}
                                                                onChange={() => setPaymentType('dp')}
                                                                className="text-amber-500"
                                                            />
                                                            <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                                                                🟡 DP 30% (Transfer)
                                                            </span>
                                                        </div>
                                                        <p className="ml-5 text-[11px] text-muted-foreground">
                                                            Transfer DP{' '}
                                                            <strong className="text-foreground">{formatRupiah(selectedDpAmount)}</strong>
                                                            , sisa{' '}
                                                            <strong className="text-foreground">{formatRupiah(selectedRemainingAmount)}</strong>
                                                            {' '}lunas COD di toko.
                                                        </p>
                                                    </label>

                                                    {/* Option B: Full Payment 100% */}
                                                    <label
                                                        htmlFor="payment_full"
                                                        className={`flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-3.5 transition-all ${
                                                            paymentType === 'full'
                                                                ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30'
                                                                : 'border-border bg-muted/30 hover:border-emerald-300 dark:hover:border-emerald-700'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="radio"
                                                                id="payment_full"
                                                                name="payment_type"
                                                                value="full"
                                                                checked={paymentType === 'full'}
                                                                onChange={() => setPaymentType('full')}
                                                                className="text-emerald-500"
                                                            />
                                                            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                                                🟢 Bayar Lunas 100%
                                                            </span>
                                                        </div>
                                                        <p className="ml-5 text-[11px] text-muted-foreground">
                                                            Transfer penuh{' '}
                                                            <strong className="text-foreground">{formatRupiah(selectedTotalPrice)}</strong>
                                                            , COD di toko{' '}
                                                            <strong className="text-emerald-700 dark:text-emerald-400">Rp 0</strong>.
                                                        </p>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* DP Payment Breakdown Box (dynamic) */}
                                            <div className={`space-y-2.5 rounded-xl border p-4 text-xs ${
                                                paymentType === 'full'
                                                    ? 'border-emerald-300/60 bg-emerald-50/60 dark:border-emerald-800/50 dark:bg-emerald-950/30'
                                                    : 'border-border bg-zinc-100 dark:bg-zinc-800/80'
                                            }`}>
                                                <div className={`flex items-center justify-between font-bold ${
                                                    paymentType === 'full'
                                                        ? 'text-emerald-700 dark:text-emerald-400'
                                                        : 'text-amber-700 dark:text-amber-400'
                                                }`}>
                                                    <span>
                                                        {paymentType === 'full'
                                                            ? 'Wajib Bayar Lunas (Transfer):'
                                                            : 'Wajib Bayar DP 30% (Transfer):'}
                                                    </span>
                                                    <span className="font-variant-numeric text-sm tabular-nums">
                                                        {formatRupiah(computedDpAmount)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-muted-foreground">
                                                    <span>Pelunasan Tunai/COD di Toko:</span>
                                                    <span className={`font-variant-numeric font-semibold tabular-nums ${
                                                        paymentType === 'full' ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'
                                                    }`}>
                                                        {paymentType === 'full' ? 'Rp 0' : formatRupiah(computedRemainingAmount)}
                                                    </span>
                                                </div>
                                                <p className="border-t border-border/60 pt-1 text-[11px] text-muted-foreground">
                                                    {paymentType === 'full'
                                                        ? '*Bayar lunas di muka. Saat ambil alat di toko, tidak ada sisa tagihan. Deposit jaminan akan dikembalikan setelah pengembalian alat.'
                                                        : '*DP digunakan untuk mengunci stok unit pada tanggal yang dipilih. Pelunasan sisa tagihan + deposit dibayarkan saat serah terima barang di toko.'}
                                                </p>
                                            </div>

                                            {/* Bank Account Info for DP */}
                                            <div className="space-y-1 rounded-xl border border-blue-500/20 bg-blue-50/50 p-3.5 text-xs dark:bg-blue-950/30">
                                                <div className="font-semibold text-blue-950 dark:text-blue-200">
                                                    Rekening Transfer DP:
                                                </div>
                                                <div className="font-mono text-blue-900 dark:text-blue-300">
                                                    Bank BCA: 123-456-7890 (a/n CampRental)
                                                </div>
                                            </div>

                                            {/* Optional Direct Proof Upload */}
                                            <div className="space-y-1.5">
                                                <Label
                                                    htmlFor="dp_proof"
                                                    className="text-xs font-semibold"
                                                >
                                                    Unggah Bukti Transfer DP (Bisa sekarang atau nanti di invoice):
                                                </Label>
                                                <Input
                                                    id="dp_proof"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="h-10 cursor-pointer text-xs file:mr-2 file:text-xs"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Profile Incomplete Notice */}
                                    {user && (!user.phone || !user.address) && (
                                        <div className="rounded-xl border border-amber-500/30 bg-amber-50/70 p-3.5 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                                            <div className="flex items-start gap-2">
                                                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                                <div className="space-y-1">
                                                    <p className="font-semibold">Lengkapi Profil Anda</p>
                                                    <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90">
                                                        Nomor telepon dan alamat lengkap wajib diisi sebelum melakukan booking.
                                                    </p>
                                                    <Link
                                                        href="/settings/profile"
                                                        className="inline-block pt-1 font-semibold underline hover:text-amber-950 dark:hover:text-amber-100"
                                                    >
                                                        Lengkapi Sekarang &rarr;
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Checkout Action Button */}
                                    <div className="pt-2">
                                        {user ? (
                                            <Button
                                                type="submit"
                                                disabled={
                                                    submitting ||
                                                    !hasSelectedItems ||
                                                    !allStockAvailable ||
                                                    stockChecking
                                                }
                                                className="h-11 w-full gap-2 bg-zinc-900 font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50"
                                            >
                                                {submitting ? (
                                                    <span>Memproses Booking...</span>
                                                ) : stockChecking ? (
                                                    <span className="flex items-center gap-2">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Memeriksa Ketersediaan Stok...
                                                    </span>
                                                ) : !hasSelectedItems ? (
                                                    <span>Pilih Minimal 1 Alat untuk Checkout</span>
                                                ) : !allStockAvailable ? (
                                                    <span className="flex items-center gap-2">
                                                        <AlertTriangle className="h-4 w-4" />
                                                        Stok Tidak Mencukupi untuk Tanggal Ini
                                                    </span>
                                                ) : (
                                                    <>
                                                        <span>
                                                            Konfirmasi Booking ({selectedItemCount} Unit)
                                                        </span>
                                                        <ArrowRight className="h-4 w-4" />
                                                    </>
                                                )}
                                            </Button>
                                        ) : (
                                            <div className="space-y-2">
                                                <Button
                                                    type="button"
                                                    asChild
                                                    className="h-11 w-full gap-2 bg-zinc-900 font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                                >
                                                    <Link href="/login">
                                                        <LogIn className="h-4 w-4" />
                                                        Masuk untuk Melanjutkan Booking
                                                    </Link>
                                                </Button>
                                                <p className="text-center text-[11px] text-muted-foreground">
                                                    Belum punya akun?{' '}
                                                    <Link
                                                        href="/register"
                                                        className="font-medium text-foreground underline"
                                                    >
                                                        Daftar sekarang
                                                    </Link>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </form>
                )}
            </div>
        </CustomerLayout>
    );
}
