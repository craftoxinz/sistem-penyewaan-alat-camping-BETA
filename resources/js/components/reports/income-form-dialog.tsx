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
import { TrendingUp, Save } from "lucide-react";

export interface IncomeItem {
    id: number;
    income_number: string;
    category:
        | "penjualan_barang"
        | "jasa_layanan"
        | "modal_tambahan"
        | "pendapatan_bunga"
        | "klaim_kompensasi"
        | "lain_lain";
    title: string;
    amount: number;
    income_date: string;
    payment_method: "cash" | "transfer";
    payment_status: "received" | "pending";
    notes?: string | null;
    user_name?: string;
    created_at?: string;
}

interface IncomeFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    income?: IncomeItem | null;
}

export function IncomeFormDialog({
    open,
    onOpenChange,
    income,
}: IncomeFormDialogProps) {
    const isEdit = Boolean(income);

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            category: "penjualan_barang",
            title: "",
            amount: "",
            income_date: new Date().toISOString().split("T")[0],
            payment_method: "cash",
            payment_status: "received",
            notes: "",
        });

    useEffect(() => {
        if (open) {
            clearErrors();
            if (income) {
                setData({
                    category: income.category,
                    title: income.title,
                    amount: String(income.amount),
                    income_date: income.income_date,
                    payment_method: income.payment_method,
                    payment_status: income.payment_status,
                    notes: income.notes || "",
                });
            } else {
                reset();
                setData("income_date", new Date().toISOString().split("T")[0]);
            }
        }
    }, [open, income]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit && income) {
            put(`/admin/incomes/${income.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Catatan pendapatan berhasil diperbarui!");
                    onOpenChange(false);
                },
                onError: () => {
                    toast.error(
                        "Gagal memperbarui pendapatan. Periksa input formulir."
                    );
                },
            });
        } else {
            post("/admin/incomes", {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Catatan pendapatan berhasil disimpan!");
                    onOpenChange(false);
                    reset();
                },
                onError: () => {
                    toast.error(
                        "Gagal menyimpan pendapatan. Periksa input formulir."
                    );
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
                            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                            <span>
                                {isEdit
                                    ? "Edit Catatan Pendapatan"
                                    : "Catat Pendapatan / Pemasukan"}
                            </span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {isEdit
                                ? `Perbarui rincian catatan pendapatan #${income?.income_number}`
                                : "Catat pemasukan di luar sewa, seperti penjualan gas/perlengkapan, jasa cuci tenda, suntikan modal, atau pendapatan lainnya."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4 text-xs">
                        {/* Tanggal & Kategori */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="income_date"
                                    className="text-xs font-semibold"
                                >
                                    Tanggal Penerimaan{" "}
                                    <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="income_date"
                                    type="date"
                                    value={data.income_date}
                                    onChange={(e) =>
                                        setData("income_date", e.target.value)
                                    }
                                    className="h-9 text-xs"
                                    required
                                />
                                {errors.income_date && (
                                    <p className="text-[11px] text-rose-500 font-medium">
                                        {errors.income_date}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="category"
                                    className="text-xs font-semibold"
                                >
                                    Kategori Pemasukan{" "}
                                    <span className="text-rose-500">*</span>
                                </Label>
                                <Select
                                    value={data.category}
                                    onValueChange={(val: any) =>
                                        setData("category", val)
                                    }
                                >
                                    <SelectTrigger
                                        id="category"
                                        className="h-9 text-xs"
                                    >
                                        <SelectValue placeholder="Pilih Kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            value="penjualan_barang"
                                            className="text-xs"
                                        >
                                            Penjualan Barang / Retail Outdoor
                                        </SelectItem>
                                        <SelectItem
                                            value="jasa_layanan"
                                            className="text-xs"
                                        >
                                            Jasa Layanan (Cuci/Servis Luar)
                                        </SelectItem>
                                        <SelectItem
                                            value="modal_tambahan"
                                            className="text-xs"
                                        >
                                            Modal Tambahan / Setoran Pemilik
                                        </SelectItem>
                                        <SelectItem
                                            value="pendapatan_bunga"
                                            className="text-xs"
                                        >
                                            Pendapatan Bunga / Rekening Giro
                                        </SelectItem>
                                        <SelectItem
                                            value="klaim_kompensasi"
                                            className="text-xs"
                                        >
                                            Klaim Kompensasi / Ganti Rugi
                                        </SelectItem>
                                        <SelectItem
                                            value="lain_lain"
                                            className="text-xs"
                                        >
                                            Pendapatan Lain-lain (Scrap/dll)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.category && (
                                    <p className="text-[11px] text-rose-500 font-medium">
                                        {errors.category}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Judul / Keterangan Singkat */}
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="title"
                                className="text-xs font-semibold"
                            >
                                Keterangan Transaksi{" "}
                                <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                placeholder="Contoh: Penjualan 4 Gas Canister & Mantel, Cuci Tenda Konsumen..."
                                value={data.title}
                                onChange={(e) =>
                                    setData("title", e.target.value)
                                }
                                className="h-9 text-xs"
                                required
                            />
                            {errors.title && (
                                <p className="text-[11px] text-rose-500 font-medium">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        {/* Jumlah (Nominal) & Metode Pembayaran */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="amount"
                                    className="text-xs font-semibold"
                                >
                                    Nominal Pendapatan (Rp){" "}
                                    <span className="text-rose-500">*</span>
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
                                        onChange={(e) =>
                                            setData("amount", e.target.value)
                                        }
                                        className="h-9 text-xs pl-9 tabular-nums font-semibold"
                                        required
                                    />
                                </div>
                                {errors.amount && (
                                    <p className="text-[11px] text-rose-500 font-medium">
                                        {errors.amount}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="payment_method"
                                    className="text-xs font-semibold"
                                >
                                    Metode Pembayaran{" "}
                                    <span className="text-rose-500">*</span>
                                </Label>
                                <Select
                                    value={data.payment_method}
                                    onValueChange={(val: any) =>
                                        setData("payment_method", val)
                                    }
                                >
                                    <SelectTrigger
                                        id="payment_method"
                                        className="h-9 text-xs"
                                    >
                                        <SelectValue placeholder="Pilih Metode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            value="cash"
                                            className="text-xs"
                                        >
                                            Tunai Kasir
                                        </SelectItem>
                                        <SelectItem
                                            value="transfer"
                                            className="text-xs"
                                        >
                                            Transfer Bank / Non-Tunai
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.payment_method && (
                                    <p className="text-[11px] text-rose-500 font-medium">
                                        {errors.payment_method}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Status Penerimaan (Diterima vs Piutang Pending) */}
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="payment_status"
                                className="text-xs font-semibold"
                            >
                                Status Penerimaan Uang Kas{" "}
                                <span className="text-rose-500">*</span>
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setData("payment_status", "received")
                                    }
                                    className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-left transition-all ${
                                        data.payment_status === "received"
                                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500/20"
                                            : "border-border hover:bg-muted/40 text-muted-foreground"
                                    }`}
                                >
                                    <span className="text-xs">
                                        Diterima (Kas Masuk)
                                    </span>
                                    <span className="text-[10px] opacity-75 mt-0.5">
                                        Uang telah diterima kasir / rekening
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setData("payment_status", "pending")
                                    }
                                    className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-left transition-all ${
                                        data.payment_status === "pending"
                                            ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-semibold ring-1 ring-amber-500/20"
                                            : "border-border hover:bg-muted/40 text-muted-foreground"
                                    }`}
                                >
                                    <span className="text-xs">
                                        Pending (Piutang)
                                    </span>
                                    <span className="text-[10px] opacity-75 mt-0.5">
                                        Belum dibayar oleh pihak terkait
                                    </span>
                                </button>
                            </div>
                            {errors.payment_status && (
                                <p className="text-[11px] text-rose-500 font-medium">
                                    {errors.payment_status}
                                </p>
                            )}
                        </div>

                        {/* Catatan Tambahan */}
                        <div className="space-y-1.5">
                            <Label htmlFor="notes" className="text-xs font-semibold">
                                Catatan / Rincian Tambahan (Opsional)
                            </Label>
                            <Textarea
                                id="notes"
                                placeholder="Nama pembeli, rincian barang/jasa, nomor bukti transfer..."
                                value={data.notes}
                                onChange={(e) =>
                                    setData("notes", e.target.value)
                                }
                                className="text-xs min-h-[64px] resize-none"
                            />
                            {errors.notes && (
                                <p className="text-[11px] text-rose-500 font-medium">
                                    {errors.notes}
                                </p>
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
                            className="text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <Save className="h-3.5 w-3.5" />
                            <span>
                                {processing
                                    ? "Menyimpan..."
                                    : isEdit
                                      ? "Perbarui Pendapatan"
                                      : "Simpan Pendapatan"}
                            </span>
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
