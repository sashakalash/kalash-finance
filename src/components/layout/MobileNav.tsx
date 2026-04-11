'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, CreditCard, Upload, Settings, LogOut, Menu, X } from 'lucide-react';
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

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
    <>
      {/* Drawer overlay */}
      {drawerOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-50 w-full cursor-default bg-black/40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer sidebar */}
      <aside
        className={cn(
          'relative fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r bg-card px-3 py-4 transition-transform duration-200 lg:hidden',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Close button — landscape only, top-right corner of aside */}
        <button
          onClick={() => setDrawerOpen(false)}
          aria-label="Close navigation"
          className="portrait:hidden landscape:flex absolute right-3 top-3 text-muted-foreground"
          style={{ marginTop: 'env(safe-area-inset-top)' }}
        >
          <X size={20} />
        </button>

        <div className="mb-6 flex items-center justify-between px-3">
          <span className="flex items-center text-lg font-bold tracking-tight">
            <img src="/kalash-logo-black.png" alt="Kalash" className="h-16" />
            Finance
          </span>
          {/* Close button — portrait only, inside header row */}
          <button
            onClick={() => setDrawerOpen(false)}
            className="landscape:hidden text-muted-foreground"
          >
            <X size={20} />
          </button>
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

      {/* Thin strip — landscape only, left edge */}
      {!drawerOpen && (
        <aside
          className="portrait:hidden fixed top-0 left-2.5 z-40 flex h-full w-10 flex-col items-center border-r bg-card pt-4 lg:hidden"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
        </aside>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t bg-card pb-[env(safe-area-inset-bottom)] landscape:hidden lg:hidden">
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
    </>
  );
}
