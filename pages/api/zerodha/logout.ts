import type { NextApiHandler } from "next";
import cookie from "cookie";
import { COOKIE_NAME } from "../../../lib/kite";

const handler: NextApiHandler = (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader(
    "Set-Cookie",
    cookie.serialize(COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0
    })
  );

  return res.status(200).json({ ok: true });
};

export default handler;
