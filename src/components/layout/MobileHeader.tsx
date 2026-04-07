'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface MobileHeaderProps {
  email: string;
}

export function MobileHeader({ email }: MobileHeaderProps): React.ReactElement {
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
    <header className="flex items-center justify-between border-b bg-card px-4 py-2 md:hidden">
      <span className="text-xs text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{email}</span>
      </span>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="Sign out"
      >
        <LogOut size={13} />
        Sign out
      </button>
    </header>
  );
}
