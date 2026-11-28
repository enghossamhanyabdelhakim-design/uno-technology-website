/*!
 * Uno store — runtime SEO for the JS-rendered storefront.
 * Sets a real title, description, canonical, OG/Twitter tags, hreflang and
 * schema.org JSON-LD (BreadcrumbList, ItemList) for whatever
 * store route is on screen. Reads the rendered DOM only: no new requests,
 * no backend, no product data invented. Plain script, no dependencies.
 *
 *   <script src="assets/uno-store-seo.js" defer></script>
 *
 * Load it after store-main.js (any order after that works: it watches the DOM).
 * Trimmed r13: no Product/Offer, org, phone, payment or delivery claims, no
 * robots override (store products are samples until the real catalog exists).
 */
(function (w, d) {
  'use strict';
  var L = function () { return d.documentElement.lang === 'en' ? 'en' : 'ar'; };
  function T(ar, en) { return L() === 'en' ? en : ar; }
  function q(s, r) { return (r || d).querySelector(s); }
  function qa(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function txt(e) { return e ? String(e.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function abs(u) { try { return new URL(u, location.href).href; } catch (e) { return u; } }
  function num(s) {
    var m = String(s || '').replace(/[٠-٩]/g, function (c) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(c); }).replace(/[^\d.]/g, '');
    return m ? parseFloat(m) : null;
  }
  function metaName(n, v) { if (!v) return; var el = q('meta[name="' + n + '"]') || d.head.appendChild(Object.assign(d.createElement('meta'), { name: n })); el.setAttribute('content', v); }
  function metaProp(n, v) { if (!v) return; var el = q('meta[property="' + n + '"]') || d.head.appendChild(Object.assign(d.createElement('meta'), { property: n })); el.setAttribute('content', v); }
  function setCanonical(url) {
    var l = q('link[rel="canonical"]');
    if (!l) { l = d.createElement('link'); l.rel = 'canonical'; d.head.appendChild(l); }
    l.href = url;
  }
  function setHreflang(url) {
    var map = { ar: url + (url.indexOf('?') < 0 ? '?lang=ar' : '&lang=ar'), en: url + (url.indexOf('?') < 0 ? '?lang=en' : '&lang=en'), 'x-default': url };
    Object.keys(map).forEach(function (k) {
      var l = q('link[rel="alternate"][hreflang="' + k + '"]');
      if (!l) { l = d.createElement('link'); l.rel = 'alternate'; l.hreflang = k; d.head.appendChild(l); }
      l.href = map[k];
    });
  }
  function ld(id, obj) {
    var s = d.getElementById(id);
    if (!obj) { if (s) s.remove(); return; }
    var json = JSON.stringify(obj);
    if (s && s.textContent === json) return;
    if (!s) { s = d.createElement('script'); s.type = 'application/ld+json'; s.id = id; d.head.appendChild(s); }
    s.textContent = json;
  }
  function setText(el, v) { if (el && el.textContent !== v) el.textContent = v; }
  function cleanUrl() {
    var p = new URLSearchParams(location.search), keep = new URLSearchParams();
    if (p.get('page')) keep.set('page', p.get('page'));
    if (p.get('id')) keep.set('id', p.get('id'));
    if (p.get('cat')) keep.set('cat', p.get('cat'));
    if (p.get('q')) keep.set('q', p.get('q'));
    var s = keep.toString();
    return location.origin + location.pathname + (s ? '?' + s : '');
  }

  /* ---------- product ---------- */
  function productSeo() {
    var info = q('.us-info'); if (!info) return false;
    var h1 = q('h1', info); if (!h1) return false;
    var name = txt(h1); if (!name) return false;
    var priceEl = q('.us-pr .big', info), price = num(txt(priceEl));
    var oldEl = q('.us-pr s', info), old = num(txt(oldEl));
    var img = q('.us-gal .main img'), imgAbs = img ? abs(img.currentSrc || img.src) : abs('assets/og.jpg');
    var imgs = qa('.us-thumbs img').map(function (i) { return abs(i.src); }); if (imgAbs && imgs.indexOf(imgAbs) < 0) imgs.unshift(imgAbs);
    var brand = txt(q('.br', info));
    var cat = txt(q('.us-crumbs span:last-child', info));
    var sku = (txt(info).match(/SKU:\s*([A-Za-z0-9._-]+)/) || [])[1] || '';
    var inStock = !!q('.us-stock-ok', info);
    var desc = txt(q('p', info)) || (qa('.us-spec tr', info).slice(0, 3).map(function (r) { return txt(r); }).join(' · '));
    var stars = txt(q('.us-stars', info)), rating = num(stars.split('·')[0]);
    var reviews = num((stars.match(/\(([^)]+)\)/) || [])[1] || (stars.split('·')[1] || ''));
    var url = cleanUrl();

    d.title = name + ' | ' + T('أونو للخدمات التكنولوجية', 'Uno Technology Services');
    metaName('description', (desc || name).slice(0, 300));
    setCanonical(url); setHreflang(url);
    metaProp('og:type', 'website'); metaProp('og:title', name); metaProp('og:description', (desc || name).slice(0, 300));
    metaProp('og:url', url); metaProp('og:image', imgAbs); metaProp('og:site_name', 'Uno Technology Services');
    metaName('twitter:card', 'summary_large_image'); metaName('twitter:title', name); metaName('twitter:description', (desc || name).slice(0, 200)); metaName('twitter:image', imgAbs);

    var crumbs = [{ '@type': 'ListItem', position: 1, name: T('الرئيسية', 'Home'), item: location.origin + location.pathname.replace(/store\.html$/, 'index.html') },
      { '@type': 'ListItem', position: 2, name: T('المتجر', 'Store'), item: location.origin + location.pathname },
      { '@type': 'ListItem', position: 3, name: name }];
    if (cat) crumbs.splice(2, 0, { '@type': 'ListItem', position: 3, name: cat });
    crumbs.forEach(function (c, i) { c.position = i + 1; });
    ld('uno-ld-crumbs', { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs });
    ld('uno-ld-list', null);
    return true;
  }

  /* ---------- category / search ---------- */
  function ensureStyle() {
    if (d.getElementById('uno-seo-css')) return;
    var st = d.createElement('style'); st.id = 'uno-seo-css';
    st.textContent = '.uno-cat-h1{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}';
    d.head.appendChild(st);
  }

  function categorySeo() {
    ensureStyle();
    var grid = q('#us-pg .us-cat') || q('#us-pg .us-grid'); if (!grid) return false;
    var p = new URLSearchParams(location.search), qq = p.get('q'), cat = p.get('cat');
    var count = txt(q('#us-pg .us-bar .grow'));
    var chip = txt(q('#us-pg .us-chips .us-chip')).replace(/\s*[\u2715\u2716\u00D7]\s*$/, '').trim();
    var label = qq ? T('نتائج البحث عن «' + qq + '»', 'Search results for “' + qq + '”')
      : cat ? (chip || T('قسم ' + cat, cat)) : T('كل المنتجات', 'All products');
    var head = q('.uno-cat-h1');
    if (!head) {
      head = d.createElement('h1'); head.className = 'uno-cat-h1';
      var anchor = q('#us-pg .us-crumbs') || q('#us-pg .us-bar');
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(head, anchor.nextSibling);
    }
    setText(head, label);
    var url = cleanUrl();
    d.title = label + ' | ' + T('متجر أونو', 'Uno store') + ' — ' + T('أونو للخدمات التكنولوجية', 'Uno Technology Services');
    metaName('description', T(label + ' في متجر أونو للخدمات التكنولوجية، فرشوط، قنا. منتجات تجريبية للعرض.', label + ' at the Uno Technology Services store, Farshout, Qena. Sample products for display.'));
    setCanonical(url); setHreflang(url);
    metaProp('og:type', 'website'); metaProp('og:title', label); metaProp('og:url', url); metaProp('og:image', abs('assets/og.jpg'));
    metaName('twitter:card', 'summary_large_image'); metaName('twitter:title', label);
    var items = qa('#us-pg .us-grid .us-card a.nm').slice(0, 12).map(function (a, i) {
      return { '@type': 'ListItem', position: i + 1, name: txt(a), url: abs(a.getAttribute('href')) };
    });
    if (items.length) ld('uno-ld-list', { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: items });
    ld('uno-ld-product', null);
    if (cat && !qq) ld('uno-ld-crumbs', { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: T('الرئيسية', 'Home'), item: location.origin + location.pathname.replace(/store\.html$/, 'index.html') },
      { '@type': 'ListItem', position: 2, name: T('المتجر', 'Store'), item: location.origin + location.pathname },
      { '@type': 'ListItem', position: 3, name: label }] });
    else ld('uno-ld-crumbs', null);
    return true;
  }

  function otherSeo() {
    var p = new URLSearchParams(location.search), page = p.get('page');
    if (page === 'wishlist') { d.title = T('المفضلة', 'Wishlist') + ' | ' + T('متجر أونو', 'Uno store'); }
    else if (page === 'compare') { d.title = T('مقارنة المنتجات', 'Compare products') + ' | ' + T('متجر أونو', 'Uno store'); }
    else if (page === '404') { d.title = T('الصفحة غير موجودة', 'Page not found') + ' | ' + T('أونو', 'Uno'); }
    setCanonical(cleanUrl()); setHreflang(cleanUrl());
    ld('uno-ld-product', null); ld('uno-ld-list', null); ld('uno-ld-crumbs', null);
  }

  var last = '', timer = null;
  function run() {
    var p = new URLSearchParams(location.search), page = p.get('page') || 'category';
    var ok = page === 'product' ? productSeo() : (page === 'category' ? categorySeo() : (otherSeo(), true));
    if (!ok) return false;
    last = location.href + '|' + L() + '|' + d.title;
    return true;
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(run, 200); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', schedule); else schedule();
  new MutationObserver(schedule).observe(d.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['lang'] });
  w.addEventListener('popstate', schedule);
})(window, document);
