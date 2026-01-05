"use client";

import { ChevronRightIcon, HomeIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

// Route label mapping for breadcrumbs
const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  probis: "Business Process",
  data: "Data Standards",
  applications: "Applications",
  infrastructure: "Infrastructure",
  services: "Services",
  security: "Security & Risk",
  opd: "OPD Management",
  planning: "Planning",
  settings: "Settings",
};

interface SiteHeaderProps {
  title?: string;
}

export function SiteHeader({ title }: SiteHeaderProps) {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const label =
      routeLabels[segment] ||
      segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;

    return { href, label, isLast };
  });

  // Page title derived from last breadcrumb (can be used for document.title)
  const _pageTitle = title || breadcrumbs.at(-1)?.label || "Dashboard";

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          className="mx-2 data-[orientation=vertical]:h-4"
          orientation="vertical"
        />

        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-sm"
        >
          <Link
            className="text-muted-foreground transition-colors hover:text-foreground"
            href="/dashboard"
          >
            <HomeIcon className="size-4" />
            <span className="sr-only">Home</span>
          </Link>

          {breadcrumbs.map((crumb) => (
            <div className="flex items-center gap-1" key={crumb.href}>
              <ChevronRightIcon className="size-3.5 text-muted-foreground" />
              {crumb.isLast ? (
                <span className="font-medium text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  href={crumb.href}
                >
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Placeholder for additional header actions */}
        </div>
      </div>
    </header>
  );
}
