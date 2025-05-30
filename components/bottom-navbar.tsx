
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, CalendarDays, PlusCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button'; // Using Button for consistent styling if needed, or just Link

const navItems = [
  { href: '/', label: 'Diária', icon: Home },
  { href: '/filters', label: 'Busca', icon: Search },
  { href: '/monthly-view', label: 'Mensal', icon: CalendarDays },
  { href: '/actions/new', label: 'Adicionar', icon: PlusCircle },
  // { href: '/settings', label: 'Ajustes', icon: Settings }, // Example for settings, if needed
];

export function BottomNavbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="container mx-auto flex h-16 max-w-md items-center justify-around px-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center space-y-1 p-2 rounded-md transition-colors w-1/4', // Distribute width
              pathname === item.href
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-primary hover:bg-accent/50'
            )}
            aria-current={pathname === item.href ? 'page' : undefined}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

