/* ============================================================
   config.js — всё, что меняется без правки вёрстки:
   контакты, Pixel ID, цены. Тексты лежат отдельно, в content.json.
   Оплаты на сайте нет: кнопки «Записаться» ведут в Telegram-бот и WhatsApp.
   ============================================================ */
window.SPRINTO_CONFIG = {
  siteUrl: "https://sprinto-landing.onrender.com",
  defaultLang: "ru",                 // "ru" или "kz"; ссылка с ?lang=kz открывает казахскую версию

  /* --- Аналитика --- */
  metaPixelId: "1081506154498239",                   // Pixel ID (только цифры)
  yandexMetrikaId: "",               // номер счётчика Яндекс Метрики (необязательно)

  /* --- Контакты: куда ведут кнопки --- */
  telegramBotUrl: "https://t.me/sprinto_mvp_bot",                // ссылка на Telegram-бот, например https://t.me/имя_бота. Пока пусто — кнопки Telegram нет, основной остаётся WhatsApp
  whatsappUrl: "https://wa.me/message/UEWBCFRJ7CKVF1",  // ссылка-сообщение WhatsApp Business
  telegramStartParam: false,         // true — ссылка на бот получает /start <продукт> (marathon, challenge, intensive_two_months…), чтобы бот знал, какую кнопку нажали
  whatsappPrefill: false,            // true — добавлять к ссылке текст «Хочу записаться: …» (проверьте, что WhatsApp его принимает)
  whatsapp: "",                      // запасной вариант: номер без «+», например 77011234567 (используется, если whatsappUrl пустой)

  /* --- Документы (необязательно: пустая ссылка или "#" скрывает пункт в подвале) --- */
  policyUrl: "",
  offerUrl: "",

  /* --- Цены и ссылки на оплату ---
     payUrl — ссылка на оплату этого продукта (необязательно). Если она заполнена, у продукта появляется
     основная кнопка «Оплатить», а Telegram и WhatsApp остаются ссылками под ней. Пустая ссылка — кнопки «Записаться». */
  products: {
    challenge:    { price: 7000,  payUrl: "" },
    marathon:     { price: 10000, payUrl: "" },
    app_a2:       { price: 10000, payUrl: "" },
    intensive: {
      variants: {
        standard:   { price: 35000, payUrl: "" },   // стандартный доступ
        two_months: { price: 40000, payUrl: "" }    // доступ на 2 месяца
      }
    },
    individual:   { price: 10000, per: "hour", payUrl: "" },   // за час
    group_online: { price: 6500,  per: "hour", payUrl: "" },   // за час
    songs:        { price: 12000, payUrl: "" }
  },

  /* --- Демо Carlos ---
     video — путь к mp4 (например "demo.mp4"), poster — картинка-обложка.
     Если video пустой, показывается пример диалога из content.json. */
  demo: { video: "", poster: "" }
};
