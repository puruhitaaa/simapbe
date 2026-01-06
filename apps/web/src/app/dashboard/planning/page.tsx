"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarRange,
  FileDown,
  GitCompareArrows,
  Plus,
} from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/utils/trpc";
import { DomainPageShell } from "../_components/domain-page-shell";
import { ExcelDataActions } from "../_components/excel-data-actions";
import { BudgetView } from "./_components/budget-view";
import { GanttChart } from "./_components/gantt-chart";
import { GapAnalysis } from "./_components/gap-analysis";

const tabValues = ["roadmap", "gap-analysis", "budget"] as const;
type TabValue = (typeof tabValues)[number];

const templateColumns = [
  { id: "planCode", label: "Code (Unique)", required: true },
  { id: "year", label: "Year", required: true },
  { id: "initiativeName", label: "Initiative Name", required: true },
  { id: "domain", label: "Domain", required: true },
  { id: "budget", label: "Budget" },
  { id: "status", label: "Status" },
  { id: "description", label: "Description" },
];

export default function PlanningPage() {
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringLiteral(tabValues).withDefault("roadmap")
  );

  const queryClient = useQueryClient();

  const downloadTemplateMutation = useMutation({
    mutationFn: trpc.planning.downloadTemplate.mutationOptions().mutationFn,
  });

  const exportMutation = useMutation({
    mutationFn: trpc.planning.export.mutationOptions().mutationFn,
  });

  const importMutation = useMutation({
    mutationFn: trpc.planning.import.mutationOptions().mutationFn,
  });

  const handleGenerateTemplate = async (columns: string[]) => {
    const base64 = await downloadTemplateMutation.mutateAsync({ columns });
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    link.download = "template-planning.xlsx";
    link.click();
    toast.success("Template berhasil didownload");
  };

  const handleExportData = async () => {
    const base64 = await exportMutation.mutateAsync({});
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    link.download = "data-planning.xlsx";
    link.click();
    toast.success("Data berhasil diexport");
  };

  const handleImportData = async (fileBase64: string) => {
    const result = await importMutation.mutateAsync({ fileBase64 });
    queryClient.invalidateQueries({ queryKey: [["planning"]] });
    return result;
  };

  return (
    <DomainPageShell
      actions={
        <>
          <ExcelDataActions
            domainName="Peta Rencana"
            onExportData={handleExportData}
            onGenerateTemplate={handleGenerateTemplate}
            onImportData={handleImportData}
            templateColumns={templateColumns}
          />
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
