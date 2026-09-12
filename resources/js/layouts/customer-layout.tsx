import { Link, usePage } from '@inertiajs/react';
import {
    Tent,
    ShoppingBag,
    ClipboardList,
    User as UserIcon,
    Shield,
    LogIn,
    UserPlus,
} from 'lucide-react';
import type { PropsWithChildren } from 'react';
import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { UserRoleBadge } from '@/components/status-badges';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCart } from '@/hooks/use-cart';
import type { User } from '@/types';

interface CustomerLayoutProps extends PropsWithChildren {
    title?: string;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
    const { auth, flash } = usePage<{
        auth: { user: User | null };
        flash: { success?: string; error?: string };
    }>().props;
    const user = auth?.user;
    const { items } = useCart();

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased selection:bg-zinc-900 selection:text-white">

            {/* Top Navbar */}
            <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Brand */}
                    <div className="flex items-center gap-6">
                        <Link
                            href="/"
                            className="flex items-center gap-2 font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
                                <Tent className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-base font-extrabold leading-none tracking-tight">
                                    CampRental
                                </span>
                                <span className="text-[10px] font-medium text-muted-foreground">
                                    Outdoor Gear Hub
                                </span>
                            </div>
                        </Link>

                        <nav className="hidden items-center gap-1 md:flex">
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="text-xs font-medium"
                            >
                                <Link href="/">Katalog Alat</Link>
                            </Button>
                            {user && user.role === 'customer' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                    className="text-xs font-medium"
                                >
                                    <Link href="/bookings">Pesanan Saya</Link>
                                </Button>
                            )}
                        </nav>
                    </div>

                    {/* Right action icons & auth */}
                    <div className="flex items-center gap-3">
                        {/* Cart Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="relative h-9 gap-2 px-3"
                        >
                            <Link href="/cart">
                                <ShoppingBag className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                    Keranjang
                                </span>
                                {items.length > 0 && (
                                    <Badge className="flex h-5 min-w-5 items-center justify-center rounded-full border-none bg-red-600 px-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-red-600">
                                        {items.length > 99 ? '99+' : items.length}
                                    </Badge>
                                )}
                            </Link>
                        </Button>

                        {/* Auth actions */}
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="relative h-9 w-9 rounded-full p-0"
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage
                                                src={user.avatar}
                                                alt={user.name}
                                            />
                                            <AvatarFallback className="bg-zinc-200 text-xs font-medium dark:bg-zinc-800">
                                                {user.name
                                                    .substring(0, 2)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-56"
                                >
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1.5">
                                            <p className="text-sm leading-none font-medium">
                                                {user.name}
                                            </p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user.email}
                                            </p>
                                            <div className="pt-0.5">
                                                <UserRoleBadge role={user.role} />
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {user.role !== 'customer' ? (
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href="/admin"
                                                className="flex cursor-pointer items-center gap-2"
                                            >
                                                <Shield className="h-4 w-4" />
                                                <span>
                                                    {user.role === 'admin'
                                                        ? 'Dashboard Admin'
                                                        : user.role === 'kasir'
                                                          ? 'Panel Kasir'
                                                          : 'Panel Gudang'}
                                                </span>
                                            </Link>
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href="/bookings"
                                                className="flex cursor-pointer items-center gap-2"
                                            >
                                                <ClipboardList className="h-4 w-4" />
                                                <span>Riwayat Pesanan</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href="/settings/profile"
                                            className="flex cursor-pointer items-center gap-2"
                                        >
                                            <UserIcon className="h-4 w-4" />
                                            <span>Pengaturan Akun</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            className="w-full cursor-pointer text-destructive focus:text-destructive"
                                        >
                                            Keluar (Logout)
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                    className="gap-1.5 text-xs"
                                >
                                    <Link href="/login">
                                        <LogIn className="h-3.5 w-3.5" />
                                        <span>Masuk</span>
                                    </Link>
                                </Button>
                                <Button
                                    size="sm"
                                    asChild
                                    className="gap-1.5 bg-zinc-900 text-xs text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                >
                                    <Link href="/register">
                                        <UserPlus className="h-3.5 w-3.5" />
                                        <span>Daftar</span>
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1">{children}</main>

            {/* Footer */}
            <footer className="mt-16 border-t border-border bg-muted/40 py-10 text-sm text-muted-foreground">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                        <div className="space-y-3 md:col-span-2">
                            <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                                    <Tent className="h-4 w-4" />
                                </div>
                                <span>CampRental Indonesia</span>
                            </div>
                            <p className="max-w-sm text-xs text-muted-foreground">
                                Solusi sewa perlengkapan outdoor & camping
                                terlengkap, terawat, dan siap pakai untuk
                                petualangan alam terbaik Anda.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Jl. Riau No. 45, Bandung &bull; WhatsApp:
                                0812-3456-7890
                            </p>
                        </div>
                        <div>
                            <h4 className="mb-3 text-xs font-semibold tracking-wider text-foreground uppercase">
                                Layanan
                            </h4>
                            <ul className="space-y-2 text-xs">
                                <li>
                                    <Link
                                        href="/"
                                        className="hover:text-foreground"
                                    >
                                        Katalog Peralatan
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/cart"
                                        className="hover:text-foreground"
                                    >
                                        Keranjang Sewa
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/bookings"
                                        className="hover:text-foreground"
                                    >
                                        Status & Riwayat Booking
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="mb-3 text-xs font-semibold tracking-wider text-foreground uppercase">
                                Ketentuan Sewa
                            </h4>
                            <ul className="space-y-2 text-xs">
                                <li>DP 30% untuk kunci tanggal</li>
                                <li>Pelunasan COD saat serah terima</li>
                                <li>Jaminan deposit dikembalikan utuh</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-border/60 pt-6 text-xs sm:flex-row">
                        <p>
                            &copy; 2026 CampRental System. Dikembangkan untuk
                            PKL IDE LPKIA.
                        </p>
                        <p className="text-muted-foreground">
                            Sistem Manajemen Inventaris & Rental Camping
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
