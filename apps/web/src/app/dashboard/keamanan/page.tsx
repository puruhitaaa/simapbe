"use client";

import { AlertTriangle, Plus, Shield } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainPageShell } from "../_components/domain-page-shell";
import { AuditDeleteDialog } from "./_components/audit-delete-dialog";
import { AuditFormDialog } from "./_components/audit-form-dialog";
import { AuditTable } from "./_components/audit-table";
import { RiskDeleteDialog } from "./_components/risk-delete-dialog";
import { RiskFormDialog } from "./_components/risk-form-dialog";
import { RiskTable } from "./_components/risk-table";

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

export default function KeamananPage() {
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringLiteral(tabValues).withDefault("risks")
  );
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
