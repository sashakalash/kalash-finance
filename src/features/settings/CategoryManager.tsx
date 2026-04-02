'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { createCategory, deleteCategory } from './actions';
import type { Category } from '@/types';

interface CategoryManagerProps {
  categories: Category[];
}

const PRESET_COLORS = [
  '#ef4444',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#10b981',
  '#22c55e',
  '#f97316',
  '#3b82f6',
  '#6b7280',
];

export function CategoryManager({ categories }: CategoryManagerProps): React.ReactElement {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(): Promise<void> {
    if (!name.trim()) return;
    setAdding(true);
    try {
      await createCategory({ name: name.trim(), icon, color });
      setName('');
      toast.success(`Category "${name}" added`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add category');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string, catName: string): Promise<void> {
    setDeletingId(id);
    try {
      await deleteCategory(id);
      toast.success(`"${catName}" deleted`);
    } catch {
      toast.error('Failed to delete category');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-1.5 rounded-full border py-1 pl-2.5 pr-1"
              style={{ borderColor: cat.color ?? '#6b7280' }}
            >
              <span className="text-sm">{cat.icon}</span>
              <span className="text-sm font-medium" style={{ color: cat.color ?? undefined }}>
                {cat.name}
              </span>
              {!cat.is_default && (
                <button
                  type="button"
                  aria-label={`Delete ${cat.name}`}
                  onClick={() => handleDelete(cat.id, cat.name)}
                  disabled={deletingId === cat.id}
                  className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 size={11} />
                </button>
              )}
              {cat.is_default && (
                <Badge variant="outline" className="ml-0.5 h-4 px-1 text-[10px]">
                  default
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* Add new */}
        <div className="flex items-end gap-2">
          <div className="space-y-1.5">
            <label htmlFor="cat-icon" className="text-xs font-medium text-muted-foreground">
              Icon
            </label>
            <Input
              id="cat-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-14 text-center text-base"
              maxLength={2}
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <label htmlFor="cat-name" className="text-xs font-medium text-muted-foreground">
              Name
            </label>
            <Input
              id="cat-name"
              placeholder="e.g. Gym"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
              maxLength={50}
            />
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={adding || !name.trim()}
            className="gap-1"
          >
            <Plus size={13} />
            Add
          </Button>
        </div>

        {/* Color picker */}
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Select color ${c}`}
              onClick={() => setColor(c)}
              className="h-6 w-6 rounded-full ring-offset-background transition-all hover:scale-110"
              style={{
                backgroundColor: c,
                outline: color === c ? `2px solid ${c}` : 'none',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
