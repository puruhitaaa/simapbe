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

interface ApplicationDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: {
    id: string;
    code: string;
    name: string;
    type: string;
    status: string;
  } | null;
}

export function ApplicationDeleteDialog({
  open,
  onOpenChange,
  application,
}: ApplicationDeleteDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: trpc.app.delete.mutationOptions().mutationFn,
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: [["app", "list"]] });
      const previousData = queryClient.getQueryData([["app", "list"]]);

      queryClient.setQueriesData(
        { queryKey: [["app", "list"]] },
        (old: { items?: Array<{ id: string }> } | undefined) => {
          if (!old?.items) return old;
          return { ...old, items: old.items.filter((item) => item.id !== id) };
        }
      );

      onOpenChange(false);
      toast.success("Aplikasi berhasil dihapus");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([["app", "list"]], context.previousData);
      }
      toast.error(error.message || "Gagal menghapus aplikasi");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["app", "list"]] });
    },
  });

  const handleDelete = () => {
    if (application) {
      deleteMutation.mutate({ id: application.id });
    }
  };

  if (!application) {
    return null;
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle>Hapus Aplikasi</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus aplikasi ini? Tindakan ini tidak
            dapat dibatalkan dan akan mempengaruhi layanan terkait.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-lg border bg-muted/50 p-3">
          <dl className="space-y-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Kode:</dt>
              <dd className="font-medium">{application.code}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Nama:</dt>
              <dd className="font-medium">{application.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tipe:</dt>
              <dd className="font-medium">{application.type}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status:</dt>
              <dd className="font-medium">{application.status}</dd>
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
