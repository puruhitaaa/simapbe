"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTRPC } from "@/utils/trpc";

const riskLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
type RiskLevel = (typeof riskLevels)[number];

interface RiskRegister {
  id: string;
  riskCode: string;
  riskDescription: string;
  riskCategory: string | null;
  impactLevel: RiskLevel;
  likelihoodLevel: RiskLevel;
  mitigationPlan: string | null;
  mitigationStatus: string | null;
  responsiblePerson: string | null;
  createdAt: string;
  opd: {
    id: string;
    code: string;
    name: string;
    acronym: string | null;
  };
}

interface RiskTableProps {
  onEdit?: (risk: RiskRegister) => void;
  onDelete?: (risk: RiskRegister) => void;
}

const riskLevelConfig: Record<
  RiskLevel,
  { label: string; color: string; value: number }
> = {
  LOW: {
    label: "Rendah",
    color: "bg-green-500/10 text-green-700 border-green-300",
    value: 1,
  },
  MEDIUM: {
    label: "Sedang",
    color: "bg-yellow-500/10 text-yellow-700 border-yellow-300",
    value: 2,
  },
  HIGH: {
    label: "Tinggi",
    color: "bg-orange-500/10 text-orange-700 border-orange-300",
    value: 3,
  },
  CRITICAL: {
    label: "Kritis",
    color: "bg-red-500/10 text-red-700 border-red-300",
    value: 5,
  },
};

function calculateRiskScore(
  impact: RiskLevel,
  likelihood: RiskLevel
): { score: number; category: RiskLevel } {
  const impactVal = riskLevelConfig[impact].value;
  const likelihoodVal = riskLevelConfig[likelihood].value;
  const score = impactVal * likelihoodVal;

  if (score <= 2) return { score, category: "LOW" };
  if (score <= 6) return { score, category: "MEDIUM" };
  if (score <= 15) return { score, category: "HIGH" };
  return { score, category: "CRITICAL" };
}

export function RiskTable({ onEdit, onDelete }: RiskTableProps) {
  const trpc = useTRPC();
  const [search, setSearch] = useQueryState("riskSearch");
  const [impactFilter, setImpactFilter] = useQueryState(
    "impact",
    parseAsStringLiteral(riskLevels)
  );

  const { data, isLoading } = useQuery({
    ...trpc.security.listRisks.queryOptions({
      impactLevel: impactFilter || undefined,
      limit: 100,
    }),
  });

  const columns: ColumnDef<RiskRegister>[] = [
    {
      accessorKey: "riskCode",
      header: "Kode",
      cell: ({ row }) => (
        <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
          {row.getValue("riskCode")}
        </code>
      ),
    },
    {
      accessorKey: "riskDescription",
      header: "Deskripsi Risiko",
      cell: ({ row }) => {
        const risk = row.original;
        return (
          <div className="max-w-[300px]">
            <p className="line-clamp-2">{risk.riskDescription}</p>
            {risk.riskCategory && (
              <Badge className="mt-1" variant="outline">
                {risk.riskCategory}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "impactLevel",
      header: "Dampak",
      cell: ({ row }) => {
        const level = row.getValue("impactLevel") as RiskLevel;
        const config = riskLevelConfig[level];
        return (
          <Badge className={config.color} variant="outline">
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "likelihoodLevel",
      header: "Kemungkinan",
      cell: ({ row }) => {
        const level = row.getValue("likelihoodLevel") as RiskLevel;
        const config = riskLevelConfig[level];
        return (
          <Badge className={config.color} variant="outline">
            {config.label}
          </Badge>
        );
      },
    },
    {
      id: "riskScore",
      header: "Skor",
      cell: ({ row }) => {
        const risk = row.original;
        const { score, category } = calculateRiskScore(
          risk.impactLevel,
          risk.likelihoodLevel
        );
        const config = riskLevelConfig[category];
        return (
          <div className="flex items-center gap-2">
            <span
              className={`rounded px-2 py-1 font-bold text-sm ${config.color}`}
            >
              {score}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "opd",
      header: "OPD",
      cell: ({ row }) => {
        const opd = row.original.opd;
        return (
          <span className="text-sm">
            {opd.acronym || opd.name.substring(0, 20)}
          </span>
        );
      },
    },
    {
      accessorKey: "mitigationStatus",
      header: "Status Mitigasi",
      cell: ({ row }) => {
        const status = row.getValue("mitigationStatus") as string | null;
        if (!status) {
          return (
            <Badge className="font-normal" variant="destructive">
              Belum ada
            </Badge>
          );
        }
        return <Badge variant="secondary">{status}</Badge>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const risk = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button className="h-8 w-8 p-0" variant="ghost" />}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(risk)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(risk)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Statistics
  const stats = data?.items
    ? {
        total: data.items.length,
        critical: data.items.filter((r) => r.impactLevel === "CRITICAL").length,
        high: data.items.filter((r) => r.impactLevel === "HIGH").length,
        medium: data.items.filter((r) => r.impactLevel === "MEDIUM").length,
        low: data.items.filter((r) => r.impactLevel === "LOW").length,
        noMitigation: data.items.filter((r) => !r.mitigationPlan).length,
      }
    : null;

  return (
    <div className="space-y-4">
      {/* Risk Statistics */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-lg border bg-card p-3">
            <p className="font-bold text-2xl">{stats.total}</p>
            <p className="text-muted-foreground text-sm">Total Risiko</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:bg-red-950/20">
            <p className="font-bold text-2xl text-red-700">{stats.critical}</p>
            <p className="text-muted-foreground text-sm">Kritis</p>
          </div>
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:bg-orange-950/20">
            <p className="font-bold text-2xl text-orange-700">{stats.high}</p>
            <p className="text-muted-foreground text-sm">Tinggi</p>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:bg-yellow-950/20">
            <p className="font-bold text-2xl text-yellow-700">{stats.medium}</p>
            <p className="text-muted-foreground text-sm">Sedang</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:bg-green-950/20">
            <p className="font-bold text-2xl text-green-700">{stats.low}</p>
            <p className="text-muted-foreground text-sm">Rendah</p>
          </div>
        </div>
      )}

      {/* Warning for risks without mitigation */}
      {stats && stats.noMitigation > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:bg-yellow-950/20">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              {stats.noMitigation} risiko belum memiliki rencana mitigasi
            </p>
          </div>
        </div>
      )}

      {/* Filter Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge
          className="cursor-pointer"
          onClick={() => setImpactFilter(null)}
          variant={impactFilter === null ? "default" : "outline"}
        >
          Semua
        </Badge>
        {(Object.keys(riskLevelConfig) as RiskLevel[]).map((level) => (
          <Badge
            className="cursor-pointer"
            key={level}
            onClick={() => setImpactFilter(level)}
            variant={impactFilter === level ? "default" : "outline"}
          >
            {riskLevelConfig[level].label}
          </Badge>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        onSearchChange={setSearch}
        searchPlaceholder="Cari risiko..."
      />
    </div>
  );
}
