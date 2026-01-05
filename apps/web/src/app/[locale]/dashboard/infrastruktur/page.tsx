"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DomainPageShell } from "../_components/domain-page-shell";
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

export default function InfrastrukturPage() {
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedInfra, setSelectedInfra] = useState<InfraData | null>(null);

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
        <Button onClick={() => setShowFormDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Infrastruktur
        </Button>
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
