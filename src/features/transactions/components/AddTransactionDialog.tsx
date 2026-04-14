'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TransactionForm } from './TransactionForm';
import type { Category } from '@/types';

interface AddTransactionDialogProps {
  categories: Category[];
}

/** Client wrapper so the dialog can manage open state and close on success. */
export function AddTransactionDialog({
  categories,
}: AddTransactionDialogProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleSuccess(): void {
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus size={14} className="mr-1" />
        Add
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New transaction</DialogTitle>
        </DialogHeader>
        <TransactionForm categories={categories} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
