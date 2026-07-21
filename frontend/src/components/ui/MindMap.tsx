import { useEffect, useState, useCallback, useMemo } from "react";
import ReactFlow, {
  type Node,
  type Edge,
  type NodeProps,
  type NodeTypes,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { apiClient } from "../../services/apiClient";
import { useAppStore } from "../../store/appStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MindMapNode {
  id: number;
  topic_id: number;
  title: string;
  content: string;
  node_type: "concept" | "fork_point" | "challenge_prep";
  position_x: number;
  position_y: number;
  parent_id: number | null;
  fork_options: ForkOptions | null;
  is_optional: boolean;
  is_locked: boolean;
  is_available: boolean;
  is_completed: boolean;
  user_status: string;
}

interface ForkOptions {
  paths: Array<{
    id: string;
    title: string;
    starting_node_ids: number[];
  }>;
}

interface FlowNodeData {
  label: string;
  nodeType: string;
  locked: boolean;
  available: boolean;
  completed: boolean;
  isFork: boolean;
  forkOptions: ForkOptions | null;
  nodeId: number;
  content: string;
}

// ---------------------------------------------------------------------------
// Custom node component — "Runestone"
// ---------------------------------------------------------------------------

function RunestoneNode({ data }: NodeProps<FlowNodeData>) {
  const baseColor = data.locked
    ? "#3a3a4a"
    : data.completed
    ? "#2ecc71"
    : data.isFork
    ? "#A78BFA"
    : "#45A29E";

  const glow = data.completed ? "0 0 14px rgba(46, 204, 113, 0.6)" : "none";

  return (
    <div
      style={{
        background: baseColor,
        color: data.locked ? "#777" : "#fff",
        border: `2px solid ${baseColor}`,
        borderRadius: 12,
        padding: "10px 16px",
        minWidth: 140,
        maxWidth: 200,
        textAlign: "center",
        fontSize: 13,
        fontWeight: 600,
        boxShadow: glow,
        cursor: data.available ? "pointer" : "not-allowed",
        opacity: data.locked ? 0.5 : 1,
        transition: "box-shadow 0.2s, opacity 0.2s",
        position: "relative",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: "#555" }} />

      {/* Chain icon for locked */}
      {data.locked && (
        <span style={{ display: "block", fontSize: 18, marginBottom: 4 }}>🔗</span>
      )}

      {/* Checkmark for completed */}
      {data.completed && (
        <span
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            background: "#2ecc71",
            borderRadius: "50%",
            width: 20,
            height: 20,
            fontSize: 12,
            lineHeight: "20px",
            color: "#fff",
          }}
        >
          ✓
        </span>
      )}

      <span style={{ display: "block" }}>{data.label}</span>

      {data.nodeType === "challenge_prep" && (
        <span style={{ fontSize: 10, opacity: 0.6, display: "block", marginTop: 4 }}>
          ⚔️ Prep
        </span>
      )}
      {data.isFork && (
        <span style={{ fontSize: 10, opacity: 0.6, display: "block", marginTop: 4 }}>
          🔀 Fork
        </span>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: "#555" }} />
    </div>
  );
}

const nodeTypes: NodeTypes = { runestone: RunestoneNode };

// ---------------------------------------------------------------------------
// MindMap component
// ---------------------------------------------------------------------------

interface MindMapProps {
  topicId: number;
  /** Called when a fork choice is made so the parent can refresh */
  onForkChosen?: () => void;
}

export default function MindMap({ topicId, onForkChosen }: MindMapProps) {
  const [rawNodes, setRawNodes] = useState<MindMapNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const addXP = useAppStore((s) => s.addXP);

  // ── Fetch mind-map data ────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiClient
      .get<{ topic_id: number; nodes: MindMapNode[] }>(
        `/topics/${topicId}/mindmap`
      )
      .then((data) => {
        if (!cancelled) {
          setRawNodes(data.nodes ?? []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message ?? "Failed to load mind map");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [topicId]);

  // ── Convert to React Flow format ───────────────────────────────────

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node<FlowNodeData>[] = rawNodes.map((n) => ({
      id: String(n.id),
      type: "runestone",
      position: { x: n.position_x, y: n.position_y },
      data: {
        label: n.title,
        nodeType: n.node_type,
        locked: n.is_locked,
        available: n.is_available,
        completed: n.is_completed,
        isFork: n.node_type === "fork_point",
        forkOptions: n.fork_options,
        nodeId: n.id,
        content: n.content,
      },
    }));

    const edges: Edge[] = [];

    for (const n of rawNodes) {
      // Parent → child edge
      if (n.parent_id != null) {
        edges.push({
          id: `e-${n.parent_id}-${n.id}`,
          source: String(n.parent_id),
          target: String(n.id),
          animated: !n.is_locked && !n.is_completed,
          style: {
            stroke: n.is_locked ? "#444" : "#45A29E",
            strokeWidth: n.is_completed ? 2 : 1.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: n.is_locked ? "#444" : "#45A29E",
          },
        });
      }

      // Fork options → extra edges to starting nodes
      if (n.fork_options?.paths) {
        for (const path of n.fork_options.paths) {
          for (const childId of path.starting_node_ids) {
            // Only add if not already covered by parent_id
            const already = edges.some(
              (e) =>
                e.source === String(n.id) && e.target === String(childId)
            );
            if (!already) {
              edges.push({
                id: `e-${n.id}-${childId}-fork`,
                source: String(n.id),
                target: String(childId),
                animated: true,
                style: { stroke: "#A78BFA", strokeWidth: 1.5, strokeDasharray: "5 5" },
                label: path.title,
                markerEnd: { type: MarkerType.ArrowClosed, color: "#A78BFA" },
              });
            }
          }
        }
      }
    }

    return { initialNodes: nodes, initialEdges: edges };
  }, [rawNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when memoised values change
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // ── Node click handler ─────────────────────────────────────────────

  const onNodeClick = useCallback(
    async (_: React.MouseEvent, node: Node<FlowNodeData>) => {
      const d = node.data;
      if (d.locked) return;
      if (d.completed) return;

      // Fork point — ask user to choose a path
      if (d.isFork && d.forkOptions) {
        const chosen = await chooseForkPath(d.forkOptions);
        if (!chosen) return;
        try {
          await apiClient.post(`/forks/${d.nodeId}/choose?path_id=${chosen}`);
          addXP(30);
          onForkChosen?.();
          // Refetch
          setLoading(true);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Fork choice failed";
          alert(msg);
        }
        return;
      }

      // Regular node — mark complete
      try {
        const res = await apiClient.post<{ xp_earned: number }>(
          `/nodes/${d.nodeId}/complete`
        );
        addXP(res.xp_earned);
        onForkChosen?.(); // same refresh signal
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Completion failed";
        alert(msg);
      }
    },
    [addXP, onForkChosen]
  );

  // ── Render ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <span style={{ color: "#A78BFA" }}>🌀 Loading mind map…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <span style={{ color: "#e74c3c" }}>⚠️ {error}</span>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 500 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#333" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(n) =>
            n.data?.completed ? "#2ecc71" : n.data?.locked ? "#444" : "#45A29E"
          }
          style={{ background: "#1a1a2e" }}
        />
      </ReactFlow>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fork path selector (simple window.prompt-based for now)
// ---------------------------------------------------------------------------

async function chooseForkPath(options: ForkOptions): Promise<string | null> {
  // For a real UX, render a modal.  Here we use a simple prompt-based picker.
  const labels = options.paths.map((p) => `${p.id}: ${p.title}`);
  const input = window.prompt(
    `Choose your path:\n${labels.join("\n")}\n\nEnter the path ID:`,
    options.paths[0]?.id ?? ""
  );
  if (!input) return null;
  const match = options.paths.find((p) => p.id === input.trim());
  return match ? match.id : null;
}
