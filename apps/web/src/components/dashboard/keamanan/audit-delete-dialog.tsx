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

interface AuditDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audit: {
    id: string;
    auditDate: string;
    status: string;
    score: number | null;
    app: { name: string; code: string } | null;
  } | null;
}

export function AuditDeleteDialog({
  open,
  onOpenChange,
  audit,
}: AuditDeleteDialogProps) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const deleteMutation = useMutation({
    mutationFn: trpc.security.deleteAudit.mutationOptions().mutationFn,
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({
        queryKey: [["security", "listAudits"]],
      });
      const previousData = queryClient.getQueryData([
        ["security", "listAudits"],
      ]);

      queryClient.setQueriesData(
        { queryKey: [["security", "listAudits"]] },
        (old: { items?: Array<{ id: string }> } | undefined) => {
          if (!old?.items) return old;
          return { ...old, items: old.items.filter((item) => item.id !== id) };
        }
      );

      onOpenChange(false);
      toast.success("Audit berhasil dihapus");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [["security", "listAudits"]],
          context.previousData
        );
      }
      toast.error(error.message || "Gagal menghapus audit");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["security", "listAudits"]] });
    },
  });

  const handleDelete = () => {
    if (audit) {
      deleteMutation.mutate({ id: audit.id });
    }
  };

  if (!audit) {
    return null;
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle>Hapus Audit</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus catatan audit ini? Tindakan ini
            tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-lg border bg-muted/50 p-3">
          <dl className="space-y-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Aplikasi:</dt>
              <dd className="font-medium">
                {audit.app?.code} - {audit.app?.name}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tanggal:</dt>
              <dd className="font-medium">
                {new Date(audit.auditDate).toLocaleDateString("id-ID")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status:</dt>
              <dd className="font-medium">{audit.status}</dd>
            </div>
            {audit.score !== null && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Skor:</dt>
                <dd className="font-medium">{audit.score}</dd>
              </div>
            )}
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
