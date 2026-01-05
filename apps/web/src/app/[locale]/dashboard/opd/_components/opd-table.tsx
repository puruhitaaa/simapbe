"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Edit,
  LayoutDashboard,
  MoreHorizontal,
  Server,
  Trash2,
  Users,
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
import { trpc } from "@/utils/trpc";

// Type for OPD from the API
interface Opd {
  id: string;
  code: string;
  name: string;
  acronym: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    applications: number;
    infrastructure: number;
  };
}

interface OpdTableProps {
  onEdit: (opd: Opd) => void;
  onDelete: (opd: Opd) => void;
}

export function OpdTable({ onEdit, onDelete }: OpdTableProps) {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    ...trpc.opd.list.queryOptions({ search: search || undefined, limit: 100 }),
  });

  const columns: ColumnDef<Opd>[] = [
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
      header: "Nama OPD",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          {row.original.acronym && (
            <div className="text-muted-foreground text-xs">
              {row.original.acronym}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.getValue("email") || "-"}
        </span>
      ),
    },
    {
      id: "stats",
      header: "Statistik",
      cell: ({ row }) => {
        const counts = row.original._count;
        return (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Users className="h-3 w-3" />
              <span>{counts.users}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <LayoutDashboard className="h-3 w-3" />
              <span>{counts.applications}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Server className="h-3 w-3" />
              <span>{counts.infrastructure}</span>
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const opd = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button size="icon-sm" variant="ghost" />}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Aksi</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(opd)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(opd)}
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
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      isLoading={isLoading}
      onSearchChange={setSearch}
      searchPlaceholder="Cari OPD..."
    />
  );
}
