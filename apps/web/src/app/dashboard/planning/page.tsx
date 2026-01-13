"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarRange,
  FileDown,
  GitCompareArrows,
  List,
  Plus,
} from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/utils/trpc";
import { DomainPageShell } from "../_components/domain-page-shell";
import { ExcelDataActions } from "../_components/excel-data-actions";
import { BudgetView } from "./_components/budget-view";
import { GanttChart } from "./_components/gantt-chart";
import { GapAnalysis } from "./_components/gap-analysis";
import { PlanDeleteDialog } from "./_components/plan-delete-dialog";
import { PlanFormDialog } from "./_components/plan-form-dialog";
import { PlanTable } from "./_components/plan-table";

const tabValues = ["list", "roadmap", "gap-analysis", "budget"] as const;
type TabValue = (typeof tabValues)[number];

interface PlanData {
  id: string;
  planCode: string;
  year: number;
  quarter: number | null;
  initiativeName: string;
  description: string | null;
  domain: string;
  priority: number;
  budget: { toNumber: () => number } | number | string | null;
  budgetCode: string | null;
  fundingSource: string | null;
  status: string;
  progressPercent: number;
  isGap: boolean;
  gapDescription: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

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
    parseAsStringLiteral(tabValues).withDefault("list")
  );
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);

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

  const handleEdit = (plan: PlanData) => {
    const normalizedPlan = {
      ...plan,
      budget:
        typeof plan.budget === "object" && plan.budget !== null
          ? (plan.budget as { toNumber: () => number }).toNumber()
          : plan.budget,
    };
    setSelectedPlan(normalizedPlan as PlanData);
    setShowFormDialog(true);
  };

  const handleDelete = (plan: PlanData) => {
    setSelectedPlan(plan);
    setShowDeleteDialog(true);
  };

  const handleCloseFormDialog = (open: boolean) => {
    setShowFormDialog(open);
    if (!open) {
      setSelectedPlan(null);
    }
  };

  const handleCloseDeleteDialog = (open: boolean) => {
    setShowDeleteDialog(open);
    if (!open) {
      setSelectedPlan(null);
    }
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
          <Button onClick={() => setShowFormDialog(true)}>
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
        <TabsList className="grid w-full grid-cols-4 lg:w-150">
          <TabsTrigger className="flex items-center gap-2" value="list">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Daftar</span>
          </TabsTrigger>
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

        <TabsContent className="space-y-4" value="list">
          <PlanTable onDelete={handleDelete} onEdit={handleEdit} />
        </TabsContent>

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

      <PlanFormDialog
        editData={
          selectedPlan
            ? {
                id: selectedPlan.id,
                planCode: selectedPlan.planCode,
                year: selectedPlan.year,
                quarter: selectedPlan.quarter,
                initiativeName: selectedPlan.initiativeName,
                description: selectedPlan.description,
                domain: selectedPlan.domain,
                priority: selectedPlan.priority,
                budget:
                  typeof selectedPlan.budget === "object" &&
                  selectedPlan.budget !== null
                    ? (
                        selectedPlan.budget as { toNumber: () => number }
                      ).toNumber()
                    : selectedPlan.budget,
                budgetCode: selectedPlan.budgetCode,
                fundingSource: selectedPlan.fundingSource,
                status: selectedPlan.status,
                isGap: selectedPlan.isGap,
                gapDescription: selectedPlan.gapDescription,
              }
            : null
        }
        onOpenChange={handleCloseFormDialog}
        open={showFormDialog}
      />

      <PlanDeleteDialog
        onOpenChange={handleCloseDeleteDialog}
        open={showDeleteDialog}
        plan={selectedPlan}
      />
    </DomainPageShell>
  );
}
