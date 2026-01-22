import { GoogleGenerativeAI } from "@google/generative-ai";
import { PortfolioSnapshot } from "./portfolio";

export interface PortfolioSummaryResult {
  summaryBullets: string[];
  keyRisks: string[];
  observations: string[];
  suggestedNextChecks: string[];
  disclaimer: string;
}

// Using the current fast model alias; update here if Google changes naming again.
const DEFAULT_MODEL = "gemini-3-flash-preview";

const fallback = (): PortfolioSummaryResult => ({
  summaryBullets: ["Unable to parse AI response."],
  keyRisks: [],
  observations: [],
  suggestedNextChecks: [],
  disclaimer: "Informational only. Not investment advice."
});

const cleanJson = (text: string): string => {
  const trimmed = text.trim();
  const noFence = trimmed.replace(/```json/gi, "").replace(/```/g, "");
  return noFence;
};

export const generatePortfolioSummary = async (
  snapshot: PortfolioSnapshot,
  tone: "concise" | "detailed" = "concise"
): Promise<PortfolioSummaryResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Set it in your environment.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

  const prompt = `You are an analytical assistant. Analyze the Zerodha portfolio snapshot and return STRICT JSON only.\nRules:\n- Do NOT provide investment advice or directives (no buy/sell/hold).\n- Base statements strictly on provided numbers (totals, topHoldings, flags, weights).\n- Tone: ${tone}.\n- Output JSON ONLY with keys: summaryBullets (string[], 4-8 items), keyRisks (string[]), observations (string[]), suggestedNextChecks (string[]), disclaimer (string).`;

  const input = `${prompt}\n\nSNAPSHOT:\n${JSON.stringify(snapshot, null, 2)}`;

  const result = await model.generateContent(input);
  const text = result.response.text();

  try {
    const parsed = JSON.parse(cleanJson(text)) as PortfolioSummaryResult;
    // basic shape guard
    if (!parsed || typeof parsed !== "object") {
      return fallback();
    }
    return {
      summaryBullets: parsed.summaryBullets || [],
      keyRisks: parsed.keyRisks || [],
      observations: parsed.observations || [],
      suggestedNextChecks: parsed.suggestedNextChecks || [],
      disclaimer: parsed.disclaimer || "Informational only. Not investment advice."
    };
  } catch (_) {
    return fallback();
  }
};
