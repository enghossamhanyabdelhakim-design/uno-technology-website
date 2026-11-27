/*!
 * UNO Core ERP — Inventory module (erp-inventory.js)
 * Screens: stock ledger, balances, count sheet, item card.
 * RPCs used: erp_meta, erp_stock_summary, erp_stock_ledger, erp_stock_balances,
 *            erp_stock_reconcile, erp_item_card, erp_stock_move, erp_stock_count
 * No table writes. Every quantity change goes through stock_move.
 */
(function () {
  'use strict';
  var U = window.UnoERP;
  if (!U || !U.__kernel) { if (window.console) console.warn('[UnoERP] erp-kernel.js must load before this module'); return; }
  var ui = U.ui, t = U.t, L = U.L, esc = U.esc, fmt = U.fmt, icon = U.icon;
  var cur = function () { return t('app.currency'); };

  /* ---------------- shared helpers ---------------- */
  var H = {};

  H.range = function (f) {
    var today = new Date();
    function d(offset) { var x = new Date(today.getTime()); x.setDate(x.getDate() + offset); return x.toISOString().slice(0, 10); }
    switch (f.range || 'month') {
      case 'today': return { from: d(0), to: d(0) };
      case 'yesterday': return { from: d(-1), to: d(-1) };
      case 'week': return { from: d(-6), to: d(0) };
      case 'month': return { from: d(-29), to: d(0) };
      case 'lastMonth': return { from: d(-59), to: d(-30) };
      case 'year': return { from: d(-364), to: d(0) };
      default: return { from: null, to: null };
    }
  };

  H.rangeLabel = function (f) {
    var map = { today: 'app.today', yesterday: 'app.yesterday', week: 'app.week', month: 'app.month', lastMonth: 'app.lastMonth', year: 'app.year', all: 'app.allTime' };
    return t(map[f.range || 'month'] || 'app.month');
  };

  H.sourcePill = function (type) {
    var lab = (U.demo.labels && U.demo.labels.source[type]) || { ar: type, en: type, tone: 'neutral' };
    return ui.pill(L(lab), lab.tone);
  };

  H.productCell = function (pid, withSku) {
    var p = (U.state.meta && U.state.meta.products || []).filter(function (x) { return x.id === pid; })[0] || {};
    return '<div class="id-cell"><div style="min-width:0"><div class="id-t">' + esc(L(p) || pid) + '</div>' +
      (withSku === false ? '' : '<div class="id-s num">' + esc(p.sku || '') + '</div>') + '</div></div>';
  };

  H.whName = function (id) {
    var w = (U.state.meta && U.state.meta.warehouses || []).filter(function (x) { return x.id === id; })[0];
    return w ? L(w) : id;
  };

  H.branchOf = function (whId) {
    var w = (U.state.meta && U.state.meta.warehouses || []).filter(function (x) { return x.id === whId; })[0];
    var b = w && (U.state.meta.branches || []).filter(function (x) { return x.id === w.branch_id; })[0];
    return b ? L(b) : '';
  };

  H.warehouseOptions = function (includeAll) {
    var out = includeAll ? [{ value: '', label: t('app.allWarehouses') }] : [];
    return out.concat(((U.state.meta && U.state.meta.warehouses) || []).map(function (w) {
      return { value: w.id, label: L(w) };
    }));
  };

  H.productOptions = function () {
    return ((U.state.meta && U.state.meta.products) || []).map(function (p) {
      return { value: p.id, label: p.sku + ' — ' + L(p) };
    });
  };

  H.header = function (ctx, o) {
    return '<div class="page-head"><div class="ph-txt">' +
      '<div class="crumbs"><span>' + esc(ctx.lang === 'ar' || U.state.lang === 'ar' ? 'الرئيسية' : 'Home') + '</span>' + icon('chevStart', 12) +
      '<span>' + esc(L({ ar: 'المخزون', en: 'Inventory' })) + '</span>' + icon('chevStart', 12) +
      '<span>' + esc(o.crumb || '') + '</span></div>' +
      '<h1 class="page-title">' + esc(o.title) + '</h1>' +
      (o.sub ? '<p class="page-sub">' + esc(o.sub) + '</p>' : '') + '</div>' +
      '<div class="page-actions">' + (o.actions || '') + '</div></div>';
  };

  /* ---------------- ledger ---------------- */
  function loadLedger(ctx) {
    var f = ctx.filters;
    if (!f.range) f.range = 'month';
    if (!f.group) f.group = 'all';
    if (!f.page) f.page = 1;
    if (!f.size) f.size = 25;
    var r = H.range(f);
    var base = { from: r.from, to: r.to, warehouse_id: f.warehouse || null, q: f.q || '', page: f.page, page_size: f.size };
    return Promise.all([
      U.api.call('erp_stock_ledger', Object.assign({}, base, { source_group: f.group })),
      U.api.call('erp_stock_summary', { from: r.from, to: r.to }),
      U.api.call('erp_stock_reconcile', {}),
      U.api.call('erp_stock_ledger', Object.assign({}, base, { source_group: 'all', page: 1, page_size: 100000 }))
    ]).then(function (res) {
      var all = res[3].rows || [];
      var counts = {
        all: all.length,
        in: all.filter(function (m) { return m.qty > 0; }).length,
        out: all.filter(function (m) { return m.qty < 0; }).length,
        purchase: all.filter(function (m) { return m.source_type === 'purchase' || m.source_type === 'purchase_return'; }).length,
        sale: all.filter(function (m) { return m.source_type === 'sale' || m.source_type === 'sale_return'; }).length,
        transfer: all.filter(function (m) { return m.source_type === 'transfer_in' || m.source_type === 'transfer_out'; }).length,
        adjust: all.filter(function (m) { return m.source_type === 'count_adjust' || m.source_type === 'waste'; }).length
      };
      return { ledger: res[0], summary: res[1], reconcile: res[2], counts: counts };
    });
  }

  function viewLedger(ctx, data) {
    var f = ctx.filters, d = data.ledger, s = data.summary;
    var spark = (s.series || []).slice(-14).map(function (x) { return x.in - x.out; });

    var tabs = ui.tabs([
      { id: 'all', label: t('app.all'), count: data.counts.all },
      { id: 'in', label: U.state.lang === 'ar' ? 'وارد' : 'In', count: data.counts.in },
      { id: 'out', label: U.state.lang === 'ar' ? 'صادر' : 'Out', count: data.counts.out },
      { id: 'purchase', label: U.state.lang === 'ar' ? 'مشتريات' : 'Purchases', count: data.counts.purchase },
      { id: 'sale', label: U.state.lang === 'ar' ? 'مبيعات' : 'Sales', count: data.counts.sale },
      { id: 'transfer', label: U.state.lang === 'ar' ? 'تحويلات' : 'Transfers', count: data.counts.transfer },
      { id: 'adjust', label: U.state.lang === 'ar' ? 'تسويات وهالك' : 'Adjustments', count: data.counts.adjust }
    ], f.group, 'tab-group');

    var cols = [
      { key: 'doc', label: t('app.doc'), cls: 'doc-col', cell: function (m) {
        return '<div class="id-cell"><div style="min-width:0"><div class="doc-no">' + esc(m.doc) + '</div>' +
          '<div class="id-s">' + H.sourcePill(m.source_type) + '</div></div></div>';
      } },
      { key: 'product', label: t('app.item'), cls: 'id-col', cell: function (m) { return H.productCell(m.product_id); } },
      { key: 'date', label: t('app.date'), cell: function (m) { return '<span class="num">' + esc(fmt.date(m.date)) + '</span>'; } },
      { key: 'wh', label: t('app.warehouse'), cell: function (m) { return '<span class="faint">' + esc(H.whName(m.warehouse_id)) + '</span>'; } },
      { key: 'in', label: U.state.lang === 'ar' ? 'وارد' : 'In', align: 'end', cell: function (m) { return m.qty > 0 ? '<span class="num" style="color:var(--ok-ink);font-weight:600">' + esc(fmt.qty(m.qty)) + '</span>' : '<span class="faint">—</span>'; } },
      { key: 'out', label: U.state.lang === 'ar' ? 'صادر' : 'Out', align: 'end', cell: function (m) { return m.qty < 0 ? '<span class="num" style="color:var(--bad-ink);font-weight:600">' + esc(fmt.qty(Math.abs(m.qty))) + '</span>' : '<span class="faint">—</span>'; } },
      { key: 'bal', label: U.state.lang === 'ar' ? 'الرصيد بعد' : 'Balance after', align: 'end', cell: function (m) { return '<span class="num">' + esc(fmt.qty(m.balance_after)) + '</span>'; } },
      { key: 'cost', label: U.state.lang === 'ar' ? 'تكلفة الوحدة' : 'Unit cost', align: 'end', cell: function (m) { return '<span class="num faint">' + esc(fmt.money(m.unit_cost)) + '</span>'; } },
      { key: 'val', label: U.state.lang === 'ar' ? 'القيمة (ج.م)' : 'Value (EGP)', align: 'end', cell: function (m) { return ui.money(m.value); } },
      { key: 'act', label: '', align: 'end', cls: 'act-col', w: '40px', cell: function () { return '<span class="row-act">' + icon('more', 16) + '</span>'; } }
    ];

    var filterCount = (f.warehouse ? 1 : 0) + (f.q ? 1 : 0) + (f.range !== 'month' ? 1 : 0);

    return H.header(ctx, {
      crumb: U.state.lang === 'ar' ? 'حركات المخزون' : 'Stock ledger',
      title: U.state.lang === 'ar' ? 'حركات المخزون' : 'Stock ledger',
      sub: U.state.lang === 'ar'
        ? 'كل تغيير في الكمية يُسجَّل هنا. الرصيد محسوب من الحركات ولا يُعدَّل يدويًا أبدًا.'
        : 'Every quantity change is recorded here. Balances are derived from movements and never edited by hand.',
      actions: ui.btn(t('app.export'), { act: 'export-ledger', icon: 'download' }) +
        ui.iconBtn('print', { act: 'print', title: t('app.print') }) +
        ui.btn(U.state.lang === 'ar' ? 'تسوية يدوية' : 'Manual adjustment', { act: 'open-move', kind: 'primary', icon: 'plus' })
    }) +
      '<div class="kpis">' +
      ui.kpi({ label: U.state.lang === 'ar' ? 'قيمة المخزون بالتكلفة' : 'Stock value at cost', value: fmt.money(s.stock_value), cur: true,
        note: U.state.lang === 'ar' ? 'محسوبة بمتوسط التكلفة المتحرك' : 'Moving-average cost', spark: spark }) +
      ui.kpi({ label: U.state.lang === 'ar' ? 'حركات الفترة' : 'Movements in range', value: fmt.num(s.movement_count),
        note: H.rangeLabel(f), spark: spark }) +
      ui.kpi({ label: U.state.lang === 'ar' ? 'قيمة الوارد' : 'Value in', value: fmt.money(s.in_value), cur: true,
        note: U.state.lang === 'ar' ? 'مشتريات + تحويلات + تسويات' : 'Purchases + transfers + counts', spark: spark, sparkTone: 'ok' }) +
      ui.kpi({ label: U.state.lang === 'ar' ? 'أصناف تحت الحد الأدنى' : 'Items below minimum', value: fmt.num(s.low_count),
        note: U.state.lang === 'ar' ? 'راجع شاشة الأرصدة' : 'See balances screen', spark: spark, sparkTone: 'warn' }) +
      '</div>' +

      (data.reconcile && data.reconcile.ok
        ? ui.banner({ tone: 'ok', icon: 'check', text: (U.state.lang === 'ar'
          ? 'تحقق آلي: مجموع الحركات يساوي الرصيد المحفوظ في ' + fmt.num(data.reconcile.checked) + ' رصيد (صنف × مستودع).'
          : 'Automatic check: movement sum equals the cached balance across ' + fmt.num(data.reconcile.checked) + ' item/warehouse balances.') })
        : ui.banner({ tone: 'bad', icon: 'alert', title: U.state.lang === 'ar' ? 'فرق بين الحركات والرصيد' : 'Ledger and balance disagree',
          text: (data.reconcile ? data.reconcile.mismatches.length : 0) + (U.state.lang === 'ar' ? ' رصيد يحتاج مراجعة.' : ' balances need review.') })) +

      '<section class="card">' +
      '<div style="padding:0 18px">' + tabs + '</div>' +
      '<div class="toolbar">' +
      '<div class="search-inline">' + icon('search', 16) +
      '<input data-act="search" data-filter="q" value="' + esc(f.q || '') + '" placeholder="' + esc(U.state.lang === 'ar' ? 'ابحث برقم المستند أو الصنف…' : 'Search document or item…') + '"></div>' +
      '<select class="select" data-filter="warehouse">' + H.warehouseOptions(true).map(function (o) {
        return '<option value="' + esc(o.value) + '"' + ((f.warehouse || '') === o.value ? ' selected' : '') + '>' + esc(o.label) + '</option>';
      }).join('') + '</select>' +
      '<div class="segmented">' + [['today', 'app.today'], ['week', 'app.week'], ['month', 'app.month'], ['year', 'app.year']].map(function (p) {
        return '<button class="seg' + (f.range === p[0] ? ' is-active' : '') + '" data-act="range" data-id="' + p[0] + '">' + esc(t(p[1])) + '</button>';
      }).join('') + '</div>' +
      '<span class="grow"></span>' +
      ui.btn(U.state.lang === 'ar' ? 'كثافة' : 'Density', { act: 'toggle-density', kind: 'ghost', icon: 'sliders', size: 'sm' }) +
      '</div>' +
      '<div class="filters-bar">' +
      (f.range !== 'month' ? ui.chip(t('app.date'), H.rangeLabel(f), 'clear-range') : '') +
      (f.warehouse ? ui.chip(t('app.warehouse'), H.whName(f.warehouse), 'clear-warehouse') : '') +
      (f.q ? ui.chip(U.state.lang === 'ar' ? 'بحث' : 'Search', f.q, 'clear-q') : '') +
      '<span class="faint" style="font-size:11.5px">' + esc(t('app.filters')) + (filterCount ? ' · ' + filterCount : '') + '</span>' +
      '<span class="grow"></span>' +
      '<span class="faint" style="font-size:11.5px">' + esc(U.state.lang === 'ar' ? 'الأرقام بالجنيه المصري' : 'Amounts in EGP') + '</span>' +
      '</div>' +
      ui.table({ cols: cols, rows: d.rows, rowId: function (m) { return m.id; }, rowAct: 'open-item', selectable: false }) +
      ui.totalsStrip([
        { label: U.state.lang === 'ar' ? 'حركات' : 'Movements', value: fmt.num(d.totals.count) },
        { label: U.state.lang === 'ar' ? 'وارد' : 'In', value: fmt.qty(d.totals.in_qty) + ' · ' + fmt.money(d.totals.in_value) },
        { label: U.state.lang === 'ar' ? 'صادر' : 'Out', value: fmt.qty(d.totals.out_qty) + ' · ' + fmt.money(d.totals.out_value) },
        { label: U.state.lang === 'ar' ? 'صافي الحركة' : 'Net movement', value: fmt.money(d.totals.in_value - d.totals.out_value) }
      ], U.state.lang === 'ar' ? 'الرصيد محسوب من الحركات' : 'Balances derived from movements') +
      ui.pager({ page: d.page, size: d.page_size, count: d.count, act: 'page' }) +
      '</section>';
  }

  /* ---------------- balances ---------------- */
  function loadBalances(ctx) {
    var f = ctx.filters;
    return U.api.call('erp_stock_balances', { warehouse_id: f.warehouse || null, q: f.q || '', low_only: !!f.low, as_of: f.as_of || null }).then(function (res) {
      var groups = {};
      (res.rows || []).forEach(function (r) { (groups[r.warehouse_id] = groups[r.warehouse_id] || []).push(r); });
      var grouped = Object.keys(groups).map(function (w) {
        var rows = groups[w];
        return { label: H.whName(w), meta: fmt.money(U.util.sum(rows, function (x) { return x.cost_value; })) + ' ' + cur(), rows: rows, wid: w };
      });
      return { res: res, grouped: grouped };
    });
  }

  function viewBalances(ctx, data) {
    var f = ctx.filters, res = data.res;
    var cols = [
      { key: 'item', label: t('app.item'), cls: 'id-col', cell: function (r) { return H.productCell(r.product_id); } },
      { key: 'qty', label: U.state.lang === 'ar' ? 'الرصيد' : 'On hand', align: 'end', cell: function (r) { return '<span class="num" style="font-weight:600">' + esc(fmt.qty(r.qty)) + '</span>'; } },
      { key: 'avg', label: U.state.lang === 'ar' ? 'متوسط التكلفة' : 'Avg cost', align: 'end', cell: function (r) { return '<span class="num faint">' + esc(fmt.money(r.avg_cost)) + '</span>'; } },
      { key: 'cost', label: U.state.lang === 'ar' ? 'قيمة التكلفة (ج.م)' : 'Cost value (EGP)', align: 'end', cell: function (r) { return ui.money(r.cost_value); } },
      { key: 'retail', label: U.state.lang === 'ar' ? 'قيمة البيع (ج.م)' : 'Retail value (EGP)', align: 'end', cell: function (r) { return '<span class="num">' + esc(fmt.money(r.retail_value)) + '</span>'; } },
      { key: 'margin', label: U.state.lang === 'ar' ? 'الهامش المتوقع' : 'Expected margin', align: 'end', cell: function (r) {
        var pct = r.retail_value ? (r.margin / r.retail_value) * 100 : 0;
        return '<span class="num">' + esc(fmt.money(r.margin)) + '</span> <span class="faint" style="font-size:11px">' + esc(fmt.pct(pct, 0)) + '</span>';
      } },
      { key: 'min', label: U.state.lang === 'ar' ? 'الحد الأدنى' : 'Min', align: 'end', cell: function (r) { return '<span class="num faint">' + esc(fmt.qty(r.min_qty)) + '</span>'; } },
      { key: 'status', label: t('app.status'), cell: function (r) {
        return r.status === 'ok' ? ui.pill(U.state.lang === 'ar' ? 'متوفر' : 'In stock', 'ok')
          : r.status === 'low' ? ui.pill(U.state.lang === 'ar' ? 'تحت الحد' : 'Low', 'warn')
          : ui.pill(U.state.lang === 'ar' ? 'نافد' : 'Out', 'bad');
      } }
    ];

    return H.header(ctx, {
      crumb: U.state.lang === 'ar' ? 'الأرصدة' : 'Balances',
      title: U.state.lang === 'ar' ? 'أرصدة المخزون' : 'Stock balances',
      sub: U.state.lang === 'ar'
        ? 'رصيد كل صنف في كل مستودع، بالتكلفة والبيع. تُستخدم لتقييم المخزون ومطابقة حساب المخزون.'
        : 'Every item in every warehouse, at cost and retail. Used for inventory valuation and account reconciliation.',
      actions: ui.btn(t('app.export'), { act: 'export-balances', icon: 'download' }) + ui.iconBtn('print', { act: 'print', title: t('app.print') })
    }) +
      '<div class="kpis">' +
      ui.kpi({ label: f.as_of ? (U.state.lang === 'ar' ? 'قيمة المخزون بتاريخ ' + fmt.date(f.as_of) : 'Inventory at cost on ' + fmt.date(f.as_of))
        : (U.state.lang === 'ar' ? 'قيمة المخزون بالتكلفة' : 'Inventory at cost'), value: fmt.money(res.totals.cost_value), cur: true,
        note: f.as_of ? (U.state.lang === 'ar' ? 'الكميات محسوبة من الحركات حتى هذا التاريخ' : 'Quantities computed from movements up to that date')
          : (U.state.lang === 'ar' ? 'يجب أن يساوي حساب المخزون في القيود' : 'Must equal the inventory account in the ledger') }) +
      ui.kpi({ label: U.state.lang === 'ar' ? 'قيمة البيع' : 'At retail', value: fmt.money(res.totals.retail_value), cur: true,
        note: U.state.lang === 'ar' ? 'لو بِعت كل الرصيد بسعر القائمة' : 'If all stock sold at list price' }) +
      ui.kpi({ label: U.state.lang === 'ar' ? 'الهامش المتوقع' : 'Expected margin', value: fmt.pct(res.totals.retail_value ? res.totals.margin / res.totals.retail_value * 100 : 0, 1),
        note: fmt.money(res.totals.margin) + ' ' + cur() }) +
      ui.kpi({ label: U.state.lang === 'ar' ? 'أصناف تحت الحد' : 'Below minimum', value: fmt.num(res.totals.low),
        note: U.state.lang === 'ar' ? 'تحتاج إعادة طلب' : 'Need reordering' }) +
      '</div>' +
      '<section class="card">' +
      '<div class="toolbar">' +
      '<div class="search-inline">' + icon('search', 16) +
      '<input data-act="search" data-filter="q" value="' + esc(f.q || '') + '" placeholder="' + esc(U.state.lang === 'ar' ? 'ابحث بالصنف أو الكود…' : 'Search item or SKU…') + '"></div>' +
      '<select class="select" data-filter="warehouse">' + H.warehouseOptions(true).map(function (o) {
        return '<option value="' + esc(o.value) + '"' + ((f.warehouse || '') === o.value ? ' selected' : '') + '>' + esc(o.label) + '</option>';
      }).join('') + '</select>' +
      '<label class="switch"><input type="checkbox" data-filter="low"' + (f.low ? ' checked' : '') + '><span class="track"></span>' +
      '<span class="switch-lbl">' + esc(U.state.lang === 'ar' ? 'تحت الحد فقط' : 'Below minimum only') + '</span></label>' +
      '<span class="faint" style="font-size:12px">' + esc(U.state.lang === 'ar' ? 'بتاريخ' : 'As of') + '</span>' +
      '<input type="date" class="select num" data-filter="as_of" value="' + esc(f.as_of || '') + '" style="width:150px">' +
      (f.as_of ? ui.btn(U.state.lang === 'ar' ? 'اليوم' : 'Today', { act: 'clear-asof', kind: 'ghost' }) : '') +
      '<span class="grow"></span>' +
      '<span class="faint" style="font-size:11.5px">' + esc(U.state.lang === 'ar' ? 'مرتبة حسب كود الصنف' : 'Sorted by SKU') + '</span>' +
      '</div>' +
      ui.table({ cols: cols, groups: data.grouped, rowId: function (r) { return r.product_id + '|' + r.warehouse_id; }, rowAct: 'open-item',
        empty: ui.empty({ title: U.state.lang === 'ar' ? 'لا أرصدة مطابقة' : 'No balances match', hint: t('app.emptyHint'), icon: 'box' }) }) +
      ui.totalsStrip([
        { label: U.state.lang === 'ar' ? 'إجمالي التكلفة' : 'Total cost', value: fmt.money(res.totals.cost_value) },
        { label: U.state.lang === 'ar' ? 'إجمالي البيع' : 'Total retail', value: fmt.money(res.totals.retail_value) },
        { label: U.state.lang === 'ar' ? 'الهامش' : 'Margin', value: fmt.money(res.totals.margin) }
      ], U.state.lang === 'ar' ? 'التقييم بمتوسط التكلفة المتحرك' : 'Valued at moving-average cost') +
      '</section>';
  }

  /* ---------------- item card ---------------- */
  function loadItem(ctx) {
    var id = ctx.params.id || ctx.filters.product;
    if (!id) return Promise.reject(new Error(U.state.lang === 'ar' ? 'لم يتم تحديد صنف' : 'No item selected'));
    return U.api.call('erp_item_card', { product_id: id });
  }

  function viewItem(ctx, data) {
    var p = data.product;
    var moves = data.movements || [];
    var cols = [
      { key: 'doc', label: t('app.doc'), cls: 'doc-col', cell: function (m) { return '<div class="doc-no">' + esc(m.doc) + '</div><div class="id-s">' + H.sourcePill(m.source_type) + '</div>'; } },
      { key: 'date', label: t('app.date'), cell: function (m) { return '<span class="num">' + esc(fmt.date(m.date)) + '</span>'; } },
      { key: 'wh', label: t('app.warehouse'), cell: function (m) { return '<span class="faint">' + esc(H.whName(m.warehouse_id)) + '</span>'; } },
      { key: 'in', label: U.state.lang === 'ar' ? 'وارد' : 'In', align: 'end', cell: function (m) { return m.qty > 0 ? '<span class="num" style="color:var(--ok-ink)">' + esc(fmt.qty(m.qty)) + '</span>' : '<span class="faint">—</span>'; } },
      { key: 'out', label: U.state.lang === 'ar' ? 'صادر' : 'Out', align: 'end', cell: function (m) { return m.qty < 0 ? '<span class="num" style="color:var(--bad-ink)">' + esc(fmt.qty(Math.abs(m.qty))) + '</span>' : '<span class="faint">—</span>'; } },
      { key: 'bal', label: U.state.lang === 'ar' ? 'الرصيد بعد' : 'Balance after', align: 'end', cell: function (m) { return '<span class="num">' + esc(fmt.qty(m.balance_after)) + '</span>'; } },
      { key: 'val', label: U.state.lang === 'ar' ? 'القيمة (ج.م)' : 'Value (EGP)', align: 'end', cell: function (m) { return ui.money(m.value); } }
    ];
    var balCols = [
      { key: 'wh', label: t('app.warehouse'), cell: function (b) { return '<div class="id-cell"><div><div class="id-t">' + esc(H.whName(b.warehouse_id)) + '</div><div class="id-s">' + esc(H.branchOf(b.warehouse_id)) + '</div></div></div>'; } },
      { key: 'qty', label: U.state.lang === 'ar' ? 'الرصيد' : 'On hand', align: 'end', cell: function (b) { return '<span class="num" style="font-weight:600">' + esc(fmt.qty(b.qty)) + '</span>'; } },
      { key: 'avg', label: U.state.lang === 'ar' ? 'متوسط التكلفة' : 'Avg cost', align: 'end', cell: function (b) { return '<span class="num faint">' + esc(fmt.money(b.avg_cost)) + '</span>'; } },
      { key: 'val', label: U.state.lang === 'ar' ? 'القيمة (ج.م)' : 'Value (EGP)', align: 'end', cell: function (b) { return ui.money(b.value); } }
    ];
    var status = data.total_qty <= 0 ? ui.pill(U.state.lang === 'ar' ? 'نافد' : 'Out', 'bad')
      : data.total_qty <= p.min ? ui.pill(U.state.lang === 'ar' ? 'تحت الحد' : 'Low', 'warn')
      : ui.pill(U.state.lang === 'ar' ? 'متوفر' : 'In stock', 'ok');

    return '<div class="page-head"><div class="ph-txt">' +
      '<div class="crumbs"><span>' + esc(L({ ar: 'المخزون', en: 'Inventory' })) + '</span>' + icon('chevStart', 12) +
      '<button data-act="nav" data-id="inventory.ledger" style="color:var(--brand-ink)">' + esc(U.state.lang === 'ar' ? 'حركات المخزون' : 'Stock ledger') + '</button>' +
      icon('chevStart', 12) + '<span>' + esc(p.sku) + '</span></div>' +
      '<h1 class="page-title">' + esc(L(p)) + '</h1>' +
      '<p class="page-sub num">' + esc(p.sku) + ' · ' + esc(L(U.state.meta.units[p.unit] || { ar: p.unit, en: p.unit })) + '</p></div>' +
      '<div class="page-actions">' + status +
      ui.btn(U.state.lang === 'ar' ? 'كل الحركات' : 'All movements', { act: 'item-all-moves', icon: 'layers' }) +
      ui.btn(U.state.lang === 'ar' ? 'تسوية' : 'Adjust', { act: 'open-move', kind: 'primary', icon: 'plus' }) + '</div></div>' +

      '<div class="kpis">' +
      ui.kpi({ label: U.state.lang === 'ar' ? 'الرصيد الكلي' : 'Total on hand', value: fmt.qty(data.total_qty),
        note: U.state.lang === 'ar' ? 'في ' + data.balances.length + ' مستودع' : 'across ' + data.balances.length + ' warehouses' }) +
      ui.kpi({ label: U.state.lang === 'ar' ? 'متوسط التكلفة' : 'Average cost', value: fmt.money(data.avg_cost), cur: true,
        note: U.state.lang === 'ar' ? 'آخر تكلفة محسوبة' : 'Latest computed cost' }) +
      ui.kpi({ label: U.state.lang === 'ar' ? 'قيمة المخزون' : 'Stock value', value: fmt.money(data.total_value), cur: true,
        note: U.state.lang === 'ar' ? 'الرصيد × متوسط التكلفة' : 'Qty × average cost' }) +
      ui.kpi({ label: U.state.lang === 'ar' ? 'عدد الحركات' : 'Movements', value: fmt.num(data.movement_count),
        note: U.state.lang === 'ar' ? 'كل الحركات المسجلة' : 'All recorded movements' }) +
      '</div>' +

      '<div class="grid">' +
      ui.card({ cls: 'c7', title: U.state.lang === 'ar' ? 'الرصيد لكل مستودع' : 'Balance per warehouse', flush: true,
        body: ui.table({ cols: balCols, rows: data.balances, foot: { wh: t('app.total'), val: ui.money(data.total_value) } }) }) +
      ui.card({ cls: 'c5', title: U.state.lang === 'ar' ? 'بيانات الصنف' : 'Item details',
        body: '<div class="kv"><span class="k">' + esc(U.state.lang === 'ar' ? 'الوحدة' : 'Unit') + '</span><span class="v">' + esc(L(U.state.meta.units[p.unit] || { ar: p.unit, en: p.unit })) + '</span></div>' +
          '<div class="kv"><span class="k">' + esc(U.state.lang === 'ar' ? 'سعر البيع' : 'Sale price') + '</span><span class="v num">' + esc(fmt.money(p.price)) + ' ' + cur() + '</span></div>' +
          '<div class="kv"><span class="k">' + esc(U.state.lang === 'ar' ? 'الحد الأدنى' : 'Minimum level') + '</span><span class="v num">' + esc(fmt.qty(p.min)) + '</span></div>' +
          '<div class="kv"><span class="k">' + esc(U.state.lang === 'ar' ? 'ضريبة القيمة المضافة' : 'VAT') + '</span><span class="v num">' + esc(p.vat + '%') + '</span></div>' +
          '<div class="kv"><span class="k">' + esc(U.state.lang === 'ar' ? 'السماح برصيد سالب' : 'Negative stock allowed') + '</span><span class="v">' +
          (p.allow_negative ? esc(U.state.lang === 'ar' ? 'نعم' : 'Yes') : esc(U.state.lang === 'ar' ? 'لا — ممنوع' : 'No — blocked')) + '</span></div>' +
          '<div style="margin-top:12px">' + ui.banner({ tone: 'info', icon: 'info', text: U.state.lang === 'ar'
            ? 'الرصيد لا يُكتب مباشرة: كل تغيير يمر بحركة مخزون، ترفض الرصيد السالب وتحدّث متوسط التكلفة.'
            : 'Balances are never written directly: every change posts a stock movement, which refuses negative stock and updates the average cost.' }) + '</div>' }) +
      '</div>' +

      ui.card({ title: U.state.lang === 'ar' ? 'آخر الحركات' : 'Recent movements', sub: U.state.lang === 'ar' ? 'أحدث 40 حركة' : 'Latest 40 movements', flush: true,
        body: ui.table({ cols: cols, rows: moves, empty: ui.empty({ title: t('app.empty'), icon: 'layers' }) }) });
  }

  /* ---------------- manual movement sheet ---------------- */
  function openMoveSheet(ctx) {
    var root = document.querySelector('.uerp');
    if (root.querySelector('[data-ovl="move"]')) return;
    var body = '<div class="form-grid">' +
      '<div class="span2">' + ui.field({ label: t('app.item'), type: 'select', id: 'mv-product', options: H.productOptions(), value: ctx.params.id || ctx.filters.product || '' }) + '</div>' +
      '<div class="span2">' + ui.field({ label: t('app.warehouse'), type: 'select', id: 'mv-wh', options: H.warehouseOptions(false) }) + '</div>' +
      '<div>' + ui.field({ label: U.state.lang === 'ar' ? 'الاتجاه' : 'Direction', type: 'select', id: 'mv-dir',
        options: [{ value: 'in', label: U.state.lang === 'ar' ? 'إضافة (+) إلى المخزون' : 'Add (+) to stock' },
          { value: 'out', label: U.state.lang === 'ar' ? 'خصم (−) من المخزون' : 'Remove (−) from stock' }] }) + '</div>' +
      '<div>' + ui.field({ label: t('app.qty'), type: 'number', id: 'mv-qty', value: '', step: '1', min: '0', unit: '' }) + '</div>' +
      '<div>' + ui.field({ label: t('app.reason'), type: 'select', id: 'mv-reason',
        options: [{ value: 'count_error', label: U.state.lang === 'ar' ? 'خطأ في الجرد' : 'Counting error' },
          { value: 'damage', label: U.state.lang === 'ar' ? 'تلف' : 'Damage' },
          { value: 'unrecorded_return', label: U.state.lang === 'ar' ? 'مرتجع غير مسجل' : 'Unrecorded return' },
          { value: 'other', label: U.state.lang === 'ar' ? 'أخرى' : 'Other' }] }) + '</div>' +
      '<div>' + ui.field({ label: U.state.lang === 'ar' ? 'تكلفة الوحدة (اختياري)' : 'Unit cost (optional)', type: 'number', id: 'mv-cost', value: '', step: '0.01', unit: cur() }) + '</div>' +
      '<div class="span2">' + ui.field({ label: t('app.notes'), type: 'textarea', id: 'mv-note', rows: 2 }) + '</div>' +
      '</div>' +
      '<div id="mv-error"></div>' +
      ui.banner({ tone: 'warn', icon: 'shield', text: U.state.lang === 'ar'
        ? 'التسوية اليدوية تحتاج صلاحية inventory.adjust_manual. الرصيد السالب مرفوض دائمًا، والحركة لا تُحذف — تُعكس بحركة معاكسة.'
        : 'Manual adjustment needs the inventory.adjust_manual key. Negative stock is always refused, and movements are never deleted — they are reversed.' });

    root.insertAdjacentHTML('beforeend', ui.overlay({
      id: 'move', title: U.state.lang === 'ar' ? 'تسوية يدوية للمخزون' : 'Manual stock adjustment',
      sub: U.state.lang === 'ar' ? 'ستُسجَّل حركة في السجل فورًا' : 'A movement is written to the ledger immediately',
      body: body,
      foot: '<span class="grow"></span>' + ui.btn(t('app.cancel'), { act: 'close-sheet' }) +
        ui.btn(U.state.lang === 'ar' ? 'تسجيل الحركة' : 'Post movement', { act: 'submit-move', kind: 'primary' })
    }));
    var sel = root.querySelector('#mv-product');
    if (ctx.params.id) sel.value = ctx.params.id;
  }

  function submitMove(ctx) {
    var root = document.querySelector('.uerp');
    var errBox = root.querySelector('#mv-error');
    var dir = root.querySelector('#mv-dir').value;
    var qty = Math.abs(Number(root.querySelector('#mv-qty').value || 0));
    var payload = {
      product_id: root.querySelector('#mv-product').value,
      warehouse_id: root.querySelector('#mv-wh').value,
      qty: dir === 'out' ? -qty : qty,
      reason_code: root.querySelector('#mv-reason').value,
      note: root.querySelector('#mv-note').value,
      source_type: 'count_adjust',
      client_ref: U.util.uid('ref')
    };
    var cost = root.querySelector('#mv-cost').value;
    if (cost !== '') payload.unit_cost = Number(cost);
    if (!qty) { errBox.innerHTML = ui.banner({ tone: 'bad', icon: 'alert', text: U.state.lang === 'ar' ? 'أدخل كمية أكبر من صفر.' : 'Enter a quantity above zero.' }); return; }
    U.api.call('erp_stock_move', payload).then(function () {
      var el = root.querySelector('[data-ovl="move"]'); if (el) el.remove();
      ui.toast(U.state.lang === 'ar' ? 'تم تسجيل الحركة' : 'Movement posted', 'ok');
      U.refresh();
    }).catch(function (err) {
      errBox.innerHTML = ui.banner({ tone: 'bad', icon: 'alert', title: U.state.lang === 'ar' ? 'لم تُسجَّل الحركة' : 'Movement refused', text: err.message });
    });
  }

  /* ---------------- physical count sheet ---------------- */
  function loadCount(ctx) {
    var f = ctx.filters;
    if (!f.warehouse) f.warehouse = ((U.state.meta && U.state.meta.warehouses) || [])[0] ? U.state.meta.warehouses[0].id : 'w1';
    if (!f.counted) f.counted = {};
    return U.api.call('erp_stock_balances', { warehouse_id: f.warehouse, q: f.q || '' }).then(function (res) {
      var rows = (res.rows || []).map(function (r) {
        var c = f.counted[r.product_id];
        return {
          product_id: r.product_id, qty: r.qty, avg_cost: r.avg_cost,
          counted: (c === undefined || c === '') ? null : Number(c),
          diff: (c === undefined || c === '' || isNaN(Number(c))) ? null : U.util.round(Number(c) - r.qty, 3)
        };
      });
      return { res: res, rows: rows };
    });
  }

  function viewCount(ctx, data) {
    var f = ctx.filters;
    var rows = data.rows;
    var withDiff = rows.filter(function (r) { return r.diff !== null && Math.abs(r.diff) > 0.0005; });
    var counted = rows.filter(function (r) { return r.counted !== null; });
    var diffValue = U.util.sum(withDiff, function (r) { return r.diff * r.avg_cost; });

    var cols = [
      { key: 'item', label: t('app.item'), cls: 'id-col', cell: function (r) { return H.productCell(r.product_id); } },
      { key: 'qty', label: U.state.lang === 'ar' ? 'الرصيد بالدفاتر' : 'On hand (books)', align: 'end',
        cell: function (r) { return '<span class="num">' + esc(fmt.qty(r.qty)) + '</span>'; } },
      { key: 'counted', label: U.state.lang === 'ar' ? 'العدد الفعلي' : 'Counted', align: 'end', cell: function (r) {
        return '<input class="select num" type="number" step="0.01" data-act="count-edit" data-pid="' + esc(r.product_id) + '"' +
          ' value="' + (r.counted === null ? '' : esc(String(r.counted))) + '" placeholder="—" style="width:104px;text-align:center">';
      } },
      { key: 'diff', label: U.state.lang === 'ar' ? 'الفرق' : 'Difference', align: 'end', cell: function (r) {
        if (r.diff === null) return '<span class="faint" data-diff="' + esc(r.product_id) + '">—</span>';
        if (Math.abs(r.diff) < 0.0005) return '<span class="faint" data-diff="' + esc(r.product_id) + '">0</span>';
        var col = r.diff > 0 ? 'var(--ok-ink)' : 'var(--bad-ink)';
        return '<span class="num" data-diff="' + esc(r.product_id) + '" style="color:' + col + ';font-weight:600">' +
          (r.diff > 0 ? '+' : '−') + esc(fmt.qty(Math.abs(r.diff))) + '</span>';
      } },
      { key: 'val', label: U.state.lang === 'ar' ? 'قيمة الفرق' : 'Difference value', align: 'end', cls: 'hide-sm', cell: function (r) {
        if (r.diff === null || Math.abs(r.diff) < 0.0005) return '<span class="faint">—</span>';
        return '<span class="num">' + esc(fmt.money(Math.abs(r.diff * r.avg_cost))) + '</span>';
      } },
      { key: 'hist', label: '', align: 'end', cell: function (r) {
        return '<button class="btn ghost sm" data-act="count-history" data-pid="' + esc(r.product_id) + '">' +
          esc(U.state.lang === 'ar' ? 'الحركات' : 'History') + '</button>';
      } }
    ];

    return H.header(ctx, {
      crumb: U.state.lang === 'ar' ? 'الجرد' : 'Stock count',
      title: U.state.lang === 'ar' ? 'ورقة الجرد' : 'Count sheet',
      sub: U.state.lang === 'ar'
        ? 'اكتب العدد الفعلي أمام كل صنف. الفرق وحده يُرحَّل كتسوية، ولا يُعدَّل الرصيد بأي طريقة أخرى.'
        : 'Type the counted quantity next to each item. Only the difference is posted as an adjustment; balances are never edited directly.',
      actions: ui.btn(t('app.export'), { act: 'export-count', icon: 'download' }) +
        ui.iconBtn('print', { act: 'print', title: t('app.print') }) +
        ui.btn(U.state.lang === 'ar' ? 'ترحيل الفروق' : 'Post differences', { act: 'post-count', kind: 'primary', icon: 'check' })
    }) +
      '<div class="kpis">' +
      ui.kpi({ label: U.state.lang === 'ar' ? 'أسطر في الورقة' : 'Lines on sheet', value: fmt.num(rows.length),
        note: U.state.lang === 'ar' ? 'أصناف لها رصيد في هذا المستودع' : 'Items with stock in this warehouse' }) +
      ui.kpi({ label: U.state.lang === 'ar' ? 'تم عدّها' : 'Counted', value: fmt.num(counted.length),
        note: U.state.lang === 'ar' ? 'الأسطر التي كُتب فيها عدد' : 'Lines with a counted quantity' }) +
      ui.kpi({ label: U.state.lang === 'ar' ? 'أسطر بها فرق' : 'Lines with a difference', value: fmt.num(withDiff.length),
        note: U.state.lang === 'ar' ? 'هذه فقط ستُرحَّل' : 'Only these will be posted' }) +
      ui.kpi({ label: U.state.lang === 'ar' ? 'صافي قيمة الفرق' : 'Net difference value', value: fmt.money(diffValue), cur: true,
        note: U.state.lang === 'ar' ? 'موجب = زيادة في المخزون' : 'Positive = stock increase' }) +
      '</div>' +
      '<section class="card">' +
      '<div class="toolbar">' +
      '<select class="select" data-filter="warehouse">' + H.warehouseOptions(false).map(function (o) {
        return '<option value="' + esc(o.value) + '"' + (f.warehouse === o.value ? ' selected' : '') + '>' + esc(o.label) + '</option>';
      }).join('') + '</select>' +
      '<input type="date" class="select num" data-filter="date" value="' + esc(f.date || U.util.todayISO()) + '" style="width:150px">' +
      '<div class="search-inline">' + icon('search', 16) +
      '<input data-act="search" data-filter="q" value="' + esc(f.q || '') + '" placeholder="' + esc(U.state.lang === 'ar' ? 'ابحث بالصنف أو الكود…' : 'Search item or SKU…') + '"></div>' +
      (Object.keys(f.counted || {}).length ? ui.btn(U.state.lang === 'ar' ? 'مسح المدخلات' : 'Clear entries', { act: 'clear-count', kind: 'ghost' }) : '') +
      '<span class="grow"></span>' +
      '<span class="faint" style="font-size:11.5px">' + esc(U.state.lang === 'ar' ? 'الفرق = العدد الفعلي − رصيد الدفاتر' : 'Difference = counted − book balance') + '</span>' +
      '</div>' +
      ui.table({ cls: 'count-tbl', cols: cols, rows: rows, rowId: function (r) { return r.product_id; }, selectable: false,
        empty: ui.empty({ title: U.state.lang === 'ar' ? 'لا أصناف في هذا المستودع' : 'No items in this warehouse', hint: t('app.emptyHint'), icon: 'scale' }) }) +
      ui.totalsStrip([
        { label: U.state.lang === 'ar' ? 'أسطر' : 'Lines', value: fmt.num(rows.length) },
        { label: U.state.lang === 'ar' ? 'تم عدّها' : 'Counted', value: fmt.num(counted.length) },
        { label: U.state.lang === 'ar' ? 'فروق' : 'Differences', value: fmt.num(withDiff.length) },
        { label: U.state.lang === 'ar' ? 'صافي القيمة' : 'Net value', value: fmt.money(diffValue) }
      ], U.state.lang === 'ar' ? 'الترحيل يُنشئ حركة تسوية جرد لكل فرق' : 'Posting creates one count-adjustment movement per difference') +
      '</section>' +
      ui.banner({ tone: 'info', icon: 'shield', text: U.state.lang === 'ar'
        ? 'الجرد لا يمس الرصيد مباشرة: كل فرق يُرحَّل كحركة «تسوية جرد» في سجل المخزون، ويظهر في كارت الصنف. الأصناف التي لم تُعدّ لا تُمس.'
        : 'A count never touches the balance directly: each difference posts a "count adjustment" movement in the stock ledger and shows on the item card. Items you did not count are left alone.' });
  }

  function postCount(ctx) {
    var f = ctx.filters;
    var counted = f.counted || {};
    var rows = (ctx.data.rows || []).filter(function (r) { return r.counted !== null && Math.abs((r.diff || 0)) > 0.0005; });
    if (!rows.length) { ui.toast(U.state.lang === 'ar' ? 'لا فروق لترحيلها' : 'No differences to post', 'warn'); return; }
    var lines = rows.map(function (r) { return { product_id: r.product_id, counted_qty: r.counted }; });
    U.api.call('erp_stock_count', {
      warehouse_id: f.warehouse, date: f.date || U.util.todayISO(), lines: lines, client_ref: U.util.uid('ref')
    }).then(function (res) {
      f.counted = {};
      ui.toast(U.state.lang === 'ar'
        ? 'تم ترحيل ' + fmt.num(res.posted) + ' تسوية' + (res.skipped ? '، وتجاهل ' + fmt.num(res.skipped) : '')
        : 'Posted ' + fmt.num(res.posted) + ' adjustments' + (res.skipped ? ', skipped ' + fmt.num(res.skipped) : ''), 'ok');
      U.refresh();
    }).catch(function (err) {
      ui.toast(err.message, 'bad');
    });
  }

  /* ---------------- actions ---------------- */
  var A = {
    'tab-group': function (ctx, el) { ctx.filters.group = el.getAttribute('data-id'); ctx.filters.page = 1; ctx.reload(); },
    'range': function (ctx, el) { ctx.filters.range = el.getAttribute('data-id'); ctx.filters.page = 1; ctx.reload(); },
    'clear-range': function (ctx) { ctx.filters.range = 'month'; ctx.reload(); },
    'clear-warehouse': function (ctx) { ctx.filters.warehouse = ''; ctx.reload(); },
    'clear-q': function (ctx) { ctx.filters.q = ''; ctx.reload(); },
    'page': function (ctx, el) { ctx.filters.page = Number(el.getAttribute('data-page')) || 1; ctx.reload(); },
    'page-size': function (ctx, el) { ctx.filters.size = Number(el.value); ctx.filters.page = 1; ctx.reload(); },
    'open-item': function (ctx, el) {
      var id = el.getAttribute('data-id');
      if (!id) return;
      var pid = id.indexOf('|') >= 0 ? id.split('|')[0] : (ctx.data && ctx.data.ledger ? (ctx.data.ledger.rows.filter(function (r) { return r.id === id; })[0] || {}).product_id : id);
      if (ctx.data && ctx.data.ledger) {
        var mv = (ctx.data.ledger.rows || []).filter(function (r) { return r.id === id; })[0];
        if (mv) pid = mv.product_id;
      }
      U.go('inventory.item', { id: pid });
    },
    'item-all-moves': function (ctx) { U.filters['inventory.ledger'] = { range: 'year', group: 'all', page: 1, size: 25, q: '' }; U.go('inventory.ledger'); },
    'count-edit': function (ctx, el) {
      var pid = el.getAttribute('data-pid');
      var f = ctx.filters;
      f.counted = f.counted || {};
      f.counted[pid] = el.value;
      var row = (ctx.data.rows || []).filter(function (r) { return r.product_id === pid; })[0];
      if (!row) return;
      var cell = document.querySelector('.uerp [data-diff="' + pid + '"]');
      var v = el.value === '' ? null : Number(el.value);
      if (cell) {
        if (v === null || isNaN(v)) { cell.textContent = '—'; cell.style.color = ''; cell.style.fontWeight = ''; }
        else {
          var d = U.util.round(v - row.qty, 3);
          if (Math.abs(d) < 0.0005) { cell.textContent = '0'; cell.style.color = ''; cell.style.fontWeight = ''; }
          else {
            cell.textContent = (d > 0 ? '+' : '−') + fmt.qty(Math.abs(d));
            cell.style.color = d > 0 ? 'var(--ok-ink)' : 'var(--bad-ink)';
            cell.style.fontWeight = '600';
          }
        }
      }
      var next = ctx.data.rows.map(function (r) { return r.product_id === pid ? Object.assign({}, r, { counted: v, diff: v === null || isNaN(v) ? null : U.util.round(v - r.qty, 3) }) : r; });
      ctx.data.rows = next;
      var withDiff = next.filter(function (r) { return r.diff !== null && Math.abs(r.diff) > 0.0005; });
      var countedN = next.filter(function (r) { return r.counted !== null; });
      var kpis = document.querySelectorAll('.uerp .kpis .kpi .kpi-v');
      if (kpis && kpis.length >= 4) {
        kpis[1].textContent = fmt.num(countedN.length);
        kpis[2].textContent = fmt.num(withDiff.length);
        kpis[3].textContent = fmt.money(U.util.sum(withDiff, function (r) { return r.diff * r.avg_cost; }));
      }
    },
    'post-count': function (ctx) { postCount(ctx); },
    'export-count': function (ctx) {
      var rows = [[t('app.item'), 'SKU', t('app.warehouse'), U.state.lang === 'ar' ? 'الرصيد بالدفاتر' : 'On hand', U.state.lang === 'ar' ? 'العدد الفعلي' : 'Counted', U.state.lang === 'ar' ? 'الفرق' : 'Difference']];
      (ctx.data.rows || []).forEach(function (r) {
        var p = (U.state.meta.products || []).filter(function (x) { return x.id === r.product_id; })[0] || {};
        rows.push([L(p), p.sku, H.whName(ctx.filters.warehouse), r.qty, r.counted === null ? '' : r.counted, r.diff === null ? '' : r.diff]);
      });
      U.util.download('uno-count-sheet-' + (ctx.filters.date || U.util.todayISO()) + '.csv', U.util.csv(rows));
      ui.toast(U.state.lang === 'ar' ? 'تم تصدير ورقة الجرد' : 'Count sheet exported', 'ok');
    },
    'count-history': function (ctx, el) { U.go('inventory.item', { id: el.getAttribute('data-pid') }); },
    'clear-count': function (ctx) { ctx.filters.counted = {}; ctx.reload(); },
    'clear-asof': function (ctx) { ctx.filters.as_of = ''; ctx.reload(); },
    'open-move': function (ctx) { openMoveSheet(ctx); },
    'submit-move': function (ctx) { submitMove(ctx); },
    'close-sheet': function () { var el = document.querySelector('.uerp [data-ovl="move"]'); if (el) el.remove(); },
    'export-ledger': function (ctx) {
      var d = ctx.data.ledger;
      var rows = [[t('app.date'), t('app.doc'), U.state.lang === 'ar' ? 'النوع' : 'Type', t('app.item'), t('app.warehouse'), U.state.lang === 'ar' ? 'وارد' : 'In', U.state.lang === 'ar' ? 'صادر' : 'Out', U.state.lang === 'ar' ? 'الرصيد بعد' : 'Balance after', U.state.lang === 'ar' ? 'تكلفة الوحدة' : 'Unit cost', U.state.lang === 'ar' ? 'القيمة' : 'Value']];
      d.rows.forEach(function (m) {
        var p = (U.state.meta.products || []).filter(function (x) { return x.id === m.product_id; })[0] || {};
        rows.push([m.date, m.doc, (U.demo.labels.source[m.source_type] || {}).ar || m.source_type, L(p), H.whName(m.warehouse_id), m.qty > 0 ? m.qty : '', m.qty < 0 ? Math.abs(m.qty) : '', m.balance_after, m.unit_cost, m.value]);
      });
      U.util.download('uno-stock-ledger-' + U.util.todayISO() + '.csv', U.util.csv(rows));
      ui.toast(U.state.lang === 'ar' ? 'تم تصدير الصفحة الحالية' : 'Current page exported', 'ok');
    },
    'export-balances': function (ctx) {
      var rows = [[t('app.item'), 'SKU', t('app.warehouse'), U.state.lang === 'ar' ? 'الرصيد' : 'On hand', U.state.lang === 'ar' ? 'متوسط التكلفة' : 'Avg cost', U.state.lang === 'ar' ? 'قيمة التكلفة' : 'Cost value', U.state.lang === 'ar' ? 'قيمة البيع' : 'Retail value']];
      (ctx.data.res.rows || []).forEach(function (r) {
        var p = (U.state.meta.products || []).filter(function (x) { return x.id === r.product_id; })[0] || {};
        rows.push([L(p), p.sku, H.whName(r.warehouse_id), r.qty, r.avg_cost, r.cost_value, r.retail_value]);
      });
      U.util.download('uno-stock-balances-' + U.util.todayISO() + '.csv', U.util.csv(rows));
      ui.toast(U.state.lang === 'ar' ? 'تم التصدير' : 'Exported', 'ok');
    }
  };

  U.actions = Object.assign(U.actions || {}, A);

  /* ---------------- register ---------------- */
  U.registerModule({
    id: 'inventory',
    group: 'inventory',
    nav: [
      { group: 'inventory', screen: 'inventory.ledger', label: { ar: 'حركات المخزون', en: 'Stock ledger' }, icon: 'layers', order: 10 },
      { group: 'inventory', screen: 'inventory.balances', label: { ar: 'الأرصدة', en: 'Balances' }, icon: 'box', order: 20 },
      { group: 'inventory', screen: 'inventory.count', label: { ar: 'الجرد', en: 'Stock count' }, icon: 'scale', order: 30 }
    ],
    screens: [
      { id: 'inventory.ledger', title: { ar: 'حركات المخزون', en: 'Stock ledger' }, load: loadLedger, view: viewLedger, actions: A },
      { id: 'inventory.balances', title: { ar: 'أرصدة المخزون', en: 'Stock balances' }, load: loadBalances, view: viewBalances, actions: A },
      { id: 'inventory.count', title: { ar: 'ورقة الجرد', en: 'Count sheet' }, load: loadCount, view: viewCount, actions: A },
      { id: 'inventory.item', title: { ar: 'كارت الصنف', en: 'Item card' }, load: loadItem, view: viewItem, actions: A }
    ]
  });
})();
