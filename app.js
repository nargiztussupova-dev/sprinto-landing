/* ============================================================
   app.js — отрисовка страницы, квиз, оплата, события.
   Тексты берёт из content.json, цены и ссылки — из config.js.
   ============================================================ */
(function () {
  "use strict";

  var CFG = window.SPRINTO_CONFIG || {};
  var T = window.SprintoTrack;
  var Q = window.SprintoQuiz;
  var CONTENT = null;

  var MAIN_PRODUCTS = ["challenge", "marathon", "app_a2", "intensive"];
  var OTHER_PRODUCTS = ["individual", "group_online", "songs"];

  var state = {
    lang: "ru",
    step: 0,
    answers: {},
    result: null,
    variant: "standard",
    started: false,
    open: {}
  };

  var ICONS = {
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H10l-4 4v-4H4z"/></svg>',
    globe: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    card: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h4"/></svg>'
  };

  /* ---------- утилиты ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function L() { return CONTENT[state.lang]; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fill(str, vars) {
    return String(str).replace(/\{(\w+)\}/g, function (_, k) { return vars && vars[k] != null ? vars[k] : ""; });
  }
  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function scrollToEl(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  }
  function store(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
  function readStore(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

  /* ---------- продукты, цены, ссылки ---------- */
  function productName(pid) { return L().products[pid].name; }
  function canonName(pid) { return CONTENT.ru.products[pid].name; } // для событий — всегда по-русски

  function priceInfo(pid) {
    var p = CFG.products && CFG.products[pid];
    if (!p) return { price: 0, kaspi: "", per: null };
    if (p.variants) {
      var v = p.variants[state.variant] || p.variants.standard;
      return { price: v.price, kaspi: v.kaspi, per: p.per || null };
    }
    return { price: p.price, kaspi: p.kaspi, per: p.per || null };
  }
  function priceText(pid) {
    return String(priceInfo(pid).price).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0") + "\u00A0₸";
  }
  function perHtml(pid) {
    return priceInfo(pid).per === "hour" ? ' <small>' + esc(L().ui.perHour) + "</small>" : "";
  }
  function waLink(text) {
    return "https://wa.me/" + encodeURIComponent(CFG.whatsapp || "") + "?text=" + encodeURIComponent(text);
  }
  function payHref(pid) {
    var info = priceInfo(pid);
    if (!info.kaspi) return waLink(fill(L().ui.waPayText, { product: productName(pid) }));
    if (CFG.appendUtmToKaspi) return T.withUtm(info.kaspi, { product: pid });
    return info.kaspi;
  }

  function payButtons(pid) {
    var name = productName(pid);
    return '<a class="btn btn-primary" href="' + esc(payHref(pid)) + '" target="_blank" rel="noopener" data-pay="' + pid + '">' + esc(L().ui.pay) + "</a>" +
      '<a class="wa-pay" href="' + esc(waLink(fill(L().ui.waPayText, { product: name }))) + '" target="_blank" rel="noopener" data-pay-wa="' + pid + '">' + esc(L().ui.payWa) + "</a>";
  }

  function variantToggle(pid) {
    var p = CFG.products[pid];
    if (!p || !p.variants) return "";
    var u = L().ui;
    return '<div class="variant" role="group" aria-label="' + esc(u.variantLabel) + '">' +
      '<button type="button" data-action="variant" data-variant="standard" aria-pressed="' + (state.variant === "standard") + '">' + esc(u.variantStandard) + "</button>" +
      '<button type="button" data-action="variant" data-variant="two_months" aria-pressed="' + (state.variant === "two_months") + '">' + esc(u.variantTwoMonths) + "</button>" +
      "</div>";
  }

  /* обновляет цены, ссылки и переключатели без перерисовки страницы */
  function updatePrices() {
    $all("[data-price]").forEach(function (el) { el.textContent = priceText(el.getAttribute("data-price")); });
    $all("[data-pay]").forEach(function (a) { a.setAttribute("href", payHref(a.getAttribute("data-pay"))); });
    $all("[data-action='variant']").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-variant") === state.variant));
    });
  }

  /* ---------- отрисовка секций ---------- */
  function renderHeader() {
    $all("#lang-switch [data-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === state.lang));
    });
    $("#lang-switch").setAttribute("aria-label", L().ui.langLabel);
    $("#skip-link").textContent = L().ui.skip;
    $("#sticky-btn").textContent = L().ui.pickCourse;
    document.title = L().meta.title;
    var md = $('meta[name="description"]');
    if (md) md.setAttribute("content", L().meta.description);
    document.documentElement.lang = state.lang === "kz" ? "kk" : "ru";
  }

  function renderHero() {
    var h = L().hero, u = L().ui;
    $("#hero").innerHTML =
      '<div class="wrap hero-inner">' +
        "<div>" +
          "<h1>" + esc(h.title) + "</h1>" +
          '<p class="hero-sub">' + esc(h.subtitle) + "</p>" +
          '<div class="hero-actions">' +
            '<button type="button" class="btn btn-primary" data-action="goquiz">' + esc(u.pickCourse) + "</button>" +
            '<a class="text-link" href="#lineup">' + esc(u.seeAll) + "</a>" +
          "</div>" +
        "</div>" +
        '<div class="hero-art"><img class="mascot" src="assets/mascot.webp" alt="" width="280" height="280"></div>' +
      "</div>";
    var img = $(".mascot");
    if (img) {
      var fallback = function () {
        var d = document.createElement("div");
        d.className = "mascot-ph";
        d.textContent = "Sprinto";
        if (img.parentNode) img.parentNode.replaceChild(d, img);
      };
      if (img.complete && img.naturalWidth === 0) fallback();
      else img.addEventListener("error", fallback);
    }
  }

  function renderQuizShell() {
    $("#quiz").innerHTML =
      '<div class="wrap"><div class="quiz-card">' +
        '<h2 id="quiz-title">' + esc(L().quiz.title) + "</h2>" +
        '<div id="quiz-body"></div>' +
      "</div></div>";
  }

  function renderQuizBody() {
    var body = $("#quiz-body");
    if (!body) return;
    var u = L().ui;
    var qs = L().quiz.questions;

    if (state.result) {
      var r = state.result, pid = r.product, pr = L().products[pid];
      body.innerHTML =
        '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + qs.length + '" aria-valuenow="' + qs.length + '"><span style="width:100%"></span></div>' +
        '<span class="result-badge">' + esc(u.recommended) + "</span>" +
        '<h3 class="result-name q-title" id="q-title" tabindex="-1">' + esc(pr.name) + "</h3>" +
        '<p class="result-reason">' + esc(L().quiz.reasons[r.ruleId]) + "</p>" +
        (r.nextStep === "intensive" ? '<p class="result-note">' + esc(u.nextStepIntensive) + "</p>" : "") +
        '<p class="result-short">' + esc(pr.short) + "</p>" +
        '<div style="margin-top:14px;max-width:360px">' + variantToggle(pid) + "</div>" +
        '<p class="result-price"><span data-price="' + pid + '">' + esc(priceText(pid)) + "</span>" + perHtml(pid) + "</p>" +
        '<div class="result-actions">' + payButtons(pid) + "</div>" +
        '<div class="result-links">' +
          '<button type="button" class="text-link" data-action="back">← ' + esc(u.back) + "</button>" +
          '<button type="button" class="text-link" data-action="golineup">' + esc(u.seeOthers) + "</button>" +
          '<button type="button" class="text-link" data-action="restart">' + esc(u.restart) + "</button>" +
        "</div>";
      return;
    }

    var q = qs[state.step];
    var pct = Math.round(((state.step + 1) / qs.length) * 100);
    var opts = q.options.map(function (o) {
      return '<button type="button" class="option" data-action="answer" data-q="' + q.id + '" data-code="' + o.code + '" aria-pressed="' + (state.answers[q.id] === o.code) + '">' + esc(o.label) + "</button>";
    }).join("");
    var counter = fill(u.questionOf, { n: state.step + 1, total: qs.length });
    body.innerHTML =
      '<div class="quiz-meta"><span>' + esc(counter) + "</span></div>" +
      '<div class="progress" role="progressbar" aria-label="' + esc(counter) + '" aria-valuemin="1" aria-valuemax="' + qs.length + '" aria-valuenow="' + (state.step + 1) + '"><span style="width:' + pct + '%"></span></div>' +
      '<h3 class="q-title" id="q-title" tabindex="-1">' + esc(q.title) + "</h3>" +
      '<div class="options">' + opts + "</div>" +
      '<div class="quiz-foot">' + (state.step > 0 ? '<button type="button" class="text-link" data-action="back">← ' + esc(u.back) + "</button>" : "") + "</div>";
  }

  function renderWhy() {
    var w = L().why;
    $("#why").innerHTML =
      '<div class="wrap"><h2>' + esc(w.title) + "</h2>" +
      '<div class="why-grid">' + w.items.map(function (it) {
        return '<div class="why-item"><div class="icon-bubble">' + (ICONS[it.icon] || "") + "</div>" +
          "<div><h3>" + esc(it.title) + "</h3><p>" + esc(it.text) + "</p></div></div>";
      }).join("") + "</div></div>";
  }

  function renderHow() {
    var h = L().how;
    $("#how").innerHTML =
      '<div class="wrap"><h2>' + esc(h.title) + "</h2>" +
      '<ol class="steps">' + h.steps.map(function (s) {
        return '<li class="step"><div><h3>' + esc(s.title) + "</h3><p>" + esc(s.text) + "</p></div></li>";
      }).join("") + "</ol></div>";
  }

  function productCard(pid) {
    var p = L().products[pid], u = L().ui, open = !!state.open[pid];
    return '<article class="card" data-card="' + pid + '">' +
      "<h3>" + esc(p.name) + "</h3>" +
      '<p class="price"><span data-price="' + pid + '">' + esc(priceText(pid)) + "</span>" + perHtml(pid) + "</p>" +
      variantToggle(pid) +
      '<p class="card-short">' + esc(p.short) + "</p>" +
      '<div class="card-full" id="more-' + pid + '"' + (open ? "" : " hidden") + "><p>" + esc(p.full) + "</p></div>" +
      '<button type="button" class="text-link" data-action="more" data-pid="' + pid + '" aria-expanded="' + open + '" aria-controls="more-' + pid + '">' + esc(open ? u.less : u.more) + "</button>" +
      '<div class="card-actions">' + payButtons(pid) + "</div>" +
      "</article>";
  }

  function renderLineup() {
    var l = L().lineup, u = L().ui;
    var others = OTHER_PRODUCTS.map(function (pid) {
      var p = L().products[pid];
      return '<div class="other-row"><h3>' + esc(p.name) + "</h3><p>" + esc(p.short) + "</p>" +
        '<p class="price"><span data-price="' + pid + '">' + esc(priceText(pid)) + "</span>" + perHtml(pid) + "</p>" +
        '<div class="card-actions">' + payButtons(pid) + "</div></div>";
    }).join("");
    $("#lineup").innerHTML =
      '<div class="wrap">' +
        '<div class="section-head"><h2>' + esc(l.title) + '</h2><p class="section-sub">' + esc(l.subtitle) + "</p></div>" +
        '<div class="cards">' + MAIN_PRODUCTS.map(productCard).join("") + "</div>" +
        '<details class="others"><summary>' + esc(u.otherFormats) + "</summary>" + others + "</details>" +
        '<div class="notsure"><div><strong>' + esc(u.notSure) + '</strong><p class="section-sub" style="margin-top:2px">' + esc(u.notSureHint) + "</p></div>" +
        '<button type="button" class="btn btn-ghost" data-action="goquiz">' + esc(u.pickCourse) + "</button></div>" +
      "</div>";
  }

  function renderDemo() {
    var d = L().demo, u = L().ui, demo = CFG.demo || {};
    var media;
    if (demo.video) {
      media = '<div class="video-box" id="video-box">' +
        (demo.poster ? '<img src="' + esc(demo.poster) + '" alt="" loading="lazy">' : "") +
        '<button type="button" class="btn btn-primary" data-action="playdemo">' + esc(u.demoPlay) + "</button></div>";
    } else {
      media = '<div><div class="chat" role="img" aria-label="' + esc(d.exampleLabel) + '">' +
        d.mock.map(function (m) { return '<div class="bubble ' + (m.from === "carlos" ? "carlos" : "you") + '">' + esc(m.text) + "</div>"; }).join("") +
        '</div><p class="demo-label">' + esc(d.exampleLabel) + "</p></div>";
    }
    $("#demo").innerHTML =
      '<div class="wrap"><div class="demo-grid">' +
        '<div class="demo-text"><h2>' + esc(d.title) + "</h2><p>" + esc(d.text) + "</p></div>" + media +
      "</div></div>";
  }

  function renderReviews() {
    var r = L().reviews;
    if (!r.items || !r.items.length) { $("#reviews").innerHTML = ""; return; }
    $("#reviews").innerHTML =
      '<div class="wrap"><h2>' + esc(r.title) + "</h2>" +
      '<div class="reviews-row" tabindex="0" role="region" aria-label="' + esc(r.title) + '">' +
      r.items.map(function (it) {
        return '<figure class="review"><blockquote>' + esc(it.text) + "</blockquote><figcaption>" + esc(it.name) + "</figcaption></figure>";
      }).join("") + "</div></div>";
  }

  function renderFaq() {
    var f = L().faq;
    $("#faq").innerHTML =
      '<div class="wrap"><h2>' + esc(f.title) + "</h2>" +
      '<div class="faq-list">' + f.items.map(function (it) {
        return '<details class="faq-item"><summary>' + esc(it.q) + "</summary><p>" + esc(it.a) + "</p></details>";
      }).join("") + "</div></div>";
  }

  function renderFinal() {
    var f = L().final, u = L().ui;
    $("#final").innerHTML =
      '<div class="wrap"><div class="final-card">' +
        "<h2>" + esc(f.title) + "</h2><p>" + esc(f.text) + "</p>" +
        '<div class="final-actions">' +
          '<button type="button" class="btn btn-primary" data-action="goquiz">' + esc(u.pickCourse) + "</button>" +
          '<a class="text-link" href="' + esc(waLink(u.waDefaultText)) + '" target="_blank" rel="noopener" data-wa="final">' + esc(u.whatsapp) + "</a>" +
        "</div>" +
      "</div></div>";
  }

  function renderFooter() {
    var f = L().footer;
    $("#footer").innerHTML =
      "<p>" + esc(f.requisites) + "</p>" +
      '<p><a href="' + esc(CFG.policyUrl || "#") + '">' + esc(f.policy) + '</a><a href="' + esc(CFG.offerUrl || "#") + '">' + esc(f.offer) + "</a></p>";
  }

  function renderAll() {
    renderHeader();
    renderHero();
    renderQuizShell();
    renderQuizBody();
    renderWhy();
    renderHow();
    renderLineup();
    renderDemo();
    renderReviews();
    renderFaq();
    renderFinal();
    renderFooter();
  }

  /* ---------- язык ---------- */
  function setLang(l) {
    if (l !== "ru" && l !== "kz") return;
    state.lang = l;
    store("sprinto_lang", l);
    renderAll();
  }
  function pickInitialLang() {
    var fromUrl = null;
    try { fromUrl = new URLSearchParams(window.location.search).get("lang"); } catch (e) {}
    if (fromUrl === "kz" || fromUrl === "ru") return fromUrl;
    var saved = readStore("sprinto_lang");
    if (saved === "kz" || saved === "ru") return saved;
    return CFG.defaultLang === "kz" ? "kz" : "ru";
  }

  /* ---------- квиз ---------- */
  function focusQuizTitle() {
    var t = $("#q-title");
    if (t && t.focus) { try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); } }
  }
  function ensureQuizVisible() {
    var card = $("#quiz .quiz-card");
    if (!card) return;
    var top = card.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.6) {
      window.scrollTo({ top: window.pageYOffset + top - 12, behavior: reducedMotion() ? "auto" : "smooth" });
    }
  }

  function onAnswer(qid, code) {
    var qs = L().quiz.questions;
    var idx = 0;
    for (var i = 0; i < qs.length; i++) if (qs[i].id === qid) idx = i;
    state.answers[qid] = code;
    if (!state.started) { state.started = true; T.goal("quiz_start"); }
    T.goal("quiz_step_" + (idx + 1), { answer: code });
    if (idx < qs.length - 1) {
      state.step = idx + 1;
      renderQuizBody();
      focusQuizTitle();
    } else {
      finishQuiz();
    }
  }

  function finishQuiz() {
    var a = state.answers;
    state.result = Q.recommend(a);
    var pid = state.result.product;
    var info = priceInfo(pid);
    T.track("Lead", {
      content_name: canonName(pid),
      content_category: "quiz",
      recommended_product: pid,
      quiz_rule: state.result.ruleId,
      quiz_level: a.level, quiz_goal: a.goal, quiz_time: a.time, quiz_format: a.format, quiz_lang: a.lang
    });
    T.track("ViewContent", {
      content_name: canonName(pid), content_ids: [pid], content_type: "product",
      value: info.price, currency: "KZT", source: "quiz_result"
    });
    if (a.lang && a.lang !== state.lang) setLang(a.lang); // язык карточки и страницы — как выбрал пользователь
    else renderQuizBody();
    focusQuizTitle();
    ensureQuizVisible();
  }

  /* ---------- действия ---------- */
  function onClick(e) {
    var pay = e.target.closest && e.target.closest("[data-pay]");
    if (pay) {
      var pid = pay.getAttribute("data-pay");
      var info = priceInfo(pid);
      var co = {
        content_name: canonName(pid), content_ids: [pid], content_type: "product",
        value: info.price, currency: "KZT"
      };
      if (pid === "intensive") co.variant = state.variant;
      T.track("InitiateCheckout", co);
      return;
    }
    var payWa = e.target.closest && e.target.closest("[data-pay-wa]");
    if (payWa) {
      T.track("Contact", { content_name: canonName(payWa.getAttribute("data-pay-wa")), method: "whatsapp_pay" });
      return;
    }
    var wa = e.target.closest && e.target.closest("[data-wa]");
    if (wa) { T.track("Contact", { method: "whatsapp", placement: wa.getAttribute("data-wa") }); return; }

    var el = e.target.closest && e.target.closest("[data-action]");
    if (!el) return;
    var action = el.getAttribute("data-action");

    if (action === "lang") { setLang(el.getAttribute("data-lang")); return; }
    if (action === "goquiz") { scrollToEl($("#quiz")); setTimeout(focusQuizTitle, reducedMotion() ? 0 : 400); return; }
    if (action === "golineup") { scrollToEl($("#lineup")); return; }
    if (action === "answer") { onAnswer(el.getAttribute("data-q"), el.getAttribute("data-code")); return; }
    if (action === "back") {
      if (state.result) { state.result = null; state.step = L().quiz.questions.length - 1; }
      else state.step = Math.max(0, state.step - 1);
      renderQuizBody(); focusQuizTitle(); return;
    }
    if (action === "restart") {
      state.answers = {}; state.result = null; state.step = 0;
      renderQuizBody(); focusQuizTitle(); return;
    }
    if (action === "variant") { state.variant = el.getAttribute("data-variant"); updatePrices(); return; }
    if (action === "more") {
      var id = el.getAttribute("data-pid");
      var panel = document.getElementById("more-" + id);
      var willOpen = el.getAttribute("aria-expanded") !== "true";
      state.open[id] = willOpen;
      el.setAttribute("aria-expanded", String(willOpen));
      el.textContent = willOpen ? L().ui.less : L().ui.more;
      if (willOpen) panel.removeAttribute("hidden"); else panel.setAttribute("hidden", "");
      if (willOpen) {
        var inf = priceInfo(id);
        T.track("ViewContent", {
          content_name: canonName(id), content_ids: [id], content_type: "product",
          value: inf.price, currency: "KZT", source: "card_expand"
        });
      }
      return;
    }
    if (action === "playdemo") {
      var box = $("#video-box");
      if (box && CFG.demo && CFG.demo.video) {
        var v = document.createElement("video");
        v.src = CFG.demo.video; v.controls = true; v.autoplay = true; v.setAttribute("playsinline", "");
        box.innerHTML = ""; box.appendChild(v);
        T.goal("demo_play");
      }
    }
  }

  /* ---------- липкая кнопка на мобильном ---------- */
  function setupSticky() {
    var sticky = $("#sticky");
    if (!sticky || !("IntersectionObserver" in window)) return;
    var seen = { hero: true, quiz: false };
    function update() {
      var show = !seen.hero && !seen.quiz;
      if (show) { sticky.removeAttribute("hidden"); document.body.classList.add("has-sticky"); }
      else { sticky.setAttribute("hidden", ""); document.body.classList.remove("has-sticky"); }
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { seen[en.target.id] = en.isIntersecting; });
      update();
    }, { threshold: 0.05 });
    io.observe($("#hero"));
    io.observe($("#quiz"));
  }

  /* ---------- старт ---------- */
  function init() {
    state.lang = pickInitialLang();
    renderAll();
    document.addEventListener("click", onClick);
    setupSticky();
  }

  fetch("content.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("content.json " + r.status); return r.json(); })
    .then(function (data) { CONTENT = data; init(); })
    .catch(function (err) {
      console.error(err);
      var m = document.getElementById("main");
      if (m) m.innerHTML = '<p style="padding:40px 20px;text-align:center">Не удалось загрузить страницу. Обновите её или напишите нам.</p>';
    });
})();
