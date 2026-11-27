/* Uno store UI - product page. UnoProduct.mount(el, {id, categoryUrl, productUrl(id)}) */
(function (w) {
  const { h } = w.UnoUI, I = w.UnoI18n, API = w.UnoStoreAPI;
  function addBizDays(d, n) { const r = new Date(d); while (n > 0) { r.setDate(r.getDate() + 1); if (r.getDay() !== 5) n--; } return r; } // Friday off
  async function mount(el, opts) {
    opts = Object.assign({ categoryUrl: '?page=category', productUrl: id => '?page=product&id=' + encodeURIComponent(id) }, opts || {});
    el.classList.add('us'); el.replaceChildren(h('div', { class: 'us-wrap' }, h('div', { class: 'us-skel', style: 'height:480px' })));
    let d; try { d = await API.store_variants_get(opts.id); } catch (e) { d = null; }
    if (!d) { el.replaceChildren(h('div', { class: 'us-wrap us-empty' }, h('p', {}, I.t('error')), h('button', { class: 'us-btn pri', onclick: () => mount(el, opts) }, I.t('retry')))); return; }
    const p = d.product, sel = {}, st = { qty: 1, img: 0, tab: 'desc', gov: localStorage.getItem('uno_gov') || '' }, key = o => o.key;
    const match = () => d.variants.find(v => d.options.every(o => v.options[o.key] === sel[o.key]));
    const first = d.variants.find(v => v.stock > 0) || d.variants[0]; if (first) d.options.forEach(o => sel[o.key] = first.options[o.key]);
    const valOk = (o, val) => d.variants.some(v => v.stock > 0 && v.options[o.key] === val && d.options.every(x => x.key === o.key || v.options[x.key] === sel[x.key]));
    const root = h('div', { class: 'us-wrap' }); el.replaceChildren(root); let shipRes = null, bt = {};
    const priceOf = v => v ? v.price : p.price;
    async function ship() { shipRes = null; if (!st.gov) return draw(); draw(); const v = match(); try { shipRes = await API.store_shipping_rates({ governorate: st.gov, items: [{ product_id: p.id, variant_id: v && v.id, qty: st.qty, price: priceOf(v) }] }); } catch (e) { shipRes = { error: true }; } draw(); }
    function cartItem(v) { const lab = d.options.map(o => I.pick((o.values.find(x => x.v === v.options[o.key]) || {}))).filter(Boolean).join(' / '); return { key: v.id, product_id: p.id, variant_id: v.id, name: p.name, variant_label: lab ? { ar: lab, en: lab } : null, price: v.price, max: v.stock, step: v.step || 1, unit: v.unit || null, image: p.images[0], qty: st.qty }; }
    function draw() {
      const v = match(), stock = v ? v.stock : 0, thr = p.low_stock_threshold || 0, pc = p.compare_at && p.compare_at > priceOf(v) ? Math.round((1 - priceOf(v) / p.compare_at) * 100) : 0;
      const stp = (v && v.step) || 1, un = v && v.unit; if (st.qty < stp) st.qty = stp; if (st.qty > stock && stock > 0) st.qty = stock;
      const main = h('div', { class: 'main', tabindex: '0', role: 'button', 'aria-label': I.t('zoom_hint'), onclick: () => lightbox(p.images[st.img]), onkeydown: e => e.key === 'Enter' && lightbox(p.images[st.img]) }, h('img', { src: p.images[st.img], alt: I.pick(p.name) }), h('div', { class: 'lens' }));
      const lens = main.querySelector('.lens'); lens.style.backgroundImage = 'url("' + p.images[st.img] + '")';
      main.addEventListener('mousemove', e => { const r = main.getBoundingClientRect(); lens.style.backgroundPosition = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%'; });
      const gal = h('div', { class: 'us-gal' }, main, p.images.length > 1 && h('div', { class: 'us-thumbs' }, p.images.map((src, i) => h('button', { 'aria-current': i === st.img, 'aria-label': I.t('img_n', { n: I.num(i + 1) }), onclick: () => { st.img = i; draw(); } }, h('img', { src, alt: '' })))), h('div', { class: 'us-hint' }, I.t('zoom_hint')));
      const opt = o => h('div', { class: 'us-opt' }, h('h4', {}, I.pick(o) + ': ', h('span', { style: 'color:var(--mu);font-weight:400' }, I.pick(o.values.find(x => x.v === sel[o.key]) || {}))),
        h('div', { class: 'us-vals' }, o.values.map(val => { const ok = valOk(o, val.v); return h('button', { class: 'us-val', 'aria-pressed': sel[o.key] === val.v, disabled: !ok, title: ok ? '' : I.t('variant_oos'), onclick: () => { sel[o.key] = val.v; if (!match()) { const alt = d.variants.find(x => x.options[o.key] === val.v && x.stock > 0) || d.variants.find(x => x.options[o.key] === val.v); d.options.forEach(z => sel[z.key] = alt.options[z.key]); } st.qty = 1; ship(); } }, val.swatch && h('span', { class: 'us-sw', style: 'background:' + val.swatch }), I.pick(val)); })));
      const low = stock > 0 && thr > 0 && stock <= thr;
      const dl = !st.gov ? null : !shipRes ? I.t('loading') : shipRes.error ? I.t('error') : !shipRes.available ? h('span', { class: 'no' }, I.t('ship_unavailable')) :
        [h('div', {}, I.t('deliver_to', { g: I.pick(I.GOV.find(g => g.v === st.gov) || {}) }) + ': ' + I.t('within_days', { a: I.num(shipRes.days_min), b: I.num(shipRes.days_max) })),
          h('div', {}, I.t('arrives_between', { a: I.date(addBizDays(new Date(), shipRes.days_min)), b: I.date(addBizDays(new Date(), shipRes.days_max)) })),
          h('div', {}, shipRes.price === 0 ? I.t('free_ship') : I.t('ship_cost', { p: I.money(shipRes.price) })), h('div', { class: shipRes.cod ? 'ok' : 'no' }, shipRes.cod ? I.t('cod_yes') : I.t('cod_no'))];
      const doAdd = () => { if (v && stock > 0) w.UnoCart.add(cartItem(v)); };
      const info = h('div', { class: 'us-info' }, h('div', { class: 'us-crumbs' }, h('a', { href: opts.categoryUrl }, I.t('store')), '›', h('span', {}, I.lang === 'ar' ? p.category_ar : p.category_en)),
        h('div', { class: 'br', style: 'color:var(--mu)' }, I.pick(p.brand)), h('h1', {}, I.pick(p.name)),
        p.reviews_count > 0 && h('div', { class: 'us-stars' }, '★ ' + I.num(+p.rating_avg.toFixed(1)) + ' · ' + I.t('reviews_n', { n: I.num(p.reviews_count) })),
        h('div', { class: 'us-pr' }, h('span', { class: 'big' }, I.money(priceOf(v))), pc > 0 && h('s', {}, I.money(p.compare_at)), pc > 0 && h('span', { class: 'us-tag', style: 'position:static' }, I.t('off', { p: I.num(pc) }))),
        h('p', { style: 'color:var(--mu)' }, I.pick(p.short)), d.options.map(opt),
        h('div', {}, stock > 0 ? h('span', { class: 'us-stock-ok' }, '● ' + I.t('in_stock')) : h('span', { class: 'us-stock-no' }, '● ' + I.t('out_of_stock')), v && v.sku && h('span', { style: 'color:var(--mu);margin-inline-start:12px;font-size:.85rem' }, I.t('sku') + ': ' + v.sku)),
        low && h('div', { class: 'us-low' }, h('div', { class: 't' }, I.t('only_left', { n: I.num(stock) })), h('div', { class: 'tr', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': thr, 'aria-valuenow': stock }, h('div', { class: 'fl', style: 'width:' + Math.max(6, stock / thr * 100) + '%' }))),
        h('div', { class: 'us-buy' }, h('div', { class: 'us-qty', 'aria-label': I.t('qty') }, h('button', { 'aria-label': '-', onclick: () => { st.qty = Math.max(stp, Math.round((st.qty - stp) * 1000) / 1000); draw(); } }, '−'), h('span', {}, I.num(st.qty) + (un && stp !== 1 || un && v.sold_by !== 'unit' ? ' ' + un : '')), h('button', { 'aria-label': '+', onclick: () => { st.qty = Math.min(stock || stp, Math.round((st.qty + stp) * 1000) / 1000); draw(); } }, '+')),
          h('button', { class: 'us-btn pri', disabled: stock <= 0, onclick: doAdd }, stock > 0 ? I.t('add_to_cart') : I.t('out_of_stock'))),
        h('div', { class: 'us-box' }, h('h4', {}, I.t('delivery')), h('select', { class: 'us-sel', 'aria-label': I.t('choose_gov'), onchange: e => { st.gov = e.target.value; localStorage.setItem('uno_gov', st.gov); ship(); } }, h('option', { value: '' }, I.t('choose_gov')), I.GOV.map(g => h('option', { value: g.v, selected: g.v === st.gov }, I.pick(g)))), dl && h('div', { class: 'us-dl' }, dl)));
      const fb = d.bought_together || [];
      const fbt = fb.length ? (() => { const all = [{ self: true, name: p.name, image: p.images[0], price: priceOf(v) }, ...fb]; const inc = all.filter((x, i) => bt[i] !== false), tot = inc.reduce((s, x) => s + x.price, 0);
        return h('div', { class: 'us-box' }, h('h4', {}, I.t('fbt')), h('div', { class: 'us-fbt' }, all.map((x, i) => [i > 0 && h('span', { class: 'pl' }, '+'), h('label', { class: 'it' }, h('img', { src: x.image, alt: '' }), h('div', {}, x.self ? I.t('this_item') : I.pick(x.name)), h('b', {}, I.money(x.price)), h('div', {}, h('input', { type: 'checkbox', checked: bt[i] !== false, 'aria-label': I.pick(x.name), onchange: e => { bt[i] = e.target.checked; draw(); } })))]),
          h('div', { style: 'margin-inline-start:auto' }, h('div', {}, I.t('fbt_total') + ': ', h('b', { style: 'color:var(--or2)' }, I.money(tot))), h('button', { class: 'us-btn pri sm', disabled: !inc.length || (inc.some(x => x.self) && stock <= 0), onclick: async () => { for (const x of inc) { if (x.self) { doAdd(); continue; } const dd = await API.store_variants_get(x.id), vv = dd.variants.find(z => z.stock > 0); if (vv) w.UnoCart.add({ key: vv.id, product_id: x.id, variant_id: vv.id, name: x.name, price: vv.price, max: vv.stock, image: x.image }); } } }, I.t('add_all'))))); })() : null;
      const pol = k => (p.policies && p.policies[k] && I.pick(p.policies[k])) || I.t('not_set');
      const TABS = [['desc', 'tab_desc', () => I.pick(p.description) || I.t('not_set')], ['specs', 'tab_specs', () => p.specs && p.specs.length ? h('table', { class: 'us-spec' }, p.specs.map(s => h('tr', {}, h('td', {}, I.pick(s.k)), h('td', {}, I.pick(s.v))))) : I.t('not_set')],
        ['ship', 'tab_ship', () => pol('shipping')], ['returns', 'tab_returns', () => pol('returns')], ['warranty', 'tab_warranty', () => pol('warranty')],
        ['reviews', 'tab_reviews', () => (p.reviews && p.reviews.length) ? p.reviews.map(r => h('div', { class: 'us-box' }, h('div', { class: 'us-stars' }, '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)), h('div', {}, r.text), r.verified && h('small', { style: 'color:var(--ok)' }, '✔ ' + I.t('verified')))) : h('div', { class: 'us-empty' }, I.t('no_reviews'))]];
      const tabs = h('div', { class: 'us-tabs' }, h('div', { class: 'us-tabbar', role: 'tablist' }, TABS.map(t => h('button', { role: 'tab', 'aria-selected': st.tab === t[0], onclick: () => { st.tab = t[0]; draw(); } }, I.t(t[1]) + (t[0] === 'reviews' && p.reviews_count ? ' (' + I.num(p.reviews_count) + ')' : '')))), h('div', { class: 'us-tabp', role: 'tabpanel' }, TABS.find(t => t[0] === st.tab)[2]()));
      const sticky = h('div', { class: 'us-sticky' }, h('b', {}, I.money(priceOf(v))), h('button', { class: 'us-btn pri', disabled: stock <= 0, onclick: doAdd }, stock > 0 ? I.t('add_to_cart') : I.t('out_of_stock')));
      const keepScroll = scrollY; root.replaceChildren(...[(API.mock || p.demo) && h('span', { class: 'us-demo' }, I.t('demo')), h('div', { class: 'us-pdp' }, gal, info), fbt, tabs, sticky].filter(Boolean)); scrollTo(0, keepScroll);
    }
    function lightbox(src) {
      const img = h('img', { src, alt: '', onclick: () => img.classList.toggle('z') }), lb = h('div', { class: 'us-lb', role: 'dialog', 'aria-modal': 'true' }, img, h('button', { class: 'x', 'aria-label': I.t('close'), onclick: () => lb.remove() }, '✕'));
      lb.addEventListener('click', e => { if (e.target === lb) lb.remove(); }); document.addEventListener('keydown', function f(e) { if (e.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', f); } });
      let sx, sy, ox = 0, oy = 0; img.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; }); img.addEventListener('pointermove', e => { if (sx != null && img.classList.contains('z') && e.buttons) { ox += e.clientX - sx; oy += e.clientY - sy; sx = e.clientX; sy = e.clientY; img.style.translate = ox / 2.4 + 'px ' + oy / 2.4 + 'px'; } });
      document.body.append(lb);
    }
    draw(); if (st.gov) ship();
  }
  w.UnoProduct = { mount };
})(window);
