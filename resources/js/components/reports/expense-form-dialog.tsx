import React, { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DollarSign, Save } from "lucide-react";

export interface ExpenseItem {
    id: number;
    expense_number: string;
    category: "pemeliharaan_alat" | "perlengkapan_alat" | "operasional_toko" | "gaji_karyawan" | "lain_lain";
    title: string;
    amount: number;
    expense_date: string;
    payment_method: "cash" | "transfer";
    payment_status: "paid" | "unpaid";
    notes?: string | null;
    user_name?: string;
    created_at?: string;
}

interface ExpenseFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    expense?: ExpenseItem | null;
}

export function ExpenseFormDialog({
    open,
    onOpenChange,
    expense,
}: ExpenseFormDialogProps) {
    const isEdit = Boolean(expense);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        category: "operasional_toko",
        title: "",
        amount: "",
        expense_date: new Date().toISOString().split("T")[0],
        payment_method: "cash",
        payment_status: "paid",
        notes: "",
    });

    useEffect(() => {
        if (open) {
            clearErrors();
            if (expense) {
                setData({
                    category: expense.category,
                    title: expense.title,
                    amount: String(expense.amount),
                    expense_date: expense.expense_date,
                    payment_method: expense.payment_method,
                    payment_status: expense.payment_status,
                    notes: expense.notes || "",
                });
            } else {
                reset();
                setData("expense_date", new Date().toISOString().split("T")[0]);
            }
        }
    }, [open, expense]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit && expense) {
            put(`/admin/expenses/${expense.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Catatan pengeluaran berhasil diperbarui!");
                    onOpenChange(false);
                },
                onError: (errs) => {
                    toast.error("Gagal memperbarui pengeluaran. Periksa input formulir.");
                },
            });
        } else {
            post("/admin/expenses", {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Catatan pengeluaran operasional berhasil disimpan!");
                    onOpenChange(false);
                    reset();
                },
                onError: (errs) => {
                    toast.error("Gagal menyimpan pengeluaran. Periksa input formulir.");
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[540px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                                <DollarSign className="h-4 w-4" />
                            </div>
                            <span>{isEdit ? "Edit Catatan Pengeluaran" : "Catat Pengeluaran Operasional"}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {isEdit
                                ? `Perbarui rincian beban operasional #${expense?.expense_number}`
                                : "Catat pengeluaran kas toko, biaya pemeliharaan alat, utilitas, atau pembelian perlengkapan operasional."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4 text-xs">
                        {/* Tanggal & Kategori */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="expense_date" className="text-xs font-semibold">
                                    Tanggal Pengeluaran <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="expense_date"
                                    type="date"
                                    value={data.expense_date}
                                    onChange={(e) => setData("expense_date", e.target.value)}
                                    className="h-9 text-xs"
                                    required
                                />
                                {errors.expense_date && (
                                    <p className="text-[11px] text-rose-500 font-medium">{errors.expense_date}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="category" className="text-xs font-semibold">
                                    Kategori Pengeluaran <span className="text-rose-500">*</span>
                                </Label>
                                <Select
                                    value={data.category}
                                    onValueChange={(val: any) => setData("category", val)}
                                >
                                    <SelectTrigger id="category" className="h-9 text-xs">
                                        <SelectValue placeholder="Pilih Kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pemeliharaan_alat" className="text-xs">
                                            Pemeliharaan &amp; Laundry Alat
                                        </SelectItem>
                                        <SelectItem value="perlengkapan_alat" className="text-xs">
                                            Perlengkapan &amp; Suku Cadang
                                        </SelectItem>
                                        <SelectItem value="operasional_toko" className="text-xs">
                                            Operasional &amp; Utilitas Toko
                                        </SelectItem>
                                        <SelectItem value="gaji_karyawan" className="text-xs">
                                            Upah / Gaji Karyawan
                                        </SelectItem>
                                        <SelectItem value="lain_lain" className="text-xs">
                                            Biaya Operasional Lainnya
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.category && (
                                    <p className="text-[11px] text-rose-500 font-medium">{errors.category}</p>
                                )}
                            </div>
                        </div>

                        {/* Judul / Keterangan Singkat */}
                        <div className="space-y-1.5">
                            <Label htmlFor="title" className="text-xs font-semibold">
                                Keterangan Beban / Judul <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                placeholder="Contoh: Laundry 15 Sleeping Bag, Beli Pasak Alumunium 30 pcs..."
                                value={data.title}
                                onChange={(e) => setData("title", e.target.value)}
                                className="h-9 text-xs"
                                required
                            />
                            {errors.title && (
                                <p className="text-[11px] text-rose-500 font-medium">{errors.title}</p>
                            )}
                        </div>

                        {/* Jumlah (Nominal) & Metode Pembayaran */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="amount" className="text-xs font-semibold">
                                    Nominal Pengeluaran (Rp) <span className="text-rose-500">*</span>
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                                        Rp
                                    </span>
                                    <Input
                                        id="amount"
                                        type="number"
                                        min="1"
                                        step="1"
                                        placeholder="0"
                                        value={data.amount}
                                        onChange={(e) => setData("amount", e.target.value)}
                                        className="h-9 text-xs pl-9 tabular-nums font-semibold"
                                        required
                                    />
                                </div>
                                {errors.amount && (
                                    <p className="text-[11px] text-rose-500 font-medium">{errors.amount}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="payment_method" className="text-xs font-semibold">
                                    Metode Pembayaran <span className="text-rose-500">*</span>
                                </Label>
                                <Select
                                    value={data.payment_method}
                                    onValueChange={(val: any) => setData("payment_method", val)}
                                >
                                    <SelectTrigger id="payment_method" className="h-9 text-xs">
                                        <SelectValue placeholder="Pilih Metode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash" className="text-xs">
                                            Tunai Kasir
                                        </SelectItem>
                                        <SelectItem value="transfer" className="text-xs">
                                            Transfer Bank / Non-Tunai
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.payment_method && (
                                    <p className="text-[11px] text-rose-500 font-medium">{errors.payment_method}</p>
                                )}
                            </div>
                        </div>

                        {/* Status Pembayaran (Lunas vs Hutang) */}
                        <div className="space-y-1.5">
                            <Label htmlFor="payment_status" className="text-xs font-semibold">
                                Status Pembayaran Kas <span className="text-rose-500">*</span>
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setData("payment_status", "paid")}
                                    className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-left transition-all ${
                                        data.payment_status === "paid"
                                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500/20"
                                            : "border-border hover:bg-muted/40 text-muted-foreground"
                                    }`}
                                >
                                    <span className="text-xs">Lunas (Uang Kas Keluar)</span>
                                    <span className="text-[10px] opacity-75 mt-0.5">Sudah dibayarkan saat ini</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setData("payment_status", "unpaid")}
                                    className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-left transition-all ${
                                        data.payment_status === "unpaid"
                                            ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-semibold ring-1 ring-amber-500/20"
                                            : "border-border hover:bg-muted/40 text-muted-foreground"
                                    }`}
                                >
                                    <span className="text-xs">Belum Lunas (Hutang Beban)</span>
                                    <span className="text-[10px] opacity-75 mt-0.5">Tagihan tempo ke supplier</span>
                                </button>
                            </div>
                            {errors.payment_status && (
                                <p className="text-[11px] text-rose-500 font-medium">{errors.payment_status}</p>
                            )}
                        </div>

                        {/* Catatan Tambahan */}
                        <div className="space-y-1.5">
                            <Label htmlFor="notes" className="text-xs font-semibold">
                                Catatan / Rincian Tambahan (Opsional)
                            </Label>
                            <Textarea
                                id="notes"
                                placeholder="Nomor nota struk, nama toko/teknisi, rincian item..."
                                value={data.notes}
                                onChange={(e) => setData("notes", e.target.value)}
                                className="text-xs min-h-[64px] resize-none"
                            />
                            {errors.notes && (
                                <p className="text-[11px] text-rose-500 font-medium">{errors.notes}</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                            className="text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={processing}
                            className="text-xs font-semibold gap-1.5"
                        >
                            <Save className="h-3.5 w-3.5" />
                            <span>{processing ? "Menyimpan..." : isEdit ? "Perbarui Pengeluaran" : "Simpan Pengeluaran"}</span>
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
