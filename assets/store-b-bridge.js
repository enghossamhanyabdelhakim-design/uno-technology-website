/* Uno store: connects checkout / tracking / returns (UnoStore) to the real database functions
   through UNO_STORE_RPC. Own code. Load after store-core.js and store-rpc.js. */
(function (w) {
  'use strict';
  var U = w.UnoStore, R = w.UNO_STORE_RPC;
  if (!U || !U.configure || !R) return;
  var KEY = 'uno_cart_v1';

  function cart() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function fail(code, msg) { var e = new Error(code); e.code = code; e.userMessage = msg || ''; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* The storefront cart (A) keeps full lines; checkout only knows variant_id + qty. */
  U.configure({
    getCart: function () { return (cart().items || []).map(function (i) { return { variant_id: i.variant_id, qty: i.qty }; }); }
  });
  U.setCart = function (lines) {
    var c = cart(), m = {};
    (c.items || []).forEach(function (i) { m[i.variant_id] = i; });
    c.items = (lines || []).map(function (l) { var o = m[l.variant_id]; return o ? Object.assign({}, o, { qty: l.qty }) : null; }).filter(Boolean);
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    document.dispatchEvent(new CustomEvent('uno:cart', { detail: { count: c.items.reduce(function (s, i) { return s + (i.qty || 0); }, 0) } }));
  };

  function variants(p) {
    return R('store_variants_get', { variant_ids: p.variant_ids || [] }).then(function (r) {
      return {
        variants: (r.variants || []).map(function (v) {
          var lab = v.label || {};
          return {
            id: v.id, product_id: v.product_id, name_ar: v.name_ar, name_en: v.name_en,
            variant_ar: lab.ar && lab.ar !== 'الافتراضي' ? lab.ar : '', variant_en: lab.en && lab.en !== 'Default' ? lab.en : '',
            price: +v.price, stock: v.stock, weight_g: v.weight_g || 0, image: v.image,
            image_svg: v.image ? '<img src="' + esc(v.image) + '" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:8px">' : ''
          };
        })
      };
    });
  }

  function shipping(p) {
    return R('store_shipping_rates', { governorate: p.governorate }).then(function (r) {
      if (!r || !r.available) return { rates: [], reason: r && r.reason, message_ar: r && r.message_ar, message_en: r && r.message_en };
      return { rates: r.rates || [], governorate: r.governorate };
    });
  }

  var STEP = { new: 0, pending: 0, confirmed: 1, paid: 1, preparing: 2, processing: 2, ready: 2, packed: 2, shipped: 3, out_for_delivery: 3, delivered: 4, completed: 4 };
  var KEYS = ['placed', 'confirmed', 'prepared', 'shipped', 'delivered'];

  function mapOrder(o, phone) {
    var st = String(o.status || 'new'), step = STEP[st] != null ? STEP[st] : 0, cancelled = /cancel|return|refund/.test(st);
    var ev = {};
    (o.timeline || []).forEach(function (e) { var k = KEYS[STEP[e.key] != null ? STEP[e.key] : -1]; if (k && !ev[k]) ev[k] = e.at; });
    var gov = o.governorate || '';
    return {
      number: o.display_number || String(o.number), raw_number: o.number, phone: phone || '',
      status: cancelled ? 'placed' : KEYS[step], cancelled: cancelled,
      placed_at: o.created_at || (o.timeline && o.timeline[0] && o.timeline[0].at) || new Date().toISOString(),
      updated_at: o.created_at,
      payment: { method: 'cod', label_ar: 'الدفع عند الاستلام', label_en: 'Cash on delivery', paid: step === 4 },
      delivery: { method: 'home', governorate_ar: gov, governorate_en: gov, address_ar: o.city || '', address_en: o.city || '', carrier_ar: o.courier || '', carrier_en: o.courier || '', tracking_number: o.tracking_number || '' },
      items: (o.items || []).map(function (i) { return { name_ar: i.name_ar, name_en: i.name_ar, qty: i.qty, price: +i.price, weight_g: 0, image_svg: '' }; }),
      totals: o.totals || { subtotal: 0, shipping: 0, discount: 0, total: 0 },
      delivered_at: step === 4 ? (ev.delivered || null) : null,
      timeline: KEYS.map(function (k, i) { return { key: k, at: ev[k] || (i === 0 ? o.created_at : null), done: !cancelled && i <= step || i === 0 }; })
    };
  }

  function orderCreate(p) {
    var body = {
      customer: p.customer, delivery: p.delivery, items: p.items, payment: p.payment || { method: 'cod' },
      notes: p.notes || '', lang: U.config.lang || 'ar', coupon: (cart().coupon && cart().coupon.valid && cart().coupon.code) || undefined
    };
    return R('store_order_create', body).then(function (r) {
      if (r && r.ok === false) throw fail(r.error || 'ORDER_FAILED', r.message_ar);
      var o = mapOrder({ display_number: r.display_number, number: r.number, status: r.status, totals: r.totals, items: r.items, governorate: p.delivery && p.delivery.governorate, city: p.delivery && p.delivery.city, created_at: new Date().toISOString(), timeline: [] }, p.customer && p.customer.phone);
      o.customer = p.customer; o.is_test = !!r.is_test;
      return o;
    }).catch(function (e) { if (/invalid_phone/.test(e.message)) { e.code = 'INVALID_PHONE'; e.userMessage = document.documentElement.lang === 'en' ? 'The phone number is not valid. Enter an Egyptian mobile number like 01012345678.' : 'رقم الموبايل مش صحيح. اكتب رقم مصري صحيح، مثلا 01012345678.'; } if (!e.userMessage) e.userMessage = e.message; throw e; });
  }

  var lastPhone = '';
  function track(p) {
    lastPhone = p.phone;
    return R('store_order_track', { order_number: p.order_number, phone: p.phone }).then(function (r) {
      if (!r || r.ok === false) throw fail('ORDER_NOT_FOUND', r && r.message_ar);
      return { order: mapOrder(r.order, p.phone) };
    });
  }

  function ret(p) { return R('store_return_request', p); }

  U.configure({ rpc: { store_variants_get: variants, store_shipping_rates: shipping, store_order_create: orderCreate, store_order_track: track, store_return_request: ret, store_coupon_check: function (a) { return R('store_coupon_check', a || {}); } } });
  U.configure({ returnsSubmit: function (pl) {
    return ret({ order_number: pl.order_number, phone: lastPhone, reason: pl.reason, items: pl.items, notes: pl.details || '' }).then(function (r) {
      if (!r || r.ok === false) throw fail('RETURN_FAILED', r && r.message_ar);
      return { reference: 'RET-' + String(r.number || '').padStart(4, '0') };
    });
  } });
  U.config.demo = false;
  w.UnoStoreB = { mapOrder: mapOrder };
})(window);
