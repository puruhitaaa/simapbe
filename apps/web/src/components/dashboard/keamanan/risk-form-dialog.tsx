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
import { useTRPC } from "@/utils/trpc";

const riskFormSchema = z.object({
  riskCode: z
    .string()
    .min(3, "Kode minimal 3 karakter")
    .regex(/^RISK-[A-Z0-9-]+$/, "Format kode: RISK-XXXX"),
  riskDescription: z.string().min(10, "Deskripsi risiko minimal 10 karakter"),
  riskCategory: z.string().optional(),
  impactLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  likelihoodLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  mitigationPlan: z.string().optional(),
  mitigationStatus: z.string().optional(),
  responsiblePerson: z.string().optional(),
  opdId: z.string().min(1, "OPD wajib dipilih"),
});

type RiskFormData = z.infer<typeof riskFormSchema>;

interface RiskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    id: string;
    riskCode: string;
    riskDescription: string;
    riskCategory: string | null;
    impactLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    likelihoodLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    mitigationPlan: string | null;
    mitigationStatus: string | null;
    responsiblePerson: string | null;
    opd: { id: string } | null;
  } | null;
}

const riskLevels = [
  { value: "LOW", label: "Rendah (Low)" },
  { value: "MEDIUM", label: "Sedang (Medium)" },
  { value: "HIGH", label: "Tinggi (High)" },
  { value: "CRITICAL", label: "Kritis (Critical)" },
];

const riskCategories = [
  { value: "OPERASIONAL", label: "Operasional" },
  { value: "TEKNOLOGI", label: "Teknologi" },
  { value: "KEAMANAN", label: "Keamanan Siber" },
  { value: "KEPATUHAN", label: "Kepatuhan Regulasi" },
  { value: "STRATEGIS", label: "Strategis" },
];

export function RiskFormDialog({
  open,
  onOpenChange,
  editData,
}: RiskFormDialogProps) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
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
  } = useForm<RiskFormData>({
    defaultValues: {
      riskCode: "",
      riskDescription: "",
      riskCategory: "",
      impactLevel: "LOW",
      likelihoodLevel: "LOW",
      mitigationPlan: "",
      mitigationStatus: "",
      responsiblePerson: "",
      opdId: "",
    },
  });

  useEffect(() => {
    if (open && editData) {
      reset({
        riskCode: editData.riskCode,
        riskDescription: editData.riskDescription,
        riskCategory: editData.riskCategory ?? "",
        impactLevel: editData.impactLevel,
        likelihoodLevel: editData.likelihoodLevel,
        mitigationPlan: editData.mitigationPlan ?? "",
        mitigationStatus: editData.mitigationStatus ?? "",
        responsiblePerson: editData.responsiblePerson ?? "",
        opdId: editData.opd?.id ?? "",
      });
    } else if (open && !editData) {
      reset({
        riskCode: "",
        riskDescription: "",
        riskCategory: "",
        impactLevel: "LOW",
        likelihoodLevel: "LOW",
        mitigationPlan: "",
        mitigationStatus: "",
        responsiblePerson: "",
        opdId: "",
      });
    }
  }, [open, editData, reset]);

  const createMutation = useMutation({
    mutationFn: trpc.security.createRisk.mutationOptions().mutationFn,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({
        queryKey: [["security", "listRisks"]],
      });
      const previousData = queryClient.getQueryData([
        ["security", "listRisks"],
      ]);
      queryClient.setQueriesData(
        { queryKey: [["security", "listRisks"]] },
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
      toast.success("Risiko berhasil ditambahkan");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [["security", "listRisks"]],
          context.previousData
        );
      }
      toast.error(error.message || "Gagal menambahkan risiko");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["security", "listRisks"]] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: trpc.security.updateRisk.mutationOptions().mutationFn,
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries({
        queryKey: [["security", "listRisks"]],
      });
      const previousData = queryClient.getQueryData([
        ["security", "listRisks"],
      ]);
      queryClient.setQueriesData(
        { queryKey: [["security", "listRisks"]] },
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
      toast.success("Risiko berhasil diperbarui");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [["security", "listRisks"]],
          context.previousData
        );
      }
      toast.error(error.message || "Gagal memperbarui risiko");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["security", "listRisks"]] });
    },
  });

  const onSubmit = (data: RiskFormData) => {
    const cleanedData = {
      ...data,
      riskCategory: data.riskCategory || undefined,
      mitigationPlan: data.mitigationPlan || undefined,
      mitigationStatus: data.mitigationStatus || undefined,
      responsiblePerson: data.responsiblePerson || undefined,
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
            {isEditing ? "Edit Risiko" : "Registrasi Risiko Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui informasi risiko"
              : "Daftarkan risiko baru ke dalam register"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="riskCode">
                Kode *
              </Label>
              <div className="col-span-3">
                <Input
                  id="riskCode"
                  placeholder="RISK-CYBER-001"
                  {...register("riskCode")}
                  disabled={isEditing}
                />
                {errors.riskCode && (
                  <p className="mt-1 text-destructive text-xs">
                    {errors.riskCode.message}
                  </p>
                )}
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
                    <Select
                      disabled={isEditing}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {(value: string) => {
                            if (!value) return "Pilih OPD";
                            const selectedOpd = opdList?.items?.find(
                              (opd) => opd.id === value
                            );
                            return selectedOpd
                              ? `${selectedOpd.acronym || selectedOpd.code} - ${selectedOpd.name}`
                              : "Pilih OPD";
                          }}
                        </SelectValue>
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
              <Label className="text-right" htmlFor="riskCategory">
                Kategori
              </Label>
              <div className="col-span-3">
                <Controller
                  control={control}
                  name="riskCategory"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {riskCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="impactLevel">
                Dampak *
              </Label>
              <div className="col-span-3">
                <Controller
                  control={control}
                  name="impactLevel"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {riskLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="likelihoodLevel">
                Kemungkinan *
              </Label>
              <div className="col-span-3">
                <Controller
                  control={control}
                  name="likelihoodLevel"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {riskLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="pt-2 text-right" htmlFor="riskDescription">
                Deskripsi *
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="riskDescription"
                  placeholder="Jelaskan risiko secara detail..."
                  rows={3}
                  {...register("riskDescription")}
                />
                {errors.riskDescription && (
                  <p className="mt-1 text-destructive text-xs">
                    {errors.riskDescription.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="pt-2 text-right" htmlFor="mitigationPlan">
                Rencana Mitigasi
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="mitigationPlan"
                  placeholder="Langkah-langkah mitigasi..."
                  rows={2}
                  {...register("mitigationPlan")}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="responsiblePerson">
                Penanggung Jawab
              </Label>
              <div className="col-span-3">
                <Input
                  id="responsiblePerson"
                  placeholder="Nama penanggung jawab"
                  {...register("responsiblePerson")}
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
                  : "Registrasi Risiko"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
