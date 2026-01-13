import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    if (typeof window === "undefined") {
      return { session: null };
    }

    const sessionResult = await authClient.getSession({
      fetchOptions: {
        credentials: "include",
        throw: false,
      },
    });

    if (
      sessionResult &&
      typeof sessionResult === "object" &&
      "data" in sessionResult
    ) {
      return { session: sessionResult.data ?? null };
    }

    return { session: null };
  },
  loader: ({ context }) => {
    if (typeof window === "undefined") {
      return;
    }

    if (!context.session) {
      throw redirect({
        to: "/login",
      });
    }
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { session } = Route.useRouteContext();

  if (!session?.user) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} />
      <SidebarInset>
        <DashboardHeader user={session.user} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
