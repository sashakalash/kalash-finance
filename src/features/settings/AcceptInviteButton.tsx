'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { acceptHouseholdInvite } from './actions';

export function AcceptInviteButton({ code }: { code: string }): React.ReactElement {
  const [loading, setLoading] = useState(false);

  async function handleAccept(): Promise<void> {
    setLoading(true);
    try {
      await acceptHouseholdInvite(code);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to join household');
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleAccept} disabled={loading} className="w-full">
      {loading ? 'Joining…' : 'Accept invitation'}
    </Button>
  );
}
