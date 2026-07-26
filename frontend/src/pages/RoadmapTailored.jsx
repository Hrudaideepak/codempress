import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import { soundService } from "../services/soundService";
import {
  ArrowLeft,
  Sparkles,
  Award,
  CheckCircle2,
  Circle,
  BookOpen,
  Code2,
  Briefcase,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight,
  Zap,
  ShieldAlert
} from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";
import InteractiveCodeSandbox from "../components/InteractiveCodeSandbox";

export default function RoadmapTailored() {
  const { roadmapId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(1);
  const [skeleton, setSkeleton] = useState(null);
  const [completedNodes, setCompletedNodes] = useState([]);
  
  // Lazy Loaded Stage Module Modal State
  const [selectedStage, setSelectedStage] = useState(null);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleData, setModuleData] = useState(null);

  useEffect(() => {
    // Progressive Loading Sequence
    const timer1 = setTimeout(() => setLoadingStep(2), 600);
    const timer2 = setTimeout(() => setLoadingStep(3), 1200);

    // Fetch user resume context if available
    api.getMentorResume()
      .then((res) => {
        const targetRole = res.target_role || roadmapId?.replace("tailored-", "").replace(/-/g, " ") || "AI Software Engineer";
        const skills = res.skills || ["Python", "JavaScript"];
        const expLevel = res.experience_level || "Mid";

        return api.generateRoadmapSkeleton(targetRole, "Accelerated Career Transition", skills, expLevel);
      })
      .then((skel) => {
        setSkeleton(skel);
        // Load node progress
        return api.getRoadmapNodeProgress(skel.slug || roadmapId);
      })
      .then((prog) => {
        if (prog && prog.completed_nodes) {
          setCompletedNodes(prog.completed_nodes);
        }
      })
      .catch((err) => {
        console.error("Tailored roadmap error:", err);
      })
      .finally(() => {
        setLoading(false);
        clearTimeout(timer1);
        clearTimeout(timer2);
      });
  }, [roadmapId]);

  const handleToggleNode = async (nodeId, e) => {
    if (e) e.stopPropagation();
    soundService.play("click");
    
    const nextCompleted = completedNodes.includes(nodeId)
      ? completedNodes.filter((id) => id !== nodeId)
      : [...completedNodes, nodeId];
      
    setCompletedNodes(nextCompleted);

    try {
      await api.toggleRoadmapNodeProgress(skeleton?.slug || roadmapId, nodeId);
      if (!completedNodes.includes(nodeId)) {
        soundService.play("levelup");
        toast.show("Stage completed! XP Progress updated.", "success");
      }
    } catch (err) {
      console.error("Failed to sync node progress:", err);
    }
  };

  const handleOpenStageModule = async (stage) => {
    soundService.play("click");
    setSelectedStage(stage);
    setModuleLoading(true);
    setModuleData(null);

    try {
      const res = await api.generateRoadmapModule(
        skeleton?.title || "Custom Roadmap",
        stage.title,
        stage.description,
        stage.role_scope || `${skeleton?.target_role} Depth`
      );
      setModuleData(res);
    } catch (err) {
      toast.show("Failed to lazy load stage content. Using offline template.", "warning");
    } finally {
      setModuleLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "800px", margin: "60px auto", textAlign: "center", padding: "40px 20px" }}>
        <Spinner size="lg" color="var(--primary)" />
        <h2 style={{ fontSize: "22px", color: "#0F172A", marginTop: "24px", fontWeight: 800 }}>
          Synthesizing AI-Generated Career Path...
        </h2>
        <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "32px" }}>
          Generating a personalized roadmap skeleton tailored to your resume skills.
        </p>

        {/* Progressive Loading Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "480px", margin: "0 auto", textAlign: "left" }}>
          <div style={{ padding: "12px 16px", borderRadius: "10px", background: loadingStep >= 1 ? "var(--primary-soft)" : "var(--bg-subtle)", color: loadingStep >= 1 ? "var(--primary)" : "var(--ink-faint)", fontWeight: 700, fontSize: "13px" }}>
            {loadingStep >= 1 ? "✓ 1. Extracting Resume Context & Target Role..." : "○ 1. Extracting Resume Context..."}
          </div>
          <div style={{ padding: "12px 16px", borderRadius: "10px", background: loadingStep >= 2 ? "var(--primary-soft)" : "var(--bg-subtle)", color: loadingStep >= 2 ? "var(--primary)" : "var(--ink-faint)", fontWeight: 700, fontSize: "13px" }}>
            {loadingStep >= 2 ? "✓ 2. Mapping Skill Gaps & Stage Milestones..." : "○ 2. Mapping Skill Gaps..."}
          </div>
          <div style={{ padding: "12px 16px", borderRadius: "10px", background: loadingStep >= 3 ? "var(--primary-soft)" : "var(--bg-subtle)", color: loadingStep >= 3 ? "var(--primary)" : "var(--ink-faint)", fontWeight: 700, fontSize: "13px" }}>
            {loadingStep >= 3 ? "⚡ 3. Finalizing Stable URL & Role Blueprint..." : "○ 3. Finalizing Blueprint..."}
          </div>
        </div>
      </div>
    );
  }

  if (!skeleton) {
    return (
      <div style={{ maxWidth: "800px", margin: "40px auto", textAlign: "center" }}>
        <h2>Roadmap Could Not Be Generated</h2>
        <p>Please try uploading your resume again in the AI Mentor tab.</p>
        <Button variant="primary" onClick={() => navigate("/mentor")}>
          Go to AI Mentor
        </Button>
      </div>
    );
  }

  const stages = skeleton.stages || [];
  const percentComplete = stages.length > 0 ? Math.round((completedNodes.length / stages.length) * 100) : 0;

  return (
    <div style={{ maxWidth: "1140px", margin: "0 auto", paddingBottom: "80px" }}>
      {/* Back button */}
      <button
        onClick={() => {
          soundService.play("click");
          navigate("/roadmaps");
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
        <ArrowLeft size={18} /> Back to Directory
      </button>

      {/* Tailored Banner */}
      <div
        className="glass-panel"
        style={{
          marginBottom: "32px",
          padding: "36px 32px",
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)",
          border: "1.5px solid rgba(139, 92, 246, 0.4)",
          borderRadius: "24px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ flex: 1, minWidth: "300px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
              <span className="pill xp" style={{ background: "#7C3AED", color: "#FFFFFF", fontWeight: 800 }}>
                ✨ TAILORED FOR YOU
              </span>
              <span style={{ fontSize: "12px", color: "var(--ink-soft)", fontFamily: "var(--mono)" }}>
                Stable URL: /roadmaps/tailored/{roadmapId}
              </span>
            </div>

            <h1 style={{ fontSize: "32px", margin: "0 0 10px 0", fontWeight: 800, color: "#0F172A" }}>
              {skeleton.title}
            </h1>
            <p style={{ fontSize: "15px", color: "var(--ink-soft)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              {skeleton.overview}
            </p>

            {/* Extracted vs Bridging Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "16px" }}>
              {skeleton.skills_extracted?.length > 0 && (
                <div>
                  <span style={{ fontSize: "11px", color: "var(--ink-faint)", fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    ALIGNED RESUME SKILLS
                  </span>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {skeleton.skills_extracted.map((sk, idx) => (
                      <span key={idx} style={{ padding: "4px 10px", borderRadius: "6px", background: "#D1FAE5", color: "#065F46", fontWeight: 700, fontSize: "12px" }}>
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {skeleton.skills_to_bridge?.length > 0 && (
                <div>
                  <span style={{ fontSize: "11px", color: "var(--ink-faint)", fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    BRIDGING SKILLS TO MASTER
                  </span>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {skeleton.skills_to_bridge.map((sk, idx) => (
                      <span key={idx} style={{ padding: "4px 10px", borderRadius: "6px", background: "#EDE9FE", color: "#5B21B6", fontWeight: 700, fontSize: "12px" }}>
                        ⚡ {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress Tracker Widget */}
          <div style={{ background: "#FFFFFF", padding: "20px 24px", borderRadius: "16px", border: "1px solid var(--border)", minWidth: "220px", textAlign: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--ink-faint)", fontWeight: 800, textTransform: "uppercase" }}>ROADMAP PROGRESS</span>
            <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--primary)", margin: "4px 0" }}>
              {percentComplete}%
            </div>
            <div className="progress-bar-bg" style={{ height: "8px", marginBottom: "8px" }}>
              <div className="progress-bar-fill" style={{ width: `${percentComplete}%` }} />
            </div>
            <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
              {completedNodes.length} of {stages.length} Stages Completed
            </span>
          </div>
        </div>
      </div>

      {/* Stages List Skeleton with On-the-Fly Lazy Content Launchers */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "20px", color: "#0F172A", margin: "0 0 16px 0", fontWeight: 800 }}>
          🧭 AI-Generated Stages ({stages.length} Nodes)
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {stages.map((stage, idx) => {
            const isDone = completedNodes.includes(stage.stage_id);
            return (
              <Card
                key={stage.stage_id || idx}
                padding="24px"
                hoverLift
                style={{
                  borderLeft: isDone ? "4px solid #059669" : "4px solid #7C3AED",
                  background: "#FFFFFF"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                  <div style={{ flex: 1, minWidth: "280px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <button
                        onClick={(e) => handleToggleNode(stage.stage_id, e)}
                        style={{ background: "none", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}
                      >
                        {isDone ? <CheckCircle2 size={24} color="#059669" /> : <Circle size={24} color="var(--ink-faint)" />}
                      </button>
                      <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800, textDecoration: isDone ? "line-through" : "none" }}>
                        {stage.title}
                      </h3>
                    </div>

                    <p style={{ color: "var(--ink-soft)", fontSize: "14px", margin: "0 0 16px 34px", lineHeight: 1.5 }}>
                      {stage.description}
                    </p>

                    {/* Topic Skeletons */}
                    <div style={{ marginLeft: "34px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {(stage.topics || []).map((top, tIdx) => (
                        <span key={tIdx} style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "6px", background: "var(--bg-subtle)", color: "#0F172A", fontWeight: 600 }}>
                          • {top.title}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ paddingTop: "4px" }}>
                    <Button
                      variant="glowing"
                      size="md"
                      onClick={() => handleOpenStageModule(stage)}
                      rightIcon={<ChevronRight size={16} />}
                    >
                      Lazy Load Course Module
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Flagship Capstone Project */}
      {skeleton.capstone_project && (
        <Card padding="28px" style={{ background: "#F5F3FF", border: "1.5px solid #DDD6FE" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <Award size={24} color="#7C3AED" />
            <h3 style={{ margin: 0, fontSize: "18px", color: "#4C1D95", fontWeight: 800 }}>
              🏆 Tailored Flagship Capstone Project
            </h3>
          </div>
          <p style={{ color: "#5B21B6", fontSize: "15px", margin: "0 0 16px 36px", lineHeight: 1.5 }}>
            {skeleton.capstone_project}
          </p>
          <div style={{ marginLeft: "36px" }}>
            <Button variant="primary" onClick={() => navigate("/forge")}>
              Launch Capstone Code Sandbox in Forge
            </Button>
          </div>
        </Card>
      )}

      {/* LAZY LOADED STAGE MODULE MODAL DRAWER */}
      {selectedStage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px"
          }}
          onClick={() => setSelectedStage(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              maxWidth: "840px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "32px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
              <div>
                <span className="pill xp" style={{ fontSize: "11px", marginBottom: "6px" }}>
                  ⚡ LAZY LOADED AI MODULE
                </span>
                <h3 style={{ margin: 0, fontSize: "22px", color: "#0F172A", fontWeight: 800 }}>
                  {selectedStage.title}
                </h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedStage(null)}>
                ✕ Close
              </Button>
            </div>

            {moduleLoading ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <Spinner size="lg" color="var(--primary)" />
                <p style={{ color: "var(--ink-soft)", marginTop: "16px", fontSize: "14px" }}>
                  Lazy generating theory, code exercise, mini-project, and technical interview questions...
                </p>
              </div>
            ) : moduleData ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Depth Callout */}
                <div style={{ background: "#F5F3FF", padding: "16px 20px", borderRadius: "12px", border: "1px solid #DDD6FE" }}>
                  <span style={{ fontWeight: 800, color: "#7C3AED", fontSize: "14px" }}>
                    🎯 {moduleData.role_depth_focus}
                  </span>
                </div>

                {/* Theory Markdown */}
                <div>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#0F172A", display: "flex", alignItems: "center", gap: "8px" }}>
                    <BookOpen size={18} color="var(--primary)" /> Theory & Architecture Principles
                  </h4>
                  <div style={{ fontSize: "14px", lineHeight: 1.6, color: "#334155", background: "var(--bg-subtle)", padding: "16px", borderRadius: "12px", whiteSpace: "pre-line" }}>
                    {moduleData.theory_markdown}
                  </div>
                </div>

                {/* Code Example */}
                {moduleData.code_example && (
                  <div>
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#0F172A", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Code2 size={18} color="var(--accent-cyan)" /> {moduleData.code_example.title}
                    </h4>
                    <InteractiveCodeSandbox
                      initialCode={moduleData.code_example.code}
                      initialLanguage="javascript"
                      topicId={1}
                    />
                    <p style={{ fontSize: "12px", color: "var(--ink-soft)", marginTop: "8px" }}>
                      💡 {moduleData.code_example.explanation}
                    </p>
                  </div>
                )}

                {/* Mini Project */}
                {moduleData.mini_project && (
                  <div style={{ background: "var(--bg-subtle)", padding: "16px", borderRadius: "12px" }}>
                    <h4 style={{ margin: "0 0 8px 0", fontSize: "15px", color: "#0F172A", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Briefcase size={18} color="var(--accent-emerald)" /> Hands-On Mini Project: {moduleData.mini_project.title}
                    </h4>
                    <p style={{ fontSize: "13px", color: "var(--ink-soft)", margin: "0 0 10px 0" }}>
                      {moduleData.mini_project.instructions}
                    </p>
                  </div>
                )}

                {/* Interview Prep */}
                {moduleData.interview_prep?.length > 0 && (
                  <div>
                    <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", color: "#0F172A", display: "flex", alignItems: "center", gap: "8px" }}>
                      <HelpCircle size={18} color="#F59E0B" /> Stage Technical Interview Q&A
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {moduleData.interview_prep.map((iq, qIdx) => (
                        <div key={qIdx} style={{ background: "#FFFBEB", border: "1px solid #FDE68A", padding: "14px 16px", borderRadius: "10px" }}>
                          <strong style={{ color: "#92400E", fontSize: "13px" }}>Q: {iq.question}</strong>
                          <p style={{ color: "#78350F", fontSize: "13px", margin: "6px 0 0 0", lineHeight: 1.4 }}>
                            <strong>Strategic Answer:</strong> {iq.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
