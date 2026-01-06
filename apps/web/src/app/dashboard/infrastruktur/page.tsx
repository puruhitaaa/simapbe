"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { DomainPageShell } from "../_components/domain-page-shell";
import { ExcelDataActions } from "../_components/excel-data-actions";
import { InfrastructureDeleteDialog } from "./_components/infrastructure-delete-dialog";
import { InfrastructureFormDialog } from "./_components/infrastructure-form-dialog";
import { InfrastructureTable } from "./_components/infrastructure-table";

type InfraData = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type:
    | "SERVER_PHYSICAL"
    | "VIRTUAL_MACHINE"
    | "CLOUD_SaaS"
    | "CLOUD_IaaS"
    | "NETWORK_DEVICE";
  location: "PDN" | "LOCAL";
  specs: string | null;
  cpuCores: number | null;
  ramGB: number | null;
  storageGB: number | null;
  ipAddress: string | null;
  opd: { id: string; name: string; acronym: string | null } | null;
};

const templateColumns = [
  { id: "code", label: "Code (Unique)", required: true },
  { id: "name", label: "Name", required: true },
  { id: "description", label: "Description" },
  { id: "type", label: "Type" },
  { id: "location", label: "Location" },
  { id: "specs", label: "Specs" },
  { id: "cpuCores", label: "CPU Cores" },
  { id: "ramGB", label: "RAM (GB)" },
  { id: "storageGB", label: "Storage (GB)" },
  { id: "ipAddress", label: "IP Address" },
  { id: "opdCode", label: "OPD Code", required: true },
];

export default function InfrastrukturPage() {
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedInfra, setSelectedInfra] = useState<InfraData | null>(null);

  const queryClient = useQueryClient();

  const downloadTemplateMutation = useMutation({
    mutationFn: trpc.infra.downloadTemplate.mutationOptions().mutationFn,
  });

  const exportMutation = useMutation({
    mutationFn: trpc.infra.export.mutationOptions().mutationFn,
  });

  const importMutation = useMutation({
    mutationFn: trpc.infra.import.mutationOptions().mutationFn,
  });

  const handleGenerateTemplate = async (columns: string[]) => {
    const base64 = await downloadTemplateMutation.mutateAsync({ columns });
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    link.download = "template-infrastruktur.xlsx";
    link.click();
    toast.success("Template berhasil didownload");
  };

  const handleExportData = async () => {
    const base64 = await exportMutation.mutateAsync({});
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    link.download = "data-infrastruktur.xlsx";
    link.click();
    toast.success("Data berhasil diexport");
  };

  const handleImportData = async (fileBase64: string) => {
    const result = await importMutation.mutateAsync({ fileBase64 });
    queryClient.invalidateQueries({ queryKey: [["infra", "list"]] });
    return result;
  };

  const handleEdit = (infra: InfraData) => {
    setSelectedInfra(infra);
    setShowFormDialog(true);
  };

  const handleDelete = (infra: InfraData) => {
    setSelectedInfra(infra);
    setShowDeleteDialog(true);
  };

  const handleCloseFormDialog = (open: boolean) => {
    setShowFormDialog(open);
    if (!open) setSelectedInfra(null);
  };

  const handleCloseDeleteDialog = (open: boolean) => {
    setShowDeleteDialog(open);
    if (!open) setSelectedInfra(null);
  };

  return (
    <DomainPageShell
      actions={
        <>
          <ExcelDataActions
            domainName="Infrastruktur"
            onExportData={handleExportData}
            onGenerateTemplate={handleGenerateTemplate}
            onImportData={handleImportData}
            templateColumns={templateColumns}
          />
          <Button onClick={() => setShowFormDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Infrastruktur
          </Button>
        </>
      }
      description="Domain 4 - Aset Infrastruktur TIK dan Kapasitas"
      title="Infrastruktur"
    >
      <InfrastructureTable onDelete={handleDelete} onEdit={handleEdit} />

      <InfrastructureFormDialog
        editData={selectedInfra}
        onOpenChange={handleCloseFormDialog}
        open={showFormDialog}
      />

      <InfrastructureDeleteDialog
        infrastructure={selectedInfra}
        onOpenChange={handleCloseDeleteDialog}
        open={showDeleteDialog}
      />
    </DomainPageShell>
  );
}
