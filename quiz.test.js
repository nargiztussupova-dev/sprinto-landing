/* Запуск: node quiz.test.js
   Проверяет все 9 правил подбора и печатает таблицу прогонов (её можно приложить к приёмке). */
const { recommend } = require("./quiz-logic.js");

const cases = [
  // [описание, ответы, ожидаемое правило, ожидаемый продукт, ожидаемая пометка]
  ["Цель «экзамен» бьёт любой уровень", { level: "zero", goal: "exam", time: "t20", format: "try", lang: "ru" }, "r1", "individual"],
  ["B1 + экзамен → всё равно индивидуальные", { level: "b1", goal: "exam", time: "t60", format: "group", lang: "ru" }, "r1", "individual"],
  ["B1 + для себя", { level: "b1", goal: "fun", time: "t20", format: "self", lang: "ru" }, "r2", "songs"],
  ["B1 + путешествия", { level: "b1", goal: "travel", time: "t20", format: "try", lang: "kz" }, "r3", "group_online"],
  ["B1 + свой темп (b1 раньше self)", { level: "b1", goal: "move", time: "t10", format: "self", lang: "ru" }, "r3", "group_online"],
  ["С нуля + попробовать", { level: "zero", goal: "travel", time: "t10", format: "try", lang: "ru" }, "r4", "challenge"],
  ["Пара фраз + попробовать", { level: "few", goal: "fun", time: "t20", format: "try", lang: "kz" }, "r4", "challenge"],
  ["С нуля + группа", { level: "zero", goal: "move", time: "t20", format: "group", lang: "ru" }, "r5", "marathon"],
  ["Пара фраз + группа", { level: "few", goal: "travel", time: "t60", format: "group", lang: "ru" }, "r5", "marathon"],
  ["С нуля + свой темп", { level: "zero", goal: "fun", time: "t20", format: "self", lang: "ru" }, "r6", "app_a2"],
  ["Забросил(а) + свой темп", { level: "lapsed", goal: "travel", time: "t20", format: "self", lang: "ru" }, "r6", "app_a2"],
  ["Забросил(а) + интенсив", { level: "lapsed", goal: "move", time: "t60", format: "intensive", lang: "ru" }, "r7", "intensive"],
  ["С нуля + интенсив → марафон с пометкой", { level: "zero", goal: "travel", time: "t60", format: "intensive", lang: "ru" }, "r8", "marathon", "intensive"],
  // «Всё остальное» — случаи, которые попадают в запасной вариант
  ["Забросил(а) + попробовать (остальное)", { level: "lapsed", goal: "fun", time: "t10", format: "try", lang: "ru" }, "r9", "challenge"],
  ["Забросил(а) + группа (остальное)", { level: "lapsed", goal: "travel", time: "t20", format: "group", lang: "ru" }, "r9", "challenge"],
  ["Пара фраз + интенсив (остальное)", { level: "few", goal: "move", time: "t60", format: "intensive", lang: "ru" }, "r9", "challenge"]
];

let failed = 0;
const rows = [];
cases.forEach(([name, answers, rule, product, next]) => {
  const got = recommend(answers);
  const ok = got.ruleId === rule && got.product === product && (got.nextStep || null) === (next || null);
  if (!ok) failed++;
  rows.push(`| ${ok ? "✅" : "❌"} | ${name} | ${answers.level} / ${answers.goal} / ${answers.format} | ${got.ruleId} | ${got.product}${got.nextStep ? " (+ следующий шаг: " + got.nextStep + ")" : ""} |`);
});

console.log("| Итог | Сценарий | Уровень / цель / формат | Правило | Продукт |");
console.log("| --- | --- | --- | --- | --- |");
rows.forEach((r) => console.log(r));
console.log(`\nПрогонов: ${cases.length}, ошибок: ${failed}`);
process.exit(failed ? 1 : 0);
