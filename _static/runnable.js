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

  // ------------------------------------------------------------ упражнения
  // Блок с первой строкой «-- упражнение: id» получает кнопку «Проверить»: запрос пользователя и блок
  // «-- решение: id» выполняются на одной базе, результаты сравниваются (порядок строк — если в решении ORDER BY).
  const EXERCISE = /^\s*--\s*упражнение:\s*([\w-]+)/i;
  const SOLUTION = /^\s*--\s*решение:\s*([\w-]+)/i;
  const solutions = new Map();

  // «-- блоки: имя=id, имя2=id2» — упражнение опирается на блоки из предыдущих упражнений. При запуске и проверке
  // они подставляются в WITH из эталонных решений (ошибка в одном шаге не ломает следующий), а кнопка
  // «Собрать из моих блоков» берёт решения пользователя, засчитанные проверкой.
  const BLOCKS_LINE = /^\s*--\s*блоки:\s*(.+)$/im;
  const SOLVED_PREFIX = "solved:";
  function parseBlocks(source) {
    const m = source.match(BLOCKS_LINE);
    if (!m) return [];
    return m[1].split(",").map((x) => x.split("=").map((y) => y.trim())).filter(([n, i]) => n && i);
  }
  const stripCode = (code) => code.replace(/^\s*--.*$/gm, "").trim().replace(/;\s*$/, "");
  const indent = (code) => code.split("\n").map((l) => "    " + l).join("\n");
  function withBlocks(code, blocks, pick) {
    const body = stripCode(code);
    if (!body) return code;   // пустая заготовка — подставлять не во что
    // блоки, которые уже определены в самом запросе (например, после сборки), второй раз не подставляем
    const todo = blocks.filter(([name]) => !new RegExp(`\\b${name}\\s+AS\\s*\\(`, "i").test(body));
    if (!todo.length) return code;
    const defs = todo.map(([name, id]) => {
      const part = pick(id);
      if (part == null) throw new Error(`Нет кода для блока ${name}.`);
      return `${name} AS (\n${indent(stripCode(part))}\n)`;
    });
    const w = body.match(/^WITH\s+/i);
    return "WITH " + defs.join(",\n") + (w ? ",\n" + body.slice(w[0].length) : "\n" + body);
  }
  const solvedKey = (id) => SOLVED_PREFIX + location.pathname + ":" + id;
  const solvedCode = (id) => { try { return localStorage.getItem(solvedKey(id)); } catch { return null; } };
  function markSolved(id, code) {
    try { localStorage.setItem(solvedKey(id), code); } catch { /* без хранилища прогресс живёт до перезагрузки */ }
    window.dispatchEvent(new CustomEvent("exercise-solved", { detail: { id } }));
  }
  const refPick = (id) => solutions.get(id);

  function norm(v) {
    if (v === null || v === undefined) return "NULL";
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "number" || (typeof v === "string" && /^-?\d+(\.\d+)?(e[+-]?\d+)?$/i.test(v))) {
      return String(Math.round(Number(v) * 1e4) / 1e4);   // real и numeric сравниваем с точностью 4 знака
    }
    return typeof v === "object" ? JSON.stringify(v) : String(v);
  }

  async function lastResult(db, code) {
    const res = await db.exec(code);
    const last = [...res].reverse().find((r) => r.fields && r.fields.length);
    if (!last) throw new Error("Запрос ничего не вернул — нужен SELECT.");
    const names = last.fields.map((f) => f.name);
    return { names, rows: last.rows.map((r) => names.map((n) => norm(r[n]))) };
  }

  async function checkSql(id, userCode, out, status, blocks = []) {
    const solution = solutions.get(id);
    if (!solution) throw new Error("Для этого упражнения нет решения на странице.");
    const expected = withBlocks(solution, blocks, refPick);
    const code = withBlocks(userCode, blocks, refPick);
    const { db } = await getPostgres(status);
    status("Проверяю…");
    const exp = await lastResult(db, expected);
    let got;
    try {
      got = await lastResult(db, code);
    } catch (e) {
      out.innerHTML = `<div class="exercise-verdict exercise-bad">✗ Запрос с ошибкой</div><pre class="runnable-error">${esc(e.message || e)}</pre>`;
      return;
    }
    const ordered = /order\s+by/i.test(expected.replace(/--.*$/gm, ""));
    const key = (r) => JSON.stringify(r);
    const a = ordered ? exp.rows : [...exp.rows].sort((x, y) => key(x).localeCompare(key(y)));
    const b = ordered ? got.rows : [...got.rows].sort((x, y) => key(x).localeCompare(key(y)));
    let verdict, ok = false;
    if (exp.names.length !== got.names.length) {
      verdict = `✗ Ожидалось столбцов: ${exp.names.length} (${exp.names.join(", ")}), у вас: ${got.names.length} (${got.names.join(", ")}).`;
    } else if (a.length !== b.length) {
      verdict = `✗ Ожидалось строк: ${a.length}, у вас: ${b.length}. Проверьте фильтры, группировку и LIMIT.`;
    } else {
      const i = a.findIndex((r, k) => key(r) !== key(b[k]));
      if (i >= 0) {
        verdict = `✗ Значения отличаются${ordered ? " (порядок строк тоже важен)" : ""}. Строка ${i + 1}: ожидалось ` +
          `<code>${esc(a[i].join(" | "))}</code>, у вас <code>${esc(b[i].join(" | "))}</code>.`;
      } else {
        ok = true;
        markSolved(id, userCode);
        const sameNames = exp.names.every((n, k) => n.toLowerCase() === got.names[k].toLowerCase());
        verdict = sameNames ? "✓ Верно!" :
          `✓ Данные верные. Имена столбцов по условию: ${esc(exp.names.join(", "))}.`;
      }
    }
    out.innerHTML = `<div class="exercise-verdict ${ok ? "exercise-ok" : "exercise-bad"}">${verdict}</div><div class="exercise-result"></div>`;
    await runSql(code, out.querySelector(".exercise-result"), () => {});
  }

  // ------------------------------------------------------------ сохранение правок
  // Правки хранятся в localStorage этого браузера: ключ — страница + хеш исходного кода блока,
  // поэтому сохранённое не «переезжает» на другой блок, если страницу дополнят.
  const STORE_PREFIX = "runnable:";
  function hash(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  const storeKey = (source) => STORE_PREFIX + location.pathname + ":" + hash(source);
  function loadSaved(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  function saveCode(key, code) {
    try { localStorage.setItem(key, code); return true; } catch { return false; }
  }
  function dropSaved(key) {
    try { localStorage.removeItem(key); } catch { /* хранилище недоступно — нечего удалять */ }
  }

  // ------------------------------------------------------------ UI
  const RUNNERS = { python: runPython, sql: runSql };
  const LABELS = { python: "Python", sql: "SQL · PostgreSQL" };

  function setup(block, lang) {
    const pre = block.querySelector("pre");
    if (!pre || block.dataset.runnable) return;
    block.dataset.runnable = lang;
    const original = pre.innerHTML;
    const source = pre.textContent;   // исходный код: по нему ключ хранилища и признак упражнения
    const key = storeKey(source);
    const saved = loadSaved(key);
    if (saved !== null) pre.textContent = saved;
    pre.contentEditable = "plaintext-only";
    pre.spellcheck = false;
    pre.title = "Код можно редактировать. Ctrl+Enter — запустить, Ctrl+S — сохранить";

    const bar = document.createElement("div");
    bar.className = "runnable-bar";
    bar.innerHTML =
      `<button type="button" class="runnable-run">▶ Запустить</button>` +
      `<button type="button" class="runnable-save" title="Запомнить код в этом браузере">💾 Сохранить</button>` +
      `<button type="button" class="runnable-reset" title="Вернуть исходный код и удалить сохранённое">↺ Сбросить</button>` +
      `<span class="runnable-saved"${saved !== null ? "" : " hidden"}>сохранено</span>` +
      `<span class="runnable-lang">${LABELS[lang]}</span>`;
    const exercise = lang === "sql" && (source.match(EXERCISE) || [])[1];
    const blocks = lang === "sql" ? parseBlocks(source) : [];
    if (exercise) {
      block.id = "ex-" + exercise;
      bar.querySelector(".runnable-run").insertAdjacentHTML("afterend",
        '<button type="button" class="runnable-check" title="Сравнить результат с эталонным решением">✓ Проверить</button>' +
        (blocks.length ? '<button type="button" class="runnable-assemble" title="Подставить в WITH мои засчитанные блоки">🧩 Собрать из моих блоков</button>' : ""));
    }
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
        const code = lang === "sql" ? withBlocks(pre.innerText, blocks, refPick) : pre.innerText;
        await RUNNERS[lang](code, out, status);
      } catch (e) {
        out.innerHTML = `<pre class="runnable-error">${esc(e.message || e)}</pre>`;
      } finally {
        runBtn.disabled = false;
      }
    };
    runBtn.addEventListener("click", run);
    if (exercise) {
      const checkBtn = bar.querySelector(".runnable-check");
      checkBtn.addEventListener("click", async () => {
        checkBtn.disabled = true;
        out.hidden = false;
        const status = (msg) => (out.innerHTML = `<span class="runnable-muted">${esc(msg)}</span>`);
        try {
          await checkSql(exercise, pre.innerText, out, status, blocks);
        } catch (e) {
          out.innerHTML = `<pre class="runnable-error">${esc(e.message || e)}</pre>`;
        } finally {
          checkBtn.disabled = false;
        }
      });
    }
    const assembleBtn = bar.querySelector(".runnable-assemble");
    if (assembleBtn) {
      assembleBtn.addEventListener("click", () => {
        out.hidden = false;
        const missing = blocks.filter(([, id]) => solvedCode(id) == null).map(([name]) => name);
        if (missing.length) {
          out.innerHTML = `<div class="exercise-verdict exercise-bad">Сначала решите и проверьте блоки: ${esc(missing.join(", "))}.</div>`;
          return;
        }
        pre.textContent = "-- Собрано из моих засчитанных блоков\n" + withBlocks(pre.innerText, blocks, solvedCode) + ";";
        out.innerHTML = '<span class="runnable-muted">Готово: блоки подставлены в WITH. Запустите или проверьте весь запрос.</span>';
      });
    }
    const savedMark = bar.querySelector(".runnable-saved");
    bar.querySelector(".runnable-save").addEventListener("click", () => {
      const ok = saveCode(key, pre.innerText);
      savedMark.textContent = ok ? "сохранено" : "браузер не даёт сохранять";
      savedMark.hidden = false;
    });
    pre.addEventListener("input", () => {
      if (!savedMark.hidden && savedMark.textContent === "сохранено") savedMark.textContent = "есть несохранённые правки";
    });
    bar.querySelector(".runnable-reset").addEventListener("click", () => {
      dropSaved(key);
      savedMark.hidden = true;
      pre.innerHTML = original;
      out.hidden = true;
      out.innerHTML = "";
    });
    pre.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        bar.querySelector(".runnable-save").click();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        run();
      } else if (e.key === "Tab") {
        e.preventDefault();
        document.execCommand("insertText", false, "    ");
      }
    });
  }

  // ------------------------------------------------------------ пайплайн мини-проекта
  // <div class="sql-pipeline" data-steps="id|подпись;id|подпись"></div> — шаги загораются по мере решения упражнений.
  function renderPipeline(el) {
    const steps = el.dataset.steps.split(";").map((x) => x.split("|").map((y) => y.trim()));
    const done = steps.filter(([id]) => solvedCode(id) != null).length;
    el.innerHTML = '<div class="pipe-row">' + steps.map(([id, label], i) => {
      const ok = solvedCode(id) != null;
      return (i ? '<span class="pipe-arrow">→</span>' : "") +
        `<a class="pipe-node${ok ? " pipe-done" : ""}${i === steps.length - 1 ? " pipe-final" : ""}" href="#ex-${esc(id)}">` +
        `<span class="pipe-mark">${ok ? "✓" : i + 1}</span>${esc(label)}</a>`;
    }).join("") + "</div>" +
      `<div class="pipe-progress">Решено ${done} из ${steps.length}${done === steps.length ? " — запрос собран 🎉" : ""}</div>`;
  }
  function initPipelines() {
    const all = document.querySelectorAll(".sql-pipeline[data-steps]");
    all.forEach(renderPipeline);
    window.addEventListener("exercise-solved", () => all.forEach(renderPipeline));
  }

  function init() {
    document.querySelectorAll(BLOCKS.sql).forEach((b) => {
      const pre = b.querySelector("pre");
      // textContent, а не innerText: решение лежит в свёрнутом блоке, у скрытого элемента innerText пустой
      const m = pre && pre.textContent.match(SOLUTION);
      if (m) solutions.set(m[1], pre.textContent);
    });
    for (const [lang, selector] of Object.entries(BLOCKS)) {
      document.querySelectorAll(selector).forEach((b) => b.closest("article") && setup(b, lang));
    }
    initPipelines();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
