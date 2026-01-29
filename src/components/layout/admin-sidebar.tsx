'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    LayoutDashboard,
    Briefcase,
    Settings,
    PieChart,
    Package,
    LogOut,
    PanelLeft,
    ChevronLeft,
    ChevronRight,
    Search,
    Users,
    UsersRound,
    ListChecks,
    Handshake
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { logout } from '@/lib/auth';

interface AdminSidebarProps {
    user: {
        name: string;
        email?: string;
        avatarUrl?: string | null;
        role: string;
    };
}

export function AdminSidebar({ user }: AdminSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    // Helper for nav items
    const NavItem = ({ href, icon: Icon, label, restrictedTo }: any) => {
        if (restrictedTo && user.role !== restrictedTo) return null;

        return (
            <Link href={href}>
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start",
                        isCollapsed ? "justify-center px-2" : "px-4"
                    )}
                    title={isCollapsed ? label : undefined}
                >
                    <Icon className={cn("h-4 w-4", isCollapsed ? "mr-0" : "mr-2")} />
                    {!isCollapsed && <span>{label}</span>}
                </Button>
            </Link>
        );
    };

    return (
        <aside
            className={cn(
                "border-r bg-muted/20 hidden md:flex flex-col transition-all duration-300 ease-in-out",
                isCollapsed ? "w-[70px]" : "w-64"
            )}
        >
            {/* Header */}
            <div className={cn("h-14 flex items-center border-b font-semibold text-lg tracking-tight hover:bg-muted/50 transition-colors", isCollapsed ? "justify-center px-0" : "px-6 justify-between")}>
                {!isCollapsed && <Link href="/admin">JiraPro</Link>}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
                    <PanelLeft className="h-4 w-4" />
                </Button>
            </div>

            {/* Profile */}
            <div className={cn("p-4 border-b flex items-center gap-3", isCollapsed && "justify-center p-2")}>
                <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatarUrl || ''} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                    <div className="overflow-hidden">
                        <div className="font-medium text-sm truncate">{user.name}</div>
                        <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px] h-4 px-1">{user.role}</Badge>
                        </div>
                    </div>
                )}
            </div>

            {/* Nav */}
            <ScrollArea className="flex-1 py-4">
                <nav className={cn("space-y-2", isCollapsed ? "px-2" : "px-4")}>
                    {/* Master Portfolio */}
                    <div className="mb-4">
                        {!isCollapsed && (
                            <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Master Portfolio
                            </h3>
                        )}
                        <div className="space-y-1">
                            <NavItem href="/admin" icon={LayoutDashboard} label="Dashboard" />
                            <NavItem href="/admin/tasks" icon={ListChecks} label="Global Tasks" />
                            <NavItem href="/admin/project" icon={Briefcase} label="Projects" />
                            <NavItem href="/admin/resources" icon={UsersRound} label="Resources" restrictedTo="ADMIN" />
                        </div>
                    </div>

                    {/* Modules */}
                    <div className="mb-4">
                        {!isCollapsed && (
                            <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Modules
                            </h3>
                        )}
                        <div className="space-y-1">
                            <NavItem href="/admin/crm" icon={Handshake} label="CRM" />
                            <NavItem href="/admin/product" icon={Package} label="Product" />
                            <NavItem href="/admin/finance" icon={PieChart} label="Finance" />
                        </div>
                    </div>
                </nav>
            </ScrollArea>

            {/* Footer */}
            <div className={cn("p-4 border-t space-y-2", isCollapsed && "p-2 space-y-2")}>
                <NavItem href="/admin/settings" icon={Settings} label="Settings" />
                <form action={async () => {
                    await logout();
                }}>
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50",
                            isCollapsed ? "justify-center px-2" : "px-4"
                        )}
                        type="submit"
                        title={isCollapsed ? "Logout" : undefined}
                    >
                        <LogOut className={cn("h-4 w-4", isCollapsed ? "mr-0" : "mr-2")} />
                        {!isCollapsed && "Logout"}
                    </Button>
                </form>
            </div>
        </aside>
    );
}
