"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ScrollArea } from "@/components/ui/scroll-area";

interface ColumnOption {
  id: string;
  label: string;
  required?: boolean;
}

interface ColumnSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  columns: ColumnOption[];
  onConfirm: (selectedColumns: string[]) => void;
  isPending?: boolean;
}

export function ColumnSelectorDialog({
  open,
  onOpenChange,
  title = "Pilih Kolom Template",
  description = "Pilih kolom yang ingin Anda sertakan dalam template Excel.",
  columns,
  onConfirm,
  isPending,
}: ColumnSelectorDialogProps) {
  // Initialize with all columns selected by default
  const [selected, setSelected] = useState<string[]>(columns.map((c) => c.id));

  const toggleColumn = (id: string) => {
    // Prevent unchecking required columns
    const column = columns.find((c) => c.id === id);
    if (column?.required) return;

    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selected.length === columns.length) {
      // Deselect all (except required)
      setSelected(columns.filter((c) => c.required).map((c) => c.id));
    } else {
      // Select all
      setSelected(columns.map((c) => c.id));
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 py-4">
          <Button
            className="w-full"
            onClick={handleSelectAll}
            size="sm"
            variant="outline"
          >
            {selected.length === columns.length ? "Deselect All" : "Select All"}
          </Button>
        </div>

        <ScrollArea className="h-[300px] rounded-md border p-4">
          <div className="space-y-4">
            {columns.map((col) => (
              <div className="flex items-center space-x-2" key={col.id}>
                <Checkbox
                  checked={selected.includes(col.id)}
                  disabled={col.required}
                  id={col.id}
                  onCheckedChange={() => toggleColumn(col.id)}
                />
                <Label
                  className="flex-1 cursor-pointer font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor={col.id}
                >
                  {col.label}{" "}
                  {col.required && <span className="text-destructive">*</span>}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Batal</Button>} />
          <Button
            disabled={isPending || selected.length === 0}
            onClick={() => onConfirm(selected)}
          >
            {isPending ? "Generating..." : "Download Template"}
            {!isPending && <Download className="ml-2 h-4 w-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
