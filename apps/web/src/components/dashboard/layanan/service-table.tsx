"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Building2,
  ExternalLink,
  Globe,
  Handshake,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
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
import { useTRPC } from "@/utils/trpc";

const serviceTypes = ["G2C", "G2B", "G2G", "G2E"] as const;
type ServiceType = (typeof serviceTypes)[number];

interface Service {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: ServiceType;
  url: string | null;
  isActive: boolean;
  businessProcess: {
    id: string;
    kodeProbismet: string;
    name: string;
    level: number;
  } | null;
  application: {
    id: string;
    code: string;
    name: string;
    status: string;
    opd: {
      id: string;
      code: string;
      name: string;
      acronym: string | null;
    };
  } | null;
}

interface ServiceTableProps {
  onEdit?: (service: Service) => void;
  onDelete?: (service: Service) => void;
}

const typeConfig: Record<
  ServiceType,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  G2C: {
    label: "G2C",
    description: "Government to Citizen",
    icon: Users,
    color: "bg-blue-500/10 text-blue-700 border-blue-300",
  },
  G2B: {
    label: "G2B",
    description: "Government to Business",
    icon: Building2,
    color: "bg-green-500/10 text-green-700 border-green-300",
  },
  G2G: {
    label: "G2G",
    description: "Government to Government",
    icon: Handshake,
    color: "bg-purple-500/10 text-purple-700 border-purple-300",
  },
  G2E: {
    label: "G2E",
    description: "Government to Employee",
    icon: Globe,
    color: "bg-orange-500/10 text-orange-700 border-orange-300",
  },
};

export function ServiceTable({ onEdit, onDelete }: ServiceTableProps) {
  const trpc = useTRPC();
  const [search, setSearch] = useQueryState("q");
  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    parseAsStringLiteral(serviceTypes)
  );

  const { data, isLoading } = useQuery({
    ...trpc.service.list.queryOptions({
      search: search || undefined,
      type: typeFilter || undefined,
      limit: 100,
    }),
  });

  const columns: ColumnDef<Service>[] = [
    {
      accessorKey: "code",
      header: "Kode",
      cell: ({ row }) => (
        <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
          {row.getValue("code")}
        </code>
      ),
    },
    {
      accessorKey: "name",
      header: "Nama Layanan",
      cell: ({ row }) => {
        const service = row.original;
        return (
          <div className="max-w-[300px]">
            <p className="font-medium">{service.name}</p>
            {service.description && (
              <p className="line-clamp-1 text-muted-foreground text-sm">
                {service.description}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Tipe",
      cell: ({ row }) => {
        const type = row.getValue("type") as ServiceType;
        const config = typeConfig[type];
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-2">
            <Badge className={config.color} variant="outline">
              <Icon className="mr-1 h-3 w-3" />
              {config.label}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "businessProcess",
      header: "Proses Bisnis",
      cell: ({ row }) => {
        const probis = row.original.businessProcess;
        if (!probis) {
          return (
            <Badge className="font-normal" variant="destructive">
              Tidak terhubung
            </Badge>
          );
        }
        return (
          <div className="text-sm">
            <code className="text-muted-foreground text-xs">
              {probis.kodeProbismet}
            </code>
            <p className="line-clamp-1">{probis.name}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "application",
      header: "Aplikasi Pendukung",
      cell: ({ row }) => {
        const app = row.original.application;
        if (!app) {
          return (
            <Badge className="font-normal" variant="destructive">
              Tidak terhubung
            </Badge>
          );
        }
        return (
          <div className="text-sm">
            <p className="font-medium">{app.name}</p>
            <p className="text-muted-foreground">
              {app.opd.acronym || app.opd.code}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "url",
      header: "URL",
      cell: ({ row }) => {
        const url = row.getValue("url") as string | null;
        if (!url) return <span className="text-muted-foreground">-</span>;
        return (
          <a
            className="flex items-center gap-1 text-primary text-sm hover:underline"
            href={url}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink className="h-3 w-3" />
            Akses
          </a>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Aktif" : "Nonaktif"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const service = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button className="h-8 w-8 p-0" variant="ghost" />}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(service)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(service)}
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
        g2c: data.items.filter((s) => s.type === "G2C").length,
        g2b: data.items.filter((s) => s.type === "G2B").length,
        g2g: data.items.filter((s) => s.type === "G2G").length,
        g2e: data.items.filter((s) => s.type === "G2E").length,
        active: data.items.filter((s) => s.isActive).length,
        noApp: data.items.filter((s) => !s.application).length,
        noProbis: data.items.filter((s) => !s.businessProcess).length,
      }
    : null;

  return (
    <div className="space-y-4">
      {/* Service Type Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {(Object.keys(typeConfig) as ServiceType[]).map((type) => {
            const config = typeConfig[type];
            const Icon = config.icon;
            const count = stats[
              type.toLowerCase() as keyof typeof stats
            ] as number;
            return (
              <div
                className={`cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${
                  typeFilter === type ? "ring-2 ring-primary" : ""
                }`}
                key={type}
                onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setTypeFilter(typeFilter === type ? null : type);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-2xl">{count}</p>
                    <p className="text-muted-foreground text-sm">
                      {config.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Orphan Warnings */}
      {stats && (stats.noApp > 0 || stats.noProbis > 0) && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="font-medium text-destructive">
            Peringatan: Layanan Tidak Terintegrasi
          </p>
          <p className="text-muted-foreground text-sm">
            {stats.noApp > 0 && `${stats.noApp} layanan tanpa aplikasi. `}
            {stats.noProbis > 0 &&
              `${stats.noProbis} layanan tanpa proses bisnis.`}
          </p>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        onSearchChange={setSearch}
        searchPlaceholder="Cari layanan..."
      />
    </div>
  );
}
