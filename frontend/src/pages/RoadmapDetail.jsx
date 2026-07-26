import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { STATIC_ROADMAPS } from "../data/staticRoadmaps";
import { api } from "../api";
import { useToast } from "../ToastContext";
import { soundService } from "../services/soundService";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Award,
  BookOpen,
  ArrowRight,
  Sparkles,
  Zap,
  Layers,
  Compass,
  Plus,
  Check,
  MapPin,
  Grid
} from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import MindMap from "../components/ui/MindMap";

export default function RoadmapDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [roadmap, setRoadmap] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [viewMode, setViewMode] = useState("map");

  useEffect(() => {
    const found = STATIC_ROADMAPS.find((r) => r.slug === slug);
    if (found) {
      setRoadmap(found);
    }
    // Check enrollment state
    api.getEnrollments().then((res) => {
      if (res.enrolled_items) {
        const enrolled = res.enrolled_items.some(
          (item) => item.item_type === "roadmap" && item.item_id === slug
        );
        setIsEnrolled(enrolled);
      }
    }).catch(() => {
      const local = JSON.parse(localStorage.getItem("sf_enrolled_roadmaps") || "[]");
      setIsEnrolled(local.includes(slug));
    });
  }, [slug]);

  const handleToggleEnrollment = (e) => {
    if (e) e.stopPropagation();
    soundService.play("click");
    const next = !isEnrolled;
    setIsEnrolled(next);

    const local = JSON.parse(localStorage.getItem("sf_enrolled_roadmaps") || "[]");
    const updatedLocal = next
      ? [...local, slug]
      : local.filter((s) => s !== slug);
    localStorage.setItem("sf_enrolled_roadmaps", JSON.stringify(updatedLocal));

    api.toggleEnrollment("roadmap", slug).catch(() => {});
    toast.push(
      next
        ? `Enrolled in ${roadmap?.title || "Career Roadmap"}!`
        : `Unenrolled from ${roadmap?.title || "Career Roadmap"}`,
      next ? "success" : "info"
    );
  };

  if (!roadmap) {
    return (
      <div style={{ maxWidth: "1000px", margin: "40px auto", textAlign: "center" }}>
        <h2>Roadmap Not Found</h2>
        <p>The requested job roadmap "{slug}" does not exist.</p>
        <Button variant="primary" onClick={() => navigate("/roadmaps")}>
          Back to All Roadmaps
        </Button>
      </div>
    );
  }

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
        <ArrowLeft size={18} /> Back to Career Directory
      </button>

      {/* Role Hero Header */}
      <div
        className="glass-panel"
        style={{
          marginBottom: "32px",
          padding: "36px 32px",
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.9) 100%)",
          border: "1.5px solid rgba(139, 92, 246, 0.3)",
          borderRadius: "24px",
          color: "#FFFFFF",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ flex: 1, minWidth: "300px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <span style={{ fontSize: "28px" }}>{roadmap.icon}</span>
              <span className="pill xp" style={{ background: "rgba(124, 58, 237, 0.2)", border: "1px solid rgba(139, 92, 246, 0.4)", color: "#C084FC" }}>
                {roadmap.category?.toUpperCase() || "CAREER ROADMAP"}
              </span>
              <span style={{ fontSize: "13px", color: "#FBBF24", fontWeight: 700 }}>{roadmap.rating}</span>
            </div>

            <h1 style={{ fontSize: "32px", margin: "0 0 10px 0", fontWeight: 800, color: "#FFFFFF" }}>
              {roadmap.title}
            </h1>
            <p style={{ fontSize: "16px", color: "#CBD5E1", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              {roadmap.tagline}
            </p>
            <p style={{ fontSize: "14px", color: "#94A3B8", margin: 0, lineHeight: 1.6 }}>
              {roadmap.overview}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-end" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#94A3B8", fontSize: "13px" }}>
              <Clock size={15} />
              <span>Duration: {roadmap.estimated_weeks}</span>
            </div>

            <Button
              variant={isEnrolled ? "secondary" : "glowing"}
              size="lg"
              onClick={handleToggleEnrollment}
              leftIcon={isEnrolled ? <Check size={18} /> : <Plus size={18} />}
            >
              {isEnrolled ? "Enrolled in Career Path" : "Enroll in Job Roadmap"}
            </Button>
          </div>
        </div>
      </div>

      {/* Role-Scoped Staged Pipeline Nodes */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "22px", color: "#0F172A", margin: "0 0 4px 0", fontWeight: 800 }}>
              🧭 Scoped Learning Pipeline ({roadmap.milestones?.length || 0} Stages)
            </h2>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px", margin: 0 }}>
              Each stage is strictly scoped for the <strong>{roadmap.title}</strong> role. Clicking a stage opens only the content relevant to this role.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <Button
              variant={viewMode === "map" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setViewMode("map")}
              leftIcon={<MapPin size={16} />}
            >
              Mind Map
            </Button>
            <Button
              variant={viewMode === "grid" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setViewMode("grid")}
              leftIcon={<Grid size={16} />}
            >
              List View
            </Button>
          </div>
        </div>

        {viewMode === "map" ? (
          <MindMap
            topics={(roadmap.milestones || []).map((m, idx) => ({
              id: m.stage_id || m.id || idx + 1,
              title: m.title,
              description: m.description,
              level_name: m.role_scope || `Stage ${idx + 1}`,
              locked: false,
              cleared: false,
              xp: 100,
              skills: m.skills || [],
              stage_id: m.stage_id || m.id
            }))}
            onSelectTopic={(selected) => {
              soundService.play("click");
              const sId = selected.stage_id || selected.id;
              navigate(`/roadmaps/${roadmap.slug}/stage/${sId}`);
            }}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {(roadmap.milestones || []).map((stage, idx) => (
              <Card
                key={stage.id || idx}
                padding="24px"
                hoverLift
                style={{
                  borderLeft: "4px solid var(--primary)",
                  background: "#FFFFFF",
                  boxShadow: "var(--shadow)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                  <div style={{ flex: 1, minWidth: "280px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <span
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: "var(--primary-soft)",
                          color: "var(--primary)",
                          fontWeight: 800,
                          fontSize: "14px",
                          display: "grid",
                          placeItems: "center"
                        }}
                      >
                        {idx + 1}
                      </span>
                      <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800 }}>
                        {stage.title}
                      </h3>
                      <span className="pill xp" style={{ fontSize: "11px" }}>
                        {stage.role_scope || `${roadmap.title} Depth`}
                      </span>
                    </div>

                    <p style={{ color: "var(--ink-soft)", fontSize: "14px", margin: "0 0 16px 38px", lineHeight: 1.5 }}>
                      {stage.description}
                    </p>

                    {/* Scoped Skills Pills */}
                    <div style={{ marginLeft: "38px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {(stage.skills || []).map((sk, sIdx) => (
                        <span
                          key={sIdx}
                          style={{
                            fontSize: "12px",
                            padding: "4px 10px",
                            borderRadius: "8px",
                            background: "var(--bg-subtle)",
                            color: "#0F172A",
                            fontWeight: 600
                          }}
                        >
                          ✓ {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ paddingTop: "8px" }}>
                    <Button
                      variant="glowing"
                      size="md"
                      onClick={() => {
                        soundService.play("click");
                        navigate(`/roadmaps/${roadmap.slug}/stage/${stage.stage_id || stage.id}`);
                      }}
                      rightIcon={<ArrowRight size={16} />}
                    >
                      Open {stage.title.split(":")[0]} Scoped Course
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Capstone Project Section */}
      {roadmap.capstone_project && (
        <Card
          padding="28px"
          style={{
            background: "linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)",
            border: "1.5px solid rgba(5, 150, 105, 0.3)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "8px" }}>
            <Award size={24} color="#059669" />
            <h3 style={{ margin: 0, fontSize: "18px", color: "#0F172A", fontWeight: 800 }}>
              🏆 {roadmap.title} Capstone Project
            </h3>
          </div>
          <p style={{ color: "var(--ink-soft)", fontSize: "15px", margin: "0 0 16px 38px", lineHeight: 1.5 }}>
            {roadmap.capstone_project}
          </p>
          <div style={{ marginLeft: "38px" }}>
            <Button variant="secondary" size="md" onClick={() => navigate("/forge")}>
              Launch Project Sandbox in Forge
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
