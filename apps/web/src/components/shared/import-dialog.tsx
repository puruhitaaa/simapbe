"use client";

import { AlertCircle, CheckCircle, FileSpreadsheet } from "lucide-react";
import { useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onImport: (fileBase64: string) => Promise<any>;
  isPending?: boolean;
}

export function ImportDialog({
  open,
  onOpenChange,
  title = "Import Data Excel",
  description = "Upload file Excel (.xlsx) untuk import data massal.",
  onImport,
  isPending,
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    inserted?: number;
    updated?: number;
    error?: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = (reader.result as string).split(",")[1];
      try {
        const res = await onImport(base64String);
        setResult({
          success: true,
          inserted: res.insertedCount,
          updated: res.updatedCount,
        });
        setFile(null);
      } catch (err: any) {
        setResult({
          success: false,
          error: err.message || "Gagal memproses file.",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClose = () => {
    onOpenChange(false);
    setFile(null);
    setResult(null);
  };

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {!result && (
          <div
            className="mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors hover:bg-muted/50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <FileSpreadsheet className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="mb-2 font-medium text-sm">
              Drag & Drop file Excel di sini
            </p>
            <p className="mb-4 text-muted-foreground text-xs">atau</p>
            <input
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleFileChange}
              ref={inputRef}
              type="file"
            />
            <Button
              onClick={() => inputRef.current?.click()}
              size="sm"
              variant="secondary"
            >
              Pilih File
            </Button>
            {file && (
              <div className="mt-4 flex items-center gap-2 text-primary text-sm">
                <FileSpreadsheet className="h-4 w-4" />
                {file.name}
              </div>
            )}
          </div>
        )}

        {isPending && (
          <div className="space-y-2 py-4">
            <Progress className="h-2" value={null} />
            <p className="text-center text-muted-foreground text-xs">
              Memproses data... Mohon tunggu.
            </p>
          </div>
        )}

        {result && result.success && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-300">
              Import Berhasil
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400">
              Data berhasil diproses.
              <ul className="mt-2 list-disc pl-5">
                <li>Data Baru: {result.inserted}</li>
                <li>Data Diupdate: {result.updated}</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {result && !result.success && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Import Gagal</AlertTitle>
            <AlertDescription className="max-h-[200px] overflow-y-auto text-xs">
              {result.error}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          {result?.success ? (
            <Button onClick={handleClose}>Selesai</Button>
          ) : (
            <>
              <Button onClick={handleClose} variant="outline">
                Batal
              </Button>
              <Button disabled={!file || isPending} onClick={handleProcess}>
                {isPending ? "Mengupload..." : "Upload & Import"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
