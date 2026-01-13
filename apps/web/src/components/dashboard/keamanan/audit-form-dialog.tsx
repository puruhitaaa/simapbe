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

const auditFormSchema = z.object({
  appId: z.string().min(1, "Aplikasi wajib dipilih"),
  auditDate: z.string().min(1, "Tanggal audit wajib diisi"),
  auditor: z.string().optional(),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
  status: z.enum(["PENDING", "PASSED", "FAILED_REMEDIATION_REQUIRED"]),
});

type AuditFormData = z.infer<typeof auditFormSchema>;

interface AuditFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    id: string;
    auditDate: string;
    auditor: string | null;
    findings: string | null;
    recommendations: string | null;
    score: number | null;
    status: "PENDING" | "PASSED" | "FAILED_REMEDIATION_REQUIRED";
    app: { id: string } | null;
  } | null;
}

const auditStatuses = [
  { value: "PENDING", label: "Menunggu (Pending)" },
  { value: "PASSED", label: "Lulus (Passed)" },
  {
    value: "FAILED_REMEDIATION_REQUIRED",
    label: "Gagal - Perlu Perbaikan",
  },
];

export function AuditFormDialog({
  open,
  onOpenChange,
  editData,
}: AuditFormDialogProps) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const isEditing = !!editData;

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
  } = useForm<AuditFormData>({
    defaultValues: {
      appId: "",
      auditDate: new Date().toISOString().split("T")[0],
      auditor: "",
      findings: "",
      recommendations: "",
      score: undefined,
      status: "PENDING",
    },
  });

  useEffect(() => {
    if (open && editData) {
      reset({
        appId: editData.app?.id ?? "",
        auditDate: editData.auditDate.split("T")[0],
        auditor: editData.auditor ?? "",
        findings: editData.findings ?? "",
        recommendations: editData.recommendations ?? "",
        score: editData.score ?? undefined,
        status: editData.status,
      });
    } else if (open && !editData) {
      reset({
        appId: "",
        auditDate: new Date().toISOString().split("T")[0],
        auditor: "",
        findings: "",
        recommendations: "",
        score: undefined,
        status: "PENDING",
      });
    }
  }, [open, editData, reset]);

  const createMutation = useMutation({
    mutationFn: trpc.security.createAudit.mutationOptions().mutationFn,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({
        queryKey: [["security", "listAudits"]],
      });
      const previousData = queryClient.getQueryData([
        ["security", "listAudits"],
      ]);
      queryClient.setQueriesData(
        { queryKey: [["security", "listAudits"]] },
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
      toast.success("Audit berhasil ditambahkan");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [["security", "listAudits"]],
          context.previousData
        );
      }
      toast.error(error.message || "Gagal menambahkan audit");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["security", "listAudits"]] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: trpc.security.updateAudit.mutationOptions().mutationFn,
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries({
        queryKey: [["security", "listAudits"]],
      });
      const previousData = queryClient.getQueryData([
        ["security", "listAudits"],
      ]);
      queryClient.setQueriesData(
        { queryKey: [["security", "listAudits"]] },
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
      toast.success("Audit berhasil diperbarui");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [["security", "listAudits"]],
          context.previousData
        );
      }
      toast.error(error.message || "Gagal memperbarui audit");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["security", "listAudits"]] });
    },
  });

  const onSubmit = (data: AuditFormData) => {
    const cleanedData = {
      ...data,
      auditDate: new Date(data.auditDate),
      auditor: data.auditor || undefined,
      findings: data.findings || undefined,
      recommendations: data.recommendations || undefined,
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
            {isEditing ? "Edit Audit" : "Tambah Audit Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui catatan audit keamanan"
              : "Catat hasil audit keamanan aplikasi"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="appId">
                Aplikasi *
              </Label>
              <div className="col-span-3">
                <Controller
                  control={control}
                  name="appId"
                  render={({ field }) => (
                    <Select
                      disabled={isEditing}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {(value: string) => {
                            if (!value) return "Pilih Aplikasi";
                            const selectedApp = appList?.items?.find(
                              (app) => app.id === value
                            );
                            return selectedApp
                              ? `${selectedApp.code} - ${selectedApp.name}`
                              : "Pilih Aplikasi";
                          }}
                        </SelectValue>
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
              <Label className="text-right" htmlFor="auditDate">
                Tanggal Audit *
              </Label>
              <div className="col-span-3">
                <Input
                  id="auditDate"
                  type="date"
                  {...register("auditDate")}
                  disabled={isEditing}
                />
                {errors.auditDate && (
                  <p className="mt-1 text-destructive text-xs">
                    {errors.auditDate.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="auditor">
                Auditor
              </Label>
              <div className="col-span-3">
                <Input
                  id="auditor"
                  placeholder="Nama auditor"
                  {...register("auditor")}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="status">
                Status *
              </Label>
              <div className="col-span-3">
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {auditStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="score">
                Skor (0-100)
              </Label>
              <div className="col-span-3">
                <Input
                  id="score"
                  max={100}
                  min={0}
                  placeholder="85"
                  type="number"
                  {...register("score", { valueAsNumber: true })}
                />
                {errors.score && (
                  <p className="mt-1 text-destructive text-xs">
                    {errors.score.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="pt-2 text-right" htmlFor="findings">
                Temuan
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="findings"
                  placeholder="Temuan hasil audit..."
                  rows={3}
                  {...register("findings")}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="pt-2 text-right" htmlFor="recommendations">
                Rekomendasi
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="recommendations"
                  placeholder="Rekomendasi perbaikan..."
                  rows={2}
                  {...register("recommendations")}
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
                  : "Tambah Audit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
