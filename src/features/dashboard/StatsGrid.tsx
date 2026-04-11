import { TrendingDown, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { DashboardStats } from '@/types';

interface StatsGridProps {
  stats: DashboardStats;
  topCategory: string | null;
}

export function StatsGrid({ stats }: StatsGridProps): React.ReactElement {
  const items = [
    {
      label: 'Total spent',
      value: formatCurrency(stats.totalSpent, stats.currency),
      icon: TrendingDown,
      color: 'text-red-500',
    },
    {
      label: 'Total income',
      value: formatCurrency(stats.totalIncome, stats.currency),
      icon: TrendingUp,
      color: 'text-green-500',
    },
    {
      label: 'Avg daily spend',
      value: formatCurrency(stats.avgDailySpend, stats.currency),
      icon: Activity,
      color: 'text-blue-500',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ label, value, icon, color }) => {
        const StatIcon = icon;
        return (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <StatIcon size={16} className={color} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
