'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Logo } from './logo';
import {
  LayoutDashboard,
  CookingPot,
  Carrot,
  LogOut,
  UserCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';

export function DashboardSidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/dashboard/recipes',
      label: 'Recipes',
      icon: CookingPot,
    },
    {
      href: '/dashboard/materials',
      label: 'Raw Materials',
      icon: Carrot,
    },
  ];

  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <div className="flex items-center gap-2 p-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://picsum.photos/seed/user/100/100" alt="@user" />
              <AvatarFallback>
                <UserCircle />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-sm">
                <span className="font-semibold text-sidebar-foreground">Chef John</span>
                <span className="text-muted-foreground">john@restaurant.com</span>
            </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Logout">
              <Link href="/">
                <LogOut />
                <span>Logout</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
