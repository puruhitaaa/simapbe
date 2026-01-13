import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  Building2,
  ChevronRight,
  Database,
  LayoutDashboard,
  Network,
  Server,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUser } from "@/functions/get-user";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const session = await getUser();
    if (session?.user) {
      throw redirect({
        to: "/dashboard",
      });
    }
  },
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg tracking-tight">SIMAPBE</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link to="/login">
              <Button size="sm" variant="ghost">
                Masuk
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm">Daftar</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12 text-center md:px-6 md:py-24 lg:py-32">
        <div className="mx-auto flex max-w-[800px] flex-col items-center gap-4">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <span className="mr-2 text-primary">Baru</span>
            Portal Integrasi SPBE Kota Bandung
          </div>
          <h1 className="font-extrabold text-4xl tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Satu Data, Satu Aplikasi <br />
            <span className="text-primary">Terintegrasi</span>
          </h1>
          <p className="max-w-[700px] text-muted-foreground md:text-xl">
            Platform tata kelola SPBE terpadu untuk Pemerintah Kota Bandung.
            Mengintegrasikan Proses Bisnis, Layanan, Aplikasi, dan Infrastruktur
            dalam satu ekosistem.
          </p>
          <div className="flex flex-col gap-3 min-[400px]:flex-row">
            <Link to="/login">
              <Button className="gap-2" size="lg">
                Buka Dashboard <LayoutDashboard className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button className="gap-2" size="lg" variant="outline">
                Pelajari Arsitektur <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container px-4 py-12 md:px-6 lg:py-24">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            description="Pemetaan hierarki urusan pemerintahan dari level sektor hingga fungsi operasional yang terstandarisasi."
            icon={<Network className="h-10 w-10 text-primary" />}
            title="Proses Bisnis Terpadu"
          />
          <FeatureCard
            description="Manajemen standar data dan metadata untuk menjamin interoperabilitas antar instansi pemerintah."
            icon={<Database className="h-10 w-10 text-primary" />}
            title="Satu Data Indonesia"
          />
          <FeatureCard
            description="Pencatatan siklus hidup aplikasi (SDLC) dan pencegahan duplikasi melalui cek kemiripan otomatis."
            icon={<LayoutDashboard className="h-10 w-10 text-primary" />}
            title="Inventaris Aplikasi"
          />
          <FeatureCard
            description="Pemetaan aset server fisik dan cloud (PDN) untuk optimalisasi sumber daya komputasi."
            icon={<Server className="h-10 w-10 text-primary" />}
            title="Manajemen Infrastruktur"
          />
          <FeatureCard
            description="Monitoring risiko keamanan informasi dan pencatatan audit trail sesuai standar persandian."
            icon={<Shield className="h-10 w-10 text-primary" />}
            title="Keamanan & Audit"
          />
          <FeatureCard
            description="Katalog layanan SPBE (G2C, G2B, G2G) yang terhubung langsung dengan proses bisnis pendukung."
            icon={<Building2 className="h-10 w-10 text-primary" />}
            title="Layanan Publik"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/40 py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 md:h-24 md:flex-row md:px-6">
          <p className="text-center text-muted-foreground text-sm leading-loose md:text-left">
            &copy; {new Date().getFullYear()} Pemerintah Kota Bandung. All
            rights reserved.
          </p>
          <div className="flex gap-4">
            <Link className="font-medium text-sm hover:underline" to="/">
              Terms of Service
            </Link>
            <Link className="font-medium text-sm hover:underline" to="/">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
      <div className="mb-2">{icon}</div>
      <h3 className="font-bold text-xl">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
