'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, CreditCard, Upload, Settings, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/import', label: 'Import', icon: Upload },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function MobileNav(): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut(): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      router.push('/auth/login');
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
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
      <button
        onClick={handleSignOut}
        className="flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <LogOut size={20} />
        Sign out
      </button>
    </nav>
  );
}
