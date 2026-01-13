"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTRPC } from "@/utils/trpc";

interface DuplicationCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DuplicationCheckDialog({
  open,
  onOpenChange,
}: DuplicationCheckDialogProps) {
  const trpc = useTRPC();
  const [appName, setAppName] = useState("");
  const [checkName, setCheckName] = useState("");
  const [hasChecked, setHasChecked] = useState(false);

  // Duplication check query - only runs when checkName is set
  const {
    data: result,
    isFetching,
    refetch,
  } = useQuery({
    ...trpc.app.checkDuplication.queryOptions({ name: checkName }),
    enabled: false, // Manual trigger only
  });

  // Handle result when it arrives
  const handleResult = useCallback(() => {
    if (result && hasChecked) {
      if (result.isDuplicate) {
        toast.warning(
          `Ditemukan ${result.similarApps.length} aplikasi serupa!`
        );
      } else {
        toast.success("Tidak ditemukan aplikasi serupa.");
      }
    }
  }, [result, hasChecked]);

  useEffect(() => {
    handleResult();
  }, [handleResult]);

  const handleCheck = () => {
    if (appName.length < 3) {
      toast.error("Nama aplikasi minimal 3 karakter");
      return;
    }
    setCheckName(appName);
    setHasChecked(true);
    // Use setTimeout to ensure state is updated before refetch
    setTimeout(() => {
      refetch();
    }, 0);
  };

  const handleClose = () => {
    setAppName("");
    setCheckName("");
    setHasChecked(false);
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Cek Duplikasi Aplikasi
          </DialogTitle>
          <DialogDescription>
            Periksa apakah aplikasi serupa sudah ada dalam sistem sebelum
            mengajukan aplikasi baru (Moratorium Pembangunan Aplikasi).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="checkName">Nama Aplikasi</Label>
            <div className="flex gap-2">
              <Input
                id="checkName"
                onChange={(e) => setAppName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                placeholder="Sistem Informasi..."
                value={appName}
              />
              <Button
                disabled={appName.length < 3 || isFetching}
                onClick={handleCheck}
                type="button"
              >
                {isFetching ? "Memeriksa..." : "Cek"}
              </Button>
            </div>
          </div>

          {result && (
            <div className="rounded-lg border p-4">
              {result.isDuplicate ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">
                      Ditemukan {result.similarApps.length} aplikasi serupa
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Aplikasi berikut memiliki fungsi yang mungkin tumpang
                    tindih. Pertimbangkan untuk menggunakan aplikasi yang sudah
                    ada.
                  </p>
                  <ul className="space-y-2">
                    {result.similarApps.map((app) => (
                      <li
                        className="flex items-center justify-between rounded border bg-muted/50 p-2 text-sm"
                        key={app.id}
                      >
                        <div>
                          <span className="font-medium">{app.code}</span>
                          <span className="mx-2">-</span>
                          <span>{app.name}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {app.similarity}% mirip
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">
                    Tidak ditemukan aplikasi serupa. Anda dapat melanjutkan
                    pengajuan.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Tutup</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
