// 진행자 대시보드 조회 (Vercel Node 함수) — 프로젝트 루트 api/ 에만 둔다.
// POST { pw, round } → 비밀번호가 맞으면 해당 ROUND 행 반환.
// 비밀번호: DASHBOARD_PASSWORD_<ROUND> (하이픈→밑줄) 우선, 없으면 DASHBOARD_PASSWORD.
// 예: ROUND=2026-11 → DASHBOARD_PASSWORD_2026_11 또는 DASHBOARD_PASSWORD
// 환경변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DASHBOARD_PASSWORD[_…]
const crypto = require("crypto");

function safeEqual(a, b) {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  if (x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
}

function passwordForRound(round) {
  const key = "DASHBOARD_PASSWORD_" + String(round || "").replace(/-/g, "_");
  return process.env[key] || process.env.DASHBOARD_PASSWORD || "";
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.status(405).json({ error: "method not allowed" }); return; }
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) { res.status(500).json({ error: "server not configured" }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const pw = (body && body.pw) || "";
  const round = String((body && body.round) || "").slice(0, 20);
  const expected = passwordForRound(round);
  if (!expected || !safeEqual(pw, expected)) {
    await new Promise((r) => setTimeout(r, 600));
    res.status(401).json({ error: "unauthorized" }); return;
  }
  const url = SUPABASE_URL + "/rest/v1/responses?select=*&order=created_at.desc" + (round ? "&round=eq." + encodeURIComponent(round) : "");
  const r = await fetch(url, { headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + SUPABASE_SERVICE_ROLE_KEY } });
  if (!r.ok) { res.status(502).json({ error: "supabase " + r.status }); return; }
  res.status(200).json({ rows: await r.json() });
};
