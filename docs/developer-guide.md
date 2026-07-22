# Codempress Developer Guide

Welcome to the technical documentation for the Codempress MVP.

## Architecture Overview

Codempress operates on a decoupled client-server architecture:
- **Frontend:** React-based Single Page Application built with Vite. The mobile app leverages Capacitor.
- **Backend:** Python FastAPI backend to handle data, auth, AI model routing, and state tracking.

## 4 Core Frontend Views

The MVP provides the following core views (found in `frontend/src/pages/`):

1. **Library (`/library`):**
   The main hub where users see their enrolled courses, progress, and mastery states. It acts as the "mission control" for picking up where they left off.

2. **Subject (`/subject/:category`):**
   Displays the detailed curriculum map for a specific category (e.g., Data Structures, Algorithms). It visualizes topics as nodes, dynamically highlighting unlocked, cleared, and locked levels.

3. **TopicReader (`/topic/:id`):**
   The primary theory learning interface. Content is dynamically generated using AI or fetched from cache, presented in a clean, readable layout with integrated code blocks, syntax highlighting, and examples.

4. **Quiz (`/quiz/:id`):**
   The assessment view that tests user knowledge on a topic. It provides immediate visual feedback for correct/wrong answers and detailed explanations (powered by AI) to reinforce learning.

## SQLite Database Setup

The backend utilizes **SQLite** (`skillforge.db`) tuned specifically for concurrent web operations:

- **Performance Pragmas:** We use `WAL` (Write-Ahead Logging) mode, memory temp store, and adjusted cache sizes to drastically improve read/write concurrency.
- **Threadpool Offloading:** Database operations are managed in `backend/database.py`. Synchronous I/O operations are seamlessly offloaded to Starlette's threadpool via `run_in_threadpool`, ensuring the async event loop is never blocked.
- **Schema & Seeding:** The core curriculum schemas and metadata are automatically seeded from `backend/curriculum.py` when the server spins up.

## Light Command Center Design System

The Codempress frontend follows the **Light Command Center** design system:
- **Vibrant & Clean:** Built over a light base (`#f7f6fb`) with bright white panels (`#ffffff`).
- **Accent Colors:** Primary violet (`#7c3aed`) and lively rose (`#f43f5e`) are used to draw attention to progress, XP gains, and interactable elements.
- **Futuristic UI Elements:** The UI employs soft drop shadows, rounded pill shapes, glassmorphism in the top bar (blur), and linear gradients.
- **Typography:** Features *Poppins* for bold headings and *Nunito Sans* for highly legible content text. *Space Mono* is utilized strictly for code blocks.
- **Implementation:** The entire design system is centralized in `frontend/src/styles.css` using native CSS custom properties (`:root`), ensuring quick theming and a lightweight asset footprint.
