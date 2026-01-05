"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DomainPageShell } from "../_components/domain-page-shell";
import { DataDeleteDialog } from "./_components/data-delete-dialog";
import { DataFormDialog } from "./_components/data-form-dialog";
import { DataStandardTable } from "./_components/data-table";
import { DataValidateDialog } from "./_components/data-validate-dialog";

type DataStandardData = {
  id: string;
  dataCode: string;
  dataName: string;
  description: string | null;
  format: string;
  validityPeriod: string;
  updateFrequency: string | null;
  classification: "PUBLIC" | "RESTRICTED" | "SECRET";
  isValidated: boolean;
  producerOpd: { id: string; name: string } | null;
};

export default function DataPage() {
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [selectedData, setSelectedData] = useState<DataStandardData | null>(
    null
  );

  const handleEdit = (data: DataStandardData) => {
    setSelectedData(data);
    setShowFormDialog(true);
  };

  const handleDelete = (data: DataStandardData) => {
    setSelectedData(data);
    setShowDeleteDialog(true);
  };

  const handleValidate = (data: DataStandardData) => {
    setSelectedData(data);
    setShowValidateDialog(true);
  };

  const handleCloseFormDialog = (open: boolean) => {
    setShowFormDialog(open);
    if (!open) setSelectedData(null);
  };

  const handleCloseDeleteDialog = (open: boolean) => {
    setShowDeleteDialog(open);
    if (!open) setSelectedData(null);
  };

  const handleCloseValidateDialog = (open: boolean) => {
    setShowValidateDialog(open);
    if (!open) setSelectedData(null);
  };

  return (
    <DomainPageShell
      actions={
        <Button onClick={() => setShowFormDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Standar Data
        </Button>
      }
      description="Domain 2 - Standar Data sesuai prinsip Satu Data Indonesia"
      title="Data & Informasi"
    >
      <DataStandardTable
        onDelete={handleDelete}
        onEdit={handleEdit}
        onValidate={handleValidate}
      />

      <DataFormDialog
        editData={selectedData}
        onOpenChange={handleCloseFormDialog}
        open={showFormDialog}
      />

      <DataDeleteDialog
        data={selectedData}
        onOpenChange={handleCloseDeleteDialog}
        open={showDeleteDialog}
      />

      <DataValidateDialog
        data={selectedData}
        onOpenChange={handleCloseValidateDialog}
        open={showValidateDialog}
      />
    </DomainPageShell>
  );
}
