import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import { apiClient } from "../../services/apiClient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GuardianGateModalProps {
  open: boolean;
  onClose: () => void;
  topic: {
    id: number;
    name: string;
    category: "programming" | "tool" | "theory";
  };
  milestone: number; // 10 | 25 | 50
}

type ChallengeView = "code" | "mcq" | "terminal";

// ---------------------------------------------------------------------------
// Stub challenge data  (in production, fetch from /api/topics/{id}/challenge)
// ---------------------------------------------------------------------------

interface CodeChallenge {
  prompt: string;
  starterCode: string;
  language: string;
}

interface MCQ {
  question: string;
  options: string[];
  correctIndex: number;
}

interface TerminalChallenge {
  instruction: string;
  expectedCommand: string;
}

const CHALLENGE_STUBS: Record<string, CodeChallenge> = {
  python: {
    prompt:
      'Write a function `greet(name)` that returns `"Hello, {name}!"`.',
    starterCode: "def greet(name):\n    pass\n",
    language: "python",
  },
  javascript: {
    prompt:
      'Write a function `greet(name)` that returns `"Hello, {name}!"`.',
    starterCode: "function greet(name) {\n  \n}\n",
    language: "javascript",
  },
};

const MCQ_STUB: MCQ = {
  question: "Which of the following is a principle of Object-Oriented Programming?",
  options: ["Encapsulation", "Compilation", "Minification", "Transpilation"],
  correctIndex: 0,
};

const TERMINAL_STUB: TerminalChallenge = {
  instruction: "Type the git command to create and switch to a new branch called 'feature-x'.",
  expectedCommand: "git checkout -b feature-x",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GuardianGateModal({
  open,
  onClose,
  topic,
  milestone,
}: GuardianGateModalProps) {
  const [remoteChallenge, setRemoteChallenge] = useState<{
    prompt?: string;
    starterCode?: string;
    language?: string;
    question?: string;
    options?: string[];
    correctIndex?: number;
    instruction?: string;
    expectedCommand?: string;
  } | null>(null);
  const [loadedFor, setLoadedFor] = useState<number | null>(null);

  // Fetch a real challenge from the backend when the modal opens.
  useEffect(() => {
    if (!open || loadedFor === topic.id) return;
    setLoadedFor(topic.id);
    apiClient
      .get<{
        prompt?: string;
        starterCode?: string;
        language?: string;
        question?: string;
        options?: string[];
        correctIndex?: number;
        instruction?: string;
        expectedCommand?: string;
      }>(`/topics/${topic.id}/challenge`)
      .then((data) => setRemoteChallenge(data))
      .catch(() => {/* keep stub fallback */});
  }, [open, topic.id, loadedFor]);

  // Determine which challenge view to render
  let view: ChallengeView = "mcq";
  if (topic.category === "programming") view = "code";
  else if (topic.category === "tool") view = "terminal";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="guardian-gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9000,
            background: "rgba(11, 12, 16, 0.88)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 30 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            style={{
              background: "#1E1B2E",
              border: "2px solid #A78BFA",
              borderRadius: 20,
              padding: 32,
              maxWidth: 700,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              color: "#C5C6C7",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 20,
              }}
            >
              <div>
                <h2
                  style={{
                    color: "#A78BFA",
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  🛡️ Guardian Gate — {milestone}%
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
                  {topic.name}
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#888",
                  fontSize: 22,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Challenge body */}
            {view === "code" && <CodeChallengeView remote={remoteChallenge} />}
            {view === "mcq" && <MCQView remote={remoteChallenge} />}
            {view === "terminal" && <TerminalView remote={remoteChallenge} />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Code Challenge (Monaco Editor)
// ---------------------------------------------------------------------------

function CodeChallengeView({ remote }: { remote?: {
  prompt?: string; starterCode?: string; language?: string;
} | null }) {
  const challenge = remote ? {
    prompt: remote.prompt ?? CHALLENGE_STUBS.python.prompt,
    starterCode: remote.starterCode ?? CHALLENGE_STUBS.python.starterCode,
    language: remote.language ?? CHALLENGE_STUBS.python.language,
  } : CHALLENGE_STUBS.python;
  const [code, setCode] = useState(challenge.starterCode);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    try {
      const res = await apiClient.post<{ passed: boolean; feedback: string }>(
        "/challenges/verify",
        { code, language: challenge.language }
      );
      setResult(res.feedback);
    } catch {
      setResult("⚠️ Could not verify — backend not available.");
    }
  }, [code, challenge.language]);

  return (
    <div>
      <p style={{ fontSize: 14, marginBottom: 12, lineHeight: 1.5 }}>
        {challenge.prompt}
      </p>
      <div style={{ border: "1px solid #333", borderRadius: 8, overflow: "hidden" }}>
        <Editor
          height="180px"
          defaultLanguage={challenge.language}
          defaultValue={challenge.starterCode}
          theme="vs-dark"
          onChange={(val) => setCode(val ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            scrollBeyondLastLine: false,
          }}
        />
      </div>
      <button
        onClick={handleSubmit}
        style={{
          marginTop: 12,
          padding: "8px 24px",
          background: "#A78BFA",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Submit
      </button>
      {result && (
        <p
          style={{
            marginTop: 12,
            padding: 10,
            background: "#2a2740",
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {result}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MCQ View
// ---------------------------------------------------------------------------

function MCQView({ remote }: { remote?: {
  question?: string; options?: string[]; correctIndex?: number;
} | null }) {
  const mcq = remote?.options?.length
    ? {
        question: remote.question ?? MCQ_STUB.question,
        options: remote.options,
        correctIndex: remote.correctIndex ?? 0,
      }
    : MCQ_STUB;
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const isCorrect = selected === mcq.correctIndex;

  return (
    <div>
      <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
        {mcq.question}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {mcq.options.map((opt, i) => {
          const isSelected = selected === i;
          let borderColor = "#333";
          if (submitted) {
            borderColor = i === mcq.correctIndex ? "#2ecc71" : isSelected ? "#e74c3c" : "#333";
          } else if (isSelected) {
            borderColor = "#A78BFA";
          }

          return (
            <div
              key={i}
              onClick={() => !submitted && setSelected(i)}
              style={{
                padding: "10px 14px",
                border: `2px solid ${borderColor}`,
                borderRadius: 10,
                background: isSelected ? "#2a2740" : "transparent",
                cursor: submitted ? "default" : "pointer",
                transition: "border-color 0.15s, background 0.15s",
                fontSize: 14,
              }}
            >
              <strong>{String.fromCharCode(65 + i)}.</strong> {opt}
              {submitted && i === mcq.correctIndex && (
                <span style={{ color: "#2ecc71", marginLeft: 8 }}>✓</span>
              )}
              {submitted && isSelected && !isCorrect && (
                <span style={{ color: "#e74c3c", marginLeft: 8 }}>✗</span>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={handleSubmit}
        disabled={selected === null || submitted}
        style={{
          marginTop: 16,
          padding: "8px 24px",
          background: selected === null || submitted ? "#555" : "#A78BFA",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
          cursor: selected === null || submitted ? "not-allowed" : "pointer",
        }}
      >
        {submitted ? (isCorrect ? "✅ Passed!" : "❌ Try Again") : "Submit"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Terminal View
// ---------------------------------------------------------------------------

function TerminalView({ remote }: { remote?: {
  instruction?: string; expectedCommand?: string;
} | null }) {
  const { instruction, expectedCommand } = remote?.expectedCommand
    ? {
        instruction: remote.instruction ?? TERMINAL_STUB.instruction,
        expectedCommand: remote.expectedCommand,
      }
    : TERMINAL_STUB;
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string[]>([
    "$ _",
    "Welcome to the Guardian Gate terminal simulation.",
  ]);
  const [passed, setPassed] = useState(false);

  const handleCommand = () => {
    const trimmed = input.trim();
    const history = [...output, `$ ${trimmed}`];

    if (trimmed === expectedCommand) {
      history.push("✅ Correct! You may pass.");
      setPassed(true);
    } else if (trimmed === "") {
      history.push("⚠️ Type a command.");
    } else {
      history.push(`❌ '${trimmed}' is not the expected command. Try again.`);
    }

    setOutput(history);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !passed) handleCommand();
  };

  return (
    <div>
      <p style={{ fontSize: 14, marginBottom: 12, lineHeight: 1.5 }}>
        {instruction}
      </p>
      <div
        style={{
          background: "#0B0C10",
          border: "1px solid #333",
          borderRadius: 8,
          padding: 16,
          fontFamily: "monospace",
          fontSize: 13,
          maxHeight: 240,
          overflowY: "auto",
        }}
      >
        {output.map((line, i) => (
          <div key={i} style={{ whiteSpace: "pre-wrap", color: "#C5C6C7" }}>
            {line}
          </div>
        ))}
        {!passed && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: "#45A29E" }}>$</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={passed}
              autoFocus
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#fff",
                fontFamily: "monospace",
                fontSize: 13,
                flex: 1,
                caretColor: "#45A29E",
              }}
            />
          </div>
        )}
      </div>
      <button
        onClick={handleCommand}
        disabled={passed}
        style={{
          marginTop: 12,
          padding: "8px 24px",
          background: passed ? "#555" : "#45A29E",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
          cursor: passed ? "not-allowed" : "pointer",
        }}
      >
        {passed ? "✅ Gate Passed" : "Run"}
      </button>
    </div>
  );
}
