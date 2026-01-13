"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/utils/trpc";

const probisFormSchema = z.object({
  kodeProbismet: z
    .string()
    .min(2, "Kode minimal 2 karakter")
    .regex(/^[A-Z]{2,3}(\.\d{2})*$/, "Format: RAB, RAB.01, RAB.01.01"),
  name: z.string().min(3, "Nama minimal 3 karakter"),
  description: z.string().optional(),
  level: z.number().min(1).max(4),
  parentId: z.string().optional(),
});

type ProbisFormData = z.infer<typeof probisFormSchema>;

interface ProbisFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentNode?: {
    id: string;
    kodeProbismet: string;
    name: string;
    level: number;
  } | null;
  editData?: {
    id: string;
    kodeProbismet: string;
    name: string;
    description: string | null;
    level: number;
    parentId: string | null;
  } | null;
}

export function ProbisFormDialog({
  open,
  onOpenChange,
  parentNode,
  editData,
}: ProbisFormDialogProps) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const isEditing = !!editData;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProbisFormData>({
    defaultValues: {
      kodeProbismet: "",
      name: "",
      description: "",
      level: 1,
      parentId: undefined,
    },
  });

  const selectedLevel = watch("level");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (editData) {
        reset({
          kodeProbismet: editData.kodeProbismet,
          name: editData.name,
          description: editData.description ?? "",
          level: editData.level,
          parentId: editData.parentId ?? undefined,
        });
      } else if (parentNode) {
        // Creating child of selected node
        const childLevel = parentNode.level + 1;
        reset({
          kodeProbismet: `${parentNode.kodeProbismet}.`,
          name: "",
          description: "",
          level: childLevel,
          parentId: parentNode.id,
        });
      } else {
        reset({
          kodeProbismet: "",
          name: "",
          description: "",
          level: 1,
          parentId: undefined,
        });
      }
    }
  }, [open, editData, parentNode, reset]);

  const createMutation = useMutation({
    mutationFn: trpc.probis.create.mutationOptions().mutationFn,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: [["probis"]] });
      const previousData = queryClient.getQueryData([["probis"]]);
      queryClient.setQueriesData(
        { queryKey: [["probis"]] },
        (old: { items?: unknown[] } | undefined) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: [
              { id: `temp-${Date.now()}`, ...newData, createdAt: new Date() },
              ...old.items,
            ],
          };
        }
      );
      onOpenChange(false);
      toast.success("Proses Bisnis berhasil ditambahkan");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([["probis"]], context.previousData);
      }
      toast.error(error.message || "Gagal menambahkan proses bisnis");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["probis"]] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: trpc.probis.update.mutationOptions().mutationFn,
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries({ queryKey: [["probis"]] });
      const previousData = queryClient.getQueryData([["probis"]]);
      queryClient.setQueriesData(
        { queryKey: [["probis"]] },
        (old: { items?: { id: string }[] } | undefined) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === updatedData.id ? { ...item, ...updatedData } : item
            ),
          };
        }
      );
      onOpenChange(false);
      toast.success("Proses Bisnis berhasil diperbarui");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([["probis"]], context.previousData);
      }
      toast.error(error.message || "Gagal memperbarui proses bisnis");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["probis"]] });
    },
  });

  const onSubmit = (data: ProbisFormData) => {
    const cleanedData = {
      ...data,
      description: data.description || undefined,
      parentId: data.parentId || undefined,
    };

    if (isEditing && editData) {
      updateMutation.mutate({
        id: editData.id,
        name: cleanedData.name,
        description: cleanedData.description,
      });
    } else {
      createMutation.mutate(cleanedData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const levelLabels: Record<number, string> = {
    1: "Sektor Pemerintahan",
    2: "Urusan Pemerintahan",
    3: "Fungsi",
    4: "Sub-Fungsi",
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Proses Bisnis" : "Tambah Proses Bisnis"}
          </DialogTitle>
          <DialogDescription>
            {parentNode
              ? `Menambahkan sub-proses di bawah: ${parentNode.kodeProbismet} - ${parentNode.name}`
              : isEditing
                ? "Perbarui informasi proses bisnis"
                : "Daftarkan proses bisnis baru sesuai Probismet"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="level">
                Level *
              </Label>
              <div className="col-span-3">
                <Select
                  disabled={isEditing || !!parentNode}
                  onValueChange={(v) => setValue("level", Number(v))}
                  value={String(selectedLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((level) => (
                      <SelectItem key={level} value={String(level)}>
                        Level {level}: {levelLabels[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="kodeProbismet">
                Kode *
              </Label>
              <div className="col-span-3">
                <Input
                  disabled={isEditing}
                  id="kodeProbismet"
                  placeholder="RAB.01.01"
                  {...register("kodeProbismet")}
                />
                {errors.kodeProbismet && (
                  <p className="mt-1 text-destructive text-xs">
                    {errors.kodeProbismet.message}
                  </p>
                )}
                <p className="mt-1 text-muted-foreground text-xs">
                  Format: RAB (L1), RAB.01 (L2), RAB.01.01 (L3)
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="name">
                Nama *
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  placeholder="Nama proses bisnis"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="mt-1 text-destructive text-xs">
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="pt-2 text-right" htmlFor="description">
                Deskripsi
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="description"
                  placeholder="Deskripsi proses bisnis..."
                  rows={3}
                  {...register("description")}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Batal
            </DialogClose>
            <Button disabled={isPending} type="submit">
              {isPending
                ? "Menyimpan..."
                : isEditing
                  ? "Simpan Perubahan"
                  : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
