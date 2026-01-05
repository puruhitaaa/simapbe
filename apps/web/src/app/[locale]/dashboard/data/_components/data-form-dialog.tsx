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

const dataFormSchema = z.object({
  dataCode: z
    .string()
    .min(3, "Kode minimal 3 karakter")
    .regex(/^DS-[A-Z]{3}-\d{3}$/, "Format kode: DS-XXX-000"),
  dataName: z.string().min(3, "Nama minimal 3 karakter"),
  description: z.string().optional(),
  format: z.string().min(1, "Format wajib dipilih"),
  validityPeriod: z.string().min(1, "Periode validitas wajib dipilih"),
  updateFrequency: z.string().optional(),
  classification: z.enum(["PUBLIC", "RESTRICTED", "SECRET"]),
  producerOpdId: z.string().optional(),
});

type DataFormData = z.infer<typeof dataFormSchema>;

interface DataFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    id: string;
    dataCode: string;
    dataName: string;
    description: string | null;
    format: string;
    validityPeriod: string;
    updateFrequency: string | null;
    classification: "PUBLIC" | "RESTRICTED" | "SECRET";
    producerOpd: { id: string } | null;
  } | null;
}

const dataFormats = [
  { value: "JSON", label: "JSON" },
  { value: "XML", label: "XML" },
  { value: "CSV", label: "CSV" },
  { value: "EXCEL", label: "Excel (XLSX)" },
  { value: "PDF", label: "PDF" },
  { value: "API", label: "API/Web Service" },
];

const validityPeriods = [
  { value: "REALTIME", label: "Realtime" },
  { value: "DAILY", label: "Harian" },
  { value: "WEEKLY", label: "Mingguan" },
  { value: "MONTHLY", label: "Bulanan" },
  { value: "QUARTERLY", label: "Triwulan" },
  { value: "ANNUAL", label: "Tahunan" },
];

const classifications = [
  { value: "PUBLIC", label: "Publik (Terbuka)" },
  { value: "RESTRICTED", label: "Terbatas" },
  { value: "SECRET", label: "Rahasia" },
];

export function DataFormDialog({
  open,
  onOpenChange,
  editData,
}: DataFormDialogProps) {
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
  } = useForm<DataFormData>({
    defaultValues: {
      dataCode: "",
      dataName: "",
      description: "",
      format: "",
      validityPeriod: "",
      updateFrequency: "",
      classification: "PUBLIC",
      producerOpdId: "",
    },
  });

  useEffect(() => {
    if (open && editData) {
      reset({
        dataCode: editData.dataCode,
        dataName: editData.dataName,
        description: editData.description ?? "",
        format: editData.format,
        validityPeriod: editData.validityPeriod,
        updateFrequency: editData.updateFrequency ?? "",
        classification: editData.classification,
        producerOpdId: editData.producerOpd?.id ?? "",
      });
    } else if (open && !editData) {
      reset({
        dataCode: "",
        dataName: "",
        description: "",
        format: "",
        validityPeriod: "",
        updateFrequency: "",
        classification: "PUBLIC",
        producerOpdId: "",
      });
    }
  }, [open, editData, reset]);

  const createMutation = useMutation({
    mutationFn: trpc.data.submitStandard.mutationOptions().mutationFn,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: [["data", "list"]] });
      const previousData = queryClient.getQueryData([["data", "list"]]);
      queryClient.setQueriesData(
        { queryKey: [["data", "list"]] },
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
      toast.success("Standar data berhasil diajukan");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([["data", "list"]], context.previousData);
      }
      toast.error(error.message || "Gagal mengajukan standar data");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["data", "list"]] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: trpc.data.update.mutationOptions().mutationFn,
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries({ queryKey: [["data", "list"]] });
      const previousData = queryClient.getQueryData([["data", "list"]]);
      queryClient.setQueriesData(
        { queryKey: [["data", "list"]] },
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
      toast.success("Standar data berhasil diperbarui");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([["data", "list"]], context.previousData);
      }
      toast.error(error.message || "Gagal memperbarui standar data");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["data", "list"]] });
    },
  });

  const onSubmit = (formData: DataFormData) => {
    const cleanedData = {
      ...formData,
      description: formData.description || undefined,
      updateFrequency: formData.updateFrequency || undefined,
      producerOpdId: formData.producerOpdId || undefined,
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
            {isEditing ? "Edit Standar Data" : "Ajukan Standar Data Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui informasi standar data"
              : "Ajukan standar data baru untuk validasi Walidata"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="dataCode">
                Kode *
              </Label>
              <div className="col-span-3">
                <Input
                  id="dataCode"
                  placeholder="DS-KES-001"
                  {...register("dataCode")}
                  disabled={isEditing}
                />
                {errors.dataCode && (
                  <p className="mt-1 text-destructive text-xs">
                    {errors.dataCode.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="dataName">
                Nama *
              </Label>
              <div className="col-span-3">
                <Input
                  id="dataName"
                  placeholder="Data Faskes Kota Bandung"
                  {...register("dataName")}
                />
                {errors.dataName && (
                  <p className="mt-1 text-destructive text-xs">
                    {errors.dataName.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="format">
                Format *
              </Label>
              <div className="col-span-3">
                <Controller
                  control={control}
                  name="format"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dataFormats.map((format) => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.format && (
                  <p className="mt-1 text-destructive text-xs">
                    {errors.format.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="validityPeriod">
                Periode Validitas *
              </Label>
              <div className="col-span-3">
                <Controller
                  control={control}
                  name="validityPeriod"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {validityPeriods.map((period) => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.validityPeriod && (
                  <p className="mt-1 text-destructive text-xs">
                    {errors.validityPeriod.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="classification">
                Klasifikasi *
              </Label>
              <div className="col-span-3">
                <Controller
                  control={control}
                  name="classification"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {classifications.map((cls) => (
                          <SelectItem key={cls.value} value={cls.value}>
                            {cls.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="producerOpdId">
                Produsen Data
              </Label>
              <div className="col-span-3">
                <Controller
                  control={control}
                  name="producerOpdId"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
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
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="pt-2 text-right" htmlFor="description">
                Deskripsi
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="description"
                  placeholder="Deskripsi standar data..."
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
                  : "Ajukan Standar Data"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
