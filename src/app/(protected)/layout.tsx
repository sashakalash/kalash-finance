import { redirect } from 'next/navigation';
import { TopLoader } from '@/components/layout/TopLoader';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  return (
    <>
      <TopLoader />
      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Main content */}
        <main className="flex flex-1 flex-col overflow-y-auto pb-16 md:pb-0">
          <div className="flex-1 p-4 md:p-6">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
    </>
  );
}
