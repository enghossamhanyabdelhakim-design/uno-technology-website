/* Uno store UI - category/listing page. UnoCategory.mount(el, {productUrl(id), perPage, category}) */
(function (w) {
  const { h, toast } = w.UnoUI, I = w.UnoI18n, API = w.UnoStoreAPI;
  const SORTS = ['relevance', 'newest', 'price_asc', 'price_desc', 'name_asc', 'name_desc', 'rating', 'discount', 'stock', 'reviews'];
  function readQ(o) {
    const p = new URLSearchParams(location.search), st = { q: p.get('q') || '', category: p.get('cat') || o.category || '', brands: (p.get('brand') || '').split(',').filter(Boolean),
      min: p.get('min') ? +p.get('min') : null, max: p.get('max') ? +p.get('max') : null, in_stock: p.get('stock') === '1', attrs: {}, sort: SORTS.includes(p.get('sort')) ? p.get('sort') : 'relevance', page: +p.get('pg') || 1, view: p.get('view') === 'list' ? 'list' : 'grid' };
    p.forEach((v, k) => { if (k.startsWith('a_')) st.attrs[k.slice(2)] = v.split(',').filter(Boolean); });
    return st;
  }
  function writeQ(st) {
    const p = new URLSearchParams(location.search); ['q', 'cat', 'brand', 'min', 'max', 'stock', 'sort', 'pg', 'view'].forEach(k => p.delete(k)); [...p.keys()].filter(k => k.startsWith('a_')).forEach(k => p.delete(k));
    if (st.q) p.set('q', st.q); if (st.category) p.set('cat', st.category); if (st.brands.length) p.set('brand', st.brands.join(',')); if (st.min != null) p.set('min', st.min); if (st.max != null) p.set('max', st.max);
    if (st.in_stock) p.set('stock', '1'); if (st.sort !== 'relevance') p.set('sort', st.sort); if (st.page > 1) p.set('pg', st.page); if (st.view === 'list') p.set('view', 'list');
    Object.entries(st.attrs).forEach(([k, v]) => v.length && p.set('a_' + k, v.join(',')));
    history.replaceState(null, '', '?' + p.toString());
  }
  function mount(el, opts) {
    opts = Object.assign({ perPage: 12, productUrl: id => '?page=product&id=' + encodeURIComponent(id) }, opts || {});
    const st = readQ(opts); let data = null, sheet = false, timer;
    el.classList.add('us'); const grid = h('div'), side = h('aside', { class: 'us-side', 'aria-label': I.t('filters') }), top = h('div'), pager = h('div', { class: 'us-pg' }), ov = h('div', { class: 'us-ov', onclick: () => toggle(false) });
    el.replaceChildren(h('div', { class: 'us-wrap' }, API.mock && h('span', { class: 'us-demo' }, I.t('demo')), h('div', { class: 'us-crumbs' }, h('span', {}, I.t('home')), '›', h('span', {}, I.t('store'))), top, h('div', { class: 'us-cat' }, side, h('div', {}, grid, pager))), ov);
    const toggle = on => { sheet = on; side.classList.toggle('on', on); ov.classList.toggle('on', on); };
    const go = (patch, keepPage) => { Object.assign(st, patch); if (!keepPage) st.page = 1; load(); };
    async function load() {
      writeQ(st); grid.className = 'us-grid'; grid.replaceChildren(...Array.from({ length: 6 }, () => h('div', { class: 'us-skel' })));
      try { data = await API.store_search({ q: st.q, category: st.category, brands: st.brands, min: st.min, max: st.max, in_stock: st.in_stock, attrs: st.attrs, sort: st.sort, page: st.page, per_page: opts.perPage }); }
      catch (e) { grid.className = ''; grid.replaceChildren(h('div', { class: 'us-empty' }, h('p', {}, I.t('error')), h('button', { class: 'us-btn pri', onclick: load }, I.t('retry')))); return; }
      draw();
    }
    const chk = (label, count, on, fn) => h('label', { class: 'us-chk' }, h('input', { type: 'checkbox', checked: on, onchange: fn }), h('span', {}, label), count != null && h('small', {}, I.num(count)));
    const toggleIn = (arr, v) => arr.includes(v) ? arr.filter(x => x !== v) : arr.concat(v);
    function drawSide() {
      const f = data.facets, pmin = h('input', { type: 'number', inputmode: 'numeric', min: 0, placeholder: I.t('price_min'), value: st.min ?? '', 'aria-label': I.t('price_min') }), pmax = h('input', { type: 'number', inputmode: 'numeric', min: 0, placeholder: I.t('price_max'), value: st.max ?? '', 'aria-label': I.t('price_max') });
      const pr = () => { clearTimeout(timer); timer = setTimeout(() => go({ min: pmin.value === '' ? null : +pmin.value, max: pmax.value === '' ? null : +pmax.value }), 500); };
      pmin.oninput = pmax.oninput = pr; pmin.className = pmax.className = 'us-in';
      side.replaceChildren(...[h('div', { class: 'us-sheet-head' }, h('b', {}, I.t('filters')), h('button', { class: 'us-x', 'aria-label': I.t('close'), onclick: () => toggle(false) }, '✕')),
        h('div', { class: 'us-fg' }, h('h4', {}, I.t('category')), chk(I.t('all'), null, !st.category, () => go({ category: '' })), f.categories.map(c => chk(I.pick(c), c.count, st.category === c.v, () => go({ category: st.category === c.v ? '' : c.v })))),
        f.brands.length > 0 && h('div', { class: 'us-fg' }, h('h4', {}, I.t('brand')), f.brands.map(b => chk(I.pick(b), b.count, st.brands.includes(b.v), () => go({ brands: toggleIn(st.brands, b.v) })))),
        ...f.attrs.map(a => h('div', { class: 'us-fg' }, h('h4', {}, I.pick(a)), a.values.map(v => chk(I.pick(v), v.count, (st.attrs[a.key] || []).includes(v.v), () => go({ attrs: { ...st.attrs, [a.key]: toggleIn(st.attrs[a.key] || [], v.v) } }))))),
        h('div', { class: 'us-fg' }, h('h4', {}, I.t('price') + ' (' + I.t('currency') + ')'), h('div', { class: 'us-price' }, pmin, pmax)),
        h('div', { class: 'us-fg' }, chk(I.t('in_stock_only'), null, st.in_stock, () => go({ in_stock: !st.in_stock }))),
        h('button', { class: 'us-btn pri us-fbtn', style: 'width:100%', onclick: () => toggle(false) }, I.t('apply') + ' (' + I.num(data.total) + ')')].filter(Boolean));
    }
    function chips() {
      const c = [], lab = (arr, v) => (arr.find(x => x.v === v) || {});
      if (st.category) c.push([I.pick(lab(data.facets.categories, st.category)) || st.category, () => go({ category: '' })]);
      st.brands.forEach(b => c.push([I.pick(lab(data.facets.brands, b)) || b, () => go({ brands: st.brands.filter(x => x !== b) })]));
      Object.entries(st.attrs).forEach(([k, vs]) => vs.forEach(v => c.push([v, () => go({ attrs: { ...st.attrs, [k]: vs.filter(x => x !== v) } })])));
      if (st.min != null || st.max != null) c.push([I.num(st.min ?? 0) + ' - ' + (st.max != null ? I.num(st.max) : '∞'), () => go({ min: null, max: null })]);
      if (st.in_stock) c.push([I.t('in_stock_only'), () => go({ in_stock: false })]);
      if (st.q) c.push(['“' + st.q + '”', () => go({ q: '' })]);
      return c.length ? h('div', { class: 'us-chips' }, c.map(x => h('button', { class: 'us-chip', onclick: x[1] }, x[0] + ' ✕')), h('button', { class: 'us-chip', onclick: () => go({ q: '', category: '', brands: [], min: null, max: null, in_stock: false, attrs: {} }) }, I.t('clear_all'))) : null;
    }
    function card(p) {
      const heartBtn = p => {
        const WL = w.UnoStore && w.UnoStore.wishlist; if (!WL) return null;
        const en = document.documentElement.lang === 'en', on = WL.has(p.id);
        const lab = on => on ? (en ? 'Remove from wishlist' : 'أزل من المفضلة') : (en ? 'Add to wishlist' : 'أضف إلى المفضلة');
        const b = h('button', { type: 'button', class: 'us-heart' + (on ? ' on' : ''), 'aria-pressed': String(on), 'aria-label': lab(on), onclick: () => { const now = WL.toggle(p.id); b.classList.toggle('on', now); b.setAttribute('aria-pressed', String(now)); b.setAttribute('aria-label', lab(now)); } });
        b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 21s-7-4.6-9.3-9.1C1 8.5 2.8 5 6.2 5c2 0 3.2 1.1 3.8 2.2C10.6 6.1 11.8 5 13.8 5c3.4 0 5.2 3.5 3.5 6.9C15.1 16.4 12 21 12 21z"/></svg>';
        return b;
      };
      const oos = p.stock <= 0, pc = p.compare_at && p.compare_at > p.price ? Math.round((1 - p.price / p.compare_at) * 100) : 0;
      return h('article', { class: 'us-card' }, p.demo && h('span', { class: 'us-tag us-dtag' }, I.t('demo_short')), (oos || pc > 0) && h('span', { class: 'us-tag' + (oos ? ' oos' : '') }, oos ? I.t('out_of_stock') : I.t('off', { p: I.num(pc) })),
        h('a', { class: 'im', href: opts.productUrl(p.id), 'aria-label': I.pick(p.name) }, h('img', { src: p.image, alt: I.pick(p.name), loading: 'lazy' })),
        heartBtn(p),
        h('div', { class: 'bd' }, h('div', { class: 'br' }, I.pick(p.brand)), h('a', { class: 'nm', href: opts.productUrl(p.id) }, I.pick(p.name)),
          p.reviews_count > 0 && h('div', { class: 'us-stars' }, '★ ' + I.num(+p.rating_avg.toFixed(1)) + ' (' + I.t('reviews_n', { n: I.num(p.reviews_count) }) + ')'),
          h('div', { class: 'us-pr' }, h('b', {}, I.money(p.price)), pc > 0 && h('s', {}, I.money(p.compare_at))),
          h('div', { class: 'act' }, oos ? h('button', { class: 'us-btn', disabled: true }, I.t('out_of_stock'))
            : p.has_variants ? h('a', { class: 'us-btn', href: opts.productUrl(p.id) }, I.t('choose_options'))
            : h('button', { class: 'us-btn pri', onclick: async () => { const d = await API.store_variants_get(p.id), v = d.variants[0]; w.UnoCart.add({ key: v.id, product_id: p.id, variant_id: v.id, name: p.name, price: v.price, max: v.stock, image: p.image }); } }, I.t('add_to_cart')))));
    }
    function draw() {
      drawSide();
      const sel = h('select', { class: 'us-sel', 'aria-label': I.t('sort'), onchange: e => go({ sort: e.target.value }) }, SORTS.map(s => h('option', { value: s, selected: s === st.sort }, I.t('sort_' + s))));
      const seg = h('div', { class: 'us-seg', role: 'group' }, ['grid', 'list'].map(v => h('button', { 'aria-pressed': st.view === v, 'aria-label': I.t('view_' + v), title: I.t('view_' + v), onclick: () => { st.view = v; writeQ(st); draw(); } }, v === 'grid' ? '▦' : '☰')));
      const q = h('input', { class: 'us-in', type: 'search', placeholder: I.t('search_ph'), value: st.q, 'aria-label': I.t('search_ph'), style: 'flex:1;min-width:150px', onkeydown: e => e.key === 'Enter' && go({ q: e.target.value.trim() }) });
      top.replaceChildren(h('div', { class: 'us-bar' }, q, h('button', { class: 'us-btn us-fbtn', onclick: () => toggle(true) }, I.t('filters'))),
        h('div', { class: 'us-bar' }, h('span', { class: 'grow' }, I.t('results', { n: I.num(data.total) })), sel, seg), ...[chips()].filter(Boolean));
      grid.className = 'us-grid' + (st.view === 'list' ? ' list' : '');
      grid.replaceChildren(...(data.items.length ? data.items.map(card) : [h('div', { class: 'us-empty' }, I.t('no_results'))]));
      const pg = (n, lbl, dis, cur) => h('button', { disabled: dis, 'aria-current': cur ? 'page' : null, 'aria-label': I.t('page') + ' ' + n, onclick: () => { st.page = n; load(); scrollTo({ top: 0, behavior: 'smooth' }); } }, lbl);
      const nums = []; for (let n = 1; n <= data.pages; n++) if (n === 1 || n === data.pages || Math.abs(n - data.page) <= 1) nums.push(n); else if (nums[nums.length - 1] !== '…') nums.push('…');
      pager.replaceChildren(...(data.pages > 1 ? [pg(data.page - 1, I.lang === 'ar' ? '›' : '‹', data.page <= 1), ...nums.map(n => n === '…' ? h('span', { style: 'align-self:center' }, '…') : pg(n, I.num(n), false, n === data.page)), pg(data.page + 1, I.lang === 'ar' ? '‹' : '›', data.page >= data.pages)] : []));
    }
    load();
  }
  w.UnoCategory = { mount };
})(window);
