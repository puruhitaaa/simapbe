import { createFileRoute } from "@tanstack/react-router";
import { DomainPageShell } from "@/components/dashboard/domain-page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <DomainPageShell
      description="Konfigurasi akun dan preferensi sistem"
      title="Pengaturan"
    >
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>Informasi akun pengguna Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input disabled id="name" placeholder="Nama lengkap" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input disabled id="email" placeholder="Email" type="email" />
            </div>
            <Button disabled>Simpan Perubahan</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Keamanan</CardTitle>
            <CardDescription>Pengaturan keamanan akun</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">Password Saat Ini</Label>
              <Input disabled id="current-password" type="password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">Password Baru</Label>
              <Input disabled id="new-password" type="password" />
            </div>
            <Button disabled>Ubah Password</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferensi</CardTitle>
            <CardDescription>
              Pengaturan tampilan dan notifikasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Pengaturan preferensi akan tersedia dalam versi mendatang.
            </p>
          </CardContent>
        </Card>
      </div>
    </DomainPageShell>
  );
}
