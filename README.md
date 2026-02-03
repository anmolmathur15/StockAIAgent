# StockAIAgent

MVP to view your Zerodha (Kite Connect) holdings locally. Frontend and backend live in one Next.js app.

## Features
- Zerodha OAuth flow via Kite Connect
- Stores `access_token` in an HttpOnly cookie (session only)
- Fetches holdings from Kite and shows a lightweight dashboard
- Portfolio summary, top weights, and concentration alerts (>30%)

## Prerequisites
- Node.js 18+
- Zerodha Kite Connect API key + secret

## Environment
Copy `.env.example` to `.env.local` and fill in your credentials:
```
KITE_API_KEY=your_api_key
KITE_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```
> Never commit real credentials.

## Redirect URL (important)
Set this URL in your Kite Connect app settings:
```
http://localhost:3000/api/zerodha/callback
```

## Run locally
```
npm install
cp .env.example .env.local
npm run dev
```
Then open http://localhost:3000.

## Quick start (with nvm)
```
nvm use   # will read .nvmrc (Node 20)
npm install
cp .env.example .env.local
npm run dev
```

## Flow
1. Click **Connect Zerodha** → redirects to Kite login using your API key.
2. Zerodha redirects back to `/api/zerodha/callback` with `request_token`.
3. We exchange it for an `access_token`, set it in an HttpOnly cookie, then return to `/`.
4. The frontend calls `/api/portfolio/snapshot` (server-side holdings + analytics) and renders the dashboard.
5. You can POST to `/api/ai/portfolio-summary` to get a Gemini-generated structured summary (uses the server-side snapshot, never your token).

## Security Caveats
- Stores the access token in a plain HttpOnly cookie; no encryption or refresh handling.
- No database, no multi-user separation, no CSRF protections beyond SameSite=Lax.
- Intended for local use only; do not deploy as-is to production.

## API routes
- `GET /api/zerodha/login` → redirects to Kite login URL.
- `GET /api/zerodha/callback?request_token=...` → exchanges token, sets cookie, redirects home.
- `GET /api/zerodha/holdings` → returns holdings JSON; 401 if not connected.
- `GET /api/zerodha/logout` → clears the session cookie.
- `GET /api/portfolio/snapshot` → deterministic analytics built server-side from Kite holdings.
- `POST /api/ai/portfolio-summary` → calls Gemini on the server with the snapshot; returns structured JSON summary.

## Notes
- All logic is in TypeScript; no external DB.
- AI summaries are informational only, not investment advice.
- If holdings or snapshot fetch fails, the UI shows a red error banner and clears data.
