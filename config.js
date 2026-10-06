/* ============================================================
   config.js — всё, что Кристина меняет без правки вёрстки:
   цены, ссылки Kaspi, ID пикселя, номер WhatsApp.
   Тексты лежат отдельно, в content.json.
   ============================================================ */
window.SPRINTO_CONFIG = {
  siteUrl: "https://start.sprinto.kz",
  defaultLang: "ru",                 // "ru" или "kz"; ссылка с ?lang=kz открывает казахскую версию

  /* --- Аналитика --- */
  metaPixelId: "",                   // TODO: Pixel ID от Кристины (только цифры)
  yandexMetrikaId: "",               // TODO: номер счётчика Яндекс Метрики (необязательно)

  /* --- Контакты --- */
  whatsapp: "77000000000",           // TODO: номер WhatsApp без «+», например 77011234567
  telegramBotUrl: "https://t.me/",   // TODO: ссылка на Telegram-бот для страницы «Спасибо»
  policyUrl: "#",                    // TODO: ссылка на политику конфиденциальности
  offerUrl: "#",                     // TODO: ссылка на оферту

  /* --- Оплата ---
     Если ссылка Kaspi пустая, кнопка «Оплатить» ведёт в WhatsApp
     с текстом «Хочу оплатить …» — страница не ломается, пока ссылок нет. */
  appendUtmToKaspi: false,           // true — добавлять utm и product к ссылке Kaspi (включить, только если Kaspi их принимает)

  products: {
    challenge:    { price: 7000,  kaspi: "" },
    marathon:     { price: 10000, kaspi: "" },
    app_a2:       { price: 10000, kaspi: "" },
    intensive: {
      variants: {
        standard:   { price: 35000, kaspi: "" },   // стандартный доступ
        two_months: { price: 40000, kaspi: "" }    // доступ на 2 месяца
      }
    },
    individual:   { price: 10000, per: "hour", kaspi: "" },   // за час
    group_online: { price: 6500,  per: "hour", kaspi: "" },   // за час
    songs:        { price: 12000, kaspi: "" }
  },

  /* --- Демо Carlos ---
     video — путь к mp4 (например "assets/demo.mp4"), poster — картинка-обложка.
     Если video пустой, показывается пример диалога из content.json. */
  demo: { video: "", poster: "" }
};
