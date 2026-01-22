import type { NextApiHandler } from "next";
import { fetchHoldingsFromRequest } from "../../../lib/portfolio";

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const holdings = await fetchHoldingsFromRequest(req);
    return res.status(200).json({ holdings });
  } catch (error: any) {
    const status = error?.message === "NOT_CONNECTED" ? 401 : 500;
    const message = status === 401 ? "Not connected" : "Failed to fetch holdings";
    console.error("/api/zerodha/holdings error", error);
    return res.status(status).json({ error: message });
  }
};

export default handler;
