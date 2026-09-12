import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Equipment, CartItem } from '@/types';

const CART_STORAGE_KEY = 'camping_cart_items_v1';
const DATES_STORAGE_KEY = 'camping_cart_dates_v1';
const CART_EVENT = 'camping_cart_updated';

function getStoredItems(): CartItem[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);

        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveItemsToStorage(items: CartItem[]) {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        window.dispatchEvent(new CustomEvent(CART_EVENT));
    } catch (e) {
        console.error('Failed to save cart to localStorage', e);
    }
}

export function useCart() {
    const [items, setItems] = useState<CartItem[]>(getStoredItems);
    const [selectedIds, setSelectedIds] = useState<number[]>(() => {
        const initial = getStoredItems();

        return initial.map((i) => i.equipment_id);
    });

    const [startDate, setStartDateState] = useState<string>(() => {
        if (typeof window === 'undefined') {
            return '';
        }

        try {
            const stored = localStorage.getItem(DATES_STORAGE_KEY);

            if (stored) {
                const parsed = JSON.parse(stored);

                return parsed.startDate || '';
            }
        } catch {
            // fallback
        }

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        return tomorrow.toISOString().split('T')[0];
    });

    const [endDate, setEndDateState] = useState<string>(() => {
        if (typeof window === 'undefined') {
            return '';
        }

        try {
            const stored = localStorage.getItem(DATES_STORAGE_KEY);

            if (stored) {
                const parsed = JSON.parse(stored);

                return parsed.endDate || '';
            }
        } catch {
            // fallback
        }

        const returnDate = new Date();
        returnDate.setDate(returnDate.getDate() + 3);

        return returnDate.toISOString().split('T')[0];
    });

    // Synchronize across components or tabs via CustomEvent & storage event
    useEffect(() => {
        const handleSync = () => {
            const latest = getStoredItems();
            setItems(latest);
            setSelectedIds((prev) => {
                const latestIds = new Set(latest.map((i) => i.equipment_id));

                // If nothing was selected before, select all newly added items
                if (prev.length === 0 && latest.length > 0) {
                    return latest.map((i) => i.equipment_id);
                }

                // Filter out any IDs that no longer exist in items
                return prev.filter((id) => latestIds.has(id));
            });
        };

        window.addEventListener(CART_EVENT, handleSync);
        window.addEventListener('storage', handleSync);

        return () => {
            window.removeEventListener(CART_EVENT, handleSync);
            window.removeEventListener('storage', handleSync);
        };
    }, []);

    // Keep selectedIds in sync whenever items array changes
    useEffect(() => {
        setSelectedIds((prev) => {
            const itemIds = new Set(items.map((i) => i.equipment_id));

            // Default: if state is empty but items exist, select all
            if (prev.length === 0 && items.length > 0) {
                return items.map((i) => i.equipment_id);
            }

            return prev.filter((id) => itemIds.has(id));
        });
    }, [items]);

    const setStartDate = useCallback((date: string) => {
        setStartDateState(date);
        try {
            const stored = localStorage.getItem(DATES_STORAGE_KEY);
            const parsed = stored ? JSON.parse(stored) : {};
            localStorage.setItem(
                DATES_STORAGE_KEY,
                JSON.stringify({ ...parsed, startDate: date }),
            );
        } catch {
            // ignore
        }
    }, []);

    const setEndDate = useCallback((date: string) => {
        setEndDateState(date);
        try {
            const stored = localStorage.getItem(DATES_STORAGE_KEY);
            const parsed = stored ? JSON.parse(stored) : {};
            localStorage.setItem(
                DATES_STORAGE_KEY,
                JSON.stringify({ ...parsed, endDate: date }),
            );
        } catch {
            // ignore
        }
    }, []);

    const setDateRange = useCallback((newStart: string, newEnd: string) => {
        setStartDateState(newStart);
        setEndDateState(newEnd);
        try {
            localStorage.setItem(
                DATES_STORAGE_KEY,
                JSON.stringify({ startDate: newStart, endDate: newEnd }),
            );
        } catch {
            // ignore
        }
    }, []);

    const totalDays = useMemo(() => {
        if (!startDate || !endDate) {
            return 1;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return Math.max(1, diffDays);
    }, [startDate, endDate]);

    const addItem = useCallback((equipment: Equipment, quantity: number = 1) => {
        const current = getStoredItems();
        const existingIndex = current.findIndex((i) => i.equipment_id === equipment.id);
        let updated: CartItem[];

        if (existingIndex > -1) {
            updated = [...current];
            updated[existingIndex] = {
                ...updated[existingIndex],
                quantity: updated[existingIndex].quantity + quantity,
            };
        } else {
            updated = [...current, { equipment_id: equipment.id, equipment, quantity }];
        }

        saveItemsToStorage(updated);
        setItems(updated);
        setSelectedIds((prev) => Array.from(new Set([...prev, equipment.id])));
    }, []);

    const removeItem = useCallback((equipmentId: number) => {
        const current = getStoredItems();
        const updated = current.filter((i) => i.equipment_id !== equipmentId);

        saveItemsToStorage(updated);
        setItems(updated);
        setSelectedIds((prev) => prev.filter((id) => id !== equipmentId));
    }, []);

    const removeItems = useCallback((equipmentIds: number[]) => {
        const removeSet = new Set(equipmentIds);
        const current = getStoredItems();
        const updated = current.filter((i) => !removeSet.has(i.equipment_id));

        saveItemsToStorage(updated);
        setItems(updated);
        setSelectedIds((prev) => prev.filter((id) => !removeSet.has(id)));
    }, []);

    const updateQuantity = useCallback((equipmentId: number, quantity: number) => {
        if (quantity <= 0) {
            removeItem(equipmentId);

            return;
        }

        const current = getStoredItems();
        const updated = current.map((i) =>
            i.equipment_id === equipmentId ? { ...i, quantity } : i,
        );

        saveItemsToStorage(updated);
        setItems(updated);
    }, [removeItem]);

    const clearCart = useCallback(() => {
        saveItemsToStorage([]);
        setItems([]);
        setSelectedIds([]);
    }, []);

    // Selection helpers
    const toggleSelectItem = useCallback((equipmentId: number) => {
        setSelectedIds((prev) =>
            prev.includes(equipmentId)
                ? prev.filter((id) => id !== equipmentId)
                : [...prev, equipmentId],
        );
    }, []);

    const selectAll = useCallback(() => {
        setSelectedIds(items.map((i) => i.equipment_id));
    }, [items]);

    const unselectAll = useCallback(() => {
        setSelectedIds([]);
    }, []);

    const isItemSelected = useCallback((equipmentId: number) => {
        return selectedIds.includes(equipmentId);
    }, [selectedIds]);

    // Selected Items and their calculations
    const selectedItems = useMemo(() => {
        const selectedSet = new Set(selectedIds);

        return items.filter((item) => selectedSet.has(item.equipment_id));
    }, [items, selectedIds]);

    const selectedItemCount = useMemo(() => {
        return selectedItems.reduce((sum, i) => sum + i.quantity, 0);
    }, [selectedItems]);

    const selectedSubtotalPrice = useMemo(() => {
        return selectedItems.reduce((sum, item) => {
            const price =
                typeof item.equipment.price_per_day === 'string'
                    ? parseFloat(item.equipment.price_per_day)
                    : item.equipment.price_per_day;

            return sum + price * item.quantity * totalDays;
        }, 0);
    }, [selectedItems, totalDays]);

    const selectedTotalDeposit = useMemo(() => {
        return selectedItems.reduce((sum, item) => {
            const deposit =
                typeof item.equipment.deposit_per_unit === 'string'
                    ? parseFloat(item.equipment.deposit_per_unit)
                    : item.equipment.deposit_per_unit;

            return sum + deposit * item.quantity;
        }, 0);
    }, [selectedItems]);

    const selectedTotalPrice = selectedSubtotalPrice + selectedTotalDeposit;
    const selectedDpAmount = Math.ceil((selectedTotalPrice * 0.3) / 1000) * 1000;
    const selectedRemainingAmount = selectedTotalPrice - selectedDpAmount;

    // Detailed per-item breakdown for selected items
    const selectedItemsBreakdown = useMemo(() => {
        return selectedItems.map((item) => {
            const price =
                typeof item.equipment.price_per_day === 'string'
                    ? parseFloat(item.equipment.price_per_day)
                    : item.equipment.price_per_day;
            const deposit =
                typeof item.equipment.deposit_per_unit === 'string'
                    ? parseFloat(item.equipment.deposit_per_unit)
                    : item.equipment.deposit_per_unit;

            const itemRentTotal = price * item.quantity * totalDays;
            const itemDepositTotal = deposit * item.quantity;
            const itemGrandTotal = itemRentTotal + itemDepositTotal;

            return {
                ...item,
                pricePerDay: price,
                depositPerUnit: deposit,
                itemRentTotal,
                itemDepositTotal,
                itemGrandTotal,
            };
        });
    }, [selectedItems, totalDays]);

    // Total counts for all items in cart
    const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

    const subtotalPrice = useMemo(() => {
        return items.reduce((sum, item) => {
            const price =
                typeof item.equipment.price_per_day === 'string'
                    ? parseFloat(item.equipment.price_per_day)
                    : item.equipment.price_per_day;

            return sum + price * item.quantity * totalDays;
        }, 0);
    }, [items, totalDays]);

    const totalDeposit = useMemo(() => {
        return items.reduce((sum, item) => {
            const deposit =
                typeof item.equipment.deposit_per_unit === 'string'
                    ? parseFloat(item.equipment.deposit_per_unit)
                    : item.equipment.deposit_per_unit;

            return sum + deposit * item.quantity;
        }, 0);
    }, [items]);

    const totalPrice = subtotalPrice + totalDeposit;
    const dpAmount = Math.ceil((totalPrice * 0.3) / 1000) * 1000;
    const remainingAmount = totalPrice - dpAmount;

    const isAllSelected = items.length > 0 && selectedIds.length === items.length;
    const hasSelectedItems = selectedItems.length > 0;

    return {
        items,
        selectedIds,
        selectedItems,
        selectedItemCount,
        selectedSubtotalPrice,
        selectedTotalDeposit,
        selectedTotalPrice,
        selectedDpAmount,
        selectedRemainingAmount,
        selectedItemsBreakdown,
        isAllSelected,
        hasSelectedItems,
        toggleSelectItem,
        selectAll,
        unselectAll,
        isItemSelected,
        setSelectedIds,
        startDate,
        endDate,
        totalDays,
        itemCount,
        subtotalPrice,
        totalDeposit,
        totalPrice,
        dpAmount,
        remainingAmount,
        addItem,
        removeItem,
        removeItems,
        updateQuantity,
        clearCart,
        setDateRange,
        setStartDate,
        setEndDate,
    };
}

