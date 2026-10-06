/* ============================================================
   quiz-logic.js — правила подбора продукта по ответам квиза.
   Правила проверяются сверху вниз, побеждает первое совпадение.
   Файл работает и в браузере, и в Node (для тестов: node quiz.test.js).
   ============================================================ */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SprintoQuiz = factory();
})(this, function () {
  function result(ruleId, product, nextStep) {
    return { ruleId: ruleId, product: product, nextStep: nextStep || null };
  }

  /* answers: { level, goal, time, format, lang }
     level:  zero | few | lapsed | b1
     goal:   travel | fun | move | exam
     format: try | group | self | intensive */
  function recommend(a) {
    var beginner = a.level === "zero" || a.level === "few";

    if (a.goal === "exam") return result("r1", "individual");
    if (a.level === "b1" && a.goal === "fun") return result("r2", "songs");
    if (a.level === "b1") return result("r3", "group_online");
    if (beginner && a.format === "try") return result("r4", "challenge");
    if (beginner && a.format === "group") return result("r5", "marathon");
    if (a.format === "self") return result("r6", "app_a2");
    if (a.level === "lapsed" && a.format === "intensive") return result("r7", "intensive");
    if (a.level === "zero" && a.format === "intensive") return result("r8", "marathon", "intensive");
    return result("r9", "challenge");
  }

  return { recommend: recommend };
});
