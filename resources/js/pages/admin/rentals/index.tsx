import { Head, Link, router } from '@inertiajs/react';
import {
    ShoppingBag,
    Search,
    CheckCircle2,
    Clock,
    Layers,
    RotateCcw,
    DollarSign,
    User as UserIcon,
    AlertCircle,
    AlertTriangle,
    Ban,
    Calculator,
    Eye,
    FileText,
    Scan,
    QrCode,
    CalendarDays,
    TrendingUp,
    Package,
    Timer,
    Calendar,
    XCircle,
    RefreshCw,
    ShieldAlert,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { QrCodeScanner } from '@/components/qr-code-scanner';
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
import { formatRupiah, formatDate, formatDateTime } from '@/lib/formatters';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import type { Rental, EquipmentUnit, PaginatedData, BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Menu Utama',
        href: '/admin',
    },
    {
        title: 'Pesanan & Transaksi',
        href: '/admin/rentals',
    },
];

interface RentalStats {
    total: number;
    pending_dp: number;
    ready_pickup: number;
    active: number;
    completed: number;
    completed_this_month: number;
    cancelled: number;
    defaulted: number;
    overdue: number;
    expired_schedule?: number;
    stats_month: string;
}

interface RentalsIndexProps {
    rentals: PaginatedData<Rental>;
    stats: RentalStats;
    filters: {
        status: string;
        search: string;
        stats_month: string;
        per_page?: number;
    };
}

export default function RentalsIndex({ rentals, stats, filters }: RentalsIndexProps) {
    // DP Verification Modal State
    const [dpModalOpen, setDpModalOpen] = useState<boolean>(false);
    const [selectedRentalForDp, setSelectedRentalForDp] =
        useState<Rental | null>(null);
    const [dpNotes, setDpNotes] = useState<string>('');
    const [submittingDp, setSubmittingDp] = useState<boolean>(false);

    // Handover Modal State (SRS-F-010)
    const [handoverModalOpen, setHandoverModalOpen] = useState<boolean>(false);
    const [selectedRentalForHandover, setSelectedRentalForHandover] =
        useState<Rental | null>(null);
    const [handoverAssignments, setHandoverAssignments] = useState<
        Record<number, string[]>
    >({});
    const [handoverNotes, setHandoverNotes] = useState<string>('');
    const [submittingHandover, setSubmittingHandover] =
        useState<boolean>(false);

    // Return Modal State (SRS-F-010, SRS-F-011, SRS-F-007)
    const [returnModalOpen, setReturnModalOpen] = useState<boolean>(false);
    const [selectedRentalForReturn, setSelectedRentalForReturn] =
        useState<Rental | null>(null);
    const [returnConditions, setReturnConditions] = useState<
        Record<number, { condition: string; notes: string; damageFee: number }>
    >({});
    const [lateDays, setLateDays] = useState<number>(0);
    const [lateFee, setLateFee] = useState<string>('0');
    const [damageFee, setDamageFee] = useState<string>('0');
    const [additionalChargePaid, setAdditionalChargePaid] = useState<number>(0);
    const [finePaymentStatus, setFinePaymentStatus] = useState<string>('none');
    const [depositStatus, setDepositStatus] = useState<string>('refunded');
    const [depositRefundAmount, setDepositRefundAmount] = useState<string>('0');
    const [returnAdminNotes, setReturnAdminNotes] = useState<string>('');
    const [submittingReturn, setSubmittingReturn] = useState<boolean>(false);

    // Defaulted / Lost Modal State
    const [defaultedModalOpen, setDefaultedModalOpen] = useState<boolean>(false);
    const [selectedRentalForDefaulted, setSelectedRentalForDefaulted] =
        useState<Rental | null>(null);
    const [defaultedAdminNotes, setDefaultedAdminNotes] = useState<string>('');
    const [defaultedSuspendUser, setDefaultedSuspendUser] = useState<boolean>(true);
    const [submittingDefaulted, setSubmittingDefaulted] = useState<boolean>(false);

    // Reschedule Modal State
    const [rescheduleModalOpen, setRescheduleModalOpen] = useState<boolean>(false);
    const [selectedRentalForReschedule, setSelectedRentalForReschedule] =
        useState<Rental | null>(null);
    const [newStartDate, setNewStartDate] = useState<string>('');
    const [newEndDate, setNewEndDate] = useState<string>('');
    const [rescheduleNotes, setRescheduleNotes] = useState<string>('');
    const [submittingReschedule, setSubmittingReschedule] =
        useState<boolean>(false);

    // Cancel Resolution Modal State
    const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
    const [selectedRentalForCancel, setSelectedRentalForCancel] =
        useState<Rental | null>(null);
    const [cancellationType, setCancellationType] = useState<
        'refund_dp' | 'forfeit_dp' | 'standard'
    >('refund_dp');
    const [cancelAdminNotes, setCancelAdminNotes] = useState<string>('');
    const [submittingCancel, setSubmittingCancel] = useState<boolean>(false);

    // QR Scan Modes for Handover and Return
    const [handoverScanMode, setHandoverScanMode] = useState<'manual' | 'scan'>(
        'manual',
    );
    const [returnScanMode, setReturnScanMode] = useState<'manual' | 'scan'>(
        'manual',
    );

    // Unit Confirmation Tracker (Each slot must be confirmed manually or via QR)
    // Key format for handover: `${rentalItemId}_${unitIdx}` -> 'manual' | 'qr'
    const [handoverConfirmations, setHandoverConfirmations] = useState<
        Record<string, 'manual' | 'qr'>
    >({});
    // Key for return: rentalItemUnitId -> 'manual' | 'qr'
    const [returnConfirmations, setReturnConfirmations] = useState<
        Record<number, 'manual' | 'qr'>
    >({});

    // Targeted Slot Scanners (One-shot per item/slot to avoid spam)
    const [slotScanTarget, setSlotScanTarget] = useState<{
        rentalItemId: number;
        unitIdx: number;
        equipmentName: string;
        equipmentId: number;
    } | null>(null);

    const [returnVerificationTarget, setReturnVerificationTarget] = useState<{
        rentalItemUnitId: number;
        expectedCode: string;
        equipmentName: string;
    } | null>(null);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const search = formData.get('search') as string;
        router.get(
            '/admin/rentals',
            { ...filters, search },
            { preserveState: true },
        );
    };

    const handleStatusFilter = (status: string) => {
        router.get(
            '/admin/rentals',
            { ...filters, status },
            { preserveState: true },
        );
    };

    const handleStatsMonthChange = (month: string) => {
        router.get(
            '/admin/rentals',
            { ...filters, stats_month: month },
            { preserveState: true },
        );
    };

    // Open DP Verification Dialog
    const openDpDialog = (rental: Rental) => {
        setSelectedRentalForDp(rental);
        setDpNotes('');
        setDpModalOpen(true);
    };

    const handleVerifyDp = (action: 'approve' | 'reject') => {
        if (!selectedRentalForDp) {
            return;
        }

        setSubmittingDp(true);

        router.post(
            `/admin/rentals/${selectedRentalForDp.id}/verify-dp`,
            {
                action,
                admin_notes: dpNotes,
            },
            {
                onSuccess: () => {
                    setDpModalOpen(false);
                    toast.success(
                        action === 'approve'
                            ? 'Pembayaran DP berhasil diverifikasi!'
                            : 'Pembayaran DP telah ditolak.',
                    );
                },
                onError: () => toast.error('Gagal memproses verifikasi DP.'),
                onFinish: () => setSubmittingDp(false),
            },
        );
    };

    // Open Reschedule Dialog
    const openRescheduleDialog = (rental: Rental) => {
        setSelectedRentalForReschedule(rental);
        const todayStr = new Date().toISOString().split('T')[0];
        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + (rental.total_days || 1));
        const nextDayStr = nextDay.toISOString().split('T')[0];

        setNewStartDate(rental.start_date >= todayStr ? rental.start_date : todayStr);
        setNewEndDate(rental.end_date >= nextDayStr ? rental.end_date : nextDayStr);
        setRescheduleNotes('');
        setRescheduleModalOpen(true);
    };

    const submitReschedule = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRentalForReschedule) return;

        setSubmittingReschedule(true);
        router.post(
            `/admin/rentals/${selectedRentalForReschedule.id}/reschedule`,
            {
                start_date: newStartDate,
                end_date: newEndDate,
                admin_notes: rescheduleNotes,
            },
            {
                onSuccess: () => {
                    setRescheduleModalOpen(false);
                    toast.success('Jadwal sewa pesanan berhasil diperbarui!');
                },
                onError: (err) => {
                    toast.error(
                        (Object.values(err)[0] as string) ||
                        'Gagal menjadwalkan ulang pesanan.',
                    );
                },
                onFinish: () => setSubmittingReschedule(false),
            },
        );
    };

    // Open Cancel Resolution Dialog
    const openCancelDialog = (rental: Rental) => {
        setSelectedRentalForCancel(rental);
        setCancellationType(
            rental.dp_verified_at || Number(rental.dp_amount) > 0
                ? 'refund_dp'
                : 'standard',
        );
        setCancelAdminNotes('');
        setCancelModalOpen(true);
    };

    const submitCancel = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRentalForCancel) return;

        setSubmittingCancel(true);
        router.post(
            `/admin/rentals/${selectedRentalForCancel.id}/cancel`,
            {
                cancellation_type: cancellationType,
                admin_notes: cancelAdminNotes,
            },
            {
                onSuccess: () => {
                    setCancelModalOpen(false);
                    toast.success('Pesanan berhasil dibatalkan.');
                },
                onError: (err) => {
                    toast.error(
                        (Object.values(err)[0] as string) ||
                        'Gagal membatalkan pesanan.',
                    );
                },
                onFinish: () => setSubmittingCancel(false),
            },
        );
    };

    // Open Handover Dialog (Serah Terima Unit)
    const openHandoverDialog = (rental: Rental) => {
        setSelectedRentalForHandover(rental);
        setHandoverScanMode('manual');
        setHandoverConfirmations({});
        const initialAssignments: Record<number, string[]> = {};

        rental.items?.forEach((item) => {
            // If item has available units, pre-select first N units
            const available: EquipmentUnit[] =
                item.equipment?.available_units ||
                item.equipment?.availableUnits ||
                [];
            const selected = available
                .slice(0, item.quantity)
                .map((u: EquipmentUnit) => u.id.toString());
            initialAssignments[item.id] = selected;
        });

        setHandoverAssignments(initialAssignments);
        setHandoverNotes('');
        setHandoverModalOpen(true);
    };

    const confirmSlotManually = (rentalItemId: number, unitIdx: number) => {
        const selectedUnitId = handoverAssignments[rentalItemId]?.[unitIdx];

        if (!selectedUnitId) {
            toast.error('Pilih unit terlebih dahulu sebelum konfirmasi.');

            return;
        }

        const key = `${rentalItemId}_${unitIdx}`;
        setHandoverConfirmations((prev) => ({
            ...prev,
            [key]: 'manual',
        }));
        toast.success(
            `✓ Unit #${unitIdx + 1} berhasil dikonfirmasi secara manual.`,
        );
    };

    const unlockSlotConfirmation = (rentalItemId: number, unitIdx: number) => {
        const key = `${rentalItemId}_${unitIdx}`;
        setHandoverConfirmations((prev) => {
            const next = { ...prev };
            delete next[key];

            return next;
        });
    };

    const handleHandoverScan = async (scannedCode: string) => {
        if (!selectedRentalForHandover) {
            return;
        }

        try {
            const res = await fetch(
                `/admin/units/scan-lookup?unit_code=${encodeURIComponent(scannedCode)}`,
            );
            const data = await res.json();

            if (!res.ok || !data.success) {
                toast.error(
                    data.message || `Unit '${scannedCode}' tidak ditemukan.`,
                );

                return;
            }

            const unit = data.unit;

            if (unit.status !== 'tersedia') {
                toast.error(
                    `Unit '${scannedCode}' berstatus '${unit.status}' (hanya unit 'Tersedia' yang dapat diserahterimakan).`,
                );

                return;
            }

            // Find matching equipment in order
            const matchingItem = selectedRentalForHandover.items?.find(
                (it) => it.equipment_id === unit.equipment_id,
            );

            if (!matchingItem) {
                toast.error(
                    `Unit '${scannedCode}' (${unit.equipment?.name}) tidak ada di pesanan ini.`,
                );

                return;
            }

            // Check if already assigned
            const currentArr = [
                ...(handoverAssignments[matchingItem.id] || []),
            ];

            if (currentArr.includes(unit.id.toString())) {
                toast.info(
                    `Unit '${scannedCode}' sudah dipilih untuk ${matchingItem.equipment?.name}.`,
                );

                return;
            }

            // Find first empty or unconfirmed slot
            let targetIdx = currentArr.findIndex(
                (val, idx) =>
                    !val || !handoverConfirmations[`${matchingItem.id}_${idx}`],
            );

            if (targetIdx === -1) {
                targetIdx =
                    currentArr.length < matchingItem.quantity
                        ? currentArr.length
                        : 0;
            }

            currentArr[targetIdx] = unit.id.toString();

            setHandoverAssignments({
                ...handoverAssignments,
                [matchingItem.id]: currentArr,
            });

            // Mark slot as confirmed via QR
            setHandoverConfirmations((prev) => ({
                ...prev,
                [`${matchingItem.id}_${targetIdx}`]: 'qr',
            }));

            toast.success(
                `✓ Unit '${unit.unit_code}' (${unit.equipment?.name}) terdeteksi & terkonfirmasi QR!`,
            );
        } catch (err) {
            console.error('Scan lookup error:', err);
            toast.error('Gagal memeriksa unit di server.');
        }
    };

    const handleSpecificSlotScan = async (scannedCode: string) => {
        if (!slotScanTarget || !selectedRentalForHandover) {
            return;
        }

        try {
            const res = await fetch(
                `/admin/units/scan-lookup?unit_code=${encodeURIComponent(scannedCode)}`,
            );
            const data = await res.json();

            if (!res.ok || !data.success) {
                toast.error(
                    data.message || `Unit '${scannedCode}' tidak ditemukan.`,
                );

                return;
            }

            const unit = data.unit;

            if (unit.equipment_id !== slotScanTarget.equipmentId) {
                toast.error(
                    `Unit '${scannedCode}' adalah ${unit.equipment?.name}, bukan ${slotScanTarget.equipmentName}.`,
                );

                return;
            }

            if (unit.status !== 'tersedia') {
                toast.error(
                    `Unit '${scannedCode}' berstatus '${unit.status}' (tidak dapat disewa).`,
                );

                return;
            }

            // Check if already assigned to another slot
            const isAlreadyInAnotherSlot = Object.entries(
                handoverAssignments,
            ).some(([itemId, unitIds]) => {
                return unitIds.some((id, idx) => {
                    if (
                        parseInt(itemId) === slotScanTarget.rentalItemId &&
                        idx === slotScanTarget.unitIdx
                    ) {
                        return false;
                    }

                    return id === unit.id.toString();
                });
            });

            if (isAlreadyInAnotherSlot) {
                toast.error(
                    `Unit '${scannedCode}' sudah dipilih pada slot lain.`,
                );

                return;
            }

            const currentArr = [
                ...(handoverAssignments[slotScanTarget.rentalItemId] || []),
            ];
            currentArr[slotScanTarget.unitIdx] = unit.id.toString();

            setHandoverAssignments({
                ...handoverAssignments,
                [slotScanTarget.rentalItemId]: currentArr,
            });

            // Mark slot as confirmed via QR
            setHandoverConfirmations((prev) => ({
                ...prev,
                [`${slotScanTarget.rentalItemId}_${slotScanTarget.unitIdx}`]:
                    'qr',
            }));

            toast.success(
                `✓ Unit #${slotScanTarget.unitIdx + 1} (${unit.unit_code}) berhasil dipasangkan & terkonfirmasi QR!`,
            );
            setSlotScanTarget(null); // Instantly stop camera and close modal
        } catch (err) {
            console.error('Specific slot scan error:', err);
            toast.error('Gagal memverifikasi unit di server.');
        }
    };

    const handleSpecificReturnScan = (scannedCode: string) => {
        if (!returnVerificationTarget) {
            return;
        }

        if (
            scannedCode.toUpperCase() ===
            returnVerificationTarget.expectedCode.toUpperCase()
        ) {
            setReturnConfirmations((prev) => ({
                ...prev,
                [returnVerificationTarget.rentalItemUnitId]: 'qr',
            }));
            toast.success(
                `✓ Unit fisik '${scannedCode}' terverifikasi & terkonfirmasi QR!`,
            );
            setReturnVerificationTarget(null); // Instantly stop camera and close modal
        } else {
            toast.error(
                `Kode yang di-scan adalah '${scannedCode}', sedangkan unit yang diharapkan adalah '${returnVerificationTarget.expectedCode}'.`,
            );
        }
    };

    const confirmReturnManually = (rentalItemUnitId: number) => {
        setReturnConfirmations((prev) => ({
            ...prev,
            [rentalItemUnitId]: 'manual',
        }));
        toast.success(
            '✓ Pemeriksaan fisik unit berhasil dikonfirmasi secara manual.',
        );
    };

    const unlockReturnConfirmation = (rentalItemUnitId: number) => {
        setReturnConfirmations((prev) => {
            const next = { ...prev };
            delete next[rentalItemUnitId];

            return next;
        });
    };

    const handleUnitSelect = (
        rentalItemId: number,
        unitIndex: number,
        unitId: string,
    ) => {
        const current = [...(handoverAssignments[rentalItemId] || [])];
        current[unitIndex] = unitId;
        setHandoverAssignments({
            ...handoverAssignments,
            [rentalItemId]: current,
        });
        // Reset confirmation for this slot when changed
        unlockSlotConfirmation(rentalItemId, unitIndex);
    };

    const submitHandover = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedRentalForHandover) {
            return;
        }

        const totalRequiredUnits =
            selectedRentalForHandover.items?.reduce(
                (acc, it) => acc + it.quantity,
                0,
            ) || 0;
        const totalConfirmedUnits = Object.keys(handoverConfirmations).length;

        if (totalConfirmedUnits < totalRequiredUnits) {
            toast.error(
                `Harap konfirmasi semua (${totalRequiredUnits}) unit fisik sebelum serah terima (${totalConfirmedUnits}/${totalRequiredUnits} terkonfirmasi).`,
            );

            return;
        }

        // Validate that all items have required quantity of units selected
        for (const item of selectedRentalForHandover.items || []) {
            const assigned = handoverAssignments[item.id] || [];
            const filtered = assigned.filter(Boolean);

            if (filtered.length < item.quantity) {
                toast.error(
                    `Harap pilih ${item.quantity} unit fisik untuk ${item.equipment?.name}.`,
                );

                return;
            }
        }

        const assignmentsPayload = Object.entries(handoverAssignments).map(
            ([rentalItemId, unitIds]) => ({
                rental_item_id: parseInt(rentalItemId),
                unit_ids: unitIds.map((id) => parseInt(id)),
                notes_out:
                    handoverNotes || 'Unit serah terima lengkap & bersih.',
            }),
        );

        setSubmittingHandover(true);

        router.post(
            `/admin/rentals/${selectedRentalForHandover.id}/handover`,
            {
                assignments: assignmentsPayload,
                admin_notes: handoverNotes,
            },
            {
                onSuccess: () => {
                    setHandoverModalOpen(false);
                    toast.success(
                        `Serah terima unit ${selectedRentalForHandover.invoice_number} berhasil dicatat & COD lunas!`,
                    );
                },
                onError: (err) => {
                    toast.error(
                        (Object.values(err)[0] as string) ||
                        'Gagal memproses serah terima.',
                    );
                },
                onFinish: () => setSubmittingHandover(false),
            },
        );
    };

    const recalculateDepositSettlement = (
        currentLateFee: number,
        currentDamageFee: number,
        totalDeposit: number,
    ) => {
        const totalFines =
            Math.max(0, currentLateFee) + Math.max(0, currentDamageFee);
        const net = totalDeposit - totalFines;

        if (net >= 0) {
            setDepositStatus(net > 0 ? 'refunded' : 'forfeited');
            setDepositRefundAmount(net.toString());
            setAdditionalChargePaid(0);
            setFinePaymentStatus(
                totalFines > 0 ? 'settled_from_deposit' : 'none',
            );
        } else {
            setDepositStatus('forfeited');
            setDepositRefundAmount('0');
            setAdditionalChargePaid(Math.abs(net));
            setFinePaymentStatus('paid_extra_cash');
        }
    };

    const handleLateFeeChange = (val: string) => {
        setLateFee(val);
        const lFee = parseFloat(val) || 0;
        const dFee = parseFloat(damageFee) || 0;
        const dep = Number(selectedRentalForReturn?.total_deposit || 0);
        recalculateDepositSettlement(lFee, dFee, dep);
    };

    const handleDamageFeeChange = (val: string) => {
        setDamageFee(val);
        const lFee = parseFloat(lateFee) || 0;
        const dFee = parseFloat(val) || 0;
        const dep = Number(selectedRentalForReturn?.total_deposit || 0);
        recalculateDepositSettlement(lFee, dFee, dep);
    };

    const handleUnitConditionChange = (
        iuId: number,
        condition: string,
        equipment?: any,
    ) => {
        let autoFee = 0;
        if (condition === 'butuh_perbaikan') {
            autoFee = Number(equipment?.fine_minor_damage || 0);
        } else if (condition === 'rusak') {
            autoFee = Number(equipment?.fine_heavy_damage || 0);
        } else if (condition === 'hilang') {
            autoFee = Number(equipment?.fine_lost || 0);
        } else {
            autoFee = 0;
        }

        const nextConditions = {
            ...returnConditions,
            [iuId]: {
                ...returnConditions[iuId],
                condition,
                damageFee: autoFee,
            },
        };
        setReturnConditions(nextConditions);

        const totalDmg = Object.values(nextConditions).reduce(
            (sum, c) => sum + (Number(c.damageFee) || 0),
            0,
        );
        setDamageFee(totalDmg.toString());
        const lFee = parseFloat(lateFee) || 0;
        const dep = Number(selectedRentalForReturn?.total_deposit || 0);
        recalculateDepositSettlement(lFee, totalDmg, dep);
    };

    const handleUnitDamageFeeChange = (iuId: number, feeVal: string) => {
        const feeNum = parseFloat(feeVal) || 0;
        const nextConditions = {
            ...returnConditions,
            [iuId]: {
                ...returnConditions[iuId],
                damageFee: feeNum,
            },
        };
        setReturnConditions(nextConditions);

        const totalDmg = Object.values(nextConditions).reduce(
            (sum, c) => sum + (Number(c.damageFee) || 0),
            0,
        );
        setDamageFee(totalDmg.toString());
        const lFee = parseFloat(lateFee) || 0;
        const dep = Number(selectedRentalForReturn?.total_deposit || 0);
        recalculateDepositSettlement(lFee, totalDmg, dep);
    };

    // Open Return Dialog (Pengembalian Unit)
    const openReturnDialog = (rental: Rental) => {
        setSelectedRentalForReturn(rental);
        setReturnScanMode('manual');
        setReturnConfirmations({});
        const initialConds: Record<
            number,
            { condition: string; notes: string; damageFee: number }
        > = {};

        rental.items?.forEach((item) => {
            item.item_units?.forEach((iu) => {
                initialConds[iu.id] = {
                    condition: 'baik',
                    notes: 'Kembali lengkap & bersih.',
                    damageFee: 0,
                };
            });
        });

        setReturnConditions(initialConds);

        // Automatic Late Return Calculation
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(rental.end_date);
        endDate.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - endDate.getTime();
        const daysLate = Math.max(
            0,
            Math.ceil(diffTime / (1000 * 60 * 60 * 24)),
        );

        const dailyRate =
            rental.total_days > 0
                ? Number(rental.subtotal_price) / rental.total_days
                : 0;
        const calculatedLateFee = daysLate * dailyRate;

        setLateDays(daysLate);
        setLateFee(calculatedLateFee.toString());
        setDamageFee('0');

        const dep = Number(rental.total_deposit || 0);
        recalculateDepositSettlement(calculatedLateFee, 0, dep);

        setReturnAdminNotes(
            daysLate > 0
                ? `Pengembalian terlambat ${daysLate} hari. Denda keterlambatan disesuaikan.`
                : '',
        );
        setReturnModalOpen(true);
    };

    const handleReturnScan = (scannedCode: string) => {
        if (!selectedRentalForReturn) {
            return;
        }

        let matchedItemUnit: any = null;
        let matchedEquipmentName = '';

        for (const item of selectedRentalForReturn.items || []) {
            for (const iu of item.item_units || []) {
                if (
                    iu.equipment_unit?.unit_code?.toUpperCase() ===
                    scannedCode.toUpperCase()
                ) {
                    matchedItemUnit = iu;
                    matchedEquipmentName = item.equipment?.name || '';
                    break;
                }
            }

            if (matchedItemUnit) {
                break;
            }
        }

        if (matchedItemUnit) {
            setReturnConfirmations((prev) => ({
                ...prev,
                [matchedItemUnit.id]: 'qr',
            }));
            toast.success(
                `✓ Fisik unit '${scannedCode}' (${matchedEquipmentName}) terkonfirmasi QR!`,
            );
        } else {
            toast.error(
                `Unit '${scannedCode}' tidak terdaftar pada pesanan ini.`,
            );
        }
    };

    const submitReturn = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedRentalForReturn) {
            return;
        }

        const returnsPayload = Object.entries(returnConditions).map(
            ([itemUnitId, data]) => ({
                rental_item_unit_id: parseInt(itemUnitId),
                condition_in: data.condition,
                notes_in: data.notes,
                damage_fee: data.damageFee || 0,
            }),
        );

        setSubmittingReturn(true);

        const parsedLateFee = parseFloat(lateFee) || 0;
        const parsedDamageFee = parseFloat(damageFee) || 0;
        const totalFine = parsedLateFee + parsedDamageFee;

        router.post(
            `/admin/rentals/${selectedRentalForReturn.id}/return`,
            {
                returns: returnsPayload,
                late_days: lateDays,
                late_fee: parsedLateFee,
                damage_fee: parsedDamageFee,
                total_fine: totalFine,
                additional_charge_paid: additionalChargePaid,
                fine_payment_status: finePaymentStatus,
                deposit_status: depositStatus,
                deposit_refund_amount: parseFloat(depositRefundAmount) || 0,
                admin_notes: returnAdminNotes,
            },
            {
                onSuccess: () => {
                    setReturnModalOpen(false);
                    toast.success(
                        `Pengembalian ${selectedRentalForReturn.invoice_number} selesai dan deposit/denda diselesaikan!`,
                    );
                },
                onError: (err) => {
                    toast.error(
                        (Object.values(err)[0] as string) ||
                        'Gagal memproses pengembalian.',
                    );
                },
                onFinish: () => setSubmittingReturn(false),
            },
        );
    };

    // Open Defaulted / Lost Gear Dialog
    const openDefaultedDialog = (rental: Rental) => {
        setSelectedRentalForDefaulted(rental);
        setDefaultedAdminNotes(
            'Penyewa tidak mengembalikan unit / barang dibawa kabur. Jaminan deposit disita penuh dan akun ditangguhkan.',
        );
        setDefaultedSuspendUser(true);
        setDefaultedModalOpen(true);
    };

    const submitDefaulted = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRentalForDefaulted) return;

        setSubmittingDefaulted(true);
        router.post(
            `/admin/rentals/${selectedRentalForDefaulted.id}/defaulted`,
            {
                admin_notes: defaultedAdminNotes,
                suspend_user: defaultedSuspendUser,
            },
            {
                onSuccess: () => {
                    setDefaultedModalOpen(false);
                    toast.success(
                        `Pesanan ${selectedRentalForDefaulted.invoice_number} berhasil ditandai sebagai bermasalah/hilang dan deposit disita penuh.`,
                    );
                },
                onError: (err) => {
                    toast.error(
                        (Object.values(err)[0] as string) ||
                        'Gagal memproses status defaulted.',
                    );
                },
                onFinish: () => setSubmittingDefaulted(false),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Pesanan & Transaksi - Admin" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Pesanan & Transaksi
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Kelola pemesanan, verifikasi pembayaran, serah terima unit, dan pengembalian alat.
                        </p>
                    </div>
                </div>

                {/* ── Statistics Cards (2 Rows) ───────────────────────────────── */}
                <div className="space-y-4">
                    {/* Header Bar for Operational Statistics */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold tracking-tight text-foreground">
                                Ringkasan Status & Operasional Sewa
                            </span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-1.5 backdrop-blur-sm">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                                Filter Rekap Bulanan:
                            </span>
                            <input
                                type="month"
                                value={filters?.stats_month || ''}
                                onChange={(e) =>
                                    handleStatsMonthChange(e.target.value)
                                }
                                className="h-6 rounded border border-border bg-background px-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                    </div>

                    {/* Row 1: Alur Utama Operasional (4 Cards) */}
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                        {/* 1. Total Pesanan */}
                        <button
                            type="button"
                            onClick={() => handleStatusFilter('all')}
                            className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${
                                filters.status === 'all'
                                    ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/30'
                                    : 'border-border bg-card hover:border-border/80'
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                        <ShoppingBag className="h-4.5 w-4.5" />
                                    </div>
                                    <span className="rounded-full border border-border/80 bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                        Semua
                                    </span>
                                </div>
                                <div className="mt-3">
                                    <p className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
                                        {stats?.total ?? 0}
                                    </p>
                                    <h3 className="mt-1 text-xs font-bold text-foreground">
                                        Total Semua Pesanan
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        Seluruh data transaksi
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-2.5 text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                                <span>Lihat seluruh data</span>
                                <span>&rarr;</span>
                            </div>
                        </button>

                        {/* 2. Menunggu Verifikasi DP */}
                        <button
                            type="button"
                            onClick={() => handleStatusFilter('pending_dp')}
                            className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${
                                filters.status === 'pending_dp'
                                    ? 'border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/30'
                                    : 'border-amber-200/80 bg-gradient-to-b from-amber-50/60 to-card hover:border-amber-300 dark:border-amber-900/40 dark:from-amber-950/20 dark:to-card dark:hover:border-amber-800/60'
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                        <Clock className="h-4.5 w-4.5" />
                                    </div>
                                    {(stats?.pending_dp ?? 0) > 0 ? (
                                        <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                            {stats?.pending_dp} Antrean
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                            Clear
                                        </span>
                                    )}
                                </div>
                                <div className="mt-3">
                                    <p className="text-3xl font-extrabold tracking-tight tabular-nums text-amber-600 dark:text-amber-400">
                                        {stats?.pending_dp ?? 0}
                                    </p>
                                    <h3 className="mt-1 text-xs font-bold text-amber-900 dark:text-amber-200">
                                        Verifikasi Bukti DP
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        Perlu validasi transfer
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-2.5 text-[11px] font-medium text-amber-700/80 group-hover:text-amber-700 dark:text-amber-400/80 dark:group-hover:text-amber-300">
                                <span>
                                    {(stats?.pending_dp ?? 0) > 0
                                        ? 'Perlu diproses segera'
                                        : 'Tidak ada antrean pending'}
                                </span>
                                <span>&rarr;</span>
                            </div>
                        </button>

                        {/* 3. Siap Diambil */}
                        <button
                            type="button"
                            onClick={() => handleStatusFilter('ready_pickup')}
                            className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${
                                filters.status === 'ready_pickup'
                                    ? 'border-blue-500/60 bg-blue-500/10 ring-1 ring-blue-500/30'
                                    : 'border-blue-200/80 bg-gradient-to-b from-blue-50/60 to-card hover:border-blue-300 dark:border-blue-900/40 dark:from-blue-950/20 dark:to-card dark:hover:border-blue-800/60'
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                        <Package className="h-4.5 w-4.5" />
                                    </div>
                                    {(stats?.ready_pickup ?? 0) > 0 && (
                                        <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                            {stats?.ready_pickup} Siap
                                        </span>
                                    )}
                                </div>
                                <div className="mt-3">
                                    <p className="text-3xl font-extrabold tracking-tight tabular-nums text-blue-600 dark:text-blue-400">
                                        {stats?.ready_pickup ?? 0}
                                    </p>
                                    <h3 className="mt-1 text-xs font-bold text-blue-900 dark:text-blue-200">
                                        Siap Serah Terima
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        DP valid & siap diambil
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-2.5 text-[11px] font-medium text-blue-700/80 group-hover:text-blue-700 dark:text-blue-400/80 dark:group-hover:text-blue-300">
                                <span>
                                    {(stats?.ready_pickup ?? 0) > 0
                                        ? 'Menunggu pengambilan unit'
                                        : 'Belum ada jadwal ambil'}
                                </span>
                                <span>&rarr;</span>
                            </div>
                        </button>

                        {/* 4. Sedang Berjalan */}
                        <button
                            type="button"
                            onClick={() => handleStatusFilter('active')}
                            className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${
                                filters.status === 'active'
                                    ? 'border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                                    : 'border-emerald-200/80 bg-gradient-to-b from-emerald-50/60 to-card hover:border-emerald-300 dark:border-emerald-900/40 dark:from-emerald-950/20 dark:to-card dark:hover:border-emerald-800/60'
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                        <TrendingUp className="h-4.5 w-4.5" />
                                    </div>
                                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                        Aktif
                                    </span>
                                </div>
                                <div className="mt-3">
                                    <p className="text-3xl font-extrabold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
                                        {stats?.active ?? 0}
                                    </p>
                                    <h3 className="mt-1 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                        Sedang Digunakan
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        Sedang disewa pelanggan
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-2.5 text-[11px] font-medium text-emerald-700/80 group-hover:text-emerald-700 dark:text-emerald-400/80 dark:group-hover:text-emerald-300">
                                <span>Operasional sewa berjalan</span>
                                <span>&rarr;</span>
                            </div>
                        </button>
                    </div>

                    {/* Row 2: Pengawasan Khusus & Hasil (3 Cards) */}
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                        {/* 5. Terlambat Dikembalikan (Overdue) */}
                        <button
                            type="button"
                            onClick={() => handleStatusFilter('active')}
                            className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${
                                (stats?.overdue ?? 0) > 0
                                    ? 'border-red-300/90 bg-gradient-to-b from-red-50/80 to-card hover:border-red-400 dark:border-red-900/50 dark:from-red-950/25 dark:to-card dark:hover:border-red-800'
                                    : 'border-border bg-card hover:border-border/80'
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                                        <Timer className="h-4.5 w-4.5" />
                                    </div>
                                    {(stats?.overdue ?? 0) > 0 ? (
                                        <span className="flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs animate-pulse">
                                            <AlertCircle className="h-3 w-3" />
                                            {stats?.overdue} Kasus Lewat Batas
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                            Tepat Waktu
                                        </span>
                                    )}
                                </div>
                                <div className="mt-3">
                                    <p className="text-3xl font-extrabold tracking-tight tabular-nums text-red-600 dark:text-red-400">
                                        {stats?.overdue ?? 0}
                                    </p>
                                    <h3 className="mt-1 text-xs font-bold text-red-900 dark:text-red-200">
                                        Terlambat Dikembalikan
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        Melewati batas tanggal sewa
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-2.5 text-[11px] font-medium text-red-700/80 group-hover:text-red-700 dark:text-red-400/80 dark:group-hover:text-red-300">
                                <span>
                                    {(stats?.overdue ?? 0) > 0
                                        ? 'Segera hubungi penyewa'
                                        : 'Tidak ada keterlambatan hari ini'}
                                </span>
                                <span>&rarr;</span>
                            </div>
                        </button>

                        {/* 6. Bermasalah / Defaulted */}
                        <button
                            type="button"
                            onClick={() => handleStatusFilter('defaulted')}
                            className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${
                                filters.status === 'defaulted'
                                    ? 'border-rose-500/60 bg-rose-500/10 ring-1 ring-rose-500/30'
                                    : (stats?.defaulted ?? 0) > 0
                                      ? 'border-rose-300/90 bg-gradient-to-b from-rose-50/80 to-card hover:border-rose-400 dark:border-rose-900/50 dark:from-rose-950/25 dark:to-card'
                                      : 'border-border bg-card hover:border-border/80'
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                                        <AlertTriangle className="h-4.5 w-4.5" />
                                    </div>
                                    {(stats?.defaulted ?? 0) > 0 ? (
                                        <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                            {stats?.defaulted} Kasus
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                            Nol Kasus
                                        </span>
                                    )}
                                </div>
                                <div className="mt-3">
                                    <p className="text-3xl font-extrabold tracking-tight tabular-nums text-rose-600 dark:text-rose-400">
                                        {stats?.defaulted ?? 0}
                                    </p>
                                    <h3 className="mt-1 text-xs font-bold text-rose-900 dark:text-rose-200">
                                        Unit Bermasalah / Hilang
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        Deposit disita / unit hilang
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-2.5 text-[11px] font-medium text-rose-700/80 group-hover:text-rose-700 dark:text-rose-400/80 dark:group-hover:text-rose-300">
                                <span>
                                    {(stats?.defaulted ?? 0) > 0
                                        ? 'Periksa histori kerugian'
                                        : 'Seluruh unit inventaris aman'}
                                </span>
                                <span>&rarr;</span>
                            </div>
                        </button>

                        {/* 7. Selesai (Rekap Bulan Ini) */}
                        <button
                            type="button"
                            onClick={() => handleStatusFilter('completed')}
                            className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${
                                filters.status === 'completed'
                                    ? 'border-teal-500/60 bg-teal-500/10 ring-1 ring-teal-500/30'
                                    : 'border-teal-200/80 bg-gradient-to-b from-teal-50/60 to-card hover:border-teal-300 dark:border-teal-900/40 dark:from-teal-950/20 dark:to-card dark:hover:border-teal-800/60'
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
                                        <CheckCircle2 className="h-4.5 w-4.5" />
                                    </div>
                                    <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold text-teal-700 dark:text-teal-300">
                                        Total: {stats?.completed ?? 0}
                                    </span>
                                </div>
                                <div className="mt-3">
                                    <p className="text-3xl font-extrabold tracking-tight tabular-nums text-teal-600 dark:text-teal-400">
                                        {stats?.completed_this_month ?? 0}
                                    </p>
                                    <h3 className="mt-1 text-xs font-bold text-teal-900 dark:text-teal-200">
                                        Selesai Bulan Terpilih
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
                                        Pengembalian tuntas & deposit cair
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-2.5 text-[11px] font-medium text-teal-700/80 group-hover:text-teal-700 dark:text-teal-400/80 dark:group-hover:text-teal-300">
                                <span>Filter periode {filters?.stats_month || 'Bulan ini'}</span>
                                <span>&rarr;</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="space-y-3">
                    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                        <form
                            onSubmit={handleSearch}
                            className="flex w-full gap-2 sm:w-80"
                        >
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="search"
                                    name="search"
                                    defaultValue={filters.search}
                                    placeholder="Cari invoice atau nama penyewa..."
                                    className="h-9 pl-9 text-xs"
                                />
                            </div>
                            <Button
                                type="submit"
                                size="sm"
                                variant="outline"
                                className="h-9 text-xs"
                            >
                                Cari
                            </Button>
                        </form>

                        {/* Status Pills Tabs */}
                        <div className="flex w-full scrollbar-none items-center gap-1 overflow-x-auto pb-1 sm:w-auto">
                            {[
                                { label: 'Semua Status', val: 'all' },
                                { label: 'Verifikasi DP', val: 'pending_dp' },
                                { label: 'Siap Ambil', val: 'ready_pickup' },
                                { label: 'Sedang Disewa', val: 'active' },
                                { label: 'Selesai', val: 'completed' },
                                ...(stats?.expired_schedule && stats.expired_schedule > 0
                                    ? [{ label: `Jadwal Terlewat (${stats.expired_schedule})`, val: 'expired_schedule' }]
                                    : []),
                            ].map((tab) => (
                                <Button
                                    key={tab.val}
                                    variant={
                                        filters.status === tab.val
                                            ? 'default'
                                            : tab.val === 'expired_schedule'
                                            ? 'destructive'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => handleStatusFilter(tab.val)}
                                    className="h-8 text-xs whitespace-nowrap"
                                >
                                    {tab.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Overdue Unconfirmed Schedule Alert Banner */}
                {(stats?.expired_schedule ?? 0) > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-300/80 bg-amber-50/90 dark:border-amber-800/80 dark:bg-amber-950/40 p-3.5 text-xs text-amber-900 dark:text-amber-200 shadow-xs">
                        <div className="flex items-center gap-2.5">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <div>
                                <span className="font-bold">
                                    Perhatian: Ada {stats.expired_schedule} pesanan belum aktif dengan jadwal mulai yang sudah terlewat!
                                </span>
                                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                                    Gunakan tombol <strong>Jadwal Ulang</strong> untuk memundurkan tanggal sewa, atau <strong>Batal</strong> untuk proses Refund DP / Sita DP No-Show.
                                </p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant={filters.status === 'expired_schedule' ? 'default' : 'outline'}
                            onClick={() => handleStatusFilter('expired_schedule')}
                            className="h-7 text-xs border-amber-400 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/40 shrink-0"
                        >
                            Filter Jadwal Terlewat ({stats.expired_schedule})
                        </Button>
                    </div>
                )}

                {/* Centralized Orders Table */}
                <Card className="border-border shadow-none">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                            Kode Booking & Invoice
                                        </th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                            Penyewa
                                        </th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                            Rincian Peralatan
                                        </th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                            Keuangan (DP & COD)
                                        </th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                            Status Sewa
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                                            Aksi Operasional
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {rentals.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="py-12 text-center text-muted-foreground"
                                            >
                                                Tidak ada transaksi penyewaan
                                                yang sesuai dengan filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        rentals.data.map((rental) => (
                                            <tr
                                                key={rental.id}
                                                className="hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                                                            {
                                                                rental.booking_code
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                                                        Faktur:{' '}
                                                        {rental.invoice_number}
                                                    </div>
                                                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                                                        {formatDate(
                                                            rental.start_date,
                                                        )}{' '}
                                                        -{' '}
                                                        {formatDate(
                                                            rental.end_date,
                                                        )}{' '}
                                                        ({rental.total_days}{' '}
                                                        hari)
                                                    </div>
                                                    {rental.is_schedule_expired && (
                                                        <div className="mt-1">
                                                            <span className="inline-flex items-center gap-1 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 text-[10px] font-bold border border-amber-300 dark:border-amber-700 animate-pulse">
                                                                <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                                                Jadwal Terlewat
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="text-[10px] text-muted-foreground">
                                                        Dibuat:{' '}
                                                        {formatDateTime(
                                                            rental.created_at,
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span>
                                                            {rental.user?.name}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        {rental.user?.phone ||
                                                            rental.user?.email}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="space-y-1">
                                                        {rental.items?.map(
                                                            (item) => (
                                                                <div
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    className="text-[11px] text-foreground"
                                                                >
                                                                    •{' '}
                                                                    <span className="font-semibold">
                                                                        {
                                                                            item.quantity
                                                                        }
                                                                        x
                                                                    </span>{' '}
                                                                    {
                                                                        item
                                                                            .equipment
                                                                            ?.name
                                                                    }
                                                                    {item.item_units &&
                                                                        item
                                                                            .item_units
                                                                            .length >
                                                                            0 && (
                                                                            <span className="ml-1 font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                                                                                [
                                                                                {item.item_units
                                                                                    .map(
                                                                                        (
                                                                                            u,
                                                                                        ) =>
                                                                                            u
                                                                                                .equipment_unit
                                                                                                ?.unit_code,
                                                                                    )
                                                                                    .join(
                                                                                        ', ',
                                                                                    )}
                                                                                ]
                                                                            </span>
                                                                        )}
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="space-y-0.5">
                                                        <div className="font-variant-numeric text-xs font-bold text-foreground tabular-nums">
                                                            {formatRupiah(
                                                                rental.total_price,
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground">
                                                            DP:{' '}
                                                            {formatRupiah(
                                                                rental.dp_amount,
                                                            )}{' '}
                                                            (
                                                            {rental.dp_paid_at
                                                                ? 'Ditransfer'
                                                                : 'Belum'}
                                                            )
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground">
                                                            COD:{' '}
                                                            {formatRupiah(
                                                                rental.remaining_amount,
                                                            )}{' '}
                                                            (
                                                            {rental.cod_paid_at
                                                                ? 'Lunas'
                                                                : 'Belum'}
                                                            )
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="space-y-1 px-4 py-3 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1">
                                                        <RentalStatusBadge
                                                            status={
                                                                rental.rental_status
                                                            }
                                                        />
                                                        {rental.rental_status === 'active' && rental.is_overdue && (
                                                            <Badge className="border-rose-500/50 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 text-[10px] font-bold gap-1 animate-pulse">
                                                                <AlertTriangle className="h-3 w-3 text-rose-600" />
                                                                <span>Terlambat {rental.overdue_days} Hari</span>
                                                            </Badge>
                                                        )}
                                                        {rental.rental_status === 'completed' && Number(rental.total_fine || 0) > 0 && (
                                                            <div className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                                                                Denda: {formatRupiah(rental.total_fine)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <PaymentStatusBadge
                                                            status={
                                                                rental.payment_status
                                                            }
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    <div className="flex flex-col items-end justify-end gap-1.5 sm:flex-row sm:items-center">
                                                        {/* Action 1: Verify DP */}
                                                        {rental.rental_status ===
                                                            'pending_dp' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        openDpDialog(
                                                                            rental,
                                                                        )
                                                                    }
                                                                    className="h-8 gap-1 bg-amber-600 text-xs text-white hover:bg-amber-700"
                                                                >
                                                                    <Clock className="h-3.5 w-3.5" />
                                                                    <span>
                                                                        Verifikasi
                                                                        DP
                                                                    </span>
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        openRescheduleDialog(
                                                                            rental,
                                                                        )
                                                                    }
                                                                    className="h-8 gap-1 text-xs border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/30"
                                                                    title="Jadwalkan ulang tanggal sewa"
                                                                >
                                                                    <Calendar className="h-3.5 w-3.5" />
                                                                    <span>Jadwal Ulang</span>
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        openCancelDialog(
                                                                            rental,
                                                                        )
                                                                    }
                                                                    className="h-8 gap-1 text-xs border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
                                                                    title="Batalkan pesanan"
                                                                >
                                                                    <XCircle className="h-3.5 w-3.5" />
                                                                    <span>Batal</span>
                                                                </Button>
                                                            </>
                                                        )}

                                                        {/* Action 2: Handover Units Dropdown (SRS-F-010, SRS-F-017) */}
                                                        {rental.rental_status ===
                                                            'ready_pickup' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        openHandoverDialog(
                                                                            rental,
                                                                        )
                                                                    }
                                                                    className="h-8 gap-1 bg-blue-600 text-xs text-white hover:bg-blue-700"
                                                                >
                                                                    <Layers className="h-3.5 w-3.5" />
                                                                    <span>
                                                                        Serah Terima
                                                                        (COD)
                                                                    </span>
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        openRescheduleDialog(
                                                                            rental,
                                                                        )
                                                                    }
                                                                    className="h-8 gap-1 text-xs border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/30"
                                                                    title="Jadwalkan ulang tanggal sewa"
                                                                >
                                                                    <Calendar className="h-3.5 w-3.5" />
                                                                    <span>Jadwal Ulang</span>
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        openCancelDialog(
                                                                            rental,
                                                                        )
                                                                    }
                                                                    className="h-8 gap-1 text-xs border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
                                                                    title="Batalkan pesanan (Refund / No-Show)"
                                                                >
                                                                    <XCircle className="h-3.5 w-3.5" />
                                                                    <span>Batal</span>
                                                                </Button>
                                                            </>
                                                        )}

                                                        {/* Action 3: Process Return (SRS-F-010, SRS-F-011) */}
                                                        {rental.rental_status ===
                                                            'active' && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            openReturnDialog(
                                                                                rental,
                                                                            )
                                                                        }
                                                                        className="h-8 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                                                                    >
                                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                                        <span>
                                                                            Pengembalian
                                                                        </span>
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() =>
                                                                            openDefaultedDialog(
                                                                                rental,
                                                                            )
                                                                        }
                                                                        className="h-8 gap-1 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30 text-xs"
                                                                        title="Tandai unit tidak kembali / dibawa kabur penyewa"
                                                                    >
                                                                        <Ban className="h-3.5 w-3.5" />
                                                                        <span>
                                                                            Defaulted
                                                                        </span>
                                                                    </Button>
                                                                </>
                                                            )}

                                                        {/* View Invoice button */}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            asChild
                                                            className="h-8 gap-1 text-xs"
                                                        >
                                                            <Link
                                                                href={`/bookings/${rental.id}`}
                                                                target="_blank"
                                                            >
                                                                <FileText className="h-3.5 w-3.5" />
                                                                <span>
                                                                    Invoice
                                                                </span>
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                <DataTablePagination pagination={rentals} />
            </div>

            {/* Modal 1: DP Verification Dialog (SRS-F-016) */}
            <Dialog open={dpModalOpen} onOpenChange={setDpModalOpen}>
                <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-lg">
                    <DialogHeader className="shrink-0 border-b border-border bg-card p-5">
                        <DialogTitle className="text-base font-bold">
                            Verifikasi Transfer DP:{' '}
                            {selectedRentalForDp?.booking_code} (
                            {selectedRentalForDp?.invoice_number})
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Periksa keabsahan transfer uang muka (DP 30%) dari
                            penyewa untuk mengonfirmasi booking.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 space-y-4 overflow-y-auto p-5 text-xs">
                        <div className="flex justify-between rounded-xl border border-border bg-muted/50 p-3">
                            <div>
                                <span className="block text-muted-foreground">
                                    Penyewa:
                                </span>
                                <span className="font-semibold text-foreground">
                                    {selectedRentalForDp?.user?.name}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="block text-muted-foreground">
                                    Nominal DP Wajib:
                                </span>
                                <span className="font-variant-numeric font-bold text-foreground tabular-nums">
                                    {formatRupiah(
                                        selectedRentalForDp?.dp_amount,
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Image Preview */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">
                                Bukti Transfer:
                            </Label>
                            {selectedRentalForDp?.dp_proof_image ? (
                                <div className="flex max-h-64 items-center justify-center overflow-hidden rounded-xl border border-border bg-black/5">
                                    <img
                                        src={`/storage/${selectedRentalForDp.dp_proof_image}`}
                                        alt="Bukti Transfer"
                                        className="max-h-64 object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
                                    Penyewa belum mengunggah file bukti
                                    transfer.
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label
                                htmlFor="dp_notes"
                                className="text-xs font-semibold"
                            >
                                Catatan Verifikasi Admin (Opsional):
                            </Label>
                            <Input
                                id="dp_notes"
                                value={dpNotes}
                                onChange={(e) => setDpNotes(e.target.value)}
                                placeholder="Contoh: Transfer BCA diterima an Randie"
                                className="h-9 text-xs"
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex shrink-0 justify-end gap-2 border-t border-border bg-card p-4">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDpModalOpen(false)}
                        >
                            Tutup
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={submittingDp}
                            onClick={() => handleVerifyDp('reject')}
                        >
                            Tolak DP & Batalkan
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={submittingDp}
                            onClick={() => handleVerifyDp('approve')}
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                            {submittingDp
                                ? 'Memproses...'
                                : 'Verifikasi & Terima DP'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal 2: Handover Unit Selection & Confirmation Dialog (SRS-F-010, SRS-F-017) */}
            <Dialog
                open={handoverModalOpen}
                onOpenChange={setHandoverModalOpen}
            >
                <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-2xl">
                    <form
                        onSubmit={submitHandover}
                        className="flex flex-1 flex-col overflow-hidden"
                    >
                        <DialogHeader className="shrink-0 border-b border-border bg-card p-4 sm:p-5">
                            <DialogTitle className="text-base font-bold">
                                Serah Terima Unit & Pelunasan COD:{' '}
                                {selectedRentalForHandover?.booking_code} (
                                {selectedRentalForHandover?.invoice_number})
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Konfirmasi setiap unit fisik (Manual atau Scan
                                QR) dan konfirmasi pelunasan tagihan COD di
                                toko.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-4 text-xs sm:p-5">
                            {/* Summary Box */}
                            <div className="flex items-center justify-between rounded-xl border border-border bg-zinc-100 p-3.5 dark:bg-zinc-800">
                                <div>
                                    <div className="text-[11px] text-muted-foreground">
                                        Penyewa:
                                    </div>
                                    <div className="font-semibold text-foreground">
                                        {selectedRentalForHandover?.user?.name}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[11px] text-muted-foreground">
                                        Sisa Tagihan COD yang Harus Dibayar:
                                    </div>
                                    <div className="font-variant-numeric text-sm font-bold text-emerald-700 tabular-nums dark:text-emerald-400">
                                        {formatRupiah(
                                            selectedRentalForHandover?.remaining_amount,
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Unit Selection Header with Mode Toggle */}
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pt-1 pb-2">
                                <div>
                                    <Label className="text-xs font-semibold">
                                        Daftar Unit Fisik yang Harus Diserahkan:
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground">
                                        Konfirmasi seluruh unit via Scan QR atau
                                        tombol Konfirmasi.
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/60 p-0.5 self-start sm:self-auto shrink-0">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            handoverScanMode === 'manual'
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        onClick={() =>
                                            setHandoverScanMode('manual')
                                        }
                                        className="h-6 gap-1 px-2.5 text-[11px] font-medium"
                                    >
                                        <Layers className="h-3 w-3" />
                                        <span>Daftar Slot</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            handoverScanMode === 'scan'
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        onClick={() =>
                                            setHandoverScanMode('scan')
                                        }
                                        className="h-6 gap-1 px-2.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
                                    >
                                        <Scan className="h-3 w-3" />
                                        <span>Scan QR Otomatis</span>
                                    </Button>
                                </div>
                            </div>

                            {/* General QR Scanner for Handover if active */}
                            {handoverScanMode === 'scan' && (
                                <QrCodeScanner
                                    isActive={
                                        handoverModalOpen &&
                                        handoverScanMode === 'scan'
                                    }
                                    onScan={handleHandoverScan}
                                    placeholder="Arahkan kamera ke QR Code unit alat yang diserahkan..."
                                    helperText="Scan QR Code pada alat untuk memasangkannya dan mengonfirmasinya secara otomatis."
                                    autoPauseOnScan={true}
                                />
                            )}

                            {/* Dropdown / Assigned Selection for Each Item */}
                            <div className="space-y-4">
                                {selectedRentalForHandover?.items?.map(
                                    (item) => {
                                        const availableUnits: EquipmentUnit[] =
                                            item.equipment?.available_units ||
                                            item.equipment?.availableUnits ||
                                            [];

                                        return (
                                            <div
                                                key={item.id}
                                                className="space-y-3 rounded-xl border border-border bg-card p-3.5"
                                            >
                                                <div className="flex items-center justify-between font-medium">
                                                    <span className="text-foreground font-semibold">
                                                        {item.equipment?.name}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[11px]"
                                                    >
                                                        Butuh {item.quantity}{' '}
                                                        Unit
                                                    </Badge>
                                                </div>

                                                {/* Generate N slots for N quantity */}
                                                <div className="space-y-2.5">
                                                    {Array.from({
                                                        length: item.quantity,
                                                    }).map((_, unitIdx) => {
                                                        const slotKey = `${item.id}_${unitIdx}`;
                                                        const isConfirmed =
                                                            handoverConfirmations[
                                                            slotKey
                                                            ];
                                                        const assignedUnitId =
                                                            handoverAssignments[
                                                            item.id
                                                            ]?.[unitIdx];
                                                        const assignedUnit =
                                                            availableUnits.find(
                                                                (u) =>
                                                                    u.id.toString() ===
                                                                    assignedUnitId,
                                                            );

                                                        return (
                                                            <div
                                                                key={unitIdx}
                                                                className="space-y-1"
                                                            >
                                                                {isConfirmed ? (
                                                                    <div className="flex items-center justify-between rounded-lg border border-emerald-500/50 bg-emerald-50/20 p-2.5 dark:bg-emerald-950/20">
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <span className="text-[11px] font-semibold text-muted-foreground">
                                                                                Unit
                                                                                #
                                                                                {unitIdx +
                                                                                    1}
                                                                                :
                                                                            </span>
                                                                            <span className="rounded bg-zinc-900 px-2 py-0.5 font-mono text-xs font-bold text-white">
                                                                                {assignedUnit?.unit_code ||
                                                                                    `ID: ${assignedUnitId}`}
                                                                            </span>
                                                                            <span className="text-xs font-semibold text-foreground">
                                                                                {
                                                                                    item
                                                                                        .equipment
                                                                                        ?.name
                                                                                }
                                                                            </span>
                                                                            <Badge className="gap-1 bg-emerald-600 text-[10px] text-white">
                                                                                <CheckCircle2 className="h-3 w-3" />
                                                                                <span>
                                                                                    Terkonfirmasi
                                                                                    (
                                                                                    {isConfirmed ===
                                                                                        'qr'
                                                                                        ? 'Scan QR'
                                                                                        : 'Manual'}
                                                                                    )
                                                                                </span>
                                                                            </Badge>
                                                                        </div>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                unlockSlotConfirmation(
                                                                                    item.id,
                                                                                    unitIdx,
                                                                                )
                                                                            }
                                                                            className="h-7 shrink-0 text-xs text-muted-foreground hover:text-foreground"
                                                                        >
                                                                            Ubah
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-muted/20 p-2.5 sm:flex-row sm:items-center sm:gap-3">
                                                                        <div className="flex items-center gap-1.5 shrink-0 sm:w-16">
                                                                            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-bold text-foreground">
                                                                                #{unitIdx + 1}
                                                                            </span>
                                                                        </div>

                                                                        <div className="flex flex-1 min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                                                                            <div className="flex-1 min-w-0">
                                                                                <Select
                                                                                    value={
                                                                                        assignedUnitId ||
                                                                                        ''
                                                                                    }
                                                                                    onValueChange={(
                                                                                        val,
                                                                                    ) =>
                                                                                        handleUnitSelect(
                                                                                            item.id,
                                                                                            unitIdx,
                                                                                            val,
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <SelectTrigger className="h-8 w-full min-w-0 text-xs">
                                                                                        <SelectValue placeholder="Pilih unit fisik..." />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        {availableUnits.length ===
                                                                                            0 ? (
                                                                                            <SelectItem
                                                                                                value="none"
                                                                                                disabled
                                                                                            >
                                                                                                Tidak
                                                                                                ada
                                                                                                unit
                                                                                                tersedia
                                                                                            </SelectItem>
                                                                                        ) : (
                                                                                            availableUnits.map(
                                                                                                (
                                                                                                    u: EquipmentUnit,
                                                                                                ) => (
                                                                                                    <SelectItem
                                                                                                        key={
                                                                                                            u.id
                                                                                                        }
                                                                                                        value={u.id.toString()}
                                                                                                    >
                                                                                                        <span className="font-mono font-bold">{u.unit_code}</span>
                                                                                                        <span className="text-muted-foreground ml-1.5">({u.condition})</span>
                                                                                                        {u.notes ? ` - ${u.notes}` : ''}
                                                                                                    </SelectItem>
                                                                                                ),
                                                                                            )
                                                                                        )}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>

                                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                                {/* Button Konfirmasi Manual */}
                                                                                <Button
                                                                                    type="button"
                                                                                    size="sm"
                                                                                    disabled={
                                                                                        !assignedUnitId
                                                                                    }
                                                                                    onClick={() =>
                                                                                        confirmSlotManually(
                                                                                            item.id,
                                                                                            unitIdx,
                                                                                        )
                                                                                    }
                                                                                    className="h-8 gap-1 bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                                                                    title="Konfirmasi unit ini secara manual"
                                                                                >
                                                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                                                    <span>
                                                                                        Konfirmasi
                                                                                    </span>
                                                                                </Button>

                                                                                {/* Button Scan QR */}
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    onClick={() =>
                                                                                        setSlotScanTarget(
                                                                                            {
                                                                                                rentalItemId:
                                                                                                    item.id,
                                                                                                unitIdx,
                                                                                                equipmentName:
                                                                                                    item
                                                                                                        .equipment
                                                                                                        ?.name ||
                                                                                                    'Alat',
                                                                                                equipmentId:
                                                                                                    item.equipment_id,
                                                                                            },
                                                                                        )
                                                                                    }
                                                                                    className="h-8 gap-1 border-emerald-600/40 px-2.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                                                                    title={`Scan QR Code khusus untuk Unit #${unitIdx + 1}`}
                                                                                >
                                                                                    <Scan className="h-3.5 w-3.5" />
                                                                                    <span>
                                                                                        Scan
                                                                                        QR
                                                                                    </span>
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    },
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="handover_notes"
                                    className="text-xs font-semibold"
                                >
                                    Catatan Serah Terima (Kondisi saat diambil):
                                </Label>
                                <Input
                                    id="handover_notes"
                                    value={handoverNotes}
                                    onChange={(e) =>
                                        setHandoverNotes(e.target.value)
                                    }
                                    placeholder="Contoh: Unit lengkap, pasak utuh, pelunasan COD tunai diterima."
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>

                        <DialogFooter className="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-border bg-card p-4">
                            <div className="text-xs">
                                {(() => {
                                    const totalRequired =
                                        selectedRentalForHandover?.items?.reduce(
                                            (acc, it) => acc + it.quantity,
                                            0,
                                        ) || 0;
                                    const totalConfirmed = Object.keys(
                                        handoverConfirmations,
                                    ).length;
                                    const isComplete =
                                        totalRequired > 0 &&
                                        totalConfirmed >= totalRequired;

                                    return (
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">
                                                Kelengkapan Unit:
                                            </span>
                                            <Badge
                                                className={
                                                    isComplete
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'border-amber-300 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                                                }
                                            >
                                                {totalConfirmed} /{' '}
                                                {totalRequired} Terkonfirmasi
                                            </Badge>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setHandoverModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={
                                        submittingHandover ||
                                        Object.keys(handoverConfirmations)
                                            .length <
                                        (selectedRentalForHandover?.items?.reduce(
                                            (acc, it) => acc + it.quantity,
                                            0,
                                        ) || 0)
                                    }
                                    className="bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                                >
                                    {submittingHandover
                                        ? 'Memproses...'
                                        : 'Konfirmasi Serah Terima & COD Lunas'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal 3: Return & Deposit Settlement Dialog (SRS-F-007, SRS-F-010, SRS-F-011) */}
            <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
                <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-2xl">
                    <form
                        onSubmit={submitReturn}
                        className="flex flex-1 flex-col overflow-hidden"
                    >
                        <DialogHeader className="shrink-0 border-b border-border bg-card p-4 sm:p-5">
                            <DialogTitle className="text-base font-bold">
                                Pengembalian Unit & Pengembalian Deposit:{' '}
                                {selectedRentalForReturn?.booking_code} (
                                {selectedRentalForReturn?.invoice_number})
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Konfirmasi fisik barang yang dikembalikan
                                (Manual atau Scan QR) dan selesaikan
                                pengembalian deposit.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-4 text-xs sm:p-5">
                            {/* Unit Condition Inspection Header with QR Mode */}
                            <div className="flex items-center justify-between border-b border-border pb-2">
                                <div>
                                    <Label className="text-xs font-semibold">
                                        Pemeriksaan Kondisi Tiap Unit:
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground">
                                        Konfirmasi setiap unit yang dibawa
                                        kembali penyewa.
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/60 p-0.5">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            returnScanMode === 'manual'
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        onClick={() =>
                                            setReturnScanMode('manual')
                                        }
                                        className="h-6 gap-1 px-2.5 text-[11px] font-medium"
                                    >
                                        <Layers className="h-3 w-3" />
                                        <span>Daftar Unit</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            returnScanMode === 'scan'
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        onClick={() =>
                                            setReturnScanMode('scan')
                                        }
                                        className="h-6 gap-1 px-2.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
                                    >
                                        <Scan className="h-3 w-3" />
                                        <span>Scan QR Otomatis</span>
                                    </Button>
                                </div>
                            </div>

                            {/* General QR Scanner for Return Verification if active */}
                            {returnScanMode === 'scan' && (
                                <QrCodeScanner
                                    isActive={
                                        returnModalOpen &&
                                        returnScanMode === 'scan'
                                    }
                                    onScan={handleReturnScan}
                                    placeholder="Arahkan kamera ke QR Code unit yang dikembalikan..."
                                    helperText="Scan QR Code pada alat untuk memverifikasi keaslian unit yang dibawa kembali pelanggan."
                                    autoPauseOnScan={true}
                                />
                            )}

                            {/* Assigned Units Condition Inspection */}
                            <div className="space-y-3">
                                {selectedRentalForReturn?.items?.map((item) => (
                                    <div key={item.id} className="space-y-2">
                                        {item.item_units?.map((iu) => {
                                            const isConfirmed =
                                                returnConfirmations[iu.id];

                                            return (
                                                <div
                                                    key={iu.id}
                                                    className={`space-y-2 rounded-xl border bg-card p-3 transition-colors ${isConfirmed
                                                            ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                                                            : 'border-border'
                                                        }`}
                                                >
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="rounded bg-zinc-900 px-2 py-0.5 font-mono text-xs font-bold text-white">
                                                                {
                                                                    iu
                                                                        .equipment_unit
                                                                        ?.unit_code
                                                                }
                                                            </span>
                                                            <span className="font-semibold text-foreground">
                                                                (
                                                                {
                                                                    item
                                                                        .equipment
                                                                        ?.name
                                                                }
                                                                )
                                                            </span>
                                                            {isConfirmed ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <Badge className="gap-1 bg-emerald-600 text-[10px] text-white">
                                                                        <CheckCircle2 className="h-3 w-3" />
                                                                        <span>
                                                                            Terkonfirmasi
                                                                            (
                                                                            {isConfirmed ===
                                                                                'qr'
                                                                                ? 'Scan QR'
                                                                                : 'Manual'}
                                                                            )
                                                                        </span>
                                                                    </Badge>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            unlockReturnConfirmation(
                                                                                iu.id,
                                                                            )
                                                                        }
                                                                        className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                                                                    >
                                                                        Ubah
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            confirmReturnManually(
                                                                                iu.id,
                                                                            )
                                                                        }
                                                                        className="h-6 gap-1 bg-zinc-900 px-2 text-[11px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                                                                    >
                                                                        <CheckCircle2 className="h-3 w-3" />
                                                                        <span>
                                                                            Konfirmasi
                                                                        </span>
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            setReturnVerificationTarget(
                                                                                {
                                                                                    rentalItemUnitId:
                                                                                        iu.id,
                                                                                    expectedCode:
                                                                                        iu
                                                                                            .equipment_unit
                                                                                            ?.unit_code ||
                                                                                        '',
                                                                                    equipmentName:
                                                                                        item
                                                                                            .equipment
                                                                                            ?.name ||
                                                                                        'Alat',
                                                                                },
                                                                            )
                                                                        }
                                                                        className="h-6 gap-1 border-emerald-600/40 px-2 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                                                    >
                                                                        <Scan className="h-3 w-3" />
                                                                        <span>
                                                                            Scan
                                                                            QR
                                                                        </span>
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] text-muted-foreground">
                                                            Kondisi Awal:{' '}
                                                            <strong className="capitalize">
                                                                {
                                                                    iu.condition_out
                                                                }
                                                            </strong>
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-2 border-t border-border/50 pt-2 sm:grid-cols-3">
                                                        <div>
                                                            <Label className="text-[11px]">
                                                                Kondisi Saat Kembali:
                                                            </Label>
                                                            <Select
                                                                value={
                                                                    returnConditions[
                                                                        iu.id
                                                                    ]
                                                                        ?.condition ||
                                                                    'baik'
                                                                }
                                                                onValueChange={(
                                                                    val,
                                                                ) =>
                                                                    handleUnitConditionChange(
                                                                        iu.id,
                                                                        val,
                                                                        item.equipment,
                                                                    )
                                                                }
                                                            >
                                                                <SelectTrigger className="mt-1 h-8 text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="baik">
                                                                        Baik & Utuh (Rp 0)
                                                                    </SelectItem>
                                                                    <SelectItem value="butuh_perbaikan">
                                                                        Butuh Servis ({Number(item.equipment?.fine_minor_damage || 0) > 0 ? formatRupiah(item.equipment?.fine_minor_damage) : 'Rp 0'})
                                                                    </SelectItem>
                                                                    <SelectItem value="rusak">
                                                                        Rusak Berat ({Number(item.equipment?.fine_heavy_damage || 0) > 0 ? formatRupiah(item.equipment?.fine_heavy_damage) : 'Rp 0'})
                                                                    </SelectItem>
                                                                    <SelectItem value="hilang">
                                                                        Hilang / Afkir ({Number(item.equipment?.fine_lost || 0) > 0 ? formatRupiah(item.equipment?.fine_lost) : 'Rp 0'})
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label className="text-[11px] flex items-center justify-between">
                                                                <span>Denda Unit (Rp):</span>
                                                                {returnConditions[iu.id]?.condition !== 'baik' && (
                                                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Otomatis / Edit</span>
                                                                )}
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                value={returnConditions[iu.id]?.damageFee ?? 0}
                                                                onChange={(e) =>
                                                                    handleUnitDamageFeeChange(
                                                                        iu.id,
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                className="mt-1 h-8 font-mono text-xs"
                                                                min="0"
                                                                disabled={returnConditions[iu.id]?.condition === 'baik'}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[11px]">
                                                                Catatan Kondisi:
                                                            </Label>
                                                            <Input
                                                                value={
                                                                    returnConditions[
                                                                        iu.id
                                                                    ]?.notes ||
                                                                    ''
                                                                }
                                                                onChange={(e) =>
                                                                    setReturnConditions(
                                                                        {
                                                                            ...returnConditions,
                                                                            [iu.id]:
                                                                            {
                                                                                ...returnConditions[
                                                                                iu
                                                                                    .id
                                                                                ],
                                                                                notes: e
                                                                                    .target
                                                                                    .value,
                                                                            },
                                                                        },
                                                                    )
                                                                }
                                                                placeholder="Keterangan kerusakan..."
                                                                className="mt-1 h-8 text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>

                            {/* Overdue Warning Alert if late */}
                            {lateDays > 0 && (
                                <div className="flex items-start gap-2.5 rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-xs text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
                                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                                    <div>
                                        <div className="font-bold text-rose-800 dark:text-rose-300">
                                            Pengembalian Terlambat {lateDays} Hari
                                        </div>
                                        <p className="mt-0.5 text-[11px] text-rose-700/90 dark:text-rose-300/80">
                                            Jatuh tempo: <strong>{formatDate(selectedRentalForReturn?.end_date)}</strong>. Sistem secara otomatis menghitung denda keterlambatan berdasarkan tarif harian rental.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Fines & Damage Fee Calculation (SRS-F-007) */}
                            <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
                                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                        <Calculator className="h-4 w-4 text-amber-600" />
                                        <span>Perhitungan Denda & Ganti Rugi:</span>
                                    </div>
                                    <span className="font-variant-numeric font-bold text-foreground tabular-nums text-xs">
                                        Deposit Awal: {formatRupiah(selectedRentalForReturn?.total_deposit)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold">
                                            Denda Terlambat ({lateDays} hari) (Rp):
                                        </Label>
                                        <Input
                                            type="number"
                                            value={lateFee}
                                            onChange={(e) => handleLateFeeChange(e.target.value)}
                                            className="h-8 font-mono text-xs"
                                            min="0"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold flex items-center justify-between">
                                            <span>Biaya Kerusakan / Barang Hilang (Rp):</span>
                                            {Number(damageFee) > 0 && (
                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Akumulasi Unit</span>
                                            )}
                                        </Label>
                                        <Input
                                            type="number"
                                            value={damageFee}
                                            onChange={(e) => handleDamageFeeChange(e.target.value)}
                                            className="h-8 font-mono text-xs"
                                            min="0"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* Itemized Damage Breakdown Pill List */}
                                {Object.entries(returnConditions).some(([_, d]) => Number(d.damageFee || 0) > 0) && (
                                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs space-y-1.5">
                                        <div className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
                                            <ShieldAlert className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                            <span>Rincian Denda Kerusakan Unit Fisik:</span>
                                        </div>
                                        <div className="space-y-1">
                                            {selectedRentalForReturn?.items?.flatMap((item) =>
                                                (item.item_units || [])
                                                    .filter((iu) => Number(returnConditions[iu.id]?.damageFee || 0) > 0)
                                                    .map((iu) => (
                                                        <div key={iu.id} className="flex justify-between items-center text-[11px] text-muted-foreground bg-background/60 rounded px-2 py-1">
                                                            <span className="flex items-center gap-1.5">
                                                                <span className="font-mono font-bold text-foreground">
                                                                    {iu.equipment_unit?.unit_code}
                                                                </span>
                                                                <span>({item.equipment?.name})</span>
                                                                <span className="text-[10px] rounded px-1.5 py-0.5 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-medium capitalize">
                                                                    {returnConditions[iu.id]?.condition.replace('_', ' ')}
                                                                </span>
                                                            </span>
                                                            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                                                                {formatRupiah(returnConditions[iu.id]?.damageFee || 0)}
                                                            </span>
                                                        </div>
                                                    )),
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Smart Settlement Summary */}
                                <div className="rounded-lg border border-border bg-card p-3 space-y-2 text-xs">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Total Denda & Kerusakan:</span>
                                        <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                                            {formatRupiah((parseFloat(lateFee) || 0) + (parseFloat(damageFee) || 0))}
                                        </span>
                                    </div>

                                    <div className="border-t border-border pt-2 flex justify-between items-center font-semibold">
                                        <span>Hasil Penyelesaian Jaminan:</span>
                                        {additionalChargePaid > 0 ? (
                                            <span className="text-rose-600 font-bold font-mono">
                                                Kurang Bayar Kasir: {formatRupiah(additionalChargePaid)}
                                            </span>
                                        ) : (
                                            <span className="text-emerald-600 font-bold font-mono">
                                                Refund Deposit: {formatRupiah(depositRefundAmount)}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-[11px] text-muted-foreground">
                                        {additionalChargePaid > 0
                                            ? `⚠️ Jaminan deposit Rp ${formatRupiah(selectedRentalForReturn?.total_deposit)} disita penuh. Penyewa wajib melunasi kekurangan tagihan sebesar Rp ${formatRupiah(additionalChargePaid)} di kasir.`
                                            : Number(depositRefundAmount) > 0
                                                ? `✓ Denda telah dipotong langsung dari deposit. Sisa uang jaminan sebesar Rp ${formatRupiah(depositRefundAmount)} wajib dikembalikan kepada penyewa.`
                                                : `✓ Seluruh deposit Rp ${formatRupiah(selectedRentalForReturn?.total_deposit)} digunakan untuk melunasi denda.`}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="return_notes"
                                    className="text-xs font-semibold"
                                >
                                    Catatan Akhir Transaksi:
                                </Label>
                                <Input
                                    id="return_notes"
                                    value={returnAdminNotes}
                                    onChange={(e) =>
                                        setReturnAdminNotes(e.target.value)
                                    }
                                    placeholder="Contoh: Unit kembali bersih lengkap, refund deposit diserahkan tunai."
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>

                        <DialogFooter className="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-border bg-card p-4">
                            <div className="text-xs">
                                {(() => {
                                    const totalReturn =
                                        selectedRentalForReturn?.items?.reduce(
                                            (acc, it) =>
                                                acc +
                                                (it.item_units?.length || 0),
                                            0,
                                        ) || 0;
                                    const totalConfirmed =
                                        Object.keys(returnConfirmations).length;
                                    const isComplete =
                                        totalReturn > 0 &&
                                        totalConfirmed >= totalReturn;

                                    return (
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">
                                                Pemeriksaan Unit:
                                            </span>
                                            <Badge
                                                className={
                                                    isComplete
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'border-amber-300 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                                                }
                                            >
                                                {totalConfirmed} / {totalReturn}{' '}
                                                Terkonfirmasi
                                            </Badge>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setReturnModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={
                                        submittingReturn ||
                                        Object.keys(returnConfirmations)
                                            .length <
                                        (selectedRentalForReturn?.items?.reduce(
                                            (acc, it) =>
                                                acc +
                                                (it.item_units?.length ||
                                                    0),
                                            0,
                                        ) || 0)
                                    }
                                    className="bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                                >
                                    {submittingReturn
                                        ? 'Menyimpan...'
                                        : 'Selesaikan Pengembalian & Refund'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Defaulted / Lost Rental Dialog */}
            <Dialog open={defaultedModalOpen} onOpenChange={setDefaultedModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={submitDefaulted}>
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-1.5">
                                <Ban className="h-4 w-4" />
                                <span>Tandai Barang Hilang / Defaulted</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Gunakan tindakan ini jika penyewa membawa kabur barang atau tidak mengembalikan unit sewa ({selectedRentalForDefaulted?.invoice_number}).
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-3 text-xs">
                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200 space-y-1.5">
                                <div className="font-bold flex items-center gap-1 text-rose-700 dark:text-rose-300">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>Konsekuensi Sistem:</span>
                                </div>
                                <ul className="list-disc list-inside space-y-1 text-[11px]">
                                    <li>Seluruh unit fisik dalam pesanan ini akan diubah statusnya menjadi <strong>Afkir / Rusak Total</strong>.</li>
                                    <li>Uang jaminan (deposit <strong>{formatRupiah(selectedRentalForDefaulted?.total_deposit)}</strong>) akan <strong>disita penuh</strong>.</li>
                                    <li>Transaksi dinyatakan berstatus <strong>Bermasalah / Hilang (Defaulted)</strong>.</li>
                                </ul>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">
                                    Alasan & Catatan Kasus <span className="text-rose-500">*</span>
                                </Label>
                                <Textarea
                                    value={defaultedAdminNotes}
                                    onChange={(e) => setDefaultedAdminNotes(e.target.value)}
                                    placeholder="Jelaskan kronologi kejadian..."
                                    className="text-xs min-h-[80px]"
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                                <input
                                    type="checkbox"
                                    id="suspend_user_check"
                                    checked={defaultedSuspendUser}
                                    onChange={(e) => setDefaultedSuspendUser(e.target.checked)}
                                    className="h-4 w-4 rounded border-border text-rose-600 focus:ring-rose-500"
                                />
                                <Label htmlFor="suspend_user_check" className="text-xs font-semibold cursor-pointer">
                                    Tangguhkan (Suspend) Akun Penyewa ({selectedRentalForDefaulted?.user?.name})
                                </Label>
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setDefaultedModalOpen(false)}
                                disabled={submittingDefaulted}
                                className="text-xs"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                size="sm"
                                disabled={submittingDefaulted || !defaultedAdminNotes.trim()}
                                className="text-xs font-semibold"
                            >
                                {submittingDefaulted ? 'Memproses...' : 'Konfirmasi Defaulted & Sita Deposit'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Targeted Slot Scanner Dialog for Handover (One-shot scan, automatic close upon match) */}
            <Dialog
                open={!!slotScanTarget}
                onOpenChange={(open) => !open && setSlotScanTarget(null)}
            >
                <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-md">
                    <DialogHeader className="shrink-0 border-b border-border bg-card p-4">
                        <DialogTitle className="flex items-center gap-2 text-base font-bold">
                            <Scan className="h-5 w-5 text-emerald-500" />
                            <span>
                                Scan QR: {slotScanTarget?.equipmentName}
                            </span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Arahkan kamera ke QR Code unit fisik{' '}
                            <strong>
                                Unit #{(slotScanTarget?.unitIdx || 0) + 1}
                            </strong>
                            . Kamera akan berhenti otomatis setelah berhasil.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 space-y-3 overflow-y-auto p-4">
                        {slotScanTarget && (
                            <QrCodeScanner
                                isActive={!!slotScanTarget}
                                onScan={handleSpecificSlotScan}
                                targetTitle={`${slotScanTarget.equipmentName} (Unit #${slotScanTarget.unitIdx + 1})`}
                                placeholder="Arahkan ke QR unit..."
                                autoPauseOnScan={true}
                            />
                        )}
                    </div>

                    <DialogFooter className="shrink-0 border-t border-border bg-card p-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSlotScanTarget(null)}
                        >
                            Tutup / Batal
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Targeted Return Verification Scanner Dialog (One-shot scan, automatic close upon match) */}
            <Dialog
                open={!!returnVerificationTarget}
                onOpenChange={(open) =>
                    !open && setReturnVerificationTarget(null)
                }
            >
                <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-md">
                    <DialogHeader className="shrink-0 border-b border-border bg-card p-4">
                        <DialogTitle className="flex items-center gap-2 text-base font-bold">
                            <Scan className="h-5 w-5 text-emerald-500" />
                            <span>Verifikasi Pengembalian Unit Fisik</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Arahkan kamera ke QR Code unit{' '}
                            <strong>
                                {returnVerificationTarget?.expectedCode}
                            </strong>{' '}
                            ({returnVerificationTarget?.equipmentName}).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 space-y-3 overflow-y-auto p-4">
                        {returnVerificationTarget && (
                            <QrCodeScanner
                                isActive={!!returnVerificationTarget}
                                onScan={handleSpecificReturnScan}
                                targetTitle={`${returnVerificationTarget.expectedCode} (${returnVerificationTarget.equipmentName})`}
                                placeholder="Scan QR unit..."
                                autoPauseOnScan={true}
                            />
                        )}
                    </div>

                    <DialogFooter className="shrink-0 border-t border-border bg-card p-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setReturnVerificationTarget(null)}
                        >
                            Tutup / Batal
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Reschedule Dates Dialog */}
            <Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={submitReschedule}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-bold">
                                <Calendar className="h-5 w-5 text-amber-600" />
                                <span>Jadwal Ulang (Reschedule) Sewa</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Ubah rentang tanggal sewa untuk pesanan{' '}
                                <strong>{selectedRentalForReschedule?.invoice_number}</strong> (
                                {selectedRentalForReschedule?.user?.name}). DP yang sudah dibayar tetap dipertahankan.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4 text-xs">
                            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Jadwal Lama:</span>
                                    <span className="font-semibold text-foreground">
                                        {formatDate(selectedRentalForReschedule?.start_date)} -{' '}
                                        {formatDate(selectedRentalForReschedule?.end_date)} ({selectedRentalForReschedule?.total_days} hari)
                                    </span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>DP Terbayar:</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatRupiah(selectedRentalForReschedule?.dp_amount)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="reschedule_start" className="text-xs font-semibold">
                                        Tanggal Mulai Baru:
                                    </Label>
                                    <Input
                                        id="reschedule_start"
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={newStartDate}
                                        onChange={(e) => setNewStartDate(e.target.value)}
                                        required
                                        className="h-9 text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="reschedule_end" className="text-xs font-semibold">
                                        Tanggal Selesai Baru:
                                    </Label>
                                    <Input
                                        id="reschedule_end"
                                        type="date"
                                        min={newStartDate || new Date().toISOString().split('T')[0]}
                                        value={newEndDate}
                                        onChange={(e) => setNewEndDate(e.target.value)}
                                        required
                                        className="h-9 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="reschedule_notes" className="text-xs font-semibold">
                                    Catatan Jadwal Ulang (Opsional):
                                </Label>
                                <Input
                                    id="reschedule_notes"
                                    placeholder="Alasan jadwal ulang, contoh: Permintaan pelanggan via WA"
                                    value={rescheduleNotes}
                                    onChange={(e) => setRescheduleNotes(e.target.value)}
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setRescheduleModalOpen(false)}
                                disabled={submittingReschedule}
                                className="text-xs"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={submittingReschedule || !newStartDate || !newEndDate}
                                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                            >
                                {submittingReschedule ? 'Memproses...' : 'Simpan Jadwal Baru'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Cancel Order Resolution Dialog */}
            <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={submitCancel}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-bold text-rose-600 dark:text-rose-400">
                                <XCircle className="h-5 w-5" />
                                <span>Batalkan Pesanan & Resolusi DP</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Pilih tindakan penyelesaian untuk pesanan{' '}
                                <strong>{selectedRentalForCancel?.invoice_number}</strong> ({selectedRentalForCancel?.user?.name}).
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4 text-xs">
                            <div className="rounded-lg border border-border bg-muted/40 p-3 flex justify-between">
                                <div>
                                    <span className="block text-muted-foreground">Total Transaksi:</span>
                                    <span className="font-bold">{formatRupiah(selectedRentalForCancel?.total_price)}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-muted-foreground">DP Terbayar:</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatRupiah(selectedRentalForCancel?.dp_amount)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Tipe Pembatalan & Resolusi DP:</Label>
                                <div className="space-y-2">
                                    <label className="flex items-start gap-2.5 rounded-lg border border-border p-3 hover:bg-muted/30 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="cancellation_type"
                                            value="refund_dp"
                                            checked={cancellationType === 'refund_dp'}
                                            onChange={() => setCancellationType('refund_dp')}
                                            className="mt-0.5 text-emerald-600"
                                        />
                                        <div>
                                            <span className="font-bold text-foreground">Batalkan & Kembalikan DP (Refund)</span>
                                            <p className="text-[11px] text-muted-foreground">
                                                Digunakan jika pembatalan karena kendala toko atau kesepakatan refund penuh ke penyewa.
                                            </p>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-2.5 rounded-lg border border-border p-3 hover:bg-muted/30 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="cancellation_type"
                                            value="forfeit_dp"
                                            checked={cancellationType === 'forfeit_dp'}
                                            onChange={() => setCancellationType('forfeit_dp')}
                                            className="mt-0.5 text-rose-600"
                                        />
                                        <div>
                                            <span className="font-bold text-rose-700 dark:text-rose-400">Batalkan karena No-Show (DP Hangus / Disita)</span>
                                            <p className="text-[11px] text-muted-foreground">
                                                Penyewa tidak datang mengambil alat tanpa konfirmasi. DP disita toko sebagai kompensasi.
                                            </p>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-2.5 rounded-lg border border-border p-3 hover:bg-muted/30 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="cancellation_type"
                                            value="standard"
                                            checked={cancellationType === 'standard'}
                                            onChange={() => setCancellationType('standard')}
                                            className="mt-0.5 text-zinc-600"
                                        />
                                        <div>
                                            <span className="font-bold text-foreground">Pembatalan Standar</span>
                                            <p className="text-[11px] text-muted-foreground">
                                                Pembatalan biasa tanpa status pengembalian atau penyitaan DP khusus.
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="cancel_admin_notes" className="text-xs font-semibold">
                                    Alasan & Catatan Pembatalan (Wajib):
                                </Label>
                                <Textarea
                                    id="cancel_admin_notes"
                                    placeholder="Jelaskan alasan pembatalan atau nomor rekening refund jika ada..."
                                    value={cancelAdminNotes}
                                    onChange={(e) => setCancelAdminNotes(e.target.value)}
                                    required
                                    className="min-h-[70px] text-xs"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setCancelModalOpen(false)}
                                disabled={submittingCancel}
                                className="text-xs"
                            >
                                Tutup
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                size="sm"
                                disabled={submittingCancel || !cancelAdminNotes.trim()}
                                className="text-xs font-semibold"
                            >
                                {submittingCancel ? 'Memproses...' : 'Konfirmasi Batalkan Pesanan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
