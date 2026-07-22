import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import RewardBanner from "../RewardBanner";
import { ArrowLeft, BookOpen, CheckCircle2, HelpCircle, Sparkles, Send, Play } from "lucide-react";

function renderBody(text) {
  if (!text) return null;
  const html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  return html
    .split(/\n{2,}/)
    .map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p }} />);
}

export default function TopicReader() {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [content, setContent] = useState(null);
  const [status, setStatus] = useState("loading");
  const [genState, setGenState] = useState("idle");
  const [marked, setMarked] = useState(false);
  const [reward, setReward] = useState(null);
  
  // AI Doubt Chat State
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    api
      .getTopic(id)
      .then((t) => {
        setTopic(t);
        setMarked(!!t.theory_read);
        setStatus("ready");
        const hasTheory = !!(t.theory_body || t.theory_intro || t.theory_json);
        if (!hasTheory) {
          runGeneration();
        }
      })
      .catch(() => setStatus("error"));
  }, [id]);

  const runGeneration = async () => {
    setGenState("generating");
    try {
      const generated = await api.generateTopic(id);
      setContent(generated);
      setTopic((prev) => ({ ...prev, ...generated }));
      setGenState("idle");
    } catch (e) {
      setGenState("error");
      toast.push(e.message, "error");
    }
  };

  const finishTheory = async () => {
    try {
      const res = await api.markTheoryRead(id);
      setMarked(true);
      window.dispatchEvent(new Event("codempress:progress"));
      toast.push(`Theory complete! Mastery: ${res.mastery}%`, "success");
      if (res.new_reward) setReward(res.new_reward);
    } catch (e) {
      toast.push(e.message, "error");
    }
  };

  const handleAskAI = async (promptMsg) => {
    const msg = promptMsg || aiQuery;
    if (!msg.trim()) return;
    setAiLoading(true);
    setAiResponse("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_id: parseInt(id), message: msg })
      });
      const data = await res.json();
      setAiResponse(data.reply || "No response generated.");
    } catch (err) {
      setAiResponse("Unable to connect to AI Mentor. Try again shortly.");
    } finally {
      setAiLoading(false);
      setAiQuery("");
    }
  };

  if (status === "loading")
    return (
      <div className="container">
        <div className="state">
          <h2>Opening the lesson…</h2>
        </div>
      </div>
    );

  if (status === "error" || !topic)
    return (
      <div className="container">
        <div className="state">
          <h2>Topic not found</h2>
          <Link className="back-link" to="/library">
            ← Back to Command Center
          </Link>
        </div>
      </div>
    );

  const parsedTheory = topic.theory_json ? (typeof topic.theory_json === "string" ? JSON.parse(topic.theory_json) : topic.theory_json) : null;
  const view = content || parsedTheory || topic;

  return (
    <div className="container">
      <RewardBanner reward={reward} onClose={() => setReward(null)} />
      
      <Link className="back-link" to="/library" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
        <ArrowLeft size={16} />
        <span>Back to Command Center</span>
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "32px", alignItems: "start" }}>
        
        {/* Left Column: Theory Prose & Code Examples */}
        <div className="reader">
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#1f2937", marginBottom: "16px" }}>{topic.title}</h1>

          {genState === "generating" && (
            <div className="ai-gen-state">
              <div className="ai-spinner" />
              <h2>Generating lesson with AI…</h2>
              <p>Our server-side AI failover engine is forging a complete lesson for this topic.</p>
            </div>
          )}

          {genState === "error" && (
            <div className="ai-gen-error">
              <h2>⚠️ Couldn't generate the lesson</h2>
              <p>The AI service failed to respond. Please try again.</p>
              <button className="btn btn-primary" onClick={() => runGeneration()}>
                Retry Generation
              </button>
            </div>
          )}

          {genState === "idle" && (
            <>
              {view.markdown ? (
                <div className="body">{renderBody(view.markdown)}</div>
              ) : (
                <>
                  {view.theory_intro && <div className="intro">{view.theory_intro}</div>}
                  <div className="body">{renderBody(view.theory_body)}</div>
                </>
              )}

              {/* Code Snippet Example */}
              {(view.code_example || view.theory_syntax) && (
                <div style={{ marginTop: "28px" }}>
                  <h3 className="block-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Play size={18} color="#7c3aed" />
                    <span>Interactive Code Snippet</span>
                  </h3>
                  <div className="code-block">
                    {view.code_example?.code || view.theory_syntax}
                  </div>
                  {view.code_example?.explanation && (
                    <div style={{ fontSize: "14px", color: "#6b7280", marginTop: "8px", background: "#f4f1ff", padding: "12px 16px", borderRadius: "12px" }}>
                      <strong>Explanation:</strong> {view.code_example.explanation}
                    </div>
                  )}
                  {view.code_example?.expected_output && (
                    <div className="out" style={{ marginTop: "8px" }}>
                      <strong>Output:</strong> {view.code_example.expected_output}
                    </div>
                  )}
                </div>
              )}

              <div className="cta-row" style={{ marginTop: "36px" }}>
                <button className="btn btn-ghost" onClick={finishTheory} disabled={marked}>
                  {marked ? "✓ Theory Read" : "Mark Theory Complete"}
                </button>
                <button className="btn btn-primary" onClick={() => navigate(`/quiz/${id}`)}>
                  Start Practice Quiz →
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Embedded Socratic AI Mentor Dock */}
        <div style={{
          background: "#ffffff",
          border: "1.5px solid #ddd6fe",
          borderRadius: "24px",
          padding: "24px",
          boxShadow: "0 10px 40px rgba(124,58,237,0.08)",
          position: "sticky",
          top: "88px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#7c3aed", fontWeight: "700", fontSize: "15px", marginBottom: "16px" }}>
            <Sparkles size={18} />
            <span>AI Socratic Mentor</span>
          </div>

          <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>
            Have a doubt about <strong>{topic.title}</strong>? Ask our AI mentor for a guided explanation.
          </p>

          {/* Quick Doubt Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            <button
              onClick={() => handleAskAI(`Explain ${topic.title} using a real-world analogy`)}
              style={{ padding: "8px 12px", borderRadius: "12px", border: "1px solid #ddd6fe", background: "#f4f1ff", color: "#7c3aed", fontSize: "12px", fontWeight: 600, textAlign: "left", cursor: "pointer" }}
            >
              💡 "Explain using a real-world analogy"
            </button>
            <button
              onClick={() => handleAskAI(`What are the common edge cases in ${topic.title}?`)}
              style={{ padding: "8px 12px", borderRadius: "12px", border: "1px solid #ddd6fe", background: "#f4f1ff", color: "#7c3aed", fontSize: "12px", fontWeight: 600, textAlign: "left", cursor: "pointer" }}
            >
              ⚠️ "What are common edge cases?"
            </button>
          </div>

          {/* Chat Response Area */}
          {aiLoading && (
            <div style={{ fontSize: "13px", color: "#7c3aed", fontWeight: 600, padding: "12px", background: "#f4f1ff", borderRadius: "12px", marginBottom: "12px" }}>
              AI Mentor is thinking…
            </div>
          )}

          {aiResponse && (
            <div style={{ fontSize: "13px", color: "#1f2937", lineHeight: 1.5, padding: "14px", background: "#f4f1ff", borderRadius: "12px", marginBottom: "16px", maxHeight: "200px", overflowY: "auto" }}>
              {aiResponse}
            </div>
          )}

          {/* Query Input */}
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder="Ask a doubt..."
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAskAI()}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "14px",
                border: "1px solid #ddd6fe",
                fontSize: "13px",
                outline: "none"
              }}
            />
            <button
              onClick={() => handleAskAI()}
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "14px",
                padding: "10px 14px",
                cursor: "pointer",
                display: "grid",
                placeItems: "center"
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
