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

interface ServiceDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: {
    id: string;
    name: string;
    code: string;
    type: string;
  } | null;
}

export function ServiceDeleteDialog({
  open,
  onOpenChange,
  service,
}: ServiceDeleteDialogProps) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const deleteMutation = useMutation({
    mutationFn: trpc.service.delete.mutationOptions().mutationFn,
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: [["service", "list"]] });
      const previousData = queryClient.getQueryData([["service", "list"]]);

      queryClient.setQueriesData(
        { queryKey: [["service", "list"]] },
        (old: { items?: Array<{ id: string }> } | undefined) => {
          if (!old?.items) return old;
          return { ...old, items: old.items.filter((item) => item.id !== id) };
        }
      );

      onOpenChange(false);
      toast.success("Layanan berhasil dihapus");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([["service", "list"]], context.previousData);
      }
      toast.error(error.message || "Gagal menghapus layanan");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["service", "list"]] });
    },
  });

  const handleDelete = () => {
    if (service) {
      deleteMutation.mutate({ id: service.id });
    }
  };

  if (!service) {
    return null;
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle>Hapus Layanan</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus layanan ini? Tindakan ini tidak
            dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-lg border bg-muted/50 p-3">
          <div className="font-medium text-sm">{service.name}</div>
          <div className="text-muted-foreground text-xs">
            {service.code} • {service.type}
          </div>
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
