/**
 * RecapModule — "Parchment of Recall"
 *
 * Slideshow that shows the user's last 3 completed nodes for a topic.
 * The mascot narrates the recap intro before the slides appear.
 * Uses Framer Motion for slide transitions.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "../../services/apiClient";
import { useAppStore } from "../../store/appStore";
import { MASCOTS } from "../../config/mascots";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecapNode {
  id: string;
  title: string;
  content: string;
  completed_at: string;
}

interface RecapData {
  topic_id: string;
  nodes: RecapNode[];
}

interface RecapModuleProps {
  topicId: string;
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RecapModule({ topicId, open, onClose }: RecapModuleProps) {
  const [data, setData] = useState<RecapData | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const mascotId = useAppStore((s) => s.mascotId);
  const mascot = MASCOTS.find((m) => m.id === mascotId);

  // Fetch recap data when opened
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSlideIdx(0);

    apiClient
      .get<RecapData>(`/topics/${topicId}/recap`)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [topicId, open]);

  if (!open) return null;

  const nodes = data?.nodes ?? [];
  const current = nodes[slideIdx];
  const hasPrev = slideIdx > 0;
  const hasNext = slideIdx < nodes.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        background: "rgba(11, 12, 16, 0.88)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 30 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        style={{
          background: "#1E1B2E",
          border: "2px solid #45A29E",
          borderRadius: 20,
          padding: 32,
          maxWidth: 600,
          width: "100%",
          color: "#C5C6C7",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ color: "#45A29E", margin: 0, fontSize: 20, fontWeight: 700 }}>
            📜 Parchment of Recall
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#888",
              fontSize: 22,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#A78BFA" }}>
            🔮 Consulting the archives…
          </div>
        )}

        {/* Empty state */}
        {!loading && nodes.length === 0 && (
          <div style={{ textAlign: "center", padding: 30 }}>
            <p style={{ color: "#45A29E", fontSize: 14 }}>
              {mascot?.getDialogue("idle") ?? "No completed nodes yet."}
            </p>
            <p style={{ color: "#888", fontSize: 13, marginTop: 8 }}>
              Complete some nodes first, and your journey will be remembered here.
            </p>
          </div>
        )}

        {/* Slideshow */}
        {!loading && nodes.length > 0 && (
          <>
            {/* Narration */}
            <p
              style={{
                color: "#A78BFA",
                fontStyle: "italic",
                fontSize: 13,
                marginBottom: 16,
                padding: "8px 12px",
                background: "#2a2740",
                borderRadius: 8,
              }}
            >
              🗣️ {mascot?.getDialogue("tour") ?? "Here's what you learned:"}
            </p>

            {/* Slide */}
            <AnimatePresence mode="wait">
              {current && (
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    background: "#0B0C10",
                    border: "1px solid #333",
                    borderRadius: 12,
                    padding: 20,
                    minHeight: 120,
                  }}
                >
                  <h3 style={{ color: "#45A29E", fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>
                    {current.title}
                  </h3>
                  <p style={{ color: "#999", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                    {current.content.slice(0, 300)}
                    {current.content.length > 300 ? "…" : ""}
                  </p>
                  <p style={{ color: "#555", fontSize: 11, marginTop: 8 }}>
                    Completed: {new Date(current.completed_at).toLocaleDateString()}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 16,
              }}
            >
              <button
                onClick={() => setSlideIdx((i) => i - 1)}
                disabled={!hasPrev}
                style={{
                  background: hasPrev ? "#2a2740" : "transparent",
                  border: "1px solid #444",
                  borderRadius: 8,
                  padding: "6px 16px",
                  color: hasPrev ? "#C5C6C7" : "#555",
                  cursor: hasPrev ? "pointer" : "default",
                }}
              >
                ← Prev
              </button>

              <span style={{ color: "#777", fontSize: 12 }}>
                {slideIdx + 1} / {nodes.length}
              </span>

              <button
                onClick={() => setSlideIdx((i) => i + 1)}
                disabled={!hasNext}
                style={{
                  background: hasNext ? "#2a2740" : "transparent",
                  border: "1px solid #444",
                  borderRadius: 8,
                  padding: "6px 16px",
                  color: hasNext ? "#C5C6C7" : "#555",
                  cursor: hasNext ? "pointer" : "default",
                }}
              >
                Next →
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                marginTop: 16,
                width: "100%",
                padding: "10px",
                background: "#45A29E",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Return to the Arcane Library
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
