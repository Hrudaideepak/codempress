import React, { useState, useEffect, useRef } from "react";
import { useIsMobile } from "../utils/useIsMobile";
import { api } from "../api";
import { useToast } from "../ToastContext";
import { soundService } from "../services/soundService";
import {
  MessageSquare,
  FileText,
  BarChart3,
  MapPin,
  Send,
  Sparkles,
  Upload,
  CheckCircle2,
  Circle,
  ExternalLink,
  Brain,
  Zap,
  Copy,
  Check,
  Mic,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Target,
  TrendingUp,
  Award,
  Layers,
  Download,
  Briefcase,
  BookOpen
} from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";

/**
 * Dynamic SVG Radar Chart Component for Skill Matrix
 */
function SkillRadarChart({ skills = [], scores = [] }) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 100;

  const defaultSkills = [
    "System Architecture",
    "Frontend & UI",
    "Backend APIs",
    "Database Systems",
    "DevOps & Cloud",
    "AI / ML Models"
  ];
  const defaultScores = [80, 75, 85, 70, 65, 75];

  const displaySkills = skills.length >= 3 ? skills.slice(0, 8) : defaultSkills;
  const displayScores = skills.length >= 3 ? scores.slice(0, 8) : defaultScores;

  const N = displaySkills.length;
  const angleStep = (2 * Math.PI) / N;
  const levels = [0.25, 0.5, 0.75, 1.0];

  const getCoordinates = (index, valueRatio) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = radius * valueRatio;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y };
  };

  const dataPoints = displayScores
    .map((score, i) => {
      const ratio = Math.max(0.15, Math.min(1.0, score / 100));
      const { x, y } = getCoordinates(i, ratio);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: "12px 0" }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ maxWidth: "100%", overflow: "visible" }}
        role="img"
        aria-label="Skill Proficiency Radar Chart"
      >
        <defs>
          <linearGradient id="radarFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Concentric Grid Web Polygons */}
        {levels.map((lvl, lIdx) => {
          const points = Array.from({ length: N })
            .map((_, i) => {
              const { x, y } = getCoordinates(i, lvl);
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <polygon
              key={lIdx}
              points={points}
              fill="none"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeDasharray={lvl === 1.0 ? "none" : "3,3"}
              strokeWidth={lvl === 1.0 ? "1.5" : "1"}
            />
          );
        })}

        {/* Radar Axes Lines */}
        {Array.from({ length: N }).map((_, i) => {
          const { x, y } = getCoordinates(i, 1.0);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="1"
            />
          );
        })}

        {/* Radar Data Area */}
        <polygon
          points={dataPoints}
          fill="url(#radarFillGrad)"
          stroke="#A855F7"
          strokeWidth="2.5"
          style={{ transition: "all 0.4s ease" }}
        />

        {/* Vertex Circles */}
        {displayScores.map((score, i) => {
          const ratio = Math.max(0.15, Math.min(1.0, score / 100));
          const { x, y } = getCoordinates(i, ratio);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4.5"
              fill="#38BDF8"
              stroke="#0F172A"
              strokeWidth="2"
            />
          );
        })}

        {/* Skill Labels */}
        {displaySkills.map((skillName, i) => {
          const { x, y } = getCoordinates(i, 1.25);
          return (
            <text
              key={i}
              x={x}
              y={y}
              fill="#E2E8F0"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {skillName.length > 14 ? `${skillName.slice(0, 12)}...` : skillName}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function Mentor() {
  const toast = useToast();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("chat"); // 'chat', 'cover_letter', 'interview', 'analytics', 'resume', 'roadmap'

  // Chat State
  const [messages, setMessages] = useState([
    {
      sender: "mentor",
      text: "Hey! 👋 I'm your AI Career & Software Development Mentor. Ask me anything about your technical career goals, interview prep, resume strategy, or technical roadmaps!"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef = useRef(null);

  // Resume & Analytics State
  const [resumeText, setResumeText] = useState("");
  const [resumeProfile, setResumeProfile] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const [analytics, setAnalytics] = useState({
    has_data: false,
    skills: [],
    scores: [],
    experience_level: ""
  });

  // Roadmap State
  const [roadmap, setRoadmap] = useState(null);
  const [targetRoleInput, setTargetRoleInput] = useState("AI Software Engineer");
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  // Cover Letter Generator State
  const [coverJobTitle, setCoverJobTitle] = useState("");
  const [coverCompany, setCoverCompany] = useState("");
  const [coverDescription, setCoverDescription] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [coverLoading, setCoverLoading] = useState(false);
  const [copiedCover, setCopiedCover] = useState(false);

  // Mock Interview Prep State
  const [interviewRole, setInterviewRole] = useState("Software Engineer");
  const [interviewDifficulty, setInterviewDifficulty] = useState("Mid");
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswerText, setUserAnswerText] = useState("");
  const [evaluations, setEvaluations] = useState({});
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [evaluatingLoading, setEvaluatingLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load initial backend state on mount
  useEffect(() => {
    api.getMentorResume().then((res) => {
      if (res.has_resume) {
        setResumeProfile(res);
        setResumeText(res.resume_text || "");
      }
    }).catch(() => {});

    api.getMentorAnalytics().then((res) => {
      if (res.has_data) {
        setAnalytics(res);
      }
    }).catch(() => {});

    api.getMentorRoadmap().then((res) => {
      if (res.has_roadmap) {
        setRoadmap(res);
      }
    }).catch(() => {});

    api.getMentorChatHistory("default").then((res) => {
      if (res.messages && res.messages.length > 0) {
        setMessages(res.messages);
      }
    }).catch(() => {});
  }, []);

  // Format AI Response Markdown
  const renderMessageContent = (text) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, lIdx) => {
      if (line.startsWith("```")) {
        return <div key={lIdx} style={{ height: "4px" }} />;
      }
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={pIdx} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
        return (
          <div key={lIdx} style={{ display: "flex", gap: "8px", marginLeft: "8px", marginTop: "4px" }}>
            <span style={{ color: "var(--primary)", fontWeight: 700 }}>•</span>
            <span>{formattedLine}</span>
          </div>
        );
      }

      return (
        <div key={lIdx} style={{ minHeight: line.trim() ? "auto" : "8px", marginBottom: "4px" }}>
          {formattedLine}
        </div>
      );
    });
  };

  // Send Chat Message
  const handleSendChat = async (e) => {
    if (e) e.preventDefault();
    const text = chatInput.trim();
    if (!text || chatSending) return;

    soundService.play("click");
    setChatInput("");
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setChatSending(true);

    try {
      const res = await api.sendMentorChat(text, "default");
      setMessages((prev) => [...prev, { sender: "mentor", text: res.reply }]);
      soundService.play("levelup");
    } catch (err) {
      toast.push(err.message || "Failed to reach AI Mentor", "error");
    } finally {
      setChatSending(false);
    }
  };

  // Upload Plain Resume Text
  const handleUploadResumeText = async () => {
    if (!resumeText.trim()) {
      toast.push("Please paste or upload your resume first", "warning");
      return;
    }
    soundService.play("click");
    setResumeLoading(true);
    try {
      const res = await api.uploadMentorResume(resumeText);
      setResumeProfile(res);
      setAnalytics({
        has_data: true,
        skills: res.proficiency?.Skill || res.skills || [],
        scores: res.proficiency?.Score || [],
        experience_level: res.experience_level || "Mid"
      });
      toast.push("Resume dynamically analyzed & saved to AI Memory!", "success");
      soundService.play("levelup");
    } catch (err) {
      toast.push(err.message || "Failed to analyze resume", "error");
    } finally {
      setResumeLoading(false);
    }
  };

  // Handle Resume File Upload (PDF, DOCX, TXT)
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundService.play("click");
    setSelectedFile(file);
    setResumeLoading(true);

    try {
      toast.push(`Uploading & parsing ${file.name}...`, "info");
      const res = await api.uploadMentorResumeFile(file);
      setResumeProfile(res);
      if (res.resume_text) {
        setResumeText(res.resume_text);
      }
      setAnalytics({
        has_data: true,
        skills: res.proficiency?.Skill || res.skills || [],
        scores: res.proficiency?.Score || [],
        experience_level: res.experience_level || "Mid"
      });
      toast.push(`Successfully analyzed ${file.name}!`, "success");
      soundService.play("levelup");
    } catch (err) {
      toast.push(err.message || "Failed to parse uploaded file", "error");
    } finally {
      setResumeLoading(false);
    }
  };

  // Generate Career Roadmap
  const handleGenerateRoadmap = async () => {
    soundService.play("click");
    setRoadmapLoading(true);
    try {
      const res = await api.generateMentorRoadmap(targetRoleInput);
      setRoadmap(res);
      toast.push(`Personalized ${targetRoleInput} Roadmap Generated!`, "success");
      soundService.play("levelup");
    } catch (err) {
      toast.push(err.message || "Failed to generate career roadmap", "error");
    } finally {
      setRoadmapLoading(false);
    }
  };

  const handleToggleStep = async (stepId) => {
    soundService.play("click");
    try {
      const res = await api.toggleMentorStep(stepId);
      setRoadmap((prev) => ({ ...prev, steps: res.steps }));
    } catch (err) {
      console.error(err);
    }
  };

  // Generate Tailored Cover Letter
  const handleGenerateCoverLetter = async (e) => {
    if (e) e.preventDefault();
    if (!coverJobTitle.trim()) {
      toast.push("Please enter a target Job Title", "warning");
      return;
    }

    soundService.play("click");
    setCoverLoading(true);
    setCopiedCover(false);

    try {
      const res = await api.generateCoverLetter(
        coverJobTitle.trim(),
        coverCompany.trim() || "Tech Company",
        coverDescription.trim()
      );
      setCoverLetter(res.cover_letter);
      toast.push("AI Cover Letter generated successfully!", "success");
      soundService.play("levelup");
    } catch (err) {
      toast.push(err.message || "Failed to generate cover letter", "error");
    } finally {
      setCoverLoading(false);
    }
  };

  // Copy Cover Letter to Clipboard
  const handleCopyCoverLetter = () => {
    if (!coverLetter) return;
    navigator.clipboard.writeText(coverLetter);
    setCopiedCover(true);
    soundService.play("click");
    toast.push("Cover Letter copied to clipboard!", "success");
    setTimeout(() => setCopiedCover(false), 3000);
  };

  // Download Cover Letter as Text File
  const handleDownloadCoverLetter = () => {
    if (!coverLetter) return;
    const element = document.createElement("a");
    const file = new Blob([coverLetter], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `Cover_Letter_${coverCompany.replace(/\s+/g, "_") || "Target"}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.push("Cover Letter downloaded!", "info");
  };

  // Generate Mock Interview Questions
  const handleGenerateQuestions = async () => {
    soundService.play("click");
    setQuestionsLoading(true);
    setEvaluations({});
    setCurrentQIndex(0);
    setUserAnswerText("");
    setShowHint(false);

    try {
      const res = await api.generateInterviewQuestions(interviewRole, interviewDifficulty);
      if (res.questions && res.questions.length > 0) {
        setInterviewQuestions(res.questions);
        toast.push(`5 Interview Questions generated for ${interviewRole}!`, "success");
        soundService.play("levelup");
      }
    } catch (err) {
      toast.push(err.message || "Failed to generate interview questions", "error");
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Submit Answer for Instant AI Evaluation
  const handleSubmitInterviewAnswer = async (e) => {
    if (e) e.preventDefault();
    if (!userAnswerText.trim()) {
      toast.push("Please enter your answer before submitting", "warning");
      return;
    }

    const currentQ = interviewQuestions[currentQIndex];
    if (!currentQ) return;

    soundService.play("click");
    setEvaluatingLoading(true);

    try {
      const res = await api.evaluateInterviewAnswer(
        interviewRole,
        currentQ.question,
        userAnswerText.trim()
      );

      setEvaluations((prev) => ({
        ...prev,
        [currentQIndex]: {
          score: res.score,
          feedback: res.feedback,
          improved_answer: res.improved_answer,
          user_answer: userAnswerText.trim()
        }
      }));

      toast.push(`Response Evaluated! Score: ${res.score}/100`, "success");
      soundService.play("levelup");
    } catch (err) {
      toast.push(err.message || "Failed to evaluate answer", "error");
    } finally {
      setEvaluatingLoading(false);
    }
  };

  // Compute skill badges & missing tech
  const allParsedSkills = analytics.skills?.length > 0
    ? analytics.skills
    : (resumeProfile?.skills || ["Python", "JavaScript", "React", "Node.js", "SQL"]);

  const allParsedScores = analytics.scores?.length > 0
    ? analytics.scores
    : [85, 80, 78, 72, 68];

  const experienceTier = analytics.experience_level || resumeProfile?.experience_level || "Mid-Level";

  // Target role recommendations for missing skills breakdown
  const targetTechRequirements = [
    { name: "System Architecture & Scalability", key: "System Architecture" },
    { name: "Docker & Container Orchestration", key: "DevOps & Cloud" },
    { name: "Vector Databases & LLM Pipelines", key: "AI / ML Integration" },
    { name: "CI/CD & Automated Testing", key: "Testing & CI/CD" },
    { name: "Async Processing & Redis Caching", key: "Backend APIs" }
  ];

  return (
    <div style={{ maxWidth: "1240px", margin: "0 auto", padding: isMobile ? "0 12px 80px" : "0 0 80px", boxSizing: "border-box" }}>
      {/* Hero Glassmorphism Header */}
      <div
        className="glass-panel"
        style={{
          marginBottom: "28px",
          padding: "28px 24px",
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)",
          border: "1.5px solid rgba(139, 92, 246, 0.35)",
          borderRadius: "20px",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.3)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary)", fontWeight: 700, fontSize: "13px", marginBottom: "6px" }}>
              <Brain size={18} />
              <span>AI CAREER & ENGINEERING MENTOR</span>
            </div>
            <h1 style={{ fontSize: isMobile ? "24px" : "28px", margin: "0 0 6px 0", color: "#F8FAFC", fontWeight: 800 }}>
              AI Cover Letter, Mock Interviews & Skill Matrix
            </h1>
            <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0, maxWidth: "720px", lineHeight: 1.5 }}>
              Accelerate your engineering career with tailored Cover Letters, interactive AI Mock Interviews, Skill Radar Intelligence, and Resume parsing.
            </p>
          </div>

          {/* Nav Tabs Bar */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              background: "rgba(15, 23, 42, 0.8)",
              padding: "6px",
              borderRadius: "14px",
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}
          >
            <Button
              variant={activeTab === "chat" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("chat")}
              leftIcon={<MessageSquare size={15} />}
            >
              AI Chat
            </Button>
            <Button
              variant={activeTab === "cover_letter" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("cover_letter")}
              leftIcon={<FileText size={15} />}
            >
              Cover Letter
            </Button>
            <Button
              variant={activeTab === "interview" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("interview")}
              leftIcon={<Mic size={15} />}
            >
              Mock Interview
            </Button>
            <Button
              variant={activeTab === "analytics" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("analytics")}
              leftIcon={<BarChart3 size={15} />}
            >
              Skill Matrix
            </Button>
            <Button
              variant={activeTab === "resume" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("resume")}
              leftIcon={<Upload size={15} />}
            >
              Resume File
            </Button>
            <Button
              variant={activeTab === "roadmap" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("roadmap")}
              leftIcon={<MapPin size={15} />}
            >
              Roadmap
            </Button>
          </div>
        </div>
      </div>

      {/* TAB 1: AI MENTOR CHAT */}
      {activeTab === "chat" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: "24px" }}>
          {/* Chat Main Window */}
          <Card padding="24px" style={{ minHeight: "560px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "16px", borderBottom: "1px solid var(--border)", marginBottom: "20px" }}>
              <Sparkles size={20} color="var(--primary)" />
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", color: "#F8FAFC" }}>Socratic AI Engineering Mentor</h3>
                <span style={{ fontSize: "12px", color: "#10B981", fontWeight: 600 }}>● Active Skill Context Memory</span>
              </div>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px", display: "flex", flexDirection: "column", gap: "16px", maxHeight: "440px" }}>
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    flexDirection: m.sender === "user" ? "row-reverse" : "row"
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: m.sender === "user" ? "#8B5CF6" : "#0F172A",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 700,
                      flexShrink: 0
                    }}
                  >
                    {m.sender === "user" ? "YOU" : <Brain size={16} />}
                  </div>

                  <div
                    style={{
                      background: m.sender === "user" ? "#8B5CF6" : "rgba(30, 41, 59, 0.8)",
                      color: "#F8FAFC",
                      padding: "14px 18px",
                      borderRadius: m.sender === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      fontSize: "14px",
                      lineHeight: 1.6,
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      overflowWrap: "anywhere"
                    }}
                  >
                    {renderMessageContent(m.text)}
                  </div>
                </div>
              ))}
              {chatSending && (
                <div style={{ display: "flex", gap: "10px", alignSelf: "flex-start" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#0F172A", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Brain size={16} />
                  </div>
                  <div style={{ background: "rgba(30, 41, 59, 0.8)", padding: "12px 18px", borderRadius: "18px", display: "flex", alignItems: "center", gap: "8px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                    <Spinner size="sm" color="#8B5CF6" />
                    <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 500 }}>AI is formulating guidance...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Suggested Prompts */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "8px 0", marginTop: "12px", scrollbarWidth: "none" }}>
              {[
                { icon: "📄", label: "Analyze My Resume", text: "Please review my technical profile and tell me my strongest skills and areas to improve." },
                { icon: "🎯", label: "Mock Interview Prep", text: "Can you ask me a technical system design interview question?" },
                { icon: "🗺️", label: "AI Career Roadmap", text: "What key skills do I need to master to become a Senior AI Systems Engineer?" },
                { icon: "💼", label: "Cover Letter Tips", text: "How should I structure a high-impact cover letter for lead engineering roles?" }
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setChatInput(chip.text);
                  }}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "20px",
                    padding: "6px 14px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#94A3B8",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(139, 92, 246, 0.15)";
                    e.currentTarget.style.color = "#F8FAFC";
                    e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.color = "#94A3B8";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                  }}
                >
                  <span>{chip.icon}</span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChat} style={{ display: "flex", gap: "12px", marginTop: "8px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
              <input
                type="text"
                placeholder="Ask about interview strategies, resume feedback, or career transitions..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  background: "rgba(15, 23, 42, 0.6)",
                  color: "#F8FAFC",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
              <Button type="submit" variant="glowing" disabled={chatSending} rightIcon={<Send size={16} />}>
                Send
              </Button>
            </form>
          </Card>

          {/* Chat Sidebar Context */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <Card padding="20px">
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#F8FAFC", display: "flex", alignItems: "center", gap: "8px" }}>
                <Brain size={16} color="#8B5CF6" /> Active Resume Context
              </h4>
              {resumeProfile ? (
                <div>
                  <div style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "8px" }}>
                    <strong>Level:</strong> {experienceTier}
                  </div>
                  <div style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "12px" }}>
                    <strong>Extracted Skills:</strong> {allParsedSkills.slice(0, 6).join(", ")}
                  </div>
                  <Button variant="outline" size="sm" fullWidth onClick={() => setActiveTab("resume")}>
                    Manage Resume File
                  </Button>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: "12px", color: "#64748B", marginBottom: "12px" }}>
                    Upload your resume to unlock hyper-personalized AI career advice.
                  </p>
                  <Button variant="secondary" size="sm" fullWidth onClick={() => setActiveTab("resume")}>
                    Upload Resume File
                  </Button>
                </div>
              )}
            </Card>

            <Card padding="20px">
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#F8FAFC", display: "flex", alignItems: "center", gap: "8px" }}>
                <Lightbulb size={16} color="#F59E0B" /> Recommended Prompts
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                  onClick={() => setChatInput("What are the top 3 high-leverage skills I should add to my resume?")}
                  style={{ textAlign: "left", padding: "10px 12px", background: "rgba(30, 41, 59, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "8px", fontSize: "12px", cursor: "pointer", color: "#8B5CF6" }}
                >
                  "Top 3 high-leverage skills to learn next?"
                </button>
                <button
                  onClick={() => setChatInput("How should I frame system architecture experience in technical interviews?")}
                  style={{ textAlign: "left", padding: "10px 12px", background: "rgba(30, 41, 59, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "8px", fontSize: "12px", cursor: "pointer", color: "#8B5CF6" }}
                >
                  "Framing system architecture in interviews?"
                </button>
                <button
                  onClick={() => setChatInput("Can you conduct a quick 3-question diagnostic on my software engineering background?")}
                  style={{ textAlign: "left", padding: "10px 12px", background: "rgba(30, 41, 59, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "8px", fontSize: "12px", cursor: "pointer", color: "#8B5CF6" }}
                >
                  "Conduct quick diagnostic interview?"
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: AI COVER LETTER GENERATOR */}
      {activeTab === "cover_letter" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "24px" }}>
          {/* Input Form Card */}
          <Card padding="24px">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <FileText size={22} color="#8B5CF6" />
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#F8FAFC" }}>📝 AI Cover Letter Generator</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#94A3B8" }}>
                  Generates an impactful, tailored cover letter using your resume profile and job criteria.
                </p>
              </div>
            </div>

            <form onSubmit={handleGenerateCoverLetter} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#E2E8F0", marginBottom: "6px" }}>
                  Target Job Title <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Software Engineer / AI Architect"
                  value={coverJobTitle}
                  onChange={(e) => setCoverJobTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background: "rgba(15, 23, 42, 0.6)",
                    color: "#F8FAFC",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#E2E8F0", marginBottom: "6px" }}>
                  Company Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Anthropic, Google, Stripe"
                  value={coverCompany}
                  onChange={(e) => setCoverCompany(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background: "rgba(15, 23, 42, 0.6)",
                    color: "#F8FAFC",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#E2E8F0", marginBottom: "6px" }}>
                  Job Description / Key Requirements
                </label>
                <textarea
                  rows={6}
                  placeholder="Paste target job description snippet (e.g. 5+ yrs experience with Node.js, distributed systems, system design, REST APIs)..."
                  value={coverDescription}
                  onChange={(e) => setCoverDescription(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background: "rgba(15, 23, 42, 0.6)",
                    color: "#F8FAFC",
                    fontSize: "13px",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <Button
                type="submit"
                variant="glowing"
                size="lg"
                disabled={coverLoading}
                leftIcon={coverLoading ? <Spinner size="sm" /> : <Sparkles size={18} />}
              >
                {coverLoading ? "Drafting Tailored Cover Letter..." : "Generate AI Cover Letter"}
              </Button>
            </form>
          </Card>

          {/* Generated Cover Letter Output */}
          <Card padding="24px" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#F8FAFC" }}>✨ Tailored Cover Letter</h3>
              {coverLetter && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCoverLetter}
                    leftIcon={copiedCover ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                  >
                    {copiedCover ? "Copied!" : "Copy to Clipboard"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadCoverLetter}
                    leftIcon={<Download size={14} />}
                  >
                    Export .txt
                  </Button>
                </div>
              )}
            </div>

            {coverLetter ? (
              <div
                style={{
                  flex: 1,
                  background: "rgba(15, 23, 42, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "14px",
                  padding: "20px",
                  fontSize: "14px",
                  lineHeight: 1.7,
                  color: "#E2E8F0",
                  whiteSpace: "pre-wrap",
                  fontFamily: "sans-serif",
                  overflowY: "auto",
                  maxHeight: "480px"
                }}
              >
                {coverLetter}
              </div>
            ) : (
              <div style={{ flex: 1, textAlign: "center", padding: "60px 20px", color: "#64748B", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                <FileText size={48} style={{ opacity: 0.3, marginBottom: "16px", color: "#8B5CF6" }} />
                <h4 style={{ color: "#F8FAFC", margin: "0 0 6px 0" }}>No Cover Letter Drafted Yet</h4>
                <p style={{ fontSize: "13px", margin: 0, maxWidth: "340px" }}>
                  Fill out the Job Title and details on the left, then click "Generate AI Cover Letter" to craft your personalized application.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: AI MOCK INTERVIEW PREP */}
      {activeTab === "interview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Interview Settings Bar */}
          <Card padding="20px">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Mic size={24} color="#8B5CF6" />
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#F8FAFC" }}>🎙️ AI Mock Technical & Behavioral Interview Prep</h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#94A3B8" }}>
                    Simulate real 5-question interview sessions with instant 0-100 scoring, feedback, and model answers.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <select
                    value={interviewRole}
                    onChange={(e) => setInterviewRole(e.target.value)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      background: "rgba(15, 23, 42, 0.8)",
                      color: "#F8FAFC",
                      fontSize: "13px",
                      outline: "none",
                      cursor: "pointer"
                    }}
                  >
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="Full-Stack Developer">Full-Stack Developer</option>
                    <option value="Frontend Specialist">Frontend Specialist</option>
                    <option value="Backend / Systems Engineer">Backend / Systems Engineer</option>
                    <option value="AI / ML Engineer">AI / ML Engineer</option>
                    <option value="System Design Architect">System Design Architect</option>
                  </select>
                </div>

                <div>
                  <select
                    value={interviewDifficulty}
                    onChange={(e) => setInterviewDifficulty(e.target.value)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      background: "rgba(15, 23, 42, 0.8)",
                      color: "#F8FAFC",
                      fontSize: "13px",
                      outline: "none",
                      cursor: "pointer"
                    }}
                  >
                    <option value="Junior">Entry / Junior</option>
                    <option value="Mid">Mid-Level</option>
                    <option value="Senior">Senior Engineer</option>
                    <option value="Lead">Staff / Principal Lead</option>
                  </select>
                </div>

                <Button
                  variant="glowing"
                  onClick={handleGenerateQuestions}
                  disabled={questionsLoading}
                  leftIcon={questionsLoading ? <Spinner size="sm" /> : <Sparkles size={16} />}
                >
                  {questionsLoading ? "Generating Questions..." : "Start 5-Question Prep"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Active Interview Simulator */}
          {interviewQuestions.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: "24px" }}>
              {/* Question & Answer Card */}
              <Card padding="24px">
                {/* Simulator Progress Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {interviewQuestions.map((_, qIdx) => {
                      const isEvaluated = !!evaluations[qIdx];
                      const isCurrent = qIdx === currentQIndex;
                      return (
                        <button
                          key={qIdx}
                          onClick={() => {
                            setCurrentQIndex(qIdx);
                            setUserAnswerText(evaluations[qIdx]?.user_answer || "");
                            setShowHint(false);
                          }}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            border: isCurrent ? "2px solid #8B5CF6" : "1px solid rgba(255, 255, 255, 0.1)",
                            background: isEvaluated ? "#10B981" : isCurrent ? "rgba(139, 92, 246, 0.3)" : "rgba(30, 41, 59, 0.6)",
                            color: "#FFFFFF",
                            fontWeight: 700,
                            fontSize: "13px",
                            cursor: "pointer"
                          }}
                        >
                          Q{qIdx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <span className="pill xp" style={{ fontSize: "12px", background: "rgba(139, 92, 246, 0.2)", color: "#C084FC" }}>
                    Category: {interviewQuestions[currentQIndex]?.category || "Technical"}
                  </span>
                </div>

                {/* Question Display Box */}
                <div
                  style={{
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    borderRadius: "14px",
                    padding: "20px",
                    marginBottom: "20px"
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#8B5CF6", fontWeight: 700, textTransform: "uppercase", marginBottom: "6px" }}>
                    Question {currentQIndex + 1} of 5
                  </div>
                  <h4 style={{ margin: 0, fontSize: "16px", color: "#F8FAFC", lineHeight: 1.5, fontWeight: 700 }}>
                    {interviewQuestions[currentQIndex]?.question}
                  </h4>

                  {/* Hint Toggle */}
                  {interviewQuestions[currentQIndex]?.hint && (
                    <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed rgba(255, 255, 255, 0.1)" }}>
                      <button
                        onClick={() => setShowHint(!showHint)}
                        style={{ background: "none", border: "none", color: "#F59E0B", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", padding: 0 }}
                      >
                        <Lightbulb size={14} />
                        {showHint ? "Hide Interviewer Expectation Hint" : "Show Interviewer Expectation Hint"}
                      </button>
                      {showHint && (
                        <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#CBD5E1", fontStyle: "italic" }}>
                          💡 {interviewQuestions[currentQIndex].hint}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Candidate Answer Textarea */}
                <form onSubmit={handleSubmitInterviewAnswer}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#E2E8F0", marginBottom: "8px" }}>
                    Your Technical / Behavioral Response
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Type your response clearly. Structure technical answers with trade-offs, architecture, and edge-cases. For behavioral answers, use STAR (Situation, Task, Action, Result)..."
                    value={userAnswerText}
                    onChange={(e) => setUserAnswerText(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      background: "rgba(15, 23, 42, 0.6)",
                      color: "#F8FAFC",
                      fontSize: "14px",
                      outline: "none",
                      marginBottom: "16px",
                      resize: "vertical",
                      boxSizing: "border-box"
                    }}
                  />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={currentQIndex === 0}
                        onClick={() => {
                          setCurrentQIndex((prev) => prev - 1);
                          setUserAnswerText(evaluations[currentQIndex - 1]?.user_answer || "");
                          setShowHint(false);
                        }}
                        leftIcon={<ChevronLeft size={16} />}
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={currentQIndex === interviewQuestions.length - 1}
                        onClick={() => {
                          setCurrentQIndex((prev) => prev + 1);
                          setUserAnswerText(evaluations[currentQIndex + 1]?.user_answer || "");
                          setShowHint(false);
                        }}
                        rightIcon={<ChevronRight size={16} />}
                      >
                        Next
                      </Button>
                    </div>

                    <Button
                      type="submit"
                      variant="glowing"
                      disabled={evaluatingLoading}
                      leftIcon={evaluatingLoading ? <Spinner size="sm" /> : <Sparkles size={16} />}
                    >
                      {evaluatingLoading ? "Evaluating Answer..." : "Submit Answer for Score"}
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Evaluation Feedback Panel */}
              <Card padding="24px" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h4 style={{ margin: 0, fontSize: "16px", color: "#F8FAFC", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Award size={18} color="#8B5CF6" /> Instant AI Score & Feedback
                </h4>

                {evaluations[currentQIndex] ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Score Badge */}
                    <div style={{ background: "rgba(15, 23, 42, 0.8)", padding: "16px", borderRadius: "12px", textAlign: "center", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                      <div style={{ fontSize: "12px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>EVALUATION SCORE</div>
                      <div
                        style={{
                          fontSize: "36px",
                          fontWeight: 800,
                          color: evaluations[currentQIndex].score >= 80 ? "#10B981" : evaluations[currentQIndex].score >= 65 ? "#F59E0B" : "#EF4444",
                          margin: "4px 0"
                        }}
                      >
                        {evaluations[currentQIndex].score} / 100
                      </div>
                    </div>

                    {/* Feedback */}
                    <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "14px", borderRadius: "12px", borderLeft: "4px solid #8B5CF6" }}>
                      <div style={{ fontSize: "12px", color: "#8B5CF6", fontWeight: 700, marginBottom: "4px" }}>CONSTRUCTIVE FEEDBACK</div>
                      <p style={{ margin: 0, fontSize: "13px", color: "#E2E8F0", lineHeight: 1.5 }}>
                        {evaluations[currentQIndex].feedback}
                      </p>
                    </div>

                    {/* Model Answer */}
                    <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: "14px", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                      <div style={{ fontSize: "12px", color: "#10B981", fontWeight: 700, marginBottom: "4px" }}>🌟 MODEL PRODUCTION ANSWER</div>
                      <p style={{ margin: 0, fontSize: "13px", color: "#CBD5E1", lineHeight: 1.5, fontStyle: "italic" }}>
                        {evaluations[currentQIndex].improved_answer}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px 10px", color: "#64748B" }}>
                    <Target size={36} style={{ opacity: 0.3, marginBottom: "12px", color: "#8B5CF6" }} />
                    <h5 style={{ color: "#F8FAFC", margin: "0 0 4px 0" }}>No Evaluation Yet</h5>
                    <p style={{ fontSize: "12px", margin: 0 }}>
                      Write your response to Question {currentQIndex + 1} and click "Submit Answer for Score".
                    </p>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <Card padding="40px" style={{ textAlign: "center" }}>
              <Mic size={48} style={{ margin: "0 auto 16px", opacity: 0.3, color: "#8B5CF6" }} />
              <h4 style={{ color: "#F8FAFC", margin: "0 0 6px 0" }}>Ready for Mock Interview Prep?</h4>
              <p style={{ color: "#94A3B8", fontSize: "14px", margin: "0 0 20px 0" }}>
                Select your target engineering role and difficulty level above, then click "Start 5-Question Prep".
              </p>
              <Button variant="glowing" onClick={handleGenerateQuestions} disabled={questionsLoading}>
                Start Mock Interview Session
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* TAB 4: SKILL MATRIX & RADAR DASHBOARD */}
      {activeTab === "analytics" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "360px 1fr", gap: "24px" }}>
          {/* Radar Chart Card */}
          <Card padding="24px" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: "100%", marginBottom: "12px" }}>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#F8FAFC" }}>📊 Dynamic Skill Radar</h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#94A3B8" }}>
                Visualized proficiency breakdown across key software engineering domains.
              </p>
            </div>

            <SkillRadarChart skills={allParsedSkills} scores={allParsedScores} />

            <div style={{ width: "100%", background: "rgba(15, 23, 42, 0.8)", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.1)", textAlign: "center" }}>
              <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>EXPERIENCE TIER BADGE</span>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#8B5CF6", marginTop: "2px" }}>
                🏆 {experienceTier} Engineer
              </div>
            </div>
          </Card>

          {/* Parsed Skills & Upskilling Matrix */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Parsed Skills Breakdown with Badges */}
            <Card padding="24px">
              <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#F8FAFC" }}>⚡ Parsed Skills & Level Matrix</h3>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "14px" }}>
                {allParsedSkills.map((sk, idx) => {
                  const score = allParsedScores[idx] || 75;
                  const levelBadge = score >= 85 ? "Expert" : score >= 75 ? "Advanced" : score >= 60 ? "Intermediate" : "Learning";
                  const levelColor = score >= 85 ? "#10B981" : score >= 75 ? "#38BDF8" : score >= 60 ? "#F59E0B" : "#8B5CF6";
                  return (
                    <div
                      key={idx}
                      style={{
                        background: "rgba(15, 23, 42, 0.7)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        padding: "14px",
                        borderRadius: "12px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontWeight: 700, fontSize: "14px", color: "#F8FAFC" }}>{sk}</span>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "12px", background: `${levelColor}20`, color: levelColor }}>
                          {levelBadge} ({score}%)
                        </span>
                      </div>
                      <div className="progress-bar-bg" style={{ height: "6px" }}>
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${score}%`, background: `linear-gradient(90deg, ${levelColor} 0%, #3B82F6 100%)` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Target Role Skill Gap & Upskilling Path */}
            <Card padding="24px">
              <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", color: "#F8FAFC", display: "flex", alignItems: "center", gap: "8px" }}>
                <TrendingUp size={20} color="#10B981" /> Missing Technologies & Upskilling Path
              </h3>
              <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#94A3B8" }}>
                Recommended technical competencies to bridge your gap to Senior / Staff role criteria:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {targetTechRequirements.map((req, rIdx) => (
                  <div
                    key={rIdx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      background: "rgba(30, 41, 59, 0.6)",
                      borderRadius: "10px",
                      border: "1px solid rgba(255, 255, 255, 0.08)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <CheckCircle2 size={16} color="#10B981" />
                      <span style={{ fontSize: "13px", color: "#E2E8F0", fontWeight: 600 }}>{req.name}</span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#38BDF8", fontWeight: 600 }}>Priority Focus</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 5: RESUME PROFILE & FILE UPLOAD */}
      {activeTab === "resume" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "24px" }}>
          <Card padding="24px">
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#F8FAFC" }}>📄 Resume Upload & Text Parser</h3>
            <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "20px" }}>
              Upload your PDF, DOCX, or TXT resume file for automatic dynamic AI extraction.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.docx,.doc,.txt,.csv"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed #8B5CF6",
                borderRadius: "16px",
                padding: "32px 20px",
                textAlign: "center",
                background: "rgba(139, 92, 246, 0.08)",
                cursor: "pointer",
                marginBottom: "24px",
                transition: "all 0.2s ease"
              }}
            >
              <Upload size={36} color="#8B5CF6" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontWeight: 700, fontSize: "15px", color: "#F8FAFC", marginBottom: "4px" }}>
                {selectedFile ? `Selected: ${selectedFile.name}` : "Click to Upload Resume File (PDF, DOCX, TXT)"}
              </div>
              <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0 }}>
                Automatic multi-format text extraction & dynamic AI analysis
              </p>
            </div>

            <div style={{ position: "relative", textAlign: "center", marginBottom: "20px" }}>
              <hr style={{ border: "none", borderTop: "1px solid rgba(255, 255, 255, 0.1)", margin: "16px 0" }} />
              <span style={{ position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", background: "#0F172A", padding: "0 12px", fontSize: "12px", color: "#64748B", fontWeight: 700 }}>
                OR PASTE PLAIN TEXT
              </span>
            </div>

            <textarea
              rows={8}
              placeholder="Or paste your plain text resume content here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "rgba(15, 23, 42, 0.6)",
                color: "#F8FAFC",
                fontSize: "13px",
                fontFamily: "monospace",
                outline: "none",
                marginBottom: "16px",
                resize: "vertical",
                boxSizing: "border-box"
              }}
            />

            <Button
              variant="glowing"
              size="lg"
              onClick={handleUploadResumeText}
              disabled={resumeLoading}
              leftIcon={<Sparkles size={18} />}
            >
              {resumeLoading ? "Analyzing Dynamically with AI..." : "Analyze Text Dynamically"}
            </Button>
          </Card>

          {/* AI Parsed Profile Output */}
          <Card padding="24px">
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#F8FAFC" }}>✨ Dynamic AI Extracted Profile</h3>
            {resumeProfile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ background: "rgba(15, 23, 42, 0.8)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 800, textTransform: "uppercase" }}>DYNAMIC EXPERIENCE TIER</span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#8B5CF6", marginTop: "4px" }}>
                    {resumeProfile.experience_level || "Mid-Level"}
                  </div>
                </div>

                <div style={{ background: "rgba(15, 23, 42, 0.8)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 800, textTransform: "uppercase" }}>BACKGROUND & DEGREES</span>
                  <div style={{ fontSize: "14px", color: "#F8FAFC", marginTop: "4px", lineHeight: 1.4 }}>
                    {resumeProfile.education || "Computer Science / Software Engineering Background"}
                  </div>
                </div>

                <div style={{ background: "rgba(15, 23, 42, 0.8)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 800, textTransform: "uppercase" }}>DYNAMICALLY EXTRACTED SKILLS ({resumeProfile.skills?.length || 0})</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                    {(resumeProfile.skills || []).map((sk, idx) => (
                      <span key={idx} className="pill xp" style={{ background: "rgba(139, 92, 246, 0.2)", color: "#C084FC", fontWeight: 700 }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748B" }}>
                <FileText size={48} style={{ margin: "0 auto 16px", opacity: 0.3, color: "#8B5CF6" }} />
                <h4 style={{ color: "#F8FAFC", margin: "0 0 6px 0" }}>No Dynamic Resume Analyzed Yet</h4>
                <p style={{ fontSize: "13px", margin: 0 }}>
                  Upload a PDF/DOCX file or paste text on the left to extract your skills dynamically.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 6: PERSONALIZED CAREER ROADMAP */}
      {activeTab === "roadmap" && (
        <div>
          <Card padding="24px" style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#F8FAFC" }}>🗺️ 5-Step Dynamic AI Career Roadmap</h3>
                <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>
                  Generated tailored blueprints with real working URLs based on your uploaded resume.
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="text"
                  value={targetRoleInput}
                  onChange={(e) => setTargetRoleInput(e.target.value)}
                  placeholder="Target Role (e.g. AI Agent Architect)"
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background: "rgba(15, 23, 42, 0.8)",
                    color: "#F8FAFC",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
                <Button variant="glowing" onClick={handleGenerateRoadmap} disabled={roadmapLoading} leftIcon={<Zap size={16} />}>
                  {roadmapLoading ? "Generating Dynamic Roadmap..." : "Generate Dynamic Roadmap"}
                </Button>
              </div>
            </div>
          </Card>

          {roadmap && roadmap.steps && roadmap.steps.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {roadmap.steps.map((st) => (
                <Card key={st.id} padding="20px" style={{ borderLeft: st.completed ? "4px solid #10B981" : "4px solid #8B5CF6" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => handleToggleStep(st.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}
                        >
                          {st.completed ? <CheckCircle2 size={22} color="#10B981" /> : <Circle size={22} color="#64748B" />}
                        </button>
                        <h4 style={{ margin: 0, fontSize: "16px", color: "#F8FAFC", textDecoration: st.completed ? "line-through" : "none" }}>
                          {st.step}
                        </h4>
                        {st.difficulty && <span className="pill xp" style={{ fontSize: "11px" }}>{st.difficulty}</span>}
                        {st.estimated_time && <span className="pill streak" style={{ fontSize: "11px" }}>⏱️ {st.estimated_time}</span>}
                      </div>
                      <p style={{ fontSize: "14px", color: "#94A3B8", margin: "0 0 16px 32px" }}>
                        {st.description}
                      </p>

                      {st.resources && st.resources.length > 0 && (
                        <div style={{ marginLeft: "32px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                          {st.resources.map((res, rIdx) => (
                            <a
                              key={rIdx}
                              href={res.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "6px 12px",
                                background: "rgba(30, 41, 59, 0.8)",
                                borderRadius: "8px",
                                fontSize: "12px",
                                color: "#8B5CF6",
                                textDecoration: "none",
                                fontWeight: 600,
                                border: "1px solid rgba(255, 255, 255, 0.08)"
                              }}
                            >
                              <ExternalLink size={12} />
                              {res.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card padding="40px" style={{ textAlign: "center" }}>
              <MapPin size={48} style={{ margin: "0 auto 16px", opacity: 0.3, color: "#8B5CF6" }} />
              <h4 style={{ color: "#F8FAFC", margin: "0 0 6px 0" }}>No Career Roadmap Generated Yet</h4>
              <p style={{ color: "#64748B", margin: "0 0 16px 0" }}>
                Click "Generate Dynamic Roadmap" above to build a 5-step blueprint from your resume.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
