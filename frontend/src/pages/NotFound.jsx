import React from "react";
import { Link } from "react-router-dom";
import { Compass, BookOpen, Sparkles, Home, HelpCircle } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        textAlign: "center",
        maxWidth: "600px",
        margin: "0 auto"
      }}
    >
      <Card
        style={{
          width: "100%",
          padding: "40px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(192, 132, 252, 0.2)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(124, 58, 237, 0.15)",
          borderRadius: "24px"
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "24px",
            background: "linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(192, 132, 252, 0.15))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
            border: "1px solid rgba(192, 132, 252, 0.3)",
            boxShadow: "0 0 25px rgba(124, 58, 237, 0.3)"
          }}
        >
          <HelpCircle size={44} color="#C084FC" />
        </div>

        <span
          style={{
            fontSize: "14px",
            fontWeight: "800",
            letterSpacing: "3px",
            color: "#C084FC",
            textTransform: "uppercase",
            marginBottom: "8px"
          }}
        >
          404 — Page Not Found
        </span>

        <h1
          style={{
            fontSize: "32px",
            fontWeight: "900",
            color: "#F8FAFC",
            marginBottom: "12px",
            lineHeight: "1.2"
          }}
        >
          Lost in Code Space?
        </h1>

        <p
          style={{
            color: "#94A3B8",
            fontSize: "15px",
            lineHeight: "1.6",
            maxWidth: "440px",
            marginBottom: "32px"
          }}
        >
          The page or route you are looking for doesn't exist or may have moved. Let's get you back on track!
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            justifyContent: "center",
            width: "100%"
          }}
        >
          <Link to="/library">
            <Button variant="primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 20px" }}>
              <BookOpen size={16} /> Go to Library
            </Button>
          </Link>

          <Link to="/roadmaps">
            <Button variant="secondary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 20px" }}>
              <Compass size={16} /> Explore Roadmaps
            </Button>
          </Link>

          <Link to="/mentor">
            <Button variant="ghost" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 20px", background: "rgba(255, 255, 255, 0.05)" }}>
              <Sparkles size={16} color="#C084FC" /> Ask AI Mentor
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
