import React, { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { Sparkles, ArrowRight, Terminal, Layers, Code2, Cpu, Zap, Award, Compass } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const HeroScene = lazy(() => import("../HeroScene"));

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

          <Button variant="secondary" size="lg" onClick={() => navigate("/roadmaps")}>
            🗺️ Explore 26 Career Roadmaps
          </Button>

          <Button variant="ghost" size="lg" onClick={() => navigate("/library")}>
            Browse 1,846 Topics
          </Button>
        </div>

        <div style={{ marginTop: "24px", color: "var(--ink-faint)", fontSize: "13px", fontFamily: "var(--mono)" }}>
          ✦ SQLite Offline-First • 26 Career Roadmaps • 34 CS Subjects • GitHub Models AI Engine
        </div>

        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
      </div>

      {/* Feature Cards Grid */}
      <div className="features-grid">
        <Card hoverLift clickable onClick={() => navigate("/roadmaps")}>
          <div className="feature-icon" style={{ background: "#F5F3FF", borderColor: "#DDD6FE" }}>
            <Compass size={24} color="#7C3AED" />
          </div>
          <h3 style={{ fontSize: "18px", color: "#0F172A", marginBottom: "8px", fontFamily: "var(--font-heading)" }}>
            26 AI-Native Career Roadmaps
          </h3>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", lineHeight: "1.6" }}>
            Explore specialized career blueprints for AI Agent Architects, RAG Engineers, DevEx Engineers, and Full-Stack Founders with automatic skill gap analysis.
          </p>
        </Card>

        <Card hoverLift clickable onClick={() => navigate("/library")}>
          <div className="feature-icon">
            <Layers size={24} color="#7C3AED" />
          </div>
          <h3 style={{ fontSize: "18px", color: "#0F172A", marginBottom: "8px", fontFamily: "var(--font-heading)" }}>
            Interactive Subject Mind Maps
          </h3>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", lineHeight: "1.6" }}>
            Visual node graphs with unlocking paths, prerequisite dependencies, and live mastery progress bars.
          </p>
        </Card>

        <Card hoverLift clickable onClick={() => navigate("/forge")}>
          <div className="feature-icon" style={{ background: "#ECFDF5", borderColor: "#A7F3D0" }}>
            <Zap size={24} color="#059669" />
          </div>
          <h3 style={{ fontSize: "18px", color: "#0F172A", marginBottom: "8px", fontFamily: "var(--font-heading)" }}>
            Gamified Quiz Arenas
          </h3>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", lineHeight: "1.6" }}>
            Dynamic MCQ assessments with immediate sound feedback, streak multipliers, and XP level progression.
          </p>
        </Card>
      </div>

      {/* Call to Action Bar */}
      <div className="glass-panel" style={{ marginTop: "64px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", textAlign: "center" }}>
        <Award size={36} color="#D97706" />
        <h2 style={{ fontSize: "28px", color: "#0F172A" }}>Ready to elevate your engineering skills?</h2>
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
