'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { useAuth } from '@/lib/auth-context';

const navigation = [
  { name: 'Dashboard', href: '/', icon: 'bx-layout' as const },
  { name: 'Rooms', href: '/rooms', icon: 'bx-bed' as const },
  { name: 'Bookings', href: '/bookings', icon: 'bx-calendar-check' as const },
  { name: 'Guests', href: '/guests', icon: 'bx-group' as const },
  { name: 'Check-in/out', href: '/checkin-out', icon: 'bx-log-in' as const },
  { name: 'Payments', href: '/payments', icon: 'bx-credit-card' as const },
  { name: 'Services', href: '/services', icon: 'bx-coffee' as const },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar flex items-center justify-between px-4 border-b border-white/10">
        <button onClick={() => setMobileOpen(true)} className="text-sidebar-foreground/70 hover:text-white transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <Icon name="bx-menu" className="text-2xl" />
        </button>
            <span className="font-logo text-2xl tracking-wide text-white">HotelPMS</span>
        <Icon name="bx-bell" className="text-lg text-sidebar-foreground/50" />
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[260px] bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center h-14 px-5 border-b border-white/10">
          <div className="flex-1">
        <span className="font-logo text-2xl tracking-wide text-white">HotelPMS</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden ml-auto text-sidebar-foreground/50 hover:text-white transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Icon name="bx-x" className="text-xl" />
          </button>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-md text-[13px] font-medium transition-all duration-150",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                )}
              >
                <Icon name={item.icon} className={cn("text-lg", isActive ? "text-white" : "text-white/40")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2.5 mb-2.5 px-1">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white/80">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white/90 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-white/40 truncate uppercase tracking-wider">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2.5 min-h-[44px] text-xs text-white/40 hover:text-white/70 hover:bg-white/5 rounded-md transition-colors"
          >
            <Icon name="bx-log-out" className="text-base" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
