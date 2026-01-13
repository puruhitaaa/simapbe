"use client";

import { useQuery } from "@tanstack/react-query";
import { Edit, Network, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/utils/trpc";

interface BusinessProcess {
  id: string;
  kodeProbismet: string;
  name: string;
  description: string | null;
  level: number;
  parentId: string | null;
}

interface ProbisDetailPanelProps {
  selectedId: string | null;
  onEdit: (node: BusinessProcess) => void;
  onDelete: (node: BusinessProcess) => void;
  onAddChild: (node: BusinessProcess) => void;
}

export function ProbisDetailPanel({
  selectedId,
  onEdit,
  onDelete,
  onAddChild,
}: ProbisDetailPanelProps) {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery({
    ...trpc.probis.getById.queryOptions({ id: selectedId ?? "" }),
    enabled: !!selectedId,
  });

  if (!selectedId) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <Network className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="font-medium">Pilih Proses Bisnis</h3>
          <p className="mt-1 text-muted-foreground text-sm">
            Klik item di panel kiri untuk melihat detail
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 text-center text-destructive text-sm">
        Data tidak ditemukan
      </div>
    );
  }

  const levelLabels: Record<number, string> = {
    1: "Sektor Pemerintahan",
    2: "Urusan Pemerintahan",
    3: "Fungsi",
    4: "Sub-Fungsi",
  };

  const levelColors: Record<number, string> = {
    1: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    2: "bg-green-500/10 text-green-700 dark:text-green-400",
    3: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    4: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge className={levelColors[data.level]}>
              Level {data.level}: {levelLabels[data.level]}
            </Badge>
            <Badge className="font-mono" variant="outline">
              {data.kodeProbismet}
            </Badge>
          </div>
          <h2 className="mt-2 font-semibold text-xl">{data.name}</h2>
          {data.description && (
            <p className="mt-1 text-muted-foreground text-sm">
              {data.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onEdit(data)} size="sm" variant="outline">
            <Edit className="mr-1 h-3 w-3" />
            Edit
          </Button>
          <Button onClick={() => onDelete(data)} size="sm" variant="outline">
            <Trash2 className="mr-1 h-3 w-3" />
            Hapus
          </Button>
        </div>
      </div>

      {/* Parent Info */}
      {data.parent && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Induk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="font-mono text-xs" variant="outline">
                {data.parent.kodeProbismet}
              </Badge>
              <span className="text-sm">{data.parent.name}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Children */}
      {data.level < 4 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">
              Sub-Proses ({data.children?.length ?? 0})
            </CardTitle>
            <Button
              onClick={() => onAddChild(data)}
              size="xs"
              variant="outline"
            >
              <Plus className="mr-1 h-3 w-3" />
              Tambah
            </Button>
          </CardHeader>
          <CardContent>
            {data.children && data.children.length > 0 ? (
              <div className="space-y-2">
                {data.children.map((child: BusinessProcess) => (
                  <div
                    className="flex items-center gap-2 rounded-md border p-2"
                    key={child.id}
                  >
                    <Badge className="font-mono text-xs" variant="outline">
                      {child.kodeProbismet}
                    </Badge>
                    <span className="text-sm">{child.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Belum ada sub-proses
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Linked Services */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Layanan Terkait ({data.services?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.services && data.services.length > 0 ? (
            <div className="space-y-2">
              {data.services.map(
                (service: { id: string; name: string; type: string }) => (
                  <div
                    className="flex items-center gap-2 rounded-md border p-2"
                    key={service.id}
                  >
                    <Network className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{service.name}</span>
                    <Badge className="ml-auto" variant="secondary">
                      {service.type}
                    </Badge>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Belum ada layanan yang terhubung
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
