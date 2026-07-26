# Codempress — Ultimate Career Roadmap & Personalization Engine

**Version:** 3.5  
**Status:** Production-Ready  
**Integration:** FastAPI Backend | React Frontend | SQLite Database | GitHub Models AI Pipeline

---

## 🏛️ Part 1: Complete 43-Role Career Roadmap Taxonomy

### Legacy Software Engineering Roles (24)
1. **Software Engineer**: ELI5 → Principal Engineer (24 months)
2. **Frontend Engineer**: HTML/CSS → React → Web Vitals (18 months)
3. **Backend Engineer**: Python/Node.js → Databases → Microservices (20 months)
4. **Full Stack Engineer**: Frontend + Backend Integration (22 months)
5. **Mobile Engineer (React Native)**: React → Native Modules (16 months)
6. **Mobile Engineer (Flutter)**: Dart → Flutter Widgets (16 months)
7. **Game Developer**: C++ → Unity/Unreal Engine (24 months)
8. **DevOps Engineer**: Linux → Docker → Kubernetes → Cloud (18 months)
9. **Cloud Engineer**: Cloud Providers → IaC → Terraform (18 months)
10. **Site Reliability Engineer (SRE)**: DevOps → Reliability → SLIs/SLOs (20 months)
11. **Platform Engineer**: Infrastructure → DevEx → Tooling (20 months)
12. **Security Engineer**: OWASP → Cryptography → Auditing (20 months)
13. **Data Engineer**: SQL → Spark → Airflow → Warehousing (20 months)
14. **Data Analyst**: SQL → Pandas → Tableau/Power BI (14 months)
15. **BI Analyst**: Data → Dashboards → Strategy (14 months)
16. **Data Scientist**: Statistics → ML → Deep Learning (24 months)
17. **Machine Learning Engineer**: ML → MLOps → Model Serving (24 months)
18. **QA Engineer (SDET)**: Automation → Cypress/Playwright → CI/CD (16 months)
19. **Technical Writer**: Documentation → API Docs → DevRel (12 months)
20. **Product Manager (Technical)**: Product Strategy → Technical Fluency (18 months)
21. **Engineering Manager**: Senior Engineer → Mentorship → People Ops (14 months)
22. **Software Architect**: System Design → Enterprise Patterns (18 months)
23. **Solutions Engineer**: Engineering → Pre-sales → Technical Client Success (12 months)
24. **Technical Program Manager (TPM)**: Program Management → Agile Execution (14 months)

### AI-Native Emerging Engineering Roles (13)
25. **AI Engineer**: Python → ML → LLMs → RAG & Vector DBs (20 months)
26. **Generative AI Engineer**: Transformers → Diffusion Models → Fine-tuning (18 months)
27. **Agentic AI Engineer**: LangChain → LangGraph → CrewAI → Memory Systems (18 months)
28. **LLM Systems Engineer**: Fine-tuning → Quantization → vLLM Optimization (20 months)
29. **Prompt Engineer**: Chain-of-Thought → System Prompts → Security (12 months)
30. **Context Engineer / Vibe Engineer**: System Prompts → Context Engineering → MCP (16 months)
31. **AI Automation Engineer**: LLMs → n8n → Python/JS Integration (18 months)
32. **AI Product Engineer**: Product Strategy → Prompting → UX Design (16 months)
33. **MLOps Engineer**: ML → CI/CD Pipelines → Model Monitoring (20 months)
34. **AI Evaluation Engineer**: Red Teaming → Evaluation Harnesses → Metrics (16 months)
35. **AI Red Teaming Engineer**: Security → Prompt Injection Defense → Jailbreaking (16 months)
36. **AI Security Engineer**: OWASP Top 10 for LLMs → Secure AI Architecture (18 months)
37. **AI Platform Engineer**: Kubernetes → Model Serving → GPU Cluster Management (20 months)

### Data, Product & Leadership Roles (6)
38. **Analytics Engineer**: SQL → dbt → Warehousing (16 months)
39. **Data Infrastructure Engineer**: Big Data → Distributed Storage (20 months)
40. **Digital Product Strategist**: AI Strategy → Product Vision (14 months)
41. **AI-Fluent Product Manager**: Product Management → AI Capabilities (14 months)
42. **Developer Relations Engineer (DevRel)**: Dev Advocacy → Community → OSS (12 months)
43. **Remote Engineering Lead**: Distributed Teams → Asynchronous Workflow (14 months)

---

## 🤖 Part 2: Custom Roadmap & Resume Analysis Engine

### Capabilities:
1. **Method A (Goal Description)**: Converts natural language descriptions (e.g. *"I know Python and want to build AI agents for business workflows"*) into structured 5-phase learning roadmaps with skill gap scoring.
2. **Method B (Resume & Certification Analyzer)**: Extracts skills, certifications, and experience from PDF text or resume uploads, computes match scores across target roles, and generates custom learning plans.

---

## 🛠️ Part 3: Backend & Database Integration

### Database Tables (`database/schema.sql`):
- `custom_roadmaps`: Stores user-generated custom roadmaps, goal descriptions, skill gaps, and match scores.
- `resume_uploads`: Tracks uploaded resume text, extracted skills, and certification tags.

### API Endpoints (`backend/app/routers/custom_roadmap_router.py`):
- `POST /api/custom-roadmap/text`: Generate custom roadmap from text goal.
- `POST /api/custom-roadmap/resume`: Generate custom roadmap from resume text / upload.
- `GET /api/custom-roadmap/{roadmap_id}`: Fetch saved roadmap by ID.

---

## 🟢 Production Deployment Status
- **Render Backend**: `https://codempress.onrender.com`
- **Vercel Frontend**: `https://codempress.vercel.app`
