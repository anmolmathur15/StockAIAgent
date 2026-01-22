import type { NextApiHandler } from "next";
import { buildPortfolioSnapshotFromHoldings, fetchHoldingsFromRequest } from "../../../lib/portfolio";

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const holdings = await fetchHoldingsFromRequest(req);
    const snapshot = buildPortfolioSnapshotFromHoldings(holdings);
    return res.status(200).json({ snapshot });
  } catch (error: any) {
    const status = error?.message === "NOT_CONNECTED" ? 401 : 500;
    const message = status === 401 ? "Not connected" : "Failed to build snapshot";
    console.error("/api/portfolio/snapshot error", error);
    return res.status(status).json({ error: message });
  }
};

export default handler;
