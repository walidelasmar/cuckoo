'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

interface ChartData {
    name: string;
    cost: number;
}

interface CostBreakdownChartProps {
    data: ChartData[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c', '#d0ed57', '#ffc658', '#8dd1e1', '#83a6ed', '#8e4585'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function CostBreakdownChart({ data }: CostBreakdownChartProps) {
    if (!data || data.length === 0 || data.every(d => d.cost <= 0)) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border rounded-lg mt-2">
                <p className="text-sm text-muted-foreground">Add ingredients and costs to see the breakdown.</p>
            </div>
        );
    }
    
  return (
    <ResponsiveContainer width="100%" height={250} className="mt-2">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="cost"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
            formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
        />
        <Legend wrapperStyle={{fontSize: "0.8rem"}}/>
      </PieChart>
    </ResponsiveContainer>
  );
}
