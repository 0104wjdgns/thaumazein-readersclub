/* ============================================================
   리더스클럽 웹 발제문 — 참가자 화면
   흐름: 표지 → 이름 선택 → (질문 → 자료)×6 → 제출 → 완료(7개의 점)
   - 질문에 답을 써야 그 질문의 자료(인용 카드)가 열린다.
   - 초안은 '이름별'로 이 기기(localStorage)에 자동 저장.
   - 제출마다 Supabase에 새 행 insert(anon INSERT만 허용). 마지막 제출이 최종.
   - config.js가 플레이스홀더면 데모 모드: 서버 저장 없이 완료 화면까지 동작.
   ============================================================ */
(function () {
  "use strict";

  var CFG = window.RC_CONFIG || {};
  var T = window.RC_TOPIC;
  var ROUND = CFG.ROUND || T.round;
  var STORE = "rc-" + ROUND;
  var QS = T.questions;
  var NQ = QS.length;
  var TOTAL = T.names.length;

  function isPlaceholder(v) { return !v || /YOUR_|xxxx|placeholder/i.test(v); }
  var LIVE = !isPlaceholder(CFG.SUPABASE_URL) && !isPlaceholder(CFG.SUPABASE_ANON_KEY);
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 주제 색 적용 (테마 변수는 이 두 개뿐)
  var root = document.documentElement;
  root.style.setProperty("--theme-main", T.theme.main);
  root.style.setProperty("--theme-deep", T.theme.main);
  root.style.setProperty("--theme-sub", T.theme.sub);
  var metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute("content", T.theme.main);

  // 스텝
  var STEPS = [{ t: "cover" }, { t: "names" }];
  QS.forEach(function (q, i) { STEPS.push({ t: "q", i: i }); STEPS.push({ t: "m", i: i }); });
  STEPS.push({ t: "done" });
  var LAST = STEPS.length - 1;

  var state = { name: "", answers: {} };
  var seen = {};
  var idx = 0;
  var app = document.getElementById("app");

  // ---------- 저장 ----------
  function draftKey(name) { return STORE + "-" + encodeURIComponent(name); }
  function loadDraft(name) {
    try { var s = JSON.parse(localStorage.getItem(draftKey(name)) || "null"); return (s && s.answers) || {}; }
    catch (e) { return {}; }
  }
  function hasDraft(name) {
    var a = loadDraft(name);
    return Object.keys(a).some(function (k) { return (a[k] || "").trim(); });
  }
  function save() {
    if (!state.name) return;
    try { localStorage.setItem(draftKey(state.name), JSON.stringify({ answers: state.answers, at: Date.now() })); } catch (e) {}
  }
  function submittedLocal() {
    try { return JSON.parse(localStorage.getItem(STORE + "-submitted") || "[]"); } catch (e) { return []; }
  }
  function markSubmittedLocal(name) {
    var s = submittedLocal(); if (s.indexOf(name) < 0) s.push(name);
    try { localStorage.setItem(STORE + "-submitted", JSON.stringify(s)); } catch (e) {}
  }

  // ---------- DOM ----------
  function n(tag, props, kids) {
    var e = document.createElement(tag);
    if (props) for (var k in props) {
      var v = props[k];
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k === "html") e.innerHTML = v;
      else if (k === "onclick") e.addEventListener("click", v);
      else if (k === "style") e.setAttribute("style", v);
      else if (v === true) e.setAttribute(k, "");
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function delay(el, s) { el.style.animationDelay = s + "s"; return el; }
  function autoGrow(ta) { ta.style.height = "auto"; ta.style.height = Math.max(ta.scrollHeight + 2, 152) + "px"; }
  // 진행도 → 바탕색: 깊은 남보라(밤)에서 새벽빛 크림으로
  var SKY = [[0,"#1c1a3d"],[0.22,"#262857"],[0.42,"#4a4677"],[0.58,"#8c7593"],[0.72,"#cfa99f"],[0.86,"#eed7c4"],[1,"#f6f0e6"]];
  function hex(h) { return [1,3,5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function skyAt(p) {
    for (var i = 1; i < SKY.length; i++) {
      if (p <= SKY[i][0]) {
        var a = SKY[i-1], b = SKY[i], t = (p - a[0]) / (b[0] - a[0]), ca = hex(a[1]), cb = hex(b[1]);
        return ca.map(function (v, k) { return Math.round(v + (cb[k] - v) * t); });
      }
    }
    return hex(SKY[SKY.length-1][1]);
  }
  function setProgress(p) {
    p = Math.max(0, Math.min(1, p));
    root.style.setProperty("--p", String(p));
    var c = skyAt(p), lum = (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
    root.style.setProperty("--sky", "rgb(" + c.join(",") + ")");
    document.body.classList.toggle("dark", lum < 0.55);
    var mt = document.querySelector('meta[name="theme-color"]'); if (mt) mt.setAttribute("content", "rgb(" + c.join(",") + ")");
  }
  function secText(q) { return q.num === "n" ? "n." : q.num + "_"; }

  // ---------- 전환 (화면이 바뀔 때만 움직인다) ----------
  function go(i) {
    var next = Math.max(0, Math.min(LAST, i));
    if (REDUCED) { idx = next; render(); return; }
    app.classList.add("leaving");
    setTimeout(function () { idx = next; render(); }, 190);
  }
  function render() {
    app.innerHTML = ""; app.className = "app";
    document.body.classList.toggle("is-cover", STEPS[idx].t === "cover");
    window.scrollTo(0, 0);
    var s = STEPS[idx];
    if (s.t === "cover") return renderCover();
    if (s.t === "names") return renderNames();
    if (s.t === "q") return renderQuestion(s.i);
    if (s.t === "m") return renderMaterial(s.i);
    return renderDone();
  }

  function topbar(label) {
    var bar = n("span"); bar.style.transform = "scaleX(" + (idx - 1) / (LAST - 1) + ")";
    return n("div", { class: "topbar" }, [
      n("div", { class: "topbar-row" }, [
        n("span", { class: "topbar-title", text: T.titleShort }),
        n("span", { class: "topbar-count", text: label })
      ]),
      n("div", { class: "bar" }, [bar])
    ]);
  }

  // ============ 1. 표지 ============
  function renderCover() {
    setProgress(0);
    app.className = "app full";
    var titleHtml = esc(T.title).replace(/용서$/, "<em>용서</em>");
    var lines = n("p", { class: "cover-core" });
    var t0 = 1.45, gap = 0.55;
    T.coreQuestionLines.forEach(function (l, i) { lines.appendChild(delay(n("span", { class: "line rise", text: l }), t0 + i * gap)); });
    var footDelay = t0 + T.coreQuestionLines.length * gap + 0.3;

    var cover = n("section", { class: "cover", role: "button", tabindex: "0", "aria-label": "발제문 시작하기" }, [
      n("div", { class: "cover-inner" }, [
        delay(n("div", { class: "cover-mast rise" }, [
          n("p", { class: "eyebrow", text: T.club + " · " + T.monthLabel }),
          n("span", { class: "cover-word", text: "Thaumazein" })
        ]), 0.1),
        delay(n("h1", { class: "cover-title rise", html: titleHtml }), 0.35),
        delay(n("hr", { class: "cover-rule draw" }), 0.95),
        delay(n("p", { class: "eyebrow cover-core-label rise", text: "핵심 질문" }), 1.15),
        lines
      ]),
      delay(n("div", { class: "cover-foot rise" }, [
        n("span", { text: "스크롤하거나 눌러서 시작" }),
        n("span", { class: "cover-chev", "aria-hidden": "true" })
      ]), footDelay)
    ]);
    app.appendChild(cover);

    var started = false, touchY = null;
    function start() {
      if (started) return; started = true; cleanup();
      if (REDUCED) { idx = 1; render(); return; }
      cover.classList.add("exit");
      setTimeout(function () { idx = 1; render(); }, 650);
    }
    function onWheel(e) { if (e.deltaY > 8) start(); }
    function onKey(e) { if (["Enter", " ", "ArrowDown", "PageDown"].indexOf(e.key) >= 0) { e.preventDefault(); start(); } }
    function onTs(e) { touchY = e.touches[0].clientY; }
    function onTm(e) { if (touchY != null && touchY - e.touches[0].clientY > 30) start(); }
    function cleanup() {
      window.removeEventListener("wheel", onWheel); window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTs); window.removeEventListener("touchmove", onTm);
    }
    cover.addEventListener("click", start);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTs, { passive: true });
    window.addEventListener("touchmove", onTm, { passive: true });
  }

  // ============ 이름 선택 ============
  function renderNames() {
    setProgress(0.04);
    var grid = n("div", { class: "name-grid" });
    T.names.forEach(function (nm, i) {
      var b = n("button", { class: "name-btn rise", onclick: function () {
        state.name = nm; state.answers = loadDraft(nm); go(2);
      } }, [nm + "님"]);
      if (hasDraft(nm)) b.appendChild(n("span", { class: "has-draft", text: "작성 중인 답 있음" }));
      grid.appendChild(delay(b, 0.35 + i * 0.05));
    });
    app.appendChild(n("div", { class: "names-head" }, [
      delay(n("p", { class: "eyebrow rise", text: T.club + " · " + T.monthLabel }), 0),
      delay(n("h1", { class: "rise", text: T.title }), 0.08),
      delay(n("hr", { class: "rule draw" }), 0.2),
      delay(n("p", { class: "names-intro rise", text: T.intro }), 0.25)
    ]));
    app.appendChild(delay(n("p", { class: "eyebrow pick-label rise", text: "당신의 이름을 선택해 주세요" }), 0.3));
    app.appendChild(grid);
    app.appendChild(n("div", { class: "nav" }, [
      n("button", { class: "btn-ghost", text: "← 표지로", onclick: function () { go(0); } }), n("span")
    ]));
  }

  // ============ 2. 질문 ============
  function renderQuestion(qi) {
    var q = QS[qi];
    var key = "q" + qi;
    var instant = REDUCED || seen[key];
    seen[key] = true;
    if (instant) app.classList.add("instant");
    setProgress(0.1 + 0.9 * (qi / (NQ - 1)) * 0.92);

    app.appendChild(topbar("질문 " + (q.num === "n" ? "n" : q.num) + " / " + NQ));

    var sec = n("h2", { class: "sec" }, [ n("span", { class: "sec-num", text: secText(q) }), n("span", { class: "sec-label", text: q.label }) ]);
    var rule = delay(n("hr", { class: "sec-rule draw" }), 0.95);
    var bg = delay(n("p", { class: "bg-text fade-in", text: q.background }), 1.0);

    var qText = n("p", { class: "q-text" });
    var words = q.q.split(/\s+/);
    var w0 = 1.45, step = Math.min(0.06, 1.6 / words.length);
    words.forEach(function (w, i) {
      qText.appendChild(delay(n("span", { class: "w", text: w }), w0 + i * step));
      if (i < words.length - 1) qText.appendChild(document.createTextNode(" "));
    });
    var afterWords = w0 + words.length * step + 0.25;
    qText.setAttribute("aria-label", q.q);

    var ta = n("textarea", { class: "answer", rows: "5", placeholder: "떠오르는 생각을 자유롭게 적어 주세요.", "aria-label": "질문 " + q.num + " 답변" });
    ta.value = state.answers[q.key] || "";
    var saveState = n("div", { class: "save-state" }, [ n("span", { text: ta.value ? "이 기기에 저장돼 있어요" : "쓰는 대로 이 기기에 자동 저장돼요" }), n("span", { text: ta.value.length ? ta.value.length + "자" : "" }) ]);
    var nudge = n("p", { class: "nudge", text: "먼저 당신의 생각을 한 줄이라도 적어 주세요. 답을 남기면 자료가 열려요." });
    nudge.style.display = "none";
    var saveTimer;
    ta.addEventListener("input", function () {
      state.answers[q.key] = ta.value; autoGrow(ta); nudge.style.display = "none";
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        save();
        var d = new Date();
        saveState.firstChild.textContent = "자동 저장됨 · " + d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");
        saveState.lastChild.textContent = ta.value.length ? ta.value.length + "자" : "";
      }, 350);
    });

    var block = delay(n("div", { class: "fade-in" }, [ta, saveState, nudge]), afterWords);
    var nav = delay(n("div", { class: "nav fade-in" }, [
      n("button", { class: "btn-ghost", text: "← 뒤로", onclick: function () { go(idx - 1); } }),
      n("button", { class: "btn-primary", text: "답 남기고 자료 열기", onclick: function () {
        if (!(state.answers[q.key] || "").trim()) { nudge.style.display = "block"; ta.focus(); return; }
        save(); go(idx + 1);
      } })
    ]), afterWords);

    app.appendChild(sec);
    app.appendChild(rule);
    app.appendChild(bg);
    app.appendChild(delay(n("div", { class: "q-wrap fade-in" }, [ n("p", { class: "q-mark", text: "Q." }), qText ]), 1.3));
    app.appendChild(block);
    app.appendChild(nav);
    setTimeout(function () { autoGrow(ta); }, 0);

    // 섹션 번호: 화면 가운데에서 크게 → 제자리로 작아지며 안착 (FLIP)
    if (!instant) {
      var r = sec.getBoundingClientRect();
      var ss = Math.min(1.9, (window.innerWidth * 0.82) / Math.max(r.width, 1));
      var sx = (window.innerWidth - r.width * ss) / 2 - r.left;
      var sy = window.innerHeight * 0.38 - r.top - (r.height * ss) / 2;
      sec.style.setProperty("--ss", ss.toFixed(3));
      sec.style.setProperty("--sx", sx.toFixed(1) + "px");
      sec.style.setProperty("--sy", sy.toFixed(1) + "px");
      sec.classList.add("enter");
    }
  }

  // ============ 3. 자료 (인용 카드) ============
  function renderMaterial(qi) {
    var q = QS[qi];
    var m = q.material;
    var key = "m" + qi;
    var instant = REDUCED || seen[key];
    seen[key] = true;
    if (instant) app.classList.add("instant");
    setProgress(0.1 + 0.9 * (qi / (NQ - 1)) * 0.92 + 0.04);
    var isLast = qi === NQ - 1;

    app.appendChild(topbar("질문 " + (q.num === "n" ? "n" : q.num) + " · 곁에 두는 한 문장"));
    app.appendChild(n("div", { class: "m-head" }, [
      n("p", { class: "eyebrow m-eyebrow", text: "곁에 두는 한 문장" }),
      n("p", { class: "m-intro", text: "방금 남긴 생각 옆에, 이 질문과 어울리는 격언 하나를 놓아 둘게요." })
    ]));

    var paper = n("article", { class: "paper" + (instant ? "" : " unfold") });
    if (!m || m.pending || !m.quote) {
      paper.appendChild(n("span", { class: "pending-badge", text: "자료 준비 중" }));
      paper.appendChild(n("div", { class: "ph-line", style: "width:92%" }));
      paper.appendChild(n("div", { class: "ph-line", style: "width:80%" }));
      paper.appendChild(n("div", { class: "ph-line", style: "width:60%" }));
    } else {
      paper.appendChild(n("div", { class: "quote-mark", "aria-hidden": "true", text: "“" }));
      paper.appendChild(n("blockquote", { class: "quote", text: m.quote }));
      var late = n("div", { class: "late" });
      if (m.original) {
        var rtl = /[\u0590-\u05FF]/.test(m.original);
        late.appendChild(n("p", { class: "quote-orig", dir: rtl ? "rtl" : null, lang: rtl ? "he" : null, text: m.original }));
      }
      late.appendChild(n("div", { class: "quote-by" }, [
        n("p", { class: "quote-author", text: m.author }),
        n("p", { class: "quote-work", text: m.work })
      ]));
      if (m.note) late.appendChild(n("p", { class: "quote-note", text: m.note }));
      paper.appendChild(late);
    }
    app.appendChild(n("div", { class: "paper-stage" }, [paper]));

    app.appendChild(delay(n("div", { class: "nav fade-in" }, [
      n("button", { class: "btn-ghost", text: "← 내 답 보기", onclick: function () { go(idx - 1); } }),
      n("button", { class: "btn-primary", text: isLast ? "제출하기" : "다음 질문 →", onclick: function () {
        if (isLast) submit(); else go(idx + 1);
      } })
    ]), instant ? 0 : 1.0));
  }

  // ============ 제출 ============
  function payload() {
    var a = state.answers, p = { round: ROUND, participant_name: state.name };
    QS.forEach(function (q) { var v = (a[q.key] || "").trim(); p[q.key] = v.length ? v : null; });
    return p;
  }
  function submit() {
    if (!LIVE) { markSubmittedLocal(state.name); go(LAST); return; }
    app.classList.add("leaving");
    setTimeout(function () {
      app.innerHTML = ""; app.className = "app";
      app.appendChild(n("div", { class: "done" }, [ n("h1", { text: "제출하는 중…" }) ]));
    }, 190);
    fetch(CFG.SUPABASE_URL + "/rest/v1/responses", {
      method: "POST",
      headers: { apikey: CFG.SUPABASE_ANON_KEY, Authorization: "Bearer " + CFG.SUPABASE_ANON_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(payload())
    }).then(function (res) {
      if (!res.ok) return res.text().then(function (t) { throw new Error("HTTP " + res.status + " " + t); });
      markSubmittedLocal(state.name); go(LAST);
    }).catch(renderError);
  }
  function renderError(e) {
    app.innerHTML = ""; app.className = "app";
    app.appendChild(n("div", { class: "done" }, [
      n("h1", { text: "제출에 실패했어요" }),
      n("p", { class: "closing", text: "잠시 뒤 다시 시도해 주세요. 작성한 답은 이 기기에 그대로 저장돼 있어요." }),
      n("p", { class: "error", text: String(e && e.message ? e.message : e) }),
      n("div", { class: "nav", style: "justify-content:center" }, [ n("button", { class: "btn-primary", text: "다시 제출", onclick: submit }) ])
    ]));
  }

  // ============ 5. 완료 ============
  function getCount(cb) {
    var demoParam = new URLSearchParams(location.search).get("demoCount");
    if (!LIVE) {
      var c = demoParam ? parseInt(demoParam, 10) : submittedLocal().length;
      cb(Math.max(1, Math.min(TOTAL, c || 1)), "demo"); return;
    }
    fetch("/api/count?round=" + encodeURIComponent(ROUND)).then(function (r) {
      if (!r.ok) throw new Error(r.status); return r.json();
    }).then(function (d) { cb(Math.max(1, Math.min(TOTAL, d.count | 0)), "live"); })
      .catch(function () { cb(1, "unknown"); });
  }
  function renderDone() {
    setProgress(1);
    var dots = n("div", { class: "dots", role: "img", "aria-label": "답한 인원" });
    var dotEls = [];
    for (var i = 0; i < TOTAL; i++) { var d = n("span", { class: "dot" }); dotEls.push(d); dots.appendChild(d); }
    var caption = n("p", { class: "dots-caption", text: "함께한 사람을 세는 중…" });
    var tag = n("span", { class: "demo-tag" }); tag.style.display = "none";

    app.appendChild(n("div", { class: "done" }, [
      delay(n("p", { class: "eyebrow rise", text: state.name ? state.name + " 님" : "" }), 0),
      delay(n("h1", { class: "rise", text: "답을 잘 받았어요" }), 0.1),
      delay(n("div", { class: "rise" }, [dots]), 0.3),
      caption, tag,
      delay(n("p", { class: "closing rise", text: T.closing }), 0.6),
      delay(n("div", { class: "plus-n rise", text: T.plusN }), 0.75),
      delay(n("div", { class: "keep rise" }, [
        n("p", { class: "eyebrow keep-label", text: "간직하기" }),
        n("div", { class: "keep-btns" }, [
          n("button", { class: "btn-keep", text: "주제와 질문 저장", onclick: function () { window.RCSheets && window.RCSheets.download("questions"); } }),
          n("button", { class: "btn-keep", text: "격언 모음 저장", onclick: function () { window.RCSheets && window.RCSheets.download("quotes"); } })
        ])
      ]), 0.82),
      delay(n("div", { class: "nav rise", style: "justify-content:center" }, [
        n("button", { class: "btn-ghost", text: "← 내 답 다시 보기 · 수정", onclick: function () { go(2); } })
      ]), 0.9),
      n("p", { class: "notice", text: "다시 제출하면 마지막에 제출한 답이 최종 답으로 반영돼요." })
    ]));

    getCount(function (count, mode) {
      caption.innerHTML = "7명 중 <b>" + count + "명</b>이 답을 남겼어요";
      caption.setAttribute("aria-label", TOTAL + "명 중 " + count + "명이 답을 남겼어요");
      if (mode !== "live") {
        tag.style.display = "inline-block";
        tag.textContent = mode === "demo" ? "데모 모드 · 이 기기 기준 표시(실제 집계 아님)" : "집계를 불러오지 못했어요 · 내 답만 표시";
      }
      dotEls.forEach(function (d, i) {
        if (i >= count) return;
        setTimeout(function () { d.classList.add("on"); }, REDUCED ? 0 : 700 + i * 260);
      });
    });
  }

  render();
})();
