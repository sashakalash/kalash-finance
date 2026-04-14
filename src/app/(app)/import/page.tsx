import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getHouseholdId } from '@/lib/supabase/household';
import { ImportWizard } from '@/features/csv-import/components/ImportWizard';
import type { Category } from '@/types';

export const metadata: Metadata = { title: 'Import — Kalash Finance' };

export default async function ImportPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const householdId = await getHouseholdId(supabase, user.id);

  const { data: catData } = await supabase
    .from('categories')
    .select('*')
    .eq('household_id', householdId)
    .order('name');

  const categories = (catData ?? []) as Category[];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Import</h1>
        <p className="text-sm text-muted-foreground">
          Upload your BoG Bank statement (.xlsx) to import transactions.
        </p>
      </div>

      <div className="max-w-3xl">
        <ImportWizard householdId={householdId} categories={categories} />
      </div>
    </div>
  );
}
