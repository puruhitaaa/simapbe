"use client";

import { Link, useLocation, useRouter } from "@tanstack/react-router";
import {
  Building2,
  ChevronUp,
  Database,
  FileText,
  Home,
  LayoutDashboard,
  Lock,
  Map as MapIcon,
  Network,
  Server,
  Settings,
  Users,
} from "lucide-react";
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
import { hasPermission, type ResourceType } from "@/lib/permissions";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
}

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  permission?: ResourceType;
}

// 6 SPBE Domain Navigation Items
const domainItems: NavItem[] = [
  {
    title: "Proses Bisnis",
    url: "/dashboard/probis",
    icon: FileText,
    description: "Domain 1 - Arsitektur Proses Bisnis",
    permission: "probis",
  },
  {
    title: "Data & Informasi",
    url: "/dashboard/data",
    icon: Database,
    description: "Domain 2 - Satu Data Indonesia",
    permission: "data",
  },
  {
    title: "Aplikasi",
    url: "/dashboard/aplikasi",
    icon: LayoutDashboard,
    description: "Domain 3 - Moratorium Aplikasi",
    permission: "app",
  },
  {
    title: "Infrastruktur",
    url: "/dashboard/infrastruktur",
    icon: Server,
    description: "Domain 4 - Infrastruktur TIK",
    permission: "infra",
  },
  {
    title: "Layanan",
    url: "/dashboard/layanan",
    icon: Network,
    description: "Domain 5 - Layanan SPBE",
    permission: "service",
  },
  {
    title: "Keamanan",
    url: "/dashboard/keamanan",
    icon: Lock,
    description: "Domain 6 - Keamanan & Audit",
    permission: "security",
  },
];

const managementItems: NavItem[] = [
  {
    title: "OPD",
    url: "/dashboard/opd",
    icon: Building2,
    description: "Manajemen OPD",
    permission: "opd",
  },
  {
    title: "Peta Rencana",
    url: "/dashboard/planning",
    icon: MapIcon,
    description: "Perencanaan SPBE",
    permission: "planning",
  },
  {
    title: "Pengguna",
    url: "/dashboard/users",
    icon: Users,
    description: "Manajemen Pengguna",
    permission: "user",
  },
];

export function AppSidebar({ user }: { user: User }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: { onSuccess: () => router.navigate({ to: "/login" }) },
    });
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
            <SidebarMenuButton
              render={
                <Link to="/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Building2 className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">SIMAPBE</span>
                    <span className="truncate text-muted-foreground text-xs">
                      Kota Bandung
                    </span>
                  </div>
                </Link>
              }
              size="lg"
            />
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
                  render={
                    <Link to="/dashboard">
                      <Home className="size-4" />
                      <span>Beranda</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 6 SPBE Domains */}
        <SidebarGroup>
          <SidebarGroupLabel>Arsitektur SPBE</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {domainItems.map((item) => {
                if (
                  item.permission &&
                  !hasPermission(user.role, item.permission, "read")
                ) {
                  return null;
                }
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(item.url)}
                      render={
                        <Link to={item.url}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management */}
        <SidebarGroup>
          <SidebarGroupLabel>Manajemen</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => {
                if (
                  item.permission &&
                  !hasPermission(user.role, item.permission, "read")
                ) {
                  return null;
                }
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(item.url)}
                      render={
                        <Link to={item.url}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                );
              })}
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
                  render={
                    <Link to="/dashboard/settings">
                      <Settings className="mr-2 size-4" />
                      Pengaturan
                    </Link>
                  }
                />
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
