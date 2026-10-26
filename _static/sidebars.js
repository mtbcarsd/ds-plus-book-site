// Кнопки «Toggle primary/secondary sidebar».
// И sphinx-book-theme 1.3, и pydata-sphinx-theme 0.17 вешают обработчики через document.querySelector — только на
// ПЕРВУЮ кнопку каждого вида (скрытую иконку в шапке), поэтому видимые кнопки над статьёй ничего не делали.
// Широкий экран: сами скрываем/показываем панель (состояние запоминается в этом браузере).
// Узкий экран: переадресуем клик на первую кнопку — на ней штатное окно темы (перенос содержимого, Esc, возврат).
(() => {
  const PANELS = {
    primary: { button: ".primary-toggle", panel: "#pst-primary-sidebar", wide: "(min-width: 992px)" },
    secondary: { button: ".secondary-toggle", panel: ".bd-sidebar-secondary", wide: "(min-width: 1200px)" },
  };
  const KEY = "sidebar-hidden:";
  const HIDDEN = "pst-sidebar-hidden";

  function remember(name, hidden) {
    try { localStorage.setItem(KEY + name, hidden ? "1" : "0"); } catch { /* без хранилища — только до перезагрузки */ }
  }
  function restore(name) {
    try { return localStorage.getItem(KEY + name) === "1"; } catch { return false; }
  }

  document.addEventListener("click", (e) => {
    for (const [name, p] of Object.entries(PANELS)) {
      const btn = e.target.closest(p.button);
      if (!btn) continue;
      const panel = document.querySelector(p.panel);
      if (!panel) return;
      if (!window.matchMedia(p.wide).matches) {
        const first = document.querySelector(p.button);
        if (first && first !== btn) {
          e.preventDefault();
          e.stopImmediatePropagation();
          first.click();
        }
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      remember(name, panel.classList.toggle(HIDDEN));
      btn.blur();
      return;
    }
  }, true);

  function init() {
    for (const [name, p] of Object.entries(PANELS)) {
      const panel = document.querySelector(p.panel);
      if (panel && restore(name) && window.matchMedia(p.wide).matches) panel.classList.add(HIDDEN);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
