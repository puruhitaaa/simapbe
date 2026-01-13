"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  FolderOpen,
  Network,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

// Type for nested business process from API
interface BusinessProcess {
  id: string;
  kodeProbismet: string;
  name: string;
  description: string | null;
  level: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  children?: BusinessProcess[];
  _count?: {
    services: number;
  };
}

interface TreeNodeProps {
  node: BusinessProcess;
  depth: number;
  onSelect: (node: BusinessProcess) => void;
  selectedId?: string;
}

function TreeNode({ node, depth, onSelect, selectedId }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2); // Auto-expand first 2 levels
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  const levelColors: Record<number, string> = {
    1: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    2: "bg-green-500/10 text-green-700 dark:text-green-400",
    3: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    4: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  };

  const levelLabels: Record<number, string> = {
    1: "Sektor",
    2: "Urusan",
    3: "Fungsi",
    4: "Sub-Fungsi",
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          "group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50",
          isSelected && "bg-primary/10"
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {/* Expand/Collapse Button */}
        <Button
          className={cn("h-5 w-5 p-0", !hasChildren && "invisible")}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          size="icon-xs"
          variant="ghost"
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>

        {/* Icon */}
        {hasChildren ? (
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
        ) : (
          <FileText className="h-4 w-4 text-muted-foreground" />
        )}

        {/* Content */}
        <button
          className="flex flex-1 items-center gap-2 text-left"
          onClick={() => onSelect(node)}
          type="button"
        >
          <Badge
            className={cn("font-mono text-[10px]", levelColors[node.level])}
          >
            {node.kodeProbismet}
          </Badge>
          <span className="flex-1 truncate text-sm">{node.name}</span>
          <span className="text-muted-foreground text-xs opacity-0 group-hover:opacity-100">
            {levelLabels[node.level]}
          </span>
          {node._count?.services && node._count.services > 0 && (
            <Badge className="gap-1" variant="secondary">
              <Network className="h-3 w-3" />
              {node._count.services}
            </Badge>
          )}
        </button>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="relative">
          {/* Connector line */}
          <div
            className="absolute top-0 bottom-0 left-4 w-px bg-border"
            style={{ marginLeft: `${depth * 20}px` }}
          />
          {node.children?.map((child) => (
            <TreeNode
              depth={depth + 1}
              key={child.id}
              node={child}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ProbisTreeProps {
  onSelect: (node: BusinessProcess) => void;
  selectedId?: string;
}

export function ProbisTree({ onSelect, selectedId }: ProbisTreeProps) {
  const trpc = useTRPC();
  const { data, isLoading, error } = useQuery({
    ...trpc.probis.getHierarchy.queryOptions(),
  });

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="flex items-center gap-2" key={i}>
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive text-sm">
        Gagal memuat data: {error.message}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center">
        <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="font-medium">Belum Ada Data</h3>
        <p className="mt-1 text-muted-foreground text-sm">
          Tambahkan proses bisnis pertama untuk memulai
        </p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {data.map((node) => (
        <TreeNode
          depth={0}
          key={node.id}
          node={node as BusinessProcess}
          onSelect={onSelect}
          selectedId={selectedId}
        />
      ))}
    </div>
  );
}
