/* ============================================================
   thanks.js — страница «Спасибо». Ссылка: /thanks.html?product=marathon
   (для интенсива можно добавить &variant=two_months).
   Событие Purchase уходит один раз за сессию на каждый продукт.
   ============================================================ */
(function () {
  "use strict";
  var CFG = window.SPRINTO_CONFIG || {};
  var T = window.SprintoTrack;
  var params = new URLSearchParams(window.location.search);
  var pid = params.get("product");
  var variant = params.get("variant") === "two_months" ? "two_months" : "standard";
  var lang = "ru";

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function readStore(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  function pickLang() {
    var u = params.get("lang");
    if (u === "kz" || u === "ru") return u;
    var s = readStore("sprinto_lang");
    if (s === "kz" || s === "ru") return s;
    return CFG.defaultLang === "kz" ? "kz" : "ru";
  }

  function priceFor(id) {
    var p = CFG.products && CFG.products[id];
    if (!p) return null;
    if (p.variants) return (p.variants[variant] || p.variants.standard).price;
    return p.price;
  }

  function firePurchase(content) {
    if (!pid || !CFG.products || !CFG.products[pid]) return; // без валидного product событие не отправляем
    var key = "sprinto_purchase_" + pid + "_" + variant;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch (e) {}
    T.track("Purchase", {
      content_name: content.ru.products[pid].name, content_ids: [pid], content_type: "product",
      value: priceFor(pid), currency: "KZT"
    });
  }

  function render(content) {
    var t = content[lang].thanks;
    var name = pid && content[lang].products[pid] ? " — " + content[lang].products[pid].name : "";
    var wa = "https://wa.me/" + encodeURIComponent(CFG.whatsapp || "") + "?text=" + encodeURIComponent(content[lang].ui.waDefaultText);
    document.title = t.title + " — Sprinto";
    document.documentElement.lang = lang === "kz" ? "kk" : "ru";
    Array.prototype.forEach.call(document.querySelectorAll("#lang-switch [data-lang]"), function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang));
    });
    document.getElementById("main").innerHTML =
      "<h1>" + esc(t.title) + "</h1>" +
      "<p>" + esc(t.lead.replace("{product}", name)) + "</p>" +
      '<div class="thanks-card"><h2>' + esc(t.nextTitle) + "</h2>" +
      "<ol>" + t.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>" +
      '<div class="thanks-actions">' +
        '<a class="btn btn-primary" href="' + esc(CFG.telegramBotUrl || "#") + '" target="_blank" rel="noopener">' + esc(t.openBot) + "</a>" +
        '<a class="text-link" href="' + esc(wa) + '" target="_blank" rel="noopener">' + esc(t.support) + "</a>" +
        '<a class="text-link" href="./">' + esc(t.home) + "</a>" +
      "</div></div>";
  }

  fetch("content.json", { cache: "no-cache" })
    .then(function (r) { return r.json(); })
    .then(function (content) {
      lang = pickLang();
      render(content);
      firePurchase(content);
      document.getElementById("lang-switch").addEventListener("click", function (e) {
        var b = e.target.closest("[data-lang]");
        if (!b) return;
        lang = b.getAttribute("data-lang");
        try { localStorage.setItem("sprinto_lang", lang); } catch (err) {}
        render(content);
      });
    })
    .catch(function (e) { console.error(e); });
})();
