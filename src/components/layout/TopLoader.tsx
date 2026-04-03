'use client';

import { useTheme } from 'next-themes';
import NextTopLoader from 'nextjs-toploader';

/** Wraps NextTopLoader so it can read the resolved theme and pick a visible color. */
export function TopLoader(): React.ReactElement {
  const { resolvedTheme } = useTheme();
  const color = resolvedTheme === 'dark' ? '#e4e4e7' : '#18181b';
  return <NextTopLoader color={color} showSpinner={false} height={2} />;
}
