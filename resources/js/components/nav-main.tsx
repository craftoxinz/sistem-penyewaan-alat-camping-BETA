import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem, NavGroup } from '@/types';

interface NavMainProps {
    items?: NavItem[];
    groups?: NavGroup[];
}

export function NavMain({ items, groups }: NavMainProps) {
    const { isCurrentUrl } = useCurrentUrl();

    const renderNavItem = (item: NavItem) => {
        // If the item has sub-items, render as Collapsible with SidebarMenuSub
        if (item.items && item.items.length > 0) {
            const hasActiveChild = item.items.some((subItem) =>
                subItem.href ? isCurrentUrl(subItem.href) : false,
            );

            return (
                <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={hasActiveChild || item.isActive}
                    className="group/collapsible"
                >
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                                tooltip={item.title}
                                isActive={hasActiveChild}
                            >
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                {item.items.map((subItem) => {
                                    const isSubActive = subItem.href
                                        ? isCurrentUrl(subItem.href)
                                        : false;

                                    return (
                                        <SidebarMenuSubItem key={subItem.title}>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isSubActive}
                                                size="sm"
                                            >
                                                {subItem.href ? (
                                                    <Link
                                                        href={subItem.href}
                                                        prefetch
                                                    >
                                                        {subItem.icon && (
                                                            <subItem.icon />
                                                        )}
                                                        <span>{subItem.title}</span>
                                                    </Link>
                                                ) : (
                                                    <span>{subItem.title}</span>
                                                )}
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    );
                                })}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            );
        }

        // Standard single item
        return (
            <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                    asChild
                    isActive={item.href ? isCurrentUrl(item.href) : false}
                    tooltip={{ children: item.title }}
                >
                    {item.href ? (
                        <Link href={item.href} prefetch>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                        </Link>
                    ) : (
                        <span>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                        </span>
                    )}
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    };

    // If explicit groups are provided, render each group with its own label
    if (groups && groups.length > 0) {
        return (
            <div className="flex flex-col gap-2">
                {groups.map((group) => (
                    <SidebarGroup key={group.title} className="px-2 py-0">
                        {group.title && (
                            <SidebarGroupLabel className="px-2 text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
                                {group.title}
                            </SidebarGroupLabel>
                        )}
                        <SidebarMenu>
                            {group.items.map((item) => renderNavItem(item))}
                        </SidebarMenu>
                    </SidebarGroup>
                ))}
            </div>
        );
    }

    // Fallback if flat items are passed
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarMenu>
                {items?.map((item) => renderNavItem(item))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
