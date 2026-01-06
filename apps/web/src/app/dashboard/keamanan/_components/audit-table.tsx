"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle,
  Clock,
  MoreHorizontal,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react";
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
import { trpc } from "@/utils/trpc";

const auditStatuses = [
  "PENDING",
  "PASSED",
  "FAILED_REMEDIATION_REQUIRED",
] as const;
type AuditStatus = (typeof auditStatuses)[number];

interface SecurityAudit {
  id: string;
  auditDate: string;
  auditor: string | null;
  findings: string | null;
  recommendations: string | null;
  score: number | null;
  status: AuditStatus;
  app: {
    id: string;
    code: string;
    name: string;
    opd: {
      id: string;
      code: string;
      name: string;
    };
  };
}

interface AuditTableProps {
  onEdit?: (audit: SecurityAudit) => void;
  onDelete?: (audit: SecurityAudit) => void;
}

const statusConfig: Record<
  AuditStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    color: "bg-yellow-500/10 text-yellow-700 border-yellow-300",
  },
  PASSED: {
    label: "Lulus",
    icon: CheckCircle,
    color: "bg-green-500/10 text-green-700 border-green-300",
  },
  FAILED_REMEDIATION_REQUIRED: {
    label: "Gagal - Perlu Remediasi",
    icon: XCircle,
    color: "bg-red-500/10 text-red-700 border-red-300",
  },
};

export function AuditTable({ onEdit, onDelete }: AuditTableProps) {
  const [search, setSearch] = useQueryState("auditSearch");
  const [statusFilter, setStatusFilter] = useQueryState(
    "auditStatus",
    parseAsStringLiteral(auditStatuses)
  );

  const { data, isLoading } = useQuery({
    ...trpc.security.listAudits.queryOptions({
      status: statusFilter || undefined,
      limit: 100,
    }),
  });

  const columns: ColumnDef<SecurityAudit>[] = [
    {
      accessorKey: "auditDate",
      header: "Tanggal Audit",
      cell: ({ row }) => {
        const date = new Date(row.getValue("auditDate"));
        return (
          <span className="text-sm">
            {date.toLocaleDateString("id-ID", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        );
      },
    },
    {
      accessorKey: "app",
      header: "Aplikasi",
      cell: ({ row }) => {
        const app = row.original.app;
        return (
          <div>
            <p className="font-medium">{app.name}</p>
            <p className="text-muted-foreground text-sm">{app.opd.code}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "auditor",
      header: "Auditor",
      cell: ({ row }) => {
        const auditor = row.getValue("auditor") as string | null;
        return <span className="text-sm">{auditor || "-"}</span>;
      },
    },
    {
      accessorKey: "score",
      header: "Skor",
      cell: ({ row }) => {
        const score = row.getValue("score") as number | null;
        if (score === null)
          return <span className="text-muted-foreground">-</span>;

        let color = "text-green-700";
        if (score < 60) color = "text-red-700";
        else if (score < 80) color = "text-yellow-700";

        return <span className={`font-bold ${color}`}>{score}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as AuditStatus;
        const config = statusConfig[status];
        const Icon = config.icon;
        return (
          <Badge className={config.color} variant="outline">
            <Icon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "findings",
      header: "Temuan",
      cell: ({ row }) => {
        const findings = row.getValue("findings") as string | null;
        if (!findings) return <span className="text-muted-foreground">-</span>;
        return <p className="line-clamp-2 max-w-[200px] text-sm">{findings}</p>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const audit = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button className="h-8 w-8 p-0" variant="ghost" />}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(audit)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(audit)}
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
        passed: data.items.filter((a) => a.status === "PASSED").length,
        pending: data.items.filter((a) => a.status === "PENDING").length,
        failed: data.items.filter(
          (a) => a.status === "FAILED_REMEDIATION_REQUIRED"
        ).length,
        avgScore:
          data.items.filter((a) => a.score !== null).length > 0
            ? Math.round(
                data.items.reduce((sum, a) => sum + (a.score || 0), 0) /
                  data.items.filter((a) => a.score !== null).length
              )
            : 0,
      }
    : null;

  return (
    <div className="space-y-4">
      {/* Audit Statistics */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-lg border bg-card p-3">
            <p className="font-bold text-2xl">{stats.total}</p>
            <p className="text-muted-foreground text-sm">Total Audit</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:bg-green-950/20">
            <p className="font-bold text-2xl text-green-700">{stats.passed}</p>
            <p className="text-muted-foreground text-sm">Lulus</p>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:bg-yellow-950/20">
            <p className="font-bold text-2xl text-yellow-700">
              {stats.pending}
            </p>
            <p className="text-muted-foreground text-sm">Pending</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:bg-red-950/20">
            <p className="font-bold text-2xl text-red-700">{stats.failed}</p>
            <p className="text-muted-foreground text-sm">Perlu Remediasi</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="font-bold text-2xl">{stats.avgScore}</p>
            <p className="text-muted-foreground text-sm">Rata-rata Skor</p>
          </div>
        </div>
      )}

      {/* Filter Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge
          className="cursor-pointer"
          onClick={() => setStatusFilter(null)}
          variant={statusFilter === null ? "default" : "outline"}
        >
          Semua
        </Badge>
        {(Object.keys(statusConfig) as AuditStatus[]).map((status) => (
          <Badge
            className="cursor-pointer"
            key={status}
            onClick={() => setStatusFilter(status)}
            variant={statusFilter === status ? "default" : "outline"}
          >
            {statusConfig[status].label}
          </Badge>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        onSearchChange={setSearch}
        searchPlaceholder="Cari audit..."
      />
    </div>
  );
}
