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

interface RiskDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risk: {
    id: string;
    riskCode: string;
    riskDescription: string;
    impactLevel: string;
    likelihoodLevel: string;
  } | null;
}

export function RiskDeleteDialog({
  open,
  onOpenChange,
  risk,
}: RiskDeleteDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: trpc.security.deleteRisk.mutationOptions().mutationFn,
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({
        queryKey: [["security", "listRisks"]],
      });
      const previousData = queryClient.getQueryData([
        ["security", "listRisks"],
      ]);

      queryClient.setQueriesData(
        { queryKey: [["security", "listRisks"]] },
        (old: { items?: Array<{ id: string }> } | undefined) => {
          if (!old?.items) return old;
          return { ...old, items: old.items.filter((item) => item.id !== id) };
        }
      );

      onOpenChange(false);
      toast.success("Risiko berhasil dihapus");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [["security", "listRisks"]],
          context.previousData
        );
      }
      toast.error(error.message || "Gagal menghapus risiko");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["security", "listRisks"]] });
    },
  });

  const handleDelete = () => {
    if (risk) {
      deleteMutation.mutate({ id: risk.id });
    }
  };

  if (!risk) {
    return null;
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle>Hapus Risiko</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus risiko ini? Tindakan ini tidak
            dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-lg border bg-muted/50 p-3">
          <dl className="space-y-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Kode:</dt>
              <dd className="font-medium">{risk.riskCode}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Deskripsi:</dt>
              <dd className="mt-0.5 font-medium">{risk.riskDescription}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Dampak:</dt>
              <dd className="font-medium">{risk.impactLevel}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Kemungkinan:</dt>
              <dd className="font-medium">{risk.likelihoodLevel}</dd>
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
