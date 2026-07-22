import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { Sparkles, ArrowRight, ShieldCheck, Zap, BookOpen } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const enter = () => navigate(user ? "/library" : "/auth");

  return (
    <div className="container">
      <div style={{
        background: "linear-gradient(135deg, #7dd3fc 0%, #ddd6fe 50%, #f9a8d4 100%)",
        borderRadius: "28px",
        padding: "64px 48px",
        marginBottom: "40px",
        boxShadow: "0 10px 40px rgba(124, 58, 237, 0.08)",
        color: "#1f2937"
      }}>
        <div style={{ maxWidth: "680px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#ffffff",
            color: "#7c3aed",
            padding: "6px 14px",
            borderRadius: "999px",
            fontSize: "13px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "20px"
          }}>
            <Sparkles size={16} />
            <span>AI-Powered CS Learning Operating System</span>
          </div>

          <h1 style={{ fontSize: "44px", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "20px" }}>
            Know exactly what to learn. Every day. <span style={{ color: "#7c3aed" }}>Until you're hired.</span>
          </h1>

          <p style={{ fontSize: "18px", color: "#4b5563", lineHeight: 1.6, marginBottom: "32px" }}>
            Codempress is your daily command center for Computer Science. We organize learning, practice, and skill mastery into one continuous daily plan.
          </p>

          <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={enter}
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "18px",
                padding: "16px 32px",
                fontWeight: 800,
                fontSize: "17px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                boxShadow: "0 4px 14px rgba(124, 58, 237, 0.25)"
              }}
            >
              <span>Enter Command Center</span>
              <ArrowRight size={20} />
            </button>

            <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: 600 }}>
              Free for CS students · 3,405 Topics · 34 Subjects
            </span>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginTop: "32px" }}>
        <div style={{ background: "#ffffff", padding: "28px", borderRadius: "24px", border: "1px solid #f4f1ff", boxShadow: "0 10px 40px rgba(124,58,237,0.08)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "#ede7fb", color: "#7c3aed", display: "grid", placeItems: "center", marginBottom: "16px" }}>
            <Zap size={24} />
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Zero-Decision Daily Plan</h3>
          <p style={{ color: "#6b7280", fontSize: "15px", lineHeight: 1.5 }}>
            No decision fatigue. Wake up, open Codempress, and complete your 3 daily micro-tasks.
          </p>
        </div>

        <div style={{ background: "#ffffff", padding: "28px", borderRadius: "24px", border: "1px solid #f4f1ff", boxShadow: "0 10px 40px rgba(124,58,237,0.08)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "#fde7ec", color: "#be123c", display: "grid", placeItems: "center", marginBottom: "16px" }}>
            <BookOpen size={24} />
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Bite-Sized Theory & MCQs</h3>
          <p style={{ color: "#6b7280", fontSize: "15px", lineHeight: 1.5 }}>
            Concise theory paired with instant 8-question quizzes and runnable code snippets.
          </p>
        </div>

        <div style={{ background: "#ffffff", padding: "28px", borderRadius: "24px", border: "1px solid #f4f1ff", boxShadow: "0 10px 40px rgba(124,58,237,0.08)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "#e6f6ec", color: "#16a34a", display: "grid", placeItems: "center", marginBottom: "16px" }}>
            <ShieldCheck size={24} />
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Multi-Model AI Failover</h3>
          <p style={{ color: "#6b7280", fontSize: "15px", lineHeight: 1.5 }}>
            Server-side Socratic AI mentor powered by 12 free-tier providers with zero downtime.
          </p>
        </div>
      </div>
    </div>
  );
}
