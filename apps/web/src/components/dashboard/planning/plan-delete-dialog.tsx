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
import { useTRPC } from "@/utils/trpc";

interface PlanDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: {
    id: string;
    planCode: string;
    initiativeName: string;
  } | null;
}

export function PlanDeleteDialog({
  open,
  onOpenChange,
  plan,
}: PlanDeleteDialogProps) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const deleteMutation = useMutation({
    mutationFn: trpc.planning.delete.mutationOptions().mutationFn,
    onSuccess: () => {
      toast.success("Inisiatif berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: [["planning"]] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menghapus inisiatif");
    },
  });

  const handleDelete = () => {
    if (plan) {
      deleteMutation.mutate({ id: plan.id });
    }
  };

  if (!plan) {
    return null;
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle>Hapus Inisiatif</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus inisiatif ini? Tindakan ini tidak
            dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Kode</span>
              <span className="font-medium font-mono text-sm">
                {plan.planCode}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Nama Inisiatif
              </span>
              <span className="max-w-50 truncate font-medium text-sm">
                {plan.initiativeName}
              </span>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
            variant="destructive"
          >
            {deleteMutation.isPending ? "Menghapus..." : "Hapus Inisiatif"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
