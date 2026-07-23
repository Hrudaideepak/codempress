import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { Sparkles, ArrowRight, ShieldCheck, Cpu, Terminal, Code2, Layers } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const enter = () => navigate(user ? "/library" : "/auth");

  return (
    <div className="container">
      {/* Engineering Atelier Hero Banner */}
      <div
        className="hero"
        style={{
          borderRadius: "16px",
          padding: "56px 44px",
          marginBottom: "36px",
          border: "1px solid #CBD5E1",
          background: "var(--bg-blueprint)",
          backgroundImage:
            "linear-gradient(to right, rgba(203, 213, 225, 0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(203, 213, 225, 0.45) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          boxShadow: "var(--shadow)",
        }}
      >
        <div style={{ maxWidth: "660px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#FFFFFF",
              color: "#7C3AED",
              border: "1px solid #E5E7EB",
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "var(--mono)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "20px",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
            }}
          >
            <Cpu size={14} />
            <span>Engineering Atelier v2.0</span>
          </div>

          <h1
            style={{
              fontSize: "40px",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: "18px",
              color: "#0F172A",
            }}
          >
            Build production-ready software with AI that{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              thinks like an engineer.
            </span>
          </h1>

          <p
            style={{
              fontSize: "16.5px",
              color: "#475569",
              lineHeight: 1.6,
              marginBottom: "32px",
            }}
          >
            Codempress is a calm, high-precision AI engineering studio. Master theory, conquer interactive code challenges, and inspect system architecture with 3,405 topics across 34 subjects.
          </p>

          <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={enter}
              style={{
                background: "#7C3AED",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "14px 28px",
                fontWeight: 700,
                fontSize: "15px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 8px rgba(124, 58, 237, 0.25)",
                transition: "all 0.15s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#6D28D9")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#7C3AED")}
            >
              <span>Enter Engineering Studio</span>
              <ArrowRight size={18} />
            </button>

            <span style={{ fontSize: "13px", color: "#64748B", fontFamily: "var(--mono)", fontWeight: 500 }}>
              3,405 Topics · 34 Subjects · SQLite Offline-First
            </span>
          </div>
        </div>
      </div>

      {/* Engineering Atelier Feature Matrix */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginTop: "24px",
        }}
      >
        <div
          style={{
            background: "#FFFFFF",
            padding: "24px",
            borderRadius: "14px",
            border: "1px solid #E5E7EB",
            boxShadow: "var(--shadow)",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "#F5F3FF",
              color: "#7C3AED",
              display: "grid",
              placeItems: "center",
              marginBottom: "14px",
              border: "1px solid #DDD6FE",
            }}
          >
            <Layers size={22} />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "6px", color: "#0F172A" }}>
            Hyperstudio Blueprints
          </h3>
          <p style={{ color: "#475569", fontSize: "14px", lineHeight: 1.55 }}>
            Architecture graphs, git node flows, and system designs structured directly into topic theory.
          </p>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            padding: "24px",
            borderRadius: "14px",
            border: "1px solid #E5E7EB",
            boxShadow: "var(--shadow)",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "#EFF6FF",
              color: "#3B82F6",
              display: "grid",
              placeItems: "center",
              marginBottom: "14px",
              border: "1px solid #BFDBFE",
            }}
          >
            <Terminal size={22} />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "6px", color: "#0F172A" }}>
            Linear Precision UX
          </h3>
          <p style={{ color: "#475569", fontSize: "14px", lineHeight: 1.55 }}>
            JetBrains Mono terminal blocks, zero-friction navigation, and fast keyboard-first ergonomics.
          </p>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            padding: "24px",
            borderRadius: "14px",
            border: "1px solid #E5E7EB",
            boxShadow: "var(--shadow)",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "#ECFDF5",
              color: "#10B981",
              display: "grid",
              placeItems: "center",
              marginBottom: "14px",
              border: "1px solid #A7F3D0",
            }}
          >
            <Code2 size={22} />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "6px", color: "#0F172A" }}>
            Multi-Model AI Engine
          </h3>
          <p style={{ color: "#475569", fontSize: "14px", lineHeight: 1.55 }}>
            Server-side Socratic mentorship powered by GitHub Models fallback chain with zero downtime.
          </p>
        </div>
      </div>
    </div>
  );
}
