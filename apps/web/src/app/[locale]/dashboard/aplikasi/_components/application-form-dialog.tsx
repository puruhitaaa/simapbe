"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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

const applicationFormSchema = z.object({
  code: z
    .string()
    .min(3, "Kode minimal 3 karakter")
    .regex(/^APP-[A-Z0-9-]+$/, "Format kode: APP-XXXX"),
  name: z.string().min(3, "Nama minimal 3 karakter"),
  description: z.string().optional(),
  type: z.enum(["UMUM", "KHUSUS"]),
  platform: z.enum(["WEB", "MOBILE", "DESKTOP", "API"]),
  status: z.enum(["PLANNING", "DEVELOPMENT", "ACTIVE", "ARCHIVED"]),
  programmingLang: z.string().optional(),
  framework: z.string().optional(),
  databaseType: z.string().optional(),
  repositoryUrl: z
    .string()
    .url("Format URL tidak valid")
    .optional()
    .or(z.literal("")),
  opdId: z.string().min(1, "OPD wajib dipilih"),
});

type ApplicationFormData = z.infer<typeof applicationFormSchema>;

interface ApplicationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    type: "UMUM" | "KHUSUS";
    platform: "WEB" | "MOBILE" | "DESKTOP" | "API";
    status: "PLANNING" | "DEVELOPMENT" | "ACTIVE" | "ARCHIVED";
    programmingLang: string | null;
    framework: string | null;
    databaseType: string | null;
    repositoryUrl: string | null;
    opd: { id: string } | null;
  } | null;
}

const appTypes = [
  { value: "UMUM", label: "Umum (Nasional/Berbagi)" },
  { value: "KHUSUS", label: "Khusus (Spesifik OPD)" },
];

const platforms = [
  { value: "WEB", label: "Web Application" },
  { value: "MOBILE", label: "Mobile App" },
  { value: "DESKTOP", label: "Desktop App" },
  { value: "API", label: "API/Web Service" },
];

const statuses = [
  { value: "PLANNING", label: "Perencanaan" },
  { value: "DEVELOPMENT", label: "Pengembangan" },
  { value: "ACTIVE", label: "Aktif/Produksi" },
  { value: "ARCHIVED", label: "Arsip/Nonaktif" },
];

export function ApplicationFormDialog({
  open,
  onOpenChange,
  editData,
}: ApplicationFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!editData;
  const [duplicationChecked, setDuplicationChecked] = useState(false);
  const [checkName, setCheckName] = useState("");

  // Fetch OPDs for dropdown
  const { data: opdList } = useQuery({
    ...trpc.opd.list.queryOptions(),
    enabled: open,
  });

  // Duplication check query - only runs when checkName is set
  const {
    data: duplicationResult,
    isFetching: isCheckingDuplication,
    refetch: runDuplicationCheck,
  } = useQuery({
    ...trpc.app.checkDuplication.queryOptions({ name: checkName }),
    enabled: false, // Manual trigger only
  });

  // Handle duplication check result
  const handleDuplicationResult = useCallback(() => {
    if (duplicationResult) {
      setDuplicationChecked(true);
      if (duplicationResult.isDuplicate) {
        toast.warning("Ditemukan aplikasi serupa! Periksa daftar di bawah.");
      } else {
        toast.success("Tidak ditemukan duplikasi. Anda dapat melanjutkan.");
      }
    }
  }, [duplicationResult]);

  useEffect(() => {
    handleDuplicationResult();
  }, [handleDuplicationResult]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    defaultValues: {
      code: "",
      name: "",
      description: "",
      type: "KHUSUS",
      platform: "WEB",
      status: "PLANNING",
      programmingLang: "",
      framework: "",
      databaseType: "",
      repositoryUrl: "",
      opdId: "",
    },
  });

  const appName = watch("name");

  useEffect(() => {
    if (open && editData) {
      reset({
        code: editData.code,
        name: editData.name,
        description: editData.description ?? "",
        type: editData.type,
        platform: editData.platform,
        status: editData.status,
        programmingLang: editData.programmingLang ?? "",
        framework: editData.framework ?? "",
        databaseType: editData.databaseType ?? "",
        repositoryUrl: editData.repositoryUrl ?? "",
        opdId: editData.opd?.id ?? "",
      });
      setDuplicationChecked(true); // Skip check for edit
      setCheckName("");
    } else if (open && !editData) {
      reset({
        code: "",
        name: "",
        description: "",
        type: "KHUSUS",
        platform: "WEB",
        status: "PLANNING",
        programmingLang: "",
        framework: "",
        databaseType: "",
        repositoryUrl: "",
        opdId: "",
      });
      setDuplicationChecked(false);
      setCheckName("");
    }
  }, [open, editData, reset]);

  // Reset duplication check when name changes
  useEffect(() => {
    if (!isEditing && appName !== checkName) {
      setDuplicationChecked(false);
    }
  }, [appName, isEditing, checkName]);

  const handleCheckDuplication = () => {
    if (appName && appName.length >= 3) {
      setCheckName(appName);
      // Use setTimeout to ensure state is updated before refetch
      setTimeout(() => {
        runDuplicationCheck();
      }, 0);
    } else {
      toast.error("Nama aplikasi minimal 3 karakter untuk pengecekan");
    }
  };

  const createMutation = useMutation({
    mutationFn: trpc.app.register.mutationOptions().mutationFn,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: [["app", "list"]] });
      const previousData = queryClient.getQueryData([["app", "list"]]);
      queryClient.setQueriesData(
        { queryKey: [["app", "list"]] },
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
      toast.success("Aplikasi berhasil diajukan");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([["app", "list"]], context.previousData);
      }
      toast.error(error.message || "Gagal mengajukan aplikasi");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["app", "list"]] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: trpc.app.update.mutationOptions().mutationFn,
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries({ queryKey: [["app", "list"]] });
      const previousData = queryClient.getQueryData([["app", "list"]]);
      queryClient.setQueriesData(
        { queryKey: [["app", "list"]] },
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
      toast.success("Aplikasi berhasil diperbarui");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([["app", "list"]], context.previousData);
      }
      toast.error(error.message || "Gagal memperbarui aplikasi");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["app", "list"]] });
    },
  });

  const onSubmit = (formData: ApplicationFormData) => {
    // Require duplication check for new apps
    if (!(isEditing || duplicationChecked)) {
      toast.error("Harap lakukan pengecekan duplikasi terlebih dahulu");
      return;
    }

    const cleanedData = {
      ...formData,
      description: formData.description || undefined,
      programmingLang: formData.programmingLang || undefined,
      framework: formData.framework || undefined,
      databaseType: formData.databaseType || undefined,
      repositoryUrl: formData.repositoryUrl || undefined,
    };

    if (isEditing && editData) {
      updateMutation.mutate({ id: editData.id, ...cleanedData });
    } else {
      createMutation.mutate(cleanedData);
    }
  };

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    isCheckingDuplication;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Aplikasi" : "Ajukan Aplikasi Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui informasi aplikasi"
              : "Ajukan aplikasi baru dengan pengecekan moratorium duplikasi"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Moratorium Check Section */}
            {!isEditing && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Pengecekan Moratorium</h4>
                    <p className="text-muted-foreground text-sm">
                      Cek duplikasi sebelum mengajukan aplikasi baru
                    </p>
                  </div>
                  <Button
                    disabled={!appName || appName.length < 3 || isPending}
                    onClick={handleCheckDuplication}
                    type="button"
                    variant="outline"
                  >
                    {isCheckingDuplication ? "Memeriksa..." : "Cek Duplikasi"}
                  </Button>
                </div>
                {duplicationResult && (
                  <div className="mt-3">
                    {duplicationResult.isDuplicate ? (
                      <div className="rounded border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">
                            Ditemukan {duplicationResult.similarApps.length}{" "}
                            aplikasi serupa
                          </span>
                        </div>
                        <ul className="mt-2 space-y-1 text-sm">
                          {duplicationResult.similarApps.map((app) => (
                            <li key={app.id}>
                              {app.code} - {app.name} ({app.similarity}% mirip)
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Tidak ditemukan duplikasi</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="code">
                Kode *
              </Label>
              <div className="col-span-3">
                <Input
                  id="code"
                  placeholder="APP-DINKES-001"
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
                  placeholder="Sistem Informasi Kesehatan"
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
                        {appTypes.map((type) => (
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
              <Label className="text-right" htmlFor="platform">
                Platform *
              </Label>
              <div className="col-span-3">
                <Controller
                  control={control}
                  name="platform"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map((platform) => (
                          <SelectItem
                            key={platform.value}
                            value={platform.value}
                          >
                            {platform.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
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
                        {statuses.map((status) => (
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
              <Label className="text-right" htmlFor="programmingLang">
                Bahasa Pemrograman
              </Label>
              <div className="col-span-3">
                <Input
                  id="programmingLang"
                  placeholder="TypeScript, PHP, Java..."
                  {...register("programmingLang")}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="framework">
                Framework
              </Label>
              <div className="col-span-3">
                <Input
                  id="framework"
                  placeholder="Next.js, Laravel, Spring..."
                  {...register("framework")}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="databaseType">
                Database
              </Label>
              <div className="col-span-3">
                <Input
                  id="databaseType"
                  placeholder="PostgreSQL, MySQL, MongoDB..."
                  {...register("databaseType")}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="repositoryUrl">
                Repository URL
              </Label>
              <div className="col-span-3">
                <Input
                  id="repositoryUrl"
                  placeholder="https://github.com/..."
                  {...register("repositoryUrl")}
                />
                {errors.repositoryUrl && (
                  <p className="mt-1 text-destructive text-xs">
                    {errors.repositoryUrl.message}
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
                  placeholder="Deskripsi aplikasi..."
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
            <Button
              disabled={isPending || !(isEditing || duplicationChecked)}
              type="submit"
            >
              {isPending
                ? "Menyimpan..."
                : isEditing
                  ? "Simpan Perubahan"
                  : "Ajukan Aplikasi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
