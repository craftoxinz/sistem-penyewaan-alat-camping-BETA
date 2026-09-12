import { Printer, Download, QrCode, Tag, Check, Copy } from 'lucide-react';
import QRCode from 'qrcode';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    UnitStatusBadge,
    UnitConditionBadge,
} from '@/components/status-badges';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import type { EquipmentUnit } from '@/types';

interface QrCodeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    unit: EquipmentUnit | null;
}

export function QrCodeModal({ open, onOpenChange, unit }: QrCodeModalProps) {
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!unit) {
            setQrDataUrl('');

            return;
        }

        // Generate high-resolution QR code
        QRCode.toDataURL(unit.unit_code, {
            width: 300,
            margin: 2,
            color: {
                dark: '#09090b',
                light: '#ffffff',
            },
            errorCorrectionLevel: 'H',
        })
            .then((url) => setQrDataUrl(url))
            .catch((err) => console.error('Error generating QR code:', err));
    }, [unit]);

    if (!unit) {
        return null;
    }

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');

        if (!printWindow) {
            toast.error(
                'Gagal membuka jendela cetak. Pastikan pop-up diizinkan.',
            );

            return;
        }

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Cetak Label QR - ${unit.unit_code}</title>
                <style>
                    @page {
                        size: 80mm 60mm;
                        margin: 0;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        margin: 0;
                        padding: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: #fff;
                    }
                    .label-card {
                        width: 70mm;
                        border: 2px solid #000;
                        border-radius: 6px;
                        padding: 8px;
                        text-align: center;
                        box-sizing: border-box;
                    }
                    .store-name {
                        font-size: 10px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        border-bottom: 1px dashed #666;
                        padding-bottom: 3px;
                        margin-bottom: 6px;
                    }
                    .qr-img {
                        width: 36mm;
                        height: 36mm;
                        margin: 0 auto;
                        display: block;
                    }
                    .unit-code {
                        font-family: monospace;
                        font-size: 15px;
                        font-weight: 900;
                        letter-spacing: 1px;
                        margin: 4px 0 2px 0;
                        background: #000;
                        color: #fff;
                        padding: 2px 6px;
                        border-radius: 3px;
                        display: inline-block;
                    }
                    .eq-name {
                        font-size: 11px;
                        font-weight: 700;
                        color: #111;
                        margin-top: 2px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .eq-cat {
                        font-size: 9px;
                        color: #555;
                    }
                </style>
            </head>
            <body>
                <div class="label-card">
                    <div class="store-name">CAMPING RENTAL &bull; INVENTARIS FISIK</div>
                    <img class="qr-img" src="${qrDataUrl}" alt="${unit.unit_code}" />
                    <div>
                        <span class="unit-code">${unit.unit_code}</span>
                    </div>
                    <div class="eq-name">${unit.equipment?.name || 'Alat Camping'}</div>
                    <div class="eq-cat">${unit.equipment?.category?.name || 'Inventaris'} &bull; Kondisi: ${unit.condition.toUpperCase()}</div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => window.close(), 500);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handleDownload = () => {
        if (!qrDataUrl) {
            return;
        }

        const a = document.createElement('a');
        a.href = qrDataUrl;
        a.download = `QR-${unit.unit_code}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success(`QR Code '${unit.unit_code}' berhasil diunduh.`);
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(unit.unit_code);
        setCopied(true);
        toast.success(`Kode '${unit.unit_code}' disalin.`);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base font-bold">
                        <QrCode className="h-5 w-5 text-emerald-500" />
                        <span>Label QR-Code Unit: {unit.unit_code}</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Label QR Code fisik untuk ditempelkan pada unit alat inventaris.
                    </DialogDescription>
                </DialogHeader>

                {/* Card Preview */}
                <div className="my-2 flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
                    <div className="w-full max-w-[280px] rounded-lg border-2 border-zinc-900 bg-white p-4 text-center text-zinc-900 shadow-md">
                        <div className="mb-2 border-b border-dashed border-zinc-400 pb-1 text-[10px] font-extrabold tracking-wider text-zinc-700">
                            CAMPING RENTAL &bull; INVENTARIS FISIK
                        </div>

                        {qrDataUrl ? (
                            <img
                                src={qrDataUrl}
                                alt={`QR ${unit.unit_code}`}
                                className="mx-auto h-40 w-40 object-contain"
                            />
                        ) : (
                            <div className="mx-auto flex h-40 w-40 items-center justify-center text-xs text-muted-foreground">
                                Membuat QR...
                            </div>
                        )}

                        <div className="mt-2">
                            <span className="rounded bg-zinc-900 px-2.5 py-0.5 font-mono text-sm font-black tracking-widest text-white">
                                {unit.unit_code}
                            </span>
                        </div>

                        <div className="mt-2 truncate text-xs font-bold text-zinc-900">
                            {unit.equipment?.name}
                        </div>
                        <div className="text-[10px] text-zinc-600">
                            {unit.equipment?.category?.name} &bull; Kondisi:{' '}
                            {unit.condition.toUpperCase()}
                        </div>
                    </div>

                    {/* Unit Quick Metadata */}
                    <div className="flex items-center gap-2 text-xs">
                        <UnitStatusBadge status={unit.status} />
                        <UnitConditionBadge condition={unit.condition} />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyCode}
                            className="h-6 gap-1 px-2 text-[11px]"
                        >
                            {copied ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                                <Copy className="h-3 w-3" />
                            )}
                            <span>Salin Kode</span>
                        </Button>
                    </div>
                </div>

                <DialogFooter className="flex-row justify-between gap-2 sm:justify-end sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        className="gap-1.5 text-xs"
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span>Unduh PNG</span>
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="text-xs"
                        >
                            Tutup
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handlePrint}
                            className="gap-1.5 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Cetak Stiker Label</span>
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
