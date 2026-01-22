import type { NextApiHandler } from "next";
import cookie from "cookie";
import { COOKIE_NAME, getKite, requireSecrets } from "../../../lib/kite";

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const requestToken = req.query.request_token;
  if (!requestToken || typeof requestToken !== "string") {
    return res.status(400).json({ error: "Missing request_token" });
  }

  try {
    const apiSecret = requireSecrets();
    const kite = getKite();
    const session = await kite.generateSession(requestToken, apiSecret);
    const accessToken = session?.access_token;
    if (!accessToken) {
      throw new Error("Kite did not return access_token");
    }

    res.setHeader(
      "Set-Cookie",
      cookie.serialize(COOKIE_NAME, accessToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/"
      })
    );

    return res.redirect(302, "/");
  } catch (error) {
    console.error("/api/zerodha/callback error", error);
    return res.status(500).json({ error: "Failed to exchange request_token" });
  }
};

export default handler;
