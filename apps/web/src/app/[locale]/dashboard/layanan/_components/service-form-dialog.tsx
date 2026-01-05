"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { trpc } from "@/utils/trpc";

const serviceFormSchema = z.object({
  code: z
    .string()
    .min(3, "Kode minimal 3 karakter")
    .regex(/^SVC-[A-Z0-9-]+$/, "Format kode: SVC-XXXX"),
  name: z.string().min(3, "Nama minimal 3 karakter"),
  description: z.string().optional(),
  type: z.enum(["G2C", "G2B", "G2G", "G2E"]),
  url: z.string().url("Format URL tidak valid").optional().or(z.literal("")),
  isActive: z.boolean(),
  probisId: z.string().min(1, "Proses Bisnis wajib dipilih"),
  appId: z.string().min(1, "Aplikasi pendukung wajib dipilih"),
});

type ServiceFormData = z.infer<typeof serviceFormSchema>;

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    type: "G2C" | "G2B" | "G2G" | "G2E";
    url: string | null;
    isActive: boolean;
    businessProcess: { id: string } | null;
    application: { id: string } | null;
  } | null;
}

const serviceTypes = [
  { value: "G2C", label: "G2C - Government to Citizen" },
  { value: "G2B", label: "G2B - Government to Business" },
  { value: "G2G", label: "G2G - Government to Government" },
  { value: "G2E", label: "G2E - Government to Employee" },
];

export function ServiceFormDialog({
  open,
  onOpenChange,
  editData,
}: ServiceFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!editData;

  // Fetch business processes for dropdown
  const { data: probisList } = useQuery({
    ...trpc.probis.list.queryOptions({ limit: 100 }),
    enabled: open,
  });

  // Fetch applications for dropdown
  const { data: appList } = useQuery({
    ...trpc.app.list.queryOptions({ limit: 100 }),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ServiceFormData>({
    defaultValues: {
      code: "",
      name: "",
      description: "",
      type: "G2C",
      url: "",
      isActive: true,
      probisId: "",
      appId: "",
    },
  });

  useEffect(() => {
    if (open && editData) {
      reset({
        code: editData.code,
        name: editData.name,
        description: editData.description ?? "",
        type: editData.type,
        url: editData.url ?? "",
        isActive: editData.isActive,
        probisId: editData.businessProcess?.id ?? "",
        appId: editData.application?.id ?? "",
      });
    } else if (open && !editData) {
      reset({
        code: "",
        name: "",
        description: "",
        type: "G2C",
        url: "",
        isActive: true,
        probisId: "",
        appId: "",
      });
    }
  }, [open, editData, reset]);

  const createMutation = useMutation({
    mutationFn: trpc.service.create.mutationOptions().mutationFn,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: [["service", "list"]] });
      const previousData = queryClient.getQueryData([["service", "list"]]);
      queryClient.setQueriesData(
        { queryKey: [["service", "list"]] },
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
      toast.success("Layanan berhasil ditambahkan");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([["service", "list"]], context.previousData);
      }
      toast.error(error.message || "Gagal menambahkan layanan");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["service", "list"]] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: trpc.service.update.mutationOptions().mutationFn,
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries({ queryKey: [["service", "list"]] });
      const previousData = queryClient.getQueryData([["service", "list"]]);
      queryClient.setQueriesData(
        { queryKey: [["service", "list"]] },
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
      toast.success("Layanan berhasil diperbarui");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([["service", "list"]], context.previousData);
      }
      toast.error(error.message || "Gagal memperbarui layanan");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["service", "list"]] });
    },
  });

  const onSubmit = (data: ServiceFormData) => {
    const cleanedData = {
      ...data,
      description: data.description || undefined,
      url: data.url || undefined,
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Layanan" : "Tambah Layanan Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui informasi layanan publik"
              : "Daftarkan layanan publik baru ke dalam katalog SPBE"}
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
                  placeholder="SVC-KESEHATAN-001"
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
                  placeholder="Layanan Pendaftaran Pasien Online"
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
              <Label className="text-right" htmlFor="type">
                Tipe *
              </Label>
              <div className="col-span-3">
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="probisId">
                Proses Bisnis *
              </Label>
              <div className="col-span-3">
                <Controller
                  control={control}
                  name="probisId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {probisList?.items?.map((probis) => (
                          <SelectItem key={probis.id} value={probis.id}>
                            {probis.kodeProbismet} - {probis.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.probisId && (
                  <p className="mt-1 text-destructive text-xs">
                    {errors.probisId.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="appId">
                Aplikasi *
              </Label>
              <div className="col-span-3">
                <Controller
                  control={control}
                  name="appId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {appList?.items?.map((app) => (
                          <SelectItem key={app.id} value={app.id}>
                            {app.code} - {app.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.appId && (
                  <p className="mt-1 text-destructive text-xs">
                    {errors.appId.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="url">
                URL Layanan
              </Label>
              <div className="col-span-3">
                <Input
                  id="url"
                  placeholder="https://layanan.bandung.go.id"
                  {...register("url")}
                />
                {errors.url && (
                  <p className="mt-1 text-destructive text-xs">
                    {errors.url.message}
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
                  placeholder="Deskripsi layanan..."
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
                  : "Tambah Layanan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
