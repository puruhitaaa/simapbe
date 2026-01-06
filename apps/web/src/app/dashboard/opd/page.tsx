"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { DomainPageShell } from "../_components/domain-page-shell";
import { ExcelDataActions } from "../_components/excel-data-actions";
import { OpdDeleteDialog } from "./_components/opd-delete-dialog";
import { OpdFormDialog } from "./_components/opd-form-dialog";
import { OpdTable } from "./_components/opd-table";

interface OpdData {
  id: string;
  code: string;
  name: string;
  acronym: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

const templateColumns = [
  { id: "code", label: "Code (Unique)", required: true },
  { id: "name", label: "Name", required: true },
  { id: "acronym", label: "Acronym" },
  { id: "address", label: "Address" },
  { id: "phone", label: "Phone" },
  { id: "email", label: "Email" },
];

export default function OpdPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editData, setEditData] = useState<OpdData | null>(null);
  const [deleteData, setDeleteData] = useState<OpdData | null>(null);

  const queryClient = useQueryClient();

  const downloadTemplateMutation = useMutation({
    mutationFn: trpc.opd.downloadTemplate.mutationOptions().mutationFn,
  });

  const exportMutation = useMutation({
    mutationFn: trpc.opd.export.mutationOptions().mutationFn,
  });

  const importMutation = useMutation({
    mutationFn: trpc.opd.import.mutationOptions().mutationFn,
  });

  const handleGenerateTemplate = async (columns: string[]) => {
    const base64 = await downloadTemplateMutation.mutateAsync({ columns });
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    link.download = "template-opd.xlsx";
    link.click();
    toast.success("Template berhasil didownload");
  };

  const handleExportData = async () => {
    const base64 = await exportMutation.mutateAsync({});
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    link.download = "data-opd.xlsx";
    link.click();
    toast.success("Data berhasil diexport");
  };

  const handleImportData = async (fileBase64: string) => {
    const result = await importMutation.mutateAsync({ fileBase64 });
    queryClient.invalidateQueries({ queryKey: [["opd", "list"]] });
    return result;
  };

  const handleAdd = () => {
    setEditData(null);
    setFormOpen(true);
  };

  const handleEdit = (opd: OpdData) => {
    setEditData(opd);
    setFormOpen(true);
  };

  const handleDelete = (opd: OpdData) => {
    setDeleteData(opd);
    setDeleteOpen(true);
  };

  return (
    <>
      <DomainPageShell
        actions={
          <>
            <ExcelDataActions
              domainName="OPD"
              onExportData={handleExportData}
              onGenerateTemplate={handleGenerateTemplate}
              onImportData={handleImportData}
              templateColumns={templateColumns}
            />
            <Button onClick={handleAdd}>
              {" "}
              <Plus className="mr-2 h-4 w-4" />
              Tambah OPD
            </Button>
          </>
        }
        description="Manajemen OPD Pemerintah Kota Bandung"
        title="Organisasi Perangkat Daerah"
      >
        <OpdTable onDelete={handleDelete} onEdit={handleEdit} />
      </DomainPageShell>

      <OpdFormDialog
        editData={editData}
        onOpenChange={setFormOpen}
        open={formOpen}
      />

      <OpdDeleteDialog
        onOpenChange={setDeleteOpen}
        opd={deleteData}
        open={deleteOpen}
      />
    </>
  );
}
