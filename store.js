// Salvataggio nel browser (IndexedDB) + esportazione/importazione in un unico file.
// Niente server: tutto ciò che si scrive nel pannello resta su questo dispositivo finché non si esporta.
(function () {
  const DB_NAME = 'biglietto-da-visita';
  const FORMAT = 'biglietto-da-visita';
  const L = (it = '', en = '', fa = '') => ({ it, en, fa });

  const DEFAULT = {
    name: L('Ghazaleh', 'Ghazaleh', 'غزاله'),
    headline: L(), location: L(), bio: L(),
    email: '', phone: '',
    photo: null,   // id del file della foto
    links: [],     // { platform, url }
    posts: [],     // { id, date, title{}, body{} }
    files: [],     // { id, name, size, type, title{} }
  };

  let dbPromise;
  function db() {
    dbPromise ||= new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore('kv');
        req.result.createObjectStore('files');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }
  async function tx(store, mode, fn) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const t = d.transaction(store, mode);
      const req = fn(t.objectStore(store));
      t.oncomplete = () => resolve(req ? req.result : undefined);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }
  const get = (store, key) => tx(store, 'readonly', s => s.get(key));
  const put = (store, key, value) => tx(store, 'readwrite', s => s.put(value, key));
  const del = (store, key) => tx(store, 'readwrite', s => s.delete(key));
  const clear = store => tx(store, 'readwrite', s => s.clear());

  function newId() {
    return [...crypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  function normalize(p) {
    const out = { ...structuredClone(DEFAULT), ...(p || {}) };
    for (const k of ['name', 'headline', 'location', 'bio']) out[k] = { ...L(), ...(out[k] || {}) };
    for (const k of ['links', 'posts', 'files']) if (!Array.isArray(out[k])) out[k] = [];
    return out;
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1] || '');
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  }
  async function base64ToBlob(data, type) {
    const res = await fetch(`data:${type || 'application/octet-stream'};base64,${data}`);
    return res.blob();
  }

  const Store = {
    DEFAULT,
    newId,
    normalize,
    async loadDraft() { return normalize(await get('kv', 'profile')); },
    saveDraft: profile => put('kv', 'profile', profile),
    async getMeta() { return (await get('kv', 'meta')) || {}; },
    setMeta: meta => put('kv', 'meta', meta),
    getFile: id => get('files', id),
    putFile: (id, blob) => put('files', id, blob),
    deleteFile: id => del('files', id),

    // Un unico file .json con testi, foto e documenti.
    async exportBundle(profile) {
      const ids = [profile.photo, ...profile.files.map(f => f.id)].filter(Boolean);
      const files = {};
      for (const id of ids) {
        const blob = await get('files', id);
        if (blob) files[id] = { type: blob.type || '', data: await blobToBase64(blob) };
      }
      const bundle = { format: FORMAT, version: 1, exportedAt: new Date().toISOString(), profile, files };
      return new Blob([JSON.stringify(bundle)], { type: 'application/json' });
    },

    async importBundle(text) {
      const b = JSON.parse(text);
      if (b?.format !== FORMAT || !b.profile) throw new Error('invalid');
      const profile = normalize(b.profile);
      await clear('files');
      for (const [id, f] of Object.entries(b.files || {})) {
        if (/^[a-f0-9]{24}$/.test(id) && typeof f?.data === 'string') await put('files', id, await base64ToBlob(f.data, f.type));
      }
      await put('kv', 'profile', profile);
      return profile;
    },
  };

  window.Store = Store;
})();
