import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export type LLMProvider = "anthropic" | "openai";

export interface LLMCallParams {
  system: string;
  user: string;
  maxTokens: number;
  temperature: number;
}

const ANTHROPIC_MODEL = "claude-sonnet-4-6";
const OPENAI_MODEL = "gpt-4o";

function getProvider(): LLMProvider {
  const p = process.env.LLM_PROVIDER;
  if (p === "openai") return "openai";
  return "anthropic";
}

export async function callLLM(params: LLMCallParams): Promise<string> {
  const provider = getProvider();

  if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key || key === "REPLACE_ME") throw new Error("OPENAI_API_KEY not set");
    const client = new OpenAI({ apiKey: key });
    const res = await client.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: params.temperature,
      max_tokens: params.maxTokens,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
    });
    const content = res.choices[0]?.message?.content;
    if (!content) throw new Error("OpenAI returned empty content");
    return content;
  }

  // default: anthropic
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === "REPLACE_ME") throw new Error("ANTHROPIC_API_KEY not set");
  const client = new Anthropic({ apiKey: key });
  const res = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: params.maxTokens,
    temperature: params.temperature,
    system: params.system,
    messages: [{ role: "user", content: params.user }],
  });
  const block = res.content[0];
  if (block.type !== "text") throw new Error("Anthropic returned non-text block");
  return block.text;
}
