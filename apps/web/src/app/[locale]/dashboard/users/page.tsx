import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DomainPageShell,
  PlaceholderContent,
} from "../_components/domain-page-shell";

export default function UsersPage() {
  return (
    <DomainPageShell
      actions={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Undang Pengguna
        </Button>
      }
      description="Pengguna dan hak akses sistem SIMAPBE"
      title="Manajemen Pengguna"
    >
      <PlaceholderContent
        domain="Pengguna"
        features={[
          "Daftar pengguna sistem",
          "Role: Super Admin, Operator, Auditor, Leader",
          "Afiliasi OPD per pengguna",
          "Log aktivitas pengguna",
          "Manajemen sesi aktif",
        ]}
      />
    </DomainPageShell>
  );
}
