/*!
 * Uno Store — core (shared config, Arabic/English strings, money + date helpers,
 * and the RPC wrapper).
 *
 * Plain script, no build step, no dependencies. Load it before store-checkout.js
 * or store-postpurchase.js.
 *
 *   <script src="assets/store-core.js"></script>
 *
 * Backend access goes through exactly five RPC names the store builder publishes:
 *   store_search, store_variants_get, store_shipping_rates, store_order_create,
 *   store_order_track
 * Point them at the real transport once; until then the built-in mock answers:
 *
 *   UnoStore.configure({ rpc: { store_shipping_rates: p => supabase.rpc('store_shipping_rates', p) } });
 *
 * Any name without a real transport falls back to mock data and every mock answer
 * carries `mock: true`, which the UI surfaces honestly instead of pretending.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';

  var config = {
    lang: 'ar',              // 'ar' | 'en'
    theme: 'dark',           // 'dark' | 'light' | 'auto'
    currency: 'EGP',
    hotline: '01505946321',  // Uno Technology Services, confirmed by Hossam
    whatsapp: '201505946321',
    storeHome: 'store.html',
    cartKey: 'uno_cart',
    lastOrderKey: 'uno_last_order',
    returnWindowDays: 14,
    rpc: {},                 // name -> function(params) => Promise
    getCart: null,           // () => [{variant_id, qty}]
    onOrderCreated: null     // (order) => void
  };

  /* ------------------------------------------------------------------ *
   * Strings. Every Arabic string lives here; the English pair sits next
   * to it so a missing translation is a build-time miss, not a leak into
   * the Arabic UI. t() only ever returns the active language.
   * ------------------------------------------------------------------ */

  var dict = {
    ar: {
      'common.back': 'رجوع',
      'common.close': 'إغلاق',
      'common.cancel': 'إلغاء',
      'common.retry': 'حاول تاني',
      'common.copy': 'نسخ',
      'common.copied': 'تم النسخ',
      'common.loading': 'لحظة…',
      'common.optional': 'اختياري',
      'common.required': 'مطلوب',
      'common.yes': 'نعم',
      'common.no': 'لا',
      'common.egp': 'ج.م',
      'common.demo': 'بيانات تجريبية',
      'common.demo_note': 'أسعار الشحن والطلبات هنا تجريبية لحد ما يتوصل بيكيا بيانات المتجر الحقيقية.',
      'common.support': 'محتاج مساعدة؟',
      'common.call_us': 'اتصل بينا',
      'common.whatsapp': 'واتساب',
      'common.error_generic': 'حصلت مشكلة، جرّب تاني.',
      'common.error_network': 'مفيش اتصال بالإنترنت. اتأكد من الشبكة وجرّب تاني.',
      'common.field_required': 'الحقل ده مطلوب.',
      'common.phone_invalid': 'اكتب رقم موبايل مصري صحيح، مثال: 01012345678.',
      'common.email_invalid': 'اكتب بريد إلكتروني صحيح.',
      'common.not_found': 'مفيش نتيجة بالبيانات دي.',
      'common.secure': 'بياناتك بتتبعت مشفّرة.',
      'common.weight': 'الوزن',
      'common.gram': 'جم',
      'common.day': 'يوم',
      'common.days': 'أيام',
      'common.working_days': 'أيام عمل',
      'common.eta_between': 'من {min} إلى {max} أيام عمل',
      'co.subtotal': 'الإجمالي الفرعي',
      'co.shipping': 'الشحن',
      'co.discount': 'الخصم',
      'co.total': 'الإجمالي',
      'co.rate_free': 'مجاني',
      'co.payment_cod': 'الدفع عند الاستلام',
      'co.phone': 'رقم الموبايل',
      'common.eta_same_day': 'نفس اليوم',
      'common.eta_next_day': 'يوم عمل واحد',
      'common.skip_to_content': 'تخطَّ إلى المحتوى'
    },
    en: {
      'common.back': 'Back',
      'common.close': 'Close',
      'common.cancel': 'Cancel',
      'common.retry': 'Try again',
      'common.copy': 'Copy',
      'common.copied': 'Copied',
      'common.loading': 'One moment…',
      'common.optional': 'optional',
      'common.required': 'required',
      'common.yes': 'Yes',
      'common.no': 'No',
      'common.egp': 'EGP',
      'common.demo': 'Demo data',
      'common.demo_note': 'Shipping rates and orders here are demo data until the real store data is connected.',
      'common.support': 'Need help?',
      'common.call_us': 'Call us',
      'common.whatsapp': 'WhatsApp',
      'common.error_generic': 'Something went wrong. Please try again.',
      'common.error_network': 'No connection. Check your network and try again.',
      'common.field_required': 'This field is required.',
      'common.phone_invalid': 'Enter a valid Egyptian mobile number, e.g. 01012345678.',
      'common.email_invalid': 'Enter a valid email address.',
      'common.not_found': 'Nothing found for those details.',
      'common.secure': 'Your details are sent encrypted.',
      'common.weight': 'Weight',
      'common.gram': 'g',
      'common.day': 'day',
      'common.days': 'days',
      'common.working_days': 'working days',
      'common.eta_between': '{min}–{max} working days',
      'co.subtotal': 'Subtotal',
      'co.shipping': 'Shipping',
      'co.discount': 'Discount',
      'co.total': 'Total',
      'co.rate_free': 'Free',
      'co.payment_cod': 'Cash on delivery',
      'co.phone': 'Mobile number',
      'common.eta_same_day': 'same day',
      'common.eta_next_day': 'next working day',
      'common.skip_to_content': 'Skip to content'
    }
  };

  function t(key, vars) {
    var table = dict[config.lang] || dict.ar;
    var value = table[key];
    if (value === undefined) {
      // Fall back loudly in development, silently for the visitor: a missing
      // Arabic key must never print English into the Arabic UI.
      if (global.console && console.warn) console.warn('[uno-store] missing string:', key);
      value = (dict.ar[key] !== undefined ? dict.ar[key] : key);
    }
    if (vars) {
      value = value.replace(/\{(\w+)\}/g, function (m, name) {
        return vars[name] === undefined ? m : String(vars[name]);
      });
    }
    return value;
  }

  function extendDict(extra) {
    ['ar', 'en'].forEach(function (lang) {
      if (!extra[lang]) return;
      Object.keys(extra[lang]).forEach(function (k) { dict[lang][k] = extra[lang][k]; });
    });
  }

  /* ------------------------------------------------------------------ *
   * Formatting. Arabic UI keeps Latin digits (Egyptian retail convention)
   * with Arabic month names and the ج.م currency mark.
   * ------------------------------------------------------------------ */

  var numLocale = function () {
    return config.lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-EG';
  };

  function money(value, opts) {
    var n = Number(value || 0);
    var text;
    try {
      text = new Intl.NumberFormat(numLocale(), {
        minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
        maximumFractionDigits: 2
      }).format(n);
    } catch (e) {
      text = String(Math.round(n * 100) / 100);
    }
    if (opts && opts.bare) return text;
    return text + ' ' + t('common.egp');
  }

  function date(iso, opts) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    try {
      return new Intl.DateTimeFormat(numLocale(), {
        day: 'numeric', month: 'long', year: 'numeric'
      }).format(d);
    } catch (e) { return d.toISOString().slice(0, 10); }
  }

  function dateTime(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    try {
      return new Intl.DateTimeFormat(numLocale(), {
        day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit'
      }).format(d);
    } catch (e) { return date(iso); }
  }

  function etaText(rate) {
    if (!rate) return '';
    if (rate.eta_min_days === 0 && rate.eta_max_days === 0) return t('common.eta_same_day');
    if (rate.eta_min_days === rate.eta_max_days) {
      return rate.eta_max_days === 1 ? t('common.eta_next_day')
        : t('common.eta_between', { min: rate.eta_max_days, max: rate.eta_max_days });
    }
    return t('common.eta_between', { min: rate.eta_min_days, max: rate.eta_max_days });
  }

  function normalizePhone(raw) {
    var digits = String(raw || '').replace(/[^\d+]/g, '');
    if (digits.indexOf('+20') === 0) digits = '0' + digits.slice(3);
    else if (digits.indexOf('0020') === 0) digits = '0' + digits.slice(4);
    else if (digits.indexOf('20') === 0 && digits.length === 12) digits = '0' + digits.slice(2);
    return digits;
  }

  function isEgyptianMobile(raw) {
    return /^01[0125]\d{8}$/.test(normalizePhone(raw));
  }

  /* ------------------------------------------------------------------ *
   * Mock backend. Shapes mirror what the builder will publish so the real
   * transport is a drop-in swap. Nothing here is real stock, price or data.
   * ------------------------------------------------------------------ */

  var CATEGORY_ICONS = {
    camera: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="6" y="14" width="30" height="20" rx="4" stroke="currentColor" stroke-width="2.4"/><path d="M36 20l6-3v14l-6-3" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><circle cx="18" cy="24" r="4.5" stroke="currentColor" stroke-width="2.4"/></svg>',
    router: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="6" y="24" width="36" height="14" rx="4" stroke="currentColor" stroke-width="2.4"/><path d="M13 24V18m8 6V14m8 10v-8m8 8v-4" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="14" cy="31" r="1.8" fill="currentColor"/><circle cx="20" cy="31" r="1.8" fill="currentColor"/></svg>',
    battery: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="12" y="8" width="24" height="32" rx="5" stroke="currentColor" stroke-width="2.4"/><path d="M21 16l-3 9h5l-2 8 7-11h-5l2-6z" fill="currentColor"/><path d="M20 4h8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'
  };

  var GOV = [
    ['cairo', 'القاهرة', 'Cairo', 65, 2, 3],
    ['giza', 'الجيزة', 'Giza', 65, 2, 3],
    ['alexandria', 'الإسكندرية', 'Alexandria', 70, 2, 4],
    ['qalyubia', 'القليوبية', 'Qalyubia', 65, 2, 4],
    ['port-said', 'بورسعيد', 'Port Said', 70, 3, 4],
    ['suez', 'السويس', 'Suez', 70, 3, 4],
    ['ismailia', 'الإسماعيلية', 'Ismailia', 70, 3, 4],
    ['damietta', 'دمياط', 'Damietta', 70, 3, 4],
    ['dakahlia', 'الدقهلية', 'Dakahlia', 70, 3, 4],
    ['sharqia', 'الشرقية', 'Sharqia', 70, 3, 4],
    ['gharbia', 'الغربية', 'Gharbia', 70, 3, 4],
    ['monufia', 'المنوفية', 'Monufia', 70, 3, 4],
    ['beheira', 'البحيرة', 'Beheira', 75, 3, 5],
    ['kafr-el-sheikh', 'كفر الشيخ', 'Kafr el-Sheikh', 75, 3, 5],
    ['fayoum', 'الفيوم', 'Fayoum', 70, 3, 5],
    ['beni-suef', 'بني سويف', 'Beni Suef', 65, 3, 4],
    ['minya', 'المنيا', 'Minya', 65, 3, 5],
    ['asyut', 'أسيوط', 'Asyut', 60, 3, 4],
    ['sohag', 'سوهاج', 'Sohag', 55, 2, 4],
    ['qena', 'قنا', 'Qena', 50, 2, 3],
    ['luxor', 'الأقصر', 'Luxor', 60, 3, 4],
    ['aswan', 'أسوان', 'Aswan', 65, 3, 5],
    ['red-sea', 'البحر الأحمر', 'Red Sea', 95, 4, 6],
    ['new-valley', 'الوادي الجديد', 'New Valley', 95, 5, 7],
    ['matrouh', 'مطروح', 'Matrouh', 90, 4, 6],
    ['north-sinai', 'شمال سيناء', 'North Sinai', 95, 4, 7],
    ['south-sinai', 'جنوب سيناء', 'South Sinai', 95, 4, 7]
  ];

  var MOCK = {
    variants: {
      'v-cam-4mp': {
        id: 'v-cam-4mp', product_id: 'p-cam-4mp', sku: 'UNO-CAM-4MP',
        name_ar: 'كاميرا مراقبة داخلية 4 ميجا بكسل', name_en: 'Indoor security camera, 4 MP',
        variant_ar: 'العدسة: 2.8 مم', variant_en: 'Lens: 2.8 mm',
        price: 1450, compare_at: 1690, stock: 7, weight_g: 900,
        warranty_months: 24, icon: 'camera'
      },
      'v-router-ac': {
        id: 'v-router-ac', product_id: 'p-router-ac', sku: 'UNO-RTR-AC2',
        name_ar: 'راوتر لاسلكي ثنائي النطاق', name_en: 'Dual-band wireless router',
        variant_ar: 'الإصدار: 1200 ميجابت', variant_en: 'Model: 1200 Mbps',
        price: 2350, compare_at: null, stock: 4, weight_g: 700,
        warranty_months: 12, icon: 'router'
      },
      'v-power-20k': {
        id: 'v-power-20k', product_id: 'p-power-20k', sku: 'UNO-PWB-20K',
        name_ar: 'باور بانك 20,000 مللي أمبير', name_en: 'Power bank, 20,000 mAh',
        variant_ar: 'اللون: أسود', variant_en: 'Colour: black',
        price: 950, compare_at: 1100, stock: 12, weight_g: 400,
        warranty_months: 6, icon: 'battery'
      }
    },
    branches: [
      {
        id: 'br-farshout', name_ar: 'فرع فرشوط', name_en: 'Farshout branch',
        city_ar: 'فرشوط، قنا', city_en: 'Farshout, Qena',
        address_ar: 'شارع الجمهورية، فرشوط، قنا', address_en: 'Gomhoria St, Farshout, Qena',
        hours_ar: 'السبت – الخميس، ١٠ ص – ١٠ م', hours_en: 'Sat – Thu, 10 am – 10 pm',
        ready_ar: 'الطلب جاهز للاستلام خلال ساعة من تأكيده', ready_en: 'Ready for pickup within an hour of confirmation'
      },
      {
        id: 'br-qena', name_ar: 'فرع قنا', name_en: 'Qena branch',
        city_ar: 'قنا', city_en: 'Qena',
        address_ar: 'شارع ٢٣ يوليو، قنا', address_en: '23 July St, Qena',
        hours_ar: 'السبت – الخميس، ١٠ ص – ٩ م', hours_en: 'Sat – Thu, 10 am – 9 pm',
        ready_ar: 'الطلب جاهز للاستلام خلال ساعتين من تأكيده', ready_en: 'Ready for pickup within two hours of confirmation'
      }
    ]
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function mockOrdersRead() {
    try { return JSON.parse(global.sessionStorage.getItem('uno_mock_orders') || '{}'); }
    catch (e) { return {}; }
  }

  function mockOrdersWrite(map) {
    try { global.sessionStorage.setItem('uno_mock_orders', JSON.stringify(map)); } catch (e) {}
  }

  function governorateList() {
    return GOV.map(function (g) {
      return {
        id: g[0],
        name_ar: g[1], name_en: g[2],
        base: g[3], eta_min_days: g[4], eta_max_days: g[5]
      };
    });
  }

  function govById(id) {
    var found = null;
    governorateList().forEach(function (g) { if (g.id === id) found = g; });
    return found;
  }

  function mockVariant(id) {
    var v = MOCK.variants[id];
    if (!v) return null;
    var out = clone(v);
    out.image_svg = CATEGORY_ICONS[v.icon] || '';
    out.mock = true;
    return out;
  }

  function mockOrder(state) {
    var placed = new Date();
    if (state === 'delivered') placed.setDate(placed.getDate() - 9);
    else if (state === 'shipped') placed.setDate(placed.getDate() - 2);
    else if (state === 'processing') placed.setDate(placed.getDate() - 1);

    var iso = function (dayOffset, hour) {
      var d = new Date(placed);
      d.setDate(d.getDate() + (dayOffset || 0));
      if (hour !== undefined) d.setHours(hour, 20, 0, 0);
      return d.toISOString();
    };

    var items = [
      Object.assign(mockVariant('v-cam-4mp'), { qty: 1 }),
      Object.assign(mockVariant('v-power-20k'), { qty: 2 })
    ];
    var subtotal = items.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    var shipping = 50;

    var deliveredAt = state === 'delivered' ? iso(3, 14) : null;

    return {
      number: 'UNO-261127-4821',
      phone: '01012345678',
      mock: true,
      status: state || 'placed',
      placed_at: placed.toISOString(),
      updated_at: state === 'delivered' ? iso(3, 14) : iso(0, 11),
      payment: { method: 'cod', label_ar: 'الدفع عند الاستلام', label_en: 'Cash on delivery', paid: state === 'delivered' },
      delivery: {
        method: 'home',
        governorate_id: 'qena',
        governorate_ar: 'قنا', governorate_en: 'Qena',
        address_ar: 'شارع الجمهورية، فرشوط، قنا', address_en: 'Gomhoria St, Farshout, Qena',
        eta_min_days: 2, eta_max_days: 3,
        carrier_ar: 'شركة الشحن', carrier_en: 'Courier'
      },
      items: items,
      totals: { subtotal: subtotal, shipping: shipping, discount: 0, total: subtotal + shipping },
      weight_g: items.reduce(function (s, i) { return s + i.weight_g * i.qty; }, 0),
      delivered_at: deliveredAt,
      timeline: [
        { key: 'placed', at: iso(0, 10), done: true },
        { key: 'confirmed', at: iso(0, 11), done: state !== 'placed' },
        { key: 'prepared', at: iso(1, 9), done: state === 'shipped' || state === 'delivered' },
        { key: 'shipped', at: iso(1, 17), done: state === 'shipped' || state === 'delivered' },
        { key: 'delivered', at: deliveredAt, done: state === 'delivered' }
      ]
    };
  }

  var mockHandlers = {
    store_search: function (p) {
      var q = String(p.q || '').trim();
      var hits = Object.keys(MOCK.variants).map(function (id) { return mockVariant(id); })
        .filter(function (v) { return !q || v.name_ar.indexOf(q) > -1 || v.name_en.toLowerCase().indexOf(q.toLowerCase()) > -1; });
      return { items: hits, total: hits.length, mock: true };
    },

    store_variants_get: function (p) {
      var ids = p.variant_ids || p.ids || [];
      var found = [];
      ids.forEach(function (id) {
        var v = mockVariant(id);
        if (v) found.push(v);
      });
      return { variants: found, mock: true };
    },

    store_shipping_rates: function (p) {
      var gov = govById(p.governorate);
      if (!gov) return { rates: [], mock: true };
      var extraKg = Math.max(0, (Number(p.weight_g || 0) - 1000) / 1000);
      var price = Math.round(gov.base + extraKg * 15);
      return {
        rates: [{
          id: 'std-' + gov.id,
          name_ar: 'توصيل للعنوان',
          name_en: 'Home delivery',
          price: price,
          eta_min_days: gov.eta_min_days,
          eta_max_days: gov.eta_max_days,
          carrier_ar: 'شريك الشحن',
          carrier_en: 'Courier partner',
          mock: true
        }],
        governorate: gov.id,
        weight_g: p.weight_g || 0,
        mock: true
      };
    },

    store_order_create: function (p) {
      var saved = mockOrdersRead();
      var items = p.items || [];
      var subtotal = 0, weight = 0;
      items.forEach(function (line) {
        var v = mockVariant(line.variant_id);
        if (!v) return;
        subtotal += v.price * line.qty;
        weight += v.weight_g * line.qty;
      });
      var shipping = p.delivery && p.delivery.method === 'pickup' ? 0 : (p.shipping_price || 0);
      var number = 'UNO-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' +
        String(Math.floor(1000 + Math.random() * 8999));
      var order = mockOrder('placed');
      order.number = number;
      order.phone = normalizePhone(p.customer && p.customer.phone);
      order.items = items.map(function (line) {
        var v = mockVariant(line.variant_id) || {};
        return Object.assign(v, { qty: line.qty });
      });
      order.totals = { subtotal: subtotal, shipping: shipping, discount: 0, total: subtotal + shipping };
      order.weight_g = weight;
      order.delivery = Object.assign(order.delivery, p.delivery || {});
      if (p.delivery && p.delivery.method === 'pickup') {
        var branch = MOCK.branches.filter(function (b) { return b.id === p.delivery.branch_id; })[0];
        order.delivery.branch = branch || MOCK.branches[0];
      }
      order.customer = { name: p.customer && p.customer.name, phone: order.phone, email: p.customer && p.customer.email };
      order.notes = p.notes || '';
      order.mock = true;
      saved[number] = order;
      mockOrdersWrite(saved);
      return order;
    },

    store_order_track: function (p) {
      var number = String(p.order_number || '').trim().toUpperCase();
      var phone = normalizePhone(p.phone);
      var mine = mockOrdersRead()[number];
      if (mine && (!phone || phone === mine.phone)) return { order: clone(mine), mock: true };
      var demo = mockOrder((p._state === 'delivered' ? 'delivered' : p._state === 'shipped' ? 'shipped' : 'placed'));
      var numbers = [demo.number, 'UNO-261120-7315'];
      if (numbers.indexOf(number) === -1 || (phone && phone !== demo.phone && phone !== '01098765432')) {
        var err = new Error('ORDER_NOT_FOUND');
        err.code = 'ORDER_NOT_FOUND';
        throw err;
      }
      demo.number = number;
      if (phone === '01098765432') demo = mockOrder('delivered');
      return { order: demo, mock: true };
    }
  };

  function rpc(name, params) {
    var real = config.rpc && config.rpc[name];
    if (typeof real === 'function') {
      return Promise.resolve().then(function () { return real(params || {}); });
    }
    var handler = mockHandlers[name];
    if (!handler) return Promise.reject(new Error('UNO_RPC_UNKNOWN:' + name));
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        try { resolve(clone(handler(params || {}))); }
        catch (e) { reject(e); }
      }, 140 + Math.random() * 160);
    });
  }

  /* ------------------------------------------------------------------ *
   * Small DOM helpers shared by both page modules.
   * ------------------------------------------------------------------ */

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v === true ? '' : v);
      });
    }
    (children || []).forEach(function (child) {
      if (child === null || child === undefined) return;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  function $(sel, root) { return (root || document).querySelector(sel); }

  function escapeHtml(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function applyTheme(root) {
    var theme = config.theme;
    if (theme === 'auto') {
      theme = global.matchMedia && global.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    var host = root || document.documentElement;
    host.setAttribute('data-theme', theme);
    host.setAttribute('lang', config.lang);
    host.setAttribute('dir', config.lang === 'ar' ? 'rtl' : 'ltr');
    // the checkout can sit inside a page that keeps its own theme; keep every
    // mounted root on the same one so the token block matches its own element
    Array.prototype.forEach.call(document.querySelectorAll('.uo-root'), function (node) {
      node.setAttribute('data-theme', theme);
      node.setAttribute('lang', config.lang);
      node.setAttribute('dir', config.lang === 'ar' ? 'rtl' : 'ltr');
    });
  }

  function configure(patch) {
    if (!patch) return config;
    Object.keys(patch).forEach(function (k) {
      if (k === 'rpc') config.rpc = Object.assign({}, config.rpc, patch.rpc);
      else if (patch[k] !== undefined) config[k] = patch[k];
    });
    applyTheme();
    return config;
  }

  function getCart() {
    if (typeof config.getCart === 'function') return config.getCart();
    try {
      var raw = global.localStorage.getItem(config.cartKey);
      var parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  }

  function setCart(lines) {
    try { global.localStorage.setItem(config.cartKey, JSON.stringify(lines)); } catch (e) {}
  }

  function saveLastOrder(order) {
    try { global.sessionStorage.setItem(config.lastOrderKey, JSON.stringify(order)); } catch (e) {}
  }

  function readLastOrder() {
    try {
      var raw = global.sessionStorage.getItem(config.lastOrderKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function query(name) {
    try { return new URLSearchParams(global.location.search).get(name); } catch (e) { return null; }
  }

  function whatsappLink(text) {
    return 'https://wa.me/' + config.whatsapp + '?text=' + encodeURIComponent(text);
  }

  var i18n = {
    t: t,
    extend: extendDict,
    dict: dict,
    missingKeys: function (lang) {
      var target = lang || 'ar';
      return Object.keys(dict[target]).filter(function (k) { return !dict.ar[k] || !dict.en[k]; });
    },
    latinLeaks: function () {
      return Object.keys(dict.ar).filter(function (k) {
        return /[A-Za-z]/.test(dict.ar[k].replace(/\{[a-z_]+\}/g, ''));
      });
    }
  };

  global.UnoStore = {
    version: VERSION,
    config: config,
    configure: configure,
    rpc: rpc,
    t: t,
    i18n: i18n,
    money: money,
    date: date,
    dateTime: dateTime,
    etaText: etaText,
    normalizePhone: normalizePhone,
    isEgyptianMobile: isEgyptianMobile,
    governorates: governorateList,
    branches: function () { return clone(MOCK.branches); },
    el: el,
    $: $,
    escapeHtml: escapeHtml,
    applyTheme: applyTheme,
    getCart: getCart,
    setCart: setCart,
    saveLastOrder: saveLastOrder,
    readLastOrder: readLastOrder,
    query: query,
    whatsappLink: whatsappLink,
    icons: CATEGORY_ICONS
  };
})(window);
