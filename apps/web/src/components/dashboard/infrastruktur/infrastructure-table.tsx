"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Cloud,
  HardDrive,
  MoreHorizontal,
  Network,
  Pencil,
  Server,
  Trash2,
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

const infraTypes = [
  "SERVER_PHYSICAL",
  "VIRTUAL_MACHINE",
  "CLOUD_SaaS",
  "CLOUD_IaaS",
  "NETWORK_DEVICE",
] as const;
const locationTypes = ["PDN", "LOCAL"] as const;

type InfraType = (typeof infraTypes)[number];
type LocationType = (typeof locationTypes)[number];

interface Infrastructure {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: InfraType;
  location: LocationType;
  specs: string | null;
  cpuCores: number | null;
  ramGB: number | null;
  storageGB: number | null;
  ipAddress: string | null;
  isActive: boolean;
  opd: {
    id: string;
    code: string;
    name: string;
    acronym: string | null;
  };
  _count: {
    applications: number;
  };
}

interface InfrastructureTableProps {
  onEdit?: (infra: Infrastructure) => void;
  onDelete?: (infra: Infrastructure) => void;
}

const typeConfig: Record<
  InfraType,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  SERVER_PHYSICAL: { label: "Server Fisik", icon: Server },
  VIRTUAL_MACHINE: { label: "Virtual Machine", icon: HardDrive },
  CLOUD_SaaS: { label: "Cloud SaaS", icon: Cloud },
  CLOUD_IaaS: { label: "Cloud IaaS", icon: Cloud },
  NETWORK_DEVICE: { label: "Network Device", icon: Network },
};

const locationConfig: Record<LocationType, { label: string; variant: string }> =
  {
    PDN: { label: "PDN", variant: "default" },
    LOCAL: { label: "Lokal", variant: "secondary" },
  };

export function InfrastructureTable({
  onEdit,
  onDelete,
}: InfrastructureTableProps) {
  const trpc = useTRPC();
  const [search, setSearch] = useQueryState("q");
  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    parseAsStringLiteral(infraTypes)
  );
  const [locationFilter, setLocationFilter] = useQueryState(
    "location",
    parseAsStringLiteral(locationTypes)
  );

  const { data, isLoading } = useQuery({
    ...trpc.infra.list.queryOptions({
      search: search || undefined,
      type: typeFilter || undefined,
      location: locationFilter || undefined,
      limit: 100,
    }),
  });

  const columns: ColumnDef<Infrastructure>[] = [
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
      header: "Nama Infrastruktur",
      cell: ({ row }) => {
        const infra = row.original;
        const TypeIcon = typeConfig[infra.type]?.icon || Server;
        return (
          <div className="flex items-center gap-2">
            <TypeIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{infra.name}</p>
              {infra.description && (
                <p className="line-clamp-1 text-muted-foreground text-sm">
                  {infra.description}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Tipe",
      cell: ({ row }) => {
        const type = row.getValue("type") as InfraType;
        return (
          <Badge variant="outline">{typeConfig[type]?.label || type}</Badge>
        );
      },
    },
    {
      accessorKey: "location",
      header: "Lokasi",
      cell: ({ row }) => {
        const location = row.getValue("location") as LocationType;
        const config = locationConfig[location];
        return (
          <Badge
            variant={config.variant === "default" ? "default" : "secondary"}
          >
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "specs",
      header: "Kapasitas",
      cell: ({ row }) => {
        const infra = row.original;
        const specs: string[] = [];
        if (infra.cpuCores) specs.push(`${infra.cpuCores} vCPU`);
        if (infra.ramGB) specs.push(`${infra.ramGB} GB RAM`);
        if (infra.storageGB) specs.push(`${infra.storageGB} GB`);
        return (
          <span className="text-muted-foreground text-sm">
            {specs.length > 0 ? specs.join(" / ") : "-"}
          </span>
        );
      },
    },
    {
      accessorKey: "opd",
      header: "OPD",
      cell: ({ row }) => {
        const opd = row.original.opd;
        if (!opd) {
          return <span className="text-destructive text-sm">Missing OPD</span>;
        }
        return (
          <span className="text-sm">
            {opd.acronym || opd.name.substring(0, 20)}
          </span>
        );
      },
    },
    {
      id: "apps",
      header: "Aplikasi",
      cell: ({ row }) => {
        const count = row.original._count?.applications ?? 0;
        return (
          <span className="text-muted-foreground text-sm">
            {count} {count === 1 ? "app" : "apps"}
          </span>
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
        const infra = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button className="h-8 w-8 p-0" variant="ghost" />}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(infra)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(infra)}
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

  const typeFilters = [
    { value: null, label: "Semua Tipe" },
    { value: "SERVER_PHYSICAL" as const, label: "Server Fisik" },
    { value: "VIRTUAL_MACHINE" as const, label: "Virtual Machine" },
    { value: "CLOUD_SaaS" as const, label: "Cloud SaaS" },
    { value: "CLOUD_IaaS" as const, label: "Cloud IaaS" },
    { value: "NETWORK_DEVICE" as const, label: "Network Device" },
  ];

  const locationFilters = [
    { value: null, label: "Semua Lokasi" },
    { value: "PDN" as const, label: "PDN" },
    { value: "LOCAL" as const, label: "Lokal" },
  ];

  // Statistics
  const stats = data?.items
    ? {
        total: data.items.length,
        pdn: data.items.filter((i) => i.location === "PDN").length,
        local: data.items.filter((i) => i.location === "LOCAL").length,
        totalCPU: data.items.reduce((sum, i) => sum + (i.cpuCores || 0), 0),
        totalRAM: data.items.reduce((sum, i) => sum + (i.ramGB || 0), 0),
        totalStorage: data.items.reduce(
          (sum, i) => sum + (i.storageGB || 0),
          0
        ),
      }
    : null;

  return (
    <div className="space-y-4">
      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          <div className="rounded-lg border bg-card p-3">
            <p className="font-bold text-2xl">{stats.total}</p>
            <p className="text-muted-foreground text-sm">Total Aset</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="font-bold text-2xl text-primary">{stats.pdn}</p>
            <p className="text-muted-foreground text-sm">Lokasi PDN</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="font-bold text-2xl">{stats.local}</p>
            <p className="text-muted-foreground text-sm">Lokasi Lokal</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="font-bold text-2xl">{stats.totalCPU}</p>
            <p className="text-muted-foreground text-sm">Total vCPU</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="font-bold text-2xl">{stats.totalRAM} GB</p>
            <p className="text-muted-foreground text-sm">Total RAM</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="font-bold text-2xl">
              {(stats.totalStorage / 1024).toFixed(1)} TB
            </p>
            <p className="text-muted-foreground text-sm">Total Storage</p>
          </div>
        </div>
      )}

      {/* Filter Badges */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-wrap gap-2">
          {typeFilters.map((filter) => (
            <Badge
              className="cursor-pointer"
              key={filter.label}
              onClick={() => setTypeFilter(filter.value)}
              variant={typeFilter === filter.value ? "default" : "outline"}
            >
              {filter.label}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {locationFilters.map((filter) => (
            <Badge
              className="cursor-pointer"
              key={filter.label}
              onClick={() => setLocationFilter(filter.value)}
              variant={locationFilter === filter.value ? "default" : "outline"}
            >
              {filter.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        onSearchChange={setSearch}
        searchPlaceholder="Cari infrastruktur..."
      />
    </div>
  );
}
