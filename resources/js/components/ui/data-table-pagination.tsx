import React from 'react';
import { router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page?: number;
    total: number;
    from?: number | null;
    to?: number | null;
    prev_page_url?: string | null;
    next_page_url?: string | null;
    links?: Array<{ url: string | null; label: string; active: boolean }>;
}

export interface DataTablePaginationProps {
    pagination: PaginationMeta;
    selectedRowCount?: number;
    totalRowCount?: number;
    pageSizeOptions?: number[];
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    className?: string;
}

export function DataTablePagination({
    pagination,
    selectedRowCount,
    totalRowCount,
    pageSizeOptions = [5, 10, 20, 50, 100],
    onPageChange,
    onPerPageChange,
    className = '',
}: DataTablePaginationProps) {
    const currentPage = pagination.current_page || 1;
    const lastPage = Math.max(1, pagination.last_page || 1);
    const perPage = pagination.per_page || 5;
    const total = pagination.total || 0;

    const handlePageChange = (targetPage: number) => {
        if (targetPage < 1 || targetPage > lastPage || targetPage === currentPage) {
            return;
        }

        if (onPageChange) {
            onPageChange(targetPage);
            return;
        }

        const url = new URL(window.location.href);
        url.searchParams.set('page', String(targetPage));
        router.get(url.pathname + url.search, {}, { preserveState: true, preserveScroll: true });
    };

    const handlePerPageChange = (val: string) => {
        const newPerPage = parseInt(val, 10);
        if (onPerPageChange) {
            onPerPageChange(newPerPage);
            return;
        }

        const url = new URL(window.location.href);
        url.searchParams.set('per_page', String(newPerPage));
        url.searchParams.set('page', '1');
        router.get(url.pathname + url.search, {}, { preserveState: true, preserveScroll: true });
    };

    // Ensure current perPage is included in options if it differs from default array
    const options = Array.from(new Set([...pageSizeOptions, perPage])).sort((a, b) => a - b);

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-3 ${className}`}>
            {/* Left side: Selection or Row count */}
            <div className="text-xs text-muted-foreground w-full sm:w-auto text-left">
                {selectedRowCount !== undefined ? (
                    <span>
                        {selectedRowCount} of {totalRowCount ?? total} row(s) selected.
                    </span>
                ) : (
                    <span>
                        Menampilkan {pagination.from ?? (total > 0 ? 1 : 0)}-{pagination.to ?? total} dari {total} data
                    </span>
                )}
            </div>

            {/* Right side: Rows per page, Page indicator, 4-button Navigation */}
            <div className="flex flex-wrap items-center justify-end gap-4 sm:gap-6 w-full sm:w-auto">
                {/* Rows per page selector */}
                <div className="flex items-center space-x-2">
                    <p className="text-xs font-medium text-foreground whitespace-nowrap">
                        Rows per page
                    </p>
                    <Select
                        value={String(perPage)}
                        onValueChange={handlePerPageChange}
                    >
                        <SelectTrigger className="h-8 w-[70px] text-xs">
                            <SelectValue placeholder={String(perPage)} />
                        </SelectTrigger>
                        <SelectContent side="top" className="min-w-[70px]">
                            {options.map((pageSize) => (
                                <SelectItem key={pageSize} value={String(pageSize)} className="text-xs">
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Page indicator */}
                <div className="flex items-center justify-center text-xs font-medium text-foreground whitespace-nowrap">
                    Page {currentPage} of {lastPage}
                </div>

                {/* 4 Navigation Buttons */}
                <div className="flex items-center space-x-1">
                    {/* First Page */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage <= 1}
                        title="Halaman Pertama"
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>

                    {/* Previous Page */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        title="Halaman Sebelumnya"
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Next Page */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= lastPage}
                        title="Halaman Berikutnya"
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    {/* Last Page */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePageChange(lastPage)}
                        disabled={currentPage >= lastPage}
                        title="Halaman Terakhir"
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
