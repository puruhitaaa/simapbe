"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Shield, XCircle } from "lucide-react";
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
import { useTRPC } from "@/utils/trpc";

interface DataValidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    id: string;
    dataCode: string;
    dataName: string;
    classification: string;
    format: string;
    isValidated: boolean;
  } | null;
}

export function DataValidateDialog({
  open,
  onOpenChange,
  data,
}: DataValidateDialogProps) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const validateMutation = useMutation({
    ...trpc.data.validateMetadata.mutationOptions(),
    onSuccess: (result) => {
      if (result.isValidated) {
        toast.success("Standar data berhasil divalidasi");
      } else {
        toast.info("Validasi standar data dibatalkan");
      }
      queryClient.invalidateQueries({ queryKey: [["data", "list"]] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Gagal memvalidasi standar data");
    },
  });

  const handleValidate = (approve: boolean) => {
    if (data) {
      validateMutation.mutate({ id: data.id, approve });
    }
  };

  if (!data) return null;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Validasi Walidata
          </DialogTitle>
          <DialogDescription>
            Sebagai Walidata (Diskominfo), Anda dapat memvalidasi atau menolak
            standar data ini sesuai prinsip Satu Data Indonesia.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-muted/50 p-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Kode:</dt>
              <dd className="font-medium">{data.dataCode}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Nama:</dt>
              <dd className="font-medium">{data.dataName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Klasifikasi:</dt>
              <dd className="font-medium">{data.classification}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Format:</dt>
              <dd className="font-medium">{data.format}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status:</dt>
              <dd className="font-medium">
                {data.isValidated ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-4 w-4" /> Tervalidasi
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600">
                    <XCircle className="h-4 w-4" /> Belum Tervalidasi
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
          {data.isValidated ? (
            <Button
              disabled={validateMutation.isPending}
              onClick={() => handleValidate(false)}
              variant="destructive"
            >
              <XCircle className="mr-2 h-4 w-4" />
              {validateMutation.isPending
                ? "Memproses..."
                : "Batalkan Validasi"}
            </Button>
          ) : (
            <Button
              disabled={validateMutation.isPending}
              onClick={() => handleValidate(true)}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {validateMutation.isPending ? "Memproses..." : "Validasi"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
