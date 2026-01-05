"use client";

import {
  AppWindowIcon,
  Building2Icon,
  DatabaseIcon,
  GaugeIcon,
  LayersIcon,
  NetworkIcon,
  ServerIcon,
  Settings2Icon,
  ShieldCheckIcon,
  WorkflowIcon,
} from "lucide-react";
import Link from "next/link";

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
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";

// SPBE 6 Domain Navigation
const navDomains = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: GaugeIcon,
  },
  {
    title: "Business Process",
    url: "/dashboard/probis",
    icon: WorkflowIcon,
    description: "Domain 1: Tata Kelola",
  },
  {
    title: "Data Standards",
    url: "/dashboard/data",
    icon: DatabaseIcon,
    description: "Domain 2: Satu Data",
  },
  {
    title: "Applications",
    url: "/dashboard/applications",
    icon: AppWindowIcon,
    description: "Domain 3: Aplikasi",
  },
  {
    title: "Infrastructure",
    url: "/dashboard/infrastructure",
    icon: ServerIcon,
    description: "Domain 4: Infrastruktur",
  },
  {
    title: "Services",
    url: "/dashboard/services",
    icon: NetworkIcon,
    description: "Domain 5: Layanan",
  },
  {
    title: "Security & Risk",
    url: "/dashboard/security",
    icon: ShieldCheckIcon,
    description: "Domain 6: Keamanan",
  },
];

const navSecondary = [
  {
    title: "OPD Management",
    url: "/dashboard/opd",
    icon: Building2Icon,
  },
  {
    title: "Planning",
    url: "/dashboard/planning",
    icon: LayersIcon,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings2Icon,
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string;
    email: string;
    image?: string;
  };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/dashboard" />}
            >
              <LayersIcon className="size-5!" />
              <span className="font-semibold text-base">SIMAPBE</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Domain Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>SPBE Domains</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navDomains.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link href={item.url} />}
                    tooltip={item.description || item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Navigation */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navSecondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link href={item.url} />}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user || { name: "User", email: "user@bandung.go.id" }} />
      </SidebarFooter>
    </Sidebar>
  );
}
