/* ==========================================================
   playground.js: the Step 16 API playground. It sends
   requests to the in-browser Todo API (fakeapi.js) and shows
   each stage the request went through, the response, the
   matching FastAPI code and the database.
   ========================================================== */

(function () {
  const D = window.APP_DATA, HL = window.HL;
  const SOURCE = (window.APP_CODE && window.APP_CODE.main) || "";
  const STAGES = { router: "🧭 Router", body: "📨 Read JSON body", auth: "🔌 Auth dependency", validate: "🛡️ Validation", handler: "🐍 Your function" };

  /** Pull one top-level block (decorators + def/class) out of main.py. */
  function block(name) {
    const lines = SOURCE.split("\n");
    let i = lines.findIndex((l) => l.startsWith(`def ${name}(`) || l.startsWith(`class ${name}(`));
    if (i < 0) return "";
    let start = i;
    while (start > 0 && lines[start - 1].startsWith("@")) start--;
    let end = i + 1;
    while (end < lines.length && (lines[end] === "" ? (lines[end + 1] || "").startsWith(" ") : lines[end].startsWith(" "))) end++;
    return lines.slice(start, end).join("\n");
  }

  function init() {
    const $ = (id) => document.getElementById(id);
    const api = window.FakeAPI.createServer();
    const method = $("pgMethod"), url = $("pgUrl"), auth = $("pgAuth"), body = $("pgBody");
    let token = 0;

    const syncBody = () => {
      const has = ["POST", "PUT", "PATCH"].includes(method.value);
      body.disabled = !has;
      body.placeholder = has ? '{ "title": "…" }' : `(${method.value} requests have no body)`;
      updateCurl();
    };

    function curl() {
      const m = method.value, hasBody = !body.disabled && body.value.trim();
      let b = body.value.trim();
      try { b = JSON.stringify(JSON.parse(b)); } catch (e) { /* keep raw */ }
      return `curl -X ${m} 'http://127.0.0.1:8000${url.value.trim()}'` +
        (auth.checked ? ` \\\n  -H 'Authorization: Bearer secret-token'` : "") +
        (hasBody ? ` \\\n  -H 'Content-Type: application/json' \\\n  -d '${b}'` : "");
    }
    const updateCurl = () => ($("pgCurl").textContent = curl());

    function renderDb(change, returnedIds = []) {
      const rows = api.rows();
      $("pgDb").innerHTML = rows.map((r) => {
        let cls = "";
        if (change && change.id === r.id) cls = change.type === "create" ? "row-new" : change.type === "update" ? "row-upd" : "row-read";
        else if (returnedIds.includes(r.id)) cls = "row-read";
        return `<tr class="${cls}"><td>${r.id}</td><td>${HL.esc(r.title)}</td><td>${r.done ? "✅" : "⬜"}</td></tr>`;
      }).join("") + (change && change.type === "delete" ? `<tr class="row-gone"><td colspan="3">🗑️ todo ${change.id} was deleted</td></tr>` : "") ||
        `<tr><td colspan="3" class="muted">(empty)</td></tr>`;
    }

    function codeFor(res) {
      const failed = res.trace.find((t) => t.state === "fail");
      if (!res.route) return "";
      if (failed && failed.stage === "auth") return block("require_token");
      let code = block(res.route.fn);
      if (failed && failed.stage === "validate" && res.route.body) {
        const model = res.route.body === "create" ? "TodoCreate" : "TodoUpdate";
        code = block(model) + "\n\n" + code;
      }
      return code;
    }

    async function send() {
      const my = ++token;
      const req = { method: method.value, url: url.value, auth: auth.checked ? "Bearer secret-token" : "", body: body.disabled ? null : body.value };
      const res = api.handle(req);
      const trace = $("pgTrace"), resp = $("pgResp");
      trace.innerHTML = "";
      resp.innerHTML = `<p class="muted small">Waiting for the server…</p>`;
      $("pgCodeWrap").hidden = true;
      const wait = (ms) => new Promise((r) => setTimeout(r, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms));
      for (const t of res.trace) {
        if (my !== token) return;
        trace.insertAdjacentHTML("beforeend",
          `<li class="${t.state}"><span class="tr-ico">${t.state === "ok" ? "✓" : t.state === "fail" ? "✗" : "–"}</span><b>${STAGES[t.stage]}</b><small>${HL.esc(t.note)}</small></li>`);
        await wait(t.state === "skip" ? 90 : 260);
      }
      if (my !== token) return;
      const extra = res.location ? `<span class="muted small">location: ${HL.esc(res.location)}</span>` : "";
      resp.innerHTML = window.APP_respHTML(res.status, res.body, extra);
      const code = codeFor(res);
      if (code) {
        $("pgCode").innerHTML = HL.python(code).map((l) => `<span class="ln">${l || " "}</span>`).join("");
        $("pgCodeWrap").hidden = false;
      }
      const ids = Array.isArray(res.body) ? res.body.map((t) => t.id) : [];
      renderDb(res.change, ids);
    }

    $("pgChips").innerHTML = D.presets.map((p, i) => `<button type="button" class="chip-btn" data-i="${i}">${HL.esc(p.label)}</button>`).join("");
    $("pgChips").addEventListener("click", (e) => {
      const b = e.target.closest(".chip-btn"); if (!b) return;
      const p = D.presets[+b.dataset.i];
      method.value = p.method; url.value = p.url; body.value = p.body || "";
      if (p.auth !== undefined) auth.checked = p.auth;
      syncBody();
      send();
    });
    $("pgForm").addEventListener("submit", (e) => { e.preventDefault(); send(); });
    [method].forEach((el) => el.addEventListener("change", syncBody));
    [url, body, auth].forEach((el) => el.addEventListener("input", updateCurl));
    auth.addEventListener("change", updateCurl);
    $("pgReset").addEventListener("click", () => { api.reset(); renderDb(); });
    $("pgFullCode").innerHTML = HL.python(SOURCE).map((l) => `<span class="ln">${l || " "}</span>`).join("");

    syncBody();
    renderDb();
  }

  window.APP_playground = { init, block };
})();
