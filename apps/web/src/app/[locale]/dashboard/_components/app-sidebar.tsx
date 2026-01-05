"use client";

import {
  Building2,
  ChevronUp,
  Database,
  FileText,
  Home,
  LayoutDashboard,
  Lock,
  Map,
  Network,
  Server,
  Settings,
  Users,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface NavItem {
  title: string;
  url: Route;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

// 6 SPBE Domain Navigation Items
const domainItems: NavItem[] = [
  {
    title: "Proses Bisnis",
    url: "/dashboard/probis" as Route,
    icon: FileText,
    description: "Domain 1 - Arsitektur Proses Bisnis",
  },
  {
    title: "Data & Informasi",
    url: "/dashboard/data" as Route,
    icon: Database,
    description: "Domain 2 - Satu Data Indonesia",
  },
  {
    title: "Aplikasi",
    url: "/dashboard/aplikasi" as Route,
    icon: LayoutDashboard,
    description: "Domain 3 - Moratorium Aplikasi",
  },
  {
    title: "Infrastruktur",
    url: "/dashboard/infrastruktur" as Route,
    icon: Server,
    description: "Domain 4 - Infrastruktur TIK",
  },
  {
    title: "Layanan",
    url: "/dashboard/layanan" as Route,
    icon: Network,
    description: "Domain 5 - Layanan SPBE",
  },
  {
    title: "Keamanan",
    url: "/dashboard/keamanan" as Route,
    icon: Lock,
    description: "Domain 6 - Keamanan & Audit",
  },
];

const managementItems: NavItem[] = [
  {
    title: "OPD",
    url: "/dashboard/opd" as Route,
    icon: Building2,
    description: "Manajemen OPD",
  },
  {
    title: "Peta Rencana",
    url: "/dashboard/planning" as Route,
    icon: Map,
    description: "Perencanaan SPBE",
  },
  {
    title: "Pengguna",
    url: "/dashboard/users" as Route,
    icon: Users,
    description: "Manajemen Pengguna",
  },
];

export function AppSidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/dashboard" />} size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">SIMAPBE</span>
                <span className="truncate text-muted-foreground text-xs">
                  Kota Bandung
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Overview */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/dashboard"}
                  render={<Link href="/dashboard" />}
                >
                  <Home className="size-4" />
                  <span>Beranda</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 6 SPBE Domains */}
        <SidebarGroup>
          <SidebarGroupLabel>Arsitektur SPBE</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {domainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.url)}
                    render={<Link href={item.url} />}
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management */}
        <SidebarGroup>
          <SidebarGroupLabel>Manajemen</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.url)}
                    render={<Link href={item.url} />}
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    size="lg"
                  />
                }
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage alt={user.name} src={user.image ?? undefined} />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-muted-foreground text-xs">
                    {user.email}
                  </span>
                </div>
                <ChevronUp className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                sideOffset={4}
              >
                <DropdownMenuItem
                  render={<Link href={"/dashboard/settings" as Route} />}
                >
                  <Settings className="mr-2 size-4" />
                  Pengaturan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="bg-destructive text-white hover:bg-destructive/80!"
                  onClick={handleSignOut}
                >
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
