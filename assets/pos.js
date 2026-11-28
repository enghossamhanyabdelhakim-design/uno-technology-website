/* ==========================================================================
   UNO POS — pos.js  (part 1/3: config, i18n, demo data, state, RPC layer)
   Vanilla ES2019. No build step, no external dependency.
   Every write goes through RPC.call(name, payload). Nothing writes a table
   from the client. The demo server below is the reference behaviour the
   SQL functions must reproduce.
   ========================================================================== */
'use strict';

/* ------------------------------------------------------------- 1. Config */
const CFG = {
  demo: false,                       // demo tenant only — never real orders
  deviceId: (function () { try { var d = localStorage.getItem('uno.pos.dev'); if (!d) { d = 'pos-' + Math.random().toString(36).slice(2, 8); localStorage.setItem('uno.pos.dev', d); } return d; } catch (e) { return 'pos-x'; } })(),
  company: { nameAr: 'أونو تكنولوجي', nameEn: 'Uno Technology', taxNo: '' },
  branch: { id: 'br-farshout', nameAr: 'فرشوط', nameEn: 'Farshout', code: 'FAR' },
  currency: { ar: 'ج.م', en: 'EGP' },
  taxRate: 0.14,
  taxInclusive: true,
  shiftMaxHours: 12,
  returnWindowDays: 14,
  weightPrefixes: ['21', '22'],
  weightDigits: 5,
  locale: { ar: 'ar-EG-u-nu-latn', en: 'en-EG' },
  storageKey: 'uno.pos.prefs.v1',
  managerPin: '',
  cashierPin: ''
};

/* Cashier permission keys — enforced server-side, explained in the UI. */
const PERMS = {
  'pos.sale.discount':       { maxPct: 10 },
  'pos.sale.price_override': {},
  'pos.sale.credit':         {},
  'pos.cart.line_delete':    {},
  'pos.invoice.void':        {},
  'pos.return.create':       {},
  'pos.return.full':         {},
  'pos.drawer.open_no_sale': {},
  'pos.shift.close':         {}
};

const ROLES = {
  cashier: { ar: 'كاشير', en: 'Cashier', nameAr: 'حسام', nameEn: 'Hossam', pin: CFG.cashierPin,
    keys: ['pos.sale.discount', 'pos.cart.line_delete', 'pos.return.create', 'pos.shift.close'] },
  manager: { ar: 'مشرف', en: 'Manager', nameAr: 'أ. محمود', nameEn: 'Mr. Mahmoud', pin: CFG.managerPin,
    keys: Object.keys(PERMS) }
};

/* ----------------------------------------------------------------- 2. i18n */
let LANG = 'ar';
const isRTL = () => LANG === 'ar';
const T = (ar, en) => (LANG === 'ar' ? ar : en);
const nf = (v, d) => Number(v).toFixed(d === undefined ? 2 : d);
const money = (v) => nf(v / 100);                       // piastres -> string
const cur = () => (LANG === 'ar' ? CFG.currency.ar : CFG.currency.en);

/** Number + currency, number first in the DOM (currency is a small <i>). */
function amount(v, opts) {
  const o = opts || {};
  const cls = o.cls ? ' ' + o.cls : '';
  const sign = v < 0 ? '−' : '';
  const abs = Math.abs(v) / 100;
  const digits = o.digits === undefined ? 2 : o.digits;
  return `<span class="num${cls}">${sign}${nf(abs, digits)}</span>` +
         (o.noCur ? '' : `<i class="t-cur">${cur()}</i>`);
}
function plainAmount(v, digits) {
  const sign = v < 0 ? '−' : '';
  return sign + nf(Math.abs(v) / 100, digits === undefined ? 2 : digits);
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString(CFG.locale[LANG], { hour: '2-digit', minute: '2-digit', hour12: false });
}
function fmtDateTime(ts) {
  return new Date(ts).toLocaleString(CFG.locale[LANG], {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
  });
}
function fmtShort(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function fmtDuration(ms) {
  const m = Math.max(0, Math.floor(ms / 60000));
  return T(`${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`,
           `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`);
}
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* --------------------------------------------------------- 3. Demo catalog */
/* Demo products only. Names and prices are placeholders for the build. */
const DEMO_CATEGORIES = [
  { id: 'all',       ar: 'الكل',     en: 'All' },
  { id: 'drinks',    ar: 'مشروبات',  en: 'Drinks' },
  { id: 'dairy',     ar: 'ألبان',    en: 'Dairy' },
  { id: 'bakery',    ar: 'مخبوزات',  en: 'Bakery' },
  { id: 'snacks',    ar: 'سناكس',    en: 'Snacks' },
  { id: 'grocery',   ar: 'بقالة',    en: 'Grocery' },
  { id: 'household', ar: 'منظفات',   en: 'Household' }
];

const DEMO_PRODUCTS = [];

const DEMO_CUSTOMERS = [];

/* ------------------------------------------------------------- 4. State */
const state = {
  lang: 'ar',
  theme: 'light',
  density: 'comfortable',
  view: 'pos',                     // pos | display
  online: true,
  syncing: false,
  shift: null,                     // {id, openedAt, openingFloat, cashierId, counted, expected, variance, closedAt, status}
  cart: emptyCart(),
  selected: null,
  category: 'all',
  filter: 'all',
  query: '',
  products: JSON.parse(JSON.stringify(DEMO_PRODUCTS)),
  customers: JSON.parse(JSON.stringify(DEMO_CUSTOMERS)),
  invoices: [],
  returns: [],
  cashMoves: [],
  held: [],
  outbox: [],
  counters: { invoice: 1042, ret: 1, move: 1, held: 1 },
  lastReceipt: null,
  seq: 0,
  ui: {
    sheet: null,
    payMethod: 'cash',
    payRows: [],
    paidInput: '',
    ret: null,
    count: {},
    gate: null,
    scanLog: []
  }
};

function emptyCart() {
  return { lines: [], customerId: null, invoiceDiscount: 0, invoiceDiscountKind: 'amount', note: '', coupon: '', id: null };
}

/* --------------------------------------------------------- 5. Persistence */
function save() {
  if (!CFG.demo) { try { localStorage.setItem(CFG.storageKey, JSON.stringify({ lang: state.lang, theme: state.theme, orbit: 1, density: state.density })); } catch (e) {} return; }
  try {
    const keep = {
      lang: state.lang, theme: state.theme, orbit: 1, density: state.density,
      shift: state.shift, products: state.products, customers: state.customers,
      invoices: state.invoices, returns: state.returns, cashMoves: state.cashMoves,
      held: state.held, outbox: state.outbox, counters: state.counters, seq: state.seq,
      audit: state.audit || []
    };
    localStorage.setItem(CFG.storageKey, JSON.stringify(keep));
  } catch (e) { /* storage full or disabled: demo continues in memory */ }
}

function load() {
  try {
    const raw = localStorage.getItem(CFG.storageKey);
    if (!raw) return false;
    const keep = JSON.parse(raw);
    if (keep.lang) state.lang = keep.lang;
    if (keep.theme && keep.orbit) state.theme = keep.theme;
    if (keep.density) state.density = keep.density;
    if (keep.lang) LANG = keep.lang;
    return true;
  } catch (e) { return false; }
}

function resetDemo() {
  try { localStorage.removeItem(CFG.storageKey); } catch (e) {}
  location.href = location.pathname + (location.search || '');
}

/* ------------------------------------------------------- 6. Money + totals */
const round = Math.round;

/* Measured items (weight, length, volume): UI quantity is in thousandths of the unit (grams for kg, mm for m, ml for L), price is per unit. */
function uLab(pid) { const p = state.products.find((x) => x.id === pid); return LANG === 'ar' ? ((p && p.unitAr) || 'كجم') : ((p && p.unitEn) || 'kg'); }
function stepOf(pid) { const p = state.products.find((x) => x.id === pid); return (p && p.step) || 1; }
function incOf(pid) { const s = stepOf(pid); return s >= 250 ? s : Math.ceil(250 / s) * s; }
function snapQty(pid, q) { const s = stepOf(pid); return Math.max(s, Math.round(q / s) * s); }
function parseDec(v) {
  const a = String(v == null ? '' : v).replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x660)).replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x6F0)).replace(/\u066B|\u066C|,/g, '.');
  const n = Number(a); return isFinite(n) && n > 0 ? n : 0;
}

function lineAmount(line) {
  if (line.qtyKind === 'weight') {
    return round(line.unitPrice * line.qty / 1000) - (line.discount || 0);
  }
  return line.unitPrice * line.qty - (line.discount || 0);
}

function cartTotals(cart) {
  const c = cart || state.cart;
  let subtotal = 0, lineDiscount = 0, qty = 0;
  for (const l of c.lines) {
    subtotal += lineAmount(l);
    lineDiscount += l.discount || 0;
    qty += l.qtyKind === 'weight' ? 1 : l.qty;
  }
  let invDisc = 0;
  if (c.invoiceDiscount) {
    invDisc = c.invoiceDiscountKind === 'pct'
      ? round(subtotal * c.invoiceDiscount / 100)
      : Math.min(c.invoiceDiscount, subtotal);
  }
  const total = Math.max(0, subtotal - invDisc);
  const tax = CFG.taxInclusive ? round(total - total / (1 + CFG.taxRate)) : round(total * CFG.taxRate);
  return {
    subtotal, lineDiscount, invoiceDiscount: invDisc,
    discountTotal: lineDiscount + invDisc,
    total, tax, qty,
    lines: c.lines.length
  };
}

function nextInvoiceNo() {
  return `${CFG.branch.code}-${String(state.counters.invoice).padStart(4, '0')}`;
}

/* ------------------------------------------------------- 7. Demo RPC layer */
/* Reference implementation. In production these map 1:1 to Postgres
   functions called through supabase.rpc(name, payload).               */
const RpcError = (code, ar, en) => Object.assign(new Error(ar), { code, ar, en });

const DemoServer = (() => {
  const seenKeys = new Set();

  function guardShift() {
    if (!state.shift || state.shift.status !== 'open') {
      throw RpcError('SHIFT_CLOSED', 'مفيش وردية مفتوحة. افتح وردية الأول.', 'No open shift. Open a shift first.');
    }
  }
  function guardPerm(key, role) {
    const r = ROLES[role || (state.shift ? state.shift.cashierRole : 'cashier')];
    if (!r.keys.includes(key)) {
      throw RpcError('PERM_DENIED', 'المفتاح مش متاح للدور الحالي: ' + key, 'Permission not granted: ' + key);
    }
  }
  function findProduct(id) {
    const p = state.products.find((x) => x.id === id);
    if (!p) throw RpcError('NO_PRODUCT', 'الصنف مش موجود.', 'Product not found.');
    return p;
  }

  /* ---- pos_sale(payload) -> {invoice} -------------------------------- */
  function pos_sale(p) {
    guardShift();
    const key = p.idempotency_key;
    if (!key) throw RpcError('NO_KEY', 'مفتاح العملية مطلوب.', 'Idempotency key required.');
    if (seenKeys.has(key)) {
      const prev = state.invoices.find((i) => i.idempotency_key === key);
      if (prev) return { invoice: prev, replayed: true };
    }
    if (!p.lines || !p.lines.length) throw RpcError('EMPTY', 'الفاتورة فاضية.', 'Cart is empty.');

    /* 1. Re-price and validate every line on the server. */
    const lines = p.lines.map((l) => {
      const prod = findProduct(l.product_id);
      const qty = l.qty_kind === 'weight' ? Math.round(l.qty) : Math.round(l.qty);
      if (!(qty > 0)) throw RpcError('BAD_QTY', 'كمية غير صحيحة في ' + prod.ar, 'Bad quantity in ' + prod.en);
      if (prod.stock < qty) {
        throw RpcError('NO_STOCK', `المتاح من ${LANG === 'ar' ? prod.ar : prod.en} ${prod.stock} بس.`,
                       `Only ${prod.stock} left of ${prod.en}.`);
      }
      const unitPrice = l.price_override || prod.price;
      const discount = Math.max(0, Math.round(l.discount || 0));
      const gross = l.qty_kind === 'weight' ? round(unitPrice * qty / 1000) : unitPrice * qty;
      if (discount > gross) throw RpcError('BAD_DISC', 'الخصم أكبر من قيمة السطر.', 'Line discount exceeds line value.');
      return {
        product_id: prod.id, name_ar: prod.ar, name_en: prod.en, mono: prod.mono,
        qty, qty_kind: l.qty_kind || 'unit', unit_price: unitPrice, unit_ar: prod.unitAr, unit_en: prod.unitEn,
        discount, amount: gross - discount, note: l.note || null, price_override: !!l.price_override
      };
    });

    /* 2. Discount cap for the cashier's role. */
    const subtotal = lines.reduce((s, l) => s + l.amount, 0);
    const invDisc = Math.max(0, Math.round(p.invoice_discount || 0));
    if (invDisc > subtotal) throw RpcError('BAD_DISC', 'خصم الفاتورة أكبر من الإجمالي.', 'Invoice discount exceeds subtotal.');
    const pct = subtotal ? (lines.reduce((s, l) => s + l.discount, 0) + invDisc) / subtotal * 100 : 0;
    const cap = PERMS['pos.sale.discount'].maxPct;
    if (pct > cap + 0.001 && !p.manager_token) {
      throw RpcError('DISC_CAP', `الخصم ${nf(pct, 1)}% فوق سقف الكاشير ${cap}%. محتاج رمز مدير.`,
                     `Discount ${nf(pct, 1)}% is over the ${cap}% cashier cap. Manager PIN required.`);
    }

    /* 3. Payment split: sum must cover the total; change only from cash. */
    const total = Math.max(0, subtotal - invDisc);
    const pays = (p.payments || []).map((x) => ({ method: x.method, amount: Math.round(x.amount) }));
    const paidNonCredit = pays.filter((x) => x.method !== 'credit').reduce((s, x) => s + x.amount, 0);
    const credit = pays.filter((x) => x.method === 'credit').reduce((s, x) => s + x.amount, 0);
    if (!pays.length) throw RpcError('NO_PAY', 'مفيش طريقة دفع.', 'No payment method.');
    if (paidNonCredit + credit < total) {
      throw RpcError('SHORT', 'المدفوع أقل من المطلوب.', 'Paid is less than the total.');
    }
    if (credit > 0) {
      if (!p.customer_id) throw RpcError('CREDIT_NO_CUST', 'البيع الآجل يلزمه عميل.', 'Credit sales require a customer.');
      guardPerm('pos.sale.credit');
      const c = state.customers.find((x) => x.id === p.customer_id);
      if (!c) throw RpcError('NO_CUST', 'العميل مش موجود.', 'Customer not found.');
      if (c.credit_limit <= 0) {
        throw RpcError('NO_CREDIT', `العميل ${LANG === 'ar' ? c.ar : c.en} مش عليه حد ائتمان.`,
                       `${c.en} has no credit limit.`);
      }
      if (c.balance + credit > c.credit_limit) {
        const free = c.credit_limit - c.balance;
        throw RpcError('CREDIT_LIMIT',
          `المتاح للعميل ${money(free)} ج.م والمطلوب آجل ${money(credit)} ج.م.`,
          `Available credit ${money(free)} EGP, requested ${money(credit)} EGP.`);
      }
    }
    const change = Math.max(0, paidNonCredit - (total - credit));

    /* Record applied amounts, not tendered: the drawer only keeps the total,
       the rest goes back to the customer as change. */
    let changeLeft = change;
    const applied = pays.map((x) => ({ ...x }));
    for (let i = applied.length - 1; i >= 0 && changeLeft > 0; i--) {
      if (applied[i].method === 'cash') {
        const take = Math.min(applied[i].amount, changeLeft);
        applied[i].amount -= take;
        changeLeft -= take;
      }
    }
    const settled = applied.filter((x) => x.amount > 0);

    /* 4. Apply every effect together. */
    const inv = {
      id: 'inv-' + (++state.seq),
      number: p.number || nextInvoiceNo(),
      created_at: Date.now(),
      shift_id: state.shift.id,
      device_id: CFG.deviceId,
      cashier_id: state.shift.cashierId,
      customer_id: p.customer_id || null,
      customer_name: p.customer_id ? (state.customers.find((c) => c.id === p.customer_id) || {})[LANG] : null,
      lines, subtotal, invoice_discount: invDisc, total,
      tax: CFG.taxInclusive ? round(total - total / (1 + CFG.taxRate)) : round(total * CFG.taxRate),
      payments: settled, tendered_total: paidNonCredit + credit,
      paid_total: total, change_due: change,
      credit_amount: credit,
      note: p.note || null,
      status: 'paid',
      idempotency_key: key,
      returned_total: 0
    };
    state.counters.invoice++;
    state.invoices.unshift(inv);
    for (const l of lines) {
      const prod = state.products.find((x) => x.id === l.product_id);
      prod.stock -= l.qty;
    }
    if (credit > 0) {
      const c = state.customers.find((x) => x.id === p.customer_id);
      c.balance += credit;
    }
    seenKeys.add(key);
    return { invoice: inv, replayed: false };
  }

  /* ---- pos_return(payload) -> {ret} ---------------------------------- */
  /* Atomic: validate the whole document, then apply all five effects.
     Nothing is written if any step fails.                              */
  function pos_return(p) {
    guardShift();
    guardPerm('pos.return.create');
    const key = p.idempotency_key;
    if (!key) throw RpcError('NO_KEY', 'مفتاح العملية مطلوب.', 'Idempotency key required.');
    const prev = state.returns.find((r) => r.idempotency_key === key);
    if (prev) return { ret: prev, replayed: true };

    const inv = state.invoices.find((i) => i.id === p.invoice_id);
    if (!inv) throw RpcError('NO_INVOICE', 'الفاتورة مش موجودة.', 'Invoice not found.');
    if (inv.status === 'voided') throw RpcError('VOIDED', 'الفاتورة ملغاة.', 'Invoice is voided.');
    const ageDays = (Date.now() - inv.created_at) / 86400000;
    if (ageDays > CFG.returnWindowDays && !p.manager_token) {
      throw RpcError('WINDOW', `الفاتورة أقدم من ${CFG.returnWindowDays} يوم. محتاج مدير.`,
                     `Invoice is older than ${CFG.returnWindowDays} days. Manager required.`);
    }
    if (!p.reason) throw RpcError('NO_REASON', 'السبب إجباري.', 'A reason is required.');

    /* lines: max per line = sold − already returned */
    const lines = (p.lines || []).map((l) => {
      const src = inv.lines.find((x) => x.product_id === l.product_id);
      if (!src) throw RpcError('NO_LINE', 'السطر مش في الفاتورة.', 'Line not on the invoice.');
      const already = state.returns
        .filter((r) => r.invoice_id === inv.id)
        .flatMap((r) => r.lines)
        .filter((x) => x.product_id === l.product_id)
        .reduce((s, x) => s + x.qty, 0);
      const remaining = src.qty - already;
      const qty = Math.round(l.qty);
      if (qty <= 0) throw RpcError('BAD_QTY', 'كمية الإرجاع لازم تكون أكبر من صفر.', 'Return quantity must be positive.');
      if (qty > remaining) {
        throw RpcError('OVER_RETURN', `المتاح للإرجاع من ${LANG === 'ar' ? src.name_ar : src.name_en} ${remaining}.`,
                       `Only ${remaining} returnable for ${src.name_en}.`);
      }
      const unitRefund = src.unit_price - (src.discount && src.qty ? round(src.discount / src.qty) : 0);
      const refund = src.qty_kind === 'weight' ? round(unitRefund * qty / 1000) : unitRefund * qty;
      return {
        product_id: src.product_id, name_ar: src.name_ar, name_en: src.name_en,
        qty, qty_kind: src.qty_kind, refund, restock: l.restock !== false
      };
    });
    if (!lines.length) throw RpcError('EMPTY_RET', 'اختار سطر واحد على الأقل.', 'Select at least one line.');

    const amount = lines.reduce((s, l) => s + l.refund, 0);
    const isFull = inv.lines.every((src) => {
      const already = state.returns.filter((r) => r.invoice_id === inv.id).flatMap((r) => r.lines)
        .filter((x) => x.product_id === src.product_id).reduce((s, x) => s + x.qty, 0);
      const now = lines.filter((l) => l.product_id === src.product_id).reduce((s, l) => s + l.qty, 0);
      return already + now >= src.qty;
    });
    if (isFull && !p.manager_token) {
      throw RpcError('FULL_RETURN', 'الاسترجاع الكامل يحتاج موافقة مدير.', 'A full return needs manager approval.');
    }
    if (p.refund_method === 'credit' && !inv.customer_id) {
      throw RpcError('CREDIT_NOTE_NO_CUST', 'الرصيد يحتاج عميل على الفاتورة.', 'Store credit needs a customer on the invoice.');
    }
    if (p.refund_method === 'cash' && cashInDrawer() < amount && !p.manager_token) {
      throw RpcError('DRAWER_SHORT', 'الدرج مش كفاية للمبلغ ده. محتاج مدير.', 'Not enough cash in the drawer. Manager required.');
    }

    /* all validations passed: apply the five effects */
    const ret = {
      id: 'ret-' + (++state.seq),
      number: 'RET-' + String(state.counters.ret++).padStart(4, '0'),
      invoice_id: inv.id, invoice_number: inv.number,
      created_at: Date.now(), shift_id: state.shift.id, cashier_id: state.shift.cashierId,
      customer_id: inv.customer_id, lines, amount,
      reason: p.reason, refund_method: p.refund_method || 'cash',
      status: 'posted', idempotency_key: key
    };
    state.returns.unshift(ret);
    for (const l of lines) {
      const prod = state.products.find((x) => x.id === l.product_id);
      if (l.restock) prod.stock += l.qty;              // damaged stock never re-enters availability
    }
    if (ret.refund_method === 'credit' && inv.customer_id) {
      const c = state.customers.find((x) => x.id === inv.customer_id);
      c.balance = Math.max(0, c.balance - amount);
    }
    inv.returned_total = (inv.returned_total || 0) + amount;
    inv.status = inv.returned_total >= inv.total ? 'returned' : 'partial';
    return { ret, replayed: false };
  }

  /* ---- shift_open / shift_close ------------------------------------- */
  function shift_open(p) {
    if (state.shift && state.shift.status === 'open') {
      throw RpcError('SHIFT_OPEN', 'فيه وردية مفتوحة بالفعل.', 'A shift is already open.');
    }
    state.shift = {
      id: 'sh-' + (++state.seq),
      openedAt: Date.now(),
      openingFloat: Math.round(p.opening_float || 0),
      cashierId: p.cashier_id || 'u-cashier',
      cashierRole: p.role || 'cashier',
      status: 'open',
      counted: null, expected: null, variance: null, closedAt: null
    };
    return { shift: state.shift };
  }

  function shift_close(p) {
    guardShift();
    guardPerm('pos.shift.close');
    if (p.counted_total == null) throw RpcError('NO_COUNT', 'لازم عدّ الدرج الأول.', 'Count the drawer first.');
    const expected = expectedDrawer();
    const counted = Math.round(p.counted_total);
    state.shift.counted = counted;
    state.shift.expected = expected;
    state.shift.variance = counted - expected;
    state.shift.closedAt = Date.now();
    state.shift.status = 'closed';
    state.shift.z = { sales: shiftSales(), expected, counted, variance: counted - expected };
    return { shift: state.shift };
  }

  /* ---- cash_move(payload) ------------------------------------------- */
  function cash_move(p) {
    guardShift();
    const type = p.type;
    if (!['pay_in', 'pay_out', 'expense', 'safe_drop'].includes(type)) {
      throw RpcError('BAD_TYPE', 'نوع الحركة غير معروف.', 'Unknown movement type.');
    }
    if (!p.reason) throw RpcError('NO_REASON', 'السبب إجباري لكل حركة درج.', 'Every drawer movement needs a reason.');
    const amount = Math.round(p.amount);
    if (!(amount > 0)) throw RpcError('BAD_AMOUNT', 'المبلغ لازم يكون أكبر من صفر.', 'Amount must be positive.');
    if (type === 'pay_out' && amount > cashInDrawer() && !p.manager_token) {
      throw RpcError('DRAWER_SHORT', 'المبلغ أكبر من النقدية في الدرج.', 'Amount is more than the cash in the drawer.');
    }
    const mv = {
      id: 'cm-' + (++state.seq),
      shift_id: state.shift.id,
      type, amount,
      reason: p.reason, note: p.note || null,
      voucher_no: 'CM-' + String(state.counters.move++).padStart(4, '0'),
      user_id: state.shift.cashierId,
      created_at: Date.now()
    };
    state.cashMoves.unshift(mv);
    return { move: mv };
  }

  /* ---- invoice_void(payload) ---------------------------------------- */
  function invoice_void(p) {
    guardShift();
    guardPerm('pos.invoice.void');
    const inv = state.invoices.find((i) => i.id === p.invoice_id);
    if (!inv) throw RpcError('NO_INVOICE', 'الفاتورة مش موجودة.', 'Invoice not found.');
    if (inv.status === 'voided') throw RpcError('VOIDED', 'الفاتورة ملغاة بالفعل.', 'Invoice is already voided.');
    if (inv.returned_total > 0) throw RpcError('HAS_RETURNS', 'فيها مرتجعات. اعمل مستند عكسي بدل الإلغاء.', 'Has returns. Post a reversing document instead.');
    if (!p.reason) throw RpcError('NO_REASON', 'سبب الإلغاء إجباري.', 'Void reason is required.');
    if (!p.refund_mode) throw RpcError('NO_MODE', 'حدد: المبلغ رجع للعميل ولا فضل في الخزنة؟', 'Choose: refunded to customer or kept in the drawer?');
    inv.status = 'voided';
    inv.void = { reason: p.reason, refund_mode: p.refund_mode, at: Date.now(), by: state.shift.cashierId };
    for (const l of inv.lines) {
      const prod = state.products.find((x) => x.id === l.product_id);
      if (prod) prod.stock += l.qty;
    }
    if (inv.credit_amount && inv.customer_id) {
      const c = state.customers.find((x) => x.id === inv.customer_id);
      if (c) c.balance = Math.max(0, c.balance - inv.credit_amount);
    }
    return { invoice: inv };
  }

  return { pos_sale, pos_return, shift_open, shift_close, cash_move, invoice_void, seenKeys };
})();

const RPC = {
  names: ['pos_sale', 'pos_return', 'shift_open', 'shift_close', 'cash_move', 'invoice_void'],
  async call(name, payload) {
    if (CFG.demo) {
      // demo latency: zero, so the UI path is measured, not the network
      return DemoServer[name](payload || {});
    }
    if (typeof window.unoRpc === 'function') return window.unoRpc(name, payload);
    throw RpcError('NO_RPC', 'طبقة الاتصال غير مهيأة.', 'RPC transport is not configured.');
  }
};

/* Drawer maths — expected is computed from movements, never stored as a number */
function cashInDrawer() {
  if (!state.shift) return 0;
  const mv = state.cashMoves.filter((m) => m.shift_id === state.shift.id);
  return state.shift.openingFloat + shiftSales().cash + mv.reduce((s, m) => s + delta(m), 0);
}
function delta(m) {
  if (m.type === 'pay_in') return m.amount;
  if (m.type === 'pay_out') return -m.amount;
  if (m.type === 'expense') return -m.amount;
  if (m.type === 'safe_drop') return -m.amount;
  return 0;
}
function shiftSales() {
  const sid = state.shift ? state.shift.id : null;
  const inv = state.invoices.filter((i) => i.shift_id === sid && i.status !== 'voided');
  const ret = state.returns.filter((r) => r.shift_id === sid);
  const byMethod = { cash: 0, card: 0, wallet: 0, credit: 0 };
  let gross = 0, tax = 0, discount = 0, count = 0;
  for (const i of inv) {
    gross += i.total; tax += i.tax; discount += i.invoice_discount;
    count++;
    for (const p of i.payments) byMethod[p.method] = (byMethod[p.method] || 0) + p.amount;
  }
  const refunds = ret.reduce((s, r) => s + r.amount, 0);
  const cashRefunds = ret.filter((r) => r.refund_method === 'cash').reduce((s, r) => s + r.amount, 0);
  byMethod.cash -= cashRefunds;
  if (byMethod.credit) byMethod.credit -= ret.filter((r) => r.refund_method === 'credit').reduce((s, r) => s + r.amount, 0);
  return { gross, tax, discount, count, refunds, byMethod, cash: byMethod.cash, net: gross - refunds };
}
function expectedDrawer() {
  const s = shiftSales();
  const mv = state.cashMoves.filter((m) => m.shift_id === (state.shift ? state.shift.id : null));
  return state.shift.openingFloat + s.cash + mv.reduce((sum, m) => sum + delta(m), 0);
}
/* ==========================================================================
   pos.js — part 2/3: rendering, cart operations, sheets, keyboard, scanner
   ========================================================================== */

/* ---------------------------------------------------------- 8. DOM helpers */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const el = (id) => document.getElementById(id);

/* Inline stroke icons: no external font, no emoji dependency, crisp at any size */
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4.3-4.3"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5"/>',
  pause: '<rect x="8" y="6" width="3" height="12" rx="1"/><rect x="13" y="6" width="3" height="12" rx="1"/>',
  percent: '<path d="M6 18L18 6"/><circle cx="7.5" cy="7.5" r="2.2"/><circle cx="16.5" cy="16.5" r="2.2"/>',
  more: '<circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/>',
  cash: '<rect x="3" y="7" width="18" height="10" rx="2"/><circle cx="12" cy="12" r="2.4"/>',
  card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>',
  wallet: '<rect x="4" y="6" width="16" height="12" rx="2.5"/><path d="M16 12h3"/>',
  credit: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  printer: '<path d="M7 9V5h10v4"/><rect x="4" y="9" width="16" height="7" rx="1.5"/><path d="M7 16h10v4H7z"/>',
  message: '<path d="M20 15a2 2 0 0 1-2 2H8l-4 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/>',
  scale: '<path d="M12 4v16"/><path d="M6 8h12"/><path d="M6 8l-2 5a3 3 0 0 0 6 0z"/><path d="M18 8l-2 5a3 3 0 0 0 6 0z"/>',
  cart: '<circle cx="9" cy="19" r="1.6"/><circle cx="18" cy="19" r="1.6"/><path d="M3 4h2l2.4 11h11L21 7H6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".6" fill="currentColor"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  backspace: '<path d="M9 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-6-6z"/><path d="M13 10l4 4M17 10l-4 4"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  cup: '<path d="M6 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/>',
  bottle: '<path d="M10 3h4v3l2 3v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9l2-3z"/>',
  bread: '<path d="M4 12a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M6 15v3h12v-3"/>',
  snack: '<rect x="7" y="4" width="10" height="16" rx="2"/><path d="M7 9h10M7 15h10"/>',
  bag: '<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  spray: '<rect x="9" y="9" width="6" height="11" rx="1.5"/><path d="M12 9V6h3"/><path d="M17 5l2-1M17 8l2 1"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  barcode: '<path d="M4 6v12M8 6v12M11 6v12M14 6v12M18 6v12"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  display: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M9 20h6M12 16v4"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  drawer: '<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M3 13h18"/><path d="M10 13h4"/>',
  shift: '<path d="M4 19V5"/><path d="M4 19h16"/><rect x="7" y="11" width="3" height="8"/><rect x="12" y="8" width="3" height="11"/>',
  ret: '<path d="M9 7H15a4 4 0 0 1 0 8H8"/><path d="M11 4L8 7l3 3"/>',
  down: '<path d="M12 5v12"/><path d="M7 12l5 5 5-5"/>',
  up: '<path d="M12 19V7"/><path d="M7 12l5-5 5 5"/>',
  safe: '<rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M12 4v2M12 18v2"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>'
};
function ico(name, size) {
  const s = size || 18;
  return `<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}
const CAT_ICON = { all: 'grid', drinks: 'cup', dairy: 'bottle', bakery: 'bread', snacks: 'snack', grocery: 'bag', household: 'spray' };

/* ------------------------------------------------------------ 9. Rendering */
function renderAll() {
  document.documentElement.lang = state.lang;
  document.documentElement.dir = isRTL() ? 'rtl' : 'ltr';
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.dataset.density = state.density;
  renderTopbar();
  renderRail();
  renderGrid();
  renderCart();
  renderDock();
  renderOutboxPill();
}

function renderTopbar() {
  el('brandName').textContent = CFG.company[LANG === 'ar' ? 'nameAr' : 'nameEn'];
  el('brandSub').textContent = `${CFG.branch[LANG === 'ar' ? 'nameAr' : 'nameEn']} · ${CFG.branch.code}`;
  el('demoFlag').style.display = 'none';
  

  const conn = el('connPill');
  const openShift = state.shift && state.shift.status === 'open';
  conn.className = 'pill' + (state.syncing ? ' is-sync' : state.online ? '' : ' is-offline');
  conn.innerHTML = `<span class="dot"></span><span class="txt-long">${state.syncing
    ? T('جارٍ المزامنة', 'Syncing') : state.online ? T('متصل', 'Online') : T('أوفلاين', 'Offline')}</span>`;

  const shiftPill = el('shiftPill');
  shiftPill.className = 'pill btn' + (openShift ? '' : ' is-bad');
  shiftPill.title = (openShift && state.shift.label) ? T('الجلسة', 'Session') + ': ' + state.shift.label : '';
  shiftPill.innerHTML = openShift
    ? `<span class="txt-long">${T('وردية', 'Shift')} <strong class="num">#${String(state.shift.id).slice(-2)}</strong> · ${fmtDuration(Date.now() - state.shift.openedAt)}</span>`
    : `<span class="txt-long">${T('مفيش وردية', 'No shift')}</span>`;

  const cashier = state.shift ? ROLES[state.shift.cashierRole || 'cashier'] : ROLES.cashier;
  el('cashierName').textContent = cashier[LANG === 'ar' ? 'nameAr' : 'nameEn'];
  el('cashierRole').textContent = cashier[LANG];
  el('cashierAvatar').textContent = (cashier[LANG === 'ar' ? 'nameAr' : 'nameEn'] || '?').trim().charAt(0);
  el('clock').textContent = fmtTime(Date.now());
  el('searchInput').placeholder = T('ابحث بالاسم أو امسح باركود…', 'Search by name or scan a barcode…');
}

function renderRail() {
  const rail = el('rail');
  rail.innerHTML = DEMO_CATEGORIES.map((c) => {
    const count = c.id === 'all' ? state.products.length : state.products.filter((p) => p.cat === c.id).length;
    return `<button class="cat${state.category === c.id ? ' is-active' : ''}" data-act="cat" data-id="${c.id}"
      aria-pressed="${state.category === c.id}">
      <span class="cat-count num">${count}</span>
      <span class="cat-ico" aria-hidden="true">${ico(CAT_ICON[c.id] || 'grid', 20)}</span>
      <span>${esc(c[LANG])}</span>
    </button>`;
  }).join('');
}

function visibleProducts() {
  const q = state.query.trim().toLowerCase();
  return state.products.filter((p) => {
    if (state.category !== 'all' && p.cat !== state.category) return false;
    if (state.filter === 'promo' && !p.promo) return false;
    if (state.filter === 'nobarcode' && p.barcode) return false;
    if (!q) return true;
    return (p[LANG] || '').toLowerCase().includes(q)
      || p.barcode.includes(q)
      || p.id.includes(q)
      || (p.barcode.slice(-4) === q);
  });
}

function renderGrid() {
  const list = visibleProducts();
  const cat = DEMO_CATEGORIES.find((c) => c.id === state.category) || DEMO_CATEGORIES[0];
  el('gridTitle').innerHTML = `${esc(cat[LANG])} <span class="muted">· ${list.length} ${T('صنف', 'items')}</span>`;
  el('filterChips').innerHTML = [
    { id: 'all',       ar: 'الكل',     en: 'All' },
    { id: 'promo', ar: 'عروض', en: 'Promos' },
    { id: 'nobarcode', ar: 'بدون باركود', en: 'No barcode' }
  ].map((f) => `<button class="chip${state.filter === f.id ? ' is-on' : ''}" data-act="filter" data-id="${f.id}">${esc(f[LANG])}</button>`).join('');

  const grid = el('grid');
  if (!list.length) {
    grid.innerHTML = `<div class="empty"><div class="e-ico">${ico('search', 32)}</div>
      <p>${T('مفيش نتائج للبحث ده.', 'No products match that search.')}</p>
      <button class="btn is-sm" data-act="open-price">${T('صنف مفتوح السعر', 'Open-price item')}</button></div>`;
    return;
  }
  grid.innerHTML = list.map((p) => {
    const inCart = state.cart.lines.filter((l) => l.productId === p.id).reduce((s, l) => s + l.qty, 0);
    const low = p.weighted ? p.stock <= 5000 : p.stock <= 10;
    return `<button class="tile${p.stock <= 0 ? ' is-oos' : ''}${inCart ? ' is-selected' : ''}"
      data-act="add" data-id="${p.id}" aria-label="${esc(p[LANG])} ${money(p.price)} ${cur()}">
      <span class="mono" aria-hidden="true">${esc(p.mono)}</span>
      <span class="t-name">${esc(p[LANG])}</span>
      <span class="t-foot"><span class="t-price">${money(p.price)}</span><i class="t-cur">${cur()}</i></span>
      <span class="t-stock${low ? ' is-low' : ''}">${p.weighted ? nf(p.stock / 1000, 3) + ' ' + (LANG === 'ar' ? p.unitAr : p.unitEn) : p.stock}</span>
      ${inCart ? `<span class="t-badge num">${p.weighted ? nf(inCart / 1000, 3) : inCart}</span>` : ''}
      ${p.weighted ? `<span class="t-flag is-w">${ico('scale', 14)}</span>` : ''}
      ${p.blocked ? '<span class="t-flag">ممنوع</span>' : ''}
    </button>`;
  }).join('');
}

function renderCart() {
  renderTabs();
  const c = state.cart;
  const t = cartTotals();
  el('invNo').textContent = c.id ? c.id : nextInvoiceNo();
  const invLabel = el('invLabel'); if (invLabel) invLabel.textContent = T('الفاتورة', 'Invoice');
  el('cart').setAttribute('aria-label', T('الفاتورة', 'Invoice'));
  const cust = state.customers.find((x) => x.id === c.customerId);
  const custBtn = el('custBtn');
  custBtn.className = 'cust' + (cust ? ' has' : '');
  custBtn.innerHTML = `<span aria-hidden="true">${ico('user', 16)}</span><span>${cust ? esc(cust[LANG]) : T('عميل نقدي', 'Walk-in')}</span>`;
  if (cust) {
    const free = Math.max(0, cust.credit_limit - cust.balance);
    custBtn.title = `${T('المتاح على الحساب', 'Credit available')}: ${money(free)} ${cur()}`;
  } else custBtn.title = '';

  const lines = el('cartLines');
  if (!c.lines.length) {
    lines.innerHTML = `<div class="empty" style="padding:36px 16px">
      <div class="e-ico">${ico('cart', 32)}</div><p>${T('امسح أول صنف أو المس صنف من الشبكة.', 'Scan the first item or tap a tile.')}</p></div>`;
  } else {
    lines.innerHTML = c.lines.map((l) => {
      const amt = lineAmount(l);
      const qtyLabel = l.qtyKind === 'weight' ? nf(l.qty / 1000, 3) + ' ' + uLab(l.productId) : l.qty + ' × ' + money(l.unitPrice);
      return `<div class="line${state.selected === l.id ? ' is-selected' : ''}${l.discount ? ' is-discount' : ''}"
        data-act="select-line" data-id="${l.id}" role="listitem">
        <span class="l-main">
          <span class="l-name">${esc(l[LANG])}${l.note ? ` ${ico('receipt', 14)}` : ''}</span>
          <span class="l-meta">${esc(qtyLabel)}${l.discount ? ` <span class="tag">−${money(l.discount)}</span>` : ''}</span>
        </span>
        <span class="l-side">
          <span class="stepper" data-stop="1">
            <button data-act="qty" data-id="${l.id}" data-d="1" aria-label="${T('زيادة', 'Increase')}">${ico('plus', 14)}</button>
            <span class="q">${l.qtyKind === 'weight' ? nf(l.qty / 1000, 3) : l.qty}</span>
            <button data-act="qty" data-id="${l.id}" data-d="-1" aria-label="${T('تقليل', 'Decrease')}">${ico('minus', 14)}</button>
          </span>
          <span class="l-total">${money(amt)}</span>
        </span>
      </div>`;
    }).join('');
  }

  const note = el('cartNote');
  note.innerHTML = c.note ? ico('receipt', 14) + ' ' + esc(c.note) : T('+ إضافة ملاحظة على الفاتورة…', '+ Add a note to the invoice…');

  const totals = el('cartTotals');
  totals.innerHTML = `
    <div class="tot-row"><span>${T('الإجمالي الفرعي', 'Subtotal')}</span><span class="v">${money(t.subtotal)}</span></div>
    ${t.discountTotal ? `<div class="tot-row is-disc"><span>${T('الخصم', 'Discount')}</span><span class="v">−${money(t.discountTotal)}</span></div>` : ''}
    <div class="tot-row"><span>${T('ض.ق.م 14% (مشمولة)', 'VAT 14% (included)')}</span><span class="v">${money(t.tax)}</span></div>
    <div class="tot-row is-grand"><span>${T('الإجمالي', 'Total')}</span><span class="v">${money(t.total)}</span></div>`;

  const live = el('cartLive');
  live.textContent = c.lines.length
    ? `${T('أضيف', 'Added')} ${c.lines[c.lines.length - 1][LANG]}, ${T('الإجمالي', 'total')} ${money(t.total)}`
    : '';

  const mbCount = el('mbCount'), mbTotal = el('mbTotal');
  if (mbCount) mbCount.textContent = `${t.lines} ${T('أصناف', 'items')}`;
  if (mbTotal) mbTotal.textContent = `${money(t.total)} ${cur()}`;
}

function renderDock() {
  const t = cartTotals();
  const pay = el('payBtn');
  pay.querySelector('.amt').textContent = money(t.total);
  pay.querySelector('.cur').textContent = cur();
  pay.disabled = !t.lines || !(state.shift && state.shift.status === 'open');
  pay.title = !(state.shift && state.shift.status === 'open')
    ? T('افتح وردية الأول', 'Open a shift first') : '';
  el('payLbl').textContent = T('دفع', 'Pay');
  const payLblM = el('payLblM'); if (payLblM) payLblM.textContent = T('دفع', 'Pay');
  const mbPay = el('mbPayAmt');
  if (mbPay) mbPay.textContent = money(t.total);
  const mbPayBtn = el('payBtnM');
  if (mbPayBtn) mbPayBtn.disabled = pay.disabled;
  el('holdBtn').innerHTML = `<span aria-hidden="true">${ico('pause', 18)}</span><span>${T('تعليق', 'Hold')}</span><span class="k">F3</span>`;
  el('discBtn').innerHTML = `<span aria-hidden="true">${ico('percent', 18)}</span><span>${T('خصم', 'Discount')}</span><span class="k">F5</span>`;
  el('custDockBtn').innerHTML = `<span aria-hidden="true">${ico('user', 18)}</span><span>${T('عميل', 'Customer')}</span><span class="k">F4</span>`;
  el('moreBtn').innerHTML = `<span aria-hidden="true">${ico('more', 18)}</span><span>${T('المزيد', 'More')}</span>`;
}

function renderOutboxPill() {
  const pending = state.outbox.filter((o) => o.status !== 'sent').length;
  const p = el('outboxPill');
  if (!p) return;
  p.style.display = pending ? 'inline-flex' : 'none';
  p.innerHTML = `<span class="dot"></span><span>${T('جارٍ إرسال', 'Sending')} <b class="num">${pending}</b></span>`;
}

/* ------------------------------------------------------- 10. Cart actions */
function addProduct(id, qty, opts) {
  const p = state.products.find((x) => x.id === id);
  if (!p) return;
  const o = opts || {};
  if (!(state.shift && state.shift.status === 'open')) {
    toast(T('افتح وردية الأول', 'Open a shift first'), 'bad');
    return;
  }
  if (p.stock <= 0) { toast(T('الصنف ده خلص من المخزون.', 'That item is out of stock.'), 'bad'); return; }
  if (p.blocked) { toast(T('الصنف ده ممنوع بيعه.', 'That item is blocked from sale.'), 'bad'); return; }

  const kind = p.weighted ? 'weight' : 'unit';
  const q = p.weighted ? snapQty(id, qty || 250) : (qty || 1);
  const existing = state.cart.lines.find((l) => l.productId === id && l.qtyKind === kind && !l.priceOverride);
  if (existing) {
    existing.qty += q;
    state.selected = existing.id;
  } else {
    const line = {
      id: 'l-' + (++state.seq), productId: id,
      ar: p.ar, en: p.en, unitPrice: o.price || p.price,
      qty: q, qtyKind: kind, discount: 0, note: '', priceOverride: !!o.price
    };
    state.cart.lines.push(line);
    state.selected = line.id;
  }
  const line = state.cart.lines.find((l) => l.productId === id && l.qtyKind === kind);
  const amt = line ? lineAmount(line) : 0;
  buzz(12);
  renderCart(); renderGrid(); renderDock();
  flashTile(id);
  announce(`${T('أضيف', 'Added')} ${p[LANG]}${line ? ', ' + T('الإجمالي', 'total') + ' ' + money(cartTotals().total) : ''}`);
  if (o.silent !== true) toast(`${p[LANG]} · ${money(amt)} ${cur()}`, 'ok', 1200);
}

function flashTile(id) {
  const tile = document.querySelector(`.tile[data-id="${id}"]`);
  if (!tile) return;
  tile.animate([{ transform: 'scale(1)' }, { transform: 'scale(.96)' }, { transform: 'scale(1)' }],
    { duration: 180, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

function changeQty(lineId, d) {
  const line = state.cart.lines.find((l) => l.id === lineId);
  if (!line) return;
  const step = line.qtyKind === 'weight' ? incOf(line.productId) : 1;
  const next = line.qty + d * step;
  if (next <= 0) { removeLine(lineId); return; }
  line.qty = next;
  renderCart(); renderGrid(); renderDock();
}

function removeLine(lineId, silent) {
  const idx = state.cart.lines.findIndex((l) => l.id === lineId);
  if (idx < 0) return;
  if (!hasPerm('pos.cart.line_delete')) {
    requestManager('pos.cart.line_delete', T('حذف سطر من الفاتورة', 'Delete a cart line')).then((ok) => {
      if (ok) { state.cart.lines.splice(idx, 1); renderCart(); renderGrid(); renderDock(); }
    });
    return;
  }
  const [removed] = state.cart.lines.splice(idx, 1);
  renderCart(); renderGrid(); renderDock();
  if (silent) return;
  toast(T('اتحذف من الفاتورة', 'Removed from the invoice'), 'ok', 5000, {
    label: T('تراجع', 'Undo'),
    fn: () => { state.cart.lines.splice(idx, 0, removed); renderCart(); renderGrid(); renderDock(); }
  });
}

function setCustomer(id) {
  state.cart.customerId = id || null;
  renderCart();
  const c = state.customers.find((x) => x.id === id);
  if (c) toast(`${T('العميل', 'Customer')}: ${c[LANG]}`, 'ok', 1800);
}

function hasPerm(key) {
  const role = ROLES[(state.shift && state.shift.cashierRole) || 'cashier'];
  return role.keys.includes(key);
}

/* ----------------------------------------------------------- 11. Toasts */
function toast(msg, kind, ms, action) {
  const host = el('toasts');
  const node = document.createElement('div');
  node.className = 'toast' + (kind ? ' is-' + kind : '');
  node.innerHTML = `<span class="t-ico" aria-hidden="true">${kind === 'ok' ? ico('check', 16) : kind === 'bad' ? ico('alert', 16) : ico('info', 16)}</span>
    <span>${esc(msg)}</span>`;
  if (action) {
    const b = document.createElement('button');
    b.className = 't-act';
    b.textContent = action.label;
    b.onclick = () => { action.fn(); node.remove(); };
    node.appendChild(b);
  }
  host.appendChild(node);
  const life = ms || (kind === 'bad' ? 4200 : 2400);
  setTimeout(() => { node.style.opacity = '0'; node.style.transition = 'opacity 160ms linear'; setTimeout(() => node.remove(), 200); }, life);
}

function announce(text) {
  const live = el('cartLive');
  if (live) live.textContent = text;
}

function buzz(ms) {
  if (state.muted) return;
  if (!state.touched) return;              // no vibration before the first user gesture
  if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} }
}

/* ------------------------------------------------------ 12. Sheet system */
const SHEETS = {};   // registered by part 3

function openSheet(name, opts) {
  if (name === 'held' && !CFG.demo && window.UnoLive && window.UnoLive.loadHolds) window.UnoLive.loadHolds().then(() => { if (state.ui.sheet === 'held') refreshSheet(); });
  state.ui.sheet = name;
  state.ui.sheetOpts = opts || {};
  mountSheet();
  el('scrim').classList.add('is-open');
  const host = el('sheetHost');
  const first = host.querySelector('input:not([type=hidden]), button');
  if (first) setTimeout(() => first.focus({ preventScroll: true }), 60);
}

function closeSheet() {
  state.ui.sheet = null;
  state.ui.sheetOpts = null;
  el('scrim').classList.remove('is-open');
  el('sheetHost').innerHTML = '';
}

function mountSheet() {
  const name = state.ui.sheet;
  if (!name) return;
  const def = SHEETS[name];
  if (!def) return;
  const view = def(state.ui.sheetOpts || {});
  if (!view) { closeSheet(); return; }
  el('sheetHost').innerHTML = `<section class="sheet${view.center ? ' is-center' : ''}${view.width ? '' : ''}" role="dialog" aria-modal="true"
      aria-labelledby="sheetTitle" ${view.width ? `style="width:min(${view.width}px,100vw)"` : ''}>
    <header class="sheet-head">
      <div><h2 id="sheetTitle">${view.title}</h2>${view.sub ? `<p class="sub">${view.sub}</p>` : ''}</div>
      <button class="x" data-act="close-sheet" aria-label="${T('إغلاق', 'Close')}">${ico('close', 18)}</button>
    </header>
    <div class="sheet-body" id="sheetBody">${view.body}</div>
    ${view.foot ? `<footer class="sheet-foot">${view.foot}</footer>` : ''}
  </section>`;
  requestAnimationFrame(() => {
    const s = el('sheetHost').querySelector('.sheet');
    if (s) s.classList.add('is-open');
  });
  if (view.onMount) view.onMount(el('sheetHost'));
}

/* Re-render an open sheet without losing the scrim state */
function refreshSheet() { if (state.ui.sheet) mountSheet(); }

/* -------------------------------------------------- 13. Manager PIN gate */
function requestManager(permKey, reasonText) {
  return new Promise((resolve) => {
    state.ui.gate = { permKey, reasonText, pin: '', tries: 0, lockedUntil: 0, resolve };
    openSheet('gate');
  });
}

/* --------------------------------------------------- 14. Keyboard + wedge */
const wedge = { buf: [], last: 0, lastCode: '', lastAt: 0 };

function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    const inField = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;

    /* an open sheet owns the keyboard: only Esc and its own Enter apply */
    if (state.ui.sheet) {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (state.ui.sheet === 'gate') gateCancel(); else closeSheet();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (state.ui.sheet === 'pay') commitSale(false);
        else if (state.ui.sheet === 'gate') gateCheck();
      }
      return;
    }
    const searchFocused = e.target === el('searchInput');

    /* global function keys work even in fields, except inside the PIN pad */
    const map = {
      F1: () => openSheet('help'),
      F2: () => openPayment(),
      F3: () => openSheet('held'),
      F4: () => openSheet('customer'),
      F5: () => openDiscount(),
      F6: () => openSheet('scan'),
      F7: () => openSheet('weight'),
      F8: () => openSheet('returns'),
      F9: () => drawerOpenNoSale(),
      F10: () => reprintLast()
    };
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') { e.preventDefault(); reprintLast(); return; }
    if (map[e.key]) { e.preventDefault(); map[e.key](); return; }

    if (e.key === 'Escape') {
      if (state.ui.sheet) { e.preventDefault(); closeSheet(); return; }
      if (state.cart.lines.length && state.selected) { state.selected = null; renderCart(); }
      return;
    }
    if (e.key === '/' && !inField) { e.preventDefault(); el('searchInput').focus(); return; }
    if (e.key === 'Enter') {
      if (state.ui.sheet) return;                 // sheets handle their own Enter
      if (inField && !searchFocused) return;
      const seq = wedge.buf.join('');
      if (seq.length >= 6) { e.preventDefault(); handleScan(seq); wedge.buf = []; return; }
      const first = visibleProducts()[0];
      if (first && !state.query && !searchFocused) { addProduct(first.id); }
      return;
    }

    /* barcode wedge: fast keystrokes, never steal focus from a text field */
    if (e.key.length === 1) {
      const now = performance.now();
      if (now - wedge.last > 35) wedge.buf = [];
      wedge.buf.push(e.key);
      wedge.last = now;
      if (wedge.buf.length > 64) wedge.buf = [];
      if (inField) return;                        // still buffered, but the field keeps its text
    }
    if (e.key === 'Delete' && !inField && state.selected) { e.preventDefault(); removeLine(state.selected); }
    if ((e.key === '+' || e.key === '=') && !inField && state.selected) { e.preventDefault(); changeQty(state.selected, 1); }
    if (e.key === '-' && !inField && state.selected) { e.preventDefault(); changeQty(state.selected, -1); }
  });
}

function handleScan(code) {
  const now = performance.now();
  if (code === wedge.lastCode && now - wedge.lastAt < 1500) { buzz(8); return; }
  wedge.lastCode = code; wedge.lastAt = now;

  /* weighted barcode: prefix 21/22 + 5 digits of grams + item code */
  let weight = null, itemCode = code;
  const pre = code.slice(0, 2);
  if (CFG.weightPrefixes.includes(pre) && code.length >= 12) {
    weight = parseInt(code.slice(2, 2 + CFG.weightDigits), 10);
    itemCode = code;
  }
  const prod = state.products.find((p) => p.barcode === code)
    || state.products.find((p) => p.barcode === itemCode)
    || state.products.find((p) => p.barcode.slice(-6) === code.slice(-6));
  state.ui.scanLog.unshift({ code, at: Date.now(), found: !!prod, name: prod ? prod[LANG] : null });
  state.ui.scanLog = state.ui.scanLog.slice(0, 4);

  if (prod) {
    state.ui.scanMiss = null;
    if (weight && prod.weighted) addProduct(prod.id, weight, { silent: true });
    else addProduct(prod.id);
    buzz(10);
    if (state.ui.sheet === 'scan') refreshSheet();
  } else {
    buzz([18, 40, 18]);
    state.ui.scanMiss = code;
    if (state.ui.sheet !== 'scan') openSheet('scan');
    else refreshSheet();
  }
}

/* ------------------------------------------------------------- 15. Clock */
function startClock() {
  setInterval(() => {
    const c = el('clock'); if (c) c.textContent = fmtTime(Date.now());
    const sp = el('shiftPill');
    if (sp && state.shift && state.shift.status === 'open') {
      const h = (Date.now() - state.shift.openedAt) / 3600000;
      const long = h > CFG.shiftMaxHours;
      sp.classList.toggle('is-bad', long);
      sp.title = long ? T('الوردية مفتوحة أكتر من 12 ساعة', 'Shift open longer than 12 hours') : '';
    }
  }, 10000);
}

/* ------------------------------------------------- 16. Online / outbox demo */
function toggleOnline() {
  state.online = !state.online;
  renderTopbar();
  if (!state.online) {
    toast(T('شغال أوفلاين: البيع مستمر والفاتورة تتحفظ على الجهاز.', 'Offline: selling continues and invoices are saved on the device.'), 'bad', 4000);
  } else {
    flushOutbox();
  }
}

function queueInvoice(inv) {
  state.outbox.unshift({ id: inv.id, number: inv.number, status: state.online ? 'sent' : 'pending', at: Date.now() });
  renderOutboxPill();
  if (state.online) {
    state.syncing = true; renderTopbar();
    setTimeout(() => { state.syncing = false; renderTopbar(); renderOutboxPill(); }, 700);
  }
}

function flushOutbox() {
  const pending = state.outbox.filter((o) => o.status === 'pending');
  if (!pending.length) { renderOutboxPill(); return; }
  state.syncing = true; renderTopbar();
  let i = 0;
  const step = () => {
    if (i >= pending.length) { state.syncing = false; renderTopbar(); renderOutboxPill(); toast(T('رجع الاتصال · كل الفواتير اتبعتت', 'Back online · all invoices sent'), 'ok'); return; }
    pending[i].status = 'sent'; i++;
    renderOutboxPill();
    setTimeout(step, 220);
  };
  setTimeout(step, 260);
}

/* ---------------------------------------------------- 17. Demo data seeding */
function seedDemo() {
  const now = Date.now();
  state.shift = {
    id: 'sh-1041', openedAt: now - 3 * 3600 * 1000 - 42 * 60000,
    openingFloat: 50000, cashierId: 'u-cashier', cashierRole: 'cashier',
    status: 'open', counted: null, expected: null, variance: null, closedAt: null
  };
  const mkLine = (pid, qty, kind) => {
    const p = state.products.find((x) => x.id === pid);
    const k = kind || (p.weighted ? 'weight' : 'unit');
    return {
      product_id: p.id, name_ar: p.ar, name_en: p.en, mono: p.mono,
      qty, qty_kind: k, unit_price: p.price, unit_ar: p.unitAr, unit_en: p.unitEn,
      discount: 0, amount: k === 'weight' ? round(p.price * qty / 1000) : p.price * qty
    };
  };
  const lines = [mkLine('p01', 2), mkLine('p02', 250), mkLine('p03', 1), mkLine('p04', 1), mkLine('p05', 3)];
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const invDisc = 703;
  const total = subtotal - invDisc;
  const inv = {
    id: 'inv-1039', number: 'FAR-1039', created_at: now - 52 * 60000,
    shift_id: 'sh-1041', device_id: CFG.deviceId, cashier_id: 'u-cashier',
    customer_id: 'c1', customer_name: 'أحمد محمود',
    lines, subtotal, invoice_discount: invDisc, total,
    tax: round(total - total / (1 + CFG.taxRate)),
    payments: [{ method: 'cash', amount: total }],
    tendered_total: 20000, paid_total: total, change_due: 20000 - total, credit_amount: 0,
    note: null, status: 'paid', idempotency_key: 'seed-1039', returned_total: 0
  };
  state.invoices = [inv];
  state.counters.invoice = 1042;
  state.outbox = [
    { id: 'inv-1040', number: 'FAR-1040', status: state.online ? 'sent' : 'pending', at: now - 3 * 60000 },
    { id: 'inv-1041', number: 'FAR-1041', status: state.online ? 'sent' : 'pending', at: now - 2 * 60000 }
  ];
  state.cashMoves = [
    { id: 'cm-1', shift_id: 'sh-1041', type: 'pay_in', amount: 20000, reason: 'عهدة إضافية', voucher_no: 'CM-0001', user_id: 'u-cashier', created_at: now - 90 * 60000 },
    { id: 'cm-2', shift_id: 'sh-1041', type: 'expense', amount: 3500, reason: 'أكياس تغليف', voucher_no: 'CM-0002', user_id: 'u-cashier', created_at: now - 40 * 60000 }
  ];
  state.counters.move = 3;
  state.returns = [];
  state.held = [];
}
/* ==========================================================================
   pos.js — part 3/4: payment, sale commit, receipt, customer display
   ========================================================================== */

/* -------------------------------------------------------- 18. Payment sheet */
function openPayment() {
  if (!(state.shift && state.shift.status === 'open')) {
    toast(T('افتح وردية الأول قبل البيع.', 'Open a shift before selling.'), 'bad');
    return;
  }
  if (!state.cart.lines.length) { toast(T('الفاتورة فاضية.', 'The invoice is empty.'), 'bad'); return; }
  state.ui.payMethod = 'cash';
  state.ui.payRows = [];
  state.ui.paidInput = '';
  state.ui.payError = null;
  state.ui.printReceipt = true;
  state.ui.sendWhatsapp = false;
  openSheet('pay');
}

function tenderValue() {
  const raw = state.ui.paidInput || '';
  if (!raw) return 0;
  const n = parseFloat(raw);
  return isFinite(n) ? Math.round(n * 100) : 0;
}

function payState() {
  const t = cartTotals();
  const rows = state.ui.payRows;
  const rowsTotal = rows.reduce((s, r) => s + r.amount, 0);
  const tender = tenderValue();
  const creditRows = rows.filter((r) => r.method === 'credit').reduce((s, r) => s + r.amount, 0);
  const currentIsCredit = state.ui.payMethod === 'credit';
  const paidNonCredit = rowsTotal - creditRows + (currentIsCredit ? 0 : tender);
  const paid = rowsTotal + tender;
  const remaining = Math.max(0, t.total - paid);
  const change = Math.max(0, paidNonCredit - (t.total - creditRows - (currentIsCredit ? tender : 0)));
  return { t, rows, rowsTotal, tender, paid, remaining, change, creditRows, paidNonCredit };
}

function methodName(m) {
  return { cash: T('نقدي', 'Cash'), card: T('بطاقة', 'Card'), wallet: T('محفظة', 'Wallet'), credit: T('آجل', 'Credit') }[m] || m;
}
function methodIco(m) {
  return ico({ cash: 'cash', card: 'card', wallet: 'wallet', credit: 'credit' }[m] || 'cash', 18);
}

SHEETS.pay = function () {
  const s = payState();
  const t = s.t;
  const cust = state.customers.find((x) => x.id === state.cart.customerId);
  const free = cust ? Math.max(0, cust.credit_limit - cust.balance) : 0;
  const canCredit = !!cust && free > 0 && hasPerm('pos.sale.credit');
  const short = s.remaining > 0;
  const creditNow = short && canCredit;
  const confirmLabel = creditNow
    ? `${T('آجل الباقي', 'Credit the rest')} ${money(s.remaining)}`
    : `${T('تأكيد ودفع', 'Confirm & pay')}`;

  const NOTES = [500, 1000, 2000, 5000, 10000, 20000];
  const roundUp = Math.ceil(t.total / 500) * 500;
  const body = `
    <div class="pay-grid">
      <div class="pay-col">
        <div>
          <div class="due-label">${T('المطلوب', 'Amount due')}</div>
          <div class="due-amount">${money(t.total)}<span class="cur">${cur()}</span></div>
          <div class="hint">${t.lines} ${T('أصناف', 'items')} · ${T('فاتورة', 'Invoice')} ${esc(state.cart.id || nextInvoiceNo())}${cust ? ' · ' + esc(cust[LANG]) : ''}</div>
        </div>
        <div class="methods" role="group" aria-label="${T('طريقة الدفع', 'Payment method')}">
          ${['cash', 'card', 'wallet', 'credit'].map((m) => {
            let reason = '';
            if (!state.online && m !== 'cash') reason = T('أوفلاين', 'Offline');
            else if (m === 'credit' && !cust) reason = T('اختر عميل', 'Pick a customer');
            else if (m === 'credit' && free <= 0) reason = T('وصل للحد', 'At limit');
            const off = !!reason;
            return `
            <button class="method${state.ui.payMethod === m ? ' is-on' : ''}${off ? ' is-off' : ''}" data-act="method" data-m="${m}"
              ${off ? 'disabled aria-disabled="true"' : ''} aria-pressed="${state.ui.payMethod === m}">
              <span class="m-ico" aria-hidden="true">${methodIco(m)}</span><span>${methodName(m)}</span>
              ${off ? `<span class="m-off">${reason}</span>` : ''}
            </button>`;
          }).join('')}
        </div>
        ${!state.online ? `<div class="hint">${T('الكاش شغال أوفلاين. البطاقة والمحفظة والآجل محتاجين اتصال.', 'Cash works offline. Card, wallet and credit need a connection.')}</div>` : ''}
        <div class="numpad" role="group" aria-label="${T('لوحة أرقام', 'Number pad')}">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-act="pad" data-k="${n}">${n}</button>`).join('')}
          <button data-act="pad" data-k="00">00</button>
          <button data-act="pad" data-k="0">0</button>
          <button data-act="pad" data-k="del" aria-label="${T('مسح', 'Backspace')}">${ico('backspace', 18)}</button>
        </div>
      </div>
      <div class="pay-col">
        <div class="paid-box">
          <span class="lbl">${T('المدفوع', 'Tendered')}</span>
          <span class="val">${money(s.tender)}</span>
        </div>
        <div class="quick">
          <button class="is-exact" data-act="quick" data-amt="${t.total}">${T('المبلغ بالظبط', 'Exact amount')} · ${money(t.total)}</button>
          ${s.rows.length && s.remaining > 0 ? `<button data-act="quick" data-amt="${s.remaining}">${T('المتبقي', 'Remaining')} · ${money(s.remaining)}</button>` : ''}
          ${roundUp > t.total ? `<button data-act="quick" data-amt="${roundUp}">${T('تقريب', 'Round up')} · ${money(roundUp)}</button>` : ''}
          ${NOTES.filter((v) => v !== roundUp).map((v) => `<button data-act="quick" data-amt="${v}">${money(v)}</button>`).join('')}
        </div>
        <div class="change-box${short ? ' is-short' : ''}">
          <span class="lbl">${short ? T('المتبقي', 'Remaining') : T('الباقي للعميل', 'Change due')}</span>
          <span class="val">${money(short ? s.remaining : s.change)}</span>
        </div>
        ${s.rows.length ? `<div class="splits">
          ${s.rows.map((r, i) => `<div class="split-row">
            <span class="s-m">${methodIco(r.method)} ${methodName(r.method)}</span>
            <span class="s-v">${money(r.amount)}</span>
            <button data-act="split-del" data-i="${i}" aria-label="${T('حذف', 'Remove')}">${ico('close', 16)}</button>
          </div>`).join('')}
        </div>` : ''}
        <button class="btn is-sm" data-act="split-add" style="border-style:dashed">
          ${ico('plus', 16)} ${T('تقسيم الدفع على أكثر من طريقة', 'Split across more than one method')}
        </button>
        <div class="row" style="justify-content:space-between">
          <label class="switch">
            <input type="checkbox" id="printToggle" ${state.ui.printReceipt ? 'checked' : ''} data-act="toggle-print">
            <span class="track"></span><span>${T('طباعة الفاتورة', 'Print receipt')}</span>
          </label>
          <label class="switch">
            <input type="checkbox" id="waToggle" ${state.ui.sendWhatsapp ? 'checked' : ''} data-act="toggle-wa">
            <span class="track"></span><span>${T('واتساب', 'WhatsApp')}</span>
          </label>
        </div>
        ${state.ui.payError ? `<div class="err"><span>${ico('alert', 16)}</span><span>${esc(state.ui.payError)}</span></div>` : ''}
        ${short && !canCredit ? `<div class="hint">${!cust
          ? T('للبيع الآجل اختار عميل الأول (F4).', 'Pick a customer first for credit (F4).')
          : free <= 0 ? T('العميل وصل لحد الائتمان.', 'Customer is at the credit limit.')
          : T('البيع الآجل يحتاج صلاحية مدير — اطلب رمز المدير من بوابة الدفع.', 'Credit sales need a manager permission — ask for the manager PIN.')}</div>` : ''}
      </div>
    </div>`;
  return {
    title: T('الدفع', 'Payment'),
    sub: `${T('فاتورة', 'Invoice')} ${esc(state.cart.id || nextInvoiceNo())} · ${t.lines} ${T('أصناف', 'items')} · ${T('كاشير', 'Cashier')} ${ROLES[state.shift.cashierRole || 'cashier'][LANG]}`,
    body,
    center: true, width: 800,
    foot: `<button class="btn is-ghost" data-act="close-sheet">${T('إلغاء', 'Cancel')} <kbd>Esc</kbd></button>
      <div class="grow"></div>
      <button class="btn is-primary is-lg" data-act="pay-confirm" id="confirmPay" ${short && !canCredit ? 'disabled' : ''}>
        ${confirmLabel} <kbd>Enter</kbd></button>`
  };
};

function padKey(k) {
  let v = state.ui.paidInput || '';
  if (k === 'del') v = v.slice(0, -1);
  else if (k === '00') v = v === '' ? '' : v + '00';
  else if (v.length < 9) v = v + k;
  state.ui.paidInput = v;
  refreshSheet();
}

function addSplit() {
  const s = payState();
  if (!state.online && state.ui.payMethod !== 'cash') {
    toast(T('الطريقة دي محتاجة اتصال. أوفلاين الكاش بس.', 'That method needs a connection. Only cash works offline.'), 'bad'); return;
  }
  if (!s.tender) { toast(T('اكتب المبلغ الأول.', 'Enter an amount first.'), 'bad'); return; }
  if (state.ui.payMethod === 'credit' && !state.cart.customerId) {
    toast(T('الآجل يلزمه عميل.', 'Credit needs a customer.'), 'bad'); return;
  }
  state.ui.payRows.push({ method: state.ui.payMethod, amount: s.tender });
  state.ui.paidInput = '';
  state.ui.payMethod = state.ui.payMethod === 'cash' ? 'card' : 'cash';
  refreshSheet();
}

async function commitSale(forceCredit) {
  const s = payState();
  const t = s.t;
  const payments = state.ui.payRows.slice();
  if (s.tender > 0) payments.push({ method: state.ui.payMethod, amount: s.tender });
  if (forceCredit && s.remaining > 0) payments.push({ method: 'credit', amount: s.remaining });
  if (!payments.length) { state.ui.payError = T('اكتب المبلغ المدفوع.', 'Enter the tendered amount.'); refreshSheet(); return; }
  if (!state.online && payments.some((p) => p.method !== 'cash')) {
    state.ui.payError = T('أوفلاين الكاش بس. شيل سطور البطاقة/المحفظة/الآجل أو رجّع الاتصال.', 'Offline sales are cash only. Remove the card/wallet/credit lines or go back online.');
    refreshSheet(); return;
  }

  const payload = {
    idempotency_key: `${CFG.deviceId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    number: nextInvoiceNo(),
    lines: state.cart.lines.map((l) => ({
      product_id: l.productId, qty: l.qty, qty_kind: l.qtyKind,
      price_override: l.priceOverride ? l.unitPrice : null,
      discount: l.discount || 0, note: l.note || null
    })),
    invoice_discount: state.cart.invoiceDiscount || 0,
    invoice_discount_kind: state.cart.invoiceDiscountKind,
    payments,
    customer_id: state.cart.customerId,
    note: state.cart.note || null
  };
  const btn = el('confirmPay');
  if (btn) { btn.disabled = true; btn.textContent = T('جارٍ الحفظ…', 'Saving…'); }
  try {
    const res = await RPC.call('pos_sale', payload);
    const inv = res.invoice;
    state.lastReceipt = inv;
    state.cart = emptyCart();
    tabAfterSale();
    state.selected = null;
    closeSheet();
    renderAll();
    showSuccess(inv);
    queueInvoice(inv);
    save();
    postDisplay();
  } catch (e) {
    state.ui.payError = LANG === 'ar' ? (e.ar || e.message) : (e.en || e.message);
    refreshSheet();
    toast(state.ui.payError, 'bad');
  }
}

function showSuccess(inv) {
  const overlay = el('success');
  overlay.innerHTML = `<div class="success-card">
    <div class="ok-ring" aria-hidden="true">${ico('check', 32)}</div>
    <div class="s-amount">${money(inv.total)} <i>${cur()}</i></div>
    <div class="s-sub">${T('تم الدفع', 'Paid')}${inv.change_due ? ' · ' + T('الباقي', 'Change') + ' ' + money(inv.change_due) : ''}</div>
  </div>`;
  overlay.classList.add('is-open');
  setTimeout(() => {
    overlay.classList.remove('is-open');
    if (state.ui.printReceipt) {
      state.lastReceipt = inv;
      openSheet('receipt');
    }
  }, 1200);
}

/* --------------------------------------------------------- 19. Receipt view */
SHEETS.receipt = function (opts) {
  const inv = opts.invoice || state.lastReceipt || state.invoices[0];
  if (!inv) return null;
  return {
    title: T('الإيصال', 'Receipt'),
    sub: `${T('فاتورة', 'Invoice')} ${esc(inv.number)} · ${fmtDateTime(inv.created_at)}`,
    body: `<div id="printArea" class="print-area">${receiptHtml(inv)}</div>
      <div class="rc-picker" role="radiogroup" aria-label="${T('شكل الإيصال', 'Receipt layout')}">${window.UnoReceipt.TEMPLATES.map((x) => `<button class="reason${rcTpl() === x.id ? ' is-on' : ''}" data-act="rc-tpl" data-id="${x.id}" title="${esc(x[LANG === 'ar' ? 'ar2' : 'en2'])}">${esc(x[LANG])}</button>`).join('')}</div>
      <div class="rc-preview${rcTpl() === 'a4' ? ' is-a4' : ''}"><div class="rc-inner">${receiptHtml(inv)}</div></div>
      <div class="hint" style="text-align:center">${T('الشكل ده بيتحفظ كافتراضي على الجهاز ده · نفس أرقام الشاشة بالحرف', 'This layout is saved as the default on this device · same figures as the screen')}</div>`,
    center: true, width: rcTpl() === 'a4' ? 640 : 560,
    foot: `<button class="btn is-ghost" data-act="close-sheet">${T('إغلاق', 'Close')}</button>
      <div class="grow"></div>
      <button class="btn" data-act="print-receipt">${ico('printer', 16)} ${T('طباعة', 'Print')}</button>
      <button class="btn is-ok" data-act="wa-receipt">${ico('message', 16)} ${T('واتساب', 'WhatsApp')}</button>
      <button class="btn is-primary" data-act="new-sale">${T('فاتورة جديدة', 'New sale')}</button>`
  };
};

/* Receipt templates: UnoReceipt (receipt-templates.js). The chosen template is a per-device default. */
function rcTpl() { try { const t = localStorage.getItem('uno_rc_tpl'); if (t && window.UnoReceipt.TEMPLATES.some((x) => x.id === t)) return t; } catch (e) {} return 'th80'; }
function rcEnsureCss() { if (!document.getElementById('rcCss')) { const st = document.createElement('style'); st.id = 'rcCss'; st.textContent = window.UnoReceipt.CSS; document.head.appendChild(st); } }
function rcPage(tpl) {
  let st = document.getElementById('rcPage');
  if (!st) { st = document.createElement('style'); st.id = 'rcPage'; document.head.appendChild(st); }
  const t = window.UnoReceipt.TEMPLATES.find((x) => x.id === tpl) || {};
  st.textContent = '@media print{@page{size:' + (t.w === '210mm' ? 'A4' : (t.w || '80mm') + ' auto') + ';margin:' + (t.w === '210mm' ? '0' : '0') + '}}';
}
/* receipt/invoice settings from the admin panel (doc_settings_get). Offline or before load: confirmed default phone, tax line falls back to the phone. */
function rcDoc() {
  const d = (window.UnoLive && window.UnoLive.state && window.UnoLive.state.doc) || null, co = (d && d.company) || {};
  const tax = String(co.tax_id || '').trim(), realTax = !co.is_placeholder && /[1-9]/.test(tax) ? tax : '';
  return { cfg: d ? d.cfg : { text: { phone: '01505946321' }, tax_fallback_phone: true }, tax: realTax, phone: co.phone || '' };
}
function receiptHtml(inv, tplOverride) {
  rcEnsureCss();
  const cust = inv.customer_id ? state.customers.find((c) => c.id === inv.customer_id) : null;
  return window.UnoReceipt.render(inv, {
    tpl: tplOverride || rcTpl(), lang: LANG,
    cfg: rcDoc().cfg,
    co: { nameAr: CFG.company.nameAr, nameEn: CFG.company.nameEn, taxNo: rcDoc().tax, phone: rcDoc().phone, addrAr: 'فرشوط · قنا', addrEn: 'Farshout · Qena' },
    money, nf, method: methodName, dt: fmtDateTime(inv.created_at),
    session: (state.shift && state.shift.label && inv.shift_id === state.shift.id) ? state.shift.label : '',
    cashier: ROLES[(state.shift && state.shift.cashierRole) || 'cashier'][LANG], customer: cust ? cust[LANG] : (inv.customer_name || ''),
    unitLabel: (l) => uLab(l.product_id)
  });
}

function printReceipt() {
  const inv = state.lastReceipt;
  if (!inv) return;
  const area = el('printArea');
  if (area) {
    area.innerHTML = receiptHtml(inv);
    rcPage(rcTpl());
    try { window.print(); } catch (e) { toast(T('الطباعة مش متاحة دلوقتي. الفاتورة اتحفظت.', 'Printing is unavailable. The invoice is saved.'), 'bad'); }
  } else {
    const w = window.open('', '_blank', 'width=380,height=700');
    if (!w) { toast(T('المتصفح منع نافذة الطباعة. اسمح بالنوافذ المنبثقة أو اضغط إعادة الطباعة. الفاتورة اتحفظت.', 'The browser blocked the print window. Allow pop-ups or reprint. The invoice is saved.'), 'bad'); return; }
    w.document.write(`<html><head><title>${inv.number}</title><style>
      body{margin:0;font-family:sans-serif}
      .receipt-wrap{width:80mm;padding:4mm;font-size:11px;color:#000;background:#fff}
      table{width:100%;border-collapse:collapse} td.r{text-align:end}
      .r-sep{border-top:1px dashed #999;margin:6px 0}
      .qr{width:64px;height:64px;margin:6px auto;background:repeating-conic-gradient(#000 0 25%,#fff 0 50%) 0 0/8px 8px}
      .r-center{text-align:center}
    </style></head><body>${receiptHtml(inv)}</body></html>`);
    w.document.close();
    try { w.focus(); w.print(); } catch (e) { toast(T('الطباعة مش متاحة دلوقتي. الفاتورة اتحفظت.', 'Printing is unavailable. The invoice is saved.'), 'bad'); }
  }
}

function reprintLast() {
  if (!state.lastReceipt && !state.invoices.length) { toast(T('مفيش فاتورة لإعادة طبعها.', 'No receipt to reprint.'), 'bad'); return; }
  state.lastReceipt = state.lastReceipt || state.invoices[0];
  openSheet('receipt');
  toast(T('إعادة طباعة مسجّلة في سجل التدقيق.', 'Reprint is written to the audit log.'), 'ok', 2200);
}

/* ------------------------------------------------- 20. Customer display sync */
let displayChannel = null;
function initDisplayChannel() {
  if ('BroadcastChannel' in window) {
    displayChannel = new BroadcastChannel('uno-pos-display');
    displayChannel.onmessage = (ev) => {
      if (ev.data && ev.data.type === 'cart' && state.view === 'display') renderDisplay(ev.data.payload);
    };
  }
  window.addEventListener('storage', (e) => {
    if (e.key === 'uno-pos-display' && state.view === 'display') {
      try { renderDisplay(JSON.parse(e.newValue).payload); } catch (err) {}
    }
  });
}

function postDisplay() {
  const t = cartTotals();
  const payload = {
    invoiceNo: state.cart.id || nextInvoiceNo(),
    lines: state.cart.lines.map((l) => ({
      name: l[LANG], qty: l.qtyKind === 'weight' ? nf(l.qty / 1000, 3) + ' ' + uLab(l.productId) : '× ' + l.qty,
      amount: money(lineAmount(l))
    })),
    total: money(t.total), tax: money(t.tax), discount: money(t.discountTotal),
    idle: !state.cart.lines.length
  };
  try { localStorage.setItem('uno-pos-display', JSON.stringify({ payload })); } catch (e) {}
  if (displayChannel) displayChannel.postMessage({ type: 'cart', payload });
}

function renderDisplay(payload) {
  const root = el('displayRoot');
  if (!root) return;
  const p = payload || { idle: true, lines: [], total: '0.00' };
  root.innerHTML = `
    <div class="display-head">
      <div class="brand-mark">U</div>
      <div>
        <div class="brand-name">${esc(CFG.company[LANG === 'ar' ? 'nameAr' : 'nameEn'])}</div>
        <div class="hint">${esc(CFG.branch[LANG === 'ar' ? 'nameAr' : 'nameEn'])} · ${T('فاتورة', 'Invoice')} <span class="num">${esc(p.invoiceNo || '—')}</span></div>
      </div>
    </div>
    ${p.idle ? `<div class="d-idle">
        <div class="d-idle-ico">${ico('cart', 32)}</div>
        <div style="font-size:22px;color:var(--uno-text)">${T('أهلاً بكم في أونو تكنولوجي', 'Welcome to Uno Technology')}</div>
        <div class="hint">${T('امسح صنفك الأول ونحن نحسب معاك.', 'Scan your first item, we will add it up.')}</div>
      </div>`
      : `<div class="display-lines">${p.lines.map((l) => `
          <div class="d-line"><span>${esc(l.name)} <span class="d-qty num">${esc(l.qty)}</span></span><span class="num">${l.amount}</span></div>`).join('')}
        </div>`}
    <div class="d-total">
      <span class="lbl">${T('الإجمالي', 'Total')}</span>
      <span class="val">${p.total}<span class="cur" style="font-size:.4em"> ${cur()}</span></span>
    </div>
    <div class="d-thanks">${T('شكراً لزيارتكم · الأسعار تشمل ض.ق.م', 'Thank you · prices include VAT')}</div>`;
}
/* ==========================================================================
   pos.js — part 4/5: returns, shift close + blind count, drawer movements
   ========================================================================== */

/* -------------------------------------------------------------- 21. Returns */
const RETURN_REASONS = [
  { id: 'defect', ar: 'عيب صنف', en: 'Defective item' },
  { id: 'wrong', ar: 'خطأ صنف', en: 'Wrong item' },
  { id: 'mind', ar: 'تغيير رأي', en: 'Changed mind' },
  { id: 'expired', ar: 'انتهاء صلاحية', en: 'Expired' },
  { id: 'price', ar: 'خطأ سعر', en: 'Price error' }
];
const REFUND_METHODS = [
  { id: 'cash', ar: 'نقدي', en: 'Cash' },
  { id: 'original', ar: 'نفس وسيلة الدفع', en: 'Original method' },
  { id: 'credit', ar: 'رصيد للعميل', en: 'Store credit' }
];

let retTimer = null;
function retLookup(q) {
  clearTimeout(retTimer);
  retTimer = setTimeout(async () => {
    try { await window.UnoLive.findInvoices(q); } catch (e) { toast(e.ar || e.message, 'bad'); }
    if (state.ui.ret && !state.ui.ret.invoiceId) { const f = document.getElementById('retSearch'); const pos = f ? f.selectionStart : 0; refreshSheet(); const g = document.getElementById('retSearch'); if (g) { g.focus(); try { g.setSelectionRange(pos, pos); } catch (e) {} } }
  }, 350);
}

function openReturns() {
  state.ui.ret = { invoiceId: null, lines: {}, reason: null, method: 'cash', restock: true, error: null, query: '' };
  openSheet('returns');
  retLookup('');
}

function returnedQtyFor(invoiceId, productId) {
  return state.returns.filter((r) => r.invoice_id === invoiceId)
    .flatMap((r) => r.lines).filter((l) => l.product_id === productId)
    .reduce((s, l) => s + l.qty, 0);
}

SHEETS.returns = function () {
  const r = state.ui.ret || {};
  if (!r.invoiceId) {
    const q = (r.query || '').toLowerCase();
    const list = state.invoices.filter((i) => i.status !== 'voided')
      .filter((i) => !q || i.number.toLowerCase().includes(q) || (i.customer_name || '').toLowerCase().includes(q));
    const body = `
      <div class="field">
        <label for="retSearch">${T('رقم الفاتورة أو باركود الإيصال', 'Invoice number or receipt barcode')}</label>
        <input class="input" id="retSearch" data-act="ret-search" value="${esc(r.query || '')}"
          placeholder="${T('مثال: FAR-1039', 'e.g. FAR-1039')}" autocomplete="off">
      </div>
      <div class="hint">${T('الاسترجاع مسموح خلال 14 يوم بالإيصال، ولا يُعدَّل الأصل أبدًا.', 'Returns are allowed within 14 days with the receipt; the original invoice is never edited.')}</div>
      ${!state.online ? `<div class="err"><span>${ico('alert', 16)}</span><span>${T('أوفلاين: المرتجع محتاج اتصال. البيع بالكاش شغال عادي.', 'Offline: returns need a connection. Cash sales keep working.')}</span></div>` : ''}
      <div class="ret-lines">
        ${list.length ? list.map((i) => {
          const age = Math.floor((Date.now() - i.created_at) / 86400000);
          const ok = age <= CFG.returnWindowDays;
          return `<button class="ret-line" data-act="ret-pick" data-id="${i.id}" style="text-align:start">
            <span class="r-name">${esc(i.number)} · ${esc(i.customer_name || T('عميل نقدي', 'Walk-in'))}</span>
            <span class="r-sub">${money(i.total)}</span>
            <span class="r-sub">${fmtShort(i.created_at)}</span>
            <span class="badge ${ok ? 'is-ok' : 'is-bad'}">${ok ? T('قابلة للاسترجاع', 'Returnable') : T('خارج المدة', 'Out of window')}</span>
          </button>`;
        }).join('') : `<div class="empty"><div class="e-ico">${ico('search', 32)}</div><p>${T('مفيش فاتورة بالرقم ده.', 'No invoice with that number.')}</p></div>`}
      </div>`;
    return {
      title: T('استرجاع', 'Returns'),
      sub: T('مستند مرتجع مستقل — مش تعديل على الفاتورة', 'A separate return document — never an edit of the invoice'),
      body,
      foot: `<button class="btn is-ghost" data-act="close-sheet">${T('إغلاق', 'Close')} <kbd>Esc</kbd></button>
        <div class="grow"></div><span class="hint">${T('المرتجعات النهاردة', 'Returns today')}: <b class="num">${state.returns.length}</b></span>`
    };
  }

  const inv = state.invoices.find((i) => i.id === r.invoiceId);
  if (!inv) { state.ui.ret.invoiceId = null; return SHEETS.returns(); }
  const lines = inv.lines.map((l) => {
    const already = returnedQtyFor(inv.id, l.product_id);
    const remaining = l.qty - already;
    const picked = r.lines[l.product_id] || 0;
    return { l, already, remaining, picked };
  });
  const refund = lines.reduce((s, x) => {
    const unit = x.l.unit_price - (x.l.discount && x.l.qty ? round(x.l.discount / x.l.qty) : 0);
    const amt = x.l.qty_kind === 'weight' ? round(unit * x.picked / 1000) : unit * x.picked;
    return s + amt;
  }, 0);
  const allPicked = lines.every((x) => x.remaining === 0 || x.picked >= x.remaining);

  const body = `
    <div class="card">
      <div class="spread">
        <div>
          <div style="font-size:14px;font-weight:700">${T('فاتورة', 'Invoice')} ${esc(inv.number)}</div>
          <div class="hint">${fmtDateTime(inv.created_at)} · ${esc(inv.customer_name || T('عميل نقدي', 'Walk-in'))}</div>
        </div>
        <div style="text-align:end">
          <div class="num" style="font-size:18px;font-weight:700">${money(inv.total)}</div>
          <div class="hint">${T('متبقي للإرجاع', 'Returnable')} ${money(inv.total - (inv.returned_total || 0))}</div>
        </div>
      </div>
    </div>

    <div class="ret-lines">
      ${lines.map((x) => `
        <div class="ret-line${x.picked ? ' is-on' : ''}">
          <span class="r-name">${esc(x.l[LANG === 'ar' ? 'name_ar' : 'name_en'])}</span>
          <span class="r-qty">
            <span class="stepper" style="height:34px">
              <button data-act="ret-qty" data-p="${x.l.product_id}" data-d="-1" aria-label="${T('تقليل', 'Less')}">−</button>
              <span class="q">${x.l.qty_kind === 'weight' ? nf(x.picked / 1000, 3) : x.picked}</span>
              <button data-act="ret-qty" data-p="${x.l.product_id}" data-d="1" aria-label="${T('زيادة', 'More')}">+</button>
            </span>
          </span>
          <span class="r-sub">${T('مباع', 'Sold')} ${x.l.qty_kind === 'weight' ? nf(x.l.qty / 1000, 3) + ' ' + uLab(x.l.product_id) : x.l.qty}${x.already ? ' · ' + T('مرتجع', 'returned') + ' ' + x.already : ''} · ${T('متاح', 'left')} ${x.remaining}</span>
          <span class="r-sub">${money(x.l.amount)}</span>
        </div>`).join('')}
    </div>

    <div class="field">
      <label>${T('السبب (إجباري)', 'Reason (required)')}</label>
      <div class="reasons">
        ${RETURN_REASONS.map((x) => `<button class="reason${r.reason === x.id ? ' is-on' : ''}" data-act="ret-reason" data-id="${x.id}">${esc(x[LANG])}</button>`).join('')}
      </div>
    </div>

    <div class="field">
      <label>${T('طريقة الرد', 'Refund method')}</label>
      <div class="reasons">
        ${REFUND_METHODS.map((x) => `<button class="reason${r.method === x.id ? ' is-on' : ''}" data-act="ret-method" data-id="${x.id}">${esc(x[LANG])}</button>`).join('')}
      </div>
    </div>

    <label class="switch">
      <input type="checkbox" ${r.restock ? 'checked' : ''} data-act="ret-restock">
      <span class="track"></span>
      <span>${T('يرجع للمخزون المتاح (لو الصنف تالف، اقفل المفتاح)', 'Return to sellable stock (turn off if damaged)')}</span>
    </label>

    <div class="card" style="border-color:rgba(246,90,0,.35);background:var(--uno-brand-soft)">
      <div class="spread">
        <span style="font-size:12.5px;color:var(--uno-brand-3)">${T('قيمة المرتجع', 'Refund amount')}</span>
        <span class="num" style="font-size:22px;font-weight:700;color:var(--uno-brand-3)">${money(refund)} ${cur()}</span>
      </div>
      <div class="hint" style="margin-top:6px">${T('ذرّي: المخزون والدرج والرصيد والتقرير — كله أو لا شيء.', 'Atomic: stock, drawer, balance and report all move together or not at all.')}</div>
    </div>
    ${r.error ? `<div class="err"><span>${ico('alert', 16)}</span><span>${esc(r.error)}</span></div>` : ''}`;

  return {
    title: T('استرجاع', 'Return'),
    sub: `${T('فاتورة', 'Invoice')} ${esc(inv.number)} · ${T('مستند جديد', 'new document')}`,
    body,
    foot: `<button class="btn is-ghost" data-act="ret-back">← ${T('رجوع', 'Back')}</button>
      <div class="grow"></div>
      ${allPicked ? `<span class="badge is-warn">${T('استرجاع كامل — يحتاج مدير', 'Full return — needs manager')}</span>` : ''}
      <button class="btn is-primary" data-act="ret-confirm" ${refund ? '' : 'disabled'}>${T('تأكيد الاسترجاع', 'Confirm return')} · ${money(refund)}</button>`
  };
};

async function commitReturn(managerToken) {
  const r = state.ui.ret;
  const inv = state.invoices.find((i) => i.id === r.invoiceId);
  const lines = Object.keys(r.lines).filter((p) => r.lines[p] > 0)
    .map((p) => ({ product_id: p, qty: r.lines[p], restock: r.restock }));
  if (!lines.length) { r.error = T('اختار كمية من سطر واحد على الأقل.', 'Pick a quantity on at least one line.'); refreshSheet(); return; }
  if (!r.reason) { r.error = T('السبب إجباري.', 'A reason is required.'); refreshSheet(); return; }
  if (!state.online) {
    r.error = T('المرتجع محتاج اتصال عشان يتسجل على الفاتورة الأصلية والمخزون. رجّع الاتصال الأول.', 'A return needs a connection so it is tied to the original invoice and stock. Go back online first.');
    refreshSheet(); return;
  }

  const payload = {
    idempotency_key: `${CFG.deviceId}-ret-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    invoice_id: inv.id, lines, reason: r.reason,
    refund_method: r.method, manager_token: managerToken || null
  };
  try {
    const res = await RPC.call('pos_return', payload);
    const ret = res.ret;
    state.lastReturn = ret;
    closeSheet();
    renderAll();
    save();
    toast(`${T('تم الاسترجاع', 'Return posted')} ${ret.number} · ${money(ret.amount)} ${cur()}`, 'ok', 3600);
    openSheet('return-done', { ret });
  } catch (e) {
    const msg = LANG === 'ar' ? (e.ar || e.message) : (e.en || e.message);
    if (['FULL_RETURN', 'WINDOW', 'DRAWER_SHORT'].includes(e.code)) {
      const ok = await requestManager('pos.return.full', msg);
      if (ok) { const tok = state.ui.lastManagerToken; commitReturn(tok); return; }
    }
    r.error = msg;
    refreshSheet();
  }
}

SHEETS['return-done'] = function (opts) {
  const ret = opts.ret;
  return {
    title: T('تم تسجيل المرتجع', 'Return posted'),
    sub: `${ret.number} · ${fmtDateTime(ret.created_at)}`,
    center: true, width: 460,
    body: `<div style="text-align:center;padding:8px 0">
        <div class="ok-ring" style="margin:0 auto 10px">${ico('check', 32)}</div>
        <div class="num" style="font-size:30px;font-weight:700">${money(ret.amount)} <i style="font-size:14px;color:var(--uno-text-2)">${cur()}</i></div>
        <div class="hint">${T('على الفاتورة', 'On invoice')} ${esc(ret.invoice_number)} · ${T('الطريقة', 'Method')} ${esc((REFUND_METHODS.find((m) => m.id === ret.refund_method) || {})[LANG] || ret.refund_method)}</div>
      </div>
      <div class="kv">
        <div class="kv-row"><span>${T('المخزون', 'Stock')}</span><span class="v">${ret.lines.filter((l) => l.restock).length} ${T('سطر رجع للمتاح', 'lines back to sellable')}</span></div>
        <div class="kv-row"><span>${T('الدرج / الخزنة', 'Drawer / safe')}</span><span class="v">${money(ret.amount)}</span></div>
        <div class="kv-row"><span>${T('رصيد العميل', 'Customer balance')}</span><span class="v">${ret.refund_method === 'credit' ? '−' + money(ret.amount) : '—'}</span></div>
        <div class="kv-row"><span>${T('سجل التدقيق', 'Audit log')}</span><span class="v">${T('مسجّل', 'logged')}</span></div>
      </div>
      <div class="hint">${T('ممنوع حذف المرتجع: التصحيح بمستند عكسي جديد.', 'Returns are never deleted: a correction is a new reversing document.')}</div>`,
    foot: `<button class="btn is-primary is-block" data-act="close-sheet">${T('تمام', 'Done')}</button>`
  };
};

/* ------------------------------------------------------ 22. Shift + drawer */
const DENOMS = [20000, 10000, 5000, 2000, 1000, 500, 100, 50, 25];

function countedTotal() {
  return Object.keys(state.ui.count || {}).reduce((s, k) => s + Number(k) * (Number(state.ui.count[k]) || 0), 0);
}

function openShiftClose() {
  if (!(state.shift && state.shift.status === 'open')) { toast(T('مفيش وردية مفتوحة.', 'No open shift.'), 'bad'); return; }
  state.ui.count = {};
  state.ui.reveal = false;
  openSheet('shift');
}

SHEETS.shift = function () {
  const s = shiftSales();
  const expected = expectedDrawer();
  const counted = countedTotal();
  const variance = counted - expected;
  const revealed = !!state.ui.reveal;
  const moves = state.cashMoves.filter((m) => m.shift_id === (state.shift ? state.shift.id : null));

  const body = `
    <div class="pay-grid">
      <div class="pay-col">
        <div class="card">
          <div class="kv">
            <div class="kv-row"><span>${T('نقدية بداية الوردية', 'Opening float')}</span><span class="v">${money(state.shift.openingFloat)}</span></div>
            <div class="kv-row"><span>${T('مبيعات نقدي', 'Cash sales')}</span><span class="v">${money(s.byMethod.cash)}</span></div>
            <div class="kv-row"><span>${T('مبيعات بطاقة', 'Card sales')}</span><span class="v">${money(s.byMethod.card)}</span></div>
            <div class="kv-row"><span>${T('مبيعات محفظة', 'Wallet sales')}</span><span class="v">${money(s.byMethod.wallet)}</span></div>
            <div class="kv-row"><span>${T('مبيعات آجل', 'Credit sales')}</span><span class="v">${money(s.byMethod.credit)}</span></div>
            <div class="kv-row"><span>${T('مرتجعات نقدية', 'Cash refunds')}</span><span class="v">−${money(s.refunds)}</span></div>
            <div class="kv-row"><span>${T('عدد الفواتير', 'Invoices')}</span><span class="v">${s.count}</span></div>
            <div class="kv-row"><span>${T('حركات الدرج', 'Drawer movements')}</span><span class="v">${moves.length}</span></div>
            <div class="kv-row is-strong"><span>${T('المتوقع في الدرج', 'Expected in drawer')}</span><span class="v">${money(expected)}</span></div>
          </div>
        </div>
        ${revealed ? `<div class="card" style="border-color:${variance < 0 ? 'rgba(229,72,77,.4)' : variance > 0 ? 'rgba(245,165,36,.4)' : 'rgba(22,163,74,.4)'}">
          <div class="kv">
            <div class="kv-row"><span>${T('المعدود', 'Counted')}</span><span class="v">${money(counted)}</span></div>
            <div class="kv-row ${variance < 0 ? 'is-neg' : variance > 0 ? 'is-pos' : ''}"><span>${T('الفرق', 'Variance')}</span><span class="v">${variance > 0 ? '+' : ''}${money(variance)}</span></div>
          </div>
          <div class="hint" style="margin-top:6px">${variance === 0 ? T('مطابق تمامًا.', 'Matches exactly.') : variance < 0 ? T('عجز — يُسجَّل على الوردية والكاشير.', 'Short — recorded against the shift and cashier.') : T('زيادة — تُسجَّل أيضًا.', 'Over — recorded too.')}</div>
        </div>`
        : `<div class="blind-lock">
            <strong>${T('عدّ أعمى', 'Blind count')}</strong>
            ${T('اكتب المعدود الأول. المتوقع والفرق يظهروا بعد ما تخلص.', 'Enter the counted cash first. Expected and variance appear after you finish.')}
          </div>`}
        ${moves.length ? `<div class="card">
          <div style="font-size:12px;color:var(--uno-text-2);margin-bottom:6px">${T('حركات الدرج', 'Drawer movements')}</div>
          ${moves.map((m) => `<div class="kv-row"><span>${esc(m.reason)} · ${m.voucher_no}</span><span class="v">${m.type === 'pay_in' ? '+' : '−'}${money(m.amount)}</span></div>`).join('')}
        </div>` : ''}
      </div>

      <div class="pay-col">
        <div class="field">
          <label>${T('عدّ الدرج بالفئات', 'Count the drawer by denomination')}</label>
          <div class="count-grid">
            ${DENOMS.map((d) => `<label class="denom">
              <span class="d-v">${money(d)}</span>
              <input type="number" min="0" inputmode="numeric" data-act="count" data-d="${d}"
                value="${state.ui.count[d] || ''}" placeholder="0" aria-label="${money(d)}">
              <span class="d-sub">${money(d * (state.ui.count[d] || 0))}</span>
            </label>`).join('')}
          </div>
        </div>
        <div class="paid-box">
          <span class="lbl">${T('المعدود', 'Counted')}</span>
          <span class="val">${money(counted)}</span>
        </div>
        ${!revealed ? `<button class="btn is-block" data-act="shift-reveal" ${counted ? '' : 'disabled'}>${T('احسب الفرق', 'Reveal variance')}</button>`
          : `<button class="btn is-block is-ghost" data-act="shift-hide">${T('إخفاء المتوقع', 'Hide expected')}</button>`}
        <button class="btn is-block" data-act="print-z">${ico('printer', 16)} ${T('طباعة تقرير Z', 'Print Z report')}</button>
        <div class="hint">${T('الإغلاق يمنع البيع بعد كده لحد ما تفتح وردية جديدة.', 'Closing stops selling until a new shift is opened.')}</div>
      </div>
    </div>`;

  return {
    title: T('إغلاق الوردية', 'Close shift'),
    sub: `${T('فتحت', 'Opened')} ${fmtDateTime(state.shift.openedAt)} · ${fmtDuration(Date.now() - state.shift.openedAt)}`,
    body, center: true, width: 820,
    foot: `<button class="btn is-ghost" data-act="close-sheet">${T('رجوع', 'Back')}</button>
      <div class="grow"></div>
      <button class="btn is-primary is-lg" data-act="shift-close" ${revealed && counted ? '' : 'disabled'}>
        ${T('تأكيد إغلاق الوردية', 'Confirm shift close')}</button>`
  };
};

async function closeShift() {
  const counted = countedTotal();
  try {
    const res = await RPC.call('shift_close', { counted_total: counted });
    state.lastZ = res.shift;
    closeSheet();
    renderAll();
    save();
    openSheet('z-report');
  } catch (e) {
    toast(LANG === 'ar' ? e.ar : e.en, 'bad');
  }
}

SHEETS['z-report'] = function () {
  const z = state.lastZ;
  const s = shiftSales();
  return {
    title: T('تقرير Z', 'Z report'),
    sub: `${T('وردية', 'Shift')} ${esc(String(z.id))} · ${fmtDateTime(z.closedAt)}`,
    center: true, width: 520,
    body: `<div style="display:flex;justify-content:center">
        <div class="receipt-wrap" dir="${isRTL() ? 'rtl' : 'ltr'}">
          <h3>${esc(CFG.company[LANG === 'ar' ? 'nameAr' : 'nameEn'])}</h3>
          <div class="r-center">${T('تقرير إغلاق وردية', 'Shift close report')}<br>${fmtDateTime(z.closedAt)}</div>
          <div class="r-sep"></div>
          <table>
            <tr><td>${T('نقدية البداية', 'Opening float')}</td><td class="r num">${money(z.openingFloat)}</td></tr>
            <tr><td>${T('مبيعات نقدي', 'Cash sales')}</td><td class="r num">${money(s.byMethod.cash)}</td></tr>
            <tr><td>${T('مبيعات بطاقة', 'Card')}</td><td class="r num">${money(s.byMethod.card)}</td></tr>
            <tr><td>${T('مبيعات محفظة', 'Wallet')}</td><td class="r num">${money(s.byMethod.wallet)}</td></tr>
            <tr><td>${T('مبيعات آجل', 'Credit')}</td><td class="r num">${money(s.byMethod.credit)}</td></tr>
            <tr><td>${T('مرتجعات', 'Refunds')}</td><td class="r num">−${money(s.refunds)}</td></tr>
            <tr><td>${T('حركات الدرج', 'Movements')}</td><td class="r num">${money(state.cashMoves.filter((m) => m.shift_id === z.id).reduce((a, m) => a + delta(m), 0))}</td></tr>
            <tr class="r-total"><td>${T('المتوقع', 'Expected')}</td><td class="r num">${money(z.expected)}</td></tr>
            <tr><td>${T('المعدود', 'Counted')}</td><td class="r num">${money(z.counted)}</td></tr>
            <tr class="r-total"><td>${T('الفرق', 'Variance')}</td><td class="r num">${z.variance > 0 ? '+' : ''}${money(z.variance)}</td></tr>
          </table>
          <div class="r-sep"></div>
          <div class="r-center" style="font-size:10px">${T('الكاشير', 'Cashier')}: ${esc(ROLES[z.cashierRole || 'cashier'][LANG])}</div>
        </div>
      </div>`,
    foot: `<button class="btn is-ghost" data-act="print-z">${ico('printer', 16)} ${T('طباعة', 'Print')}</button>
      <div class="grow"></div>
      <button class="btn is-primary" data-act="open-shift">${T('فتح وردية جديدة', 'Open a new shift')}</button>`
  };
};

SHEETS['open-shift'] = function () {
  return {
    title: T('فتح وردية', 'Open a shift'),
    sub: T('اكتب نقدية البداية في الدرج', 'Enter the opening float'),
    center: true, width: 420,
    body: `<div class="field">
        <label for="floatInput">${T('نقدية البداية', 'Opening float')} (${cur()})</label>
        <input class="input num" id="floatInput" inputmode="decimal" value="500" data-act="float-input">
      </div>
      <div class="hint">${T('الوردية تُسجَّل باسم الكاشير الحالي وتظهر في كل التقارير.', 'The shift is recorded under the current cashier and appears in every report.')}</div>`,
    foot: `<button class="btn is-ghost" data-act="close-sheet">${T('إلغاء', 'Cancel')}</button>
      <div class="grow"></div>
      <button class="btn is-primary" data-act="shift-open">${T('فتح الوردية', 'Open shift')}</button>`
  };
};

async function openShift() {
  const v = parseFloat((el('floatInput') || {}).value || '0');
  try {
    await RPC.call('shift_open', { opening_float: Math.round((isFinite(v) ? v : 0) * 100), cashier_id: 'u-cashier', role: 'cashier' });
    closeSheet(); renderAll(); save();
    toast(T('الوردية اتفتحت', 'Shift opened'), 'ok');
  } catch (e) { toast(LANG === 'ar' ? e.ar : e.en, 'bad'); }
}

function openDrawerNoSale() {
  if (!(state.shift && state.shift.status === 'open')) { toast(T('مفيش وردية مفتوحة.', 'No open shift.'), 'bad'); return; }
  requestManager('pos.drawer.open_no_sale', T('فتح الدرج بدون بيعة', 'Open the drawer without a sale')).then((ok) => {
    if (!ok) return;
    state.audit.push({ type: 'drawer_open', at: Date.now(), by: state.shift.cashierId, reason: 'no_sale' });
    save();
    toast(T('الدرج اتفتح — الحركة مسجّلة باسمك.', 'Drawer opened — logged under your name.'), 'ok');
  });
}

/* --------------------------------------------------------- 23. Drawer moves */
const MOVE_TYPES = [
  { id: 'pay_in', ar: 'إيداع نقدي', en: 'Pay in' },
  { id: 'pay_out', ar: 'سحب نقدي', en: 'Pay out' },
  { id: 'expense', ar: 'مصروف', en: 'Expense' },
  { id: 'safe_drop', ar: 'تحويل للخزنة', en: 'Safe drop' }
];
const MOVE_REASONS = {
  pay_in: [{ ar: 'عهدة إضافية', en: 'Extra float' }, { ar: 'تحصيل عميل', en: 'Customer payment' }, { ar: 'تصحيح عدّ', en: 'Count correction' }],
  pay_out: [{ ar: 'سلفة موظف', en: 'Staff advance' }, { ar: 'رد للعميل', en: 'Customer refund' }, { ar: 'تصحيح عدّ', en: 'Count correction' }],
  expense: [{ ar: 'أكياس تغليف', en: 'Packaging' }, { ar: 'نقل', en: 'Transport' }, { ar: 'صيانة', en: 'Maintenance' }, { ar: 'نظافة', en: 'Cleaning' }],
  safe_drop: [{ ar: 'تحويل نص اليوم', en: 'Mid-day drop' }, { ar: 'حد أمان الدرج', en: 'Drawer safety limit' }]
};

function openDrawer() {
  state.ui.move = { type: 'pay_in', amount: '', reason: null, note: '', error: null };
  openSheet('drawer');
}

SHEETS.drawer = function () {
  const m = state.ui.move || { type: 'pay_in', amount: '', reason: null, note: '' };
  const moves = state.cashMoves.filter((x) => x.shift_id === (state.shift ? state.shift.id : null));
  const body = `
    <div class="methods" style="grid-template-columns:repeat(4,1fr)">
      ${MOVE_TYPES.map((t) => `<button class="method${m.type === t.id ? ' is-on' : ''}" data-act="move-type" data-id="${t.id}">
        <span class="m-ico">${ico(t.ico, 17)}</span><span>${esc(t[LANG])}</span></button>`).join('')}
    </div>
    <div class="field">
      <label for="moveAmount">${T('المبلغ', 'Amount')} (${cur()})</label>
      <input class="input num" id="moveAmount" inputmode="decimal" data-act="move-amount"
        value="${esc(m.amount)}" placeholder="0.00">
    </div>
    <div class="field">
      <label>${T('السبب', 'Reason')}</label>
      <div class="reasons">
        ${(MOVE_REASONS[m.type] || []).map((r) => `<button class="reason${m.reason === r.en ? ' is-on' : ''}"
          data-act="move-reason" data-id="${esc(r.en)}">${esc(r[LANG])}</button>`).join('')}
      </div>
    </div>
    <div class="field">
      <label for="moveNote">${T('ملاحظة (اختياري)', 'Note (optional)')}</label>
      <input class="input" id="moveNote" data-act="move-note" value="${esc(m.note)}">
    </div>
    ${m.error ? `<div class="err"><span>${ico('alert', 16)}</span><span>${esc(m.error)}</span></div>` : ''}
    <div class="card">
      <div class="spread" style="margin-bottom:6px">
        <span style="font-size:12px;color:var(--uno-text-2)">${T('حركات الوردية', 'Shift movements')}</span>
        <span class="num" style="font-size:12px">${moves.length}</span>
      </div>
      ${moves.length ? moves.map((x) => `<div class="kv-row">
        <span>${x.voucher_no} · ${esc(x.reason)}</span>
        <span class="v">${x.type === 'pay_in' ? '+' : '−'}${money(x.amount)}</span></div>`).join('')
        : `<div class="hint">${T('مفيش حركات لسه.', 'No movements yet.')}</div>`}
    </div>
    <div class="hint">${T('كل حركة ليها سند مرقّم يُطبع، والمتوقع في الدرج يُحسب منها.', 'Every movement gets a numbered printed voucher, and the expected drawer is computed from them.')}</div>`;

  return {
    title: T('حركات الدرج', 'Drawer movements'),
    sub: T('إيداع · سحب · مصروف · تحويل للخزنة', 'Pay in · pay out · expense · safe drop'),
    body,
    foot: `<button class="btn is-ghost" data-act="close-sheet">${T('إغلاق', 'Close')}</button>
      <div class="grow"></div>
      <button class="btn is-primary" data-act="move-submit">${T('تسجيل الحركة', 'Post movement')}</button>`
  };
};

async function submitMove() {
  const m = state.ui.move;
  const amount = Math.round(parseFloat(m.amount || '0') * 100);
  if (!(amount > 0)) { m.error = T('اكتب مبلغ أكبر من صفر.', 'Enter an amount above zero.'); refreshSheet(); return; }
  if (!m.reason) { m.error = T('اختار سبب من القائمة.', 'Pick a reason from the list.'); refreshSheet(); return; }
  try {
    const res = await RPC.call('cash_move', { type: m.type, amount, reason: m.reason, note: m.note });
    closeSheet(); renderAll(); save();
    toast(`${T('تم', 'Posted')} ${res.move.voucher_no} · ${money(amount)} ${cur()}`, 'ok', 3200);
    openSheet('voucher', { move: res.move });
  } catch (e) {
    m.error = LANG === 'ar' ? e.ar : e.en;
    refreshSheet();
  }
}

SHEETS.voucher = function (opts) {
  const v = opts.move;
  return {
    title: T('سند حركة درج', 'Drawer voucher'),
    sub: `${v.voucher_no} · ${fmtDateTime(v.created_at)}`,
    center: true, width: 420,
    body: `<div style="display:flex;justify-content:center">
      <div class="receipt-wrap" dir="${isRTL() ? 'rtl' : 'ltr'}">
        <h3>${esc(CFG.company[LANG === 'ar' ? 'nameAr' : 'nameEn'])}</h3>
        <div class="r-center">${T('سند', 'Voucher')} ${esc(v.voucher_no)}</div>
        <div class="r-sep"></div>
        <table>
          <tr><td>${T('النوع', 'Type')}</td><td class="r">${esc((MOVE_TYPES.find((t) => t.id === v.type) || {})[LANG] || v.type)}</td></tr>
          <tr><td>${T('المبلغ', 'Amount')}</td><td class="r num">${money(v.amount)}</td></tr>
          <tr><td>${T('السبب', 'Reason')}</td><td class="r">${esc(v.reason)}</td></tr>
          <tr><td>${T('المستخدم', 'User')}</td><td class="r">${esc(ROLES[(state.shift && state.shift.cashierRole) || 'cashier'][LANG])}</td></tr>
          <tr><td>${T('التاريخ', 'Date')}</td><td class="r num">${fmtDateTime(v.created_at)}</td></tr>
        </table>
        <div class="r-sep"></div>
        <div class="r-center" style="font-size:10px">${T('توقيع المستلم', 'Received by')}: ______________</div>
      </div>
    </div>`,
    foot: `<button class="btn is-ghost" data-act="print-z">${ico('printer', 16)} ${T('طباعة السند', 'Print voucher')}</button>
      <div class="grow"></div>
      <button class="btn is-primary" data-act="close-sheet">${T('تمام', 'Done')}</button>`
  };
};
/* ==========================================================================
   pos.js — part 5/5: held tickets, scanner, weight, customer, discount,
   manager gate, help, more menu, action dispatcher, boot
   ========================================================================== */

/* -------------------------------------------------------- 23b. Order tabs (client side, no accounting) */
const MAX_TABS = 5;
function tabsInit() { if (!state.tabs) { state.tabs = [state.cart]; state.tabIdx = 0; } }
function tabSwitch(i) {
  tabsInit();
  if (i < 0 || i >= state.tabs.length || i === state.tabIdx) return;
  state.tabs[state.tabIdx] = state.cart;
  state.tabIdx = i; state.cart = state.tabs[i]; state.selected = null;
  renderAll(); postDisplay();
}
function tabNew() {
  tabsInit();
  if (state.tabs.length >= MAX_TABS) { toast(T('أقصى عدد فواتير مفتوحة ' + MAX_TABS, 'Up to ' + MAX_TABS + ' open invoices'), 'bad'); return; }
  state.tabs[state.tabIdx] = state.cart;
  state.tabs.push(emptyCart()); state.tabIdx = state.tabs.length - 1; state.cart = state.tabs[state.tabIdx]; state.selected = null;
  renderAll(); postDisplay();
}
function tabClose(i) {
  tabsInit();
  if (state.tabs.length < 2) return;
  state.tabs[state.tabIdx] = state.cart;
  if (state.tabs[i].lines.length) { toast(T('الفاتورة فيها أصناف. علّقها أو أتمّ بيعها الأول.', 'This invoice has items. Hold it or finish the sale first.'), 'bad'); return; }
  state.tabs.splice(i, 1);
  if (state.tabIdx >= i) state.tabIdx = Math.max(0, state.tabIdx - (state.tabIdx === i ? 0 : 1));
  state.tabIdx = Math.min(state.tabIdx, state.tabs.length - 1);
  state.cart = state.tabs[state.tabIdx]; state.selected = null;
  renderAll(); postDisplay();
}
/* After a finished sale: drop the finished tab when others are open and go to the first one with items. */
function tabAfterSale() {
  tabsInit();
  state.tabs[state.tabIdx] = state.cart;
  if (state.tabs.length < 2) return;
  state.tabs.splice(state.tabIdx, 1);
  let j = state.tabs.findIndex((c) => c.lines.length); if (j < 0) j = 0;
  state.tabIdx = j; state.cart = state.tabs[j];
}
function renderTabs() {
  tabsInit();
  const box = el('cart'); if (!box) return;
  let st = el('tabStrip');
  if (!st) { st = document.createElement('div'); st.id = 'tabStrip'; st.className = 'tabstrip'; st.setAttribute('role', 'tablist'); box.insertBefore(st, el('cartHead')); }
  state.tabs[state.tabIdx] = state.cart;
  const multi = state.tabs.length > 1;
  st.innerHTML = state.tabs.map((c, i) => {
    const on = i === state.tabIdx, n = c.lines.length;
    const cust = state.customers.find((x) => x.id === c.customerId);
    const lab = cust ? esc(cust[LANG]) : T('فاتورة ', 'Order ') + (i + 1);
    return `<span class="tabx${on ? ' on' : ''}"><button type="button" role="tab" aria-selected="${on}" data-act="tab-go" data-id="${i}"><span class="tl">${lab}</span>${n ? `<span class="tn">${n}</span>` : ''}</button>${multi && !n ? `<button type="button" class="tc" data-act="tab-x" data-id="${i}" aria-label="${T('إغلاق', 'Close')}">✕</button>` : ''}</span>`;
  }).join('') + `<button type="button" class="tabadd" data-act="tab-new" aria-label="${T('فاتورة جديدة', 'New invoice')}" title="${T('فاتورة جديدة', 'New invoice')}">${ico('plus', 14)}</button>`;
}

/* -------------------------------------------------------- 24. Held tickets */
async function holdCartLive() {
  if (!state.cart.lines.length) { toast(T('الفاتورة فاضية.', 'The cart is empty.'), 'bad'); return false; }
  const c = state.cart;
  try {
    await window.unoRpc('pos_hold_save', { customer_id: c.customerId, total: cartTotals(c).total, payload: { lines: JSON.parse(JSON.stringify(c.lines)), customerId: c.customerId, invoiceDiscount: c.invoiceDiscount, invoiceDiscountKind: c.invoiceDiscountKind, note: c.note } });
  } catch (e) { toast(e.ar || e.message, 'bad'); return false; }
  state.cart = emptyCart(); state.selected = null;
  await window.UnoLive.loadHolds();
  renderAll(); postDisplay();
  toast(T('اتعلقت وبقت متاحة لكل أجهزة الفرع', 'Held and available on every device'), 'ok');
  return true;
}

function holdCart() {
  if (!CFG.demo) { holdCartLive(); return; }
  if (!state.cart.lines.length) { toast(T('الفاتورة فاضية.', 'The cart is empty.'), 'bad'); return; }
  const held = {
    id: 'h-' + (++state.seq),
    number: 'H-' + String(state.counters.held++).padStart(3, '0'),
    at: Date.now(),
    customerId: state.cart.customerId,
    lines: JSON.parse(JSON.stringify(state.cart.lines)),
    invoiceDiscount: state.cart.invoiceDiscount,
    invoiceDiscountKind: state.cart.invoiceDiscountKind,
    note: state.cart.note
  };
  state.held.unshift(held);
  state.cart = emptyCart();
  state.selected = null;
  renderAll(); save(); postDisplay();
  toast(`${T('اتعلقت', 'Held')} ${held.number}`, 'ok');
}

SHEETS.held = function () {
  const body = state.held.length ? `<div class="ret-lines">
    ${state.held.map((h) => {
      const total = cartTotals({ lines: h.lines, invoiceDiscount: h.invoiceDiscount, invoiceDiscountKind: h.invoiceDiscountKind });
      const cust = state.customers.find((c) => c.id === h.customerId);
      return `<div class="ret-line">
        <span class="r-name">${esc(h.number)} · ${cust ? esc(cust[LANG]) : T('عميل نقدي', 'Walk-in')}</span>
        <span class="r-qty"><button class="btn is-sm" data-act="resume" data-id="${h.id}">${T('استئناف', 'Resume')}</button></span>
        <span class="r-sub">${h.lines.length} ${T('أصناف', 'items')} · ${fmtTime(h.at)}</span>
        <span class="r-sub">${money(total.total)} ${cur()}</span>
      </div>`;
    }).join('')}</div>
    <div class="spread card"><span style="font-size:12.5px;color:var(--uno-text-2)">${T('إجمالي المعلّق', 'Held total')}</span>
      <span class="num" style="font-weight:700">${money(state.held.reduce((s, h) => s + cartTotals({ lines: h.lines, invoiceDiscount: h.invoiceDiscount }).total, 0))}</span></div>`
    : `<div class="empty"><div class="e-ico">${ico('pause', 32)}</div><p>${T('مفيش فواتير معلقة.', 'No held invoices.')}</p></div>`;
  return {
    title: T('الفواتير المعلقة', 'Held invoices'),
    sub: T('متاحة من أي جهاز على نفس الفرع', 'Available from any device on the branch'),
    body,
    foot: `<button class="btn is-ghost" data-act="close-sheet">${T('رجوع', 'Back')} <kbd>Esc</kbd></button>
      <div class="grow"></div>
      <button class="btn" data-act="hold">${T('علّق الفاتورة الحالية', 'Hold current cart')}</button>`
  };
};

async function resumeHeldLive(id) {
  if (state.cart.lines.length && !(await holdCartLive())) return;
  let r;
  try { r = await window.unoRpc('pos_hold_take', { id }); } catch (e) { toast(e.ar || e.message, 'bad'); return; }
  if (!r || !r.ok) { toast(T('الفاتورة دي اتسحبت من جهاز تاني.', 'This held invoice was already resumed on another device.'), 'bad'); await window.UnoLive.loadHolds(); refreshSheet(); return; }
  const pl = r.payload || {};
  state.cart = { lines: pl.lines || [], customerId: r.customer_id || pl.customerId || null, invoiceDiscount: pl.invoiceDiscount || 0, invoiceDiscountKind: pl.invoiceDiscountKind || 'amount', note: pl.note || '', id: null };
  await window.UnoLive.loadHolds();
  closeSheet(); renderAll(); postDisplay();
  toast(T('اتسترجعت الفاتورة', 'Invoice resumed'), 'ok');
}

function resumeHeld(id) {
  if (!CFG.demo) { resumeHeldLive(id); return; }
  const h = state.held.find((x) => x.id === id);
  if (!h) return;
  if (state.cart.lines.length) holdCart();
  state.cart = {
    lines: JSON.parse(JSON.stringify(h.lines)),
    customerId: h.customerId, invoiceDiscount: h.invoiceDiscount,
    invoiceDiscountKind: h.invoiceDiscountKind || 'amount', note: h.note, id: null
  };
  state.held = state.held.filter((x) => x.id !== id);
  closeSheet(); renderAll(); save(); postDisplay();
  toast(T('اتسترجعت الفاتورة', 'Invoice resumed'), 'ok');
}

/* ------------------------------------------------------------- 25. Scanner */
SHEETS.scan = function () {
  const miss = state.ui.scanMiss;
  const log = state.ui.scanLog || [];
  const body = `
    <div class="scan-wrap">
      <div class="cam">
        <div class="frame">
          <span class="corner tl"></span><span class="corner tr"></span>
          <span class="corner bl"></span><span class="corner br"></span>
          <span class="laser" aria-hidden="true"></span>
          <div class="barcode" aria-hidden="true">6221034881927</div>
        </div>
        <div class="hint" style="position:absolute;inset-block-end:10px">${T('وجّه الباركود داخل الإطار، أو امسح بالاسكانر في أي وقت.', 'Point the barcode inside the frame, or scan with the handheld at any time.')}</div>
      </div>
      <div class="scan-log">
        <div class="spread"><span style="font-size:12px;color:var(--uno-text-2)">${T('آخر عمليات المسح', 'Recent scans')}</span>
          <span class="badge is-ok">● ${T('يقرأ الآن', 'Reading')}</span></div>
        ${log.length ? log.map((x) => `<div class="scan-item${x.found ? '' : ' is-bad'}">
            <span class="s-name">${x.found ? esc(x.name) : T('باركود غير موجود', 'Barcode not found')}</span>
            <span class="s-code">${esc(x.code)}</span>
          </div>`).join('') : `<div class="hint">${T('لسه مفيش مسح في الجلسة دي.', 'No scans yet in this session.')}</div>`}
        <button class="btn is-block" data-act="weight">${ico('scale', 16)} ${T('إدخال بالوزن', 'Enter by weight')}</button>
        <button class="btn is-block" data-act="more">${ico('more', 16)} ${T('خيارات أكتر', 'More options')}</button>
      </div>
    </div>
    ${miss ? `<div class="card" style="border-color:rgba(229,72,77,.4);background:var(--uno-bad-soft)">
      <div style="font-weight:700;color:var(--uno-bad-text);margin-bottom:2px">${ico('alert', 16)} ${T('الباركود غير موجود', 'Barcode not found')}</div>
      <div class="num" style="font-size:12px;color:var(--uno-text-2)">${esc(miss)}</div>
      <div class="row wrap" style="margin-top:10px">
        <button class="btn is-sm is-primary" data-act="scan-create">${T('صنف جديد بالباركود', 'New item with this barcode')} <kbd>Enter</kbd></button>
        <button class="btn is-sm" data-act="scan-search">${T('بحث بالاسم', 'Search by name')}</button>
        <button class="btn is-sm" data-act="open-price">${T('صنف مفتوح السعر', 'Open-price item')}</button>
      </div>
    </div>` : ''}
    <div class="field">
      <label for="manualCode">${T('إدخال يدوي', 'Manual entry')}</label>
      <input class="input num" id="manualCode" placeholder="${T('اكتب أو امسح الباركود', 'Type or scan a barcode')}" data-act="manual-code">
    </div>`;
  return {
    title: T('البحث والمسح', 'Search & scan'),
    sub: T('الاسكانر يشتغل من أي شاشة — النافذة دي للكاميرا أو الإدخال اليدوي', 'The scanner works from any screen — this is for the camera or manual entry'),
    body, center: true, width: 760,
    foot: `<button class="btn is-ghost" data-act="close-sheet">${T('إغلاق', 'Close')} <kbd>Esc</kbd></button>
      <div class="grow"></div>
      <button class="btn is-primary" data-act="manual-submit">${T('إضافة', 'Add')}</button>`
  };
};

/* -------------------------------------------------------------- 26. Weight */
SHEETS.weight = function () {
  const list = state.products.filter((p) => p.weighted);
  const picked = state.ui.weightProduct || (list[0] && list[0].id);
  const p = state.products.find((x) => x.id === picked);
  const grams = p ? snapQty(p.id, state.ui.weightGrams || 250) : 250;
  const amountV = p ? round(p.price * grams / 1000) : 0;
  return {
    title: T('إدخال بالوزن', 'Enter by weight'),
    sub: T('الكمية × سعر الوحدة = الإجمالي، من غير تحويل ضمني', 'Quantity × unit price = total, no implicit conversion'),
    center: true, width: 520,
    body: `<div class="field">
        <label>${T('الصنف', 'Item')}</label>
        <select class="select" data-act="weight-pick">
          ${list.map((x) => `<option value="${x.id}" ${x.id === picked ? 'selected' : ''}>${esc(x[LANG])} — ${money(x.price)}/${uLab(x.id)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label for="grams">${T('الكمية', 'Quantity')} (${p ? uLab(p.id) : ''})</label>
        <input class="input num" id="grams" inputmode="decimal" value="${state.ui.weightRaw != null ? esc(state.ui.weightRaw) : nf(grams / 1000, 3)}" data-act="weight-input">
      </div>
      <div class="paid-box"><span class="lbl">${T('الإجمالي', 'Total')}</span><span class="val">${money(amountV)}</span></div>
      <div class="hint">${p ? T('أقل خطوة', 'Smallest step') + ' ' + nf(stepOf(p.id) / 1000, 3) + ' ' + uLab(p.id) + ' · ' + T('الكمية بتتقرب لأقرب خطوة: ', 'Rounded to the nearest step: ') + nf(grams / 1000, 3) : ''}</div>`,
    foot: `<button class="btn is-ghost" data-act="close-sheet">${T('إلغاء', 'Cancel')}</button>
      <div class="grow"></div>
      <button class="btn is-primary" data-act="weight-add">${T('إضافة للفاتورة', 'Add to invoice')} · ${money(amountV)}</button>`
  };
};

/* ------------------------------------------------------------ 27. Customer */
SHEETS.customer = function () {
  const q = (state.ui.custQuery || '').toLowerCase();
  const list = state.customers.filter((c) => !q || c[LANG].toLowerCase().includes(q) || c.phone.includes(q));
  return {
    title: T('العميل', 'Customer'),
    sub: T('البيع الآجل يلزمه عميل بحد ائتمان', 'Credit sales need a customer with a credit limit'),
    body: `<div class="field">
        <label for="custSearch">${T('بحث بالاسم أو الموبايل', 'Search by name or phone')}</label>
        <input class="input" id="custSearch" value="${esc(state.ui.custQuery || '')}" data-act="cust-search" placeholder="0100…">
      </div>
      <div class="ret-lines">
        <button class="ret-line" data-act="cust-pick" data-id="" style="text-align:start">
          <span class="r-name">${T('عميل نقدي', 'Walk-in customer')}</span>
          <span class="r-sub">${T('بدون حساب', 'No account')}</span>
        </button>
        ${list.map((c) => {
          const free = Math.max(0, c.credit_limit - c.balance);
          return `<button class="ret-line${state.cart.customerId === c.id ? ' is-on' : ''}" data-act="cust-pick" data-id="${c.id}" style="text-align:start">
            <span class="r-name">${esc(c[LANG])}</span>
            <span class="badge ${free > 0 ? 'is-ok' : 'is-bad'}">${free > 0 ? T('متاح', 'Available') + ' ' + money(free) : T('وصل الحد', 'At limit')}</span>
            <span class="r-sub">${esc(c.phone)}</span>
            <span class="r-sub">${T('الحد', 'Limit')} ${money(c.credit_limit)} · ${T('المستحق', 'Balance')} ${money(c.balance)}</span>
          </button>`;
        }).join('')}
      </div>
      <div class="hint">${T('حد الائتمان يُفحص في الخادم لحظة البيع، مش في الشاشة بس.', 'The credit limit is checked on the server at the moment of sale, not only in the UI.')}</div>`,
    foot: `<button class="btn is-ghost" data-act="close-sheet">${T('إغلاق', 'Close')} <kbd>Esc</kbd></button>
      <div class="grow"></div>
      <button class="btn" data-act="cust-new">${ico('plus', 16)} ${T('عميل جديد', 'New customer')}</button>`
  };
};

/* ------------------------------------------------------------ 28. Discount */
function openDiscount() {
  if (!state.cart.lines.length) { toast(T('الفاتورة فاضية.', 'The cart is empty.'), 'bad'); return; }
  const line = state.cart.lines.find((l) => l.id === state.selected);
  state.ui.disc = {
    target: line ? 'line' : 'invoice',
    kind: 'pct', value: '', error: null
  };
  openSheet('discount');
}

SHEETS.discount = function () {
  const d = state.ui.disc || { target: 'invoice', kind: 'pct', value: '' };
  const t = cartTotals();
  const line = state.cart.lines.find((l) => l.id === state.selected);
  const cap = PERMS['pos.sale.discount'].maxPct;
  return {
    title: T('خصم', 'Discount'),
    sub: T('سطر ثم فاتورة ثم كوبون — ترتيب ثابت', 'Line, then invoice, then coupon — a fixed order'),
    body: `<div class="field">
        <label>${T('على إيه؟', 'Apply to')}</label>
        <div class="reasons">
          <button class="reason${d.target === 'invoice' ? ' is-on' : ''}" data-act="disc-target" data-id="invoice">${T('الفاتورة', 'Invoice')}</button>
          <button class="reason${d.target === 'line' ? ' is-on' : ''}" data-act="disc-target" data-id="line" ${line ? '' : 'disabled'}>
            ${T('السطر المحدد', 'Selected line')}${line ? ': ' + esc(line[LANG]) : ''}</button>
        </div>
      </div>
      <div class="field">
        <label>${T('النوع', 'Type')}</label>
        <div class="reasons">
          <button class="reason${d.kind === 'pct' ? ' is-on' : ''}" data-act="disc-kind" data-id="pct">%</button>
          <button class="reason${d.kind === 'amount' ? ' is-on' : ''}" data-act="disc-kind" data-id="amount">${cur()}</button>
        </div>
      </div>
      <div class="field">
        <label for="discValue">${T('القيمة', 'Value')}</label>
        <input class="input num" id="discValue" inputmode="decimal" value="${esc(d.value)}" data-act="disc-value" placeholder="0">
      </div>
      <div class="card">
        <div class="kv">
          <div class="kv-row"><span>${T('الإجمالي الحالي', 'Current total')}</span><span class="v">${money(t.total)}</span></div>
          <div class="kv-row"><span>${T('سقف الكاشير', 'Cashier cap')}</span><span class="v">${cap}%</span></div>
          <div class="kv-row"><span>${T('فوق السقف', 'Over the cap')}</span><span class="v">${T('رمز مدير + سبب مسجّل', 'manager PIN + logged reason')}</span></div>
        </div>
      </div>
      ${d.error ? `<div class="err"><span>⚠</span><span>${esc(d.error)}</span></div>` : ''}`,
    foot: `<button class="btn is-ghost" data-act="close-sheet">${T('إلغاء', 'Cancel')}</button>
      <div class="grow"></div>
      <button class="btn is-primary" data-act="disc-apply">${T('تطبيق الخصم', 'Apply discount')}</button>`
  };
};

async function applyDiscount() {
  const d = state.ui.disc;
  const raw = parseFloat(d.value || '0');
  if (!(raw > 0)) { d.error = T('اكتب قيمة أكبر من صفر.', 'Enter a value above zero.'); refreshSheet(); return; }
  const t = cartTotals();
  const base = d.target === 'line'
    ? (() => { const l = state.cart.lines.find((x) => x.id === state.selected); return l ? lineAmount(l) + (l.discount || 0) : 0; })()
    : t.subtotal;
  const amount = d.kind === 'pct' ? round(base * raw / 100) : Math.round(raw * 100);
  if (amount > base) { d.error = T('الخصم أكبر من القيمة.', 'Discount is larger than the value.'); refreshSheet(); return; }
  const pctOfInvoice = t.subtotal ? amount / t.subtotal * 100 : 0;
  const cap = PERMS['pos.sale.discount'].maxPct;
  if (pctOfInvoice > cap && !hasPerm('pos.sale.discount_cap_override')) {
    const ok = await requestManager('pos.sale.discount', `${T('خصم', 'Discount')} ${nf(pctOfInvoice, 1)}% ${T('فوق السقف', 'over the cap')} (${cap}%)`);
    if (!ok) return;
  }
  if (d.target === 'line') {
    const l = state.cart.lines.find((x) => x.id === state.selected);
    if (l) l.discount = amount;
  } else {
    state.cart.invoiceDiscount = amount;
    state.cart.invoiceDiscountKind = 'amount';
  }
  state.audit.push({ type: 'discount', at: Date.now(), by: state.shift.cashierId, amount, target: d.target });
  closeSheet(); renderCart(); renderDock(); renderGrid(); save(); postDisplay();
  toast(T('الخصم اتطبق', 'Discount applied'), 'ok');
}

/* --------------------------------------------------------- 29. Manager gate */
SHEETS.gate = function () {
  const g = state.ui.gate || { pin: '', tries: 0, lockedUntil: 0 };
  const locked = g.lockedUntil > Date.now();
  const wait = Math.ceil((g.lockedUntil - Date.now()) / 1000);
  return {
    title: T('بوابة المدير', 'Manager gate'),
    sub: esc(g.reasonText || ''),
    center: true, width: 380,
    body: `<div class="gate" style="width:100%">
        <div class="pin-dots">${[0, 1, 2, 3].map((i) => `<i class="${i < g.pin.length ? 'on' : ''}"></i>`).join('')}</div>
        <div class="hint" style="text-align:center;margin:6px 0 10px">${locked
          ? T(`محاولات كتير. جرّب بعد ${wait} ثانية.`, `Too many attempts. Try again in ${wait}s.`)
          : T('ادخل رمز المدير (4 أرقام)', 'Enter the manager PIN (4 digits)')}</div>
        <div class="pin-pad">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-act="gate-key" data-k="${n}" ${locked ? 'disabled' : ''}>${n}</button>`).join('')}
          <button data-act="gate-key" data-k="del" ${locked ? 'disabled' : ''} aria-label="${T('مسح', 'Backspace')}">${ico('backspace', 18)}</button>
          <button data-act="gate-key" data-k="0" ${locked ? 'disabled' : ''}>0</button>
          <button data-act="gate-ok" ${locked ? 'disabled' : ''} aria-label="${T('تأكيد', 'Confirm')}">${ico('check', 20)}</button>
        </div>
        
      </div>`,
    foot: `<button class="btn is-ghost is-block" data-act="gate-cancel">${T('إلغاء', 'Cancel')}</button>`
  };
};

function gateKey(k) {
  const g = state.ui.gate;
  if (!g || g.lockedUntil > Date.now()) return;
  if (k === 'del') g.pin = g.pin.slice(0, -1);
  else if (g.pin.length < 4) g.pin += k;
  if (g.pin.length === 4) { gateCheck(); return; }
  refreshSheet();
}

async function gateCheck() {
  const g = state.ui.gate;
  let tok = null;
  try { tok = await window.UnoLive.verifyPin(g.pin); } catch (e) { g.err = e.ar || e.message; }
  if (tok) {
    state.ui.lastManagerToken = tok;
    const resolve = g.resolve;
    state.ui.gate = null;
    closeSheet();
    toast(T('تمت الموافقة بواسطة مدير', 'Approved by manager'), 'ok', 2000);
    if (resolve) resolve(true);
    return;
  }
  g.tries++;
  g.pin = '';
  if (g.tries >= 3) { g.lockedUntil = Date.now() + 30000; }
  refreshSheet();
  if (g.err) toast(g.err, 'bad', 3000);
}

function gateCancel() {
  const g = state.ui.gate;
  state.ui.gate = null;
  closeSheet();
  if (g && g.resolve) g.resolve(false);
}

/* ---------------------------------------------------------- 30. Open price */
SHEETS['open-price'] = function () {
  return {
    title: T('صنف مفتوح السعر', 'Open-price item'),
    sub: T('للبيع بسرعة لصنف مش في الكتالوج', 'For a quick sale of an item outside the catalog'),
    center: true, width: 460,
    body: `<div class="field"><label for="opName">${T('الاسم', 'Name')}</label>
        <input class="input" id="opName" data-act="op-name" placeholder="${T('مثال: خدمة تغليف', 'e.g. packing service')}"></div>
      <div class="field"><label for="opPrice">${T('السعر', 'Price')} (${cur()})</label>
        <input class="input num" id="opPrice" inputmode="decimal" data-act="op-price" placeholder="0.00"></div>
      <div class="hint">${T('الخصم على السعر يحتاج صلاحية تعديل سعر.', 'Discounting the price needs the price-override permission.')}</div>`,
    foot: `<button class="btn is-ghost" data-act="close-sheet">${T('إلغاء', 'Cancel')}</button>
      <div class="grow"></div>
      <button class="btn is-primary" data-act="op-add">${T('إضافة', 'Add')}</button>`
  };
};

/* ---------------------------------------------------------------- 31. Help */
SHEETS.help = function () {
  const keys = [
    ['F1', T('المساعدة', 'Help')], ['F2', T('دفع', 'Pay')],
    ['F3', T('تعليق / استئناف', 'Hold / resume')], ['F4', T('عميل', 'Customer')],
    ['F5', T('خصم', 'Discount')], ['F6', T('مسح / إدخال باركود', 'Scan / manual barcode')],
    ['F7', T('وزن', 'Weight')], ['F8', T('استرجاع', 'Returns')],
    ['F9', T('فتح الدرج', 'Open drawer')], ['F10', T('إعادة طباعة', 'Reprint')],
    ['/', T('تركيز البحث', 'Focus search')], ['Enter', T('تأكيد', 'Confirm')],
    ['+ / −', T('كمية السطر', 'Line quantity')], ['Del', T('حذف السطر', 'Delete line')],
    ['Esc', T('إغلاق', 'Close')]
  ];
  const role = ROLES[(state.shift && state.shift.cashierRole) || 'cashier'];
  const body = `
    <div class="kbd-list">${keys.map(([k, v]) => `<div><kbd>${k}</kbd><span>${v}</span></div>`).join('')}</div>
    <div class="field" style="margin-top:6px">
      <label>${T('مفاتيح صلاحيات الكاشير — تُفحص في الخادم', 'Cashier permission keys — enforced on the server')}</label>
      <div class="perm-list">
        ${Object.keys(PERMS).map((k) => `<div class="perm"><code>${k}</code>
          <span class="state badge ${role.keys.includes(k) ? 'is-ok' : 'is-bad'}">${role.keys.includes(k) ? T('متاح', 'granted') : T('محتاج مدير', 'manager')}</span></div>`).join('')}
      </div>
    </div>
    <div class="field">
      <label>${T('عرض', 'Display')}</label>
      <div class="row wrap">
        <button class="btn is-sm" data-act="theme">${state.theme === 'dark' ? '☀ ' + T('نهاري', 'Light') : '🌙 ' + T('ليلي', 'Dark')}</button>
        <button class="btn is-sm" data-act="lang">${LANG === 'ar' ? 'EN' : 'ع'}</button>
        <button class="btn is-sm" data-act="density">${T('كثافة', 'Density')}: ${state.density}</button>
        <button class="btn is-sm" data-act="offline-toggle">${state.online ? T('جرّب الأوفلاين', 'Simulate offline') : T('رجّع الاتصال', 'Go back online')}</button>
        <button class="btn is-sm" data-act="display">${T('شاشة العميل', 'Customer display')}</button>
        <button class="btn is-sm is-danger" data-act="reset">${T('إعادة ضبط البيانات', 'Reset demo data')}</button>
      </div>
    </div>
    <div class="card">
      <div style="font-size:12px;color:var(--uno-text-2);margin-bottom:6px">${T('طبقة الاتصال', 'Transport')}</div>
      <div class="perm-list">
        ${RPC.names.map((n) => `<div class="perm"><code>${n}</code><span class="state badge is-info">RPC</span></div>`).join('')}
      </div>
      <div class="hint" style="margin-top:6px">${T('مفيش كتابة مباشرة على الجداول من الواجهة. النسخة دي تجريبية ببيانات وهمية.', 'No direct table writes from the UI. This build runs on demo data only.')}</div>
    </div>`;
  return { title: T('المساعدة والاختصارات', 'Help & shortcuts'), body, center: true, width: 720 };
};

/* ------------------------------------------------------------ 32. More menu */
SHEETS.more = function () {
  const items = [
    ['drawer', 'drawer', T('حركات الدرج', 'Drawer movements'), 'F9'],
    ['shift', 'shift', T('إغلاق الوردية', 'Close shift'), ''],
    ['returns', 'ret', T('استرجاع', 'Returns'), 'F8'],
    ['scan', 'barcode', T('مسح / إدخال باركود', 'Scan / barcode'), 'F6'],
    ['receipt', 'receipt', T('آخر إيصال', 'Last receipt'), 'F10'],
    ['display', 'display', T('شاشة العميل', 'Customer display'), ''],
    ['help', 'help', T('المساعدة', 'Help'), 'F1']
  ];
  return {
    title: T('المزيد', 'More'),
    body: `<div class="ret-lines">
      ${items.map(([id, ic, label, k]) => `<button class="ret-line" data-act="go" data-id="${id}" style="text-align:start">
        <span class="r-name">${ico(ic, 17)} ${label}</span>
        <span class="r-sub">${k ? `<kbd>${k}</kbd>` : ''}</span>
      </button>`).join('')}
      <button class="ret-line" data-act="void-invoice" style="text-align:start">
        <span class="r-name">${ico('close', 18)} ${T('إلغاء آخر فاتورة', 'Void the last invoice')}</span>
        <span class="r-sub">${T('مستند عكسي + مدير', 'reversal + manager')}</span>
      </button>
    </div>`,
    foot: `<button class="btn is-ghost is-block" data-act="close-sheet">${T('إغلاق', 'Close')}</button>`
  };
};

/* ------------------------------------------------- 33. Void invoice (reverse) */
function voidLastInvoice() {
  const inv = state.lastReceipt || state.invoices[0];
  if (!inv) { toast(T('مفيش فاتورة.', 'No invoice.'), 'bad'); return; }
  requestManager('pos.invoice.void', `${T('إلغاء فاتورة', 'Void invoice')} ${inv.number}`).then(async (ok) => {
    if (!ok) return;
    try {
      await RPC.call('invoice_void', {
        invoice_id: inv.id, reason: 'cashier_error', refund_mode: 'drawer',
        manager_token: state.ui.lastManagerToken
      });
      renderAll(); save();
      toast(T('الفاتورة اتلغت بمستند عكسي، والأصل باقي في السجل.', 'Invoice voided with a reversing document; the original stays in the log.'), 'ok', 4000);
    } catch (e) { toast(LANG === 'ar' ? e.ar : e.en, 'bad'); }
  });
}

/* ------------------------------------------------------- 34. Action routing */
function onAction(act, node) {
  const id = node.dataset.id;
  const d = node.dataset;
  switch (act) {
    /* catalog */
    case 'cat': state.category = id; renderRail(); renderGrid(); break;
    case 'filter': state.filter = id; renderGrid(); break;
    case 'add': addProduct(id); break;
    case 'select-line': state.selected = id; renderCart(); break;
    case 'qty': changeQty(id, Number(d.d)); break;
    case 'open-price': openSheet('open-price'); break;
    /* payment */
    case 'method': state.ui.payMethod = d.m; refreshSheet(); break;
    case 'pad': padKey(d.k); break;
    case 'quick': state.ui.paidInput = String(Number(d.amt) / 100); refreshSheet(); break;
    case 'split-add': addSplit(); break;
    case 'split-del': state.ui.payRows.splice(Number(d.i), 1); refreshSheet(); break;
    case 'pay-confirm-open': openPayment(); break;
    case 'pay-confirm': commitSale(false); break;
    case 'toggle-print': state.ui.printReceipt = !state.ui.printReceipt; break;
    case 'toggle-wa': state.ui.sendWhatsapp = !state.ui.sendWhatsapp; break;
    /* receipt */
    case 'print-receipt': printReceipt(); break;
    case 'wa-receipt': toast(T('رابط الإيصال جاهز للإرسال على واتساب (تجريبي).', 'Receipt link ready for WhatsApp (demo).'), 'ok'); break;
    case 'rc-tpl': try { localStorage.setItem('uno_rc_tpl', id); } catch (e) {} refreshSheet(); break;
    case 'new-sale': closeSheet(); renderAll(); break;
    /* returns */
    case 'ret-search': state.ui.ret.query = node.value; refreshSheet(); break;
    case 'ret-pick': state.ui.ret.invoiceId = id; refreshSheet(); break;
    case 'ret-back': state.ui.ret.invoiceId = null; refreshSheet(); break;
    case 'ret-qty': {
      const r = state.ui.ret;
      const inv = state.invoices.find((i) => i.id === r.invoiceId);
      const line = inv.lines.find((l) => l.product_id === d.p);
      const step = line.qty_kind === 'weight' ? incOf(line.product_id) : 1;
      const curQty = r.lines[d.p] || 0;
      const max = line.qty - returnedQtyFor(inv.id, d.p);
      r.lines[d.p] = Math.max(0, Math.min(max, curQty + Number(d.d) * step));
      refreshSheet(); break;
    }
    case 'ret-reason': state.ui.ret.reason = id; refreshSheet(); break;
    case 'ret-method': state.ui.ret.method = id; refreshSheet(); break;
    case 'ret-restock': state.ui.ret.restock = node.checked; break;
    case 'ret-confirm': commitReturn(); break;
    /* shift */
    case 'count': state.ui.count[d.d] = Number(node.value) || 0; refreshSheet(); break;
    case 'shift-reveal': state.ui.reveal = true; refreshSheet(); break;
    case 'shift-hide': state.ui.reveal = false; refreshSheet(); break;
    case 'shift-close': closeShift(); break;
    case 'print-z': printZ(); break;
    case 'open-shift': openSheet('open-shift'); break;
    case 'shift-open': openShift(); break;
    /* drawer */
    case 'move-type': state.ui.move.type = id; state.ui.move.reason = null; refreshSheet(); break;
    case 'move-amount': state.ui.move.amount = node.value; break;
    case 'move-reason': state.ui.move.reason = id; refreshSheet(); break;
    case 'move-note': state.ui.move.note = node.value; break;
    case 'move-submit': submitMove(); break;
    /* held */
    case 'tab-go': tabSwitch(+id); break;
    case 'tab-new': tabNew(); break;
    case 'tab-x': tabClose(+id); break;
    case 'hold': holdCart(); break;
    case 'resume': resumeHeld(id); break;
    /* scan */
    case 'scan-create': {
      const code = state.ui.scanMiss || '';
      state.ui.openPriceBarcode = code;
      toast(T('افتح شاشة الأصناف لإضافة الصنف بالباركود.', 'Open the products screen to create the item with this barcode.'), 'ok', 3200);
      break;
    }
    case 'scan-search': closeSheet(); el('searchInput').focus(); break;
    case 'manual-submit': {
      const v = (el('manualCode') || {}).value || '';
      if (v) handleScan(v.trim());
      break;
    }
    /* weight */
    case 'weight-pick': state.ui.weightProduct = node.value; state.ui.weightRaw = null; refreshSheet(); break;
    case 'weight-input': state.ui.weightRaw = node.value; state.ui.weightGrams = Math.round(parseDec(node.value) * 1000); refreshSheet(); break;
    case 'weight-add': {
      const p = state.products.find((x) => x.id === (state.ui.weightProduct || (state.products.find((y) => y.weighted) || {}).id));
      if (p) addProduct(p.id, state.ui.weightGrams || 250, { silent: true });
      closeSheet();
      break;
    }
    /* customer */
    case 'cust-search': state.ui.custQuery = node.value; refreshSheet(); break;
    case 'cust-pick': setCustomer(id || null); closeSheet(); break;
    case 'cust-new': toast(T('إضافة عميل من شاشة العملاء في أونو كور.', 'New customers are created in the UNO Core customers screen.'), 'ok', 3000); break;
    /* discount */
    case 'disc-target': state.ui.disc.target = id; refreshSheet(); break;
    case 'disc-kind': state.ui.disc.kind = id; refreshSheet(); break;
    case 'disc-value': state.ui.disc.value = node.value; break;
    case 'disc-apply': applyDiscount(); break;
    /* gate */
    case 'gate-key': gateKey(d.k); break;
    case 'gate-ok': gateCheck(); break;
    case 'gate-cancel': gateCancel(); break;
    /* open price */
    case 'op-add': {
      const name = (el('opName') || {}).value || T('صنف مفتوح السعر', 'Open-price item');
      const price = Math.round(parseFloat((el('opPrice') || {}).value || '0') * 100);
      if (!(price > 0)) { toast(T('اكتب سعر.', 'Enter a price.'), 'bad'); return; }
      const line = { id: 'l-' + (++state.seq), productId: 'open-' + Date.now(), ar: name, en: name,
        unitPrice: price, qty: 1, qtyKind: 'unit', discount: 0, note: '', priceOverride: true, openPrice: true };
      state.cart.lines.push(line);
      state.selected = line.id;
      closeSheet(); renderCart(); renderDock(); postDisplay();
      break;
    }
    /* navigation */
    case 'go': {
      const target = id;
      if (target === 'display') { window.open(location.pathname + '?lang=' + LANG + '#display', '_blank'); break; }
      if (target === 'shift') { openShiftClose(); break; }
      if (target === 'discount') { openDiscount(); break; }
      if (target === 'customer') { openSheet('customer'); break; }
      if (target === 'receipt') { reprintLast(); break; }
      openSheet(target); break;
    }
    case 'void-invoice': voidLastInvoice(); break;
    case 'weight': openSheet('weight'); break;
    case 'more': openSheet('more'); break;
    /* settings */
    case 'theme': state.theme = state.theme === 'dark' ? 'light' : 'dark'; renderAll(); refreshSheet(); save(); break;
    case 'lang': setLang(LANG === 'ar' ? 'en' : 'ar'); break;
    case 'density': state.density = state.density === 'comfortable' ? 'compact' : state.density === 'compact' ? 'large' : 'comfortable';
      document.documentElement.dataset.density = state.density; refreshSheet(); save(); break;
    case 'offline-toggle': toggleOnline(); refreshSheet(); break;
    case 'reset': resetDemo(); break;
    case 'close-sheet': closeSheet(); break;
    case 'toggle-cart': {
      const c = el('cart');
      if (c) c.classList.toggle('is-open');
      break;
    }
    default: break;
  }
}

function initActions() {
  document.addEventListener('pointerdown', () => { state.touched = true; }, { once: true });
  document.addEventListener('click', (e) => {
    const node = e.target.closest('[data-act]');
    if (!node) {
      if (e.target.id === 'scrim') closeSheet();
      return;
    }
    const act = node.dataset.act;
    /* input-driven actions are handled on input/change, not click */
    if (['ret-search', 'count', 'move-amount', 'move-note', 'cust-search', 'disc-value', 'weight-input', 'manual-code'].includes(act)) return;
    if (act === 'ret-restock') return;
    e.preventDefault();
    e.stopPropagation();
    onAction(act, node);
  }, false);

  document.addEventListener('input', (e) => {
    const node = e.target.closest('[data-act]');
    if (!node) return;
    const act = node.dataset.act;
    if (act === 'ret-search') { state.ui.ret.query = node.value; refreshSheet(); retLookup(node.value); }
    else if (act === 'count') { state.ui.count[node.dataset.d] = Number(node.value) || 0; refreshSheet(); }
    else if (act === 'move-amount') state.ui.move.amount = node.value;
    else if (act === 'move-note') state.ui.move.note = node.value;
    else if (act === 'cust-search') { state.ui.custQuery = node.value; refreshSheet(); }
    else if (act === 'disc-value') state.ui.disc.value = node.value;
    else if (act === 'weight-input') { state.ui.weightRaw = node.value; state.ui.weightGrams = Math.round(parseDec(node.value) * 1000); refreshSheet(); }
  }, false);

  document.addEventListener('change', (e) => {
    const node = e.target.closest('[data-act]');
    if (!node) return;
    if (node.dataset.act === 'ret-restock') { state.ui.ret.restock = node.checked; }
    if (node.dataset.act === 'weight-pick') { state.ui.weightProduct = node.value; refreshSheet(); }
  }, false);

  /* search box */
  const search = el('searchInput');
  let t = null;
  search.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      state.query = search.value;
      renderGrid();
      if (search.value.trim().length >= 4) {
        const exact = state.products.find((p) => p.barcode === search.value.trim());
        if (exact) { addProduct(exact.id); search.value = ''; state.query = ''; renderGrid(); }
      }
    }, 120);
  });
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = visibleProducts()[0];
      if (first) { addProduct(first.id); search.value = ''; state.query = ''; renderGrid(); }
    }
    if (e.key === 'Escape') { search.value = ''; state.query = ''; renderGrid(); search.blur(); }
  });

  el('cartHead').addEventListener('click', (e) => {
    if (e.target.closest('[data-act]')) return;
    if (window.innerWidth <= 1023) el('cart').classList.toggle('is-open');
  });
  el('cartNote').addEventListener('click', () => {
    const v = prompt(T('ملاحظة على الفاتورة', 'Invoice note'), state.cart.note || '');
    if (v !== null) { state.cart.note = v; renderCart(); }
  });
  el('scrim').addEventListener('click', closeSheet);
}

/* --------------------------------------------------------------- 35. Boot */
function setLang(lang) {
  state.lang = lang; LANG = lang;
  renderAll(); refreshSheet(); postDisplay(); save();
}

function readParams() {
  const p = new URLSearchParams(location.search);
  if (p.get('lang') === 'en') LANG = 'en';
  if (p.get('theme') === 'light') state.theme = 'light';
  if (p.get('density')) state.density = p.get('density');
  state.lang = LANG;
  return p;
}

async function boot() {
  const params = readParams();
  load();
  document.body.style.visibility = 'hidden';
  try { await window.UnoLive.init(); } catch (e) { document.body.style.visibility = ''; document.body.innerHTML = '<p style="padding:24px;font-family:sans-serif">تعذر تحميل البيانات: ' + esc(e.message) + '</p>'; return; }
  document.body.style.visibility = '';
  state.lang = LANG;
  if (params.get('lang') === 'en') state.lang = 'en';
  if (params.get('theme')) state.theme = params.get('theme');
  if (params.get('density')) state.density = params.get('density');
  if (params.get('online') === '0') state.online = false;
  LANG = state.lang;

  state.audit = state.audit || [];
  state.view = location.hash === '#display' ? 'display' : 'pos';
  /* theme + direction must be on <html> before the display view returns early */
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.lang = state.lang;
  document.documentElement.dir = isRTL() ? 'rtl' : 'ltr';

  if (state.view === 'display') {
    document.body.classList.add('is-display');
    el('appRoot').style.display = 'none';
    el('displayRoot').style.display = 'flex';
    renderDisplay({ idle: true });
    initDisplayChannel();
    try {
      const saved = JSON.parse(localStorage.getItem('uno-pos-display') || 'null');
      if (saved && saved.payload) renderDisplay(saved.payload);
    } catch (e) {}
    return;
  }

  renderAll();
  initActions();
  initKeyboard();
  initDisplayChannel();
  startClock();
  postDisplay();

  /* deep links for verification: #pay #returns #shift #drawer #held #scan #help #gate #receipt */
  const hash = location.hash.replace('#', '');
  if (hash && SHEETS[hash]) {
    setTimeout(() => {
      if (hash === 'pay') openPayment();
      else if (hash === 'returns') openReturns();
      else if (hash === 'shift') openShiftClose();
      else if (hash === 'drawer') openDrawer();
      else openSheet(hash);
    }, 120);
  }
}

document.addEventListener('DOMContentLoaded', boot);
