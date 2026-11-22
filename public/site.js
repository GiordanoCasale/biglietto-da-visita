// Pagina pubblica del biglietto da visita.
(function () {
  const { t, pick, pickLang, meta, platformLabel, storedLang, storeLang, applyDocLang, el, safeUrl, fileSize, langSwitch } = window.BV;
  const $ = id => document.getElementById(id);

  let lang = storedLang();
  let profile = null;

  function initials(name) {
    return (name || '').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
  }
  // Testo localizzato con lang/dir corretti anche quando si usa una lingua di riserva.
  function setText(node, obj) {
    node.textContent = pick(obj, lang);
    const l = pickLang(obj, lang);
    node.lang = l;
    node.dir = meta(l).dir;
  }
  const hasText = obj => obj && Object.values(obj).some(v => v && v.trim());

  function setLang(code) {
    lang = code;
    storeLang(code);
    render();
  }

  function vcard() {
    const esc = s => String(s || '').replace(/([\\,;])/g, '\\$1').replace(/\n/g, '\\n');
    const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${esc(pick(profile.name, lang))}`];
    if (hasText(profile.headline)) lines.push(`TITLE:${esc(pick(profile.headline, lang))}`);
    if (profile.email) lines.push(`EMAIL;TYPE=INTERNET:${esc(profile.email)}`);
    if (profile.phone) lines.push(`TEL;TYPE=CELL:${esc(profile.phone)}`);
    lines.push(`URL:${esc(location.origin)}`);
    for (const l of profile.links) if (/^https?:/.test(l.url)) lines.push(`URL:${esc(l.url)}`);
    lines.push('END:VCARD');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/vcard' });
    const a = el('a', { href: URL.createObjectURL(blob), download: (pick(profile.name, 'en') || 'contact') + '.vcf' });
    document.body.append(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  function renderHero() {
    const name = pick(profile.name, lang);
    $('monogram').textContent = initials(name);
    document.title = name + (hasText(profile.headline) ? ' · ' + pick(profile.headline, lang) : '');

    const photo = safeUrl(profile.photo);
    $('avatar').replaceChildren(photo
      ? el('img', { src: photo, alt: name })
      : el('span', { class: 'initials', text: initials(name) }));

    setText($('name'), profile.name);
    setText($('headline'), profile.headline);
    setText($('location'), profile.location);
    $('headline').hidden = !hasText(profile.headline);
    $('location').hidden = !hasText(profile.location);

    $('links').replaceChildren(...profile.links.map(l => {
      const href = safeUrl(l.url);
      if (!href) return null;
      return el('a', { class: 'pill', href, target: '_blank', rel: 'noopener noreferrer me' },
        el('span', { class: 'dot', 'aria-hidden': 'true' }), l.label || platformLabel(lang, l.platform));
    }).filter(Boolean));

    const contact = [];
    if (profile.email) contact.push(el('a', { class: 'btn btn-primary', href: 'mailto:' + profile.email }, t(lang, 'email')));
    if (profile.phone) contact.push(el('a', { class: 'btn btn-ghost', href: 'tel:' + profile.phone.replace(/[^\d+]/g, '') }, t(lang, 'phone')));
    if (profile.email || profile.phone) contact.push(el('button', { class: 'btn btn-ghost', type: 'button', onclick: vcard }, t(lang, 'saveContact')));
    $('contact').replaceChildren(...contact);
    document.querySelector('.divider').hidden = !profile.links.length && !contact.length;
  }

  function renderPosts() {
    const df = new Intl.DateTimeFormat(meta(lang).locale, { dateStyle: 'long' });
    const posts = profile.posts.filter(p => hasText(p.title) || hasText(p.body))
      .sort((a, b) => b.date.localeCompare(a.date));
    $('writing').hidden = !posts.length;
    $('posts').replaceChildren(...posts.map(p => {
      const body = el('p', { class: 'prose clamped' });
      setText(body, p.body);
      const title = el('h3');
      setText(title, p.title);
      const toggle = el('button', { class: 'link-btn', type: 'button', hidden: true }, t(lang, 'readMore'));
      toggle.addEventListener('click', () => {
        const open = body.classList.toggle('clamped');
        toggle.textContent = t(lang, open ? 'readMore' : 'readLess');
      });
      // mostra "Leggi tutto" solo se il testo è davvero tagliato
      requestAnimationFrame(() => { toggle.hidden = body.scrollHeight <= body.clientHeight + 2; });
      return el('article', { class: 'post' },
        el('time', { datetime: p.date, text: df.format(new Date(p.date + 'T12:00:00')) }),
        hasText(p.title) ? title : null,
        hasText(p.body) ? body : null,
        toggle);
    }));
  }

  function renderFiles() {
    $('documents').hidden = !profile.files.length;
    $('files').replaceChildren(...profile.files.map(f => {
      const ext = (/\.([a-z0-9]{1,5})$/i.exec(f.name) || [, 'file'])[1];
      const title = el('strong');
      setText(title, f.title);
      if (!title.textContent) title.textContent = f.name;
      return el('li', { class: 'file' },
        el('span', { class: 'ext', text: ext }),
        el('div', { class: 'info' }, title, el('span', { text: fileSize(f.size, lang) })),
        el('a', { class: 'btn btn-ghost btn-sm', href: safeUrl(f.url), download: f.name }, t(lang, 'download')));
    }));
  }

  function render() {
    applyDocLang(lang);
    $('langs').replaceChildren(langSwitch(lang, setLang));
    if (!profile) return;
    renderHero();
    setText($('bio'), profile.bio);
    $('about').hidden = !hasText(profile.bio);
    renderPosts();
    renderFiles();
    $('copy').textContent = `© ${new Date().getFullYear()} ${pick(profile.name, lang)}`;
  }

  render();
  fetch('/api/profile')
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(data => {
      profile = data;
      $('state').classList.add('hidden');
      $('content').classList.remove('hidden');
      render();
    })
    .catch(() => { $('state').dataset.i18n = 'loadError'; $('state').textContent = t(lang, 'loadError'); });
})();
