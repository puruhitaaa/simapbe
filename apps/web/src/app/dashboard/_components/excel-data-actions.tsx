"use client";

import { Download, FileDown, FileSpreadsheet, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ColumnSelectorDialog } from "@/components/shared/column-selector-dialog";
import { ImportDialog } from "@/components/shared/import-dialog";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExcelDataActionsProps {
  domainName?: string;

  // Template Generation
  templateColumns?: { id: string; label: string; required?: boolean }[];
  onGenerateTemplate?: (columns: string[]) => Promise<void>;

  // Import
  onImportData?: (fileBase64: string) => Promise<unknown>;

  // Export
  onExportData?: () => Promise<void>;
}

export function ExcelDataActions({
  domainName = "Data",
  templateColumns,
  onGenerateTemplate,
  onImportData,
  onExportData,
}: ExcelDataActionsProps) {
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleDownloadClick = () => {
    if (templateColumns && onGenerateTemplate) {
      setShowColumnSelector(true);
    } else {
      toast.info(`Template Excel untuk ${domainName} belum tersedia.`);
    }
  };

  const handleTemplateConfirm = async (selected: string[]) => {
    if (!onGenerateTemplate) return;
    try {
      setIsGenerating(true);
      await onGenerateTemplate(selected);
      setShowColumnSelector(false);
    } catch (error) {
      toast.error("Gagal men-generate template");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImportClick = () => {
    if (onImportData) {
      setShowImportDialog(true);
    } else {
      toast.info(`Fitur Import Excel untuk ${domainName} belum tersedia.`);
    }
  };

  const handleImportProcess = async (base64: string) => {
    if (!onImportData) return;
    try {
      setIsImporting(true);
      return await onImportData(base64);
    } catch (error) {
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportClick = async () => {
    if (onExportData) {
      try {
        await onExportData();
      } catch (error) {
        toast.error("Gagal meng-export data");
      }
    } else {
      toast.info(`Fitur Export Excel untuk ${domainName} belum tersedia.`);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={buttonVariants({ variant: "outline", className: "gap-2" })}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span className="hidden sm:inline">Excel Actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Manajemen Data Excel</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDownloadClick}>
            <FileDown className="mr-2 h-4 w-4" />
            Download Template
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" />
            Import Data
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExportClick}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {templateColumns && onGenerateTemplate && (
        <ColumnSelectorDialog
          columns={templateColumns}
          isPending={isGenerating}
          onConfirm={handleTemplateConfirm}
          onOpenChange={setShowColumnSelector}
          open={showColumnSelector}
          title={`Template ${domainName}`}
        />
      )}

      {onImportData && (
        <ImportDialog
          isPending={isImporting}
          onImport={handleImportProcess}
          onOpenChange={setShowImportDialog}
          open={showImportDialog}
          title={`Import ${domainName}`}
        />
      )}
    </>
  );
}
