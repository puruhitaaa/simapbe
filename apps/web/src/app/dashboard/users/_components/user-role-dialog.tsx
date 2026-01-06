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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

type UserRole = "SUPER_ADMIN" | "OPERATOR" | "AUDITOR" | "LEADER";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface UserRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

const roleFormSchema = z.object({
  role: z.enum(["SUPER_ADMIN", "OPERATOR", "AUDITOR", "LEADER"]),
});

type RoleFormData = z.infer<typeof roleFormSchema>;

export function UserRoleDialog({
  open,
  onOpenChange,
  user,
}: UserRoleDialogProps) {
  const queryClient = useQueryClient();

  const { data: roles } = useQuery({
    ...trpc.user.getRoles.queryOptions(),
  });

  const { control, reset, handleSubmit } = useForm<RoleFormData>({
    defaultValues: {
      role: "OPERATOR",
    },
  });

  // Reset form when dialog opens with user data
  useEffect(() => {
    if (open && user) {
      reset({
        role: user.role,
      });
    }
  }, [open, user, reset]);

  const setRoleMutation = useMutation({
    mutationFn: trpc.user.setRole.mutationOptions().mutationFn,
    onMutate: async ({ userId, role }) => {
      await queryClient.cancelQueries({ queryKey: [["user", "list"]] });
      const previousData = queryClient.getQueryData([["user", "list"]]);

      queryClient.setQueriesData(
        { queryKey: [["user", "list"]] },
        (old: { items?: Array<{ id: string; role: string }> } | undefined) => {
          if (!old?.items) {
            return old;
          }
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === userId ? { ...item, role } : item
            ),
          };
        }
      );

      onOpenChange(false);
      toast.success("Role berhasil diperbarui");
      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([["user", "list"]], context.previousData);
      }
      toast.error(error.message || "Gagal memperbarui role");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [["user", "list"]] });
    },
  });

  const onSubmit = (data: RoleFormData) => {
    if (!user) {
      return;
    }
    setRoleMutation.mutate({ userId: user.id, role: data.role });
  };

  const isPending = setRoleMutation.isPending;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Ubah Role Pengguna</DialogTitle>
          <DialogDescription>
            Ubah role untuk <strong>{user?.name}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="role">
                Role
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
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Batal
            </DialogClose>
            <Button disabled={isPending} type="submit">
              {isPending ? "Menyimpan..." : "Simpan Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
