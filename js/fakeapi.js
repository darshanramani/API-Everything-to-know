/* ==========================================================
   fakeapi.js: a small in-browser copy of example/main.py.
   It follows the same order of checks as FastAPI:
   router → JSON body → auth dependency → param/body
   validation → your function. Error responses use FastAPI's
   real format, so students see what they would get from the
   real server.
   ========================================================== */

(function () {
  const TOKEN = "secret-token";

  const ROUTES = [
    { method: "GET",    path: "/health",          fn: "health" },
    { method: "GET",    path: "/todos",           fn: "list_todos" },
    { method: "GET",    path: "/todos/{todo_id}", fn: "get_todo" },
    { method: "POST",   path: "/todos",           fn: "create_todo",  auth: true, body: "create", status: 201 },
    { method: "PUT",    path: "/todos/{todo_id}", fn: "replace_todo", auth: true, body: "create" },
    { method: "PATCH",  path: "/todos/{todo_id}", fn: "update_todo",  auth: true, body: "update" },
    { method: "DELETE", path: "/todos/{todo_id}", fn: "delete_todo",  auth: true, status: 204 }
  ];

  const BOOL_TRUE = ["1", "on", "t", "true", "y", "yes"];
  const BOOL_FALSE = ["0", "off", "f", "false", "n", "no"];

  function matchPath(pattern, path) {
    const a = pattern.split("/"), b = path.split("/");
    if (a.length !== b.length) return null;
    const params = {};
    for (let i = 0; i < a.length; i++) {
      const m = a[i].match(/^\{(\w+)\}$/);
      if (m) {
        if (!b[i]) return null;
        params[m[1]] = decodeURIComponent(b[i]);
      } else if (a[i] !== b[i]) return null;
    }
    return params;
  }

  const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

  function parseInt_(raw, loc, errors, extra = {}) {
    if (typeof raw === "number" && Number.isInteger(raw)) return raw;
    if (typeof raw === "string" && /^\s*[+-]?\d+\s*$/.test(raw)) return parseInt(raw, 10);
    errors.push({ type: "int_parsing", loc, msg: "Input should be a valid integer, unable to parse string as an integer", input: raw, ...extra });
    return undefined;
  }

  function parseBool(raw, loc, errors) {
    if (typeof raw === "boolean") return raw;
    if (typeof raw === "number") {
      if (raw === 1) return true;
      if (raw === 0) return false;
      errors.push({ type: "bool_parsing", loc, msg: "Input should be a valid boolean, unable to interpret input", input: raw });
      return undefined;
    }
    if (typeof raw === "string") {
      const s = raw.toLowerCase();
      if (BOOL_TRUE.includes(s)) return true;
      if (BOOL_FALSE.includes(s)) return false;
      errors.push({ type: "bool_parsing", loc, msg: "Input should be a valid boolean, unable to interpret input", input: raw });
      return undefined;
    }
    errors.push({ type: "bool_type", loc, msg: "Input should be a valid boolean", input: raw });
    return undefined;
  }

  function parseTitle(raw, loc, errors) {
    if (typeof raw !== "string") {
      errors.push({ type: "string_type", loc, msg: "Input should be a valid string", input: raw });
      return undefined;
    }
    const n = [...raw].length;
    if (n < 1) { errors.push({ type: "string_too_short", loc, msg: "String should have at least 1 character", input: raw, ctx: { min_length: 1 } }); return undefined; }
    if (n > 100) { errors.push({ type: "string_too_long", loc, msg: "String should have at most 100 characters", input: raw, ctx: { max_length: 100 } }); return undefined; }
    return raw;
  }

  function createServer() {
    let db, nextId;
    function reset() {
      db = new Map([
        [1, { title: "Learn HTTP basics", done: true, id: 1 }],
        [2, { title: "Build my first API", done: false, id: 2 }],
        [3, { title: "Deploy it", done: false, id: 3 }]
      ]);
      nextId = 4;
    }
    reset();

    /**
     * req = { method, url, auth: "Bearer x" | "", body: string | null }
     * returns { status, body, location?, route?, trace: [{ stage, state: 'ok'|'fail'|'skip', note }] }
     */
    function handle(req) {
      const method = (req.method || "GET").toUpperCase();
      const url = (req.url || "/").trim();
      const qIndex = url.indexOf("?");
      let path = qIndex >= 0 ? url.slice(0, qIndex) : url;
      if (!path.startsWith("/")) path = "/" + path;
      const query = new URLSearchParams(qIndex >= 0 ? url.slice(qIndex + 1) : "");

      const trace = [];
      const stages = ["router", "body", "auth", "validate", "handler"];
      const done = (status, body, extra = {}) => {
        const seen = new Set(trace.map((t) => t.stage));
        stages.forEach((s) => { if (!seen.has(s)) trace.push({ stage: s, state: "skip", note: "not reached" }); });
        trace.sort((a, b) => stages.indexOf(a.stage) - stages.indexOf(b.stage));
        return { status, body, trace, ...extra };
      };

      // 1. Router
      let route = null, params = null, pathMatched = false;
      for (const r of ROUTES) {
        const p = matchPath(r.path, path);
        if (p) {
          pathMatched = true;
          if (r.method === method) { route = r; params = p; break; }
        }
      }
      if (!route) {
        if (pathMatched) {
          trace.push({ stage: "router", state: "fail", note: `${path} exists, but not for ${method}` });
          return done(405, { detail: "Method Not Allowed" });
        }
        if (path.length > 1 && path.endsWith("/")) {
          const stripped = path.replace(/\/+$/, "");
          if (ROUTES.some((r) => matchPath(r.path, stripped))) {
            trace.push({ stage: "router", state: "fail", note: `Redirect: try ${stripped} (no trailing slash)` });
            return done(307, null, { location: stripped + (qIndex >= 0 ? url.slice(qIndex) : "") });
          }
        }
        trace.push({ stage: "router", state: "fail", note: `No route matches ${path}` });
        return done(404, { detail: "Not Found" });
      }
      trace.push({ stage: "router", state: "ok", note: `${route.method} ${route.path} → ${route.fn}()` });

      // 2. Read the JSON body
      let bodyVal;
      if (route.body) {
        const raw = req.body == null ? "" : String(req.body);
        if (raw.trim() === "") {
          bodyVal = undefined;
          trace.push({ stage: "body", state: "ok", note: "No body sent" });
        } else {
          try {
            bodyVal = JSON.parse(raw);
            trace.push({ stage: "body", state: "ok", note: "Valid JSON" });
          } catch (e) {
            const m = String(e.message).match(/position (\d+)/);
            trace.push({ stage: "body", state: "fail", note: "Body is not valid JSON" });
            return done(422, { detail: [{ type: "json_invalid", loc: ["body", m ? +m[1] : 0], msg: "JSON decode error", input: {}, ctx: { error: "Invalid JSON" } }] }, { route });
          }
        }
      } else {
        trace.push({ stage: "body", state: "skip", note: "This route takes no body" });
      }

      // 3. Auth dependency
      if (route.auth) {
        const h = (req.auth || "").trim();
        const m = h.match(/^bearer\s+(.+)$/i);
        if (!m || m[1].trim() !== TOKEN) {
          trace.push({ stage: "auth", state: "fail", note: m ? "Wrong token" : "No Bearer token sent" });
          return done(401, { detail: "Not authenticated" }, { route });
        }
        trace.push({ stage: "auth", state: "ok", note: "Token accepted" });
      } else {
        trace.push({ stage: "auth", state: "skip", note: "Public route, no token needed" });
      }

      // 4. Validation: path → query → body (same order FastAPI reports)
      const errors = [];
      let todoId;
      if ("todo_id" in params) todoId = parseInt_(params.todo_id, ["path", "todo_id"], errors);
      let doneQ = null, limit = 10;
      if (route.fn === "list_todos") {
        if (query.has("done")) doneQ = parseBool(query.get("done"), ["query", "done"], errors);
        if (query.has("limit")) {
          const raw = query.get("limit");
          const before = errors.length;
          const v = parseInt_(raw, ["query", "limit"], errors);
          if (errors.length === before) {
            if (v < 1) errors.push({ type: "greater_than_equal", loc: ["query", "limit"], msg: "Input should be greater than or equal to 1", input: raw, ctx: { ge: 1 } });
            else if (v > 100) errors.push({ type: "less_than_equal", loc: ["query", "limit"], msg: "Input should be less than or equal to 100", input: raw, ctx: { le: 100 } });
            else limit = v;
          }
        }
      }
      let data = null;
      if (route.body) {
        if (bodyVal === undefined || bodyVal === null) {
          errors.push({ type: "missing", loc: ["body"], msg: "Field required", input: null });
        } else if (!isObj(bodyVal)) {
          errors.push({ type: "model_attributes_type", loc: ["body"], msg: "Input should be a valid dictionary or object to extract fields from", input: bodyVal });
        } else if (route.body === "create") {
          data = {};
          if (!("title" in bodyVal)) errors.push({ type: "missing", loc: ["body", "title"], msg: "Field required", input: bodyVal });
          else data.title = parseTitle(bodyVal.title, ["body", "title"], errors);
          data.done = "done" in bodyVal ? parseBool(bodyVal.done, ["body", "done"], errors) : false;
        } else {
          data = {};
          if ("title" in bodyVal && bodyVal.title !== null) data.title = parseTitle(bodyVal.title, ["body", "title"], errors);
          if ("done" in bodyVal && bodyVal.done !== null) data.done = parseBool(bodyVal.done, ["body", "done"], errors);
        }
      }
      if (errors.length) {
        trace.push({ stage: "validate", state: "fail", note: `${errors.length} validation error${errors.length > 1 ? "s" : ""}` });
        return done(422, { detail: errors }, { route });
      }
      trace.push({ stage: "validate", state: "ok", note: route.body || route.fn === "list_todos" || todoId !== undefined ? "All inputs valid" : "Nothing to validate" });

      // 5. Your function
      const notFound = () => {
        trace.push({ stage: "handler", state: "fail", note: `Todo ${todoId} does not exist → HTTPException(404)` });
        return done(404, { detail: "Todo not found" }, { route });
      };
      const ok = (status, body, note, change) => {
        trace.push({ stage: "handler", state: "ok", note });
        return done(status, body, { route, change });
      };

      switch (route.fn) {
        case "health":
          return ok(200, { status: "ok" }, "Returned a dict");
        case "list_todos": {
          const items = [...db.values()].filter((t) => doneQ === null || t.done === doneQ).slice(0, limit);
          return ok(200, items.map((t) => ({ ...t })), `Returned ${items.length} todo${items.length === 1 ? "" : "s"}`);
        }
        case "get_todo":
          if (!db.has(todoId)) return notFound();
          return ok(200, { ...db.get(todoId) }, `Found todo ${todoId}`, { type: "read", id: todoId });
        case "create_todo": {
          const todo = { title: data.title, done: data.done, id: nextId };
          db.set(nextId, todo);
          nextId++;
          return ok(201, { ...todo }, `Created todo ${todo.id}`, { type: "create", id: todo.id });
        }
        case "replace_todo":
          if (!db.has(todoId)) return notFound();
          db.set(todoId, { title: data.title, done: data.done, id: todoId });
          return ok(200, { ...db.get(todoId) }, `Replaced todo ${todoId}`, { type: "update", id: todoId });
        case "update_todo":
          if (!db.has(todoId)) return notFound();
          db.set(todoId, { ...db.get(todoId), ...data });
          return ok(200, { ...db.get(todoId) }, `Updated ${Object.keys(data).join(", ") || "nothing"} on todo ${todoId}`, { type: "update", id: todoId });
        case "delete_todo":
          if (!db.has(todoId)) return notFound();
          db.delete(todoId);
          return ok(204, null, `Deleted todo ${todoId}`, { type: "delete", id: todoId });
      }
      return done(500, { detail: "Internal Server Error" });
    }

    return { handle, reset, rows: () => [...db.values()].map((t) => ({ ...t })), token: TOKEN, routes: ROUTES };
  }

  const root = typeof window !== "undefined" ? window : globalThis;
  root.FakeAPI = { createServer, ROUTES };
})();
