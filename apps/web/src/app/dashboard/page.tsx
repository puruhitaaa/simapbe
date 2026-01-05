import { getUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getUser();

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-semibold text-2xl">
          Welcome, {user?.name || "User"}
        </h1>
        <p className="text-muted-foreground">
          SIMAPBE - Sistem Informasi Manajemen Arsitektur Pemerintahan Berbasis
          Elektronik
        </p>
      </div>

      {/* Dashboard content will be added here */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-medium text-muted-foreground text-sm">
            Total OPD
          </h3>
          <p className="font-bold text-2xl">-</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-medium text-muted-foreground text-sm">
            Applications
          </h3>
          <p className="font-bold text-2xl">-</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-medium text-muted-foreground text-sm">
            Services
          </h3>
          <p className="font-bold text-2xl">-</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-medium text-muted-foreground text-sm">
            Data Standards
          </h3>
          <p className="font-bold text-2xl">-</p>
        </div>
      </div>
    </div>
  );
}
