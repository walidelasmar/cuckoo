'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Settings,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/contexts/language-context';

export function DashboardSidebar() {
  const { currentUser, currentOrg, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const initials = currentUser?.fullName
    ? currentUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const menuItems = [
    { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/dashboard/recipes', label: t.nav.recipes, icon: CookingPot },
    { href: '/dashboard/materials', label: t.nav.rawMaterials, icon: Carrot },
    { href: '/dashboard/settings', label: t.nav.settings, icon: Settings },
  ];

  return (
    <>
      <SidebarHeader>
        <Logo />
        {currentOrg && (
          <p className="px-2 text-xs text-muted-foreground truncate" title={currentOrg.name}>
            {currentOrg.name}
          </p>
        )}
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
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col text-sm overflow-hidden">
            <span className="font-semibold text-sidebar-foreground truncate">{currentUser?.fullName || 'User'}</span>
            <span className="text-muted-foreground truncate text-xs">{currentUser?.email}</span>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t.nav.logout} onClick={handleLogout}>
              <LogOut />
              <span>{t.nav.logout}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
