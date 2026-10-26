// Результаты поиска: у страниц спринта одинаковые заголовки («Конспект», «Домашнее задание»),
// поэтому к каждому результату дописываем название спринта — берём его из навигации книги в левой панели.
(() => {
  function init() {
    const results = document.getElementById("search-results");
    if (!results) return;

    const titles = new Map();   // «m01-sql/sql-basics/» → «Основы SQL. Извлечение данных»
    document.querySelectorAll(".bd-sidebar-primary a[href$='index.html']").forEach((a) => {
      const href = a.getAttribute("href").replace(/^(\.\.\/)+|^\.\//, "");
      titles.set(href.replace(/index\.html$/, ""), a.textContent.trim());
    });

    function label() {
      results.querySelectorAll("li > a:not([data-sprint])").forEach((a) => {
        const href = (a.getAttribute("href") || "").replace(/^(\.\.\/)+|^\.\//, "").split(/[?#]/)[0];
        const title = titles.get(href.replace(/[^/]*$/, ""));
        a.dataset.sprint = "1";
        if (title && title !== a.textContent.trim()) {
          a.insertAdjacentHTML("beforeend", ` <span class="search-sprint">· ${title.replace(/[&<>]/g, "")}</span>`);
        }
      });
    }
    new MutationObserver(label).observe(results, { childList: true, subtree: true });
    label();
  }
  // скрипт подключается в <head>: ждём, пока появится блок результатов
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
