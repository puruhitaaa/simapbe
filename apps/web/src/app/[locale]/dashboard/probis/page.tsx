"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DomainPageShell } from "../_components/domain-page-shell";
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

export default function ProbisPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<BusinessProcess | null>(
    null
  );
  const [editData, setEditData] = useState<BusinessProcess | null>(null);
  const [parentNode, setParentNode] = useState<BusinessProcess | null>(null);
  const [deleteNode, setDeleteNode] = useState<BusinessProcess | null>(null);

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
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Proses Bisnis
          </Button>
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
