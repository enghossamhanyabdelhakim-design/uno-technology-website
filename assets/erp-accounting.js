/*!
 * UNO Core ERP — Accounting module, first slice: treasuries (erp-accounting.js)
 * Screens: accounting.treasuries (balances + movements), voucher and transfer sheets.
 * RPCs: erp_meta, erp_treasury_list, erp_treasury_moves, erp_voucher_create, erp_treasury_transfer
 * No table writes. Needs erp-kernel.js loaded first.
 */
(function () {
  'use strict';
  var U = window.UnoERP;
  if (!U || !U.__kernel) { if (window.console) console.warn('[UnoERP] erp-kernel.js must load before this module'); return; }
  var ui = U.ui, t = U.t, L = U.L, esc = U.esc, fmt = U.fmt, icon = U.icon;
  var AR = function (ar, en) { return U.state.lang === 'ar' ? ar : en; };
  var cur = function () { return t('app.currency'); };

  /* ------------------------------------------------------------------ *
   * demo handlers (only used while UnoERP.config.demo is true)
   * ------------------------------------------------------------------ */
  var H = U.demo.handlers, M = null;
  function guard(msg, code) { var e = new Error(msg); e.code = code || 'GUARD'; throw e; }
  function treasuries() { return H.erp_meta().treasuries; }
  function seed() {
    if (M) return M;
    var db = U.demo.db(), n = 0, moves = [];
    db.payments.forEach(function (p) {
      if (!p.treasury_id) return;
      var sp = (H.erp_meta().suppliers.filter(function (s) { return s.id === p.supplier_id; })[0]) || {};
      moves.push({ id: 'tm' + (++n), no: p.no || ('PMT-2026-' + n), date: p.date, treasury_id: p.treasury_id, kind: 'payment', amount: -p.amount,
        party: L(sp), note: AR('دفعة مورد', 'Supplier payment') });
    });
    var rc = [['t1', -2, 18500, 'عميل — مبيعات نقدية', 'Cash sales'], ['t1', -5, 9200, 'عميل — مبيعات نقدية', 'Cash sales'], ['t2', -7, 64000, 'تحصيل عميل آجل', 'Customer collection'],
      ['t3', -3, 7600, 'مبيعات الفرع', 'Branch sales'], ['t2', -11, 41250, 'تحصيل عميل آجل', 'Customer collection']];
    rc.forEach(function (r) {
      moves.push({ id: 'tm' + (++n), no: 'RCV-2026-0' + String(n).padStart(2, '0'), date: U.util.addDays(U.util.todayISO(), r[1]), treasury_id: r[0], kind: 'receipt',
        amount: r[2], party: U.state.lang === 'ar' ? r[3] : r[4], note: '' });
    });
    moves.push({ id: 'tm' + (++n), no: 'EXP-2026-007', date: U.util.addDays(U.util.todayISO(), -4), treasury_id: 't1', kind: 'expense', amount: -2300, party: AR('إيجار المحل', 'Shop rent'), note: '' });
    moves.push({ id: 'tm' + (++n), no: 'TRF-2026-001', date: U.util.addDays(U.util.todayISO(), -6), treasury_id: 't1', kind: 'transfer_out', amount: -30000, party: L(treasuries()[1]), note: '' });
    moves.push({ id: 'tm' + (++n), no: 'TRF-2026-001', date: U.util.addDays(U.util.todayISO(), -6), treasury_id: 't2', kind: 'transfer_in', amount: 30000, party: L(treasuries()[0]), note: '' });
    var tr = treasuries(), open = {};
    tr.forEach(function (x) { open[x.id] = U.util.round(x.balance - moves.filter(function (m) { return m.treasury_id === x.id; }).reduce(function (s, m) { return s + m.amount; }, 0), 2); });
    M = { moves: moves, open: open, refs: {} };
    return M;
  }
  function withBalance(rows, id) {
    var m = seed(), run = m.open[id];
    return rows.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }).map(function (r) { run = U.util.round(run + r.amount, 2); return Object.assign({}, r, { balance_after: run }); });
  }
  H.erp_treasury_list = function () {
    var m = seed();
    var rows = treasuries().map(function (x) {
      var mv = m.moves.filter(function (r) { return r.treasury_id === x.id; });
      var inn = mv.filter(function (r) { return r.amount > 0; }).reduce(function (s, r) { return s + r.amount; }, 0);
      var out = mv.filter(function (r) { return r.amount < 0; }).reduce(function (s, r) { return s - r.amount; }, 0);
      var last = mv.map(function (r) { return r.date; }).sort().pop() || null;
      return { id: x.id, ar: x.ar, en: x.en, kind: x.kind, balance: x.balance, opening: m.open[x.id], in_total: U.util.round(inn, 2), out_total: U.util.round(out, 2),
        last_date: last, reconciles: Math.abs(m.open[x.id] + inn - out - x.balance) < 0.01 };
    });
    return { rows: rows, totals: { balance: U.util.round(rows.reduce(function (s, r) { return s + r.balance; }, 0), 2), cash: U.util.round(rows.filter(function (r) { return r.kind === 'cash'; }).reduce(function (s, r) { return s + r.balance; }, 0), 2),
      bank: U.util.round(rows.filter(function (r) { return r.kind === 'bank'; }).reduce(function (s, r) { return s + r.balance; }, 0), 2) } };
  };
  H.erp_treasury_moves = function (a) {
    var m = seed(), out = [];
    (a.treasury_id ? [a.treasury_id] : treasuries().map(function (x) { return x.id; })).forEach(function (id) {
      out = out.concat(withBalance(m.moves.filter(function (r) { return r.treasury_id === id; }), id));
    });
    if (a.kind && a.kind !== 'all') out = out.filter(function (r) {
      return a.kind === 'transfer' ? r.kind.indexOf('transfer') === 0 : a.kind === 'receipt' ? r.amount > 0 && r.kind === 'receipt' : a.kind === 'payment' ? r.amount < 0 && r.kind !== 'transfer_out' : true; });
    if (a.from) out = out.filter(function (r) { return r.date >= a.from; });
    if (a.q) { var q = String(a.q).toLowerCase(); out = out.filter(function (r) { return (r.no + ' ' + r.party + ' ' + r.note).toLowerCase().indexOf(q) >= 0; }); }
    out.sort(function (x, y) { return x.date < y.date ? 1 : x.date > y.date ? -1 : 0; });
    return { rows: out, totals: { count: out.length,
      in: U.util.round(out.filter(function (r) { return r.amount > 0; }).reduce(function (s, r) { return s + r.amount; }, 0), 2),
      out: U.util.round(out.filter(function (r) { return r.amount < 0; }).reduce(function (s, r) { return s - r.amount; }, 0), 2) } };
  };
  var basePay = H.erp_purchase_pay;
  H.erp_purchase_pay = function (a) {
    var before = U.demo.db().payments.length, r = basePay.apply(this, arguments), db = U.demo.db();
    if (M && db.payments.length > before) {
      var p = db.payments[db.payments.length - 1];
      if (p.treasury_id) {
        var sp = (H.erp_meta().suppliers.filter(function (x) { return x.id === p.supplier_id; })[0]) || {};
        M.moves.push({ id: U.util.uid('tm'), no: p.no || 'PMT', date: p.date, treasury_id: p.treasury_id, kind: 'payment', amount: -p.amount, party: L(sp), note: '' });
      }
    }
    return r;
  };
  function balanceOf(id) { return treasuries().filter(function (x) { return x.id === id; })[0]; }
  H.erp_voucher_create = function (a) {
    var m = seed(), tr = balanceOf(a.treasury_id), amt = Number(a.amount);
    if (a.client_ref && m.refs[a.client_ref]) return m.refs[a.client_ref];
    if (!tr) guard('اختر الخزينة.', 'TREASURY');
    if (!(amt > 0)) guard('أدخل مبلغًا أكبر من صفر.', 'AMOUNT');
    if (!a.party) guard('اكتب اسم الطرف (من/إلى).', 'PARTY');
    if (a.type === 'payment' && amt > tr.balance) guard('رصيد ' + tr.ar + ' ' + fmt.money(tr.balance) + ' ج.م فقط — المطلوب ' + fmt.money(amt) + ' ج.م.', 'INSUFFICIENT');
    tr.balance = U.util.round(tr.balance + (a.type === 'payment' ? -amt : amt), 2);
    var mv = { id: U.util.uid('tm'), no: (a.type === 'payment' ? 'PAY-2026-' : 'RCV-2026-') + String(m.moves.length + 1).padStart(3, '0'), date: a.date || U.util.todayISO(),
      treasury_id: a.treasury_id, kind: a.type === 'payment' ? 'payment' : 'receipt', amount: a.type === 'payment' ? -amt : amt, party: a.party, note: a.note || '' };
    m.moves.push(mv);
    var res = { ok: true, voucher: mv, balance: tr.balance };
    if (a.client_ref) m.refs[a.client_ref] = res;
    return res;
  };
  H.erp_treasury_transfer = function (a) {
    var m = seed(), f = balanceOf(a.from_id), to = balanceOf(a.to_id), amt = Number(a.amount);
    if (a.client_ref && m.refs[a.client_ref]) return m.refs[a.client_ref];
    if (!f || !to) guard('اختر الخزينتين.', 'TREASURY');
    if (f.id === to.id) guard('لا يمكن التحويل إلى نفس الخزينة.', 'SAME');
    if (!(amt > 0)) guard('أدخل مبلغًا أكبر من صفر.', 'AMOUNT');
    if (amt > f.balance) guard('رصيد ' + f.ar + ' ' + fmt.money(f.balance) + ' ج.م فقط — المطلوب ' + fmt.money(amt) + ' ج.م.', 'INSUFFICIENT');
    f.balance = U.util.round(f.balance - amt, 2); to.balance = U.util.round(to.balance + amt, 2);
    var no = 'TRF-2026-' + String(m.moves.length + 1).padStart(3, '0'), d = a.date || U.util.todayISO();
    m.moves.push({ id: U.util.uid('tm'), no: no, date: d, treasury_id: f.id, kind: 'transfer_out', amount: -amt, party: to.ar, note: a.note || '' });
    m.moves.push({ id: U.util.uid('tm'), no: no, date: d, treasury_id: to.id, kind: 'transfer_in', amount: amt, party: f.ar, note: a.note || '' });
    var res = { ok: true, no: no };
    if (a.client_ref) m.refs[a.client_ref] = res;
    return res;
  };

  /* ------------------------------------------------------------------ *
   * screen
   * ------------------------------------------------------------------ */
  var KIND = {
    receipt: { ar: 'سند قبض', en: 'Receipt', tone: 'ok' }, payment: { ar: 'سند صرف', en: 'Payment', tone: 'warn' },
    expense: { ar: 'مصروف', en: 'Expense', tone: 'warn' }, transfer_in: { ar: 'تحويل وارد', en: 'Transfer in', tone: 'info' },
    transfer_out: { ar: 'تحويل صادر', en: 'Transfer out', tone: 'info' }
  };
  function tName(id) { var x = U.state.meta.treasuries.filter(function (r) { return r.id === id; })[0]; return x ? L(x) : id; }

  function load(ctx) {
    var f = ctx.filters;
    if (!f.kind) f.kind = 'all';
    return Promise.all([
      U.api.call('erp_treasury_list', {}),
      U.api.call('erp_treasury_moves', { treasury_id: f.treasury || null, kind: f.kind, q: f.q || '' })
    ]).then(function (r) { return { list: r[0], moves: r[1] }; });
  }

  function view(ctx, d) {
    var f = ctx.filters, s = d.list;
    var tabs = ui.tabs([
      { id: 'all', label: t('app.all') }, { id: 'receipt', label: AR('قبض', 'Receipts') },
      { id: 'payment', label: AR('صرف', 'Payments') }, { id: 'transfer', label: AR('تحويلات', 'Transfers') }
    ], f.kind, 'a-tab');
    var cards = '<div class="grid">' + s.rows.map(function (r) {
      var on = f.treasury === r.id;
      return '<div class="c4"><button class="card tr-card' + (on ? ' is-on' : '') + '" data-act="a-select" data-id="' + esc(r.id) + '">' +
        '<div class="tr-top"><span class="tr-ico">' + icon(r.kind === 'bank' ? 'building' : 'cash', 18) + '</span>' +
        '<div class="tr-nm">' + esc(L(r)) + '<div class="id-s">' + esc(r.kind === 'bank' ? AR('حساب بنكي', 'Bank account') : AR('خزينة نقدية', 'Cash box')) + '</div></div></div>' +
        '<div class="tr-bal num">' + esc(fmt.money(r.balance)) + '<span class="cur">' + esc(cur()) + '</span></div>' +
        '<div class="tr-meta"><span>' + esc(AR('وارد', 'In')) + ' <b class="num">' + esc(fmt.money(r.in_total)) + '</b></span>' +
        '<span>' + esc(AR('صادر', 'Out')) + ' <b class="num">' + esc(fmt.money(r.out_total)) + '</b></span></div>' +
        (r.reconciles ? '' : '<div class="tr-warn">' + esc(AR('الرصيد لا يطابق الحركات', 'Balance does not match movements')) + '</div>') +
        '</button></div>';
    }).join('') + '</div>';
    var cols = [
      { key: 'no', label: t('app.doc'), cls: 'doc-col', cell: function (r) { return '<div class="doc-no">' + esc(r.no) + '</div><div class="id-s">' + ui.pill(L(KIND[r.kind]), KIND[r.kind].tone) + '</div>'; } },
      { key: 'date', label: t('app.date'), cell: function (r) { return '<span class="num">' + esc(fmt.date(r.date)) + '</span>'; } },
      { key: 'tr', label: AR('الخزينة', 'Treasury'), cell: function (r) { return '<span class="faint">' + esc(tName(r.treasury_id)) + '</span>'; } },
      { key: 'party', label: AR('الطرف', 'Party'), cell: function (r) { return esc(r.party || '—'); } },
      { key: 'in', label: AR('وارد', 'In'), align: 'end', cell: function (r) { return r.amount > 0 ? '<span class="num amt-in">' + esc(fmt.money(r.amount)) + '</span>' : '<span class="faint">—</span>'; } },
      { key: 'out', label: AR('صادر', 'Out'), align: 'end', cell: function (r) { return r.amount < 0 ? '<span class="num amt-out">' + esc(fmt.money(-r.amount)) + '</span>' : '<span class="faint">—</span>'; } },
      { key: 'bal', label: AR('الرصيد بعد', 'Balance after'), align: 'end', cell: function (r) { return '<span class="num">' + esc(fmt.money(r.balance_after)) + '</span>'; } }
    ];
    return '<div class="page-head"><div class="ph-txt"><div class="crumbs"><span>' + esc(AR('الرئيسية', 'Home')) + '</span>' + icon('chevStart', 12) +
      '<span>' + esc(AR('المالية', 'Accounting')) + '</span>' + icon('chevStart', 12) + '<span>' + esc(AR('الخزائن', 'Treasuries')) + '</span></div>' +
      '<h1 class="page-title">' + esc(AR('الخزائن والبنوك', 'Treasuries and banks')) + '</h1>' +
      '<p class="page-sub">' + esc(AR('كل مبلغ داخل أو خارج يمر بسند. الرصيد يساوي الافتتاحي زائد الحركات.', 'Every amount in or out goes through a voucher. Balance equals opening plus movements.')) + '</p></div>' +
      '<div class="page-actions">' + ui.btn(AR('تحويل', 'Transfer'), { act: 'a-transfer', icon: 'swap' }) + ui.btn(AR('سند صرف', 'Payment'), { act: 'a-pay', icon: 'arrowUp' }) +
      ui.btn(AR('سند قبض', 'Receipt'), { act: 'a-receive', kind: 'primary', icon: 'plus' }) + '</div></div>' +
      '<div class="kpis">' +
      ui.kpi({ label: AR('إجمالي السيولة', 'Total liquidity'), value: fmt.money(s.totals.balance), cur: true, note: AR('نقد وبنوك', 'Cash and banks') }) +
      ui.kpi({ label: AR('نقدية', 'Cash'), value: fmt.money(s.totals.cash), cur: true, note: fmt.num(s.rows.filter(function (r) { return r.kind === 'cash'; }).length) + ' ' + AR('خزينة', 'boxes') }) +
      ui.kpi({ label: AR('بنوك', 'Banks'), value: fmt.money(s.totals.bank), cur: true, note: fmt.num(s.rows.filter(function (r) { return r.kind === 'bank'; }).length) + ' ' + AR('حساب', 'accounts') }) +
      ui.kpi({ label: AR('مطابقة الأرصدة', 'Balance check'), value: s.rows.every(function (r) { return r.reconciles; }) ? AR('سليمة', 'OK') : AR('فرق', 'Mismatch'), note: AR('الافتتاحي + الحركات = الرصيد', 'Opening + movements = balance') }) +
      '</div>' + cards +
      '<section class="card"><div class="tab-pad">' + tabs + '</div><div class="toolbar"><div class="search-inline">' + icon('search', 16) +
      '<input data-act="search" data-filter="q" value="' + esc(f.q || '') + '" placeholder="' + esc(AR('رقم السند أو الطرف…', 'Voucher no. or party…')) + '"></div>' +
      (f.treasury ? ui.btn(tName(f.treasury) + ' ✕', { act: 'a-clear', kind: 'ghost', size: 'sm' }) : '<span class="faint">' + esc(AR('اضغط خزينة لتصفية الحركات', 'Select a treasury to filter')) + '</span>') + '</div>' +
      ui.table({ cols: cols, rows: d.moves.rows, rowId: function (r) { return r.id; }, empty: ui.empty({ title: t('app.empty'), hint: t('app.emptyHint'), icon: 'wallet' }) }) +
      ui.totalsStrip([{ label: AR('حركات', 'Movements'), value: fmt.num(d.moves.totals.count) }, { label: AR('وارد', 'In'), value: fmt.money(d.moves.totals.in) },
        { label: AR('صادر', 'Out'), value: fmt.money(d.moves.totals.out) }], AR('الأرقام بالجنيه المصري', 'Amounts in EGP')) + '</section>';
  }

  function sheet(ctx, type) {
    var root = document.querySelector('.uerp');
    if (root.querySelector('[data-ovl="vch"]')) return;
    var isT = type === 'transfer';
    var opts = U.state.meta.treasuries.map(function (x) { return { value: x.id, label: L(x) }; });
    var body = '<div class="form-grid">' +
      (isT ? '<div>' + ui.field({ label: AR('من خزينة', 'From'), type: 'select', id: 'v-from', options: opts }) + '</div><div>' + ui.field({ label: AR('إلى خزينة', 'To'), type: 'select', id: 'v-to', options: opts.slice().reverse() }) + '</div>'
        : '<div class="span2">' + ui.field({ label: AR('الخزينة', 'Treasury'), type: 'select', id: 'v-tr', options: opts }) + '</div>' +
          '<div class="span2">' + ui.field({ label: type === 'payment' ? AR('مدفوع إلى', 'Paid to') : AR('مستلم من', 'Received from'), type: 'text', id: 'v-party' }) + '</div>') +
      '<div class="span2">' + ui.field({ label: AR('المبلغ', 'Amount'), type: 'number', id: 'v-amt', step: '0.01', min: '0', unit: cur() }) + '</div>' +
      '<div class="span2">' + ui.field({ label: t('app.notes'), type: 'textarea', id: 'v-note', rows: 2 }) + '</div></div><div id="v-err"></div>';
    var title = isT ? AR('تحويل بين خزينتين', 'Transfer between treasuries') : type === 'payment' ? AR('سند صرف', 'Payment voucher') : AR('سند قبض', 'Receipt voucher');
    root.insertAdjacentHTML('beforeend', ui.overlay({ id: 'vch', title: title, sub: AR('يُسجَّل فورًا ولا يُحذف، يُعكس بسند معاكس', 'Posted immediately, never deleted, reversed by an opposite voucher'), body: body,
      foot: '<span class="grow"></span>' + ui.btn(t('app.cancel'), { act: 'a-close' }) + ui.btn(AR('تسجيل', 'Post'), { act: 'a-submit', kind: 'primary', data: { type: type } }) }));
  }
  function submit(ctx, type) {
    var root = document.querySelector('.uerp'), q = function (s) { return root.querySelector(s); };
    var p = type === 'transfer' ? U.api.call('erp_treasury_transfer', { from_id: q('#v-from').value, to_id: q('#v-to').value, amount: q('#v-amt').value, note: q('#v-note').value, client_ref: U.util.uid('ref') })
      : U.api.call('erp_voucher_create', { type: type, treasury_id: q('#v-tr').value, party: q('#v-party').value, amount: q('#v-amt').value, note: q('#v-note').value, client_ref: U.util.uid('ref') });
    p.then(function () { var o = q('[data-ovl="vch"]'); if (o) o.remove(); ui.toast(AR('تم التسجيل', 'Posted'), 'ok'); ctx.reload(); })
      .catch(function (e) { q('#v-err').innerHTML = ui.banner({ tone: 'bad', icon: 'alert', title: AR('لم يُسجَّل', 'Refused'), text: e.message }); });
  }

  var A = {
    'a-tab': function (ctx, el) { ctx.filters.kind = el.getAttribute('data-id'); ctx.reload(); },
    'a-select': function (ctx, el) { var id = el.getAttribute('data-id'); ctx.filters.treasury = ctx.filters.treasury === id ? '' : id; ctx.reload(); },
    'a-clear': function (ctx) { ctx.filters.treasury = ''; ctx.reload(); },
    'a-receive': function (ctx) { sheet(ctx, 'receipt'); }, 'a-pay': function (ctx) { sheet(ctx, 'payment'); }, 'a-transfer': function (ctx) { sheet(ctx, 'transfer'); },
    'a-close': function () { var o = document.querySelector('.uerp [data-ovl="vch"]'); if (o) o.remove(); },
    'a-submit': function (ctx, el) { submit(ctx, el.getAttribute('data-type')); }
  };
  A['close-sheet'] = A['a-close'];

  U.registerModule({
    id: 'accounting', group: 'accounting',
    nav: [{ group: 'accounting', screen: 'accounting.treasuries', label: { ar: 'الخزائن والبنوك', en: 'Treasuries' }, icon: 'wallet', order: 10 }],
    screens: [{ id: 'accounting.treasuries', title: { ar: 'الخزائن والبنوك', en: 'Treasuries' }, load: load, view: view, actions: A }]
  });
})();
