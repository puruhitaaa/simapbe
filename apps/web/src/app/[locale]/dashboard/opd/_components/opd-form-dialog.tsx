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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/utils/trpc";

const opdFormSchema = z.object({
  code: z
    .string()
    .min(2, "Kode minimal 2 karakter")
    .max(20, "Kode maksimal 20 karakter")
    .regex(/^[A-Z0-9_]+$/, "Kode harus huruf kapital, angka, atau underscore"),
  name: z.string().min(3, "Nama minimal 3 karakter"),
  acronym: z.string().max(20).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .email("Format email tidak valid")
    .optional()
    .or(z.literal("")),
});

type OpdFormData = z.infer<typeof opdFormSchema>;

interface OpdFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    id: string;
    code: string;
    name: string;
    acronym: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

export function OpdFormDialog({
  open,
  onOpenChange,
  editData,
}: OpdFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!editData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OpdFormData>({
    defaultValues: {
      code: "",
      name: "",
      acronym: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  // Reset form when dialog opens with edit data
  useEffect(() => {
    if (open && editData) {
      reset({
        code: editData.code,
        name: editData.name,
        acronym: editData.acronym ?? "",
        address: editData.address ?? "",
        phone: editData.phone ?? "",
        email: editData.email ?? "",
      });
    } else if (open && !editData) {
      reset({
        code: "",
        name: "",
        acronym: "",
        address: "",
        phone: "",
        email: "",
      });
    }
  }, [open, editData, reset]);

  const createMutation = useMutation({
    mutationFn: trpc.opd.create.mutationOptions().mutationFn,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: [["opd", "list"]] });
      const previousData = queryClient.getQueryData([["opd", "list"]]);

      queryClient.setQueriesData(
        { queryKey: [["opd", "list"]] },
        (old: { items?: unknown[] } | undefined) => {
          if (!old?.items) {
            return old;
          }
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
      toast.success("OPD berhasil ditambahkan");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([["opd", "list"]], context.previousData);
      }
      toast.error(error.message || "Gagal menambahkan OPD");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["opd", "list"]] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: trpc.opd.update.mutationOptions().mutationFn,
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries({ queryKey: [["opd", "list"]] });
      const previousData = queryClient.getQueryData([["opd", "list"]]);

      queryClient.setQueriesData(
        { queryKey: [["opd", "list"]] },
        (old: { items?: { id: string }[] } | undefined) => {
          if (!old?.items) {
            return old;
          }
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === updatedData.id ? { ...item, ...updatedData } : item
            ),
          };
        }
      );

      onOpenChange(false);
      toast.success("OPD berhasil diperbarui");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([["opd", "list"]], context.previousData);
      }
      toast.error(error.message || "Gagal memperbarui OPD");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["opd", "list"]] });
    },
  });

  const onSubmit = (data: OpdFormData) => {
    // Clean empty strings to undefined
    const cleanedData = {
      ...data,
      acronym: data.acronym || undefined,
      address: data.address || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
    };

    if (isEditing && editData) {
      updateMutation.mutate({ id: editData.id, ...cleanedData });
    } else {
      createMutation.mutate(cleanedData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit OPD" : "Tambah OPD Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui informasi Organisasi Perangkat Daerah"
              : "Daftarkan OPD baru ke dalam sistem SPBE"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="code">
                Kode *
              </Label>
              <div className="col-span-3">
                <Input
                  id="code"
                  placeholder="DISKOMINFO"
                  {...register("code")}
                  disabled={isEditing}
                />
                {errors.code && (
                  <p className="mt-1 text-destructive text-xs">
                    {errors.code.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="name">
                Nama *
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  placeholder="Dinas Komunikasi dan Informatika"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="mt-1 text-destructive text-xs">
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="acronym">
                Singkatan
              </Label>
              <div className="col-span-3">
                <Input
                  id="acronym"
                  placeholder="Diskominfo"
                  {...register("acronym")}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="email">
                Email
              </Label>
              <div className="col-span-3">
                <Input
                  id="email"
                  placeholder="diskominfo@bandung.go.id"
                  type="email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="mt-1 text-destructive text-xs">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="phone">
                Telepon
              </Label>
              <div className="col-span-3">
                <Input
                  id="phone"
                  placeholder="022-1234567"
                  {...register("phone")}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="pt-2 text-right" htmlFor="address">
                Alamat
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="address"
                  placeholder="Jl. Wastukancana No. 2, Bandung"
                  rows={2}
                  {...register("address")}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Batal
            </DialogClose>
            <Button disabled={isPending} type="submit">
              {isPending && "Menyimpan..."}
              {!isPending && isEditing && "Simpan Perubahan"}
              {!(isPending || isEditing) && "Tambah OPD"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
