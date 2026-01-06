"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { DomainPageShell } from "../_components/domain-page-shell";
import { ExcelDataActions } from "../_components/excel-data-actions";
import { UserDeleteDialog } from "./_components/user-delete-dialog";
import { UserFormDialog } from "./_components/user-form-dialog";
import { UserOpdDialog } from "./_components/user-opd-dialog";
import { UserRoleDialog } from "./_components/user-role-dialog";
import { UserTable } from "./_components/user-table";

type UserRole = "SUPER_ADMIN" | "OPERATOR" | "AUDITOR" | "LEADER";

interface UserData {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: UserRole;
  opdId: string | null;
  createdAt: string;
  updatedAt: string;
  opd: {
    id: string;
    code: string;
    name: string;
    acronym: string | null;
  } | null;
  _count: {
    sessions: number;
    auditLogs: number;
  };
}

const templateColumns = [
  { id: "name", label: "Name", required: true },
  { id: "email", label: "Email", required: true },
  { id: "role", label: "Role" },
  { id: "opdCode", label: "OPD Code" },
];

export default function UsersPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [opdDialogOpen, setOpdDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const queryClient = useQueryClient();

  const downloadTemplateMutation = useMutation({
    mutationFn: trpc.user.downloadTemplate.mutationOptions().mutationFn,
  });

  const exportMutation = useMutation({
    mutationFn: trpc.user.export.mutationOptions().mutationFn,
  });

  const importMutation = useMutation({
    mutationFn: trpc.user.import.mutationOptions().mutationFn,
  });

  const handleGenerateTemplate = async (columns: string[]) => {
    const base64 = await downloadTemplateMutation.mutateAsync({ columns });
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    link.download = "template-users.xlsx";
    link.click();
    toast.success("Template berhasil didownload");
  };

  const handleExportData = async () => {
    const base64 = await exportMutation.mutateAsync({});
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    link.download = "data-users.xlsx";
    link.click();
    toast.success("Data berhasil diexport");
  };

  const handleImportData = async (fileBase64: string) => {
    const result = await importMutation.mutateAsync({ fileBase64 });
    queryClient.invalidateQueries({ queryKey: [["user", "list"]] });
    return result;
  };

  const handleAdd = () => {
    setFormOpen(true);
  };

  const handleEdit = (user: UserData) => {
    // For now, redirect to role/opd dialogs
    // Could implement full edit dialog later
    setSelectedUser(user);
    setRoleDialogOpen(true);
  };

  const handleSetRole = (user: UserData) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
  };

  const handleAssignOpd = (user: UserData) => {
    setSelectedUser(user);
    setOpdDialogOpen(true);
  };

  const handleDelete = (user: UserData) => {
    setSelectedUser(user);
    setDeleteOpen(true);
  };

  return (
    <>
      <DomainPageShell
        actions={
          <>
            <ExcelDataActions
              domainName="Pengguna"
              onExportData={handleExportData}
              onGenerateTemplate={handleGenerateTemplate}
              onImportData={handleImportData}
              templateColumns={templateColumns}
            />
            <Button onClick={handleAdd}>
              {" "}
              <Plus className="mr-2 h-4 w-4" />
              Tambah Pengguna
            </Button>
          </>
        }
        description="Pengguna dan hak akses sistem SIMAPBE"
        title="Manajemen Pengguna"
      >
        <UserTable
          onAssignOpd={handleAssignOpd}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onSetRole={handleSetRole}
        />
      </DomainPageShell>

      <UserFormDialog onOpenChange={setFormOpen} open={formOpen} />

      <UserRoleDialog
        onOpenChange={setRoleDialogOpen}
        open={roleDialogOpen}
        user={selectedUser}
      />

      <UserOpdDialog
        onOpenChange={setOpdDialogOpen}
        open={opdDialogOpen}
        user={selectedUser}
      />

      <UserDeleteDialog
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        user={selectedUser}
      />
    </>
  );
}
