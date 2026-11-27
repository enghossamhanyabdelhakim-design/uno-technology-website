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
        party: sp.ar, party_ar: sp.ar, party_en: sp.en, note: '' });
    });
    var rc = [['t1', -2, 18500, 'عميل — مبيعات نقدية', 'Cash sales'], ['t1', -5, 9200, 'عميل — مبيعات نقدية', 'Cash sales'], ['t2', -7, 64000, 'تحصيل عميل آجل', 'Customer collection'],
      ['t3', -3, 7600, 'مبيعات الفرع', 'Branch sales'], ['t2', -11, 41250, 'تحصيل عميل آجل', 'Customer collection']];
    rc.forEach(function (r) {
      moves.push({ id: 'tm' + (++n), no: 'RCV-2026-0' + String(n).padStart(2, '0'), date: U.util.addDays(U.util.todayISO(), r[1]), treasury_id: r[0], kind: 'receipt',
        amount: r[2], party: r[3], party_ar: r[3], party_en: r[4], note: '' });
    });
    [['EXP-2026-007', -4, 't1', 2300, 0, 'rent', 'إيجار المحل', 'Shop rent'], ['EXP-2026-008', -9, 't2', 28000, 0, 'salaries', 'رواتب الفريق', 'Team salaries'],
      ['EXP-2026-009', -12, 't1', 1850, 14, 'utilities', 'كهرباء وإنترنت', 'Electricity and internet'], ['EXP-2026-010', -15, 't1', 960, 0, 'transport', 'نقل وتوصيل', 'Delivery and transport']].forEach(function (e) {
      var vat = U.util.round(e[3] * e[4] / 100, 2);
      moves.push({ id: 'tm' + (++n), no: e[0], date: U.util.addDays(U.util.todayISO(), e[1]), treasury_id: e[2], kind: 'expense', amount: -U.util.round(e[3] + vat, 2),
        net: e[3], vat: vat, category: e[5], party: e[6], party_ar: e[6], party_en: e[7], note: '' });
    });
    moves.push({ id: 'tm' + (++n), no: 'TRF-2026-001', date: U.util.addDays(U.util.todayISO(), -6), treasury_id: 't1', kind: 'transfer_out', amount: -30000, party: treasuries()[1].ar, party_ar: treasuries()[1].ar, party_en: treasuries()[1].en, note: '' });
    moves.push({ id: 'tm' + (++n), no: 'TRF-2026-001', date: U.util.addDays(U.util.todayISO(), -6), treasury_id: 't2', kind: 'transfer_in', amount: 30000, party: treasuries()[0].ar, party_ar: treasuries()[0].ar, party_en: treasuries()[0].en, note: '' });
    var tr = treasuries(), open = {};
    tr.forEach(function (x) { open[x.id] = U.util.round(x.balance - moves.filter(function (m) { return m.treasury_id === x.id; }).reduce(function (s, m) { return s + m.amount; }, 0), 2); });
    M = { moves: moves, open: open, refs: {} };
    return M;
  }
  function withBalance(rows, id) {
    var m = seed(), run = m.open[id];
    return rows.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }).map(function (r) { run = U.util.round(run + r.amount, 2); return Object.assign({}, r, { balance_after: run, party: (U.state.lang === 'en' && r.party_en) ? r.party_en : (r.party_ar || r.party) }); });
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
        M.moves.push({ id: U.util.uid('tm'), no: p.no || 'PMT', date: p.date, treasury_id: p.treasury_id, kind: 'payment', amount: -p.amount, party: sp.ar, party_ar: sp.ar, party_en: sp.en, note: '' });
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
    var mv = { party_ar: a.party, party_en: a.party, id: U.util.uid('tm'), no: (a.type === 'payment' ? 'PAY-2026-' : 'RCV-2026-') + String(m.moves.length + 1).padStart(3, '0'), date: a.date || U.util.todayISO(),
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
    m.moves.push({ id: U.util.uid('tm'), no: no, date: d, treasury_id: f.id, kind: 'transfer_out', amount: -amt, party: to.ar, party_ar: to.ar, party_en: to.en, note: a.note || '' });
    m.moves.push({ id: U.util.uid('tm'), no: no, date: d, treasury_id: to.id, kind: 'transfer_in', amount: amt, party: f.ar, party_ar: f.ar, party_en: f.en, note: a.note || '' });
    var res = { ok: true, no: no };
    if (a.client_ref) m.refs[a.client_ref] = res;
    return res;
  };

  /* ------------------------------------------------------------------ *
   * general ledger (demo): derived on every call from the stock ledger,
   * purchase invoices and treasury movements, so it always reconciles.
   * ------------------------------------------------------------------ */
  var CHART = [
    ['1010', 'خزينة فرشوط', 'Farshout treasury', 'asset'], ['1011', 'خزينة قنا', 'Qena treasury', 'asset'], ['1020', 'بنك مصر — جاري', 'Banque Misr — current', 'asset'],
    ['1100', 'العملاء', 'Accounts receivable', 'asset'], ['1200', 'المخزون', 'Inventory', 'asset'], ['1250', 'بضاعة بانتظار الفاتورة', 'Goods pending invoice', 'asset'],
    ['1300', 'ضريبة مدخلات', 'VAT input', 'asset'], ['2010', 'الموردون', 'Accounts payable', 'liability'], ['2100', 'ضريبة مخرجات', 'VAT output', 'liability'],
    ['3000', 'رأس المال والافتتاحي', 'Capital and opening', 'equity'], ['4000', 'المبيعات', 'Sales', 'income'], ['5000', 'تكلفة البضاعة المباعة', 'Cost of goods sold', 'cogs'],
    ['5200', 'تسويات المخزون', 'Stock adjustments', 'expense'], ['6100', 'إيجار', 'Rent', 'expense'], ['6200', 'رواتب', 'Salaries', 'expense'],
    ['6300', 'كهرباء وإنترنت', 'Utilities', 'expense'], ['6400', 'نقل وتوصيل', 'Transport', 'expense'], ['6900', 'مصروفات أخرى', 'Other expenses', 'expense']
  ];
  var CATS = { rent: '6100', salaries: '6200', utilities: '6300', transport: '6400', other: '6900' };
  var TACC = { t1: '1010', t3: '1011', t2: '1020' };
  var NAMES = {};
  function acctInfo(code) { if (NAMES[code]) return { code: code, ar: NAMES[code].ar, en: NAMES[code].en, type: 'asset' }; var r = CHART.filter(function (c) { return c[0] === code; })[0] || [code, code, code, 'asset']; return { code: code, ar: r[1], en: r[2], type: r[3] }; }
  function aName(code) { var a = acctInfo(code); return U.state.lang === 'ar' ? a.ar : a.en; }
  var R2 = function (v) { return U.util.round(v, 2); };

  function journal() {
    var m = seed(), db = U.demo.db(), out = [], n = 0, prod = {};
    db.products.forEach(function (p) { prod[p.id] = p; });
    function je(date, src, doc, memo_ar, memo_en, lines) {
      lines = lines.filter(function (l) { return Math.abs(l[1]) > 0.004 || Math.abs(l[2]) > 0.004; });
      if (!lines.length) return;
      out.push({ id: 'je' + (++n), date: date, source: src, doc: doc, memo_ar: memo_ar, memo_en: memo_en,
        lines: lines.map(function (l) { return { acct: l[0], dr: R2(l[1]), cr: R2(l[2]) }; }) });
    }
    var first = U.util.addDays(U.util.todayISO(), -46);
    treasuries().forEach(function (x) { je(first, 'opening', 'OPN-' + x.id.toUpperCase(), 'رصيد افتتاحي — ' + x.ar, 'Opening balance — ' + x.en, [[TACC[x.id], m.open[x.id], 0], ['3000', 0, m.open[x.id]]]); });
    db.movements.forEach(function (mv) {
      var v = Number(mv.value || 0), st = mv.source_type, p = prod[mv.product_id] || {};
      if (st === 'opening') je(mv.date, 'opening', mv.doc, 'مخزون افتتاحي', 'Opening stock', [['1200', v, 0], ['3000', 0, v]]);
      else if (st === 'purchase') je(mv.date, 'stock', mv.doc, 'استلام بضاعة', 'Goods received', [['1200', v, 0], ['1250', 0, v]]);
      else if (st === 'purchase_return') je(mv.date, 'stock', mv.doc, 'مرتجع شراء', 'Purchase return', [['1250', v, 0], ['1200', 0, v]]);
      else if (st === 'sale' || st === 'sale_return') {
        var q = Math.abs(Number(mv.qty)), rev = R2(q * Number(p.price || 0)), vat = R2(rev * Number(p.vat || 14) / 100), sgn = st === 'sale' ? 1 : -1;
        if (sgn > 0) je(mv.date, 'sales', mv.doc, 'بيع', 'Sale', [['1100', rev + vat, 0], ['4000', 0, rev], ['2100', 0, vat], ['5000', v, 0], ['1200', 0, v]]);
        else je(mv.date, 'sales', mv.doc, 'مرتجع بيع', 'Sales return', [['4000', rev, 0], ['2100', vat, 0], ['1100', 0, rev + vat], ['1200', v, 0], ['5000', 0, v]]);
      } else if (st === 'count_adjust' || st === 'waste' || st === 'adjustment') {
        var sg = Number(mv.qty) >= 0 ? 1 : -1;
        je(mv.date, 'stock', mv.doc, st === 'waste' ? 'هالك' : 'تسوية جرد', st === 'waste' ? 'Write-off' : 'Count adjustment', sg > 0 ? [['1200', v, 0], ['5200', 0, v]] : [['5200', v, 0], ['1200', 0, v]]);
      }
    });
    db.invoices.filter(function (i) { return i.status !== 'draft' && i.status !== 'cancelled'; }).forEach(function (i) {
      var net = U.demo.invoiceTotal(i), vat = U.demo.invoiceVat(i);
      je(i.date, 'purchase', i.no, 'فاتورة مورد', 'Supplier invoice', [['1250', net, 0], ['1300', vat, 0], ['2010', 0, R2(net + vat)]]);
    });
    m.moves.forEach(function (r) {
      var a = Math.abs(r.amount), tacc = TACC[r.treasury_id], who = r.party_ar || r.party, whoE = r.party_en || r.party;
      if (r.kind === 'receipt') je(r.date, 'treasury', r.no, 'تحصيل — ' + who, 'Collection — ' + whoE, [[tacc, a, 0], ['1100', 0, a]]);
      else if (r.kind === 'payment') je(r.date, 'treasury', r.no, 'دفع — ' + who, 'Payment — ' + whoE, [['2010', a, 0], [tacc, 0, a]]);
      else if (r.kind === 'expense') je(r.date, 'expense', r.no, who, whoE, [[CATS[r.category] || '6900', r.net || a, 0], ['1300', r.vat || 0, 0], [tacc, 0, a]]);
      else if (r.kind === 'transfer_out') {
        var other = m.moves.filter(function (x) { return x.no === r.no && x.kind === 'transfer_in'; })[0];
        if (other) je(r.date, 'treasury', r.no, 'تحويل بين الخزائن', 'Treasury transfer', [[TACC[other.treasury_id], a, 0], [tacc, 0, a]]);
      }
    });
    out.sort(function (x, y) { return x.date < y.date ? -1 : x.date > y.date ? 1 : 0; });
    out.forEach(function (e, i) { e.no = 'JE-' + String(i + 1).padStart(4, '0'); });
    return out;
  }
  function range(id) {
    var today = U.util.todayISO();
    if (id === 'all') return { from: '0000-01-01', to: today };
    if (id === '30d') return { from: U.util.addDays(today, -29), to: today };
    return { from: today.slice(0, 8) + '01', to: today };
  }
  function bal(entries, upto) {
    var b = {};
    entries.forEach(function (e) { if (upto && e.date > upto) return; e.lines.forEach(function (l) { var x = b[l.acct] || (b[l.acct] = { dr: 0, cr: 0 }); x.dr += l.dr; x.cr += l.cr; }); });
    return b;
  }
  function inRange(entries, rg) { return entries.filter(function (e) { return e.date >= rg.from && e.date <= rg.to; }); }

  H.erp_journal_list = function (a) {
    var rg = range(a.range || 'all'), rows = inRange(journal(), rg);
    if (a.source && a.source !== 'all') rows = rows.filter(function (e) { return e.source === a.source; });
    if (a.q) { var q = String(a.q).toLowerCase(); rows = rows.filter(function (e) { return (e.no + ' ' + e.doc + ' ' + e.memo_ar + ' ' + e.memo_en).toLowerCase().indexOf(q) >= 0; }); }
    rows = rows.map(function (e) { return Object.assign({}, e, { total: R2(e.lines.reduce(function (s, l) { return s + l.dr; }, 0)) }); }).reverse();
    return { rows: rows, count: rows.length };
  };
  H.erp_trial_balance = function (a) {
    var up = a.as_of || U.util.todayISO(), b = bal(journal(), up), rows = [], td = 0, tc = 0;
    CHART.forEach(function (c) {
      var x = b[c[0]]; if (!x) return;
      var net = R2(x.dr - x.cr), dr = net > 0 ? net : 0, cr = net < 0 ? -net : 0;
      rows.push({ code: c[0], ar: c[1], en: c[2], type: c[3], dr: dr, cr: cr }); td += dr; tc += cr;
    });
    var tr = {}; treasuries().forEach(function (x) { tr[x.id] = x.balance; });
    var tie = treasuries().every(function (x) { var r = rows.filter(function (q) { return q.code === TACC[x.id]; })[0]; return r && Math.abs(r.dr - r.cr - x.balance) < 0.01; });
    var inv = rows.filter(function (q) { return q.code === '1200'; })[0], stock = R2(U.util.sum(U.demo.db().movements, function (m2) { return Number(m2.qty) * 0 + (Number(m2.qty) >= 0 ? 1 : -1) * Number(m2.value || 0); }));
    var invOk = !!inv && Math.abs((inv.dr - inv.cr) - stock) < 0.05;
    return { as_of: up, rows: rows, total_dr: R2(td), total_cr: R2(tc), balanced: Math.abs(td - tc) < 0.01, ties_treasuries: tie, ties_inventory: invOk, stock_value: stock };
  };
  H.erp_pnl = function (a) {
    var rg = range(a.range || 'month'), b = bal(inRange(journal(), rg)), rows = [];
    function net(code, sign) { var x = b[code]; return x ? R2(sign * (x.dr - x.cr)) : 0; }
    var sales = net('4000', -1), cogs = net('5000', 1), exp = CHART.filter(function (c) { return c[3] === 'expense'; }).map(function (c) { return { code: c[0], ar: c[1], en: c[2], amount: net(c[0], 1) }; }).filter(function (r) { return Math.abs(r.amount) > 0.004; });
    var totalExp = R2(exp.reduce(function (s, r) { return s + r.amount; }, 0)), gross = R2(sales - cogs);
    return { range: a.range || 'month', from: rg.from, to: rg.to, basis: 'accrual', currency: 'EGP', sales: sales, cogs: cogs, gross: gross, gross_pct: sales ? R2(gross / sales * 100) : 0,
      expenses: exp, total_expenses: totalExp, net: R2(gross - totalExp), net_pct: sales ? R2((gross - totalExp) / sales * 100) : 0 };
  };
  H.erp_vat_report = function (a) {
    var rg = range(a.range || 'month'), b = bal(inRange(journal(), rg)), out = b['2100'] ? R2(b['2100'].cr - b['2100'].dr) : 0, inn = b['1300'] ? R2(b['1300'].dr - b['1300'].cr) : 0;
    var base = b['4000'] ? R2(b['4000'].cr - b['4000'].dr) : 0;
    return { from: rg.from, to: rg.to, range: a.range || 'month', sales_base: base, output: out, input: inn, net: R2(out - inn) };
  };
  H.erp_expense_list = function (a) {
    var rg = range(a.range || 'all'), rows = seed().moves.filter(function (r) { return r.kind === 'expense' && r.date >= rg.from && r.date <= rg.to; });
    if (a.category && a.category !== 'all') rows = rows.filter(function (r) { return r.category === a.category; });
    rows = rows.map(function (r) { return Object.assign({}, r, { party: (U.state.lang === 'en' && r.party_en) ? r.party_en : (r.party_ar || r.party) }); }).sort(function (x, y) { return x.date < y.date ? 1 : -1; });
    var by = {}; rows.forEach(function (r) { by[r.category] = R2((by[r.category] || 0) + (r.net || -r.amount)); });
    return { rows: rows, by_category: by, total_net: R2(rows.reduce(function (s, r) { return s + (r.net || -r.amount); }, 0)), total_vat: R2(rows.reduce(function (s, r) { return s + (r.vat || 0); }, 0)),
      total_paid: R2(rows.reduce(function (s, r) { return s - r.amount; }, 0)) };
  };
  H.erp_expense_create = function (a) {
    var m = seed(), tr = balanceOf(a.treasury_id), net = Number(a.amount), cat = CATS[a.category] ? a.category : null;
    if (a.client_ref && m.refs[a.client_ref]) return m.refs[a.client_ref];
    if (!tr) guard('اختر الخزينة.', 'TREASURY');
    if (!cat) guard('اختر بند المصروف.', 'CATEGORY');
    if (!(net > 0)) guard('أدخل مبلغًا أكبر من صفر.', 'AMOUNT');
    if (!a.payee) guard('اكتب البيان أو اسم المستلم.', 'PAYEE');
    var vat = a.with_vat ? R2(net * 0.14) : 0, total = R2(net + vat);
    if (total > tr.balance) guard('رصيد ' + tr.ar + ' ' + fmt.money(tr.balance) + ' ج.م فقط — المطلوب ' + fmt.money(total) + ' ج.م.', 'INSUFFICIENT');
    tr.balance = R2(tr.balance - total);
    var mv = { id: U.util.uid('tm'), no: 'EXP-2026-' + String(m.moves.length + 1).padStart(3, '0'), date: a.date || U.util.todayISO(), treasury_id: tr.id, kind: 'expense', amount: -total,
      net: net, vat: vat, category: cat, party: a.payee, party_ar: a.payee, party_en: a.payee, note: a.note || '' };
    m.moves.push(mv);
    var res = { ok: true, expense: mv, balance: tr.balance };
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
  function tName(id) { var x = U.state.meta.treasuries.filter(function (r) { return r.id === id; })[0]; return x ? L(x) : (id || '—'); }

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
      ui.kpi({ label: AR('بنوك', 'Banks'), value: fmt.money(s.totals.bank), cur: true, note: fmt.num(s.rows.filter(function (r) { return r.kind === 'bank'; }).length) + ' ' + AR('حساب', s.rows.filter(function (r) { return r.kind === 'bank'; }).length === 1 ? 'account' : 'accounts') }) +
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

  /* ------------------------------------------------------------------ *
   * more screens: expenses, journal, trial balance, P&L, VAT
   * ------------------------------------------------------------------ */
  function head(crumb, title, sub, actions) {
    return '<div class="page-head"><div class="ph-txt"><div class="crumbs"><span>' + esc(AR('الرئيسية', 'Home')) + '</span>' + icon('chevStart', 12) +
      '<span>' + esc(AR('المالية', 'Accounting')) + '</span>' + icon('chevStart', 12) + '<span>' + esc(crumb) + '</span></div>' +
      '<h1 class="page-title">' + esc(title) + '</h1><p class="page-sub">' + esc(sub) + '</p></div>' +
      (actions ? '<div class="page-actions">' + actions + '</div>' : '') + '</div>';
  }
  function rangeSeg(f, act) {
    return ui.segmented([{ id: 'month', label: t('app.month') }, { id: '30d', label: AR('٣٠ يومًا', '30 days') }, { id: 'all', label: AR('الكل', 'All time') }], f.range, act);
  }
  function rangeText(from, to) { return (from < '2000' ? AR('من البداية', 'From the start') : fmt.date(from)) + ' → ' + fmt.date(to); }
  function acctCell(code) { return '<span class="doc-no">' + esc(code) + '</span> <span class="acct-n">' + esc(aName(code)) + '</span>'; }
  var CAT_L = { rent: ['إيجار', 'Rent'], salaries: ['رواتب', 'Salaries'], utilities: ['كهرباء وإنترنت', 'Utilities'], transport: ['نقل وتوصيل', 'Transport'], other: ['أخرى', 'Other'] };
  function catName(c) { return U.state.lang === 'ar' ? CAT_L[c][0] : CAT_L[c][1]; }
  var SRC = { opening: ['افتتاحي', 'Opening', 'neutral'], stock: ['مخزون', 'Stock', 'info'], sales: ['مبيعات', 'Sales', 'ok'], purchase: ['مشتريات', 'Purchases', 'warn'], treasury: ['خزينة', 'Treasury', 'info'], manual: ['يدوي', 'Manual', 'neutral'], expense: ['مصروف', 'Expense', 'warn'] };
  function srcName(k) { if (!SRC[k]) return k; return U.state.lang === 'ar' ? SRC[k][0] : SRC[k][1]; }

  /* expenses */
  function loadExp(ctx) { var f = ctx.filters; f.range = f.range || 'all'; f.category = f.category || 'all'; return U.api.call('erp_expense_list', { range: f.range, category: f.category }); }
  function viewExp(ctx, d) {
    var f = ctx.filters, cats = Object.keys(CAT_L);
    var top = Object.keys(d.by_category).sort(function (a, b) { return d.by_category[b] - d.by_category[a]; })[0];
    var tabs = ui.tabs([{ id: 'all', label: t('app.all') }].concat(cats.map(function (c) { return { id: c, label: catName(c) }; })), f.category, 'x-cat');
    var cols = [
      { key: 'no', label: t('app.doc'), cell: function (r) { return '<div class="doc-no">' + esc(r.no) + '</div><div class="id-s">' + esc(catName(r.category)) + '</div>'; } },
      { key: 'date', label: t('app.date'), cell: function (r) { return '<span class="num">' + esc(fmt.date(r.date)) + '</span>'; } },
      { key: 'party', label: AR('البيان', 'Description'), cell: function (r) { return esc(r.party); } },
      { key: 'tr', label: AR('الخزينة', 'Treasury'), cell: function (r) { return '<span class="faint">' + esc(tName(r.treasury_id)) + '</span>'; } },
      { key: 'net', label: AR('الصافي', 'Net'), align: 'end', cell: function (r) { return '<span class="num">' + esc(fmt.money(r.net || -r.amount)) + '</span>'; } },
      { key: 'vat', label: AR('الضريبة', 'VAT'), align: 'end', cell: function (r) { return r.vat ? '<span class="num">' + esc(fmt.money(r.vat)) + '</span>' : '<span class="faint">—</span>'; } },
      { key: 'paid', label: AR('المدفوع', 'Paid'), align: 'end', cell: function (r) { return '<span class="num amt-out">' + esc(fmt.money(-r.amount)) + '</span>'; } }
    ];
    return head(AR('المصروفات', 'Expenses'), AR('المصروفات', 'Expenses'), AR('كل مصروف يخرج من خزينة ويُسجَّل على بند. المصروف لا يُحذف.', 'Every expense leaves a treasury and is posted to a category. Expenses are never deleted.'),
        ui.btn(AR('مصروف جديد', 'New expense'), { act: 'x-new', kind: 'primary', icon: 'plus' })) +
      '<div class="kpis">' +
      ui.kpi({ label: AR('إجمالي المصروفات', 'Total expenses'), value: fmt.money(d.total_net), cur: true, note: AR('قبل الضريبة', 'Before VAT') }) +
      ui.kpi({ label: AR('ضريبة مدخلات', 'Input VAT'), value: fmt.money(d.total_vat), cur: true, note: AR('قابلة للخصم', 'Recoverable') }) +
      ui.kpi({ label: AR('المدفوع من الخزائن', 'Paid from treasuries'), value: fmt.money(d.total_paid), cur: true, note: AR('الصافي + الضريبة', 'Net plus VAT') }) +
      ui.kpi({ label: AR('أكبر بند', 'Largest category'), value: top ? catName(top) : '—', note: top ? fmt.money(d.by_category[top]) + ' ' + cur() : '' }) + '</div>' +
      '<section class="card"><div class="tab-pad">' + tabs + '</div><div class="toolbar">' + rangeSeg(f, 'x-range') + '</div>' +
      ui.table({ cols: cols, rows: d.rows, rowId: function (r) { return r.id; }, empty: ui.empty({ title: t('app.empty'), hint: t('app.emptyHint'), icon: 'wallet' }) }) +
      ui.totalsStrip([{ label: AR('عدد', 'Count'), value: fmt.num(d.rows.length) }, { label: AR('الصافي', 'Net'), value: fmt.money(d.total_net) }, { label: AR('المدفوع', 'Paid'), value: fmt.money(d.total_paid) }], AR('الأرقام بالجنيه المصري', 'Amounts in EGP')) + '</section>';
  }
  function expSheet() {
    var root = document.querySelector('.uerp');
    if (root.querySelector('[data-ovl="vch"]')) return;
    var body = '<div class="form-grid">' +
      '<div class="span2">' + ui.field({ label: AR('البند', 'Category'), type: 'select', id: 'x-cat', options: Object.keys(CAT_L).map(function (c) { return { value: c, label: catName(c) }; }) }) + '</div>' +
      '<div class="span2">' + ui.field({ label: AR('البيان / المستلم', 'Description / payee'), type: 'text', id: 'x-payee' }) + '</div>' +
      '<div>' + ui.field({ label: AR('المبلغ قبل الضريبة', 'Amount before VAT'), type: 'number', id: 'x-amt', step: '0.01', min: '0', unit: cur() }) + '</div>' +
      '<div>' + ui.field({ label: AR('الخزينة', 'Treasury'), type: 'select', id: 'x-tr', options: U.state.meta.treasuries.map(function (x) { return { value: x.id, label: L(x) }; }) }) + '</div>' +
      '<div class="span2">' + ui.field({ type: 'switch', label: AR('الضريبة', 'VAT'), id: 'x-vat', switchLabel: AR('يوجد فاتورة ضريبية — أضف ١٤٪ ضريبة مدخلات', 'Has a tax invoice: add 14% input VAT') }) + '</div>' +
      '<div class="span2">' + ui.field({ label: t('app.notes'), type: 'textarea', id: 'x-note', rows: 2 }) + '</div></div><div id="v-err"></div>';
    root.insertAdjacentHTML('beforeend', ui.overlay({ id: 'vch', title: AR('مصروف جديد', 'New expense'), sub: AR('يُسجَّل فورًا ويخصم من الخزينة', 'Posted immediately and deducted from the treasury'), body: body,
      foot: '<span class="grow"></span>' + ui.btn(t('app.cancel'), { act: 'a-close' }) + ui.btn(AR('تسجيل', 'Post'), { act: 'x-submit', kind: 'primary' }) }));
  }

  /* journal */
  var lastJ = [];
  function loadJ(ctx) { var f = ctx.filters; f.range = f.range || 'all'; f.source = f.source || 'all'; return U.api.call('erp_journal_list', { range: f.range, source: f.source, q: f.q || '' }).then(function (d) { (d.rows || []).forEach(function (e) { (e.lines || []).forEach(function (l) { if (l.ar) NAMES[l.acct] = { ar: l.ar, en: l.en || l.ar }; }); }); return d; }); }
  function viewJ(ctx, d) {
    var f = ctx.filters; lastJ = d.rows;
    var tabs = ui.tabs([{ id: 'all', label: t('app.all') }].concat(Object.keys(SRC).map(function (k) { return { id: k, label: srcName(k) }; })), f.source, 'j-src');
    var cols = [
      { key: 'no', label: AR('القيد', 'Entry'), cell: function (r) { return '<div class="doc-no">' + esc(r.no) + '</div><div class="id-s">' + ui.pill(srcName(r.source), SRC[r.source][2]) + '</div>'; } },
      { key: 'date', label: t('app.date'), cell: function (r) { return '<span class="num">' + esc(fmt.date(r.date)) + '</span>'; } },
      { key: 'doc', label: t('app.doc'), cell: function (r) { return '<span class="num faint">' + esc(r.doc) + '</span>'; } },
      { key: 'memo', label: AR('البيان', 'Memo'), cell: function (r) { return esc(U.state.lang === 'ar' ? r.memo_ar : r.memo_en); } },
      { key: 'total', label: AR('المبلغ', 'Amount'), align: 'end', cell: function (r) { return '<span class="num">' + esc(fmt.money(r.total)) + '</span>'; } }
    ];
    return head(AR('دفتر اليومية', 'Journal'), AR('دفتر اليومية', 'Journal'), AR('قيود مولّدة آليًا من المبيعات والمشتريات والخزائن والمخزون. كل قيد مدينه يساوي دائنه.', 'Entries are generated automatically from sales, purchases, treasuries and stock. Every entry balances: debit equals credit.')) +
      '<section class="card"><div class="tab-pad">' + tabs + '</div><div class="toolbar"><div class="search-inline">' + icon('search', 16) +
      '<input data-act="search" data-filter="q" value="' + esc(f.q || '') + '" placeholder="' + esc(AR('رقم القيد أو المستند…', 'Entry or document no.…')) + '"></div>' + rangeSeg(f, 'j-range') + '</div>' +
      ui.table({ cols: cols, rows: d.rows.slice(0, 60), rowId: function (r) { return r.id; }, rowAct: 'j-open', empty: ui.empty({ title: t('app.empty'), hint: t('app.emptyHint'), icon: 'doc' }) }) +
      ui.totalsStrip([{ label: AR('قيود', 'Entries'), value: fmt.num(d.count) }, { label: AR('المعروض', 'Shown'), value: fmt.num(Math.min(60, d.count)) }], AR('كل قيد متوازن: المدين = الدائن', 'Every entry balances: debit equals credit')) + '</section>';
  }
  function jSheet(id) {
    var e = lastJ.filter(function (r) { return r.id === id; })[0], root = document.querySelector('.uerp');
    if (!e || root.querySelector('[data-ovl="vch"]')) return;
    var cols = [{ key: 'a', label: AR('الحساب', 'Account'), cell: function (l) { return acctCell(l.acct); } },
      { key: 'dr', label: AR('مدين', 'Debit'), align: 'end', cell: function (l) { return l.dr ? '<span class="num">' + esc(fmt.money(l.dr)) + '</span>' : '<span class="faint">—</span>'; } },
      { key: 'cr', label: AR('دائن', 'Credit'), align: 'end', cell: function (l) { return l.cr ? '<span class="num">' + esc(fmt.money(l.cr)) + '</span>' : '<span class="faint">—</span>'; } }];
    var dr = e.lines.reduce(function (s, l) { return s + l.dr; }, 0), cr = e.lines.reduce(function (s, l) { return s + l.cr; }, 0);
    root.insertAdjacentHTML('beforeend', ui.overlay({ id: 'vch', title: e.no + ' · ' + e.doc, sub: fmt.date(e.date) + ' · ' + (U.state.lang === 'ar' ? e.memo_ar : e.memo_en),
      body: ui.table({ cols: cols, rows: e.lines, foot: { a: '', dr: '<b class="num">' + esc(fmt.money(dr)) + '</b>', cr: '<b class="num">' + esc(fmt.money(cr)) + '</b>' }, footLabel: t('app.total') }),
      foot: '<span class="grow"></span>' + ui.btn(t('app.close'), { act: 'a-close' }) }));
  }

  /* trial balance */
  function loadTB(ctx) { return U.api.call('erp_trial_balance', { as_of: ctx.filters.as_of || '' }).then(function (d) { (d.rows || []).forEach(function (r) { if (r.ar) NAMES[r.code] = { ar: r.ar, en: r.en || r.ar }; }); return d; }); }
  function viewTB(ctx, d) {
    var cols = [
      { key: 'c', label: AR('الحساب', 'Account'), cell: function (r) { return acctCell(r.code); } },
      { key: 'ty', label: AR('النوع', 'Type'), cell: function (r) { return '<span class="faint">' + esc(({ asset: AR('أصول', 'Asset'), liability: AR('التزامات', 'Liability'), equity: AR('حقوق ملكية', 'Equity'), income: AR('إيرادات', 'Income'), cogs: AR('تكلفة', 'Cost'), expense: AR('مصروفات', 'Expense') })[r.type]) + '</span>'; } },
      { key: 'dr', label: AR('مدين', 'Debit'), align: 'end', cell: function (r) { return r.dr ? '<span class="num">' + esc(fmt.money(r.dr)) + '</span>' : '<span class="faint">—</span>'; } },
      { key: 'cr', label: AR('دائن', 'Credit'), align: 'end', cell: function (r) { return r.cr ? '<span class="num">' + esc(fmt.money(r.cr)) + '</span>' : '<span class="faint">—</span>'; } }
    ];
    var checks = [
      [d.balanced, AR('إجمالي المدين يساوي إجمالي الدائن', 'Total debit equals total credit')],
      [d.ties_treasuries, AR('أرصدة الخزائن في الميزان = أرصدة شاشة الخزائن', 'Treasury accounts equal the Treasuries screen')],
      [d.ties_inventory, AR('حساب المخزون = قيمة المخزون في الحركات', 'Inventory account equals stock-ledger value') + ' (' + fmt.money(d.stock_value) + ')']
    ];
    return head(AR('ميزان المراجعة', 'Trial balance'), AR('ميزان المراجعة', 'Trial balance'), AR('أرصدة كل الحسابات حتى تاريخ محدد.' + (U.config.demo ? ' بيانات تجريبية.' : ''), 'Every account balance up to a date.' + (U.config.demo ? ' Demo data.' : '')),
        '<input type="date" class="select num" data-filter="as_of" value="' + esc(ctx.filters.as_of || d.as_of) + '">') +
      (d.entries === 0 ? [[true, AR('الدفاتر فارغة: الترحيل التلقائي غير مفعّل بعد، فلا توجد قيود للعرض. الفحوصات تظهر بعد أول قيد.', 'The books are empty: automatic posting is not switched on yet, so there are no entries. Checks appear after the first entry.')]] : checks).map(function (c) { return ui.banner({ tone: d.entries === 0 ? 'info' : (c[0] ? 'ok' : 'bad'), icon: d.entries === 0 ? 'info' : (c[0] ? 'check' : 'alert'), text: c[1] }); }).join('') +
      '<section class="card">' + (!d.rows.length ? '<div class="tbl-wrap">' + ui.empty({ title: t('app.empty'), hint: t('app.emptyHint'), icon: 'doc' }) + '</div>' : ui.table({ cols: cols, rows: d.rows, rowId: function (r) { return r.code; }, foot: { dr: '<b class="num">' + esc(fmt.money(d.total_dr)) + '</b>', cr: '<b class="num">' + esc(fmt.money(d.total_cr)) + '</b>' }, footLabel: t('app.total') })) +
      ui.totalsStrip([{ label: AR('بتاريخ', 'As of'), value: fmt.date(d.as_of) }, { label: AR('الحسابات', 'Accounts'), value: fmt.num(d.rows.length) }], AR('الأرقام بالجنيه المصري', 'Amounts in EGP')) + '</section>';
  }

  /* profit and loss */
  function loadPL(ctx) { var f = ctx.filters; f.range = f.range || 'month'; return U.api.call('erp_pnl', { range: f.range }); }
  function viewPL(ctx, d) {
    function line(label, v, cls) { return '<div class="kv' + (cls ? ' ' + cls : '') + '"><span class="k">' + esc(label) + '</span><span class="v num">' + esc(fmt.money(v)) + '</span></div>'; }
    var meta = '<div class="meta-strip"><span><b>' + esc(AR('الفترة', 'Period')) + '</b> ' + esc(rangeText(d.from, d.to)) + '</span><span><b>' + esc(AR('الأساس', 'Basis')) + '</b> ' + esc(AR('استحقاق (حسب تاريخ القيد)', 'Accrual (by entry date)')) + '</span><span><b>' + esc(AR('العملة', 'Currency')) + '</b> ' + esc(AR('جنيه مصري', 'EGP')) + '</span></div>';
    var body = meta + line(AR('المبيعات (قبل الضريبة)', 'Sales (before VAT)'), d.sales) + line(AR('تكلفة البضاعة المباعة', 'Cost of goods sold'), -d.cogs) + line(AR('مجمل الربح', 'Gross profit'), d.gross, 'kv--total') +
      d.expenses.map(function (e) { return line(U.state.lang === 'ar' ? e.ar : e.en, -e.amount); }).join('') + line(AR('إجمالي المصروفات', 'Total expenses'), -d.total_expenses) + line(AR('صافي الربح', 'Net profit'), d.net, 'kv--total');
    return head(AR('الأرباح والخسائر', 'Profit and loss'), AR('الأرباح والخسائر', 'Profit and loss'), AR('الفترة والأساس والعملة مكتوبة أعلى الصفحة. لا أرقام بدون فترة.', 'Period, basis and currency are stated first. No number without a period.'), rangeSeg(ctx.filters, 'l-range')) +
      '<div class="kpis">' +
      ui.kpi({ label: AR('المبيعات', 'Sales'), value: fmt.money(d.sales), cur: true, note: AR('قبل الضريبة', 'Before VAT') }) +
      ui.kpi({ label: AR('مجمل الربح', 'Gross profit'), value: fmt.money(d.gross), cur: true, note: fmt.pct(d.gross_pct, 1) + ' ' + AR('من المبيعات', 'of sales') }) +
      ui.kpi({ label: AR('المصروفات', 'Expenses'), value: fmt.money(d.total_expenses), cur: true, note: AR('تشمل تسويات المخزون', 'Includes stock adjustments') }) +
      ui.kpi({ label: AR('صافي الربح', 'Net profit'), value: fmt.money(d.net), cur: true, note: fmt.pct(d.net_pct, 1) + ' ' + AR('من المبيعات', 'of sales') }) + '</div>' +
      ui.card({ title: AR('قائمة الدخل', 'Income statement'), sub: U.config.demo ? AR('بيانات تجريبية', 'Demo data') : '', body: body });
  }

  /* VAT */
  function loadVat(ctx) { var f = ctx.filters; f.range = f.range || 'month'; return U.api.call('erp_vat_report', { range: f.range }); }
  function viewVat(ctx, d) {
    function line(label, v, cls) { return '<div class="kv' + (cls ? ' ' + cls : '') + '"><span class="k">' + esc(label) + '</span><span class="v num">' + esc(fmt.money(v)) + '</span></div>'; }
    var meta = '<div class="meta-strip"><span><b>' + esc(AR('الفترة', 'Period')) + '</b> ' + esc(rangeText(d.from, d.to)) + '</span><span><b>' + esc(AR('العملة', 'Currency')) + '</b> ' + esc(AR('جنيه مصري', 'EGP')) + '</span></div>';
    return head(AR('ضريبة القيمة المضافة', 'VAT'), AR('ضريبة القيمة المضافة', 'VAT'), AR('مخرجات المبيعات ناقص مدخلات المشتريات والمصروفات. مراجعة داخلية وليست إقرارًا ضريبيًا.', 'Output VAT on sales minus input VAT on purchases and expenses. Internal review, not a tax return.'), rangeSeg(ctx.filters, 'v-range')) +
      '<div class="kpis">' +
      ui.kpi({ label: AR('ضريبة المخرجات', 'Output VAT'), value: fmt.money(d.output), cur: true, note: AR('على المبيعات', 'On sales') }) +
      ui.kpi({ label: AR('ضريبة المدخلات', 'Input VAT'), value: fmt.money(d.input), cur: true, note: AR('مشتريات ومصروفات', 'Purchases and expenses') }) +
      ui.kpi({ label: d.net >= 0 ? AR('الصافي المستحق', 'Net payable') : AR('رصيد دائن', 'Refundable'), value: fmt.money(Math.abs(d.net)), cur: true, note: AR('مخرجات − مدخلات', 'Output minus input') }) + '</div>' +
      ui.card({ title: AR('ملخص الفترة', 'Period summary'), sub: U.config.demo ? AR('بيانات تجريبية', 'Demo data') : '', body: meta + line(AR('المبيعات الخاضعة', 'Taxable sales'), d.sales_base) + line(AR('ضريبة المخرجات', 'Output VAT'), d.output) + line(AR('ضريبة المدخلات', 'Input VAT'), -d.input) + line(d.net >= 0 ? AR('الصافي المستحق', 'Net payable') : AR('رصيد دائن', 'Refundable'), Math.abs(d.net), 'kv--total') });
  }

  function reg(id, key, title, ico, order, load, view, acts) {
    return { nav: { group: 'accounting', screen: id, label: title, icon: ico, order: order }, screen: { id: id, title: title, load: load, view: view, actions: acts } };
  }
  var BASE = A;
  var X = Object.assign({}, A, {
    'x-cat': function (ctx, el) { ctx.filters.category = el.getAttribute('data-id'); ctx.reload(); }, 'x-range': function (ctx, el) { ctx.filters.range = el.getAttribute('data-id'); ctx.reload(); },
    'x-new': function () { expSheet(); },
    'x-submit': function (ctx) {
      var root = document.querySelector('.uerp'), q = function (s) { return root.querySelector(s); };
      U.api.call('erp_expense_create', { category: q('#x-cat').value, payee: q('#x-payee').value, amount: q('#x-amt').value, treasury_id: q('#x-tr').value, with_vat: q('#x-vat').checked, note: q('#x-note').value, client_ref: U.util.uid('ref') })
        .then(function () { var o = q('[data-ovl="vch"]'); if (o) o.remove(); ui.toast(AR('تم التسجيل', 'Posted'), 'ok'); ctx.reload(); })
        .catch(function (e) { q('#v-err').innerHTML = ui.banner({ tone: 'bad', icon: 'alert', title: AR('لم يُسجَّل', 'Refused'), text: e.message }); });
    }
  });
  var J = Object.assign({}, A, { 'j-src': function (ctx, el) { ctx.filters.source = el.getAttribute('data-id'); ctx.reload(); }, 'j-range': function (ctx, el) { ctx.filters.range = el.getAttribute('data-id'); ctx.reload(); }, 'j-open': function (ctx, el) { jSheet(el.getAttribute('data-id')); } });
  var RG = Object.assign({}, A, { 'l-range': function (ctx, el) { ctx.filters.range = el.getAttribute('data-id'); ctx.reload(); }, 'v-range': function (ctx, el) { ctx.filters.range = el.getAttribute('data-id'); ctx.reload(); } });
  U.i2 = { journal: journal };


  /* chart of accounts and fiscal years: read-only, live tables only (no demo data, no writes) */
  function loadChart() { return U.api.call('erp_chart_list', {}); }
  function viewChart(ctx, d) {
    var rows = d.rows || [];
    var TY = { asset: AR('أصول', 'Asset'), liability: AR('التزامات', 'Liability'), equity: AR('حقوق ملكية', 'Equity'), income: AR('إيرادات', 'Income'), cogs: AR('تكلفة', 'Cost'), expense: AR('مصروفات', 'Expense') };
    var cols = [
      { key: 'c', label: AR('الحساب', 'Account'), cell: function (r) { return '<span style="padding-inline-start:' + (Math.max(0, (r.level || 1) - 1) * 14) + 'px"><span class="doc-no">' + esc(r.code) + '</span> <span class="acct-n">' + esc(U.state.lang === 'ar' ? r.ar : (r.en || r.ar)) + '</span></span>'; } },
      { key: 'ty', label: AR('النوع', 'Type'), cell: function (r) { return '<span class="faint">' + esc(TY[r.type] || r.type || '') + '</span>'; } },
      { key: 'po', label: AR('يقبل قيود', 'Postable'), cell: function (r) { return r.postable ? ui.pill(AR('نعم', 'Yes'), 'ok') : '<span class="faint">' + esc(AR('تجميعي', 'Group')) + '</span>'; } },
      { key: 'st', label: AR('الحالة', 'Status'), cell: function (r) { return r.active ? ui.pill(AR('نشط', 'Active'), 'ok') : ui.pill(AR('موقوف', 'Inactive'), 'warn'); } }
    ];
    return head(AR('دليل الحسابات', 'Chart of accounts'), AR('دليل الحسابات', 'Chart of accounts'), AR('عرض فقط. لا يوجد ترحيل ولا تعديل من هذه الشاشة.', 'View only. No posting or editing from this screen.')) +
      ui.banner({ tone: 'info', icon: 'info', text: AR('هذه بيانات الدفاتر الفعلية. الترحيل التلقائي غير مفعّل.', 'This is the live books data. Automatic posting is off.') }) +
      '<section class="card">' + (!rows.length ? '<div class="tbl-wrap">' + ui.empty({ title: AR('دليل الحسابات لم يُجهَّز بعد', 'The chart of accounts is not set up yet'), hint: AR('لا توجد حسابات في الدفاتر حاليًا. يُجهَّز الدليل مع باقي إعداد المحاسبة بعد اعتماد المحاسب.', 'There are no accounts in the books yet. The chart is set up with the rest of the accounting setup once the accountant signs off.'), icon: 'doc' }) + '</div>' : ui.table({ cols: cols, rows: rows, rowId: function (r) { return r.id; } }) + ui.totalsStrip([{ label: AR('الحسابات', 'Accounts'), value: fmt.num(rows.length) }], '')) + '</section>';
  }
  function loadFY() { return U.api.call('erp_fiscal_years_list', {}); }
  function viewFY(ctx, d) {
    var rows = d.rows || [];
    var cols = [
      { key: 'n', label: AR('السنة المالية', 'Fiscal year'), cell: function (r) { return '<span class="doc-no">' + esc(r.name) + '</span>'; } },
      { key: 'f', label: AR('من', 'From'), cell: function (r) { return '<span class="num">' + esc(fmt.date(r.start)) + '</span>'; } },
      { key: 't', label: AR('إلى', 'To'), cell: function (r) { return '<span class="num">' + esc(fmt.date(r.end)) + '</span>'; } },
      { key: 'p', label: AR('الفترات', 'Periods'), cell: function (r) { return '<span class="num">' + esc(fmt.num((r.periods || []).length)) + '</span>'; } },
      { key: 's', label: AR('الحالة', 'Status'), cell: function (r) { return r.status === 'open' ? ui.pill(AR('مفتوحة', 'Open'), 'ok') : ui.pill(AR('مغلقة', 'Closed'), 'warn'); } }
    ];
    return head(AR('السنوات المالية', 'Fiscal years'), AR('السنوات المالية', 'Fiscal years'), AR('عرض فقط. لا يمكن فتح أو إغلاق فترات من هذه الشاشة.', 'View only. Periods cannot be opened or closed from this screen.')) +
      '<section class="card">' + (!rows.length ? '<div class="tbl-wrap">' + ui.empty({ title: AR('لا توجد سنوات مالية بعد', 'No fiscal years yet'), hint: AR('تُحدَّد السنة المالية وإقفال الفترات مع المحاسب. لا شيء يُنشأ تلقائيًا.', 'The fiscal year and period close are set with the accountant. Nothing is created automatically.'), icon: 'doc' }) + '</div>' : ui.table({ cols: cols, rows: rows, rowId: function (r) { return r.id; } })) + '</section>';
  }

  var TT = { ar: 'الخزائن والبنوك', en: 'Treasuries' };
  U.registerModule({
    id: 'accounting', group: 'accounting',
    nav: [
      { group: 'accounting', screen: 'accounting.treasuries', label: TT, icon: 'wallet', order: 10 },
      { group: 'accounting', screen: 'accounting.expenses', label: { ar: 'المصروفات', en: 'Expenses' }, icon: 'cash', order: 20 },
      { group: 'accounting', screen: 'accounting.journal', label: { ar: 'دفتر اليومية', en: 'Journal' }, icon: 'doc', order: 30 },
      { group: 'accounting', screen: 'accounting.trial', label: { ar: 'ميزان المراجعة', en: 'Trial balance' }, icon: 'sliders', order: 40 },
      { group: 'accounting', screen: 'accounting.pnl', label: { ar: 'الأرباح والخسائر', en: 'Profit and loss' }, icon: 'chart', order: 50 },
      { group: 'accounting', screen: 'accounting.vat', label: { ar: 'ضريبة القيمة المضافة', en: 'VAT' }, icon: 'shield', order: 60 },
      { group: 'accounting', screen: 'accounting.chart', label: { ar: 'دليل الحسابات', en: 'Chart of accounts' }, icon: 'doc', order: 70 },
      { group: 'accounting', screen: 'accounting.fiscal', label: { ar: 'السنوات المالية', en: 'Fiscal years' }, icon: 'doc', order: 80 }
    ],
    screens: [
      { id: 'accounting.treasuries', title: TT, load: load, view: view, actions: A },
      { id: 'accounting.expenses', title: { ar: 'المصروفات', en: 'Expenses' }, load: loadExp, view: viewExp, actions: X },
      { id: 'accounting.journal', title: { ar: 'دفتر اليومية', en: 'Journal' }, load: loadJ, view: viewJ, actions: J },
      { id: 'accounting.trial', title: { ar: 'ميزان المراجعة', en: 'Trial balance' }, load: loadTB, view: viewTB, actions: A },
      { id: 'accounting.pnl', title: { ar: 'الأرباح والخسائر', en: 'Profit and loss' }, load: loadPL, view: viewPL, actions: RG },
      { id: 'accounting.vat', title: { ar: 'ضريبة القيمة المضافة', en: 'VAT' }, load: loadVat, view: viewVat, actions: RG },
      { id: 'accounting.chart', title: { ar: 'دليل الحسابات', en: 'Chart of accounts' }, load: loadChart, view: viewChart, actions: A },
      { id: 'accounting.fiscal', title: { ar: 'السنوات المالية', en: 'Fiscal years' }, load: loadFY, view: viewFY, actions: A }
    ]
  });
})();
