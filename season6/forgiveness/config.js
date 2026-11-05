/* 공개 설정 — anon 키만 넣는다. service_role 키는 절대 여기 넣지 말 것(Vercel 환경변수에만).
   값이 플레이스홀더 그대로면 앱은 '데모 모드'로 동작한다(제출 시 서버 저장 없이 완료 화면만). */
window.RC_CONFIG = {
  SUPABASE_URL: "https://rnymymhudnhpkujgmdsn.supabase.co",        // 예: https://xxxx.supabase.co
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJueW15bWh1ZG5ocGt1amdtZHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwODM4MTMsImV4cCI6MjEwNDY1OTgxM30.9klYvU0jec1QvNc0yBWm1alop4KSOjWPSxfqOMCjAo0",
  ROUND: "2026-11"
};
