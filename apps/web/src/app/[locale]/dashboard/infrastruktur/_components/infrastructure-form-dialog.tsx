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

const infraFormSchema = z.object({
  code: z
    .string()
    .min(3, "Kode minimal 3 karakter")
    .regex(/^INFRA-[A-Z0-9-]+$/, "Format kode: INFRA-XXXX"),
  name: z.string().min(3, "Nama minimal 3 karakter"),
  description: z.string().optional(),
  type: z.enum([
    "SERVER_PHYSICAL",
    "VIRTUAL_MACHINE",
    "CLOUD_SaaS",
    "CLOUD_IaaS",
    "NETWORK_DEVICE",
  ]),
  location: z.enum(["PDN", "LOCAL"]),
  specs: z.string().optional(),
  cpuCores: z.number().int().min(0).optional(),
  ramGB: z.number().int().min(0).optional(),
  storageGB: z.number().int().min(0).optional(),
  ipAddress: z.string().optional(),
  opdId: z.string().min(1, "OPD wajib dipilih"),
});

type InfraFormData = z.infer<typeof infraFormSchema>;

interface InfrastructureFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    type:
      | "SERVER_PHYSICAL"
      | "VIRTUAL_MACHINE"
      | "CLOUD_SaaS"
      | "CLOUD_IaaS"
      | "NETWORK_DEVICE";
    location: "PDN" | "LOCAL";
    specs: string | null;
    cpuCores: number | null;
    ramGB: number | null;
    storageGB: number | null;
    ipAddress: string | null;
    opd: { id: string } | null;
  } | null;
}

const infraTypes = [
  { value: "SERVER_PHYSICAL", label: "Server Fisik" },
  { value: "VIRTUAL_MACHINE", label: "Virtual Machine" },
  { value: "CLOUD_SaaS", label: "Cloud SaaS" },
  { value: "CLOUD_IaaS", label: "Cloud IaaS" },
  { value: "NETWORK_DEVICE", label: "Perangkat Jaringan" },
];

const locations = [
  { value: "PDN", label: "PDN (Pusat Data Nasional)" },
  { value: "LOCAL", label: "Server Lokal" },
];

export function InfrastructureFormDialog({
  open,
  onOpenChange,
  editData,
}: InfrastructureFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!editData;

  // Fetch OPDs for dropdown
  const { data: opdList } = useQuery({
    ...trpc.opd.list.queryOptions(),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<InfraFormData>({
    defaultValues: {
      code: "",
      name: "",
      description: "",
      type: "VIRTUAL_MACHINE",
      location: "LOCAL",
      specs: "",
      cpuCores: undefined,
      ramGB: undefined,
      storageGB: undefined,
      ipAddress: "",
      opdId: "",
    },
  });

  useEffect(() => {
    if (open && editData) {
      reset({
        code: editData.code,
        name: editData.name,
        description: editData.description ?? "",
        type: editData.type,
        location: editData.location,
        specs: editData.specs ?? "",
        cpuCores: editData.cpuCores ?? undefined,
        ramGB: editData.ramGB ?? undefined,
        storageGB: editData.storageGB ?? undefined,
        ipAddress: editData.ipAddress ?? "",
        opdId: editData.opd?.id ?? "",
      });
    } else if (open && !editData) {
      reset({
        code: "",
        name: "",
        description: "",
        type: "VIRTUAL_MACHINE",
        location: "LOCAL",
        specs: "",
        cpuCores: undefined,
        ramGB: undefined,
        storageGB: undefined,
        ipAddress: "",
        opdId: "",
      });
    }
  }, [open, editData, reset]);

  const createMutation = useMutation({
    mutationFn: trpc.infra.register.mutationOptions().mutationFn,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: [["infra", "list"]] });
      const previousData = queryClient.getQueryData([["infra", "list"]]);
      queryClient.setQueriesData(
        { queryKey: [["infra", "list"]] },
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
      toast.success("Infrastruktur berhasil ditambahkan");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([["infra", "list"]], context.previousData);
      }
      toast.error(error.message || "Gagal menambahkan infrastruktur");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["infra", "list"]] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: trpc.infra.update.mutationOptions().mutationFn,
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries({ queryKey: [["infra", "list"]] });
      const previousData = queryClient.getQueryData([["infra", "list"]]);
      queryClient.setQueriesData(
        { queryKey: [["infra", "list"]] },
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
      toast.success("Infrastruktur berhasil diperbarui");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([["infra", "list"]], context.previousData);
      }
      toast.error(error.message || "Gagal memperbarui infrastruktur");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["infra", "list"]] });
    },
  });

  const onSubmit = (data: InfraFormData) => {
    const cleanedData = {
      ...data,
      description: data.description || undefined,
      specs: data.specs || undefined,
      ipAddress: data.ipAddress || undefined,
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
            {isEditing ? "Edit Infrastruktur" : "Tambah Infrastruktur Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui informasi aset infrastruktur"
              : "Daftarkan aset infrastruktur baru ke dalam inventaris"}
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
                  placeholder="INFRA-SRV-001"
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
                  placeholder="Server Utama Data Center"
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
                        {infraTypes.map((type) => (
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
              <Label className="text-right" htmlFor="location">
                Lokasi *
              </Label>
              <div className="col-span-3">
                <Controller
                  control={control}
                  name="location"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc.value} value={loc.value}>
                            {loc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="opdId">
                OPD *
              </Label>
              <div className="col-span-3">
                <Controller
                  control={control}
                  name="opdId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {opdList?.items?.map((opd) => (
                          <SelectItem key={opd.id} value={opd.id}>
                            {opd.acronym || opd.code} - {opd.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.opdId && (
                  <p className="mt-1 text-destructive text-xs">
                    {errors.opdId.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="ipAddress">
                IP Address
              </Label>
              <div className="col-span-3">
                <Input
                  id="ipAddress"
                  placeholder="192.168.1.100"
                  {...register("ipAddress")}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Kapasitas</Label>
              <div className="col-span-3 grid grid-cols-3 gap-2">
                <div>
                  <Input
                    placeholder="CPU Cores"
                    type="number"
                    {...register("cpuCores", { valueAsNumber: true })}
                  />
                  <span className="text-muted-foreground text-xs">
                    CPU Cores
                  </span>
                </div>
                <div>
                  <Input
                    placeholder="RAM (GB)"
                    type="number"
                    {...register("ramGB", { valueAsNumber: true })}
                  />
                  <span className="text-muted-foreground text-xs">RAM GB</span>
                </div>
                <div>
                  <Input
                    placeholder="Storage (GB)"
                    type="number"
                    {...register("storageGB", { valueAsNumber: true })}
                  />
                  <span className="text-muted-foreground text-xs">
                    Storage GB
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="pt-2 text-right" htmlFor="specs">
                Spesifikasi
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="specs"
                  placeholder="Detail spesifikasi hardware..."
                  rows={2}
                  {...register("specs")}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="pt-2 text-right" htmlFor="description">
                Deskripsi
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="description"
                  placeholder="Deskripsi infrastruktur..."
                  rows={2}
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
                  : "Tambah Infrastruktur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
