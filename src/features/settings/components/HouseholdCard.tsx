'use client';

import { useState } from 'react';
import { Copy, Check, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { generateHouseholdInvite } from '../actions';
import type { Household, HouseholdMember } from '@/types';

interface HouseholdCardProps {
  household: Household;
  members: HouseholdMember[];
  currentUserId: string;
  isOwner: boolean;
}

export function HouseholdCard({
  household,
  members,
  currentUserId,
  isOwner,
}: HouseholdCardProps): React.ReactElement {
  const [inviteCode, setInviteCode] = useState<string | null>(
    household.invite_code && household.invite_expires_at
      ? new Date(household.invite_expires_at) > new Date()
        ? household.invite_code
        : null
      : null,
  );
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const inviteUrl = inviteCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${inviteCode}`
    : null;

  async function handleGenerate(): Promise<void> {
    setLoading(true);
    try {
      const code = await generateHouseholdInvite();
      setInviteCode(code);
      toast.success('Invite link generated (valid 72 hours)');
    } catch {
      toast.error('Failed to generate invite');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(): Promise<void> {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Users size={16} className="text-muted-foreground" />
        <h2 className="font-medium">Household</h2>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Members</p>
        <ul className="space-y-1">
          {members.map((m) => (
            <li key={m.user_id} className="flex items-center justify-between text-sm">
              <span>
                {m.email || 'Unknown'}
                {m.user_id === currentUserId && (
                  <span className="ml-1 text-muted-foreground">(you)</span>
                )}
              </span>
              <span className="text-xs text-muted-foreground capitalize">{m.role}</span>
            </li>
          ))}
        </ul>
      </div>

      {isOwner && (
        <div className="space-y-2 pt-2 border-t">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Invite member</p>
          {inviteUrl ? (
            <div className="flex gap-2">
              <input
                readOnly
                value={inviteUrl}
                className="flex-1 rounded-md border bg-muted px-3 py-1.5 text-xs font-mono truncate"
              />
              <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={loading}
                className="shrink-0"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating…' : 'Generate invite link'}
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Valid for 72 hours. Share with your partner.
          </p>
        </div>
      )}
    </div>
  );
}
