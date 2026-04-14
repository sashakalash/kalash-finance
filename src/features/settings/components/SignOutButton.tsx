'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export function SignOutButton(): React.ReactElement {
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
    <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-1.5">
      <LogOut size={14} />
      Sign out
    </Button>
  );
}
