'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, CreditCard, Upload, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/(protected)/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/(protected)/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/(protected)/import', label: 'Import', icon: Upload },
  { href: '/(protected)/settings', label: 'Settings', icon: Settings },
];

export function MobileNav(): React.ReactElement {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-card md:hidden">
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const NavIcon = icon;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors',
              pathname === href ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <NavIcon size={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
