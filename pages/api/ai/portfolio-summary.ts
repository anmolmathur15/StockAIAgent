import type { NextApiHandler } from "next";
import { buildPortfolioSnapshotFromHoldings, fetchHoldingsFromRequest } from "../../../lib/portfolio";
import { generatePortfolioSummary } from "../../../lib/gemini";

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const tone = req.body?.tone === "detailed" ? "detailed" : "concise";

  try {
    const holdings = await fetchHoldingsFromRequest(req);
    const snapshot = buildPortfolioSnapshotFromHoldings(holdings);
    const ai = await generatePortfolioSummary(snapshot, tone);
    return res.status(200).json({ snapshot, ai });
  } catch (error: any) {
    const status = error?.message === "NOT_CONNECTED" ? 401 : 500;
    const message = status === 401 ? "Not connected" : "Failed to generate summary";
    console.error("/api/ai/portfolio-summary error", error);
    return res.status(status).json({ error: message });
  }
};

export default handler;
