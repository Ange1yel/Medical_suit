// Paste your deployed Google Apps Script /exec URL below, then commit this file.
// Never put a Telegram bot token or other secrets in frontend JavaScript.
const LEADS_ENDPOINT = "https://script.google.com/macros/s/AKfycbylSu0Dh5F_9wnx_dBMWwRiFMYrWLk52jfDj4dbWynhWunSs-y4SZpH6P5hiL6eoGY1/exec";
const dialog = document.getElementById('dialog');
const form = document.getElementById('form');
const status = document.getElementById('status');
const submit = form.querySelector('button[type="submit"]');
document.getElementById('orderButton').addEventListener('click', () => dialog.showModal());

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.textContent = '';
  if (!form.reportValidity()) return;
  if (!LEADS_ENDPOINT.startsWith('https://script.google.com/macros/s/') || !LEADS_ENDPOINT.endsWith('/exec')) {
    status.textContent = 'Приём заявок пока настраивается. Пожалуйста, зайдите позже.';
    return;
  }
  const data = new FormData(form);
  if (!data.get('consent')) {
    status.textContent = 'Для отправки заявки необходимо согласие на обработку данных.';
    return;
  }
  data.set('source', window.location.href);
  data.set('requestId', (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  data.set('createdAt', new Date().toISOString());
  data.set('consentAt', new Date().toISOString());
  data.set('consentVersion', '2026-11-25');
  submit.disabled = true;
  status.textContent = 'Отправляем заявку…';
  try {
    // Apps Script redirects to googleusercontent.com. With no-cors the browser
    // cannot read or verify the server's response; do not claim confirmed receipt.
    await fetch(LEADS_ENDPOINT, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(data) });
    status.textContent = 'Запрос отправлен. Подтверждение получения недоступно — при необходимости свяжитесь с нами повторно.';
    form.reset();
  } catch (_) {
    status.textContent = 'Не удалось отправить заявку. Проверьте подключение и попробуйте позже.';
  } finally {
    submit.disabled = false;
  }
});
// Cookie preferences: no optional analytics are loaded by this site at present.
(() => {
  const banner = document.getElementById("cookieBanner");
  if (!banner) return;
  const storageKey = "medical_suit_cookie_choice_v2";
  let choice = null;
  try { choice = localStorage.getItem(storageKey); } catch (_) { /* storage disabled */ }
  if (choice !== "accepted" && choice !== "necessary") banner.hidden = false;
  function choose(value) {
    try { localStorage.setItem(storageKey, value); } catch (_) { /* storage disabled */ }
    banner.hidden = true;
  }
  document.getElementById("cookieAccept").addEventListener("click", () => choose("accepted"));
  document.getElementById("cookieReject").addEventListener("click", () => choose("necessary"));
  document.getElementById("cookieSettings")?.addEventListener("click", () => { banner.hidden = false; banner.scrollIntoView({behavior:"smooth",block:"nearest"}); });
})();
