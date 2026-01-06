"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DomainPageShell } from "../_components/domain-page-shell";
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

export default function UsersPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [opdDialogOpen, setOpdDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

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
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Pengguna
          </Button>
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
