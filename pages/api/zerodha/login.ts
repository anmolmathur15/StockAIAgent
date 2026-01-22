import type { NextApiHandler } from "next";
import { getKite } from "../../../lib/kite";

const handler: NextApiHandler = (_req, res) => {
  try {
    const kite = getKite();
    const loginUrl = kite.getLoginURL();
    res.redirect(302, loginUrl);
  } catch (error) {
    console.error("/api/zerodha/login error", error);
    res.status(500).json({ error: "Failed to create login URL" });
  }
};

export default handler;
