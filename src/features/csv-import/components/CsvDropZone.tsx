'use client';

import { useRef, useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CsvDropZoneProps {
  onFile: (file: File) => void;
  loading?: boolean;
}

export function CsvDropZone({ onFile, loading }: CsvDropZoneProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      toast.error('Only .xlsx and .xls files are supported');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10 MB)');
      return;
    }
    onFile(file);
  }

  function handleDrop(e: React.DragEvent): void {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset so same file can be re-selected
    e.target.value = '';
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 transition-colors',
        dragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/30',
        loading && 'pointer-events-none opacity-60',
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div className="rounded-full bg-muted p-4">
        {dragging ? (
          <Upload size={28} className="text-primary" />
        ) : (
          <FileSpreadsheet size={28} className="text-muted-foreground" />
        )}
      </div>

      <div className="space-y-1 text-center">
        <p className="text-sm font-medium">
          {dragging ? 'Drop it!' : 'Drag & drop your bank statement'}
        </p>
        <p className="text-xs text-muted-foreground">BoG Bank · .xlsx / .xls · max 10 MB</p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        Browse file
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
