# 타우마제인 리더스클럽 — Claude / 에이전트 안내

이 파일은 `thaumazein-readersclub` 루트에 둔다. 새 달 발제문을 만들거나 기존 페이지를 손볼 때 **먼저 읽는다**.
디자인 규격은 `season6/forgiveness/DESIGN.md`, 운영·배포는 `README.md`. 이 파일은 그 위에 **매번 지킬 품질 규칙**을 더한다.

## 1. 한 줄 원칙

- 카테고리 하나 = GitHub 레포 하나 = Vercel 프로젝트 하나. 새 달은 `season6/<slug>/` 하위 폴더 + 허브 `index.html` 카드.
- 서버 함수는 루트 `api/`에만. Supabase는 `config.js`에 **anon 키만**. service_role 키는 Vercel 환경변수에만 둔다. 시크릿을 코드·문서·커밋에 적지 않는다.
- 에고너츠(`egonuts-stack-app`, 기기 저장 + 카드 덱)와 코드를 섞지 않는다.
- 참고 구현: `season6/forgiveness/` (표지 rise/draw · 질문 번호 FLIP + 단어 등장 · 종이 unfold · 진행 바탕 · 완료 점).

## 2. 새 달 레시피

1. `season6/forgiveness/` → `season6/<slug>/` 복사.
2. `assets/topic.js`: round, monthLabel, title, theme(main·sub), coreQuestionLines, intro, names, questions[], closing. `plusN`은 그대로.
3. `config.js`의 `ROUND`를 같은 값(YYYY-MM)으로.
4. `app.js`의 `SKY` 스톱을 테마 main(밤) → sub(새벽) → `#f6f0e6`로 다시 정한다. 아래 **3. 대비 확인**을 꼭 거친다.
5. 자료 문장은 출처를 확인하고 `QUOTES.md`에 URL과 함께 기록.
6. OG: 1200×630 `og.png` + og 메타 (DESIGN.md §7).
7. 허브 `index.html`에 카드 추가, README 표에 행 추가.
8. 로컬에서 320·375px, 데스크톱, 가로 화면으로 확인 → `main` 푸시 → 라이브 확인 (아래 5).

## 3. 자체 점검 (배포 전에 반드시)

- **글자 대비 계산:** 각 화면의 진행도(질문 `0.1 + 0.9·(i/(N-1))·0.92`, 자료 +0.04 등 `setProgress` 값)에서 바탕색을 계산해, 본문·흐린 글·포인트 글자가 WCAG **4.5:1 이상**인지 숫자로 본다. 중간 밝기 색(흰 글자도 검은 글자도 대비가 모자란 색)은 화면이 걸리지 않는 진행도 사이로 몰아 둔다. 질문 수가 바뀌면 다시 계산한다.
- 밝은 바탕 위 테마 포인트 글자(라벨·번호)도 4.5:1 이상. 모자라면 페이지 글자만 한 톤 짙게.
- 첫 화면이 어두운 표지면 `body` 기본 바탕도 어둡게 둔다 (스크립트가 돌기 전 크림색이 번쩍이지 않게).
- FLIP은 움직일 **글자 자체의 폭**으로 크기를 잰다. 줄 전체(block)로 재면 휴대폰에서 커지지 않고 데스크톱에서 가운데를 벗어난다.
- 애니메이션은 Web Animations로 중간 프레임을 멈춰서 확인한다 (종이 unfold, 번호 FLIP).
- 문단(`p`)에 `aria-label`을 붙이지 않는다.

## 4. 휴대폰 UI/UX (기본 적용)

- **뒤로가기 = 이전 단계:** 단계마다 `history.pushState({ step, prev })`. 화면의 "← 뒤로"도 직전 단계면 `history.back()`으로 되감아 두 뒤로가기가 엇갈리지 않게 한다. `popstate`에서 그 단계를 그린다. 새로고침하면 `history.state`의 단계에서 이어서. `history.scrollRestoration = "manual"`.
- **하단 고정 이동 버튼:** 질문·자료 화면의 뒤로/다음은 `.nav.dock { position: sticky; bottom: 0 }` (+ safe-area 패딩, 위쪽 그라데이션 경계). 터치 기기에서 입력칸 포커스 중엔 `position: static`으로 내려 키보드 위에 뜨지 않게. `html { scroll-padding-bottom: 96px }`.
- **터치 영역:** 버튼 높이 44~48px 이상. 주 버튼("답 남기고 자료 열기", "다음 질문")은 눈에 띄는 색 둥근 버튼.
- **입력:** 입력칸은 1초 안에 나타나게 (단어 등장이 끝날 때까지 기다리게 하지 않는다). 글자 크기 16px 이상 (iOS 확대 방지). 자동 저장 표시 "자동 저장됨 · 시:분 · N자" 유지. 답이 비었는데 다음을 누르면 안내와 함께 입력칸으로 스크롤.
- **문구:** 터치 기기면 표지 안내를 "밀어 올리거나 눌러서 시작"으로.

## 5. 배포 · 공유

- `main` 푸시 = Vercel 자동 배포. 푸시 뒤 커밋의 파일과 라이브 파일 sha256을 대조해 확인한다.
- GitHub 커밋 상태에 Vercel 기록이 아예 없으면 Vercel이 커밋을 못 받은 것이다. 이때 **Redeploy는 예전 커밋을 다시 빌드할 뿐**이라 새 변경이 안 들어간다. 최신 커밋으로 새 배포를 걸고, 반복되면 Vercel Settings → Git에서 GitHub 연결을 다시 잇는다.
- 카톡 미리보기를 바꾸면 **og:image 주소에도 `?v=N`**을 붙인다 (카톡은 이미지 주소도 따로 캐시한다). 공유 링크는 페이지 주소 `?v=N+1`.

## 6. 만지지 말 것

- 다른 달 폴더를 요청 없이 같이 바꾸지 않는다.
- 외부 9월 프로젝트(`readers-club-selfishness.vercel.app`)는 허브 링크만 유지.
- 제출·대시보드·`/api` 동작을 깨지 않는다.

같은 규칙이 `egonuts-stack-app/CLAUDE.md`에도 있다 (구현 예: `egonuts-stack-app/on-suffering/`).
