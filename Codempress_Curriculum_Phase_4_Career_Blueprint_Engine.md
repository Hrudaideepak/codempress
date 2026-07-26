# Codempress Curriculum v1

# Phase 4 --- Career Blueprint Engine (Graph-Based)

> This phase defines how every career roadmap is generated automatically
> from the Master Engineering Ontology instead of being written
> manually.

------------------------------------------------------------------------

# Vision

A career is **not** a static document.

A career is a **Blueprint** generated from the Engineering Knowledge
Graph.

``` text
Engineering Knowledge Graph
            │
            ▼
     Career Blueprint
            │
            ▼
  Personalization Engine
            │
            ▼
 Adaptive Learning Journey
            │
            ▼
 Projects • Assessments • Portfolio • Interview Readiness
```

------------------------------------------------------------------------

# Core Architecture

``` text
Graph Database
│
├── Skills
├── Concepts
├── Technologies
├── Frameworks
├── Projects
├── Assessments
├── Certifications
├── Careers
└── Industry Trends
```

Relationships:

``` text
Python
 ├── prerequisite_for ─────────► FastAPI
 ├── used_by ──────────────────► AI Engineer
 ├── required_for ─────────────► Backend Engineer
 ├── appears_in ───────────────► Interview
 ├── practiced_by ─────────────► Expense Tracker Project
 └── related_to ───────────────► SQL
```

------------------------------------------------------------------------

# Career Blueprint Schema

Each career contains:

## Metadata

-   Career ID
-   Name
-   Description
-   Industry
-   Demand Level
-   Difficulty
-   Estimated Duration
-   Recommended Weekly Hours

## Learning Blueprint

-   Foundation Skills
-   Core Skills
-   Advanced Skills
-   Specializations
-   Emerging Skills

## Experience Milestones

-   Beginner
-   Junior
-   Mid-Level
-   Senior
-   Staff
-   Principal

## Portfolio

-   Mini Projects
-   Intermediate Projects
-   Capstone Projects
-   Production Projects

## Assessment

-   Quizzes
-   Labs
-   Coding Challenges
-   AI Mock Interviews
-   System Design
-   Portfolio Reviews

------------------------------------------------------------------------

# Blueprint Generation Pipeline

``` text
Career
   │
   ▼
Required Skills
   │
   ▼
Resolve Prerequisites
   │
   ▼
Create Dependency Graph
   │
   ▼
Assign Mastery Levels
   │
   ▼
Attach Lessons
   │
   ▼
Attach Projects
   │
   ▼
Attach Assessments
   │
   ▼
Generate Personalized Roadmap
```

------------------------------------------------------------------------

# Mastery Targets

  Career Stage      Target Skill Level
  --------------- --------------------
  Beginner                           2
  Junior                             4
  Mid-Level                          6
  Senior                             7
  Staff                              8
  Principal                          9
  Distinguished                     10

------------------------------------------------------------------------

# Personalization Inputs

The engine adjusts the blueprint using:

-   Existing Skills
-   Assessment Scores
-   Available Weekly Time
-   Career Goal
-   Preferred Language
-   Preferred Learning Style
-   Project Interests
-   Target Job Date

Possible actions:

-   Skip mastered modules
-   Insert revision
-   Add challenge modules
-   Increase/decrease project difficulty
-   Recommend electives

------------------------------------------------------------------------

# Universal Timeline Model

Every blueprint supports:

-   30-day crash course
-   90-day intensive
-   6-month job-ready
-   12-month mastery
-   Continuous professional growth

------------------------------------------------------------------------

# Example Blueprint

``` text
AI Software Engineer

Foundation
│
├── Computer Basics
├── Linux
├── Git
├── Python
├── SQL
│
Core
├── APIs
├── FastAPI
├── Docker
├── Cloud
│
AI
├── ML Basics
├── LLMs
├── Prompt Engineering
├── Context Engineering
├── RAG
├── MCP
├── AI Agents
│
Production
├── Monitoring
├── Evaluation
├── Security
│
Portfolio
├── AI Chat App
├── RAG Assistant
├── Multi-Agent System
└── AI SaaS
```

------------------------------------------------------------------------

# Graph Database Recommendation

Recommended node types:

-   Skill
-   Topic
-   Lesson
-   Project
-   Assessment
-   Career
-   Tool
-   Framework
-   Certification

Recommended relationship types:

-   PREREQUISITE_OF
-   RELATED_TO
-   REQUIRED_FOR
-   USED_BY
-   PRACTICED_IN
-   ASSESSED_BY
-   LEADS_TO
-   CERTIFIED_BY

------------------------------------------------------------------------

# Success Metrics

For every learner, track:

-   Knowledge Coverage
-   Skill Mastery
-   Project Completion
-   Assessment Accuracy
-   Portfolio Quality
-   Interview Readiness
-   Career Readiness Score

------------------------------------------------------------------------

# Phase 5 Preview

Build the first complete blueprint: **Software Engineer --- ELI5 to
Principal Engineer (10+ years)**

This roadmap will populate every stage with lessons, projects,
assessments, timelines, and AI mentor guidance using the Blueprint
Engine.
