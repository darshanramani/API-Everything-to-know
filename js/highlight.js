/* ==========================================================
   highlight.js: tiny syntax highlighter for Python, JSON
   and HTTP snippets. No external libraries.
   ========================================================== */

(function () {
  const KW = new Set(["from", "import", "def", "async", "await", "return", "class", "if", "elif", "else", "raise",
    "yield", "with", "for", "in", "not", "is", "and", "or", "try", "finally", "except", "global", "as", "del", "lambda", "pass"]);
  const CONST = new Set(["None", "True", "False"]);
  const BUILTIN = new Set(["int", "str", "bool", "float", "dict", "list", "len", "print", "self"]);

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function pyLine(line) {
    const re = /(#.*$)|("""[^]*?"""|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(@[\w.]+)|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_]\w*)\b/g;
    let out = "", last = 0, m, prev = "";
    while ((m = re.exec(line))) {
      out += esc(line.slice(last, m.index));
      const [t, com, str, dec, num, id] = m;
      if (com) out += `<span class="t-com">${esc(t)}</span>`;
      else if (str) out += `<span class="t-str">${esc(t)}</span>`;
      else if (dec) out += `<span class="t-dec">${esc(t)}</span>`;
      else if (num) out += `<span class="t-num">${t}</span>`;
      else if (id) {
        let cls = "";
        if (KW.has(id)) cls = "t-kw";
        else if (CONST.has(id)) cls = "t-const";
        else if (prev === "def") cls = "t-fn";
        else if (prev === "class" || /^[A-Z][a-zA-Z]+$/.test(id)) cls = "t-cls";
        else if (BUILTIN.has(id)) cls = "t-bi";
        out += cls ? `<span class="${cls}">${id}</span>` : id;
        prev = id;
        last = re.lastIndex;
        continue;
      }
      prev = "";
      last = re.lastIndex;
    }
    return out + esc(line.slice(last));
  }

  function python(text) {
    const out = [];
    let inDoc = false;
    for (const line of text.replace(/\n$/, "").split("\n")) {
      const n = (line.match(/"""/g) || []).length;
      if (inDoc || line.trim().startsWith('"""')) {
        out.push(`<span class="t-doc">${esc(line)}</span>`);
        if (inDoc ? n % 2 === 1 : n === 1) inDoc = !inDoc;
        continue;
      }
      out.push(pyLine(line));
    }
    return out;
  }

  function json(value, indent = 2) {
    if (value === undefined) return "";
    const text = typeof value === "string" ? value : JSON.stringify(value, null, indent);
    return esc(text).replace(
      /(&quot;(?:[^&]|&(?!quot;))*?&quot;)(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g,
      (m, str, colon, lit, num) => {
        if (str) return colon ? `<span class="t-key">${str}</span>${colon}` : `<span class="t-str">${str}</span>`;
        if (lit) return `<span class="t-const">${lit}</span>`;
        return `<span class="t-num">${num}</span>`;
      }
    );
  }

  function shell(text) {
    return text.split("\n").map((l) =>
      l.startsWith("$ ") ? `<span class="t-prompt">$</span> <span class="t-cmd">${esc(l.slice(2))}</span>` : `<span class="t-out">${esc(l)}</span>`
    );
  }

  /** Render every <pre class="code" data-lang="py|sh"> on the page into numbered, highlighted lines. */
  function renderAll(root = document) {
    root.querySelectorAll("pre.code[data-lang]").forEach((pre) => {
      if (pre.dataset.done) return;
      const text = pre.textContent.replace(/^\n/, "");
      const lines = pre.dataset.lang === "sh" ? shell(text.replace(/\n$/, "")) : python(text);
      pre.innerHTML = lines.map((l) => `<span class="ln">${l || " "}</span>`).join("");
      pre.dataset.done = "1";
    });
  }

  window.HL = { python, json, shell, esc, renderAll };
})();
