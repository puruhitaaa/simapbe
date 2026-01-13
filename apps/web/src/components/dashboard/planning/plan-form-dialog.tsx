"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useTRPC } from "@/utils/trpc";

const planFormSchema = z.object({
  planCode: z
    .string()
    .min(3, "Kode minimal 3 karakter")
    .regex(/^PLAN-[A-Z0-9-]+$/, "Format kode: PLAN-XXXX"),
  year: z.coerce
    .number()
    .min(2020, "Tahun minimal 2020")
    .max(2035, "Tahun maksimal 2035"),
  quarter: z.coerce.number().min(1).max(4).optional(),
  initiativeName: z.string().min(5, "Nama inisiatif minimal 5 karakter"),
  description: z.string().optional(),
  domain: z.enum([
    "PROSES_BISNIS",
    "DATA",
    "LAYANAN",
    "APLIKASI",
    "INFRASTRUKTUR",
    "KEAMANAN",
  ]),
  priority: z.coerce.number().int().min(1).max(5).default(3),
  budget: z.coerce.number().min(0).optional(),
  budgetCode: z.string().optional(),
  fundingSource: z.string().optional(),
  status: z
    .enum(["PLANNED", "BUDGETED", "ONGOING", "COMPLETED", "DELAYED"])
    .default("PLANNED"),
  isGap: z.boolean().default(false),
  gapDescription: z.string().optional(),
});

type PlanFormData = z.infer<typeof planFormSchema>;

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    id: string;
    planCode: string;
    year: number;
    quarter: number | null;
    initiativeName: string;
    description: string | null;
    domain: string;
    priority: number;
    budget: number | string | null;
    budgetCode: string | null;
    fundingSource: string | null;
    status: string;
    isGap: boolean;
    gapDescription: string | null;
  } | null;
}

const domainOptions = [
  { value: "PROSES_BISNIS", label: "Proses Bisnis" },
  { value: "DATA", label: "Data & Informasi" },
  { value: "LAYANAN", label: "Layanan" },
  { value: "APLIKASI", label: "Aplikasi" },
  { value: "INFRASTRUKTUR", label: "Infrastruktur" },
  { value: "KEAMANAN", label: "Keamanan" },
];

const statusOptions = [
  { value: "PLANNED", label: "Direncanakan" },
  { value: "BUDGETED", label: "Dianggarkan" },
  { value: "ONGOING", label: "Berjalan" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "DELAYED", label: "Tertunda" },
];

const priorityOptions = [
  { value: 1, label: "1 - Sangat Tinggi" },
  { value: 2, label: "2 - Tinggi" },
  { value: 3, label: "3 - Sedang" },
  { value: 4, label: "4 - Rendah" },
  { value: 5, label: "5 - Sangat Rendah" },
];

const quarterOptions = [
  { value: 1, label: "Q1 (Jan-Mar)" },
  { value: 2, label: "Q2 (Apr-Jun)" },
  { value: 3, label: "Q3 (Jul-Sep)" },
  { value: 4, label: "Q4 (Okt-Des)" },
];

const fundingSourceOptions = [
  { value: "APBD", label: "APBD" },
  { value: "APBN", label: "APBN" },
  { value: "DAK", label: "DAK" },
  { value: "HIBAH", label: "Hibah" },
  { value: "OTHER", label: "Lainnya" },
];

// Helper to convert budget to number
function parseBudget(
  value: number | string | null | undefined
): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "number") {
    return value;
  }
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function PlanFormDialog({
  open,
  onOpenChange,
  editData,
}: PlanFormDialogProps) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const isEditing = !!editData;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<PlanFormData>({
    defaultValues: {
      planCode: "",
      year: new Date().getFullYear(),
      initiativeName: "",
      description: "",
      domain: "APLIKASI",
      priority: 3,
      budget: undefined,
      budgetCode: "",
      fundingSource: "",
      status: "PLANNED",
      isGap: false,
      gapDescription: "",
    },
  });

  const isGap = watch("isGap");

  // Reset form when dialog opens with edit data
  useEffect(() => {
    if (open) {
      if (editData) {
        reset({
          planCode: editData.planCode,
          year: editData.year,
          quarter: editData.quarter ?? undefined,
          initiativeName: editData.initiativeName,
          description: editData.description ?? "",
          domain: editData.domain as PlanFormData["domain"],
          priority: editData.priority,
          budget: parseBudget(editData.budget),
          budgetCode: editData.budgetCode ?? "",
          fundingSource: editData.fundingSource ?? "",
          status: editData.status as PlanFormData["status"],
          isGap: editData.isGap,
          gapDescription: editData.gapDescription ?? "",
        });
      } else {
        reset({
          planCode: "",
          year: new Date().getFullYear(),
          initiativeName: "",
          description: "",
          domain: "APLIKASI",
          priority: 3,
          budget: undefined,
          budgetCode: "",
          fundingSource: "",
          status: "PLANNED",
          isGap: false,
          gapDescription: "",
        });
      }
    }
  }, [open, editData, reset]);

  const createMutation = useMutation({
    mutationFn: trpc.planning.create.mutationOptions().mutationFn,
    onSuccess: () => {
      toast.success("Inisiatif berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: [["planning"]] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menambahkan inisiatif");
    },
  });

  const updateMutation = useMutation({
    mutationFn: trpc.planning.update.mutationOptions().mutationFn,
    onSuccess: () => {
      toast.success("Inisiatif berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: [["planning"]] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Gagal memperbarui inisiatif");
    },
  });

  const onSubmit = (data: PlanFormData) => {
    const payload = {
      ...data,
      budget: data.budget ? Number(data.budget) : undefined,
      quarter: data.quarter ? Number(data.quarter) : undefined,
    };

    if (isEditing && editData) {
      updateMutation.mutate({ id: editData.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Inisiatif SPBE" : "Tambah Inisiatif SPBE Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui data inisiatif strategis SPBE"
              : "Daftarkan inisiatif strategis baru ke dalam Peta Rencana SPBE"}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Informasi Dasar</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="planCode">
                  Kode Inisiatif <span className="text-red-500">*</span>
                </Label>
                <Input
                  disabled={isEditing}
                  id="planCode"
                  placeholder="PLAN-XXXX"
                  {...register("planCode")}
                />
                {errors.planCode && (
                  <p className="text-red-500 text-xs">
                    {errors.planCode.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">
                  Tahun Target <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="year"
                  max={2035}
                  min={2020}
                  type="number"
                  {...register("year")}
                />
                {errors.year && (
                  <p className="text-red-500 text-xs">{errors.year.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initiativeName">
                Nama Inisiatif <span className="text-red-500">*</span>
              </Label>
              <Input
                id="initiativeName"
                placeholder="Nama inisiatif strategis..."
                {...register("initiativeName")}
              />
              {errors.initiativeName && (
                <p className="text-red-500 text-xs">
                  {errors.initiativeName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                placeholder="Deskripsi detail inisiatif..."
                rows={3}
                {...register("description")}
              />
            </div>
          </div>

          {/* Domain & Priority Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Domain & Prioritas</h3>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>
                  Domain SPBE <span className="text-red-500">*</span>
                </Label>
                <Controller
                  control={control}
                  name="domain"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {domainOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Kuartal</Label>
                <Controller
                  control={control}
                  name="quarter"
                  render={({ field }) => (
                    <Select
                      onValueChange={(v) =>
                        field.onChange(v ? Number(v) : undefined)
                      }
                      value={field.value?.toString()}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {quarterOptions.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value.toString()}
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Prioritas <span className="text-red-500">*</span>
                </Label>
                <Controller
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <Select
                      onValueChange={(v) => field.onChange(Number(v))}
                      value={field.value.toString()}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value.toString()}
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Budget Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Informasi Anggaran</h3>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="budget">Anggaran (Rp)</Label>
                <Input
                  id="budget"
                  min={0}
                  placeholder="0"
                  type="number"
                  {...register("budget")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budgetCode">Kode RKA-PD</Label>
                <Input
                  id="budgetCode"
                  placeholder="Kode anggaran..."
                  {...register("budgetCode")}
                />
              </div>

              <div className="space-y-2">
                <Label>Sumber Dana</Label>
                <Controller
                  control={control}
                  name="fundingSource"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fundingSourceOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Gap Analysis Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Konteks Gap Analysis</h3>

            <div className="flex items-center gap-2">
              <input
                className="h-4 w-4 rounded border-gray-300"
                id="isGap"
                type="checkbox"
                {...register("isGap")}
              />
              <Label className="font-normal" htmlFor="isGap">
                Inisiatif ini mengisi gap arsitektur
              </Label>
            </div>

            {isGap && (
              <div className="space-y-2">
                <Label htmlFor="gapDescription">Deskripsi Gap</Label>
                <Textarea
                  id="gapDescription"
                  placeholder="Jelaskan gap apa yang diisi oleh inisiatif ini..."
                  rows={2}
                  {...register("gapDescription")}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Batal
            </DialogClose>
            <Button disabled={isPending} type="submit">
              {getSubmitButtonText(isPending, isEditing)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getSubmitButtonText(isPending: boolean, isEditing: boolean): string {
  if (isPending) {
    return "Menyimpan...";
  }
  if (isEditing) {
    return "Simpan Perubahan";
  }
  return "Tambah Inisiatif";
}
