"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DomainPageShell } from "../_components/domain-page-shell";
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

export default function OpdPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editData, setEditData] = useState<OpdData | null>(null);
  const [deleteData, setDeleteData] = useState<OpdData | null>(null);

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
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah OPD
          </Button>
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
