// Testi dell'interfaccia in tre lingue + funzioni condivise tra sito e pannello.
(function () {
  const langs = [
    { code: 'it', label: 'Italiano', short: 'IT', locale: 'it-IT', dir: 'ltr' },
    { code: 'en', label: 'English', short: 'EN', locale: 'en-GB', dir: 'ltr' },
    { code: 'fa', label: 'فارسی', short: 'فا', locale: 'fa-IR', dir: 'rtl' },
  ];

  const strings = {
    it: {
      about: 'Chi sono', writing: 'Scritti', documents: 'Documenti', download: 'Scarica',
      saveContact: 'Salva contatto', email: 'Email', phone: 'Telefono',
      readMore: 'Leggi tutto', readLess: 'Mostra meno', private: 'Area riservata',
      loading: 'Caricamento…', loadError: 'Impossibile caricare il profilo.',
      // pannello
      adminTitle: 'Pannello di controllo', password: 'Password', login: 'Entra',
      wrongPassword: 'Password errata.', tooMany: 'Troppi tentativi, riprova tra un minuto.',
      logout: 'Esci', viewSite: 'Vedi il sito', save: 'Salva modifiche', saving: 'Salvataggio…',
      saved: 'Tutto salvato', unsaved: 'Modifiche non salvate', saveError: 'Errore nel salvataggio.',
      contentLang: 'Stai scrivendo in', missing: 'da tradurre',
      photo: 'Foto', uploadPhoto: 'Carica foto', changePhoto: 'Cambia foto', removePhoto: 'Rimuovi foto',
      photoHint: 'Meglio una foto quadrata. Viene ridimensionata automaticamente.',
      profile: 'Profilo', name: 'Nome', headline: 'Professione / titolo', location: 'Città', bio: 'Presentazione',
      contacts: 'Contatti',
      links: 'Canali social', addLink: 'Aggiungi link', platform: 'Piattaforma', url: 'Indirizzo o nome utente',
      remove: 'Rimuovi', other: 'Altro', website: 'Sito web', noLinks: 'Nessun link ancora.',
      posts: 'Scritti', addPost: 'Nuovo scritto', postTitle: 'Titolo', postBody: 'Testo', date: 'Data',
      noPosts: 'Nessuno scritto ancora.', confirmRemovePost: 'Rimuovere questo scritto?',
      files: 'Documenti', uploadFiles: 'Carica file', fileTitle: 'Titolo visibile', noFiles: 'Nessun file caricato.',
      uploading: 'Caricamento…', tooBig: 'File troppo grande (max 20 MB).', uploadError: 'Caricamento non riuscito.',
      confirmDelete: 'Eliminare definitivamente questo file?', filesHint: 'PDF, immagini, documenti… fino a 20 MB ciascuno.',
      security: 'Sicurezza', currentPassword: 'Password attuale', newPassword: 'Nuova password (min. 8 caratteri)',
      changePassword: 'Cambia password', passwordChanged: 'Password cambiata.', passwordError: 'Impossibile cambiare la password.',
      leaveWarning: 'Hai modifiche non salvate.',
    },
    en: {
      about: 'About me', writing: 'Writing', documents: 'Documents', download: 'Download',
      saveContact: 'Save contact', email: 'Email', phone: 'Phone',
      readMore: 'Read more', readLess: 'Show less', private: 'Private area',
      loading: 'Loading…', loadError: 'Could not load the profile.',
      adminTitle: 'Dashboard', password: 'Password', login: 'Sign in',
      wrongPassword: 'Wrong password.', tooMany: 'Too many attempts, try again in a minute.',
      logout: 'Sign out', viewSite: 'View site', save: 'Save changes', saving: 'Saving…',
      saved: 'All saved', unsaved: 'Unsaved changes', saveError: 'Could not save.',
      contentLang: 'You are writing in', missing: 'to translate',
      photo: 'Photo', uploadPhoto: 'Upload photo', changePhoto: 'Change photo', removePhoto: 'Remove photo',
      photoHint: 'A square photo works best. It is resized automatically.',
      profile: 'Profile', name: 'Name', headline: 'Profession / title', location: 'City', bio: 'Introduction',
      contacts: 'Contact details',
      links: 'Social channels', addLink: 'Add link', platform: 'Platform', url: 'Address or username',
      remove: 'Remove', other: 'Other', website: 'Website', noLinks: 'No links yet.',
      posts: 'Writing', addPost: 'New piece', postTitle: 'Title', postBody: 'Text', date: 'Date',
      noPosts: 'Nothing written yet.', confirmRemovePost: 'Remove this piece?',
      files: 'Documents', uploadFiles: 'Upload files', fileTitle: 'Display title', noFiles: 'No files uploaded.',
      uploading: 'Uploading…', tooBig: 'File too large (max 20 MB).', uploadError: 'Upload failed.',
      confirmDelete: 'Delete this file permanently?', filesHint: 'PDFs, images, documents… up to 20 MB each.',
      security: 'Security', currentPassword: 'Current password', newPassword: 'New password (min. 8 characters)',
      changePassword: 'Change password', passwordChanged: 'Password changed.', passwordError: 'Could not change the password.',
      leaveWarning: 'You have unsaved changes.',
    },
    fa: {
      about: 'درباره من', writing: 'نوشته‌ها', documents: 'مدارک', download: 'دانلود',
      saveContact: 'ذخیره مخاطب', email: 'ایمیل', phone: 'تلفن',
      readMore: 'ادامه مطلب', readLess: 'نمایش کمتر', private: 'ورود مدیر',
      loading: 'در حال بارگذاری…', loadError: 'بارگذاری پروفایل ممکن نشد.',
      adminTitle: 'پنل مدیریت', password: 'رمز عبور', login: 'ورود',
      wrongPassword: 'رمز عبور اشتباه است.', tooMany: 'تلاش‌های زیاد؛ یک دقیقه دیگر دوباره امتحان کنید.',
      logout: 'خروج', viewSite: 'مشاهده سایت', save: 'ذخیره تغییرات', saving: 'در حال ذخیره…',
      saved: 'همه چیز ذخیره شد', unsaved: 'تغییرات ذخیره نشده', saveError: 'خطا در ذخیره‌سازی.',
      contentLang: 'در حال نوشتن به زبان', missing: 'ترجمه نشده',
      photo: 'عکس', uploadPhoto: 'بارگذاری عکس', changePhoto: 'تغییر عکس', removePhoto: 'حذف عکس',
      photoHint: 'عکس مربعی بهتر است. اندازه آن به‌طور خودکار تنظیم می‌شود.',
      profile: 'پروفایل', name: 'نام', headline: 'حرفه / عنوان', location: 'شهر', bio: 'معرفی',
      contacts: 'اطلاعات تماس',
      links: 'شبکه‌های اجتماعی', addLink: 'افزودن لینک', platform: 'پلتفرم', url: 'نشانی یا نام کاربری',
      remove: 'حذف', other: 'دیگر', website: 'وب‌سایت', noLinks: 'هنوز لینکی اضافه نشده.',
      posts: 'نوشته‌ها', addPost: 'نوشته جدید', postTitle: 'عنوان', postBody: 'متن', date: 'تاریخ',
      noPosts: 'هنوز نوشته‌ای وجود ندارد.', confirmRemovePost: 'این نوشته حذف شود؟',
      files: 'مدارک', uploadFiles: 'بارگذاری فایل', fileTitle: 'عنوان نمایشی', noFiles: 'هنوز فایلی بارگذاری نشده.',
      uploading: 'در حال بارگذاری…', tooBig: 'فایل خیلی بزرگ است (حداکثر ۲۰ مگابایت).', uploadError: 'بارگذاری انجام نشد.',
      confirmDelete: 'این فایل برای همیشه حذف شود؟', filesHint: 'PDF، تصویر، سند… هر کدام تا ۲۰ مگابایت.',
      security: 'امنیت', currentPassword: 'رمز عبور فعلی', newPassword: 'رمز عبور جدید (حداقل ۸ کاراکتر)',
      changePassword: 'تغییر رمز عبور', passwordChanged: 'رمز عبور تغییر کرد.', passwordError: 'تغییر رمز عبور ممکن نشد.',
      leaveWarning: 'تغییرات ذخیره نشده دارید.',
    },
  };

  const platforms = {
    instagram: 'Instagram', linkedin: 'LinkedIn', tiktok: 'TikTok', youtube: 'YouTube', x: 'X',
    facebook: 'Facebook', telegram: 'Telegram', whatsapp: 'WhatsApp', github: 'GitHub',
    website: null, other: null, // tradotti con strings.website / strings.other
  };

  const meta = code => langs.find(l => l.code === code) || langs[0];
  const t = (lang, key) => strings[lang]?.[key] ?? strings.it[key] ?? key;
  const platformLabel = (lang, p) => platforms[p] || t(lang, p === 'website' ? 'website' : 'other');

  // Testo nella lingua scelta; se manca, usa la prima lingua disponibile.
  function pick(obj, lang) {
    if (!obj) return '';
    if (obj[lang]) return obj[lang];
    for (const l of [lang === 'fa' ? 'en' : 'it', 'it', 'en', 'fa']) if (obj[l]) return obj[l];
    return '';
  }
  // La lingua effettivamente usata da pick() (serve per dir/lang del singolo testo).
  function pickLang(obj, lang) {
    if (!obj || obj[lang]) return lang;
    for (const l of [lang === 'fa' ? 'en' : 'it', 'it', 'en', 'fa']) if (obj[l]) return l;
    return lang;
  }

  function storedLang() {
    let s = null;
    try { s = localStorage.getItem('bv:lang'); } catch {}
    if (langs.some(l => l.code === s)) return s;
    const nav = (navigator.language || '').slice(0, 2).toLowerCase();
    return langs.some(l => l.code === nav) ? nav : 'it';
  }
  function storeLang(code) { try { localStorage.setItem('bv:lang', code); } catch {} }

  function applyDocLang(code) {
    const m = meta(code);
    document.documentElement.lang = code;
    document.documentElement.dir = m.dir;
    document.querySelectorAll('[data-i18n]').forEach(n => { n.textContent = t(code, n.dataset.i18n); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(n => { n.placeholder = t(code, n.dataset.i18nPlaceholder); });
  }

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      node.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return node;
  }

  function safeUrl(u) {
    if (!u) return null;
    if (u.startsWith('/uploads/')) return u;
    try {
      const x = new URL(u);
      return ['http:', 'https:', 'mailto:', 'tel:'].includes(x.protocol) ? x.href : null;
    } catch { return null; }
  }

  function fileSize(bytes, lang) {
    const nf = new Intl.NumberFormat(meta(lang).locale, { maximumFractionDigits: 1 });
    if (bytes < 1024 * 1024) return nf.format(Math.max(1, bytes / 1024)) + ' KB';
    return nf.format(bytes / 1024 / 1024) + ' MB';
  }

  function langSwitch(current, onChange) {
    return el('div', { class: 'lang-switch', role: 'group', 'aria-label': 'Language' },
      langs.map(l => el('button', {
        type: 'button', lang: l.code, title: l.label,
        'aria-pressed': String(l.code === current),
        onclick: () => onChange(l.code),
      }, l.short)));
  }

  window.BV = { langs, strings, meta, t, pick, pickLang, platformLabel, storedLang, storeLang, applyDocLang, el, safeUrl, fileSize, langSwitch };
})();
