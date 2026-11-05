// 완료 화면 '7개의 점'용 공개 집계 — GET /api/count?round=2026-11 → { count }
// 답 내용·이름은 반환하지 않음.
module.exports = async (req, res) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) { res.status(500).json({ error: "server not configured" }); return; }
  const round = String((req.query && req.query.round) || "").slice(0, 20);
  if (!/^\d{4}-\d{2}$/.test(round)) { res.status(400).json({ error: "bad round" }); return; }
  const url = SUPABASE_URL + "/rest/v1/responses?select=participant_name&round=eq." + encodeURIComponent(round);
  const r = await fetch(url, { headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + SUPABASE_SERVICE_ROLE_KEY } });
  if (!r.ok) { res.status(502).json({ error: "supabase " + r.status }); return; }
  const rows = await r.json();
  const names = new Set(rows.map((x) => String(x.participant_name || "").trim()).filter(Boolean));
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=15");
  res.status(200).json({ count: names.size });
};
