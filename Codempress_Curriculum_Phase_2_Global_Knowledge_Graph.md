# Codempress Curriculum v1

# Phase 2 --- Global Knowledge Graph

> This document defines the shared knowledge graph used to generate
> every career roadmap. A roadmap is a filtered view of this graph.

------------------------------------------------------------------------

# Vision

Instead of maintaining 100 separate roadmaps, Codempress maintains one
master knowledge graph.

``` text
Knowledge Graph
      ↓
Career Filter
      ↓
Personalization
      ↓
Roadmap
```

------------------------------------------------------------------------

# Knowledge Domains

## 1. Computing Foundations

-   Computer Basics
-   Operating Systems
-   Linux
-   Networking
-   Internet
-   Command Line

## 2. Programming Fundamentals

-   Programming Logic
-   Variables
-   Data Types
-   Control Flow
-   Functions
-   OOP
-   Functional Programming
-   Error Handling
-   Testing

## 3. Software Engineering

-   Git
-   GitHub
-   APIs
-   REST
-   GraphQL
-   Architecture
-   Design Patterns
-   Clean Code
-   Refactoring

## 4. Web Development

-   HTML
-   CSS
-   JavaScript
-   TypeScript
-   React
-   Vue
-   Angular
-   Next.js

## 5. Backend Engineering

-   Node.js
-   Python
-   Java
-   Go
-   C#
-   FastAPI
-   Spring Boot
-   Express
-   Authentication

## 6. Databases

-   SQL
-   PostgreSQL
-   MySQL
-   SQLite
-   MongoDB
-   Redis
-   Vector Databases

## 7. Cloud & DevOps

-   Docker
-   Kubernetes
-   CI/CD
-   AWS
-   Azure
-   GCP
-   Terraform
-   Monitoring

## 8. Artificial Intelligence

-   Python for AI
-   Statistics
-   Linear Algebra
-   Machine Learning
-   Deep Learning
-   NLP
-   Computer Vision
-   Reinforcement Learning

## 9. Generative AI

-   Prompt Engineering
-   Context Engineering
-   RAG
-   Embeddings
-   Vector Search
-   Function Calling
-   Tool Calling
-   MCP
-   AI Agents
-   Multi-Agent Systems
-   LLM Evaluation
-   AI Guardrails
-   AI Safety

## 10. Product & Professional Skills

-   UX Basics
-   Product Thinking
-   Communication
-   Agile
-   Leadership
-   Documentation
-   Technical Writing

------------------------------------------------------------------------

# Universal Topic Metadata

Every topic stores:

-   Unique ID
-   Name
-   Domain
-   Difficulty
-   Estimated Hours
-   Version
-   Tags
-   Career Mapping
-   Prerequisites
-   Unlocks
-   Related Topics

------------------------------------------------------------------------

# Dependency Model

Example:

``` text
Programming Logic
        ↓
Variables
        ↓
Functions
        ↓
OOP
        ↓
APIs
        ↓
Backend
        ↓
Distributed Systems
```

AI Example:

``` text
Python
   ↓
Statistics
   ↓
Machine Learning
   ↓
Deep Learning
   ↓
Transformers
   ↓
LLMs
   ↓
RAG
   ↓
AI Agents
   ↓
Agentic Systems
```

------------------------------------------------------------------------

# Shared Foundation Modules

These are reused across almost every career:

-   Computer Basics
-   Linux
-   Git
-   GitHub
-   Programming
-   SQL
-   HTTP
-   APIs
-   Debugging
-   Testing
-   Security Basics

------------------------------------------------------------------------

# Career Mapping Examples

  Topic         Software   Backend   AI   DevOps   Cyber
  ------------ ---------- --------- ---- -------- -------
  Git              ✓          ✓      ✓      ✓        ✓
  SQL              ✓          ✓      ✓      ✓        ✓
  Docker           ○          ✓      ✓      ✓        ○
  MCP              ○          ○      ✓      ○        ○
  Kubernetes       ○          ✓      ✓      ✓        ○

✓ = Core, ○ = Optional

------------------------------------------------------------------------

# Personalization Rules

The roadmap engine may:

-   Skip mastered topics
-   Insert revision modules
-   Slow down difficult concepts
-   Recommend advanced electives
-   Reorder independent modules
-   Increase project complexity

------------------------------------------------------------------------

# Topic Completion Requirements

A topic is mastered only when:

-   Theory completed
-   Quiz passed
-   Practice finished
-   AI oral assessment passed
-   Project completed
-   Reflection submitted

------------------------------------------------------------------------

# Suggested Database Model

``` text
Domain
  └── Module
        └── Topic
              ├── Lesson
              ├── Resource
              ├── Exercise
              ├── Quiz
              ├── Project
              └── Assessment
```

------------------------------------------------------------------------

# Initial Knowledge Graph Scale

-   15 Knowledge Domains
-   100+ Modules
-   800--1,200 Topics
-   5,000+ Lessons
-   10,000+ Practice Items
-   1,000+ Projects

------------------------------------------------------------------------

# Phase 3 Preview

Phase 3 defines the **Master Skill Taxonomy**, categorizing every
language, framework, cloud platform, AI technology, database, tool,
protocol, methodology, and soft skill into a standardized taxonomy used
by the recommendation engine.
