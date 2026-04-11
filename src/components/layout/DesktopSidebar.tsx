'use client';

import { useState } from 'react';
import { PanelLeft } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function DesktopSidebar(): React.ReactElement {
  const [visible, setVisible] = useState(true);

  return (
    <div className="hidden lg:flex relative">
      {visible ? (
        <Sidebar onToggle={() => setVisible(false)} />
      ) : (
        <div className="flex h-full w-10 flex-col items-center border-r bg-card pt-4">
          <button
            onClick={() => setVisible(true)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            title="Show sidebar"
          >
            <PanelLeft size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
