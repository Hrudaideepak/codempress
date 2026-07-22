import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import { 
  Flame, BookOpen, ArrowRight, Brain, Zap, Target 
} from "lucide-react";


export default function Library() {
  const [subjects, setSubjects] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    // Use api.getLibrary() — sends the JWT token, returns categories with topic counts
    api.getLibrary()
      .then((data) => {
        // Map categories → subjects shape expected by the grid
        const subs = (data.categories || []).map((cat) => ({
          name: cat.name,
          total_topics: cat.topic_count,
          mastery_percent: cat.topics?.length
            ? Math.round(
                (cat.topics.filter((t) => t.cleared).length / cat.topic_count) * 100
              )
            : 0,
        }));
        setSubjects(subs);
        setStatus(subs.length ? "ready" : "empty");
      })
      .catch((e) => {
        setError(e.message);
        setStatus("error");
      });
  }, []);

  return (
    <div className="container">
      {/* 🎯 TODAY'S ACTION PLAN HERO CARD (The Signature Feature) */}
      <div style={{        background: "linear-gradient(135deg, #ffffff 0%, #f4f1ff 100%)",
        border: "1.5px solid #ddd6fe",
        borderRadius: "24px",
        padding: "32px",
        marginBottom: "36px",
        boxShadow: "0 10px 40px rgba(124,58,237,0.08)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#7c3aed", fontWeight: "700", fontSize: "14px", marginBottom: "6px" }}>
              <Target size={18} />
              <span>TODAY'S MISSION</span>
            </div>
            <h1 style={{ fontSize: "28px", color: "#1f2937", margin: 0, fontWeight: 800 }}>
              Your Daily Action Plan
            </h1>
          </div>
          <div style={{
            background: "#fde7ec",
            color: "#be123c",
            padding: "8px 16px",
            borderRadius: "999px",
            fontWeight: 800,
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}>
            <Flame size={16} fill="#be123c" />
            <span>5 Day Streak</span>
          </div>
        </div>

        <p style={{ color: "#6b7280", fontSize: "15px", marginBottom: "24px" }}>
          Zero decisions required. Complete these 3 micro-tasks today to advance your software engineering readiness:
        </p>

        {/* 3 Micro-Tasks */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "28px" }}>
          <div 
            onClick={() => navigate("/topic/1")}
            style={{ background: "#ffffff", padding: "18px", borderRadius: "16px", border: "1px solid #e6e2f0", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer", transition: "transform 0.15s ease" }}
            onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "none"}
          >
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#ede7fb", color: "#7c3aed", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <BookOpen size={20} />
            </div>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase" }}>1. Learn (15m)</span>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#1f2937" }}>Arrays & Prefix Sums</div>
            </div>
          </div>

          <div 
            onClick={() => navigate("/quiz/1")}
            style={{ background: "#ffffff", padding: "18px", borderRadius: "16px", border: "1px solid #e6e2f0", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer", transition: "transform 0.15s ease" }}
            onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "none"}
          >
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#fde7ec", color: "#be123c", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Brain size={20} />
            </div>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#be123c", textTransform: "uppercase" }}>2. Practice Quiz</span>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#1f2937" }}>8 MCQ Assessment</div>
            </div>
          </div>

          <div 
            onClick={() => navigate("/topic/36")}
            style={{ background: "#ffffff", padding: "18px", borderRadius: "16px", border: "1px solid #e6e2f0", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer", transition: "transform 0.15s ease" }}
            onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "none"}
          >
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#e6f6ec", color: "#16a34a", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Zap size={20} />
            </div>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#16a34a", textTransform: "uppercase" }}>3. Spaced Review</span>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#1f2937" }}>Recursion Base Cases</div>
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => navigate("/topic/1")}
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: "18px",
            padding: "16px 32px",
            fontWeight: 800,
            fontSize: "16px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 4px 14px rgba(124, 58, 237, 0.25)",
            transition: "transform 0.15s ease"
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "none")}
        >
          <span>Start Today's Plan</span>
          <ArrowRight size={20} />
        </button>
      </div>

      {/* SUBJECT EXPLORER */}
      <div className="section-head">
        <h2>Curriculum & Learning Paths</h2>
        <span className="count">{subjects.length} Subjects Available</span>
      </div>

      {status === "loading" && (
        <div className="state">
          <h2>Loading subjects…</h2>
        </div>
      )}

      {status === "error" && (
        <div className="state">
          <h2>Unable to load curriculum</h2>
          <p>{error}</p>
        </div>
      )}

      {status === "ready" && (
        <div className="grid">
          {subjects.map((sub) => (
            <div
              key={sub.name}
              className="card"
              onClick={() => navigate(`/subject/${encodeURIComponent(sub.name)}`)}
            >
              <div className="card-top">
                <span className="level-tag">{sub.name}</span>
                <span className="xp-tag">{sub.total_topics} Topics</span>
              </div>

              <h3>{sub.name}</h3>
              <p>Master foundational to pro concepts through bite-sized theory & MCQs.</p>

              <div style={{ marginTop: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#6b7280", marginBottom: "4px", fontWeight: 600 }}>
                  <span>Progress</span>
                  <span>{sub.mastery_percent}%</span>
                </div>
                <div className="mastery-mini">
                  <div style={{ width: `${sub.mastery_percent}%` }} />
                </div>
              </div>

              <div className="card-foot">
                <span className="badge-ready">Explore Path →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
