/* Uno store page: loads the storefront modules and mounts them between the site header and footer. Own code. */
(function () {
  'use strict';
  var V = '20261129s4', MODS = ['store-rpc', 'store-i18n', 'store-api', 'store-cart', 'store-category', 'store-product', 'store-404', 'store-discovery'];
  function css(n) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'assets/' + n + '.css?v=' + V; document.head.appendChild(l); }
  function load(n) { return new Promise(function (ok) { var s = document.createElement('script'); s.src = 'assets/' + n + '.js?v=' + V; s.onload = ok; s.onerror = ok; document.body.appendChild(s); }); }
  var st = document.createElement('style');
  st.textContent = '.us-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap;max-width:1280px;margin:0 auto;padding:14px 16px 0}.us-tools #us-srch{flex:1 1 260px;min-width:0}' +
    '.us-tbtn{min-height:44px;border-radius:12px;border:1px solid var(--bd,#3a2f28);background:var(--s1,#201a16);color:var(--tx,#f6efe9);padding:0 14px;font:inherit;font-weight:700;cursor:pointer}' +
    'html[data-theme=light] .us-tbtn{background:#fff;color:#2a1d12;border-color:#ecd9c8}#app.us input.us-in[type=search]{display:none}' +
    '.us-seo,.us-links{max-width:1280px;margin:0 auto;padding:8px 16px 24px;color:var(--mu,#b9aba0);line-height:1.9;font-size:.95rem}.us-links{display:flex;gap:14px;flex-wrap:wrap;padding-bottom:90px}.us-links a{color:var(--or,#F65A00);font-weight:700;min-height:44px;display:inline-flex;align-items:center}' +
    '.us-slot:empty{display:none}.us-slot{max-width:340px;margin:0 auto;padding:0 16px 16px}';
  document.head.appendChild(st);
  css('store-ui'); css('store-discovery'); css('store-orbit');

  function tr(ar, en) { return document.documentElement.lang === 'en' ? en : ar; }
  function lang() { return document.documentElement.lang === 'en' ? 'en' : 'ar'; }

  function mount() {
    var app = document.getElementById('app'), q = new URLSearchParams(location.search), page = q.get('page') || 'category';
    app.className = 'us';
    app.innerHTML = '<div class="us-tools"><div id="us-srch"></div><button class="us-tbtn" id="us-wb"></button><button class="us-tbtn" id="us-cb"></button></div>' +
      '<div id="us-pg"></div><div class="us-slot" data-uno-slot="store_grid"></div><div class="us-slot" data-uno-slot="store_sidebar"></div>' +
      '<section id="us-rec" class="us" style="max-width:1280px;margin:0 auto;padding:0 16px 24px" hidden></section>' +
      '<aside id="us-wp"></aside><div id="us-tray"></div>' +
      '<section class="us-seo"><h2 style="font-size:1.1rem;margin:0 0 6px;color:inherit">' + tr('متجر أونو للخدمات التكنولوجية', 'Uno Technology Services store') + '</h2><p>' +
      tr('المتجر بيعرض منتجات تجريبية للشبكات وكاميرات المراقبة ونقاط البيع وإكسسوارات الكمبيوتر ومستلزمات الطباعة. الأسعار والمنتجات الحالية عينة للعرض فقط، والمنتجات الحقيقية والشحن بيتحددوا قبل الإطلاق. للاستفسار كلمنا من صفحة التواصل.',
         'This store shows sample products for networking, CCTV cameras, point of sale, computer accessories and printing supplies. Current products and prices are samples for display only; the real catalog and shipping rates are set before launch. Contact us from the contact page with any question.') +
      '</p></section><nav class="us-links" aria-label="' + tr('روابط المتجر', 'Store links') + '"><a href="order-tracking.html">' + tr('تتبع طلبك', 'Track your order') + '</a><a href="returns.html">' + tr('الاسترجاع', 'Returns') + '</a><a href="warranty.html">' + tr('الضمان', 'Warranty') + '</a><a href="policies.html">' + tr('سياسات المتجر', 'Store policies') + '</a></nav>';
    var S = window.UnoStore; S.setLang(lang());
    var pg = document.getElementById('us-pg');
    S.mountSearch(document.getElementById('us-srch'), { productUrl: function (p) { return 'store.html?page=product&id=' + p.id; } });
    var P = S.mountWishlistPanel(document.getElementById('us-wp')), wb = document.getElementById('us-wb'), cb = document.getElementById('us-cb');
    wb.onclick = P.toggle; cb.onclick = function () { window.UnoCart.open(); };
    S.mountCompareTray(document.getElementById('us-tray'), { onOpen: function () { location.href = 'store.html?page=compare'; } });
    S.mountRecent(document.getElementById('us-rec'));
    function labels() { wb.textContent = tr('المفضلة', 'Wishlist') + ' ' + window.UnoI18n.num(S.wishlist.ids().length); cb.textContent = tr('السلة', 'Cart') + ' ' + window.UnoI18n.num(window.UnoCart.count()); }
    labels(); document.addEventListener('uno:store-state', labels); document.addEventListener('uno:cart', labels);
    if (page === '404') window.UnoNotFound.mount(pg, {});
    else if (page === 'product') window.UnoProduct.mount(pg, { id: q.get('id') || '', categoryUrl: 'store.html' });
    else if (page === 'wishlist') S.mountWishlistPage(pg);
    else if (page === 'compare') S.mountComparePage(pg);
    else window.UnoCategory.mount(pg, {});
    if (window.UNO_SLOTS && window.UNO_SLOTS.scan) window.UNO_SLOTS.scan();
  }

  document.addEventListener('uno:checkout', function () { location.href = 'checkout.html'; });
  document.addEventListener('uno:search-submit', function (e) { var v = e.detail && e.detail.q; if (v) location.href = 'store.html?q=' + encodeURIComponent(v); });
  var last = lang();
  new MutationObserver(function () { if (lang() !== last) { last = lang(); mount(); } }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  (function seq(i) {
    if (i >= MODS.length) { try { mount(); } catch (e) { var a = document.getElementById('app'); if (a) a.textContent = tr('تعذّر تحميل المتجر. حاول مرة أخرى.', 'Could not load the store. Please try again.'); } return; }
    load(MODS[i]).then(function () { seq(i + 1); });
  })(0);
})();
