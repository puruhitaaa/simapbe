"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/utils/trpc";
import { DomainPageShell } from "../_components/domain-page-shell";
import { ExcelDataActions } from "../_components/excel-data-actions";
import { ProbisDeleteDialog } from "./_components/probis-delete-dialog";
import { ProbisDetailPanel } from "./_components/probis-detail-panel";
import { ProbisFormDialog } from "./_components/probis-form-dialog";
import { ProbisTree } from "./_components/probis-tree";

interface BusinessProcess {
  id: string;
  kodeProbismet: string;
  name: string;
  description: string | null;
  level: number;
  parentId: string | null;
}

const templateColumns = [
  { id: "kodeProbismet", label: "Code (Unique)", required: true },
  { id: "name", label: "Name", required: true },
  { id: "description", label: "Description" },
  { id: "level", label: "Level", required: true },
  { id: "parentCode", label: "Parent Code" },
];

export default function ProbisPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<BusinessProcess | null>(
    null
  );
  const [editData, setEditData] = useState<BusinessProcess | null>(null);
  const [parentNode, setParentNode] = useState<BusinessProcess | null>(null);
  const [deleteNode, setDeleteNode] = useState<BusinessProcess | null>(null);

  const queryClient = useQueryClient();

  const downloadTemplateMutation = useMutation({
    mutationFn: trpc.probis.downloadTemplate.mutationOptions().mutationFn,
  });

  const exportMutation = useMutation({
    mutationFn: trpc.probis.export.mutationOptions().mutationFn,
  });

  const importMutation = useMutation({
    mutationFn: trpc.probis.import.mutationOptions().mutationFn,
  });

  const handleGenerateTemplate = async (columns: string[]) => {
    const base64 = await downloadTemplateMutation.mutateAsync({ columns });
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    link.download = "template-probis.xlsx";
    link.click();
    toast.success("Template berhasil didownload");
  };

  const handleExportData = async () => {
    const base64 = await exportMutation.mutateAsync({});
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    link.download = "data-probis.xlsx";
    link.click();
    toast.success("Data berhasil diexport");
  };

  const handleImportData = async (fileBase64: string) => {
    const result = await importMutation.mutateAsync({ fileBase64 });
    queryClient.invalidateQueries({ queryKey: [["probis", "getHierarchy"]] });
    queryClient.invalidateQueries({ queryKey: [["probis", "list"]] });
    return result;
  };

  const handleAdd = () => {
    setEditData(null);
    setParentNode(null);
    setFormOpen(true);
  };

  const handleAddChild = (parent: BusinessProcess) => {
    setEditData(null);
    setParentNode(parent);
    setFormOpen(true);
  };

  const handleEdit = (node: BusinessProcess) => {
    setEditData(node);
    setParentNode(null);
    setFormOpen(true);
  };

  const handleDelete = (node: BusinessProcess) => {
    setDeleteNode(node);
    setDeleteOpen(true);
  };

  const handleCloseDeleteDialog = (open: boolean) => {
    setDeleteOpen(open);
    if (!open) setDeleteNode(null);
  };

  return (
    <>
      <DomainPageShell
        actions={
          <>
            <ExcelDataActions
              domainName="Proses Bisnis"
              onExportData={handleExportData}
              onGenerateTemplate={handleGenerateTemplate}
              onImportData={handleImportData}
              templateColumns={templateColumns}
            />
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Proses Bisnis
            </Button>
          </>
        }
        description="Domain 1 - Arsitektur Proses Bisnis Pemerintah Kota Bandung"
        title="Proses Bisnis"
      >
        <div className="grid h-[calc(100vh-16rem)] grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Tree View - Left Panel */}
          <Card className="lg:col-span-2">
            <ScrollArea className="h-full">
              <ProbisTree
                onSelect={setSelectedNode}
                selectedId={selectedNode?.id}
              />
            </ScrollArea>
          </Card>

          {/* Detail Panel - Right Panel */}
          <Card className="overflow-hidden lg:col-span-3">
            <ScrollArea className="h-full">
              <ProbisDetailPanel
                onAddChild={handleAddChild}
                onDelete={handleDelete}
                onEdit={handleEdit}
                selectedId={selectedNode?.id ?? null}
              />
            </ScrollArea>
          </Card>
        </div>
      </DomainPageShell>

      <ProbisFormDialog
        editData={editData}
        onOpenChange={setFormOpen}
        open={formOpen}
        parentNode={parentNode}
      />

      <ProbisDeleteDialog
        onOpenChange={handleCloseDeleteDialog}
        open={deleteOpen}
        probis={deleteNode}
      />
    </>
  );
}
