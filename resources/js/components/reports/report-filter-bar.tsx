import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Printer, Download, Filter } from 'lucide-react';

interface ReportFilterBarProps {
    routePath: string;
    startDate: string;
    endDate: string;
    extraParams?: Record<string, any>;
    onExportCsv?: () => void;
    children?: React.ReactNode;
}

export function ReportFilterBar({
    routePath,
    startDate: initialStartDate,
    endDate: initialEndDate,
    extraParams = {},
    onExportCsv,
    children,
}: ReportFilterBarProps) {
    const [startDate, setStartDate] = useState<string>(initialStartDate);
    const [endDate, setEndDate] = useState<string>(initialEndDate);

    const handleApplyFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            routePath,
            {
                ...extraParams,
                start_date: startDate,
                end_date: endDate,
            },
            { preserveState: true }
        );
    };

    const handlePreset = (days: number | 'this_month' | 'this_year') => {
        const today = new Date();
        const endStr = today.toISOString().split('T')[0];
        let startStr = endStr;

        if (typeof days === 'number') {
            const past = new Date();
            past.setDate(today.getDate() - days);
            startStr = past.toISOString().split('T')[0];
        } else if (days === 'this_month') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            startStr = firstDay.toISOString().split('T')[0];
        } else if (days === 'this_year') {
            const firstDay = new Date(today.getFullYear(), 0, 1);
            startStr = firstDay.toISOString().split('T')[0];
        }

        setStartDate(startStr);
        setEndDate(endStr);

        router.get(
            routePath,
            {
                ...extraParams,
                start_date: startStr,
                end_date: endStr,
            },
            { preserveState: true }
        );
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Card className="border-border shadow-none print:hidden bg-card">
            <CardContent className="p-4 space-y-3">
                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-muted-foreground font-medium mr-1 flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Rentang Cepat:</span>
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreset(7)}
                            className="h-7 text-[11px] px-2.5"
                        >
                            7 Hari
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreset(30)}
                            className="h-7 text-[11px] px-2.5"
                        >
                            30 Hari
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreset('this_month')}
                            className="h-7 text-[11px] px-2.5"
                        >
                            Bulan Ini
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreset('this_year')}
                            className="h-7 text-[11px] px-2.5"
                        >
                            Tahun Ini
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        {onExportCsv && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onExportCsv}
                                className="h-7 text-xs gap-1.5 font-medium"
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span>Ekspor CSV</span>
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="h-7 text-xs gap-1.5 font-medium"
                        >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Cetak Laporan</span>
                        </Button>
                    </div>
                </div>

                {/* Custom Date Form & Optional Extra Filters */}
                <form onSubmit={handleApplyFilter} className="flex flex-col sm:flex-row items-end gap-3 text-xs">
                    <div className="space-y-1 flex-1 w-full">
                        <Label className="text-xs font-semibold">Dari Tanggal:</Label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="h-9 text-xs"
                        />
                    </div>
                    <div className="space-y-1 flex-1 w-full">
                        <Label className="text-xs font-semibold">Sampai Tanggal:</Label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="h-9 text-xs"
                        />
                    </div>

                    {children}

                    <Button
                        type="submit"
                        size="sm"
                        className="h-9 text-xs bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold gap-1.5 shrink-0"
                    >
                        <Filter className="h-3.5 w-3.5" />
                        <span>Terapkan Filter</span>
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
