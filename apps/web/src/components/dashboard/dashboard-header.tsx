"use client";

import { useLocation } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

// Breadcrumb mapping
const pathLabels: Record<string, string> = {
  dashboard: "Beranda",
  probis: "Proses Bisnis",
  data: "Data & Informasi",
  aplikasi: "Aplikasi",
  infrastruktur: "Infrastruktur",
  layanan: "Layanan",
  keamanan: "Keamanan",
  opd: "OPD",
  planning: "Peta Rencana",
  users: "Pengguna",
  settings: "Pengaturan",
};

export function DashboardHeader({ user }: { user: User }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const pathSegments = pathname.split("/").filter(Boolean);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator className="mr-2" orientation="vertical" />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm">
        {pathSegments.map((segment, index) => {
          const label = pathLabels[segment] || segment;
          const isLast = index === pathSegments.length - 1;

          return (
            <span className="flex items-center gap-1" key={segment}>
              {index > 0 && <span className="text-muted-foreground">/</span>}
              <span
                className={
                  isLast
                    ? "font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }
              >
                {label}
              </span>
            </span>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="w-64 pl-8" placeholder="Cari..." type="search" />
        </div>

        {/* Notifications */}
        <Button className="relative" size="icon" variant="ghost">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive font-medium text-[10px] text-destructive-foreground">
            3
          </span>
        </Button>

        {/* Theme Toggle */}
        <ModeToggle />

        {/* User Avatar (mobile only) */}
        <Avatar className="h-8 w-8 md:hidden">
          <AvatarImage alt={user.name} src={user.image ?? undefined} />
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
