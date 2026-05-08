"use client";

import { renderRoadmapFragment, type RoadmapJSON } from "@/lib/roadmap-renderer";

const sample: RoadmapJSON = {
  version: "4.0",
  roadmap_title: "AI Engineer: APIs to Production Agents",
  generated_at: new Date().toISOString(),
  user_profile: {
    name: "Vishal Sharma",
    goal: "Become an AI engineer",
    background_role: "Frontend Developer",
    experience_years: "3 years",
    weak_areas: ["RAG", "Agents", "Backend"],
    hours_per_week: "10-12 hours",
    learning_style: "Project-based",
    timeframe_months: 3,
  },
  summary:
    "A 3-month sprint from REST APIs to production-grade AI agents, starting with FastAPI and LLM tool calling before moving into multi-agent orchestration and production observability.",
  target_outcome:
    "Build and deploy a multi-agent AI system with memory, tracing, and tool use",
  spine_nodes: [
    {
      order: 1,
      title: "LLM API Fundamentals",
      left_cluster: {
        label: "Concepts",
        topics: [
          "HTTP Verbs & CRUD",
          "System Prompt Structure",
          "JSON Schema Output",
          "Token Limits",
          "Env Secrets Pattern",
          "Async Request Handling",
        ],
      },
      right_cluster: {
        label: "Build",
        topics: [
          "FastAPI Routing",
          "OpenAI Chat API",
          "Pydantic BaseModel",
          "Uvicorn Dev Server",
          "Railway Deployment",
          "Structured JSON Endpoint",
        ],
      },
      checkpoint:
        "Can you build a FastAPI endpoint that calls GPT-4o with a custom system prompt and returns structured JSON, deployed on Railway?",
    },
    {
      order: 2,
      title: "Tool Calling & MCP",
      left_cluster: {
        label: "Concepts",
        topics: [
          "Tool Schema Design",
          "Dual-Call Pattern",
          "tool_choice Modes",
          "MCP Stateless Protocol",
          "Context Pollution",
          "Description Quality",
        ],
      },
      right_cluster: {
        label: "Build",
        topics: [
          "JSON Tool Definition",
          "3-Tool ReAct Agent",
          "MCP Server Setup",
          "Claude SDK Tool Use",
          "Parallel Tool Calls",
        ],
      },
      checkpoint:
        "Can you implement the dual-call tool calling pattern and explain why description quality affects tool reliability in production?",
    },
    {
      order: 3,
      title: "RAG Architecture",
      left_cluster: {
        label: "Concepts",
        topics: [
          "Chunk Strategy",
          "Vector Embeddings",
          "Cosine Similarity",
          "BM25 Hybrid Search",
          "Cross-Encoder Reranking",
          "Query Expansion",
        ],
      },
      right_cluster: {
        label: "Build",
        topics: [
          "Supabase pgvector",
          "MTEB Leaderboard",
          "HyDE Expansion",
          "Agentic Multi-Hop RAG",
          "Pinecone Index",
        ],
      },
      sub_branches: [
        {
          title: "RAG Level 1",
          topics: [
            "Fixed-size chunking with 50-token overlap",
            "sentence-transformers: all-MiniLM-L6-v2 baseline",
            "pgvector cosine similarity search query",
          ],
        },
        {
          title: "RAG Level 2",
          topics: [
            "BM25 sparse + dense vector hybrid fusion",
            "Cross-encoder re-ranking: BGE-reranker-base",
            "Query expansion with HyDE (hypothetical doc embeddings)",
          ],
        },
        {
          title: "RAG Level 3",
          topics: [
            "Agentic RAG: LLM decides when to re-query",
            "Multi-hop retrieval for complex reasoning chains",
            "Memory RAG: persistent context across sessions",
          ],
        },
      ],
      checkpoint:
        "Can you explain why BM25 + vector hybrid outperforms pure vector search on keyword-heavy queries, and implement it in Supabase?",
    },
    {
      order: 4,
      title: "Production GenAI Stack",
      left_cluster: {
        label: "Concepts",
        topics: [
          "Supabase RLS Policies",
          "Langfuse Tracing",
          "SSE Streaming",
          "Rate Limiting",
          "Model Cost Tiering",
          "anon vs service_role",
        ],
      },
      right_cluster: {
        label: "Build",
        topics: [
          "Next.js + FastAPI",
          "Langfuse SDK Wrappers",
          "SSE StreamingResponse",
          "MVP Ship Cycle",
          "Supabase Auth",
        ],
      },
      checkpoint:
        "Can you wire Langfuse tracing to capture every LLM call, tool use, and cost metric in a full-stack Next.js + FastAPI app?",
    },
    {
      order: 5,
      title: "ReAct Agent Patterns",
      left_cluster: {
        label: "Concepts",
        topics: [
          "ReAct Pattern",
          "SPAORL Loop",
          "Max Iteration Stops",
          "State Per Iteration",
          "95% Rule",
          "Augmented LLM Definition",
        ],
      },
      right_cluster: {
        label: "Build",
        topics: [
          "Manual n8n ReAct Loop",
          "Bare-Metal Agent (No Framework)",
          "Tool Schema in System Prompt",
          "Programmatic Orchestration",
        ],
      },
      checkpoint:
        "Can you implement a ReAct agent from scratch (no framework) with proper stop conditions and demonstrate it completing a 3-step research task?",
    },
    {
      order: 6,
      title: "Multi-Agent Orchestration",
      left_cluster: {
        label: "Concepts",
        topics: [
          "6 Multi-Agent Patterns",
          "Pattern Selection Rules",
          "Handoff & Routing",
          "Parallelization Pattern",
          "Evaluator-Optimizer Loop",
          "Token Accumulation Risk",
        ],
      },
      right_cluster: {
        label: "Build",
        topics: [
          "Manager-Worker System",
          "OpenAI Swarm Handoff",
          "Claude Agent SDK",
          "Parallel Sub-Agents",
          "State Persistence",
        ],
      },
      checkpoint:
        "Can you build a multi-agent research system using Manager-Worker pattern where Orchestrator delegates to Researcher, Writer, and Critic agents with state persistence?",
    },
    {
      order: 7,
      title: "Production Agent Hardening",
      left_cluster: {
        label: "Concepts",
        topics: [
          "LlamaGuard Guardrails",
          "Intent Classification Layer",
          "PII Anonymization Pipeline",
          "LLM-as-Judge Eval",
          "50 QA Pairs Ground Truth",
          "Deterministic Safety Layer",
        ],
      },
      right_cluster: {
        label: "Build",
        topics: [
          "Langfuse Sessions API",
          "50-Pair Eval Harness",
          "Serverless Agent Deploy",
          "Max Iteration Controls",
          "Sentry Error Tracing",
        ],
      },
      checkpoint:
        "Can you deploy a production agent with LlamaGuard guardrails, full Langfuse tracing, and an eval harness that scores hallucination rate on 50 QA pairs?",
    },
  ],
  coaching_note:
    "You have frontend instincts — use them. Ship fast, trace everything, measure before optimizing. Agents fail at the tool definition layer first; get that right before building orchestration.",
};

export default function RoadmapPreviewPage() {
  const fragment = renderRoadmapFragment(sample);
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: fragment }}
    />
  );
}
