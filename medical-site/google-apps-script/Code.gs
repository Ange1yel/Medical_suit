/**
 * Google Apps Script -> Extensions -> Apps Script -> Code.gs.
 * Deploy > New deployment > Web app > Execute as: Me;
 * Who has access: Anyone. Paste /exec URL into medical-site/script.js.
 *
 * Private keys (optional) must be configured in Script Properties, NEVER in GitHub:
 * TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
 */
const SPREADSHEET_ID = '1cjhh42QvjBBaLR5zs7geOaQ5TqJ0qc2ZKoUbcO0GSY4';
const TAB_NAME = 'Заявки';

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    if (!e || !e.parameter) throw new Error('Empty request');
    const p = e.parameter;
    // Honeypot field, if present: discard bots without storing contact data.
    if (p.website) return ContentService.createTextOutput('ok');
    const name = String(p.name || '').trim().slice(0, 100);
    const contact = String(p.contact || '').trim().slice(0, 150);
    const size = String(p.size || 'Пока не знаю').trim().slice(0, 20);
    const reqId = String(p.requestId || '').trim().slice(0, 100);
    const source = String(p.source || '').trim().slice(0, 300);
    if (!name || !contact || !reqId || p.consent !== 'yes') throw new Error('Missing required fields');
    if (!['Пока не знаю', 'XS', 'S', 'M', 'L', 'XL'].includes(size)) throw new Error('Invalid size');
    lock.waitLock(10000);
    const cache = CacheService.getScriptCache();
    if (cache.get('lead_' + reqId)) return ContentService.createTextOutput('ok');
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TAB_NAME);
    if (!sheet) throw new Error('Sheet missing');
    // Prevent formula injection and treat untrusted form input as text.
    const asText = s => "'" + s.replace(/[\r\n]/g, ' ');
    sheet.appendRow([new Date(), asText(name), asText(contact), asText(size), asText(source), 'Новая', asText(reqId)]);
    cache.put('lead_' + reqId, '1', 21600);
    notifyTelegram(name, contact, size);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput('error');
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function notifyTelegram(name, contact, size) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('TELEGRAM_BOT_TOKEN');
  const chatId = props.getProperty('TELEGRAM_CHAT_ID');
  if (!token || !chatId) return;
  try {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'post', muteHttpExceptions: true,
      payload: {chat_id: chatId, text: 'Новая предзапись!\nИмя: ' + name + '\nКонтакт: ' + contact + '\nРазмер: ' + size }
    });
  } catch (err) { console.error('Telegram notification failed', err); }
}
