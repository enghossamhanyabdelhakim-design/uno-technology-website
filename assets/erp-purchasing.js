/*!
 * UNO Core ERP — Purchasing module (erp-purchasing.js) · part 1
 * Screens: supplier invoices, purchase invoice (receive/pay), suppliers, supplier file, new invoice.
 * RPCs: erp_purchase_list, erp_purchase_get, erp_purchase_receive, erp_purchase_approve,
 *       erp_purchase_pay, erp_purchase_create, erp_purchase_summary, erp_supplier_list, erp_supplier_get
 */
(function () {
  'use strict';
  var U = window.UnoERP;
  if (!U || !U.__kernel) { if (window.console) console.warn('[UnoERP] erp-kernel.js must load before this module'); return; }
  var ui = U.ui, t = U.t, L = U.L, esc = U.esc, fmt = U.fmt, icon = U.icon;
  var AR = function (ar, en) { return U.state.lang === 'ar' ? ar : en; };
  /* Arabic counts: 1 فاتورة، 2 فاتورتان، 3-10 فواتير، 11+ فاتورة */
  var PL = function (n, one, two, few, many) {
    var x = Math.abs(Number(n) || 0);
    if (U.state.lang !== 'ar') return x === 1 ? one.en : (few.en || one.en);
    if (x === 1) return one.ar; if (x === 2) return two.ar; if (x >= 3 && x <= 10) return few.ar; return many.ar;
  };
  var cur = function () { return t('app.currency'); };

  var H = {};

  H.status = function (st) {
    var lab = (U.demo.labels.invoiceStatus[st]) || { ar: st, en: st, tone: 'neutral' };
    return ui.pill(L(lab), lab.tone);
  };

  H.supplier = function (id) {
    return ((U.state.meta && U.state.meta.suppliers) || []).filter(function (s) { return s.id === id; })[0] || {};
  };
  H.wh = function (id) {
    var w = ((U.state.meta && U.state.meta.warehouses) || []).filter(function (x) { return x.id === id; })[0];
    return w ? L(w) : '';
  };
  H.product = function (id) {
    return ((U.state.meta && U.state.meta.products) || []).filter(function (p) { return p.id === id; })[0] || {};
  };
  H.range = function (f) {
    var today = new Date();
    function d(o) { var x = new Date(today.getTime()); x.setDate(x.getDate() + o); return x.toISOString().slice(0, 10); }
    switch (f.range || 'month') {
      case 'today': return { from: d(0), to: d(0) };
      case 'week': return { from: d(-6), to: d(0) };
      case 'month': return { from: d(-29), to: d(0) };
      case 'year': return { from: d(-364), to: d(0) };
      default: return { from: null, to: null };
    }
  };
  H.head = function (o) {
    return '<div class="page-head"><div class="ph-txt">' +
      '<div class="crumbs"><span>' + esc(AR('الرئيسية', 'Home')) + '</span>' + icon('chevStart', 12) +
      '<span>' + esc(AR('المشتريات', 'Purchasing')) + '</span>' + icon('chevStart', 12) + '<span>' + esc(o.crumb || '') + '</span></div>' +
      '<h1 class="page-title">' + esc(o.title) + '</h1>' + (o.sub ? '<p class="page-sub">' + esc(o.sub) + '</p>' : '') + '</div>' +
      '<div class="page-actions">' + (o.actions || '') + '</div></div>';
  };
  H.due = function (r) { return U.util.round((r.total || 0) + (r.vat || 0) - (r.paid || 0), 2); };

  /* ================= invoice list ================= */
  function loadInvoices(ctx) {
    var f = ctx.filters;
    if (!f.range) f.range = 'month';
    if (!f.status) f.status = 'all';
    if (!f.page) f.page = 1;
    if (!f.size) f.size = 25;
    var r = H.range(f);
    return Promise.all([
      U.api.call('erp_purchase_list', { status: f.status, supplier_id: f.supplier || null, from: r.from, to: r.to, q: f.q || '' }),
      U.api.call('erp_purchase_summary', {})
    ]).then(function (res) { return { list: res[0], summary: res[1] }; });
  }

  function viewInvoices(ctx, data) {
    var f = ctx.filters, list = data.list, s = data.summary;
    var rows = list.rows || [];
    var pageRows = rows.slice((f.page - 1) * f.size, f.page * f.size);

    var tabs = ui.tabs([
      { id: 'all', label: t('app.all'), count: list.counts.all },
      { id: 'awaiting', label: AR('بانتظار الاستلام', 'Awaiting receipt'), count: list.counts.awaiting },
      { id: 'approval', label: AR('بانتظار الاعتماد', 'Awaiting approval'), count: list.counts.approval },
      { id: 'paid', label: AR('مدفوعة', 'Paid'), count: list.counts.paid },
      { id: 'draft', label: AR('مسودات', 'Drafts'), count: list.counts.draft },
      { id: 'cancelled', label: AR('ملغاة', 'Cancelled'), count: list.counts.cancelled }
    ], f.status, 'p-tab');

    var cols = [
      { key: 'no', label: AR('رقم الفاتورة', 'Invoice'), cls: 'doc-col', cell: function (r) {
        return '<div class="id-cell"><div><div class="doc-no">' + esc(r.no) + '</div>' +
          (r.paper_no ? '<div class="id-s">' + esc(AR('فاتورة المورد ', 'Supplier no. ') + r.paper_no) + '</div>' : '') + '</div></div>';
      } },
      { key: 'supplier', label: t('app.supplier'), cls: 'id-col', cell: function (r) {
        var sp = H.supplier(r.supplier_id);
        return '<div class="id-cell">' + ui.avatar(L(sp)) + '<div style="min-width:0"><div class="id-t">' + esc(L(sp)) + '</div>' +
          '<div class="id-s">' + esc(sp.code || '') + '</div></div></div>';
      } },
      { key: 'date', label: t('app.date'), cell: function (r) { return '<span class="num">' + esc(fmt.date(r.date)) + '</span>'; } },
      { key: 'expected', label: AR('التسليم المتوقع', 'Expected'), cell: function (r) {
        if (!r.expected_date) return '<span class="faint">—</span>';
        if (r.late_days > 0) {
          return '<span class="num" style="color:var(--bad-ink);font-weight:600">' + esc(fmt.date(r.expected_date)) + '</span>' +
            '<div class="id-s" style="color:var(--bad-ink)">' + esc(AR('متأخر ', 'late ') + fmt.num(r.late_days) + ' ' +
              PL(r.late_days, { ar: 'يوم', en: 'day' }, { ar: 'يومان', en: 'days' }, { ar: 'أيام', en: 'days' }, { ar: 'يومًا', en: 'days' })) + '</div>';
        }
        return '<span class="num faint">' + esc(fmt.date(r.expected_date)) + '</span>';
      } },
      { key: 'wh', label: t('app.warehouse'), cell: function (r) { return '<span class="faint">' + esc(H.wh(r.warehouse_id)) + '</span>'; } },
      { key: 'total', label: AR('الإجمالي (ج.م)', 'Total (EGP)'), align: 'end', cell: function (r) { return ui.money(r.total + r.vat); } },
      { key: 'remaining', label: AR('المتبقي', 'Remaining'), align: 'end', cell: function (r) {
        if (r.status === 'cancelled') return '<span class="faint">—</span>';
        var d = H.due(r);
        return d > 0.009 ? '<span class="num" style="font-weight:600">' + esc(fmt.money(d)) + '</span>' : '<span class="faint">—</span>';
      } },
      { key: 'status', label: t('app.status'), cell: function (r) { return H.status(r.status); } },
      { key: 'act', label: '', align: 'end', cls: 'act-col', w: '40px', cell: function () { return '<span class="row-act">' + icon('more', 16) + '</span>'; } }
    ];

    var lateRows = (list.rows || []).filter(function (r) { return r.late_days > 0; });
    var lateCount = lateRows.length;
    var strips = '<div class="grid">' +
      '<div class="c6">' + ui.banner({ tone: list.awaiting_receipt_count ? 'warn' : 'ok', icon: 'truck',
        title: fmt.num(list.awaiting_receipt_count || 0) + ' ' +
          PL(list.awaiting_receipt_count || 0, { ar: 'فاتورة بانتظار استلام البضاعة', en: 'invoice awaiting goods receipt' },
            { ar: 'فاتورتان بانتظار استلام البضاعة', en: 'invoices awaiting goods receipt' },
            { ar: 'فواتير بانتظار استلام البضاعة', en: 'invoices awaiting goods receipt' },
            { ar: 'فاتورة بانتظار استلام البضاعة', en: 'invoices awaiting goods receipt' }) +
          (lateCount ? AR(' — منها ', ' — ') + fmt.num(lateCount) + ' ' +
            PL(lateCount, { ar: 'متأخرة', en: 'late' }, { ar: 'متأخرتان', en: 'late' }, { ar: 'متأخرة', en: 'late' }, { ar: 'متأخرة', en: 'late' }) : ''),
        text: AR('المخزون يزيد بالمستلم فقط، لا بالمطلوب.', 'Stock increases for the received quantity only, never the ordered quantity.'),
        action: ui.btn(AR('اعرضها', 'Show'), { act: 'p-tab', kind: 'ghost', size: 'sm', data: { id: 'awaiting' } }) }) + '</div>' +
      '<div class="c6">' + ui.banner({ tone: list.awaiting_approval_count ? 'info' : 'ok', icon: 'shield',
        title: (list.awaiting_approval_count || 0) + ' ' + AR('فاتورة بانتظار اعتمادي المالي', 'invoices awaiting my financial approval'),
        text: AR('الاعتماد يعرض المطلوب مقابل المستلم قبل الدفع.', 'Approval shows requested vs received before any payment.'),
        action: ui.btn(AR('اعرضها', 'Show'), { act: 'p-tab', kind: 'ghost', size: 'sm', data: { id: 'approval' } }) }) + '</div>' +
      '</div>';

    return H.head({
      crumb: AR('فواتير الموردين', 'Supplier invoices'),
      title: AR('فواتير الموردين', 'Supplier invoices'),
      sub: AR('استلام البضاعة منفصل عن الدفع: أمين المخزن يستلم، والمحاسب يعتمد ويدفع.',
        'Receiving is separate from paying: the storekeeper receives, the accountant approves and pays.'),
      actions: ui.btn(t('app.export'), { act: 'p-export', icon: 'download' }) +
        ui.iconBtn('print', { act: 'print', title: t('app.print') }) +
        ui.btn(AR('فاتورة شراء', 'New purchase invoice'), { act: 'p-new', kind: 'primary', icon: 'plus' })
    }) + strips +
      '<div class="kpis">' +
      ui.kpi({ label: AR('إجمالي المشتريات', 'Total purchases'), value: fmt.money(s.total), cur: true, note: fmt.num(s.count) + ' ' + AR('فاتورة', 'invoices') }) +
      ui.kpi({ label: AR('المدفوع', 'Paid'), value: fmt.money(s.paid), cur: true, note: AR('من الخزائن والبنوك', 'From treasuries and banks') }) +
      ui.kpi({ label: AR('المتبقي للموردين', 'Owed to suppliers'), value: fmt.money(s.remaining), cur: true, note: AR('من الأستاذ لا يُعاد حسابه', 'From the supplier ledger') }) +
      ui.kpi({ label: AR('نسبة السداد', 'Settlement'), value: fmt.pct(s.total ? s.paid / s.total * 100 : 0, 1), note: AR('مدفوع ÷ إجمالي', 'Paid ÷ total') }) +
      '</div>' +
      '<section class="card">' +
      '<div style="padding:0 18px">' + tabs + '</div>' +
      '<div class="toolbar">' +
      '<div class="search-inline">' + icon('search', 16) +
      '<input data-act="search" data-filter="q" value="' + esc(f.q || '') + '" placeholder="' + esc(AR('رقم الفاتورة أو فاتورة المورد…', 'Invoice no. or supplier reference…')) + '"></div>' +
      '<select class="select" data-filter="supplier"><option value="">' + esc(AR('كل الموردين', 'All suppliers')) + '</option>' +
      ((U.state.meta.suppliers || []).map(function (sp) {
        return '<option value="' + esc(sp.id) + '"' + (f.supplier === sp.id ? ' selected' : '') + '>' + esc(L(sp)) + '</option>';
      }).join('')) + '</select>' +
      '<div class="segmented">' + [['today', 'app.today'], ['week', 'app.week'], ['month', 'app.month'], ['year', 'app.year']].map(function (p) {
        return '<button class="seg' + (f.range === p[0] ? ' is-active' : '') + '" data-act="p-range" data-id="' + p[0] + '">' + esc(t(p[1])) + '</button>';
      }).join('') + '</div>' +
      '<span class="grow"></span>' +
      ui.btn(AR('كثافة', 'Density'), { act: 'toggle-density', kind: 'ghost', icon: 'sliders', size: 'sm' }) +
      '</div>' +
      (f.status === 'awaiting' ? '<div class="bulkbar"><b>' + esc(AR('الاستلام يزيد المخزون بالكمية الفعلية فقط', 'Receipt increases stock by the actual quantity only')) + '</b>' +
        '<span class="grow"></span>' + ui.btn(AR('إغلاق', 'Dismiss'), { act: 'p-tab', kind: 'ghost', size: 'sm', data: { id: 'all' } }) + '</div>' : '') +
      ui.table({ cols: cols, rows: pageRows, rowId: function (r) { return r.id; }, rowAct: 'p-open',
        empty: ui.empty({ title: AR('لا فواتير مطابقة', 'No invoices match'), hint: t('app.emptyHint'), icon: 'doc' }) }) +
      ui.totalsStrip([
        { label: AR('إجمالي المعروض', 'Shown total'), value: fmt.money(U.util.sum(rows, function (r) { return r.status === 'cancelled' ? 0 : r.total + r.vat; })) },
        { label: AR('المدفوع', 'Paid'), value: fmt.money(U.util.sum(rows, function (r) { return r.paid; })) },
        { label: AR('المتبقي', 'Remaining'), value: fmt.money(U.util.sum(rows, function (r) { return r.status === 'cancelled' ? 0 : H.due(r); })), tone: 'bad' }
      ], AR('الملغاة لا تُحسب في الإجماليات', 'Cancelled invoices are excluded from totals')) +
      ui.pager({ page: f.page, size: f.size, count: rows.length, act: 'p-page' }) +
      '</section>';
  }

  /* ================= suppliers list ================= */
  function loadSuppliers(ctx) {
    return U.api.call('erp_supplier_list', { q: ctx.filters.q || '' });
  }
  function viewSuppliers(ctx, data) {
    var f = ctx.filters;
    var cols = [
      { key: 'name', label: t('app.supplier'), cls: 'id-col', cell: function (r) {
        return '<div class="id-cell">' + ui.avatar(L(r)) + '<div style="min-width:0"><div class="id-t">' + esc(L(r)) + '</div>' +
          '<div class="id-s num">' + esc(r.code) + '</div></div></div>';
      } },
      { key: 'phone', label: AR('الهاتف', 'Phone'), cell: function (r) { return '<span class="num faint" dir="ltr">' + esc(r.phone) + '</span>'; } },
      { key: 'terms', label: AR('شروط السداد', 'Terms'), align: 'end', cell: function (r) { return '<span class="num faint">' + esc(r.terms) + ' ' + esc(AR('يوم', 'days')) + '</span>'; } },
      { key: 'open', label: AR('فواتير مفتوحة', 'Open invoices'), align: 'end', cell: function (r) { return '<span class="num">' + esc(fmt.num(r.open_invoices)) + '</span>'; } },
      { key: 'balance', label: AR('الرصيد (ج.م)', 'Balance (EGP)'), align: 'end', cell: function (r) { return '<span class="num" style="font-weight:600">' + esc(fmt.money(r.balance)) + '</span>'; } },
      { key: 'aging', label: AR('التأخير', 'Overdue'), cell: function (r) {
        return r.overdue_days > 0 ? ui.pill(AR('متأخر ' + r.overdue_days + ' يوم', r.overdue_days + ' days late'), 'bad')
          : ui.pill(AR('داخل المدة', 'Within terms'), 'ok');
      } }
    ];
    return H.head({
      crumb: AR('الموردون', 'Suppliers'),
      title: AR('الموردون', 'Suppliers'),
      sub: AR('رصيد كل مورد، أعمار الديون، وآخر سعر شراء لكل صنف.', 'Each supplier balance, aging, and last purchase price per item.'),
      actions: ui.btn(t('app.export'), { act: 'p-export-suppliers', icon: 'download' }) +
        ui.iconBtn('print', { act: 'print', title: t('app.print') })
    }) +
      '<div class="kpis">' +
      ui.kpi({ label: AR('إجمالي المستحق للموردين', 'Total owed'), value: fmt.money(data.totals.balance), cur: true, note: AR('من أستاذ الموردين', 'From the supplier ledger') }) +
      ui.kpi({ label: AR('عدد الموردين', 'Suppliers'), value: fmt.num(data.rows.length), note: AR('نشط', 'active') }) +
      ui.kpi({ label: AR('موردون متأخرون', 'Late suppliers'), value: fmt.num(data.rows.filter(function (r) { return r.overdue_days > 0; }).length), note: AR('تجاوزوا شروط السداد', 'past their terms') }) +
      ui.kpi({ label: AR('أكبر رصيد', 'Largest balance'), value: fmt.money(Math.max.apply(null, data.rows.map(function (r) { return r.balance; }).concat([0]))), cur: true, note: AR('مورد واحد', 'single supplier') }) +
      '</div>' +
      '<section class="card">' +
      '<div class="toolbar"><div class="search-inline">' + icon('search', 16) +
      '<input data-act="search" data-filter="q" value="' + esc(f.q || '') + '" placeholder="' + esc(AR('ابحث باسم المورد أو الكود…', 'Search supplier or code…')) + '"></div>' +
      '<span class="grow"></span><span class="faint" style="font-size:11.5px">' + esc(AR('اضغط أي مورد لعرض ملفه وكشف حسابه', 'Open a supplier for its file and statement')) + '</span></div>' +
      ui.table({ cols: cols, rows: data.rows, rowId: function (r) { return r.id; }, rowAct: 'p-supplier' }) +
      ui.totalsStrip([{ label: AR('إجمالي الأرصدة', 'Total balances'), value: fmt.money(data.totals.balance) }], '') +
      '</section>';
  }

  /* ================= supplier file ================= */
  function loadSupplier(ctx) {
    return U.api.call('erp_supplier_get', { id: ctx.params.id || ctx.filters.supplier });
  }
  function viewSupplier(ctx, data) {
    var f = ctx.filters;
    if (!f.tab) f.tab = 'overview';
    var s = data.supplier, a = data.aging;
    var totalAging = a.current + a.b1 + a.b2 + a.b3 + a.b4 || 1;
    var agingBar = '<div class="aging">' +
      [['current', 'var(--age-1)'], ['b1', 'var(--warn-ink)'], ['b2', 'var(--age-2)'], ['b3', 'var(--age-3)'], ['b4', 'var(--age-4)']].map(function (x) {
        var v = a[x[0]] || 0;
        return v > 0 ? '<i style="background:' + x[1] + ';width:' + (v / totalAging * 100).toFixed(1) + '%"></i>' : '';
      }).join('') + '</div>' +
      '<div class="aging-legend">' +
      '<span><i style="background:var(--ok-ink)"></i>' + esc(AR('داخل المدة', 'Current')) + ' ' + esc(fmt.money(a.current)) + '</span>' +
      '<span><i style="background:var(--warn-ink)"></i>1–30 ' + esc(fmt.money(a.b1)) + '</span>' +
      '<span><i style="background:var(--age-2)"></i>31–60 ' + esc(fmt.money(a.b2)) + '</span>' +
      '<span><i style="background:var(--bad-ink)"></i>61–90 ' + esc(fmt.money(a.b3)) + '</span>' +
      '<span><i style="background:var(--age-4)"></i>90+ ' + esc(fmt.money(a.b4)) + '</span></div>';

    var tabsHtml = ui.tabs([
      { id: 'overview', label: AR('نظرة عامة', 'Overview') },
      { id: 'invoices', label: AR('الفواتير', 'Invoices'), count: data.invoices.length },
      { id: 'payments', label: AR('المدفوعات', 'Payments'), count: data.payments.length },
      { id: 'items', label: AR('الأصناف', 'Items'), count: data.items.length },
      { id: 'statement', label: AR('كشف الحساب', 'Statement') }
    ], f.tab, 'p-sup-tab');

    var invCols = [
      { key: 'no', label: AR('رقم الفاتورة', 'Invoice'), cell: function (r) { return '<span class="doc-no">' + esc(r.no) + '</span>'; } },
      { key: 'date', label: t('app.date'), cell: function (r) { return '<span class="num">' + esc(fmt.date(r.date)) + '</span>'; } },
      { key: 'paper', label: AR('فاتورة المورد', 'Supplier ref.'), cell: function (r) { return '<span class="num faint">' + esc(r.paper_no || '—') + '</span>'; } },
      { key: 'total', label: AR('الإجمالي', 'Total'), align: 'end', cell: function (r) { return ui.money(U.demo.invoiceTotal(r) + U.demo.invoiceVat(r)); } },
      { key: 'paid', label: AR('المدفوع', 'Paid'), align: 'end', cell: function (r) { return '<span class="num faint">' + esc(fmt.money(U.demo.invoicePaid(r))) + '</span>'; } },
      { key: 'status', label: t('app.status'), cell: function (r) { return H.status(r.status); } }
    ];
    var payCols = [
      { key: 'no', label: AR('رقم الدفعة', 'Payment'), cell: function (r) { return '<span class="doc-no">' + esc(r.no) + '</span>'; } },
      { key: 'date', label: t('app.date'), cell: function (r) { return '<span class="num">' + esc(fmt.date(r.date)) + '</span>'; } },
      { key: 'method', label: AR('الطريقة', 'Method'), cell: function (r) { return '<span class="faint">' + esc(r.method === 'cash' ? AR('نقدي', 'Cash') : AR('تحويل', 'Transfer')) + '</span>'; } },
      { key: 'amount', label: AR('المبلغ', 'Amount'), align: 'end', cell: function (r) { return ui.money(r.amount); } }
    ];
    var itemCols = [
      { key: 'item', label: t('app.item'), cls: 'id-col', cell: function (r) { var p = H.product(r.product_id); return '<div class="id-cell"><div><div class="id-t">' + esc(L(p)) + '</div><div class="id-s num">' + esc(p.sku) + '</div></div></div>'; } },
      { key: 'last', label: AR('آخر سعر شراء', 'Last purchase price'), align: 'end', cell: function (r) { return '<span class="num">' + esc(fmt.money(r.last_cost)) + '</span>'; } },
      { key: 'date', label: AR('تاريخ آخر شراء', 'Last purchased'), align: 'end', cell: function (r) { return '<span class="num faint">' + esc(fmt.date(r.last_date)) + '</span>'; } },
      { key: 'best', label: AR('الأرخص', 'Cheapest'), align: 'end', cell: function (r) {
        if (!r.best) return '<span class="faint">—</span>';
        var bs = H.supplier(r.best.supplier_id);
        return '<span class="num">' + esc(fmt.money(r.best.cost)) + '</span> <span class="faint" style="font-size:11px">' + esc(L(bs)) + '</span>';
      } }
    ];
    var ledCols = [
      { key: 'date', label: t('app.date'), cell: function (r) { return '<span class="num">' + esc(fmt.date(r.date)) + '</span>'; } },
      { key: 'doc', label: t('app.doc'), cell: function (r) { return '<div class="doc-no">' + esc(r.doc) + '</div>' + (r.note ? '<div class="id-s">' + esc(r.note) + '</div>' : ''); } },
      { key: 'debit', label: AR('مدين (دفع)', 'Debit (paid)'), align: 'end', cell: function (r) { return r.debit ? ui.money(r.debit) : '<span class="faint">—</span>'; } },
      { key: 'credit', label: AR('دائن (فاتورة)', 'Credit (invoice)'), align: 'end', cell: function (r) { return r.credit ? ui.money(r.credit) : '<span class="faint">—</span>'; } },
      { key: 'balance', label: AR('الرصيد', 'Balance'), align: 'end', cell: function (r) { return '<span class="num" style="font-weight:600">' + esc(fmt.money(r.balance)) + '</span>'; } }
    ];

    var body = '';
    if (f.tab === 'overview') {
      body = '<div class="grid">' +
        '<div class="c6">' + ui.card({ title: AR('أعمار الديون', 'Aging'), body: agingBar }) + '</div>' +
        '<div class="c6">' + ui.card({ title: AR('ملخص', 'Summary'),
          body: '<div class="kv"><span class="k">' + esc(AR('الرصيد الحالي', 'Current balance')) + '</span><span class="v num">' + esc(fmt.money(data.balance)) + ' ' + cur() + '</span></div>' +
            '<div class="kv"><span class="k">' + esc(AR('شروط السداد', 'Payment terms')) + '</span><span class="v">' + esc(s.terms + ' ' + AR('يوم', 'days')) + '</span></div>' +
            '<div class="kv"><span class="k">' + esc(AR('الهاتف', 'Phone')) + '</span><span class="v num" dir="ltr">' + esc(s.phone) + '</span></div>' +
            '<div class="kv"><span class="k">' + esc(AR('الرقم الضريبي', 'Tax number')) + '</span><span class="v num">' + esc(s.tax) + '</span></div>' }) + '</div>' +
        '<div class="c12">' + ui.card({ title: AR('آخر الحركات', 'Recent activity'), flush: true,
          body: ui.table({ cols: ledCols, rows: data.ledger.slice(-8).reverse() }) }) + '</div>' +
        '</div>';
    } else if (f.tab === 'invoices') {
      body = ui.card({ flush: true, body: ui.table({ cols: invCols, rows: data.invoices, rowId: function (r) { return r.id; }, rowAct: 'p-open' }) });
    } else if (f.tab === 'payments') {
      body = ui.card({ flush: true, body: ui.table({ cols: payCols, rows: data.payments }) });
    } else if (f.tab === 'items') {
      body = ui.card({ title: AR('آخر سعر شراء لكل صنف', 'Last purchase price per item'),
        sub: AR('لمعرفة من الأرخص لهذا الصنف', 'To see who is cheapest for this item'), flush: true,
        body: ui.table({ cols: itemCols, rows: data.items }) });
    } else {
      body = ui.card({ title: AR('كشف حساب', 'Statement'), sub: AR('قابل للطباعة والإرسال على واتساب', 'Printable and sendable on WhatsApp'),
        actions: ui.btn(t('app.print'), { act: 'print', icon: 'print', size: 'sm' }),
        flush: true, body: ui.table({ cols: ledCols, rows: data.ledger,
          foot: { date: t('app.total'), balance: ui.money(data.balance) } }) });
    }

    return '<div class="page-head"><div class="ph-txt">' +
      '<div class="crumbs"><button data-act="nav" data-id="purchasing.suppliers" style="color:var(--brand-ink)">' + esc(AR('الموردون', 'Suppliers')) + '</button>' +
      icon('chevStart', 12) + '<span class="num">' + esc(s.code) + '</span></div>' +
      '<h1 class="page-title">' + esc(L(s)) + '</h1>' +
      '<p class="page-sub">' + esc(AR('الرصيد ', 'Balance ') ) + esc(fmt.money(data.balance)) + ' ' + cur() +
      ' · ' + esc(data.invoices.length) + ' ' + esc(AR('فاتورة', 'invoices')) + ' · ' + esc(data.payments.length) + ' ' + esc(AR('دفعة', 'payments')) + '</p></div>' +
      '<div class="page-actions">' + ui.btn(AR('دفعة', 'Record payment'), { act: 'p-pay-supplier', icon: 'cash' }) +
      ui.btn(AR('فاتورة شراء', 'New invoice'), { act: 'p-new', kind: 'primary', icon: 'plus' }) + '</div></div>' +
      '<section class="card"><div style="padding:0 18px">' + tabsHtml + '</div><div style="padding:16px 18px" class="sup-body">' + body + '</div></section>';
  }

  U.purch = { H: H, loadInvoices: loadInvoices, viewInvoices: viewInvoices, loadSuppliers: loadSuppliers,
    viewSuppliers: viewSuppliers, loadSupplier: loadSupplier, viewSupplier: viewSupplier };
})();
/*!
 * UNO Core ERP — Purchasing module (erp-purchasing.js) · part 2
 * Invoice detail (receive ≠ pay), new invoice form, actions, registration.
 */
(function () {
  'use strict';
  var U = window.UnoERP;
  if (!U || !U.__kernel) return;
  var ui = U.ui, t = U.t, L = U.L, esc = U.esc, fmt = U.fmt, icon = U.icon;
  var AR = function (ar, en) { return U.state.lang === 'ar' ? ar : en; };
  var cur = function () { return t('app.currency'); };
  var P = U.purch || {};
  var H = P.H || {};
  if (!H.status) return;

  var STEPS = function () {
    return [AR('مسودة', 'Draft'), AR('بانتظار الاستلام', 'Awaiting receipt'), AR('استلام جزئي', 'Partial'), AR('مستلمة', 'Received'),
      AR('معتمدة ماليًا', 'Approved'), AR('مدفوعة', 'Paid')];
  };
  function stepIndex(status) {
    return { draft: 0, awaiting_receipt: 1, partially_received: 2, received: 3, financially_approved: 4, partially_paid: 5, paid: 5, cancelled: 0 }[status] || 0;
  }

  /* ================= invoice detail ================= */
  function loadInvoice(ctx) {
    return U.api.call('erp_purchase_get', { id: ctx.params.id || ctx.filters.id });
  }

  function viewInvoice(ctx, data) {
    var f = ctx.filters;
    if (ctx.params.mode) f.mode = ctx.params.mode;
    if (!f.mode) f.mode = 'view';
    var inv = data.invoice, s = data.supplier;
    var lines = inv.lines;
    var reqTotal = U.util.sum(lines, function (l) { return l.qty; });
    var recTotal = U.util.sum(lines, function (l) { return l.received_qty; });
    var diff = reqTotal - recTotal;
    var canReceive = ['awaiting_receipt', 'partially_received'].indexOf(inv.status) >= 0;
    var canApprove = ['received', 'partially_received'].indexOf(inv.status) >= 0;
    var canPay = ['financially_approved', 'partially_paid', 'received'].indexOf(inv.status) >= 0 && data.remaining > 0.009;

    var cols = [
      { key: 'n', label: '#', cls: 'idx-col', w: '34px', cell: function (l) { return '<span class="num faint">' + (lines.indexOf(l) + 1) + '</span>'; } },
      { key: 'item', label: t('app.item'), cls: 'id-col', cell: function (l) {
        var p = H.product(l.product_id);
        return '<div class="id-cell"><div style="min-width:0"><div class="id-t">' + esc(L(p)) + '</div><div class="id-s num">' + esc(p.sku) + '</div></div></div>';
      } },
      { key: 'qty', label: AR('المطلوب', 'Ordered'), align: 'end', cell: function (l) { return '<span class="num">' + esc(fmt.qty(l.qty)) + '</span>'; } },
      { key: 'recv', label: AR('المستلم', 'Received'), align: 'end', cell: function (l) {
        if (f.mode === 'receive' && canReceive) {
          var remaining = l.qty - l.received_qty;
          return '<input class="input input--num" style="height:32px;width:72px" type="number" min="0" max="' + remaining + '" step="1" ' +
            'value="' + remaining + '" data-act="p-recv-input" data-line="' + esc(l.id) + '">';
        }
        var tone = l.received_qty < l.qty ? 'color:var(--warn-ink);font-weight:600' : '';
        return '<span class="num" style="' + tone + '">' + esc(fmt.qty(l.received_qty)) + '</span>';
      } },
      { key: 'gap', label: AR('الفرق', 'Gap'), align: 'end', cell: function (l) {
        var g = l.qty - l.received_qty;
        return g > 0 ? '<span class="num" style="color:var(--warn-ink);font-weight:600">' + esc(fmt.qty(g)) + '</span>' : '<span class="faint">—</span>';
      } },
      { key: 'cost', label: AR('سعر الوحدة', 'Unit cost'), align: 'end', cell: function (l) { return '<span class="num faint">' + esc(fmt.money(l.unit_cost)) + '</span>'; } },
      { key: 'net', label: AR('الإجمالي', 'Line total'), align: 'end', cell: function (l) { return ui.money(U.demo.lineNet(l)); } }
    ];
    if (f.mode !== 'receive') {
      cols.splice(6, 0, { key: 'disc', label: AR('خصم %', 'Disc %'), align: 'end', cell: function (l) { return '<span class="num faint">' + (l.discount_pct ? esc(l.discount_pct + '%') : '—') + '</span>'; } });
    }

    var receiveWarning = (canReceive || inv.status === 'partially_received')
      ? ui.banner({ tone: diff > 0 ? 'warn' : 'ok', icon: diff > 0 ? 'alert' : 'check',
        title: diff > 0
          ? AR('الكمية المستلمة أقل من المطلوبة بـ ' + fmt.qty(diff) + ' وحدة', fmt.qty(diff) + ' units fewer than ordered')
          : AR('كل الكميات مستلمة', 'All quantities received'),
        text: AR('المخزون يزيد بالمستلم فقط (' + fmt.qty(recTotal) + ' من ' + fmt.qty(reqTotal) + ')، والاعتماد المالي يعرض الفرق قبل الدفع.',
          'Stock increases for the received quantity only (' + fmt.qty(recTotal) + ' of ' + fmt.qty(reqTotal) + '), and financial approval shows the gap before payment.') })
      : '';

    var totalsCard = ui.card({ title: AR('الإجمالي', 'Totals'), body:
      '<div class="kv"><span class="k">' + esc(AR('قبل الضريبة', 'Subtotal')) + '</span><span class="v num">' + esc(fmt.money(data.total)) + '</span></div>' +
      '<div class="kv"><span class="k">' + esc(AR('خصم الفاتورة', 'Invoice discount')) + '</span><span class="v num">' + esc(fmt.money(inv.discount || 0)) + '</span></div>' +
      '<div class="kv"><span class="k">' + esc(AR('ضريبة القيمة المضافة', 'VAT')) + '</span><span class="v num">' + esc(fmt.money(data.vat)) + '</span></div>' +
      '<div class="kv" style="border-top:1px solid var(--line);margin-top:4px;padding-top:10px">' +
      '<span class="k" style="font-weight:700;color:var(--ink)">' + esc(AR('الإجمالي', 'Total')) + '</span>' +
      '<span class="v num" style="font-size:17px">' + esc(fmt.money(data.total + data.vat)) + ' ' + cur() + '</span></div>' +
      '<div class="kv"><span class="k">' + esc(AR('المدفوع', 'Paid')) + '</span><span class="v num">' + esc(fmt.money(data.paid)) + '</span></div>' +
      '<div class="kv"><span class="k">' + esc(AR('المتبقي', 'Remaining')) + '</span><span class="v num" style="color:' + (data.remaining > 0.009 ? 'var(--bad-ink)' : 'var(--ok-ink)') + '">' + esc(fmt.money(data.remaining)) + '</span></div>' });

    var supplierCard = ui.card({ title: AR('المورد', 'Supplier'), body:
      '<div class="id-cell" style="margin-bottom:10px">' + ui.avatar(L(s)) +
      '<div><div class="id-t">' + esc(L(s)) + '</div><div class="id-s num">' + esc(s.code) + ' · ' + esc(s.phone) + '</div></div></div>' +
      '<div class="kv"><span class="k">' + esc(AR('الرقم الضريبي', 'Tax number')) + '</span><span class="v num">' + esc(s.tax) + '</span></div>' +
      '<div class="kv"><span class="k">' + esc(AR('شروط السداد', 'Terms')) + '</span><span class="v">' + esc(s.terms + ' ' + AR('يوم', 'days')) + '</span></div>' +
      ui.btn(AR('ملف المورد', 'Supplier file'), { act: 'p-supplier', kind: 'ghost', size: 'sm', data: { id: s.id } }) });

    var payCard = ui.card({ title: AR('الدفع', 'Payment'), body:
      (data.remaining > 0.009
        ? '<div class="kv"><span class="k">' + esc(AR('المتبقي', 'Remaining')) + '</span><span class="v num">' + esc(fmt.money(data.remaining)) + ' ' + cur() + '</span></div>' +
          ui.btn(AR('تسجيل دفعة', 'Record payment'), { act: 'p-pay-sheet', kind: canPay ? 'primary' : 'outline', icon: 'cash', cls: 'btn--block' })
        : '<div class="check-line">' + icon('check', 14) + esc(AR('مدفوعة بالكامل', 'Fully paid')) + '</div>') +
      (data.payments && data.payments.length
        ? '<div style="margin-top:10px">' + data.payments.map(function (p) {
          return '<div class="mini-row"><span class="mr-t">' + esc(p.no) + '<span class="mr-s" style="display:block">' + esc(fmt.date(p.date)) + '</span></span>' +
            '<span class="num">' + esc(fmt.money(p.amount)) + '</span></div>';
        }).join('') + '</div>' : '') });

    var trailCard = ui.card({ title: AR('أثر الحركة', 'Traceability'), body:
      '<div class="mini-list">' +
      (data.movements && data.movements.length
        ? data.movements.map(function (m) {
          return '<div class="mini-row"><span class="mr-t">' + esc(m.doc) + '<span class="mr-s" style="display:block">' + esc(H.product(m.product_id) ? L(H.product(m.product_id)) : '') + '</span></span>' +
            '<span class="num">' + esc(fmt.qty(m.qty)) + '</span></div>';
        }).join('')
        : '<p class="faint" style="font-size:12px">' + esc(AR('لا حركات مخزون بعد — لم تُستلم البضاعة.', 'No stock movements yet — goods not received.')) + '</p>') +
      '</div>' +
      ui.btn(AR('حركات المخزون', 'Open stock ledger'), { act: 'p-go-ledger', kind: 'ghost', size: 'sm' }) });

    var actions = '';
    if (f.mode === 'receive') {
      actions = ui.btn(t('app.cancel'), { act: 'p-receive-cancel' }) +
        ui.btn(AR('تأكيد الاستلام', 'Confirm receipt'), { act: 'p-receive-submit', kind: 'primary', icon: 'check' });
    } else {
      actions = ui.btn(t('app.print'), { act: 'print', icon: 'print' }) +
        (canReceive ? ui.btn(AR('استلام البضاعة', 'Receive goods'), { act: 'p-receive-start', kind: canApprove ? 'outline' : 'primary', icon: 'truck' }) : '') +
        (canApprove && inv.status !== 'financially_approved' ? ui.btn(AR('اعتماد مالي', 'Financial approval'), { act: 'p-approve', kind: 'primary', icon: 'shield' }) : '') +
        (canPay && inv.status === 'financially_approved' ? ui.btn(AR('دفع', 'Pay'), { act: 'p-pay-sheet', kind: 'primary', icon: 'cash' }) : '');
    }

    return '<div class="page-head"><div class="ph-txt">' +
      '<div class="crumbs"><button data-act="nav" data-id="purchasing.invoices" style="color:var(--brand-ink)">' + esc(AR('فواتير الموردين', 'Supplier invoices')) + '</button>' +
      icon('chevStart', 12) + '<span class="num">' + esc(inv.no) + '</span></div>' +
      '<h1 class="page-title num">' + esc(inv.no) + '</h1>' +
      '<p class="page-sub">' + esc(L(s)) + ' · ' + esc(fmt.dateLong(inv.date)) + ' · ' + esc(H.wh(inv.warehouse_id)) + '</p></div>' +
      '<div class="page-actions">' + H.status(inv.status) + actions + '</div></div>' +

      '<section class="card"><div class="card-body" style="padding:14px 18px">' + ui.steps(STEPS(), stepIndex(inv.status)) + '</div></section>' +
      receiveWarning +

      '<div class="grid">' +
      '<div class="c8" style="display:flex;flex-direction:column;gap:16px">' +
      ui.card({ title: AR('الأصناف', 'Line items'), sub: AR('المطلوب مقابل المستلم', 'Ordered vs received'),
        actions: (f.mode === 'receive' ? '<span class="pill pill--brand">' + esc(AR('وضع الاستلام', 'Receive mode')) + '</span>' : ''),
        flush: true,
        body: ui.table({ cols: cols, rows: lines }) +
          '<div style="padding:12px 18px">' + ui.banner({ tone: 'neutral', icon: 'info',
            text: AR('لا يمكن استلام أكثر من المطلوب في أي سطر، ولا يتغيّر المخزون قبل تأكيد الاستلام.',
              'No line can be received beyond the ordered quantity, and stock does not change before receipt is confirmed.') }) + '</div>' }) +
      ui.card({ title: AR('بيانات الفاتورة', 'Invoice details'), body:
        '<div class="kv"><span class="k">' + esc(AR('رقم فاتورة المورد', 'Supplier invoice no.')) + '</span><span class="v num">' + esc(inv.paper_no || '—') + '</span></div>' +
        '<div class="kv"><span class="k">' + esc(AR('المستودع', 'Warehouse')) + '</span><span class="v">' + esc(H.wh(inv.warehouse_id)) + '</span></div>' +
        '<div class="kv"><span class="k">' + esc(AR('أنشأها', 'Created by')) + '</span><span class="v">' + esc(inv.created_by || '—') + '</span></div>' +
        '<div class="kv"><span class="k">' + esc(t('app.notes')) + '</span><span class="v" style="font-weight:400;color:var(--ink-2)">' + esc(inv.notes || '—') + '</span></div>' }) +
      '</div>' +
      '<div class="c4" style="display:flex;flex-direction:column;gap:16px">' + totalsCard + payCard + supplierCard + trailCard + '</div>' +
      '</div>' +
      (f.mode === 'receive'
        ? '<div class="sticky-bar"><div class="bar-total"><span class="k">' + esc(AR('سيُضاف للمخزون', 'Will be added to stock')) + '</span>' +
          '<span class="v num" id="recv-total">' + esc(fmt.qty(recTotal)) + '</span></div><span class="grow"></span>' +
          ui.btn(t('app.cancel'), { act: 'p-receive-cancel' }) +
          ui.btn(AR('تأكيد الاستلام', 'Confirm receipt'), { act: 'p-receive-submit', kind: 'primary', icon: 'check' }) + '</div>'
        : '');
  }

  /* ================= new invoice ================= */
  function blankDraft() {
    return { supplier_id: '', warehouse_id: 'w1', date: U.util.todayISO(), paper_no: '', discount: 0, notes: '', lines: [] };
  }
  function loadNew(ctx) {
    if (!ctx.filters.draft) ctx.filters.draft = blankDraft();
    if (!ctx.filters.draft.lines.length) {
      var p = (U.state.meta.products || [])[0];
      ctx.filters.draft.lines = [{ product_id: p.id, qty: 1, unit_cost: p.cost, discount_pct: 0, note: '' }];
    }
    return Promise.resolve({ draft: ctx.filters.draft });
  }
  function draftTotals(d) {
    var net = U.util.sum(d.lines, function (l) { return Number(l.qty) * Number(l.unit_cost) * (1 - (Number(l.discount_pct) || 0) / 100); });
    net = U.util.round(net - Number(d.discount || 0), 2);
    var vat = U.util.round(U.util.sum(d.lines, function (l) {
      var p = H.product(l.product_id);
      return Number(l.qty) * Number(l.unit_cost) * (1 - (Number(l.discount_pct) || 0) / 100) * ((p.vat || 14) / 100);
    }), 2);
    return { net: net, vat: vat, total: U.util.round(net + vat, 2) };
  }
  function viewNew(ctx, data) {
    var d = data.draft, tot = draftTotals(d);
    var lineCols = [
      { key: 'n', label: '#', cls: 'idx-col', w: '30px', cell: function (l) { return '<span class="num faint">' + (d.lines.indexOf(l) + 1) + '</span>'; } },
      { key: 'item', label: t('app.item'), cls: 'id-col', cell: function (l) {
        return '<select class="input" style="height:34px;min-width:190px;max-width:260px" data-act="n-line" data-line="' + d.lines.indexOf(l) + '" data-field="product_id">' +
          (U.state.meta.products || []).map(function (p) {
            return '<option value="' + esc(p.id) + '"' + (p.id === l.product_id ? ' selected' : '') + '>' + esc(p.sku + ' — ' + L(p)) + '</option>';
          }).join('') + '</select>';
      } },
      { key: 'qty', label: AR('الكمية', 'Qty'), align: 'end', cell: function (l) {
        return '<input class="input input--num" style="height:34px;width:64px" type="number" min="0" step="1" value="' + esc(l.qty) + '" data-act="n-line" data-line="' + d.lines.indexOf(l) + '" data-field="qty">';
      } },
      { key: 'cost', label: AR('سعر الوحدة', 'Unit cost'), align: 'end', cell: function (l) {
        return '<input class="input input--num" style="height:34px;width:86px" type="number" min="0" step="0.01" value="' + esc(l.unit_cost) + '" data-act="n-line" data-line="' + d.lines.indexOf(l) + '" data-field="unit_cost">';
      } },
      { key: 'disc', label: AR('خصم %', 'Disc %'), align: 'end', cell: function (l) {
        return '<input class="input input--num" style="height:34px;width:56px" type="number" min="0" max="100" step="1" value="' + esc(l.discount_pct || 0) + '" data-act="n-line" data-line="' + d.lines.indexOf(l) + '" data-field="discount_pct">';
      } },
      { key: 'net', label: AR('الإجمالي', 'Total'), align: 'end', cell: function (l) {
        return ui.money(Number(l.qty) * Number(l.unit_cost) * (1 - (Number(l.discount_pct) || 0) / 100));
      } },
      { key: 'del', label: '', align: 'end', w: '36px', cell: function (l) {
        return '<button class="icon-btn" data-act="n-remove" data-line="' + d.lines.indexOf(l) + '" aria-label="' + esc(AR('حذف', 'Remove')) + '">' + icon('trash', 15) + '</button>';
      } }
    ];

    return H.head({
      crumb: AR('فاتورة شراء جديدة', 'New purchase invoice'),
      title: AR('فاتورة شراء جديدة', 'New purchase invoice'),
      sub: AR('المخزون لا يتغيّر قبل الاستلام — الأرقام هنا هي المطلوب فقط.', 'Stock does not change before receipt — these numbers are the order, not the stock.'),
      actions: ui.btn(t('app.cancel'), { act: 'p-new-cancel' })
    }) +
      '<div class="grid">' +
      '<div class="c8">' + ui.card({ body: ui.sectionTitle(1, AR('بيانات الفاتورة', 'Invoice details')) +
        '<div class="form-grid">' +
        '<div class="span2">' + ui.field({ label: t('app.supplier'), type: 'select', id: 'n-supplier', req: true,
          options: [{ value: '', label: AR('اختر المورد', 'Choose supplier') }].concat((U.state.meta.suppliers || []).map(function (s) { return { value: s.id, label: L(s) }; })),
          value: d.supplier_id }) + '</div>' +
        ui.field({ label: AR('رقم فاتورة المورد', 'Supplier invoice no.'), id: 'n-paper', value: d.paper_no, placeholder: 'A/1234',
          hint: AR('يظهر في كشف حساب المورد', 'Appears on the supplier statement') }) +
        ui.field({ label: t('app.date'), type: 'date', id: 'n-date', value: d.date }) +
        ui.field({ label: t('app.warehouse'), type: 'select', id: 'n-wh', value: d.warehouse_id,
          options: (U.state.meta.warehouses || []).map(function (w) { return { value: w.id, label: L(w) }; }) }) +
        ui.field({ label: AR('خصم الفاتورة', 'Invoice discount'), type: 'number', id: 'n-disc', value: d.discount, step: '0.01', unit: cur() }) +
        '</div>' }) + '</div>' +
      '<div class="c4">' + ui.card({ title: AR('الإجمالي', 'Totals'), body:
        '<div class="kv"><span class="k">' + esc(AR('قبل الضريبة', 'Subtotal')) + '</span><span class="v num">' + esc(fmt.money(tot.net)) + '</span></div>' +
        '<div class="kv"><span class="k">' + esc(AR('ضريبة القيمة المضافة', 'VAT')) + '</span><span class="v num">' + esc(fmt.money(tot.vat)) + '</span></div>' +
        '<div class="kv" style="border-top:1px solid var(--line);padding-top:10px"><span class="k" style="font-weight:700;color:var(--ink)">' + esc(t('app.total')) + '</span>' +
        '<span class="v num" style="font-size:19px">' + esc(fmt.money(tot.total)) + ' ' + cur() + '</span></div>' +
        '<div style="margin-top:12px">' + ui.banner({ tone: 'warn', icon: 'alert', text: AR('الحفظ ينشئ الفاتورة «بانتظار الاستلام». المخزون يزيد عند تأكيد أمين المخزن، والدفع بعد الاعتماد المالي.',
          'Saving creates the invoice as “awaiting receipt”. Stock increases when the storekeeper confirms, and payment follows financial approval.') }) + '</div>' }) + '</div>' +
      '<div class="c12">' + ui.card({ body: ui.sectionTitle(2, AR('الأصناف', 'Items'),
        ui.btn(AR('إضافة صنف', 'Add item'), { act: 'n-add', kind: 'soft', size: 'sm', icon: 'plus' })) +
        ui.table({ cols: lineCols, rows: d.lines }) +
        '<div style="margin-top:12px">' + ui.banner({ tone: 'info', icon: 'info',
          text: AR('الأصناف الجديدة تُنشأ من داخل الفاتورة بدون رصيد افتتاحي — الفاتورة نفسها هي مصدر المخزون.',
            'New items are created inside the invoice without opening stock — the purchase is the stock source.') }) + '</div>' }) + '</div>' +
      '<div class="c12">' + ui.card({ body: ui.sectionTitle(3, AR('ملاحظات', 'Notes')) +
        ui.field({ label: AR('ملاحظة داخلية (اختياري)', 'Internal note (optional)'), type: 'textarea', id: 'n-notes', value: d.notes, rows: 2 }) }) + '</div>' +
      '</div>' +
      '<div class="sticky-bar"><div class="bar-total"><span class="k">' + esc(t('app.total')) + '</span>' +
      '<span class="v num">' + esc(fmt.money(tot.total)) + ' ' + cur() + '</span></div><span class="grow"></span>' +
      ui.btn(AR('حفظ كمسودة', 'Save as draft'), { act: 'n-save-draft' }) +
      ui.btn(AR('حفظ وإرسال للاستلام', 'Save & send to receipt'), { act: 'n-save-post', kind: 'primary', icon: 'check' }) + '</div>';
  }

  /* ================= sheets ================= */
  function paySheet(ctx) {
    var root = document.querySelector('.uerp');
    if (root.querySelector('[data-ovl="pay"]')) return;
    var d = ctx.data;
    var treasuries = d.treasuries || [];
    var body = '<div class="form-grid">' +
      '<div class="span2">' + ui.field({ label: AR('من خزينة', 'From treasury'), type: 'select', id: 'pay-treasury',
        options: treasuries.map(function (tr) { return { value: tr.id, label: L(tr) + ' — ' + fmt.money(tr.balance) + ' ' + cur() }; }) }) + '</div>' +
      ui.field({ label: AR('المبلغ', 'Amount'), type: 'number', id: 'pay-amount', value: d.remaining, step: '0.01', unit: cur() }) +
      ui.field({ label: t('app.date'), type: 'date', id: 'pay-date', value: U.util.todayISO() }) +
      '</div>' +
      '<div id="pay-error"></div>' +
      ui.banner({ tone: 'info', icon: 'info', text: AR('الدفع لا يتجاوز المتبقي (' + fmt.money(d.remaining) + ' ج.م). يُخصم من الخزينة المختارة ويُسجَّل في أستاذ المورد.',
        'A payment cannot exceed the remaining ' + fmt.money(d.remaining) + ' EGP. It is deducted from the chosen treasury and posted to the supplier ledger.') });
    root.insertAdjacentHTML('beforeend', ui.overlay({
      id: 'pay', title: AR('تسجيل دفعة', 'Record payment'), sub: d.invoice.no,
      body: body,
      foot: '<span class="grow"></span>' + ui.btn(t('app.cancel'), { act: 'close-pay' }) +
        ui.btn(AR('تأكيد الدفع', 'Confirm payment'), { act: 'pay-submit', kind: 'primary' })
    }));
  }

  /* ================= actions ================= */
  var A = {
    'p-tab': function (ctx, el) { ctx.filters.status = el.getAttribute('data-id'); ctx.filters.page = 1; ctx.reload(); },
    'p-range': function (ctx, el) { ctx.filters.range = el.getAttribute('data-id'); ctx.reload(); },
    'p-page': function (ctx, el) { ctx.filters.page = Number(el.getAttribute('data-page')) || 1; ctx.reload(); },
    'p-page-size': function (ctx, el) { ctx.filters.size = Number(el.value); ctx.filters.page = 1; ctx.reload(); },
    'p-open': function (ctx, el) { U.go('purchasing.invoice', { id: el.getAttribute('data-id') }); },
    'p-new': function (ctx) { U.filters['purchasing.new'] = { draft: blankDraft() }; U.go('purchasing.new'); },
    'p-new-cancel': function () { U.go('purchasing.invoices'); },
    'p-supplier': function (ctx, el) { U.go('purchasing.supplier', { id: el.getAttribute('data-id') }); },
    'p-sup-tab': function (ctx, el) { ctx.filters.tab = el.getAttribute('data-id'); ctx.reload(); },
    'p-receive-start': function (ctx) { ctx.filters.mode = 'receive'; ctx.reload(); },
    'p-receive-cancel': function (ctx) { ctx.filters.mode = 'view'; ctx.reload(); },
    'p-recv-input': function (ctx, el) {
      var sum = 0;
      document.querySelectorAll('.uerp [data-act="p-recv-input"]').forEach(function (i) { sum += Math.abs(Number(i.value || 0)); });
      var t2 = document.getElementById('recv-total');
      if (t2) t2.textContent = fmt.qty(sum);
    },
    'p-receive-submit': function (ctx) {
      var lines = [];
      var bad = null;
      document.querySelectorAll('.uerp [data-act="p-recv-input"]').forEach(function (i) {
        var v = Number(i.value || 0);
        if (v < 0) bad = AR('الكمية لا تكون سالبة.', 'A quantity cannot be negative.');
        lines.push({ line_id: i.getAttribute('data-line'), received_qty: v });
      });
      if (bad) { ui.toast(bad, 'bad'); return; }
      U.api.call('erp_purchase_receive', { id: ctx.params.id, lines: lines, client_ref: U.util.uid('ref') })
        .then(function () {
          ctx.filters.mode = 'view';
          ui.toast(AR('تم استلام البضاعة وتحديث المخزون', 'Goods received and stock updated'), 'ok');
          ctx.reload();
        })
        .catch(function (e) { ui.toast(e.message, 'bad'); });
    },
    'p-approve': function (ctx) {
      U.api.call('erp_purchase_approve', { id: ctx.params.id })
        .then(function () { ui.toast(AR('تم الاعتماد المالي', 'Financially approved'), 'ok'); ctx.reload(); })
        .catch(function (e) { ui.toast(e.message, 'bad'); });
    },
    'p-pay-sheet': function (ctx) { paySheet(ctx); },
    'close-pay': function () { var el = document.querySelector('.uerp [data-ovl="pay"]'); if (el) el.remove(); },
    'pay-submit': function (ctx) {
      var root = document.querySelector('.uerp');
      var err = root.querySelector('#pay-error');
      var amount = Number(root.querySelector('#pay-amount').value || 0);
      U.api.call('erp_purchase_pay', { id: ctx.params.id, amount: amount, treasury_id: root.querySelector('#pay-treasury').value,
        date: root.querySelector('#pay-date').value, method: 'cash' })
        .then(function () {
          root.querySelector('[data-ovl="pay"]').remove();
          ui.toast(AR('تم تسجيل الدفعة', 'Payment recorded'), 'ok');
          ctx.reload();
        })
        .catch(function (e) { err.innerHTML = ui.banner({ tone: 'bad', icon: 'alert', title: AR('لم تُسجَّل الدفعة', 'Payment refused'), text: e.message }); });
    },
    'p-go-ledger': function () { U.filters['inventory.ledger'] = { range: 'month', group: 'purchase', page: 1, size: 25, q: '' }; U.go('inventory.ledger'); },
    'n-add': function (ctx) {
      var d = ctx.filters.draft;
      var p = (U.state.meta.products || [])[0];
      d.lines.push({ product_id: p.id, qty: 1, unit_cost: p.cost, discount_pct: 0, note: '' });
      ctx.reload();
    },
    'n-remove': function (ctx, el) {
      var d = ctx.filters.draft;
      d.lines.splice(Number(el.getAttribute('data-line')), 1);
      if (!d.lines.length) A['n-add'](ctx);
      ctx.reload();
    },
    'n-line': function (ctx, el) {
      var d = ctx.filters.draft;
      var i = Number(el.getAttribute('data-line'));
      var fld = el.getAttribute('data-field');
      var l = d.lines[i];
      if (!l) return;
      if (fld === 'product_id') {
        l.product_id = el.value;
        l.unit_cost = H.product(el.value).cost || l.unit_cost;
      } else {
        l[fld] = Number(el.value || 0);
      }
      ctx.reload();
    },
    'n-field': function (ctx, el) {
      var d = ctx.filters.draft;
      var map = { 'n-supplier': 'supplier_id', 'n-paper': 'paper_no', 'n-date': 'date', 'n-wh': 'warehouse_id', 'n-disc': 'discount', 'n-notes': 'notes' };
      var k = map[el.id];
      if (!k) return;
      d[k] = el.id === 'n-disc' ? Number(el.value || 0) : el.value;
    },
    'n-save-draft': function (ctx) { saveNew(ctx, false); },
    'n-save-post': function (ctx) { saveNew(ctx, true); },
    'p-export': function (ctx) {
      var rows = [[AR('رقم الفاتورة', 'Invoice'), AR('المورد', 'Supplier'), t('app.date'), AR('الإجمالي', 'Total'), AR('المدفوع', 'Paid'), AR('الحالة', 'Status')]];
      (ctx.data.list.rows || []).forEach(function (r) {
        rows.push([r.no, L(H.supplier(r.supplier_id)), r.date, (r.total + r.vat).toFixed(2), r.paid.toFixed(2), r.status]);
      });
      U.util.download('uno-purchase-invoices-' + U.util.todayISO() + '.csv', U.util.csv(rows));
      ui.toast(AR('تم التصدير', 'Exported'), 'ok');
    },
    'p-export-suppliers': function (ctx) {
      var rows = [[AR('الكود', 'Code'), AR('المورد', 'Supplier'), AR('الهاتف', 'Phone'), AR('الرصيد', 'Balance')]];
      (ctx.data.rows || []).forEach(function (r) { rows.push([r.code, L(r), r.phone, r.balance]); });
      U.util.download('uno-suppliers-' + U.util.todayISO() + '.csv', U.util.csv(rows));
      ui.toast(AR('تم التصدير', 'Exported'), 'ok');
    },
    'p-pay-supplier': function (ctx) { ui.toast(AR('الدفع من ملف المورد يأتي في المرحلة التالية', 'Supplier-level payment lands in the next pass'), 'warn'); }
  };

  function saveNew(ctx, post) {
    var d = ctx.filters.draft;
    if (!d.supplier_id) { ui.toast(AR('اختر المورد أولًا', 'Choose the supplier first'), 'bad'); return; }
    if (!d.lines.length) { ui.toast(AR('أضف صنفًا واحدًا على الأقل', 'Add at least one item'), 'bad'); return; }
    U.api.call('erp_purchase_create', { payload: Object.assign({}, d, { post: post }), client_ref: U.util.uid('ref') })
      .then(function (res) {
        ui.toast(post ? AR('أُنشئت الفاتورة بانتظار الاستلام', 'Invoice created, awaiting receipt') : AR('حُفظت كمسودة', 'Saved as draft'), 'ok');
        U.filters['purchasing.new'] = null;
        U.go('purchasing.invoice', { id: res.invoice.id });
      })
      .catch(function (e) { ui.toast(e.message, 'bad'); });
  }

  /* change handler for the new-invoice form fields */
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (!el || !el.id) return;
    if (['n-supplier', 'n-paper', 'n-date', 'n-wh', 'n-disc', 'n-notes'].indexOf(el.id) < 0) return;
    if (U.state.route && U.state.route.screenId === 'purchasing.new' && A['n-field']) {
      A['n-field']({ filters: U.filters['purchasing.new'], reload: function () {} }, el);
    }
  }, true);

  U.actions = Object.assign(U.actions || {}, A);

  U.registerModule({
    id: 'purchasing',
    group: 'purchasing',
    nav: [
      { group: 'purchasing', screen: 'purchasing.invoices', label: { ar: 'فواتير الموردين', en: 'Supplier invoices' }, icon: 'doc', order: 10 },
      { group: 'purchasing', screen: 'purchasing.suppliers', label: { ar: 'الموردون', en: 'Suppliers' }, icon: 'users', order: 20 }
    ],
    screens: [
      { id: 'purchasing.invoices', title: { ar: 'فواتير الموردين', en: 'Supplier invoices' }, load: P.loadInvoices, view: P.viewInvoices, actions: A },
      { id: 'purchasing.invoice', title: { ar: 'فاتورة مشتريات', en: 'Purchase invoice' }, load: loadInvoice, view: viewInvoice, actions: A },
      { id: 'purchasing.suppliers', title: { ar: 'الموردون', en: 'Suppliers' }, load: P.loadSuppliers, view: P.viewSuppliers, actions: A },
      { id: 'purchasing.supplier', title: { ar: 'ملف المورد', en: 'Supplier file' }, load: P.loadSupplier, view: P.viewSupplier, actions: A },
      { id: 'purchasing.new', title: { ar: 'فاتورة شراء جديدة', en: 'New purchase invoice' }, load: loadNew, view: viewNew, actions: A }
    ]
  });
})();
