"use client";

import {
  BarChart3,
  CalendarRange,
  FileDown,
  GitCompareArrows,
  Plus,
} from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainPageShell } from "../_components/domain-page-shell";
import { BudgetView } from "./_components/budget-view";
import { GanttChart } from "./_components/gantt-chart";
import { GapAnalysis } from "./_components/gap-analysis";

const tabValues = ["roadmap", "gap-analysis", "budget"] as const;
type TabValue = (typeof tabValues)[number];

export default function PlanningPage() {
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringLiteral(tabValues).withDefault("roadmap")
  );

  return (
    <DomainPageShell
      actions={
        <>
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Ekspor Laporan
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Inisiatif
          </Button>
        </>
      }
      description="Perencanaan dan monitoring inisiatif strategis SPBE"
      title="Peta Rencana SPBE"
    >
      <Tabs
        className="space-y-6"
        onValueChange={(value) => setActiveTab(value as TabValue)}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger className="flex items-center gap-2" value="roadmap">
            <CalendarRange className="h-4 w-4" />
            <span className="hidden sm:inline">Roadmap</span>
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-2" value="gap-analysis">
            <GitCompareArrows className="h-4 w-4" />
            <span className="hidden sm:inline">Gap Analysis</span>
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-2" value="budget">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Anggaran</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="roadmap">
          <GanttChart endYear={2029} startYear={2025} />
        </TabsContent>

        <TabsContent className="space-y-4" value="gap-analysis">
          <GapAnalysis />
        </TabsContent>

        <TabsContent className="space-y-4" value="budget">
          <BudgetView />
        </TabsContent>
      </Tabs>
    </DomainPageShell>
  );
}
