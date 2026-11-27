/*!
 * UNO Core ERP — Receivables module (erp-receivables.js), demo mode
 * Screens: accounting.customers (balances + aging), accounting.customer (file + statement), collection sheet.
 * RPCs: erp_customer_list, erp_customer_get, erp_customer_receipt
 * No table writes. Needs erp-kernel.js and erp-accounting.js loaded first.
 * Demo only: every sale and every seeded receipt is assigned to a customer by document number; the sub-ledger always sums to the
 * accounts-receivable account (1100) of the demo journal. A real backend needs sales.customer_id.
 */
(function () {
  'use strict';
  var U = window.UnoERP;
  if (!U || !U.__kernel || !U.i2) { if (window.console) console.warn('[UnoERP] erp-kernel.js and erp-accounting.js must load before erp-receivables.js'); return; }
  var ui = U.ui, t = U.t, esc = U.esc, fmt = U.fmt, icon = U.icon;
  var AR = function (ar, en) { return U.state.lang === 'ar' ? ar : en; };
  var cur = function () { return t('app.currency'); };
  var H = U.demo.handlers, R2 = function (v) { return U.util.round(v, 2); };
  function guard(msg, code) { var e = new Error(msg); e.code = code || 'GUARD'; throw e; }

  var CUST = [
    { id: 'c1', ar: 'شركة النيل للاتصالات', en: 'Nile Telecom Co.', phone: '+20 100 555 0141', limit: 120000, terms: 30 },
    { id: 'c2', ar: 'مكتب الصعيد للأمن', en: 'Upper Egypt Security Office', phone: '+20 109 555 0172', limit: 60000, terms: 30 },
    { id: 'c3', ar: 'فندق الأقصر بلازا', en: 'Luxor Plaza Hotel', phone: '+20 95 555 0133', limit: 90000, terms: 45 },
    { id: 'c4', ar: 'مدارس المستقبل', en: 'Future Schools', phone: '+20 96 555 0188', limit: 40000, terms: 30 },
    { id: 'c5', ar: 'مستشفى قنا التخصصي', en: 'Qena Specialized Hospital', phone: '+20 96 555 0102', limit: 80000, terms: 60 },
    { id: 'c6', ar: 'مصطفى للإلكترونيات', en: 'Mostafa Electronics', phone: '+20 111 555 0166', limit: 30000, terms: 15 }
  ];
  var receiptOf = {}; /* voucher no -> customer id (demo memory for receipts taken on this screen) */
  var nm = function (c) { return U.state.lang === 'ar' ? c.ar : c.en; };
  function custById(id) { return CUST.filter(function (c) { return c.id === id; })[0]; }
  function today() { return U.util.todayISO(); }
  function days(from) { return Math.max(0, Math.round((new Date(today()) - new Date(from)) / 86400000)); }
  function pick(doc) { var n = parseInt(String(doc).replace(/\D/g, '').slice(-4), 10) || 0; return CUST[n % CUST.length].id; }
  function pickReceipt(doc) { var n = parseInt(String(doc).replace(/\D/g, '').slice(-3), 10) || 0; return CUST[(n + 2) % CUST.length].id; }

  /* ledger per customer from the demo journal (sales entries and 1100 credits) */
  function ledger() {
    var by = {}, run0 = {}; CUST.forEach(function (c) { by[c.id] = []; run0[c.id] = 0; });
    function biggest() { return CUST.slice().sort(function (a, b) { return run0[b.id] - run0[a.id]; })[0].id; }
    U.i2.journal().forEach(function (e) {
      var l = e.lines.filter(function (x) { return x.acct === '1100'; });
      if (!l.length) return;
      var amt = R2(l.reduce(function (s, x) { return s + x.dr - x.cr; }, 0));
      if (e.source === 'sales') { run0[pick(e.doc)] = R2(run0[pick(e.doc)] + amt); by[pick(e.doc)].push({ date: e.date, doc: e.doc, kind: amt >= 0 ? 'invoice' : 'return', debit: amt > 0 ? amt : 0, credit: amt < 0 ? -amt : 0, memo_ar: e.memo_ar, memo_en: e.memo_en }); }
      else if (e.source === 'treasury') { var rc = receiptOf[e.doc] || biggest(); run0[rc] = R2(run0[rc] + amt); by[rc].push({ date: e.date, doc: e.doc, kind: 'receipt', debit: 0, credit: -amt, memo_ar: e.memo_ar, memo_en: e.memo_en }); }
    });
    Object.keys(by).forEach(function (k) {
      var run = 0; by[k].sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
      by[k].forEach(function (r) { run = R2(run + r.debit - r.credit); r.balance = run; });
    });
    return by;
  }
  function aging(rows) {
    var credit = R2(rows.reduce(function (s, r) { return s + r.credit; }, 0)), b = { cur: 0, b1: 0, b2: 0, b3: 0 }, oldest = 0;
    rows.filter(function (r) { return r.debit > 0; }).forEach(function (r) {
      var open = r.debit, use = Math.min(open, credit); credit = R2(credit - use); open = R2(open - use);
      if (open <= 0.004) return;
      var d = days(r.date); oldest = Math.max(oldest, d);
      b[d <= 30 ? 'cur' : d <= 60 ? 'b1' : d <= 90 ? 'b2' : 'b3'] = R2(b[d <= 30 ? 'cur' : d <= 60 ? 'b1' : d <= 90 ? 'b2' : 'b3'] + open);
    });
    return { b: b, oldest: oldest, advance: credit };
  }
  function summary(c, rows) {
    var d = rows.reduce(function (s, r) { return s + r.debit; }, 0), k = rows.reduce(function (s, r) { return s + r.credit; }, 0), a = aging(rows);
    return { id: c.id, ar: c.ar, en: c.en, name: nm(c), phone: c.phone, limit: c.limit, terms: c.terms, sales: R2(d), paid: R2(k), balance: R2(d - k), buckets: a.b, oldest: a.oldest,
      overdue: R2(a.b.b1 + a.b.b2 + a.b.b3), over_limit: c.limit > 0 && d - k > c.limit, last: rows.length ? rows[rows.length - 1].date : null };
  }

  H.erp_customer_list = function (a) {
    var led = ledger(), rows = CUST.map(function (c) { return summary(c, led[c.id]); });
    var gl = U.demo.handlers.erp_trial_balance({}).rows.filter(function (r) { return r.code === '1100'; })[0];
    var glBal = gl ? R2(gl.dr - gl.cr) : 0, sum = R2(rows.reduce(function (s, r) { return s + r.balance; }, 0));
    var tot = { balance: sum, overdue: R2(rows.reduce(function (s, r) { return s + r.overdue; }, 0)), with_balance: rows.filter(function (r) { return r.balance > 0.004; }).length,
      over_limit: rows.filter(function (r) { return r.over_limit; }).length, b: { cur: 0, b1: 0, b2: 0, b3: 0 }, ties_gl: Math.abs(glBal - sum) < 0.01, gl_balance: glBal };
    rows.forEach(function (r) { ['cur', 'b1', 'b2', 'b3'].forEach(function (k) { tot.b[k] = R2(tot.b[k] + r.buckets[k]); }); });
    if (a && a.filter === 'overdue') rows = rows.filter(function (r) { return r.overdue > 0.004; });
    if (a && a.filter === 'limit') rows = rows.filter(function (r) { return r.over_limit; });
    if (a && a.q) { var q = String(a.q).toLowerCase(); rows = rows.filter(function (r) { return (r.ar + ' ' + r.en + ' ' + r.phone).toLowerCase().indexOf(q) >= 0; }); }
    rows.sort(function (x, y) { return y.balance - x.balance; });
    return { rows: rows, totals: tot };
  };
  H.erp_customer_get = function (a) {
    var c = custById(a.id); if (!c) guard('العميل غير موجود.', 'NOT_FOUND');
    var rows = ledger()[c.id], s = summary(c, rows), ag = aging(rows);
    return { customer: s, aging: ag.b, advance: ag.advance, statement: rows.slice().reverse().map(function (r) { return Object.assign({}, r, { memo: U.state.lang === 'ar' ? r.memo_ar : r.memo_en }); }) };
  };
  H.erp_customer_receipt = function (a) {
    var c = custById(a.customer_id), amt = Number(a.amount);
    if (a.client_ref && H.__rc && H.__rc[a.client_ref]) return H.__rc[a.client_ref];
    if (!c) guard('اختر العميل.', 'CUSTOMER');
    if (!(amt > 0)) guard('أدخل مبلغًا أكبر من صفر.', 'AMOUNT');
    var bal = summary(c, ledger()[c.id]).balance;
    if (amt > bal + 0.004) guard('رصيد ' + c.ar + ' ' + fmt.money(bal) + ' ج.م فقط — لا يمكن تحصيل ' + fmt.money(amt) + ' ج.م.', 'OVER_BALANCE');
    var r = H.erp_voucher_create({ type: 'receipt', treasury_id: a.treasury_id, party: c.ar, amount: amt, note: a.note || '', client_ref: a.client_ref });
    receiptOf[r.voucher.no] = c.id;
    var res = { ok: true, voucher: r.voucher, customer_balance: R2(bal - amt) };
    H.__rc = H.__rc || {}; if (a.client_ref) H.__rc[a.client_ref] = res;
    return res;
  };

  /* ---------------------------- screens ---------------------------- */
  function head(crumb, title, sub, actions, back) {
    return '<div class="page-head"><div class="ph-txt"><div class="crumbs"><span>' + esc(AR('الرئيسية', 'Home')) + '</span>' + icon('chevStart', 12) +
      '<span>' + esc(AR('المالية', 'Accounting')) + '</span>' + icon('chevStart', 12) + (back ? back + icon('chevStart', 12) : '') + '<span>' + esc(crumb) + '</span></div>' +
      '<h1 class="page-title">' + esc(title) + '</h1>' + (sub ? '<p class="page-sub">' + esc(sub) + '</p>' : '') + '</div>' +
      (actions ? '<div class="page-actions">' + actions + '</div>' : '') + '</div>';
  }
  function agingBlock(b) {
    var tot = b.cur + b.b1 + b.b2 + b.b3 || 1, cols = [['cur', 'age-1'], ['b1', 'age-2'], ['b2', 'age-3'], ['b3', 'age-4']];
    return '<div class="aging">' + cols.map(function (x) { return b[x[0]] > 0 ? '<i class="age-seg ' + x[1] + '" data-w="' + (b[x[0]] / tot * 100).toFixed(1) + '"></i>' : ''; }).join('') + '</div>' +
      '<div class="aging-legend">' +
      '<span><i class="dot-age-1"></i>' + esc(AR('حتى ٣٠ يومًا', 'Up to 30 days')) + ' ' + esc(fmt.money(b.cur)) + '</span>' +
      '<span><i class="dot-age-2"></i>' + esc(AR('٣١ إلى ٦٠', '31 to 60')) + ' ' + esc(fmt.money(b.b1)) + '</span>' +
      '<span><i class="dot-age-3"></i>' + esc(AR('٦١ إلى ٩٠', '61 to 90')) + ' ' + esc(fmt.money(b.b2)) + '</span>' +
      '<span><i class="dot-age-4"></i>' + esc(AR('أكثر من ٩٠', 'Over 90')) + ' ' + esc(fmt.money(b.b3)) + '</span></div>';
  }
  function bindAging() {
    var root = document.querySelector('.uerp'); if (!root) return;
    [].forEach.call(root.querySelectorAll('.age-seg'), function (el) { el.style.width = el.getAttribute('data-w') + '%'; });
  }
  function loadList(ctx) { var f = ctx.filters; f.filter = f.filter || 'all'; return U.api.call('erp_customer_list', { filter: f.filter, q: f.q || '' }); }
  function viewList(ctx, d) {
    var f = ctx.filters, tt = d.totals;
    var tabs = ui.tabs([{ id: 'all', label: t('app.all') }, { id: 'overdue', label: AR('متأخر', 'Overdue') }, { id: 'limit', label: AR('تجاوز الحد', 'Over limit') }], f.filter, 'r-tab');
    var cols = [
      { key: 'name', label: AR('العميل', 'Customer'), cls: 'id-col', cell: function (r) { return '<div class="id-cell">' + ui.avatar(r.name) + '<div><div class="id-t">' + esc(r.name) + '</div><div class="id-s num">' + esc(r.phone || '—') + '</div></div></div>'; } },
      { key: 'balance', label: AR('الرصيد', 'Balance'), align: 'end', cell: function (r) { return '<span class="num amt-strong">' + esc(fmt.money(r.balance)) + '</span>'; } },
      { key: 'limit', label: AR('حد الائتمان', 'Credit limit'), align: 'end', cell: function (r) { return r.limit ? '<span class="lim-cell"><span class="num faint">' + esc(fmt.money(r.limit)) + '</span>' + (r.over_limit ? ui.pill(AR('تجاوز', 'Over'), 'bad') : '') + '</span>' : '<span class="faint">—</span>'; } },
      { key: 'cur', label: AR('حتى ٣٠ يومًا', 'Up to 30 days'), align: 'end', cell: function (r) { return r.buckets.cur ? '<span class="num">' + esc(fmt.money(r.buckets.cur)) + '</span>' : '<span class="faint">—</span>'; } },
      { key: 'od', label: AR('أكثر من ٣٠ يومًا', 'Over 30 days'), align: 'end', cell: function (r) { return r.overdue ? '<span class="num amt-out">' + esc(fmt.money(r.overdue)) + '</span>' : '<span class="faint">—</span>'; } },
      { key: 'last', label: AR('آخر حركة', 'Last activity'), align: 'end', cell: function (r) { return r.last ? '<span class="num faint">' + esc(fmt.date(r.last)) + '</span>' : '<span class="faint">—</span>'; } }
    ];
    return head(AR('العملاء', 'Customers'), AR('العملاء والمديونيات', 'Customers and receivables'), AR('الرصيد المستحق على كل عميل وأعمار الديون. التحصيل يدخل خزينة ويظهر في الكشف.', 'What each customer owes, by age. A collection goes into a treasury and shows on the statement.')) +
      '<div class="kpis">' +
      ui.kpi({ label: AR('إجمالي المستحق', 'Total receivable'), value: fmt.money(tt.balance), cur: true, note: AR('على ' + fmt.num(tt.with_balance) + ' عميل', 'From ' + fmt.num(tt.with_balance) + ' customers') }) +
      ui.kpi({ label: AR('متأخر أكثر من ٣٠ يومًا', 'Over 30 days'), value: fmt.money(tt.overdue), cur: true, note: AR('يحتاج متابعة', 'Needs follow-up') }) +
      ui.kpi({ label: AR('تجاوزوا حد الائتمان', 'Over credit limit'), value: fmt.num(tt.over_limit), note: AR('عميل', 'customers') }) +
      ui.kpi({ label: AR('مطابقة الدفتر', 'Ledger check'), value: tt.ties_gl ? AR('مطابق', 'Ties') : AR('غير مطابق', 'Off'), note: AR('مجموع العملاء = حساب العملاء ', 'Sum of customers = receivables account ') + fmt.money(tt.gl_balance) }) + '</div>' +
      ui.card({ title: AR('أعمار الديون', 'Aging'), sub: AR('حسب عمر الفاتورة من تاريخها', 'By invoice age from its date'), body: agingBlock(tt.b) }) +
      '<section class="card"><div class="tab-pad">' + tabs + '</div>' +
      ui.table({ cols: cols, rows: d.rows, rowId: function (r) { return r.id; }, rowAct: 'r-open', empty: ui.empty({ title: t('app.empty'), hint: t('app.emptyHint'), icon: 'users' }) }) + '</section>';
  }

  var SEEN = {}; /* customers returned by the server (live mode); the demo list is only used in demo mode */
  function loadOne(ctx) { return U.api.call('erp_customer_get', { id: ctx.params.id }).then(function (d) { if (d && d.customer) SEEN[d.customer.id] = d.customer; return d; }); }
  function viewOne(ctx, d) {
    var c = d.customer, tip = c.over_limit ? ui.banner({ tone: 'warn', icon: 'alert', title: AR('تجاوز حد الائتمان', 'Over credit limit'), text: AR('الرصيد ' + fmt.money(c.balance) + ' ج.م والحد ' + fmt.money(c.limit) + ' ج.م.', 'Balance ' + fmt.money(c.balance) + ' EGP against a limit of ' + fmt.money(c.limit) + ' EGP.') }) : '';
    var back = '<button data-act="r-list">' + esc(AR('العملاء', 'Customers')) + '</button>';
    var cols = [
      { key: 'date', label: t('app.date'), cell: function (r) { return '<span class="num">' + esc(fmt.date(r.date)) + '</span>'; } },
      { key: 'doc', label: t('app.doc'), cell: function (r) { return '<div class="doc-no">' + esc(r.doc) + '</div><div class="id-s">' + esc(r.memo) + '</div>'; } },
      { key: 'debit', label: AR('مدين (فاتورة)', 'Debit (invoice)'), align: 'end', cell: function (r) { return r.debit ? ui.money(r.debit) : '<span class="faint">—</span>'; } },
      { key: 'credit', label: AR('دائن (تحصيل/مرتجع)', 'Credit (receipt/return)'), align: 'end', cell: function (r) { return r.credit ? '<span class="num amt-in">' + esc(fmt.money(r.credit)) + '</span>' : '<span class="faint">—</span>'; } },
      { key: 'balance', label: AR('الرصيد', 'Balance'), align: 'end', cell: function (r) { return '<span class="num amt-strong">' + esc(fmt.money(r.balance)) + '</span>'; } }
    ];
    return head(c.name, c.name, AR('رصيد ', 'Balance ') + fmt.money(c.balance) + ' ' + cur() + (c.phone ? ' · ' + c.phone : ''),
        ui.btn(AR('تحصيل دفعة', 'Collect payment'), { act: 'r-collect', kind: 'primary', icon: 'cash', data: { id: c.id } }), back) + tip +
      '<div class="kpis">' +
      ui.kpi({ label: AR('الرصيد المستحق', 'Balance due'), value: fmt.money(c.balance), cur: true }) +
      ui.kpi({ label: AR('إجمالي المبيعات', 'Total sales'), value: fmt.money(c.sales), cur: true }) +
      ui.kpi({ label: AR('إجمالي المحصّل', 'Collected'), value: fmt.money(c.paid), cur: true }) +
      ui.kpi({ label: AR('حد الائتمان', 'Credit limit'), value: c.limit ? fmt.money(c.limit) : '—', cur: !!c.limit, note: c.terms ? AR('مدة السداد ' + c.terms + ' يوم', 'Terms ' + c.terms + ' days') : (U.config.demo ? AR('بيع نقدي', 'Cash sale') : '') }) + '</div>' +
      ui.card({ title: AR('أعمار الدين', 'Aging'), body: agingBlock(d.aging) }) +
      ui.card({ title: AR('كشف الحساب', 'Statement'), sub: AR('الأحدث أولًا', 'Newest first'), flush: true,
        body: ui.table({ cols: cols, rows: d.statement, empty: ui.empty({ title: t('app.empty'), hint: t('app.emptyHint'), icon: 'doc' }) }) });
  }

  function collectSheet(ctx, id) {
    var root = document.querySelector('.uerp');
    if (root.querySelector('[data-ovl="vch"]')) return;
    var c = SEEN[id] || custById(id), body = '<div class="form-grid">' +
      '<div class="span2">' + ui.field({ label: AR('العميل', 'Customer'), type: 'text', id: 'r-cust', value: nm(c), disabled: true }) + '</div>' +
      '<div>' + ui.field({ label: AR('المبلغ', 'Amount'), type: 'number', id: 'r-amt', step: '0.01', min: '0', unit: cur() }) + '</div>' +
      '<div>' + ui.field({ label: AR('الخزينة', 'Treasury'), type: 'select', id: 'r-tr', options: U.state.meta.treasuries.map(function (x) { return { value: x.id, label: U.L(x) }; }) }) + '</div>' +
      '<div class="span2">' + ui.field({ label: t('app.notes'), type: 'textarea', id: 'r-note', rows: 2 }) + '</div></div><div id="v-err"></div>';
    root.insertAdjacentHTML('beforeend', ui.overlay({ id: 'vch', title: AR('تحصيل من عميل', 'Collect from customer'), sub: AR('يدخل الخزينة فورًا ويخفض رصيد العميل', 'Goes into the treasury now and lowers the balance'),
      body: body, foot: '<span class="grow"></span>' + ui.btn(t('app.cancel'), { act: 'a-close' }) + ui.btn(AR('تحصيل', 'Collect'), { act: 'r-submit', kind: 'primary', data: { id: id } }) }));
  }

  var A = {
    'r-tab': function (ctx, el) { ctx.filters.filter = el.getAttribute('data-id'); ctx.reload(); },
    'r-open': function (ctx, el) { U.go('accounting.customer', { id: el.getAttribute('data-id') }); },
    'r-list': function () { U.go('accounting.customers'); },
    'r-collect': function (ctx, el) { collectSheet(ctx, el.getAttribute('data-id')); },
    'a-close': function () { var o = document.querySelector('.uerp [data-ovl="vch"]'); if (o) o.remove(); },
    'close-sheet': function () { var o = document.querySelector('.uerp [data-ovl="vch"]'); if (o) o.remove(); },
    'r-submit': function (ctx, el) {
      var root = document.querySelector('.uerp'), q = function (s) { return root.querySelector(s); };
      U.api.call('erp_customer_receipt', { customer_id: el.getAttribute('data-id'), treasury_id: q('#r-tr').value, amount: q('#r-amt').value, note: q('#r-note').value, client_ref: U.util.uid('ref') })
        .then(function () { var o = q('[data-ovl="vch"]'); if (o) o.remove(); ui.toast(AR('تم التحصيل', 'Collected'), 'ok'); ctx.reload(); })
        .catch(function (e) { q('#v-err').innerHTML = ui.banner({ tone: 'bad', icon: 'alert', title: AR('لم يُسجَّل', 'Refused'), text: e.message }); });
    }
  };

  U.registerModule({
    id: 'receivables', group: 'accounting',
    nav: [{ group: 'accounting', screen: 'accounting.customers', label: { ar: 'العملاء والمديونيات', en: 'Customers' }, icon: 'users', order: 15 }],
    screens: [
      { id: 'accounting.customers', title: { ar: 'العملاء والمديونيات', en: 'Customers' }, load: loadList, view: viewList, actions: A, after: bindAging },
      { id: 'accounting.customer', title: { ar: 'ملف العميل', en: 'Customer file' }, load: loadOne, view: viewOne, actions: A, after: bindAging }
    ]
  });
})();
