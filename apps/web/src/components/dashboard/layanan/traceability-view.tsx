"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Background,
  Controls,
  type Edge,
  Handle,
  MarkerType,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
} from "@xyflow/react";
import { useMemo } from "react";
import "@xyflow/react/dist/style.css";
import {
  AlertTriangle,
  AppWindow,
  CheckCircle2,
  Database,
  Globe,
  Server,
  Shield,
  Workflow,
  XCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/utils/trpc";

// Node configuration
const NODE_CONFIG = {
  service: {
    color: "#8b5cf6",
    bgColor: "#f5f3ff",
    borderColor: "#c4b5fd",
    icon: Globe,
    label: "Layanan",
  },
  process: {
    color: "#3b82f6",
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
    icon: Workflow,
    label: "Proses Bisnis",
  },
  app: {
    color: "#f59e0b",
    bgColor: "#fffbeb",
    borderColor: "#fcd34d",
    icon: AppWindow,
    label: "Aplikasi",
  },
  data: {
    color: "#10b981",
    bgColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    icon: Database,
    label: "Data",
  },
  infra: {
    color: "#ef4444",
    bgColor: "#fef2f2",
    borderColor: "#fecaca",
    icon: Server,
    label: "Infrastruktur",
  },
  security: {
    color: "#ec4899",
    bgColor: "#fdf2f8",
    borderColor: "#fbcfe8",
    icon: Shield,
    label: "Keamanan",
  },
} as const;

type NodeType = keyof typeof NODE_CONFIG;

interface TraceNodeData {
  [key: string]: unknown;
  label: string;
  type: NodeType;
  exists: boolean;
  details?: string;
}

// Custom Trace Node Component
function TraceNode({ data }: NodeProps<Node<TraceNodeData>>) {
  const config = NODE_CONFIG[data.type];
  const Icon = config.icon;

  return (
    <div
      className="rounded-lg border-2 px-4 py-3 shadow-md"
      style={{
        backgroundColor: data.exists ? config.bgColor : "#f8fafc",
        borderColor: data.exists ? config.borderColor : "#e2e8f0",
        opacity: data.exists ? 1 : 0.6,
        minWidth: "140px",
      }}
    >
      <Handle
        className="!h-3 !w-3 !border-2 !border-white"
        position={Position.Left}
        style={{ backgroundColor: data.exists ? config.color : "#94a3b8" }}
        type="target"
      />
      <div className="flex items-center gap-2">
        <div
          className="rounded-md p-1.5"
          style={{ backgroundColor: data.exists ? config.color : "#94a3b8" }}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <p
            className="font-semibold text-sm"
            style={{ color: data.exists ? config.color : "#64748b" }}
          >
            {data.label}
          </p>
          {data.details && (
            <p className="text-muted-foreground text-xs">{data.details}</p>
          )}
        </div>
        {data.exists ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-400" />
        )}
      </div>
      <Handle
        className="!h-3 !w-3 !border-2 !border-white"
        position={Position.Right}
        style={{ backgroundColor: data.exists ? config.color : "#94a3b8" }}
        type="source"
      />
    </div>
  );
}

const nodeTypes = {
  trace: TraceNode,
};

interface TraceabilityViewProps {
  serviceId: string;
}

export function TraceabilityView({ serviceId }: TraceabilityViewProps) {
  const trpc = useTRPC();
  const { data, isLoading, error } = useQuery(
    trpc.service.traceability.queryOptions({ id: serviceId })
  );

  const { nodes, edges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };

    const { service, completeness } = data;

    const nodeList: Node<TraceNodeData>[] = [
      {
        id: "service",
        type: "trace",
        position: { x: 0, y: 100 },
        data: {
          label: service.name,
          type: "service",
          exists: true,
          details: service.type,
        },
      },
      {
        id: "process",
        type: "trace",
        position: { x: 200, y: 50 },
        data: {
          label: service.businessProcess?.name ?? "Tidak ada",
          type: "process",
          exists: completeness.process,
          details: service.businessProcess?.kodeProbismet,
        },
      },
      {
        id: "app",
        type: "trace",
        position: { x: 200, y: 150 },
        data: {
          label: service.application?.name ?? "Tidak ada",
          type: "app",
          exists: completeness.app,
          details: service.application?.opd?.acronym ?? undefined,
        },
      },
      {
        id: "data",
        type: "trace",
        position: { x: 400, y: 50 },
        data: {
          label: service.application?.usedData?.length
            ? `${service.application.usedData.length} standar data`
            : "Tidak ada",
          type: "data",
          exists: completeness.data,
        },
      },
      {
        id: "infra",
        type: "trace",
        position: { x: 400, y: 150 },
        data: {
          label: service.application?.infrastructure?.length
            ? `${service.application.infrastructure.length} aset`
            : "Tidak ada",
          type: "infra",
          exists: completeness.infra,
        },
      },
      {
        id: "security",
        type: "trace",
        position: { x: 600, y: 100 },
        data: {
          label: completeness.security ? "Teraudit" : "Belum audit",
          type: "security",
          exists: completeness.security,
          details: service.application?.securityAudits?.[0]?.status,
        },
      },
    ];

    const edgeList: Edge[] = [
      {
        id: "e-service-process",
        source: "service",
        target: "process",
        animated: completeness.process,
        style: {
          stroke: completeness.process ? "#3b82f6" : "#cbd5e1",
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: completeness.process ? "#3b82f6" : "#cbd5e1",
        },
      },
      {
        id: "e-service-app",
        source: "service",
        target: "app",
        animated: completeness.app,
        style: {
          stroke: completeness.app ? "#f59e0b" : "#cbd5e1",
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: completeness.app ? "#f59e0b" : "#cbd5e1",
        },
      },
      {
        id: "e-app-data",
        source: "app",
        target: "data",
        animated: completeness.data,
        style: {
          stroke: completeness.data ? "#10b981" : "#cbd5e1",
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: completeness.data ? "#10b981" : "#cbd5e1",
        },
      },
      {
        id: "e-app-infra",
        source: "app",
        target: "infra",
        animated: completeness.infra,
        style: {
          stroke: completeness.infra ? "#ef4444" : "#cbd5e1",
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: completeness.infra ? "#ef4444" : "#cbd5e1",
        },
      },
      {
        id: "e-infra-security",
        source: "infra",
        target: "security",
        animated: completeness.security,
        style: {
          stroke: completeness.security ? "#ec4899" : "#cbd5e1",
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: completeness.security ? "#ec4899" : "#cbd5e1",
        },
      },
    ];

    return { nodes: nodeList, edges: edgeList };
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Gagal memuat data traceability layanan
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Completeness Summary */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Traceability: {data.service.name}
              </CardTitle>
              <CardDescription>
                Keterpaduan arsitektur layanan SPBE
              </CardDescription>
            </div>
            <Badge
              className="text-sm"
              variant={data.isFullyIntegrated ? "default" : "destructive"}
            >
              {data.completeness.score}% Terintegrasi
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress className="h-2" value={data.completeness.score} />
        </CardContent>
      </Card>

      {/* Graph */}
      <Card>
        <CardContent className="p-0">
          <div className="h-[300px] w-full">
            <ReactFlow
              edges={edges}
              fitView
              nodes={nodes}
              nodeTypes={nodeTypes}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#e2e8f0" gap={16} />
              <Controls />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>

      {/* Gaps */}
      {data.gaps.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Gap Arsitektur Teridentifikasi</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {data.gaps.map((gap, index) => (
                <li key={index}>{gap}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
