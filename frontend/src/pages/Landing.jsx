import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { Sparkles, ArrowRight, Terminal, Layers, Code2, Cpu, Zap, Award } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const enter = () => navigate(user ? "/library" : "/auth");

  return (
    <div style={{ paddingBottom: "64px" }}>
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-badge">
          <Cpu size={15} />
          <span>Codempress Tate Engineering v2.5</span>
        </div>

        <h1 className="hero-title">
          Master Computer Science with{" "}
          <span className="text-gradient">AI Orchestration</span>
        </h1>

        <p className="hero-subtitle">
          From first semester to senior engineer. Explore interactive mind maps, master deeply structured theory, solve real-time MCQs, and test code in your browser.
        </p>

        <div style={{ display: "flex", gap: "16px", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
          <Button variant="glowing" size="lg" onClick={enter} rightIcon={<ArrowRight size={18} />}>
            {user ? "Go to My Curriculum" : "Get Started Free"}
          </Button>

          <Button variant="secondary" size="lg" onClick={() => navigate("/library")}>
            Browse 3,405 Topics
          </Button>
        </div>

        <div style={{ marginTop: "24px", color: "var(--ink-faint)", fontSize: "13px", fontFamily: "var(--mono)" }}>
          ✦ SQLite Offline-First • 34 Computer Science Subjects • GitHub Models AI Engine
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="features-grid">
        <Card hoverLift clickable onClick={enter}>
          <div className="feature-icon">
            <Layers size={24} color="#8B5CF6" />
          </div>
          <h3 style={{ fontSize: "18px", color: "#fff", marginBottom: "8px" }}>
            Interactive Subject Mind Maps
          </h3>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", lineHeight: "1.6" }}>
            Visual node graphs with unlocking paths, prerequisite dependencies, and live mastery progress bars.
          </p>
        </Card>

        <Card hoverLift clickable onClick={enter}>
          <div className="feature-icon" style={{ background: "rgba(6, 182, 212, 0.15)", borderColor: "rgba(6, 182, 212, 0.3)" }}>
            <Terminal size={24} color="#06B6D4" />
          </div>
          <h3 style={{ fontSize: "18px", color: "#fff", marginBottom: "8px" }}>
            Code Forge Playground
          </h3>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", lineHeight: "1.6" }}>
            In-browser code editor with instant output, syntax highlighting, and AI logic assistance.
          </p>
        </Card>

        <Card hoverLift clickable onClick={enter}>
          <div className="feature-icon" style={{ background: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.3)" }}>
            <Zap size={24} color="#10B981" />
          </div>
          <h3 style={{ fontSize: "18px", color: "#fff", marginBottom: "8px" }}>
            Gamified Quiz Arenas
          </h3>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", lineHeight: "1.6" }}>
            Dynamic MCQ assessments with immediate sound feedback, streak multipliers, and XP level progression.
          </p>
        </Card>
      </div>

      {/* Call to Action Bar */}
      <div className="glass-panel" style={{ marginTop: "64px", textAlignment: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
        <Award size={36} color="#FBBF24" />
        <h2 style={{ fontSize: "28px", color: "#fff" }}>Ready to elevate your engineering skills?</h2>
        <p style={{ color: "var(--ink-soft)", maxWidth: "560px", textAlign: "center" }}>
          Join thousands of CS students learning with structured AI theory and real code execution.
        </p>
        <Button variant="primary" size="lg" onClick={enter} rightIcon={<ArrowRight size={18} />}>
          Start Learning Now
        </Button>
      </div>
    </div>
  );
}
