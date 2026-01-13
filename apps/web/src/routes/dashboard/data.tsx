import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DataDeleteDialog } from "@/components/dashboard/data/data-delete-dialog";
import { DataFormDialog } from "@/components/dashboard/data/data-form-dialog";
import { DataStandardTable } from "@/components/dashboard/data/data-table";
import { DataValidateDialog } from "@/components/dashboard/data/data-validate-dialog";
import { DomainPageShell } from "@/components/dashboard/domain-page-shell";
import { ExcelDataActions } from "@/components/dashboard/excel-data-actions";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/dashboard/data")({
  component: DataPage,
});

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

const templateColumns = [
  { id: "dataCode", label: "Code (Unique)", required: true },
  { id: "dataName", label: "Name", required: true },
  { id: "description", label: "Description" },
  { id: "format", label: "Format", required: true },
  { id: "validityPeriod", label: "Validity", required: true },
  { id: "updateFrequency", label: "Update Frequency" },
  { id: "classification", label: "Classification" },
  { id: "producerOpdCode", label: "Producer OPD Code" },
];

function DataPage() {
  const trpc = useTRPC();
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [selectedData, setSelectedData] = useState<DataStandardData | null>(
    null
  );

  const queryClient = useQueryClient();

  const downloadTemplateMutation = useMutation({
    mutationFn: trpc.data.downloadTemplate.mutationOptions().mutationFn,
  });

  const exportMutation = useMutation({
    mutationFn: trpc.data.export.mutationOptions().mutationFn,
  });

  const importMutation = useMutation({
    mutationFn: trpc.data.import.mutationOptions().mutationFn,
  });

  const handleGenerateTemplate = async (columns: string[]) => {
    const base64 = await downloadTemplateMutation.mutateAsync({ columns });
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    link.download = "template-data.xlsx";
    link.click();
    toast.success("Template berhasil didownload");
  };

  const handleExportData = async () => {
    const base64 = await exportMutation.mutateAsync({});
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    link.download = "data-standards.xlsx";
    link.click();
    toast.success("Data berhasil diexport");
  };

  const handleImportData = async (fileBase64: string) => {
    const result = await importMutation.mutateAsync({ fileBase64 });
    queryClient.invalidateQueries({ queryKey: [["data", "list"]] });
    return result;
  };

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
        <>
          <ExcelDataActions
            domainName="Data Standar"
            onExportData={handleExportData}
            onGenerateTemplate={handleGenerateTemplate}
            onImportData={handleImportData}
            templateColumns={templateColumns}
          />
          <Button onClick={() => setShowFormDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Standar Data
          </Button>
        </>
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
