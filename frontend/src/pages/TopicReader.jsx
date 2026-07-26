import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import RewardBanner from "../RewardBanner";
import { ArrowLeft, BookOpen, CheckCircle2, Sparkles, Send, Play, Copy, Check, X, MessageSquare } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Skeleton from "../components/ui/SkeletonLoader";
import { soundService } from "../services/soundService";
import { fireCelebrationConfetti } from "../utils/confetti";

function CodeBlock({ code, language = "python" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-container">
      <div className="code-header">
        <span>{language.toUpperCase()}</span>
        <button
          onClick={handleCopy}
          style={{
            background: "none",
            border: "none",
            color: "#94A3B8",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px"
          }}
        >
          {copied ? <Check size={14} color="#34D399" /> : <Copy size={14} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
}

function renderBody(text) {
  if (!text) return null;
  const html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong style='color:#0F172A;'>$1</strong>");
  return html
    .split(/\n{2,}/)
    .map((p, i) => (
      <p key={i} style={{ marginBottom: "20px", lineHeight: "1.75" }} dangerouslySetInnerHTML={{ __html: p }} />
    ));
}

export default function TopicReader() {
  const params = useParams();
  const rawId = params.id || (typeof window !== "undefined" ? (window.location.pathname.split("/topic/")[1] || "").split("/")[0] : "");
  const id = rawId && rawId !== "undefined" ? rawId : "";
  const [topic, setTopic] = useState(null);
  const [content, setContent] = useState(null);
  const [status, setStatus] = useState("loading");
  const [genState, setGenState] = useState("idle");
  const [marked, setMarked] = useState(false);
  const [reward, setReward] = useState(null);
  
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const topicId = id || (typeof window !== "undefined" ? (window.location.pathname.split("/topic/")[1] || "").split("/")[0] : "");
    if (!topicId || topicId === "undefined") return;

    setStatus("loading");
    api
      .getTopic(topicId)
      .then((t) => {
        if (!t) {
          setStatus("error");
          return;
        }
        setTopic(t);
        setMarked(!!t.theory_read);
        setStatus("ready");
        const hasTheory = !!(t.theory_body || t.theory_intro || t.theory_json);
        if (!hasTheory) {
          runGeneration(topicId);
        }
      })
      .catch(() => setStatus("error"));
  }, [id]);

  const runGeneration = async (topicId) => {
    const targetId = topicId || id;
    setGenState("generating");
    try {
      const generated = await api.generateTopic(targetId);
      setContent(generated);
      setTopic((prev) => ({ ...prev, ...generated }));
      setGenState("idle");
    } catch (e) {
      setGenState("error");
      toast.push(e.message || "AI generation failed", "error");
    }
  };

  const finishTheory = async () => {
    try {
      soundService.playCorrect();
      const res = await api.markTheoryRead(id);
      setMarked(true);
      window.dispatchEvent(new Event("codempress:progress"));
      toast.push(`Theory complete! Mastery: ${res.mastery}%`, "success");
      if (res.new_reward) {
        soundService.playLevelUp();
        fireCelebrationConfetti();
        setReward(res.new_reward);
      }
    } catch (e) {
      toast.push(e.message || "Recorded progress locally", "success");
      setMarked(true);
    }
  };

  const handleAskAI = async (promptMsg) => {
    const msg = promptMsg || aiQuery;
    if (!msg.trim()) return;
    setAiLoading(true);
    setAiResponse("");
    try {
      const data = await api.askAIChat(parseInt(id), msg);
      setAiResponse(data.reply || "No response generated.");
    } catch (err) {
      setAiResponse("Unable to connect to AI Mentor. Try again shortly.");
    } finally {
      setAiLoading(false);
      setAiQuery("");
    }
  };

  if (status === "loading") {
    return (
      <div className="reader-container">
        <Skeleton width="180px" height="20px" style={{ marginBottom: "24px" }} />
        <Card padding="40px">
          <Skeleton width="60%" height="36px" style={{ marginBottom: "24px" }} />
          <Skeleton width="100%" height="120px" style={{ marginBottom: "24px" }} />
          <Skeleton width="100%" height="240px" />
        </Card>
      </div>
    );
  }

  if (status === "error" || !topic) {
    return (
      <div className="reader-container">
        <button
          onClick={() => navigate("/library")}
          style={{ background: "none", border: "none", color: "var(--ink-soft)", cursor: "pointer", marginBottom: "20px" }}
        >
          ← Back to Library
        </button>
        <Card padding="40px">
          <h2>Topic not found</h2>
        </Card>
      </div>
    );
  }

  const parsedTheory = topic.theory_json ? (typeof topic.theory_json === "string" ? JSON.parse(topic.theory_json) : topic.theory_json) : null;
  const view = (content && content.theory) ? content.theory : (parsedTheory || topic);

  return (
    <div className="reader-container">
      <RewardBanner reward={reward} onClose={() => setReward(null)} />

      <button
        onClick={() => navigate("/library")}
        style={{
          background: "none",
          border: "none",
          color: "var(--ink-soft)",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: "20px"
        }}
      >
        <ArrowLeft size={16} /> Back to Library
      </button>

      {/* Spacious Main Theory Reading Area */}
      <div className="reader-panel">
        <div className="hero-badge" style={{ marginBottom: "16px" }}>
          <BookOpen size={14} />
          <span>{topic.subject_name || "Theory Module"}</span>
        </div>

        <h1 style={{ fontSize: "36px", color: "#0F172A", marginBottom: "24px", lineHeight: 1.2 }}>
          {topic.title}
        </h1>

        {genState === "generating" && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div className="skeleton-shimmer" style={{ width: "48px", height: "48px", borderRadius: "50%", margin: "0 auto 16px" }} />
            <h3 style={{ color: "#0F172A" }}>Forging lesson theory with AI…</h3>
            <p style={{ color: "var(--ink-soft)", fontSize: "15px", marginTop: "6px" }}>
              Creating comprehensive explanations and code snippets.
            </p>
          </div>
        )}

        {genState === "error" && (
          <div style={{ padding: "24px", background: "#FEF2F2", borderRadius: "12px", border: "1px solid #FCA5A5", marginBottom: "24px" }}>
            <h3 style={{ color: "#DC2626" }}>⚠️ Could not generate lesson content</h3>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px", margin: "8px 0 16px" }}>
              The AI service failed to respond. Click retry below.
            </p>
            <Button variant="danger" size="sm" onClick={() => runGeneration()}>
              Retry Generation
            </Button>
          </div>
        )}

        {genState === "idle" && (
          <>
            <div className="reader-content">
              {view.markdown ? (
                renderBody(view.markdown)
              ) : (
                <>
                  {view.theory_intro && (
                    <div style={{ padding: "20px 24px", background: "var(--primary-soft)", borderRadius: "14px", borderLeft: "4px solid var(--primary)", marginBottom: "28px" }}>
                      <p style={{ margin: 0, color: "#334155", fontWeight: 500, fontSize: "16px" }}>
                        {view.theory_intro}
                      </p>
                    </div>
                  )}
                  {renderBody(view.theory_body)}
                </>
              )}

              {(view.code_example || view.theory_syntax) && (
                <div style={{ marginTop: "36px" }}>
                  <h3 style={{ fontSize: "20px", color: "#0F172A", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <Play size={20} color="var(--primary)" /> Interactive Code Snippet
                  </h3>
                  <CodeBlock code={view.code_example?.code || view.theory_syntax} />
                  {view.code_example?.explanation && (
                    <p style={{ fontSize: "14.5px", color: "var(--ink-soft)", marginTop: "12px", background: "#F1F5F9", padding: "14px 18px", borderRadius: "12px" }}>
                      <strong>Explanation:</strong> {view.code_example.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div style={{ marginTop: "48px", paddingTop: "28px", borderTop: "1px solid var(--border)", display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
              <Button
                variant={marked ? "secondary" : "primary"}
                size="lg"
                onClick={finishTheory}
                disabled={marked}
                leftIcon={marked ? <CheckCircle2 size={18} color="#059669" /> : null}
              >
                {marked ? "Theory Completed ✓" : "Mark Theory Complete"}
              </Button>
              <Button
                variant="glowing"
                size="lg"
                onClick={() => navigate(`/quiz/${topic?._id || topic?.id || id}`)}
              >
                Take Practice Quiz →
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Floating AI Mentor Expandable Dock */}
      {aiOpen ? (
        <div className="ai-mentor-dock">
          <Card padding="20px" style={{ border: "2px solid var(--primary-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary)", fontWeight: 700, fontSize: "15px" }}>
                <Sparkles size={18} />
                <span>AI Socratic Mentor</span>
              </div>
              <button
                onClick={() => setAiOpen(false)}
                style={{ background: "none", border: "none", color: "var(--ink-soft)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginBottom: "14px" }}>
              Ask a question or request a real-world analogy.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
              <button
                onClick={() => handleAskAI(`Explain ${topic.title} using a simple real-world analogy.`)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--primary)", fontSize: "12px", fontWeight: 600, textAlign: "left", cursor: "pointer" }}
              >
                💡 Real-world analogy
              </button>
              <button
                onClick={() => {
                  setAiLoading(true);
                  api.getAIProgressiveHints(topic._id, topic.title)
                    .then((res) => {
                      const hList = res.hints || [];
                      const formatted = hList.map(h => `${h.title}:\n${h.hint}${h.code_snippet ? '\n```\n' + h.code_snippet + '\n```' : ''}`).join('\n\n');
                      setAiResponse(formatted);
                    })
                    .catch(() => setAiResponse("Failed to fetch progressive hints."))
                    .finally(() => setAiLoading(false));
                }}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(168, 85, 247, 0.3)", background: "rgba(168, 85, 247, 0.1)", color: "#A855F7", fontSize: "12px", fontWeight: 700, textAlign: "left", cursor: "pointer" }}
              >
                ⚡ Get 4-Level Progressive Hints (Nudge ➔ Solution)
              </button>
            </div>

            {aiLoading && (
              <div style={{ fontSize: "13px", color: "var(--primary)", padding: "10px", background: "var(--primary-soft)", borderRadius: "8px", marginBottom: "12px" }}>
                AI Mentor is thinking…
              </div>
            )}

            {aiResponse && (
              <div style={{ fontSize: "13px", color: "var(--ink)", lineHeight: 1.5, padding: "12px", background: "var(--bg-subtle)", borderRadius: "8px", marginBottom: "14px", maxHeight: "200px", overflowY: "auto", whitespace: "pre-wrap" }}>
                {aiResponse}
              </div>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Ask a question..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAskAI()}
                className="search-input"
                style={{ fontSize: "13px", padding: "8px 12px" }}
              />
              <Button variant="primary" size="sm" onClick={() => handleAskAI()}>
                <Send size={14} />
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <button
          onClick={() => setAiOpen(true)}
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: "999px",
            padding: "12px 20px",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            zIndex: 100
          }}
        >
          <Sparkles size={16} />
          <span>Ask AI Mentor</span>
        </button>
      )}
    </div>
  );
}
