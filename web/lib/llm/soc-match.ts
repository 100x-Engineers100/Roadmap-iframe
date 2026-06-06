import { callLLM } from './provider';
import { validateSOCCode } from '@/lib/api/onet';
import type { SOCMatch } from '@/types';

const SYSTEM = `You are an occupational classification expert. Map user job descriptions
to O*NET SOC codes. Always return valid JSON. Only use SOC codes from the verified list below.

VERIFIED O*NET SOC CODES (use only these — no others):
Management: 11-1011.00 (Chief Executives), 11-1021.00 (General and Operations Managers), 11-2021.00 (Marketing Managers), 11-2022.00 (Sales Managers), 11-3021.00 (Computer and Information Systems Managers), 11-3031.00 (Financial Managers), 11-9199.00 (Managers All Other)
Product/Project: 13-1082.00 (Project Management Specialists), 15-1299.09 (IT Project Managers)
Engineering/Tech: 15-1211.00 (Computer Systems Analysts), 15-1251.00 (Computer Programmers), 15-1252.00 (Software Developers), 15-1299.00 (Computer Occupations All Other), 17-2141.00 (Mechanical Engineers), 17-2051.00 (Civil Engineers)
Business/Finance: 13-1111.00 (Management Analysts), 13-1161.00 (Market Research Analysts), 13-2011.00 (Accountants and Auditors), 13-1071.00 (Human Resources Specialists)
Sales: 41-3031.00 (Securities Sales Agents), 41-4011.00 (Sales Representatives Technical), 41-9031.00 (Sales Engineers)
Design/Media: 27-1024.00 (Graphic Designers), 27-3041.00 (Editors), 27-3042.00 (Technical Writers)
Education: 25-2021.00 (Elementary Teachers), 25-2031.00 (Secondary Teachers), 25-1099.00 (Postsecondary Teachers)

IMPORTANT for Product Manager roles: use 13-1082.00 (Project Management Specialists) as primary.`;

// Raw-text keyword fallback — returns a known-good SOC when LLM validation fails.
const RAW_TEXT_FALLBACKS: Array<{ pattern: RegExp; soc_code: string; title: string }> = [
  { pattern: /product\s*manager|product\s*lead|product\s*owner|pm\b/i, soc_code: '13-1082.00', title: 'Project Management Specialists' },
  { pattern: /program\s*manager|project\s*manager/i,                   soc_code: '13-1082.00', title: 'Project Management Specialists' },
  { pattern: /software\s*(engineer|developer|dev)|full[\s-]?stack|backend|frontend/i, soc_code: '15-1252.00', title: 'Software Developers' },
  { pattern: /data\s*scientist|machine\s*learning|ml\s*engineer/i,     soc_code: '15-1299.00', title: 'Computer Occupations, All Other' },
  { pattern: /market(ing|er)|growth\s*hacker|content\s*creator/i,      soc_code: '11-2021.00', title: 'Marketing Managers' },
  { pattern: /sales|account\s*executive|business\s*development/i,      soc_code: '41-3031.00', title: 'Securities, Commodities, and Financial Services Sales Agents' },
  { pattern: /design(er)?|ux|ui\b/i,                                   soc_code: '27-1024.00', title: 'Graphic Designers' },
];

function buildUserPrompt(input: string): string {
  return `Map this job description to O*NET SOC codes (use only verified codes from the system prompt):
"${input}"

Return exactly this JSON structure:
{
  "primary": { "soc_code": "XX-XXXX.XX", "title": "...", "confidence": 0.0-1.0 },
  "alternatives": [
    { "soc_code": "XX-XXXX.XX", "title": "..." }
  ]
}

Rules:
- SOC codes must be in format: XX-XXXX.XX and must come from the verified list above
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

function getRawTextFallback(input: string): (SOCMatch & { alternatives: SOCMatch[] }) | null {
  for (const { pattern, soc_code, title } of RAW_TEXT_FALLBACKS) {
    if (pattern.test(input)) {
      return { soc_code, title, confidence: 0.6, alternatives: [] };
    }
  }
  return null;
}

export async function socMatch(
  input: string
): Promise<SOCMatch & { alternatives: SOCMatch[] }> {
  if (!input.trim()) throw new Error('socMatch: input cannot be empty');

  const raw = await callLLM({
    system: SYSTEM,
    user: buildUserPrompt(input),
    maxTokens: 400,
    temperature: 0,
  });

  const parsed = parseResponse(raw);

  // Try primary first
  let primaryResult = await validateAndMap(parsed.primary, true);

  // Primary failed — try alternatives in order before giving up
  if (!primaryResult && parsed.alternatives.length > 0) {
    for (const alt of parsed.alternatives) {
      const altResult = await validateAndMap(alt, true);
      if (altResult) {
        primaryResult = altResult;
        break;
      }
    }
  }

  // All LLM codes failed — fall back to raw-text keyword match
  if (!primaryResult) {
    const fallback = getRawTextFallback(input);
    if (fallback) return fallback;
    throw new Error(`SOC match: no valid O*NET code found for input. Try being more specific about your role and industry.`);
  }

  const altResults = await Promise.all(
    parsed.alternatives.map((a) => validateAndMap(a, false))
  );

  const alternatives: SOCMatch[] = altResults
    .filter((a): a is Omit<SOCMatch, 'confidence'> & { confidence: number } => a !== null)
    .map((a) => ({ ...a, confidence: 0 }));

  return { ...primaryResult, alternatives };
}
