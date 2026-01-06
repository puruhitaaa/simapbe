"use client";

import { Award, BarChart3, Target, TrendingUp } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// SPBE Index Gauge Widget
interface SpbeIndexGaugeProps {
  value: number; // 0-5 scale
  maxValue?: number;
  title?: string;
  description?: string;
}

export function SpbeIndexGauge({
  value,
  maxValue = 5,
  title = "Indeks SPBE",
  description = "Nilai indeks SPBE Kota Bandung",
}: SpbeIndexGaugeProps) {
  const { resolvedTheme } = useTheme();
  const [emptyColor, setEmptyColor] = useState("#e2e8f0");

  useEffect(() => {
    setEmptyColor(resolvedTheme === "dark" ? "#334155" : "#e2e8f0");
  }, [resolvedTheme]);

  const percentage = (value / maxValue) * 100;

  const getColor = (val: number) => {
    if (val >= 4) return "#10b981"; // Green - Sangat Baik
    if (val >= 3) return "#3b82f6"; // Blue - Baik
    if (val >= 2) return "#f59e0b"; // Yellow - Cukup
    return "#ef4444"; // Red - Kurang
  };

  const getLabel = (val: number) => {
    if (val >= 4) return "Sangat Baik";
    if (val >= 3) return "Baik";
    if (val >= 2) return "Cukup";
    return "Kurang";
  };

  const data = [
    { name: "Score", value: percentage, fill: getColor(value) },
    { name: "Remaining", value: 100 - percentage, fill: emptyColor },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="h-4 w-4" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-[180px]">
          <ResponsiveContainer height={180} width="100%">
            <PieChart>
              <Pie
                cx="50%"
                cy="70%"
                data={data}
                dataKey="value"
                endAngle={0}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={0}
                startAngle={180}
              >
                {data.map((entry, index) => (
                  <Cell fill={entry.fill} key={`cell-${index}`} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
            <span
              className="font-bold text-3xl"
              style={{ color: getColor(value) }}
            >
              {value.toFixed(2)}
            </span>
            <span className="text-muted-foreground text-xs">
              dari {maxValue.toFixed(1)}
            </span>
            <span
              className="mt-1 rounded-full px-2 py-0.5 font-medium text-xs"
              style={{
                backgroundColor: `${getColor(value)}20`,
                color: getColor(value),
              }}
            >
              {getLabel(value)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Maturity Level Widget
interface MaturityLevel {
  domain: string;
  level: number;
  maxLevel?: number;
}

interface MaturityLevelChartProps {
  data: MaturityLevel[];
  title?: string;
  description?: string;
}

const MATURITY_COLORS = [
  "#ef4444", // Level 1 - Rintisan
  "#f59e0b", // Level 2 - Terkelola
  "#3b82f6", // Level 3 - Terstandardisasi
  "#10b981", // Level 4 - Terintegrasi
  "#8b5cf6", // Level 5 - Optimum
];

export function MaturityLevelChart({
  data,
  title = "Tingkat Kematangan SPBE",
  description = "Per domain arsitektur",
}: MaturityLevelChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    fill: MATURITY_COLORS[Math.min(item.level - 1, 4)] ?? "#94a3b8",
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer height={200} width="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid className="stroke-muted" strokeDasharray="3 3" />
              <XAxis domain={[0, 5]} tick={{ fontSize: 12 }} type="number" />
              <YAxis
                dataKey="domain"
                interval={0}
                tick={{ fontSize: 10 }}
                type="category"
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value) => [`Level ${value}`, "Kematangan"]}
              />
              <Bar dataKey="level" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell fill={entry.fill} key={`cell-${index}`} />
                ))}
                <LabelList
                  className="fill-foreground"
                  dataKey="level"
                  fontSize={10}
                  position="right"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {[
            "Rintisan",
            "Terkelola",
            "Terstandardisasi",
            "Terintegrasi",
            "Optimum",
          ].map((label, index) => (
            <div className="flex items-center gap-1.5" key={label}>
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: MATURITY_COLORS[index] }}
              />
              <span className="text-muted-foreground text-xs">
                L{index + 1}: {label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Domain Progress Widget
interface DomainProgress {
  domain: string;
  current: number;
  target: number;
}

interface DomainProgressWidgetProps {
  data: DomainProgress[];
  title?: string;
  description?: string;
}

export function DomainProgressWidget({
  data,
  title = "Progress Implementasi",
  description = "Pencapaian vs Target per domain",
}: DomainProgressWidgetProps) {
  const { resolvedTheme } = useTheme();
  const [emptyColor, setEmptyColor] = useState("#e2e8f0");

  useEffect(() => {
    setEmptyColor(resolvedTheme === "dark" ? "#334155" : "#e2e8f0");
  }, [resolvedTheme]);

  const chartData = data.map((item) => ({
    name: item.domain,
    Realisasi: item.current,
    Target: item.target,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer height={200} width="100%">
            <BarChart data={chartData}>
              <CartesianGrid className="stroke-muted" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Bar dataKey="Realisasi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Target" fill={emptyColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Completion Rate Radial
interface CompletionRateProps {
  completed: number;
  total: number;
  title?: string;
  description?: string;
}

export function CompletionRateWidget({
  completed,
  total,
  title = "Tingkat Penyelesaian",
  description = "Inisiatif SPBE yang selesai",
}: CompletionRateProps) {
  const { resolvedTheme } = useTheme();
  const [emptyColor, setEmptyColor] = useState("#e2e8f0");

  useEffect(() => {
    setEmptyColor(resolvedTheme === "dark" ? "#334155" : "#e2e8f0");
  }, [resolvedTheme]);

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const data = [
    {
      name: "Completed",
      value: percentage,
      fill:
        percentage >= 75 ? "#10b981" : percentage >= 50 ? "#3b82f6" : "#f59e0b",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-[180px]">
          <ResponsiveContainer height={180} width="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              data={data}
              endAngle={-270}
              innerRadius="60%"
              outerRadius="80%"
              startAngle={90}
            >
              <RadialBar
                background={{ fill: emptyColor }}
                cornerRadius={10}
                dataKey="value"
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-bold text-3xl">{percentage}%</span>
            <span className="text-muted-foreground text-sm">
              {completed} / {total}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
