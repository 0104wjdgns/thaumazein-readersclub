/* ============================================================
   진행자 대시보드 (질문 정의는 assets/topic.js에서 읽음)
   - 비밀번호 입력 → 서버함수 /api/responses (service_role) 로 조회
   - 이름별 '가장 최근 제출'만 최종 답으로 표시 · 질문별 모아보기 · CSV 내보내기
   ============================================================ */
(function () {
  "use strict";

  var CFG = window.RC_CONFIG || {};
  var ROUND = CFG.ROUND || (window.RC_TOPIC && window.RC_TOPIC.round);
  var root = document.getElementById("dash");

  var T = window.RC_TOPIC;
  var QDEF = T.questions.map(function (q) {
    return { keys: [q.key], label: (q.num === "n" ? "n." : q.num + "_") + " " + q.label, text: q.q };
  });
  var CSV_COLS = ["participant_name"].concat(T.questions.map(function (q) { return q.key; })).concat(["created_at"]);

  function el(tag, props, kids) {
    var e = document.createElement(tag);
    if (props) for (var k in props) {
      if (k === "class") e.className = props[k];
      else if (k === "text") e.textContent = props[k];
      else if (k === "html") e.innerHTML = props[k];
      else if (k === "onclick") e.addEventListener("click", props[k]);
      else e.setAttribute(k, props[k]);
    }
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  renderGate();

  function renderGate(msg) {
    root.innerHTML = "";
    var pw = el("input", { type: "password", placeholder: "비밀번호", class: "pw-input", autocomplete: "off" });
    var err = el("p", { class: "error", text: msg || "" });
    function submit() {
      var v = pw.value.trim();
      if (!v) return;
      load(v);
    }
    pw.addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
    root.appendChild(el("div", { class: "gate" }, [
      el("h1", { text: "진행자 대시보드" }),
      el("p", { text: T.titleShort + " · 리더스클럽 6기 · " + ROUND }),
      pw, err,
      el("div", { class: "nav", style: "justify-content:center;margin-top:24px" }, [
        el("button", { class: "btn-primary", text: "열기 →", onclick: submit })
      ])
    ]));
    setTimeout(function () { pw.focus(); }, 150);
  }

  function load(pw) {
    root.innerHTML = "";
    root.appendChild(el("p", { class: "meta", text: "불러오는 중…" }));
    fetch("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pw: pw, round: ROUND })
    }).then(function (res) {
      if (res.status === 401) { renderGate("비밀번호가 맞지 않습니다."); return null; }
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    }).then(function (data) {
      if (!data) return;
      render(data.rows || [], pw);
    }).catch(function (e) {
      renderGate("불러오기 실패: " + (e && e.message ? e.message : e));
    });
  }

  function latestPerName(rows) {
    // created_at desc 로 온다는 보장은 없으니 직접 정렬
    var sorted = rows.slice().sort(function (a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    });
    var seen = {}, out = [];
    sorted.forEach(function (r) {
      var key = (r.participant_name || "").trim();
      if (seen[key]) return;
      seen[key] = true; out.push(r);
    });
    // 이름 가나다순 보기 좋게
    out.sort(function (a, b) { return (a.participant_name || "").localeCompare(b.participant_name || "", "ko"); });
    return out;
  }

  function render(rows, pw) {
    var people = latestPerName(rows);
    root.innerHTML = "";

    root.appendChild(el("h1", { text: T.titleShort + " · 리더스클럽 6기" }));
    root.appendChild(el("p", { class: "meta", text: ROUND + " · 제출 " + people.length + "명 (총 " + rows.length + "회 제출, 이름별 최신만 표시)" }));

    root.appendChild(el("div", { class: "toolbar" }, [
      el("button", { text: "CSV 내보내기", onclick: function () { exportCsv(people); } }),
      el("button", { text: "새로고침", onclick: function () { load(pw); } })
    ]));

    if (!people.length) {
      root.appendChild(el("p", { class: "sub", text: "아직 제출된 답이 없어요." }));
      return;
    }

    QDEF.forEach(function (q) {
      var group = el("div", { class: "qgroup" }, [
        el("h2", { text: q.label }),
        el("p", { class: "qtext", text: q.text })
      ]);
      people.forEach(function (r) {
        var val = r[q.keys[0]];
        var txt = (val == null || String(val).trim() === "") ? null : String(val);
        group.appendChild(el("div", { class: "ans" }, [
          el("p", { class: "who", text: r.participant_name || "(무명)" }),
          el("p", { class: "txt" + (txt ? "" : " empty"), text: txt || "— (미응답)" })
        ]));
      });
      root.appendChild(group);
    });
  }

  function exportCsv(people) {
    var lines = [CSV_COLS.join(",")];
    people.forEach(function (r) {
      lines.push(CSV_COLS.map(function (c) { return csvCell(r[c]); }).join(","));
    });
    var csv = "﻿" + lines.join("\r\n"); // BOM: 엑셀 한글 깨짐 방지
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "용서_리더스클럽6기_" + ROUND + ".csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function csvCell(v) {
    if (v == null) return "";
    var s = String(v);
    if (/[",\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
})();
