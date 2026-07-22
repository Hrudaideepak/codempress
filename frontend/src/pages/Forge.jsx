import { useState } from "react";
import { Link } from "react-router-dom";

const JS_TEMPLATES = [
  {
    name: "Hello World",
    code: `// Welcome to the Code Forge!
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
        window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/"
        }).then((py) => {
          window.pyodideInstance = py;
          setPyodideInstance(py);
          setLoadingPyodide(false);
          resolve(py);
        }).catch((err) => {
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
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));

        worker.onmessage = (e) => {
          if (e.data.status === 'success') {
            setOutput(e.data.output);
          } else {
            setOutput(`⚠️ JS Evaluation Error: ${e.data.error}`);
          }
          worker.terminate();
        };

        worker.onerror = (err) => {
          setOutput(`⚠️ JS Execution Error: ${err.message}`);
          worker.terminate();
        };

        worker.postMessage(code);
      } catch (err) {
        const logs = [];
        const oldLog = console.log;
        console.log = (...args) => {
          logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        };
        try {
          const result = new Function(code)();
          if (result !== undefined) {
            logs.push(`→ Return: ${typeof result === 'object' ? JSON.stringify(result) : String(result)}`);
          }
          setOutput(logs.join("\n") || "Script ran successfully with no log outputs.");
        } catch (e) {
          setOutput(`⚠️ JS Evaluation Error: ${e.message}`);
        } finally {
          console.log = oldLog;
        }
      }
    } else {
      // Python (Pyodide WebAssembly)
      try {
        let py = pyodideInstance || window.pyodideInstance;
        if (!py) {
          setOutput("Loading Python WebAssembly runtime (approx. 5-10MB)...");
          py = await loadPyodideRuntime();
        }
        const logs = [];
        py.setStdout({
          batched: (str) => { logs.push(str); }
        });
        const result = await py.runPythonAsync(code);
        let outText = logs.join("\n");
        if (result !== undefined) {
          outText += `\n→ Return: ${result}`;
        }
        setOutput(outText.trim() || "Python script completed with no prints.");
      } catch (err) {
        setOutput(`⚠️ Python Error: ${err.message}`);
      }
    }
  };

  const currentTemplates = lang === "javascript" ? JS_TEMPLATES : PY_TEMPLATES;

  return (
    <div className="container">
      <Link to="/library" className="back-link">
        ← Back to Library
      </Link>

      <div className="section-head">
        <h2>Code Forge 🛠️</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className={`btn ${lang === "javascript" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => changeLanguage("javascript")}
            style={{ padding: "6px 16px", fontSize: "13px" }}
          >
            JavaScript
          </button>
          <button
            className={`btn ${lang === "python" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => changeLanguage("python")}
            style={{ padding: "6px 16px", fontSize: "13px" }}
          >
            Python (WASM)
          </button>
        </div>
      </div>

      {loadingPyodide && (
        <div style={{ padding: "10px 15px", marginBottom: "15px", borderRadius: "6px", backgroundColor: "rgba(124, 58, 237, 0.15)", border: "1px solid var(--primary)", fontSize: "14px", color: "var(--primary)" }}>
          ⏳ Fetching Pyodide Python runtime over WebAssembly from CDN...
        </div>
      )}

      <div className="forge-grid">
        {/* Editor column */}
        <div className="forge-editor-panel" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {currentTemplates.map((t, idx) => (
              <button
                key={idx}
                className="btn btn-ghost"
                onClick={() => setCode(t.code)}
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                {t.name}
              </button>
            ))}
          </div>

          <textarea
            id="code-editor-textarea"
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            style={{
              width: "100%",
              height: "400px",
              backgroundColor: "rgba(25, 25, 30, 0.95)",
              color: lang === "javascript" ? "#A7F3D0" : "#FBBF24",
              fontFamily: "Space Mono, monospace",
              fontSize: "14px",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              resize: "vertical",
              outline: "none",
              lineHeight: "1.5"
            }}
          />

          <button className="btn btn-primary" onClick={runCode} disabled={loadingPyodide} style={{ alignSelf: "flex-start" }}>
            {loadingPyodide ? "Loading Engine..." : "Run Script ⚡"}
          </button>
        </div>

        {/* Output column */}
        <div className="forge-output-panel" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ padding: "4px 8px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px", fontSize: "12px", color: "var(--muted)" }}>
            Console & Output Logs
          </div>
          <pre
            style={{
              backgroundColor: "rgba(10, 10, 15, 0.95)",
              color: "#E2E8F0",
              fontFamily: "Space Mono, monospace",
              fontSize: "14px",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              height: "435px",
              overflow: "auto",
              whiteSpace: "pre-wrap",
              margin: 0
            }}
          >
            {output}
          </pre>
        </div>
      </div>
    </div>
  );
}
