// Biglietto da visita — server senza dipendenze.
// Avvio: `node server.js`  →  sito: http://localhost:8080   pannello: http://localhost:8080/admin
// Variabili opzionali: PORT, ADMIN_PASSWORD (usata solo al primo avvio).

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PUB = path.join(ROOT, 'public');
const DATA = path.join(ROOT, 'data');
const UPLOADS = path.join(ROOT, 'uploads');
const PROFILE_FILE = path.join(DATA, 'profile.json');
const AUTH_FILE = path.join(DATA, 'auth.json');
const FIRST_PW_FILE = path.join(DATA, 'password-iniziale.txt');
const PORT = Number(process.env.PORT) || 8080;
const MAX_FILE = 20 * 1024 * 1024;               // 20 MB per file
const MAX_BODY = Math.ceil(MAX_FILE * 1.4) + 4096; // base64 + JSON
const LANGS = ['it', 'en', 'fa'];
const PLATFORMS = ['instagram', 'linkedin', 'tiktok', 'youtube', 'x', 'facebook', 'telegram', 'whatsapp', 'github', 'website', 'other'];

fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(UPLOADS, { recursive: true });

// ---------- dati ----------
const L = (it = '', en = '', fa = '') => ({ it, en, fa });
const DEFAULT_PROFILE = {
  name: L('Ghazaleh', 'Ghazaleh', 'غزاله'),
  headline: L('La tua professione', 'Your profession', 'حرفه شما'),
  location: L(),
  bio: L('Scrivi qui qualcosa su di te.', 'Write something about yourself here.', 'اینجا چیزی درباره خودتان بنویسید.'),
  email: '', phone: '', photo: null,
  links: [], posts: [], files: [], updatedAt: null,
};
function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJSON(file, value) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}
let profile = { ...structuredClone(DEFAULT_PROFILE), ...readJSON(PROFILE_FILE, {}) };
const saveProfile = () => { profile.updatedAt = new Date().toISOString(); writeJSON(PROFILE_FILE, profile); };

// ---------- password & sessioni ----------
function hashPw(pw, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(String(pw), salt, 64).toString('hex') };
}
let auth = readJSON(AUTH_FILE, null);
if (!auth) {
  const pw = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
  auth = hashPw(pw);
  writeJSON(AUTH_FILE, auth);
  if (!process.env.ADMIN_PASSWORD) {
    fs.writeFileSync(FIRST_PW_FILE, pw + '\n');
    console.log(`\nPassword iniziale del pannello: ${pw}\n(salvata in data/password-iniziale.txt — cambiala dal pannello)\n`);
  }
}
function checkPw(pw) {
  const h = crypto.scryptSync(String(pw ?? ''), auth.salt, 64);
  return crypto.timingSafeEqual(h, Buffer.from(auth.hash, 'hex'));
}
const sessions = new Map(); // token -> scadenza
const SESSION_TTL = 7 * 24 * 3600 * 1000;
function sessionOf(req) {
  const m = /(?:^|;\s*)sid=([a-f0-9]{64})/.exec(req.headers.cookie || '');
  if (!m) return null;
  const exp = sessions.get(m[1]);
  if (!exp || exp < Date.now()) { sessions.delete(m[1]); return null; }
  return m[1];
}
const failures = new Map(); // ip -> { n, until }
function locked(ip) { const f = failures.get(ip); return f && f.until > Date.now(); }
function recordFailure(ip) {
  const f = failures.get(ip) || { n: 0, until: 0 };
  f.n += 1;
  if (f.n >= 5) { f.until = Date.now() + 60_000; f.n = 0; }
  failures.set(ip, f);
}

// ---------- validazione ----------
const str = (v, max = 5000) => (typeof v === 'string' ? v.slice(0, max) : '');
const loc = (v, max) => Object.fromEntries(LANGS.map(l => [l, str(v?.[l], max)]));
function normUrl(v) {
  let s = str(v, 500).trim();
  if (!s) return '';
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = 'https://' + s;
  try {
    const u = new URL(s);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(u.protocol) ? u.href : '';
  } catch { return ''; }
}
const newId = () => crypto.randomBytes(12).toString('hex');

function cleanProfile(b) {
  const serverFiles = new Map(profile.files.map(f => [f.id, f]));
  const files = (Array.isArray(b.files) ? b.files : [])
    .filter(f => serverFiles.has(f?.id))
    .map(f => ({ ...serverFiles.get(f.id), title: loc(f.title, 200) }));
  for (const f of profile.files) if (!files.some(x => x.id === f.id)) files.push(f);

  return {
    name: loc(b.name, 120),
    headline: loc(b.headline, 200),
    location: loc(b.location, 120),
    bio: loc(b.bio, 8000),
    email: str(b.email, 200).trim(),
    phone: str(b.phone, 60).trim(),
    photo: profile.photo,
    links: (Array.isArray(b.links) ? b.links : []).slice(0, 30).map(l => ({
      platform: PLATFORMS.includes(l?.platform) ? l.platform : 'other',
      label: str(l?.label, 60),
      url: normUrl(l?.url),
    })).filter(l => l.url),
    posts: (Array.isArray(b.posts) ? b.posts : []).slice(0, 200).map(p => ({
      id: /^[a-f0-9]{24}$/.test(p?.id) ? p.id : newId(),
      date: /^\d{4}-\d{2}-\d{2}$/.test(p?.date) ? p.date : new Date().toISOString().slice(0, 10),
      title: loc(p?.title, 200),
      body: loc(p?.body, 30000),
    })).filter(p => LANGS.some(l => p.title[l] || p.body[l])),
    files,
    updatedAt: profile.updatedAt,
  };
}

// ---------- upload ----------
const IMAGE_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
  '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4',
  '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.zip': 'application/zip',
};
const INLINE_UPLOADS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.mp3', '.mp4']);

function removeUpload(url) {
  const m = /^\/uploads\/([a-f0-9]{24}(?:\.[a-z0-9]{1,8})?)$/.exec(url || '');
  if (m) fs.rm(path.join(UPLOADS, m[1]), { force: true }, () => {});
}

// ---------- http ----------
function send(res, status, body, headers = {}) {
  const isObj = body !== undefined && !Buffer.isBuffer(body) && typeof body !== 'string';
  res.writeHead(status, {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    ...(isObj ? { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } : {}),
    ...headers,
  });
  res.end(isObj ? JSON.stringify(body) : body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0, tooBig = false;
    const chunks = [];
    req.on('data', c => { size += c.length; if (size > MAX_BODY) tooBig = true; else chunks.push(c); });
    req.on('end', () => {
      if (tooBig) return reject(Object.assign(new Error('too_large'), { status: 413 }));
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { reject(Object.assign(new Error('bad_json'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}
function serveFile(res, file, extraHeaders = {}) {
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
    send(res, 200, data, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache', ...extraHeaders });
  });
}

async function api(req, res, url) {
  const ip = req.socket.remoteAddress;
  const sid = sessionOf(req);
  const route = `${req.method} ${url.pathname}`;

  if (route === 'GET /api/profile') return send(res, 200, profile);
  if (route === 'GET /api/me') return send(res, 200, { authed: !!sid });

  // le richieste che modificano devono essere JSON (difesa CSRF insieme a SameSite=Strict)
  if (req.method !== 'GET' && !(req.headers['content-type'] || '').startsWith('application/json')) {
    return send(res, 415, { error: 'json_required' });
  }

  if (route === 'POST /api/login') {
    if (locked(ip)) return send(res, 429, { error: 'too_many' });
    const body = await readBody(req);
    if (!checkPw(body.password)) { recordFailure(ip); return send(res, 401, { error: 'wrong_password' }); }
    failures.delete(ip);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + SESSION_TTL);
    return send(res, 200, { ok: true }, { 'Set-Cookie': `sid=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL / 1000}` });
  }

  if (!sid) return send(res, 401, { error: 'not_logged_in' });

  if (route === 'POST /api/logout') {
    sessions.delete(sid);
    return send(res, 200, { ok: true }, { 'Set-Cookie': 'sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
  }
  if (route === 'PUT /api/profile') {
    profile = cleanProfile(await readBody(req));
    saveProfile();
    return send(res, 200, profile);
  }
  if (route === 'POST /api/upload') {
    const b = await readBody(req);
    const buf = Buffer.from(str(b.data, MAX_BODY), 'base64');
    if (!buf.length) return send(res, 400, { error: 'empty' });
    if (buf.length > MAX_FILE) return send(res, 413, { error: 'too_large' });
    const id = newId();
    if (b.kind === 'photo') {
      const ext = IMAGE_TYPES[b.type];
      if (!ext) return send(res, 400, { error: 'not_an_image' });
      fs.writeFileSync(path.join(UPLOADS, id + ext), buf);
      removeUpload(profile.photo);
      profile.photo = `/uploads/${id}${ext}`;
    } else {
      const name = str(b.name, 200).replace(/[\\/\0]/g, '_') || 'file';
      const m = /\.([a-z0-9]{1,8})$/i.exec(name);
      const ext = m ? '.' + m[1].toLowerCase() : '';
      fs.writeFileSync(path.join(UPLOADS, id + ext), buf);
      profile.files.push({
        id, url: `/uploads/${id}${ext}`, name, size: buf.length, type: str(b.type, 100),
        title: L(...Array(3).fill(name.replace(/\.[^.]+$/, ''))),
      });
    }
    saveProfile();
    return send(res, 200, profile);
  }
  if (req.method === 'DELETE' && url.pathname === '/api/photo') {
    removeUpload(profile.photo);
    profile.photo = null;
    saveProfile();
    return send(res, 200, profile);
  }
  const del = /^\/api\/files\/([a-f0-9]{24})$/.exec(url.pathname);
  if (req.method === 'DELETE' && del) {
    const f = profile.files.find(x => x.id === del[1]);
    if (!f) return send(res, 404, { error: 'not_found' });
    removeUpload(f.url);
    profile.files = profile.files.filter(x => x !== f);
    saveProfile();
    return send(res, 200, profile);
  }
  if (route === 'POST /api/password') {
    const b = await readBody(req);
    if (!checkPw(b.current)) { recordFailure(ip); return send(res, 401, { error: 'wrong_password' }); }
    if (typeof b.next !== 'string' || b.next.length < 8) return send(res, 400, { error: 'too_short' });
    auth = hashPw(b.next);
    writeJSON(AUTH_FILE, auth);
    fs.rm(FIRST_PW_FILE, { force: true }, () => {});
    for (const token of sessions.keys()) if (token !== sid) sessions.delete(token);
    return send(res, 200, { ok: true });
  }
  return send(res, 404, { error: 'not_found' });
}

http.createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url, 'http://localhost'); } catch { return send(res, 400, 'Bad request'); }
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');

    if (url.pathname === '/') return serveFile(res, path.join(PUB, 'index.html'));
    if (url.pathname === '/admin') return serveFile(res, path.join(PUB, 'admin.html'), { 'X-Robots-Tag': 'noindex' });

    const up = /^\/uploads\/([a-f0-9]{24})(\.[a-z0-9]{1,8})?$/.exec(url.pathname);
    if (up) {
      const ext = up[2] || '';
      const entry = profile.files.find(f => f.url === url.pathname);
      const fname = encodeURIComponent(entry?.name || up[1] + ext);
      const disp = INLINE_UPLOADS.has(ext) ? 'inline' : 'attachment';
      return serveFile(res, path.join(UPLOADS, up[1] + ext), {
        'Content-Disposition': `${disp}; filename*=UTF-8''${fname}`,
        ...(disp === 'attachment' ? { 'Content-Security-Policy': "default-src 'none'; sandbox" } : {}),
      });
    }
    const pub = /^\/([a-z0-9-]+\.(?:css|js|svg|ico|png))$/.exec(url.pathname);
    if (pub) return serveFile(res, path.join(PUB, pub[1]));
    return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
  } catch (e) {
    const status = e.status || 500;
    if (status === 500) console.error(e);
    if (!res.headersSent) send(res, status, { error: e.message || 'error' });
  }
}).listen(PORT, () => {
  console.log(`Sito:      http://localhost:${PORT}`);
  console.log(`Pannello:  http://localhost:${PORT}/admin`);
});
