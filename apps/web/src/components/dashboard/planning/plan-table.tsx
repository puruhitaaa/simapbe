"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTRPC } from "@/utils/trpc";

const DOMAIN_LABELS: Record<string, string> = {
  PROSES_BISNIS: "Proses Bisnis",
  DATA: "Data",
  LAYANAN: "Layanan",
  APLIKASI: "Aplikasi",
  INFRASTRUKTUR: "Infrastruktur",
  KEAMANAN: "Keamanan",
};

const DOMAIN_COLORS: Record<string, string> = {
  PROSES_BISNIS:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  DATA: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  LAYANAN:
    "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
  APLIKASI: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  INFRASTRUKTUR: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  KEAMANAN: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
};

const STATUS_BADGES: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  PLANNED: { label: "Direncanakan", variant: "secondary" },
  BUDGETED: { label: "Dianggarkan", variant: "default" },
  ONGOING: { label: "Berjalan", variant: "default" },
  COMPLETED: { label: "Selesai", variant: "outline" },
  DELAYED: { label: "Tertunda", variant: "destructive" },
};

function formatCurrency(value: number | null | undefined): string {
  if (!value) {
    return "-";
  }
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(0)}Jt`;
  }
  return `Rp ${value.toLocaleString("id-ID")}`;
}

interface PlanData {
  id: string;
  planCode: string;
  year: number;
  quarter: number | null;
  initiativeName: string;
  description: string | null;
  domain: string;
  priority: number;
  budget: { toNumber: () => number } | number | string | null;
  budgetCode: string | null;
  fundingSource: string | null;
  status: string;
  progressPercent: number;
  isGap: boolean;
  gapDescription: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface PlanTableProps {
  onEdit: (plan: PlanData) => void;
  onDelete: (plan: PlanData) => void;
}

export function PlanTable({ onEdit, onDelete }: PlanTableProps) {
  const trpc = useTRPC();
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading } = useQuery(
    trpc.planning.list.queryOptions({
      year: yearFilter !== "all" ? Number(yearFilter) : undefined,
      domain:
        domainFilter !== "all"
          ? (domainFilter as
              | "PROSES_BISNIS"
              | "DATA"
              | "LAYANAN"
              | "APLIKASI"
              | "INFRASTRUKTUR"
              | "KEAMANAN")
          : undefined,
      status:
        statusFilter !== "all"
          ? (statusFilter as
              | "PLANNED"
              | "BUDGETED"
              | "ONGOING"
              | "COMPLETED"
              | "DELAYED")
          : undefined,
      limit: 50,
    })
  );

  const plans = data?.items ?? [];

  const filteredPlans = plans.filter((plan) => {
    if (!search) {
      return true;
    }
    const searchLower = search.toLowerCase();
    return (
      plan.planCode.toLowerCase().includes(searchLower) ||
      plan.initiativeName.toLowerCase().includes(searchLower) ||
      (plan.description?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <Skeleton className="h-12 w-full" key={`skeleton-${n}`} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Daftar Inisiatif SPBE
        </CardTitle>
        <CardDescription>
          Kelola inisiatif strategis dalam Peta Rencana SPBE
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-50 flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama inisiatif..."
              value={search}
            />
          </div>

          <Select
            onValueChange={(v) => setYearFilter(v ?? "all")}
            value={yearFilter}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tahun</SelectItem>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            onValueChange={(v) => setDomainFilter(v ?? "all")}
            value={domainFilter}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Domain</SelectItem>
              {Object.entries(DOMAIN_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            onValueChange={(v) => setStatusFilter(v ?? "all")}
            value={statusFilter}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {Object.entries(STATUS_BADGES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {filteredPlans.length === 0 ? (
          <div className="flex h-50 items-center justify-center text-muted-foreground">
            {search ||
            yearFilter !== "all" ||
            domainFilter !== "all" ||
            statusFilter !== "all"
              ? "Tidak ada inisiatif yang cocok dengan filter"
              : "Belum ada inisiatif yang terdaftar"}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-30">Kode</TableHead>
                  <TableHead>Nama Inisiatif</TableHead>
                  <TableHead className="w-25">Tahun</TableHead>
                  <TableHead className="w-32">Domain</TableHead>
                  <TableHead className="w-30">Anggaran</TableHead>
                  <TableHead className="w-30">Status</TableHead>
                  <TableHead className="w-20 text-center">Prioritas</TableHead>
                  <TableHead className="w-15" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((plan) => {
                  const rawBudget =
                    typeof plan.budget === "object" && plan.budget !== null
                      ? (plan.budget as { toNumber: () => number }).toNumber()
                      : plan.budget;
                  const budgetValue =
                    typeof rawBudget === "string"
                      ? Number.parseFloat(rawBudget)
                      : rawBudget;
                  const statusInfo = STATUS_BADGES[plan.status] ?? {
                    label: plan.status,
                    variant: "secondary" as const,
                  };
                  const domainColor =
                    DOMAIN_COLORS[plan.domain] ?? "bg-gray-100 text-gray-800";

                  return (
                    <TableRow key={plan.id}>
                      <TableCell className="font-mono text-sm">
                        {plan.planCode}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{plan.initiativeName}</p>
                          {plan.isGap && (
                            <Badge className="text-xs" variant="outline">
                              Gap Filler
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{plan.year}</span>
                        {plan.quarter && (
                          <span className="text-muted-foreground text-xs">
                            {" "}
                            Q{plan.quarter}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`font-normal ${domainColor}`}
                          variant="secondary"
                        >
                          {DOMAIN_LABELS[plan.domain] ?? plan.domain}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatCurrency(budgetValue)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="font-mono" variant="outline">
                          P{plan.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(plan)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => onDelete(plan)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination info */}
        {data?.nextCursor && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-muted-foreground text-sm">
              Menampilkan {filteredPlans.length} dari total inisiatif
            </p>
            <div className="flex gap-2">
              <Button disabled size="sm" variant="outline">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Sebelumnya
              </Button>
              <Button size="sm" variant="outline">
                Selanjutnya
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
