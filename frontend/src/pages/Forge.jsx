import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { soundService } from "../services/soundService";
import { fireCelebrationConfetti } from "../utils/confetti";
import { ArrowLeft, Play, Terminal, Code2, Trash2, Copy, Check } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const JS_TEMPLATES = [
  {
    name: "Hello World",
    code: `// Welcome to the Codempress Code Forge!
console.log("Hello, Codempress!");
return "Playground ready.";`
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
console.log(fibonacci(10));`
  },
  {
    name: "FizzBuzz Challenge",
    code: `// Classic interview challenge
for (let i = 1; i <= 15; i++) {
  if (i % 3 === 0 && i % 5 === 0) console.log("FizzBuzz");
  else if (i % 3 === 0) console.log("Fizz");
  else if (i % 5 === 0) console.log("Buzz");
  else console.log(i);
}`
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
  const [code, setCode] = useState(JS_TEMPLATES[0].code);
  const [output, setOutput] = useState("Run your script to inspect console outputs and return values.");
  const [pyodideInstance, setPyodideInstance] = useState(null);
  const [loadingPyodide, setLoadingPyodide] = useState(false);
  const [copied, setCopied] = useState(false);

  const navigate = useNavigate();

  const changeLanguage = (newLang) => {
    setLang(newLang);
    setCode(newLang === "javascript" ? JS_TEMPLATES[0].code : PY_TEMPLATES[0].code);
    setOutput(`Switched to ${newLang === "javascript" ? "JavaScript" : "Python"}. Ready to execute.`);
  };

  const loadPyodideRuntime = () => {
    if (window.loadPyodide) return Promise.resolve(window.pyodideInstance);
    return new Promise((resolve, reject) => {
      setLoadingPyodide(true);
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js";
      script.async = true;
      script.onload = () => {
        window
          .loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/"
          })
          .then((py) => {
            window.pyodideInstance = py;
            setPyodideInstance(py);
            setLoadingPyodide(false);
            resolve(py);
          })
          .catch((err) => {
            setLoadingPyodide(false);
            reject(err);
          });
      };
      script.onerror = () => {
        setLoadingPyodide(false);
        reject(new Error("Failed to load Pyodide WebAssembly script from CDN"));
      };
      document.head.appendChild(script);
    });
  };

  const runCode = async () => {
    setOutput("Executing script...");
    if (lang === "javascript") {
      try {
        const workerCode = `
          self.onmessage = function(e) {
            const logs = [];
            const customConsole = {
              log: function(...args) {
                logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
              }
            };
            try {
              const fn = new Function('console', e.data);
              const result = fn(customConsole);
              if (result !== undefined) {
                logs.push('→ Return: ' + (typeof result === 'object' ? JSON.stringify(result) : String(result)));
              }
              self.postMessage({ status: 'success', output: logs.join('\\n') || 'Script ran successfully with no log outputs.' });
            } catch(err) {
              self.postMessage({ status: 'error', error: err.message });
            }
          };
        `;
        const blob = new Blob([workerCode], { type: "application/javascript" });
        const worker = new Worker(URL.createObjectURL(blob));

        worker.onmessage = (e) => {
          if (e.data.status === "success") {
            setOutput(e.data.output);
            soundService.playCorrect();
            fireCelebrationConfetti();
          } else {
            soundService.playIncorrect();
            setOutput(`⚠️ JS Evaluation Error: ${e.data.error}`);
          }
          worker.terminate();
        };

        worker.onerror = (err) => {
          soundService.playIncorrect();
          setOutput(`⚠️ JS Execution Error: ${err.message}`);
          worker.terminate();
        };

        worker.postMessage(code);
      } catch (err) {
        soundService.playIncorrect();
        setOutput(`⚠️ JS Evaluation Error: ${err.message}`);
      }
    } else {
      try {
        let py = pyodideInstance || window.pyodideInstance;
        if (!py) {
          setOutput("Loading Python WebAssembly runtime (approx. 5-10MB)...");
          py = await loadPyodideRuntime();
        }
        const logs = [];
        py.setStdout({
          batched: (str) => {
            logs.push(str);
          }
        });
        const result = await py.runPythonAsync(code);
        let outText = logs.join("\n");
        if (result !== undefined) {
          outText += `\n→ Return: ${result}`;
        }
        setOutput(outText.trim() || "Python script completed with no prints.");
        soundService.playCorrect();
        fireCelebrationConfetti();
      } catch (err) {
        soundService.playIncorrect();
        setOutput(`⚠️ Python Error: ${err.message}`);
      }
    }
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
            In-browser code execution & experimentation sandbox
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            variant={lang === "javascript" ? "primary" : "secondary"}
            size="sm"
            onClick={() => changeLanguage("javascript")}
          >
            JavaScript
          </Button>
          <Button
            variant={lang === "python" ? "primary" : "secondary"}
            size="sm"
            onClick={() => changeLanguage("python")}
          >
            Python (WASM)
          </Button>
        </div>
      </div>

      <div className="forge-container">
        {/* Editor Box */}
        <div className="code-editor-box">
          <div className="code-header">
            <div style={{ display: "flex", gap: "8px" }}>
              {currentTemplates.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => setCode(t.code)}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--border)",
                    color: "#CBD5E1",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
            <Button
              variant="glowing"
              size="sm"
              onClick={runCode}
              loading={loadingPyodide}
              leftIcon={<Play size={14} />}
            >
              Run Script
            </Button>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="editor-textarea"
          />
        </div>

        {/* Output Terminal */}
        <div className="code-editor-box">
          <div className="code-header">
            <span>CONSOLE LOGS</span>
            <button
              onClick={() => setOutput("Console cleared.")}
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
              <Trash2 size={14} /> Clear
            </button>
          </div>

          <div className="console-output">
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{output}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
