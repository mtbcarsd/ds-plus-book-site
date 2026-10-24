// Форма «Написать вопрос» в разделах «Вопросы и что осталось непонятным».
// Открывает чат в Telegram с заполненным сообщением: текст + страница, с которой спрашивают.
// Отправляет сам пользователь из своего Telegram — никаких ключей и серверов.
(() => {
  const TELEGRAM = "dsneo";
  const HEADING = /^Вопросы и что осталось непонятным/;
  const MAX_LEN = 2000;

  function setup(section) {
    if (section.querySelector(".feedback-form")) return;
    const form = document.createElement("form");
    form.className = "feedback-form";
    form.innerHTML =
      `<label for="feedback-text">Есть вопрос по этой странице? Напишите — он придёт в Telegram @${TELEGRAM}.</label>` +
      `<textarea id="feedback-text" rows="4" maxlength="${MAX_LEN}" placeholder="Что непонятно или что хотите обсудить…"></textarea>` +
      `<div class="feedback-actions"><button type="submit">✈ Отправить в Telegram</button>` +
      `<span class="feedback-hint">Откроется Telegram с готовым сообщением — останется нажать «Отправить».</span></div>`;
    const text = form.querySelector("textarea");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const body = text.value.trim();
      if (!body) {
        text.focus();
        return;
      }
      const title = document.title.split(" — ")[0];
      const message = `📘 Вопрос по книге\n${title}\n${location.href.split("#")[0]}\n\n${body}`;
      window.open(`https://t.me/${TELEGRAM}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
    });
    section.appendChild(form);
  }

  function init() {
    document.querySelectorAll("article section > h2").forEach((h) => {
      if (HEADING.test(h.textContent.trim())) setup(h.parentElement);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
