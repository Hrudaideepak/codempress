import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import RewardBanner from "../RewardBanner";

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
  const [genState, setGenState] = useState("idle"); // idle | generating | error
  const [marked, setMarked] = useState(false);
  const [reward, setReward] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    api
      .getTopic(id)
      .then((t) => {
        setTopic(t);
        setMarked(!!t.theory_read);
        setStatus("ready");
        const hasTheory = !!(t.theory_body || t.theory_intro);
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

  if (status === "loading")
    return (
      <div className="container">
        <div className="state">
          <h2>Opening the tome…</h2>
        </div>
      </div>
    );

  if (status === "error" || !topic)
    return (
      <div className="container">
        <div className="state">
          <h2>Topic not found</h2>
          <Link className="back-link" to="/">
            ← Back to Library
          </Link>
        </div>
      </div>
    );

  const view = content || topic;

  return (
    <div className="container">
      <RewardBanner reward={reward} onClose={() => setReward(null)} />
      <div className="reader">
        <Link className="back-link" to="/">
          ← Back to Library
        </Link>
        <h1>{topic.title}</h1>

        {genState === "generating" && (
          <div className="ai-gen-state">
            <div className="ai-spinner" />
            <h2>Generating lesson with AI…</h2>
            <p>Our AI is forging a complete beginner-friendly lesson for this topic. Hang tight.</p>
          </div>
        )}

        {genState === "error" && (
          <div className="ai-gen-error">
            <h2>⚠️ Couldn't generate the lesson</h2>
            <p>The AI service failed to respond. Please try again.</p>
            <button className="btn btn-primary" onClick={() => runGeneration()}>
              Retry
            </button>
          </div>
        )}

        {genState === "idle" && (
          <>
            {view.theory_intro && <div className="intro">{view.theory_intro}</div>}

            <div className="body">{renderBody(view.theory_body)}</div>

            {view.theory_syntax && (
              <>
                <h3 className="block-title">Syntax</h3>
                <div className="code-block">{view.theory_syntax}</div>
              </>
            )}

            {view.theory_examples?.length > 0 && (
              <>
                <h3 className="block-title">Examples</h3>
                {view.theory_examples.map((ex, i) => (
                  <div className="example" key={i}>
                    <h4>{ex.title}</h4>
                    <div className="code-block">{ex.code}</div>
                    {ex.explanation && <div className="exp">{ex.explanation}</div>}
                    {ex.output && <div className="out">→ {ex.output}</div>}
                  </div>
                ))}
              </>
            )}

            {view.theory_best_practices?.length > 0 && (
              <>
                <h3 className="block-title">Best Practices</h3>
                <ul className="list-card">
                  {view.theory_best_practices.map((bp, i) => (
                    <li key={i}>{bp}</li>
                  ))}
                </ul>
              </>
            )}

            {view.theory_key_takeaways?.length > 0 && (
              <>
                <h3 className="block-title">Key Takeaways</h3>
                <ul className="list-card">
                  {view.theory_key_takeaways.map((kt, i) => (
                    <li key={i}>{kt}</li>
                  ))}
                </ul>
              </>
            )}

            <div className="cta-row">
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
    </div>
  );
}
