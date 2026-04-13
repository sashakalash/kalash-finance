'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export interface DateRangeProps {
  from: string;
  to: string;
}

export function DateRangePicker({ from, to }: DateRangeProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: 'from' | 'to', value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex items-center gap-2 text-sm">
      <input
        type="date"
        value={from}
        max={to}
        onChange={(e) => update('from', e.target.value)}
        className="rounded-md border bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <span className="text-muted-foreground">—</span>
      <input
        type="date"
        value={to}
        min={from}
        onChange={(e) => update('to', e.target.value)}
        className="rounded-md border bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
