'use client';

import { useState } from 'react';
import { Copy, Check, Unlink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generateTelegramLinkCode, unlinkTelegram } from '../actions';

interface TelegramLinkCardProps {
  isLinked: boolean;
  telegramUsername: string | null;
}

export function TelegramLinkCard({
  isLinked,
  telegramUsername,
}: TelegramLinkCardProps): React.ReactElement {
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleGenerate(): Promise<void> {
    setLoading(true);
    try {
      const newCode = await generateTelegramLinkCode();
      setCode(newCode);
    } catch {
      toast.error('Failed to generate code');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(): Promise<void> {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleUnlink(): Promise<void> {
    setLoading(true);
    try {
      await unlinkTelegram();
      toast.success('Telegram unlinked');
      setCode(null);
    } catch {
      toast.error('Failed to unlink');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Telegram Bot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLinked ? (
          <>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1 text-green-600">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Connected
              </Badge>
              {telegramUsername && (
                <span className="text-sm text-muted-foreground">@{telegramUsername}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Send a receipt photo or type <code className="rounded bg-muted px-1">25 coffee</code>{' '}
              to your bot to add transactions instantly.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnlink}
              disabled={loading}
              className="gap-1.5"
            >
              <Unlink size={13} />
              Unlink Telegram
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Link your Telegram account to add transactions by sending receipts or quick text
              messages.
            </p>

            {code ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  Send this code to your bot (expires in 10 min):
                </p>
                <div className="flex items-center gap-2">
                  <code className="rounded-md border bg-muted px-4 py-2 text-xl font-bold tracking-widest">
                    {code}
                  </code>
                  <Button variant="outline" size="icon" onClick={handleCopy} className="h-9 w-9">
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="gap-1.5 text-muted-foreground"
                >
                  <RefreshCw size={13} />
                  Regenerate
                </Button>
              </div>
            ) : (
              <Button onClick={handleGenerate} disabled={loading} size="sm">
                {loading ? 'Generating…' : 'Generate link code'}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
