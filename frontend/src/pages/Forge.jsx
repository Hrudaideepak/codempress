import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Terminal, Code2, Sparkles, BookOpen } from "lucide-react";
import Button from "../components/ui/Button";
import InteractiveCodeSandbox from "../components/InteractiveCodeSandbox";

const JS_TEMPLATES = [
  {
    name: "Hello World",
    code: `// Welcome to the Codempress Code Forge!
console.log("Hello, Codempress!");
`
  },
  {
    name: "Fibonacci Sequence",
    code: `// Generate first 10 Fibonacci numbers
function fibonacci(n) {
  const seq = [0, 1];
  for (let i = 2; i < n; i++) {
    seq.push(seq[i - 1] + seq[i - 2]);
  }
  return seq;
}

console.log("Fibonacci series of 10 terms:");
console.log(fibonacci(10));
`
  },
  {
    name: "FizzBuzz Challenge",
    code: `// Classic interview challenge
for (let i = 1; i <= 15; i++) {
  if (i % 3 === 0 && i % 5 === 0) console.log("FizzBuzz");
  else if (i % 3 === 0) console.log("Fizz");
  else if (i % 5 === 0) console.log("Buzz");
  else console.log(i);
}
`
  }
];

const PY_TEMPLATES = [
  {
    name: "Hello World",
    code: `# Welcome to the Code Forge (Python)!
print("Hello, Codempress! Python edition.")
`
  },
  {
    name: "Fibonacci Sequence",
    code: `# Generate first 10 Fibonacci numbers
def fibonacci(n):
    seq = [0, 1]
    for i in range(2, n):
        seq.append(seq[-1] + seq[-2])
    return seq

print("Fibonacci series of 10 terms:")
print(fibonacci(10))
`
  },
  {
    name: "FizzBuzz Challenge",
    code: `# Classic interview challenge
for i in range(1, 16):
    if i % 3 == 0 and i % 5 == 0:
        print("FizzBuzz")
    elif i % 3 == 0:
        print("Fizz")
    elif i % 5 == 0:
        print("Buzz")
    else:
        print(i)
`
  }
];

export default function Forge() {
  const [lang, setLang] = useState("javascript");
  const [activeTemplateIdx, setActiveTemplateIdx] = useState(0);
  const [code, setCode] = useState(JS_TEMPLATES[0].code);

  const navigate = useNavigate();

  const changeLanguage = (newLang) => {
    setLang(newLang);
    const templates = newLang === "javascript" ? JS_TEMPLATES : PY_TEMPLATES;
    setActiveTemplateIdx(0);
    setCode(templates[0].code);
  };

  const selectTemplate = (idx) => {
    const templates = lang === "javascript" ? JS_TEMPLATES : PY_TEMPLATES;
    setActiveTemplateIdx(idx);
    setCode(templates[idx].code);
  };

  const currentTemplates = lang === "javascript" ? JS_TEMPLATES : PY_TEMPLATES;

  return (
    <div style={{ paddingBottom: "64px" }}>
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "28px", color: "#0F172A", display: "flex", alignItems: "center", gap: "10px" }}>
            <Terminal color="#C084FC" /> Code Forge Playground
          </h2>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px" }}>
            Production full-stack sandbox with automated test evaluation & Socratic AI diagnostics
          </p>
        </div>

        {/* Template Selector Pills */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--ink-soft)", fontWeight: 600 }}>Templates:</span>
          {currentTemplates.map((t, idx) => (
            <button
              key={idx}
              onClick={() => selectTemplate(idx)}
              style={{
                background: activeTemplateIdx === idx ? "var(--primary-soft)" : "var(--bg-panel)",
                border: `1px solid ${activeTemplateIdx === idx ? "var(--primary)" : "var(--border)"}`,
                color: activeTemplateIdx === idx ? "var(--primary)" : "var(--ink-soft)",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Code Sandbox */}
      <InteractiveCodeSandbox
        key={`${lang}-${activeTemplateIdx}`}
        initialCode={code}
        language={lang}
        exerciseTitle={`Forge Playground (${lang.toUpperCase()})`}
        testCases={[
          { id: "tc1", input: "10", expected_output: "Fibonacci series of 10 terms:\n[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]", is_hidden: false }
        ]}
      />
    </div>
  );
}
