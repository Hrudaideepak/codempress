import React from "react";
import { Lock, CheckCircle2, Star, Sparkles } from "lucide-react";

interface Topic {
  id: number;
  title: string;
  description: string;
  level_name?: string;
  locked?: boolean;
  cleared?: boolean;
  xp?: number;
  mastery?: number;
}

interface MindMapProps {
  topics: Topic[];
  onSelectTopic: (topic: Topic) => void;
}

export default function MindMap({ topics, onSelectTopic }: MindMapProps) {
  if (!topics || topics.length === 0) return null;

  return (
    <div
      style={{
        position: "relative",
        padding: "40px 20px",
        maxWidth: "800px",
        margin: "0 auto"
      }}
    >
      {/* Central SVG Connector Line */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 0
        }}
      >
        <line
          x1="50%"
          y1="40"
          x2="50%"
          y2="95%"
          stroke="rgba(139, 92, 246, 0.3)"
          strokeWidth="3"
          strokeDasharray="6 6"
        />
      </svg>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "36px",
          position: "relative",
          zIndex: 1
        }}
      >
        {topics.map((topic, idx) => {
          const isEven = idx % 2 === 0;
          const isLocked = topic.locked;
          const isCleared = topic.cleared;

          return (
            <div
              key={topic.id}
              style={{
                display: "flex",
                justifyContent: isEven ? "flex-start" : "flex-end",
                position: "relative",
                alignItems: "center"
              }}
            >
              {/* Milestone Center Node Badge */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: isLocked
                    ? "#1F2937"
                    : isCleared
                    ? "linear-gradient(135deg, #10B981, #059669)"
                    : "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  border: "3px solid #E2E8F0",
                  boxShadow: isLocked
                    ? "none"
                    : isCleared
                    ? "0 0 16px rgba(16, 185, 129, 0.5)"
                    : "0 0 16px rgba(99, 102, 241, 0.5)",
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "12px",
                  zIndex: 2
                }}
              >
                {isCleared ? "✓" : idx + 1}
              </div>

              {/* Node Card */}
              <div
                className="glass-card"
                onClick={() => !isLocked && onSelectTopic(topic)}
                style={{
                  width: "44%",
                  cursor: isLocked ? "not-allowed" : "pointer",
                  opacity: isLocked ? 0.5 : 1,
                  borderColor: isCleared
                    ? "#A7F3D0"
                    : isLocked
                    ? "#E2E8F0"
                    : "#DDD6FE"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", alignItems: "center" }}>
                  <span className="pill xp" style={{ fontSize: "11px", padding: "2px 8px" }}>
                    {topic.level_name || `Module ${idx + 1}`}
                  </span>
                  {isLocked ? (
                    <span style={{ fontSize: "12px", color: "var(--ink-faint)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Lock size={12} /> Locked
                    </span>
                  ) : isCleared ? (
                    <span style={{ fontSize: "12px", color: "#34D399", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle2 size={14} /> Mastered
                    </span>
                  ) : (
                    <span style={{ fontSize: "12px", color: "#FBBF24", fontWeight: 700 }}>● Active</span>
                  )}
                </div>

                <h4 style={{ fontSize: "16px", color: "#0F172A", marginBottom: "6px" }}>
                  {topic.title}
                </h4>
                <p style={{ fontSize: "13px", color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: "12px" }}>
                  {topic.description}
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 700 }}>+{topic.xp || 25} XP</span>
                  {!isLocked && typeof topic.mastery === "number" && (
                    <span style={{ fontSize: "12px", color: "var(--ink-soft)", fontWeight: 600 }}>
                      {topic.mastery}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
