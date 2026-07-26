import React, { useState, useEffect } from "react";
import { useIsMobile } from "../utils/useIsMobile";
import { useParams, useNavigate } from "react-router-dom";
import { STATIC_ROADMAPS } from "../data/staticRoadmaps";
import { soundService } from "../services/soundService";
import { fireCelebrationConfetti } from "../utils/confetti";
import { api } from "../api";
import {
  ArrowLeft,
  BookOpen,
  Code2,
  Brain,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  Award,
  HelpCircle,
  RotateCcw
} from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import InteractiveCodeSandbox from "../components/InteractiveCodeSandbox";

export default function RoadmapStageReader() {
  const { slug, stageId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [roadmap, setRoadmap] = useState(null);
  const [stage, setStage] = useState(null);
  const [selectedTopicIdx, setSelectedTopicIdx] = useState(0);
  const [activeTab, setActiveTab] = useState("theory"); // 'theory' | 'code' | 'quiz'

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);

  useEffect(() => {
    const foundRoadmap = STATIC_ROADMAPS.find((r) => r.slug === slug);
    if (foundRoadmap) {
      setRoadmap(foundRoadmap);
      const foundStage = (foundRoadmap.milestones || []).find(
        (m) => (m.stage_id || m.id) === stageId
      );
      if (foundStage) {
        setStage(foundStage);
        generateQuizQuestions(foundStage, foundRoadmap);
      }
    }
  }, [slug, stageId]);

  const generateQuizQuestions = (foundStage, foundRoadmap) => {
    const title = foundStage.title || "Subject Stage";
    const role = foundRoadmap.title || "Software Engineering";

    const defaultQuestions = [
      {
        id: 1,
        question: `In production ${role} systems, what is the primary purpose of ${title}?`,
        options: [
          "To optimize application memory layout and reduce latency overhead",
          "To enforce architectural separation of concerns and deterministic execution",
          "To replace traditional database indexes with temporary global variables",
          "To bypass authorization checks on external third-party API routes"
        ],
        correct_answer: 1,
        explanation: `${title} establishes standard boundaries and deterministic execution loops essential for scalable software architecture.`
      },
      {
        id: 2,
        question: `Which implementation strategy best prevents failure cascading when executing ${title}?`,
        options: [
          "Ignoring exceptions and silently returning default fallback objects",
          "Hardcoding execution timeouts directly inside main thread event loops",
          "Implementing exponential backoff retry loops with fallback circuit breakers",
          "Executing recursive sub-routines without explicit base termination conditions"
        ],
        correct_answer: 2,
        explanation: "Circuit breakers and exponential backoff prevent downstream system failure and race conditions during high load."
      },
      {
        id: 3,
        question: `How should state and side-effects be managed within ${title} architecture?`,
        options: [
          "Keep state strictly localized and isolate asynchronous side-effects behind interface abstractions",
          "Mutate shared global variables directly from nested asynchronous functions",
          "Store sensitive credentials in plain text state files for fast memory lookup",
          "Disable state validation routines during production user request handling"
        ],
        correct_answer: 0,
        explanation: "Clean architecture principles dictate keeping state localized and isolating asynchronous side-effects behind strict interfaces."
      },
      {
        id: 4,
        question: `What performance metric is critical when evaluating ${title} under heavy user traffic?`,
        options: [
          "Total lines of code written in the repository",
          "P99 latency overhead and throughput efficiency",
          "Number of CSS classes declared in stylesheet files",
          "Raw frequency of full database table scans"
        ],
        correct_answer: 1,
        explanation: "P99 response latency and throughput efficiency accurately capture user experience under real production traffic loads."
      },
      {
        id: 5,
        question: `What is the recommended verification pattern before declaring ${title} ready for deployment?`,
        options: [
          "Manual visual inspection of code snippets without running automated tests",
          "Automated end-to-end integration tests verifying core contracts and edge cases",
          "Deleting failing assertions to ensure all test suites output green status",
          "Deploying directly to production environments without staging verification"
        ],
        correct_answer: 1,
        explanation: "Production quality code requires comprehensive automated unit and integration tests asserting expected state transitions."
      }
    ];

    setQuizQuestions(defaultQuestions);
  };

  if (!roadmap || !stage) {
    return (
      <div style={{ maxWidth: "900px", margin: "40px auto", textAlign: "center" }}>
        <h2>Stage Not Found</h2>
        <p>The requested role stage does not exist.</p>
        <Button variant="primary" onClick={() => navigate(`/roadmaps/${slug || ""}`)}>
          Back to Roadmap
        </Button>
      </div>
    );
  }

  const topics = stage.scoped_topics || [];
  const rawTopic = topics[selectedTopicIdx] || topics[0] || {};

  // Build lengthy, highly-detailed theory content
  const lengthyTheoryMarkdown = `
# 📖 Detailed Technical Blueprint: ${stage.title}
*Role Specialization: ${roadmap.title} | Depth Scope: ${stage.role_scope || "Enterprise Standard"}*

---

## 1. Executive Summary & Core Objectives
${stage.description}

In high-throughput, enterprise-grade **${roadmap.title}** applications, mastering **${stage.title}** is non-negotiable. This module establishes standard architectural boundaries, deterministic logic flow, and resilient error recovery patterns required to engineer fault-tolerant systems.

Key Learning Outcomes:
- Understanding the theoretical underpinnings of ${stage.title}.
- Structuring decoupled module boundaries with dependency inversion (DIP).
- Eliminating performance bottlenecks, race conditions, and memory leaks.
- Implementing robust error handling and failure recovery mechanisms.

---

## 2. Deep Dive Architecture & Principles

### 🧠 Core Architectural Mechanics
When building for scalability, ${stage.title} relies on three core tenets:
1. **Determinism & Idempotency**: Ensuring operations produce identical outputs given identical input parameters without unexpected state mutations.
2. **Separation of Concerns**: Dividing logic into discrete layers (Data Access, Domain Business Logic, and Presentation/API Delivery).
3. **Observability & Health Checks**: Exposing real-time telemetry metrics, failure logs, and latency traces.

### 📐 System Flow Diagram
\`\`\`text
[ Client Request ] ──► [ Middleware Validation ] ──► [ Core Engine: ${stage.title} ]
                                                              │
                                            ┌─────────────────┴─────────────────┐
                                            ▼                                   ▼
                                  [ Idempotent Cache ]                [ Database / Service ]
\`\`\`

---

## 3. Production Code Patterns & Implementation

Below is a production-grade pattern demonstrating the implementation of ${stage.title} with full error boundary handling:

\`\`\`javascript
/**
 * Production Implementation Pattern for ${stage.title}
 */
class ${stage.title.replace(/[^a-zA-Z0-9]/g, "") || "StageEngine"} {
  constructor(config = {}) {
    this.config = config;
    this.state = "INITIALIZED";
  }

  async executeTask(payload) {
    try {
      console.log(\`Executing ${stage.title} task with payload:\`, payload);
      
      // Step 1: Input Validation
      if (!payload || typeof payload !== "object") {
        throw new Error("Invalid payload: payload must be an object");
      }

      // Step 2: Execute Core Logic
      const result = await this._processPayload(payload);
      
      // Step 3: Return Standardized Response
      return {
        status: "SUCCESS",
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(\`[${stage.title} Error]:\`, error.message);
      return {
        status: "FAILURE",
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async _processPayload(data) {
    // Simulated async execution loop
    return { processed: true, items: Object.keys(data).length };
  }
}
\`\`\`

---

## 4. Operational Best Practices & Anti-Patterns

### ✅ Best Practices
- **Strict Validation**: Always validate data contracts at the edge before passing arguments to internal handlers.
- **Graceful Degradation**: Fall back to cached data or secondary channels when upstream services experience downtime.
- **Comprehensive Testing**: Write unit and integration tests covering positive flows and edge-case exceptions.

### ❌ Anti-Patterns to Avoid
- **Swallowing Exceptions**: Never catch errors silently without logging or rethrowing.
- **Tight Coupling**: Avoid importing presentation components directly inside domain models.
- **Blocking the Thread**: Avoid synchronous blocking loops on main event loops.

---

## 5. Subject Mastery Summary
Mastering **${stage.title}** equips you with the foundational skills needed for **${roadmap.title}**. Make sure to complete the practical code sandbox exercise and take the **Subject Certification Quiz** below to pass this subject!
  `;

  const currentTopic = {
    title: rawTopic.title || stage.title,
    role_depth_focus: rawTopic.role_depth_focus || `${roadmap.title} Role Focus`,
    overview: rawTopic.overview || stage.description,
    theory_markdown: lengthyTheoryMarkdown,
    code_example: rawTopic.code_example || {
      title: `${stage.title} Practical Implementation Sandbox`,
      code: `// Practical Exercise for ${stage.title}\nfunction runSubjectExercise() {\n  const payload = { role: "${roadmap.title}", stage: "${stage.title}" };\n  console.log("Processing subject exercise:", payload);\n  return "Passed";\n}\n\nrunSubjectExercise();`,
      explanation: `Run and test the implementation of ${stage.title}.`
    }
  };

  const handleSelectQuizOption = (optIdx) => {
    if (selectedOption !== null) return;
    soundService.play("click");
    setSelectedOption(optIdx);

    const currentQ = quizQuestions[quizIndex];
    if (optIdx === currentQ.correct_answer) {
      setQuizScore((prev) => prev + 1);
      soundService.play("success");
    } else {
      soundService.play("error");
    }
  };

  const handleNextQuizQuestion = () => {
    soundService.play("click");
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      // Quiz completed!
      setQuizSubmitted(true);
      const isPass = (quizScore / quizQuestions.length) >= 0.8;
      setQuizPassed(isPass);
      if (isPass) {
        soundService.play("levelup");
        fireCelebrationConfetti();
        // Record progress API call
        api.saveProgress({ total_xp: 100 }).catch(() => {});
      }
    }
  };

  const resetQuiz = () => {
    soundService.play("click");
    setQuizIndex(0);
    setSelectedOption(null);
    setQuizScore(0);
    setQuizSubmitted(false);
    setQuizPassed(false);
  };

  return (
    <div style={{ maxWidth: "1140px", margin: "0 auto", paddingBottom: "80px" }}>
      {/* Back Navigation */}
      <button
        onClick={() => {
          soundService.play("click");
          navigate(`/roadmaps/${slug}`);
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "none",
          border: "none",
          color: "#7C3AED",
          fontWeight: 700,
          fontSize: "14px",
          cursor: "pointer",
          marginBottom: "20px"
        }}
      >
        <ArrowLeft size={18} /> Back to {roadmap.title} Overview
      </button>

      {/* Stage Scope Banner */}
      <div
        className="glass-panel"
        style={{
          marginBottom: "28px",
          padding: "28px 24px",
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)",
          border: "1.5px solid rgba(192, 132, 252, 0.3)",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#C084FC", fontWeight: 700, fontSize: "12px", marginBottom: "4px" }}>
              <Layers size={16} />
              <span>ROLE-SCOPED COURSE • {roadmap.title?.toUpperCase()}</span>
            </div>
            <h1 style={{ fontSize: "26px", margin: "0 0 6px 0", color: "#F8FAFC", fontWeight: 900 }}>
              {stage.title}
            </h1>
            <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0, maxWidth: "700px" }}>
              {stage.description}
            </p>
          </div>

          <span className="pill xp" style={{ background: "rgba(124, 58, 237, 0.2)", color: "#C084FC", border: "1px solid rgba(192, 132, 252, 0.3)", fontWeight: 800, fontSize: "13px" }}>
            🎯 {stage.role_scope || `${roadmap.title} Depth`}
          </span>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          background: "rgba(15, 23, 42, 0.6)",
          padding: "6px",
          borderRadius: "14px",
          border: "1px solid rgba(255, 255, 255, 0.1)"
        }}
      >
        <button
          onClick={() => {
            soundService.play("click");
            setActiveTab("theory");
          }}
          style={{
            flex: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "12px 16px",
            borderRadius: "10px",
            border: activeTab === "theory" ? "1.5px solid #7C3AED" : "none",
            background: activeTab === "theory" ? "linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(192, 132, 252, 0.1))" : "transparent",
            color: activeTab === "theory" ? "#F8FAFC" : "#94A3B8",
            fontWeight: activeTab === "theory" ? 800 : 600,
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          <BookOpen size={18} color={activeTab === "theory" ? "#C084FC" : "#94A3B8"} />
          <span>📚 Detailed Theory</span>
        </button>

        <button
          onClick={() => {
            soundService.play("click");
            setActiveTab("code");
          }}
          style={{
            flex: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "12px 16px",
            borderRadius: "10px",
            border: activeTab === "code" ? "1.5px solid #7C3AED" : "none",
            background: activeTab === "code" ? "linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(192, 132, 252, 0.1))" : "transparent",
            color: activeTab === "code" ? "#F8FAFC" : "#94A3B8",
            fontWeight: activeTab === "code" ? 800 : 600,
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          <Code2 size={18} color={activeTab === "code" ? "#38BDF8" : "#94A3B8"} />
          <span>💻 Code Exercise</span>
        </button>

        <button
          onClick={() => {
            soundService.play("click");
            setActiveTab("quiz");
          }}
          style={{
            flex: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "12px 16px",
            borderRadius: "10px",
            border: activeTab === "quiz" ? "1.5px solid #7C3AED" : "none",
            background: activeTab === "quiz" ? "linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(192, 132, 252, 0.1))" : "transparent",
            color: activeTab === "quiz" ? "#F8FAFC" : "#94A3B8",
            fontWeight: activeTab === "quiz" ? 800 : 600,
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          <Brain size={18} color={activeTab === "quiz" ? "#F43F5E" : "#94A3B8"} />
          <span>🧪 Subject Quiz</span>
        </button>
      </div>

      {/* Main Content Area based on Active Tab */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile || topics.length <= 1 ? "1fr" : "280px 1fr", gap: "24px" }}>
        {/* Sidebar module selector */}
        {topics.length > 1 && (
          <Card padding="16px" style={{ height: "fit-content", background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "12px", color: "#94A3B8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>
              Stage Modules ({topics.length})
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {topics.map((top, idx) => (
                <button
                  key={top.topic_id || idx}
                  onClick={() => {
                    soundService.play("click");
                    setSelectedTopicIdx(idx);
                  }}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: selectedTopicIdx === idx ? "1.5px solid #7C3AED" : "1px solid rgba(255, 255, 255, 0.1)",
                    background: selectedTopicIdx === idx ? "rgba(124, 58, 237, 0.2)" : "transparent",
                    color: selectedTopicIdx === idx ? "#C084FC" : "#F8FAFC",
                    fontWeight: selectedTopicIdx === idx ? 800 : 500,
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  {idx + 1}. {top.title}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Tab 1: Detailed Theory */}
        {activeTab === "theory" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <Card padding="20px" style={{ background: "rgba(124, 58, 237, 0.1)", border: "1px solid rgba(192, 132, 252, 0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <Sparkles size={18} color="#C084FC" />
                <h4 style={{ margin: 0, fontSize: "15px", color: "#C084FC", fontWeight: 800 }}>
                  {currentTopic.role_depth_focus}
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: "14px", color: "#E2E8F0", lineHeight: 1.5 }}>
                {currentTopic.overview}
              </p>
            </Card>

            <Card padding="32px" style={{ background: "rgba(15, 23, 42, 0.75)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                <BookOpen size={24} color="#C084FC" />
                <h2 style={{ margin: 0, fontSize: "22px", color: "#F8FAFC", fontWeight: 900 }}>
                  {currentTopic.title} Theory Documentation
                </h2>
              </div>

              <div style={{ fontSize: "15px", lineHeight: 1.8, color: "#CBD5E1", whiteSpace: "pre-line" }}>
                {currentTopic.theory_markdown}
              </div>
            </Card>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="glowing"
                onClick={() => {
                  soundService.play("click");
                  setActiveTab("code");
                }}
                rightIcon={<ArrowRight size={16} />}
              >
                Proceed to Code Exercise
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: Practical Code Challenge */}
        {activeTab === "code" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <Card padding="28px" style={{ background: "rgba(15, 23, 42, 0.75)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <Code2 size={22} color="#38BDF8" />
                <h3 style={{ margin: 0, fontSize: "18px", color: "#F8FAFC", fontWeight: 800 }}>
                  {currentTopic.code_example.title}
                </h3>
              </div>

              <p style={{ color: "#94A3B8", fontSize: "14px", marginBottom: "20px" }}>
                Execute and test the implementation of this subject in the live code sandbox below:
              </p>

              <InteractiveCodeSandbox
                initialCode={currentTopic.code_example.code}
                initialLanguage="javascript"
                topicId={1}
              />

              <div style={{ background: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: "12px", padding: "16px", marginTop: "20px" }}>
                <p style={{ fontSize: "14px", color: "#E0F2FE", margin: 0, lineHeight: 1.6 }}>
                  💡 <strong>Implementation Note:</strong> {currentTopic.code_example.explanation}
                </p>
              </div>
            </Card>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button variant="ghost" onClick={() => setActiveTab("theory")}>
                Back to Theory
              </Button>

              <Button
                variant="glowing"
                onClick={() => {
                  soundService.play("click");
                  setActiveTab("quiz");
                }}
                rightIcon={<Brain size={16} />}
              >
                Take Subject Quiz
              </Button>
            </div>
          </div>
        )}

        {/* Tab 3: Separate Subject Quiz */}
        {activeTab === "quiz" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <Card padding="32px" style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(192, 132, 252, 0.3)" }}>
              {!quizSubmitted ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Brain size={24} color="#F43F5E" />
                      <h3 style={{ margin: 0, fontSize: "20px", color: "#F8FAFC", fontWeight: 900 }}>
                        {stage.title} Subject Quiz
                      </h3>
                    </div>
                    <span style={{ fontSize: "14px", color: "#C084FC", fontWeight: 800 }}>
                      Question {quizIndex + 1} of {quizQuestions.length}
                    </span>
                  </div>

                  {/* Question */}
                  <h4 style={{ fontSize: "17px", color: "#F1F5F9", fontWeight: 700, marginBottom: "24px", lineHeight: 1.5 }}>
                    {quizQuestions[quizIndex]?.question}
                  </h4>

                  {/* Options */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
                    {quizQuestions[quizIndex]?.options.map((opt, optIdx) => {
                      const isSelected = selectedOption === optIdx;
                      const isCorrect = optIdx === quizQuestions[quizIndex].correct_answer;
                      let bg = "rgba(255, 255, 255, 0.05)";
                      let border = "1px solid rgba(255, 255, 255, 0.15)";
                      let color = "#F8FAFC";

                      if (selectedOption !== null) {
                        if (isCorrect) {
                          bg = "rgba(16, 185, 129, 0.25)";
                          border = "1.5px solid #10B981";
                          color = "#6EE7B7";
                        } else if (isSelected) {
                          bg = "rgba(244, 63, 94, 0.25)";
                          border = "1.5px solid #F43F5E";
                          color = "#FDA4AF";
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectQuizOption(optIdx)}
                          disabled={selectedOption !== null}
                          style={{
                            textAlign: "left",
                            padding: "16px 20px",
                            borderRadius: "14px",
                            background: bg,
                            border: border,
                            color: color,
                            fontSize: "15px",
                            fontWeight: 600,
                            lineHeight: 1.5,
                            cursor: selectedOption !== null ? "default" : "pointer",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                          }}
                        >
                          <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                          {selectedOption !== null && isCorrect && <CheckCircle2 size={20} color="#10B981" />}
                          {selectedOption !== null && isSelected && !isCorrect && <XCircle size={20} color="#F43F5E" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation after selection */}
                  {selectedOption !== null && (
                    <div
                      style={{
                        background: "rgba(124, 58, 237, 0.15)",
                        border: "1px solid rgba(192, 132, 252, 0.3)",
                        borderRadius: "14px",
                        padding: "20px",
                        marginBottom: "24px"
                      }}
                    >
                      <p style={{ margin: 0, fontSize: "14px", color: "#E2E8F0", lineHeight: 1.6 }}>
                        💡 <strong>Explanation:</strong> {quizQuestions[quizIndex]?.explanation}
                      </p>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      variant="glowing"
                      disabled={selectedOption === null}
                      onClick={handleNextQuizQuestion}
                      rightIcon={<ArrowRight size={16} />}
                    >
                      {quizIndex < quizQuestions.length - 1 ? "Next Question" : "Submit Quiz Result"}
                    </Button>
                  </div>
                </>
              ) : (
                /* Quiz Results View */
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      background: quizPassed ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)",
                      border: quizPassed ? "2px solid #10B981" : "2px solid #F43F5E",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px auto"
                    }}
                  >
                    {quizPassed ? <Award size={44} color="#10B981" /> : <XCircle size={44} color="#F43F5E" />}
                  </div>

                  <h3 style={{ fontSize: "24px", color: "#F8FAFC", fontWeight: 900, marginBottom: "8px" }}>
                    {quizPassed ? "🎉 Subject Quiz Passed!" : "Subject Quiz Not Passed Yet"}
                  </h3>

                  <p style={{ color: "#94A3B8", fontSize: "15px", marginBottom: "24px" }}>
                    You scored <strong style={{ color: quizPassed ? "#10B981" : "#F43F5E" }}>{quizScore} out of {quizQuestions.length}</strong> ({Math.round((quizScore / quizQuestions.length) * 100)}%).
                    {quizPassed ? " You earned +100 XP and officially passed this subject stage!" : " A score of 80% or higher is required to pass."}
                  </p>

                  <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
                    <Button variant="ghost" onClick={resetQuiz} leftIcon={<RotateCcw size={16} />}>
                      Retake Quiz
                    </Button>

                    {quizPassed && (
                      <Button
                        variant="glowing"
                        onClick={() => {
                          soundService.play("click");
                          navigate(`/roadmaps/${slug}`);
                        }}
                        rightIcon={<CheckCircle2 size={16} />}
                      >
                        Complete & Return to Roadmap
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
