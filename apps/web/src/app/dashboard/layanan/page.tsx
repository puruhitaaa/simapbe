"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DomainPageShell } from "../_components/domain-page-shell";
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

export default function LayananPage() {
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceData | null>(
    null
  );

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
        <Button onClick={() => setShowFormDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Layanan
        </Button>
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
