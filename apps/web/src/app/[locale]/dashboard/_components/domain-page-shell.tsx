import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DomainPageShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function DomainPageShell({
  title,
  description,
  children,
  actions,
}: DomainPageShellProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

interface PlaceholderContentProps {
  domain: string;
  features: string[];
}

export function PlaceholderContent({
  domain,
  features,
}: PlaceholderContentProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Daftar {domain}</CardTitle>
          <CardDescription>
            Data {domain.toLowerCase()} akan ditampilkan di sini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">Belum ada data</h3>
            <p className="mt-1 max-w-sm text-muted-foreground text-sm">
              Mulai dengan menambahkan {domain.toLowerCase()} pertama Anda
            </p>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Tambah {domain}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fitur yang Akan Datang</CardTitle>
          <CardDescription>
            Modul {domain.toLowerCase()} akan mencakup:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li className="flex items-start gap-2" key={index}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs">
                  {index + 1}
                </span>
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
