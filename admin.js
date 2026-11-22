// Pannello del biglietto da visita: tutto viene salvato in automatico nel browser.
(function () {
  const BV = window.BV;
  const Store = window.Store;
  const { el, langs, meta: langMeta, safeUrl, fileSize } = BV;
  const $ = id => document.getElementById(id);

  let ui = BV.storedLang();      // lingua dell'interfaccia
  let contentLang = ui;          // lingua dei testi che si stanno modificando
  let profile = null;
  let meta = {};                 // { changedAt, exportedAt }
  let status = 'saved';          // saved | saving | error
  const t = key => BV.t(ui, key);
  const MAX_FILE = 20 * 1024 * 1024;

  const PLATFORM_ORDER = ['instagram', 'linkedin', 'tiktok', 'youtube', 'x', 'facebook', 'telegram', 'whatsapp', 'github', 'website', 'other'];
  const USER_BASES = {
    instagram: 'https://instagram.com/', tiktok: 'https://www.tiktok.com/@', x: 'https://x.com/',
    telegram: 'https://t.me/', github: 'https://github.com/', youtube: 'https://www.youtube.com/@',
    facebook: 'https://facebook.com/', linkedin: 'https://www.linkedin.com/in/',
  };
  const L = () => ({ it: '', en: '', fa: '' });

  // ---------- salvataggio automatico ----------
  function setStatus(s) {
    status = s;
    const n = $('status');
    n.className = 'status' + (s === 'saving' ? ' dirty' : '') + (s === 'error' ? ' err' : '');
    n.textContent = t({ saved: 'saved', saving: 'saving', error: 'saveError' }[s]);
  }
  let saveTimer;
  function markDirty() {
    setStatus('saving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 400);
  }
  async function persist() {
    clearTimeout(saveTimer);
    try {
      await Store.saveDraft(profile);
      meta.changedAt = Date.now();
      await Store.setMeta(meta);
      setStatus('saved');
      renderBackupState();
    } catch {
      setStatus('error');
    }
  }

  // URL temporanei per mostrare foto e file salvati nel browser
  const objectUrls = new Map();
  async function fileUrl(id) {
    if (!id) return null;
    if (objectUrls.has(id)) return objectUrls.get(id);
    const blob = await Store.getFile(id);
    const url = blob ? URL.createObjectURL(blob) : null;
    objectUrls.set(id, url);
    return url;
  }
  function forgetUrl(id) {
    const u = objectUrls.get(id);
    if (u) URL.revokeObjectURL(u);
    objectUrls.delete(id);
  }

  // ---------- campi ----------
  function field(label, control, extra) {
    return el('label', { class: 'field' }, el('span', { class: 'field-label' }, label, extra), control);
  }
  function locField(obj, key, label, { multiline = false, rows = 5, max = 200 } = {}) {
    obj[key] = { ...L(), ...(obj[key] || {}) };
    const m = langMeta(contentLang);
    const input = el(multiline ? 'textarea' : 'input', {
      class: 'input', dir: m.dir, lang: contentLang, maxlength: max, rows: multiline ? rows : null,
    });
    input.value = obj[key][contentLang] || '';
    const missing = !input.value && langs.some(l => obj[key][l.code])
      ? el('span', { class: 'tag-missing', text: t('missing') }) : null;
    input.addEventListener('input', () => { obj[key][contentLang] = input.value; markDirty(); });
    return field(label, input, missing);
  }
  function plainField(key, label, type) {
    const input = el('input', { class: 'input', type, dir: 'ltr', maxlength: 200 });
    input.value = profile[key] || '';
    input.addEventListener('input', () => { profile[key] = input.value.trim(); markDirty(); });
    return field(label, input);
  }
  const panel = (title, hint, ...children) =>
    el('section', { class: 'panel' }, el('h2', { text: title }), hint ? el('p', { class: 'hint', text: hint }) : null, children);

  function filePicker({ accept, multiple, onPick }) {
    const input = el('input', { type: 'file', accept, multiple, class: 'hidden' });
    input.addEventListener('change', () => { const files = [...input.files]; input.value = ''; if (files.length) onPick(files); });
    return input;
  }
  // Ridimensiona la foto e rimuove i metadati (es. posizione GPS).
  async function resizeImage(file, max = 900) {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s);
    c.height = Math.round(bmp.height * s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('encode'))), 'image/jpeg', 0.9));
  }

  // ---------- sezioni ----------
  function backupPanel() {
    const msg = el('span', { class: 'muted', id: 'backup-msg' });
    const picker = filePicker({
      accept: '.json,application/json',
      onPick: async ([file]) => {
        if (!confirm(t('importConfirm'))) return;
        try {
          profile = await Store.importBundle(await file.text());
          for (const id of [...objectUrls.keys()]) forgetUrl(id);
          meta = { changedAt: Date.now(), exportedAt: Date.now() };
          await Store.setMeta(meta);
          renderEditor();
          $('backup-msg').className = 'toast-ok';
          $('backup-msg').textContent = t('imported');
        } catch {
          msg.className = 'error-msg';
          msg.textContent = t('importError');
        }
      },
    });
    return panel(t('backup'), t('backupHint'),
      el('p', { id: 'backup-state', class: 'backup-state' }),
      el('div', { class: 'row' },
        el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: exportCopy }, t('exportBtn')),
        el('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => picker.click() }, t('importBtn')),
        msg, picker));
  }
  function renderBackupState() {
    const n = $('backup-state');
    if (!n) return;
    const df = new Intl.DateTimeFormat(langMeta(ui).locale, { dateStyle: 'medium', timeStyle: 'short' });
    if (!meta.exportedAt) { n.className = 'backup-state warn'; n.textContent = t('neverExported'); }
    else if ((meta.changedAt || 0) > meta.exportedAt) {
      n.className = 'backup-state warn';
      n.textContent = `${t('notExported')} ${t('lastExport')} ${df.format(meta.exportedAt)}`;
    } else { n.className = 'backup-state ok'; n.textContent = `${t('lastExport')} ${df.format(meta.exportedAt)}`; }
  }
  async function exportCopy() {
    const btns = [$('export-bar'), ...document.querySelectorAll('.panel .btn-primary')].filter(Boolean);
    try {
      await persist();
      $('export-bar').textContent = t('exporting');
      const blob = await Store.exportBundle(profile);
      const a = el('a', { href: URL.createObjectURL(blob), download: `biglietto-${new Date().toISOString().slice(0, 10)}.json` });
      document.body.append(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      meta.exportedAt = Date.now();
      await Store.setMeta(meta);
      renderBackupState();
    } catch {
      setStatus('error');
    } finally {
      $('export-bar').textContent = t('exportBtn');
      btns.forEach(b => { b.disabled = false; });
    }
  }

  function photoPanel() {
    const name = BV.pick(profile.name, contentLang);
    const msg = el('span', { class: 'muted' });
    const avatar = el('div', { class: 'avatar' }, el('span', { class: 'initials', text: (name || '?')[0].toUpperCase() }));
    fileUrl(profile.photo).then(u => { if (u) avatar.replaceChildren(el('img', { src: u, alt: '' })); });
    const picker = filePicker({
      accept: 'image/*',
      onPick: async ([file]) => {
        msg.className = 'muted'; msg.textContent = t('uploading');
        try {
          const blob = await resizeImage(file);
          const id = Store.newId();
          await Store.putFile(id, blob);
          if (profile.photo) { await Store.deleteFile(profile.photo); forgetUrl(profile.photo); }
          profile.photo = id;
          await persist();
          renderEditor();
        } catch { msg.className = 'error-msg'; msg.textContent = t('uploadError'); }
      },
    });
    return panel(t('photo'), t('photoHint'),
      el('div', { class: 'photo-edit' }, avatar,
        el('div', { class: 'row' },
          el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: () => picker.click() }, t(profile.photo ? 'changePhoto' : 'uploadPhoto')),
          profile.photo ? el('button', {
            class: 'btn btn-danger btn-sm', type: 'button',
            onclick: async () => {
              await Store.deleteFile(profile.photo); forgetUrl(profile.photo);
              profile.photo = null; await persist(); renderEditor();
            },
          }, t('removePhoto')) : null,
          msg, picker)));
  }

  function profilePanel() {
    return panel(t('profile'), null,
      locField(profile, 'name', t('name'), { max: 120 }),
      locField(profile, 'headline', t('headline'), { max: 200 }),
      locField(profile, 'location', t('location'), { max: 120 }),
      locField(profile, 'bio', t('bio'), { multiline: true, rows: 7, max: 8000 }));
  }

  function contactsPanel() {
    return panel(t('contacts'), null,
      el('div', { class: 'grid-2' }, plainField('email', t('email'), 'email'), plainField('phone', t('phone'), 'tel')));
  }

  function normalizeLink(l) {
    const v = (l.url || '').trim();
    if (!v || /^[a-z][a-z0-9+.-]*:/i.test(v)) return v;
    if (l.platform === 'whatsapp' && /^[+\d\s().-]+$/.test(v)) return 'https://wa.me/' + v.replace(/\D/g, '');
    if (/^[^\s@/]+@[^\s@/]+\.[a-z]{2,}$/i.test(v)) return 'mailto:' + v;
    const looksLikeUrl = v.includes('/') || /\.(com|it|ir|net|org|me|io|co|app|dev|eu|info|be|ly|tv)$/i.test(v);
    if (!looksLikeUrl && USER_BASES[l.platform]) return USER_BASES[l.platform] + v.replace(/^@/, '');
    return 'https://' + v;
  }

  function linksPanel() {
    const list = el('div', { class: 'list' });
    const draw = () => {
      list.replaceChildren(...(profile.links.length ? profile.links.map((l, i) => {
        const select = el('select', { class: 'input', 'aria-label': t('platform') },
          PLATFORM_ORDER.map(p => el('option', { value: p, selected: p === l.platform }, BV.platformLabel(ui, p))));
        select.style.width = 'auto';
        select.addEventListener('change', () => { l.platform = select.value; l.url = normalizeLink(l); markDirty(); });
        const url = el('input', { class: 'input grow', dir: 'ltr', placeholder: t('url'), 'aria-label': t('url'), maxlength: 500 });
        url.value = l.url || '';
        url.addEventListener('input', () => { l.url = url.value; markDirty(); });
        url.addEventListener('blur', () => { l.url = normalizeLink(l); url.value = l.url; markDirty(); });
        return el('div', { class: 'row' }, select, url,
          el('button', { class: 'btn btn-danger btn-sm', type: 'button', onclick: () => { profile.links.splice(i, 1); markDirty(); draw(); } }, t('remove')));
      }) : [el('p', { class: 'empty', text: t('noLinks') })]));
    };
    draw();
    return panel(t('links'), null, list,
      el('button', {
        class: 'btn btn-ghost btn-sm', type: 'button',
        onclick: () => { profile.links.push({ platform: 'instagram', url: '' }); markDirty(); draw(); list.querySelector('.row:last-child input')?.focus(); },
      }, '+ ' + t('addLink')));
  }

  function postsPanel() {
    const list = el('div', { class: 'list' });
    const draw = () => {
      list.replaceChildren(...(profile.posts.length ? profile.posts.map((p, i) => {
        const date = el('input', { class: 'input', type: 'date', 'aria-label': t('date') });
        date.value = p.date;
        date.addEventListener('input', () => { p.date = date.value; markDirty(); });
        return el('div', { class: 'item' },
          el('div', { class: 'item-head' }, date,
            el('button', {
              class: 'btn btn-danger btn-sm', type: 'button',
              onclick: () => { if (confirm(t('confirmRemovePost'))) { profile.posts.splice(i, 1); markDirty(); draw(); } },
            }, t('remove'))),
          locField(p, 'title', t('postTitle'), { max: 200 }),
          locField(p, 'body', t('postBody'), { multiline: true, rows: 8, max: 30000 }));
      }) : [el('p', { class: 'empty', text: t('noPosts') })]));
    };
    draw();
    return panel(t('posts'), null,
      el('button', {
        class: 'btn btn-ghost btn-sm', type: 'button',
        onclick: () => {
          profile.posts.unshift({ id: Store.newId(), date: new Date().toISOString().slice(0, 10), title: L(), body: L() });
          markDirty(); draw(); list.querySelector('.item input:not([type=date])')?.focus();
        },
      }, '+ ' + t('addPost')),
      list);
  }

  function filesPanel() {
    const msg = el('span', { class: 'muted' });
    const picker = filePicker({
      multiple: true,
      onPick: async files => {
        for (const file of files) {
          if (file.size > MAX_FILE) { msg.className = 'error-msg'; msg.textContent = `${file.name}: ${t('tooBig')}`; continue; }
          msg.className = 'muted'; msg.textContent = `${t('uploading')} ${file.name}`;
          try {
            const id = Store.newId();
            await Store.putFile(id, file);
            const base = file.name.replace(/\.[^.]+$/, '');
            profile.files.push({ id, name: file.name, size: file.size, type: file.type, title: { it: base, en: base, fa: base } });
          } catch { msg.className = 'error-msg'; msg.textContent = `${file.name}: ${t('uploadError')}`; }
        }
        await persist();
        renderEditor();
      },
    });
    const items = profile.files.map((f, i) => {
      const link = el('a', { class: 'file-meta', target: '_blank', rel: 'noopener' }, `${f.name} · ${fileSize(f.size, ui)}`);
      fileUrl(f.id).then(u => { if (u) link.href = u; });
      return el('div', { class: 'item' },
        el('div', { class: 'item-head' }, link,
          el('button', {
            class: 'btn btn-danger btn-sm', type: 'button',
            onclick: async () => {
              if (!confirm(t('confirmDelete'))) return;
              await Store.deleteFile(f.id); forgetUrl(f.id);
              profile.files.splice(i, 1); await persist(); renderEditor();
            },
          }, t('remove'))),
        locField(f, 'title', t('fileTitle'), { max: 200 }));
    });
    return panel(t('files'), t('filesHint'),
      el('div', { class: 'row' },
        el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: () => picker.click() }, '+ ' + t('uploadFiles')),
        msg, picker),
      el('div', { class: 'list' }, items.length ? items : el('p', { class: 'empty', text: t('noFiles') })));
  }

  function renderEditor() {
    if (!profile) return;
    $('content-langs').replaceChildren(BV.langSwitch(contentLang, code => { contentLang = code; renderEditor(); }));
    $('editor-body').replaceChildren(
      backupPanel(), photoPanel(), profilePanel(), contactsPanel(), linksPanel(), postsPanel(), filesPanel());
    renderBackupState();
  }

  function applyUi() {
    BV.applyDocLang(ui);
    document.title = t('adminTitle');
    $('ui-langs').replaceChildren(BV.langSwitch(ui, code => {
      ui = code; BV.storeLang(code);
      applyUi(); setStatus(status); renderEditor();
    }));
  }

  $('export-bar').addEventListener('click', exportCopy);
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); persist(); }
  });
  // Se si chiude la pagina durante il salvataggio, chiede conferma.
  window.addEventListener('beforeunload', e => { if (status === 'saving') { e.preventDefault(); e.returnValue = ''; } });

  (async () => {
    applyUi();
    try {
      navigator.storage?.persist?.(); // chiede al browser di non cancellare i dati da solo
      [profile, meta] = await Promise.all([Store.loadDraft(), Store.getMeta()]);
      setStatus('saved');
      renderEditor();
    } catch {
      setStatus('error');
      $('editor-body').replaceChildren(el('p', { class: 'state', text: t('saveError') }));
    }
  })();
})();
