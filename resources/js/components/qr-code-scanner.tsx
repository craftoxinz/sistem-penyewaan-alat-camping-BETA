import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
    Camera,
    CameraOff,
    RefreshCw,
    Scan,
    Keyboard,
    CheckCircle2,
    Play,
    Pause,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QrCodeScannerProps {
    onScan: (decodedText: string) => void;
    isActive: boolean;
    placeholder?: string;
    showManualInput?: boolean;
    helperText?: string;
    autoPauseOnScan?: boolean;
    targetTitle?: string;
}

export function QrCodeScanner({
    onScan,
    isActive,
    placeholder = 'Arahkan kamera ke QR Code unit alat...',
    showManualInput = true,
    helperText,
    autoPauseOnScan = true,
    targetTitle,
}: QrCodeScannerProps) {
    const scannerId = useRef(
        `qr-reader-${Math.random().toString(36).substring(2, 9)}`,
    ).current;
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const isScanningRef = useRef<boolean>(false);
    const isLockedRef = useRef<boolean>(false); // Strict lock to prevent spam frames

    const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string>('');
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

    // Fetch cameras on mount/active
    useEffect(() => {
        if (!isActive) {
            return;
        }

        Html5Qrcode.getCameras()
            .then((devices) => {
                if (devices && devices.length > 0) {
                    setCameras(devices);
                    // Prefer back camera if available
                    const backCamera = devices.find(
                        (d) =>
                            d.label.toLowerCase().includes('back') ||
                            d.label.toLowerCase().includes('rear') ||
                            d.label.toLowerCase().includes('belakang') ||
                            d.label.toLowerCase().includes('environment'),
                    );
                    setSelectedCameraId(
                        backCamera ? backCamera.id : devices[0].id,
                    );
                } else {
                    setCameraError(
                        'Tidak ditemukan perangkat kamera yang dapat digunakan.',
                    );
                }
            })
            .catch((err) => {
                console.warn('Camera enumeration error:', err);
                setCameraError(
                    'Izin akses kamera belum diberikan atau kamera tidak terdeteksi.',
                );
            });
    }, [isActive]);

    const stopScanner = async () => {
        if (html5QrCodeRef.current && isScanningRef.current) {
            try {
                await html5QrCodeRef.current.stop();
                isScanningRef.current = false;
            } catch (err) {
                console.warn('Error stopping scanner:', err);
            }
        }

        setIsCameraActive(false);
        setIsPaused(false);
        isLockedRef.current = false;
    };

    const startScanner = async (cameraId: string) => {
        if (!cameraId) {
            return;
        }

        setCameraError(null);
        setIsStarting(true);
        isLockedRef.current = false;
        setIsPaused(false);

        try {
            if (html5QrCodeRef.current && isScanningRef.current) {
                await html5QrCodeRef.current.stop();
                isScanningRef.current = false;
            }

            if (!html5QrCodeRef.current) {
                html5QrCodeRef.current = new Html5Qrcode(scannerId, {
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.QR_CODE,
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.CODE_39,
                        Html5QrcodeSupportedFormats.EAN_13,
                    ],
                    verbose: false,
                });
            }

            await html5QrCodeRef.current.start(
                cameraId,
                {
                    fps: 10,
                    qrbox: { width: 220, height: 220 },
                    aspectRatio: 1.0,
                },
                (decodedText) => {
                    // Strict anti-spam lock: only process if not currently locked/paused
                    if (isLockedRef.current) {
                        return;
                    }

                    const cleanCode = decodedText.trim().toUpperCase();

                    if (!cleanCode) {
                        return;
                    }

                    // Immediately lock so subsequent frames are completely ignored
                    isLockedRef.current = true;
                    setLastScannedCode(cleanCode);

                    if (autoPauseOnScan) {
                        try {
                            html5QrCodeRef.current?.pause(true);
                            setIsPaused(true);
                        } catch (e) {
                            console.warn('Error pausing camera:', e);
                        }
                    }

                    // Trigger callback exactly once
                    onScan(cleanCode);

                    // If not autoPauseOnScan, release lock after 2.5s cooldown
                    if (!autoPauseOnScan) {
                        setTimeout(() => {
                            isLockedRef.current = false;
                        }, 2500);
                    }
                },
                (errorMessage) => {
                    // Ignore non-match frame errors
                },
            );

            isScanningRef.current = true;
            setIsCameraActive(true);
        } catch (err: any) {
            console.error('Start scanner error:', err);
            setCameraError(
                err?.message ||
                    'Gagal memulai kamera. Pastikan izin kamera telah diizinkan pada browser.',
            );
            setIsCameraActive(false);
        } finally {
            setIsStarting(false);
        }
    };

    const resumeScanning = () => {
        isLockedRef.current = false;
        setIsPaused(false);
        setLastScannedCode(null);

        try {
            if (html5QrCodeRef.current && isScanningRef.current) {
                html5QrCodeRef.current.resume();
            } else if (selectedCameraId) {
                startScanner(selectedCameraId);
            }
        } catch (e) {
            console.warn('Error resuming scanner:', e);

            if (selectedCameraId) {
                startScanner(selectedCameraId);
            }
        }
    };
    const togglePause = () => {
        if (isPaused) {
            resumeScanning();
        } else {
            if (html5QrCodeRef.current && isScanningRef.current) {
                try {
                    html5QrCodeRef.current.pause(true);
                } catch (e) {
                    console.warn('Error pausing scanner:', e);
                }
            }
            setIsPaused(true);
        }
    };

    const switchCamera = () => {
        if (cameras.length < 2) {
            return;
        }
        const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
        const nextIndex = (currentIndex + 1) % cameras.length;
        const nextCamera = cameras[nextIndex];
        if (nextCamera) {
            setSelectedCameraId(nextCamera.id);
            startScanner(nextCamera.id);
        }
    };
    useEffect(() => {
        if (isActive && selectedCameraId) {
            startScanner(selectedCameraId);
        } else {
            stopScanner();
        }

        return () => {
            if (html5QrCodeRef.current && isScanningRef.current) {
                html5QrCodeRef.current.stop().catch(() => {});
                isScanningRef.current = false;
            }
        };
    }, [isActive, selectedCameraId]);

    const handleManualSubmit = (e?: React.SyntheticEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const clean = manualCode.trim().toUpperCase();

        if (!clean) {
            return;
        }

        setLastScannedCode(clean);

        if (
            autoPauseOnScan &&
            html5QrCodeRef.current &&
            isScanningRef.current
        ) {
            try {
                html5QrCodeRef.current.pause(true);
                setIsPaused(true);
            } catch (e) {}
        }

        onScan(clean);
        setManualCode('');
    };

    return (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-xs">
            {/* Header info */}
            <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <Scan
                        className={`h-4 w-4 ${isPaused ? 'text-zinc-400' : 'animate-pulse text-emerald-500'}`}
                    />
                    <span>
                        {targetTitle
                            ? `Pemindaian: ${targetTitle}`
                            : 'Pemindai Kamera Barcode & QR'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    {/* Camera selector */}
                    {cameras.length > 1 && !isPaused && (
                        <select
                            value={selectedCameraId}
                            onChange={(e) => {
                                setSelectedCameraId(e.target.value);
                                startScanner(e.target.value);
                            }}
                            className="h-7 max-w-[140px] truncate rounded border border-border bg-background px-2 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                            {cameras.map((cam) => (
                                <option key={cam.id} value={cam.id}>
                                    {cam.label || `Kamera ${cam.id.slice(0, 5)}`}
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Pause / Resume Button */}
                    {isCameraActive && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={togglePause}
                            title={isPaused ? 'Lanjutkan Scan' : 'Jeda Kamera'}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                            {isPaused ? (
                                <Play className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                                <Pause className="h-3.5 w-3.5" />
                            )}
                        </Button>
                    )}

                    {/* Switch Camera Button if multiple */}
                    {cameras.length > 1 && !isPaused && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={switchCamera}
                            title="Ganti Kamera"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Video Viewport Area */}
            <div className="relative flex min-h-[220px] flex-col items-center justify-center overflow-hidden rounded-md border border-zinc-800 bg-zinc-950">
                {/* HTML5 QR Container */}
                <div
                    id={scannerId}
                    className={`w-full max-w-[280px] overflow-hidden ${isPaused ? 'opacity-40 grayscale' : ''}`}
                />

                {/* Paused / Result Overlay */}
                {isPaused && lastScannedCode && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950/85 p-4 text-center text-white backdrop-blur-xs">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                            <CheckCircle2 className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-400">
                                Berhasil Dipindai:
                            </p>
                            <p className="font-mono text-base font-bold tracking-wider text-emerald-400">
                                {lastScannedCode}
                            </p>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            onClick={resumeScanning}
                            className="mt-1 gap-1.5 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Scan Ulang</span>
                        </Button>
                    </div>
                )}

                {/* Loading / Starting State */}
                {isStarting && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950/80 text-white">
                        <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
                        <span className="text-xs">Mengaktifkan kamera...</span>
                    </div>
                )}

                {/* Camera error state */}
                {cameraError && (
                    <div className="max-w-xs space-y-2 p-4 text-center text-zinc-300">
                        <CameraOff className="mx-auto h-8 w-8 text-amber-400" />
                        <p className="text-xs font-medium text-amber-300">
                            {cameraError}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                            Gunakan input kode manual atau USB Barcode Scanner
                            di bawah ini jika kamera tidak tersedia.
                        </p>
                    </div>
                )}
            </div>

            {/* Helper status */}
            <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
                <span>
                    {isPaused
                        ? 'Pemindaian selesai.'
                        : helperText || placeholder}
                </span>
                {lastScannedCode && !isPaused && (
                    <span className="flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> {lastScannedCode}
                    </span>
                )}
            </div>

            {/* Manual input fallback / barcode scanner input */}
            {showManualInput && !isPaused && (
                <div className="flex gap-2 border-t border-border pt-1">
                    <div className="relative flex-1">
                        <Keyboard className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleManualSubmit(e);
                                }
                            }}
                            placeholder="Ketik kode unit / barcode (e.g. TND-4P-001)..."
                            className="h-8 pl-8 font-mono text-xs font-bold uppercase"
                        />
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={handleManualSubmit}
                        className="h-8 px-3 text-xs font-semibold"
                    >
                        Gunakan
                    </Button>
                </div>
            )}
        </div>
    );
}
