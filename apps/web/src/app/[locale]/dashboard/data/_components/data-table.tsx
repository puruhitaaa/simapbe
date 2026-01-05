"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle2,
  Clock,
  Database,
  Edit,
  Eye,
  Lock,
  MoreHorizontal,
  Shield,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

const classificationValues = ["PUBLIC", "RESTRICTED", "SECRET"] as const;

// Type for Data Standard from the API
interface DataStandard {
  id: string;
  dataCode: string;
  dataName: string;
  description: string | null;
  format: string;
  validityPeriod: string;
  updateFrequency: string | null;
  classification: "PUBLIC" | "RESTRICTED" | "SECRET";
  isValidated: boolean;
  validatedAt: string | null;
  producerOpdId: string | null;
  createdAt: string;
  updatedAt: string;
  producerOpd: {
    id: string;
    code: string;
    name: string;
    acronym: string | null;
  } | null;
  _count: {
    applications: number;
  };
}

interface DataTableComponentProps {
  onEdit: (data: DataStandard) => void;
  onDelete: (data: DataStandard) => void;
  onValidate: (data: DataStandard) => void;
}

export function DataStandardTable({
  onEdit,
  onDelete,
  onValidate,
}: DataTableComponentProps) {
  const [search, setSearch] = useQueryState("q");
  const [classificationFilter, setClassificationFilter] = useQueryState(
    "classification",
    parseAsStringLiteral(classificationValues)
  );

  const { data, isLoading } = useQuery({
    ...trpc.data.list.queryOptions({
      search: search || undefined,
      classification: classificationFilter || undefined,
      limit: 100,
    }),
  });

  const classificationConfig: Record<
    string,
    { label: string; icon: React.ElementType; className: string }
  > = {
    PUBLIC: {
      label: "Publik",
      icon: Eye,
      className: "bg-green-500/10 text-green-700 dark:text-green-400",
    },
    RESTRICTED: {
      label: "Terbatas",
      icon: Lock,
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
    SECRET: {
      label: "Rahasia",
      icon: Shield,
      className: "bg-red-500/10 text-red-700 dark:text-red-400",
    },
  };

  const columns: ColumnDef<DataStandard>[] = [
    {
      accessorKey: "dataCode",
      header: "Kode",
      cell: ({ row }) => (
        <Badge className="font-mono" variant="outline">
          {row.getValue("dataCode")}
        </Badge>
      ),
    },
    {
      accessorKey: "dataName",
      header: "Nama Data",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("dataName")}</div>
          {row.original.description && (
            <div className="line-clamp-1 text-muted-foreground text-xs">
              {row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "producerOpd",
      header: "Produsen Data",
      cell: ({ row }) => {
        const opd = row.original.producerOpd;
        return opd ? (
          <div className="flex items-center gap-2">
            <Database className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{opd.acronym || opd.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      },
    },
    {
      accessorKey: "classification",
      header: "Klasifikasi",
      cell: ({ row }) => {
        const classification = row.getValue("classification") as string;
        const config = classificationConfig[classification];
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
      accessorKey: "format",
      header: "Format",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.getValue("format")}</Badge>
      ),
    },
    {
      accessorKey: "isValidated",
      header: "Status",
      cell: ({ row }) => {
        const isValidated = row.getValue("isValidated") as boolean;
        return isValidated ? (
          <Badge className="gap-1 bg-green-500/10 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            Tervalidasi
          </Badge>
        ) : (
          <Badge className="gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <Clock className="h-3 w-3" />
            Menunggu
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const data = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button size="icon-sm" variant="ghost" />}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Aksi</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(data)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {!data.isValidated && (
                <DropdownMenuItem onClick={() => onValidate(data)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Validasi
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(data)}
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
          onClick={() => setClassificationFilter(null)}
          size="sm"
          variant={classificationFilter ? "outline" : "default"}
        >
          Semua
        </Button>
        {Object.entries(classificationConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <Button
              className="gap-1"
              key={key}
              onClick={() =>
                setClassificationFilter(
                  key as (typeof classificationValues)[number]
                )
              }
              size="sm"
              variant={classificationFilter === key ? "default" : "outline"}
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
        searchPlaceholder="Cari standar data..."
      />
    </div>
  );
}
