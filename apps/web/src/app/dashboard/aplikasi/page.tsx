"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { DomainPageShell } from "../_components/domain-page-shell";
import { ExcelDataActions } from "../_components/excel-data-actions";
import { ApplicationDeleteDialog } from "./_components/application-delete-dialog";
import { ApplicationFormDialog } from "./_components/application-form-dialog";
import { ApplicationTable } from "./_components/application-table";
import { DuplicationCheckDialog } from "./_components/duplication-check-dialog";

type ApplicationData = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: "UMUM" | "KHUSUS";
  platform: "WEB" | "MOBILE" | "DESKTOP" | "API";
  status: "PLANNING" | "DEVELOPMENT" | "ACTIVE" | "ARCHIVED";
  programmingLang: string | null;
  framework: string | null;
  databaseType: string | null;
  repositoryUrl: string | null;
  opdId: string;
  createdAt: string;
  updatedAt: string;
  opd: {
    id: string;
    code: string;
    name: string;
    acronym: string | null;
  };
  _count: {
    usedData: number;
    infrastructure: number;
    services: number;
    securityAudits: number;
  };
};

const templateColumns = [
  { id: "code", label: "Code (Unique)", required: true },
  { id: "name", label: "Name", required: true },
  { id: "description", label: "Description" },
  { id: "type", label: "Type" },
  { id: "platform", label: "Platform" },
  { id: "status", label: "Status" },
  { id: "repositoryUrl", label: "Repository URL" },
  { id: "opdCode", label: "OPD Code", required: true },
];

export default function AplikasiPage() {
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDuplicationDialog, setShowDuplicationDialog] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ApplicationData | null>(null);

  const queryClient = useQueryClient();

  const downloadTemplateMutation = useMutation({
    mutationFn: trpc.app.downloadTemplate.mutationOptions().mutationFn,
  });

  const exportMutation = useMutation({
    mutationFn: trpc.app.export.mutationOptions().mutationFn,
  });

  const importMutation = useMutation({
    mutationFn: trpc.app.import.mutationOptions().mutationFn,
  });

  const handleGenerateTemplate = async (columns: string[]) => {
    const base64 = await downloadTemplateMutation.mutateAsync({ columns });
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    link.download = "template-aplikasi.xlsx";
    link.click();
    toast.success("Template berhasil didownload");
  };

  const handleExportData = async () => {
    const base64 = await exportMutation.mutateAsync({});
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    link.download = "data-aplikasi.xlsx";
    link.click();
    toast.success("Data berhasil diexport");
  };

  const handleImportData = async (fileBase64: string) => {
    const result = await importMutation.mutateAsync({ fileBase64 });
    queryClient.invalidateQueries({ queryKey: [["app", "list"]] });
    return result;
  };

  const handleEdit = (app: ApplicationData) => {
    setSelectedApp(app);
    setShowFormDialog(true);
  };

  const handleDelete = (app: ApplicationData) => {
    setSelectedApp(app);
    setShowDeleteDialog(true);
  };

  const handleCloseFormDialog = (open: boolean) => {
    setShowFormDialog(open);
    if (!open) setSelectedApp(null);
  };

  const handleCloseDeleteDialog = (open: boolean) => {
    setShowDeleteDialog(open);
    if (!open) setSelectedApp(null);
  };

  return (
    <DomainPageShell
      actions={
        <>
          <ExcelDataActions
            domainName="Aplikasi"
            onExportData={handleExportData}
            onGenerateTemplate={handleGenerateTemplate}
            onImportData={handleImportData}
            templateColumns={templateColumns}
          />
          <Button
            onClick={() => setShowDuplicationDialog(true)}
            variant="outline"
          >
            <Search className="mr-2 h-4 w-4" />
            Cek Duplikasi
          </Button>
          <Button onClick={() => setShowFormDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajukan Aplikasi Baru
          </Button>
        </>
      }
      description="Domain 3 - Inventaris Aplikasi dengan Moratorium Duplikasi"
      title="Aplikasi"
    >
      <ApplicationTable onDelete={handleDelete} onEdit={handleEdit} />

      <ApplicationFormDialog
        editData={selectedApp}
        onOpenChange={handleCloseFormDialog}
        open={showFormDialog}
      />

      <ApplicationDeleteDialog
        application={selectedApp}
        onOpenChange={handleCloseDeleteDialog}
        open={showDeleteDialog}
      />

      <DuplicationCheckDialog
        onOpenChange={setShowDuplicationDialog}
        open={showDuplicationDialog}
      />
    </DomainPageShell>
  );
}
