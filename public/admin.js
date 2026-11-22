// Pannello per modificare il biglietto da visita.
(function () {
  const BV = window.BV;
  const { el, langs, meta, safeUrl, fileSize } = BV;
  const $ = id => document.getElementById(id);

  let ui = BV.storedLang();      // lingua dell'interfaccia
  let contentLang = ui;          // lingua dei testi che si stanno modificando
  let profile = null;
  let status = 'saved';          // saved | dirty | saving | error
  const t = key => BV.t(ui, key);

  const PLATFORM_ORDER = ['instagram', 'linkedin', 'tiktok', 'youtube', 'x', 'facebook', 'telegram', 'whatsapp', 'github', 'website', 'other'];
  const USER_BASES = {
    instagram: 'https://instagram.com/', tiktok: 'https://www.tiktok.com/@', x: 'https://x.com/',
    telegram: 'https://t.me/', github: 'https://github.com/', youtube: 'https://www.youtube.com/@',
    facebook: 'https://facebook.com/', linkedin: 'https://www.linkedin.com/in/',
  };

  // ---------- API ----------
  async function api(method, url, body) {
    const r = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try { data = await r.json(); } catch {}
    if (r.status === 401 && url !== '/api/login' && url !== '/api/password') { showLogin(); }
    if (!r.ok) throw Object.assign(new Error(data?.error || String(r.status)), { status: r.status });
    return data;
  }

  // ---------- stato di salvataggio ----------
  function setStatus(s) {
    status = s;
    const n = $('status');
    n.className = 'status' + (s === 'dirty' || s === 'saving' ? ' dirty' : '') + (s === 'error' ? ' err' : '');
    n.textContent = t({ saved: 'saved', dirty: 'unsaved', saving: 'saving', error: 'saveError' }[s]);
    $('save').disabled = s === 'saved' || s === 'saving';
  }
  const markDirty = () => setStatus('dirty');

  async function save() {
    if (!profile || status === 'saving') return;
    profile.links.forEach(l => { l.url = normalizeLink(l); });
    setStatus('saving');
    try {
      profile = await api('PUT', '/api/profile', profile);
      setStatus('saved');
      renderEditor();
    } catch {
      setStatus('error');
      $('save').disabled = false;
    }
  }

  // ---------- campi ----------
  function field(label, control, extra) {
    return el('label', { class: 'field' }, el('span', { class: 'field-label' }, label, extra), control);
  }
  function locField(obj, key, label, { multiline = false, rows = 5, max = 200 } = {}) {
    obj[key] ||= { it: '', en: '', fa: '' };
    const m = meta(contentLang);
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
    input.addEventListener('input', () => { profile[key] = input.value; markDirty(); });
    return field(label, input);
  }
  const panel = (title, hint, ...children) =>
    el('section', { class: 'panel' }, el('h2', { text: title }), hint ? el('p', { class: 'hint', text: hint }) : null, children);

  // ---------- file ----------
  function readBase64(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1] || '');
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }
  // Ridimensiona la foto e rimuove i metadati (es. posizione GPS).
  async function resizeImage(file, max = 900) {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s);
    c.height = Math.round(bmp.height * s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise(res => c.toBlob(res, 'image/jpeg', 0.9));
  }
  // Dopo un upload prende solo foto/file dal server, così le modifiche non salvate restano.
  function mergeUploads(server) {
    profile.photo = server.photo;
    const titles = new Map(profile.files.map(f => [f.id, f.title]));
    profile.files = server.files.map(f => ({ ...f, title: titles.get(f.id) || f.title }));
  }
  function filePicker({ accept, multiple, onPick }) {
    const input = el('input', { type: 'file', accept, multiple, class: 'hidden' });
    input.addEventListener('change', () => { const files = [...input.files]; input.value = ''; if (files.length) onPick(files); });
    return input;
  }

  // ---------- sezioni ----------
  function photoPanel() {
    const name = BV.pick(profile.name, contentLang);
    const msg = el('span', { class: 'muted' });
    const picker = filePicker({
      accept: 'image/*',
      onPick: async ([file]) => {
        msg.className = 'muted'; msg.textContent = t('uploading');
        try {
          const blob = await resizeImage(file);
          const res = await api('POST', '/api/upload', { kind: 'photo', type: 'image/jpeg', name: 'photo.jpg', data: await readBase64(blob) });
          mergeUploads(res);
          renderEditor();
        } catch { msg.className = 'error-msg'; msg.textContent = t('uploadError'); }
      },
    });
    const photo = safeUrl(profile.photo);
    return panel(t('photo'), t('photoHint'),
      el('div', { class: 'photo-edit' },
        el('div', { class: 'avatar' }, photo
          ? el('img', { src: photo, alt: '' })
          : el('span', { class: 'initials', text: (name || '?')[0].toUpperCase() })),
        el('div', { class: 'row' },
          el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: () => picker.click() }, t(photo ? 'changePhoto' : 'uploadPhoto')),
          photo ? el('button', {
            class: 'btn btn-danger btn-sm', type: 'button',
            onclick: async () => { try { mergeUploads(await api('DELETE', '/api/photo')); renderEditor(); } catch {} },
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
        select.addEventListener('change', () => { l.platform = select.value; markDirty(); });
        const url = el('input', { class: 'input grow', dir: 'ltr', placeholder: t('url'), 'aria-label': t('url'), maxlength: 500 });
        url.value = l.url || '';
        url.addEventListener('input', () => { l.url = url.value; markDirty(); });
        url.addEventListener('blur', () => { l.url = normalizeLink(l); url.value = l.url; });
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
          profile.posts.unshift({ id: '', date: new Date().toISOString().slice(0, 10), title: { it: '', en: '', fa: '' }, body: { it: '', en: '', fa: '' } });
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
          if (file.size > 20 * 1024 * 1024) { msg.className = 'error-msg'; msg.textContent = `${file.name}: ${t('tooBig')}`; continue; }
          msg.className = 'muted'; msg.textContent = `${t('uploading')} ${file.name}`;
          try {
            mergeUploads(await api('POST', '/api/upload', { kind: 'file', name: file.name, type: file.type, data: await readBase64(file) }));
          } catch { msg.className = 'error-msg'; msg.textContent = `${file.name}: ${t('uploadError')}`; return; }
        }
        renderEditor();
      },
    });
    const items = profile.files.map(f => el('div', { class: 'item' },
      el('div', { class: 'item-head' },
        el('a', { class: 'file-meta', href: safeUrl(f.url), target: '_blank', rel: 'noopener' }, `${f.name} · ${fileSize(f.size, ui)}`),
        el('button', {
          class: 'btn btn-danger btn-sm', type: 'button',
          onclick: async () => {
            if (!confirm(t('confirmDelete'))) return;
            try { mergeUploads(await api('DELETE', '/api/files/' + f.id)); renderEditor(); } catch {}
          },
        }, t('remove'))),
      locField(f, 'title', t('fileTitle'), { max: 200 })));
    return panel(t('files'), t('filesHint'),
      el('div', { class: 'row' },
        el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: () => picker.click() }, '+ ' + t('uploadFiles')),
        msg, picker),
      el('div', { class: 'list' }, items.length ? items : el('p', { class: 'empty', text: t('noFiles') })));
  }

  function securityPanel() {
    const cur = el('input', { class: 'input', type: 'password', autocomplete: 'current-password', dir: 'ltr' });
    const next = el('input', { class: 'input', type: 'password', autocomplete: 'new-password', minlength: 8, dir: 'ltr' });
    const msg = el('p', { class: 'error-msg', role: 'status' });
    const form = el('form', { class: 'list' },
      el('div', { class: 'grid-2' }, field(t('currentPassword'), cur), field(t('newPassword'), next)),
      el('div', { class: 'row' }, el('button', { class: 'btn btn-ghost btn-sm', type: 'submit' }, t('changePassword')), msg));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      try {
        await api('POST', '/api/password', { current: cur.value, next: next.value });
        cur.value = next.value = '';
        msg.className = 'toast-ok'; msg.textContent = t('passwordChanged');
      } catch (err) {
        msg.className = 'error-msg';
        msg.textContent = err.message === 'wrong_password' ? t('wrongPassword') : t('passwordError');
      }
    });
    return panel(t('security'), null, form);
  }

  function renderEditor() {
    if (!profile) return;
    $('content-langs').replaceChildren(BV.langSwitch(contentLang, code => { contentLang = code; renderEditor(); }));
    $('editor-body').replaceChildren(
      photoPanel(), profilePanel(), contactsPanel(), linksPanel(), postsPanel(), filesPanel(), securityPanel());
  }

  // ---------- viste ----------
  function applyUi() {
    BV.applyDocLang(ui);
    document.title = t('adminTitle');
    $('ui-langs').replaceChildren(BV.langSwitch(ui, code => {
      ui = code; BV.storeLang(code);
      applyUi(); setStatus(status); renderEditor();
    }));
  }
  function showLogin() {
    profile = null;
    $('editor').classList.add('hidden');
    $('savebar').classList.add('hidden');
    $('login').classList.remove('hidden');
    $('login-pw').focus();
  }
  async function showEditor() {
    profile = await api('GET', '/api/profile');
    $('login').classList.add('hidden');
    $('editor').classList.remove('hidden');
    $('savebar').classList.remove('hidden');
    setStatus('saved');
    renderEditor();
  }

  $('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    $('login-error').textContent = '';
    try {
      await api('POST', '/api/login', { password: $('login-pw').value });
      $('login-pw').value = '';
      await showEditor();
    } catch (err) {
      $('login-error').textContent = t(err.status === 429 ? 'tooMany' : 'wrongPassword');
    }
  });
  $('logout').addEventListener('click', async () => {
    if (status === 'dirty' && !confirm(t('leaveWarning'))) return;
    try { await api('POST', '/api/logout', {}); } catch {}
    showLogin();
  });
  $('save').addEventListener('click', save);
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && profile) { e.preventDefault(); save(); }
  });
  window.addEventListener('beforeunload', e => { if (status === 'dirty' || status === 'error') { e.preventDefault(); e.returnValue = ''; } });

  applyUi();
  api('GET', '/api/me')
    .then(me => (me.authed ? showEditor() : showLogin()))
    .catch(showLogin);
})();
