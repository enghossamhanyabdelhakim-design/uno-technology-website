/* UNO POS offline queue: cash sales made without a connection are kept in IndexedDB on this device and replayed with the same
   idempotency key when the connection returns (the server never double-books a key). Cash only. Returns and card/wallet/credit need a connection. */
(function () {
  'use strict';
  var DB = null, Q = [], busy = false, CF = window.UNO_CFG;
  function T(a, e) { return (typeof LANG !== 'undefined' && LANG === 'en') ? e : a; }
  function open() {
    return new Promise(function (res, rej) {
      if (!window.indexedDB) return rej(new Error('no idb'));
      var r = indexedDB.open('uno_pos_offline', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('q', { keyPath: 'idem' }); };
      r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
    });
  }
  function tx(mode, fn) { return new Promise(function (res, rej) { var t = DB.transaction('q', mode), o = fn(t.objectStore('q')); t.oncomplete = function () { res(o && o.result); }; t.onerror = function () { rej(t.error); }; t.onabort = function () { rej(t.error); }; }); }
  function load() { return tx('readonly', function (s) { return s.getAll(); }).then(function (a) { Q = a || []; pill(); }); }
  function seq() { var n = 1; try { n = (parseInt(localStorage.getItem('uno_off_seq') || '0', 10) || 0) + 1; localStorage.setItem('uno_off_seq', String(n)); } catch (e) {} return 'OFF-' + String(n).padStart(4, '0'); }
  function report(rec, status, err) {
    if (!window.UNO_RPC_RAW) return;
    window.UNO_RPC_RAW('pos_offline_report', { p: { idem: rec.idem, offline_no: rec.number, queued_at: new Date(rec.at).toISOString(), total: rec.total, device_id: rec.device, status: status, error: err || null } }).catch(function () {});
  }
  function enqueue(args, p, cart, totals) {
    var number = seq(), now = Date.now();
    var lines = cart.map(function (l) {
      var prod = state.products.filter(function (x) { return x.id === l.productId; })[0];
      var up = Math.round(prod ? (l.priceOverride ? l.unitPrice : prod.price) : l.unitPrice), q = l.qty;
      if (prod) prod.stock = Math.max(0, prod.stock - q);
      return { product_id: l.productId, line_id: 'off-' + l.productId, name_ar: prod ? prod.ar : (l.nameAr || l.name || 'صنف'), name_en: prod ? prod.en : (l.name || 'Item'), mono: prod ? prod.mono : '?',
        qty: q, qty_kind: prod && prod.weighted ? 'weight' : 'unit', unit_price: up, unit_ar: prod && prod.weighted ? prod.unitAr : 'قطعة', unit_en: prod && prod.weighted ? prod.unitEn : 'pc', discount: 0, amount: Math.round(up * (prod && prod.weighted ? q / 1000 : q)) };
    });
    var tendered = p.payments.reduce(function (s, x) { return s + x.amount; }, 0);
    var inv = { id: 'off-' + p.idempotency_key, number: number, created_at: now, shift_id: state.shift && state.shift.id, device_id: CF && args.device_id, customer_id: null, customer_name: null, lines: lines,
      subtotal: lines.reduce(function (s, l) { return s + l.amount; }, 0), invoice_discount: totals.invoiceDiscount, total: totals.total, tax: Math.round(totals.total - totals.total / 1.14),
      payments: p.payments.map(function (x) { return { method: x.method, amount: x.amount }; }), tendered_total: tendered, paid_total: Math.min(tendered, totals.total), change_due: Math.max(0, tendered - totals.total), credit_amount: 0,
      note: T('فاتورة مؤقتة أوفلاين', 'Temporary offline invoice'), status: 'paid', idempotency_key: p.idempotency_key, returned_total: 0, offline: true };
    var rec = { idem: args.idem, args: args, at: now, number: number, total: totals.total / 100, device: args.device_id, status: 'pending', error: null };
    return tx('readwrite', function (s) { return s.put(rec); }).then(function () { Q.push(rec); pill(); return { __offline: true, result: { invoice: inv, replayed: false } }; });
  }
  function pill() {
    var el = document.getElementById('outboxPill'); if (!el) return;
    var pend = Q.filter(function (r) { return r.status !== 'failed'; }).length, bad = Q.length - pend;
    el.style.display = Q.length ? 'inline-flex' : 'none';
    el.innerHTML = '<span class="dot"></span><span>' + (pend ? T('بانتظار الإرسال', 'To send') + ' <b class="num">' + pend + '</b>' : '') + (bad ? ' <b class="num" style="color:#ef4444">' + bad + ' ' + T('بحاجة مراجعة', 'need review') + '</b>' : '') + '</span>';
    el.style.cursor = 'pointer';
  }
  function flush() {
    if (busy || !navigator.onLine || !window.UNO_RPC_RAW) return Promise.resolve();
    var todo = Q.filter(function (r) { return r.status === 'pending'; }); if (!todo.length) return Promise.resolve();
    busy = true; state.syncing = true; try { renderTopbar(); } catch (e) {}
    var ok = 0, i = 0;
    function next() {
      if (i >= todo.length) return Promise.resolve();
      var rec = todo[i++];
      return window.UNO_RPC_RAW('pos_sale', { p: rec.args }).then(function () {
        ok++; report(rec, 'synced'); return tx('readwrite', function (s) { return s.delete(rec.idem); }).then(function () { Q = Q.filter(function (x) { return x.idem !== rec.idem; }); });
      }).then(next, function (e) {
        if (e && e.code === 'NETWORK') { i = todo.length; return; }
        rec.status = 'failed'; rec.error = (e && (e.ar || e.message)) || 'error'; report(rec, 'failed', rec.error);
        return tx('readwrite', function (s) { return s.put(rec); }).then(next);
      });
    }
    return next().then(function () {
      busy = false; state.syncing = false; try { renderTopbar(); } catch (e) {} pill();
      var bad = Q.filter(function (r) { return r.status === 'failed'; }).length;
      if (ok) toast(T('اتزامنت ' + ok + ' فاتورة أوفلاين', ok + ' offline invoice(s) synced'), 'ok');
      if (bad) toast(T(bad + ' فاتورة محتاجة مراجعة المدير', bad + ' invoice(s) need manager review'), 'bad', 6000);
    });
  }
  function review() {
    var f = Q.filter(function (r) { return r.status === 'failed'; });
    if (!f.length) { toast(T('مفيش فواتير محتاجة مراجعة', 'Nothing to review'), 'ok'); return; }
    alert(f.map(function (r) { return r.number + ' · ' + (r.total) + ' · ' + r.error; }).join('\n') + '\n\n' + T('الفواتير دي لم تتسجل في النظام. راجع المدير.', 'These were NOT recorded in the system. Ask the manager.'));
  }
  function setOnline(v) { state.online = v; try { renderTopbar(); } catch (e) {} }
  window.UNO_OFFLINE = { enqueue: enqueue, flush: flush, queue: function () { return Q.slice(); } };
  function init() {
    open().then(function (d) { DB = d; return load(); }).then(function () { setOnline(navigator.onLine); flush(); }).catch(function () { window.UNO_OFFLINE.enqueue = null; delete window.UNO_OFFLINE; });
    window.addEventListener('offline', function () { setOnline(false); toast(T('انقطع الاتصال. البيع بالكاش مستمر وبيتحفظ على الجهاز.', 'Offline. Cash sales continue and are saved on this device.'), 'bad', 4500); });
    window.addEventListener('online', function () { setOnline(true); flush(); });
    setInterval(function () { if (navigator.onLine) flush(); }, 30000);
    document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('#outboxPill')) review(); });
    window.flushOutbox = function () { return flush(); };
    window.renderOutboxPill = pill;
    window.toggleOnline = function () { toast(T('حالة الاتصال بتتحدد تلقائيًا من الإنترنت الفعلي', 'Connection state follows the real network'), 'ok'); };
  }
  if (document.readyState === 'complete') init(); else window.addEventListener('load', init);
})();
