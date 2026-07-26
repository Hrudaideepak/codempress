import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import Spinner from "../components/ui/Spinner";
import { soundService } from "../services/soundService";
import { 
  Compass, 
  Sparkles, 
  Terminal, 
  Target, 
  CheckCircle2, 
  ArrowRight, 
  Briefcase, 
  Award, 
  BookOpen, 
  Layers,
  Rocket,
  ShieldAlert,
  ChevronRight,
  X,
  Code2,
  Database,
  Cpu,
  BrainCircuit,
  FileCode,
  Network
} from "lucide-react";

export default function Roadmaps() {
  const navigate = useNavigate();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ai_native"); // 'ai_native', 'exclusive', 'legacy', 'all'
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [taxonomyData, setTaxonomyData] = useState(null);
  const [showTaxonomyModal, setShowTaxonomyModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getRoadmaps(),
      api.getCurriculumTaxonomy().catch(() => null)
    ])
      .then(([resRoadmaps, resTaxonomy]) => {
        if (resRoadmaps && resRoadmaps.roadmaps) {
          setRoadmaps(resRoadmaps.roadmaps);
        }
        if (resTaxonomy && resTaxonomy.taxonomy) {
          setTaxonomyData(resTaxonomy.taxonomy);
        }
      })
      .catch((err) => console.error("Failed to load roadmaps & taxonomy:", err))
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    { id: "ai_native", label: "✨ AI-Native Roadmaps", count: 10, desc: "Fastest-growing roles in the GenAI & Agentic era" },
    { id: "exclusive", label: "🚀 Codempress Exclusive", count: 6, desc: "Founders, Indie Hackers & DevEx Engineers" },
    { id: "legacy", label: "💻 Industry Legacy", count: 10, desc: "Classic high-demand software engineering careers" },
    { id: "all", label: "🌐 All Roadmaps", count: 26, desc: "Complete library of career systems" }
  ];

  const filteredRoadmaps = roadmaps.filter((r) => {
    const matchesCategory = activeCategory === "all" || r.category === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.target_role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openRoadmapModal = (rm) => {
    soundService.play("click");
    setSelectedRoadmap(rm);
  };

  const closeRoadmapModal = () => {
    soundService.play("click");
    setSelectedRoadmap(null);
  };

  return (
    <div className="roadmaps-page" style={{ padding: "32px 24px 80px", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Hero Banner */}
      <div 
        className="roadmaps-hero" 
        style={{
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 27, 75, 0.8) 100%)",
          border: "1px solid rgba(139, 92, 246, 0.25)",
          borderRadius: "20px",
          padding: "40px 32px",
          marginBottom: "36px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(168, 85, 247, 0.3)", padding: "6px 14px", borderRadius: "30px", color: "#C084FC", fontSize: "13px", fontWeight: 700 }}>
              <Compass size={15} /> Codempress AI Career Operating System
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(236, 72, 153, 0.15)", border: "1px solid rgba(236, 72, 153, 0.3)", padding: "6px 14px", borderRadius: "30px", color: "#F472B6", fontSize: "13px", fontWeight: 700 }}>
              <Sparkles size={15} /> Curriculum SDK v1.0 Universal
            </div>
          </div>

          <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#F8FAFC", marginBottom: "12px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            Career Roadmaps for the <span style={{ background: "linear-gradient(90deg, #A855F7 0%, #EC4899 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI Era</span>
          </h1>

          <p style={{ color: "#94A3B8", fontSize: "16px", maxWidth: "820px", lineHeight: 1.6, marginBottom: "24px" }}>
            Move beyond generic technology tutorials. Codempress delivers complete, end-to-end career roadmaps designed around emerging 
            GenAI, Agentic AI, MCP, and modern engineering specializations—from beginner to job-ready professional.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
            {/* Search Input */}
            <div style={{ flex: 1, minWidth: "280px", maxWidth: "480px" }}>
              <input
                type="text"
                placeholder="Search by role, technology, or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  borderRadius: "12px",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#F8FAFC",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>

            <button
              onClick={() => {
                soundService.play("click");
                setShowTaxonomyModal(true);
              }}
              style={{
                padding: "14px 22px",
                borderRadius: "12px",
                background: "rgba(168, 85, 247, 0.2)",
                border: "1px solid rgba(168, 85, 247, 0.4)",
                color: "#C084FC",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <BrainCircuit size={16} /> Explore Skill Taxonomy (53 Skills)
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "12px", marginBottom: "32px" }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              soundService.play("click");
              setActiveCategory(cat.id);
            }}
            style={{
              padding: "12px 20px",
              borderRadius: "14px",
              background: activeCategory === cat.id ? "linear-gradient(135deg, #7C3AED 0%, #C084FC 100%)" : "rgba(30, 41, 59, 0.6)",
              border: activeCategory === cat.id ? "none" : "1px solid rgba(255, 255, 255, 0.1)",
              color: activeCategory === cat.id ? "#FFFFFF" : "#94A3B8",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
              boxShadow: activeCategory === cat.id ? "0 8px 20px rgba(124, 58, 237, 0.4)" : "none"
            }}
          >
            {cat.label} ({cat.count})
          </button>
        ))}
      </div>

      {/* Roadmaps Grid */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Spinner size="lg" color="#A855F7" />
        </div>
      ) : filteredRoadmaps.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8" }}>
          <p style={{ fontSize: "16px" }}>No roadmaps match your search filter.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "24px" }}>
          {filteredRoadmaps.map((rm) => (
            <div
              key={rm.id}
              onClick={() => openRoadmapModal(rm)}
              style={{
                background: "rgba(15, 23, 42, 0.75)",
                border: rm.category === "exclusive" 
                  ? "1px solid rgba(236, 72, 153, 0.4)" 
                  : rm.category === "ai_native"
                  ? "1px solid rgba(168, 85, 247, 0.3)"
                  : "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "18px",
                padding: "24px",
                cursor: "pointer",
                transition: "all 0.25s ease",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
              className="roadmap-card"
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "28px" }}>{rm.icon}</span>
                    <span style={{ 
                      fontSize: "12px", 
                      fontWeight: 800, 
                      padding: "4px 10px", 
                      borderRadius: "20px", 
                      background: rm.category === "exclusive" ? "rgba(236, 72, 153, 0.15)" : rm.category === "ai_native" ? "rgba(168, 85, 247, 0.15)" : "rgba(59, 130, 246, 0.15)",
                      color: rm.category === "exclusive" ? "#F472B6" : rm.category === "ai_native" ? "#C084FC" : "#60A5FA",
                      border: "1px solid currentColor"
                    }}>
                      {rm.category === "exclusive" ? "EXCLUSIVE" : rm.category === "ai_native" ? "AI-NATIVE" : "LEGACY"}
                    </span>
                  </div>
                  <span style={{ fontSize: "13px", color: "#F59E0B", fontWeight: 700 }}>{rm.rating}</span>
                </div>

                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#F8FAFC", marginBottom: "8px" }}>
                  {rm.title}
                </h2>

                <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.5, marginBottom: "20px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {rm.tagline}
                </p>
              </div>

              <div>
                {/* Capstone Preview */}
                <div style={{ background: "rgba(30, 41, 59, 0.6)", borderRadius: "10px", padding: "10px 12px", marginBottom: "16px", fontSize: "12px", color: "#CBD5E1" }}>
                  <div style={{ fontWeight: 700, color: "#A855F7", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Rocket size={13} /> Flagship Capstone:
                  </div>
                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {rm.capstone_project}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>
                    {rm.milestones ? rm.milestones.length : 0} Milestones · {rm.estimated_weeks}
                  </span>
                  <span style={{ color: "#A855F7", fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
                    Explore Roadmap <ChevronRight size={16} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Drawer for Detailed Roadmap View */}
      {selectedRoadmap && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px"
          }}
          onClick={closeRoadmapModal}
        >
          <div
            style={{
              background: "#0F172A",
              border: "1px solid rgba(168, 85, 247, 0.4)",
              borderRadius: "24px",
              maxWidth: "840px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "32px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              position: "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeRoadmapModal}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                color: "#F8FAFC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <span style={{ fontSize: "36px" }}>{selectedRoadmap.icon}</span>
              <div>
                <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#F8FAFC" }}>{selectedRoadmap.title}</h2>
                <div style={{ color: "#A855F7", fontWeight: 700, fontSize: "14px" }}>
                  Target Role: {selectedRoadmap.target_role} · {selectedRoadmap.estimated_weeks}
                </div>
              </div>
            </div>

            <p style={{ color: "#94A3B8", fontSize: "15px", lineHeight: 1.6, marginBottom: "28px" }}>
              {selectedRoadmap.overview}
            </p>

            {/* Capstone Banner */}
            <div style={{ background: "linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(236, 72, 153, 0.15) 100%)", border: "1px solid rgba(168, 85, 247, 0.4)", borderRadius: "16px", padding: "20px", marginBottom: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#EC4899", fontWeight: 800, fontSize: "14px", marginBottom: "6px" }}>
                <Award size={18} /> CAPSTONE PORTFOLIO PROJECT
              </div>
              <div style={{ color: "#F8FAFC", fontWeight: 700, fontSize: "16px" }}>
                {selectedRoadmap.capstone_project}
              </div>
            </div>

            {/* Milestone Graph */}
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#F8FAFC", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Layers size={20} color="#A855F7" /> Roadmap Milestones & Learning Path
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {selectedRoadmap.milestones && selectedRoadmap.milestones.map((m, idx) => (
                <div
                  key={m.id}
                  style={{
                    background: "rgba(30, 41, 59, 0.5)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "16px",
                    padding: "20px",
                    position: "relative"
                  }}
                >
                  <h4 style={{ fontSize: "17px", fontWeight: 800, color: "#F8FAFC", marginBottom: "6px" }}>
                    {m.title}
                  </h4>
                  <p style={{ color: "#94A3B8", fontSize: "14px", marginBottom: "14px", lineHeight: 1.5 }}>
                    {m.description}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {m.skills && m.skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        style={{
                          background: "rgba(168, 85, 247, 0.15)",
                          border: "1px solid rgba(168, 85, 247, 0.3)",
                          color: "#C084FC",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 700
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div style={{ marginTop: "32px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                onClick={closeRoadmapModal}
                style={{
                  padding: "12px 24px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "#F8FAFC",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  closeRoadmapModal();
                  navigate("/library");
                }}
                style={{
                  padding: "12px 28px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #7C3AED 0%, #C084FC 100%)",
                  border: "none",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 8px 20px rgba(124, 58, 237, 0.4)"
                }}
              >
                Start Roadmap in Library <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Master Skill Taxonomy Modal */}
      {showTaxonomyModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px"
          }}
          onClick={() => setShowTaxonomyModal(false)}
        >
          <div
            style={{
              background: "#0F172A",
              border: "1px solid rgba(168, 85, 247, 0.4)",
              borderRadius: "24px",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "32px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              position: "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowTaxonomyModal(false)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                color: "#F8FAFC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#F8FAFC", marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
              <BrainCircuit color="#A855F7" /> Master Skill Taxonomy Engine
            </h2>
            <p style={{ color: "#94A3B8", fontSize: "14px", marginBottom: "24px" }}>
              Codempress Curriculum SDK indexes 53 core skill taxonomies across AI, Web, Mobile, DevOps, and Exclusive Builder disciplines.
            </p>

            {taxonomyData && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {Object.entries(taxonomyData).map(([catKey, skills]) => (
                  <div key={catKey} style={{ background: "rgba(30, 41, 59, 0.5)", borderRadius: "16px", padding: "20px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#C084FC", marginBottom: "12px", textTransform: "capitalize" }}>
                      {catKey.replace(/_/g, " ")} ({skills.length} Skills)
                    </h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {skills.map((s, idx) => (
                        <span key={idx} style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(168, 85, 247, 0.3)", color: "#F8FAFC", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
