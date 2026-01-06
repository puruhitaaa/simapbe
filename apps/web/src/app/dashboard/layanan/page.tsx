"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { DomainPageShell } from "../_components/domain-page-shell";
import { ExcelDataActions } from "../_components/excel-data-actions";
import { ServiceDeleteDialog } from "./_components/service-delete-dialog";
import { ServiceFormDialog } from "./_components/service-form-dialog";
import { ServiceTable } from "./_components/service-table";

type ServiceData = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: "G2C" | "G2B" | "G2G" | "G2E";
  url: string | null;
  isActive: boolean;
  businessProcess: { id: string; name: string; kodeProbismet: string } | null;
  application: { id: string; name: string; code: string } | null;
};

const templateColumns = [
  { id: "code", label: "Code (Unique)", required: true },
  { id: "name", label: "Name", required: true },
  { id: "description", label: "Description" },
  { id: "type", label: "Type" },
  { id: "url", label: "URL" },
  { id: "probisCode", label: "Business Process Code", required: true },
  { id: "appCode", label: "Application Code", required: true },
];

export default function LayananPage() {
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceData | null>(
    null
  );

  const queryClient = useQueryClient();

  const downloadTemplateMutation = useMutation({
    mutationFn: trpc.service.downloadTemplate.mutationOptions().mutationFn,
  });

  const exportMutation = useMutation({
    mutationFn: trpc.service.export.mutationOptions().mutationFn,
  });

  const importMutation = useMutation({
    mutationFn: trpc.service.import.mutationOptions().mutationFn,
  });

  const handleGenerateTemplate = async (columns: string[]) => {
    const base64 = await downloadTemplateMutation.mutateAsync({ columns });
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    link.download = "template-layanan.xlsx";
    link.click();
    toast.success("Template berhasil didownload");
  };

  const handleExportData = async () => {
    const base64 = await exportMutation.mutateAsync({});
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    link.download = "data-layanan.xlsx";
    link.click();
    toast.success("Data berhasil diexport");
  };

  const handleImportData = async (fileBase64: string) => {
    const result = await importMutation.mutateAsync({ fileBase64 });
    queryClient.invalidateQueries({ queryKey: [["service", "list"]] });
    return result;
  };

  const handleEdit = (service: ServiceData) => {
    setSelectedService(service);
    setShowFormDialog(true);
  };

  const handleDelete = (service: ServiceData) => {
    setSelectedService(service);
    setShowDeleteDialog(true);
  };

  const handleCloseFormDialog = (open: boolean) => {
    setShowFormDialog(open);
    if (!open) setSelectedService(null);
  };

  const handleCloseDeleteDialog = (open: boolean) => {
    setShowDeleteDialog(open);
    if (!open) setSelectedService(null);
  };

  return (
    <DomainPageShell
      actions={
        <>
          <ExcelDataActions
            domainName="Layanan"
            onExportData={handleExportData}
            onGenerateTemplate={handleGenerateTemplate}
            onImportData={handleImportData}
            templateColumns={templateColumns}
          />
          <Button onClick={() => setShowFormDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Layanan
          </Button>
        </>
      }
      description="Domain 5 - Katalog Layanan Publik Digital"
      title="Layanan"
    >
      <ServiceTable onDelete={handleDelete} onEdit={handleEdit} />

      <ServiceFormDialog
        editData={selectedService}
        onOpenChange={handleCloseFormDialog}
        open={showFormDialog}
      />

      <ServiceDeleteDialog
        onOpenChange={handleCloseDeleteDialog}
        open={showDeleteDialog}
        service={selectedService}
      />
    </DomainPageShell>
  );
}
