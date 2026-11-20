// Gen Artz — Windows desktop app (Electron main process)
const { app, BrowserWindow, ipcMain, shell, safeStorage, Notification, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const API_HOST = 'api.higgsfield.ai';
const API = `https://${API_HOST}`;
let win;

app.setAppUserModelId('com.genverse.genartz'); // Windows notifications + taskbar grouping

if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

/* ---------- API key: encrypted on disk with Windows DPAPI via safeStorage ---------- */
const credFile = () => path.join(app.getPath('userData'), 'higgsfield-key.bin');
function readCreds() {
  try {
    const buf = fs.readFileSync(credFile());
    const json = safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(buf) : buf.toString('utf8');
    const c = JSON.parse(json);
    return c && c.id && c.secret ? c : null;
  } catch { return null; }
}
function writeCreds(c) {
  if (!c || !c.id) { try { fs.unlinkSync(credFile()); } catch {} return; }
  const json = JSON.stringify({ id: String(c.id).trim(), secret: String(c.secret).trim() });
  const data = safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(json) : Buffer.from(json, 'utf8');
  fs.writeFileSync(credFile(), data);
}

/* ---------- Higgsfield API calls (main process only — the secret never reaches the page) ---------- */
async function hf(method, target, body, idem) {
  const c = readCreds();
  if (!c) throw new Error('Add your Higgsfield API key in Settings.');
  const url = /^https:\/\//.test(target) ? target : `${API}/${String(target).replace(/^\/+/, '')}`;
  if (new URL(url).host !== API_HOST) throw new Error('Blocked: only api.higgsfield.ai is allowed.');
  const headers = { Authorization: `Key ${c.id}:${c.secret}`, 'Content-Type': 'application/json', Accept: 'application/json' };
  if (idem) headers['Idempotency-Key'] = idem;
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    const msg = data.detail || data.message || data.error || text.slice(0, 200);
    const hint = res.status === 401 ? ' (check your API key)' : res.status === 402 ? ' (top up your API balance)' :
      [404, 423, 503].includes(res.status) ? ' (model unavailable to this account, or wrong endpoint)' : '';
    throw new Error(`HTTP ${res.status}${hint}: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`);
  }
  return data;
}
const wrap = fn => async (...a) => { try { return { ok: true, data: await fn(...a) }; } catch (e) { return { ok: false, error: e.message }; } };

ipcMain.handle('hf:submit', wrap((_e, { path: p, body, idem }) => hf('POST', p, body, idem || crypto.randomUUID())));
ipcMain.handle('hf:status', wrap((_e, id) => hf('GET', `requests/${encodeURIComponent(id)}/status`)));
ipcMain.handle('hf:cancel', wrap((_e, { id, url }) => hf('POST', url || `requests/${encodeURIComponent(id)}/cancel`)));
ipcMain.handle('hf:setKey', (_e, c) => { try { writeCreds(c); return { ok: true }; } catch (e) { return { ok: false, error: e.message }; } });
ipcMain.handle('hf:hasKey', () => !!readCreds());
ipcMain.handle('hf:test', async () => {
  const c = readCreds(); if (!c) return { ok: false, error: 'No key saved.' };
  try {
    // A status lookup for a random id: 401 = bad key; 404/400 = key accepted.
    const res = await fetch(`${API}/requests/${crypto.randomUUID()}/status`, { headers: { Authorization: `Key ${c.id}:${c.secret}` } });
    if (res.status === 401 || res.status === 403) return { ok: false, error: 'Higgsfield rejected the key (HTTP ' + res.status + ').' };
    return { ok: true };
  } catch (e) { return { ok: false, error: 'Could not reach api.higgsfield.ai: ' + e.message }; }
});
ipcMain.handle('app:open', (_e, url) => { if (/^https:\/\//.test(url)) shell.openExternal(url); });
ipcMain.handle('app:notify', (_e, { title, body }) => { if (Notification.isSupported()) new Notification({ title, body }).show(); });

/* ---------- window ---------- */
function createWindow() {
  win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 980, minHeight: 640,
    title: 'Gen Artz', backgroundColor: '#0d0f15', show: false, autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: true }
  });
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  // Links open in the user's browser, never inside the app
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) { e.preventDefault(); if (/^https?:\/\//.test(url)) shell.openExternal(url); } });
}
Menu.setApplicationMenu(null);
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
