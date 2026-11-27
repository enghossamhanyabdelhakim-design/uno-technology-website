/* Uno store UI - backend wrapper.
   Real mode: set window.UNO_STORE_RPC = async (name, args) => data  (builder wires it to supabase.rpc).
   Until then every call is answered by the MOCK below (mock = true, UI shows a demo badge).
   Contract (args -> result) is documented at the bottom of the mock section. */
(function (w) {
  const api = {
    get mock() { return typeof w.UNO_STORE_RPC !== 'function'; },
    async rpc(name, args) {
      if (!api.mock) return w.UNO_STORE_RPC(name, args || {});
      await new Promise(r => setTimeout(r, 40));
      return MOCK[name](args || {});
    },
    store_search: a => api.rpc('store_search', a),
    store_variants_get: id => api.rpc('store_variants_get', { product_id: id }),
    store_shipping_rates: a => api.rpc('store_shipping_rates', a),
    store_order_create: a => api.rpc('store_order_create', a),
    store_order_track: a => api.rpc('store_order_track', a),
    /* NOT in the published RPC list: preview only. If the builder does not expose it,
       the cart hides the coupon preview total and the coupon is only sent with store_order_create. */
    store_coupon_check: a => api.rpc('store_coupon_check', a)
  };
  w.UnoStoreAPI = api;

  /* ---------------- MOCK DATA (placeholders, not real products) ---------------- */
  function img(h, label, i) {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${h},70%,${48 + i * 4}%)'/><stop offset='1' stop-color='hsl(${(h + 40) % 360},60%,28%)'/></linearGradient></defs><rect width='600' height='600' fill='url(#g)'/><rect x='${120 + i * 14}' y='170' width='360' height='240' rx='22' fill='rgba(255,255,255,.18)' stroke='rgba(255,255,255,.55)' stroke-width='6'/><circle cx='300' cy='290' r='${46 + i * 6}' fill='rgba(255,255,255,.3)'/></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }
  const CATS = { laptops: ['cat_laptops', 'لابتوبات', 'Laptops', 210], phones: ['cat_phones', 'هواتف', 'Phones', 280], cctv: ['cat_cctv', 'كاميرات مراقبة', 'CCTV cameras', 150], network: ['cat_network', 'شبكات', 'Networking', 190], acc: ['cat_acc', 'إكسسوارات', 'Accessories', 20] };
  const BR = { b1: ['ماركة ألفا', 'Alpha'], b2: ['ماركة بيتا', 'Beta'], b3: ['ماركة جاما', 'Gamma'] };
  const BASE = [
    ['laptops', 'لابتوب للأعمال', 'Business laptop', 18000, [['ram', '٨ جيجا', '8 GB'], ['ram', '١٦ جيجا', '16 GB']]],
    ['phones', 'هاتف ذكي', 'Smartphone', 9000, [['storage', '١٢٨ جيجا', '128 GB'], ['storage', '٢٥٦ جيجا', '256 GB']]],
    ['cctv', 'كاميرا مراقبة خارجية', 'Outdoor camera', 1500, null],
    ['network', 'راوتر واي فاي', 'Wi-Fi router', 1200, null],
    ['acc', 'ماوس لاسلكي', 'Wireless mouse', 350, null]
  ];
  const PRODUCTS = [];
  for (let i = 0; i < 30; i++) {
    const b = BASE[i % 5], c = CATS[b[0]], n = Math.floor(i / 5) + 1, br = 'b' + ((i % 3) + 1);
    const price = Math.round(b[3] * (0.8 + n * 0.12) / 10) * 10;
    const stocks = [0, 3, 40, 12, 7, 25][i % 6];
    PRODUCTS.push({
      id: 'p' + (i + 1), name: { ar: b[1] + ' موديل ' + n, en: b[2] + ' model ' + n }, brand: { v: br, ar: BR[br][0], en: BR[br][1] }, category: b[0],
      price, compare_at: i % 4 === 0 ? Math.round(price * 1.15 / 10) * 10 : null, stock: stocks, low_stock_threshold: 10,
      rating_avg: null, reviews_count: 0, orders_count: (i * 7) % 11, created_at: '2026-11-' + String(1 + (i % 26)).padStart(2, '0'),
      images: [img(c[3], c[2], 0), img(c[3], c[2], 1), img(c[3], c[2], 2), img(c[3], c[2], 3)],
      attrs: b[4] ? { [b[4][i % 2][0]]: b[4][i % 2][1] } : {}, attr_labels: {},
      has_variants: !!b[4], variant_defs: b[4]
    });
  }
  const ATTR_LABEL = { ram: ['الرام', 'RAM'], storage: ['السعة', 'Storage'] };
  const POL = { shipping: { ar: 'نص الشحن الحقيقي يُدخل من لوحة التحكم.', en: 'Real shipping text is entered from the admin panel.' }, returns: { ar: 'نص الاسترجاع الحقيقي يُدخل من لوحة التحكم.', en: 'Real returns text is entered from the admin panel.' }, warranty: { ar: 'نص الضمان الحقيقي يُدخل من لوحة التحكم.', en: 'Real warranty text is entered from the admin panel.' } };
  const card = p => ({ id: p.id, name: p.name, brand: p.brand, category: p.category, price: p.price, compare_at: p.compare_at, stock: p.stock, rating_avg: p.rating_avg, reviews_count: p.reviews_count, image: p.images[0], has_variants: p.has_variants });
  function filt(a, skip) {
    return PRODUCTS.filter(p =>
      (skip === 'q' || !a.q || (p.name.ar + p.name.en).toLowerCase().includes(a.q.toLowerCase())) &&
      (skip === 'cat' || !a.category || p.category === a.category) &&
      (skip === 'brand' || !(a.brands && a.brands.length) || a.brands.includes(p.brand.v)) &&
      (a.min == null || p.price >= a.min) && (a.max == null || p.price <= a.max) &&
      (!a.in_stock || p.stock > 0) &&
      Object.entries(a.attrs || {}).every(([k, vs]) => k === skip || !vs.length || vs.includes(p.attrs[k] || '')));
  }
  const SORT = {
    relevance: (x, y) => y.orders_count - x.orders_count, newest: (x, y) => y.created_at.localeCompare(x.created_at),
    price_asc: (x, y) => x.price - y.price, price_desc: (x, y) => y.price - x.price,
    name_asc: (x, y) => x.name.ar.localeCompare(y.name.ar, 'ar'), name_desc: (x, y) => y.name.ar.localeCompare(x.name.ar, 'ar'),
    rating: (x, y) => (y.rating_avg || 0) - (x.rating_avg || 0), discount: (x, y) => ((y.compare_at || y.price) / y.price) - ((x.compare_at || x.price) / x.price),
    stock: (x, y) => (y.stock > 0) - (x.stock > 0), reviews: (x, y) => y.reviews_count - x.reviews_count
  };
  const variantsOf = p => {
    if (!p.variant_defs) return { options: [], variants: [{ id: p.id + '-v0', options: {}, price: p.price, stock: p.stock, sku: 'DEMO-' + p.id }] };
    const key = p.variant_defs[0][0], vals = p.variant_defs.map(d => ({ v: d[1], ar: d[1], en: d[2] }));
    const cols = [{ v: 'blk', ar: 'أسود', en: 'Black', swatch: '#222' }, { v: 'slv', ar: 'فضي', en: 'Silver', swatch: '#c9ccd1' }];
    const variants = []; let k = 0;
    vals.forEach((x, vi) => cols.forEach((c, ci) => { variants.push({ id: p.id + '-v' + (k++), options: { [key]: x.v, color: c.v }, price: p.price + vi * 1500, stock: p.stock === 0 ? 0 : (vi === 1 && ci === 1 ? 0 : Math.max(1, p.stock - vi * 2 - ci)), sku: 'DEMO-' + p.id + '-' + k }); }));
    return { options: [{ key, ar: ATTR_LABEL[key][0], en: ATTR_LABEL[key][1], values: vals }, { key: 'color', ar: 'اللون', en: 'Color', values: cols }], variants };
  };
  const MOCK = {
    store_search(a) {
      const per = a.per_page || 12, page = Math.max(1, a.page || 1), all = filt(a).sort(SORT[a.sort] || SORT.relevance), pages = Math.max(1, Math.ceil(all.length / per));
      const count = (list, f) => { const m = {}; list.forEach(p => { const v = f(p); if (v) m[v] = (m[v] || 0) + 1; }); return m; };
      const cc = count(filt(a, 'cat'), p => p.category), bc = count(filt(a, 'brand'), p => p.brand.v);
      const attrs = ['ram', 'storage'].map(k => { const m = count(filt(a, k), p => p.attrs[k]); const vals = Object.keys(m).map(v => ({ v, ar: v, en: PRODUCTS.map(p => p.variant_defs || []).flat().find(d => d[1] === v)[2], count: m[v] })); return { key: k, ar: ATTR_LABEL[k][0], en: ATTR_LABEL[k][1], values: vals }; }).filter(x => x.values.length);
      const prices = PRODUCTS.map(p => p.price);
      return { items: all.slice((page - 1) * per, page * per).map(card), total: all.length, page, pages, facets: {
        categories: Object.keys(CATS).filter(k => cc[k]).map(k => ({ v: k, ar: CATS[k][1], en: CATS[k][2], count: cc[k] })),
        brands: Object.keys(BR).filter(k => bc[k]).map(k => ({ v: k, ar: BR[k][0], en: BR[k][1], count: bc[k] })), attrs, price: { min: Math.min(...prices), max: Math.max(...prices) } } };
    },
    store_variants_get({ product_id }) {
      const p = PRODUCTS.find(x => x.id === product_id); if (!p) return null;
      const v = variantsOf(p), together = [PRODUCTS[(+p.id.slice(1)) % 30], PRODUCTS[(+p.id.slice(1) + 4) % 30]].filter(x => x.stock > 0 && !x.has_variants).map(card);
      return { product: { ...card(p), images: p.images, category_ar: CATS[p.category][1], category_en: CATS[p.category][2], low_stock_threshold: p.low_stock_threshold,
        short: { ar: 'وصف مختصر تجريبي للمنتج.', en: 'Short demo description.' }, description: { ar: 'نص الوصف الحقيقي يأتي من لوحة التحكم.', en: 'Real description text comes from the admin panel.' },
        specs: [{ k: { ar: 'الماركة', en: 'Brand' }, v: p.brand }, { k: { ar: 'القسم', en: 'Category' }, v: { ar: CATS[p.category][1], en: CATS[p.category][2] } }], policies: POL, reviews: [] },
        options: v.options, variants: v.variants, bought_together: together };
    },
    store_shipping_rates({ governorate, items }) {
      const far = ['Qena', 'Luxor', 'Aswan', 'Red Sea', 'New Valley', 'Matrouh', 'North Sinai', 'South Sinai'].includes(governorate);
      if (governorate === 'South Sinai') return { available: false };
      const sub = (items || []).reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
      return { available: true, price: sub >= 20000 ? 0 : (far ? 85 : 55), days_min: far ? 3 : 1, days_max: far ? 5 : 3, cod: governorate !== 'Red Sea' };
    },
    store_coupon_check({ code }) { return code && code.toUpperCase() === 'DEMO10' ? { valid: true, percent: 10 } : { valid: false }; },
    store_order_create() { throw new Error('mock: orders are disabled in the UI preview'); },
    store_order_track() { throw new Error('mock: not used by these components'); }
  };
  /* CONTRACT assumed by the UI (builder: match or tell me what differs)
     store_search({q,category,brands[],min,max,in_stock,attrs:{key:[values]},sort,page,per_page})
       -> {items:[{id,name{ar,en},brand{v,ar,en},category,price,compare_at,stock,rating_avg,reviews_count,image,has_variants}],total,page,pages,
           facets:{categories[{v,ar,en,count}],brands[],attrs[{key,ar,en,values[{v,ar,en,count}]}],price{min,max}}}
       sort in: relevance|newest|price_asc|price_desc|name_asc|name_desc|rating|discount|stock|reviews
     store_variants_get({product_id}) -> {product{...card,images[],category_ar,category_en,low_stock_threshold,short,description,specs[{k,v}],policies{shipping,returns,warranty},reviews[]},
           options[{key,ar,en,values[{v,ar,en,swatch?}]}],variants[{id,options{key:v},price,stock,sku}],bought_together:[card]}  (bought_together computed server-side from real orders)
     store_shipping_rates({governorate,items[{product_id,variant_id,qty,price}]}) -> {available,price,days_min,days_max,cod}
     store_order_create / store_order_track: not called by these components (the checkout button only fires the 'uno:checkout' event). */
})(window);
