
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Home, CalendarDays, PlusCircle, Search, UserCircle2 } from 'lucide-react'; // Added UserCircle2
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { Separator } from '@/components/ui/separator';

const desktopNavItems = [
  { href: '/', label: 'Visão Diária', icon: Home },
  { href: '/monthly-view', label: 'Visão Mensal', icon: CalendarDays },
  { href: '/actions/new', label: 'Adicionar Evento', icon: PlusCircle },
  { href: '/filters', label: 'Busca Avançada', icon: Search },
];

const mobileUserMenuItems = [
  { href: '/profile/edit', label: 'Editar Perfil', icon: UserCircle2 },
  // Future items like "Sair" (Logout) could be added here.
];

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">

        {/* Left Section: Mobile Hamburger */}
        <div className="flex items-center">
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs sm:max-w-sm p-0 flex flex-col">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between p-4 border-b">
                   <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                      <Logo className="h-8 w-auto" />
                   </Link>
                </div>
                <nav className="flex flex-col space-y-1 p-4 flex-1 overflow-y-auto">
                  {/* Display mobile-specific user menu items */}
                  {mobileUserMenuItems.map((item) => (
                    <SheetClose key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                          pathname === item.href
                            ? 'bg-accent text-accent-foreground font-semibold'
                            : 'text-foreground hover:bg-accent/80'
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span className="flex-grow">{item.label}</span>
                      </Link>
                    </SheetClose>
                  ))}
                  {/* Optionally, if main navigation items are still desired in mobile, they can be added here */}
                  {/* For example, uncomment the block below to include main navigation in mobile: */}
                  {/*
                  <Separator className="my-2" />
                  {desktopNavItems.map((item) => (
                    <SheetClose key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                          pathname === item.href
                            ? 'bg-accent text-accent-foreground font-semibold'
                            : 'text-foreground hover:bg-accent/80'
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span className="flex-grow">{item.label}</span>
                      </Link>
                    </SheetClose>
                  ))}
                  */}
                </nav>
                {/* Theme Toggle inside mobile menu footer */}
                <div className="p-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tema</span>
                    <ThemeToggle />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Center Section: Logo - takes up remaining space and centers logo */}
        <div className="flex-1 flex justify-center md:justify-center"> {/* Keep md:justify-center to allow logo to center on desktop */}
          <Link href="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
            <Logo className="h-10 sm:h-12 md:h-14 w-auto" />
          </Link>
        </div>

        {/* Right Section: Desktop Nav & Theme Toggle / Mobile Placeholder */}
        <div className="flex items-center">
          {/* Desktop Navigation & Theme Toggle */}
          <div className="hidden md:flex items-center space-x-2">
            <nav className="flex items-center space-x-1 lg:space-x-2">
              {desktopNavItems.map((item) => (
                <Button
                  key={item.href}
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  asChild
                  className="text-sm font-medium px-3 py-2"
                >
                  <Link href={item.href}>
                    {item.label}
                  </Link>
                </Button>
              ))}
            </nav>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <ThemeToggle /> {/* Desktop Theme Toggle */}
          </div>
          
          {/* Placeholder for mobile right side to balance hamburger, ensuring logo stays centered */}
          <div className="md:hidden w-10 h-10"></div>
        </div>

      </div>
    </header>
  );
}
