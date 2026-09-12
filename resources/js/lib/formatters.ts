export function formatRupiah(
    amount: number | string | null | undefined,
): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(isNaN(num) ? 0 : num);
}

export function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) {
        return '-';
    }

    try {
        const d = new Date(dateStr);

        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }).format(d);
    } catch {
        return dateStr;
    }
}

export function formatDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) {
        return '-';
    }

    try {
        const d = new Date(dateStr);

        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(d);
    } catch {
        return dateStr;
    }
}
