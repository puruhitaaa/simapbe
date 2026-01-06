"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Edit, MoreHorizontal, Shield, Trash2 } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

// Type for User from the API
interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: "SUPER_ADMIN" | "OPERATOR" | "AUDITOR" | "LEADER";
  opdId: string | null;
  createdAt: string;
  updatedAt: string;
  opd: {
    id: string;
    code: string;
    name: string;
    acronym: string | null;
  } | null;
  _count: {
    sessions: number;
    auditLogs: number;
  };
}

const userRoles = ["SUPER_ADMIN", "OPERATOR", "AUDITOR", "LEADER"] as const;

// Role display configuration
const roleConfig: Record<
  User["role"],
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  SUPER_ADMIN: { label: "Super Admin", variant: "destructive" },
  OPERATOR: { label: "Operator", variant: "default" },
  AUDITOR: { label: "Auditor", variant: "secondary" },
  LEADER: { label: "Leader", variant: "outline" },
};

interface UserTableProps {
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onSetRole: (user: User) => void;
  onAssignOpd: (user: User) => void;
}

export function UserTable({
  onEdit,
  onDelete,
  onSetRole,
  onAssignOpd,
}: UserTableProps) {
  const [search, setSearch] = useQueryState("q");
  const [roleFilter] = useQueryState("role", parseAsStringLiteral(userRoles));

  const { data, isLoading } = useQuery({
    ...trpc.user.list.queryOptions({
      search: search || undefined,
      role: roleFilter || undefined,
      limit: 100,
    }),
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Pengguna",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {user.image && <AvatarImage alt={user.name} src={user.image} />}
              <AvatarFallback className="text-xs">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-muted-foreground text-xs">{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as User["role"];
        const config = roleConfig[role];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: "opd",
      header: "OPD",
      cell: ({ row }) => {
        const opd = row.original.opd;
        if (!opd) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        return (
          <div>
            <div className="font-medium text-sm">{opd.acronym || opd.code}</div>
            <div className="max-w-[200px] truncate text-muted-foreground text-xs">
              {opd.name}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "emailVerified",
      header: "Status",
      cell: ({ row }) => {
        const verified = row.getValue("emailVerified") as boolean;
        return (
          <Badge variant={verified ? "default" : "outline"}>
            {verified ? "Terverifikasi" : "Pending"}
          </Badge>
        );
      },
    },
    {
      id: "stats",
      header: "Aktivitas",
      cell: ({ row }) => {
        const counts = row.original._count;
        return (
          <div className="flex items-center gap-3 text-muted-foreground text-xs">
            <span>{counts.sessions} sesi</span>
            <span>{counts.auditLogs} log</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button size="icon-sm" variant="ghost" />}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Aksi</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetRole(user)}>
                <Shield className="mr-2 h-4 w-4" />
                Ubah Role
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAssignOpd(user)}>
                <Building2 className="mr-2 h-4 w-4" />
                Assign OPD
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(user)}
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
      searchPlaceholder="Cari pengguna..."
    />
  );
}
