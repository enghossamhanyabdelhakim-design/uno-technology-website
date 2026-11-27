/*!
 * UNO Core — admin2.js · ERP kernel for the Uno admin (v1.0.0)
 * Arabic RTL first · bilingual ar/en · dark default · side bar (never a bottom bar)
 * Vanilla JS, no build step, no framework. One global: window.UnoERP
 *
 * Integration (what the lead builder adds to admin.html):
 *   <script src="assets/erp-kernel.js" defer></script>
 *   <script src="assets/erp-inventory.js" defer></script>   <- one tag per module
 *   <script src="assets/erp-purchasing.js" defer></script>
 *   ... and one nav entry per module, see docs in the delivery message.
 *
 * Data access: RPC only. UnoERP.api.call(name, args) never touches a table
 * directly. With no RPC bridge attached it runs in demo mode (labeled).
 */
(function () {
  'use strict';

  var W = window, D = document;
  if (W.UnoERP && W.UnoERP.__kernel) return;

  var VERSION = '1.0.0';

  /* ------------------------------------------------------------------ *
   * config + state
   * ------------------------------------------------------------------ */
  var config = {
    lang: 'ar',                 // 'ar' | 'en'
    theme: 'dark',              // dark default, per delivery brief
    density: 'comfortable',     // 'comfortable' | 'compact'
    branchId: 'b1',
    demo: true,                 // flipped to false only when a real RPC bridge is attached
    rpc: null,                  // function (name, args) => Promise
    rpcLog: [],                 // every call, so the lead builder sees what is needed
    hashRouting: true,
    hashPrefix: '#erp/',
    inline: false,
    company: {
      ar: 'أونو للخدمات التكنولوجية',
      en: 'Uno Technology Services',
      short_ar: 'أونو كور',
      short_en: 'UNO Core'
    },
    storageKey: 'uno-erp-v1'
  };

  var state = {
    lang: config.lang,
    theme: config.theme,
    density: config.density,
    branchId: config.branchId,
    route: null,
    mounted: false,
    drawer: false,
    user: { name_ar: 'حسام هاني', name_en: 'Hossam Hany', role: 'owner', role_ar: 'المالك', role_en: 'Owner', initials: 'ح' }
  };

  /* ------------------------------------------------------------------ *
   * tiny helpers
   * ------------------------------------------------------------------ */
  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function uid(p) { return (p || 'id') + '-' + Math.random().toString(36).slice(2, 9); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function sum(a, f) { return (a || []).reduce(function (s, x) { return s + (f ? f(x) : x); }, 0); }
  function byId(list, id) { for (var i = 0; i < (list || []).length; i++) if (list[i].id === id) return list[i]; return null; }
  function groupBy(list, f) {
    var m = {};
    (list || []).forEach(function (x) { var k = f(x); (m[k] = m[k] || []).push(x); });
    return m;
  }
  function sortBy(list, f, dir) {
    var d = dir === 'desc' ? -1 : 1;
    return (list || []).slice().sort(function (a, b) {
      var x = f(a), y = f(b);
      if (x === y) return 0;
      return (x > y ? 1 : -1) * d;
    });
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function round(v, n) { var p = Math.pow(10, n || 2); return Math.round((v + Number.EPSILON) * p) / p; }
  function debounce(fn, ms) {
    var t; return function () { var a = arguments, self = this; clearTimeout(t); t = setTimeout(function () { fn.apply(self, a); }, ms || 180); };
  }
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function addDays(iso, n) { var d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  function daysBetween(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000); }
  function download(name, text, mime) {
    var blob = new Blob(['\ufeff' + text], { type: mime || 'text/csv;charset=utf-8' });
    var a = D.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    D.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
  }
  function csv(rows) {
    return rows.map(function (r) {
      return r.map(function (c) {
        var s = c === null || c === undefined ? '' : String(c);
        return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',');
    }).join('\r\n');
  }

  /* ------------------------------------------------------------------ *
   * language
   * ------------------------------------------------------------------ */
  function L(o) {
    if (o === null || o === undefined) return '';
    if (typeof o === 'string') return o;
    return o[state.lang] || o.ar || o.en || '';
  }
  var dict = {
    'app.search': { ar: 'ابحث عن فاتورة، صنف، مورد أو شاشة…', en: 'Search invoices, items, suppliers, screens…' },
    'app.commands': { ar: 'الأوامر', en: 'Commands' },
    'app.screens': { ar: 'الشاشات', en: 'Screens' },
    'app.noResults': { ar: 'لا نتائج مطابقة', en: 'No matching results' },
    'app.theme': { ar: 'تبديل الوضع', en: 'Toggle theme' },
    'app.lang': { ar: 'English', en: 'العربية' },
    'app.menu': { ar: 'القائمة', en: 'Menu' },
    'app.notifications': { ar: 'الإشعارات', en: 'Notifications' },
    'app.account': { ar: 'الحساب', en: 'Account' },
    'app.branch': { ar: 'الفرع', en: 'Branch' },
    'app.allBranches': { ar: 'كل الفروع', en: 'All branches' },
    'app.demo': { ar: 'بيانات تجريبية', en: 'Demo data' },
    'app.demoNote': {
      ar: 'وضع تجريبي — لا يوجد اتصال بقاعدة البيانات. كل الأرقام مولّدة للعرض فقط.',
      en: 'Demo mode — not connected to the database. All figures are generated for review only.'
    },
    'app.demoShort': { ar: 'تجريبي', en: 'Demo' },
    'app.live': { ar: 'متصل', en: 'Live' },
    'app.loading': { ar: 'جارٍ التحميل…', en: 'Loading…' },
    'app.error': { ar: 'تعذّر تحميل البيانات', en: 'Could not load the data' },
    'app.retry': { ar: 'إعادة المحاولة', en: 'Retry' },
    'app.empty': { ar: 'لا توجد بيانات مطابقة', en: 'Nothing matches' },
    'app.emptyHint': { ar: 'جرّب تغيير الفترة أو إزالة عامل تصفية.', en: 'Try another date range or remove a filter.' },
    'app.reset': { ar: 'إعادة تعيين', en: 'Reset' },
    'app.export': { ar: 'تصدير', en: 'Export' },
    'app.print': { ar: 'طباعة', en: 'Print' },
    'app.close': { ar: 'إغلاق', en: 'Close' },
    'app.cancel': { ar: 'إلغاء', en: 'Cancel' },
    'app.save': { ar: 'حفظ', en: 'Save' },
    'app.confirm': { ar: 'تأكيد', en: 'Confirm' },
    'app.density': { ar: 'الكثافة', en: 'Density' },
    'app.densityComfort': { ar: 'كثافة مريحة', en: 'Comfortable' },
    'app.densityCompact': { ar: 'كثافة مضغوطة', en: 'Compact' },
    'app.columns': { ar: 'الأعمدة', en: 'Columns' },
    'app.filters': { ar: 'عوامل تصفية', en: 'Filters' },
    'app.all': { ar: 'الكل', en: 'All' },
    'app.showing': { ar: 'عرض {a}–{b} من {c}', en: 'Showing {a}–{b} of {c}' },
    'app.perPage': { ar: 'لكل صفحة', en: 'Per page' },
    'app.page': { ar: 'صفحة', en: 'Page' },
    'app.total': { ar: 'الإجمالي', en: 'Total' },
    'app.of': { ar: 'من', en: 'of' },
    'app.currency': { ar: 'ج.م', en: 'EGP' },
    'app.vat': { ar: 'ضريبة', en: 'VAT' },
    'app.date': { ar: 'التاريخ', en: 'Date' },
    'app.from': { ar: 'من', en: 'From' },
    'app.to': { ar: 'إلى', en: 'To' },
    'app.today': { ar: 'اليوم', en: 'Today' },
    'app.yesterday': { ar: 'أمس', en: 'Yesterday' },
    'app.week': { ar: 'هذا الأسبوع', en: 'This week' },
    'app.month': { ar: 'هذا الشهر', en: 'This month' },
    'app.lastMonth': { ar: 'الشهر الماضي', en: 'Last month' },
    'app.year': { ar: 'هذه السنة', en: 'This year' },
    'app.custom': { ar: 'مخصص', en: 'Custom' },
    'app.allTime': { ar: 'كل الفترة', en: 'All time' },
    'app.warehouse': { ar: 'المستودع', en: 'Warehouse' },
    'app.allWarehouses': { ar: 'كل المستودعات', en: 'All warehouses' },
    'app.supplier': { ar: 'المورد', en: 'Supplier' },
    'app.branchCol': { ar: 'الفرع', en: 'Branch' },
    'app.item': { ar: 'الصنف', en: 'Item' },
    'app.qty': { ar: 'الكمية', en: 'Qty' },
    'app.unit': { ar: 'الوحدة', en: 'Unit' },
    'app.status': { ar: 'الحالة', en: 'Status' },
    'app.actions': { ar: 'إجراءات', en: 'Actions' },
    'app.doc': { ar: 'المستند', en: 'Document' },
    'app.notes': { ar: 'ملاحظات', en: 'Notes' },
    'app.reason': { ar: 'السبب', en: 'Reason' },
    'app.value': { ar: 'القيمة', en: 'Value' },
    'app.open': { ar: 'فتح', en: 'Open' },
    'app.viewAll': { ar: 'عرض الكل', en: 'View all' },
    'app.readOnly': { ar: 'للعرض فقط', en: 'Read-only' },
    'app.guard': { ar: 'قاعدة محاسبية', en: 'Accounting rule' },
    'app.saved': { ar: 'تم الحفظ', en: 'Saved' },
    'app.notAllowed': { ar: 'هذا الإجراء غير متاح لصلاحيتك', en: 'Your role cannot do this' },
    'app.unsaved': { ar: 'لديك تغييرات غير محفوظة', en: 'You have unsaved changes' },
    'app.unsavedBody': { ar: 'لو خرجت الآن ستضيع التعديلات. هل تريد البقاء؟', en: 'Leaving now discards your edits. Stay on this screen?' },
    'app.stay': { ar: 'البقاء', en: 'Stay' },
    'app.leave': { ar: 'خروج بدون حفظ', en: 'Leave without saving' },
    'app.more': { ar: 'المزيد', en: 'More' },
    'app.closeMenu': { ar: 'إغلاق القائمة', en: 'Close menu' },
    'app.net': { ar: 'الصافي', en: 'Net' },
    'app.check': { ar: 'تحقق', en: 'Check' }
  };
  function t(key, vars) {
    var e = dict[key];
    var s = e ? (e[state.lang] || e.ar) : key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
    return s;
  }

  /* ------------------------------------------------------------------ *
   * formatting
   * ------------------------------------------------------------------ */
  var NF2 = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var NF0 = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });
  var NF3 = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 3 });
  var fmt = {
    money: function (v, opts) {
      var n = Number(v || 0);
      var s = NF2.format(Math.abs(n) < 0.005 ? 0 : n);
      return s;
    },
    moneyCur: function (v) { return fmt.money(v) + ' ' + t('app.currency'); },
    num: function (v) { return NF0.format(Number(v || 0)); },
    qty: function (v) {
      var n = Number(v || 0);
      if (Math.abs(n - Math.round(n)) < 0.0005) return NF0.format(n);
      return NF3.format(round(n, 3));
    },
    pct: function (v, d) { return (Number(v || 0)).toFixed(d === undefined ? 1 : d) + '%'; },
    date: function (iso) {
      if (!iso) return '—';
      var p = String(iso).slice(0, 10).split('-');
      return p[2] + '/' + p[1] + '/' + p[0];
    },
    dateLong: function (iso) {
      if (!iso) return '—';
      try {
        return new Intl.DateTimeFormat(state.lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB',
          { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(String(iso).slice(0, 10) + 'T12:00:00'));
      } catch (e) { return fmt.date(iso); }
    },
    weekday: function (iso) {
      try {
        return new Intl.DateTimeFormat(state.lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { weekday: 'long' })
          .format(new Date(String(iso).slice(0, 10) + 'T12:00:00'));
      } catch (e) { return ''; }
    },
    time: function (iso) { return String(iso || '').slice(11, 16) || ''; }
  };
  function num(v) { return '<span class="num">' + esc(fmt.money(v)) + '</span>'; }
  function qtyNum(v, signed) {
    var s = fmt.qty(v);
    if (signed && Number(v) > 0) s = '+' + s;
    return '<span class="num">' + esc(s) + '</span>';
  }

  /* ------------------------------------------------------------------ *
   * icons — inline SVG, stroke 1.6, no icon font
   * ------------------------------------------------------------------ */
  var ICONS = {
    home: '<path d="M3.2 10.4 12 3.2l8.8 7.2M5.6 9.2V20.8h12.8V9.2"/>',
    box: '<path d="M3.6 8 12 3.6 20.4 8v8L12 20.4 3.6 16V8Z"/><path d="M3.6 8 12 12.4 20.4 8M12 12.4v8"/>',
    truck: '<path d="M2.8 6.8h10.4v9.4H2.8zM13.2 10h3.9l3.1 3.1v3.1h-7z"/><circle cx="6.4" cy="18.4" r="1.5"/><circle cx="17.2" cy="18.4" r="1.5"/>',
    book: '<path d="M4.2 4.4h8.4a3 3 0 0 1 3 3v12.2H7.2a3 3 0 0 1-3-3z"/><path d="M15.6 7.4h4.2v12.2h-4.2"/>',
    users: '<circle cx="9" cy="8.4" r="3.2"/><path d="M2.8 20.2a6.2 6.2 0 0 1 12.4 0"/><path d="M16.2 5.6a3 3 0 0 1 0 5.6M17.4 20.2a5.4 5.4 0 0 0-2-4.2"/>',
    chart: '<path d="M3.6 20.4V4.2M3.6 20.4h16.8"/><path d="M7.6 16.4v-4M12 16.4V8.6M16.4 16.4v-6.4"/>',
    layers: '<path d="M12 3.4 3.4 8 12 12.6 20.6 8 12 3.4Z"/><path d="M3.4 12.6 12 17.2l8.6-4.6M3.4 16.8 12 21.4l8.6-4.6"/>',
    settings: '<circle cx="12" cy="12" r="3.1"/><path d="M12 2.8v3M12 18.2v3M4.6 7.6l2.6 1.5M16.8 14.9l2.6 1.5M4.6 16.4l2.6-1.5M16.8 9.1l2.6-1.5"/>',
    bell: '<path d="M6.4 9.6a5.6 5.6 0 0 1 11.2 0c0 4.2 1.6 5.6 1.6 5.6H4.8s1.6-1.4 1.6-5.6Z"/><path d="M10 18.4a2.2 2.2 0 0 0 4 0"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.4"/><path d="M15.6 15.6 20.4 20.4"/>',
    calendar: '<rect x="3.6" y="5.2" width="16.8" height="15.2" rx="2.4"/><path d="M3.6 10h16.8M8.4 3.2v4M15.6 3.2v4"/>',
    filter: '<path d="M3.6 5.2h16.8l-6.4 7.4v6.2l-4 1.8v-8z"/>',
    download: '<path d="M12 3.6v11.2M7.6 10.8 12 15.2l4.4-4.4M4 20.4h16"/>',
    plus: '<path d="M12 4.8v14.4M4.8 12h14.4"/>',
    chevDown: '<path d="M6.4 9.6 12 15.2l5.6-5.6"/>',
    chevStart: '<path d="M14.4 6.4 8.8 12l5.6 5.6"/>',
    chevEnd: '<path d="M9.6 6.4 15.2 12l-5.6 5.6"/>',
    more: '<circle cx="5.6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18.4" cy="12" r="1.5"/>',
    check: '<path d="M4.8 12.6 9.6 17.4 19.2 6.6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    alert: '<path d="M12 3.6 21.2 19.6H2.8z"/><path d="M12 9.6v4.4M12 17.2v.2"/>',
    info: '<circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.6M12 7.8v.2"/>',
    clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3.2 2"/>',
    wallet: '<rect x="3.2" y="6.4" width="17.6" height="12.8" rx="2.6"/><path d="M3.2 10.4h17.6M16.4 15.2h1.6"/>',
    print: '<path d="M7 8.4V3.8h10v4.6"/><rect x="3.6" y="8.4" width="16.8" height="7.6" rx="2"/><path d="M7 14h10v6.2H7z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M5.6 18.4l1.7-1.7M16.7 7.3l1.7-1.7"/>',
    moon: '<path d="M20 14.4A8.4 8.4 0 0 1 9.6 4 8.4 8.4 0 1 0 20 14.4Z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    tag: '<path d="M11.6 3.6H20v8.4l-8.8 8.8-8.4-8.4z"/><circle cx="16.4" cy="7.4" r="1.2"/>',
    sliders: '<path d="M4 7.2h9M17.2 7.2H20M4 16.8h3.6M11.8 16.8H20"/><circle cx="15.2" cy="7.2" r="2"/><circle cx="9.6" cy="16.8" r="2"/>',
    edit: '<path d="M15.6 4.6 19.4 8.4 8.8 19H5v-3.8z"/>',
    trash: '<path d="M4.8 7.2h14.4M9.6 7.2V4.8h4.8v2.4M6.4 7.2 7.4 20h9.2l1-12.8"/>',
    eye: '<path d="M2.8 12S6 6.4 12 6.4 21.2 12 21.2 12 18 17.6 12 17.6 2.8 12 2.8 12Z"/><circle cx="12" cy="12" r="2.8"/>',
    doc: '<path d="M6 3.6h8l4 4v12.8H6z"/><path d="M14 3.6v4h4M8.8 12h6.4M8.8 15.6h6.4"/>',
    scale: '<path d="M12 3.6v16.8M6 6.4h12M8.4 6.4 4.8 13.2h7.2zM15.6 6.4l-3.6 6.8h7.2z"/>',
    swap: '<path d="M7.2 3.6 3.6 7.2l3.6 3.6M3.6 7.2h13.2M16.8 20.4l3.6-3.6-3.6-3.6M20.4 16.8H7.2"/>',
    arrowUp: '<path d="M12 19.2V4.8M6.4 10.4 12 4.8l5.6 5.6"/>',
    arrowDown: '<path d="M12 4.8v14.4M6.4 13.6 12 19.2l5.6-5.6"/>',
    logout: '<path d="M9.6 4.4H5.2v15.2h4.4M14 8.4l3.6 3.6-3.6 3.6M17.6 12H9.2"/>',
    grid: '<rect x="3.6" y="3.6" width="7" height="7" rx="1.6"/><rect x="13.4" y="3.6" width="7" height="7" rx="1.6"/><rect x="3.6" y="13.4" width="7" height="7" rx="1.6"/><rect x="13.4" y="13.4" width="7" height="7" rx="1.6"/>',
    store: '<path d="M3.6 9.2 5.2 4.4h13.6l1.6 4.8M4.8 9.2v10.4h14.4V9.2"/><path d="M9.2 19.6v-5.2h5.6v5.2"/>',
    repair: '<path d="M14.8 3.8a4.6 4.6 0 0 0 5.4 6.6L9.6 21 3 14.4l10.6-10.6z"/><path d="M6.6 17.4h.2"/>',
    building: '<path d="M4.4 20.4V4.4h9.2v16M13.6 9.6h6v10.8M2.8 20.4h18.4"/><path d="M7.2 8h3.6M7.2 12h3.6M7.2 16h3.6M16.4 13.2h.2M16.4 16.8h.2"/>',
    cash: '<rect x="2.8" y="6.4" width="18.4" height="11.2" rx="2.2"/><circle cx="12" cy="12" r="2.6"/><path d="M6.2 12h.2M17.6 12h.2"/>',
    shield: '<path d="M12 3.2 4.8 6v6.2c0 4.4 3 7.4 7.2 8.6 4.2-1.2 7.2-4.2 7.2-8.6V6z"/><path d="M8.8 12.2 11.4 14.8 15.6 9.8"/>'
  };
  function icon(name, size) {
    var p = ICONS[name] || ICONS.box;
    return '<svg class="ico" viewBox="0 0 24 24" width="' + (size || 20) + '" height="' + (size || 20) +
      '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  /* ------------------------------------------------------------------ *
   * module registry + router
   * ------------------------------------------------------------------ */
  var modules = [];
  var screens = {};      // screenId -> {moduleId, def}
  var listeners = [];

  var GROUPS = [
    { id: 'home', ar: 'الرئيسية', en: 'Home', icon: 'home' },
    { id: 'inventory', ar: 'المخزون', en: 'Inventory', icon: 'box' },
    { id: 'purchasing', ar: 'المشتريات', en: 'Purchasing', icon: 'truck' },
    { id: 'accounting', ar: 'المالية', en: 'Accounting', icon: 'book' },
    { id: 'hr', ar: 'الموارد البشرية', en: 'HR', icon: 'users' }
  ];

  function registerModule(mod) {
    if (!mod || !mod.id) return;
    var existing = modules.filter(function (m) { return m.id === mod.id; })[0];
    if (existing) {
      modules[modules.indexOf(existing)] = mod;
    } else {
      modules.push(mod);
    }
    (mod.screens || []).forEach(function (s) {
      screens[s.id] = { moduleId: mod.id, def: s };
    });
    if (state.mounted && W.UnoERP.__render) W.UnoERP.__render();
  }

  function parseHash() {
    var h = (location.hash || '').replace(config.hashPrefix, '');
    if (!h) return null;
    var parts = h.split('?');
    var seg = parts[0].split('/');
    var params = {};
    if (parts[1]) parts[1].split('&').forEach(function (kv) {
      var p = kv.split('='); params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
    });
    return { moduleId: seg[0], screenId: seg[1], params: params };
  }

  function go(screenId, params, opts) {
    var s = screens[screenId];
    if (!s) { console.warn('[UnoERP] unknown screen', screenId); return; }
    state.route = { moduleId: s.moduleId, screenId: screenId, params: params || {} };
    if (config.hashRouting && !(opts && opts.silent)) {
      var q = state.route.params && Object.keys(state.route.params).length
        ? '?' + Object.keys(state.route.params).map(function (k) { return k + '=' + encodeURIComponent(state.route.params[k]); }).join('&')
        : '';
      var hash = config.hashPrefix + s.moduleId + '/' + screenId + q;
      if (location.hash !== hash) { try { history.replaceState(null, '', hash); } catch (e) { location.hash = hash; } }
    }
    state.drawer = false;
    if (W.UnoERP.__render) W.UnoERP.__render();
    var page = D.querySelector('.uerp .page');
    if (page) page.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function navItems() {
    var out = [];
    modules.forEach(function (m) {
      (m.nav || []).forEach(function (n) {
        out.push({ group: n.group || m.group || 'home', label: n.label, icon: n.icon, screen: n.screen, order: n.order || 100, moduleId: m.id, badge: n.badge });
      });
    });
    return sortBy(out, function (x) { return x.order; });
  }

  /* ------------------------------------------------------------------ *
   * api — RPC only, demo fallback
   * ------------------------------------------------------------------ */
  var api = {
    call: function (name, args) {
      var entry = { name: name, args: args, at: new Date().toISOString(), mode: config.demo ? 'demo' : 'live' };
      config.rpcLog.push(entry);
      if (config.rpcLog.length > 200) config.rpcLog.shift();
      var bridge = config.rpc || (W.sb && typeof W.sb.rpc === 'function' ? function (n, a) { return W.sb.rpc(n, a); } : null);
      if (bridge && !config.demo) {
        return Promise.resolve(bridge(name, args)).then(function (res) {
          if (res && res.error) throw new Error(res.error.message || 'RPC failed');
          return res && res.data !== undefined ? res.data : res;
        });
      }
      return demoRpc(name, args);
    },
    log: function () { return config.rpcLog.slice(); },
    clearLog: function () { config.rpcLog = []; }
  };

  function demoRpc(name, args) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        try {
          var fn = DEMO.handlers[name];
          if (!fn) { reject(new Error('RPC ' + name + ' غير موجود في وضع العرض')); return; }
          resolve(fn(args || {}));
        } catch (e) { reject(e); }
      }, 60);
    });
  }

  var DEMO = { handlers: {} };

  /* ------------------------------------------------------------------ *
   * export the surface (components are attached in later parts)
   * ------------------------------------------------------------------ */
  W.UnoERP = {
    __kernel: true,
    version: VERSION,
    config: config,
    state: state,
    modules: modules,
    groups: GROUPS,
    screens: screens,
    registerModule: registerModule,
    go: go,
    navItems: navItems,
    api: api,
    demo: DEMO,
    i18n: { dict: dict, add: function (extra) { Object.keys(extra).forEach(function (k) { dict[k] = extra[k]; }); } },
    L: L, t: t, esc: esc, fmt: fmt, num: num, qtyNum: qtyNum,
    icon: icon, icons: ICONS,
    util: { uid: uid, clone: clone, sum: sum, byId: byId, groupBy: groupBy, sortBy: sortBy, round: round, clamp: clamp,
      debounce: debounce, todayISO: todayISO, addDays: addDays, daysBetween: daysBetween, download: download, csv: csv },
    on: function (fn) { listeners.push(fn); },
    emit: function (evt) { listeners.forEach(function (f) { try { f(evt); } catch (e) { console.warn(e); } }); }
  };
})();
/* ------------------------------------------------------------------ *
 * UNO Core ERP — demo dataset (deterministic, labeled "بيانات تجريبية")
 * Nothing here touches the live database. It exists so every screen can
 * be reviewed with numbers that reconcile: ledger sum == cached balance.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  var U = window.UnoERP;
  if (!U || !U.__kernel) return;

  /* deterministic PRNG so every reload shows the same numbers */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var today = new Date();
  function iso(d) { return d.toISOString().slice(0, 10); }
  function shift(n) { var d = new Date(today.getTime()); d.setDate(d.getDate() + n); return iso(d); }

  var BRANCHES = [
    { id: 'b1', code: 'FSH', ar: 'فرشوط — الرئيسي', en: 'Farshout — Main' },
    { id: 'b2', code: 'QNA', ar: 'قنا', en: 'Qena' },
    { id: 'b3', code: 'LXR', ar: 'الأقصر', en: 'Luxor' }
  ];
  var WAREHOUSES = [
    { id: 'w1', code: 'WH-FSH', branch_id: 'b1', ar: 'الرئيسي (فرشوط)', en: 'Main (Farshout)', kind: 'store' },
    { id: 'w2', code: 'WH-QNA', branch_id: 'b2', ar: 'مخزن قنا', en: 'Qena warehouse', kind: 'store' },
    { id: 'w3', code: 'WH-LXR', branch_id: 'b3', ar: 'مخزن الأقصر', en: 'Luxor warehouse', kind: 'store' },
    { id: 'w4', code: 'VAN-1', branch_id: 'b1', ar: 'سيارة الفني', en: 'Technician van', kind: 'van' }
  ];
  var UNITS = { pc: { ar: 'قطعة', en: 'pc' }, m: { ar: 'متر', en: 'm' }, roll: { ar: 'رول', en: 'roll' }, set: { ar: 'طقم', en: 'set' } };

  var PRODUCTS = [
    { id: 'p01', sku: 'CAM-HIK-2MP', ar: 'كاميرا Hikvision 2 ميجا', en: 'Hikvision camera 2MP', unit: 'pc', cost: 1480, price: 1950, vat: 14, min: 4, base: 14, cat: 'cam' },
    { id: 'p02', sku: 'CAM-HIK-5MP', ar: 'كاميرا Hikvision 5 ميجا', en: 'Hikvision camera 5MP', unit: 'pc', cost: 2250, price: 2950, vat: 14, min: 3, base: 9, cat: 'cam' },
    { id: 'p03', sku: 'REC-DVR-8', ar: 'جهاز تسجيل DVR 8 قنوات', en: 'DVR recorder 8 channels', unit: 'pc', cost: 3100, price: 4200, vat: 14, min: 2, base: 6, cat: 'cam' },
    { id: 'p04', sku: 'HDD-2TB-SURV', ar: 'هارد 2 تيرا للمراقبة', en: 'Surveillance HDD 2TB', unit: 'pc', cost: 1850, price: 2400, vat: 14, min: 3, base: 8, cat: 'cam' },
    { id: 'p05', sku: 'NET-MK-HAPAC2', ar: 'راوتر Mikrotik hAP ac²', en: 'Mikrotik hAP ac² router', unit: 'pc', cost: 2150, price: 2850, vat: 14, min: 3, base: 8, cat: 'net' },
    { id: 'p06', sku: 'NET-TP-SW8', ar: 'سويتش TP-Link 8 بورت', en: 'TP-Link 8-port switch', unit: 'pc', cost: 620, price: 850, vat: 14, min: 4, base: 12, cat: 'net' },
    { id: 'p07', sku: 'NET-CAT6-305', ar: 'كابل شبكة Cat6 — 305 م', en: 'Cat6 network cable — 305 m', unit: 'roll', cost: 2650, price: 3400, vat: 14, min: 2, base: 5, cat: 'net' },
    { id: 'p08', sku: 'LAP-DELL-I5', ar: 'لابتوب Dell Core i5', en: 'Dell laptop Core i5', unit: 'pc', cost: 18500, price: 22500, vat: 14, min: 1, base: 3, cat: 'pc' },
    { id: 'p09', sku: 'PRN-CAN-LBP', ar: 'طابعة Canon ليزر', en: 'Canon laser printer', unit: 'pc', cost: 4300, price: 5400, vat: 14, min: 1, base: 3, cat: 'pc' },
    { id: 'p10', sku: 'UPS-1200', ar: 'UPS 1200 فولت أمبير', en: 'UPS 1200VA', unit: 'pc', cost: 2900, price: 3800, vat: 14, min: 2, base: 5, cat: 'pc' },
    { id: 'p11', sku: 'ACC-RJ45', ar: 'كونكتور RJ45', en: 'RJ45 connector', unit: 'pc', cost: 1.6, price: 3, vat: 14, min: 40, base: 220, cat: 'acc' },
    { id: 'p12', sku: 'ACC-PVC-25', ar: 'مواسير PVC 25مم', en: 'PVC conduit 25mm', unit: 'm', cost: 12, price: 20, vat: 14, min: 30, base: 180, cat: 'acc' },
    { id: 'p13', sku: 'CAB-HDMI-3', ar: 'كابل HDMI 3 متر', en: 'HDMI cable 3m', unit: 'pc', cost: 95, price: 150, vat: 14, min: 10, base: 26, cat: 'acc' },
    { id: 'p14', sku: 'ACC-MS-WL', ar: 'ماوس لاسلكي', en: 'Wireless mouse', unit: 'pc', cost: 180, price: 260, vat: 14, min: 8, base: 22, cat: 'acc' },
    { id: 'p15', sku: 'NET-FIB-SPL', ar: 'سبليتر فايبر 1:8', en: 'Fiber splitter 1:8', unit: 'pc', cost: 210, price: 320, vat: 14, min: 6, base: 16, cat: 'net' },
    { id: 'p16', sku: 'CAM-ACC-BR', ar: 'كمالة تركيب كاميرا', en: 'Camera mount bracket', unit: 'pc', cost: 55, price: 95, vat: 14, min: 15, base: 40, cat: 'acc' }
  ];

  var SUPPLIERS = [
    { id: 's1', code: 'SUP-01', ar: 'شركة النيل للتوريدات', en: 'Nile Supplies Co.', phone: '+20 100 224 7711', tax: '214-885-331', terms: 30 },
    { id: 's2', code: 'SUP-02', ar: 'مؤسسة الصعيد للتقنية', en: 'Saeed Technology Est.', phone: '+20 106 771 2093', tax: '310-224-887', terms: 15 },
    { id: 's3', code: 'SUP-03', ar: 'الشرق للأنظمة الأمنية', en: 'East Security Systems', phone: '+20 111 903 4477', tax: '188-330-904', terms: 45 },
    { id: 's4', code: 'SUP-04', ar: 'التقنية الحديثة للتوزيع', en: 'Modern Tech Distribution', phone: '+20 128 550 1188', tax: '402-117-663', terms: 30 },
    { id: 's5', code: 'SUP-05', ar: 'أبو الهول للإلكترونيات', en: 'Abu Houl Electronics', phone: '+20 122 448 9901', tax: '255-901-448', terms: 0 }
  ];

  var TREASURIES = [
    { id: 't1', ar: 'خزينة فرشوط', en: 'Farshout treasury', kind: 'cash', balance: 184300 },
    { id: 't2', ar: 'بنك مصر — جاري', en: 'Banque Misr — current', kind: 'bank', balance: 412850 },
    { id: 't3', ar: 'خزينة قنا', en: 'Qena treasury', kind: 'cash', balance: 52400 }
  ];

  var CUSTOMERS = [
    { id: 'c1', ar: 'شركة النيل للتجارة', en: 'Nile Trading' },
    { id: 'c2', ar: 'مدرسة الأقصر الدولية', en: 'Luxor International School' },
    { id: 'c3', ar: 'مؤسسة الصعيد للبترول', en: 'Saeed Petroleum Est.' },
    { id: 'c4', ar: 'كافتيريا السلام', en: 'Salam Cafeteria' },
    { id: 'c5', ar: 'مكتب المحامي طارق', en: 'Tarek Law Office' },
    { id: 'c6', ar: 'مركز النور الطبي', en: 'Al Nour Medical Center' }
  ];

  var REASONS = {
    count_adjust: [{ code: 'count_error', ar: 'خطأ في الجرد', en: 'Counting error' }, { code: 'unrecorded_return', ar: 'مرتجع غير مسجل', en: 'Unrecorded return' }],
    waste: [{ code: 'damage', ar: 'تلف', en: 'Damage' }, { code: 'expiry', ar: 'انتهاء صلاحية', en: 'Expiry' }]
  };

  function capToday(d) { var t0 = U.util.todayISO(); return d > t0 ? t0 : d; }
  var DB = null;

  function build() {
    var rnd = mulberry32(20261127);
    var pick = function (a) { return a[Math.floor(rnd() * a.length)]; };
    var int = function (a, b) { return a + Math.floor(rnd() * (b - a + 1)); };

    DB = {
      branches: BRANCHES, warehouses: WAREHOUSES, products: PRODUCTS, suppliers: SUPPLIERS,
      treasuries: TREASURIES, customers: CUSTOMERS, units: UNITS,
      movements: [], invoices: [], payments: [], docs: {}, balances: {}, avg: {}
    };

    /* ---- purchase invoices ---- */
    var plan = [
      { d: -28, s: 's1', w: 'w1', st: 'paid', lines: 3 },
      { d: -26, s: 's3', w: 'w1', st: 'paid', lines: 2 },
      { d: -22, s: 's2', w: 'w2', st: 'financially_approved', lines: 3 },
      { d: -19, s: 's1', w: 'w1', st: 'received', lines: 4 },
      { d: -15, s: 's4', w: 'w3', st: 'received', lines: 2 },
      { d: -12, s: 's3', w: 'w1', st: 'partially_received', lines: 3 },
      { d: -9, s: 's5', w: 'w2', st: 'awaiting_receipt', lines: 2 },
      { d: -6, s: 's2', w: 'w1', st: 'awaiting_receipt', lines: 3 },
      { d: -4, s: 's4', w: 'w3', st: 'financially_approved', lines: 2 },
      { d: -2, s: 's1', w: 'w1', st: 'draft', lines: 2 },
      { d: -1, s: 's3', w: 'w2', st: 'cancelled', lines: 1 }
    ];
    var purNo = 0;
    plan.forEach(function (pl, idx) {
      purNo += 1;
      var no = 'PUR-2026-' + String(purNo).padStart(4, '0');
      var inv = {
        id: 'pi' + (idx + 1), no: no, supplier_id: pl.s, warehouse_id: pl.w,
        branch_id: (U.util.byId(WAREHOUSES, pl.w) || {}).branch_id || 'b1',
        date: shift(pl.d), paper_no: 'A/' + int(1200, 9800), status: pl.st,
        discount: 0, notes: '', created_by: 'حسام هاني', lines: []
      };
      inv.expected_date = U.util.addDays(inv.date, ((U.util.byId(SUPPLIERS, pl.s) || {}).terms || 0));
      var used = {};
      for (var i = 0; i < pl.lines; i++) {
        var p = pick(PRODUCTS);
        if (used[p.id]) { i--; continue; }
        used[p.id] = 1;
        var q = p.unit === 'pc' ? int(2, Math.max(4, Math.round(p.base * 0.6))) : (p.unit === 'm' ? int(40, 160) : int(1, 3));
        var uc = U.util.round(p.cost * (0.94 + rnd() * 0.12), 2);
        var rec = q;
        if (pl.st === 'partially_received') rec = Math.max(1, Math.round(q * (0.6 + rnd() * 0.25)));
        if (pl.st === 'awaiting_receipt' || pl.st === 'draft' || pl.st === 'cancelled') rec = 0;
        inv.lines.push({
          id: inv.id + '-l' + (i + 1), product_id: p.id, qty: q, received_qty: rec,
          returned_qty: 0, unit_cost: uc, discount_pct: (rnd() < 0.25 ? 2 : 0), note: ''
        });
      }
      DB.invoices.push(inv);
    });

    /* ---- movements: purchases first, then sales/returns/transfers/counts/waste ---- */
    var seq = { purchase: 0, sale: 0, sale_return: 0, transfer: 0, count: 0, waste: 0, opening: 0 };
    var docOf = function (type) {
      seq[type] += 1;
      var pre = { purchase: 'PUR-2026-', sale: 'INV-2026-0', sale_return: 'SRT-2026-0', transfer: 'TRF-2026-0', count: 'CNT-2026-0', waste: 'WST-2026-0', opening: 'OPN-2026-0' }[type];
      return pre + String(seq[type]).padStart(3, '0');
    };

    function key(w, p) { return w + '|' + p; }
    function bal(w, p) { return DB.balances[key(w, p)] || { qty: 0, avg: 0 }; }

    function pushMove(m) {
      var k = key(m.warehouse_id, m.product_id);
      var b = bal(m.warehouse_id, m.product_id);
      var qty = Number(m.qty), avg = b.avg || 0;
      if (qty > 0) {
        var inVal = Number(m.unit_cost) * qty;
        avg = (b.qty * avg + inVal) / (b.qty + qty);
      }
      var newQty = U.util.round(b.qty + qty, 3);
      DB.balances[k] = { qty: newQty, avg: U.util.round(avg, 4) };
      m.balance_after = newQty;
      m.unit_cost = U.util.round(qty > 0 ? Number(m.unit_cost) : avg, 4);
      m.value = U.util.round(Math.abs(qty) * (qty > 0 ? Number(m.unit_cost) : avg), 2);
      DB.movements.push(m);
      return m;
    }

    /* opening stock 45 days ago */
    PRODUCTS.forEach(function (p, i) {
      ['w1', 'w2', 'w3'].forEach(function (w, wi) {
        if ((i + wi) % 5 === 4) return;
        var q = Math.max(p.min * 2, Math.round(p.base * (1.0 + rnd() * 0.9) / (wi === 0 ? 1 : 1.8)));
        pushMove({
          id: U.util.uid('mv'), doc: 'OPN-2026-00' + (wi + 1), date: shift(-45), warehouse_id: w, product_id: p.id,
          qty: q, unit_cost: p.cost, source_type: 'opening', source_id: 'opn-' + w, note: '', reason_code: 'opening', created_by: 'النظام'
        });
      });
    });
    /* a small van stock for the technician */
    ['p01', 'p11', 'p13', 'p16'].forEach(function (pid) {
      var p = U.util.byId(PRODUCTS, pid);
      pushMove({ id: U.util.uid('mv'), doc: 'OPN-2026-004', date: shift(-45), warehouse_id: 'w4', product_id: pid, qty: int(2, 6), unit_cost: p.cost, source_type: 'opening', source_id: 'opn-w4', note: '', reason_code: 'opening', created_by: 'النظام' });
    });

    /* purchase receipts */
    DB.invoices.forEach(function (inv) {
      if (!inv.lines.some(function (l) { return l.received_qty > 0; })) return;
      inv.lines.forEach(function (l, i) {
        if (l.received_qty <= 0) return;
        pushMove({
          id: U.util.uid('mv'), doc: inv.no, date: inv.date, warehouse_id: inv.warehouse_id, product_id: l.product_id,
          qty: l.received_qty, unit_cost: l.unit_cost, source_type: 'purchase', source_id: inv.id, line_no: i + 1,
          note: inv.paper_no ? ('فاتورة المورد ' + inv.paper_no) : '', created_by: 'أمين المخزن'
        });
      });
    });

    /* sales + returns + transfers + counts + waste, day by day */
    for (var d = -40; d <= 0; d++) {
      var date = shift(d);
      var nSales = int(2, 5);
      for (var s = 0; s < nSales; s++) {
        var p = pick(PRODUCTS), w = pick(['w1', 'w1', 'w2', 'w3']);
        var b = bal(w, p.id);
        var q = p.unit === 'pc' ? int(1, 4) : (p.unit === 'm' ? int(20, 120) : 1);
        if (b.qty < q + 2) continue;
        var cust = pick(CUSTOMERS);
        var doc = docOf('sale');
        pushMove({ id: U.util.uid('mv'), doc: doc, date: date, warehouse_id: w, product_id: p.id, qty: -q,
          unit_cost: b.avg, source_type: 'sale', source_id: 'si-' + doc, note: cust.ar, created_by: 'سارة محمود' });
        if (rnd() < 0.08) {
          var rq = Math.max(1, Math.round(q / 2));
          pushMove({ id: U.util.uid('mv'), doc: docOf('sale_return'), date: date, warehouse_id: w, product_id: p.id, qty: rq,
            unit_cost: b.avg, source_type: 'sale_return', source_id: 'sr-' + doc, note: 'مرتجع من ' + cust.ar, created_by: 'سارة محمود' });
        }
      }
      if (d % 3 === 0) {
        var tp = pick(PRODUCTS), src = pick(['w1', 'w2']);
        var dst = src === 'w1' ? 'w2' : 'w1';
        var tb = bal(src, tp.id);
        var tq = Math.min(tb.qty, tp.unit === 'pc' ? int(2, 6) : int(10, 40));
        if (tq > 0) {
          var tdoc = docOf('transfer');
          pushMove({ id: U.util.uid('mv'), doc: tdoc, date: date, warehouse_id: src, product_id: tp.id, qty: -tq,
            unit_cost: tb.avg, source_type: 'transfer_out', source_id: 'tr-' + tdoc, note: 'تحويل إلى ' + U.util.byId(WAREHOUSES, dst).ar, created_by: 'أمين المخزن' });
          pushMove({ id: U.util.uid('mv'), doc: tdoc, date: date, warehouse_id: dst, product_id: tp.id, qty: tq,
            unit_cost: tb.avg, source_type: 'transfer_in', source_id: 'tr-' + tdoc, note: 'تحويل من ' + U.util.byId(WAREHOUSES, src).ar, created_by: 'أمين المخزن' });
        }
      }
      if (d === -7 || d === -21) {
        var cp = pick(PRODUCTS), cw = 'w1', cb = bal(cw, cp.id);
        var diff = rnd() < 0.5 ? -Math.min(cb.qty - 1, int(1, 3)) : int(1, 4);
        if (diff !== 0 && cb.qty + diff >= 0) {
          pushMove({ id: U.util.uid('mv'), doc: docOf('count'), date: date, warehouse_id: cw, product_id: cp.id, qty: diff,
            unit_cost: cb.avg, source_type: 'count_adjust', source_id: 'cnt-' + d, reason_code: 'count_error',
            note: 'جرد جزئي — فرق فعلي', created_by: 'محمد عبد الله' });
        }
        var wp = pick(PRODUCTS), wb = bal('w1', wp.id);
        var wq = Math.min(wb.qty, int(1, 2));
        if (wq > 0) {
          pushMove({ id: U.util.uid('mv'), doc: docOf('waste'), date: date, warehouse_id: 'w1', product_id: wp.id, qty: -wq,
            unit_cost: wb.avg, source_type: 'waste', source_id: 'wst-' + d, reason_code: 'damage', note: 'تلف أثناء التركيب', created_by: 'محمد عبد الله' });
        }
      }
    }

    DB.movements.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });

    /* payments for paid invoices */
    DB.invoices.forEach(function (inv) {
      var total = invoiceTotal(inv);
      if (inv.status === 'paid') {
        DB.payments.push({ id: U.util.uid('pm'), supplier_id: inv.supplier_id, date: capToday(U.util.addDays(inv.date, 3)), amount: total,
          treasury_id: 't1', method: 'cash', invoice_id: inv.id, no: 'PMT-2026-0' + (DB.payments.length + 11) });
      }
      if (inv.status === 'financially_approved') {
        DB.payments.push({ id: U.util.uid('pm'), supplier_id: inv.supplier_id, date: capToday(U.util.addDays(inv.date, 5)), amount: U.util.round(total * 0.4, 2),
          treasury_id: 't2', method: 'transfer', invoice_id: inv.id, no: 'PMT-2026-0' + (DB.payments.length + 11) });
      }
    });
    return DB;
  }

  function lineNet(l) {
    var gross = l.qty * l.unit_cost;
    return U.util.round(gross * (1 - (l.discount_pct || 0) / 100), 2);
  }
  function invoiceTotal(inv) {
    var net = U.util.sum(inv.lines, lineNet);
    return U.util.round(net - (inv.discount || 0), 2);
  }
  function invoiceReceivedValue(inv) {
    return U.util.round(U.util.sum(inv.lines, function (l) {
      var per = l.unit_cost * (1 - (l.discount_pct || 0) / 100);
      return per * l.received_qty;
    }), 2);
  }
  function invoicePaid(inv) {
    return U.util.round(U.util.sum(DB.payments.filter(function (p) { return p.invoice_id === inv.id; }), function (p) { return p.amount; }), 2);
  }
  function invoiceVat(inv) {
    return U.util.round(U.util.sum(inv.lines, function (l) {
      var p = U.util.byId(PRODUCTS, l.product_id);
      return lineNet(l) * ((p ? p.vat : 14) / 100);
    }), 2);
  }

  /* ------------------------------------------------------------------ *
   * RPC handlers
   * ------------------------------------------------------------------ */
  function guard(msg, code) { var e = new Error(msg); e.code = code || 'GUARD'; throw e; }

  var H = U.demo.handlers;

  H.erp_meta = function () {
    return {
      branches: DB.branches, warehouses: DB.warehouses, products: DB.products, suppliers: DB.suppliers,
      treasuries: DB.treasuries, customers: DB.customers, units: DB.units,
      demo: true, tenant: 'demo-test-tenant', company: U.config.company
    };
  };

  var SOURCE_LABEL = {
    opening: { ar: 'رصيد افتتاحي', en: 'Opening', tone: 'neutral' },
    purchase: { ar: 'شراء', en: 'Purchase', tone: 'info' },
    purchase_return: { ar: 'مرتجع شراء', en: 'Purchase return', tone: 'warn' },
    sale: { ar: 'بيع', en: 'Sale', tone: 'ok' },
    sale_return: { ar: 'مرتجع بيع', en: 'Sale return', tone: 'warn' },
    transfer_in: { ar: 'تحويل وارد', en: 'Transfer in', tone: 'info' },
    transfer_out: { ar: 'تحويل صادر', en: 'Transfer out', tone: 'info' },
    count_adjust: { ar: 'تسوية جرد', en: 'Count adjustment', tone: 'neutral' },
    waste: { ar: 'هالك', en: 'Waste', tone: 'bad' },
    repair_part: { ar: 'قطعة صيانة', en: 'Repair part', tone: 'neutral' }
  };
  U.demo.labels = { source: SOURCE_LABEL, reasons: REASONS, invoiceStatus: {
    draft: { ar: 'مسودة', en: 'Draft', tone: 'neutral' },
    awaiting_receipt: { ar: 'بانتظار الاستلام', en: 'Awaiting receipt', tone: 'warn' },
    partially_received: { ar: 'استلام جزئي', en: 'Partially received', tone: 'info' },
    received: { ar: 'مستلمة', en: 'Received', tone: 'info' },
    financially_approved: { ar: 'معتمدة ماليًا', en: 'Financially approved', tone: 'ok' },
    paid: { ar: 'مدفوعة', en: 'Paid', tone: 'ok' },
    partially_paid: { ar: 'مدفوعة جزئيًا', en: 'Partially paid', tone: 'warn' },
    cancelled: { ar: 'ملغاة', en: 'Cancelled', tone: 'bad' }
  } };

  H.erp_stock_ledger = function (a) {
    var rows = DB.movements.slice();
    if (a.from) rows = rows.filter(function (m) { return m.date >= a.from; });
    if (a.to) rows = rows.filter(function (m) { return m.date <= a.to; });
    if (a.warehouse_id) rows = rows.filter(function (m) { return m.warehouse_id === a.warehouse_id; });
    if (a.product_id) rows = rows.filter(function (m) { return m.product_id === a.product_id; });
    if (a.source_group && a.source_group !== 'all') {
      var g = a.source_group;
      rows = rows.filter(function (m) {
        if (g === 'in') return m.qty > 0;
        if (g === 'out') return m.qty < 0;
        if (g === 'purchase') return m.source_type === 'purchase' || m.source_type === 'purchase_return';
        if (g === 'sale') return m.source_type === 'sale' || m.source_type === 'sale_return';
        if (g === 'transfer') return m.source_type === 'transfer_in' || m.source_type === 'transfer_out';
        if (g === 'adjust') return m.source_type === 'count_adjust' || m.source_type === 'waste';
        return true;
      });
    }
    if (a.q) {
      var q = String(a.q).toLowerCase();
      rows = rows.filter(function (m) {
        var p = U.util.byId(PRODUCTS, m.product_id) || {};
        return (m.doc + ' ' + (p.sku || '') + ' ' + (p.ar || '') + ' ' + (p.en || '') + ' ' + (m.note || '')).toLowerCase().indexOf(q) >= 0;
      });
    }
    rows = U.util.sortBy(rows, function (m) { return m.date; }, 'desc');
    var all = rows.length;
    var page = a.page || 1, size = a.page_size || 25;
    var slice = rows.slice((page - 1) * size, page * size);
    return {
      rows: slice, count: all, page: page, page_size: size,
      totals: {
        count: all,
        in_qty: U.util.sum(rows.filter(function (m) { return m.qty > 0; }), function (m) { return m.qty; }),
        out_qty: U.util.sum(rows.filter(function (m) { return m.qty < 0; }), function (m) { return Math.abs(m.qty); }),
        in_value: U.util.round(U.util.sum(rows.filter(function (m) { return m.qty > 0; }), function (m) { return m.value; }), 2),
        out_value: U.util.round(U.util.sum(rows.filter(function (m) { return m.qty < 0; }), function (m) { return m.value; }), 2)
      }
    };
  };

  H.erp_stock_balances = function (a) {
    var out = [];
    /* value at a date: quantities recomputed from movements up to a.as_of.
       Cost is still the cached average — the server must compute the average
       cost as of that date from the ledger (see handover doc). */
    var asOfQty = null;
    if (a.as_of) {
      asOfQty = {};
      DB.movements.forEach(function (m) {
        if (m.date > a.as_of) return;
        var k = m.warehouse_id + '|' + m.product_id;
        asOfQty[k] = (asOfQty[k] || 0) + m.qty;
      });
    }
    Object.keys(DB.balances).forEach(function (k) {
      var parts = k.split('|');
      var w = parts[0], pid = parts[1], b = DB.balances[k];
      var p = U.util.byId(PRODUCTS, pid);
      if (!p || !b) return;
      if (a.warehouse_id && w !== a.warehouse_id) return;
      if (a.q) {
        var q = String(a.q).toLowerCase();
        if ((p.sku + ' ' + p.ar + ' ' + p.en).toLowerCase().indexOf(q) < 0) return;
      }
      var qty = asOfQty ? U.util.round(asOfQty[k] || 0, 3) : b.qty;
      if (asOfQty && Math.abs(qty) < 0.0005) return;
      var cost_value = U.util.round(qty * b.avg, 2);
      var retail = U.util.round(qty * p.price, 2);
      var status = qty <= 0 ? 'out' : (qty <= p.min ? 'low' : 'ok');
      if (a.low_only && status === 'ok') return;
      out.push({ warehouse_id: w, product_id: pid, qty: qty, avg_cost: b.avg, cost_value: cost_value, retail_value: retail,
        margin: retail - cost_value, status: status, min_qty: p.min });
    });
    out = U.util.sortBy(out, function (x) { return U.util.byId(PRODUCTS, x.product_id).sku; });
    return {
      rows: out,
      totals: {
        cost_value: U.util.round(U.util.sum(out, function (x) { return x.cost_value; }), 2),
        retail_value: U.util.round(U.util.sum(out, function (x) { return x.retail_value; }), 2),
        margin: U.util.round(U.util.sum(out, function (x) { return x.margin; }), 2),
        low: out.filter(function (x) { return x.status !== 'ok'; }).length
      }
    };
  };

  H.erp_stock_reconcile = function () {
    var bad = [];
    var perKey = {};
    DB.movements.forEach(function (m) {
      var k = m.warehouse_id + '|' + m.product_id;
      perKey[k] = (perKey[k] || 0) + m.qty;
    });
    Object.keys(DB.balances).forEach(function (k) {
      var diff = U.util.round((perKey[k] || 0) - DB.balances[k].qty, 3);
      if (Math.abs(diff) > 0.0005) bad.push({ key: k, ledger: perKey[k], cached: DB.balances[k].qty, diff: diff });
    });
    return { ok: bad.length === 0, checked: Object.keys(DB.balances).length, mismatches: bad };
  };

  H.erp_stock_move = function (a) {
    var p = U.util.byId(PRODUCTS, a.product_id);
    if (!p) guard('الصنف غير موجود.', 'ITEM');
    var b = DB.balances[a.warehouse_id + '|' + a.product_id] || { qty: 0, avg: p.cost };
    var qty = Number(a.qty);
    if (!qty) guard('الكمية يجب أن تكون أكبر من صفر.', 'QTY');
    if (qty < 0 && b.qty + qty < 0 && !p.allow_negative) {
      guard('الكمية المتاحة ' + U.fmt.qty(b.qty) + '، مطلوب ' + U.fmt.qty(Math.abs(qty)) + ' — ' + p.ar +
        '. لا يمكن أن يصبح الرصيد سالبًا؛ راجع المستند أو حوّل من مستودع آخر.', 'NEGATIVE_STOCK');
    }
    var doc = a.doc || ('ADJ-2026-0' + String(DB.movements.length % 99).padStart(2, '0'));
    var mv = {
      id: U.util.uid('mv'), doc: doc, date: a.date || U.util.todayISO(), warehouse_id: a.warehouse_id, product_id: a.product_id,
      qty: qty, unit_cost: a.unit_cost !== undefined ? Number(a.unit_cost) : b.avg, source_type: a.source_type || 'count_adjust',
      source_id: a.client_ref || U.util.uid('ref'), reason_code: a.reason_code || '', note: a.note || '', created_by: U.state.user.name_ar
    };
    /* reuse pushMove logic through a tiny re-implementation (demo only) */
    var k = a.warehouse_id + '|' + a.product_id;
    var cur = DB.balances[k] || { qty: 0, avg: p.cost };
    var avg = cur.avg;
    if (qty > 0) avg = (cur.qty * cur.avg + qty * mv.unit_cost) / (cur.qty + qty);
    DB.balances[k] = { qty: U.util.round(cur.qty + qty, 3), avg: U.util.round(avg, 4) };
    mv.balance_after = DB.balances[k].qty;
    mv.unit_cost = U.util.round(qty > 0 ? mv.unit_cost : avg, 4);
    mv.value = U.util.round(Math.abs(qty) * mv.unit_cost, 2);
    DB.movements.push(mv);
    return { ok: true, movement: mv, balance: DB.balances[k] };
  };

  /* physical count: one row per item, difference posted as count_adjust */
  H.erp_stock_count = function (a) {
    var wh = a.warehouse_id;
    var date = a.date || U.util.todayISO();
    var posted = 0, skipped = 0, lines = [];
    (a.lines || []).forEach(function (l) {
      var b = DB.balances[wh + '|' + l.product_id] || { qty: 0, avg: 0 };
      var counted = Number(l.counted_qty);
      if (l.counted_qty === null || l.counted_qty === undefined || l.counted_qty === '' || isNaN(counted)) { skipped += 1; return; }
      var diff = U.util.round(counted - b.qty, 3);
      if (Math.abs(diff) < 0.0005) { skipped += 1; lines.push({ product_id: l.product_id, diff: 0 }); return; }
      H.erp_stock_move({
        product_id: l.product_id, warehouse_id: wh, qty: diff, date: date,
        source_type: 'count_adjust', reason_code: 'count',
        doc: a.doc || ('CNT-' + date.slice(0, 4) + '-0' + String(DB.movements.length % 99).padStart(2, '0')),
        client_ref: a.client_ref, note: 'تسوية جرد — الفرق ' + diff
      });
      posted += 1;
      lines.push({ product_id: l.product_id, diff: diff });
    });
    return { ok: true, posted: posted, skipped: skipped, lines: lines };
  };

  H.erp_item_card = function (a) {
    var p = U.util.byId(PRODUCTS, a.product_id);
    if (!p) guard('الصنف غير موجود.', 'ITEM');
    var moves = DB.movements.filter(function (m) { return m.product_id === a.product_id; });
    var perWh = U.util.groupBy(moves, function (m) { return m.warehouse_id; });
    var balances = Object.keys(perWh).map(function (w) {
      var b = DB.balances[w + '|' + a.product_id] || { qty: 0, avg: 0 };
      return { warehouse_id: w, qty: b.qty, avg_cost: b.avg, value: U.util.round(b.qty * b.avg, 2) };
    }).filter(function (x) { return Math.abs(x.qty) > 0.0005 || x.value > 0; });
    return {
      product: p, balances: balances,
      total_qty: U.util.sum(balances, function (x) { return x.qty; }),
      total_value: U.util.round(U.util.sum(balances, function (x) { return x.value; }), 2),
      avg_cost: (balances[0] ? balances[0].avg_cost : p.cost),
      movements: U.util.sortBy(moves, function (m) { return m.date; }, 'desc').slice(0, 40),
      movement_count: moves.length
    };
  };

  /* ---- purchasing ---- */
  H.erp_purchase_list = function (a) {
    var rows = DB.invoices.slice();
    if (a.status && a.status !== 'all') {
      if (a.status === 'awaiting') rows = rows.filter(function (i) { return i.status === 'awaiting_receipt' || i.status === 'partially_received'; });
      else if (a.status === 'approval') rows = rows.filter(function (i) { return i.status === 'received'; });
      else rows = rows.filter(function (i) { return i.status === a.status; });
    }
    if (a.supplier_id) rows = rows.filter(function (i) { return i.supplier_id === a.supplier_id; });
    if (a.from) rows = rows.filter(function (i) { return i.date >= a.from; });
    if (a.to) rows = rows.filter(function (i) { return i.date <= a.to; });
    if (a.q) {
      var q = String(a.q).toLowerCase();
      rows = rows.filter(function (i) {
        var s = U.util.byId(SUPPLIERS, i.supplier_id) || {};
        return (i.no + ' ' + (i.paper_no || '') + ' ' + (s.ar || '') + ' ' + (s.en || '')).toLowerCase().indexOf(q) >= 0;
      });
    }
    rows = U.util.sortBy(rows, function (i) { return i.date; }, 'desc').map(function (i) {
      return {
        id: i.id, no: i.no, date: i.date, supplier_id: i.supplier_id, warehouse_id: i.warehouse_id, status: i.status,
        paper_no: i.paper_no, total: invoiceTotal(i), vat: invoiceVat(i), paid: invoicePaid(i),
        remaining: U.util.round(invoiceTotal(i) + invoiceVat(i) - invoicePaid(i), 2),
        received_value: invoiceReceivedValue(i),
        expected_date: i.expected_date || null,
        late_days: (i.expected_date && ['awaiting_receipt', 'partially_received'].indexOf(i.status) >= 0)
          ? Math.max(0, U.util.daysBetween(i.expected_date, U.util.todayISO())) : 0
      };
    });
    var counts = {
      all: DB.invoices.length,
      awaiting: DB.invoices.filter(function (i) { return i.status === 'awaiting_receipt' || i.status === 'partially_received'; }).length,
      approval: DB.invoices.filter(function (i) { return i.status === 'received'; }).length,
      paid: DB.invoices.filter(function (i) { return i.status === 'paid'; }).length,
      draft: DB.invoices.filter(function (i) { return i.status === 'draft'; }).length,
      cancelled: DB.invoices.filter(function (i) { return i.status === 'cancelled'; }).length
    };
    return {
      rows: rows, counts: counts,
      totals: {
        total: U.util.round(U.util.sum(rows.filter(function (r) { return r.status !== 'cancelled'; }), function (r) { return r.total; }), 2),
        paid: U.util.round(U.util.sum(rows.filter(function (r) { return r.status !== 'cancelled'; }), function (r) { return r.paid; }), 2),
        remaining: U.util.round(U.util.sum(rows.filter(function (r) { return r.status !== 'cancelled'; }), function (r) { return r.remaining; }), 2)
      },
      awaiting_receipt_count: counts.awaiting,
      awaiting_approval_count: counts.approval
    };
  };

  H.erp_purchase_get = function (a) {
    var inv = U.util.byId(DB.invoices, a.id);
    if (!inv) guard('الفاتورة غير موجودة.', 'NOT_FOUND');
    var s = U.util.byId(SUPPLIERS, inv.supplier_id) || {};
    var movements = DB.movements.filter(function (m) { return m.source_id === inv.id; });
    return {
      invoice: inv, supplier: s,
      total: invoiceTotal(inv), vat: invoiceVat(inv), paid: invoicePaid(inv),
      remaining: U.util.round(invoiceTotal(inv) + invoiceVat(inv) - invoicePaid(inv), 2),
      received_value: invoiceReceivedValue(inv),
      payments: DB.payments.filter(function (p) { return p.invoice_id === inv.id; }),
      movements: movements,
      treasuries: TREASURIES
    };
  };

  H.erp_purchase_receive = function (a) {
    var inv = U.util.byId(DB.invoices, a.id);
    if (!inv) guard('الفاتورة غير موجودة.', 'NOT_FOUND');
    if (['paid', 'cancelled', 'draft'].indexOf(inv.status) >= 0) guard('لا يمكن استلام فاتورة في حالة «' + inv.status + '».', 'STATE');
    var receivedNow = 0;
    (a.lines || []).forEach(function (l) {
      var line = inv.lines.filter(function (x) { return x.id === l.line_id; })[0];
      if (!line) return;
      var add = Number(l.received_qty || 0);
      if (add <= 0) return;
      if (line.received_qty + add > line.qty) {
        guard('الكمية المستلمة أكبر من المطلوبة في الصنف ' + (U.util.byId(PRODUCTS, line.product_id) || {}).ar + ' (' + line.qty + ' مطلوب).', 'OVER_RECEIVE');
      }
      line.received_qty += add;
      receivedNow += add;
      H.erp_stock_move({
        product_id: line.product_id, warehouse_id: inv.warehouse_id, qty: add, unit_cost: line.unit_cost,
        source_type: 'purchase', doc: inv.no, client_ref: inv.id, note: 'استلام — فاتورة المورد ' + (inv.paper_no || inv.no)
      });
    });
    var full = inv.lines.every(function (l) { return l.received_qty >= l.qty; });
    var any = inv.lines.some(function (l) { return l.received_qty > 0; });
    inv.status = full ? 'received' : (any ? 'partially_received' : 'awaiting_receipt');
    return { ok: true, status: inv.status, received_now: receivedNow };
  };

  H.erp_purchase_approve = function (a) {
    var inv = U.util.byId(DB.invoices, a.id);
    if (!inv) guard('الفاتورة غير موجودة.', 'NOT_FOUND');
    if (inv.status !== 'received' && inv.status !== 'partially_received') {
      guard('الاعتماد المالي يحتاج استلامًا أولًا — الفاتورة الآن «' + inv.status + '».', 'STATE');
    }
    inv.status = 'financially_approved';
    return { ok: true, status: inv.status };
  };

  H.erp_purchase_pay = function (a) {
    var inv = U.util.byId(DB.invoices, a.id);
    if (!inv) guard('الفاتورة غير موجودة.', 'NOT_FOUND');
    var amount = Number(a.amount || 0);
    var due = U.util.round(invoiceTotal(inv) + invoiceVat(inv) - invoicePaid(inv), 2);
    if (amount <= 0) guard('أدخل مبلغًا أكبر من صفر.', 'AMOUNT');
    if (amount > due + 0.009) {
      guard('المبلغ أكبر من المتبقي (' + U.fmt.money(due) + ' ج.م). الدفع لا يمكن أن يتجاوز الإجمالي — راجع الفاتورة أو سجّل دفعة مقدمة من شاشة المورد.', 'OVERPAY');
    }
    var t = U.util.byId(TREASURIES, a.treasury_id);
    if (t && amount > t.balance) {
      guard('رصيد ' + t.ar + ' ' + U.fmt.money(t.balance) + ' ج.م فقط — المطلوب ' + U.fmt.money(amount) + ' ج.م.', 'TREASURY');
    }
    if (t) t.balance = U.util.round(t.balance - amount, 2);
    DB.payments.push({ id: U.util.uid('pm'), supplier_id: inv.supplier_id, date: a.date || U.util.todayISO(), amount: amount,
      treasury_id: a.treasury_id, method: a.method || 'cash', invoice_id: inv.id, no: 'PMT-2026-0' + (DB.payments.length + 11) });
    inv.status = (invoicePaid(inv) >= U.util.round(invoiceTotal(inv) + invoiceVat(inv), 2) - 0.01) ? 'paid' : 'partially_paid';
    return { ok: true, status: inv.status, paid: invoicePaid(inv) };
  };

  H.erp_purchase_create = function (a) {
    var p = a.payload || {};
    if (!p.supplier_id) guard('اختر المورد أولًا.', 'SUPPLIER');
    if (!p.lines || !p.lines.length) guard('أضف صنفًا واحدًا على الأقل.', 'LINES');
    var no = 'PUR-2026-' + String(DB.invoices.length + 1).padStart(4, '0');
    var inv = {
      id: U.util.uid('pi'), no: no, supplier_id: p.supplier_id, warehouse_id: p.warehouse_id || 'w1',
      branch_id: (U.util.byId(WAREHOUSES, p.warehouse_id || 'w1') || {}).branch_id || 'b1',
      date: p.date || U.util.todayISO(), paper_no: p.paper_no || '', status: p.post ? 'awaiting_receipt' : 'draft',
      discount: Number(p.discount || 0), notes: p.notes || '', created_by: U.state.user.name_ar,
      lines: p.lines.map(function (l, i) {
        return { id: 'nl' + i, product_id: l.product_id, qty: Number(l.qty), received_qty: 0, returned_qty: 0,
          unit_cost: Number(l.unit_cost), discount_pct: Number(l.discount_pct || 0), note: l.note || '' };
      })
    };
    DB.invoices.unshift(inv);
    return { ok: true, invoice: inv, no: inv.no };
  };

  H.erp_supplier_list = function (a) {
    var rows = SUPPLIERS.map(function (s) {
      var invs = DB.invoices.filter(function (i) { return i.supplier_id === s.id && i.status !== 'cancelled' && i.status !== 'draft'; });
      var payments = DB.payments.filter(function (p) { return p.supplier_id === s.id; });
      var billed = U.util.sum(invs, function (i) { return invoiceTotal(i) + invoiceVat(i); });
      var paid = U.util.sum(payments, function (p) { return p.amount; });
      var last = U.util.sortBy(invs, function (i) { return i.date; }, 'desc')[0];
      var oldestOpen = U.util.sortBy(invs.filter(function (i) { return invoiceTotal(i) + invoiceVat(i) > invoicePaid(i); }), function (i) { return i.date; })[0];
      var overdueDays = oldestOpen ? Math.max(0, U.util.daysBetween(oldestOpen.date, U.util.todayISO()) - s.terms) : 0;
      return {
        id: s.id, ar: s.ar, en: s.en, code: s.code, phone: s.phone, terms: s.terms,
        balance: U.util.round(billed - paid, 2),
        last_date: last ? last.date : null,
        overdue_days: overdueDays,
        open_invoices: invs.filter(function (i) { return invoiceTotal(i) + invoiceVat(i) - invoicePaid(i) > 0.01; }).length
      };
    });
    if (a.q) {
      var q = String(a.q).toLowerCase();
      rows = rows.filter(function (r) { return (r.ar + ' ' + r.en + ' ' + r.code).toLowerCase().indexOf(q) >= 0; });
    }
    return { rows: rows, totals: { balance: U.util.round(U.util.sum(rows, function (r) { return r.balance; }), 2) } };
  };

  H.erp_supplier_get = function (a) {
    var s = U.util.byId(SUPPLIERS, a.id);
    if (!s) guard('المورد غير موجود.', 'NOT_FOUND');
    var invs = U.util.sortBy(DB.invoices.filter(function (i) { return i.supplier_id === a.id; }), function (i) { return i.date; }, 'desc');
    var payments = U.util.sortBy(DB.payments.filter(function (p) { return p.supplier_id === a.id; }), function (p) { return p.date; }, 'desc');
    var ledger = [];
    invs.filter(function (i) { return i.status !== 'draft' && i.status !== 'cancelled'; }).forEach(function (i) {
      ledger.push({ date: i.date, doc: i.no, kind: 'invoice', ref: i.id, debit: 0, credit: U.util.round(invoiceTotal(i) + invoiceVat(i), 2), note: i.paper_no ? ('فاتورة المورد ' + i.paper_no) : '', note_en: i.paper_no ? ('Supplier no. ' + i.paper_no) : '' });
    });
    payments.forEach(function (p) {
      ledger.push({ date: p.date, doc: p.no, kind: 'payment', ref: p.id, debit: p.amount, credit: 0, note: (U.util.byId(TREASURIES, p.treasury_id) || {}).ar || '', note_en: (U.util.byId(TREASURIES, p.treasury_id) || {}).en || '' });
    });
    ledger = U.util.sortBy(ledger, function (l) { return l.date; });
    var run = 0;
    ledger.forEach(function (l) { run = U.util.round(run + l.credit - l.debit, 2); l.balance = run; });

    var aging = { current: 0, b1: 0, b2: 0, b3: 0, b4: 0 };
    invs.forEach(function (i) {
      var due = U.util.round(invoiceTotal(i) + invoiceVat(i) - invoicePaid(i), 2);
      if (due <= 0.01 || i.status === 'cancelled' || i.status === 'draft') return;
      var days = U.util.daysBetween(i.date, U.util.todayISO()) - s.terms;
      if (days <= 0) aging.current += due;
      else if (days <= 30) aging.b1 += due;
      else if (days <= 60) aging.b2 += due;
      else if (days <= 90) aging.b3 += due;
      else aging.b4 += due;
    });

    /* last purchase price per item */
    var items = {};
    invs.filter(function (i) { return i.status !== 'cancelled'; }).forEach(function (i) {
      i.lines.forEach(function (l) {
        var cur = items[l.product_id];
        if (!cur || i.date > cur.date) {
          items[l.product_id] = { product_id: l.product_id, date: i.date, unit_cost: l.unit_cost, invoice: i.no, qty: l.qty };
        }
      });
    });
    var itemRows = Object.keys(items).map(function (pid) {
      var best = null;
      SUPPLIERS.forEach(function (sp) {
        var last = null;
        DB.invoices.filter(function (i) { return i.supplier_id === sp.id && i.status !== 'cancelled'; }).forEach(function (i) {
          i.lines.forEach(function (l) { if (l.product_id === pid && (!last || i.date > last.date)) last = { date: i.date, cost: l.unit_cost }; });
        });
        if (last && (!best || last.cost < best.cost)) best = { supplier_id: sp.id, cost: last.cost, date: last.date };
      });
      return { product_id: pid, last_cost: items[pid].unit_cost, last_date: items[pid].date, last_invoice: items[pid].invoice, best: best };
    });

    return {
      supplier: s, invoices: invs, payments: payments, ledger: ledger, aging: aging,
      balance: run, items: U.util.sortBy(itemRows, function (r) { return (U.util.byId(PRODUCTS, r.product_id) || {}).sku; })
    };
  };

  H.erp_stock_summary = function (a) {
    var rows = DB.movements.filter(function (m) { return (!a.from || m.date >= a.from) && (!a.to || m.date <= a.to); });
    var value = 0;
    Object.keys(DB.balances).forEach(function (k) {
      var b = DB.balances[k];
      value += b.qty * b.avg;
    });
    var low = 0;
    Object.keys(DB.balances).forEach(function (k) {
      var pid = k.split('|')[1], p = U.util.byId(PRODUCTS, pid), b = DB.balances[k];
      if (p && b.qty <= p.min) low += 1;
    });
    /* daily series for the chart: net movement value per day */
    var byDay = {};
    rows.forEach(function (m) {
      byDay[m.date] = byDay[m.date] || { in: 0, out: 0 };
      if (m.qty > 0) byDay[m.date].in += m.value; else byDay[m.date].out += m.value;
    });
    var days = Object.keys(byDay).sort();
    return {
      stock_value: U.util.round(value, 2),
      movement_count: rows.length,
      low_count: low,
      in_value: U.util.round(U.util.sum(rows.filter(function (m) { return m.qty > 0; }), function (m) { return m.value; }), 2),
      out_value: U.util.round(U.util.sum(rows.filter(function (m) { return m.qty < 0; }), function (m) { return m.value; }), 2),
      series: days.map(function (d) { return { date: d, in: U.util.round(byDay[d].in, 2), out: U.util.round(byDay[d].out, 2) }; })
    };
  };

  H.erp_purchase_summary = function (a) {
    var invs = DB.invoices.filter(function (i) { return i.status !== 'cancelled' && i.status !== 'draft'; });
    var byMonth = {};
    invs.forEach(function (i) {
      var m = i.date.slice(0, 7);
      byMonth[m] = (byMonth[m] || 0) + invoiceTotal(i) + invoiceVat(i);
    });
    return {
      total: U.util.round(U.util.sum(invs, function (i) { return invoiceTotal(i) + invoiceVat(i); }), 2),
      paid: U.util.round(U.util.sum(invs, function (i) { return invoicePaid(i); }), 2),
      remaining: U.util.round(U.util.sum(invs, function (i) { return invoiceTotal(i) + invoiceVat(i) - invoicePaid(i); }), 2),
      count: invs.length,
      series: Object.keys(byMonth).sort().map(function (m) { return { month: m, value: U.util.round(byMonth[m], 2) }; })
    };
  };

  U.demo.reset = function () { DB = build(); return DB; };
  U.demo.db = function () { return DB; };
  U.demo.build = build;
  U.demo.invoiceTotal = invoiceTotal;
  U.demo.invoicePaid = invoicePaid;
  U.demo.invoiceVat = invoiceVat;
  U.demo.invoiceReceivedValue = invoiceReceivedValue;
  U.demo.lineNet = lineNet;

  build();
})();
/* ------------------------------------------------------------------ *
 * UNO Core ERP — UI components (pure string builders + tiny binders)
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  var U = window.UnoERP;
  if (!U || !U.__kernel) return;
  var esc = U.esc, t = U.t, fmt = U.fmt, icon = U.icon, L = U.L;
  var gid = 0;

  var ui = {};

  ui.tone = function (tone) {
    return ['ok', 'warn', 'bad', 'info', 'neutral', 'brand'].indexOf(tone) >= 0 ? tone : 'neutral';
  };

  ui.pill = function (label, tone, dot) {
    return '<span class="pill pill--' + ui.tone(tone) + '">' + (dot === false ? '' : '<i class="dot"></i>') + esc(label) + '</span>';
  };

  ui.btn = function (label, o) {
    o = o || {};
    var kind = o.kind || 'outline';
    var cls = 'btn btn--' + kind + (o.size === 'sm' ? ' btn--sm' : '') + (o.cls ? ' ' + o.cls : '');
    var attrs = '';
    if (o.act) attrs += ' data-act="' + esc(o.act) + '"';
    if (o.id) attrs += ' id="' + esc(o.id) + '"';
    if (o.title) attrs += ' title="' + esc(o.title) + '" aria-label="' + esc(o.title) + '"';
    if (o.disabled) attrs += ' disabled';
    if (o.data) Object.keys(o.data).forEach(function (k) { attrs += ' data-' + k + '="' + esc(o.data[k]) + '"'; });
    if (o.type) attrs += ' type="' + esc(o.type) + '"';
    return '<button class="' + cls + '"' + attrs + '>' + (o.icon ? icon(o.icon, o.size === 'sm' ? 16 : 18) : '') +
      '<span>' + esc(label) + '</span>' + (o.trailingIcon ? icon(o.trailingIcon, 16) : '') + '</button>';
  };

  ui.iconBtn = function (name, o) {
    o = o || {};
    return '<button class="icon-btn" data-act="' + esc(o.act || '') + '" title="' + esc(o.title || '') + '" aria-label="' + esc(o.title || '') + '"' +
      (o.data ? Object.keys(o.data).map(function (k) { return ' data-' + k + '="' + esc(o.data[k]) + '"'; }).join('') : '') + '>' + icon(name, o.size || 18) + '</button>';
  };

  ui.card = function (o) {
    o = o || {};
    return '<section class="card' + (o.cls ? ' ' + o.cls : '') + '"' + (o.id ? ' id="' + esc(o.id) + '"' : '') + '>' +
      (o.title || o.actions ? '<header class="card-head">' +
        '<div class="card-head-txt">' + (o.title ? '<h3>' + (o.rawTitle ? o.title : esc(o.title)) + '</h3>' : '') +
        (o.sub ? '<p class="sub">' + esc(o.sub) + '</p>' : '') + '</div>' +
        (o.actions ? '<div class="card-actions">' + o.actions + '</div>' : '') + '</header>' : '') +
      '<div class="card-body' + (o.flush ? ' card-body--flush' : '') + '">' + (o.body || '') + '</div></section>';
  };

  ui.kpi = function (o) {
    var delta = '';
    if (o.delta !== undefined && o.delta !== null && o.delta !== '') {
      var dir = o.deltaDir || (Number(o.delta) >= 0 ? 'up' : 'down');
      delta = '<span class="delta delta--' + dir + '">' + icon(dir === 'up' ? 'arrowUp' : dir === 'down' ? 'arrowDown' : 'clock', 13) +
        '<span class="num">' + esc(o.delta) + '</span></span>';
    }
    return '<div class="kpi' + (o.cls ? ' ' + o.cls : '') + '">' +
      '<div class="kpi-top"><span class="kpi-label">' + esc(o.label) + '</span>' + (o.badge || '') + '</div>' +
      '<div class="kpi-val"><span class="num">' + esc(o.value) + '</span>' + (o.cur ? '<span class="cur">' + esc(t('app.currency')) + '</span>' : '') + delta + '</div>' +
      (o.note ? '<div class="kpi-note">' + esc(o.note) + '</div>' : '') +
      (o.spark ? ui.sparkline(o.spark, o.sparkTone) : '') + '</div>';
  };

  ui.sparkline = function (values, tone) {
    values = (values || []).filter(function (v) { return v !== null && v !== undefined; });
    if (values.length < 2) return '<div class="spark spark--empty"></div>';
    var w = 120, h = 30, min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    var span = (max - min) || 1;
    var pts = values.map(function (v, i) {
      return [i * (w / (values.length - 1)), h - 3 - ((v - min) / span) * (h - 8)];
    });
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = line + ' L' + w + ' ' + h + ' L0 ' + h + ' Z';
    var id = 'sg' + (++gid);
    var color = tone === 'ok' ? 'var(--ok-ink)' : tone === 'bad' ? 'var(--bad-ink)' : tone === 'warn' ? 'var(--warn-ink)' : 'var(--brand)';
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + color + '" stop-opacity=".22"/><stop offset="100%" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + area + '" fill="url(#' + id + ')"/>' +
      '<path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  };

  /* area chart with hover tooltip; data lives in data-chart JSON */
  ui.areaChart = function (o) {
    o = o || {};
    var w = 720, h = o.height || 220, pad = { t: 14, r: 8, b: 26, s: 44 };
    var series = o.series || [];
    var labels = o.labels || [];
    var all = [];
    series.forEach(function (s) { s.values.forEach(function (v) { all.push(v); }); });
    var max = Math.max.apply(null, all.concat([1]));
    var niceMax = Math.ceil(max / 1000) * 1000 || max;
    var n = labels.length || 1;
    var x = function (i) { return pad.s + (i * (w - pad.s - pad.r) / Math.max(1, n - 1)); };
    var y = function (v) { return pad.t + (h - pad.t - pad.b) * (1 - v / niceMax); };
    var paths = series.map(function (s, si) {
      var d = s.values.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
      var area = d + ' L' + x(s.values.length - 1).toFixed(1) + ' ' + (h - pad.b) + ' L' + x(0).toFixed(1) + ' ' + (h - pad.b) + ' Z';
      var id = 'ag' + (++gid) + '-' + si;
      return '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="' + s.color + '" stop-opacity="' + (si === 0 ? '.20' : '.10') + '"/>' +
        '<stop offset="100%" stop-color="' + s.color + '" stop-opacity="0"/></linearGradient></defs>' +
        (si === 0 ? '<path d="' + area + '" fill="url(#' + id + ')"/>' : '') +
        '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    }).join('');
    var grid = '';
    for (var gi = 0; gi <= 3; gi++) {
      var gv = niceMax * gi / 3, gy = y(gv);
      grid += '<line x1="' + pad.s + '" x2="' + (w - pad.r) + '" y1="' + gy.toFixed(1) + '" y2="' + gy.toFixed(1) + '" stroke="var(--line-soft)" stroke-width="1"/>' +
        '<text x="' + (pad.s - 8) + '" y="' + (gy + 4).toFixed(1) + '" text-anchor="end" class="chart-tick">' + fmt.num(Math.round(gv)) + '</text>';
    }
    var xlabels = labels.map(function (lb, i) {
      if (n > 8 && i % Math.ceil(n / 7) !== 0 && i !== n - 1) return '';
      return '<text x="' + x(i).toFixed(1) + '" y="' + (h - 6) + '" text-anchor="middle" class="chart-tick">' + esc(lb) + '</text>';
    }).join('');
    var dots = series.map(function (s, si) {
      return s.values.map(function (v, i) {
        return '<circle class="chart-dot" data-s="' + si + '" data-i="' + i + '" cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="2.6" fill="var(--surface)" stroke="' + s.color + '" stroke-width="1.8"/>';
      }).join('');
    }).join('');
    var payload = JSON.stringify({ labels: labels, series: series.map(function (s) { return { name: s.name, values: s.values, color: s.color }; }) });
    return '<div class="chart" data-chart="' + esc(payload) + '">' +
      '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" class="chart-svg" role="img">' +
      grid + paths + dots + xlabels + '</svg>' +
      '<div class="chart-tip" hidden></div></div>';
  };

  ui.tabs = function (items, active, act) {
    return '<div class="tabs" role="tablist">' + items.map(function (it) {
      var on = it.id === active;
      return '<button class="tab' + (on ? ' is-active' : '') + '" role="tab" aria-selected="' + on + '" data-act="' + esc(act) + '" data-id="' + esc(it.id) + '">' +
        esc(it.label) + (it.count !== undefined && it.count !== null ? '<span class="tab-count num">' + fmt.num(it.count) + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  };

  ui.segmented = function (items, active, act) {
    return '<div class="segmented" role="group">' + items.map(function (it) {
      return '<button class="seg' + (it.id === active ? ' is-active' : '') + '" data-act="' + esc(act) + '" data-id="' + esc(it.id) + '">' + esc(it.label) + '</button>';
    }).join('') + '</div>';
  };

  ui.chip = function (label, value, act, tone) {
    return '<span class="chip' + (tone ? ' chip--' + tone : '') + '"><span class="chip-k">' + esc(label) + '</span>' +
      '<span class="chip-v">' + esc(value) + '</span>' +
      (act ? '<button class="chip-x" data-act="' + esc(act) + '" aria-label="' + esc(t('app.reset')) + '">' + icon('x', 13) + '</button>' : '') + '</span>';
  };

  ui.field = function (o) {
    var id = o.id || ('f-' + (++gid));
    var lab = '<label class="field-label" for="' + id + '">' + esc(o.label) + (o.req ? '<span class="req">*</span>' : '') + '</label>';
    var input;
    var common = ' id="' + id + '" name="' + esc(o.name || id) + '"' + (o.act ? ' data-act="' + esc(o.act) + '"' : '') +
      (o.disabled ? ' disabled' : '') + (o.readonly ? ' readonly' : '') + (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '');
    if (o.type === 'select') {
      input = '<div class="select-wrap"><select class="input"' + common + '>' + (o.options || []).map(function (op) {
        return '<option value="' + esc(op.value) + '"' + (String(op.value) === String(o.value) ? ' selected' : '') + '>' + esc(op.label) + '</option>';
      }).join('') + '</select>' + icon('chevDown', 16) + '</div>';
    } else if (o.type === 'textarea') {
      input = '<textarea class="input textarea" rows="' + (o.rows || 3) + '"' + common + '>' + esc(o.value || '') + '</textarea>';
    } else if (o.type === 'switch') {
      input = '<label class="switch"><input type="checkbox"' + common + (o.value ? ' checked' : '') + '><span class="track"></span><span class="switch-lbl">' + esc(o.switchLabel || '') + '</span></label>';
    } else {
      input = '<input class="input' + (o.type === 'number' ? ' input--num' : '') + '" type="' + (o.type || 'text') + '"' + common +
        (o.value !== undefined && o.value !== null ? ' value="' + esc(o.value) + '"' : '') +
        (o.step ? ' step="' + esc(o.step) + '"' : '') + (o.min !== undefined ? ' min="' + esc(o.min) + '"' : '') + '>' +
        (o.unit ? '<span class="input-unit">' + esc(o.unit) + '</span>' : '');
    }
    return '<div class="field' + (o.cls ? ' ' + o.cls : '') + '"' + (o.err ? ' data-invalid="1"' : '') + '>' + lab +
      '<div class="input-wrap">' + input + '</div>' +
      (o.err ? '<p class="field-err">' + icon('alert', 13) + esc(o.err) + '</p>' : (o.hint ? '<p class="field-help">' + esc(o.hint) + '</p>' : '')) + '</div>';
  };

  ui.table = function (o) {
    o = o || {};
    var cols = o.cols || [], rows = o.rows || [];
    var head = '<tr>' + (o.selectable ? '<th class="c-check"><input type="checkbox" class="cb" data-act="select-all"' + (o.allSelected ? ' checked' : '') + ' aria-label="' + esc(t('app.all')) + '"></th>' : '') +
      cols.map(function (c) {
        return '<th class="' + (c.align ? 'ta-' + c.align : '') + (c.cls ? ' ' + c.cls : '') + '"' + (c.w ? ' style="width:' + c.w + '"' : '') + ' scope="col">' + esc(c.label) + '</th>';
      }).join('') + '</tr>';
    var body = '';
    if (o.groups && o.groups.length) {
      o.groups.forEach(function (g) {
        body += '<tr class="group-row"><td colspan="' + (cols.length + (o.selectable ? 1 : 0)) + '">' +
          '<span class="group-title">' + esc(g.label) + '</span><span class="group-meta num">' + esc(g.meta || '') + '</span></td></tr>';
        g.rows.forEach(function (r) { body += row(r); });
      });
    } else if (!rows.length) {
      body = '<tr class="tbl-empty-row"><td colspan="' + (cols.length + (o.selectable ? 1 : 0)) + '">' + (o.empty || ui.empty({})) + '</td></tr>';
    } else {
      rows.forEach(function (r) { body += row(r); });
    }
    function row(r) {
      var rid = o.rowId ? o.rowId(r) : '';
      return '<tr class="' + (o.rowCls ? o.rowCls(r) : '') + (o.selected && rid && o.selected.indexOf(rid) >= 0 ? ' is-selected' : '') + '"' +
        (o.rowAct ? ' data-act="' + esc(o.rowAct) + '" data-id="' + esc(rid) + '" tabindex="0"' : '') + '>' +
        (o.selectable ? '<td class="c-check" data-th=""><input type="checkbox" class="cb" data-act="select-row" data-id="' + esc(rid) + '"' +
          (o.selected && o.selected.indexOf(rid) >= 0 ? ' checked' : '') + ' aria-label="' + esc(t('app.all')) + '"></td>' : '') +
        cols.map(function (c) {
          return '<td class="' + (c.align ? 'ta-' + c.align : '') + (c.cls ? ' ' + c.cls : '') + '" data-th="' + esc(c.label) + '">' + (c.cell ? c.cell(r) : esc(r[c.key])) + '</td>';
        }).join('') + '</tr>';
    }
    var foot = '';
    if (o.foot) {
      foot = '<tfoot><tr>' + (o.selectable ? '<td></td>' : '') + cols.map(function (c, i) {
        var v = o.foot[c.key];
        return '<td class="' + (c.align ? 'ta-' + c.align : '') + '">' + (v !== undefined ? v : (i === 0 ? esc(o.footLabel || t('app.total')) : '')) + '</td>';
      }).join('') + '</tr></tfoot>';
    }
    return '<div class="tbl-wrap' + (o.scroll ? ' tbl-wrap--scroll' : '') + '" data-density="' + esc(U.state.density) + '">' +
      '<table class="tbl' + (o.cls ? ' ' + o.cls : '') + '"><thead>' + head + '</thead><tbody>' + body + '</tbody>' + foot + '</table></div>';
  };

  ui.totalsStrip = function (items, note) {
    return '<div class="totals-strip">' + items.map(function (i) {
      return '<div class="totals-item"><span class="totals-k">' + esc(i.label) + '</span><span class="totals-v num' + (i.tone ? ' is-' + i.tone : '') + '">' + esc(i.value) + '</span></div>';
    }).join('') + (note ? '<div class="totals-note">' + esc(note) + '</div>' : '') + '</div>';
  };

  ui.pager = function (o) {
    var pages = Math.max(1, Math.ceil(o.count / o.size));
    var from = o.count === 0 ? 0 : (o.page - 1) * o.size + 1;
    var to = Math.min(o.count, o.page * o.size);
    var nums = [];
    var start = Math.max(1, Math.min(o.page - 2, pages - 4));
    for (var i = start; i <= Math.min(pages, start + 4); i++) nums.push(i);
    return '<div class="pager">' +
      '<span class="pager-info">' + esc(t('app.showing', { a: fmt.num(from), b: fmt.num(to), c: fmt.num(o.count) })) + '</span>' +
      '<div class="pager-btns">' +
      '<button class="pg" data-act="' + esc(o.act) + '" data-page="' + (o.page - 1) + '"' + (o.page <= 1 ? ' disabled' : '') + ' aria-label="' + esc(t('app.page')) + '">' + icon('chevEnd', 16) + '</button>' +
      nums.map(function (n) { return '<button class="pg' + (n === o.page ? ' is-active' : '') + '" data-act="' + esc(o.act) + '" data-page="' + n + '">' + n + '</button>'; }).join('') +
      '<button class="pg" data-act="' + esc(o.act) + '" data-page="' + (o.page + 1) + '"' + (o.page >= pages ? ' disabled' : '') + '>' + icon('chevStart', 16) + '</button>' +
      '</div>' +
      '<label class="pager-size"><select class="input input--xs" data-act="' + esc(o.act || '') + '-size">' +
      [10, 25, 50, 100].map(function (n) { return '<option' + (n === o.size ? ' selected' : '') + '>' + n + '</option>'; }).join('') +
      '</select><span>' + esc(t('app.perPage')) + '</span></label></div>';
  };

  ui.empty = function (o) {
    o = o || {};
    return '<div class="empty"><div class="empty-ic">' + icon(o.icon || 'box', 22) + '</div>' +
      '<p class="empty-t">' + esc(o.title || t('app.empty')) + '</p>' +
      '<p class="empty-h">' + esc(o.hint || t('app.emptyHint')) + '</p>' +
      (o.action || '') + '</div>';
  };

  ui.banner = function (o) {
    return '<div class="banner banner--' + ui.tone(o.tone) + '">' + icon(o.icon || 'info', 18) +
      '<div class="banner-txt">' + (o.title ? '<b>' + esc(o.title) + '</b>' : '') + (o.text ? '<span>' + esc(o.text) + '</span>' : '') + '</div>' +
      (o.action || '') + '</div>';
  };

  ui.steps = function (items, activeIdx) {
    return '<ol class="steps">' + items.map(function (s, i) {
      var st = i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'todo';
      return '<li class="step step--' + st + '"><span class="step-dot">' + (st === 'done' ? icon('check', 12) : (i + 1)) + '</span>' +
        '<span class="step-lbl">' + esc(s) + '</span></li>';
    }).join('') + '</ol>';
  };

  ui.sectionTitle = function (n, title, action) {
    return '<div class="sec-title"><span class="sec-n">' + esc(n) + '</span><h3>' + esc(title) + '</h3>' + (action ? '<div class="sec-act">' + action + '</div>' : '') + '</div>';
  };

  ui.avatar = function (name, tone) {
    var ch = (name || '?').trim().charAt(0);
    var tones = ['brand', 'ok', 'info', 'warn', 'neutral', 'bad'];
    var idx = 0;
    for (var i = 0; i < (name || '').length; i++) idx += name.charCodeAt(i);
    return '<span class="avatar avatar--' + (tone || tones[idx % tones.length]) + '">' + esc(ch) + '</span>';
  };

  ui.overlay = function (o) {
    return '<div class="ovl" data-ovl="' + esc(o.id) + '"><div class="ovl-scrim" data-act="' + esc(o.closeAct || 'close-sheet') + '"></div>' +
      '<div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(o.title || '') + '">' +
      '<header class="sheet-head"><div><h3>' + esc(o.title || '') + '</h3>' + (o.sub ? '<p class="sub">' + esc(o.sub) + '</p>' : '') + '</div>' +
      '<button class="icon-btn" data-act="' + esc(o.closeAct || 'close-sheet') + '" aria-label="' + esc(t('app.close')) + '">' + icon('x', 18) + '</button></header>' +
      '<div class="sheet-body">' + (o.body || '') + '</div>' +
      (o.foot ? '<footer class="sheet-foot">' + o.foot + '</footer>' : '') + '</div></div>';
  };

  ui.toast = function (msg, tone) {
    var host = document.querySelector('.uerp .toast-host');
    if (!host) return;
    var el = document.createElement('div');
    el.className = 'toast toast--' + ui.tone(tone || 'ok');
    el.setAttribute('role', 'status');
    el.innerHTML = icon(tone === 'bad' ? 'alert' : 'check', 16) + '<span>' + esc(msg) + '</span>';
    host.appendChild(el);
    setTimeout(function () { el.classList.add('is-out'); }, 3600);
    setTimeout(function () { el.remove(); }, 4000);
  };

  ui.money = function (v, o) {
    o = o || {};
    var neg = Number(v) < 0;
    var s = '<span class="num' + (neg ? ' is-neg' : '') + (o.cls ? ' ' + o.cls : '') + '">' + esc(fmt.money(Math.abs(Number(v || 0)) * (neg ? -1 : 1))) + '</span>';
    return o.cur ? s + ' <span class="cur">' + esc(t('app.currency')) + '</span>' : s;
  };

  ui.chartLegend = function (series) {
    return '<div class="legend">' + series.map(function (s) {
      return '<span class="legend-i"><i style="background:' + s.color + '"></i>' + esc(s.name) + '</span>';
    }).join('') + '</div>';
  };

  /* ---- binders ---- */
  ui.bindCharts = function (root) {
    (root || document).querySelectorAll('.chart[data-chart]').forEach(function (box) {
      if (box.__bound) return;
      box.__bound = true;
      var data = JSON.parse(box.getAttribute('data-chart'));
      var tip = box.querySelector('.chart-tip');
      var svg = box.querySelector('svg');
      var dots = box.querySelectorAll('.chart-dot');
      var hide = function () { tip.hidden = true; dots.forEach(function (d) { d.setAttribute('r', '2.6'); }); };
      box.addEventListener('mousemove', function (e) {
        var r = svg.getBoundingClientRect();
        var rel = (e.clientX - r.left) / r.width;
        var i = Math.round(rel * (data.labels.length - 1));
        i = Math.max(0, Math.min(data.labels.length - 1, i));
        var rows = data.series.map(function (s) { return '<span class="tip-row"><i style="background:' + s.color + '"></i>' + esc(s.name) + '<b class="num">' + esc(fmt.money(s.values[i])) + '</b></span>'; }).join('');
        tip.innerHTML = '<div class="tip-h">' + esc(data.labels[i]) + '</div>' + rows;
        tip.hidden = false;
        var left = (i / Math.max(1, data.labels.length - 1)) * r.width;
        tip.style.insetInlineStart = Math.max(0, Math.min(r.width - 150, left - 60)) + 'px';
        dots.forEach(function (d) { if (Number(d.getAttribute('data-i')) === i) d.setAttribute('r', '4.4'); else d.setAttribute('r', '2.6'); });
      });
      box.addEventListener('mouseleave', hide);
    });
  };

  U.ui = ui;
})();
/* ------------------------------------------------------------------ *
 * UNO Core ERP — stylesheet, injected once, scoped to .uerp
 * Tokens match the ERP UI kit (tokens.css) so nothing fights the host.
 * Logical properties only: no left/right outside deliberate LTR islands.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  var U = window.UnoERP;
  if (!U || !U.__kernel) return;
  if (document.getElementById('uno-erp-css')) return;

  var css = `
.uerp{
  --o-50:#FFF3EB;--o-100:#FFE2CD;--o-200:#FFC49E;--o-300:#FF9F63;--o-400:#FF7A2E;--o-500:#F65A00;
  --o-600:#D94C00;--o-700:#B33E00;--o-800:#8A2E00;--o-900:#5C1F00;
  --n-0:#FFFFFF;--n-25:#FDFCFB;--n-50:#F8F6F3;--n-100:#F1EDE8;--n-200:#E7E1DA;--n-300:#D6CEC5;
  --n-400:#B5AAA1;--n-500:#8A7E75;--n-600:#6B5F57;--n-700:#4A4039;--n-800:#2E2723;--n-900:#1B1512;--n-950:#12100F;
  --canvas:#F8F6F3;--surface:#FFFFFF;--surface-2:#FDFCFB;--surface-3:#F1EDE8;
  --line:#EAE4DD;--line-soft:#F1ECE6;--line-strong:#D6CEC5;
  --ink:#1B1512;--ink-2:#6B5F57;--ink-3:#8A7E75;
  --brand:#F65A00;--brand-ink:#B33E00;--brand-fill:#C64A00;--brand-hover:#B33E00;
  --brand-soft:#FFF3EB;--brand-soft-2:#FFE9D9;
  --ok-ink:#0B6B4F;--ok-soft:#E4F5EE;--warn-ink:#8A5A00;--warn-soft:#FFF3DC;
  --bad-ink:#A32218;--bad-soft:#FDEAE7;--info-ink:#1D4ED8;--info-soft:#EAF0FF;
  --c1:#F65A00;--c2:#1F6F5C;--c3:#3C6E9E;--c4:#B4622A;--c5:#7A5AA8;--c6:#C99A16;--c7:#4B8A3E;--c8:#A8456B;
  --age-1:#0B6B4F;--age-2:#B58200;--age-3:#A32218;--age-4:#7A2A0A;
  --font:"Noto Sans Arabic","IBM Plex Sans Arabic","Cairo",Inter,system-ui,-apple-system,sans-serif;
  --font-latin:Inter,"Noto Sans",system-ui,sans-serif;
  --t-display:34px;--t-h1:26px;--t-h2:20px;--t-h3:16.5px;--t-body:15px;--t-sm:13.5px;--t-xs:12px;--t-micro:11px;
  --r-xs:6px;--r-sm:8px;--r-md:12px;--r-lg:16px;--r-xl:20px;--r-pill:999px;
  --e1:0 1px 2px rgba(27,21,18,.05),0 1px 1px rgba(27,21,18,.03);
  --e2:0 4px 12px -2px rgba(27,21,18,.09),0 2px 4px -2px rgba(27,21,18,.05);
  --e3:0 12px 32px -8px rgba(27,21,18,.14),0 4px 8px -4px rgba(27,21,18,.07);
  --e4:0 28px 64px -16px rgba(27,21,18,.22),0 8px 16px -8px rgba(27,21,18,.10);
  --ring:0 0 0 3px rgba(246,90,0,.28);
  --d1:120ms;--d2:180ms;--d3:240ms;--d4:320ms;
  --ease:cubic-bezier(.2,0,0,1);
  --rail-w:72px;--side-w:248px;--topbar-h:64px;
  font-family:var(--font);color:var(--ink);background:var(--canvas);
  font-size:var(--t-body);line-height:1.7;-webkit-font-smoothing:antialiased;
  text-align:start;
}
.uerp[data-theme="dark"]{
  --canvas:#12100F;--surface:#1A1715;--surface-2:#1F1B18;--surface-3:#272220;
  --line:#2F2925;--line-soft:#262120;--line-strong:#3E3631;
  --ink:#F6F1EB;--ink-2:#B9AEA5;--ink-3:#8C817A;
  --brand:var(--o-400);--brand-ink:#FFB182;--brand-fill:var(--o-500);--brand-hover:var(--o-400);
  --brand-soft:#2A1B12;--brand-soft-2:#3A2416;
  --ok-ink:#5FD3AC;--ok-soft:#122A22;--warn-ink:#F0C063;--warn-soft:#2A2113;
  --bad-ink:#FF9A8E;--bad-soft:#2E1815;--info-ink:#9BB8FF;--info-soft:#171E33;
  --e1:0 1px 2px rgba(0,0,0,.5);--e2:0 4px 12px -2px rgba(0,0,0,.55);
  --e3:0 12px 32px -8px rgba(0,0,0,.6);--e4:0 28px 64px -16px rgba(0,0,0,.7);
  --c2:#4FA98F;--c3:#6E9BC7;--c4:#D08A55;--c5:#A88BD0;--c6:#E0B84A;--c7:#78B469;--c8:#D07A9C;
  --age-1:#5FD3AC;--age-2:#E0B84A;--age-3:#FF9A8E;--age-4:#E2703F;
}
.uerp *,.uerp *::before,.uerp *::after{box-sizing:border-box}
.uerp h1,.uerp h2,.uerp h3,.uerp h4,.uerp p,.uerp ol,.uerp ul{margin:0;padding:0}
.uerp button{font-family:inherit;cursor:pointer;border:0;background:none;color:inherit}
.uerp input,.uerp select,.uerp textarea{font-family:inherit;font-size:inherit;color:inherit}
.uerp table{border-collapse:separate;border-spacing:0;width:100%}
.uerp a{color:var(--brand-ink);text-decoration:none}
.uerp .ico{flex:0 0 auto;vertical-align:-3px}
.uerp .num{font-variant-numeric:tabular-nums;font-family:var(--font-latin);direction:ltr;unicode-bidi:isolate;font-feature-settings:"tnum" 1}
.uerp .num.is-neg{color:var(--bad-ink)}
.uerp .cur{font-size:12px;color:var(--ink-3);font-weight:500;margin-inline-start:4px}
.uerp .sub{font-size:var(--t-xs);color:var(--ink-3);line-height:1.5}
.uerp .muted{color:var(--ink-2)}
.uerp .faint{color:var(--ink-3)}
.uerp .ta-end{text-align:end}
.uerp .ta-center{text-align:center}
.uerp :focus-visible{outline:2px solid var(--brand);outline-offset:2px}

/* ---------- shell ---------- */
.uerp{min-height:100vh;overflow-x:clip}
.uerp .app{display:flex;min-height:100vh;align-items:stretch}
.uerp .rail{width:var(--rail-w);flex:0 0 var(--rail-w);background:var(--surface);border-inline-end:1px solid var(--line);
  display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 0 14px;position:sticky;top:0;height:100vh;z-index:4}
.uerp .rail .logo{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--brand-fill);
  color:#fff;font-weight:800;font-size:14px;font-family:var(--font-latin);letter-spacing:.02em;margin-bottom:10px;
  box-shadow:0 4px 12px -4px rgba(217,76,0,.55)}
.uerp .rail-btn{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;color:var(--ink-3);position:relative}
.uerp .rail-btn:hover{background:var(--surface-3);color:var(--ink-2)}
.uerp .rail-btn.is-active{background:var(--brand-soft);color:var(--brand-ink)}
.uerp .rail-btn.is-active::after{content:"";position:absolute;inset-inline-end:-14px;top:50%;transform:translateY(-50%);
  width:3px;height:22px;border-radius:3px;background:var(--brand)}
.uerp .rail-spacer{flex:1}
.uerp .side{width:var(--side-w);flex:0 0 var(--side-w);background:var(--surface);border-inline-end:1px solid var(--line);
  display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow:hidden;z-index:4}
.uerp .side-head{padding:14px 18px 10px;display:flex;align-items:center;gap:10px}
.uerp .brand-name{font-size:15px;font-weight:700;line-height:1.25}
.uerp .brand-sub{font-size:11.5px;color:var(--ink-3);line-height:1.4}
.uerp .org-switch{margin:0 12px 10px;display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--line);
  border-radius:var(--r-md);background:var(--surface-2);width:calc(100% - 24px)}
.uerp .org-switch .badge-sq{width:26px;height:26px;border-radius:8px;background:var(--surface-3);display:grid;place-items:center;
  color:var(--brand-ink);font-size:11px;font-weight:700;flex:0 0 auto}
.uerp .org-switch .org-txt{text-align:start;min-width:0;flex:1;display:flex;flex-direction:column}
.uerp .org-switch .org-t{font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
.uerp .org-switch .org-s{font-size:10.5px;color:var(--ink-3);display:block}
.uerp .org-switch .chev{margin-inline-start:auto;color:var(--ink-3)}
.uerp .nav{overflow-y:auto;padding:0 10px 12px;flex:1;scrollbar-width:thin}
.uerp .nav-label{font-size:10.5px;font-weight:700;color:var(--ink-3);padding:14px 8px 6px;letter-spacing:.04em}
.uerp .nav-item{display:flex;align-items:center;gap:10px;height:38px;padding:0 10px;border-radius:var(--r-sm);
  color:var(--ink-2);font-size:13.5px;font-weight:500;position:relative;width:100%;text-align:start}
.uerp .nav-item:hover{background:var(--surface-3);color:var(--ink)}
.uerp .nav-item.is-active{background:var(--brand-soft);color:var(--brand-ink);font-weight:700}
.uerp .nav-item.is-active::after{content:"";position:absolute;inset-inline-start:0;top:9px;bottom:9px;width:3px;
  border-radius:3px;background:var(--brand)}
.uerp .nav-item .ico{color:var(--ink-3)}
.uerp .nav-item.is-active .ico{color:var(--brand-ink)}
.uerp .nav-item .n-lbl{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.uerp .nav-item .n-count{font-size:11px;font-weight:700;color:var(--ink-3);font-variant-numeric:tabular-nums}
.uerp .nav-item.is-active .n-count{color:var(--brand-ink)}
.uerp .side-foot{padding:10px 16px;border-top:1px solid var(--line);display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--ink-3)}
.uerp .sync-dot{width:7px;height:7px;border-radius:50%;background:var(--ok-ink);flex:0 0 auto}
.uerp .sync-dot.is-demo{background:var(--warn-ink)}
.uerp .main{flex:1;min-width:0;display:flex;flex-direction:column}
.uerp .topbar{height:var(--topbar-h);position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:12px;padding:0 20px;
  border-bottom:1px solid var(--line);background:color-mix(in srgb, var(--surface) 88%, transparent);
  -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.uerp .topbar .hamb{display:none}
.uerp .searchbox{display:flex;align-items:center;gap:8px;height:38px;padding:0 12px;border:1px solid var(--line);
  border-radius:var(--r-md);background:var(--surface-2);color:var(--ink-3);max-width:420px;flex:1;text-align:start}
.uerp .searchbox:hover{border-color:var(--line-strong)}
.uerp .searchbox .sb-txt{font-size:13px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.uerp .kbd{font-size:10.5px;border:1px solid var(--line);border-radius:5px;padding:1px 5px;color:var(--ink-3);background:var(--surface)}
.uerp .topbar-right{margin-inline-start:auto;display:flex;align-items:center;gap:6px}
.uerp .topbar-title{display:none;font-size:14px;font-weight:700;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.uerp .topbar .icon-btn{width:38px;height:38px}
.uerp .who{display:flex;align-items:center;gap:8px;padding:4px 8px 4px 4px;border-radius:var(--r-md);border:1px solid transparent}
.uerp .who:hover{background:var(--surface-3)}
.uerp .who-txt{display:flex;flex-direction:column;line-height:1.25;text-align:start}
.uerp .who .who-t{font-size:12.5px;font-weight:600;line-height:1.2;white-space:nowrap}
.uerp .who .who-s{font-size:10.5px;color:var(--ink-3);line-height:1.2}
.uerp .avatar{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:12.5px;font-weight:700;flex:0 0 auto;
  background:var(--brand-soft);color:var(--brand-ink)}
.uerp .avatar--ok{background:var(--ok-soft);color:var(--ok-ink)}
.uerp .avatar--info{background:var(--info-soft);color:var(--info-ink)}
.uerp .avatar--warn{background:var(--warn-soft);color:var(--warn-ink)}
.uerp .avatar--bad{background:var(--bad-soft);color:var(--bad-ink)}
.uerp .avatar--neutral{background:var(--surface-3);color:var(--ink-2)}
.uerp .page{flex:1;padding:24px;display:flex;flex-direction:column;gap:16px;min-width:0}
.uerp .page-head{display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap}
.uerp .page-head .ph-txt{min-width:0;flex:1}
.uerp .crumbs{font-size:11.5px;color:var(--ink-3);display:flex;align-items:center;gap:6px;margin-bottom:2px}
.uerp .crumbs .ico{opacity:.6}
.uerp .page-title{font-size:var(--t-h1);line-height:1.35;font-weight:700}
.uerp .page-sub{font-size:13px;color:var(--ink-2);margin-top:2px}
.uerp .page-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}

/* ---------- buttons ---------- */
.uerp .btn{display:inline-flex;align-items:center;gap:7px;height:38px;padding:0 14px;border-radius:var(--r-md);
  font-size:13.5px;font-weight:600;border:1px solid transparent;white-space:nowrap;transition:background var(--d1) var(--ease),border-color var(--d1) var(--ease)}
.uerp .btn--sm{height:32px;padding:0 10px;font-size:12.5px;border-radius:var(--r-sm)}
.uerp .btn--primary{background:var(--brand-fill);color:#fff}
.uerp .btn--primary:hover{background:var(--brand-hover)}
.uerp .btn--outline{border-color:var(--line-strong);background:var(--surface);color:var(--ink)}
.uerp .btn--outline:hover{background:var(--surface-3)}
.uerp .btn--ghost{color:var(--ink-2)}
.uerp .btn--ghost:hover{background:var(--surface-3);color:var(--ink)}
.uerp .btn--soft{background:var(--brand-soft);color:var(--brand-ink)}
.uerp .btn--soft:hover{background:var(--brand-soft-2)}
.uerp .btn--danger{background:var(--bad-soft);color:var(--bad-ink)}
.uerp .btn--danger:hover{filter:brightness(.97)}
.uerp .btn:disabled{opacity:.45;cursor:not-allowed}
.uerp .icon-btn{width:36px;height:36px;border-radius:var(--r-sm);display:inline-grid;place-items:center;color:var(--ink-3)}
.uerp .icon-btn:hover{background:var(--surface-3);color:var(--ink)}
.uerp .split{display:inline-flex}
.uerp .split .btn:first-child{border-start-end-radius:0;border-end-end-radius:0}
.uerp .split .btn:last-child{border-start-start-radius:0;border-end-start-radius:0;border-inline-start:1px solid var(--line);padding:0 8px}

/* ---------- cards / kpi ---------- */
.uerp .card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:var(--e1);min-width:0}
.uerp .card-head{display:flex;align-items:flex-start;gap:12px;padding:16px 18px 0}
.uerp .card-head h3{font-size:var(--t-h3);font-weight:700;line-height:1.4}
.uerp .card-head-txt{min-width:0;flex:1}
.uerp .card-actions{display:flex;align-items:center;gap:6px}
.uerp .card-body{padding:14px 18px 18px}
.uerp .card-body--flush{padding:0}
.uerp .kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.uerp .kpi{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);padding:14px 16px 12px;box-shadow:var(--e1);
  display:flex;flex-direction:column;gap:4px;min-width:0;position:relative;overflow:hidden}
.uerp .kpi-top{display:flex;align-items:center;gap:8px}
.uerp .kpi-label{font-size:12.5px;color:var(--ink-2);font-weight:500}
.uerp .kpi-val{display:flex;align-items:baseline;gap:6px;font-size:27px;line-height:1.1;font-weight:700;letter-spacing:0}
.uerp .kpi-note{font-size:11.5px;color:var(--ink-3);line-height:1.45}
.uerp .delta{display:inline-flex;align-items:center;gap:2px;font-size:11.5px;font-weight:700;padding:1px 6px;border-radius:var(--r-pill)}
.uerp .delta--up{background:var(--ok-soft);color:var(--ok-ink)}
.uerp .delta--down{background:var(--bad-soft);color:var(--bad-ink)}
.uerp .delta--flat{background:var(--surface-3);color:var(--ink-2)}
.uerp .spark{width:100%;height:28px;margin-top:6px;display:block}
.uerp .spark--empty{background:var(--surface-3);height:2px;border-radius:2px;margin-top:auto}
.uerp .grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px}
.uerp .c3{grid-column:span 3}.uerp .c4{grid-column:span 4}.uerp .c5{grid-column:span 5}
.uerp .c6{grid-column:span 6}.uerp .c7{grid-column:span 7}.uerp .c8{grid-column:span 8}
.uerp .c9{grid-column:span 9}.uerp .c12{grid-column:span 12}

/* ---------- pills / chips ---------- */
.uerp .pill{display:inline-flex;align-items:center;gap:5px;height:23px;padding:0 9px;border-radius:var(--r-pill);
  font-size:11.5px;font-weight:600;white-space:nowrap;background:var(--surface-3);color:var(--ink-2)}
.uerp .pill .dot{width:5px;height:5px;border-radius:50%;background:currentColor;flex:0 0 auto}
.uerp .pill--ok{background:var(--ok-soft);color:var(--ok-ink)}
.uerp .pill--warn{background:var(--warn-soft);color:var(--warn-ink)}
.uerp .pill--bad{background:var(--bad-soft);color:var(--bad-ink)}
.uerp .pill--info{background:var(--info-soft);color:var(--info-ink)}
.uerp .pill--brand{background:var(--brand-soft);color:var(--brand-ink)}
.uerp .chip{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 8px 0 10px;border-radius:var(--r-sm);
  border:1px solid var(--line);background:var(--surface-2);font-size:12px}
.uerp .chip-k{color:var(--ink-3)}
.uerp .chip-v{font-weight:600;color:var(--ink)}
.uerp .chip-x{width:18px;height:18px;border-radius:4px;display:grid;place-items:center;color:var(--ink-3)}
.uerp .chip-x:hover{background:var(--surface-3);color:var(--bad-ink)}
.uerp .chip--brand{border-color:var(--brand-soft-2);background:var(--brand-soft)}
.uerp .tag{font-size:11px;color:var(--ink-3);border:1px solid var(--line);border-radius:var(--r-xs);padding:0 5px}

/* ---------- tabs / toolbar ---------- */
.uerp .tabs{display:flex;align-items:center;gap:2px;border-bottom:1px solid var(--line);overflow-x:auto;scrollbar-width:none}
.uerp .tabs::-webkit-scrollbar{display:none}
.uerp .tab{height:42px;padding:0 12px;font-size:13px;font-weight:600;color:var(--ink-2);border-bottom:2px solid transparent;
  display:inline-flex;align-items:center;gap:6px;white-space:nowrap;margin-bottom:-1px}
.uerp .tab:hover{color:var(--ink)}
.uerp .tab.is-active{color:var(--brand-ink);border-bottom-color:var(--brand)}
.uerp .tab-count{font-size:11px;font-weight:700;background:var(--surface-3);color:var(--ink-2);border-radius:var(--r-pill);padding:0 6px;min-width:20px;text-align:center}
.uerp .tab.is-active .tab-count{background:var(--brand-soft);color:var(--brand-ink)}
.uerp .toolbar{display:flex;align-items:center;gap:8px;padding:12px 18px;flex-wrap:wrap;border-bottom:1px solid var(--line-soft)}
.uerp .toolbar .grow{flex:1}
.uerp .search-inline{display:flex;align-items:center;gap:7px;height:36px;padding:0 10px;border:1px solid var(--line-strong);
  border-radius:var(--r-md);background:var(--surface);min-width:200px;flex:0 1 280px;color:var(--ink-3)}
.uerp .search-inline input{border:0;background:none;outline:none;font-size:13px;color:var(--ink);width:100%;min-width:0}
.uerp .segmented{display:inline-flex;background:var(--surface-3);border-radius:var(--r-md);padding:3px;gap:2px}
.uerp .seg{height:28px;padding:0 10px;border-radius:var(--r-sm);font-size:12.5px;font-weight:600;color:var(--ink-2)}
.uerp .seg.is-active{background:var(--surface);color:var(--ink);box-shadow:var(--e1)}
.uerp .filters-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:0 18px 12px}
.uerp .select{height:36px;padding:0 32px 0 10px;border:1px solid var(--line-strong);border-radius:var(--r-md);
  background:var(--surface);font-size:13px;appearance:none;min-width:120px}
.uerp .date-range{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 10px;border:1px solid var(--line-strong);
  border-radius:var(--r-md);background:var(--surface);font-size:12.5px;font-weight:600}
.uerp .bulkbar{display:flex;align-items:center;gap:10px;margin:0 18px 12px;padding:9px 12px;background:var(--brand-soft);
  border:1px solid var(--brand-soft-2);border-radius:var(--r-md);font-size:12.5px;flex-wrap:wrap}
.uerp .bulkbar b{font-weight:700}
.uerp .bulkbar .grow{flex:1}

/* ---------- table ---------- */
.uerp .tbl-wrap{width:100%;overflow-x:auto}
.uerp .tbl-wrap--scroll{max-width:100%}
.uerp .tbl{width:100%;font-size:13px}
.uerp .tbl thead th{position:sticky;top:0;z-index:2;background:var(--surface-2);color:var(--ink-3);font-size:11px;font-weight:700;
  text-align:start;padding:9px 12px;border-bottom:1px solid var(--line);white-space:nowrap;letter-spacing:.01em}
.uerp .tbl tbody td{padding:11px 12px;border-bottom:1px solid var(--line-soft);vertical-align:middle}
.uerp .tbl tbody tr:last-child td{border-bottom:0}
.uerp .tbl tbody tr:hover td{background:var(--surface-2)}
.uerp .tbl tbody tr.is-selected td{background:var(--brand-soft)}
.uerp .tbl[data-density="compact"] tbody td,.uerp .tbl-wrap[data-density="compact"] tbody td{padding:7px 10px;font-size:12.5px}
.uerp .tbl-wrap[data-density="compact"] thead th{padding:7px 10px}
.uerp .tbl .id-cell{display:flex;align-items:center;gap:9px;min-width:0}
.uerp .tbl .id-cell .id-t{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px}
.uerp .tbl .id-cell .id-s{font-size:10.5px;color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.uerp .tbl .id-col{min-width:175px}
.uerp .tbl .doc-no{color:var(--ink);font-family:var(--font-latin);font-size:12.5px;font-weight:600;direction:ltr;unicode-bidi:isolate;white-space:nowrap}
.uerp .tbl .c-check{width:36px;padding-inline-start:14px}
.uerp .cb{width:16px;height:16px;accent-color:var(--brand-fill);border-radius:4px;cursor:pointer}
.uerp .tbl .group-row td{background:var(--surface-2);font-weight:700;font-size:12px;color:var(--ink-2);padding:7px 12px}
.uerp .group-title{font-weight:700}
.uerp .tbl .group-row td{display:flex;gap:12px;justify-content:space-between;align-items:center}
.uerp .group-meta{font-size:11.5px;color:var(--ink-3);font-weight:600}
.uerp .tbl tfoot td{padding:10px 12px;border-top:1px solid var(--line);font-weight:700;font-size:12.5px;background:var(--surface-2)}
.uerp .tbl-empty-row td{padding:0!important}
.uerp .row-act{opacity:.55}
.uerp .tbl tbody tr:hover .row-act{opacity:1}
.uerp .totals-strip{display:flex;align-items:center;gap:18px;padding:10px 18px;border-top:1px solid var(--line);flex-wrap:wrap;background:var(--surface-2)}
.uerp .totals-item{display:flex;align-items:baseline;gap:6px}
.uerp .totals-k{font-size:11.5px;color:var(--ink-3)}
.uerp .totals-v{font-size:13.5px;font-weight:700}
.uerp .totals-v.is-bad{color:var(--bad-ink)}
.uerp .totals-note{margin-inline-start:auto;font-size:11px;color:var(--ink-3)}
.uerp .pager{display:flex;align-items:center;gap:12px;padding:10px 18px;border-top:1px solid var(--line);flex-wrap:wrap}
.uerp .pager-info{font-size:12px;color:var(--ink-3)}
.uerp .pager-btns{display:flex;align-items:center;gap:2px;margin-inline-start:auto}
.uerp .pg{min-width:30px;height:30px;border-radius:var(--r-sm);font-size:12.5px;font-weight:600;color:var(--ink-2);display:inline-grid;place-items:center}
.uerp .pg:hover{background:var(--surface-3)}
.uerp .pg.is-active{background:var(--brand-fill);color:#fff}
.uerp .pg:disabled{opacity:.35}
.uerp .pager-size{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--ink-3)}
.uerp .input--xs{height:30px;padding:0 26px 0 8px;font-size:12px;min-width:64px}

/* ---------- empty / banner / skeleton ---------- */
.uerp .empty{display:flex;flex-direction:column;align-items:center;gap:6px;padding:34px 16px;border:1px dashed var(--line-strong);
  border-radius:var(--r-md);margin:16px;text-align:center}
.uerp .empty-ic{width:40px;height:40px;border-radius:12px;background:var(--surface-3);color:var(--ink-3);display:grid;place-items:center}
.uerp .empty-t{font-size:14px;font-weight:700}
.uerp .empty-h{font-size:12px;color:var(--ink-3);max-width:340px}
.uerp .banner{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:var(--r-md);font-size:12.5px;
  border:1px solid transparent;line-height:1.6}
.uerp .banner--ok{background:var(--ok-soft);color:var(--ok-ink);border-color:color-mix(in srgb,var(--ok-ink) 20%,transparent)}
.uerp .banner--warn{background:var(--warn-soft);color:var(--warn-ink);border-color:color-mix(in srgb,var(--warn-ink) 22%,transparent)}
.uerp .banner--bad{background:var(--bad-soft);color:var(--bad-ink);border-color:color-mix(in srgb,var(--bad-ink) 22%,transparent)}
.uerp .banner--info{background:var(--info-soft);color:var(--info-ink);border-color:color-mix(in srgb,var(--info-ink) 20%,transparent)}
.uerp .banner--neutral{background:var(--surface-3);color:var(--ink-2)}
.uerp .banner-txt{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1}
.uerp .banner-txt b{font-weight:700}
.uerp .banner .btn{height:30px;font-size:12px}

/* ---------- forms ---------- */
.uerp .field{display:flex;flex-direction:column;gap:5px;min-width:0}
.uerp .field-label{font-size:12.5px;font-weight:600;color:var(--ink-2)}
.uerp .req{color:var(--bad-ink);margin-inline-start:2px}
.uerp .input-wrap{position:relative;display:flex;align-items:center}
.uerp .input{width:100%;height:40px;padding:0 11px;border:1px solid var(--line-strong);border-radius:var(--r-md);
  background:var(--surface);font-size:13.5px;outline:none;transition:border-color var(--d1) var(--ease),box-shadow var(--d1) var(--ease)}
.uerp .input:focus{border-color:var(--brand);box-shadow:var(--ring)}
.uerp .input:disabled{background:var(--surface-3);color:var(--ink-3)}
.uerp .input--num{font-family:var(--font-latin);font-variant-numeric:tabular-nums;direction:ltr;text-align:end}
.uerp .input-unit{position:absolute;inset-inline-end:11px;font-size:11.5px;color:var(--ink-3);pointer-events:none}
.uerp .textarea{height:auto;padding:9px 11px;resize:vertical;line-height:1.6}
.uerp .select-wrap{position:relative;display:flex;align-items:center;width:100%}
.uerp .select-wrap .input{appearance:none;padding-inline-end:30px}
.uerp .select-wrap .ico{position:absolute;inset-inline-end:10px;color:var(--ink-3);pointer-events:none}
.uerp .field-help{font-size:11.5px;color:var(--ink-3)}
.uerp .field-err{font-size:11.5px;color:var(--bad-ink);display:flex;align-items:center;gap:4px}
.uerp .field[data-invalid] .input{border-color:var(--bad-ink);box-shadow:0 0 0 3px color-mix(in srgb,var(--bad-ink) 18%,transparent)}
.uerp .form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.uerp .form-grid .span2{grid-column:span 2}
.uerp .switch{display:inline-flex;align-items:center;gap:8px;font-size:13px}
.uerp .switch input{position:absolute;opacity:0;width:0;height:0}
.uerp .switch .track{width:38px;height:22px;border-radius:var(--r-pill);background:var(--line-strong);position:relative;transition:background var(--d1)}
.uerp .switch .track::after{content:"";position:absolute;top:3px;inset-inline-start:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:inset-inline-start var(--d2) var(--ease)}
.uerp .switch input:checked + .track{background:var(--brand-fill)}
.uerp .switch input:checked + .track::after{inset-inline-start:19px}
.uerp .sec-title{display:flex;align-items:center;gap:10px;padding:0 0 10px}
.uerp .sec-n{width:22px;height:22px;border-radius:7px;background:var(--brand-soft);color:var(--brand-ink);
  display:grid;place-items:center;font-size:11.5px;font-weight:700;flex:0 0 auto}
.uerp .sec-title h3{font-size:15px;font-weight:700}
.uerp .sec-act{margin-inline-start:auto;display:flex;gap:6px}
.uerp .sticky-bar{position:sticky;bottom:0;z-index:3;display:flex;align-items:center;gap:12px;padding:12px 18px;
  background:color-mix(in srgb,var(--surface) 94%,transparent);border-top:1px solid var(--line);
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-radius:0 0 var(--r-lg) var(--r-lg)}
.uerp .sticky-bar .bar-total{display:flex;flex-direction:column;line-height:1.25}
.uerp .sticky-bar .bar-total .k{font-size:11px;color:var(--ink-3)}
.uerp .sticky-bar .bar-total .v{font-size:19px;font-weight:700}
.uerp .sticky-bar .grow{flex:1}

/* ---------- steps ---------- */
.uerp .steps{display:flex;align-items:center;gap:0;list-style:none;flex-wrap:wrap;padding:2px 0}
.uerp .step{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--ink-3);padding-inline-end:12px;position:relative}
.uerp .step:not(:last-child)::after{content:"";width:22px;height:1px;background:var(--line-strong);margin-inline-start:6px}
.uerp .step-dot{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700;
  background:var(--surface-3);color:var(--ink-3);flex:0 0 auto}
.uerp .step--done .step-dot{background:var(--ok-soft);color:var(--ok-ink)}
.uerp .step--active .step-dot{background:var(--brand-fill);color:#fff}
.uerp .step--active .step-lbl{color:var(--ink);font-weight:700}
.uerp .step--done .step-lbl{color:var(--ink-2)}

/* ---------- chart ---------- */
.uerp .chart{position:relative;width:100%}
.uerp .chart-svg{width:100%;height:auto;display:block;overflow:visible}
.uerp .chart-tick{font-size:9px;fill:var(--ink-3);font-family:var(--font-latin)}
.uerp .chart-tip{position:absolute;top:4px;background:var(--surface);border:1px solid var(--line);border-radius:var(--r-sm);
  box-shadow:var(--e3);padding:8px 10px;font-size:11.5px;min-width:130px;pointer-events:none;z-index:3}
.uerp .tip-h{font-weight:700;margin-bottom:4px;color:var(--ink-2);font-size:11px}
.uerp .tip-row{display:flex;align-items:center;gap:6px;font-size:11.5px}
.uerp .tip-row i{width:7px;height:7px;border-radius:2px;flex:0 0 auto}
.uerp .tip-row b{margin-inline-start:auto;font-weight:700}
.uerp .legend{display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:11.5px;color:var(--ink-2)}
.uerp .legend-i{display:inline-flex;align-items:center;gap:5px}
.uerp .legend-i i{width:8px;height:8px;border-radius:2px}

/* ---------- overlay / sheet / toast ---------- */
.uerp .ovl{position:fixed;inset:0;z-index:40;display:flex;justify-content:flex-start}
.uerp .ovl-scrim{position:absolute;inset:0;background:rgba(27,21,18,.34);animation:fade var(--d3) var(--ease)}
.uerp .sheet{position:relative;width:min(460px,100%);height:100%;background:var(--surface);box-shadow:var(--e4);
  display:flex;flex-direction:column;animation:slideIn var(--d4) var(--spring)}
.uerp .sheet-head{display:flex;align-items:flex-start;gap:12px;padding:18px 18px 12px;border-bottom:1px solid var(--line)}
.uerp .sheet-head h3{font-size:var(--t-h3);font-weight:700}
.uerp .sheet-head > div{flex:1;min-width:0}
.uerp .sheet-body{padding:16px 18px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:14px}
.uerp .sheet-foot{display:flex;align-items:center;gap:8px;padding:12px 18px;border-top:1px solid var(--line);background:var(--surface-2)}
.uerp .sheet-foot .grow{flex:1}
.uerp .toast-host{position:fixed;bottom:20px;inset-inline-start:20px;z-index:60;display:flex;flex-direction:column;gap:8px}
.uerp .toast{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:var(--r-md);background:var(--surface);
  border:1px solid var(--line);box-shadow:var(--e3);font-size:12.5px;font-weight:600;animation:rise var(--d3) var(--ease)}
.uerp .toast--ok{color:var(--ok-ink)}
.uerp .toast--bad{color:var(--bad-ink)}
.uerp .toast--warn{color:var(--warn-ink)}
.uerp .toast.is-out{opacity:0;transition:opacity .3s}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes slideIn{from{transform:translateX(-12px);opacity:.4}to{transform:none;opacity:1}}
@keyframes rise{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}
.uerp .scrim{position:fixed;inset:0;background:rgba(27,21,18,.4);z-index:3;display:none}
.uerp .app.is-drawer .scrim{display:block}

/* ---------- misc ---------- */
.uerp .kv{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px dashed var(--line-soft);font-size:12.5px}
.uerp .kv:last-child{border-bottom:0}
.uerp .kv .k{color:var(--ink-3)}
.uerp .kv .v{font-weight:600}
.uerp .check-line{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--ok-ink);font-weight:600}
.uerp .check-line .ico{flex:0 0 auto}
.uerp .mini-list{display:flex;flex-direction:column;gap:2px}
.uerp .mini-row{display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid var(--line-soft);font-size:12.5px}
.uerp .mini-row:last-child{border-bottom:0}
.uerp .mini-row .mr-t{font-weight:600;min-width:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.uerp .mini-row .mr-s{font-size:11px;color:var(--ink-3)}
.uerp .aging{display:flex;height:8px;border-radius:var(--r-pill);overflow:hidden;background:var(--surface-3);gap:2px}
.uerp .aging i{display:block;height:100%}
.uerp .aging-legend{display:flex;gap:10px;flex-wrap:wrap;font-size:10.5px;color:var(--ink-3);margin-top:6px}
.uerp .aging-legend span{display:inline-flex;align-items:center;gap:4px}
.uerp .aging-legend i{width:6px;height:6px;border-radius:2px}
.uerp .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}


.uerp .amt-in{color:var(--ok-ink)}.uerp .amt-out{color:var(--bad-ink)}.uerp .tab-pad{padding:0 18px}
.uerp .sup-body{padding:16px 18px}.uerp .sup-body .card{border:0;box-shadow:none;background:none}.uerp .sup-body .card-body{padding:0}.uerp .sup-body .card-head{padding-inline:0}
.uerp .hint-s{font-size:11.5px}
.uerp .card-body--flush{overflow:hidden;border-radius:0 0 var(--r-lg) var(--r-lg)}
.uerp .card-body--flush .tbl th:first-child,.uerp .card-body--flush .tbl td:first-child{padding-inline-start:16px}
.uerp .card-body--flush .tbl th:last-child,.uerp .card-body--flush .tbl td:last-child{padding-inline-end:16px}
.uerp .id-cell--row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.uerp .kv--total{font-weight:700;font-size:14px;border-bottom:1px solid var(--line);border-top:1px solid var(--line);padding:10px 0;margin-top:4px}
.uerp .meta-strip{display:flex;flex-wrap:wrap;gap:6px 20px;padding:10px 12px;margin-bottom:10px;background:var(--surface-2);border-radius:var(--r-md);font-size:12.5px;color:var(--ink-2)}
.uerp .meta-strip b{color:var(--ink);font-weight:700;margin-inline-end:4px}
.uerp .kv--total .k{color:var(--ink)}
.uerp .tbl td>.id-s{font-size:10.5px;color:var(--ink-3);margin-top:2px}
.uerp .card>.tbl-wrap{border-radius:0 0 var(--r-lg) var(--r-lg)}
.uerp .acct-n{margin-inline-start:6px}
/* treasuries */
.uerp .tr-card{display:block;width:100%;text-align:start;padding:14px 16px;cursor:pointer;transition:border-color var(--d2) var(--ease),box-shadow var(--d2) var(--ease)}
.uerp .tr-card:hover{border-color:var(--line-strong)}
.uerp .tr-card.is-on{border-color:var(--brand);box-shadow:var(--ring)}
.uerp .tr-top{display:flex;align-items:center;gap:10px}
.uerp .tr-ico{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:var(--brand-soft);color:var(--brand-ink)}
.uerp .tr-nm{font-weight:700;font-size:14px;line-height:1.4}
.uerp .tr-bal{font-size:24px;font-weight:700;margin:10px 0 6px;display:block}
.uerp .tr-meta{display:flex;gap:16px;font-size:12px;color:var(--ink-3)}
.uerp .tr-meta b{color:var(--ink-2);font-weight:600}
.uerp .tr-warn{margin-top:8px;font-size:12px;color:var(--bad-ink)}
/* ---------- responsive ---------- */
@media (max-width:1239px){
  .uerp .kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
  .uerp .c8,.uerp .c7,.uerp .c9{grid-column:span 12}
  .uerp .c4,.uerp .c5{grid-column:span 12}
  .uerp .c3{grid-column:span 6}
}
@media (max-width:904px){
  .uerp .rail{display:none}
  .uerp .side{position:fixed;inset-block:0;inset-inline-start:0;z-index:20;transform:translateX(var(--drawer-out,-100%));
    transition:transform var(--d3) var(--ease);box-shadow:var(--e4);width:288px;flex-basis:288px}
  .uerp[dir="rtl"] .side{--drawer-out:100%}
  .uerp .app.is-drawer .side{transform:none}
  .uerp .topbar .hamb{display:inline-grid}
  .uerp .page{padding:16px}
  .uerp .grid{gap:12px}
  .uerp .c6,.uerp .c3{grid-column:span 12}
  .uerp .topbar{padding:0 14px;height:56px}
  .uerp .searchbox{display:none}
  .uerp .topbar-title{display:block;flex:1}
  .uerp .who .who-txt{display:none}
  .uerp .who{padding:2px;border:0}
  .uerp .page-head{flex-direction:column;align-items:stretch;gap:10px}
  .uerp .page-actions{width:100%}
  .uerp .page-actions .btn{flex:1;justify-content:center}
  .uerp .page-actions .btn--ghost,.uerp .page-actions .icon-btn{flex:0 0 auto}
}
@media (max-width:600px){
  .uerp .demo-pill{display:none}
  .uerp .topbar .icon-btn[data-act="toggle-theme"],.uerp .topbar .icon-btn[data-act="toggle-lang"]{display:none}
  .uerp .page{padding:14px 14px 88px;gap:12px}
  .uerp .kpis{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .uerp .kpi{padding:11px 12px}
  .uerp .kpi-val{font-size:22px}
  .uerp .page-title{font-size:21px}
  .uerp .form-grid{grid-template-columns:1fr}
  .uerp .form-grid .span2{grid-column:span 1}
  .uerp .toolbar{padding:10px 14px}
  .uerp .filters-bar{padding:0 14px 10px}
  .uerp .totals-strip{padding:10px 14px;gap:12px}
  .uerp .pager{padding:10px 14px}
  .uerp .sheet{width:100%;height:auto;max-height:88vh;align-self:flex-end;border-radius:26px 26px 0 0}
  .uerp .ovl{align-items:flex-end}
  .uerp .sticky-bar{position:fixed;inset-inline:0;bottom:0;border-radius:0;padding:10px 14px calc(10px + env(safe-area-inset-bottom));z-index:15}
  /* table -> data cards */
  .uerp .tbl-wrap{overflow:visible}
  .uerp .tbl thead{display:none}
  .uerp .tbl,.uerp .tbl tbody,.uerp .tbl tr,.uerp .tbl td,.uerp .tbl tfoot{display:block;width:100%}
  .uerp .tbl tbody tr{background:var(--surface);border:1px solid var(--line);border-radius:14px;margin:0 0 10px;padding:10px 12px;box-shadow:var(--e1)}
  .uerp .tbl tbody tr:hover td{background:transparent}
  .uerp .tbl tbody td{border:0;padding:5px 0;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:end}
  .uerp .tbl tbody td::before{content:attr(data-th);color:var(--ink-3);font-size:11.5px;font-weight:600;text-align:start;flex:0 0 auto}
  .uerp .tbl tbody td[data-th=""]::before{display:none}
  .uerp .tbl tbody td.id-col{display:block;text-align:start;padding:2px 0 6px}
  .uerp .tbl tbody td.id-col::before{display:none}
  .uerp .tbl tbody td.doc-col{display:block;text-align:start;padding:0 0 2px;border-bottom:1px solid var(--line-soft);margin-bottom:6px}
  .uerp .tbl tbody td.doc-col::before{display:none}
  .uerp .tbl tbody td.doc-col .doc-no{font-size:13px;font-weight:700}
  .uerp .tbl tbody td.act-col{display:none}
  .uerp .tbl tbody td.idx-col{display:none}
  .uerp .steps{flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px}
  .uerp .step:not(:last-child)::after{display:none}
  .uerp .step{padding-inline-end:14px;white-space:nowrap}
  .uerp .tbl tbody td.c-check{position:absolute;inset-inline-end:10px;top:10px;width:auto}
  .uerp .tbl tbody tr{position:relative}
  .uerp .tbl tbody td.c-check::before{display:none}
  .uerp .tbl .group-row{padding:6px 10px;background:var(--surface-2);box-shadow:none}
  .uerp .tbl .group-row td{display:flex}
  .uerp .tbl .group-row td::before{display:none}
  .uerp .tbl tfoot td{display:flex;justify-content:space-between;border:0}
  .uerp .tbl tfoot td::before{content:attr(data-th);color:var(--ink-3);font-weight:600}
  .uerp .tbl .doc-no{font-size:12px}
  /* count sheet: compact rows on a phone */
  .uerp .tbl.count-tbl tbody tr{padding:8px 12px;margin-bottom:8px}
  .uerp .tbl.count-tbl tbody td{padding:2px 0}
  .uerp .tbl.count-tbl tbody td input.select{width:86px;padding:6px 8px}
  .uerp .tbl.count-tbl tbody td::before{font-size:11px}
  .uerp .tbl.count-tbl tbody td.id-col{padding:0 0 4px}
  .uerp .tbl tbody td.hide-sm{display:none}
  .uerp .card-body--flush .tbl-wrap,.uerp .card>.tbl-wrap{padding:4px 10px 2px}
  .uerp .card .tbl tbody tr{box-shadow:none}
  .uerp .tabs{padding:0 6px;gap:0}
  .uerp .tab{padding:0 8px;font-size:12.5px;white-space:nowrap;flex:1 1 auto;justify-content:center}
  .uerp .tab .tab-count{display:none}
  .uerp .hide-m{display:none!important}
  .uerp .steps{overflow:visible;gap:4px;justify-content:space-between}
  .uerp .step:not(.step--active) .step-lbl{display:none}
  .uerp .step-sep,.uerp .step::after{flex:0 0 8px}
  .uerp .tab-pad{padding:0}
  .uerp .sup-body .tbl tr{border:0;border-bottom:1px solid var(--line-soft);background:none;box-shadow:none;border-radius:0}
  .uerp .sup-body{padding:12px 14px}
  .uerp .tab{padding:0 6px;font-size:12px}
  .uerp .empty{margin:12px;padding:24px 12px}
  .uerp .toast-host{inset-inline:14px;bottom:14px}
}

@media (prefers-reduced-motion:reduce){
  .uerp *{animation-duration:1ms!important;transition-duration:1ms!important}
}

/* ---------- print ---------- */
@media print{
  .uerp .rail,.uerp .side,.uerp .topbar,.uerp .page-actions,.uerp .toolbar,.uerp .filters-bar,.uerp .pager,
  .uerp .bulkbar,.uerp .tabs,.uerp .toast-host,.uerp .scrim,.uerp .sticky-bar,.uerp .card-actions{display:none!important}
  .uerp,.uerp .app,.uerp .main,.uerp .page{background:#fff!important;color:#000!important;padding:0!important;margin:0!important}
  .uerp .card{border:1px solid #ccc!important;box-shadow:none!important;break-inside:avoid}
  .uerp .tbl thead th{background:#f2f2f2!important;color:#000!important}
  .uerp .tbl tbody td{border-bottom:1px solid #ddd!important}
  .uerp .pill{border:1px solid #bbb!important;background:#fff!important;color:#000!important}
  .uerp .print-head{display:block!important;margin-bottom:12px}
}
.uerp .print-head{display:none}
`;

  var style = document.createElement('style');
  style.id = 'uno-erp-css';
  if (U.config.cspNonce) style.setAttribute('nonce', U.config.cspNonce);
  style.textContent = css;
  document.head.appendChild(style);

  /* CSP: inline style="" attributes are rewritten to generated classes.
     Rules are added through the CSSOM (insertRule), which a strict style-src allows. */
  var sheet = style.sheet, styleMap = {}, styleN = 0;
  function styleClass(decl) {
    var key = decl.replace(/\s+/g, ' ').trim();
    if (styleMap[key]) return styleMap[key];
    var cls = 'us-' + (++styleN);
    var body = key.split(';').filter(Boolean).map(function (d) { return /!important/.test(d) ? d : d + ' !important'; }).join(';');
    try { sheet.insertRule('.uerp .' + cls + '{' + body + '}', sheet.cssRules.length); } catch (e) { /* ignore bad decl */ }
    styleMap[key] = cls; return cls;
  }
  U.csp = function (html) {
    if (typeof html !== 'string' || html.indexOf(' style="') < 0) return html;
    return html.replace(/<([a-zA-Z][^\s>\/]*)((?:[^>"]|"[^"]*")*?)>/g, function (m, tag, attrs) {
      var sm = /\sstyle="([^"]*)"/.exec(attrs);
      if (!sm) return m;
      var cls = styleClass(sm[1].replace(/&quot;/g, "'").replace(/&amp;/g, '&'));
      attrs = attrs.replace(sm[0], '');
      if (/\sclass="/.test(attrs)) attrs = attrs.replace(/\sclass="([^"]*)"/, function (a, c) { return ' class="' + c + ' ' + cls + '"'; });
      else attrs += ' class="' + cls + '"';
      return '<' + tag + attrs + '>';
    });
  };
  (function patch() {
    var P = Element.prototype;
    function inUerp(el) { return el && el.closest && (el.closest('.uerp') || el.classList.contains('uerp')); }
    var d = Object.getOwnPropertyDescriptor(P, 'innerHTML');
    if (d && d.set && !P.__uerpPatched) {
      Object.defineProperty(P, 'innerHTML', { configurable: true, get: d.get, set: function (v) { d.set.call(this, inUerp(this) ? U.csp(v) : v); } });
      var ia = P.insertAdjacentHTML;
      P.insertAdjacentHTML = function (pos, v) { return ia.call(this, pos, inUerp(this) ? U.csp(v) : v); };
      P.__uerpPatched = true;
    }
  })();
})();
/* ------------------------------------------------------------------ *
 * UNO Core ERP — shell, router binding, mount
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  var U = window.UnoERP;
  if (!U || !U.__kernel) return;
  var esc = U.esc, t = U.t, icon = U.icon, fmt = U.fmt, L = U.L, ui = U.ui;
  var state = U.state, config = U.config;

  U.actions = U.actions || {};
  U.filters = {};
  U.state.meta = null;
  U.state.filters = U.filters;

  function filtersFor(id) {
    if (!U.filters[id]) U.filters[id] = {};
    return U.filters[id];
  }

  /* ---------- preferences ---------- */
  function savePrefs() {
    try {
      localStorage.setItem(config.storageKey + ':prefs', JSON.stringify({
        lang: state.lang, theme: state.theme, density: state.density, branchId: state.branchId
      }));
    } catch (e) {}
  }
  function loadPrefs() {
    try {
      var raw = localStorage.getItem(config.storageKey + ':prefs');
      if (!raw) return;
      var p = JSON.parse(raw);
      if (p.lang) state.lang = p.lang;
      if (p.theme) state.theme = p.theme;
      if (p.density) state.density = p.density;
      if (p.branchId) state.branchId = p.branchId;
    } catch (e) {}
  }

  /* ---------- shell ---------- */
  function rootEl() { return document.querySelector('.uerp'); }

  function railHTML() {
    var activeGroup = state.route ? state.route.moduleId : null;
    return '<aside class="rail" aria-label="' + esc(state.lang === 'ar' ? 'التنقل الرئيسي' : 'Main navigation') + '">' +
      '<div class="logo" aria-hidden="true">UNO</div>' +
      U.groups.map(function (g) {
        var items = U.navItems().filter(function (n) { return n.group === g.id; });
        if (!items.length) return '';
        var on = items.some(function (n) { return n.moduleId === activeGroup || n.screen === (state.route || {}).screenId; });
        return '<button class="rail-btn' + (on ? ' is-active' : '') + '" data-act="rail-group" data-id="' + g.id + '" title="' + esc(L(g)) + '" aria-label="' + esc(L(g)) + '">' + icon(g.icon, 20) + '</button>';
      }).join('') +
      '<div class="rail-spacer"></div>' +
      '<button class="rail-btn" data-act="toggle-theme" title="' + esc(t('app.theme')) + '" aria-label="' + esc(t('app.theme')) + '">' +
      icon(state.theme === 'dark' ? 'sun' : 'moon', 20) + '</button>' +
      '<button class="rail-btn" data-act="toggle-lang" title="' + esc(t('app.lang')) + '" aria-label="' + esc(t('app.lang')) + '">' +
      '<span style="font-size:12px;font-weight:700">' + (state.lang === 'ar' ? 'EN' : 'ع') + '</span></button>' +
      '</aside>';
  }

  function sideHTML() {
    var items = U.navItems();
    var groupsHtml = U.groups.map(function (g) {
      var gi = items.filter(function (n) { return n.group === g.id; });
      if (!gi.length) return '';
      return '<div class="nav-group"><div class="nav-label">' + esc(L(g)) + '</div>' +
        gi.map(function (n) {
          var on = state.route && state.route.screenId === n.screen;
          return '<button class="nav-item' + (on ? ' is-active' : '') + '" data-act="nav" data-id="' + esc(n.screen) + '">' +
            icon(n.icon || g.icon, 18) + '<span class="n-lbl">' + esc(L(n.label)) + '</span>' +
            (n.badge ? '<span class="n-count num">' + esc(n.badge) + '</span>' : '') + '</button>';
        }).join('') + '</div>';
    }).join('');

    return '<aside class="side" aria-label="' + esc(state.lang === 'ar' ? 'القائمة الجانبية' : 'Sidebar') + '">' +
      '<div class="side-head"><div><div class="brand-name">' + esc(state.lang === 'ar' ? config.company.ar : config.company.en) + '</div>' +
      '<div class="brand-sub">' + esc(state.lang === 'ar' ? 'أونو كور — نظام الإدارة' : 'UNO Core — management system') + '</div></div></div>' +
      '<button class="org-switch" data-act="branch-switch">' +
      '<span class="badge-sq">' + icon('building', 14) + '</span>' +
      '<span class="org-txt"><span class="org-t">' + esc(branchLabel(state.branchId)) + '</span>' +
      '<span class="org-s">' + esc(state.lang === 'ar' ? 'الفرع الحالي' : 'Current branch') + '</span></span>' +
      icon('chevDown', 16) + '</button>' +
      '<nav class="nav">' + groupsHtml + '</nav>' +
      '<div class="side-foot"><span class="sync-dot' + (config.demo ? ' is-demo' : '') + '"></span>' +
      '<span>' + (config.demo ? esc(t('app.demo')) : esc(t('app.live'))) + '</span>' +
      '<span style="margin-inline-start:auto;display:flex;gap:2px">' +
      '<button class="icon-btn" data-act="toggle-theme" title="' + esc(t('app.theme')) + '">' + icon(state.theme === 'dark' ? 'sun' : 'moon', 16) + '</button>' +
      '<button class="icon-btn" data-act="toggle-lang" title="' + esc(t('app.lang')) + '"><span style="font-size:11px;font-weight:700">' + (state.lang === 'ar' ? 'EN' : 'ع') + '</span></button>' +
      '</span></div>' +
      '</aside>';
  }

  function branchLabel(id) {
    var b = (U.state.meta && U.state.meta.branches || []).filter(function (x) { return x.id === id; })[0];
    return b ? L(b) : (state.lang === 'ar' ? 'كل الفروع' : 'All branches');
  }

  function currentTitle() {
    var s = state.route && U.screens[state.route.screenId];
    return s ? L(s.def.title) : (state.lang === 'ar' ? 'أونو كور' : 'UNO Core');
  }

  function topbarHTML() {
    return '<header class="topbar">' +
      '<button class="icon-btn hamb" data-act="open-drawer" aria-label="' + esc(t('app.menu')) + '">' + icon('menu', 20) + '</button>' +
      '<button class="searchbox" data-act="open-palette"><span class="sb-txt">' + esc(t('app.search')) + '</span>' +
      '<span class="kbd">Ctrl K</span>' + icon('search', 17) + '</button>' +
      '<div class="topbar-title">' + esc(currentTitle()) + '</div>' +
      '<div class="topbar-right">' +
      (config.demo ? '<span class="pill pill--warn demo-pill" title="' + esc(t('app.demoNote')) + '"><i class="dot"></i>' + esc(t('app.demoShort')) + '</span>' : '') +
      '<button class="icon-btn" data-act="toggle-theme" aria-label="' + esc(t('app.theme')) + '">' + icon(state.theme === 'dark' ? 'sun' : 'moon', 19) + '</button>' +
      '<button class="icon-btn" data-act="toggle-lang" aria-label="' + esc(t('app.lang')) + '">' +
      '<span style="font-size:12px;font-weight:700">' + (state.lang === 'ar' ? 'EN' : 'ع') + '</span></button>' +
      '<button class="icon-btn" data-act="noop" aria-label="' + esc(t('app.notifications')) + '">' + icon('bell', 19) + '</button>' +
      '<button class="who" data-act="noop"><span class="avatar">' + esc(state.user.initials) + '</span>' +
      '<span class="who-txt"><span class="who-t">' + esc(state.lang === 'ar' ? state.user.name_ar : state.user.name_en) + '</span>' +
      '<span class="who-s">' + esc(state.lang === 'ar' ? state.user.role_ar : state.user.role_en) + '</span></span></button>' +
      '</div></header>';
  }

  function skeletonHTML() {
    return '<div class="page-head"><div style="flex:1"><div class="skl skl-t"></div><div class="skl skl-s"></div></div></div>' +
      '<div class="kpis">' + [0, 1, 2, 3].map(function () { return '<div class="kpi"><div class="skl skl-k"></div><div class="skl skl-v"></div></div>'; }).join('') + '</div>' +
      '<div class="card"><div class="card-body">' + [0, 1, 2, 3, 4, 5].map(function () { return '<div class="skl skl-r"></div>'; }).join('') + '</div></div>' +
      '<style>.uerp .skl{background:var(--surface-3);border-radius:6px;height:12px;margin-bottom:10px;animation:pulse 1.4s infinite}.uerp .skl-t{width:220px;height:24px}.uerp .skl-s{width:320px;height:12px}.uerp .skl-k{width:80px}.uerp .skl-v{width:140px;height:26px}.uerp .skl-r{height:38px}@keyframes pulse{0%,100%{opacity:.55}50%{opacity:.9}}@media (prefers-reduced-motion:reduce){.uerp .skl{animation:none}}</style>';
  }

  function shellHTML() {
    return '<div class="scrim" data-act="close-drawer"></div>' +
      '<div class="app' + (state.drawer ? ' is-drawer' : '') + '">' + railHTML() + sideHTML() +
      '<div class="main">' + topbarHTML() + '<main class="page" role="main"></main></div></div>' +
      '<div class="toast-host" aria-live="polite"></div>';
  }

  /* ---------- rendering ---------- */
  function renderShell() {
    var root = rootEl();
    if (!root) return;
    root.setAttribute('dir', state.lang === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', state.lang);
    root.setAttribute('data-theme', state.theme);
    root.innerHTML = shellHTML();
    renderScreen();
  }

  function currentScreen() { return state.route ? U.screens[state.route.screenId] : null; }

  function ctxFor(screenId) {
    var s = U.screens[screenId];
    return {
      screenId: screenId, params: (state.route || {}).params || {}, meta: U.state.meta,
      filters: filtersFor(screenId), state: state, config: config, api: U.api, ui: ui, t: t, L: L, fmt: fmt, icon: icon,
      go: U.go, reload: function () { renderScreen(); }, setFilter: function (k, v) { filtersFor(screenId)[k] = v; },
      patchFilters: function (o) { Object.keys(o).forEach(function (k) { filtersFor(screenId)[k] = o[k]; }); }
    };
  }

  var renderToken = 0;
  function renderScreen() {
    var root = rootEl();
    if (!root) return;
    var page = root.querySelector('.page');
    if (!page) return;
    var s = currentScreen();
    if (!s) {
      page.innerHTML = ui.empty({ title: t('app.empty'), hint: '', icon: 'grid' });
      return;
    }
    var token = ++renderToken;
    page.innerHTML = skeletonHTML();
    var ctx = ctxFor(state.route.screenId);
    var p = s.def.load ? s.def.load(ctx) : null;
    Promise.resolve(p).then(function (data) {
      if (token !== renderToken) return;
      ctx.data = data;
      page.innerHTML = s.def.view(ctx, data);
      ui.bindCharts(page);
      if (s.def.after) s.def.after(ctx, page);
    }).catch(function (err) {
      if (token !== renderToken) return;
      console.error('[UnoERP]', err);
      page.innerHTML = '<div class="page-head"><div class="ph-txt"><h1 class="page-title">' + esc(L(s.def.title)) + '</h1></div></div>' +
        ui.banner({ tone: 'bad', icon: 'alert', title: t('app.error'), text: err && err.message ? err.message : '' }) +
        '<div class="card"><div class="card-body">' + ui.empty({ title: t('app.error'), hint: '', icon: 'alert',
          action: ui.btn(t('app.retry'), { act: 'reload', kind: 'primary' }) }) + '</div></div>';
    });
  }

  function refreshNav() {
    var root = rootEl();
    if (!root) return;
    var side = root.querySelector('.side');
    var rail = root.querySelector('.rail');
    if (side) { var tmp = document.createElement('div'); tmp.innerHTML = U.csp(sideHTML()); side.replaceWith(tmp.firstChild); }
    if (rail) { var tmp2 = document.createElement('div'); tmp2.innerHTML = U.csp(railHTML()); rail.replaceWith(tmp2.firstChild); }
  }

  /* ---------- command palette ---------- */
  function paletteHTML() {
    return '<div class="ovl" data-ovl="palette"><div class="ovl-scrim" data-act="close-palette"></div>' +
      '<div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(t('app.search')) + '" style="width:min(560px,100%)">' +
      '<div class="sheet-head" style="padding:14px"><div class="search-inline" style="flex:1">' + icon('search', 17) +
      '<input id="pal-input" placeholder="' + esc(t('app.search')) + '" autocomplete="off"></div></div>' +
      '<div class="sheet-body" id="pal-body" style="padding:8px"></div></div></div>';
  }
  function openPalette() {
    var root = rootEl();
    if (!root || root.querySelector('[data-ovl="palette"]')) return;
    root.insertAdjacentHTML('beforeend', paletteHTML());
    var input = root.querySelector('#pal-input');
    var body = root.querySelector('#pal-body');
    var all = U.navItems().map(function (n) {
      var s = U.screens[n.screen];
      return { screen: n.screen, label: L(n.label), title: s ? L(s.def.title) : '' };
    });
    function draw(q) {
      var items = all.filter(function (x) { return !q || (x.label + ' ' + x.title).toLowerCase().indexOf(q.toLowerCase()) >= 0; });
      body.innerHTML = '<div class="nav-label">' + esc(t('app.screens')) + '</div>' +
        (items.length ? items.map(function (x) {
          return '<button class="nav-item" data-act="pal-go" data-id="' + esc(x.screen) + '">' + icon('grid', 17) +
            '<span class="n-lbl">' + esc(x.label) + '<span class="sub" style="display:block">' + esc(x.title) + '</span></span></button>';
        }).join('') : '<div class="empty" style="margin:0">' + esc(t('app.noResults')) + '</div>');
    }
    draw('');
    input.addEventListener('input', function () { draw(input.value); });
    input.focus();
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var first = body.querySelector('[data-act="pal-go"]');
        if (first) first.click();
      }
    });
  }
  function closeOverlay(name) {
    var root = rootEl();
    var el = root && root.querySelector('[data-ovl="' + name + '"]');
    if (el) el.remove();
  }

  /* ---------- events ---------- */
  function onAction(act, el, evt) {
    var root = rootEl();
    switch (act) {
      case 'toggle-theme':
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', state.theme);
        savePrefs(); refreshNav(); renderScreen(); return true;
      case 'toggle-lang':
        state.lang = state.lang === 'ar' ? 'en' : 'ar';
        savePrefs(); renderShell(); return true;
      case 'toggle-density':
        state.density = state.density === 'compact' ? 'comfortable' : 'compact';
        savePrefs(); renderScreen(); return true;
      case 'nav':
        U.go(el.getAttribute('data-id')); return true;
      case 'rail-group': {
        var gid = el.getAttribute('data-id');
        var first = U.navItems().filter(function (n) { return n.group === gid; })[0];
        if (first) U.go(first.screen);
        return true;
      }
      case 'open-drawer': state.drawer = true; root.querySelector('.app').classList.add('is-drawer'); return true;
      case 'close-drawer': state.drawer = false; root.querySelector('.app').classList.remove('is-drawer'); return true;
      case 'open-palette': openPalette(); return true;
      case 'close-palette': closeOverlay('palette'); return true;
      case 'pal-go': closeOverlay('palette'); U.go(el.getAttribute('data-id')); return true;
      case 'reload': renderScreen(); return true;
      case 'noop': return true;
      case 'branch-switch': {
        var meta = U.state.meta || { branches: [] };
        var list = [{ id: 'all', label: t('app.allBranches') }].concat((meta.branches || []).map(function (b) { return { id: b.id, label: L(b) }; }));
        var idx = list.map(function (x) { return x.id; }).indexOf(state.branchId);
        var next = list[(idx + 1) % list.length];
        state.branchId = next.id; savePrefs(); refreshNav(); renderScreen();
        ui.toast((state.lang === 'ar' ? 'الفرع: ' : 'Branch: ') + next.label);
        return true;
      }
      case 'print': window.print(); return true;
    }
    var s = currentScreen();
    var fn = (s && s.def.actions && s.def.actions[act]) || U.actions[act];
    if (fn) { fn(ctxFor(state.route.screenId), el, evt); return true; }
    return false;
  }

  function bindRoot(root) {
    if (root.__bound) return;
    root.__bound = true;

    root.addEventListener('click', function (e) {
      var el = e.target.closest('[data-act]');
      if (!el) return;
      var act = el.getAttribute('data-act');
      if (act === 'noop' || act === '') return;
      if (el.tagName === 'INPUT' && el.type === 'checkbox') return;
      if (onAction(act, el, e)) {
        if (el.tagName === 'BUTTON' || el.tagName === 'A') e.preventDefault();
      }
    });

    root.addEventListener('change', function (e) {
      var el = e.target;
      var act = el.getAttribute('data-act');
      if (act === 'select-all') {
        var s = currentScreen();
        if (s && s.def.actions && s.def.actions['select-all']) s.def.actions['select-all'](ctxFor(state.route.screenId), el, e);
        return;
      }
      if (act) {
        var s2 = currentScreen();
        var fn = (s2 && s2.def.actions && s2.def.actions[act]) || U.actions[act];
        if (fn) { fn(ctxFor(state.route.screenId), el, e); return; }
      }
      var key = el.getAttribute('data-filter');
      if (key) {
        filtersFor(state.route.screenId)[key] = el.value;
        renderScreen();
      }
    });

    root.addEventListener('input', U.util.debounce(function (e) {
      var el = e.target;
      if (el.getAttribute('data-act') === 'search' || el.hasAttribute('data-search')) {
        var key = el.getAttribute('data-filter') || 'q';
        filtersFor(state.route.screenId)[key] = el.value;
        var active = document.activeElement;
        var val = el.value, name = el.getAttribute('data-filter') || 'q';
        renderScreen();
        setTimeout(function () {
          var again = root.querySelector('[data-filter="' + name + '"]');
          if (again) { again.focus(); if (again.setSelectionRange && again.type !== 'number') again.setSelectionRange(val.length, val.length); }
        }, 0);
      }
    }, 260));

    root.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var ov = root.querySelector('.ovl');
        if (ov) ov.remove();
        else if (root.querySelector('.app.is-drawer')) { state.drawer = false; root.querySelector('.app').classList.remove('is-drawer'); }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
      if (e.key === 'Enter' && e.target.matches('.tbl tbody tr[data-act]')) e.target.click();
    });

    window.addEventListener('hashchange', function () {
      var r = parseHash();
      if (r && U.screens[r.screenId]) {
        state.route = r;
        refreshNav();
        renderScreen();
      }
    });
  }

  function parseHash() {
    var h = (location.hash || '').replace(config.hashPrefix, '');
    if (!h) return null;
    var parts = h.split('?');
    var seg = parts[0].split('/');
    var params = {};
    if (parts[1]) parts[1].split('&').forEach(function (kv) { var p = kv.split('='); params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); });
    return { moduleId: seg[0], screenId: seg[1], params: params };
  }

  /* ---------- mount ---------- */
  function mount(target, opts) {
    opts = opts || {};
    loadPrefs();
    if (opts.lang) state.lang = opts.lang;
    if (opts.theme) state.theme = opts.theme;
    if (opts.screen) {
      /* handled after meta loads */
      config.initialScreen = opts.screen;
    }
    var host = typeof target === 'string' ? document.querySelector(target) : target;
    var root = rootEl();
    if (!root) {
      root = document.createElement('div');
      root.className = 'uerp';
      if (!host) {
        root.style.position = 'fixed';
        root.style.inset = '0';
        root.style.zIndex = '900';
        root.style.overflow = 'auto';
        document.body.appendChild(root);
      } else {
        host.appendChild(root);
      }
    }
    root.setAttribute('dir', state.lang === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', state.lang);
    root.setAttribute('data-theme', state.theme);
    root.innerHTML = '<div class="app"><div class="main"><main class="page">' + skeletonHTML() + '</main></div></div>';
    bindRoot(root);
    state.mounted = true;

    var loadMeta = U.api.call('erp_meta', {}).then(function (meta) {
      U.state.meta = meta;
      if (meta && meta.demo === false) config.demo = false;
      return meta;
    }).catch(function (err) {
      console.warn('[UnoERP] meta failed, demo only', err);
      return null;
    });

    return loadMeta.then(function () {
      var initial = config.initialScreen || (parseHash() || {}).screenId;
      var fallback = (U.navItems()[0] || {}).screen;
      U.go(U.screens[initial] ? initial : fallback, opts.params || {}, { silent: true });
      renderShell();
      return root;
    });
  }

  U.__render = renderShell;
  U.render = renderShell;
  U.mount = mount;
  U.open = function (screenId, params) { return mount(null, { screen: screenId }); };
  U.close = function () { var r = rootEl(); if (r) r.remove(); state.mounted = false; };
  U.toast = function (m, tone) { ui.toast(m, tone); };
  U.refresh = function () { refreshNav(); renderScreen(); };
  U.setLang = function (l) { state.lang = l; savePrefs(); if (state.mounted) renderShell(); };
  U.setTheme = function (t2) { state.theme = t2; savePrefs(); var r = rootEl(); if (r) r.setAttribute('data-theme', t2); if (state.mounted) { refreshNav(); renderScreen(); } };

  /* auto-mount when the host page provides a container, or ?erp=1 */
  function boot() {
    var host = document.querySelector('[data-uno-erp]') || document.getElementById('uno-erp-root');
    var q = new URLSearchParams(location.search);
    var extra = {};
    q.forEach(function (v, k) { if (['screen', 'lang', 'theme', 'erp'].indexOf(k) < 0) extra[k] = v; });
    var opts = { screen: q.get('screen') || undefined, lang: q.get('lang') || undefined, theme: q.get('theme') || undefined, params: extra };
    if (host) { mount(host, opts); return; }
    if (q.get('erp') === '1') { mount(null, opts); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
