"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface Props {
  likes: number;
  saves: number;
  comments: number;
  rate: number;
}

const COLORS = ["#c4704b", "#22c55e", "#3b82f6"];

export function MetricsChartEngagement({ likes, saves, comments, rate }: Props) {
  const chartData = [
    { name: "Likes", value: likes },
    { name: "Guardados", value: saves },
    { name: "Comentarios", value: comments },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-semibold text-foreground">Engagement</span>
        <span className="text-xs font-bold text-foreground">{rate.toFixed(1)}%</span>
      </div>
      <div className="flex gap-5 items-center">
        <ResponsiveContainer width={90} height={90}>
          <PieChart>
            <Pie data={chartData} innerRadius={25} outerRadius={42} dataKey="value" stroke="none">
              {chartData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2">
          {chartData.map((item, i) => (
            <div key={item.name} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded" style={{ background: COLORS[i] }} />
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-bold text-foreground ml-auto">{(item.value / 1000).toFixed(1)}K</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
