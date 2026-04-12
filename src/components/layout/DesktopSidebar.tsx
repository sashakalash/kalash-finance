'use client';

import { useState } from 'react';
import { PanelLeft } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function DesktopSidebar(): React.ReactElement {
  const [visible, setVisible] = useState(true);

  return (
    <div className="hidden lg:flex relative">
      {/* Expanded sidebar */}
      <div
        className="overflow-hidden transition-[width] duration-300 ease-in-out"
        style={{ width: visible ? '15rem' : '0' }}
      >
        <div className="w-60 h-full">
          <Sidebar onToggle={() => setVisible(false)} />
        </div>
      </div>

      {/* Collapsed strip */}
      <div
        className="flex h-full flex-col items-center border-r bg-card pt-4 overflow-hidden transition-[width,opacity] duration-300 ease-in-out"
        style={{
          width: visible ? '0' : '2.5rem',
          opacity: visible ? 0 : 1,
        }}
      >
        <button
          onClick={() => setVisible(true)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          title="Show sidebar"
        >
          <PanelLeft size={16} />
        </button>
      </div>
    </div>
  );
}
