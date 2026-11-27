/* UNO POS live adapter: connects pos.js to Supabase (REST + RPC). Server is the authority; local state mirrors it. */
(function () {
  var C = window.UNO_CFG, CL = window.CLOUD;
  var L = { wh: null, uid: null, role: 'cashier', email: '' };
  var P = function (e) { return Math.round(Number(e || 0) * 100); };
  var E = function (p) { return Math.round(Number(p || 0)) / 100; };
  function perr(code, ar) { return Object.assign(new Error(ar), { code: code, ar: ar, en: ar }); }
  function jwtSub(t) { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub; } catch (e) { return null; } }
  function http(method, path, body, extra) {
    return CL.token().then(function (t) {
      var h = { apikey: C.key, Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' };
      if (extra) for (var k in extra) h[k] = extra[k];
      return fetch(C.url + '/rest/v1/' + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined }).then(function (r) {
        return r.text().then(function (x) {
          var d = null; try { d = x ? JSON.parse(x) : null; } catch (e) { d = x; }
          if (!r.ok) { var m = (d && (d.message || d.msg)) || ('HTTP ' + r.status); var c = /^([A-Z][A-Z_]{2,}):\s*/.exec(m); throw perr(c ? c[1] : 'ERR', c ? m.replace(c[0], '') : m); }
          return d;
        });
      }, function () { throw perr('NETWORK', 'لا يوجد اتصال بالخادم. حاول مرة أخرى.'); });
    });
  }
  function rpc(name, args) { return http('POST', 'rpc/' + name, args || {}); }
  function get(path) { return http('GET', path); }

  /* ---------- login overlay ---------- */
  function login() {
    return new Promise(function (resolve) {
      var o = document.createElement('div');
      o.style.cssText = 'visibility:visible;position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:radial-gradient(120% 60% at 50% 0%,#FFE9DA 0%,#FAF8F5 55%);font-family:inherit;color:#191A1E;padding:16px';
      var inp = 'padding:13px 14px;border-radius:12px;border:1px solid #ECE8E1;background:#fff;color:#191A1E;font:inherit;font-size:15px;outline:none';
      o.innerHTML = '<form style="width:100%;max-width:380px;background:#fff;border:1px solid #ECE8E1;border-radius:22px;padding:26px 24px;display:flex;flex-direction:column;gap:12px;box-shadow:0 14px 40px rgba(246,90,0,.10)"><img src="assets/logo-uno-technology.png" alt="Uno Technology" style="height:52px;width:auto;align-self:center;margin-bottom:4px"><div style="font-size:20px;font-weight:800;text-align:center">UNO POS</div><div style="font-size:13px;color:#5D6168;text-align:center">سجّل الدخول بحساب الكاشير أو المدير</div><input id="plE" type="email" autocomplete="username" placeholder="البريد" style="' + inp + '"><input id="plP" type="password" autocomplete="current-password" placeholder="كلمة المرور" style="' + inp + '"><button style="padding:13px;border-radius:12px;border:0;background:linear-gradient(135deg,#F65A00,#FF8A3D);color:#fff;font:inherit;font-weight:800;font-size:15px;cursor:pointer">دخول</button><div id="plM" style="font-size:12.5px;color:#C62828;min-height:16px;text-align:center"></div></form>';
      document.body.appendChild(o);
      o.querySelector('form').onsubmit = function (ev) {
        ev.preventDefault(); var m = o.querySelector('#plM'); m.textContent = '...';
        CL.login(o.querySelector('#plE').value.trim(), o.querySelector('#plP').value).then(function () { o.remove(); resolve(); }, function (e) { m.textContent = 'فشل الدخول: ' + e.message; });
      };
    });
  }

  /* ---------- mappers ---------- */
  function mapInvoice(d, lines, pays, rets) {
    var tot = P(d.total), ret = P(d.returned_total);
    var status = d.status === 'cancelled' ? 'voided' : (ret > 0 ? (ret >= tot ? 'returned' : 'partial') : 'paid');
    var sub = lines.reduce(function (s, l) { return s + P(l.unit_price) * Number(l.qty); }, 0);
    var credit = 0;
    return {
      id: d.id, number: d.number, created_at: new Date(d.created_at).getTime(), shift_id: d.shift_id, device_id: d.device_id,
      customer_id: d.partner_id || null, customer_name: d.customer_name && d.customer_name !== 'عميل نقدي' ? d.customer_name : null,
      lines: lines.map(function (l) {
        var up = P(l.unit_price), q = Number(l.qty), m = isMeasured(l.product_id), pp = prodOf(l.product_id);
        return { product_id: l.product_id || ('line-' + l.id), line_id: l.id, name_ar: l.description, name_en: l.description, mono: (l.description || '?').charAt(0),
          qty: m ? Math.round(q * 1000) : q, qty_kind: m ? 'weight' : 'unit', unit_price: up, unit_ar: m ? pp.unitAr : 'قطعة', unit_en: m ? pp.unitEn : 'pc', discount: 0, amount: Math.round(up * q) };
      }),
      subtotal: sub, invoice_discount: P(d.discount), total: tot, tax: Math.round(tot - tot / 1.14),
      payments: pays.filter(function (p) { return p.doc_id === d.id; }).map(function (p) { return { method: p.method, amount: P(p.amount) }; }),
      tendered_total: tot, paid_total: P(d.paid_total), change_due: P(d.change_due), credit_amount: credit,
      note: null, status: status, idempotency_key: d.idem_key, returned_total: ret
    };
  }
  function mapReturn(r, rl, inv) {
    return { id: r.id, number: r.number, invoice_id: r.doc_id, invoice_number: inv ? inv.number : '', created_at: new Date(r.created_at).getTime(),
      shift_id: r.shift_id, customer_id: r.partner_id, amount: P(r.total), reason: r.reason, refund_method: r.refund_method, status: 'posted',
      lines: rl.filter(function (x) { return x.return_id === r.id; }).map(function (x) { return { product_id: x.product_id || ('line-' + x.line_id), line_id: x.line_id, qty: isMeasured(x.product_id) ? Math.round(Number(x.qty) * 1000) : Number(x.qty), refund: P(x.amount), restock: x.restock === 'stock', name_ar: '', name_en: '', qty_kind: isMeasured(x.product_id) ? 'weight' : 'unit' }; }) };
  }
  /* Measured items: UI quantity = thousandths of the unit; the server stores the real quantity (kg, m, L). */
  var UEN = { 'كجم': 'kg', 'جرام': 'g', 'متر': 'm', 'سم': 'cm', 'لتر': 'L' };
  function prodOf(pid) { return pid ? state.products.filter(function (x) { return x.id === pid; })[0] : null; }
  function isMeasured(pid) { var p = prodOf(pid); return !!(p && p.weighted); }
  function ids(a) { return a.map(function (x) { return x.id; }).join(','); }
  function loadDocs(docs) {
    if (!docs.length) return Promise.resolve([]);
    var i = ids(docs);
    return Promise.all([get('core_sales_lines?doc_id=in.(' + i + ')&select=*&order=sort.asc'), get('core_payments?doc_id=in.(' + i + ')&select=*'), get('core_returns?doc_id=in.(' + i + ')&select=*')]).then(function (r) {
      var rets = r[2];
      return (rets.length ? get('core_return_lines?return_id=in.(' + ids(rets) + ')&select=*') : Promise.resolve([])).then(function (rl) {
        var out = docs.map(function (d) { return mapInvoice(d, r[0].filter(function (l) { return l.doc_id === d.id; }), r[1], rets); });
        rets.forEach(function (x) { if (!state.returns.some(function (y) { return y.id === x.id; })) { var inv = out.filter(function (o) { return o.id === x.doc_id; })[0]; var m = mapReturn(x, rl, inv); m.lines.forEach(function (ln) { var src = inv && inv.lines.filter(function (s) { return s.line_id === ln.line_id; })[0]; if (src) { ln.name_ar = src.name_ar; ln.name_en = src.name_en; ln.product_id = src.product_id; } }); state.returns.push(m); } });
        out.forEach(function (o) { var k = state.invoices.findIndex(function (z) { return z.id === o.id; }); if (k >= 0) state.invoices[k] = o; else state.invoices.push(o); });
        state.invoices.sort(function (a, b) { return b.created_at - a.created_at; });
        return out;
      });
    });
  }

  function loadShift() {
    return get('core_shifts?opened_by=eq.' + L.uid + '&closed_at=is.null&select=*&limit=1').then(function (r) {
      if (!r.length) { state.shift = null; return; }
      var s = r[0];
      state.shift = { id: s.id, openedAt: new Date(s.opened_at || s.created_at || Date.now()).getTime(), openingFloat: P(s.opening_cash), cashierId: L.uid, cashierRole: L.role === 'owner' || L.role === 'admin' ? 'manager' : 'cashier', status: 'open', counted: null, expected: null, variance: null, closedAt: null };
      return Promise.all([get('core_sales_docs?shift_id=eq.' + s.id + '&kind=eq.invoice&select=*&order=created_at.desc&limit=300'), get('core_cash_moves?shift_id=eq.' + s.id + '&select=*&order=created_at.desc')]).then(function (x) {
        state.cashMoves = x[1].map(function (m) { return { id: m.id, shift_id: m.shift_id, type: m.type, amount: P(m.amount), reason: m.reason, note: null, voucher_no: m.voucher_no, user_id: m.user_id, created_at: new Date(m.created_at).getTime() }; });
        return loadDocs(x[0]);
      });
    });
  }

  function init() {
    state.products = []; state.customers = []; state.invoices = []; state.returns = []; state.cashMoves = []; state.held = []; state.outbox = []; state.shift = null;
    var go = function () {
      return CL.check().then(function (u) { L.email = u.email || ''; return CL.token(); }).then(function (t) {
        L.uid = jwtSub(t);
        return Promise.all([
          get('admin_roles?user_id=eq.' + L.uid + '&select=role,active&limit=1').catch(function () { return []; }),
          get('core_branches?kind=eq.warehouse&active=eq.true&select=id,name_ar&order=created_at.asc&limit=1'),
          get('categories?select=id,name_ar,name_en&order=sort.asc').catch(function () { return get('categories?select=id,name_ar,name_en').catch(function () { return []; }); }),
          get('products?select=id,name_ar,name_en,price,barcode,category_id,is_demo&active=eq.true&order=name_ar.asc&limit=1000'),
          get('core_stock_levels?select=product_id,warehouse_id,qty'),
          get('core_partners?kind=in.(customer,both)&active=eq.true&select=id,name,phone,credit_limit,balance&order=name.asc&limit=500'),
          rpc('pos_item_units').catch(function () { return []; })
        ]);
      }).then(function (r) {
        var role = (r[0][0] && r[0][0].active !== false) ? r[0][0].role : 'cashier'; L.role = role;
        L.wh = r[1][0] ? r[1][0].id : null;
        var nm = (L.email || '').split('@')[0];
        ROLES.cashier.nameAr = nm; ROLES.cashier.nameEn = nm; ROLES.manager.nameAr = nm; ROLES.manager.nameEn = nm;
        if (role === 'owner' || role === 'admin') ROLES.cashier.keys = ROLES.manager.keys.slice();
        DEMO_CATEGORIES.length = 0; DEMO_CATEGORIES.push({ id: 'all', ar: 'الكل', en: 'All' });
        r[2].forEach(function (c) { DEMO_CATEGORIES.push({ id: c.id, ar: c.name_ar || c.name_en, en: c.name_en || c.name_ar }); });
        var stock = {}; r[4].forEach(function (s) { if (!L.wh || s.warehouse_id === L.wh) stock[s.product_id] = (stock[s.product_id] || 0) + Number(s.qty); });
        var UN = {}; (r[6] || []).forEach(function (u) { UN[u.product_id] = u; });
        state.products = r[3].map(function (p) {
          var u = UN[p.id], ms = !!(u && u.sold_by && u.sold_by !== 'unit'), tag = p.is_demo ? ' (تجريبي)' : '';
          return { id: p.id, cat: p.category_id || 'all', ar: (p.name_ar || p.name_en) + tag, en: (p.name_en || p.name_ar) + (p.is_demo ? ' (demo)' : ''), price: P(p.price), stock: ms ? Math.max(0, Math.round((stock[p.id] || 0) * 1000)) : Math.max(0, Math.floor(stock[p.id] || 0)), barcode: p.barcode || '', weighted: ms, step: ms ? Math.max(1, Math.round(Number(u.step || 0.001) * 1000)) : 1, unitAr: ms ? (u.unit || 'كجم') : 'قطعة', unitEn: ms ? (UEN[u.unit] || u.unit || 'kg') : 'pc', mono: (p.name_ar || p.name_en || '?').charAt(0) };
        });
        state.customers = r[5].map(function (c) { return { id: c.id, ar: c.name, en: c.name, phone: c.phone || '', credit_limit: P(c.credit_limit), balance: P(c.balance), tier: 'retail' }; });
        return loadShift().then(loadHolds);
      });
    };
    if (!CL.loggedIn()) return login().then(go);
    return go().catch(function (e) { CL.logout(); return login().then(go); });
  }

  function findInvoices(q) {
    q = (q || '').trim();
    var f = q ? 'number=ilike.*' + encodeURIComponent(q.replace(/[*,()]/g, '')) + '*&' : '';
    return get('core_sales_docs?' + f + 'kind=eq.invoice&status=in.(issued,paid,cancelled)&select=*&order=created_at.desc&limit=15').then(loadDocs);
  }

  /* ---------- RPC mapping ---------- */
  function lineCap(inv, ln) { var done = state.returns.filter(function (r) { return r.invoice_id === inv.id; }).reduce(function (s, r) { return s + r.lines.filter(function (x) { return x.line_id === ln.line_id; }).reduce(function (a, x) { return a + x.qty; }, 0); }, 0); return ln.qty - done; }
  var API = {
    pos_sale: function (p) {
      var cart = state.cart.lines;
      var items = cart.map(function (l, i) {
        var prod = state.products.filter(function (x) { return x.id === l.productId; })[0];
        var it = { description: (prod ? prod.ar : l.nameAr || l.name || 'صنف'), qty: (prod && prod.weighted) ? l.qty / 1000 : l.qty, unit_price: E(prod ? (l.priceOverride ? l.unitPrice : prod.price) : l.unitPrice), discount: E(l.discount || 0) };
        if (prod) { it.product_id = prod.id; if (L.wh) it.warehouse_id = L.wh; }
        return it;
      });
      var totals = cartTotals(state.cart);
      var args = { idem: p.idempotency_key, items: items, discount: E(totals.invoiceDiscount), payments: p.payments.map(function (x) { return { method: x.method, amount: E(x.amount) }; }), customer_id: p.customer_id || undefined, manager_token: p.manager_token || undefined, device_id: CFG.deviceId };
      if (p.customer_id) { var c = state.customers.filter(function (x) { return x.id === p.customer_id; })[0]; if (c) args.customer_name = c.ar; }
      var OFF = window.UNO_OFFLINE, cashOnly = p.payments.every(function (x) { return x.method === 'cash'; });
      var run = (navigator.onLine === false && OFF) ? Promise.reject(perr('NETWORK', 'offline')) : rpc('pos_sale', { p: args });
      return run.catch(function (e) {
        if (e && e.code === 'NETWORK' && OFF) { if (!cashOnly) throw perr('OFFLINE_METHOD', 'أوفلاين الكاش بس. شيل سطور البطاقة/المحفظة/الآجل أو رجّع الاتصال.'); return OFF.enqueue(args, p, cart, totals); }
        throw e;
      }).then(function (r) {
        if (r && r.__offline) return r.result;
        return get('core_sales_docs?id=eq.' + r.id + '&select=*').then(function (d) { return loadDocs(d); }).then(function (o) {
          var inv = o[0];
          inv.lines.forEach(function (ln, i) { var cl = cart[i]; var prod = cl && state.products.filter(function (x) { return x.id === cl.productId; })[0]; if (prod) { ln.name_ar = prod.ar; ln.name_en = prod.en; ln.mono = prod.mono; prod.stock = Math.max(0, prod.stock - cl.qty); } });
          inv.change_due = P(r.change); inv.credit_amount = P(r.due);
          var cr = p.payments.filter(function (x) { return x.method === 'credit'; }).reduce(function (s, x) { return s + x.amount; }, 0);
          if (cr && p.customer_id) { var cc = state.customers.filter(function (x) { return x.id === p.customer_id; })[0]; if (cc) cc.balance += cr; inv.credit_amount = cr; }
          inv.tendered_total = p.payments.reduce(function (s, x) { return s + x.amount; }, 0);
          return { invoice: inv, replayed: !!r.replay };
        });
      });
    },
    pos_return: function (p) {
      var inv = state.invoices.filter(function (i) { return i.id === p.invoice_id; })[0];
      var lines = [];
      p.lines.forEach(function (rl) {
        var left = rl.qty;
        inv.lines.filter(function (l) { return l.product_id === rl.product_id; }).forEach(function (l) {
          var take = Math.min(left, lineCap(inv, l)); if (take > 0) { lines.push({ line_id: l.line_id, qty: isMeasured(l.product_id) ? take / 1000 : take, uiqty: take, restock: rl.restock === false ? 'damaged' : 'stock' }); left -= take; }
        });
      });
      return rpc('pos_return', { p: { idem: p.idempotency_key, doc_id: inv.id, reason: p.reason, refund_method: p.refund_method, lines: lines.map(function (x) { return { line_id: x.line_id, qty: x.qty, restock: x.restock }; }), manager_token: p.manager_token || undefined } }).then(function (r) {
        return get('core_sales_docs?id=eq.' + inv.id + '&select=*').then(loadDocs).then(function () {
          state.returns = state.returns.filter(function (x) { return x.id !== r.id; });
          var ret = { id: r.id, number: r.number, invoice_id: inv.id, invoice_number: inv.number, created_at: Date.now(), shift_id: state.shift && state.shift.id, customer_id: inv.customer_id, amount: P(r.total), reason: p.reason, refund_method: p.refund_method, status: 'posted',
            lines: lines.map(function (x) { var src = inv.lines.filter(function (l) { return l.line_id === x.line_id; })[0]; return { product_id: src.product_id, line_id: x.line_id, qty: x.uiqty, refund: src.qty_kind === 'weight' ? Math.round(src.unit_price * x.uiqty / 1000) : Math.round(src.unit_price * x.uiqty), restock: x.restock === 'stock', name_ar: src.name_ar, name_en: src.name_en, qty_kind: src.qty_kind }; }) };
          state.returns.unshift(ret);
          ret.lines.forEach(function (l) { if (l.restock) { var pr = state.products.filter(function (x) { return x.id === l.product_id; })[0]; if (pr) pr.stock += l.qty; } });
          return { ret: ret, replayed: !!r.replay };
        });
      });
    },
    shift_open: function (p) {
      return rpc('pos_shift_open', { p: { cash: E(p.opening_float), idem: 'sh-' + Date.now() + Math.random().toString(36).slice(2, 6) } }).then(function () { return loadShift(); }).then(function () { return { shift: state.shift }; });
    },
    shift_close: function (p) {
      var sales = shiftSales();
      var go = function (note) { return rpc('pos_shift_close', { p: { counted: E(p.counted_total), note: note || '' } }); };
      return go('').catch(function (e) {
        if (/ملاحظة/.test(e.ar || '')) { var n = window.prompt(e.ar + '\nاكتب الملاحظة:'); if (n && n.trim()) return go(n.trim()); }
        throw e;
      }).then(function (r) {
        var s = state.shift; s.counted = P(r.counted); s.expected = P(r.expected); s.variance = P(r.diff); s.closedAt = Date.now(); s.status = 'closed';
        s.z = { sales: sales, expected: s.expected, counted: s.counted, variance: s.variance };
        return { shift: s };
      });
    },
    cash_move: function (p) {
      return rpc('pos_cash_move', { p: { type: p.type, amount: E(p.amount), reason: p.reason + (p.note ? ' - ' + p.note : ''), idem: 'cm-' + Date.now() + Math.random().toString(36).slice(2, 6) } }).then(function (r) {
        var mv = { id: r.id, shift_id: state.shift.id, type: p.type, amount: p.amount, reason: p.reason, note: p.note || null, voucher_no: r.voucher, user_id: L.uid, created_at: Date.now() };
        state.cashMoves.unshift(mv); return { move: mv };
      });
    },
    invoice_void: function (p) {
      var inv = state.invoices.filter(function (i) { return i.id === p.invoice_id; })[0];
      var mode = p.refund_mode === 'drawer' ? 'cash' : (p.refund_mode || 'cash');
      return rpc('pos_void', { p: { doc_id: inv.id, reason: p.reason || 'cashier_error', refund_mode: mode, idem: 'vd-' + Date.now() } }).then(function () {
        return get('core_sales_docs?id=eq.' + inv.id + '&select=*').then(loadDocs).then(function (o) { inv.lines.forEach(function (l) { var pr = state.products.filter(function (x) { return x.id === l.product_id; })[0]; if (pr) pr.stock += l.qty; }); return { invoice: o[0] || inv }; });
      });
    },
    pos_hold_save: function (p) { return rpc('pos_hold_save', { p: { name: p.name || '', customer_id: p.customer_id || undefined, payload: p.payload, total: E(p.total) } }); },
    pos_hold_take: function (p) { return rpc('pos_hold_take', { p_id: p.id }); }
  };
  function loadHolds() {
    return get('core_hold_carts?select=id,customer_id,payload,total,user_id,created_at&order=created_at.desc&limit=50').then(function (rows) {
      state.held = (rows || []).map(function (h) { var pl = h.payload || {}; return { id: h.id, number: 'H-' + String(h.id).slice(0, 4).toUpperCase(), at: new Date(h.created_at).getTime(), customerId: h.customer_id || pl.customerId || null, lines: pl.lines || [], invoiceDiscount: pl.invoiceDiscount || 0, invoiceDiscountKind: pl.invoiceDiscountKind || 'amount', note: pl.note || '' }; });
    }).catch(function () {});
  }
  function verifyPin(pin) { return rpc('verify_manager_pin', { p_pin: pin }).then(function (r) { return r && r.token; }); }

  window.UnoLive = { init: init, loadHolds: loadHolds, findInvoices: findInvoices, verifyPin: verifyPin, rpc: rpc, state: L };
  window.UNO_RPC_RAW = rpc;
  window.unoRpc = function (name, payload) { if (!API[name]) return Promise.reject(perr('NO_RPC', 'عملية غير معروفة')); return API[name](payload || {}); };
})();
