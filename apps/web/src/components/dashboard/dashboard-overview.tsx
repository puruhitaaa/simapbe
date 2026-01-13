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
import { useMemo } from "react";
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
import { useTRPC } from "@/utils/trpc";

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
  const trpc = useTRPC();

  // Fetch OPD stats
  const opdStats = useQuery(trpc.opd.getStats.queryOptions());

  // Fetch planning stats
  const planningStats = useQuery(trpc.planning.getStats.queryOptions());

  // Fetch application stats
  const appStats = useQuery(trpc.app.getStats.queryOptions());

  // Fetch service stats
  const serviceStats = useQuery(trpc.service.getStats.queryOptions());

  // Fetch integration status for integration score
  const integrationStatus = useQuery(
    trpc.service.getIntegrationStatus.queryOptions()
  );

  // Fetch gap analysis for maturity calculation
  const gapAnalysis = useQuery(trpc.planning.getGapAnalysis.queryOptions());

  // Calculate active applications count
  const activeAppsCount =
    appStats.data?.byStatus.find((s) => s.status === "ACTIVE")?.count ?? 0;

  // Calculate active services count
  const activeServicesCount = serviceStats.data?.active ?? 0;

  // Integration score percentage
  const integrationScore = integrationStatus.data?.integrationRate ?? 0;

  // Calculate SPBE Index based on available metrics (weighted average)
  const spbeIndex = useMemo(() => {
    if (!(gapAnalysis.data && integrationStatus.data)) {
      return 0;
    }

    const { currentState, gaps } = gapAnalysis.data;
    const total =
      currentState.applications +
      currentState.services +
      currentState.infrastructure;

    if (total === 0) {
      return 0;
    }

    // Score based on: integration rate + reduced gaps
    const gapPenalty =
      (gaps.appsWithoutService +
        gaps.servicesWithoutProbis +
        gaps.appsWithoutRecentAudit) /
      Math.max(total, 1);

    const baseScore = (integrationStatus.data.integrationRate / 100) * 5;
    const adjustedScore = Math.max(0, baseScore - gapPenalty);

    return Math.min(5, Math.max(0, adjustedScore));
  }, [gapAnalysis.data, integrationStatus.data]);

  // Calculate maturity levels based on real data
  const maturityData = useMemo(() => {
    if (!gapAnalysis.data) {
      return [
        { domain: "Proses Bisnis", level: 1 },
        { domain: "Data", level: 1 },
        { domain: "Layanan", level: 1 },
        { domain: "Aplikasi", level: 1 },
        { domain: "Infrastruktur", level: 1 },
        { domain: "Keamanan", level: 1 },
      ];
    }

    const { currentState, gaps } = gapAnalysis.data;

    // Helper to calculate level (1-5) based on count and gaps
    const calcLevel = (count: number, hasGap: boolean): number => {
      if (count === 0) {
        return 1;
      }
      if (count < 5) {
        return hasGap ? 2 : 3;
      }
      if (count < 20) {
        return hasGap ? 3 : 4;
      }
      return hasGap ? 4 : 5;
    };

    return [
      {
        domain: "Proses Bisnis",
        level: calcLevel(
          currentState.businessProcesses,
          gaps.servicesWithoutProbis > 0
        ),
      },
      {
        domain: "Data",
        level: calcLevel(currentState.dataStandards, false),
      },
      {
        domain: "Layanan",
        level: calcLevel(currentState.services, gaps.servicesWithoutProbis > 0),
      },
      {
        domain: "Aplikasi",
        level: calcLevel(
          currentState.applications,
          gaps.appsWithoutService > 0
        ),
      },
      {
        domain: "Infrastruktur",
        level: calcLevel(currentState.infrastructure, false),
      },
      {
        domain: "Keamanan",
        level: calcLevel(
          currentState.applications - gaps.appsWithoutRecentAudit,
          gaps.appsWithoutRecentAudit > 0
        ),
      },
    ];
  }, [gapAnalysis.data]);

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
          value={opdStats.isLoading ? "..." : (opdStats.data?.opdCount ?? 0)}
        />
        <StatCard
          description="Dalam status produksi"
          icon={LayoutDashboard}
          title="Aplikasi Aktif"
          value={appStats.isLoading ? "..." : activeAppsCount}
        />
        <StatCard
          description="Layanan digital aktif"
          icon={Network}
          title="Layanan Publik"
          value={serviceStats.isLoading ? "..." : activeServicesCount}
        />
        <StatCard
          description="Keterpaduan arsitektur"
          icon={TrendingUp}
          title="Skor Integrasi"
          value={integrationStatus.isLoading ? "..." : `${integrationScore}%`}
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
            value={spbeIndex}
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
