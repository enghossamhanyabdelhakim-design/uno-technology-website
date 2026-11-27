/* Uno store UI - cart drawer (order note, coupon, shipping calculator). Needs store-i18n.js, store-api.js. */
(function (w) {
  const { h, toast } = w.UnoUI, I = w.UnoI18n, API = w.UnoStoreAPI, KEY = 'uno_cart_v1';
  let items = [], note = '', coupon = null, ship = null, drawer, ov, gov = localStorage.getItem('uno_gov') || '';
  try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); items = s.items || []; note = s.note || ''; coupon = s.coupon || null; } catch (e) {}
  const save = () => { localStorage.setItem(KEY, JSON.stringify({ items, note, coupon })); document.dispatchEvent(new CustomEvent('uno:cart', { detail: { count: Cart.count() } })); };
  const sub = () => items.reduce((s, i) => s + i.price * i.qty, 0);
  const Cart = {
    items: () => items.slice(), count: () => items.reduce((s, i) => s + i.qty, 0), subtotal: sub,
    add(it) {
      if (!(it.max > 0)) return false;
      const ex = items.find(i => i.key === it.key);
      if (ex) { ex.qty = Math.min(ex.qty + (it.qty || 1), it.max); ex.max = it.max; ex.price = it.price; }
      else items.push({ ...it, qty: Math.min(it.qty || 1, it.max) });
      save(); ship = null; toast(I.t('added')); render(); return true;
    },
    clear() { items = []; save(); render(); },
    open() { build(); render(); drawer.classList.add('on'); ov.classList.add('on'); drawer.querySelector('.us-x').focus(); },
    close() { if (!drawer) return; drawer.classList.remove('on'); ov.classList.remove('on'); }
  };
  function build() {
    if (drawer) return;
    ov = h('div', { class: 'us-ov', onclick: Cart.close });
    drawer = h('aside', { class: 'us-drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': I.t('cart') });
    document.body.append(ov, drawer);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') Cart.close(); });
  }
  async function calcShip() {
    if (!gov || !items.length) { ship = null; return; }
    try { ship = await API.store_shipping_rates({ governorate: gov, items: items.map(i => ({ product_id: i.product_id, variant_id: i.variant_id, qty: i.qty, price: i.price })) }); } catch (e) { ship = { error: true }; }
  }
  async function render() {
    if (!drawer) return;
    await calcShip();
    const disc = coupon && coupon.valid ? Math.round(sub() * (coupon.percent || 0) / 100) : 0;
    const shipPrice = ship && ship.available ? ship.price : null;
    const total = sub() - disc + (shipPrice || 0);
    const qtyBox = it => h('div', { class: 'us-qty' },
      h('button', { 'aria-label': '-', onclick: () => chg(it, -1) }, '−'), h('span', {}, I.num(it.qty) + (it.unit && (it.step || 1) !== 1 ? ' ' + it.unit : '')), h('button', { 'aria-label': '+', onclick: () => chg(it, 1) }, '+'));
    const govSel = h('select', { class: 'us-sel', 'aria-label': I.t('ship_calc'), onchange: e => { gov = e.target.value; localStorage.setItem('uno_gov', gov); render(); } },
      h('option', { value: '' }, I.t('choose_gov')), I.GOV.map(g => h('option', { value: g.v, selected: g.v === gov }, I.pick(g))));
    const cin = h('input', { class: 'us-in', placeholder: I.t('coupon_ph'), value: coupon ? coupon.code : '', 'aria-label': I.t('coupon') });
    const cmsg = h('div', { class: 'us-msg ' + (coupon && coupon.valid ? 'ok' : coupon ? 'no' : '') }, coupon ? (coupon.valid ? I.t('coupon_ok') : I.t('coupon_bad')) : '');
    const ta = h('textarea', { class: 'us-ta', placeholder: I.t('order_note_ph'), 'aria-label': I.t('order_note'), oninput: e => { note = e.target.value; save(); } }); ta.value = note;
    drawer.replaceChildren(...[
      h('div', { class: 'us-dh' }, h('h3', {}, I.t('cart') + (items.length ? ' (' + I.t('items_n', { n: I.num(Cart.count()) }) + ')' : '')), h('button', { class: 'us-x', 'aria-label': I.t('close'), onclick: Cart.close }, '✕')),
      h('div', { class: 'us-db' },
        items.length ? [
          items.map(it => h('div', { class: 'us-ci' }, h('img', { src: it.image, alt: '' }),
            h('div', {}, h('div', { class: 'nm' }, I.pick(it.name)), it.variant_label && h('div', { class: 'vr' }, I.pick(it.variant_label)), h('div', { class: 'us-pr' }, h('b', {}, I.money(it.price))), h('div', { class: 'qty' }, qtyBox(it))),
            h('button', { class: 'us-x', 'aria-label': I.t('remove'), title: I.t('remove'), onclick: () => { items = items.filter(x => x !== it); save(); render(); } }, '✕'))),
          h('div', { class: 'us-box' }, h('h4', {}, I.t('order_note')), ta),
          h('div', { class: 'us-box' }, h('h4', {}, I.t('coupon')), h('div', { class: 'us-inl' }, cin,
            h('button', { class: 'us-btn sm', onclick: async () => { const c = cin.value.trim(); if (!c) return; let r; try { r = await API.store_coupon_check({ code: c, subtotal: sub() }); } catch (e) { r = { valid: false }; } coupon = { code: c, ...r }; save(); render(); } }, I.t('coupon_apply')),
            coupon && h('button', { class: 'us-btn sm', onclick: () => { coupon = null; save(); render(); } }, I.t('coupon_remove'))), cmsg),
          h('div', { class: 'us-box' }, h('h4', {}, I.t('ship_calc')), govSel,
            h('div', { class: 'us-msg ' + (ship && ship.available ? 'ok' : ship ? 'no' : '') },
              !gov ? I.t('ship_pick') : !ship ? I.t('loading') : ship.error ? I.t('error') : !ship.available ? I.t('ship_unavailable') :
                [ship.price === 0 ? I.t('free_ship') : I.t('ship_cost', { p: I.money(ship.price) }), ' · ', I.t('within_days', { a: I.num(ship.days_min), b: I.num(ship.days_max) }), ' · ', ship.cod ? I.t('cod_yes') : I.t('cod_no')]))
        ] : h('div', { class: 'us-empty' }, h('p', {}, I.t('cart_empty')), h('button', { class: 'us-btn pri', onclick: Cart.close }, I.t('continue_shop')))),
      items.length && h('div', { class: 'us-df' },
        h('div', { class: 'us-row' }, h('span', {}, I.t('subtotal')), h('span', {}, I.money(sub()))),
        disc > 0 && h('div', { class: 'us-row' }, h('span', {}, I.t('discount')), h('span', {}, '− ' + I.money(disc))),
        h('div', { class: 'us-row' }, h('span', {}, I.t('shipping')), h('span', {}, shipPrice == null ? '—' : shipPrice === 0 ? I.t('free_ship') : I.money(shipPrice))),
        h('div', { class: 'us-row tot' }, h('span', {}, I.t('total')), h('span', {}, I.money(total))),
        h('button', { class: 'us-btn pri', style: 'width:100%;margin-block-start:10px', disabled: !gov || !(ship && ship.available), onclick: () => { document.dispatchEvent(new CustomEvent('uno:checkout', { detail: { items: items.slice(), note, coupon: coupon && coupon.valid ? coupon.code : null, governorate: gov, shipping: ship } })); } }, I.t('checkout') + ' · ' + I.t('pay_cod')))].filter(Boolean));
  }
  function chg(it, d) {
    const sp = it.step || 1, q = Math.round((it.qty + d * sp) * 1000) / 1000;
    if (q < sp - 1e-9) { items = items.filter(x => x !== it); }
    else if (q > it.max) { toast(I.t('max_qty', { n: I.num(it.max) })); return; } else it.qty = q;
    save(); render();
  }
  w.UnoCart = Cart; save();
})(window);
