/* ==========================================================
   animations.js: one Init (setup) and one Anim (play) per
   step. Anim functions can be replayed at any time; ctl.w(ms)
   waits and returns false once a newer run has started.
   ========================================================== */

(function () {
  const D = window.APP_DATA;
  const HL = window.HL;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SVGNS = "http://www.w3.org/2000/svg";
  const Anim = {}, Init = {};

  /* ---------- helpers ---------- */
  function makeCtl(stage) {
    stage._token = (stage._token || 0) + 1;
    const t = stage._token;
    const alive = () => stage._token === t;
    return { alive, w: (ms) => new Promise((r) => setTimeout(() => r(alive()), reduceMotion ? Math.min(ms, 20) : ms)) };
  }

  async function typeInto(el, text, c, speed = 22) {
    el.textContent = "";
    if (reduceMotion) { el.textContent = text; return c.alive(); }
    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      if (!(await c.w(speed))) return false;
    }
    return true;
  }

  function svgEl(tag, attrs, parent) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function tween(ms, fn) {
    return new Promise((resolve) => {
      if (reduceMotion) { fn(1); return resolve(); }
      const start = performance.now();
      (function frame(now) {
        const t = Math.min(1, (now - start) / ms);
        fn(t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
        if (t < 1) requestAnimationFrame(frame); else resolve();
      })(start);
    });
  }

  /** FLIP: run mutate(), then animate el from where it was to where it is now. */
  function flip(el, mutate, ms = 500) {
    const a = el.getBoundingClientRect();
    mutate();
    const b = el.getBoundingClientRect();
    if (reduceMotion || !el.animate) return;
    el.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px)` }, { transform: "none" }],
      { duration: ms, easing: "cubic-bezier(.3,.8,.3,1)" });
  }

  /** Fly a copy of `from` onto `to`, then resolve. */
  function flyClone(from, to, ms = 650) {
    return new Promise((resolve) => {
      const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
      const clone = from.cloneNode(true);
      Object.assign(clone.style, { position: "fixed", left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px", margin: 0, zIndex: 80, pointerEvents: "none" });
      clone.classList.add("flying");
      document.body.appendChild(clone);
      if (reduceMotion || !clone.animate) { clone.remove(); return resolve(); }
      const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
      clone.animate([{ transform: "none" }, { transform: `translate(${dx}px, ${dy}px) scale(.9)` }], { duration: ms, easing: "cubic-bezier(.5,0,.3,1)" })
        .onfinish = () => { clone.remove(); resolve(); };
    });
  }

  const statusClass = (s) => (s >= 500 ? "s5" : s >= 400 ? "s4" : s >= 300 ? "s3" : "s2");
  const REASONS = { 200: "OK", 201: "Created", 204: "No Content", 307: "Temporary Redirect", 401: "Unauthorized", 404: "Not Found", 405: "Method Not Allowed", 422: "Unprocessable Content", 500: "Internal Server Error" };
  function respHTML(status, body, extra = "") {
    const pill = `<span class="spill ${statusClass(status)}">${status} ${REASONS[status] || ""}</span>`;
    const json = body === null || body === undefined ? `<span class="muted small">(empty body)</span>` : `<pre class="json">${HL.json(body)}</pre>`;
    return `<div class="resp-head">${pill}${extra}</div>${json}`;
  }
  const methodBadge = (m) => `<span class="m m-${m.toLowerCase()}">${m}</span>`;

  /* ======================================================
     Step 1: restaurant
     ====================================================== */
  Anim.restaurant = async (stage, c) => {
    const tok = stage.querySelector("#restToken");
    const cap = stage.querySelector("#restCaption");
    const cols = stage.querySelectorAll(".rest-col");
    tok.style.transition = "none";
    tok.style.left = "12.5%";
    tok.textContent = "📝 order";
    tok.classList.remove("back");
    void tok.offsetWidth;
    tok.style.transition = "";
    for (const s of D.restaurant) {
      tok.style.left = 12.5 + s.at * 25 + "%";
      tok.textContent = s.text;
      tok.classList.toggle("back", s.text.startsWith("🍝"));
      cols.forEach((col, i) => col.classList.toggle("on", i === s.at));
      cap.textContent = s.say;
      if (!(await c.w(1700))) return;
    }
    cols.forEach((col) => col.classList.remove("on"));
    cap.innerHTML = "<b>Frontend → API → Backend → Database</b>, and the answer comes back the same way.";
  };

  /* ======================================================
     Step 2: raw HTTP round trip
     ====================================================== */
  Anim.http = async (stage, c) => {
    const req = stage.querySelector("#rawReq"), res = stage.querySelector("#rawRes");
    const pk = stage.querySelector("#packet"), st = stage.querySelector("#serverStatus"), rtt = stage.querySelector("#rtt");
    req.textContent = ""; res.textContent = ""; st.innerHTML = "&nbsp;"; rtt.innerHTML = "&nbsp;";
    pk.className = "packet"; pk.style.transition = "none"; pk.style.left = "0%"; void pk.offsetWidth; pk.style.transition = "";
    if (!(await c.w(300))) return;
    if (!(await typeInto(req, D.http.request, c, 16))) return;
    pk.textContent = "GET /todos/1"; pk.className = "packet show req"; pk.style.left = "100%";
    if (!(await c.w(1100))) return;
    pk.classList.remove("show");
    for (const s of D.http.server) { st.textContent = "⚙️ " + s; if (!(await c.w(650))) return; }
    st.innerHTML = "&nbsp;";
    pk.textContent = "200 OK"; pk.className = "packet show res"; pk.style.left = "0%";
    if (!(await c.w(1100))) return;
    pk.classList.remove("show");
    if (!(await typeInto(res, D.http.response, c, 9))) return;
    rtt.innerHTML = "⏱ In real life this whole round trip takes a few milliseconds. We slowed it down so you can watch.";
  };

  /* ======================================================
     Step 3: request anatomy
     ====================================================== */
  function anatomySelect(stage, p) {
    stage.querySelectorAll(".ap").forEach((s) => s.classList.toggle("sel", s.dataset.p === p));
    stage.querySelectorAll(".ap-tab").forEach((b) => b.classList.toggle("sel", b.dataset.p === p));
    const info = D.anatomy[p];
    stage.querySelector("#apInfo").innerHTML = `<b class="ap-c-${p}">${info.label}</b><p>${info.text}</p>`;
  }
  Init.anatomy = (stage) => {
    stage.querySelector("#apTabs").innerHTML = Object.entries(D.anatomy)
      .map(([k, v]) => `<button type="button" class="ap-tab ap-c-${k}" data-p="${k}">${v.label}</button>`).join("");
    stage.addEventListener("click", (e) => {
      const t = e.target.closest("[data-p]");
      if (!t) return;
      makeCtl(stage); // stop the auto tour
      anatomySelect(stage, t.dataset.p);
    });
  };
  Anim.anatomy = async (stage, c) => {
    for (const p of Object.keys(D.anatomy)) {
      anatomySelect(stage, p);
      if (!(await c.w(2200))) return;
    }
    anatomySelect(stage, "method");
  };

  /* ======================================================
     Step 4: CRUD
     ====================================================== */
  function crudState(stage) {
    if (!stage._crud) stage._crud = { rows: D.crudSeed.map((r) => ({ ...r })), next: 4 };
    return stage._crud;
  }
  function crudRender(stage, mark = {}) {
    const s = crudState(stage);
    stage.querySelector("#crudBody").innerHTML = s.rows.map((r) =>
      `<tr data-id="${r.id}" class="${mark[r.id] || ""}"><td>${r.id}</td><td>${HL.esc(r.title)}</td><td>${r.done ? "✅" : "⬜"}</td></tr>`).join("") ||
      `<tr><td colspan="3" class="muted">(no todos)</td></tr>`;
  }
  async function crudOp(stage, op) {
    const s = crudState(stage);
    const reqEl = stage.querySelector("#crudReq"), resEl = stage.querySelector("#crudRes");
    let req, status, body, mark = {};
    const first = s.rows[0], last = s.rows[s.rows.length - 1];
    if (op === "GET") {
      req = `GET /todos`; status = 200; body = `${s.rows.length} todos returned`;
      s.rows.forEach((r) => (mark[r.id] = "row-read"));
    } else if (op === "POST") {
      const r = { id: s.next++, title: "Write tests", done: false };
      s.rows.push(r);
      req = `POST /todos <code>{"title": "Write tests"}</code>`; status = 201; body = `new todo with id ${r.id}`;
      mark[r.id] = "row-new";
    } else if (op === "PUT" || op === "PATCH") {
      const target = op === "PATCH" ? s.rows.find((r) => !r.done) || first : first;
      if (!target) { req = `${op} /todos/1`; status = 404; body = "Todo not found"; }
      else if (op === "PUT") {
        target.title = target.title === "Learn HTTP really well" ? "Learn HTTP basics" : "Learn HTTP really well";
        target.done = true;
        req = `PUT /todos/${target.id} <code>{"title": "${target.title}", "done": true}</code>`;
        status = 200; body = "whole todo replaced"; mark[target.id] = "row-upd";
      } else {
        target.done = !target.done;
        req = `PATCH /todos/${target.id} <code>{"done": ${target.done}}</code>`;
        status = 200; body = "only “done” changed"; mark[target.id] = "row-upd";
      }
    } else if (op === "DELETE") {
      if (!last) { req = `DELETE /todos/1`; status = 404; body = "Todo not found"; }
      else {
        req = `DELETE /todos/${last.id}`; status = 204; body = "deleted, nothing to return";
        crudRender(stage, { [last.id]: "row-del" });
        reqEl.innerHTML = methodBadge(op) + " " + req.replace(/^\w+ /, "");
        resEl.innerHTML = `<span class="spill ${statusClass(status)}">${status} ${REASONS[status]}</span> ${body}`;
        await new Promise((r) => setTimeout(r, reduceMotion ? 10 : 600));
        s.rows = s.rows.filter((r) => r.id !== last.id);
        crudRender(stage);
        return;
      }
    }
    crudRender(stage, mark);
    reqEl.innerHTML = methodBadge(op) + " " + req.replace(/^\w+ /, "");
    resEl.innerHTML = `<span class="spill ${statusClass(status)}">${status} ${REASONS[status]}</span> ${body}`;
  }
  Init.crud = (stage) => {
    crudRender(stage);
    stage.querySelector("#crudBtns").addEventListener("click", (e) => {
      const b = e.target.closest("[data-op]");
      if (!b) return;
      makeCtl(stage);
      crudOp(stage, b.dataset.op);
    });
  };
  Anim.crud = async (stage, c) => {
    stage._crud = null;
    crudRender(stage);
    stage.querySelector("#crudReq").innerHTML = "&nbsp;";
    stage.querySelector("#crudRes").innerHTML = "&nbsp;";
    for (const op of ["GET", "POST", "PATCH", "PUT", "DELETE"]) {
      if (!(await c.w(1100))) return;
      const btn = stage.querySelector(`[data-op="${op}"]`);
      btn.classList.add("press");
      setTimeout(() => btn.classList.remove("press"), 300);
      await crudOp(stage, op);
      if (!(await c.w(900))) return;
    }
  };

  /* ======================================================
     Step 5: status codes
     ====================================================== */
  Init.status = (stage) => {
    const order = [404, 200, 500, 301, 422, 201, 401, 503, 204, 403, 304, 400, 307, 429, 405];
    const byCode = Object.fromEntries(D.statusCodes.map((s) => [s[0], s]));
    stage.querySelector("#scPile").innerHTML = order.map((code) =>
      `<button type="button" class="sc-chip b${String(code)[0]}" data-code="${code}">${code}</button>`).join("");
    stage.addEventListener("click", (e) => {
      const chip = e.target.closest(".sc-chip");
      if (!chip) return;
      const [code, name, text] = byCode[chip.dataset.code];
      stage.querySelectorAll(".sc-chip").forEach((x) => x.classList.toggle("sel", x === chip));
      stage.querySelector("#scInfo").innerHTML = `<b>${code} ${name}</b>: ${text}`;
    });
  };
  Anim.status = async (stage, c) => {
    const pile = stage.querySelector("#scPile");
    const chips = [...stage.querySelectorAll(".sc-chip")].sort((a, b) => (a._o ?? 0) - (b._o ?? 0));
    chips.forEach((ch, i) => { if (ch._o === undefined) ch._o = i; pile.appendChild(ch); ch.classList.remove("sel"); });
    stage.querySelector("#scInfo").innerHTML = "&nbsp;";
    if (!(await c.w(500))) return;
    for (const ch of chips) {
      const drop = stage.querySelector(`.sc-drop[data-b="${ch.dataset.code[0]}"]`);
      flip(ch, () => drop.appendChild(ch));
      if (!(await c.w(260))) return;
    }
    stage.querySelector("#scInfo").innerHTML = "Click any code to see what it means.";
  };

  /* ======================================================
     Step 6: Python ↔ JSON
     ====================================================== */
  Init.json = (stage) => {
    const grid = stage.querySelector("#jsonGrid");
    D.jsonRows.forEach(([py, js], i) => {
      const pad = i ? "&nbsp;" : "";
      grid.insertAdjacentHTML("beforeend",
        `<code class="jg-py" data-r="${i}">${pad}${py}</code><span class="jg-arrow" data-r="${i}">→</span><code class="jg-js" data-r="${i}">${pad}${js}</code>`);
    });
  };
  Anim.json = async (stage, c) => {
    const note = stage.querySelector("#jsonNote");
    stage.querySelectorAll(".jg-py, .jg-js, .jg-arrow").forEach((e) => e.classList.remove("on", "cur"));
    note.innerHTML = "&nbsp;";
    for (let i = 0; i < D.jsonRows.length; i++) {
      if (!(await c.w(500))) return;
      const sel = (k) => stage.querySelector(`.${k}[data-r="${i}"]`);
      sel("jg-py").classList.add("on", "cur");
      if (!(await c.w(450))) return;
      sel("jg-arrow").classList.add("on");
      sel("jg-js").classList.add("on", "cur");
      note.textContent = D.jsonRows[i][2];
      if (!(await c.w(1100))) return;
      sel("jg-py").classList.remove("cur");
      sel("jg-js").classList.remove("cur");
    }
    note.innerHTML = "FastAPI does this for you: return a dict or a Pydantic model, and the client receives JSON.";
  };

  /* ======================================================
     Step 7: REST URL design
     ====================================================== */
  Init.rest = (stage) => {
    stage.querySelector("#restList").innerHTML = D.restRows.map(([bad, m, good]) =>
      `<div class="rr"><code class="rr-bad">${bad}</code><span class="rr-arrow">→</span><span class="rr-good">${methodBadge(m)} <code>${good}</code></span></div>`).join("");
  };
  Anim.rest = async (stage, c) => {
    const rows = [...stage.querySelectorAll(".rr")];
    rows.forEach((r) => r.classList.remove("show", "struck", "fixed"));
    for (const r of rows) {
      if (!(await c.w(250))) return;
      r.classList.add("show");
      if (!(await c.w(500))) return;
      r.classList.add("struck");
      if (!(await c.w(350))) return;
      r.classList.add("fixed");
    }
  };

  /* ======================================================
     Step 8: hello FastAPI
     ====================================================== */
  Anim.hello = async (stage, c) => {
    const lines = [...stage.querySelectorAll("#helloCode .ln")];
    const term = stage.querySelector("#helloTermOut");
    const browser = stage.querySelector("#helloBrowser"), body = stage.querySelector("#helloBody");
    lines.forEach((l) => l.classList.remove("on"));
    term.innerHTML = ""; body.textContent = ""; browser.classList.remove("show");
    for (const l of lines) { if (!(await c.w(260))) return; l.classList.add("on"); }
    if (!(await c.w(500))) return;
    const typeCmd = async (cmd) => {
      const line = document.createElement("div");
      line.innerHTML = `<span class="t-prompt">$</span> <span class="t-cmd"></span>`;
      term.appendChild(line);
      return typeInto(line.querySelector(".t-cmd"), cmd, c, 35);
    };
    const out = (t, cls = "t-out") => term.insertAdjacentHTML("beforeend", `<div class="${cls}">${HL.esc(t)}</div>`);
    if (!(await typeCmd("pip install fastapi uvicorn"))) return;
    if (!(await c.w(400))) return;
    out("Successfully installed fastapi uvicorn …");
    if (!(await c.w(400))) return;
    if (!(await typeCmd("uvicorn main:app --reload"))) return;
    if (!(await c.w(500))) return;
    out("INFO:     Uvicorn running on http://127.0.0.1:8000", "t-info");
    if (!(await c.w(250))) return;
    out("INFO:     Application startup complete.", "t-info");
    if (!(await c.w(700))) return;
    browser.classList.add("show");
    if (!(await c.w(500))) return;
    out('INFO:     127.0.0.1 - "GET / HTTP/1.1" 200 OK', "t-ok");
    body.innerHTML = HL.json({ message: "Hello, World!" });
  };

  /* ======================================================
     Step 9: path & query parameters
     ====================================================== */
  function paramsEval(url) {
    url = url.trim() || "/";
    const qi = url.indexOf("?");
    const path = qi >= 0 ? url.slice(0, qi) : url;
    const qs = new URLSearchParams(qi >= 0 ? url.slice(qi + 1) : "");
    const m = path.match(/^\/items\/([^/]+)$/);
    if (!m) return { status: 404, body: { detail: "Not Found" }, path, qs, matched: false };
    const rawId = decodeURIComponent(m[1]);
    const errors = [], args = [];
    if (/^\s*[+-]?\d+\s*$/.test(rawId)) args.push({ name: "item_id", type: "int", cls: "c-id", from: `"${rawId}" (path)`, val: parseInt(rawId, 10), ok: true });
    else {
      errors.push({ type: "int_parsing", loc: ["path", "item_id"], msg: "Input should be a valid integer, unable to parse string as an integer", input: rawId });
      args.push({ name: "item_id", type: "int", cls: "c-id", from: `"${rawId}" (path)`, val: "✗ not a whole number", ok: false });
    }
    if (qs.has("q")) args.push({ name: "q", type: "str | None", cls: "c-q", from: `"${qs.get("q")}" (query)`, val: JSON.stringify(qs.get("q")), ok: true });
    else args.push({ name: "q", type: "str | None", cls: "c-q", from: "not in URL", val: "None (default)", ok: true, dflt: true });
    let limit = 10;
    if (qs.has("limit")) {
      const raw = qs.get("limit");
      if (/^\s*[+-]?\d+\s*$/.test(raw)) { limit = parseInt(raw, 10); args.push({ name: "limit", type: "int", cls: "c-lim", from: `"${raw}" (query)`, val: limit, ok: true }); }
      else {
        errors.push({ type: "int_parsing", loc: ["query", "limit"], msg: "Input should be a valid integer, unable to parse string as an integer", input: raw });
        args.push({ name: "limit", type: "int", cls: "c-lim", from: `"${raw}" (query)`, val: "✗ not a whole number", ok: false });
      }
    } else args.push({ name: "limit", type: "int", cls: "c-lim", from: "not in URL", val: "10 (default)", ok: true, dflt: true });
    for (const k of qs.keys()) if (k !== "q" && k !== "limit") args.push({ name: k, type: "", cls: "c-x", from: `"${qs.get(k)}" (query)`, val: "ignored: no such parameter", ok: true, dflt: true });
    if (errors.length) return { status: 422, body: { detail: errors }, path, qs, rawId, args, matched: true };
    return { status: 200, body: { item_id: args[0].val, q: qs.has("q") ? qs.get("q") : null, limit }, path, qs, rawId, args, matched: true };
  }
  function paramsRender(stage, url) {
    const r = paramsEval(url);
    const col = stage.querySelector("#paramsColored");
    const esc = HL.esc;
    if (r.matched) {
      const parts = [...r.qs.entries()].map(([k, v]) =>
        `<span class="${k === "q" ? "c-q" : k === "limit" ? "c-lim" : "c-x"}">${esc(k)}=${esc(v)}</span>`).join("&amp;");
      col.innerHTML = `<span class="c-path">/items/</span><span class="c-id">${esc(r.rawId)}</span>${parts ? "?" + parts : ""}`;
      stage.querySelector("#paramsArgs").innerHTML =
        `<div class="arg head"><span>parameter</span><span>from the URL</span><span>value your function gets</span></div>` +
        r.args.map((a, i) => `<div class="arg ${a.cls} ${a.ok ? "" : "bad"} ${a.dflt ? "dflt" : ""}" style="--d:${i * 140}ms"><code>${esc(a.name)}${a.type ? ": " + esc(a.type) : ""}</code><span>${esc(a.from)}</span><b>${esc(String(a.val))}</b></div>`).join("");
    } else {
      col.innerHTML = `<span class="c-x">${esc(r.path)}</span> <span class="muted small">doesn't match /items/{item_id}</span>`;
      stage.querySelector("#paramsArgs").innerHTML = "";
    }
    stage.querySelector("#paramsResp").innerHTML = respHTML(r.status, r.body);
  }
  Init.params = (stage) => {
    const input = stage.querySelector("#paramsUrl");
    stage.querySelector("#paramsChips").innerHTML = D.paramPresets.map((p) => `<button type="button" class="chip-btn">${HL.esc(p)}</button>`).join("");
    stage.querySelector("#paramsChips").addEventListener("click", (e) => {
      const b = e.target.closest(".chip-btn"); if (!b) return;
      makeCtl(stage); input.value = b.textContent; paramsRender(stage, input.value);
    });
    stage.querySelector("#paramsForm").addEventListener("submit", (e) => { e.preventDefault(); makeCtl(stage); paramsRender(stage, input.value); });
    paramsRender(stage, input.value);
  };
  Anim.params = async (stage, c) => {
    const input = stage.querySelector("#paramsUrl");
    for (const p of D.paramPresets.slice(0, 3)) {
      if (!(await typeInto({ set textContent(v) { input.value = v; }, get textContent() { return input.value; } }, p, c, 28))) return;
      paramsRender(stage, p);
      if (!(await c.w(2600))) return;
    }
  };

  /* ======================================================
     Step 10: Pydantic validation
     ====================================================== */
  function pydValidate(text) {
    let obj;
    try { obj = JSON.parse(text); }
    catch (e) {
      const m = String(e.message).match(/position (\d+)/);
      return { status: 422, body: { detail: [{ type: "json_invalid", loc: ["body", m ? +m[1] : 0], msg: "JSON decode error", input: {}, ctx: { error: "Invalid JSON" } }] }, checks: [{ f: "JSON", ok: false, why: "The body isn't valid JSON" }] };
    }
    if (obj === null || typeof obj !== "object" || Array.isArray(obj))
      return { status: 422, body: { detail: [{ type: "model_attributes_type", loc: ["body"], msg: "Input should be a valid dictionary or object to extract fields from", input: obj }] }, checks: [{ f: "body", ok: false, why: "Must be a JSON object { … }" }] };
    const errors = [], checks = [], out = {};
    const miss = (f) => { errors.push({ type: "missing", loc: ["body", f], msg: "Field required", input: obj }); checks.push({ f, ok: false, why: "missing (required)" }); };
    // name
    if (!("name" in obj)) miss("name");
    else if (typeof obj.name !== "string") { errors.push({ type: "string_type", loc: ["body", "name"], msg: "Input should be a valid string", input: obj.name }); checks.push({ f: "name", ok: false, why: "must be text (str)" }); }
    else { out.name = obj.name; checks.push({ f: "name", ok: true, why: "is a str" }); }
    // email
    if (!("email" in obj)) miss("email");
    else if (typeof obj.email !== "string") { errors.push({ type: "string_type", loc: ["body", "email"], msg: "Input should be a valid string", input: obj.email }); checks.push({ f: "email", ok: false, why: "must be text" }); }
    else {
      const e = obj.email.trim(), at = (e.match(/@/g) || []).length;
      let reason = "";
      if (at === 0) reason = "An email address must have an @-sign.";
      else if (at > 1) reason = "The part after the @-sign contains invalid characters: '@'.";
      else if (!e.split("@")[0]) reason = "There must be something before the @-sign.";
      else if (!/\.[^.]+$/.test(e.split("@")[1])) reason = "The part after the @-sign is not valid. It should have a period.";
      if (reason) { errors.push({ type: "value_error", loc: ["body", "email"], msg: "value is not a valid email address: " + reason, input: obj.email, ctx: { reason } }); checks.push({ f: "email", ok: false, why: "not a valid email" }); }
      else { const [l, d] = e.split("@"); out.email = l + "@" + d.toLowerCase(); checks.push({ f: "email", ok: true, why: "looks like a real email" }); }
    }
    // age
    if (!("age" in obj)) miss("age");
    else {
      let v = obj.age, num, conv = "";
      if (typeof v === "boolean") num = v ? 1 : 0;
      else if (typeof v === "number") {
        if (Number.isInteger(v)) num = v;
        else { errors.push({ type: "int_from_float", loc: ["body", "age"], msg: "Input should be a valid integer, got a number with a fractional part", input: v }); checks.push({ f: "age", ok: false, why: "must be a whole number" }); }
      } else if (typeof v === "string") {
        if (/^\s*[+-]?\d+(\.0+)?\s*$/.test(v)) { num = parseInt(v, 10); conv = ` (converted from "${v}")`; }
        else { errors.push({ type: "int_parsing", loc: ["body", "age"], msg: "Input should be a valid integer, unable to parse string as an integer", input: v }); checks.push({ f: "age", ok: false, why: "not a number" }); }
      } else { errors.push({ type: "int_type", loc: ["body", "age"], msg: "Input should be a valid integer", input: v }); checks.push({ f: "age", ok: false, why: "must be an integer" }); }
      if (num !== undefined) {
        if (num < 13) { errors.push({ type: "greater_than_equal", loc: ["body", "age"], msg: "Input should be greater than or equal to 13", input: v, ctx: { ge: 13 } }); checks.push({ f: "age", ok: false, why: "must be ≥ 13" }); }
        else if (num > 120) { errors.push({ type: "less_than_equal", loc: ["body", "age"], msg: "Input should be less than or equal to 120", input: v, ctx: { le: 120 } }); checks.push({ f: "age", ok: false, why: "must be ≤ 120" }); }
        else { out.age = num; checks.push({ f: "age", ok: true, why: "int between 13 and 120" + conv }); }
      }
    }
    const order = ["name", "email", "age"];
    checks.sort((a, b) => order.indexOf(a.f) - order.indexOf(b.f));
    errors.sort((a, b) => order.indexOf(a.loc[1]) - order.indexOf(b.loc[1]));
    if (errors.length) return { status: 422, body: { detail: errors }, checks };
    return { status: 201, body: out, checks };
  }
  async function pydRun(stage, c) {
    const r = pydValidate(stage.querySelector("#pydBody").value);
    const ul = stage.querySelector("#pydChecks"), resp = stage.querySelector("#pydResp");
    ul.innerHTML = ""; resp.innerHTML = "";
    for (const ch of r.checks) {
      ul.insertAdjacentHTML("beforeend", `<li class="${ch.ok ? "ok" : "bad"}"><span>${ch.ok ? "✓" : "✗"}</span><code>${ch.f}</code> ${HL.esc(ch.why)}</li>`);
      if (!(await c.w(380))) return;
    }
    resp.innerHTML = respHTML(r.status, r.body, r.status === 201 ? `<span class="muted small">create_user() ran</span>` : `<span class="muted small">create_user() never ran</span>`);
  }
  Init.pydantic = (stage) => {
    const ta = stage.querySelector("#pydBody");
    ta.value = D.pydanticPresets.Valid;
    stage.querySelector("#pydChips").innerHTML = Object.keys(D.pydanticPresets).map((k) => `<button type="button" class="chip-btn">${HL.esc(k)}</button>`).join("");
    stage.querySelector("#pydChips").addEventListener("click", (e) => {
      const b = e.target.closest(".chip-btn"); if (!b) return;
      ta.value = D.pydanticPresets[b.textContent];
      pydRun(stage, makeCtl(stage));
    });
    stage.querySelector("#pydSend").addEventListener("click", () => pydRun(stage, makeCtl(stage)));
  };
  Anim.pydantic = async (stage, c) => {
    const ta = stage.querySelector("#pydBody");
    for (const k of ["Valid", "Wrong types"]) {
      ta.value = D.pydanticPresets[k];
      await pydRun(stage, c);
      if (!(await c.w(3000))) return;
    }
  };

  /* ======================================================
     Step 11: request lifecycle
     ====================================================== */
  const LC = { W: 104, H: 64, step: 124, x0: 4, y: 30, ret: 172 };
  const lcX = (i) => LC.x0 + i * LC.step + LC.W / 2;
  Init.lifecycle = (stage) => {
    const svg = stage.querySelector("svg.pipe");
    const defs = svgEl("defs", {}, svg);
    const mk = svgEl("marker", { id: "lcArrow", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
    svgEl("path", { d: "M0 0L10 5L0 10z", class: "arrow-head" }, mk);
    const nodes = D.lifecycle.nodes;
    nodes.forEach((n, i) => {
      if (i) svgEl("path", { d: `M${LC.x0 + (i - 1) * LC.step + LC.W + 2} ${LC.y + LC.H / 2} H${LC.x0 + i * LC.step - 3}`, class: "pedge", "data-to": n.id, "marker-end": "url(#lcArrow)" }, svg);
    });
    svgEl("path", { class: "ret", d: "" }, svg);
    svgEl("text", { class: "ret-label", x: 0, y: LC.ret - 8, "text-anchor": "middle" }, svg);
    nodes.forEach((n, i) => {
      const x = LC.x0 + i * LC.step;
      const g = svgEl("g", { class: "pnode", "data-id": n.id }, svg);
      svgEl("rect", { x, y: LC.y, width: LC.W, height: LC.H, rx: 12 }, g);
      svgEl("text", { x: x + LC.W / 2, y: LC.y + 27, class: "p-ico", "text-anchor": "middle" }, g).textContent = n.icon;
      svgEl("text", { x: x + LC.W / 2, y: LC.y + 50, class: "p-lbl", "text-anchor": "middle" }, g).textContent = n.label;
    });
    svgEl("circle", { class: "lc-dot", r: 8, cx: lcX(0), cy: LC.y + LC.H / 2 }, svg);
    stage.querySelectorAll("[data-scn]").forEach((b) => b.addEventListener("click", () => {
      stage.dataset.scn = b.dataset.scn;
      window.APP_runAnim(stage);
    }));
  };
  async function moveDot(dot, pts, ms) {
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      await tween(ms * (Math.hypot(x1 - x0, y1 - y0) / 400 + .2), (t) => { dot.setAttribute("cx", x0 + (x1 - x0) * t); dot.setAttribute("cy", y0 + (y1 - y0) * t); });
    }
  }
  Anim.lifecycle = async (stage, c) => {
    const scnKey = stage.dataset.scn || "ok";
    const scn = D.lifecycle.scenarios[scnKey];
    const svg = stage.querySelector("svg.pipe");
    const cap = stage.querySelector("#lcCaption"), res = stage.querySelector("#lcResult");
    const dot = svg.querySelector(".lc-dot"), ret = svg.querySelector(".ret"), retLbl = svg.querySelector(".ret-label");
    const nodes = D.lifecycle.nodes, cy = LC.y + LC.H / 2;
    svg.querySelectorAll(".pnode, .pedge").forEach((e) => e.classList.remove("active", "done", "fail", "skip"));
    ret.setAttribute("d", ""); ret.setAttribute("class", "ret"); retLbl.textContent = "";
    dot.setAttribute("class", "lc-dot"); dot.setAttribute("cx", lcX(0)); dot.setAttribute("cy", cy);
    res.innerHTML = "";
    stage.querySelectorAll("[data-scn]").forEach((b) => b.classList.toggle("on", b.dataset.scn === scnKey));
    let stopAt = nodes.length - 1;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i], g = svg.querySelector(`.pnode[data-id="${n.id}"]`);
      g.classList.add("active");
      cap.textContent = n.say;
      if (!(await c.w(1300))) return;
      g.classList.remove("active");
      if (n.id === scn.stop) {
        g.classList.add("fail");
        stopAt = i;
        nodes.slice(i + 1).forEach((m) => svg.querySelector(`.pnode[data-id="${m.id}"]`).classList.add("skip"));
        break;
      }
      g.classList.add("done");
      if (i < nodes.length - 1) {
        const e = svg.querySelector(`.pedge[data-to="${nodes[i + 1].id}"]`);
        e.classList.add("active");
        await moveDot(dot, [[lcX(i), cy], [lcX(i + 1), cy]], 500);
        if (!c.alive()) return;
        e.classList.remove("active"); e.classList.add("done");
      }
    }
    const fail = !!scn.stop;
    const x = lcX(stopAt), bottom = LC.y + LC.H;
    ret.setAttribute("d", `M${x} ${bottom + 2} V${LC.ret} H${lcX(0)} V${bottom + 6}`);
    ret.setAttribute("class", "ret show " + (fail ? "bad" : "good"));
    ret.setAttribute("marker-end", "url(#lcArrow)");
    retLbl.setAttribute("x", (x + lcX(0)) / 2);
    retLbl.setAttribute("class", "ret-label " + (fail ? "bad" : "good"));
    retLbl.textContent = scn.status;
    dot.setAttribute("class", "lc-dot " + (fail ? "bad" : "good"));
    await moveDot(dot, [[x, cy], [x, LC.ret], [lcX(0), LC.ret], [lcX(0), bottom + 10]], 700);
    if (!c.alive()) return;
    dot.setAttribute("class", dot.getAttribute("class") + " hide");
    cap.textContent = scn.end;
    res.innerHTML = `<span class="spill ${fail ? (scn.status.startsWith("401") ? "s4" : "s4") : "s2"}">${scn.status}</span><code>${HL.esc(scn.body)}</code>`;
  };

  /* ======================================================
     Step 12: dependency injection
     ====================================================== */
  Anim.di = async (stage, c) => {
    const $ = (id) => stage.querySelector("#" + id);
    const cap = $("diCaption");
    ["diSlotDb", "diSlotUser"].forEach((id) => { $(id).textContent = "?"; $(id).classList.remove("filled"); });
    ["diDb", "diUser", "diFn"].forEach((id) => $(id).classList.remove("active", "done"));
    ["diDbOut", "diUserOut", "diRet", "diCleanup"].forEach((id) => $(id).classList.remove("show"));
    cap.innerHTML = "A request arrives for <code>GET /me/todos</code>.";
    if (!(await c.w(900))) return;
    $("diFn").classList.add("active");
    cap.innerHTML = "FastAPI reads the signature: <code>my_todos()</code> needs a <b>db</b> and a <b>user</b>.";
    if (!(await c.w(1500))) return;
    for (const [dep, out, slot, text, say] of [
      ["diDb", "diDbOut", "diSlotDb", "🗄️ Session", "It calls <code>get_db()</code>, which opens a database session and <code>yield</code>s it."],
      ["diUser", "diUserOut", "diSlotUser", "👤 asha", "It calls <code>get_current_user()</code>, which reads the token and returns the user."]
    ]) {
      $(dep).classList.add("active");
      cap.innerHTML = say;
      if (!(await c.w(800))) return;
      $(out).classList.add("show");
      if (!(await c.w(500))) return;
      await flyClone($(out), $(slot));
      if (!c.alive()) return;
      $(slot).textContent = text; $(slot).classList.add("filled");
      $(dep).classList.remove("active"); $(dep).classList.add("done");
      if (!(await c.w(500))) return;
    }
    cap.innerHTML = "Now your function runs with everything it needs. You never called the dependencies yourself.";
    $("diRet").classList.add("show");
    if (!(await c.w(1600))) return;
    $("diFn").classList.remove("active");
    $("diCleanup").classList.add("show");
    cap.innerHTML = "After the response is sent, the code after <code>yield</code> runs, so the session is always closed.";
  };

  /* ======================================================
     Step 13: async timeline
     ====================================================== */
  function asyncSchedule() {
    const { cpu, io } = D.asyncShape;
    const reqs = D.asyncReqs;
    // Blocking: one request at a time, even while waiting.
    let t = 0;
    const block = reqs.map((r) => {
      const start = Math.max(t, r.start);
      const segs = [];
      if (start > r.start) segs.push({ k: "queue", a: r.start, b: start });
      segs.push({ k: "cpu", a: start, b: start + cpu }, { k: "io", a: start + cpu, b: start + cpu + io }, { k: "cpu", a: start + cpu + io, b: start + 2 * cpu + io });
      t = start + 2 * cpu + io;
      return { name: r.name, segs, end: t };
    });
    // Async: CPU is shared, waiting overlaps.
    let cpuFree = 0;
    const firstHalf = reqs.map((r) => {
      const s = Math.max(cpuFree, r.start);
      cpuFree = s + cpu;
      return { r, s };
    });
    const asy = firstHalf.map(({ r, s }) => {
      const segs = [];
      if (s > r.start) segs.push({ k: "queue", a: r.start, b: s });
      segs.push({ k: "cpu", a: s, b: s + cpu }, { k: "io", a: s + cpu, b: s + cpu + io });
      return { name: r.name, segs, ioEnd: s + cpu + io };
    });
    asy.slice().sort((a, b) => a.ioEnd - b.ioEnd).forEach((x) => {
      const s = Math.max(cpuFree, x.ioEnd);
      if (s > x.ioEnd) x.segs.push({ k: "queue", a: x.ioEnd, b: s });
      x.segs.push({ k: "cpu", a: s, b: s + cpu });
      cpuFree = s + cpu;
      x.end = s + cpu;
    });
    return { block, asy };
  }
  Init.async = (stage) => {
    const { block, asy } = asyncSchedule();
    const MAX = 4.6;
    const pct = (s) => (s / MAX) * 100;
    const build = (el, rows) => {
      el.querySelector(".tl-rows").innerHTML = rows.map((r) => `<div class="tl-row"><span class="tl-name">${r.name}</span><div class="tl-bar">${
        r.segs.map((s) => `<i class="${s.k}" data-a="${s.a}" data-b="${s.b}" style="left:${pct(s.a)}%;width:${pct(s.b - s.a)}%"></i>`).join("")}</div></div>`).join("");
      el._end = Math.max(...rows.map((r) => r.end));
    };
    build(stage.querySelector("#tlBlock"), block);
    build(stage.querySelector("#tlAsync"), asy);
    stage.querySelector("#tlAxis").innerHTML = [0, 1, 2, 3, 4].map((s) => `<span style="left:${pct(s)}%">${s}s</span>`).join("");
  };
  Anim.async = async (stage, c) => {
    const SPEED = 900; // ms of animation per simulated second
    const tls = [stage.querySelector("#tlBlock"), stage.querySelector("#tlAsync")];
    tls.forEach((tl) => {
      tl.querySelector(".tl-total").textContent = "";
      tl.querySelectorAll(".tl-bar i").forEach((i) => { i.style.transition = "none"; i.style.transform = "scaleX(0)"; });
    });
    void stage.offsetWidth;
    if (!(await c.w(300))) return;
    tls.forEach((tl) => tl.querySelectorAll(".tl-bar i").forEach((i) => {
      const a = +i.dataset.a, b = +i.dataset.b;
      i.style.transition = `transform ${(b - a) * SPEED}ms linear ${a * SPEED}ms`;
      i.style.transform = "scaleX(1)";
    }));
    const [blk, asy] = tls;
    const order = [asy, blk].sort((x, y) => x._end - y._end);
    let elapsed = 0;
    for (const tl of order) {
      if (!(await c.w(tl._end * SPEED - elapsed + 100))) return;
      elapsed = tl._end * SPEED + 100;
      tl.querySelector(".tl-total").innerHTML = `All 3 answered after <b>${tl._end.toFixed(1)} s</b>`;
    }
    asy.querySelector(".tl-total").innerHTML += ` <span class="faster">≈ ${(blk._end / asy._end).toFixed(1)}× faster</span>`;
  };

  /* ======================================================
     Step 14: Swagger-style docs
     ====================================================== */
  const SUMMARY = { health: "Health", list_todos: "List Todos", get_todo: "Get Todo", create_todo: "Create Todo", replace_todo: "Replace Todo", update_todo: "Update Todo", delete_todo: "Delete Todo" };
  const EXAMPLE_BODY = { create: '{\n  "title": "string",\n  "done": false\n}', update: '{\n  "done": true\n}' };
  Init.docs = (stage) => {
    const api = window.FakeAPI.createServer();
    stage._api = api;
    stage._authorized = false;
    const ops = stage.querySelector("#swagOps");
    const auth = document.createElement("button");
    auth.type = "button"; auth.className = "swag-authz"; auth.textContent = "Authorize 🔓";
    stage.querySelector(".swag-head").appendChild(auth);
    auth.addEventListener("click", () => {
      stage._authorized = !stage._authorized;
      auth.textContent = stage._authorized ? "Authorized 🔒" : "Authorize 🔓";
      auth.classList.toggle("on", stage._authorized);
    });
    ops.innerHTML = api.routes.map((r, i) => {
      const params = [];
      if (r.path.includes("{todo_id}")) params.push({ name: "todo_id", where: "path", type: "integer", req: true });
      if (r.fn === "list_todos") params.push({ name: "done", where: "query", type: "boolean | null" }, { name: "limit", where: "query", type: "integer", def: "10" });
      return `<div class="swag-op op-${r.method.toLowerCase()}" data-i="${i}">
        <button type="button" class="swag-sum"><span class="swag-m">${r.method}</span><code>${r.path}</code><span class="swag-desc">${SUMMARY[r.fn]}</span>${r.auth ? '<span class="swag-lock" title="Needs authorization">🔒</span>' : ""}</button>
        <div class="swag-body">
          <div class="swag-bar"><b>Parameters</b><button type="button" class="swag-try">Try it out</button></div>
          ${params.length ? params.map((p) => `<label class="swag-param"><span><b>${p.name}</b>${p.req ? '<sup>*</sup>' : ""}<small>${p.type} (${p.where})</small></span><input data-p="${p.name}" data-where="${p.where}" placeholder="${p.def ? "default: " + p.def : p.name}" disabled></label>`).join("") : '<p class="muted small">No parameters</p>'}
          ${r.body ? `<p class="swag-rb"><b>Request body</b> <small>application/json</small></p><textarea class="swag-bodyin" rows="4" disabled>${EXAMPLE_BODY[r.body]}</textarea>` : ""}
          <button type="button" class="swag-exec" hidden>Execute</button>
          <div class="swag-out"></div>
        </div></div>`;
    }).join("");
    ops.addEventListener("click", (e) => {
      const op = e.target.closest(".swag-op");
      if (!op) return;
      if (e.target.closest(".swag-sum")) { makeCtl(stage); op.classList.toggle("open"); }
      else if (e.target.closest(".swag-try")) swagTry(op);
      else if (e.target.closest(".swag-exec")) swagExec(stage, op);
    });
  };
  function swagTry(op, on) {
    const isOn = on ?? !op.classList.contains("trying");
    op.classList.toggle("trying", isOn);
    op.querySelector(".swag-try").textContent = isOn ? "Cancel" : "Try it out";
    op.querySelectorAll("input, textarea").forEach((x) => (x.disabled = !isOn));
    op.querySelector(".swag-exec").hidden = !isOn;
  }
  function swagExec(stage, op) {
    const r = stage._api.routes[op.dataset.i];
    let path = r.path;
    const q = [];
    op.querySelectorAll("input[data-p]").forEach((inp) => {
      const v = inp.value.trim();
      if (inp.dataset.where === "path") path = path.replace(`{${inp.dataset.p}}`, encodeURIComponent(v || ""));
      else if (v) q.push(`${inp.dataset.p}=${encodeURIComponent(v)}`);
    });
    const url = path + (q.length ? "?" + q.join("&") : "");
    const bodyIn = op.querySelector(".swag-bodyin");
    const body = bodyIn ? bodyIn.value : null;
    const res = stage._api.handle({ method: r.method, url, body, auth: stage._authorized ? "Bearer secret-token" : "" });
    const curl = `curl -X '${r.method}' \\\n  'http://127.0.0.1:8000${url}' \\\n  -H 'accept: application/json'` +
      (stage._authorized && r.auth ? ` \\\n  -H 'Authorization: Bearer secret-token'` : "") +
      (body ? ` \\\n  -H 'Content-Type: application/json' \\\n  -d '${body.replace(/\s*\n\s*/g, " ")}'` : "");
    op.querySelector(".swag-out").innerHTML =
      `<p class="swag-lbl">Curl</p><pre class="swag-pre">${HL.esc(curl)}</pre>
       <p class="swag-lbl">Request URL</p><pre class="swag-pre">http://127.0.0.1:8000${HL.esc(url)}</pre>
       <p class="swag-lbl">Server response</p>${respHTML(res.status, res.body)}` +
      (res.status === 401 ? `<p class="muted small">Tip: click <b>Authorize</b> at the top first.</p>` : "");
  }
  Anim.docs = async (stage, c) => {
    stage._api.reset();
    const ops = [...stage.querySelectorAll(".swag-op")];
    ops.forEach((o) => { o.classList.remove("open"); swagTry(o, false); o.querySelector(".swag-out").innerHTML = ""; o.querySelectorAll("input").forEach((i) => (i.value = "")); });
    const op = ops.find((o) => stage._api.routes[o.dataset.i].fn === "get_todo");
    if (!(await c.w(700))) return;
    op.classList.add("open");
    if (!(await c.w(900))) return;
    swagTry(op, true);
    if (!(await c.w(600))) return;
    const inp = op.querySelector('input[data-p="todo_id"]');
    inp.value = "1";
    inp.classList.add("typed");
    if (!(await c.w(700))) return;
    op.querySelector(".swag-exec").classList.add("press");
    swagExec(stage, op);
    setTimeout(() => op.querySelector(".swag-exec").classList.remove("press"), 300);
  };

  /* ======================================================
     Step 15: auth sequence
     ====================================================== */
  Init.auth = (stage) => {
    stage.querySelector("#seqBody").innerHTML = D.authSeq.map((s) => {
      const cls = `seq-row ${s.dir} ${s.ok ? "ok" : ""} ${s.bad ? "bad" : ""}`;
      if (s.dir === "server" || s.dir === "client") return `<div class="${cls}"><div class="seq-note"><b>${HL.esc(s.label)}</b><small>${HL.esc(s.sub)}</small></div></div>`;
      return `<div class="${cls}"><div class="seq-msg"><b>${HL.esc(s.label)}</b><small>${HL.esc(s.sub)}</small><i class="seq-line"></i></div></div>`;
    }).join("");
  };
  Anim.auth = async (stage, c) => {
    const rows = [...stage.querySelectorAll(".seq-row")];
    const jwt = stage.querySelector("#jwt");
    rows.forEach((r) => r.classList.remove("show"));
    jwt.classList.remove("show");
    for (const r of rows) {
      if (!(await c.w(r.classList.contains("server") || r.classList.contains("client") ? 600 : 900))) return;
      r.classList.add("show");
    }
    if (!(await c.w(700))) return;
    jwt.classList.add("show");
  };

  window.APP_Anim = Anim;
  window.APP_Init = Init;
  window.APP_makeCtl = makeCtl;
  window.APP_respHTML = respHTML;
  window.APP_methodBadge = methodBadge;
})();
