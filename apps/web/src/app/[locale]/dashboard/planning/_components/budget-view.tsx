"use client";

import { useQuery } from "@tanstack/react-query";
import { Banknote, PieChartIcon, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
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
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

const DOMAIN_COLORS: Record<string, string> = {
  PROSES_BISNIS: "#3b82f6",
  DATA: "#10b981",
  LAYANAN: "#8b5cf6",
  APLIKASI: "#f59e0b",
  INFRASTRUKTUR: "#ef4444",
  KEAMANAN: "#ec4899",
};

const DOMAIN_LABELS: Record<string, string> = {
  PROSES_BISNIS: "Proses Bisnis",
  DATA: "Data",
  LAYANAN: "Layanan",
  APLIKASI: "Aplikasi",
  INFRASTRUKTUR: "Infrastruktur",
  KEAMANAN: "Keamanan",
};

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(0)}Jt`;
  }
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export function BudgetView() {
  const { data, isLoading } = useQuery(
    trpc.planning.getBudgetSummary.queryOptions({})
  );

  const { data: stats } = useQuery(trpc.planning.getStats.queryOptions());

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-[350px]" />
          <Skeleton className="h-[350px]" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">Gagal memuat data anggaran</p>
        </CardContent>
      </Card>
    );
  }

  const yearChartData = data.byYear.map((item) => ({
    name: item.year.toString(),
    Anggaran: item.budget,
    Inisiatif: item.count,
  }));

  const domainChartData = data.byDomain.map((item) => ({
    name: DOMAIN_LABELS[item.domain] ?? item.domain,
    value: item.budget,
    count: item.count,
    domain: item.domain,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total Anggaran
            </CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {formatCurrency(data.totalBudget)}
            </div>
            <p className="text-muted-foreground text-xs">
              Akumulasi seluruh inisiatif SPBE
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Anggaran Tahun Ini
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {formatCurrency(stats?.currentYear.budget ?? 0)}
            </div>
            <p className="text-muted-foreground text-xs">
              {stats?.currentYear.count ?? 0} inisiatif di tahun{" "}
              {stats?.currentYear.year}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Tingkat Realisasi
            </CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {stats?.completionRate ?? 0}%
            </div>
            <p className="text-muted-foreground text-xs">
              {stats?.byStatus.completed ?? 0} dari {stats?.byStatus.total ?? 0}{" "}
              selesai
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget by Year */}
        <Card>
          <CardHeader>
            <CardTitle>Anggaran per Tahun</CardTitle>
            <CardDescription>
              Distribusi anggaran SPBE berdasarkan tahun perencanaan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer height={300} width="100%">
              <BarChart data={yearChartData}>
                <CartesianGrid className="stroke-muted" strokeDasharray="3 3" />
                <XAxis
                  className="text-muted-foreground"
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  className="text-muted-foreground"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                  labelFormatter={(label) => `Tahun ${label}`}
                />
                <Legend />
                <Bar dataKey="Anggaran" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Budget by Domain */}
        <Card>
          <CardHeader>
            <CardTitle>Anggaran per Domain</CardTitle>
            <CardDescription>
              Distribusi anggaran berdasarkan 6 domain arsitektur SPBE
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer height={300} width="100%">
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  data={domainChartData}
                  dataKey="value"
                  fill="#8884d8"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                  outerRadius={100}
                >
                  {domainChartData.map((entry) => (
                    <Cell
                      fill={DOMAIN_COLORS[entry.domain] ?? "#94a3b8"}
                      key={`cell-${entry.domain}`}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Status Inisiatif</CardTitle>
            <CardDescription>
              Ringkasan status seluruh inisiatif SPBE
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <StatusCard
                color="bg-slate-500"
                count={stats.byStatus.planned}
                label="Direncanakan"
              />
              <StatusCard
                color="bg-blue-500"
                count={stats.byStatus.budgeted}
                label="Dianggarkan"
              />
              <StatusCard
                color="bg-amber-500"
                count={stats.byStatus.ongoing}
                label="Berjalan"
              />
              <StatusCard
                color="bg-green-500"
                count={stats.byStatus.completed}
                label="Selesai"
              />
              <StatusCard
                color="bg-red-500"
                count={stats.byStatus.delayed}
                label="Tertunda"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface StatusCardProps {
  label: string;
  count: number;
  color: string;
}

function StatusCard({ label, count, color }: StatusCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${color}`} />
        <span className="text-muted-foreground text-sm">{label}</span>
      </div>
      <p className="mt-2 font-bold text-2xl">{count}</p>
    </div>
  );
}
