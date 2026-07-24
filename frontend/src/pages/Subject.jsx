import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import { ArrowLeft, MapPin, Grid, Lock, CheckCircle2, Star, Sparkles } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import MindMap from "../components/ui/MindMap";
import EmptyState from "../components/ui/EmptyState";
import { CardSkeleton } from "../components/ui/SkeletonLoader";

export default function Subject() {
  const params = useParams();
  const rawCat = params.category || (typeof window !== "undefined" ? (window.location.pathname.split("/subject/")[1] || "").split("/")[0] : "");
  const decoded = decodeURIComponent(rawCat || "").trim();
  const navigate = useNavigate();
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("map");

  useEffect(() => {
    if (!decoded) {
      navigate("/library", { replace: true });
      return;
    }
  }, [decoded, navigate]);

  useEffect(() => {
    api
      .getLibrary()
      .then((data) => {
        const cats = data?.categories || [];
        setCategories(cats);
        setStatus("ready");
      })
      .catch((e) => {
        setError(e.message);
        setStatus("error");
      });
  }, []);

  const cat = useMemo(() => {
    if (!categories.length || !decoded) return null;
    const target = decoded.toLowerCase();
    return categories.find((c) => c && c.name && c.name.trim().toLowerCase() === target) || null;
  }, [categories, decoded]);

  const openTopic = (topic) => {
    if (topic.locked) {
      toast.push("🔒 Locked — complete the previous topic to unlock.", "error");
      return;
    }
    navigate(`/topic/${topic.id}`);
  };

  const topics = cat
    ? [...(cat.topics || [])].sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
    : [];

  return (
    <div style={{ paddingBottom: "64px" }}>
      <button
        onClick={() => navigate("/library")}
        style={{
          background: "none",
          border: "none",
          color: "var(--ink-soft)",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: "20px"
        }}
      >
        <ArrowLeft size={16} /> All Subjects
      </button>

      {/* Header Banner */}
      <div className="glass-panel" style={{ marginBottom: "32px", border: "1px solid rgba(139, 92, 246, 0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div className="hero-badge" style={{ marginBottom: "12px" }}>
              <Sparkles size={14} />
              <span>{decoded} Path</span>
            </div>
            <h1 style={{ fontSize: "32px", color: "#fff", marginBottom: "8px" }}>{decoded}</h1>
            <p style={{ color: "var(--ink-soft)", fontSize: "15px", maxWidth: "600px" }}>
              {cat
                ? `${cat.topic_count} topics structured in progressive order.`
                : "Loading curriculum details..."}
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
      </div>

      {status === "loading" && (
        <div className="topics-grid">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {status === "error" && (
        <EmptyState
          title="Subject Sealed"
          description={error || "Could not retrieve topics for this subject."}
          actionLabel="Return to Library"
          onAction={() => navigate("/library")}
        />
      )}

      {status === "ready" && !cat && (
        <EmptyState
          title="Subject Not Found"
          description={`No curriculum exists for "${decoded}".`}
          actionLabel="Return to Library"
          onAction={() => navigate("/library")}
        />
      )}

      {status === "ready" && cat && viewMode === "map" && (
        <MindMap topics={topics} onSelectTopic={openTopic} />
      )}

      {status === "ready" && cat && viewMode === "grid" && (
        <div className="topics-grid">
          {topics.map((topic) => (
            <Card
              key={topic.id}
              hoverLift={!topic.locked}
              clickable={!topic.locked}
              onClick={() => openTopic(topic)}
              style={{ opacity: topic.locked ? 0.5 : 1 }}
            >
              <div className="topic-card-header">
                <span className="pill xp">{topic.level_name || "Level"}</span>
                {topic.locked ? (
                  <span style={{ fontSize: "12px", color: "var(--ink-faint)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Lock size={14} /> Locked
                  </span>
                ) : topic.cleared ? (
                  <span style={{ fontSize: "12px", color: "#34D399", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle2 size={14} /> Cleared
                  </span>
                ) : (
                  <span style={{ fontSize: "12px", color: "#FBBF24", fontWeight: 700 }}>● Active</span>
                )}
              </div>

              <h3 className="topic-title" style={{ marginTop: "12px", marginBottom: "8px" }}>
                {topic.title}
              </h3>
              <p className="topic-desc">{topic.description}</p>

              <div style={{ marginTop: "auto", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#C084FC", fontWeight: 700 }}>+{topic.xp} XP</span>
                {typeof topic.mastery === "number" && !topic.locked && (
                  <span style={{ fontSize: "12px", color: "var(--ink-soft)", fontWeight: 600 }}>
                    Mastery: {topic.mastery}%
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
