"use client";

import {
  Background,
  Controls,
  type Edge,
  Handle,
  MarkerType,
  MiniMap,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useCallback, useMemo } from "react";
import "@xyflow/react/dist/style.css";
import {
  AppWindow,
  Database,
  Globe,
  Server,
  Shield,
  Workflow,
} from "lucide-react";

// Domain configuration with colors and icons
const DOMAIN_CONFIG = {
  PROSES_BISNIS: {
    color: "#3b82f6",
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
    label: "Proses Bisnis",
    icon: Workflow,
  },
  DATA: {
    color: "#10b981",
    bgColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    label: "Data",
    icon: Database,
  },
  LAYANAN: {
    color: "#8b5cf6",
    bgColor: "#f5f3ff",
    borderColor: "#c4b5fd",
    label: "Layanan",
    icon: Globe,
  },
  APLIKASI: {
    color: "#f59e0b",
    bgColor: "#fffbeb",
    borderColor: "#fcd34d",
    label: "Aplikasi",
    icon: AppWindow,
  },
  INFRASTRUKTUR: {
    color: "#ef4444",
    bgColor: "#fef2f2",
    borderColor: "#fecaca",
    label: "Infrastruktur",
    icon: Server,
  },
  KEAMANAN: {
    color: "#ec4899",
    bgColor: "#fdf2f8",
    borderColor: "#fbcfe8",
    label: "Keamanan",
    icon: Shield,
  },
} as const;

type DomainType = keyof typeof DOMAIN_CONFIG;

interface DomainNodeData {
  [key: string]: unknown;
  label: string;
  domain: DomainType;
  count?: number;
  description?: string;
}

// Custom Domain Node Component
function DomainNode({ data }: NodeProps<Node<DomainNodeData>>) {
  const config = DOMAIN_CONFIG[data.domain];
  const Icon = config.icon;

  return (
    <div
      className="rounded-lg border-2 px-4 py-3 shadow-md transition-shadow hover:shadow-lg"
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
        minWidth: "140px",
        maxWidth: "200px",
      }}
    >
      <Handle
        className="!h-3 !w-3 !border-2 !border-white"
        position={Position.Left}
        style={{ backgroundColor: config.color }}
        type="target"
      />
      <div className="flex items-center gap-2">
        <div
          className="rounded-md p-1.5"
          style={{ backgroundColor: config.color }}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm" style={{ color: config.color }}>
            {data.label}
          </p>
          {data.count !== undefined && (
            <p className="text-muted-foreground text-xs">{data.count} item</p>
          )}
        </div>
      </div>
      {data.description && (
        <p className="mt-2 text-muted-foreground text-xs">{data.description}</p>
      )}
      <Handle
        className="!h-3 !w-3 !border-2 !border-white"
        position={Position.Right}
        style={{ backgroundColor: config.color }}
        type="source"
      />
    </div>
  );
}

const nodeTypes = {
  domain: DomainNode,
};

export interface ArchitectureNode {
  id: string;
  domain: DomainType;
  label: string;
  count?: number;
  description?: string;
}

export interface ArchitectureEdge {
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

interface ArchitectureGraphProps {
  nodes?: ArchitectureNode[];
  edges?: ArchitectureEdge[];
  height?: number;
  showMiniMap?: boolean;
  showControls?: boolean;
}

// Default SPBE architecture layout
const defaultNodes: ArchitectureNode[] = [
  {
    id: "layanan",
    domain: "LAYANAN",
    label: "Layanan SPBE",
    description: "G2C, G2B, G2G, G2E",
  },
  {
    id: "probis",
    domain: "PROSES_BISNIS",
    label: "Proses Bisnis",
    description: "Sektor → Urusan → Fungsi",
  },
  {
    id: "aplikasi",
    domain: "APLIKASI",
    label: "Aplikasi",
    description: "Umum & Khusus",
  },
  {
    id: "data",
    domain: "DATA",
    label: "Data & Informasi",
    description: "Satu Data Indonesia",
  },
  {
    id: "infrastruktur",
    domain: "INFRASTRUKTUR",
    label: "Infrastruktur",
    description: "PDN & Lokal",
  },
  {
    id: "keamanan",
    domain: "KEAMANAN",
    label: "Keamanan",
    description: "Audit & Risiko",
  },
];

const defaultEdges: ArchitectureEdge[] = [
  { source: "layanan", target: "probis", animated: true },
  { source: "layanan", target: "aplikasi", animated: true },
  { source: "probis", target: "aplikasi" },
  { source: "aplikasi", target: "data" },
  { source: "aplikasi", target: "infrastruktur" },
  { source: "data", target: "infrastruktur" },
  { source: "infrastruktur", target: "keamanan" },
  { source: "aplikasi", target: "keamanan" },
];

// Layout positions for default architecture view
const layoutPositions: Record<string, { x: number; y: number }> = {
  layanan: { x: 0, y: 150 },
  probis: { x: 250, y: 50 },
  aplikasi: { x: 250, y: 250 },
  data: { x: 500, y: 100 },
  infrastruktur: { x: 500, y: 300 },
  keamanan: { x: 750, y: 200 },
};

export function ArchitectureGraph({
  nodes: inputNodes,
  edges: inputEdges,
  height = 400,
  showMiniMap = true,
  showControls = true,
}: ArchitectureGraphProps) {
  const archNodes = inputNodes ?? defaultNodes;
  const archEdges = inputEdges ?? defaultEdges;

  const initialNodes: Node<DomainNodeData>[] = useMemo(
    () =>
      archNodes.map((node, index) => ({
        id: node.id,
        type: "domain",
        position: layoutPositions[node.id] ?? {
          x: (index % 3) * 250,
          y: Math.floor(index / 3) * 150,
        },
        data: {
          label: node.label,
          domain: node.domain,
          count: node.count,
          description: node.description,
        },
      })),
    [archNodes]
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      archEdges.map((edge, index) => {
        const sourceNode = archNodes.find((n) => n.id === edge.source);
        const sourceConfig = sourceNode
          ? DOMAIN_CONFIG[sourceNode.domain]
          : null;

        return {
          id: `e-${edge.source}-${edge.target}-${index}`,
          source: edge.source,
          target: edge.target,
          animated: edge.animated ?? false,
          label: edge.label,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: sourceConfig?.color ?? "#64748b",
          },
          style: {
            stroke: sourceConfig?.color ?? "#64748b",
            strokeWidth: 2,
          },
        };
      }),
    [archEdges, archNodes]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onInit = useCallback(() => {
    // Graph initialized
  }, []);

  return (
    <div
      className="w-full max-w-full overflow-hidden rounded-lg border bg-background"
      style={{ height }}
    >
      <ReactFlow
        attributionPosition="bottom-left"
        edges={edges}
        fitView
        nodes={nodes}
        nodeTypes={nodeTypes}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        onNodesChange={onNodesChange}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e2e8f0" gap={16} />
        {showControls && <Controls />}
        {showMiniMap && (
          <MiniMap
            className="!bg-background"
            maskColor="rgba(0, 0, 0, 0.1)"
            nodeColor={(node) => {
              const data = node.data as DomainNodeData;
              return DOMAIN_CONFIG[data.domain]?.color ?? "#64748b";
            }}
          />
        )}
      </ReactFlow>
    </div>
  );
}

// Export domain config for use in other components
export { DOMAIN_CONFIG };
export type { DomainType, DomainNodeData };
