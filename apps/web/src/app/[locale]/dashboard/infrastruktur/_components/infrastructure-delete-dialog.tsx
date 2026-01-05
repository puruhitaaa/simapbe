"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/utils/trpc";

interface InfrastructureDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  infrastructure: {
    id: string;
    code: string;
    name: string;
    type: string;
    location: string;
  } | null;
}

export function InfrastructureDeleteDialog({
  open,
  onOpenChange,
  infrastructure,
}: InfrastructureDeleteDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: trpc.infra.delete.mutationOptions().mutationFn,
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: [["infra", "list"]] });
      const previousData = queryClient.getQueryData([["infra", "list"]]);

      queryClient.setQueriesData(
        { queryKey: [["infra", "list"]] },
        (old: { items?: Array<{ id: string }> } | undefined) => {
          if (!old?.items) return old;
          return { ...old, items: old.items.filter((item) => item.id !== id) };
        }
      );

      onOpenChange(false);
      toast.success("Infrastruktur berhasil dihapus");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([["infra", "list"]], context.previousData);
      }
      toast.error(error.message || "Gagal menghapus infrastruktur");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["infra", "list"]] });
    },
  });

  const handleDelete = () => {
    if (infrastructure) {
      deleteMutation.mutate({ id: infrastructure.id });
    }
  };

  if (!infrastructure) {
    return null;
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle>Hapus Infrastruktur</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus aset infrastruktur ini? Tindakan
            ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-lg border bg-muted/50 p-3">
          <dl className="space-y-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Kode:</dt>
              <dd className="font-medium">{infrastructure.code}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Nama:</dt>
              <dd className="font-medium">{infrastructure.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tipe:</dt>
              <dd className="font-medium">{infrastructure.type}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Lokasi:</dt>
              <dd className="font-medium">{infrastructure.location}</dd>
            </div>
          </dl>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
            variant="destructive"
          >
            {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
