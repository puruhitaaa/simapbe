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

interface ProbisDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  probis: {
    id: string;
    kodeProbismet: string;
    name: string;
    level: number;
  } | null;
}

const levelLabels: Record<number, string> = {
  1: "Sektor",
  2: "Urusan",
  3: "Fungsi",
  4: "Sub-Fungsi",
};

export function ProbisDeleteDialog({
  open,
  onOpenChange,
  probis,
}: ProbisDeleteDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: trpc.probis.delete.mutationOptions().mutationFn,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [["probis"]] });
      const previousData = queryClient.getQueryData([["probis"]]);

      onOpenChange(false);
      toast.success("Proses bisnis berhasil dihapus");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([["probis"]], context.previousData);
      }
      toast.error(error.message || "Gagal menghapus proses bisnis");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["probis"]] });
    },
  });

  const handleDelete = () => {
    if (probis) {
      deleteMutation.mutate({ id: probis.id });
    }
  };

  if (!probis) {
    return null;
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle>Hapus Proses Bisnis</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus proses bisnis ini? Semua layanan
            dan aplikasi yang terkait akan terpengaruh.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-lg border bg-muted/50 p-3">
          <dl className="space-y-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Kode:</dt>
              <dd className="font-medium">{probis.kodeProbismet}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Nama:</dt>
              <dd className="font-medium">{probis.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Level:</dt>
              <dd className="font-medium">
                {levelLabels[probis.level] || `Level ${probis.level}`}
              </dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-800 text-xs dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <strong>Peringatan:</strong> Menghapus proses bisnis akan membatalkan
          hubungan dengan layanan publik terkait.
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
