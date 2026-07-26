# Codempress Master Production Engine — Ultra-Detailed Specification

**Version:** 3.0 (ELI5-Compatible)  
**Target Audience:** 5-Year-Olds to 10-Year Veterans  
**Goal:** Every single piece of this document can be handed to an AI and it will build the entire system with zero ambiguity

---

## 🎯 Executive Summary (For Everyone)

**What are we building?**
An AI-native career operating system that teaches computer science and software engineering from first principles (ELI5) to Principal Staff Engineer level, using a 14-domain ontology, graph-compiled learning blueprints, a 20-section topic template engine, 4-level progressive hints, and zero-downtime offline storage.

---

## 📖 Part 1: Understanding What We're Building (ELI5)

### 1.1. The Big Picture — Like a Pizza Restaurant

| Restaurant Part | Codempress Part | What It Does |
|-----------------|-----------------|--------------|
| **The Menu** | Engineering Ontology | Lists EVERY dish we can make (14 domains, 10 levels) |
| **The Recipe Book** | Knowledge Graph | Shows how dishes connect (learn dough before sauce) |
| **The Head Chef** | Career Blueprint Engine | Plans what each chef needs to learn for their role |
| **The Kitchen** | Content Generation Engine | Actually cooks each dish (creates 20-section lessons) |
| **The Quality Inspector** | QA Framework | Tastes everything to make sure it's perfect |
| **The Waiters** | AI Mentor | Helps each customer personally with 4-level hints |
| **The Restaurant App** | LXP | The whole gamified experience customers see |

---

## 📚 Part 2: The Engineering Ontology (The Menu)

14 Core Domains covering the full spectrum of computing:
1. Computing Foundations (Hardware, OS, Networks, Terminal)
2. Programming (Logic, Python, JavaScript, Java, C++)
3. Mathematics (Algebra, Statistics, Linear Algebra, Calculus)
4. Data Structures & Algorithms (Arrays to DP & Graph Theory)
5. Software Engineering (Git, Testing, Design Patterns, Clean Code)
6. Frontend Engineering (HTML, CSS, JS, React, Vue, Web Vitals)
7. Backend Engineering (Node.js, FastAPI, Express, Auth, Microservices)
8. Databases (PostgreSQL, MySQL, SQLite, MongoDB, Redis, Vector DBs)
9. Cloud & DevOps (Docker, K8s, CI/CD, AWS, Azure, GCP, Terraform)
10. AI Fundamentals (ML, Deep Learning, NLP, Computer Vision)
11. Generative AI & Agentic Systems (Prompt Eng, RAG, Embeddings, Agents, MCP)
12. Security (Secure Coding, OWASP, OAuth2, JWT, Cryptography)
13. Product & Business (Product Thinking, UX, Agile, Technical Writing)
14. Leadership & Engineering Management (Mentoring, Architecture Reviews, Team Ops)

---

## 🕸️ Part 3: The Knowledge Graph (The Recipe Book)

7 Edge Types:
1. `prerequisite_of`
2. `related_to`
3. `required_for`
4. `used_by`
5. `practiced_in`
6. `assessed_by`
7. `leads_to`

---

## 🗺️ Part 4: Career Blueprint Engine (9 Progression Stages)

- **Stage 0**: Computer Literacy (ELI5)
- **Stage 1**: Programming Foundations (80h)
- **Stage 2**: Problem Solving & DSA (120h)
- **Stage 3**: Web Engineering (100h)
- **Stage 4**: Backend & Databases (140h)
- **Stage 5**: Production Engineering & DevOps (180h)
- **Stage 6**: Distributed Systems & System Design (120h)
- **Stage 7**: Senior Engineer Leadership
- **Stage 8**: Staff Engineer Architecture
- **Stage 9**: Principal Engineer Strategy

---

## 🏗️ Part 5: Content Generation Engine (20-Section Topic Template)

Every topic expands into 20 standardized sections:
1. Metadata Schema
2. Learning Objectives (Bloom's Taxonomy)
3. Prerequisites Graph
4. Estimated Duration Breakdown
5. ELI5 Explanation
6. Beginner Explanation
7. Intermediate Explanation
8. Advanced Explanation
9. Real-World Use Cases
10. Worked Code Examples
11. Hands-on Exercises (5 Difficulty Levels)
12. Mini-Project Specification
13. 15 Common Mistakes & Fixes
14. 20 Best Practices
15. Quick Reference Cheat Sheet
16. 15-Question MCQ Assessment
17. 10 Technical Interview Q&As
18. Curated Further Reading & RFCs
19. Socratic AI Mentor Prompt System
20. 25-Point Mastery Checklist

---

## 📖 Section 18: Further Reading & RFC References

### 📚 Official Specifications & RFCs
- **RFC 7231**: Hypertext Transfer Protocol (HTTP/1.1): Semantics and Content
- **RFC 5789**: PATCH Method for HTTP
- **RFC 7232**: HTTP/1.1 Conditional Requests (ETags, If-Match)
- **MDN Web Docs**: HTTP Request Methods & Status Codes Guide

### 📕 Essential Architecture Books
1. *RESTful Web APIs* by Leonard Richardson & Mike Amundsen
2. *Designing Data-Intensive Applications* by Martin Kleppmann
3. *API Design Patterns* by JJ Geewax

---

## 🤖 Section 19: Socratic AI Mentor System Prompt

```markdown
You are the Codempress Socratic AI Mentor. Your mission is to guide learners to discover solutions independently using the 4-Level Hint Ladder:

LEVEL 1 (Architectural Nudge): Point out the conceptual domain without code.
LEVEL 2 (Technique Guidance): Explain the specific method or pattern needed.
LEVEL 3 (Code Pattern Snippet): Provide a skeletal code template with placeholders.
LEVEL 4 (Complete Reference Solution): Provide the fully working, production-grade code.

NEVER jump straight to Level 4 unless explicitly requested. Always begin with Socratic questioning and misconception detection.
```

---

## ✅ Section 20: 25-Point Topic Mastery Checklist

### 🧠 Theory & Concepts
- [ ] I can explain GET vs POST vs PUT vs PATCH vs DELETE in plain English.
- [ ] I understand the difference between Safe and Non-Safe methods.
- [ ] I know which HTTP methods are Idempotent and why it matters for network retries.
- [ ] I understand HTTP status code ranges (2xx, 3xx, 4xx, 5xx).
- [ ] I can explain why GET requests should never modify server state.

### 💻 Implementation & Code
- [ ] I can implement a RESTful GET endpoint with query parameters and pagination.
- [ ] I can implement a POST endpoint that returns 201 Created with the new resource payload.
- [ ] I can implement a PUT endpoint for full resource replacement.
- [ ] I can implement a PATCH endpoint for partial updates.
- [ ] I can implement a DELETE endpoint returning 204 No Content.

### 🛡️ Security & Reliability
- [ ] I never pass sensitive data (passwords, secret keys) in GET URL query params.
- [ ] I validate all incoming request bodies before processing.
- [ ] I add CORS middleware to allow cross-origin requests safely.
- [ ] I use rate limiting to protect endpoints against brute force and DDoS.
- [ ] I use HTTPS to encrypt all traffic in transit.

### 🏗️ Production Readiness
- [ ] I implement proper JSON error responses with clear error codes.
- [ ] I use API versioning (e.g., `/api/v1/users`).
- [ ] I implement structured logging for all API operations.
- [ ] I handle 404 Not Found and 400 Bad Request explicitly.
- [ ] I write automated integration tests covering all HTTP methods.
