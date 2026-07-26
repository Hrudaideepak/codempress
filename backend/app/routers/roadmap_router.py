import logging
from typing import Optional
from fastapi import APIRouter, HTTPException

logger = logging.getLogger("codempress.roadmap_router")
router = APIRouter(prefix="/api", tags=["Roadmaps"])

ROADMAPS_DATA = [
    # ==================== AI-NATIVE ROADMAPS (10) ====================
    {
        "id": 1,
        "slug": "ai-software-engineer",
        "title": "AI Software Engineer",
        "category": "ai_native",
        "rating": "⭐ 5.0",
        "icon": "⚡",
        "tagline": "Build production-grade software applications where AI is a core architectural feature.",
        "target_role": "AI Software Engineer",
        "estimated_weeks": "12 - 16 weeks",
        "overview": "Master the modern AI software stack. Transition from building traditional CRUD apps to creating intelligent software systems powered by LLM orchestration, RAG, Model Context Protocol (MCP), and vector databases.",
        "capstone_project": "Build & Ship an AI SaaS Platform with Subscription Billing & Multi-LLM Routing",
        "milestones": [
            {
                "id": "m1",
                "title": "1. Foundation & API Integration",
                "description": "Master Python & TypeScript fundamentals, HTTP REST, streaming endpoints, and OpenAI/Gemini SDKs.",
                "skills": ["Python", "TypeScript", "FastAPI", "OpenAI SDK", "Gemini API"],
                "topics_count": 45
            },
            {
                "id": "m2",
                "title": "2. Vector Databases & Embeddings",
                "description": "Understand vector embeddings, semantic search, cosine similarity, and vector DBs like Qdrant/Pinecone.",
                "skills": ["Embeddings", "Qdrant", "Pinecone", "pgvector", "Semantic Search"],
                "topics_count": 32
            },
            {
                "id": "m3",
                "title": "3. Retrieval-Augmented Generation (RAG)",
                "description": "Architect advanced RAG pipelines with chunking strategies, hybrid search, and re-ranking.",
                "skills": ["RAG Architecture", "Hybrid Search", "Cohere Re-rank", "Chunking"],
                "topics_count": 38
            },
            {
                "id": "m4",
                "title": "4. Model Context Protocol (MCP) & Tools",
                "description": "Connect AI models to external tools, databases, and filesystem systems using Anthropic MCP.",
                "skills": ["Model Context Protocol (MCP)", "Tool Calling", "JSON Schema"],
                "topics_count": 28
            },
            {
                "id": "m5",
                "title": "5. Agentic Workflows & Multi-Agent Systems",
                "description": "Build stateful multi-agent workflows using LangGraph and CrewAI with autonomous planning.",
                "skills": ["LangGraph", "CrewAI", "State Machines", "Multi-Agent Networks"],
                "topics_count": 40
            },
            {
                "id": "m6",
                "title": "6. Production Capstone & Deployment",
                "description": "Deploy AI SaaS to production with rate limiting, telemetry, streaming response UX, and evaluation.",
                "skills": ["Docker", "Vercel", "Render", "LangSmith", "Telemetry"],
                "topics_count": 25
            }
        ]
    },
    {
        "id": 2,
        "slug": "agentic-ai-engineer",
        "title": "Agentic AI Engineer",
        "category": "ai_native",
        "rating": "⭐ 5.0",
        "icon": "🤖",
        "tagline": "Design autonomous AI agents with stateful memory, multi-agent collaboration, and tool execution.",
        "target_role": "Agentic AI Systems Specialist",
        "estimated_weeks": "14 - 18 weeks",
        "overview": "Agentic systems are redefining software engineering. Learn to construct autonomous agents capable of complex reasoning, iterative planning, dynamic tool invocation, and collaborative problem-solving.",
        "capstone_project": "Autonomous AI Research & Coding Assistant with Automated Git PR Generation",
        "milestones": [
            {
                "id": "m1",
                "title": "1. Core Foundations & ReAct Pattern",
                "description": "Learn reasoning and action loops (ReAct), structured tool calling, and prompt decomposition.",
                "skills": ["ReAct Pattern", "Python", "Pydantic", "Tool Calling"],
                "topics_count": 35
            },
            {
                "id": "m2",
                "title": "2. LangGraph & Directed Cyclic Graphs",
                "description": "Build complex stateful agent workflows using LangGraph nodes, edges, conditional routing, and persistence.",
                "skills": ["LangGraph", "State Graphs", "Checkpointers", "Human-in-the-loop"],
                "topics_count": 42
            },
            {
                "id": "m3",
                "title": "3. CrewAI & AutoGen Frameworks",
                "description": "Orchestrate specialized role-playing subagents working concurrently on complex research tasks.",
                "skills": ["CrewAI", "AutoGen", "Role Delegation", "Inter-agent Messaging"],
                "topics_count": 36
            },
            {
                "id": "m4",
                "title": "4. Model Context Protocol (MCP) Integration",
                "description": "Integrate MCP servers for secure filesystem, Git, SQL database, and web searching capabilities.",
                "skills": ["MCP Servers", "Client Protocol", "Tool Registration"],
                "topics_count": 30
            },
            {
                "id": "m5",
                "title": "5. Agent Planning, Memory & Reflection",
                "description": "Implement short-term/long-term memory stores, self-reflection loops, and error recovery strategies.",
                "skills": ["Vector Memory", "Self-Correction", "Reflection Loops"],
                "topics_count": 34
            },
            {
                "id": "m6",
                "title": "6. Capstone & Production Observability",
                "description": "Deploy stateful agents with telemetry, token budgeting, and guardrails against infinite execution loops.",
                "skills": ["LangSmith", "Traces", "Token Caps", "Guardrails"],
                "topics_count": 28
            }
        ]
    },
    {
        "id": 3,
        "slug": "context-engineer",
        "title": "Context Engineer",
        "category": "ai_native",
        "rating": "⭐ 5.0",
        "icon": "🧠",
        "tagline": "Master the art and science of feeding AI models optimal context, memory, and structured retrieval.",
        "target_role": "Context Architect / AI Data Specialist",
        "estimated_weeks": "10 - 14 weeks",
        "overview": "Context is the bottleneck of AI intelligence. Learn prompt architecture, long-context window optimization, RAG retrieval techniques, knowledge graphs, and context compression.",
        "capstone_project": "Enterprise Multi-Source Knowledge Assistant with Hybrid Graph-RAG Retrieval",
        "milestones": [
            {
                "id": "m1",
                "title": "1. Advanced Prompt Architecture",
                "description": "Few-shot prompting, system instructions, XML tags, structured JSON outputs, and prompt versioning.",
                "skills": ["Prompting", "XML Tagging", "JSON Schemas", "System Prompts"],
                "topics_count": 30
            },
            {
                "id": "m2",
                "title": "2. Context Window Optimization & Compression",
                "description": "Maximize 128k - 1M token context windows, prompt caching, token pruning, and summarization loops.",
                "skills": ["Context Pruning", "Prompt Caching", "LLM Memory", "Summarization"],
                "topics_count": 32
            },
            {
                "id": "m3",
                "title": "3. RAG & Vector Embeddings",
                "description": "Chunking heuristics, semantic embeddings, vector index optimization, and BM25 hybrid search.",
                "skills": ["Vector DBs", "BM25", "Hybrid Search", "Semantic Indexing"],
                "topics_count": 38
            },
            {
                "id": "m4",
                "title": "4. Knowledge Graphs & Graph-RAG",
                "description": "Construct Neo4j knowledge graphs to link entity relationships and complement vector retrieval.",
                "skills": ["Graph-RAG", "Neo4j", "Entity Extraction", "Knowledge Graphs"],
                "topics_count": 35
            },
            {
                "id": "m5",
                "title": "5. Capstone: Enterprise Knowledge Engine",
                "description": "Build an enterprise context engine that indexes Slack, Notion, GitHub, and Jira into real-time AI context.",
                "skills": ["Enterprise Search", "Pipeline Sync", "Evaluation Metrics"],
                "topics_count": 25
            }
        ]
    },
    {
        "id": 4,
        "slug": "ai-product-engineer",
        "title": "AI Product Engineer",
        "category": "ai_native",
        "rating": "⭐ 4.9",
        "icon": "🎨",
        "tagline": "Bridge product design and AI engineering to craft delightful, low-latency AI user experiences.",
        "target_role": "AI Product Engineer",
        "estimated_weeks": "10 - 12 weeks",
        "overview": "Learn how to build AI interfaces that feel alive, responsive, and trustworthy. Focus on optimistic UI updates, streaming text, inline AI edits, feedback loops, and user evaluation metrics.",
        "capstone_project": "AI-Powered Writing & Document Collaboration Platform (Linear-style UX)",
        "milestones": [
            {
                "id": "m1",
                "title": "1. Modern UX Systems & React",
                "description": "React 19, Tailwind/CSS variables, state management, and modern typography aesthetics.",
                "skills": ["React", "TypeScript", "UX Design", "Design Systems"],
                "topics_count": 36
            },
            {
                "id": "m2",
                "title": "2. Streaming AI Responses & Micro-Animations",
                "description": "Server-Sent Events (SSE), Vercel AI SDK, typing indicators, and smooth UI transitions.",
                "skills": ["SSE", "Vercel AI SDK", "Streaming UI", "Micro-animations"],
                "topics_count": 30
            },
            {
                "id": "m3",
                "title": "3. AI Product Mechanics & Evaluation",
                "description": "Inline AI commands, undo/redo state stacks, user feedback thumbs, and latency budgets.",
                "skills": ["Product Analytics", "Feedback Loops", "Latency Optimization"],
                "topics_count": 28
            },
            {
                "id": "m4",
                "title": "4. Capstone: AI Editor App",
                "description": "Build a collaborative markdown/prose editor with embedded AI writing tools and voice input.",
                "skills": ["Full Stack AI", "ProseMirror/Tiptap", "Voice AI"],
                "topics_count": 24
            }
        ]
    },
    {
        "id": 5,
        "slug": "llm-systems-engineer",
        "title": "LLM Systems Engineer",
        "category": "ai_native",
        "rating": "⭐ 4.9",
        "icon": "⚙️",
        "tagline": "Deploy, quantize, and scale open-weights LLMs with vLLM, Ollama, and high-throughput GPU inference.",
        "target_role": "LLMOps & Inference Infrastructure Engineer",
        "estimated_weeks": "14 - 18 weeks",
        "overview": "Deep dive into model quantization, GPU memory management, vLLM PagedAttention, and self-hosted open-source model inference pipelines.",
        "capstone_project": "Self-Hosted Enterprise Local AI Platform with vLLM, Ollama, and GPU Load Balancing",
        "milestones": [
            {
                "id": "m1",
                "title": "1. Open-Weights Architecture & Hardware",
                "description": "Transformer architecture fundamentals, GGUF/AWQ formats, GPU VRAM allocation, and FLOPS math.",
                "skills": ["PyTorch", "GGUF", "VRAM Optimization", "Transformer Mechanics"],
                "topics_count": 40
            },
            {
                "id": "m2",
                "title": "2. Local Inference Engines (Ollama & vLLM)",
                "description": "Set up high-performance inference servers using vLLM, PagedAttention, continuous batching, and Ollama APIs.",
                "skills": ["vLLM", "Ollama", "PagedAttention", "Continuous Batching"],
                "topics_count": 42
            },
            {
                "id": "m3",
                "title": "3. Model Quantization & Fine-Tuning",
                "description": "Quantize models to 4-bit/8-bit precision (LoRA, QLoRA, Unsloth) for low-latency edge deployment.",
                "skills": ["LoRA", "QLoRA", "Unsloth", "Quantization"],
                "topics_count": 38
            },
            {
                "id": "m4",
                "title": "4. Capstone: Distributed Inference Gateway",
                "description": "Build an OpenAI-compatible API gateway proxying multi-GPU vLLM clusters with load balancing.",
                "skills": ["API Proxy", "Load Balancing", "Prometheus Metrics"],
                "topics_count": 30
            }
        ]
    },
    {
        "id": 6,
        "slug": "ai-automation-engineer",
        "title": "AI Automation Engineer",
        "category": "ai_native",
        "rating": "⭐ 4.9",
        "icon": "🔄",
        "tagline": "Automate complex enterprise business workflows by integrating AI agents with n8n, Make, and webhooks.",
        "target_role": "AI Workflow & Automation Engineer",
        "estimated_weeks": "8 - 12 weeks",
        "overview": "Learn how to build end-to-end autonomous business automation suites connecting CRMs, databases, email, and APIs via n8n, MCP, and webhooks.",
        "capstone_project": "Autonomous Enterprise AI Operations Suite with n8n & Custom Webhooks",
        "milestones": [
            {
                "id": "m1",
                "title": "1. Webhooks, APIs & JSON Parsing",
                "description": "Master REST APIs, authentication headers, JSON payload formatting, and webhook triggers.",
                "skills": ["Webhooks", "JSON", "REST APIs", "cURL"],
                "topics_count": 28
            },
            {
                "id": "m2",
                "title": "2. n8n & Workflow Automation",
                "description": "Build complex n8n workflows with branching logic, error handling, and database integration.",
                "skills": ["n8n", "Workflow Design", "Make", "Zapier"],
                "topics_count": 35
            },
            {
                "id": "m3",
                "title": "3. AI Integration & MCP Workflows",
                "description": "Embed LLM reasoning nodes into n8n pipelines using OpenAI/Anthropic APIs and MCP servers.",
                "skills": ["n8n AI Nodes", "MCP", "Structured Outputs"],
                "topics_count": 30
            },
            {
                "id": "m4",
                "title": "4. Capstone: Autonomous Business Suite",
                "description": "Automate customer support ticket resolution, lead scoring, and automated email follow-ups.",
                "skills": ["CRM Integration", "Support Automation", "Pipeline Sync"],
                "topics_count": 24
            }
        ]
    },
    {
        "id": 7,
        "slug": "ai-platform-engineer",
        "title": "AI Platform Engineer",
        "category": "ai_native",
        "rating": "⭐ 4.8",
        "icon": "🐳",
        "tagline": "Build scalable cloud infrastructure for AI workloads with Kubernetes, GPU scheduling, and Docker.",
        "target_role": "AI Infrastructure & Platform Engineer",
        "estimated_weeks": "14 - 16 weeks",
        "overview": "Design high-availability cloud platforms tailored for heavy AI workloads. Master GPU containerization, Kubernetes Operator patterns, model storage, and cluster monitoring.",
        "capstone_project": "Kubernetes-Native Multi-Tenant AI Serving & Training Platform",
        "milestones": [
            {
                "id": "m1",
                "title": "1. Containerization & GPU Passthrough",
                "description": "Docker container optimization, NVIDIA CUDA container toolkit, and PyTorch image builds.",
                "skills": ["Docker", "NVIDIA Container Toolkit", "CUDA"],
                "topics_count": 35
            },
            {
                "id": "m2",
                "title": "2. Kubernetes for AI Clusters",
                "description": "Deploy K8s clusters, GPU node pools, persistent volume claims (PVCs), and ingress controllers.",
                "skills": ["Kubernetes", "Helm", "Kube-prometheus", "GPU Pools"],
                "topics_count": 40
            },
            {
                "id": "m3",
                "title": "3. Model Serving & Autoscaling",
                "description": "KServe, Ray Serve, Horizontal Pod Autoscaling (HPA) based on GPU utilization metrics.",
                "skills": ["KServe", "Ray Serve", "Autoscaling", "Prometheus"],
                "topics_count": 36
            },
            {
                "id": "m4",
                "title": "4. Capstone: AI Deployment Platform",
                "description": "Build an internal developer portal allowing engineers to deploy AI models via GitOps.",
                "skills": ["GitOps", "ArgoCD", "Developer Portal"],
                "topics_count": 28
            }
        ]
    },
    {
        "id": 8,
        "slug": "ai-security-engineer",
        "title": "AI Security Engineer",
        "category": "ai_native",
        "rating": "⭐ 4.9",
        "icon": "🛡️",
        "tagline": "Protect AI applications from prompt injections, data leaks, rogue tool execution, and adversarial attacks.",
        "target_role": "AI Red Teamer / AI Security Specialist",
        "estimated_weeks": "12 - 14 weeks",
        "overview": "As AI models interact with databases and APIs, security risks skyrocket. Learn OWASP Top 10 for LLMs, prompt injection defense, AI red teaming, and secure tool execution gateways.",
        "capstone_project": "Zero-Trust AI Security Gateway & Prompt Injection Firewall",
        "milestones": [
            {
                "id": "m1",
                "title": "1. OWASP Top 10 for LLMs & Prompt Injection",
                "description": "Direct/indirect prompt injection, jailbreaks, system prompt leakage, and data poisoning attacks.",
                "skills": ["Prompt Injection", "Jailbreak Analysis", "OWASP Top 10 for LLMs"],
                "topics_count": 32
            },
            {
                "id": "m2",
                "title": "2. Guardrails & Content Filtering",
                "description": "Implement NeMo Guardrails, Llama Guard, and regex pattern filters to prevent unsafe model outputs.",
                "skills": ["NeMo Guardrails", "Llama Guard", "Input/Output Sanitization"],
                "topics_count": 30
            },
            {
                "id": "m3",
                "title": "3. Secure Tool Execution & MCP Security",
                "description": "Sandbox tool calls, enforce principle of least privilege, and prevent arbitrary code execution.",
                "skills": ["Sandboxing", "Least Privilege", "MCP Security"],
                "topics_count": 28
            },
            {
                "id": "m4",
                "title": "4. Capstone: AI Security Proxy",
                "description": "Build a high-performance proxy firewall inspecting all incoming prompts and outgoing tool calls.",
                "skills": ["Security Gateway", "Red Teaming Audit", "Log Analysis"],
                "topics_count": 26
            }
        ]
    },
    {
        "id": 9,
        "slug": "ai-evaluation-engineer",
        "title": "AI Evaluation Engineer",
        "category": "ai_native",
        "rating": "⭐ 4.9",
        "icon": "📊",
        "tagline": "Establish rigorous testing, benchmarking, and hallucination detection for AI applications.",
        "target_role": "AI Quality & Evaluation Engineer",
        "estimated_weeks": "10 - 12 weeks",
        "overview": "Software testing has evolved. Learn how to evaluate non-deterministic AI models using LLM-as-a-judge, Ragas metrics, hallucination scoring, and human-in-the-loop evaluation pipelines.",
        "capstone_project": "Automated LLM Benchmarking & Hallucination Analytics Dashboard",
        "milestones": [
            {
                "id": "m1",
                "title": "1. LLM Evaluation Frameworks",
                "description": "Ragas, DeepEval, Promptfoo, and LLM-as-a-Judge evaluation techniques.",
                "skills": ["Ragas", "DeepEval", "Promptfoo", "LLM-as-a-Judge"],
                "topics_count": 30
            },
            {
                "id": "m2",
                "title": "2. Hallucination Detection & Accuracy Metrics",
                "description": "Measure faithfulness, answer relevance, context recall, and semantic similarity scores.",
                "skills": ["Faithfulness Metric", "Context Precision", "ROUGE/BLEU"],
                "topics_count": 28
            },
            {
                "id": "m3",
                "title": "3. CI/CD Integration for AI Prompts",
                "description": "Automate prompt regressions tests in GitHub Actions prior to merging code.",
                "skills": ["GitHub Actions", "Regression Testing", "Prompt Auditing"],
                "topics_count": 24
            },
            {
                "id": "m4",
                "title": "4. Capstone: AI Eval Suite",
                "description": "Build an enterprise dashboard tracking model quality, latency, and cost across versions.",
                "skills": ["Eval Dashboard", "A/B Testing", "Cost Analytics"],
                "topics_count": 22
            }
        ]
    },
    {
        "id": 10,
        "slug": "ai-solutions-architect",
        "title": "AI Solutions Architect",
        "category": "ai_native",
        "rating": "⭐ 5.0",
        "icon": "🏛️",
        "tagline": "Design enterprise-grade AI architecture, multi-cloud strategy, cost optimization, and governance.",
        "target_role": "Principal AI Solutions Architect",
        "estimated_weeks": "14 - 18 weeks",
        "overview": "Bridge business requirements and cutting-edge AI capability. Design scalable enterprise AI architectures, select cloud vs self-hosted strategies, and manage token budgets.",
        "capstone_project": "Enterprise Multi-Department AI Assistant & Security Governance Blueprint",
        "milestones": [
            {
                "id": "m1",
                "title": "1. Enterprise System Design & AI Tradeoffs",
                "description": "Build vs buy decisions, latency vs accuracy trade-offs, and multi-tenant AI topologies.",
                "skills": ["System Design", "Build vs Buy", "Architecture Blueprints"],
                "topics_count": 40
            },
            {
                "id": "m2",
                "title": "2. Cloud & On-Prem AI Topology",
                "description": "AWS Bedrock, Azure OpenAI, GCP Vertex AI, and hybrid cloud private deployments.",
                "skills": ["AWS Bedrock", "Azure OpenAI", "Hybrid Cloud"],
                "topics_count": 38
            },
            {
                "id": "m3",
                "title": "3. Enterprise Compliance, Cost & Governance",
                "description": "SOC2, HIPAA, GDPR compliance in AI, token cost controls, and access management.",
                "skills": ["Governance", "Compliance", "Token Cost Control"],
                "topics_count": 32
            },
            {
                "id": "m4",
                "title": "4. Capstone: Enterprise Blueprint",
                "description": "Architect an enterprise AI solution supporting 50,000 internal users with strict data isolation.",
                "skills": ["Enterprise Blueprint", "RFP Design", "Executive Presentation"],
                "topics_count": 30
            }
        ]
    },

    # ==================== CODEMPRESS EXCLUSIVE ROADMAPS (6) ====================
    {
        "id": 11,
        "slug": "ai-startup-founder",
        "title": "AI Startup Founder",
        "category": "exclusive",
        "rating": "🔥 EXCLUSIVE",
        "icon": "🚀",
        "tagline": "Go from zero to a launched, monetized AI SaaS business with modern tech and lean execution.",
        "target_role": "AI Founder / CTO",
        "estimated_weeks": "10 - 12 weeks",
        "overview": "Learn how to rapidly build, launch, and monetize AI software. Master lean MVP validation, Stripe/Paddle payment integration, SEO landing pages, and AI token economics.",
        "capstone_project": "Launch a Fully Functional Monetized AI SaaS Product with Live Users",
        "milestones": [
            {
                "id": "m1",
                "title": "1. Rapid MVP Design & Ideation",
                "description": "Identify high-value AI pain points, competitive moat design, and fast MVP scoping.",
                "skills": ["Product Scoping", "MVP Design", "Lean Canvas"],
                "topics_count": 25
            },
            {
                "id": "m2",
                "title": "2. Full Stack AI Tech Stack",
                "description": "Next.js/Vite, Supabase/SQLite, FastAPI, and OpenAI/Gemini API integration.",
                "skills": ["React", "FastAPI", "Supabase", "LLM APIs"],
                "topics_count": 38
            },
            {
                "id": "m3",
                "title": "3. Billing, Auth & Token Metering",
                "description": "Stripe usage-based billing, subscription tiers, Google OAuth, and user token quotas.",
                "skills": ["Stripe API", "Google OAuth", "Token Quotas"],
                "topics_count": 30
            },
            {
                "id": "m4",
                "title": "4. Capstone: Launch & Distribute",
                "description": "Deploy to Vercel/Render, optimize landing page SEO, and launch on Product Hunt / X.",
                "skills": ["Deployment", "SEO", "Product Hunt Launch"],
                "topics_count": 22
            }
        ]
    },
    {
        "id": 12,
        "slug": "ai-indie-hacker",
        "title": "AI Indie Hacker",
        "category": "exclusive",
        "rating": "🔥 EXCLUSIVE",
        "icon": "⚡",
        "tagline": "Master 'Vibe Coding' and rapid AI tools to ship 3 micro-apps per month as a solo developer.",
        "target_role": "Solo AI Builder & Indie Hacker",
        "estimated_weeks": "8 - 10 weeks",
        "overview": "The era of the 1-person unicorn is here. Learn to leverage AI coding CLI tools, pre-built templates, micro-payments, and rapid distribution to build cash-flowing micro-tools.",
        "capstone_project": "Ship 3 Live Monetized AI Micro-Apps in 30 Days",
        "milestones": [
            {
                "id": "m1",
                "title": "1. Vibe Coding & AI CLI Acceleration",
                "description": "Build full apps in hours using Cursor, Claude Code, and Antigravity CLI scripts.",
                "skills": ["Cursor", "Claude Code", "Vibe Coding", "Rapid Scaffolding"],
                "topics_count": 28
            },
            {
                "id": "m2",
                "title": "2. Micro-SaaS Templates & Micro-Payments",
                "description": "LemonSqueezy, Stripe Checkout, Tailwind components, and instant serverless hosting.",
                "skills": ["LemonSqueezy", "Serverless", "TailwindCSS"],
                "topics_count": 25
            },
            {
                "id": "m3",
                "title": "3. Capstone: 3 Micro-App Sprint",
                "description": "Build and launch a text summarizer, an AI background remover, and a code converter.",
                "skills": ["Micro-App Launch", "X Marketing", "Analytics"],
                "topics_count": 20
            }
        ]
    },
    {
        "id": 13,
        "slug": "ai-creator",
        "title": "AI Creator",
        "category": "exclusive",
        "rating": "🔥 EXCLUSIVE",
        "icon": "✨",
        "tagline": "Harness generative image, video, and audio models to build autonomous digital media brands.",
        "target_role": "AI Content Creator & Media Technologist",
        "estimated_weeks": "6 - 8 weeks",
        "overview": "Combine generative AI models (Midjourney, Runway Gen-3, ElevenLabs, Flux) with automated scripting pipelines to build automated media channels and brand engines.",
        "capstone_project": "Autonomous Multi-Channel AI Video & Graphic Generation Pipeline",
        "milestones": [
            {
                "id": "m1",
                "title": "1. Image & Video Generation Models",
                "description": "Midjourney, Flux, Stable Diffusion, Runway, and Luma AI video generation techniques.",
                "skills": ["Midjourney", "Flux", "Runway Gen-3", "ComfyUI"],
                "topics_count": 25
            },
            {
                "id": "m2",
                "title": "2. Voice Cloning & Audio Synthesis",
                "description": "ElevenLabs voice cloning, background music generation, and audio-video synchronization.",
                "skills": ["ElevenLabs", "Audio Generation", "Video Editing Automation"],
                "topics_count": 22
            },
            {
                "id": "m3",
                "title": "3. Capstone: Automated Content Engine",
                "description": "Build an automated script-to-video workflow that outputs scheduled media automatically.",
                "skills": ["Python Media Scripts", "FFmpeg", "Social Media APIs"],
                "topics_count": 20
            }
        ]
    },
    {
        "id": 14,
        "slug": "ai-workflow-designer",
        "title": "AI Workflow Designer",
        "category": "exclusive",
        "rating": "🔥 EXCLUSIVE",
        "icon": "🧩",
        "tagline": "Architect human-in-the-loop AI workflows that connect enterprise software without heavy coding.",
        "target_role": "Enterprise AI Workflow Architect",
        "estimated_weeks": "8 - 10 weeks",
        "overview": "Designed for tech-savvy operators and consultants. Learn how to map enterprise business processes into visual AI workflows using n8n, MCP, and custom CRM integrations.",
        "capstone_project": "Complete Enterprise CRM & Support Ticket AI Workflow System",
        "milestones": [
            {
                "id": "m1",
                "title": "1. Business Process Mapping",
                "description": "Deconstruct complex company operations into discrete inputs, outputs, and decision trees.",
                "skills": ["Process Mapping", "Decision Trees", "BPMN"],
                "topics_count": 20
            },
            {
                "id": "m2",
                "title": "2. Visual Automation & n8n Integration",
                "description": "Build complex conditional workflows connecting Salesforce, HubSpot, Zendesk, and Slack.",
                "skills": ["n8n", "HubSpot API", "Zendesk Integration"],
                "topics_count": 28
            },
            {
                "id": "m3",
                "title": "3. Capstone: Enterprise Automation Delivery",
                "description": "Deliver a complete AI workflow that ingests customer emails and updates ERP databases.",
                "skills": ["Client Delivery", "Workflow Documentation"],
                "topics_count": 22
            }
        ]
    },
    {
        "id": 15,
        "slug": "ai-developer-productivity-engineer",
        "title": "AI Developer Productivity Engineer",
        "category": "exclusive",
        "rating": "🔥 EXCLUSIVE",
        "icon": "💻",
        "tagline": "Transform engineering teams with AI coding tools, custom CLI subagents, and MCP integrations.",
        "target_role": "Staff Developer Experience (DevEx) Engineer",
        "estimated_weeks": "10 - 12 weeks",
        "overview": "Supercharge developer productivity across entire engineering organizations. Master Claude Code, Codex CLI, Gemini CLI, Cursor, Windsurf, custom subagents, and MCP server tooling.",
        "capstone_project": "Enterprise AI-First Development Workflow & Internal Antigravity Agent Suite",
        "milestones": [
            {
                "id": "m1",
                "title": "1. AI Coding CLI Mastery",
                "description": "Claude Code, Antigravity CLI, Gemini CLI, and terminal-first AI development patterns.",
                "skills": ["Claude Code", "Antigravity CLI", "Terminal Mastery"],
                "topics_count": 32
            },
            {
                "id": "m2",
                "title": "2. MCP Server Development for DevEx",
                "description": "Build custom MCP servers exposing internal company APIs, DB schemas, and docs to AI tools.",
                "skills": ["MCP Protocol", "TypeScript MCP", "Python MCP"],
                "topics_count": 35
            },
            {
                "id": "m3",
                "title": "3. Subagent Orchestration & Rules (.agents / AGENTS.md)",
                "description": "Configure multi-subagent matrix roles, custom skills, and workspace rules for automated code reviews.",
                "skills": ["Subagent Matrix", "AGENTS.md", "Automated PR Audits"],
                "topics_count": 30
            },
            {
                "id": "m4",
                "title": "4. Capstone: Enterprise DevEx Operating System",
                "description": "Deploy an AI coding setup that reduces pull request cycle times by 60% across team.",
                "skills": ["DevEx Metrics", "CI/CD AI Bots", "Team Onboarding"],
                "topics_count": 24
            }
        ]
    },
    {
        "id": 16,
        "slug": "forward-deployed-ai-engineer",
        "title": "Forward Deployed AI Engineer",
        "category": "exclusive",
        "rating": "🔥 EXCLUSIVE",
        "icon": "🌐",
        "tagline": "Implement custom AI solutions on-site inside enterprise client organizations (FDE role).",
        "target_role": "Forward Deployed AI Engineer (Palantir/Scale AI Style)",
        "estimated_weeks": "12 - 16 weeks",
        "overview": "Forward Deployed AI Engineers (FDE) are the elite strike force of AI companies. Learn to work directly with clients to understand domain data, deploy secure RAG/Agents, and solve real business problems.",
        "capstone_project": "On-Premise Enterprise Financial Data AI Search & Analytics System",
        "milestones": [
            {
                "id": "m1",
                "title": "1. Client Problem Discovery & Data Wrangling",
                "description": "Extracting unstructured client data (PDFs, SQL, legacy logs) and cleaning data pipelines.",
                "skills": ["Data Ingestion", "PDF Parsing", "ETL", "Client Communication"],
                "topics_count": 35
            },
            {
                "id": "m2",
                "title": "2. On-Premise & Air-Gapped AI Deployments",
                "description": "Deploying open-weights LLMs in strict air-gapped environments without internet access.",
                "skills": ["Air-Gapped AI", "Ollama", "Private Cloud", "Data Security"],
                "topics_count": 38
            },
            {
                "id": "m3",
                "title": "3. Enterprise Security & Integration",
                "description": "Integrating with Active Directory, LDAP, OAuth2, and role-based access control (RBAC).",
                "skills": ["RBAC", "Active Directory", "Enterprise Auth"],
                "topics_count": 30
            },
            {
                "id": "m4",
                "title": "4. Capstone: Complete FDE Client Delivery",
                "description": "Deliver a production-ready AI solution to a simulated enterprise client with full documentation.",
                "skills": ["FDE Delivery", "Client Acceptance", "Production SLA"],
                "topics_count": 28
            }
        ]
    },

    # ==================== LEGACY INDUSTRY ROADMAPS (10) ====================
    {
        "id": 17,
        "slug": "software-engineer",
        "title": "Software Engineer",
        "category": "legacy",
        "rating": "⭐ 4.8",
        "icon": "💻",
        "tagline": "Master core computer science, data structures, algorithms, and fundamental system design.",
        "target_role": "Software Development Engineer (SDE I/II)",
        "estimated_weeks": "16 - 20 weeks",
        "overview": "The classic, battle-tested software engineering foundation. Master Python/C++, Data Structures & Algorithms, Object-Oriented Design, and System Architecture.",
        "capstone_project": "Build a High-Throughput Distributed Task Scheduler & Queue System",
        "milestones": [
            {
                "id": "m1",
                "title": "1. Data Structures & Algorithms",
                "description": "Arrays, Trees, Graphs, Dynamic Programming, Big-O Notation, and LeetCode patterns.",
                "skills": ["Data Structures", "Algorithms", "Big-O Analysis"],
                "topics_count": 60
            },
            {
                "id": "m2",
                "title": "2. Object-Oriented & Clean Code",
                "description": "SOLID principles, design patterns (Factory, Singleton, Strategy), and clean refactoring.",
                "skills": ["OOP", "Design Patterns", "Clean Code"],
                "topics_count": 40
            },
            {
                "id": "m3",
                "title": "3. System Design & Concurrency",
                "description": "Load balancing, caching (Redis), relational databases, and multi-threading.",
                "skills": ["System Design", "Redis", "Concurrency"],
                "topics_count": 45
            }
        ]
    },
    {
        "id": 18,
        "slug": "frontend-engineer",
        "title": "Frontend Engineer",
        "category": "legacy",
        "rating": "⭐ 4.8",
        "icon": "🖼️",
        "tagline": "Build pixel-perfect, accessible, and ultra-fast user interfaces with React and TypeScript.",
        "target_role": "Frontend Software Engineer",
        "estimated_weeks": "12 - 16 weeks",
        "overview": "Master modern web development. Learn React, TypeScript, state management, CSS layouts, Web Vitals performance, and WCAG accessibility standards.",
        "capstone_project": "Build a Real-Time Collaborative Analytics Dashboard",
        "milestones": [
            {
                "id": "m1",
                "title": "1. Modern HTML, CSS & JavaScript",
                "description": "Flexbox, Grid, DOM manipulation, ES6+, Async/Await, and Web APIs.",
                "skills": ["HTML5", "CSS3", "JavaScript ES6+"],
                "topics_count": 45
            },
            {
                "id": "m2",
                "title": "2. React & TypeScript",
                "description": "Hooks, Context, state management, custom hooks, and strict TypeScript types.",
                "skills": ["React 19", "TypeScript", "Vite"],
                "topics_count": 50
            },
            {
                "id": "m3",
                "title": "3. UI Systems & Performance",
                "description": "Core Web Vitals, code-splitting, bundle optimization, and WCAG AA accessibility.",
                "skills": ["Performance", "Web Vitals", "Accessibility (a11y)"],
                "topics_count": 35
            }
        ]
    },
    {
        "id": 19,
        "slug": "backend-engineer",
        "title": "Backend Engineer",
        "category": "legacy",
        "rating": "⭐ 4.8",
        "icon": "🖥️",
        "tagline": "Design high-performance APIs, relational database schemas, and distributed backends.",
        "target_role": "Backend Software Engineer",
        "estimated_weeks": "14 - 18 weeks",
        "overview": "Learn how to build resilient backend microservices using FastAPI/Node.js, PostgreSQL/SQLite, Redis caching, and JWT authentication.",
        "capstone_project": "High-Throughput Financial Payment Processing Engine with ACID Guarantees",
        "milestones": [
            {
                "id": "m1",
                "title": "1. APIs & Web Frameworks",
                "description": "RESTful API design, FastAPI, middleware, error handling, and OpenAPI specs.",
                "skills": ["FastAPI", "Python", "REST APIs"],
                "topics_count": 40
            },
            {
                "id": "m2",
                "title": "2. Databases & Persistence",
                "description": "SQL indexing, query optimization, ACID transactions, and ORMs vs raw SQL.",
                "skills": ["SQLite", "PostgreSQL", "SQL Indexing"],
                "topics_count": 45
            },
            {
                "id": "m3",
                "title": "3. Authentication & Distributed Systems",
                "description": "OAuth2, JWT tokens, Redis caching, message queues (RabbitMQ/Kafka).",
                "skills": ["JWT", "Redis", "Message Queues"],
                "topics_count": 38
            }
        ]
    },
    {
        "id": 20,
        "slug": "full-stack-engineer",
        "title": "Full Stack Engineer",
        "category": "legacy",
        "rating": "⭐ 4.8",
        "icon": "🌐",
        "tagline": "Master both client-side React UIs and server-side APIs to build complete web applications.",
        "target_role": "Full Stack Web Developer",
        "estimated_weeks": "16 - 20 weeks",
        "overview": "Become an end-to-end web developer capable of building user interfaces, designing backend databases, and deploying web applications to production.",
        "capstone_project": "Build an End-to-End Enterprise Project Management Platform",
        "milestones": [
            {
                "id": "m1",
                "title": "1. Frontend Core",
                "description": "React, TypeScript, CSS layout systems, and client state.",
                "skills": ["React", "TypeScript", "HTML/CSS"],
                "topics_count": 45
            },
            {
                "id": "m2",
                "title": "2. Backend Core",
                "description": "FastAPI, REST endpoints, database schemas, and authentication.",
                "skills": ["FastAPI", "SQLite", "Auth"],
                "topics_count": 45
            },
            {
                "id": "m3",
                "title": "3. Deployment & Full Stack Delivery",
                "description": "Connecting client and server, deployment pipelines, CORS, and environment configs.",
                "skills": ["Vercel", "Render", "CI/CD"],
                "topics_count": 30
            }
        ]
    },
    {
        "id": 21,
        "slug": "mobile-engineer",
        "title": "Mobile Engineer",
        "category": "legacy",
        "rating": "⭐ 4.7",
        "icon": "📱",
        "tagline": "Create cross-platform mobile apps with React Native, Capacitor, and offline-first data sync.",
        "target_role": "Mobile Application Engineer",
        "estimated_weeks": "12 - 16 weeks",
        "overview": "Learn mobile development for Android & iOS. Master Capacitor, React Native, mobile touch ergonomics, push notifications, and local SQLite data sync.",
        "capstone_project": "Offline-First Native Android/iOS App with Local SQLite & Cloud Sync",
        "milestones": [
            {
                "id": "m1",
                "title": "1. Native Mobile Fundamentals",
                "description": "Android SDK, Gradle builds, app lifecycles, and permissions.",
                "skills": ["Android SDK", "Gradle", "Capacitor"],
                "topics_count": 35
            },
            {
                "id": "m2",
                "title": "2. Offline-First Sync & SQLite",
                "description": "Local SQLite storage, background push notifications, and offline queues.",
                "skills": ["SQLite", "Local Notifications", "Offline Sync"],
                "topics_count": 30
            }
        ]
    },
    {
        "id": 22,
        "slug": "devops-engineer",
        "title": "DevOps Engineer",
        "category": "legacy",
        "rating": "⭐ 4.8",
        "icon": "♾️",
        "tagline": "Automate CI/CD pipelines, containerize apps with Docker, and manage cloud infrastructure.",
        "target_role": "DevOps & Release Engineer",
        "estimated_weeks": "14 - 18 weeks",
        "overview": "Bridge development and IT operations. Master GitHub Actions CI/CD workflows, Docker containerization, Linux sysadmin, and infrastructure automation.",
        "capstone_project": "Zero-Downtime Automated CI/CD Deployment Pipeline for Multi-Service Web App",
        "milestones": [
            {
                "id": "m1",
                "title": "1. Linux SysAdmin & Scripting",
                "description": "Bash scripting, systemd, networking, SSH, and file permissions.",
                "skills": ["Linux", "Bash", "SSH", "Networking"],
                "topics_count": 40
            },
            {
                "id": "m2",
                "title": "2. Docker & CI/CD Workflows",
                "description": "Multi-stage Docker builds, GitHub Actions pipelines, and artifact caching.",
                "skills": ["Docker", "GitHub Actions", "CI/CD"],
                "topics_count": 42
            }
        ]
    },
    {
        "id": 23,
        "slug": "cloud-engineer",
        "title": "Cloud Engineer",
        "category": "legacy",
        "rating": "⭐ 4.8",
        "icon": "☁️",
        "tagline": "Architect resilient, multi-region cloud infrastructures on AWS, Azure, and Google Cloud.",
        "target_role": "Cloud Solutions Engineer",
        "estimated_weeks": "14 - 16 weeks",
        "overview": "Learn cloud infrastructure engineering across AWS and GCP. Master EC2, S3, IAM, Serverless functions, VPC networking, and Terraform IaC.",
        "capstone_project": "Multi-Region High-Availability Cloud Infrastructure with Terraform",
        "milestones": [
            {
                "id": "m1",
                "title": "1. Cloud Core & AWS Services",
                "description": "EC2, S3, RDS, IAM roles, Lambda, and VPC subnet architecture.",
                "skills": ["AWS", "IAM", "S3", "EC2", "VPC"],
                "topics_count": 42
            },
            {
                "id": "m2",
                "title": "2. Infrastructure as Code (Terraform)",
                "description": "Declarative cloud provisioning with Terraform modules and state management.",
                "skills": ["Terraform", "IaC", "CloudFormation"],
                "topics_count": 35
            }
        ]
    },
    {
        "id": 24,
        "slug": "data-engineer",
        "title": "Data Engineer",
        "category": "legacy",
        "rating": "⭐ 4.7",
        "icon": "🗄️",
        "tagline": "Build scalable data pipelines, data warehouses, and real-time ETL streaming systems.",
        "target_role": "Data Engineer",
        "estimated_weeks": "14 - 18 weeks",
        "overview": "Data is the lifeblood of modern tech. Learn Python, SQL, Apache Spark, Airflow orchestration, Snowflake data warehousing, and Kafka streaming.",
        "capstone_project": "Real-Time E-Commerce Streaming ETL Pipeline with Apache Kafka & Snowflake",
        "milestones": [
            {
                "id": "m1",
                "title": "1. SQL & Data Warehousing",
                "description": "Complex SQL analytical queries, dimensional modeling, and Snowflake/BigQuery.",
                "skills": ["SQL", "Snowflake", "Data Warehousing"],
                "topics_count": 40
            },
            {
                "id": "m2",
                "title": "2. ETL Pipelines & Airflow",
                "description": "Pipeline orchestration with Apache Airflow, DAG design, and data validation.",
                "skills": ["Airflow", "Python ETL", "Apache Spark"],
                "topics_count": 38
            }
        ]
    },
    {
        "id": 25,
        "slug": "machine-learning-engineer",
        "title": "Machine Learning Engineer",
        "category": "legacy",
        "rating": "⭐ 4.8",
        "icon": "📊",
        "tagline": "Train, evaluate, and deploy predictive ML models and deep neural networks to production.",
        "target_role": "Machine Learning Engineer",
        "estimated_weeks": "16 - 20 weeks",
        "overview": "Master machine learning fundamentals. Learn NumPy, Pandas, Scikit-Learn, PyTorch, model validation, feature stores, and MLOps deployment pipelines.",
        "capstone_project": "End-to-End Production ML Recommendation Engine with PyTorch & FastAPI",
        "milestones": [
            {
                "id": "m1",
                "title": "1. Python Data Science & ML Fundamentals",
                "description": "NumPy, Pandas, Matplotlib, regression, classification, and model evaluation.",
                "skills": ["Python", "NumPy", "Pandas", "Scikit-Learn"],
                "topics_count": 45
            },
            {
                "id": "m2",
                "title": "2. Deep Learning & Model Serving",
                "description": "PyTorch neural networks, loss functions, optimizers, and model deployment via API.",
                "skills": ["PyTorch", "Deep Learning", "Model Deployment"],
                "topics_count": 40
            }
        ]
    },
    {
        "id": 26,
        "slug": "cybersecurity-engineer",
        "title": "Cybersecurity Engineer",
        "category": "legacy",
        "rating": "⭐ 4.8",
        "icon": "🔒",
        "tagline": "Audit system vulnerabilities, enforce OWASP security controls, and perform penetration testing.",
        "target_role": "Cybersecurity & Application Security Engineer",
        "estimated_weeks": "14 - 18 weeks",
        "overview": "Learn how to defend applications and networks against cyber threats. Master network security, OWASP Top 10 vulnerabilities, cryptography, and intrusion detection.",
        "capstone_project": "Zero-Trust Application Security Audit & Intrusion Prevention Gateway",
        "milestones": [
            {
                "id": "m1",
                "title": "1. Network Security & Cryptography",
                "description": "TCP/IP, TLS/SSL, public-key cryptography, firewalls, and Wireshark log analysis.",
                "skills": ["Networking", "TLS", "Cryptography", "Wireshark"],
                "topics_count": 38
            },
            {
                "id": "m2",
                "title": "2. Application Security & Pentesting",
                "description": "SQL injection, XSS, CSRF, authentication flaws, and penetration testing tools.",
                "skills": ["OWASP Top 10", "SQLi/XSS Defense", "Pentesting"],
                "topics_count": 40
            }
        ]
    }
]

@router.get("/roadmaps")
async def get_all_roadmaps(category: Optional[str] = None):
    """Returns all 26 roadmaps, optionally filtered by category (ai_native, exclusive, legacy)."""
    if category:
        filtered = [r for r in ROADMAPS_DATA if r["category"] == category]
        return {"roadmaps": filtered, "total": len(filtered)}
    return {"roadmaps": ROADMAPS_DATA, "total": len(ROADMAPS_DATA)}

@router.get("/roadmaps/{slug}")
async def get_roadmap_by_slug(slug: str):
    """Returns a specific roadmap's detailed milestone breakdown and project specifications."""
    for r in ROADMAPS_DATA:
        if r["slug"] == slug:
            return r
    raise HTTPException(status_code=404, detail="Roadmap not found")
