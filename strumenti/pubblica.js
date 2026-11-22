// Pubblica una copia esportata dal pannello.
// Uso:  node strumenti/pubblica.js percorso/biglietto-AAAA-MM-GG.json
// Scrive content/profile.json e content/files/…; poi basta fare commit e push.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'content');
const FILES = path.join(OUT, 'files');
const LANGS = ['it', 'en', 'fa'];
const PLATFORMS = ['instagram', 'linkedin', 'tiktok', 'youtube', 'x', 'facebook', 'telegram', 'whatsapp', 'github', 'website', 'other'];
const ID = /^[a-f0-9]{24}$/;
const EXT_BY_TYPE = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'application/pdf': 'pdf' };
// File che il browser potrebbe eseguire come pagina: vengono salvati come semplice download.
const RISKY = new Set(['html', 'htm', 'xhtml', 'svg', 'xml', 'js', 'mjs']);

const src = process.argv[2];
if (!src) { console.error('Uso: node strumenti/pubblica.js <copia esportata .json>'); process.exit(1); }
const bundle = JSON.parse(fs.readFileSync(src, 'utf8'));
if (bundle.format !== 'biglietto-da-visita' || !bundle.profile) { console.error('Il file non è una copia valida.'); process.exit(1); }

const str = (v, max = 5000) => (typeof v === 'string' ? v.slice(0, max) : '');
const loc = (v, max) => Object.fromEntries(LANGS.map(l => [l, str(v?.[l], max)]));
function safeLink(v) {
  try {
    const u = new URL(str(v, 500).trim());
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(u.protocol) ? u.href : '';
  } catch { return ''; }
}

fs.rmSync(FILES, { recursive: true, force: true });
fs.mkdirSync(FILES, { recursive: true });

function writeFile(id, name) {
  const f = bundle.files?.[id];
  if (!ID.test(id || '') || typeof f?.data !== 'string') return null;
  let ext = (/\.([a-z0-9]{1,8})$/i.exec(name || '') || [])[1]?.toLowerCase() || EXT_BY_TYPE[f.type] || 'bin';
  if (RISKY.has(ext)) ext = 'bin';
  fs.writeFileSync(path.join(FILES, `${id}.${ext}`), Buffer.from(f.data, 'base64'));
  return `content/files/${id}.${ext}`;
}

const p = bundle.profile;
const out = {
  name: loc(p.name, 120),
  headline: loc(p.headline, 200),
  location: loc(p.location, 120),
  bio: loc(p.bio, 8000),
  email: str(p.email, 200).trim(),
  phone: str(p.phone, 60).trim(),
  photo: p.photo ? writeFile(p.photo, 'foto.jpg') : null,
  links: (p.links || []).map(l => ({
    platform: PLATFORMS.includes(l?.platform) ? l.platform : 'other',
    url: safeLink(l?.url),
  })).filter(l => l.url),
  posts: (p.posts || []).map(x => ({
    id: ID.test(x?.id) ? x.id : '',
    date: /^\d{4}-\d{2}-\d{2}$/.test(x?.date) ? x.date : new Date().toISOString().slice(0, 10),
    title: loc(x?.title, 200),
    body: loc(x?.body, 30000),
  })).filter(x => LANGS.some(l => x.title[l] || x.body[l])),
  files: (p.files || []).map(f => {
    const url = writeFile(f?.id, f?.name);
    return url && { id: f.id, name: str(f.name, 200), size: Number(f.size) || 0, type: str(f.type, 100), title: loc(f.title, 200), url };
  }).filter(Boolean),
  publishedAt: new Date().toISOString(),
};

fs.writeFileSync(path.join(OUT, 'profile.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`Pubblicato: ${out.posts.length} scritti, ${out.files.length} documenti, foto: ${out.photo ? 'sì' : 'no'}.`);
console.log('Ora: git add content && git commit -m "Aggiorna contenuti" && git push');
