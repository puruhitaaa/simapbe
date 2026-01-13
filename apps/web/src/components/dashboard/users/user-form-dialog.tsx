"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/utils/trpc";

const userFormSchema = z.object({
  email: z.email("Format email tidak valid"),
  name: z.string().min(2, "Nama minimal 2 karakter"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["SUPER_ADMIN", "OPERATOR", "AUDITOR", "LEADER"]),
  opdId: z.string().optional(),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserFormDialog({ open, onOpenChange }: UserFormDialogProps) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const [isPending, setIsPending] = useState(false);

  const { data: roles } = useQuery({
    ...trpc.user.getRoles.queryOptions(),
  });

  const { data: opdList } = useQuery({
    ...trpc.opd.list.queryOptions({ limit: 100 }),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<UserFormData>({
    defaultValues: {
      email: "",
      name: "",
      password: "",
      role: "OPERATOR",
      opdId: undefined,
    },
  });

  // Mutation to assign OPD after user creation
  const assignOpdMutation = useMutation({
    ...trpc.user.assignOpd.mutationOptions(),
  });

  // Mutation to set role after user creation
  const setRoleMutation = useMutation({
    ...trpc.user.setRole.mutationOptions(),
  });

  const onSubmit = async (data: UserFormData) => {
    setIsPending(true);

    try {
      // Step 1: Create user using better-auth's admin API
      // This handles proper password hashing
      // Note: We don't pass our custom role here, as better-auth only accepts 'user'|'admin'
      const result = await authClient.admin.createUser({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      if (result.error) {
        throw new Error(result.error.message || "Gagal membuat pengguna");
      }

      // Access the user from the result
      const user = result.data?.user;
      const userId = user?.id;

      if (!userId) {
        throw new Error("User ID not returned from creation");
      }

      // Step 2: Set our custom role via our tRPC API
      await setRoleMutation.mutateAsync({
        userId,
        role: data.role,
      });

      // Step 3: Assign OPD if provided
      if (data.opdId) {
        await assignOpdMutation.mutateAsync({
          userId,
          opdId: data.opdId,
        });
      }

      toast.success("Pengguna berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: [["user", "list"]] });
      reset();
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal membuat pengguna";
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          reset();
        }
        onOpenChange(isOpen);
      }}
      open={open}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tambah Pengguna Baru</DialogTitle>
          <DialogDescription>
            Daftarkan pengguna baru ke dalam sistem SIMAPBE
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="name">
                Nama *
              </Label>
              <div className="col-span-3">
                <Input id="name" placeholder="John Doe" {...register("name")} />
                {errors.name && (
                  <p className="mt-1 text-destructive text-xs">
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="email">
                Email *
              </Label>
              <div className="col-span-3">
                <Input
                  id="email"
                  placeholder="user@bandung.go.id"
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

            {/* Password */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="password">
                Password *
              </Label>
              <div className="col-span-3">
                <Input
                  id="password"
                  placeholder="Minimal 8 karakter"
                  type="password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="mt-1 text-destructive text-xs">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            {/* Role */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="role">
                Role *
              </Label>
              <div className="col-span-3">
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {(value: string) => {
                            if (!value) {
                              return "Pilih role";
                            }
                            const selectedRole = roles?.find(
                              (r) => r.value === value
                            );
                            return selectedRole?.label || value;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {roles?.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div>
                              <div className="font-medium">{role.label}</div>
                              <div className="text-muted-foreground text-xs">
                                {role.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* OPD */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="opd">
                OPD
              </Label>
              <div className="col-span-3">
                <Controller
                  control={control}
                  name="opdId"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {(value: string) => {
                            if (!value) {
                              return "Pilih OPD (opsional)";
                            }
                            const selectedOpd = opdList?.items?.find(
                              (opd) => opd.id === value
                            );
                            return selectedOpd
                              ? `${selectedOpd.acronym || selectedOpd.code} - ${selectedOpd.name}`
                              : "Pilih OPD (opsional)";
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {opdList?.items?.map((opd) => (
                          <SelectItem key={opd.id} value={opd.id}>
                            <span className="font-medium">
                              {opd.acronym || opd.code}
                            </span>
                            <span className="text-muted-foreground"> - </span>
                            <span className="text-muted-foreground text-sm">
                              {opd.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Batal
            </DialogClose>
            <Button disabled={isPending} type="submit">
              {isPending ? "Membuat..." : "Buat Pengguna"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
