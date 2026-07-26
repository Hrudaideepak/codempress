import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import { Flame, BookOpen, ArrowRight, Brain, Zap, Target, Search, CheckCircle, Compass } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { CardSkeleton } from "../components/ui/SkeletonLoader";
import EmptyState from "../components/ui/EmptyState";

export default function Library() {
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    api
      .getLibrary()
      .then((data) => {
        const subs = (data.categories || []).map((cat) => ({
          name: cat.name,
          total_topics: cat.topic_count,
          mastery_percent: cat.topics?.length
            ? Math.round(
                (cat.topics.filter((t) => t.cleared).length / cat.topic_count) * 100
              )
            : 0
        }));
        setSubjects(subs);
        setFilteredSubjects(subs);
        setStatus(subs.length ? "ready" : "empty");
      })
      .catch((e) => {
        setError(e.message);
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    let result = subjects;
    if (searchQuery.trim()) {
      result = result.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredSubjects(result);
  }, [searchQuery, subjects]);

  return (
    <div style={{ paddingBottom: "64px" }}>
      {/* Career Roadmaps Banner */}
      <div className="glass-panel" style={{ marginBottom: "28px", background: "linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(79, 70, 229, 0.04) 100%)", border: "1.5px solid rgba(124, 58, 237, 0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)", color: "#ffffff", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Compass size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: "18px", color: "#0F172A", margin: "0 0 4px 0", fontWeight: 800 }}>
                🧭 26 AI-Native & Software Engineering Roadmaps
              </h3>
              <p style={{ color: "var(--ink-soft)", fontSize: "14px", margin: 0 }}>
                Follow structured career blueprints for AI Agent Architects, DevEx Engineers, RAG Developers, and Full-Stack Founders.
              </p>
            </div>
          </div>
          <Button variant="primary" size="md" onClick={() => navigate("/roadmaps")} rightIcon={<ArrowRight size={16} />}>
            Explore Roadmaps
          </Button>
        </div>
      </div>

      {/* Subject Search and Filter */}
      <div className="library-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "24px", color: "#0F172A" }}>Curriculum & Subjects</h2>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px" }}>
              {subjects.length} subjects covering full Computer Science fundamentals
            </p>
          </div>
        </div>

        <div className="search-filter-bar">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search subjects (e.g. Data Structures, Python, OS)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {status === "loading" && (
        <div className="topics-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {status === "error" && (
        <EmptyState
          title="Failed to Load Curriculum"
          description={error || "Could not retrieve subject data from backend server."}
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      )}

      {status === "ready" && filteredSubjects.length === 0 && (
        <EmptyState
          title="No Subjects Found"
          description={`No subjects matched your query "${searchQuery}".`}
          actionLabel="Clear Search"
          onAction={() => setSearchQuery("")}
        />
      )}

      {status === "ready" && filteredSubjects.length > 0 && (
        <div className="topics-grid">
          {filteredSubjects.map((sub) => (
            <Card
              key={sub.name}
              hoverLift
              clickable
              onClick={() => navigate(`/subject/${encodeURIComponent(sub.name)}`)}
              className="topic-card"
            >
              <div className="topic-card-header">
                <span className="pill xp">{sub.total_topics} Topics</span>
                {sub.mastery_percent > 0 && (
                  <span style={{ fontSize: "12px", color: "#34D399", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle size={14} /> {sub.mastery_percent}% Mastered
                  </span>
                )}
              </div>

              <h3 className="topic-title" style={{ marginTop: "12px", marginBottom: "8px" }}>
                {sub.name}
              </h3>
              <p className="topic-desc">
                Interactive curriculum path covering theoretical concepts, code snippets, and assessment quizzes.
              </p>

              <div style={{ marginTop: "auto", paddingTop: "16px" }}>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${sub.mastery_percent}%` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "var(--ink-soft)", fontWeight: 600 }}>
                    {sub.mastery_percent > 0 ? "Continue Path" : "Start Path"}
                  </span>
                  <ArrowRight size={16} color="var(--primary)" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
