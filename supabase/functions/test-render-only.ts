import { renderRoadmapSVG } from "./_shared/svg-renderer.ts";
import type { RoadmapJSON } from "./_shared/roadmap-schema.ts";

const mock: RoadmapJSON = {
  roadmap_title: "AI Agents Engineering Roadmap for Beginners",
  target_outcome: "Build, deploy, and maintain robust AI agents using ReAct loops, multi-agent systems, guardrails, and production infrastructure.",
  generated_at: "2024-06-15T00:00:00Z",
  week_cards: [
    {
      week: 1, month: 1,
      theme: "Agent Fundamentals and ReAct Loop",
      tools: ["n8n", "SerpApi", "LangChain"],
      topics: [
        "Agent definition: augmented LLM feedback loop",
        "SPAORL loop: Sense, Plan, Act, Observe, Reflect, Adapt",
        "ReAct pattern: Thought, Action, Observation triplet",
        "Stop conditions: max iterations and goal achievement",
        "Tool definition in system prompt importance",
        "Manual ReAct loop implementation in n8n",
        "State management per iteration in agents",
      ],
      mini_project: "Manual ReAct agent in n8n that searches the web and synthesizes a structured report",
      capability_checkpoint: "Can you build a ReAct loop from scratch, explain SPAORL, and identify which step broke when the agent loops?",
    },
    {
      week: 2, month: 1,
      theme: "Multi-Agent Systems and Tool Calling",
      tools: ["n8n", "LangChain", "CrewAI", "LangGraph"],
      topics: [
        "Six multi-agent patterns and selection rules",
        "Pattern selection decision rules",
        "Programmatic tool calling with orchestrator environment",
        "LLM for intent only in tool calling",
        "Context pollution and token accumulation problem",
        "OpenAI Swarm for handoff and routing",
      ],
      mini_project: "2-agent system (Researcher + Writer) using Handoff pattern",
      capability_checkpoint: "Can you select the correct multi-agent pattern for a given task and explain the cost of context pollution?",
    },
    {
      week: 3, month: 1,
      theme: "Guardrails, Evals, and Production Safety",
      tools: ["LlamaGuard", "G-Eval", "DeepEval"],
      topics: [
        "When and when not to use agents",
        "LlamaGuard input filtering and train categories",
        "Intent classification as a guardrail",
        "AI identification and anonymization pipeline",
        "Semantic similarity evaluation options",
        "Evaluation metrics: correctness, hallucination, roundtrip performance",
      ],
      mini_project: "Agent with LlamaGuard input filter and G-Eval evaluation harness",
      capability_checkpoint: "Can you implement guardrail stack with three layers and evaluate agent output for hallucination?",
    },
    {
      week: 4, month: 1,
      theme: "Agent Deployment and Production Pillars",
      tools: ["FastAPI", "Supabase", "LangSmith"],
      topics: [
        "Five production pillars: Patterns, Tracing, Debugging, Fixes",
        "Session memory vs working memory vs knowledge base",
        "LangSmith tracing for LLM calls and tools",
        "Cost optimization limits under testing and live mode",
        "Combining Iteration limits under testing and live mode",
        "Integrating Diffusion, LLM and Agents",
      ],
      mini_project: "Deploy FastAPI agent API endpoint with session memory, error handling and live tests",
      capability_checkpoint: "Can you deploy an agent with production pillars: tracing, session memory, error handling, and cost control?",
    },
  ],
  month_cards: [
    {
      month: 2,
      theme: "Full-Stack LLM Development",
      week_breakdowns: [
        { week_label: "Wk 1", topics: ["REST API design", "FastAPI async endpoints", "Domain routing", "System design"] },
        { week_label: "Wk 2", topics: ["PostgreSQL schema design", "Supabase storage", "RAG pipeline", "Vector search"] },
        { week_label: "Wk 3", topics: ["Prompt chaining", "Function calling", "MCP protocol", "Chain-of-thought"] },
        { week_label: "Wk 4", topics: ["Monitoring", "Redis caching", "Production deployment", "Load testing"] },
      ],
      mini_project: "Full RAG chatbot with persistent conversation history, tool calling and MCP integration",
    },
    {
      month: 3,
      theme: "Advanced AI Agents Production",
      week_breakdowns: [
        { week_label: "Wk 1", topics: ["Agent fundamentals", "ReAct loop dive", "State management", "Pattern design"] },
        { week_label: "Wk 2", topics: ["Multi-agent systems", "Advanced tool calling", "Content position", "Guardrails"] },
        { week_label: "Wk 3", topics: ["Specification", "LlamaGuard in-depth classification", "Risk matrices"] },
        { week_label: "Wk 4", topics: ["Agent deployment", "Production observability", "Tracing and debugging", "Cost control"] },
      ],
      mini_project: "Production-grade multi-agent system with guardrails, tracing, session memory, monitoring and cost optimization",
    },
  ],
  milestone_tracker: [
    {
      month: 1,
      label: "Month 1 – AI Agents Foundations",
      milestones: [
        "Built manual ReAct agent in n8n with web search and structured report synthesis",
        "Developed 2-agent system using Handoff pattern with context pollution handling",
        "Implemented guardrail stack with LlamaGuard and G-Eval evaluation harness",
      ],
    },
    {
      month: 2,
      label: "Month 2 – Full-Stack LLM Application",
      milestones: [
        "Designed and deployed FastAPI REST API with async endpoints and domain routing",
        "Built MVP chatbot with persistent Supabase storage and RAG pipeline",
        "Implemented multi-tool LLM app with MCP protocol and chain-of-thought",
      ],
    },
    {
      month: 3,
      label: "Month 3 – Production AI Agent Deployment",
      milestones: [
        "Deployed ReAct agent API with tracing, session memory, and cost controls",
        "Built multi-agent system with guardrails and production monitoring",
        "Established production monitoring with LangSmith and cost optimization",
      ],
    },
  ],
  coaching_note: "Focus on mastering the ReAct loop and state management early — these are critical for all advanced patterns.",
  summary: "A practical 3-month roadmap focused on building AI agents with emphasis on agent design and production deployment.",
};

console.log("Rendering SVG...");
const svg = renderRoadmapSVG(mock);
const outPath = "C:\\Users\\visha\\Downloads\\Roadmap iframe\\supabase\\functions\\test-output.svg";
await Deno.writeTextFile(outPath, svg);
console.log(`SVG saved → ${outPath} (${svg.length} chars)`);
