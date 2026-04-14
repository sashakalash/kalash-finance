'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { acceptHouseholdInvite } from '../actions';

export function AcceptInviteButton({ code }: { code: string }): React.ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAccept(): Promise<void> {
    setLoading(true);
    const result = await acceptHouseholdInvite(code);
    if (result.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <Button onClick={handleAccept} disabled={loading} className="w-full">
      {loading ? 'Joining...' : 'Accept invitation'}
    </Button>
  );
}
