import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Plus, Shield } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { DomainPageShell } from "@/components/dashboard/domain-page-shell";
import { ExcelDataActions } from "@/components/dashboard/excel-data-actions";
import { AuditDeleteDialog } from "@/components/dashboard/keamanan/audit-delete-dialog";
import { AuditFormDialog } from "@/components/dashboard/keamanan/audit-form-dialog";
import { AuditTable } from "@/components/dashboard/keamanan/audit-table";
import { RiskDeleteDialog } from "@/components/dashboard/keamanan/risk-delete-dialog";
import { RiskFormDialog } from "@/components/dashboard/keamanan/risk-form-dialog";
import { RiskTable } from "@/components/dashboard/keamanan/risk-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/dashboard/keamanan")({
  component: KeamananPage,
});

const tabValues = ["risks", "audits"] as const;

type RiskData = {
  id: string;
  riskCode: string;
  riskDescription: string;
  riskCategory: string | null;
  impactLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  likelihoodLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  mitigationPlan: string | null;
  mitigationStatus: string | null;
  responsiblePerson: string | null;
  opd: { id: string; name: string } | null;
};

type AuditData = {
  id: string;
  auditDate: string;
  auditor: string | null;
  findings: string | null;
  recommendations: string | null;
  score: number | null;
  status: "PENDING" | "PASSED" | "FAILED_REMEDIATION_REQUIRED";
  app: {
    id: string;
    code: string;
    name: string;
    opd: {
      id: string;
      code: string;
      name: string;
    };
  };
};

const riskColumns = [
  { id: "riskCode", label: "Code (Unique)", required: true },
  { id: "opdCode", label: "OPD Code", required: true },
  { id: "riskDescription", label: "Description", required: true },
  { id: "riskCategory", label: "Category" },
  { id: "impactLevel", label: "Impact" },
  { id: "likelihoodLevel", label: "Likelihood" },
  { id: "mitigationPlan", label: "Mitigation" },
  { id: "responsiblePerson", label: "PIC" },
];

const auditColumns = [
  { id: "appCode", label: "App Code", required: true },
  { id: "auditDate", label: "Date", required: true },
  { id: "auditor", label: "Auditor" },
  { id: "findings", label: "Findings" },
  { id: "recommendations", label: "Recommendations" },
  { id: "score", label: "Score" },
  { id: "status", label: "Status" },
];

function KeamananPage() {
  const trpc = useTRPC();
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringLiteral(tabValues).withDefault("risks")
  );

  const queryClient = useQueryClient();

  const downloadTemplateMutation = useMutation({
    mutationFn: trpc.security.downloadTemplate.mutationOptions().mutationFn,
  });

  const exportMutation = useMutation({
    mutationFn: trpc.security.export.mutationOptions().mutationFn,
  });

  const importMutation = useMutation({
    mutationFn: trpc.security.import.mutationOptions().mutationFn,
  });

  const currentType = activeTab === "risks" ? "RISK" : "AUDIT";

  const handleGenerateTemplate = async (columns: string[]) => {
    const base64 = await downloadTemplateMutation.mutateAsync({
      type: currentType,
      columns,
    });
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    link.download = `template-${activeTab}.xlsx`;
    link.click();
    toast.success("Template berhasil didownload");
  };

  const handleExportData = async () => {
    const base64 = await exportMutation.mutateAsync({ type: currentType });
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    link.download = `data-${activeTab}.xlsx`;
    link.click();
    toast.success("Data berhasil diexport");
  };

  const handleImportData = async (fileBase64: string) => {
    const result = await importMutation.mutateAsync({
      fileBase64,
      type: currentType,
    });
    if (activeTab === "risks") {
      queryClient.invalidateQueries({ queryKey: [["security", "listRisks"]] });
    } else {
      queryClient.invalidateQueries({ queryKey: [["security", "listAudits"]] });
    }
    return result;
  };

  const [showRiskDialog, setShowRiskDialog] = useState(false);
  const [showRiskDeleteDialog, setShowRiskDeleteDialog] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<RiskData | null>(null);

  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [showAuditDeleteDialog, setShowAuditDeleteDialog] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<AuditData | null>(null);

  const handleEditRisk = (risk: RiskData) => {
    setSelectedRisk(risk);
    setShowRiskDialog(true);
  };

  const handleDeleteRisk = (risk: RiskData) => {
    setSelectedRisk(risk);
    setShowRiskDeleteDialog(true);
  };

  const handleCloseRiskDialog = (open: boolean) => {
    setShowRiskDialog(open);
    if (!open) setSelectedRisk(null);
  };

  const handleCloseRiskDeleteDialog = (open: boolean) => {
    setShowRiskDeleteDialog(open);
    if (!open) setSelectedRisk(null);
  };

  const handleEditAudit = (audit: AuditData) => {
    setSelectedAudit(audit);
    setShowAuditDialog(true);
  };

  const handleDeleteAudit = (audit: AuditData) => {
    setSelectedAudit(audit);
    setShowAuditDeleteDialog(true);
  };

  const handleCloseAuditDialog = (open: boolean) => {
    setShowAuditDialog(open);
    if (!open) setSelectedAudit(null);
  };

  const handleCloseAuditDeleteDialog = (open: boolean) => {
    setShowAuditDeleteDialog(open);
    if (!open) setSelectedAudit(null);
  };

  return (
    <DomainPageShell
      actions={
        <>
          <ExcelDataActions
            domainName={`Keamanan (${activeTab === "risks" ? "Risiko" : "Audit"})`}
            onExportData={handleExportData}
            onGenerateTemplate={handleGenerateTemplate}
            onImportData={handleImportData}
            templateColumns={activeTab === "risks" ? riskColumns : auditColumns}
          />
          <Button onClick={() => setShowAuditDialog(true)} variant="outline">
            <Shield className="mr-2 h-4 w-4" />
            Tambah Audit
          </Button>
          <Button onClick={() => setShowRiskDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Registrasi Risiko
          </Button>
        </>
      }
      description="Domain 6 - Audit Keamanan TIK dan Manajemen Risiko"
      title="Keamanan"
    >
      <Tabs
        className="w-full"
        onValueChange={(value) => setActiveTab(value as "risks" | "audits")}
        value={activeTab}
      >
        <TabsList className="mb-4">
          <TabsTrigger className="flex items-center gap-2" value="risks">
            <AlertTriangle className="h-4 w-4" />
            Manajemen Risiko
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-2" value="audits">
            <Shield className="h-4 w-4" />
            Audit Keamanan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="risks">
          <RiskTable onDelete={handleDeleteRisk} onEdit={handleEditRisk} />
        </TabsContent>

        <TabsContent value="audits">
          <AuditTable onDelete={handleDeleteAudit} onEdit={handleEditAudit} />
        </TabsContent>
      </Tabs>

      {/* Risk Dialogs */}
      <RiskFormDialog
        editData={selectedRisk}
        onOpenChange={handleCloseRiskDialog}
        open={showRiskDialog}
      />
      <RiskDeleteDialog
        onOpenChange={handleCloseRiskDeleteDialog}
        open={showRiskDeleteDialog}
        risk={selectedRisk}
      />

      {/* Audit Dialogs */}
      <AuditFormDialog
        editData={selectedAudit}
        onOpenChange={handleCloseAuditDialog}
        open={showAuditDialog}
      />
      <AuditDeleteDialog
        audit={selectedAudit}
        onOpenChange={handleCloseAuditDeleteDialog}
        open={showAuditDeleteDialog}
      />
    </DomainPageShell>
  );
}
