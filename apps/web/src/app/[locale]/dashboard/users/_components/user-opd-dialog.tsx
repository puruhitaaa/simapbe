"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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

interface User {
  id: string;
  name: string;
  email: string;
  opdId: string | null;
  opd: {
    id: string;
    code: string;
    name: string;
  } | null;
}

interface UserOpdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function UserOpdDialog({
  open,
  onOpenChange,
  user,
}: UserOpdDialogProps) {
  const queryClient = useQueryClient();
  const [selectedOpdId, setSelectedOpdId] = useState<string>("");

  const { data: opdList, isLoading: isLoadingOpds } = useQuery({
    ...trpc.opd.list.queryOptions({ limit: 100 }),
    enabled: open,
  });

  // Reset selection when dialog opens with user data
  useEffect(() => {
    if (open && user) {
      setSelectedOpdId(user.opdId || "");
    }
  }, [open, user]);

  const assignOpdMutation = useMutation({
    ...trpc.user.assignOpd.mutationOptions(),
    onSuccess: () => {
      toast.success("OPD berhasil diassign");
      queryClient.invalidateQueries({ queryKey: [["user", "list"]] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Gagal assign OPD");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      return;
    }
    assignOpdMutation.mutate({
      userId: user.id,
      opdId: selectedOpdId || null,
    });
  };

  const handleClearOpd = () => {
    if (!user) {
      return;
    }
    assignOpdMutation.mutate({ userId: user.id, opdId: null });
  };

  const isPending = assignOpdMutation.isPending;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Assign OPD</DialogTitle>
          <DialogDescription>
            Assign <strong>{user?.name}</strong> ke Organisasi Perangkat Daerah
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="opd">
                OPD
              </Label>
              <div className="col-span-3">
                <Select
                  disabled={isLoadingOpds}
                  onValueChange={(value) => setSelectedOpdId(value ?? "")}
                  value={selectedOpdId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: string) => {
                        if (!value) {
                          return isLoadingOpds ? "Memuat..." : "Pilih OPD";
                        }
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
              </div>
            </div>
            {user?.opd && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-1" />
                <div className="col-span-3">
                  <p className="text-muted-foreground text-sm">
                    Saat ini: <strong>{user.opd.name}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            {user?.opdId && (
              <Button
                disabled={isPending}
                onClick={handleClearOpd}
                type="button"
                variant="outline"
              >
                Hapus OPD
              </Button>
            )}
            <DialogClose render={<Button variant="ghost" />}>Batal</DialogClose>
            <Button disabled={isPending || !selectedOpdId} type="submit">
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
