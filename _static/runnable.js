// Редактируемые и запускаемые блоки кода прямо в книге.
// Python — Pyodide (CPython в браузере), SQL — PGlite (PostgreSQL в браузере).
// Движки грузятся с CDN при первом запуске; состояние общее в пределах страницы,
// как в ноутбуке: переменные Python и таблицы SQL живут до перезагрузки страницы.
// Для SQL-спринта подгружается демо-база из _static/sql-seeds/<id спринта>.sql.
(() => {
  const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.29.5/full/";
  const PGLITE = "https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.8/dist/index.js";
  const BLOCKS = {
    python: "div.highlight-python, div.highlight-python3, div.highlight-ipython3",
    sql: "div.highlight-sql, div.highlight-postgresql",
  };
  const MAX_ROWS = 200;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Не удалось загрузить " + src));
      document.head.appendChild(s);
    });
  }

  // ------------------------------------------------------------ Python
  const PY_HELPERS = `
import sys
def __show(obj):
    if obj is None:
        return None
    if hasattr(obj, "_repr_html_"):
        h = obj._repr_html_()
        if h:
            return ("html", h)
    return ("text", repr(obj))

def __figs():
    if "matplotlib.pyplot" not in sys.modules:
        return []
    import base64, io
    import matplotlib.pyplot as plt
    out = []
    for n in plt.get_fignums():
        buf = io.BytesIO()
        plt.figure(n).savefig(buf, format="png", bbox_inches="tight", dpi=100)
        out.append(base64.b64encode(buf.getvalue()).decode())
    plt.close("all")
    return out

async def __run(code):
    from pyodide.code import eval_code_async
    if "matplotlib" in code or "seaborn" in code:
        import matplotlib
        matplotlib.use("Agg")
    result = await eval_code_async(code, globals())
    return __show(result), __figs()
`;
  let pyReady;
  function getPython(status) {
    return (pyReady ??= (async () => {
      status("Загружаю Python (≈10 МБ, только при первом запуске)…");
      await loadScript(PYODIDE + "pyodide.js");
      const py = await globalThis.loadPyodide({ indexURL: PYODIDE });
      py.runPython(PY_HELPERS);
      return py;
    })());
  }

  async function runPython(code, out, status) {
    const py = await getPython(status);
    status("Загружаю пакеты…");
    await py.loadPackagesFromImports(code);
    const lines = [];
    py.setStdout({ batched: (s) => lines.push(s) });
    py.setStderr({ batched: (s) => lines.push(s) });
    status("Выполняю…");
    let html = "";
    try {
      const res = await py.globals.get("__run")(code);
      const [shown, figs] = res.toJs();
      res.destroy();
      if (lines.length) html += `<pre class="runnable-text">${esc(lines.join("\n"))}</pre>`;
      if (shown) {
        const [kind, value] = shown;
        html += kind === "html" ? `<div class="runnable-html">${value}</div>` : `<pre class="runnable-text">${esc(value)}</pre>`;
      }
      for (const png of figs) html += `<img class="runnable-fig" src="data:image/png;base64,${png}" alt="график">`;
    } catch (e) {
      if (lines.length) html += `<pre class="runnable-text">${esc(lines.join("\n"))}</pre>`;
      // Отрезаем служебные кадры Pyodide, оставляем трейсбек пользовательского кода
      const msg = String(e.message || e);
      const i = msg.search(/File "<exec>", line \d+, in <module>/);
      html += `<pre class="runnable-error">${esc(i >= 0 ? "Traceback:\n  " + msg.slice(i) : msg)}</pre>`;
    }
    out.innerHTML = html || '<span class="runnable-muted">Готово, вывода нет.</span>';
  }

  // ------------------------------------------------------------ SQL
  let pgReady;
  async function loadSeed() {
    const m = location.pathname.match(/\/m\d\d-[^/]+\/([^/]+)\/[^/]*$/);
    if (!m) return "";
    const root = document.documentElement.dataset.content_root || "";
    try {
      const r = await fetch(`${root}_static/sql-seeds/${m[1]}.sql`);
      return r.ok ? await r.text() : "";
    } catch {
      return "";
    }
  }
  function getPostgres(status) {
    return (pgReady ??= (async () => {
      status("Загружаю PostgreSQL (≈3 МБ, только при первом запуске)…");
      const { PGlite } = await import(PGLITE);
      const db = await PGlite.create();
      const seed = await loadSeed();
      if (seed) {
        status("Заполняю демо-базу…");
        await db.exec(seed);
      }
      return { db, seeded: Boolean(seed) };
    })());
  }

  function cell(v) {
    if (v === null || v === undefined) return '<span class="runnable-null">NULL</span>';
    if (v instanceof Date) {
      const iso = v.toISOString();
      return esc(iso.endsWith("T00:00:00.000Z") ? iso.slice(0, 10) : iso.replace("T", " ").slice(0, 19));
    }
    if (typeof v === "object") return esc(JSON.stringify(v));
    return esc(v);
  }

  async function runSql(code, out, status) {
    const { db, seeded } = await getPostgres(status);
    status("Выполняю…");
    try {
      const results = await db.exec(code);
      const last = [...results].reverse().find((r) => r.fields && r.fields.length);
      if (!last) {
        out.innerHTML = `<span class="runnable-muted">Готово. Выполнено запросов: ${results.length}.</span>`;
        return;
      }
      const names = last.fields.map((f) => f.name);
      const rows = last.rows.slice(0, MAX_ROWS);
      let html = '<div class="runnable-table"><table><thead><tr>' + names.map((n) => `<th>${esc(n)}</th>`).join("") + "</tr></thead><tbody>";
      for (const r of rows) html += "<tr>" + names.map((n) => `<td>${cell(r[n])}</td>`).join("") + "</tr>";
      html += "</tbody></table></div>";
      const more = last.rows.length > MAX_ROWS ? `, показаны первые ${MAX_ROWS}` : "";
      html += `<span class="runnable-muted">Строк: ${last.rows.length}${more}${seeded ? " · демо-данные, не данные курса" : ""}</span>`;
      out.innerHTML = html;
    } catch (e) {
      out.innerHTML = `<pre class="runnable-error">${esc(e.message || e)}</pre>`;
    }
  }

  // ------------------------------------------------------------ UI
  const RUNNERS = { python: runPython, sql: runSql };
  const LABELS = { python: "Python", sql: "SQL · PostgreSQL" };

  function setup(block, lang) {
    const pre = block.querySelector("pre");
    if (!pre || block.dataset.runnable) return;
    block.dataset.runnable = lang;
    const original = pre.innerHTML;
    pre.contentEditable = "plaintext-only";
    pre.spellcheck = false;
    pre.title = "Код можно редактировать. Ctrl+Enter — запустить";

    const bar = document.createElement("div");
    bar.className = "runnable-bar";
    bar.innerHTML =
      `<button type="button" class="runnable-run">▶ Запустить</button>` +
      `<button type="button" class="runnable-reset" title="Вернуть исходный код">↺ Сбросить</button>` +
      `<span class="runnable-lang">${LABELS[lang]}</span>`;
    const out = document.createElement("div");
    out.className = "runnable-out";
    out.hidden = true;
    block.after(bar, out);

    const runBtn = bar.querySelector(".runnable-run");
    const run = async () => {
      runBtn.disabled = true;
      out.hidden = false;
      const status = (msg) => (out.innerHTML = `<span class="runnable-muted">${esc(msg)}</span>`);
      try {
        await RUNNERS[lang](pre.innerText, out, status);
      } catch (e) {
        out.innerHTML = `<pre class="runnable-error">${esc(e.message || e)}</pre>`;
      } finally {
        runBtn.disabled = false;
      }
    };
    runBtn.addEventListener("click", run);
    bar.querySelector(".runnable-reset").addEventListener("click", () => {
      pre.innerHTML = original;
      out.hidden = true;
      out.innerHTML = "";
    });
    pre.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        run();
      } else if (e.key === "Tab") {
        e.preventDefault();
        document.execCommand("insertText", false, "    ");
      }
    });
  }

  function init() {
    for (const [lang, selector] of Object.entries(BLOCKS)) {
      document.querySelectorAll(selector).forEach((b) => b.closest("article") && setup(b, lang));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
