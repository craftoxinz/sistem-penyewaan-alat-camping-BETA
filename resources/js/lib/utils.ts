import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url?: NonNullable<InertiaLinkProps['href']> | null): string {
    if (!url) {
        return '';
    }

    return typeof url === 'string' ? url : url.url;
}
