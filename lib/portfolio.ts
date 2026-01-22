import cookie from "cookie";
import type { NextApiRequest } from "next";
import { COOKIE_NAME, getKite } from "./kite";

export interface RawHolding {
  tradingsymbol: string;
  quantity: number;
  average_price: number;
  last_price?: number;
}

export interface NormalizedHolding {
  symbol: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  invested: number;
  current: number;
  pnl: number;
  weightPct: number;
}

export interface PortfolioTotals {
  invested: number;
  current: number;
  pnl: number;
  pnlPct: number;
}

export interface PortfolioFlag {
  type: string;
  message: string;
  symbol?: string;
  weightPct?: number;
}

export interface PortfolioSnapshot {
  generatedAt: string;
  totals: PortfolioTotals;
  topHoldings: Array<{
    symbol: string;
    weightPct: number;
    current: number;
    pnl: number;
  }>;
  flags: PortfolioFlag[];
  holdings: NormalizedHolding[];
}

export const fetchHoldingsFromRequest = async (req: NextApiRequest): Promise<RawHolding[]> => {
  const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
  const token = cookies[COOKIE_NAME];
  if (!token) {
    const error = new Error("NOT_CONNECTED");
    throw error;
  }

  const kite = getKite();
  kite.setAccessToken(token);
  return kite.getHoldings();
};

// Backwards compatibility (older routes)
export const fetchHoldingsWithCookie = fetchHoldingsFromRequest;

export const buildPortfolioSnapshotFromHoldings = (holdings: RawHolding[]): PortfolioSnapshot => {
  const normalized: NormalizedHolding[] = holdings.map((h) => {
    const lastPrice = h.last_price ?? 0;
    const invested = h.quantity * h.average_price;
    const current = h.quantity * lastPrice;
    const pnl = current - invested;
    return {
      symbol: h.tradingsymbol,
      quantity: h.quantity,
      averagePrice: h.average_price,
      lastPrice,
      invested,
      current,
      pnl,
      weightPct: 0
    };
  });

  const investedValue = normalized.reduce((sum, h) => sum + h.invested, 0);
  const currentValue = normalized.reduce((sum, h) => sum + h.current, 0);
  const pnlValue = currentValue - investedValue;
  const pnlPct = investedValue === 0 ? 0 : (pnlValue / investedValue) * 100;

  normalized.forEach((h) => {
    h.weightPct = currentValue === 0 ? 0 : (h.current / currentValue) * 100;
  });

  const sorted = [...normalized].sort((a, b) => b.current - a.current);
  const topHoldings = sorted.slice(0, 5).map((h) => ({
    symbol: h.symbol,
    weightPct: h.weightPct,
    current: h.current,
    pnl: h.pnl
  }));

  const flags: PortfolioFlag[] = [];
  sorted.forEach((h) => {
    if (h.weightPct > 30) {
      flags.push({
        type: "CONCENTRATION",
        symbol: h.symbol,
        weightPct: h.weightPct,
        message: `${h.symbol} exceeds 30% of portfolio (${h.weightPct.toFixed(1)}%)`
      });
    }
  });

  const top3Weight = sorted.slice(0, 3).reduce((sum, h) => sum + h.weightPct, 0);
  if (top3Weight > 70) {
    flags.push({
      type: "TOP3_CONCENTRATION",
      message: `Top 3 holdings account for ${top3Weight.toFixed(1)}% of portfolio`
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      invested: investedValue,
      current: currentValue,
      pnl: pnlValue,
      pnlPct
    },
    topHoldings,
    flags,
    holdings: sorted
  };
};
