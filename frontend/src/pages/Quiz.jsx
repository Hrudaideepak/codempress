import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import RewardBanner from "../RewardBanner";
import { CheckCircle2, XCircle, Award, ArrowLeft, ArrowRight, HelpCircle, Sparkles } from "lucide-react";

export default function Quiz() {
  const params = useParams();
  const rawId = params.id || (typeof window !== "undefined" ? (window.location.pathname.split("/quiz/")[1] || "").split("/")[0] : "");
  const id = rawId && rawId !== "undefined" ? rawId : "";
  const [questions, setQuestions] = useState([]);
  const [status, setStatus] = useState("loading");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [passed, setPassed] = useState(false);
  const [masteryResult, setMasteryResult] = useState(null);

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    let isMounted = true;
    const loadQuiz = async () => {
      try {
        let topicData = await api.getTopic(id);
        if (!topicData.questions || topicData.questions.length === 0) {
          // Trigger on-demand AI generation if questions not yet cached
          await api.generateTopic(id);
          topicData = await api.getTopic(id);
        }
        if (isMounted) {
          setQuestions(topicData.questions || []);
          setStatus(topicData.questions?.length ? "ready" : "empty");
        }
      } catch (err) {
        if (isMounted) setStatus("error");
      }
    };
    loadQuiz();
    return () => { isMounted = false; };
  }, [id]);

  const current = questions[index];

  const handleSelect = (optIdx) => {
    if (selected !== null) return;
    setSelected(optIdx);
    
    // In our backend schema, questions carry correct_answer index
    const isCorrect = optIdx === current.correct_answer;
    if (isCorrect) {
      setScore((s) => s + 1);
      toast.push("Correct answer! +10 XP", "success");
    } else {
      toast.push("Incorrect answer.", "error");
    }
  };

  const handleNext = async () => {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setSelected(null);
    } else {
      // Quiz finished - submit to backend
      const submissionAnswers = questions.map((q, i) => ({
        question_id: q._id,
        selected_option: selected !== null ? selected : 0
      }));

      try {
        const res = await fetch("/api/quiz/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic_id: parseInt(id),
            answers: submissionAnswers
          })
        });
        const data = await res.json();
        setMasteryResult(data);
        setPassed(data.passed);
        setFinished(true);
        window.dispatchEvent(new Event("codempress:progress"));
      } catch (err) {
        toast.push("Failed to submit quiz results", "error");
      }
    }
  };

  if (status === "loading")
    return (
      <div className="container">
        <div className="state">
          <h2>Preparing quiz assessment…</h2>
        </div>
      </div>
    );

  if (status === "empty" || status === "error")
    return (
      <div className="container">
        <div className="state">
          <h2>No quiz questions found</h2>
          <p>Generate theory and questions first for this topic.</p>
          <Link className="back-link" to={`/topic/${id}`}>
            ← Back to Topic
          </Link>
        </div>
      </div>
    );

  if (finished && masteryResult)
    return (
      <div className="container">
        <div style={{
          maxWidth: "540px",
          margin: "0 auto",
          background: "#ffffff",
          border: "1.5px solid #ddd6fe",
          borderRadius: "28px",
          padding: "40px",
          textAlign: "center",
          boxShadow: "0 10px 40px rgba(124,58,237,0.08)"
        }}>
          <div style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: passed ? "#e6f6ec" : "#fde7ec",
            color: passed ? "#16a34a" : "#be123c",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 20px"
          }}>
            {passed ? <Award size={36} /> : <XCircle size={36} />}
          </div>

          <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
            {passed ? "Assessment Passed! 🎉" : "Keep Practicing"}
          </h2>

          <p style={{ color: "#6b7280", fontSize: "15px", marginBottom: "24px" }}>
            You scored <strong>{masteryResult.score_percent}%</strong> and earned <strong>+{masteryResult.xp_earned} XP</strong>!
          </p>

          <div style={{ background: "#f4f1ff", padding: "16px 20px", borderRadius: "16px", marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, color: "#1f2937" }}>Topic Mastery Score</span>
            <span style={{ fontWeight: 800, color: "#7c3aed", fontSize: "18px" }}>{masteryResult.topic_mastery_percent}%</span>
          </div>

          <button
            onClick={() => navigate("/library")}
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "18px",
              padding: "16px 32px",
              fontWeight: 800,
              fontSize: "16px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              justifyContent: "center"
            }}
          >
            <span>Continue to Command Center</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );

  return (
    <div className="container">
      <div className="quiz">
        <Link className="back-link" to={`/topic/${id}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <ArrowLeft size={16} />
          <span>Back to Lesson</span>
        </Link>

        {/* Header Progress Bar */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 700, color: "#6b7280", marginBottom: "8px" }}>
            <span>Question {index + 1} of {questions.length}</span>
            <span>{Math.round(((index + 1) / questions.length) * 100)}% Complete</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
          </div>
        </div>

        {/* Question Card */}
        <div className="question">
          <div className="q-text" style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>
            {current.question_text}
          </div>

          {current.code_snippet && (
            <div className="code-block" style={{ marginBottom: "20px" }}>
              {current.code_snippet}
            </div>
          )}

          {/* Options */}
          <div className="options">
            {current.options.map((opt, i) => (
              <button
                key={i}
                className={selected === i ? "option selected" : "option"}
                disabled={selected !== null}
                onClick={() => handleSelect(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px"
                }}
              >
                <span>{opt}</span>
                {selected === i && (
                  i === current.correct_answer ? (
                    <CheckCircle2 size={20} color="#16a34a" />
                  ) : (
                    <XCircle size={20} color="#be123c" />
                  )
                )}
              </button>
            ))}
          </div>

          {/* Bottom Action Controls */}
          {selected !== null && (
            <div className="cta-row" style={{ marginTop: "24px" }}>
              <button className="btn btn-primary" onClick={handleNext} style={{ width: "100%" }}>
                {index + 1 >= questions.length ? "Finish Assessment →" : "Next Question →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
