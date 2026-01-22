import type { NextApiHandler } from "next";

const handler: NextApiHandler = (_req, res) => {
  res.status(200).json({
    ok: true,
    hasKiteKey: Boolean(process.env.KITE_API_KEY),
    hasKiteSecret: Boolean(process.env.KITE_API_SECRET),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY)
  });
};

export default handler;
