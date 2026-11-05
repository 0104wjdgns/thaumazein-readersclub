# 타우마제인 리더스클럽 — 웹 발제문 허브

카테고리 하나 = Vercel 프로젝트 하나. 주제는 하위 폴더.

| 주소 | 주제 | 비고 |
|---|---|---|
| `/` | 허브(목차) | 이 저장소 |
| `/season6/forgiveness/` | 6기 11월 · 관계 속 감정의 해소와 용서 | 이 저장소 · Supabase |
| `/season6/forgiveness/dashboard.html` | 진행자 대시보드 | 비밀번호 |
| (외부) https://readers-club-selfishness.vercel.app/ | 6기 9월 · 사랑과 이기심 | **기존 프로젝트 유지** · 허브에서만 링크 |

## 폴더
```
index.html                 허브 목차 (크림 종이 · 세리프)
assets/hub.css
api/responses.js           대시보드 조회 (루트 api/ 만 Vercel이 인식)
api/count.js               완료 화면 인원 수
supabase_setup.sql         테이블·RLS (9월 재사용 시 q5 컬럼만 추가해도 됨)
season6/forgiveness/           11월 발제문
  index.html · config.js · dashboard.html
  assets/{topic.js, app.js, style.css, dashboard.js}
  DESIGN.md · QUOTES.md
```

Vercel 서버 함수는 **프로젝트 루트 `api/`** 에만 둔다. 주제 폴더 안의 `/api` 호출은 루트로 향한다.

## 배포 (정훈님이 직접)
1. GitHub에 `thaumazein-readersclub` 저장소 새로 만들고 이 폴더 push.
2. Vercel에서 Import (Framework: Other, 빌드 없음).
3. Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DASHBOARD_PASSWORD` (공통 기본값)
   - (선택) `DASHBOARD_PASSWORD_2026_11` — 11월만 다른 비밀번호. 없으면 공통값 사용.
4. `season6/forgiveness/config.js`에 9월과 같은 `SUPABASE_URL`·**anon 키**, `ROUND: "2026-11"`.
5. Supabase: 9월 테이블 재사용 시 `alter table public.responses add column if not exists q5 text;` (또는 `supabase_setup.sql` 전체).
6. 배포 확인 → 테스트 제출 → 대시보드 → 테스트 행 삭제.

## 비밀번호 규칙
`api/responses.js`는 회차별 환경변수를 먼저 본다.
- ROUND `2026-11` → `DASHBOARD_PASSWORD_2026_11` (하이픈을 밑줄로)
- 없으면 `DASHBOARD_PASSWORD`

## 로컬
```
python3 -m http.server 5180
```
→ http://localhost:5180/ · http://localhost:5180/season6/forgiveness/
(`/api`는 Vercel에서만 동작. config가 자리표시자면 데모 모드.)

## 새 달 주제 추가
1. `season6/<slug>/` 폴더를 만들고 `topic.js`·테마색·config ROUND만 바꾼다.
2. 허브 `index.html`에 링크 한 줄.
3. (선택) `DASHBOARD_PASSWORD_<ROUND>` 환경변수.
