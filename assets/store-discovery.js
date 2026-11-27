/* Uno store discovery UI: instant search, quick view, wishlist, compare, recently viewed.
   Depends on assets/store-api.js. Plain JS, no libraries. Cart is owned elsewhere: we emit 'uno:add-to-cart'. */
(function (w, d) {
  'use strict';
  var API = {
    search: function (q, per) { return w.UnoStoreAPI.store_search({ q: q, per_page: per || 24 }); },
    detail: function (id) { return w.UnoStoreAPI.store_variants_get(id); }
  };
  var LS = { wish: 'uno_wishlist_v1', cmp: 'uno_compare_v1', rec: 'uno_recent_v1', q: 'uno_recent_searches_v1' };
  var MAX_CMP = 4, MAX_REC = 12, MAX_Q = 6;
  var T = {
    ar: { search: 'ابحث عن منتج أو ماركة أو فئة…', clear: 'مسح', products: 'منتجات', recentSearches: 'عمليات بحث حديثة', clearAll: 'مسح الكل', remove: 'حذف',
      noResults: 'لا توجد نتائج لـ', tryHint: 'جرّب كلمة أبسط أو اختر فئة:', didYouMean: 'هل تقصد', showingFor: 'نعرض نتائج', viewAll: 'عرض كل النتائج', loading: 'جارٍ التحميل…',
      quick: 'نظرة سريعة', add: 'أضف إلى السلة', inStock: 'متوفر', out: 'غير متوفر حاليًا', wishAdd: 'أضف إلى المفضلة', wishDel: 'أزل من المفضلة', cmpAdd: 'قارن', cmpDel: 'أزل من المقارنة',
      close: 'إغلاق', variant: 'اختر النسخة', variantNeed: 'اختر نسخة أولًا', wishlist: 'المفضلة', compare: 'المقارنة', recent: 'شاهدتها مؤخرًا', clearRecent: 'مسح السجل',
      wishEmpty: 'قائمة المفضلة فارغة', wishEmptyHint: 'اضغط على القلب في أي منتج لحفظه هنا.', cmpEmpty: 'لا توجد منتجات للمقارنة', cmpEmptyHint: 'اختر من ٢ إلى ٤ منتجات وسنعرضها جنبًا إلى جنب.',
      cmpNeed2: 'أضف منتجًا ثانيًا على الأقل لتبدأ المقارنة', cmpFull: 'الحد الأقصى ٤ منتجات في المقارنة', onlyDiff: 'إظهار الاختلافات فقط', attr: 'الخاصية', price: 'السعر', brand: 'الماركة', category: 'الفئة', availability: 'التوفر',
      lowest: 'الأقل سعرًا', currency: 'ج.م', openCompare: 'افتح المقارنة', moveToCart: 'أضف الكل للسلة', demoNote: 'بيانات تجريبية للعرض', save: 'وفّر', same: 'متطابق', clearCmp: 'مسح المقارنة', seeWish: 'عرض المفضلة', items: 'منتج', filters: 'تصفية', availOnly: 'المتوفر فقط', priceRange: 'السعر', from: 'من', to: 'إلى', reset: 'مسح التصفية', related: 'منتجات مشابهة', shown: 'منتج معروض', noMatch: 'لا توجد منتجات بهذه المواصفات', moreOpts: 'متوفر بنسخ متعددة', discount: 'خصم' },
    en: { search: 'Search products, brands or categories…', clear: 'Clear', products: 'Products', recentSearches: 'Recent searches', clearAll: 'Clear all', remove: 'Remove',
      noResults: 'No results for', tryHint: 'Try a simpler word or pick a category:', didYouMean: 'Did you mean', showingFor: 'Showing results for', viewAll: 'View all results', loading: 'Loading…',
      quick: 'Quick view', add: 'Add to cart', inStock: 'In stock', out: 'Currently unavailable', wishAdd: 'Add to wishlist', wishDel: 'Remove from wishlist', cmpAdd: 'Compare', cmpDel: 'Remove from compare',
      close: 'Close', variant: 'Choose a version', variantNeed: 'Choose a version first', wishlist: 'Wishlist', compare: 'Compare', recent: 'Recently viewed', clearRecent: 'Clear history',
      wishEmpty: 'Your wishlist is empty', wishEmptyHint: 'Tap the heart on any product to save it here.', cmpEmpty: 'Nothing to compare yet', cmpEmptyHint: 'Pick 2 to 4 products and we will line them up side by side.',
      cmpNeed2: 'Add at least one more product to start comparing', cmpFull: 'You can compare up to 4 products', onlyDiff: 'Show differences only', attr: 'Attribute', price: 'Price', brand: 'Brand', category: 'Category', availability: 'Availability',
      lowest: 'Lowest price', currency: 'EGP', openCompare: 'Open compare', moveToCart: 'Add all to cart', demoNote: 'Demo data for preview', save: 'Save', same: 'Same', clearCmp: 'Clear compare', seeWish: 'View wishlist', items: 'items', filters: 'Filters', availOnly: 'In stock only', priceRange: 'Price', from: 'From', to: 'To', reset: 'Clear filters', related: 'Similar products', shown: 'shown', noMatch: 'No products match these filters', moreOpts: 'Multiple versions', discount: 'off' }
  };
  var lang = 'ar', cache = [], cacheReady = null, listeners = [], det = {};
  function LG() { return (w.UnoI18n && w.UnoI18n.lang) || lang; }
  function t(k) { return (T[LG()] && T[LG()][k]) || T.ar[k] || k; }
  function L(o) { return o ? (typeof o === 'string' ? o : (o[LG()] || o.ar || o.en || '')) : ''; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return new Intl.NumberFormat(LG() === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 0 }).format(n) + ' ' + t('currency'); }
  function num(n) { return new Intl.NumberFormat(LG() === 'ar' ? 'ar-EG' : 'en-US').format(n); }
  function load(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function emit(n, detail) { d.dispatchEvent(new CustomEvent(n, { detail: detail })); }
  function changed() { listeners.forEach(function (f) { try { f(); } catch (e) { } }); emit('uno:store-state'); }

  /* ---------- text normalisation + typo tolerance ---------- */
  var AD = '٠١٢٣٤٥٦٧٨٩';
  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/[٠-٩]/g, function (c) { return AD.indexOf(c); })
      .replace(/[^\u0621-\u064Aa-z0-9\s.]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function stem(tok) { return tok.length > 4 && tok.indexOf('ال') === 0 ? tok.slice(2) : tok; }
  function toks(s) { return norm(s).split(' ').filter(Boolean).map(stem); }
  function dl(a, b, max) { // Damerau-Levenshtein, early exit
    var la = a.length, lb = b.length; if (Math.abs(la - lb) > max) return max + 1;
    var p2 = null, p1 = [], i, j; for (j = 0; j <= lb; j++) p1[j] = j;
    for (i = 1; i <= la; i++) {
      var cur = [i], rowMin = i;
      for (j = 1; j <= lb; j++) {
        var c = a[i - 1] === b[j - 1] ? 0 : 1, v = Math.min(p1[j] + 1, cur[j - 1] + 1, p1[j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, p2[j - 2] + 1);
        cur[j] = v; if (v < rowMin) rowMin = v;
      }
      if (rowMin > max) return max + 1; p2 = p1; p1 = cur;
    }
    return p1[lb];
  }
  function catObj(p) {
    var c = p.category; if (c && typeof c === 'object') return c;
    var I = w.UnoI18n, k = 'cat_' + c; return { ar: (I && I.S.ar[k]) || p.category_ar || c || '', en: (I && I.S.en[k]) || p.category_en || c || '' };
  }
  function catKey(p) { return typeof p.category === 'object' ? (p.category && p.category.en) : p.category; }
  function indexProduct(p) {
    var words = toks([L(p.name), p.name && p.name.en, L(p.brand), p.brand && p.brand.en, L(catObj(p)), catObj(p).en, (Array.isArray(p.kw) ? p.kw : [p.kw || '']).join(' ')].join(' '));
    var seen = {}; p._w = words.filter(function (x) { return !seen[x] && (seen[x] = 1); }); return p;
  }
  function matchTok(q, words) { // best score + the word it matched
    var best = 0, bw = '';
    for (var i = 0; i < words.length; i++) {
      var w2 = words[i], s = 0;
      if (w2 === q) s = 4; else if (w2.indexOf(q) === 0) s = 3; else if (q.length > 2 && w2.indexOf(q) > -1) s = 2;
      else if (q.length >= 4) { var max = q.length >= 7 ? 2 : 1, dist = Math.min(dl(q, w2, max), dl(q, w2.slice(0, q.length), max)); if (dist <= max) s = 1.5 - dist * 0.2; }
      if (s > best) { best = s; bw = w2; }
    }
    return { s: best, w: bw };
  }
  function rank(q) {
    var qt = toks(q); if (!qt.length) return { items: [], fixes: [] };
    var out = [], fixes = {};
    cache.forEach(function (p) {
      var tot = 0, ok = true, fx = [], mn = 9;
      for (var i = 0; i < qt.length; i++) {
        var m = matchTok(qt[i], p._w);
        if (!m.s) { ok = false; break; } tot += m.s; if (m.s < mn) mn = m.s;
        if (m.s < 2 && m.w && m.w !== qt[i]) fx.push([qt[i], m.w]);
      }
      if (ok) { if (!inStock(p)) tot -= 0.3; out.push({ p: p, s: tot, mn: mn, fx: fx }); }
    });
    if (out.some(function (o) { return o.mn >= 2; })) out = out.filter(function (o) { return o.mn >= 2; });
    out.forEach(function (o) { o.fx.forEach(function (f) { fixes[f[0]] = f[1]; }); });
    out.sort(function (a, b) { return b.s - a.s; });
    var fixed = qt.map(function (x) { return fixes[x] || x; }).join(' ');
    return { items: out.map(function (o) { return o.p; }), fixed: Object.keys(fixes).length ? fixed : '' };
  }
  function highlight(text, q) {
    var qs = norm(q).split(' ').filter(function (x) { return x.length > 1; }); var s = esc(text); if (!qs.length) return s;
    var n = norm(text); if (n.length !== String(text).length) return s; // positions unsafe if normalisation changed length
    var lo = String(text), res = '', i = 0;
    while (i < lo.length) { var hit = 0; for (var k = 0; k < qs.length; k++) { if (n.substr(i, qs[k].length) === qs[k]) { hit = Math.max(hit, qs[k].length); } } if (hit) { res += '<mark>' + esc(lo.substr(i, hit)) + '</mark>'; i += hit; } else { res += esc(lo[i]); i++; } }
    return res;
  }
  function ensureCache() {
    if (cacheReady) return cacheReady;
    cacheReady = API.search('', 200).then(function (r) { merge((r && r.items) || []); }).catch(function () { cacheReady = null; });
    return cacheReady;
  }
  function merge(items) { items.forEach(function (p) { var i = cache.findIndex(function (c) { return c.id === p.id; }); indexProduct(p); if (i > -1) cache[i] = p; else cache.push(p); }); }
  function byId(id) { return cache.filter(function (p) { return p.id === id; })[0]; }
  function search(q) { // server hit merged into cache, then client ranking with typo tolerance
    return ensureCache().then(function () { return API.search(q, 24).catch(function () { return { items: [] }; }); }).then(function (r) { merge((r && r.items) || []); return rank(q); });
  }

  /* ---------- state: wishlist / compare / recent ---------- */
  var wish = {
    ids: function () { return load(LS.wish); }, has: function (id) { return load(LS.wish).indexOf(id) > -1; },
    toggle: function (id) { var a = load(LS.wish), i = a.indexOf(id); if (i > -1) a.splice(i, 1); else a.unshift(id); save(LS.wish, a); changed(); return i === -1; }
  };
  var cmp = {
    ids: function () { return load(LS.cmp); }, has: function (id) { return load(LS.cmp).indexOf(id) > -1; },
    toggle: function (id) { var a = load(LS.cmp), i = a.indexOf(id); if (i > -1) a.splice(i, 1); else { if (a.length >= MAX_CMP) { toast(t('cmpFull')); return false; } a.push(id); } save(LS.cmp, a); changed(); return i === -1; },
    clear: function () { save(LS.cmp, []); changed(); }
  };
  function trackView(id) { var a = load(LS.rec).filter(function (x) { return x !== id; }); a.unshift(id); save(LS.rec, a.slice(0, MAX_REC)); changed(); }
  function recentSearches() { return load(LS.q); }
  function addRecentSearch(q) { q = q.trim(); if (!q) return; var a = load(LS.q).filter(function (x) { return norm(x) !== norm(q); }); a.unshift(q); save(LS.q, a.slice(0, MAX_Q)); }

  /* ---------- helpers ---------- */
  function toast(msg) { var el = d.querySelector('.ud-toast') || d.body.appendChild(Object.assign(d.createElement('div'), { className: 'ud-toast', role: 'status' })); el.textContent = msg; el.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(function () { el.classList.remove('on'); }, 2200); }
  function ico(n) {
    var P = { heart: 'M12 21s-7-4.6-9.3-9.1C1 8.5 2.8 5 6.2 5c2 0 3.2 1.1 3.8 2.2C10.6 6.1 11.8 5 13.8 5c3.4 0 5.2 3.5 3.5 6.9C15.1 16.4 12 21 12 21z', cmp: 'M7 4v16M17 4v16M3 8h8M13 16h8', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10-3a3 3 0 100 6 3 3 0 000-6z', x: 'M6 6l12 12M18 6L6 18', search: 'M11 4a7 7 0 100 14 7 7 0 000-14zm9 16l-4-4', clock: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 4v5l3 2', cart: 'M3 4h2l2.4 11h10l2-8H6.5M9 20a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z', trash: 'M5 7h14M10 7V4h4v3m-7 0l1 13h8l1-13' };
    return '<svg class="ud-i" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + P[n] + '"/></svg>';
  }
  function priceHTML(p) { var h = '<span class="ud-price">' + money(p.price) + '</span>'; var o = p.old_price || p.compare_at; if (o && o > p.price) h += ' <s class="ud-old">' + money(o) + '</s>'; return h; }
  function inStock(p) { return p.in_stock != null ? !!p.in_stock : p.stock > 0; }
  function stockHTML(p) { return inStock(p) ? '<span class="ud-st ok">' + t('inStock') + '</span>' : '<span class="ud-st no">' + t('out') + '</span>'; }

  /* ---------- product card (with quick view / wishlist / compare buttons) ---------- */
  function cardHTML(p) {
    var wi = wish.has(p.id), ci = cmp.has(p.id);
    return '<article class="ud-card" data-id="' + esc(p.id) + '">' +
      '<div class="ud-card-img"><img loading="lazy" src="' + esc(p.image) + '" alt="' + esc(L(p.name)) + '">' +
      '<div class="ud-card-tools"><button class="ud-ib' + (wi ? ' on' : '') + '" data-act="wish" aria-pressed="' + wi + '" aria-label="' + t(wi ? 'wishDel' : 'wishAdd') + '">' + ico('heart') + '</button>' +
      '<button class="ud-ib' + (ci ? ' on' : '') + '" data-act="cmp" aria-pressed="' + ci + '" aria-label="' + t(ci ? 'cmpDel' : 'cmpAdd') + '">' + ico('cmp') + '</button>' +
      '<button class="ud-ib" data-act="quick" aria-label="' + t('quick') + '">' + ico('eye') + '</button></div></div>' +
      '<div class="ud-card-b"><div class="ud-brand">' + esc(L(p.brand)) + '</div><h3 class="ud-card-t">' + esc(L(p.name)) + '</h3>' +
      '<div class="ud-pr">' + priceHTML(p) + '</div>' + stockHTML(p) + '</div></article>';
  }
  function bindCards(root) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); var c = e.target.closest('.ud-card'); if (!c) return; var id = c.getAttribute('data-id');
      if (!b) { openQuick(id, c); return; }
      var a = b.getAttribute('data-act');
      if (a === 'wish') wish.toggle(id); else if (a === 'cmp') cmp.toggle(id); else if (a === 'quick') openQuick(id, b);
    });
  }
  function mountGrid(el, items) { el.innerHTML = items.map(cardHTML).join(''); if (!el._us) { el._us = 1; bindCards(el); } }

  function related(p, n) { return cache.filter(function (x) { return x.id !== p.id && catKey(x) === catKey(p); }).slice(0, n || 3); }
  function relatedHTML(p) { var r = related(p, 3); if (!r.length) return ''; return '<div class="ud-rel"><div class="ud-var-l">' + t('related') + '</div>' + r.map(function (x) { return '<button class="ud-relc" data-rel="' + esc(x.id) + '"><img src="' + esc(x.image) + '" alt="" width="40" height="40"><span>' + esc(L(x.name)) + '</span></button>'; }).join('') + '</div>'; }
  /* ---------- details cache + product records ---------- */
  function getDetail(id) { if (det[id]) return Promise.resolve(det[id]); return API.detail(id).then(function (r) { if (r) { det[id] = r; if (r.product) merge([r.product]); } return r; }); }
  function ensureProducts(ids) { return ensureCache().then(function () { return Promise.all(ids.filter(function (id) { return !byId(id); }).map(function (id) { return getDetail(id).catch(function () { }); })); }); }
  function addToCart(p, v) {
    var lab = v && v.label ? L(v.label) : null;
    if (w.UnoCart && w.UnoCart.add) w.UnoCart.add({ key: v ? v.id : p.id, product_id: p.id, variant_id: v ? v.id : null, name: p.name, variant_label: lab, price: v ? v.price : p.price, max: v ? v.stock : p.stock, image: p.image });
    emit('uno:add-to-cart', { product_id: p.id, variant_id: v ? v.id : null });
  }
  /* ---------- quick view ---------- */
  function openQuick(id, opener) {
    ensureProducts([id]).then(function () { return getDetail(id); }).then(function (dt) {
      var p = byId(id); if (!p || !dt) return; trackView(id);
      var vs = dt.variants || [], specs = (dt.product && dt.product.specs) || [];
      var m = d.createElement('div'); m.className = 'ud-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', L(p.name));
      m.innerHTML = '<div class="ud-sheet"><button class="ud-x" aria-label="' + t('close') + '">' + ico('x') + '</button>' +
        '<div class="ud-qv-img"><img src="' + esc(p.image) + '" alt="' + esc(L(p.name)) + '"></div>' +
        '<div class="ud-qv-b"><div class="ud-brand">' + esc(L(p.brand)) + ' · ' + esc(L(catObj(p))) + '</div><h2>' + esc(L(p.name)) + '</h2>' +
        '<div class="ud-pr big" data-price>' + priceHTML(p) + '</div>' + stockHTML(p) + '<div class="ud-var" data-var></div>' +
        '<ul class="ud-specs">' + specs.slice(0, 5).map(function (s) { return '<li><span>' + esc(L(s.k)) + '</span><b>' + esc(L(s.v)) + '</b></li>'; }).join('') + '</ul>' +
        '<div class="ud-qv-a"><button class="ud-btn pri" data-add' + (inStock(p) ? '' : ' disabled') + '>' + ico('cart') + ' ' + t('add') + '</button>' +
        '<button class="ud-btn ghost' + (wish.has(id) ? ' on' : '') + '" data-w>' + ico('heart') + ' ' + t(wish.has(id) ? 'wishDel' : 'wishAdd') + '</button>' +
        '<button class="ud-btn ghost' + (cmp.has(id) ? ' on' : '') + '" data-c>' + ico('cmp') + ' ' + t(cmp.has(id) ? 'cmpDel' : 'cmpAdd') + '</button></div>' + relatedHTML(p) + '</div></div>';
      d.body.appendChild(m); d.documentElement.classList.add('ud-lock');
      var chosen = null, multi = vs.length > 1;
      if (multi) {
        m.querySelector('[data-var]').innerHTML = '<div class="ud-var-l">' + t('variant') + '</div><div class="ud-chips" role="radiogroup">' + vs.map(function (x) { return '<button class="ud-chip" role="radio" aria-checked="false" data-v="' + esc(x.id) + '"' + (x.in_stock ? '' : ' disabled') + '>' + esc(L(x.label)) + '</button>'; }).join('') + '</div>';
        m.querySelector('.ud-chips').addEventListener('click', function (e) {
          var b = e.target.closest('[data-v]'); if (!b || b.disabled) return; chosen = vs.filter(function (x) { return x.id === b.getAttribute('data-v'); })[0];
          [].forEach.call(m.querySelectorAll('.ud-chip'), function (c) { c.setAttribute('aria-checked', c === b); c.classList.toggle('on', c === b); });
          m.querySelector('[data-price]').innerHTML = '<span class="ud-price">' + money(chosen.price) + '</span>';
        });
      }
      function close() { m.remove(); d.documentElement.classList.remove('ud-lock'); d.removeEventListener('keydown', key); if (opener && opener.focus) opener.focus(); }
      function key(e) {
        if (e.key === 'Escape') close();
        if (e.key === 'Tab') { var f = m.querySelectorAll('button:not([disabled])'); if (!f.length) return; var a = f[0], z = f[f.length - 1]; if (e.shiftKey && d.activeElement === a) { z.focus(); e.preventDefault(); } else if (!e.shiftKey && d.activeElement === z) { a.focus(); e.preventDefault(); } }
      }
      d.addEventListener('keydown', key);
      m.addEventListener('click', function (e) {
        if (e.target === m || e.target.closest('.ud-x')) return close();
        var rl = e.target.closest('[data-rel]'); if (rl) { close(); openQuick(rl.getAttribute('data-rel')); return; }
        if (e.target.closest('[data-w]')) { wish.toggle(id); close(); }
        if (e.target.closest('[data-c]')) { cmp.toggle(id); close(); }
        if (e.target.closest('[data-add]')) {
          if (multi && !chosen) { toast(t('variantNeed')); return; }
          addToCart(p, multi ? chosen : (vs[0] || null)); close();
        }
      });
      m.querySelector('.ud-x').focus();
    });
  }

  /* ---------- instant search ---------- */
  function mountSearch(host, opts) {
    opts = opts || {}; var uid = 'us' + Math.random().toString(36).slice(2, 7);
    host.classList.add('ud-search');
    host.innerHTML = '<div class="ud-sbox">' + ico('search') + '<input type="search" role="combobox" aria-expanded="false" aria-controls="' + uid + '" aria-autocomplete="list" autocomplete="off" enterkeyhint="search" placeholder="' + esc(t('search')) + '" aria-label="' + esc(t('search')) + '"><button type="button" class="ud-sclr" hidden aria-label="' + t('clear') + '">' + ico('x') + '</button></div><div class="ud-dd" id="' + uid + '" role="listbox" hidden></div>';
    var inp = host.querySelector('input'), dd = host.querySelector('.ud-dd'), clr = host.querySelector('.ud-sclr'), act = -1, timer, seq = 0;
    function open(h) { dd.innerHTML = h; dd.hidden = false; inp.setAttribute('aria-expanded', 'true'); act = -1; }
    function shut() { dd.hidden = true; inp.setAttribute('aria-expanded', 'false'); }
    function opts_() { return [].slice.call(dd.querySelectorAll('[role=option]')); }
    function setAct(i) { var o = opts_(); if (!o.length) return; o.forEach(function (x) { x.classList.remove('act'); x.setAttribute('aria-selected', 'false'); }); act = (i + o.length) % o.length; o[act].classList.add('act'); o[act].setAttribute('aria-selected', 'true'); o[act].scrollIntoView({ block: 'nearest' }); inp.setAttribute('aria-activedescendant', o[act].id || ''); }
    function showRecent() {
      var r = recentSearches(); if (!r.length) { shut(); return; }
      open('<div class="ud-dh"><span>' + ico('clock') + ' ' + t('recentSearches') + '</span><button class="ud-lnk" data-clrall>' + t('clearAll') + '</button></div>' + r.map(function (q, i) { return '<div class="ud-row ud-rs" role="option" id="' + uid + 'r' + i + '" data-q="' + esc(q) + '">' + ico('clock') + '<span>' + esc(q) + '</span><button class="ud-ib sm" data-rm="' + i + '" aria-label="' + t('remove') + '">' + ico('x') + '</button></div>'; }).join(''));
    }
    function render(q, res) {
      var items = res.items, h = '';
      if (res.fixed) h += '<div class="ud-note">' + t(items.length ? 'showingFor' : 'didYouMean') + ' <b>' + esc(res.fixed) + '</b></div>';
      if (!items.length) {
        var cats = {}; cache.forEach(function (p) { cats[L(catObj(p))] = 1; });
        open('<div class="ud-empty"><b>' + t('noResults') + ' «' + esc(q) + '»</b><p>' + t('tryHint') + '</p><div class="ud-chips">' + Object.keys(cats).map(function (c) { return '<button class="ud-chip" data-q="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div></div>'); return;
      }
      h += '<div class="ud-dh"><span>' + t('products') + '</span></div>' + items.slice(0, 6).map(function (p, i) {
        return '<a class="ud-row ud-pr-row" role="option" id="' + uid + 'p' + i + '" href="' + esc((opts.productUrl ? opts.productUrl(p) : '#product=' + encodeURIComponent(p.id))) + '" data-pid="' + esc(p.id) + '"><img src="' + esc(p.image) + '" alt="" width="48" height="48"><span class="ud-rt"><span class="ud-rn">' + highlight(L(p.name), res.fixed || q) + '</span><span class="ud-rb">' + esc(L(p.brand)) + ' · ' + esc(L(catObj(p))) + '</span></span><span class="ud-rp">' + money(p.price) + (inStock(p) ? '' : '<em>' + t('out') + '</em>') + '</span></a>';
      }).join('');
      if (items.length > 6) h += '<button class="ud-row ud-all" role="option" id="' + uid + 'all" data-all>' + t('viewAll') + ' (' + num(items.length) + ')</button>';
      open(h);
    }
    function run() { var q = inp.value; clr.hidden = !q; if (!q.trim()) { showRecent(); return; } var my = ++seq; search(q).then(function (r) { if (my === seq && inp.value === q) render(q, r); }); }
    inp.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 110); });
    inp.addEventListener('focus', function () { ensureCache(); run(); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setAct(act + 1); } else if (e.key === 'ArrowUp') { e.preventDefault(); setAct(act - 1); }
      else if (e.key === 'Escape') shut();
      else if (e.key === 'Enter') { var o = opts_()[act]; if (o) { e.preventDefault(); o.click(); } else if (inp.value.trim()) { addRecentSearch(inp.value); shut(); emit('uno:search-submit', { q: inp.value.trim() }); } }
    });
    clr.addEventListener('click', function () { inp.value = ''; inp.focus(); run(); });
    dd.addEventListener('mousedown', function (e) { e.preventDefault(); });
    dd.addEventListener('click', function (e) {
      if (e.target.closest('[data-clrall]')) { save(LS.q, []); shut(); return; }
      var rm = e.target.closest('[data-rm]'); if (rm) { var a = load(LS.q); a.splice(+rm.getAttribute('data-rm'), 1); save(LS.q, a); showRecent(); return; }
      var q = e.target.closest('[data-q]'); if (q) { inp.value = q.getAttribute('data-q'); addRecentSearch(inp.value); run(); inp.focus(); return; }
      if (e.target.closest('[data-all]')) { addRecentSearch(inp.value); shut(); emit('uno:search-submit', { q: inp.value.trim() }); return; }
      var pr = e.target.closest('[data-pid]'); if (pr) { addRecentSearch(inp.value); trackView(pr.getAttribute('data-pid')); shut(); if (opts.onPick) { e.preventDefault(); opts.onPick(byId(pr.getAttribute('data-pid'))); } }
    });
    d.addEventListener('click', function (e) { if (!host.contains(e.target)) shut(); });
    return { input: inp, setQuery: function (q) { inp.value = q; run(); } };
  }

  /* ---------- wishlist panel + page ---------- */
  function wishItemsHTML(items) {
    return items.map(function (p) { return '<div class="ud-wrow" data-id="' + esc(p.id) + '"><img src="' + esc(p.image) + '" alt="" width="64" height="64"><div class="ud-rt"><a href="#product=' + esc(p.id) + '" class="ud-rn" data-act="quick">' + esc(L(p.name)) + '</a><div>' + priceHTML(p) + '</div>' + stockHTML(p) + '</div><div class="ud-wa"><button class="ud-ib" data-act="addcart" ' + (inStock(p) ? '' : 'disabled') + ' aria-label="' + t('add') + '">' + ico('cart') + '</button><button class="ud-ib" data-act="wish" aria-label="' + t('remove') + '">' + ico('trash') + '</button></div></div>'; }).join('');
  }
  function quickAdd(id) { var p = byId(id); getDetail(id).then(function (dt) { var vs = (dt && dt.variants) || []; if (vs.length > 1) openQuick(id); else addToCart(p, vs[0] || null); }); }
  function emptyHTML(a, b, ic) { return '<div class="ud-emp">' + ico(ic) + '<b>' + t(a) + '</b><p>' + t(b) + '</p></div>'; }
  function wishlistItems() { return wish.ids().map(byId).filter(Boolean); }
  function whenWish(fn) { ensureProducts(wish.ids()).then(fn); }
  function wireWishRows(root) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return; var row = b.closest('[data-id]'); if (!row) return; var id = row.getAttribute('data-id'), a = b.getAttribute('data-act');
      if (a === 'wish') wish.toggle(id); else if (a === 'quick') { e.preventDefault(); openQuick(id, b); } else if (a === 'addcart') { quickAdd(id); }
    });
  }
  function mountWishlistPanel(host) {
    host.classList.add('ud-panel'); host.setAttribute('role', 'dialog'); host.setAttribute('aria-label', t('wishlist'));
    function draw() { var it = wishlistItems(); host.innerHTML = '<div class="ud-ph"><h2>' + ico('heart') + ' ' + t('wishlist') + ' <small>' + num(it.length) + '</small></h2><button class="ud-x flat" data-close aria-label="' + t('close') + '">' + ico('x') + '</button></div><div class="ud-pb">' + (it.length ? wishItemsHTML(it) : emptyHTML('wishEmpty', 'wishEmptyHint', 'heart')) + '</div>'; }
    host.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) host.classList.remove('open'); }); wireWishRows(host);
    whenWish(draw); listeners.push(function () { whenWish(draw); });
    return { open: function () { host.classList.add('open'); }, close: function () { host.classList.remove('open'); }, toggle: function () { host.classList.toggle('open'); } };
  }
  function mountWishlistPage(host) {
    function draw() { var it = wishlistItems(); host.innerHTML = '<div class="ud-pghead"><h1>' + t('wishlist') + '</h1><span>' + num(it.length) + ' ' + t('items') + '</span></div>' + (it.length ? '<div class="ud-grid"></div>' : emptyHTML('wishEmpty', 'wishEmptyHint', 'heart')); var g = host.querySelector('.ud-grid'); if (g) mountGrid(g, it); }
    whenWish(draw); listeners.push(function () { whenWish(draw); });
  }

  /* ---------- compare page + tray ---------- */
  function mountComparePage(host) {
    var onlyDiff = false;
    function rowsFor(items) {
      var keys = [], seen = {};
      items.forEach(function (it) { ((it.dt.product && it.dt.product.specs) || []).forEach(function (sp) { var k = sp.k.ar || L(sp.k); if (k === 'الماركة' || k === 'القسم' || (sp.k.en === 'Brand' || sp.k.en === 'Category')) return; if (!seen[k]) { seen[k] = sp.k; keys.push(k); } }); });
      (items[0] && items.some(function (it) { return (it.dt.options || []).length; })) && (function () { var ok = {}; items.forEach(function (it) { (it.dt.options || []).forEach(function (o) { ok[o.key] = o; }); }); Object.keys(ok).forEach(function (k) { keys.push('opt:' + k); seen['opt:' + k] = ok[k]; }); })();
      return keys.map(function (k) {
        var vals = items.map(function (it) {
          if (k.indexOf('opt:') === 0) { var o = (it.dt.options || []).filter(function (x) { return 'opt:' + x.key === k; })[0]; return o ? o.values.map(L).join(' / ') : '—'; }
          var sp = ((it.dt.product && it.dt.product.specs) || []).filter(function (x) { return (x.k.ar || L(x.k)) === k; })[0]; return sp ? L(sp.v) : '—';
        });
        return { label: k.indexOf('opt:') === 0 ? L(seen[k]) : L(seen[k]), vals: vals, same: vals.every(function (v) { return v === vals[0]; }) };
      });
    }
    function priceOf(it) { var vs = (it.dt.variants || []).filter(function (v) { return v.in_stock; }); if (!vs.length) vs = it.dt.variants || []; if (vs.length < 2) return { lo: it.p.price, txt: money(it.p.price) }; var a = Math.min.apply(null, vs.map(function (v) { return v.price; })), b = Math.max.apply(null, vs.map(function (v) { return v.price; })); return { lo: a, txt: a === b ? money(a) : money(a) + ' - ' + money(b) }; }
    function draw() {
      var ids = cmp.ids();
      if (!ids.length) { host.innerHTML = '<div class="ud-pghead"><h1>' + t('compare') + '</h1></div>' + emptyHTML('cmpEmpty', 'cmpEmptyHint', 'cmp'); return; }
      Promise.all(ids.map(function (id) { return getDetail(id).then(function (dt) { return { p: byId(id), dt: dt }; }).catch(function () { return null; }); })).then(function (arr) {
        var items = arr.filter(function (x) { return x && x.p && x.dt; });
        var pr = items.map(priceOf), minPrice = Math.min.apply(null, pr.map(function (x) { return x.lo; }));
        var rows = rowsFor(items).filter(function (r) { return !(onlyDiff && r.same); });
        var head = '<tr><th class="ud-corner"></th>' + items.map(function (it) { var p = it.p; return '<td class="ud-ch" data-id="' + esc(p.id) + '"><button class="ud-ib sm ud-rmx" data-act="cmp" aria-label="' + t('cmpDel') + '">' + ico('x') + '</button><img src="' + esc(p.image) + '" alt="" width="96" height="96"><a href="#product=' + esc(p.id) + '" data-act="quick" class="ud-rn">' + esc(L(p.name)) + '</a></td>'; }).join('') + '</tr>';
        var basic = '<tr class="diff"><th scope="row">' + t('price') + '</th>' + items.map(function (it, i) { var best = items.length > 1 && pr[i].lo === minPrice; return '<td class="' + (best ? 'best' : '') + '"><b>' + pr[i].txt + '</b>' + (best ? ' <span class="ud-badge">' + t('lowest') + '</span>' : '') + '</td>'; }).join('') + '</tr>' +
          '<tr class="diff"><th scope="row">' + t('availability') + '</th>' + items.map(function (it) { return '<td>' + stockHTML(it.p) + '</td>'; }).join('') + '</tr>' +
          '<tr class="same"><th scope="row">' + t('brand') + '</th>' + items.map(function (it) { return '<td>' + esc(L(it.p.brand)) + '</td>'; }).join('') + '</tr>' +
          '<tr class="same"><th scope="row">' + t('category') + '</th>' + items.map(function (it) { return '<td>' + esc(L(catObj(it.p))) + '</td>'; }).join('') + '</tr>';
        var body = rows.map(function (r) { return '<tr class="' + (r.same ? 'same' : 'diff') + '"><th scope="row">' + esc(r.label) + '</th>' + r.vals.map(function (v) { return '<td>' + esc(v) + '</td>'; }).join('') + '</tr>'; }).join('');
        var foot = '<tr><th></th>' + items.map(function (it) { return '<td data-id="' + esc(it.p.id) + '"><button class="ud-btn pri sm" data-act="addcart"' + (inStock(it.p) ? '' : ' disabled') + '>' + ico('cart') + ' ' + t('add') + '</button></td>'; }).join('') + '</tr>';
        host.innerHTML = '<div class="ud-pghead"><h1>' + t('compare') + '</h1><div class="ud-tools"><label class="ud-sw"><input type="checkbox" ' + (onlyDiff ? 'checked' : '') + ' data-diff> <span>' + t('onlyDiff') + '</span></label><button class="ud-btn ghost sm" data-clr>' + ico('trash') + ' ' + t('clearCmp') + '</button></div></div>' +
          (items.length < 2 ? '<div class="ud-note">' + t('cmpNeed2') + '</div>' : '') +
          '<div class="ud-tw"><table class="ud-table"><thead>' + head + '</thead><tbody>' + basic + body + '</tbody><tfoot>' + foot + '</tfoot></table></div>';
      });
    }
    host.addEventListener('click', function (e) {
      if (e.target.closest('[data-clr]')) return cmp.clear();
      var b = e.target.closest('[data-act]'); if (!b) return; var c = b.closest('[data-id]'); if (!c) return; var id = c.getAttribute('data-id'), a = b.getAttribute('data-act');
      if (a === 'cmp') cmp.toggle(id); else if (a === 'quick') { e.preventDefault(); openQuick(id, b); } else if (a === 'addcart') quickAdd(id);
    });
    host.addEventListener('change', function (e) { if (e.target.matches('[data-diff]')) { onlyDiff = e.target.checked; draw(); } });
    ensureProducts(cmp.ids()).then(draw); listeners.push(function () { ensureProducts(cmp.ids()).then(draw); });
  }
  function mountCompareTray(host, opts) {
    function draw() {
      var items = cmp.ids().map(byId).filter(Boolean); host.classList.toggle('on', items.length > 0);
      host.innerHTML = items.length ? '<div class="ud-tray-i">' + items.map(function (p) { return '<span class="ud-tp" data-id="' + esc(p.id) + '"><img src="' + esc(p.image) + '" alt="" width="36" height="36"><button class="ud-ib sm" data-act="cmp" aria-label="' + t('cmpDel') + '">' + ico('x') + '</button></span>'; }).join('') + '</div><button class="ud-btn pri sm" data-open>' + t('openCompare') + ' (' + num(items.length) + ')</button>' : '';
    }
    host.classList.add('ud-tray');
    host.addEventListener('click', function (e) { if (e.target.closest('[data-open]')) { if (opts && opts.onOpen) opts.onOpen(); return; } var b = e.target.closest('[data-act]'); if (b) cmp.toggle(b.closest('[data-id]').getAttribute('data-id')); });
    ensureCache().then(draw); listeners.push(function () { if (cacheReady) draw(); });
  }

  /* ---------- recently viewed ---------- */
  function mountRecent(host) {
    function draw() {
      var it = load(LS.rec).map(byId).filter(Boolean); host.hidden = !it.length; if (!it.length) { host.innerHTML = ''; return; }
      host.innerHTML = '<div class="ud-pghead"><h2>' + t('recent') + '</h2><button class="ud-lnk" data-clr>' + t('clearRecent') + '</button></div><div class="ud-rail"></div>';
      var r = host.querySelector('.ud-rail'); r.innerHTML = it.map(cardHTML).join(''); bindCards(r);
    }
    host.addEventListener('click', function (e) { if (e.target.closest('[data-clr]')) { save(LS.rec, []); changed(); } });
    ensureCache().then(draw); listeners.push(function () { if (cacheReady) draw(); });
  }

  /* ---------- hooks into the category/product components ---------- */
  function qaButtons(p) {
    var wi = wish.has(p.id), ci = cmp.has(p.id);
    return '<button class="ud-ib' + (wi ? ' on' : '') + '" data-act="wish" aria-pressed="' + wi + '" aria-label="' + t(wi ? 'wishDel' : 'wishAdd') + '">' + ico('heart') + '</button>' +
      '<button class="ud-ib' + (ci ? ' on' : '') + '" data-act="cmp" aria-pressed="' + ci + '" aria-label="' + t(ci ? 'cmpDel' : 'cmpAdd') + '">' + ico('cmp') + '</button>' +
      '<button class="ud-ib" data-act="quick" aria-label="' + t('quick') + '">' + ico('eye') + '</button>';
  }
  function fillSlot(slot, p, detail) {
    merge([p]); slot.classList.add('ud-qa'); slot.innerHTML = qaButtons(p);
    if (detail) slot.classList.add('ud-pq');
    var refresh = function () { if (slot.isConnected) slot.innerHTML = qaButtons(p); else listeners.splice(listeners.indexOf(refresh), 1); }; listeners.push(refresh);
    slot.addEventListener('click', function (e) { var b = e.target.closest('[data-act]'); if (!b) return; e.preventDefault(); e.stopPropagation(); var a = b.getAttribute('data-act'); if (a === 'wish') wish.toggle(p.id); else if (a === 'cmp') cmp.toggle(p.id); else openQuick(p.id, b); });
  }
  d.addEventListener('uno:card', function (e) { fillSlot(e.detail.slot, e.detail.product, false); });
  d.addEventListener('uno:product', function (e) { var p = e.detail.product; merge([p]); trackView(p.id); fillSlot(e.detail.slot, p, true); });

  w.UnoStore = Object.assign(w.UnoStore || {}, {
    setLang: function (l) { lang = l === 'en' ? 'en' : 'ar'; if (w.UnoI18n) w.UnoI18n.setLang(lang); else { d.documentElement.lang = lang; d.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; } },
    norm: norm, rank: rank, ready: ensureCache, getProduct: byId, addToCart: addToCart, products: function () { return cache.slice(); },
    wishlist: wish, compare: cmp, trackView: trackView, toast: toast,
    cardHTML: cardHTML, mountGrid: mountGrid, openQuick: openQuick,
    mountSearch: mountSearch, related: related, mountWishlistPanel: mountWishlistPanel, mountWishlistPage: mountWishlistPage,
    mountComparePage: mountComparePage, mountCompareTray: mountCompareTray, mountRecent: mountRecent
  });
})(window, document);
