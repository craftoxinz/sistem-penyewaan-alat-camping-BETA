import * as React from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { Matcher } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

export interface DatePickerProps {
    value?: string; // Format: 'YYYY-MM-DD'
    onChange?: (dateString: string) => void;
    placeholder?: string;
    disabled?: boolean;
    minDate?: Date;
    maxDate?: Date;
    className?: string;
    id?: string;
}

/**
 * Parse string 'YYYY-MM-DD' ke objek Date lokal tanpa pergeseran timezone (UTC shift)
 */
function parseLocalDate(dateStr?: string): Date | undefined {
    if (!dateStr) return undefined;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return undefined;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined;
    return new Date(year, month, day);
}

/**
 * Format objek Date ke format ISO 'YYYY-MM-DD' lokal
 */
function formatToLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function DatePicker({
    value,
    onChange,
    placeholder = 'Pilih tanggal',
    disabled = false,
    minDate,
    maxDate,
    className,
    id,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);
    const selectedDate = React.useMemo(() => parseLocalDate(value), [value]);

    const handleSelect = (date: Date | undefined) => {
        if (date) {
            const dateStr = formatToLocalDateString(date);
            onChange?.(dateStr);
            setOpen(false);
        }
    };

    // Bangun aturan disabled dates
    const disabledMatcher = React.useMemo<Matcher[] | undefined>(() => {
        const matchers: Matcher[] = [];
        if (minDate) {
            matchers.push({ before: minDate });
        }
        if (maxDate) {
            matchers.push({ after: maxDate });
        }
        return matchers.length > 0 ? matchers : undefined;
    }, [minDate, maxDate]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        'h-10 w-full justify-start text-left text-xs font-normal bg-background transition-colors hover:bg-accent/50',
                        !value && 'text-muted-foreground',
                        className,
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    {selectedDate ? (
                        <span className="font-medium text-foreground">
                            {format(selectedDate, 'dd MMMM yyyy', { locale: idLocale })}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 shadow-lg border-border" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleSelect}
                    disabled={disabledMatcher}
                    locale={idLocale}
                    defaultMonth={selectedDate || minDate || new Date()}
                    autoFocus
                />
            </PopoverContent>
        </Popover>
    );
}
