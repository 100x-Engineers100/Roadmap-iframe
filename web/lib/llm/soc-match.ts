import { callLLM } from './provider';
import { validateSOCCode } from '@/lib/api/onet';
import type { SOCMatch } from '@/types';

const SYSTEM = `You are an occupational classification expert. Map user job descriptions
to O*NET SOC codes. Always return valid JSON. Never hallucinate SOC codes.
If uncertain, pick the closest reasonable match.`;

function buildUserPrompt(input: string): string {
  return `Map this job description to O*NET SOC codes:
"${input}"

Return exactly this JSON structure:
{
  "primary": { "soc_code": "XX-XXXX.XX", "title": "...", "confidence": 0.0-1.0 },
  "alternatives": [
    { "soc_code": "XX-XXXX.XX", "title": "..." }
  ]
}

Rules:
- SOC codes must be in format: XX-XXXX.XX
- Return 1-4 alternatives (fewer if no close matches)
- confidence 0.9+ = strong match, 0.6-0.89 = moderate, <0.6 = weak
- titles must be plain English occupation names`;
}

interface RawSOCMatch {
  soc_code: unknown;
  title: unknown;
  confidence?: unknown;
}

interface LLMSOCResponse {
  primary: RawSOCMatch;
  alternatives: RawSOCMatch[];
}

function isRawSOCMatch(val: unknown): val is RawSOCMatch {
  if (typeof val !== 'object' || val === null) return false;
  const obj = val as Record<string, unknown>;
  return typeof obj['soc_code'] === 'string' && typeof obj['title'] === 'string';
}

function parseResponse(raw: string): LLMSOCResponse {
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`SOC match: LLM returned invalid JSON: ${raw.slice(0, 200)}`);
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('SOC match: LLM response is not an object');
  }

  const obj = parsed as Record<string, unknown>;

  if (!isRawSOCMatch(obj['primary'])) {
    throw new Error('SOC match: missing or invalid primary field');
  }

  const alts = Array.isArray(obj['alternatives']) ? obj['alternatives'] : [];

  return {
    primary: obj['primary'] as RawSOCMatch,
    alternatives: alts.filter(isRawSOCMatch),
  };
}

async function validateAndMap(raw: RawSOCMatch, requireConfidence: true): Promise<SOCMatch | null>;
async function validateAndMap(raw: RawSOCMatch, requireConfidence: false): Promise<Omit<SOCMatch, 'confidence'> | null>;
async function validateAndMap(raw: RawSOCMatch, requireConfidence: boolean): Promise<SOCMatch | Omit<SOCMatch, 'confidence'> | null> {
  const socCode = raw.soc_code as string;
  const valid = await validateSOCCode(socCode);
  if (!valid) return null;

  if (requireConfidence) {
    const confidence = typeof raw.confidence === 'number' ? raw.confidence : 0.5;
    return { soc_code: socCode, title: raw.title as string, confidence };
  }

  return { soc_code: socCode, title: raw.title as string, confidence: 0 };
}

export async function socMatch(
  input: string
): Promise<SOCMatch & { alternatives: SOCMatch[] }> {
  if (!input.trim()) throw new Error('socMatch: input cannot be empty');

  const raw = await callLLM({
    system: SYSTEM,
    user: buildUserPrompt(input),
    maxTokens: 300,
    temperature: 0,
  });

  const parsed = parseResponse(raw);

  const primaryResult = await validateAndMap(parsed.primary, true);
  if (!primaryResult) {
    throw new Error(`SOC match: primary SOC ${parsed.primary.soc_code} failed O*NET validation`);
  }

  const altResults = await Promise.all(
    parsed.alternatives.map((a) => validateAndMap(a, false))
  );

  const alternatives: SOCMatch[] = altResults
    .filter((a): a is Omit<SOCMatch, 'confidence'> & { confidence: number } => a !== null)
    .map((a) => ({ ...a, confidence: 0 }));

  return { ...primaryResult, alternatives };
}
