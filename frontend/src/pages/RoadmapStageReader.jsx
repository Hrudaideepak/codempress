import React, { useState, useEffect } from "react";
import { useIsMobile } from "../utils/useIsMobile";
import { useParams, useNavigate } from "react-router-dom";
import { STATIC_ROADMAPS } from "../data/staticRoadmaps";
import { soundService } from "../services/soundService";
import {
  ArrowLeft,
  BookOpen,
  Code2,
  Brain,
  CheckCircle2,
  ArrowRight,
  Shield,
  Layers,
  Sparkles
} from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import InteractiveCodeSandbox from "../components/InteractiveCodeSandbox";

export default function RoadmapStageReader() {
  const { slug, stageId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [roadmap, setRoadmap] = useState(null);
  const [stage, setStage] = useState(null);
  const [selectedTopicIdx, setSelectedTopicIdx] = useState(0);

  useEffect(() => {
    const foundRoadmap = STATIC_ROADMAPS.find((r) => r.slug === slug);
    if (foundRoadmap) {
      setRoadmap(foundRoadmap);
      const foundStage = (foundRoadmap.milestones || []).find(
        (m) => (m.stage_id || m.id) === stageId
      );
      if (foundStage) {
        setStage(foundStage);
      }
    }
  }, [slug, stageId]);

  if (!roadmap || !stage) {
    return (
      <div style={{ maxWidth: "900px", margin: "40px auto", textAlign: "center" }}>
        <h2>Stage Not Found</h2>
        <p>The requested role stage does not exist.</p>
        <Button variant="primary" onClick={() => navigate(`/roadmaps/${slug || ""}`)}>
          Back to Roadmap
        </Button>
      </div>
    );
  }

  const topics = stage.scoped_topics || [];
  const currentTopic = topics[selectedTopicIdx] || topics[0] || {
    title: stage.title,
    role_depth_focus: `${roadmap.title} Role Depth Focus`,
    overview: stage.description,
    theory_markdown: `### ${stage.title}\n${stage.description}`,
    code_example: {
      title: `${roadmap.title} Pattern Example`,
      code: `// ${roadmap.title} Scoped Pattern\nconsole.log("Executing ${stage.title}");`,
      explanation: `Demonstrates implementation pattern for ${roadmap.title}.`
    }
  };

  return (
    <div style={{ maxWidth: "1140px", margin: "0 auto", paddingBottom: "80px" }}>
      {/* Back Header */}
      <button
        onClick={() => {
          soundService.play("click");
          navigate(`/roadmaps/${slug}`);
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "none",
          border: "none",
          color: "var(--primary)",
          fontWeight: 700,
          fontSize: "14px",
          cursor: "pointer",
          marginBottom: "20px"
        }}
      >
        <ArrowLeft size={18} /> Back to {roadmap.title} Overview
      </button>

      {/* Stage Scope Banner */}
      <div
        className="glass-panel"
        style={{
          marginBottom: "28px",
          padding: "28px 24px",
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(15, 23, 42, 0.9) 100%)",
          border: "1.5px solid rgba(139, 92, 246, 0.3)",
          borderRadius: "20px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary)", fontWeight: 700, fontSize: "12px", marginBottom: "4px" }}>
              <Layers size={16} />
              <span>ROLE-SCOPED COURSE • {roadmap.title?.toUpperCase()}</span>
            </div>
            <h1 style={{ fontSize: "24px", margin: "0 0 6px 0", color: "#0F172A", fontWeight: 800 }}>
              {stage.title}
            </h1>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px", margin: 0 }}>
              {stage.description}
            </p>
          </div>

          <span className="pill xp" style={{ background: "#EDE9FE", color: "#7C3AED", fontWeight: 700, fontSize: "13px" }}>
            🎯 {stage.role_scope || `${roadmap.title} Depth`}
          </span>
        </div>
      </div>

      {/* Main Scoped Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile || topics.length <= 1 ? "1fr" : "280px 1fr", gap: "24px" }}>
        {/* Topic Selector Sidebar */}
        {topics.length > 1 && (
          <Card padding="16px" style={{ height: "fit-content" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", color: "var(--ink-faint)", fontWeight: 800, textTransform: "uppercase" }}>
              Stage Modules ({topics.length})
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {topics.map((top, idx) => (
                <button
                  key={top.topic_id || idx}
                  onClick={() => {
                    soundService.play("click");
                    setSelectedTopicIdx(idx);
                  }}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: selectedTopicIdx === idx ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                    background: selectedTopicIdx === idx ? "var(--primary-soft)" : "transparent",
                    color: selectedTopicIdx === idx ? "var(--primary)" : "#0F172A",
                    fontWeight: selectedTopicIdx === idx ? 700 : 500,
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  {idx + 1}. {top.title}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Scoped Topic Reader Body */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Depth Focus Callout */}
          <Card padding="20px" style={{ background: "#F5F3FF", border: "1px solid #DDD6FE" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <Sparkles size={18} color="#7C3AED" />
              <h4 style={{ margin: 0, fontSize: "15px", color: "#7C3AED", fontWeight: 800 }}>
                {currentTopic.role_depth_focus || `${roadmap.title} Role Focus`}
              </h4>
            </div>
            <p style={{ margin: 0, fontSize: "14px", color: "#4C1D95", lineHeight: 1.5 }}>
              {currentTopic.overview}
            </p>
          </Card>

          {/* Theory Prose */}
          <Card padding="28px">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
              <BookOpen size={20} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800 }}>
                {currentTopic.title}
              </h3>
            </div>

            <div style={{ fontSize: "15px", lineHeight: 1.7, color: "#334155" }}>
              <div style={{ whiteSpace: "pre-line" }}>
                {currentTopic.theory_markdown}
              </div>
            </div>
          </Card>

          {/* Interactive Code Example */}
          {currentTopic.code_example && (
            <Card padding="24px">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <Code2 size={20} color="var(--accent-cyan)" />
                <h3 style={{ margin: 0, fontSize: "16px", color: "#0F172A", fontWeight: 800 }}>
                  {currentTopic.code_example.title}
                </h3>
              </div>

              <InteractiveCodeSandbox
                initialCode={currentTopic.code_example.code}
                initialLanguage="javascript"
                topicId={1}
              />

              <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: "12px", margin: 0 }}>
                💡 <strong>Explanation:</strong> {currentTopic.code_example.explanation}
              </p>
            </Card>
          )}

          {/* Complete Stage Action */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px" }}>
            <Button variant="ghost" onClick={() => navigate(`/roadmaps/${slug}`)}>
              Back to {roadmap.title} Overview
            </Button>

            {selectedTopicIdx < topics.length - 1 ? (
              <Button
                variant="glowing"
                onClick={() => {
                  soundService.play("click");
                  setSelectedTopicIdx((prev) => prev + 1);
                }}
                rightIcon={<ArrowRight size={16} />}
              >
                Next Module: {topics[selectedTopicIdx + 1]?.title}
              </Button>
            ) : (
              <Button
                variant="glowing"
                onClick={() => {
                  soundService.play("levelup");
                  navigate(`/roadmaps/${slug}`);
                }}
                rightIcon={<CheckCircle2 size={16} />}
              >
                Complete Stage & Return
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
