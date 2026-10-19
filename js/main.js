/* ==========================================================
   main.js: page wiring. Highlighting, navigation, progress,
   theme, and starting each animation when it scrolls into view.
   ========================================================== */

(function () {
  const Anim = window.APP_Anim, Init = window.APP_Init;

  window.HL.renderAll();

  function runAnim(stage) {
    const fn = Anim[stage.dataset.anim];
    if (!fn) return;
    const ctl = window.APP_makeCtl(stage);
    Promise.resolve(fn(stage, ctl)).catch((err) => console.error(err));
  }
  window.APP_runAnim = runAnim;

  const stages = [...document.querySelectorAll(".stage[data-anim]")];
  stages.forEach((stage) => {
    const init = Init[stage.dataset.anim];
    if (init) {
      try { init(stage); } catch (err) { console.error(err); }
    }
    const btn = stage.querySelector(".replay:not([data-scn])");
    if (btn) btn.addEventListener("click", () => runAnim(stage));
  });

  const animObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && !e.target._played) { e.target._played = true; runAnim(e.target); }
    });
  }, { threshold: 0.35 });
  stages.forEach((s) => animObserver.observe(s));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); revealObserver.unobserve(e.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll(".step, .part, .extra").forEach((el) => { el.classList.add("reveal"); revealObserver.observe(el); });

  /* side navigation + step indicator */
  const sections = [...document.querySelectorAll("main [data-title]")];
  const nav = document.getElementById("sidenav");
  nav.innerHTML = sections.map((s) =>
    `<a href="#${s.id}" data-target="${s.id}" class="${s.dataset.step ? "" : "minor"}"><span class="dot"></span><span class="nav-label">${s.dataset.step ? s.dataset.step + ". " : ""}${s.dataset.title}</span></a>`).join("");
  const navLinks = new Map([...nav.querySelectorAll("a")].map((a) => [a.dataset.target, a]));
  const indicator = document.getElementById("stepIndicator");
  const total = sections.filter((s) => s.dataset.step).length;
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const s = e.target;
      navLinks.forEach((a) => a.classList.remove("active"));
      const link = navLinks.get(s.id);
      if (link) link.classList.add("active");
      indicator.textContent = s.dataset.step ? `Step ${s.dataset.step} of ${total} · ${s.dataset.title}` : s.dataset.title;
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => sectionObserver.observe(s));

  /* reading progress */
  const bar = document.getElementById("progressBar");
  let ticking = false;
  const update = () => {
    const h = document.documentElement, max = h.scrollHeight - h.clientHeight;
    bar.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
    ticking = false;
  };
  window.addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
  update();

  /* theme toggle */
  const root = document.documentElement;
  try { const saved = localStorage.getItem("fastapi-theme"); if (saved) root.dataset.theme = saved; } catch (e) { /* storage unavailable */ }
  document.getElementById("themeToggle").addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("fastapi-theme", root.dataset.theme); } catch (e) { /* ignore */ }
  });

  window.APP_playground.init();
  window.APP_quiz.initGlossary();
  window.APP_quiz.initQuiz();
})();
