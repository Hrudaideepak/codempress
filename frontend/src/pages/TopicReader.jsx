import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import RewardBanner from "../RewardBanner";
import { ArrowLeft, BookOpen, CheckCircle2, Sparkles, Send, Play, Copy, Check } from "lucide-react";
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
            color: "var(--ink-soft)",
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
    .replace(/\*\*(.+?)\*\*/g, "<strong style='color:#fff;'>$1</strong>");
  return html
    .split(/\n{2,}/)
    .map((p, i) => (
      <p key={i} style={{ marginBottom: "16px" }} dangerouslySetInnerHTML={{ __html: p }} />
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
      toast.push(e.message || "Failed to save theory completion", "error");
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
      <div style={{ paddingBottom: "64px" }}>
        <Skeleton width="180px" height="20px" style={{ marginBottom: "24px" }} />
        <div className="reader-layout">
          <div>
            <Skeleton width="60%" height="36px" style={{ marginBottom: "20px" }} />
            <Skeleton width="100%" height="100px" style={{ marginBottom: "24px" }} />
            <Skeleton width="100%" height="200px" />
          </div>
          <div>
            <Skeleton width="100%" height="300px" borderRadius="16px" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "error" || !topic) {
    return (
      <div style={{ paddingBottom: "64px" }}>
        <button
          onClick={() => navigate("/library")}
          style={{ background: "none", border: "none", color: "var(--ink-soft)", cursor: "pointer" }}
        >
          ← Back to Library
        </button>
        <h2 style={{ color: "#fff", marginTop: "20px" }}>Topic not found</h2>
      </div>
    );
  }

  const parsedTheory = topic.theory_json ? (typeof topic.theory_json === "string" ? JSON.parse(topic.theory_json) : topic.theory_json) : null;
  const view = (content && content.theory) ? content.theory : (parsedTheory || topic);

  return (
    <div style={{ paddingBottom: "64px" }}>
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

      <div className="reader-layout">
        {/* Main Theory Section */}
        <div className="glass-panel">
          <div className="hero-badge" style={{ marginBottom: "12px" }}>
            <BookOpen size={14} />
            <span>Theory Module</span>
          </div>

          <h1 style={{ fontSize: "32px", color: "#fff", marginBottom: "20px" }}>{topic.title}</h1>

          {genState === "generating" && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div className="skeleton-shimmer" style={{ width: "48px", height: "48px", borderRadius: "50%", margin: "0 auto 16px" }} />
              <h3 style={{ color: "#fff" }}>Generating theory with GitHub Models AI…</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: "6px" }}>
                Forging deep engineering explanations for this topic.
              </p>
            </div>
          )}

          {genState === "error" && (
            <div style={{ padding: "24px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
              <h3 style={{ color: "#EF4444" }}>⚠️ Could not generate lesson content</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: "14px", margin: "8px 0 16px" }}>
                The AI service failed to respond. Please try again.
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
                      <div style={{ padding: "16px", background: "rgba(139, 92, 246, 0.1)", borderRadius: "12px", borderLeft: "4px solid var(--primary)", marginBottom: "20px" }}>
                        <p style={{ margin: 0, color: "#E2E8F0" }}>{view.theory_intro}</p>
                      </div>
                    )}
                    {renderBody(view.theory_body)}
                  </>
                )}

                {(view.code_example || view.theory_syntax) && (
                  <div style={{ marginTop: "32px" }}>
                    <h3 style={{ fontSize: "18px", color: "#fff", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Play size={18} color="var(--primary)" /> Interactive Code Snippet
                    </h3>
                    <CodeBlock code={view.code_example?.code || view.theory_syntax} />
                    {view.code_example?.explanation && (
                      <p style={{ fontSize: "14px", color: "var(--ink-soft)", marginTop: "8px" }}>
                        <strong>Explanation:</strong> {view.code_example.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid var(--border)", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <Button
                  variant={marked ? "secondary" : "primary"}
                  onClick={finishTheory}
                  disabled={marked}
                  leftIcon={marked ? <CheckCircle2 size={16} color="#34D399" /> : null}
                >
                  {marked ? "Theory Read ✓" : "Mark Theory Complete"}
                </Button>
                <Button
                  variant="glowing"
                  onClick={() => navigate(`/quiz/${topic?._id || topic?.id || id}`)}
                >
                  Take Practice Quiz →
                </Button>
              </div>
            </>
          )}
        </div>

        {/* AI Socratic Mentor Sidebar */}
        <div>
          <Card glass padding="24px" style={{ position: "sticky", top: "100px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#C084FC", fontWeight: 700, fontSize: "15px", marginBottom: "12px" }}>
              <Sparkles size={18} />
              <span>AI Socratic Mentor</span>
            </div>

            <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginBottom: "16px" }}>
              Have a doubt about <strong>{topic.title}</strong>? Ask for a guided explanation.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              <button
                onClick={() => handleAskAI(`Explain ${topic.title} using a real-world analogy`)}
                style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: "rgba(255, 255, 255, 0.04)", color: "#C084FC", fontSize: "12px", fontWeight: 600, textAlign: "left", cursor: "pointer" }}
              >
                💡 Real-world analogy
              </button>
              <button
                onClick={() => handleAskAI(`What are common edge cases in ${topic.title}?`)}
                style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: "rgba(255, 255, 255, 0.04)", color: "#C084FC", fontSize: "12px", fontWeight: 600, textAlign: "left", cursor: "pointer" }}
              >
                ⚠️ Edge cases to watch for
              </button>
            </div>

            {aiLoading && (
              <div style={{ fontSize: "13px", color: "#C084FC", padding: "12px", background: "rgba(139, 92, 246, 0.1)", borderRadius: "10px", marginBottom: "12px" }}>
                AI Mentor is thinking…
              </div>
            )}

            {aiResponse && (
              <div style={{ fontSize: "13px", color: "#E2E8F0", lineHeight: 1.5, padding: "12px", background: "rgba(255, 255, 255, 0.04)", borderRadius: "10px", marginBottom: "16px", maxHeight: "180px", overflowY: "auto" }}>
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
                style={{ fontSize: "13px", padding: "10px 12px" }}
              />
              <Button variant="primary" size="sm" onClick={() => handleAskAI()}>
                <Send size={14} />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
