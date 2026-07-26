"""
Codempress Custom Roadmap & Resume Analysis Engine
Analyzes user goal text or resume content, extracts skills, computes match score against target roles,
identifies skill gaps, and compiles custom personalized roadmaps.
"""

import os
import re
import uuid
import json
import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

# Pre-defined master taxonomy dictionary for skill extraction
MASTER_SKILL_DICTIONARY = [
    "Python", "JavaScript", "TypeScript", "HTML", "CSS", "React", "Node.js", "Express", "FastAPI",
    "SQL", "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Vector Databases", "Pinecone", "ChromaDB",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Terraform", "CI/CD", "GitHub Actions", "Linux",
    "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "Pandas", "NumPy", "Scikit-Learn",
    "LLMs", "RAG", "Embeddings", "LangChain", "LangGraph", "AutoGen", "CrewAI", "Prompt Engineering",
    "System Design", "REST APIs", "GraphQL", "Microservices", "Git", "Testing", "Cypress", "Pytest",
    "Data Engineering", "Spark", "Airflow", "dbt", "OWASP", "OAuth2", "JWT", "Cybersecurity", "C++", "C#", "Unity", "Unreal"
]

# Role definitions for match score calculation
ROLE_REQUIRED_SKILLS = {
    "AI Agent Architect": ["Python", "LLMs", "LangChain", "LangGraph", "RAG", "Vector Databases", "REST APIs", "Docker"],
    "RAG & Vector DB Specialist": ["Python", "LLMs", "Embeddings", "Vector Databases", "Pinecone", "ChromaDB", "FastAPI"],
    "MCP Protocol Engineer": ["TypeScript", "Node.js", "JSON-RPC", "REST APIs", "LLMs", "Docker", "Git"],
    "GenAI Full-Stack Developer": ["React", "TypeScript", "Node.js", "Python", "FastAPI", "LLMs", "RAG", "TailwindCSS"],
    "LLMOps Infrastructure Engineer": ["Python", "Docker", "Kubernetes", "AWS", "vLLM", "Model Serving", "Prometheus", "CI/CD"],
    "AI Automation Engineer": ["Python", "JavaScript", "REST APIs", "LLMs", "Prompt Engineering", "Workflow Automation"],
    "Software Engineer": ["Python", "JavaScript", "Git", "SQL", "REST APIs", "System Design", "Testing"],
    "Frontend Engineer": ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Testing", "Git"],
    "Backend Engineer": ["Python", "Node.js", "SQL", "PostgreSQL", "REST APIs", "Docker", "Git"],
    "DevOps Engineer": ["Linux", "Docker", "Kubernetes", "CI/CD", "AWS", "Terraform", "Git"],
    "Data Engineer": ["Python", "SQL", "Spark", "Airflow", "PostgreSQL", "Docker", "Git"],
    "Security Engineer": ["Linux", "OWASP", "OAuth2", "JWT", "Cybersecurity", "Testing", "Git"]
}

class CustomRoadmapEngine:
    def extract_skills_from_text(self, text: str) -> List[str]:
        """Extract matching skills from raw text using regex & token matching."""
        if not text:
            return []
        found = set()
        text_lower = text.lower()
        for skill in MASTER_SKILL_DICTIONARY:
            # Check whole word match
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, text_lower):
                found.add(skill)
        return sorted(list(found))

    def calculate_match_score(self, current_skills: List[str], target_role: str) -> Dict[str, Any]:
        """Calculate percentage match score and missing gaps against target role."""
        req_skills = ROLE_REQUIRED_SKILLS.get(target_role, ["Python", "JavaScript", "Git", "SQL", "REST APIs"])
        current_set = set(s.lower() for s in current_skills)
        matched = []
        missing = []
        for req in req_skills:
            if req.lower() in current_set:
                matched.append(req)
            else:
                missing.append(req)
        score = round((len(matched) / len(req_skills)) * 100) if req_skills else 50
        return {
            "match_score": min(score, 100),
            "matched_skills": matched,
            "missing_gaps": missing,
            "target_role": target_role
        }

    def generate_custom_roadmap(self, goal_text: str = "", resume_text: str = "", certifications: List[str] = None, target_role: str = "AI Agent Architect") -> Dict[str, Any]:
        """Compile a complete custom roadmap structure with match scores and 5 phases."""
        certifications = certifications or []
        combined_text = f"{goal_text}\n{resume_text}\n" + " ".join(certifications)
        extracted_skills = self.extract_skills_from_text(combined_text)
        
        # Default skills if none extracted
        if not extracted_skills and "python" in combined_text.lower():
            extracted_skills = ["Python", "Git"]
        elif not extracted_skills:
            extracted_skills = ["Programming Foundations"]

        match_info = self.calculate_match_score(extracted_skills, target_role)
        match_score = match_info["match_score"]
        missing_gaps = match_info["missing_gaps"]

        # Build 5-Phase Personalized Learning Plan
        roadmap_id = f"crm-{uuid.uuid4().hex[:8]}"
        phases = [
            {
                "phase": 1,
                "name": "Phase 1: Foundations & Prerequisites",
                "duration": "2 Weeks",
                "topics": extracted_skills[:3] if extracted_skills else ["Programming Basics", "Version Control (Git)"],
                "description": "Solidify essential core prerequisites and toolchains."
            },
            {
                "phase": 2,
                "name": "Phase 2: Core Domain Skill Gaps",
                "duration": "3 Weeks",
                "topics": missing_gaps[:3] if missing_gaps else ["REST APIs", "Data Modeling"],
                "description": "Fill primary technical skill gaps required for your target role."
            },
            {
                "phase": 3,
                "name": "Phase 3: Advanced Architecture & Frameworks",
                "duration": "3 Weeks",
                "topics": missing_gaps[3:6] if len(missing_gaps) > 3 else ["System Design", "RAG & Vector DBs"],
                "description": "Master advanced frameworks, state management, and API design patterns."
            },
            {
                "phase": 4,
                "name": "Phase 4: Production Engineering & Cloud",
                "duration": "2 Weeks",
                "topics": ["Docker Containerization", "CI/CD Automation", "Security & Auth"],
                "description": "Deploy applications into production with containerization and health monitoring."
            },
            {
                "phase": 5,
                "name": "Phase 5: Portfolio Capstone Project",
                "duration": "2 Weeks",
                "topics": [f"{target_role} Full-Stack Capstone Project"],
                "description": "Build and showcase a production-grade project verifying your job readiness."
            }
        ]

        course_recommendations = [
            {
                "name": f"Mastering {target_role} from First Principles",
                "platform": "Codempress Studio",
                "duration": "20 Hours",
                "relevance": f"Covers your specific skill gaps: {', '.join(missing_gaps[:3])}"
            },
            {
                "name": "Production AI & Distributed Systems Engineering",
                "platform": "GitHub Models Academy",
                "duration": "15 Hours",
                "relevance": "Hands-on implementation of RAG, vector stores, and containerized deployments."
            }
        ]

        project_recommendations = [
            {
                "name": f"Production-Ready {target_role} System",
                "description": f"Build a complete full-stack application featuring {', '.join(missing_gaps[:3]) if missing_gaps else 'APIs & DBs'}.",
                "skills_applied": missing_gaps[:4] if missing_gaps else ["Python", "APIs", "Docker"]
            }
        ]

        return {
            "roadmap_id": roadmap_id,
            "title": f"Custom Roadmap: {target_role}",
            "target_role": target_role,
            "goal_text": goal_text,
            "extracted_skills": extracted_skills,
            "extracted_certifications": certifications,
            "match_score": match_score,
            "skill_gaps": missing_gaps,
            "phases": phases,
            "courses": course_recommendations,
            "projects": project_recommendations
        }

custom_roadmap_engine = CustomRoadmapEngine()
