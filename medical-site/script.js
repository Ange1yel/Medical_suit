// Paste your deployed Google Apps Script /exec URL below, then commit this file.
// Never put a Telegram bot token or other secrets in frontend JavaScript.
const LEADS_ENDPOINT = "";
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