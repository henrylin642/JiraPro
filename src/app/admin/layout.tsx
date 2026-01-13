
import React from 'react';
import Link from 'next/link';
import {
    LayoutDashboard,
    Briefcase,
    Users,
    Settings,
    PieChart,
    Box,
    LogOut,
    UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getCurrentUser, logout } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-muted/20 hidden md:block">
                <div className="h-full flex flex-col">
                    <Link href="/admin" className="h-14 flex items-center px-6 border-b font-semibold text-lg tracking-tight hover:bg-muted/50 transition-colors">
                        JiraPro
                    </Link>

                    {/* User Profile Summary */}
                    <div className="p-4 border-b flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={user.avatarUrl || ''} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                            <div className="font-medium text-sm truncate">{user.name}</div>
                            <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-[10px] h-4 px-1">{user.role}</Badge>
                            </div>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 py-4">
                        <nav className="px-4 space-y-2">
                            <div className="mb-4">
                                <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Master Portfolio
                                </h3>
                                <div className="space-y-1">
                                    <Link href="/admin">
                                        <Button variant="ghost" className="w-full justify-start">
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            Dashboard
                                        </Button>
                                    </Link>
                                    <Link href="/admin/tasks">
                                        <Button variant="ghost" className="w-full justify-start">
                                            <Users className="mr-2 h-4 w-4" />
                                            Global Tasks
                                        </Button>
                                    </Link>
                                    <Link href="/admin/project">
                                        <Button variant="ghost" className="w-full justify-start">
                                            <Briefcase className="mr-2 h-4 w-4" />
                                            Projects
                                        </Button>
                                    </Link>
                                    {/* RBAC: Only ADMIN can see Resources */}
                                    {user.role === 'ADMIN' && (
                                        <Link href="/admin/resources">
                                            <Button variant="ghost" className="w-full justify-start">
                                                <Users className="mr-2 h-4 w-4" />
                                                Resources
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Modules
                                </h3>
                                <div className="space-y-1">
                                    <Link href="/admin/crm">
                                        <Button variant="ghost" className="w-full justify-start">
                                            <Box className="mr-2 h-4 w-4" />
                                            CRM
                                        </Button>
                                    </Link>
                                    <Link href="/admin/product">
                                        <Button variant="ghost" className="w-full justify-start">
                                            <Box className="mr-2 h-4 w-4" />
                                            Product
                                        </Button>
                                    </Link>
                                    <Link href="/admin/finance">
                                        <Button variant="ghost" className="w-full justify-start">
                                            <PieChart className="mr-2 h-4 w-4" />
                                            Finance
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </nav>
                    </ScrollArea>
                    <div className="p-4 border-t space-y-2">
                        <Link href="/admin/settings">
                            <Button variant="ghost" className="w-full justify-start">
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Button>
                        </Link>
                        <form action={async () => {
                            'use server';
                            await logout();
                        }}>
                            <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50" type="submit">
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </Button>
                        </form>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-14 border-b flex items-center justify-between px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="md:hidden font-semibold">JiraPro Mobile</div>
                    {/* Placeholder for Breadcrumbs or Page Title */}
                    <div className="hidden md:block text-sm text-muted-foreground">
                        Welcome back, <span className="font-medium text-foreground">{user.name}</span>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
