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
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTRPC } from "@/utils/trpc";

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function UserDeleteDialog({
  open,
  onOpenChange,
  user,
}: UserDeleteDialogProps) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const deleteMutation = useMutation({
    mutationFn: trpc.user.delete.mutationOptions().mutationFn,
    onMutate: async ({ userId }) => {
      await queryClient.cancelQueries({ queryKey: [["user", "list"]] });
      const previousData = queryClient.getQueryData([["user", "list"]]);

      queryClient.setQueriesData(
        { queryKey: [["user", "list"]] },
        (old: { items?: Array<{ id: string }> } | undefined) => {
          if (!old?.items) {
            return old;
          }
          return {
            ...old,
            items: old.items.filter((item) => item.id !== userId),
          };
        }
      );

      onOpenChange(false);
      toast.success("Pengguna berhasil dihapus");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([["user", "list"]], context.previousData);
      }
      toast.error(error.message || "Gagal menghapus pengguna");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["user", "list"]] });
    },
  });

  const handleDelete = () => {
    if (!user) {
      return;
    }
    deleteMutation.mutate({ userId: user.id });
  };

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Hapus Pengguna
          </AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus pengguna{" "}
            <strong>{user?.name}</strong> ({user?.email})?
            <br />
            <br />
            Tindakan ini tidak dapat dibatalkan. Semua data pengguna termasuk
            sesi, akun terhubung, dan log audit akan dihapus secara permanen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
          >
            {deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus Pengguna"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
