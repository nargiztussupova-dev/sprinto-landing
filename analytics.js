/* ============================================================
   analytics.js — UTM, пиксель Meta, Яндекс Метрика, единая функция track().
   Подключается в <head> каждой страницы после config.js.
   ============================================================ */
(function () {
  var C = window.SPRINTO_CONFIG || {};
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  var UTM_STORE = "sprinto_utm";
  var memory = {}; // запасной вариант, если браузер блокирует хранилище

  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return memory[k] || null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { memory[k] = v; } }

  /* --- UTM: сохраняем при входе, живут всю сессию --- */
  function captureUtm() {
    try {
      var params = new URLSearchParams(window.location.search);
      var found = {};
      UTM_KEYS.forEach(function (k) { var v = params.get(k); if (v) found[k] = v; });
      if (Object.keys(found).length) ssSet(UTM_STORE, JSON.stringify(found));
    } catch (e) {}
  }
  function getUtm() {
    try { return JSON.parse(ssGet(UTM_STORE) || "{}"); } catch (e) { return {}; }
  }
  function withUtm(url, extra) {
    try {
      var u = new URL(url, window.location.href);
      var utm = getUtm();
      Object.keys(utm).forEach(function (k) { u.searchParams.set(k, utm[k]); });
      Object.keys(extra || {}).forEach(function (k) { u.searchParams.set(k, extra[k]); });
      return u.toString();
    } catch (e) { return url; }
  }
  captureUtm();

  /* --- Пиксель Meta --- */
  if (C.metaPixelId) {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", C.metaPixelId);
    window.fbq("track", "PageView");
  }

  /* --- Яндекс Метрика (с вебвизором) --- */
  if (C.yandexMetrikaId) {
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    window.ym(Number(C.yandexMetrikaId), "init", {
      clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true
    });
  }

  function merge(a, b) {
    var out = {}, k;
    for (k in a) if (Object.prototype.hasOwnProperty.call(a, k)) out[k] = a[k];
    for (k in b) if (Object.prototype.hasOwnProperty.call(b, k)) out[k] = b[k];
    return out;
  }

  var STANDARD = { PageView: 1, ViewContent: 1, Lead: 1, Contact: 1, InitiateCheckout: 1, Purchase: 1, CompleteRegistration: 1, Schedule: 1 };

  /* track — событие Meta (стандартное или своё) + цель Метрики с тем же именем */
  function track(name, params) {
    var data = merge(params || {}, getUtm());
    try { if (window.fbq && C.metaPixelId) window.fbq(STANDARD[name] ? "track" : "trackCustom", name, data); } catch (e) {}
    try { if (window.ym && C.yandexMetrikaId) window.ym(Number(C.yandexMetrikaId), "reachGoal", name, data); } catch (e) {}
  }
  /* goal — только Метрика: шаги квиза, чтобы видеть, где бросают */
  function goal(name, params) {
    try { if (window.ym && C.yandexMetrikaId) window.ym(Number(C.yandexMetrikaId), "reachGoal", name, params || {}); } catch (e) {}
  }

  window.SprintoTrack = { track: track, goal: goal, getUtm: getUtm, withUtm: withUtm };
})();
