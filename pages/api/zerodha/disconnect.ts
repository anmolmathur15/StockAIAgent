import type { NextApiHandler } from "next";
import cookie from "cookie";
import { ACCESS_TOKEN_COOKIE } from "../../../lib/kite";

const handler: NextApiHandler = (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader(
    "Set-Cookie",
    cookie.serialize(ACCESS_TOKEN_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: new Date(0)
    })
  );

  return res.status(200).json({ ok: true });
};

export default handler;
