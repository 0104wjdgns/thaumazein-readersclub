/* 공개 설정 — anon 키만 넣는다. service_role 키는 절대 여기 넣지 말 것(Vercel 환경변수에만).
   값이 플레이스홀더 그대로면 앱은 '데모 모드'로 동작한다(제출 시 서버 저장 없이 완료 화면만). */
window.RC_CONFIG = {
  SUPABASE_URL: "YOUR_SUPABASE_URL",        // 예: https://xxxx.supabase.co
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY",
  ROUND: "2026-11"
};
