"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/utils/trpc";

interface OpdDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opd: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export function OpdDeleteDialog({
  open,
  onOpenChange,
  opd,
}: OpdDeleteDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: trpc.opd.delete.mutationOptions().mutationFn,
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: [["opd", "list"]] });
      const previousData = queryClient.getQueryData([["opd", "list"]]);

      queryClient.setQueriesData(
        { queryKey: [["opd", "list"]] },
        (old: { items?: Array<{ id: string }> } | undefined) => {
          if (!old?.items) {
            return old;
          }
          return { ...old, items: old.items.filter((item) => item.id !== id) };
        }
      );

      onOpenChange(false);
      toast.success("OPD berhasil dihapus");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([["opd", "list"]], context.previousData);
      }
      toast.error(error.message || "Gagal menghapus OPD");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["opd", "list"]] });
    },
  });

  const handleDelete = () => {
    if (opd) {
      deleteMutation.mutate({ id: opd.id });
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Hapus OPD</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus OPD ini? Tindakan ini tidak dapat
            dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="font-medium">{opd?.name}</div>
          <div className="text-muted-foreground text-sm">{opd?.code}</div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
          <Button
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
            variant="destructive"
          >
            {deleteMutation.isPending ? "Menghapus..." : "Hapus OPD"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
