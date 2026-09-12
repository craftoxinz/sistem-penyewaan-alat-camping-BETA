import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    ShoppingBag,
    ShieldAlert,
    ArrowLeftRight,
    Tent,
    FolderTree,
    Tag,
    Layers,
    BarChart3,
    ExternalLink,
    DollarSign,
    Award,
    CreditCard,
    Activity,
    Users,
    UserCog,
    Star,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavGroup, NavItem, User } from '@/types';

function getNavGroupsForRole(role?: string): NavGroup[] {
    if (role === 'kasir') {
        return [
            {
                title: 'Menu Utama',
                items: [
                    {
                        title: 'Dashboard',
                        href: '/admin',
                        icon: LayoutGrid,
                    },
                    {
                        title: 'Pesanan & Transaksi',
                        href: '/admin/rentals',
                        icon: ShoppingBag,
                    },
                    {
                        title: 'Denda & Keterlambatan',
                        href: '/admin/fines',
                        icon: ShieldAlert,
                    },
                ],
            },
            {
                title: 'Inventaris Alat',
                items: [
                    {
                        title: 'Master Alat Camping',
                        href: '/admin/equipment',
                        icon: Tent,
                    },
                ],
            },
            {
                title: 'Laporan & Analitik',
                items: [
                    {
                        title: 'Laporan & Analitik',
                        icon: BarChart3,
                        items: [
                            {
                                title: 'Laporan Keuangan',
                                href: '/admin/reports/revenue',
                                icon: DollarSign,
                            },
                            {
                                title: 'Status Pembayaran & DP',
                                href: '/admin/reports/payments',
                                icon: CreditCard,
                            },
                            {
                                title: 'Alat Camping Terlaris',
                                href: '/admin/reports/top-equipment',
                                icon: Award,
                            },
                            {
                                title: 'Riwayat Penyewa',
                                href: '/admin/reports/customers',
                                icon: Users,
                            },
                        ],
                    },
                ],
            },
        ];
    }

    if (role === 'petugas_gudang') {
        return [
            {
                title: 'Menu Utama',
                items: [
                    {
                        title: 'Dashboard',
                        href: '/admin',
                        icon: LayoutGrid,
                    },
                    {
                        title: 'Pesanan & Transaksi',
                        href: '/admin/rentals',
                        icon: ShoppingBag,
                    },
                    {
                        title: 'Denda & Keterlambatan',
                        href: '/admin/fines',
                        icon: ShieldAlert,
                    },
                    {
                        title: 'Log Mutasi Barang',
                        href: '/admin/inventory-logs',
                        icon: ArrowLeftRight,
                    },
                ],
            },
            {
                title: 'Inventaris Alat',
                items: [
                    {
                        title: 'Master Alat Camping',
                        href: '/admin/equipment',
                        icon: Tent,
                    },
                    {
                        title: 'Kategori Alat',
                        href: '/admin/categories',
                        icon: FolderTree,
                    },
                    {
                        title: 'Brand & Merk',
                        href: '/admin/brands',
                        icon: Tag,
                    },
                    {
                        title: 'Unit Fisik Inventaris',
                        href: '/admin/units',
                        icon: Layers,
                    },
                ],
            },
            {
                title: 'Laporan & Analitik',
                items: [
                    {
                        title: 'Laporan & Analitik',
                        icon: BarChart3,
                        items: [
                            {
                                title: 'Utilisasi & Kondisi Unit',
                                href: '/admin/reports/inventory',
                                icon: Activity,
                            },
                            {
                                title: 'Alat Camping Terlaris',
                                href: '/admin/reports/top-equipment',
                                icon: Award,
                            },
                        ],
                    },
                ],
            },
        ];
    }

    // Default / Administrator Full Navigation
    return [
        {
            title: 'Menu Utama',
            items: [
                {
                    title: 'Dashboard',
                    href: '/admin',
                    icon: LayoutGrid,
                },
                {
                    title: 'Pesanan & Transaksi',
                    href: '/admin/rentals',
                    icon: ShoppingBag,
                },
                {
                    title: 'Denda & Keterlambatan',
                    href: '/admin/fines',
                    icon: ShieldAlert,
                },
                {
                    title: 'Log Mutasi Barang',
                    href: '/admin/inventory-logs',
                    icon: ArrowLeftRight,
                },
            ],
        },
        {
            title: 'Inventaris Alat',
            items: [
                {
                    title: 'Master Alat Camping',
                    href: '/admin/equipment',
                    icon: Tent,
                },
                {
                    title: 'Kategori Alat',
                    href: '/admin/categories',
                    icon: FolderTree,
                },
                {
                    title: 'Brand & Merk',
                    href: '/admin/brands',
                    icon: Tag,
                },
                {
                    title: 'Unit Fisik Inventaris',
                    href: '/admin/units',
                    icon: Layers,
                },
            ],
        },
        {
            title: 'Laporan & Analitik',
            items: [
                {
                    title: 'Laporan & Analitik',
                    icon: BarChart3,
                    items: [
                        {
                            title: 'Laporan Keuangan',
                            href: '/admin/reports/revenue',
                            icon: DollarSign,
                        },
                        {
                            title: 'Alat Camping Terlaris',
                            href: '/admin/reports/top-equipment',
                            icon: Award,
                        },
                        {
                            title: 'Status Pembayaran & DP',
                            href: '/admin/reports/payments',
                            icon: CreditCard,
                        },
                        {
                            title: 'Utilisasi & Kondisi Unit',
                            href: '/admin/reports/inventory',
                            icon: Activity,
                        },
                        {
                            title: 'Riwayat Penyewa',
                            href: '/admin/reports/customers',
                            icon: Users,
                        },
                    ],
                },
            ],
        },
        {
            title: 'Manajemen Akun',
            items: [
                {
                    title: 'Ulasan & Rating',
                    href: '/admin/reviews',
                    icon: Star,
                },
                {
                    title: 'Kelola Pengguna',
                    href: '/admin/users',
                    icon: UserCog,
                },
            ],
        },
    ];
}

const footerNavItems: NavItem[] = [
    {
        title: 'Katalog Publik (Toko)',
        href: '/',
        icon: ExternalLink,
    },
];

export function AppSidebar() {
    const page = usePage<{ auth: { user: User } }>();
    const currentUser = page.props.auth?.user;
    const navGroups = getNavGroupsForRole(currentUser?.role);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="py-2">
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
