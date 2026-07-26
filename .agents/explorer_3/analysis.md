# Frontend Architecture & Integration Analysis for Code Sandbox (R1–R4)

**Agent**: `explorer_3`  
**Date**: 2026-07-26  
**Scope**: Frontend components (`TopicReader.jsx`, `Forge.jsx`, `api.js`, `styles.css`, `vite.config.js`) for Python/JS Sandbox, Assertion Engine, Socratic Hints, and Vite proxy.

---

## 1. Existing Component & Dependencies Inspection

### 1.1 `frontend/package.json`
- **Dependencies**: React 18, Vite 5, Framer Motion, Lucide React (`lucide-react`), Three.js / R3F, Canvas Confetti (`canvas-confetti`), Zustand, Immer, Tailwind Merge, Capacitor plugins.
- **Code Editor / Syntax Highlighters**:
  - **No external syntax highlighter / rich code editor package** (such as Monaco Editor, CodeMirror, PrismJS, or `react-simple-code-editor`) is installed.
  - Plain HTML `<textarea>` elements with JetBrains Mono font styling (`.editor-textarea` in `styles.css`) are currently used in `Forge.jsx`.
  - Static code blocks in `TopicReader.jsx` use a custom `<CodeBlock>` component wrapping `<pre><code>`.

### 1.2 `frontend/src/pages/TopicReader.jsx` (397 lines)
- **Current Role**: Renders curriculum theory lessons, markdown content, static `CodeBlock` snippets, finish theory progress tracking, and quiz navigation.
- **AI Integration**: Contains an expandable floating dock (`ai-mentor-dock`, lines 295-394) calling `api.askAIChat` and `api.getAIProgressiveHints`.
- **Gaps for R1–R4**:
  - Code examples in theory (`CodeBlock`) are static and read-only.
  - Lacks an inline interactive sandbox or exercise test harness allowing students to execute Python/JS code and verify test assertions while studying theory.

### 1.3 `frontend/src/pages/Forge.jsx` (324 lines)
- **Current Role**: Playground code editor with language selection (`JavaScript` vs `Python (WASM)`).
- **Execution Mechanism**:
  - **JS**: Evaluates inside a browser Web Worker (`new Worker(...)`) overriding `console.log`.
  - **Python**: Loads Pyodide WASM script asynchronously from `https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js`.
- **Gaps for R1–R4**:
  - Does NOT call backend `/api/sandbox/execute` or `/api/sandbox/evaluate`.
  - Does NOT render test assertion pass/fail badges.
  - Does NOT award XP or trigger gamified progress events when solving challenges.
  - Lacks integration with the 4-level progressive Socratic AI hint drawer.

### 1.4 `frontend/src/api.js` (313 lines)
- **Base URL**: `BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, "") : "/api";`
- **Existing Sandbox Endpoints**: None.
- **Existing AI Hint Method**: `getAIProgressiveHints(topicId, exerciseTitle, codeSnippet)` calling `POST /api/hints`.
- **Gaps for R1–R4**: Needs explicit API functions:
  - `api.executeSandbox(code, language, stdin)` -> `POST /sandbox/execute`
  - `api.evaluateSandbox(code, language, testCases, topicId)` -> `POST /sandbox/evaluate`

---

## 2. Interactive Code Editor, Output Console, Test Badges & XP Integration Plan

### 2.1 Code Editor UI & Language Selector
1. **Language Selector Toggle**:
   - Selector buttons / dropdown supporting `python` and `javascript`.
   - Auto-updates boilerplate code template and mode when switched.
2. **Editor Component Upgrade**:
   - Build a lightweight `CodeSandbox` reusable component (or enhance `textarea` with tab key handling, indentation retention, and line numbers).
   - Provide dual execution modes:
     - **Primary**: FastAPI Backend Sandbox (`/api/sandbox/execute` & `/api/sandbox/evaluate`).
     - **Fallback / Offline**: Client-side Web Worker (JS) / Pyodide WASM (Python).

### 2.2 Output Console (stdout / stderr / Traceback)
- **Console Panel Design**:
  - Monospace dark slate container (`#020617`, JetBrains Mono font).
  - Clear visual distinction between output types:
    - **stdout**: Light emerald / white text (`#34D399` or `#F8FAFC`).
    - **stderr & Tracebacks**: Soft crimson / amber text (`#F87171` or `#F59E0B`) with pre-wrap whitespace.
  - Latency / execution badge (e.g. `⚡ Executed in 140ms` or `⚡ Backend Execution`).

### 2.3 Test Assertion Engine & Pass/Fail Badges
- **Test Harness Data Model**:
  ```json
  [
    { "id": 1, "input": "5", "expected_output": "120", "description": "Factorial of 5" },
    { "id": 2, "input": "0", "expected_output": "1", "description": "Factorial of 0" }
  ]
  ```
- **Badge Rendering**:
  - Render a grid/list of test result chips:
    - **Pass**: Green badge (`#ECFDF5` background, `#10B981` border, `CheckCircle2` icon).
    - **Fail**: Red badge (`#FEF2F2` background, `#EF4444` border, `XCircle` icon).
  - On failure, show expected vs actual output diff in expandable details.

### 2.4 XP Rewards & Gamification
- When `evaluateSandbox` returns `passed: true` for all test cases:
  - Fire celebration confetti (`fireCelebrationConfetti()`).
  - Play level up audio (`soundService.playLevelUp()`).
  - Dispatch progress event (`window.dispatchEvent(new Event("codempress:progress"))`) to update TopBar XP pill.
  - Render a celebratory XP badge (`+50 XP Earned!`).

---

## 3. 4-Level Progressive AI Socratic Hint Drawer Integration

### 3.1 Hint Level Architecture
The Socratic Hint Engine provides 4 progressive disclosure levels:
- **Level 1 (Nudge)**: High-level conceptual clue.
- **Level 2 (Guidance)**: Algorithmic strategy & edge case hints.
- **Level 3 (Syntax Structure)**: Code skeleton / pseudo-code template.
- **Level 4 (Full Solution)**: Complete working code solution.

### 3.2 Error-Triggered Automation
1. **Automatic Error Detection**:
   - When code execution returns stderr/traceback or test assertions fail, display an inline alert:
     `"⚠️ Execution Error detected. Need guidance?"` with a button `"⚡ Unlock Socratic Hint"`.
2. **Drawer UI Component (`SocraticHintDrawer`)**:
   - Render a sliding bottom/side drawer or tabbed card stack.
   - Reveal levels 1 to 4 sequentially (Level 1 unlocked by default; Level 2-4 unlocked via explicit click to encourage critical thinking).
3. **Context Passing**:
   - Call `api.getAIProgressiveHints(topicId, exerciseTitle, codeSnippet, errorMessage)` passing the exact runtime error and user code so hints directly diagnose the student's specific mistake.

---

## 4. Vite Proxy & Backend Connectivity Verification

- **Vite Configuration** (`frontend/vite.config.js`):
  ```javascript
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8008",
        changeOrigin: true,
      },
    },
  }
  ```
- **Backend Port**: `backend/main.py` specifies `port=8008` (`uvicorn.run("backend.main:app", host="0.0.0.0", port=8008, ...)`).
- **Verification**: Vite dev server proxies all `/api/*` fetch calls to `http://127.0.0.1:8008/api/*` seamlessly, eliminating CORS issues during development.
