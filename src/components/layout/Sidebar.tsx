'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
// nav
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

export function Sidebar(): React.ReactElement {
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
    <aside className="flex h-full w-60 flex-col border-r bg-card px-3 py-4">
      <div className="mb-6 px-3">
        <span
          className="text-lg font-bold tracking-tight"
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <img src="/kalash-logo-black.png" alt="Kalash" className="h-[7rem]" />
          Finance
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const NavIcon = icon;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <NavIcon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleSignOut}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </aside>
  );
}
