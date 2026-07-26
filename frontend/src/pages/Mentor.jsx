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
  BookOpen,
  Video,
  Award,
  Terminal,
  Cpu,
  Brain,
  Zap,
  FileCode,
  FileSpreadsheet
} from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";

export default function Mentor() {
  const toast = useToast();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("chat"); // 'chat', 'resume', 'analytics', 'roadmap'

  // Chat State
  const [messages, setMessages] = useState([
    {
      sender: "mentor",
      text: "Hello! I am your AI Career Mentor. I analyze your uploaded resume and career goals to provide personalized engineering advice. Upload a resume file or ask a question to begin!"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef = useRef(null);

  // Resume State
  const [resumeText, setResumeText] = useState("");
  const [resumeProfile, setResumeProfile] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Analytics State
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

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Load active resume & analytics & roadmap on mount
    api.getMentorResume().then((res) => {
      if (res.has_resume) {
        setResumeProfile(res);
        setResumeText(res.resume_text);
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
      toast.show(err.message || "Failed to reach AI Mentor", "error");
    } finally {
      setChatSending(false);
    }
  };

  const handleUploadResumeText = async () => {
    if (!resumeText.trim()) {
      toast.show("Please paste or upload your resume first", "warning");
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
      toast.show("Resume dynamically analyzed & saved to AI Memory!", "success");
      soundService.play("levelup");
    } catch (err) {
      toast.show(err.message || "Failed to analyze resume", "error");
    } finally {
      setResumeLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundService.play("click");
    setSelectedFile(file);
    setResumeLoading(true);

    try {
      toast.show(`Uploading & parsing ${file.name}...`, "info");
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
      toast.show(`Successfully analyzed ${file.name}!`, "success");
      soundService.play("levelup");
    } catch (err) {
      toast.show(err.message || "Failed to parse uploaded file", "error");
    } finally {
      setResumeLoading(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    soundService.play("click");
    setRoadmapLoading(true);
    try {
      const res = await api.generateMentorRoadmap(targetRoleInput);
      setRoadmap(res);
      toast.show(`Personalized ${targetRoleInput} Roadmap Generated!`, "success");
      soundService.play("levelup");
      const slug = `tailored-${targetRoleInput.toLowerCase().replace(/\s+/g, "-")}`;
      window.location.href = `/roadmaps/tailored/${slug}`;
    } catch (err) {
      toast.show(err.message || "Failed to generate career roadmap", "error");
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

  return (
    <div style={{ maxWidth: "1240px", margin: "0 auto", padding: isMobile ? "0 12px 80px" : "0 0 80px", boxSizing: "border-box" }}>
      {/* Hero Header */}
      <div
        className="glass-panel"
        style={{
          marginBottom: "28px",
          padding: "32px 28px",
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(15, 23, 42, 0.95) 100%)",
          border: "1.5px solid rgba(139, 92, 246, 0.3)",
          borderRadius: "20px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary)", fontWeight: 700, fontSize: "13px", marginBottom: "6px" }}>
              <Brain size={18} />
              <span>AI CAREER MENTOR PLATFORM</span>
            </div>
            <h1 style={{ fontSize: "28px", margin: "0 0 6px 0", color: "#0F172A", fontWeight: 800 }}>
              Dynamic AI Resume Intelligence & Guidance
            </h1>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px", margin: 0, maxWidth: "680px" }}>
              Upload your PDF, DOCX, or TXT resume to trigger real-time AI skill extraction, proficiency scores, and personalized 5-step career roadmaps.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Button
              variant={activeTab === "chat" ? "primary" : "ghost"}
              onClick={() => setActiveTab("chat")}
              leftIcon={<MessageSquare size={16} />}
            >
              AI Chat
            </Button>
            <Button
              variant={activeTab === "resume" ? "primary" : "ghost"}
              onClick={() => setActiveTab("resume")}
              leftIcon={<FileText size={16} />}
            >
              Resume File Upload
            </Button>
            <Button
              variant={activeTab === "analytics" ? "primary" : "ghost"}
              onClick={() => setActiveTab("analytics")}
              leftIcon={<BarChart3 size={16} />}
            >
              Skill Analytics
            </Button>
            <Button
              variant={activeTab === "roadmap" ? "primary" : "ghost"}
              onClick={() => setActiveTab("roadmap")}
              leftIcon={<MapPin size={16} />}
            >
              Career Roadmap
            </Button>
          </div>
        </div>
      </div>

      {/* TAB 1: AI MENTOR CHAT */}
      {activeTab === "chat" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: "24px" }}>
          {/* Chat Window */}
          <Card padding="24px" style={{ minHeight: "560px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "16px", borderBottom: "1px solid var(--border)", marginBottom: "20px" }}>
              <Sparkles size={20} color="var(--primary)" />
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", color: "#0F172A" }}>Socratic AI Mentor</h3>
                <span style={{ fontSize: "12px", color: "var(--accent-emerald)", fontWeight: 600 }}>● Active Context Memory</span>
              </div>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px", display: "flex", flexDirection: "column", gap: "16px", maxHeight: "420px" }}>
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    background: m.sender === "user" ? "var(--primary)" : "var(--bg-subtle)",
                    color: m.sender === "user" ? "#FFFFFF" : "#0F172A",
                    padding: "14px 18px",
                    borderRadius: m.sender === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    fontSize: "14px",
                    lineHeight: 1.5,
                    boxShadow: "var(--shadow)"
                  }}
                >
                  {m.text}
                </div>
              ))}
              {chatSending && (
                <div style={{ alignSelf: "flex-start", background: "var(--bg-subtle)", padding: "12px 18px", borderRadius: "18px" }}>
                  <Spinner size="sm" color="var(--primary)" />
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChat} style={{ display: "flex", gap: "12px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
              <input
                type="text"
                placeholder="Ask for guidance based on your resume, skills, or target engineering role..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  background: "#FFFFFF",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
              <Button type="submit" variant="glowing" disabled={chatSending} rightIcon={<Send size={16} />}>
                Send
              </Button>
            </form>
          </Card>

          {/* Context Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <Card padding="20px">
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#0F172A" }}>🧠 Active Resume Memory</h4>
              {resumeProfile ? (
                <div>
                  <div style={{ fontSize: "12px", color: "var(--ink-soft)", marginBottom: "8px" }}>
                    <strong>Level:</strong> {resumeProfile.experience_level || "Mid"} Tier
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--ink-soft)", marginBottom: "12px" }}>
                    <strong>Skills:</strong> {(resumeProfile.skills || []).slice(0, 6).join(", ")}
                  </div>
                  <Button variant="outline" size="sm" fullWidth onClick={() => setActiveTab("resume")}>
                    Manage Resume File
                  </Button>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: "12px", color: "var(--ink-faint)", marginBottom: "12px" }}>
                    No resume uploaded yet. Upload a PDF or DOCX file to unlock custom mentorship.
                  </p>
                  <Button variant="secondary" size="sm" fullWidth onClick={() => setActiveTab("resume")}>
                    Upload Resume File
                  </Button>
                </div>
              )}
            </Card>

            <Card padding="20px">
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#0F172A" }}>💡 Suggested Prompts</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                  onClick={() => setChatInput("How can I transition from Full-Stack to AI Agent Architecture?")}
                  style={{ textAlign: "left", padding: "8px 12px", background: "var(--bg-subtle)", border: "none", borderRadius: "8px", fontSize: "12px", cursor: "pointer", color: "var(--primary)" }}
                >
                  "Transition to AI Agent Architecture?"
                </button>
                <button
                  onClick={() => setChatInput("What are the top 3 high-leverage skills I should learn next?")}
                  style={{ textAlign: "left", padding: "8px 12px", background: "var(--bg-subtle)", border: "none", borderRadius: "8px", fontSize: "12px", cursor: "pointer", color: "var(--primary)" }}
                >
                  "Top 3 skills to learn next?"
                </button>
                <button
                  onClick={() => setChatInput("Review my resume skills and suggest salary optimization strategies.")}
                  style={{ textAlign: "left", padding: "8px 12px", background: "var(--bg-subtle)", border: "none", borderRadius: "8px", fontSize: "12px", cursor: "pointer", color: "var(--primary)" }}
                >
                  "Salary optimization strategies?"
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: RESUME PROFILE & FILE UPLOAD */}
      {activeTab === "resume" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "24px" }}>
          <Card padding="24px">
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#0F172A" }}>📄 Resume Upload & Text Parser</h3>
            <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginBottom: "20px" }}>
              Upload your PDF, DOCX, or TXT resume file for automatic dynamic AI extraction.
            </p>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.docx,.doc,.txt,.csv"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {/* Drag & Drop / File Click Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed var(--primary)",
                borderRadius: "16px",
                padding: "32px 20px",
                textAlign: "center",
                background: "var(--primary-soft)",
                cursor: "pointer",
                marginBottom: "24px",
                transition: "all 0.2s ease"
              }}
            >
              <Upload size={36} color="var(--primary)" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontWeight: 700, fontSize: "15px", color: "#0F172A", marginBottom: "4px" }}>
                {selectedFile ? `Selected: ${selectedFile.name}` : "Click to Upload Resume File (PDF, DOCX, TXT)"}
              </div>
              <p style={{ fontSize: "12px", color: "var(--ink-soft)", margin: 0 }}>
                Automatic multi-format text extraction & dynamic AI analysis
              </p>
            </div>

            <div style={{ position: "relative", textAlign: "center", marginBottom: "20px" }}>
              <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "16px 0" }} />
              <span style={{ position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", background: "#FFFFFF", padding: "0 12px", fontSize: "12px", color: "var(--ink-faint)", fontWeight: 700 }}>
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
                border: "1px solid var(--border)",
                fontSize: "13px",
                fontFamily: "var(--mono)",
                outline: "none",
                marginBottom: "16px",
                resize: "vertical"
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
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#0F172A" }}>✨ Dynamic AI Extracted Profile</h3>
            {resumeProfile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ background: "var(--bg-subtle)", padding: "16px", borderRadius: "12px" }}>
                  <span style={{ fontSize: "11px", color: "var(--ink-faint)", fontWeight: 800, textTransform: "uppercase" }}>DYNAMIC EXPERIENCE TIER</span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--primary)", marginTop: "4px" }}>
                    {resumeProfile.experience_level || "Mid"}
                  </div>
                </div>

                <div style={{ background: "var(--bg-subtle)", padding: "16px", borderRadius: "12px" }}>
                  <span style={{ fontSize: "11px", color: "var(--ink-faint)", fontWeight: 800, textTransform: "uppercase" }}>BACKGROUND & DEGREES</span>
                  <div style={{ fontSize: "14px", color: "#0F172A", marginTop: "4px", lineHeight: 1.4 }}>
                    {resumeProfile.education || "Extracted Computer Science / Software Engineering Background"}
                  </div>
                </div>

                <div style={{ background: "var(--bg-subtle)", padding: "16px", borderRadius: "12px" }}>
                  <span style={{ fontSize: "11px", color: "var(--ink-faint)", fontWeight: 800, textTransform: "uppercase" }}>DYNAMICALLY EXTRACTED SKILLS ({resumeProfile.skills?.length || 0})</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                    {(resumeProfile.skills || []).map((sk, idx) => (
                      <span key={idx} className="pill xp" style={{ background: "#EDE9FE", color: "#7C3AED", fontWeight: 700 }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--ink-faint)" }}>
                <FileText size={48} style={{ margin: "0 auto 16px", opacity: 0.4 }} />
                <h4 style={{ color: "#0F172A", margin: "0 0 6px 0" }}>No Dynamic Resume Analyzed Yet</h4>
                <p style={{ fontSize: "13px", margin: 0 }}>
                  Upload a PDF/DOCX file or paste text on the left to extract your skills dynamically.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: SKILL ANALYTICS DASHBOARD */}
      {activeTab === "analytics" && (
        <Card padding="28px">
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "20px", color: "#0F172A" }}>📊 Dynamic Skill Proficiency Metrics</h3>
            <p style={{ fontSize: "14px", color: "var(--ink-soft)", margin: 0 }}>
              Proficiency scores (0-100) extracted dynamically from your actual uploaded resume.
            </p>
          </div>

          {analytics.has_data && analytics.skills?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {analytics.skills.map((skill, idx) => {
                const score = analytics.scores[idx] || 75;
                return (
                  <div key={idx} style={{ background: "var(--bg-subtle)", padding: "16px 20px", borderRadius: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 700, fontSize: "15px", color: "#0F172A" }}>{skill}</span>
                      <span style={{ fontWeight: 800, fontSize: "14px", color: "var(--primary)" }}>{score}%</span>
                    </div>
                    <div className="progress-bar-bg" style={{ height: "10px" }}>
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${score}%`, background: "linear-gradient(90deg, #7C3AED 0%, #059669 100%)" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--ink-faint)" }}>
              <BarChart3 size={48} style={{ margin: "0 auto 16px", opacity: 0.4 }} />
              <h4 style={{ color: "#0F172A", margin: "0 0 6px 0" }}>No Dynamic Analytics Found</h4>
              <p style={{ fontSize: "13px", margin: "0 0 16px 0" }}>
                Upload your resume file in the "Resume File Upload" tab to generate your proficiency scores.
              </p>
              <Button variant="primary" onClick={() => setActiveTab("resume")}>
                Go to Resume Upload
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: PERSONALIZED CAREER ROADMAP */}
      {activeTab === "roadmap" && (
        <div>
          <Card padding="24px" style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#0F172A" }}>🗺️ 5-Step Dynamic AI Career Roadmap</h3>
                <p style={{ fontSize: "13px", color: "var(--ink-soft)", margin: 0 }}>
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
                    border: "1px solid var(--border)",
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

          {/* Steps Display */}
          {roadmap && roadmap.steps && roadmap.steps.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {roadmap.steps.map((st) => (
                <Card key={st.id} padding="20px" style={{ borderLeft: st.completed ? "4px solid #059669" : "4px solid #7C3AED" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => handleToggleStep(st.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}
                        >
                          {st.completed ? <CheckCircle2 size={22} color="#059669" /> : <Circle size={22} color="var(--ink-faint)" />}
                        </button>
                        <h4 style={{ margin: 0, fontSize: "16px", color: "#0F172A", textDecoration: st.completed ? "line-through" : "none" }}>
                          {st.step}
                        </h4>
                        {st.difficulty && <span className="pill xp" style={{ fontSize: "11px" }}>{st.difficulty}</span>}
                        {st.estimated_time && <span className="pill streak" style={{ fontSize: "11px" }}>⏱️ {st.estimated_time}</span>}
                      </div>
                      <p style={{ fontSize: "14px", color: "var(--ink-soft)", margin: "0 0 16px 32px" }}>
                        {st.description}
                      </p>

                      {/* Curated Resources */}
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
                                background: "var(--bg-subtle)",
                                borderRadius: "8px",
                                fontSize: "12px",
                                color: "var(--primary)",
                                textDecoration: "none",
                                fontWeight: 600
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
              <MapPin size={48} style={{ margin: "0 auto 16px", opacity: 0.4, color: "var(--primary)" }} />
              <h4 style={{ color: "#0F172A", margin: "0 0 6px 0" }}>No Career Roadmap Generated Yet</h4>
              <p style={{ color: "var(--ink-faint)", margin: "0 0 16px 0" }}>
                Click "Generate Dynamic Roadmap" above to build a 5-step blueprint from your resume.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
