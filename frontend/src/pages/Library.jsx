import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import { Flame, BookOpen, ArrowRight, Brain, Zap, Target, Search, CheckCircle } from "lucide-react";
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
      {/* Today's Action Plan Hero Card */}
      <div className="glass-panel" style={{ marginBottom: "36px", border: "1px solid rgba(139, 92, 246, 0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary)", fontWeight: "700", fontSize: "13px", marginBottom: "6px" }}>
              <Target size={18} />
              <span>DAILY ENGINEERING MISSION</span>
            </div>
            <h1 style={{ fontSize: "28px", color: "#fff", margin: 0, fontWeight: 800 }}>
              Your Daily Action Plan
            </h1>
          </div>
          <div className="pill streak">
            <Flame size={16} fill="#FBBF24" />
            <span>Active Learning Streak</span>
          </div>
        </div>

        <p style={{ color: "var(--ink-soft)", fontSize: "15px", marginBottom: "24px" }}>
          Zero friction. Complete these 3 micro-modules today to systematically level up your software engineering skills:
        </p>

        {/* 3 Action Tasks */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "28px" }}>
          <Card hoverLift clickable onClick={() => navigate("/topic/1")}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(99, 102, 241, 0.2)", color: "#818CF8", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <BookOpen size={20} />
              </div>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#818CF8", textTransform: "uppercase" }}>1. Learn (15m)</span>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#fff" }}>Arrays & Prefix Sums</div>
              </div>
            </div>
          </Card>

          <Card hoverLift clickable onClick={() => navigate("/quiz/1")}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.2)", color: "#FBBF24", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Brain size={20} />
              </div>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#FBBF24", textTransform: "uppercase" }}>2. MCQ Challenge</span>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#fff" }}>8 Question Assessment</div>
              </div>
            </div>
          </Card>

          <Card hoverLift clickable onClick={() => navigate("/forge")}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.2)", color: "#34D399", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Zap size={20} />
              </div>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#34D399", textTransform: "uppercase" }}>3. Code Playground</span>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#fff" }}>Interactive Execution</div>
              </div>
            </div>
          </Card>
        </div>

        <Button variant="glowing" size="lg" onClick={() => navigate("/topic/1")} rightIcon={<ArrowRight size={20} />}>
          Start Today's Mission
        </Button>
      </div>

      {/* Subject Search and Filter */}
      <div className="library-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "24px", color: "#fff" }}>Curriculum & Subjects</h2>
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
