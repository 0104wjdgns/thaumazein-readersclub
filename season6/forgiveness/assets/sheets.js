/* 완료 화면에서 내려받는 이미지 두 장: ① 주제와 질문 목록 ② 격언 모음
   브라우저 캔버스로 그려 PNG로 저장한다. 서버·DB 없음. */
(function () {
  var T = window.RC_TOPIC;
  var W = 1080, PAD = 96, INNER = W - PAD * 2, SCALE = 2;
  var C = {
    paper: "#f6f0e6", ink: "#1d1b19", soft: "#4a4741", faint: "#8a857e", hair: "#e1d9cc",
    main: T.theme.main, sub: T.theme.sub
  };
  var SERIF = '"Noto Serif KR", serif', SANS = '"Noto Sans KR", sans-serif';

  function wrap(ctx, text, maxW) {
    var out = [];
    String(text).split("\n").forEach(function (para) {
      var words = para.split(/\s+/).filter(Boolean), line = "";
      words.forEach(function (w) {
        var test = line ? line + " " + w : w;
        if (ctx.measureText(test).width <= maxW) { line = test; return; }
        if (line) out.push(line);
        // 한 단어가 한 줄보다 길면 글자 단위로 자른다
        line = "";
        Array.from(w).forEach(function (ch) {
          if (ctx.measureText(line + ch).width > maxW) { out.push(line); line = ch; } else line += ch;
        });
      });
      out.push(line);
    });
    return out;
  }

  // ops: 높이를 먼저 재고(measure), 그다음 같은 순서로 그린다(draw)
  function layout(ctx, blocks) {
    var y = PAD, ops = [];
    blocks.forEach(function (b) {
      if (b.gap) { y += b.gap; return; }
      if (b.rule) { ops.push({ rule: b.rule, y: y, w: b.w || 72, color: b.color || C.sub, h: b.h || 3 }); y += (b.h || 3); return; }
      ctx.font = b.font;
      var lines = wrap(ctx, b.text, b.maxW || INNER);
      lines.forEach(function (ln) {
        ops.push({ text: ln, font: b.font, color: b.color, x: PAD + (b.indent || 0), y: y + b.size });
        y += b.size * (b.lh || 1.6);
      });
    });
    return { ops: ops, h: y + PAD };
  }

  function draw(blocks, filename) {
    var probe = document.createElement("canvas").getContext("2d");
    var L = layout(probe, blocks);
    var cv = document.createElement("canvas");
    cv.width = W * SCALE; cv.height = Math.ceil(L.h) * SCALE;
    var ctx = cv.getContext("2d");
    ctx.scale(SCALE, SCALE);
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, L.h);
    ctx.fillStyle = C.main; ctx.fillRect(0, 0, W, 10);              // 위쪽 주제색 띠
    ctx.textBaseline = "alphabetic";
    L.ops.forEach(function (o) {
      if (o.rule) { ctx.fillStyle = o.color; ctx.fillRect(o.rule === "full" ? PAD : PAD, o.y, o.rule === "full" ? INNER : o.w, o.h); return; }
      ctx.font = o.font; ctx.fillStyle = o.color; ctx.fillText(o.text, o.x, o.y);
    });
    cv.toBlob(function (blob) {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    }, "image/png");
  }

  function head(sub) {
    return [
      { text: T.club + " · " + T.monthLabel, font: "500 26px " + SANS, size: 26, color: C.faint, lh: 1.4 },
      { gap: 28 },
      { text: T.titleShort, font: "500 60px " + SERIF, size: 60, color: C.ink, lh: 1.3 },
      { gap: 18 },
      { text: sub, font: "400 30px " + SERIF, size: 30, color: C.main, lh: 1.5 },
      { gap: 40 }, { rule: "short", w: 72 }, { gap: 56 }
    ];
  }
  function foot() {
    return [{ gap: 24 }, { rule: "full", color: C.hair, h: 1 }, { gap: 28 },
      { text: "(재)타우마제인 인문철학재단 · 리더스클럽", font: "400 24px " + SANS, size: 24, color: C.faint, lh: 1.4 }];
  }
  function secLabel(q) { return (q.num === "n" ? "n." : q.num + "_") + " " + q.label; }

  function questionsSheet() {
    var b = head("주제와 질문");
    b.push({ text: "핵심 질문", font: "500 24px " + SANS, size: 24, color: C.sub, lh: 1.5 });
    b.push({ gap: 10 });
    b.push({ text: T.coreQuestionLines.join(" "), font: "500 36px " + SERIF, size: 36, color: C.ink, lh: 1.65 });
    b.push({ gap: 56 });
    T.questions.forEach(function (q) {
      b.push({ text: secLabel(q), font: "500 30px " + SERIF, size: 30, color: C.main, lh: 1.5 });
      b.push({ gap: 12 });
      b.push({ text: "Q. " + q.q, font: "400 31px " + SERIF, size: 31, color: C.ink, lh: 1.7 });
      b.push({ gap: 44 });
    });
    b.push({ text: "+N. 오직 나만의 이어지는 질문", font: "500 30px " + SERIF, size: 30, color: C.main, lh: 1.5 });
    b.push({ gap: 40 });
    return b.concat(foot());
  }

  function quotesSheet() {
    var b = head("곁에 두는 한 문장");
    T.questions.forEach(function (q) {
      var m = q.material; if (!m || !m.quote) return;
      b.push({ text: secLabel(q), font: "500 24px " + SANS, size: 24, color: C.faint, lh: 1.5 });
      b.push({ gap: 16 });
      b.push({ text: m.quote, font: "400 36px " + SERIF, size: 36, color: C.ink, lh: 1.65 });
      b.push({ gap: 14 });
      b.push({ text: "— " + m.author + (m.work ? " · " + m.work : ""), font: "500 26px " + SERIF, size: 26, color: C.main, lh: 1.5 });
      b.push({ gap: 60 });
    });
    return b.concat(foot());
  }

  function ready() {
    var fs = document.fonts;
    if (!fs || !fs.load) return Promise.resolve();
    return Promise.all([fs.load("500 60px \"Noto Serif KR\""), fs.load("400 36px \"Noto Serif KR\""), fs.load("500 24px \"Noto Sans KR\"")]).catch(function () {});
  }

  window.RCSheets = {
    download: function (kind) {
      return ready().then(function () {
        var base = "리더스클럽_" + T.monthLabel + "_" + T.titleShort.replace(/\s+/g, "");
        if (kind === "quotes") draw(quotesSheet(), base + "_격언모음.png");
        else draw(questionsSheet(), base + "_질문목록.png");
      });
    }
  };
})();
