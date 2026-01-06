"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  GitCompareArrows,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

const DOMAIN_LABELS: Record<string, string> = {
  PROSES_BISNIS: "Proses Bisnis",
  DATA: "Data & Informasi",
  LAYANAN: "Layanan",
  APLIKASI: "Aplikasi",
  INFRASTRUKTUR: "Infrastruktur",
  KEAMANAN: "Keamanan",
};

const CURRENT_STATE_LABELS: Record<string, string> = {
  applications: "Aplikasi Aktif",
  infrastructure: "Aset Infrastruktur",
  services: "Layanan Aktif",
  businessProcesses: "Proses Bisnis",
  dataStandards: "Standar Data",
};

export function GapAnalysis() {
  const { data, isLoading } = useQuery(
    trpc.planning.getGapAnalysis.queryOptions()
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">
            Gagal memuat data gap analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalGaps =
    data.gaps.appsWithoutService +
    data.gaps.servicesWithoutProbis +
    data.gaps.appsWithoutRecentAudit;

  const gapSeverity =
    totalGaps === 0 ? "success" : totalGaps < 5 ? "warning" : "destructive";

  return (
    <div className="space-y-6">
      {/* Summary Alert */}
      <Alert variant={gapSeverity === "success" ? "default" : "destructive"}>
        {gapSeverity === "success" ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertTriangle className="h-4 w-4" />
        )}
        <AlertTitle>
          {gapSeverity === "success"
            ? "Arsitektur Terintegrasi"
            : `${totalGaps} Gap Teridentifikasi`}
        </AlertTitle>
        <AlertDescription>
          {gapSeverity === "success"
            ? "Semua komponen arsitektur SPBE telah terhubung dengan baik."
            : "Terdapat komponen arsitektur yang belum terhubung dan perlu ditindaklanjuti."}
        </AlertDescription>
      </Alert>

      {/* As-Is vs To-Be Comparison */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current State (As-Is) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompareArrows className="h-5 w-5" />
              Kondisi Saat Ini (As-Is)
            </CardTitle>
            <CardDescription>
              Status arsitektur SPBE yang sudah terimplementasi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(data.currentState).map(([key, value]) => (
              <div className="flex items-center justify-between" key={key}>
                <span className="text-muted-foreground text-sm">
                  {CURRENT_STATE_LABELS[key] ?? key}
                </span>
                <Badge className="font-mono" variant="secondary">
                  {value}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Planned State (To-Be) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Rencana Pengembangan (To-Be)
            </CardTitle>
            <CardDescription>
              Inisiatif yang direncanakan per domain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(data.planned).map(([domain, count]) => (
              <div className="space-y-2" key={domain}>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    {DOMAIN_LABELS[domain] ?? domain}
                  </span>
                  <Badge className="font-mono" variant="outline">
                    +{count}
                  </Badge>
                </div>
                <Progress
                  className="h-2"
                  value={Math.min((count / 10) * 100, 100)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Gap Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Detail Gap Arsitektur
          </CardTitle>
          <CardDescription>
            Komponen yang memerlukan integrasi atau remediasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <GapCard
              count={data.gaps.appsWithoutService}
              description="Aplikasi aktif yang belum ditautkan ke layanan publik"
              severity={
                data.gaps.appsWithoutService > 0 ? "warning" : "success"
              }
              title="Aplikasi Tanpa Layanan"
            />
            <GapCard
              count={data.gaps.servicesWithoutProbis}
              description="Layanan yang belum dipetakan ke proses bisnis"
              severity={
                data.gaps.servicesWithoutProbis > 0 ? "warning" : "success"
              }
              title="Layanan Tanpa Proses Bisnis"
            />
            <GapCard
              count={data.gaps.appsWithoutRecentAudit}
              description="Aplikasi yang belum diaudit dalam 1 tahun terakhir"
              severity={
                data.gaps.appsWithoutRecentAudit > 0 ? "destructive" : "success"
              }
              title="Aplikasi Tanpa Audit"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Rekomendasi Tindak Lanjut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.recommendations.map((rec, index) => (
                <li className="flex items-start gap-3" key={index}>
                  <ArrowRight className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface GapCardProps {
  title: string;
  count: number;
  description: string;
  severity: "success" | "warning" | "destructive";
}

function GapCard({ title, count, description, severity }: GapCardProps) {
  const colorClasses = {
    success:
      "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950",
    warning:
      "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950",
    destructive: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950",
  };

  const iconColors = {
    success: "text-green-600",
    warning: "text-amber-600",
    destructive: "text-red-600",
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[severity]}`}>
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{title}</span>
        {severity === "success" ? (
          <CheckCircle2 className={`h-5 w-5 ${iconColors[severity]}`} />
        ) : (
          <AlertTriangle className={`h-5 w-5 ${iconColors[severity]}`} />
        )}
      </div>
      <p className="mt-2 font-bold text-3xl">{count}</p>
      <p className="mt-1 text-muted-foreground text-xs">{description}</p>
    </div>
  );
}
