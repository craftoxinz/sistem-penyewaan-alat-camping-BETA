import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Info,
    RotateCcw,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';

export interface CalendarEventItem {
    title: string;
    start: string; // 'YYYY-MM-DD'
    allDay?: boolean;
    color?: string;
    extendedProps?: {
        available: boolean;
        remainingStock: number;
        totalUnits: number;
        bookedUnits: number;
    };
}

interface EquipmentAvailabilityCalendarProps {
    events: CalendarEventItem[];
    totalUnits: number;
    /**
     * When provided, the calendar becomes interactive and allows date-range
     * selection. When omitted the calendar is read-only (view only).
     */
    onSelectDateRange?: (start: string, end: string) => void;
    startDate?: string;
    endDate?: string;
}

const MONTH_NAMES = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function formatDateKey(year: number, month: number, day: number): string {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');

    return `${year}-${m}-${d}`;
}

export default function EquipmentAvailabilityCalendar({
    events,
    totalUnits,
    onSelectDateRange,
    startDate,
    endDate,
}: EquipmentAvailabilityCalendarProps) {
    const isReadOnly = !onSelectDateRange;

    const today = useMemo(() => new Date(), []);
    const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);

    // Internal selection state — only used in interactive mode
    const [internalStart, setInternalStart] = useState<string>('');
    const [internalEnd, setInternalEnd] = useState<string>('');
    const [selectingStart, setSelectingStart] = useState<string | null>(null);

    const effectiveStart = startDate ?? internalStart;
    const effectiveEnd = endDate ?? internalEnd;

    const [viewDate, setViewDate] = useState<Date>(() => {
        const initialDate = effectiveStart || todayStr;
        const parsed = new Date(initialDate);
        if (!isNaN(parsed.getTime())) {
            return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
        }

        return new Date(today.getFullYear(), today.getMonth(), 1);
    });

    // Map events by date string for fast O(1) lookup
    const eventsMap = useMemo(() => {
        const map = new Map<string, CalendarEventItem>();
        for (const ev of events) {
            map.set(ev.start, ev);
        }

        return map;
    }, [events]);

    const viewYear = viewDate.getFullYear();
    const viewMonth = viewDate.getMonth();

    const daysInMonth = useMemo(() => {
        return new Date(viewYear, viewMonth + 1, 0).getDate();
    }, [viewYear, viewMonth]);

    const firstDayOfWeek = useMemo(() => {
        return new Date(viewYear, viewMonth, 1).getDay();
    }, [viewYear, viewMonth]);

    const isCurrentMonthPast = useMemo(() => {
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const viewMonthStart = new Date(viewYear, viewMonth, 1);

        return viewMonthStart <= thisMonthStart;
    }, [today, viewYear, viewMonth]);

    const handlePrevMonth = () => {
        if (isCurrentMonthPast) {
            return;
        }
        setViewDate(new Date(viewYear, viewMonth - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewYear, viewMonth + 1, 1));
    };

    const handleResetToToday = () => {
        setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    };

    /** Only called in interactive mode */
    const handleDateClick = (dateStr: string, isPast: boolean) => {
        if (isReadOnly || isPast) {
            return;
        }

        const updateRange = (start: string, end: string) => {
            if (onSelectDateRange) {
                onSelectDateRange(start, end);
            } else {
                setInternalStart(start);
                setInternalEnd(end);
            }
        };

        if (!selectingStart) {
            setSelectingStart(dateStr);
            const nextDay = new Date(dateStr);
            nextDay.setDate(nextDay.getDate() + 1);
            updateRange(dateStr, nextDay.toISOString().split('T')[0]);
        } else {
            if (dateStr > selectingStart) {
                updateRange(selectingStart, dateStr);
                setSelectingStart(null);
            } else if (dateStr === selectingStart) {
                const nextDay = new Date(dateStr);
                nextDay.setDate(nextDay.getDate() + 1);
                updateRange(dateStr, nextDay.toISOString().split('T')[0]);
                setSelectingStart(null);
            } else {
                setSelectingStart(dateStr);
                const nextDay = new Date(dateStr);
                nextDay.setDate(nextDay.getDate() + 1);
                updateRange(dateStr, nextDay.toISOString().split('T')[0]);
            }
        }
    };

    return (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
            {/* Header: Title, Navigation Controls */}
            <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                            <CalendarIcon className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-foreground">
                                Kalender Ketersediaan Stok Real-Time
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {isReadOnly
                                    ? 'Cek jumlah unit yang tersedia pada setiap tanggal sebelum memesan.'
                                    : 'Klik tanggal mulai dan selesai untuk memilih durasi sewa.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetToToday}
                        className="h-8 gap-1 text-xs"
                    >
                        <RotateCcw className="h-3 w-3" />
                        <span>Bulan Ini</span>
                    </Button>
                    <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handlePrevMonth}
                            disabled={isCurrentMonthPast}
                            className="h-7 w-7 p-0 disabled:opacity-30"
                            aria-label="Bulan Sebelumnya"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="min-w-[120px] text-center text-xs font-bold text-foreground">
                            {MONTH_NAMES[viewMonth]} {viewYear}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleNextMonth}
                            className="h-7 w-7 p-0"
                            aria-label="Bulan Berikutnya"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-hidden rounded-xl border border-border bg-background">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 border-b border-border bg-muted/50 text-center text-xs font-semibold text-muted-foreground">
                    {DAY_NAMES.map((day, idx) => (
                        <div
                            key={day}
                            className={`py-2.5 ${idx === 0 || idx === 6 ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}`}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days cells */}
                <div className="grid grid-cols-7 divide-x divide-y divide-border text-xs">
                    {/* Empty placeholder cells for previous month */}
                    {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                        <div
                            key={`empty-${idx}`}
                            className="min-h-[72px] bg-muted/15 p-1.5 opacity-40"
                        />
                    ))}

                    {/* Month Day Cells */}
                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                        const dayNum = idx + 1;
                        const dateStr = formatDateKey(viewYear, viewMonth, dayNum);
                        const isPast = dateStr < todayStr;
                        const isToday = dateStr === todayStr;

                        const event = eventsMap.get(dateStr);
                        const remainingStock = event?.extendedProps?.remainingStock ?? totalUnits;
                        const isFull = remainingStock <= 0;

                        // Selection highlight — only shown in interactive mode
                        const isStart = !isReadOnly && effectiveStart === dateStr;
                        const isEnd = !isReadOnly && effectiveEnd === dateStr;
                        const isInRange =
                            !isReadOnly &&
                            effectiveStart &&
                            effectiveEnd &&
                            dateStr >= effectiveStart &&
                            dateStr <= effectiveEnd;
                        const isSelectedBoundary = isStart || isEnd;

                        return (
                            <div
                                key={dateStr}
                                onClick={() => handleDateClick(dateStr, isPast)}
                                className={`group relative min-h-[76px] p-2 transition-colors select-none flex flex-col justify-between ${
                                    isPast
                                        ? 'bg-muted/30 opacity-40 cursor-default'
                                        : isReadOnly
                                          ? 'cursor-default'
                                          : 'cursor-pointer hover:bg-muted/40'
                                } ${
                                    isInRange && !isPast
                                        ? 'bg-emerald-50 dark:bg-emerald-950/30'
                                        : ''
                                } ${
                                    isSelectedBoundary
                                        ? 'ring-2 ring-emerald-600 dark:ring-emerald-400 ring-inset bg-emerald-100/80 dark:bg-emerald-950/60'
                                        : ''
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span
                                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                            isToday
                                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                                : isSelectedBoundary
                                                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 font-extrabold'
                                                  : 'text-foreground'
                                        }`}
                                    >
                                        {dayNum}
                                    </span>
                                </div>

                                {/* Stock status pill */}
                                <div className="mt-1.5">
                                    {isPast ? (
                                        <span className="text-[10px] text-muted-foreground">Lewat</span>
                                    ) : isFull ? (
                                        <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                                            Habis
                                        </span>
                                    ) : (
                                        <span
                                            className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold border ${
                                                remainingStock <= 2
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40'
                                            }`}
                                        >
                                            Sisa {remainingStock}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend & Hint Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-muted-foreground border-t border-border">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 dark:bg-emerald-500" />
                        <span>Tersedia</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                        <span>Sisa Sedikit (&le; 2)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-600 dark:bg-rose-500" />
                        <span>Habis / Full Booked</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Info className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                        {isReadOnly
                            ? 'Tentukan jadwal trip Anda di halaman Keranjang saat checkout.'
                            : 'Klik tanggal untuk mengatur rentang sewa.'}
                    </span>
                </div>
            </div>
        </div>
    );
}
