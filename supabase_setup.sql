-- ============================================================
-- 리더스클럽 웹 발제문 — Supabase 설정 (9월과 같은 테이블 계약)
-- · 9월 프로젝트를 재사용한다면: 이 파일을 다시 돌릴 필요 없음. ROUND만 '2026-11'로 바꾸면 된다.
--   (11월은 q1~q6만 쓰고 q5_1/q5_2는 비워 둔다)
-- · 새 Supabase 프로젝트라면: SQL Editor에 통째로 붙여넣고 RUN.
-- ============================================================
create table if not exists public.responses (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  round            text not null,
  participant_name text not null,
  q1 text, q2 text, q3 text, q4 text,
  q5_1 text, q5_2 text,   -- 9월(2문항형 Q5) 호환용
  q5 text,                -- 11월: 5_나와 타인에게 다른 기준
  q6 text                 -- 11월: n. 용서는 누구를 위한 것인가
);
alter table public.responses add column if not exists q5 text;   -- 9월 테이블에 없던 컬럼 추가(재사용 시 필요)
create index if not exists responses_round_idx on public.responses (round, created_at desc);

alter table public.responses enable row level security;

-- 참가자(anon 키): INSERT만. SELECT/UPDATE/DELETE 정책 없음 → 공개 키로 남의 답을 읽거나 지울 수 없음.
drop policy if exists "anon can insert responses" on public.responses;
create policy "anon can insert responses" on public.responses for insert to anon with check (true);
-- 열람·집계는 service_role 키를 쓰는 서버 함수(/api/responses, /api/count)로만.
