"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Database,
  FileText,
  LayoutDashboard,
  Lock,
  Network,
  Server,
  TrendingUp,
} from "lucide-react";
import { ArchitectureGraph } from "@/components/architecture-graph";
import {
  CompletionRateWidget,
  MaturityLevelChart,
  SpbeIndexGauge,
} from "@/components/spbe-widgets";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/utils/trpc";

const domainCards = [
  {
    title: "Proses Bisnis",
    description: "Arsitektur proses bisnis pemerintahan",
    icon: FileText,
    href: "/dashboard/probis",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Data & Informasi",
    description: "Standar data Satu Data Indonesia",
    icon: Database,
    href: "/dashboard/data",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    title: "Aplikasi",
    description: "Inventaris aplikasi OPD",
    icon: LayoutDashboard,
    href: "/dashboard/aplikasi",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    title: "Infrastruktur",
    description: "Aset infrastruktur TIK",
    icon: Server,
    href: "/dashboard/infrastruktur",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    title: "Layanan",
    description: "Katalog layanan publik",
    icon: Network,
    href: "/dashboard/layanan",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    title: "Keamanan",
    description: "Audit keamanan & risiko",
    icon: Lock,
    href: "/dashboard/keamanan",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
];

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: { value: number; label: string };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="font-bold text-2xl">{value}</div>
        <p className="text-muted-foreground text-xs">{description}</p>
        {trend && (
          <div className="mt-2 flex items-center text-green-500 text-xs">
            <TrendingUp className="mr-1 h-3 w-3" />+{trend.value}% {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DomainCard({
  title,
  description,
  icon: Icon,
  href,
  color,
  bgColor,
  count,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bgColor: string;
  count?: number;
}) {
  return (
    <a href={href}>
      <Card className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-md">
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <div className={`rounded-lg p-2 ${bgColor}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base transition-colors group-hover:text-primary">
              {title}
            </CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          {count !== undefined && (
            <Badge className="ml-auto" variant="secondary">
              {count}
            </Badge>
          )}
        </CardHeader>
      </Card>
    </a>
  );
}

export function DashboardOverview() {
  // Fetch statistics - these will be implemented when we have the API ready
  // Note: For now we fetch a list and count items. A dedicated count endpoint could be added later.
  const opdCount = useQuery({
    ...trpc.opd.list.queryOptions({ limit: 100 }),
    select: (data) => data.items.length,
  });

  const planningStats = useQuery(trpc.planning.getStats.queryOptions());

  // Sample maturity data - in production this would come from an API
  const maturityData = [
    { domain: "Proses Bisnis", level: 3 },
    { domain: "Data", level: 4 },
    { domain: "Layanan", level: 3 },
    { domain: "Aplikasi", level: 4 },
    { domain: "Infrastruktur", level: 3 },
    { domain: "Keamanan", level: 2 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Beranda</h1>
        <p className="text-muted-foreground">
          Selamat datang di Sistem Manajemen Arsitektur SPBE Kota Bandung
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          description="Organisasi Perangkat Daerah"
          icon={Building2}
          title="Total OPD"
          value={opdCount.isLoading ? "..." : (opdCount.data ?? 0)}
        />
        <StatCard
          description="Dalam status produksi"
          icon={LayoutDashboard}
          title="Aplikasi Aktif"
          value="—"
        />
        <StatCard
          description="Layanan digital aktif"
          icon={Network}
          title="Layanan Publik"
          value="—"
        />
        <StatCard
          description="Keterpaduan arsitektur"
          icon={TrendingUp}
          title="Skor Integrasi"
          value="—"
        />
      </div>

      {/* Domain Cards */}
      <div>
        <h2 className="mb-4 font-semibold text-lg">Arsitektur SPBE</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {domainCards.map((domain) => (
            <DomainCard key={domain.title} {...domain} />
          ))}
        </div>
      </div>

      {/* Architecture Visualization */}
      <div>
        <h2 className="mb-4 font-semibold text-lg">Peta Arsitektur</h2>
        <Card>
          <CardHeader>
            <CardTitle>Keterpaduan 6 Domain SPBE</CardTitle>
            <CardDescription>
              Visualisasi hubungan antar domain arsitektur
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ArchitectureGraph height={350} showMiniMap={false} />
          </CardContent>
        </Card>
      </div>

      {/* SPBE Widgets */}
      <div>
        <h2 className="mb-4 font-semibold text-lg">Indikator SPBE</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SpbeIndexGauge
            description="Nilai indeks SPBE Kota Bandung 2025"
            value={3.45}
          />
          <CompletionRateWidget
            completed={planningStats.data?.byStatus.completed ?? 0}
            description="Inisiatif SPBE yang selesai tahun ini"
            total={planningStats.data?.byStatus.total ?? 0}
          />
          <MaturityLevelChart data={maturityData} />
        </div>
      </div>
    </div>
  );
}
