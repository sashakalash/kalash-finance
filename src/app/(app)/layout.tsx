import { TopLoader } from '@/components/layout/TopLoader';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { MobileNav } from '@/components/layout/MobileNav';

export default function AppLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <>
      <TopLoader />
      <div className="flex h-screen overflow-hidden pt-[env(safe-area-inset-top)] landscape:max-lg:pl-10 lg:pt-0">
        <DesktopSidebar />

        <main className="flex min-h-0 flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] landscape:pb-0 lg:pb-0">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">{children}</div>
        </main>

        <MobileNav />
      </div>
    </>
  );
}
