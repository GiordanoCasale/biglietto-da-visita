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
      readMore: 'Leggi tutto', readLess: 'Mostra meno',
      loading: 'Caricamento…', loadError: 'Impossibile caricare il profilo.',
      comingSoon: 'Presto online', comingSoonSub: 'Questo sito è in preparazione.',
      previewBanner: 'Anteprima: questa versione la vedi solo tu, su questo dispositivo.', backToPanel: 'Torna al pannello',
      // pannello
      adminTitle: 'Il tuo biglietto da visita', preview: 'Anteprima',
      saved: 'Salvato su questo dispositivo', saving: 'Salvataggio…', saveError: 'Impossibile salvare in questo browser.',
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
      confirmDelete: 'Eliminare questo file?', filesHint: 'PDF, immagini, documenti… fino a 20 MB ciascuno.',
      backup: 'Salva una copia', backupHint: 'Tutto quello che scrivi resta solo in questo browser: nessun altro lo vede. Esporta spesso una copia: ti serve se cambi dispositivo e serve per pubblicare il sito quando sarai pronta.',
      exportBtn: 'Esporta copia', importBtn: 'Apri una copia', neverExported: 'Non hai ancora esportato una copia.',
      notExported: 'Ci sono modifiche non ancora esportate.', lastExport: 'Ultima copia esportata:',
      importConfirm: 'Sostituire tutto il contenuto attuale con quello del file?', importError: 'Questo file non è una copia valida.',
      imported: 'Copia aperta.', exporting: 'Preparazione…',
    },
    en: {
      about: 'About me', writing: 'Writing', documents: 'Documents', download: 'Download',
      saveContact: 'Save contact', email: 'Email', phone: 'Phone',
      readMore: 'Read more', readLess: 'Show less',
      loading: 'Loading…', loadError: 'Could not load the profile.',
      comingSoon: 'Coming soon', comingSoonSub: 'This site is being prepared.',
      previewBanner: 'Preview: only you can see this version, on this device.', backToPanel: 'Back to the panel',
      adminTitle: 'Your business card', preview: 'Preview',
      saved: 'Saved on this device', saving: 'Saving…', saveError: 'Could not save in this browser.',
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
      confirmDelete: 'Delete this file?', filesHint: 'PDFs, images, documents… up to 20 MB each.',
      backup: 'Save a copy', backupHint: 'Everything you write stays only in this browser: nobody else can see it. Export a copy often: you need it if you change device, and it is used to publish the site when you are ready.',
      exportBtn: 'Export copy', importBtn: 'Open a copy', neverExported: 'You have not exported a copy yet.',
      notExported: 'There are changes not exported yet.', lastExport: 'Last copy exported:',
      importConfirm: 'Replace all current content with the content of this file?', importError: 'This file is not a valid copy.',
      imported: 'Copy opened.', exporting: 'Preparing…',
    },
    fa: {
      about: 'درباره من', writing: 'نوشته‌ها', documents: 'مدارک', download: 'دانلود',
      saveContact: 'ذخیره مخاطب', email: 'ایمیل', phone: 'تلفن',
      readMore: 'ادامه مطلب', readLess: 'نمایش کمتر',
      loading: 'در حال بارگذاری…', loadError: 'بارگذاری پروفایل ممکن نشد.',
      comingSoon: 'به‌زودی', comingSoonSub: 'این سایت در حال آماده‌سازی است.',
      previewBanner: 'پیش‌نمایش: این نسخه را فقط شما و فقط روی این دستگاه می‌بینید.', backToPanel: 'بازگشت به پنل',
      adminTitle: 'کارت ویزیت شما', preview: 'پیش‌نمایش',
      saved: 'روی این دستگاه ذخیره شد', saving: 'در حال ذخیره…', saveError: 'ذخیره در این مرورگر ممکن نشد.',
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
      confirmDelete: 'این فایل حذف شود؟', filesHint: 'PDF، تصویر، سند… هر کدام تا ۲۰ مگابایت.',
      backup: 'ذخیره یک نسخه', backupHint: 'هر چه می‌نویسید فقط در همین مرورگر می‌ماند و کس دیگری آن را نمی‌بیند. مرتب یک نسخه خروجی بگیرید: اگر دستگاه را عوض کنید به آن نیاز دارید، و وقتی آماده بودید برای انتشار سایت از آن استفاده می‌شود.',
      exportBtn: 'خروجی گرفتن', importBtn: 'باز کردن یک نسخه', neverExported: 'هنوز هیچ نسخه‌ای خروجی نگرفته‌اید.',
      notExported: 'تغییراتی هست که هنوز خروجی گرفته نشده.', lastExport: 'آخرین خروجی:',
      importConfirm: 'همه محتوای فعلی با محتوای این فایل جایگزین شود؟', importError: 'این فایل یک نسخه معتبر نیست.',
      imported: 'نسخه باز شد.', exporting: 'در حال آماده‌سازی…',
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
  const fallbacks = lang => [lang === 'fa' ? 'en' : 'it', 'it', 'en', 'fa'];
  function pick(obj, lang) {
    if (!obj) return '';
    if (obj[lang]) return obj[lang];
    for (const l of fallbacks(lang)) if (obj[l]) return obj[l];
    return '';
  }
  // La lingua effettivamente usata da pick() (serve per dir/lang del singolo testo).
  function pickLang(obj, lang) {
    if (!obj || obj[lang]) return lang;
    for (const l of fallbacks(lang)) if (obj[l]) return l;
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

  // Solo link sicuri: web, email, telefono, file pubblicati o file locali (anteprima).
  function safeUrl(u) {
    if (!u || typeof u !== 'string') return null;
    if (/^content\/files\/[a-f0-9]{24}\.[a-z0-9]{1,8}$/.test(u)) return u;
    try {
      const x = new URL(u);
      return ['http:', 'https:', 'mailto:', 'tel:', 'blob:'].includes(x.protocol) ? x.href : null;
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
