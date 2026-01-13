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

interface DataDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    id: string;
    dataCode: string;
    dataName: string;
    classification: string;
    format: string;
  } | null;
}

export function DataDeleteDialog({
  open,
  onOpenChange,
  data,
}: DataDeleteDialogProps) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const deleteMutation = useMutation({
    mutationFn: trpc.data.delete.mutationOptions().mutationFn,
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: [["data", "list"]] });
      const previousData = queryClient.getQueryData([["data", "list"]]);

      queryClient.setQueriesData(
        { queryKey: [["data", "list"]] },
        (old: { items?: Array<{ id: string }> } | undefined) => {
          if (!old?.items) return old;
          return { ...old, items: old.items.filter((item) => item.id !== id) };
        }
      );

      onOpenChange(false);
      toast.success("Standar data berhasil dihapus");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([["data", "list"]], context.previousData);
      }
      toast.error(error.message || "Gagal menghapus standar data");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["data", "list"]] });
    },
  });

  const handleDelete = () => {
    if (data) {
      deleteMutation.mutate({ id: data.id });
    }
  };

  if (!data) {
    return null;
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle>Hapus Standar Data</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus standar data ini? Tindakan ini
            tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-lg border bg-muted/50 p-3">
          <dl className="space-y-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Kode:</dt>
              <dd className="font-medium">{data.dataCode}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Nama:</dt>
              <dd className="font-medium">{data.dataName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Klasifikasi:</dt>
              <dd className="font-medium">{data.classification}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Format:</dt>
              <dd className="font-medium">{data.format}</dd>
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
