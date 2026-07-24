import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import { CheckCircle2, XCircle, Award, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { QuizSkeleton } from "../components/ui/SkeletonLoader";
import EmptyState from "../components/ui/EmptyState";
import { soundService } from "../services/soundService";
import { fireCelebrationConfetti } from "../utils/confetti";

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
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const currentId = id || (typeof window !== "undefined" ? (window.location.pathname.split("/quiz/")[1] || "").split("/")[0] : "");
    if (!currentId || currentId === "undefined") return;

    setStatus("loading");
    api
      .getTopic(currentId)
      .then(async (topicData) => {
        let qList = topicData?.questions || [];
        if (!qList || qList.length === 0) {
          await api.generateTopic(currentId);
          localStorage.removeItem(`topic_${currentId}`);
          topicData = await api.getTopic(currentId);
          qList = topicData?.questions || [];
        }
        setQuestions(qList);
        setStatus(qList.length > 0 ? "ready" : "empty");
      })
      .catch((err) => {
        setErrorMsg(err.message || "Failed to load quiz questions");
        setStatus("error");
      });
  }, [id]);

  const current = questions[index];

  const handleSelect = (optIdx) => {
    if (selected !== null) return;
    setSelected(optIdx);

    const isCorrect = optIdx === current.correct_answer;
    if (isCorrect) {
      soundService.playCorrect();
      setScore((s) => s + 1);
      toast.push("Correct answer! +10 XP", "success");
    } else {
      soundService.playIncorrect();
      toast.push("Incorrect answer.", "error");
    }
  };

  const handleNext = async () => {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setSelected(null);
    } else {
      const submissionAnswers = questions.map((q, i) => ({
        question_id: q._id,
        selected_option: selected !== null ? selected : 0
      }));

      try {
        const data = await api.submitQuizSubmission(parseInt(id), submissionAnswers);
        setMasteryResult(data);
        setPassed(data.passed);
        setFinished(true);
        window.dispatchEvent(new Event("codempress:progress"));

        if (data.passed) {
          soundService.playLevelUp();
          fireCelebrationConfetti();
        }
      } catch (err) {
        toast.push("Failed to submit quiz results", "error");
      }
    }
  };

  if (status === "loading") {
    return (
      <div className="quiz-arena">
        <QuizSkeleton />
      </div>
    );
  }

  if (status === "empty" || status === "error") {
    return (
      <div className="quiz-arena">
        <EmptyState
          title="No Quiz Questions Available"
          description={errorMsg || "Theory and questions have not been forged for this topic yet."}
          actionLabel="Back to Lesson"
          onAction={() => navigate(`/topic/${id}`)}
        />
      </div>
    );
  }

  if (finished && masteryResult) {
    return (
      <div className="quiz-arena">
        <Card glass padding="40px" style={{ textAlign: "center" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: passed ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
              color: passed ? "#34D399" : "#EF4444",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 20px"
            }}
          >
            {passed ? <Award size={36} /> : <XCircle size={36} />}
          </div>

          <h2 style={{ fontSize: "28px", color: "#fff", marginBottom: "8px" }}>
            {passed ? "Assessment Passed! 🎉" : "Keep Practicing"}
          </h2>

          <p style={{ color: "var(--ink-soft)", fontSize: "15px", marginBottom: "24px" }}>
            You scored <strong>{masteryResult.score_percent}%</strong> and earned <strong>+{masteryResult.xp_earned} XP</strong>!
          </p>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              padding: "16px 20px",
              borderRadius: "14px",
              border: "1px solid var(--border)",
              marginBottom: "28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--ink-soft)" }}>Topic Mastery Level</span>
            <span style={{ fontWeight: 800, color: "#C084FC", fontSize: "18px" }}>
              {masteryResult.topic_mastery_percent}%
            </span>
          </div>

          <Button variant="glowing" fullWidth size="lg" onClick={() => navigate("/library")} rightIcon={<ArrowRight size={20} />}>
            Continue Learning
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="quiz-arena">
      <button
        onClick={() => navigate(`/topic/${id}`)}
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
        <ArrowLeft size={16} /> Back to Lesson
      </button>

      <div className="quiz-progress-header">
        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-soft)" }}>
          Question {index + 1} of {questions.length}
        </span>
        <span className="pill xp">{Math.round(((index + 1) / questions.length) * 100)}% Complete</span>
      </div>

      <div className="progress-bar-bg" style={{ marginBottom: "28px" }}>
        <div className="progress-bar-fill" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>

      <Card glass padding="32px">
        <h3 style={{ fontSize: "20px", color: "#fff", marginBottom: "20px", lineHeight: 1.5 }}>
          {current.question_text}
        </h3>

        {current.code_snippet && (
          <div className="code-block-container" style={{ marginBottom: "20px" }}>
            <pre><code>{current.code_snippet}</code></pre>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {current.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === current.correct_answer;
            const hasAnswered = selected !== null;

            let cardClass = "option-card";
            if (hasAnswered) {
              if (isCorrect) cardClass += " correct";
              else if (isSelected) cardClass += " incorrect";
            } else if (isSelected) {
              cardClass += " selected";
            }

            return (
              <div key={i} className={cardClass} onClick={() => handleSelect(i)}>
                <span className="option-idx">{String.fromCharCode(65 + i)}</span>
                <span style={{ flex: 1, color: "#fff", fontSize: "15px" }}>{opt}</span>
                {hasAnswered && isCorrect && <CheckCircle2 size={20} color="#34D399" />}
                {hasAnswered && isSelected && !isCorrect && <XCircle size={20} color="#EF4444" />}
              </div>
            );
          })}
        </div>

        {selected !== null && (
          <div style={{ marginTop: "28px" }}>
            <Button variant="primary" fullWidth size="lg" onClick={handleNext} rightIcon={<ArrowRight size={18} />}>
              {index + 1 >= questions.length ? "Complete Quiz Assessment" : "Next Question"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
