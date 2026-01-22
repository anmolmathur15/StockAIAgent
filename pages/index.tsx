import { useEffect, useState } from "react";

interface NormalizedHolding {
  symbol: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  invested: number;
  current: number;
  pnl: number;
  weightPct: number;
}

interface PortfolioSnapshot {
  generatedAt: string;
  totals: {
    invested: number;
    current: number;
    pnl: number;
    pnlPct: number;
  };
  topHoldings: Array<{
    symbol: string;
    weightPct: number;
    current: number;
    pnl: number;
  }>;
  flags: Array<{
    type: string;
    message: string;
    symbol?: string;
    weightPct?: number;
  }>;
  holdings: NormalizedHolding[];
}

interface AiSummary {
  summaryBullets: string[];
  keyRisks: string[];
  observations: string[];
  suggestedNextChecks: string[];
  disclaimer: string;
}

const currency = (value: number) =>
  value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  });

export default function Home() {
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [aiSummary, setAiSummary] = useState<AiSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  const fetchSnapshot = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portfolio/snapshot");
      if (res.status === 401) {
        setNeedsAuth(true);
        setSnapshot(null);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load snapshot");
      }
      setSnapshot(data.snapshot);
      setNeedsAuth(false);
    } catch (err: any) {
      setError(err.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshot();
  }, []);

  const handleConnect = () => {
    window.location.href = "/api/zerodha/login";
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError(null);
    try {
      await fetch("/api/zerodha/logout");
      setSnapshot(null);
      setNeedsAuth(true);
      setAiSummary(null);
    } catch (err: any) {
      setError(err.message || "Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleGenerateAi = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/portfolio-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone: "concise" })
      });
      if (res.status === 401) {
        setNeedsAuth(true);
        setAiSummary(null);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate AI summary");
      }
      setSnapshot(data.snapshot);
      setAiSummary(data.ai);
    } catch (err: any) {
      setAiError(err.message || "Unexpected error");
    } finally {
      setAiLoading(false);
    }
  };

  const totals = snapshot?.totals || { invested: 0, current: 0, pnl: 0, pnlPct: 0 };
  const holdings = snapshot?.holdings || [];
  const topHoldings = snapshot?.topHoldings || [];
  const flags = snapshot?.flags || [];

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Zerodha Portfolio MVP</p>
          <h1>See your holdings in one glance.</h1>
          <p className="sub">Quick and dirty dashboard built with Next.js + Kite Connect.</p>
        </div>
        <div className="actions">
          <button className="primary" onClick={handleConnect}>Connect Zerodha</button>
          <button className="ghost" onClick={handleDisconnect} disabled={disconnecting}>
            {disconnecting ? "Disconnecting..." : "Disconnect"}
          </button>
          <button className="ghost" onClick={fetchSnapshot} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      {needsAuth && (
        <div className="notice">Not connected. Click "Connect Zerodha" to authenticate.</div>
      )}

      {error && <div className="error">{error}</div>}

      <section className="grid">
        <div className="card">
          <p className="label">Total Invested</p>
          <h2>{currency(totals.invested)}</h2>
        </div>
        <div className="card">
          <p className="label">Total Current</p>
          <h2>{currency(totals.current)}</h2>
        </div>
        <div className="card">
          <p className="label">Total P&L</p>
          <h2 className={totals.pnl >= 0 ? "good" : "bad"}>{currency(totals.pnl)}</h2>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Top Positions by Weight</h3>
        </div>
        {topHoldings.length === 0 ? (
          <p className="muted">No holdings yet.</p>
        ) : (
          <ul className="chips">
            {topHoldings.map((h) => (
              <li key={h.symbol} className="chip">
                <span className="symbol">{h.symbol}</span>
                <span className="muted">{h.weightPct.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Flags</h3>
          <p className="muted">Concentration warnings based on snapshot.</p>
        </div>
        {flags.length === 0 ? (
          <p className="muted">No alerts. Portfolio looks balanced.</p>
        ) : (
          <ul className="alerts">
            {flags.map((f, idx) => (
              <li key={idx}>
                <span className="symbol">{f.symbol || f.type}</span>
                <span>{f.message}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Holdings</h3>
          <p className="muted">Snapshot data fetched server-side</p>
        </div>
        {holdings.length === 0 ? (
          <p className="muted">No holdings to show.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Qty</th>
                  <th>Avg Price</th>
                  <th>Last Price</th>
                  <th>Invested</th>
                  <th>Current</th>
                  <th>P&L</th>
                  <th>Weight</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.symbol}>
                    <td>{h.symbol}</td>
                    <td>{h.quantity}</td>
                    <td>{currency(h.averagePrice)}</td>
                    <td>{currency(h.lastPrice)}</td>
                    <td>{currency(h.invested)}</td>
                    <td>{currency(h.current)}</td>
                    <td className={h.pnl >= 0 ? "good" : "bad"}>{currency(h.pnl)}</td>
                    <td>{h.weightPct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>AI Portfolio Summary</h3>
          <button className="primary" onClick={handleGenerateAi} disabled={aiLoading}>
            {aiLoading ? "Generating..." : "Generate AI Summary"}
          </button>
        </div>
        {aiError && <div className="error">{aiError}</div>}
        {!aiSummary && !aiLoading && <p className="muted">Click the button to generate an AI summary.</p>}
        {aiSummary && (
          <div className="ai-grid">
            <div>
              <h4>Summary</h4>
              <ul>{aiSummary.summaryBullets.map((s, i) => (<li key={i}>{s}</li>))}</ul>
            </div>
            <div>
              <h4>Key Risks</h4>
              <ul>{aiSummary.keyRisks.map((s, i) => (<li key={i}>{s}</li>))}</ul>
            </div>
            <div>
              <h4>Observations</h4>
              <ul>{aiSummary.observations.map((s, i) => (<li key={i}>{s}</li>))}</ul>
            </div>
            <div>
              <h4>Next Checks</h4>
              <ul>{aiSummary.suggestedNextChecks.map((s, i) => (<li key={i}>{s}</li>))}</ul>
            </div>
          </div>
        )}
        {aiSummary && <p className="muted disclaimer">{aiSummary.disclaimer}</p>}
      </section>

      <style jsx>{`
        :global(body) {
          margin: 0;
          font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: radial-gradient(circle at 20% 20%, #e8f1ff, #f7f9fc 55%);
          color: #0f172a;
        }
        .page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px 20px 60px;
        }
        .hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .eyebrow {
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 700;
          color: #2563eb;
          margin: 0 0 4px;
        }
        h1 {
          margin: 0;
          font-size: 28px;
        }
        .sub {
          margin: 4px 0 0;
          color: #475569;
        }
        .actions {
          display: flex;
          gap: 10px;
        }
        button {
          border: none;
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 15px;
          cursor: pointer;
          transition: transform 120ms ease, box-shadow 120ms ease;
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .primary {
          background: linear-gradient(120deg, #2563eb, #1d4ed8);
          color: white;
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.2);
        }
        .ghost {
          background: white;
          color: #0f172a;
          border: 1px solid #cbd5e1;
        }
        button:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .notice {
          background: #eef2ff;
          border: 1px solid #cbd5e1;
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 16px;
        }
        .error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecdd3;
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 16px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        .card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 16px;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);
        }
        .label {
          margin: 0 0 6px;
          color: #475569;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        h2 {
          margin: 0;
          font-size: 24px;
        }
        .good { color: #15803d; }
        .bad { color: #dc2626; }
        .panel {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 18px;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);
        }
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        h3 { margin: 0; }
        h4 { margin: 0 0 6px; }
        .muted {
          color: #64748b;
          margin: 0;
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 0;
          list-style: none;
          margin: 0;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
        }
        .symbol {
          font-weight: 700;
        }
        .alerts {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 8px;
        }
        .alerts li {
          display: flex;
          justify-content: space-between;
          padding: 10px 12px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 10px;
        }
        .table-wrapper {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          text-align: left;
          padding: 10px 8px;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
        }
        th {
          font-size: 13px;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        tr:hover td {
          background: #f8fafc;
        }
        .ai-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        .ai-grid ul {
          margin: 4px 0 0;
          padding-left: 18px;
        }
        .disclaimer {
          margin-top: 10px;
          font-size: 13px;
        }
        @media (max-width: 640px) {
          .hero { flex-direction: column; align-items: flex-start; }
          .actions { width: 100%; flex-wrap: wrap; }
          .actions button { flex: 1; }
        }
      `}</style>
    </div>
  );
}
