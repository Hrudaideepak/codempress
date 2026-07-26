# Codempress Curriculum Authoring Guide

**Version:** 1.0

> This guide defines how every curriculum, module, lesson, and learning
> path should be designed within Codempress.

------------------------------------------------------------------------

# 1. Purpose

The goal of curriculum authoring is to create reusable, modular learning
experiences that can power multiple career paths through a shared
knowledge graph.

Guiding principles:

-   Teach concepts before tools.
-   Build from fundamentals to mastery.
-   Prefer project-based learning.
-   Reuse content across careers.
-   Design for AI personalization.

------------------------------------------------------------------------

# 2. Curriculum Hierarchy

``` text
Career
 └── Track
      └── Domain
           └── Module
                └── Topic
                     └── Lesson
                          ├── Practice
                          ├── Project
                          ├── Assessment
                          └── Interview Prep
```

------------------------------------------------------------------------

# 3. Learning Levels

Each topic progresses through five stages:

1.  Discover -- What is it?
2.  Understand -- Why does it matter?
3.  Apply -- Solve guided exercises.
4.  Build -- Complete a project.
5.  Master -- Explain, optimize, and teach the concept.

------------------------------------------------------------------------

# 4. Module Structure

Every module must include:

-   Overview
-   Learning outcomes
-   Prerequisites
-   Estimated study time
-   Topics
-   Practical exercises
-   Mini project
-   Assessment
-   Portfolio milestone

------------------------------------------------------------------------

# 5. Topic Design Template

For every topic include:

-   Metadata
-   Objectives
-   Prerequisites
-   Key concepts
-   ELI5 explanation
-   Beginner lesson
-   Intermediate lesson
-   Advanced lesson
-   Visual explanation (where applicable)
-   Real-world examples
-   Exercises
-   Mini challenge
-   Common mistakes
-   Best practices
-   Summary
-   Quiz
-   Interview questions
-   Mastery checklist

------------------------------------------------------------------------

# 6. Learning Outcomes

Write outcomes using measurable verbs.

Good examples:

-   Explain recursion.
-   Implement binary search.
-   Optimize SQL queries.
-   Deploy a web application.

Avoid vague outcomes such as "Understand Python."

------------------------------------------------------------------------

# 7. Prerequisite Mapping

Each topic should declare:

-   Required prerequisites
-   Recommended prerequisites
-   Successor topics

This enables adaptive roadmap generation.

------------------------------------------------------------------------

# 8. Project Integration

Each module ends with a project.

Project sizes:

-   Micro Project (30--60 min)
-   Mini Project (2--6 hours)
-   Module Project (1--3 days)
-   Capstone Project (1--4 weeks)

Every project should demonstrate the module's learning outcomes.

------------------------------------------------------------------------

# 9. Assessment Strategy

Assessments should evaluate:

-   Knowledge
-   Practical skills
-   Problem solving
-   Debugging
-   Communication
-   Engineering judgment

Mix formative and summative assessments.

------------------------------------------------------------------------

# 10. Portfolio Alignment

Every completed module should contribute an artifact:

-   Code repository
-   Documentation
-   Demo
-   Architecture diagram
-   Case study
-   Reflection

------------------------------------------------------------------------

# 11. Difficulty Progression

Difficulty scale:

-   Level 1 -- Foundations
-   Level 2 -- Beginner
-   Level 3 -- Intermediate
-   Level 4 -- Advanced
-   Level 5 -- Expert

Do not skip prerequisite levels unless mastery has been demonstrated.

------------------------------------------------------------------------

# 12. Curriculum Review Checklist

Before publishing, confirm:

-   Learning outcomes are measurable.
-   Topics follow prerequisite order.
-   Examples are current.
-   Projects reinforce concepts.
-   Assessments match objectives.
-   Portfolio artifact is meaningful.
-   AI mentor metadata is present.

------------------------------------------------------------------------

# 13. Definition of Done

A curriculum module is complete when it contains:

-   Approved structure
-   Complete lessons
-   Exercises
-   Project
-   Assessment
-   Portfolio deliverable
-   AI personalization metadata
-   Review approval
-   Version history

------------------------------------------------------------------------

# Appendix: Recommended Folder Structure

``` text
module/
├── module.yaml
├── overview.md
├── topics/
├── projects/
├── assessments/
├── portfolio.md
├── resources.md
└── changelog.md
```
