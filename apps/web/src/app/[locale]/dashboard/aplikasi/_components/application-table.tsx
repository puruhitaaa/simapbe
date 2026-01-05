"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  Archive,
  Code,
  Edit,
  Globe,
  LayoutDashboard,
  MoreHorizontal,
  Smartphone,
  Trash2,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

// Type for Application from the API
interface Application {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: "UMUM" | "KHUSUS";
  platform: "WEB" | "MOBILE" | "DESKTOP" | "API";
  status: "PLANNING" | "DEVELOPMENT" | "ACTIVE" | "ARCHIVED";
  programmingLang: string | null;
  framework: string | null;
  databaseType: string | null;
  repositoryUrl: string | null;
  opdId: string;
  createdAt: string;
  updatedAt: string;
  opd: {
    id: string;
    code: string;
    name: string;
    acronym: string | null;
  };
  _count: {
    usedData: number;
    infrastructure: number;
    services: number;
    securityAudits: number;
  };
}

interface ApplicationTableProps {
  onEdit: (app: Application) => void;
  onDelete: (app: Application) => void;
}

export function ApplicationTable({ onEdit, onDelete }: ApplicationTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    ...trpc.app.list.queryOptions({
      search: search || undefined,
      status: statusFilter as Application["status"] | undefined,
      limit: 100,
    }),
  });

  const platformIcons: Record<string, React.ElementType> = {
    WEB: Globe,
    MOBILE: Smartphone,
    DESKTOP: LayoutDashboard,
    API: Code,
  };

  const statusConfig: Record<
    string,
    { label: string; className: string; icon: React.ElementType }
  > = {
    PLANNING: {
      label: "Perencanaan",
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      icon: AlertCircle,
    },
    DEVELOPMENT: {
      label: "Pengembangan",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
      icon: Wrench,
    },
    ACTIVE: {
      label: "Aktif",
      className: "bg-green-500/10 text-green-700 dark:text-green-400",
      icon: LayoutDashboard,
    },
    ARCHIVED: {
      label: "Arsip",
      className: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
      icon: Archive,
    },
  };

  const columns: ColumnDef<Application>[] = [
    {
      accessorKey: "code",
      header: "Kode",
      cell: ({ row }) => (
        <Badge className="font-mono" variant="outline">
          {row.getValue("code")}
        </Badge>
      ),
    },
    {
      accessorKey: "name",
      header: "Nama Aplikasi",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          {row.original.description && (
            <div className="line-clamp-1 text-muted-foreground text-xs">
              {row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "opd",
      header: "OPD",
      cell: ({ row }) => {
        const opd = row.original.opd;
        return <span className="text-sm">{opd.acronym || opd.name}</span>;
      },
    },
    {
      accessorKey: "type",
      header: "Tipe",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return (
          <Badge
            className={cn(
              type === "UMUM"
                ? "bg-purple-500/10 text-purple-700 dark:text-purple-400"
                : "bg-slate-500/10 text-slate-700 dark:text-slate-400"
            )}
          >
            {type === "UMUM" ? "Umum" : "Khusus"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "platform",
      header: "Platform",
      cell: ({ row }) => {
        const platform = row.getValue("platform") as string;
        const Icon = platformIcons[platform] || Globe;
        return (
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <Icon className="h-3 w-3" />
            {platform}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const config = statusConfig[status];
        const Icon = config.icon;
        return (
          <Badge className={cn("gap-1", config.className)}>
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      id: "stats",
      header: "Integrasi",
      cell: ({ row }) => {
        const counts = row.original._count;
        return (
          <div className="text-muted-foreground text-xs">
            {counts.services} Layanan • {counts.usedData} Data •{" "}
            {counts.infrastructure} Infra
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const app = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button size="icon-sm" variant="ghost" />}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Aksi</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(app)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(app)}
                variant="destructive"
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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => setStatusFilter(undefined)}
          size="sm"
          variant={statusFilter ? "outline" : "default"}
        >
          Semua
        </Button>
        {Object.entries(statusConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <Button
              className="gap-1"
              key={key}
              onClick={() => setStatusFilter(key)}
              size="sm"
              variant={statusFilter === key ? "default" : "outline"}
            >
              <Icon className="h-3 w-3" />
              {config.label}
            </Button>
          );
        })}
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        onSearchChange={setSearch}
        searchPlaceholder="Cari aplikasi..."
      />
    </div>
  );
}
