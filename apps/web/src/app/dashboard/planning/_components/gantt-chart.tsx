"use client";

import { Gantt, type Task, ViewMode } from "gantt-task-react";
import { useMemo, useState } from "react";
import "gantt-task-react/dist/index.css";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

const DOMAIN_COLORS: Record<string, { bg: string; progress: string }> = {
  PROSES_BISNIS: { bg: "#3b82f6", progress: "#1d4ed8" },
  DATA: { bg: "#10b981", progress: "#047857" },
  LAYANAN: { bg: "#8b5cf6", progress: "#6d28d9" },
  APLIKASI: { bg: "#f59e0b", progress: "#d97706" },
  INFRASTRUKTUR: { bg: "#ef4444", progress: "#dc2626" },
  KEAMANAN: { bg: "#ec4899", progress: "#db2777" },
};

const VIEW_MODE_OPTIONS = [
  { label: "Hari", value: ViewMode.Day },
  { label: "Minggu", value: ViewMode.Week },
  { label: "Bulan", value: ViewMode.Month },
  { label: "Tahun", value: ViewMode.Year },
] as const;

function getColumnWidth(viewMode: ViewMode): number {
  if (viewMode === ViewMode.Year) {
    return 350;
  }
  if (viewMode === ViewMode.Month) {
    return 150;
  }
  return 65;
}

interface GanttChartProps {
  startYear?: number;
  endYear?: number;
}

export function GanttChart({
  startYear = 2025,
  endYear = 2029,
}: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);

  const { data: roadmapData, isLoading } = useQuery(
    trpc.planning.getRoadmap.queryOptions({ startYear, endYear })
  );

  const tasks: Task[] = useMemo(() => {
    if (!roadmapData?.byYear) {
      return [];
    }

    const allTasks: Task[] = [];

    // Create year project tasks
    for (const [year, plans] of Object.entries(roadmapData.byYear)) {
      const yearNum = Number(year);
      const yearStart = new Date(yearNum, 0, 1);
      const yearEnd = new Date(yearNum, 11, 31);

      // Add year as project
      allTasks.push({
        id: `year-${year}`,
        name: `Tahun ${year}`,
        start: yearStart,
        end: yearEnd,
        progress: 0,
        type: "project",
        hideChildren: false,
        styles: {
          backgroundColor: "#64748b",
          progressColor: "#475569",
        },
      });

      // Add individual plans as tasks
      for (const plan of plans) {
        const quarterStart = plan.quarter
          ? new Date(yearNum, (plan.quarter - 1) * 3, 1)
          : yearStart;
        const quarterEnd = plan.quarter
          ? new Date(yearNum, plan.quarter * 3, 0)
          : yearEnd;

        const colors = DOMAIN_COLORS[plan.domain] ?? {
          bg: "#94a3b8",
          progress: "#64748b",
        };

        allTasks.push({
          id: plan.id,
          name: plan.initiativeName,
          start: quarterStart,
          end: quarterEnd,
          progress: plan.progressPercent ?? 0,
          type: "task",
          project: `year-${year}`,
          styles: {
            backgroundColor: colors.bg,
            progressColor: colors.progress,
          },
        });
      }
    }

    return allTasks;
  }, [roadmapData]);

  const currentViewLabel =
    VIEW_MODE_OPTIONS.find((opt) => opt.value === viewMode)?.label ?? "Bulan";

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-100 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gantt Chart Roadmap
          </CardTitle>
          <CardDescription>
            Visualisasi timeline inisiatif SPBE {startYear}-{endYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-75 items-center justify-center text-muted-foreground">
            Belum ada inisiatif yang terdaftar
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gantt Chart Roadmap
          </CardTitle>
          <CardDescription>
            Visualisasi timeline inisiatif SPBE {startYear}-{endYear}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button size="sm" variant="outline">
                {currentViewLabel}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            {VIEW_MODE_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setViewMode(option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="min-w-0 max-w-full">
        <div className="overflow-x-auto">
          <Gantt
            barBackgroundColor="#e2e8f0"
            barCornerRadius={4}
            barProgressColor="#94a3b8"
            columnWidth={getColumnWidth(viewMode)}
            fontSize="12px"
            ganttHeight={400}
            listCellWidth=""
            locale="id"
            tasks={tasks}
            todayColor="rgba(59, 130, 246, 0.1)"
            viewMode={viewMode}
          />
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4">
          {Object.entries(DOMAIN_COLORS).map(([domain, colors]) => (
            <div className="flex items-center gap-2" key={domain}>
              <div
                className="h-3 w-3 rounded"
                style={{ backgroundColor: colors.bg }}
              />
              <span className="text-muted-foreground text-xs">
                {domain.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
