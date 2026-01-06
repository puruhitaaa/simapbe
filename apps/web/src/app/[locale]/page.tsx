import {
  Building2,
  ChevronRight,
  Database,
  LayoutDashboard,
  Network,
  Server,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getServerSession } from "@/lib/auth-server";

export default async function Home() {
  // Use server-side session fetcher for proper cross-origin cookie handling
  const session = await getServerSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">SIMAPBE</span>
          </div>
          <Button nativeButton={false} render={<Link href="/login" />}>
            Masuk
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 text-center md:py-24">
          <h1 className="font-bold text-4xl tracking-tight md:text-5xl lg:text-6xl">
            Sistem Manajemen Arsitektur
            <span className="mt-2 block text-primary">SPBE Kota Bandung</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Platform terpadu untuk mengelola 6 domain arsitektur SPBE sesuai
            Perpres 132/2022 dan prinsip Satu Data Indonesia.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button
              nativeButton={false}
              render={<Link href="/login" />}
              size="lg"
            >
              Mulai Sekarang
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center font-bold text-2xl">
              6 Domain Arsitektur SPBE
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: LayoutDashboard,
                  title: "Proses Bisnis",
                  description: "Pemetaan hierarki proses bisnis pemerintahan",
                },
                {
                  icon: Database,
                  title: "Data & Informasi",
                  description: "Standar data sesuai Satu Data Indonesia",
                },
                {
                  icon: LayoutDashboard,
                  title: "Aplikasi",
                  description: "Inventaris dengan moratorium duplikasi",
                },
                {
                  icon: Server,
                  title: "Infrastruktur",
                  description: "Aset TIK dan kapasitas infrastruktur",
                },
                {
                  icon: Network,
                  title: "Layanan",
                  description: "Katalog layanan publik digital",
                },
                {
                  icon: Shield,
                  title: "Keamanan",
                  description: "Audit keamanan dan manajemen risiko",
                },
              ].map((feature) => (
                <div
                  className="rounded-lg border bg-card p-6"
                  key={feature.title}
                >
                  <feature.icon className="mb-4 h-10 w-10 text-primary" />
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>
            © 2025 Pemerintah Kota Bandung. Dinas Komunikasi dan Informatika.
          </p>
        </div>
      </footer>
    </div>
  );
}
