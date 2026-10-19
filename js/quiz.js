/* ==========================================================
   quiz.js: multiple-choice quiz + glossary rendering
   ========================================================== */

(function () {
  const D = window.APP_DATA;
  const esc = (s) => window.HL.esc(s);
  let answered = 0, correct = 0;

  function initGlossary() {
    document.getElementById("glossaryList").innerHTML =
      D.glossary.map(([t, d]) => `<div class="gl-item"><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join("");
  }

  function renderQuiz() {
    answered = 0; correct = 0;
    document.getElementById("quizBox").innerHTML = D.quiz.map((q, qi) => `
      <fieldset class="qz" data-q="${qi}">
        <legend><span class="qz-n">${qi + 1}</span>${esc(q.q)}</legend>
        <div class="qz-opts">${q.options.map((o, oi) => `<button type="button" class="qz-opt" data-o="${oi}">${esc(o)}</button>`).join("")}</div>
        <p class="qz-why" hidden></p>
      </fieldset>`).join("") + `<div class="qz-score" id="qzScore" hidden></div>`;
  }

  function onClick(e) {
    if (e.target.closest("#qzRetry")) { renderQuiz(); return; }
    const btn = e.target.closest(".qz-opt");
    if (!btn) return;
    const fs = btn.closest(".qz");
    if (fs.classList.contains("done")) return;
    const q = D.quiz[+fs.dataset.q];
    fs.classList.add("done");
    fs.querySelectorAll(".qz-opt").forEach((b) => { b.disabled = true; if (+b.dataset.o === q.answer) b.classList.add("right"); });
    const ok = +btn.dataset.o === q.answer;
    if (!ok) btn.classList.add("wrong");
    const why = fs.querySelector(".qz-why");
    why.hidden = false;
    why.innerHTML = `<b>${ok ? "Correct!" : "Not quite."}</b> ${esc(q.why)}`;
    answered++; if (ok) correct++;
    if (answered === D.quiz.length) {
      const s = document.getElementById("qzScore");
      s.hidden = false;
      const msg = correct === D.quiz.length ? "Perfect score. You're ready to build APIs!"
        : correct >= 6 ? "Great job. Revisit the steps you missed and you're there."
        : "Good start. Scroll back through the steps and try again.";
      s.innerHTML = `<b>${correct} / ${D.quiz.length}</b><span>${msg}</span><button type="button" class="btn ghost" id="qzRetry">Try again</button>`;
    }
  }

  function initQuiz() {
    renderQuiz();
    document.getElementById("quizBox").addEventListener("click", onClick);
  }

  window.APP_quiz = { initQuiz, initGlossary };
})();
