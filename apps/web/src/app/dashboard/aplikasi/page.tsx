"use client";

import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DomainPageShell } from "../_components/domain-page-shell";
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

export default function AplikasiPage() {
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDuplicationDialog, setShowDuplicationDialog] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ApplicationData | null>(null);

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
