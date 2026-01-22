import { KiteConnect } from "kiteconnect";

export const COOKIE_NAME = "kite_access_token";

export const getKite = () => {
  const apiKey = process.env.KITE_API_KEY;
  if (!apiKey) {
    throw new Error("KITE_API_KEY is missing. Set it in your environment.");
  }
  return new KiteConnect({ api_key: apiKey });
};

export const requireSecrets = () => {
  const apiSecret = process.env.KITE_API_SECRET;
  if (!apiSecret) {
    throw new Error("KITE_API_SECRET is missing. Set it in your environment.");
  }
  return apiSecret;
};
