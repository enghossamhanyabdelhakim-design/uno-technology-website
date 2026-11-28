/*!
 * Uno Store — one-page checkout (Arabic-first, RTL, COD first).
 *
 * Mount:
 *   <div id="uno-checkout"></div>
 *   <script src="assets/store-core.js"></script>
 *   <script src="assets/store-checkout.js"></script>
 *   <script>UnoStore.Checkout.init({ root: '#uno-checkout' });</script>
 *
 * Backend: store_variants_get, store_shipping_rates, store_order_create.
 * Prices, stock and shipping always come from the RPC, never from the cart blob.
 */
(function (global) {
  'use strict';

  var U = global.UnoStore;
  if (!U) throw new Error('uno-store: load store-core.js first');

  U.i18n.extend({
    ar: {
      'co.title': 'إتمام الشراء',
      'co.subtitle': 'خطوة واحدة وتوصلك',
      'co.back_to_store': 'الرجوع للمتجر',
      'co.step_contact': 'بيانات التواصل',
      'co.step_delivery': 'طريقة الاستلام',
      'co.step_payment': 'طريقة الدفع',
      'co.step_notes': 'ملاحظات وإتمام',
      'co.name': 'الاسم بالكامل',
      'co.name_ph': 'مثال: حسام التلال',
      'co.phone': 'رقم الموبايل',
      'co.phone_ph': '01xxxxxxxxx',
      'co.phone_hint': 'هنستخدمه في تأكيد الطلب وتحديثات الشحن.',
      'co.email': 'البريد الإلكتروني',
      'co.email_hint': 'للفاتورة فقط، مش مطلوب.',
      'co.signin': 'عندك حساب؟ سجّل الدخول',
      'co.signin_note': 'الحساب بيخلي تتبع الطلبات أسرع.',
      'co.delivery_home': 'توصيل للعنوان',
      'co.delivery_pickup': 'استلام من الفرع',
      'co.governorate': 'المحافظة',
      'co.governorate_ph': 'اختار المحافظة',
      'co.city': 'المدينة أو المنطقة',
      'co.city_ph': 'مثال: فرشوط',
      'co.address': 'العنوان بالتفصيل',
      'co.address_ph': 'الشارع، رقم العمارة، الدور، الشقة',
      'co.landmark': 'علامة مميزة',
      'co.landmark_ph': 'مثال: جنب مسجد النور',
      'co.rate_loading': 'بنجيب أسعار الشحن…',
      'co.rate_title': 'الشحن',
      'co.rate_free': 'مجاني',
      'co.rate_error': 'مقدرناش نجيب سعر الشحن. جرّب تاني.',
      'co.rate_pick': 'اختار المحافظة عشان يظهر سعر الشحن.',
      'co.rate_unavail': 'التوصيل غير متاح لهذه المحافظة حاليًا. تقدر تختار الاستلام من الفرع.',
      'co.rate_unavail_short': 'غير متاح حاليًا',
      'co.rate_pending': 'اختار المحافظة',
      'co.pickup_pick': 'اختار الفرع اللي تحب تستلم منه.',
      'co.pickup_hours': 'مواعيد العمل',
      'co.pickup_free': 'الاستلام من الفرع مجاني.',
      'co.pickup_pay': 'الدفع عند الاستلام في الفرع متاح.',
      'co.payment_cod': 'الدفع عند الاستلام',
      'co.payment_cod_note': 'تدفع كاش للمندوب لما يوصلك الطلب. مش محتاج كارت.',
      'co.payment_cards': 'بطاقات بنكية',
      'co.payment_wallets': 'محافظ إلكترونية',
      'co.payment_installments': 'تقسيط',
      'co.payment_unavailable': 'غير متاح حاليًا',
      'co.payment_unavailable_note': 'قيد التفعيل. اختار الدفع عند الاستلام دلوقتي، وهنعلن هنا أول ما يتفعّل.',
      'co.payment_selected': 'مختار',
      'co.notes': 'ملاحظات على الطلب',
      'co.notes_ph': 'أي تفاصيل تحب تضيفها (اختياري)',
      'co.consent_updates': 'ابعتلي تحديثات الطلب على واتساب',
      'co.consent_offers': 'ابعتلي عروض وخصومات على واتساب',
      'co.consent_terms': 'أوافق على شروط البيع وسياسة الاسترجاع',
      'co.agree_prefix': 'أوافق على',
      'co.terms_link': 'شروط البيع',
      'co.returns_link': 'سياسة الاسترجاع',
      'co.consent_required': 'لازم توافق على الشروط قبل تأكيد الطلب.',
      'co.summary': 'ملخص الطلب',
      'co.summary_count': '{n} منتج',
      'co.subtotal': 'الإجمالي الفرعي',
      'co.shipping': 'الشحن',
      'co.discount': 'الخصم',
      'co.total': 'الإجمالي',
      'co.total_due': 'المطلوب دفعه عند الاستلام',
      'co.qty': 'الكمية',
      'co.qty_minus': 'تقليل الكمية',
      'co.qty_plus': 'زيادة الكمية',
      'co.remove': 'حذف',
      'co.remove_item': 'حذف {name} من الطلب',
      'co.stock_left': 'متاح {n} فقط',
      'co.out_of_stock': 'غير متاح حاليًا',
      'co.empty': 'السلة فاضية',
      'co.empty_note': 'اختار منتجات من المتجر وارجع هنا.',
      'co.browse': 'تصفح المتجر',
      'co.submit': 'تأكيد الطلب',
      'co.submit_cod': 'تأكيد الطلب — الدفع عند الاستلام',
      'co.submitting': 'بنأكد طلبك…',
      'co.submit_error': 'مقدرناش نأكد الطلب. بياناتك محفوظة، جرّب تاني.',
      'co.secure': 'اتصال مشفّر',
      'co.support_hotline': 'خط أونو',
      'co.help': 'عندك سؤال قبل ما تأكد؟',
      'co.weight_note': 'الشحن بيتحسب على وزن الطلب ({w} {unit}).',
      'co.err_name': 'اكتب اسمك بالكامل.',
      'co.err_address': 'اكتب العنوان بالتفصيل (٨ حروف على الأقل).',
      'co.err_gov': 'اختار المحافظة.',
      'co.err_branch': 'اختار الفرع.',
      'co.err_payment': 'اختار طريقة الدفع.',
      'co.fix_errors': 'راجع الحقول المعلّمة بالأحمر.',
      'co.summary_toggle': 'عرض أو إخفاء تفاصيل الطلب',
      'co.eta_label': 'التوصيل المتوقع',
      'co.pickup_note': 'هنبلغك على الموبايل أول ما الطلب يبقى جاهز.',
      'co.cod_note_summary': 'هتدفع {amount} كاش للمندوب.',
      'co.vat': 'الأسعار نهائية كما تظهر.',
      'co.demo_shipping': 'سعر الشحن تجريبي'
    },
    en: {
      'co.title': 'Checkout',
      'co.subtitle': 'One page and it is on its way',
      'co.back_to_store': 'Back to store',
      'co.step_contact': 'Contact details',
      'co.step_delivery': 'Delivery',
      'co.step_payment': 'Payment',
      'co.step_notes': 'Notes and confirmation',
      'co.name': 'Full name',
      'co.name_ph': 'e.g. Hossam Eltlal',
      'co.phone': 'Mobile number',
      'co.phone_ph': '01xxxxxxxxx',
      'co.phone_hint': 'Used for order confirmation and shipping updates.',
      'co.email': 'Email',
      'co.email_hint': 'Invoice only, optional.',
      'co.signin': 'Have an account? Sign in',
      'co.signin_note': 'An account makes tracking faster.',
      'co.delivery_home': 'Deliver to address',
      'co.delivery_pickup': 'Pick up from branch',
      'co.governorate': 'Governorate',
      'co.governorate_ph': 'Choose governorate',
      'co.city': 'City or area',
      'co.city_ph': 'e.g. Farshout',
      'co.address': 'Full address',
      'co.address_ph': 'Street, building, floor, apartment',
      'co.landmark': 'Landmark',
      'co.landmark_ph': 'e.g. next to El Nour mosque',
      'co.rate_loading': 'Checking shipping rates…',
      'co.rate_title': 'Shipping',
      'co.rate_free': 'Free',
      'co.rate_error': 'Could not load the shipping rate. Try again.',
      'co.rate_pick': 'Choose a governorate to see the shipping rate.',
      'co.rate_unavail': 'Delivery is not available to this governorate right now. You can choose branch pickup.',
      'co.rate_unavail_short': 'Not available right now',
      'co.rate_pending': 'Choose a governorate',
      'co.pickup_pick': 'Choose the branch you want to collect from.',
      'co.pickup_hours': 'Opening hours',
      'co.pickup_free': 'Branch pickup is free.',
      'co.pickup_pay': 'Cash on pickup at the branch is available.',
      'co.payment_cod': 'Cash on delivery',
      'co.payment_cod_note': 'Pay the courier in cash when it arrives. No card needed.',
      'co.payment_cards': 'Bank cards',
      'co.payment_wallets': 'Digital wallets',
      'co.payment_installments': 'Installments',
      'co.payment_unavailable': 'Not available yet',
      'co.payment_unavailable_note': 'Being activated. Choose cash on delivery for now; this page will show it once it is live.',
      'co.payment_selected': 'Selected',
      'co.notes': 'Order notes',
      'co.notes_ph': 'Anything you want to add (optional)',
      'co.consent_updates': 'Send me order updates on WhatsApp',
      'co.consent_offers': 'Send me offers and discounts on WhatsApp',
      'co.consent_terms': 'I agree to the terms of sale and the returns policy',
      'co.agree_prefix': 'I agree to the',
      'co.terms_link': 'terms of sale',
      'co.returns_link': 'returns policy',
      'co.consent_required': 'You need to accept the terms before confirming.',
      'co.summary': 'Order summary',
      'co.summary_count': '{n} item(s)',
      'co.subtotal': 'Subtotal',
      'co.shipping': 'Shipping',
      'co.discount': 'Discount',
      'co.total': 'Total',
      'co.total_due': 'Due on delivery',
      'co.qty': 'Quantity',
      'co.qty_minus': 'Decrease quantity',
      'co.qty_plus': 'Increase quantity',
      'co.remove': 'Remove',
      'co.remove_item': 'Remove {name} from the order',
      'co.stock_left': 'Only {n} left',
      'co.out_of_stock': 'Out of stock',
      'co.empty': 'Your cart is empty',
      'co.empty_note': 'Pick products from the store and come back here.',
      'co.browse': 'Browse the store',
      'co.submit': 'Confirm order',
      'co.submit_cod': 'Confirm order — cash on delivery',
      'co.submitting': 'Confirming your order…',
      'co.submit_error': 'We could not confirm the order. Your details are kept; please try again.',
      'co.secure': 'Encrypted connection',
      'co.support_hotline': 'Uno line',
      'co.help': 'A question before you confirm?',
      'co.weight_note': 'Shipping is priced on order weight ({w} {unit}).',
      'co.err_name': 'Enter your full name.',
      'co.err_address': 'Enter the full address (at least 8 characters).',
      'co.err_gov': 'Choose a governorate.',
      'co.err_branch': 'Choose a branch.',
      'co.err_payment': 'Choose a payment method.',
      'co.fix_errors': 'Check the fields marked in red.',
      'co.summary_toggle': 'Show or hide order details',
      'co.eta_label': 'Estimated delivery',
      'co.pickup_note': 'We will call you as soon as the order is ready.',
      'co.cod_note_summary': 'You will pay {amount} in cash to the courier.',
      'co.vat': 'Prices are final as shown.',
      'co.demo_shipping': 'Demo shipping rate'
    }
  });

  var t = U.t;

  var state = {
    items: [],          // [{variant, qty}]
    loading: true,
    contact: { name: '', phone: '', email: '' },
    delivery: { method: 'home', governorate: '', city: '', address: '', landmark: '', branch_id: '' },
    payment: 'cod',
    notes: '',
    consent: { updates: true, offers: false, terms: false },
    rate: null,
    rateState: 'idle',  // idle | loading | ready | error
    submitting: false,
    errors: {},
    summaryOpen: false
  };

  var root, els = {};

  /* ------------------------------------------------------------------ */

  function cartLines() {
    var lines = U.getCart();
    return (Array.isArray(lines) ? lines : []).filter(function (l) { return l && l.variant_id; });
  }

  function weight() {
    return state.items.reduce(function (s, it) { return s + (it.variant.weight_g || 0) * it.qty; }, 0);
  }

  function subtotal() {
    return state.items.reduce(function (s, it) { return s + it.variant.price * it.qty; }, 0);
  }

  function shippingPrice() {
    if (state.delivery.method === 'pickup') return 0;
    return state.rate ? state.rate.price : 0;
  }

  function total() { return subtotal() + shippingPrice(); }

  function branches() { return U.branches(); }

  /* ------------------------------------------------------------------ *
   * Markup
   * ------------------------------------------------------------------ */

  function skeleton() {
    root.innerHTML = '' +
      '<header class="uo-head">' +
        '<div class="uo-head__in">' +
          '<a class="uo-brand" href="' + U.escapeHtml(U.config.storeHome) + '">' +
            '<img class="uo-brand__logo" src="assets/logo-uno-technology.png" alt="Uno Technology" height="34">' +
          '</a>' +
          '<div class="uo-head__meta">' +
            '<span class="uo-chip uo-chip--secure">' + icon('lock') + t('co.secure') + '</span>' +
            '<a class="uo-head__support" href="tel:' + U.escapeHtml(U.config.hotline) + '">' +
              icon('phone') + t('co.support_hotline') + ' <bdi dir="ltr">' + U.escapeHtml(U.config.hotline) + '</bdi>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</header>' +
      '<main class="uo-page" id="uo-checkout-main">' +
        '<div class="uo-page__head">' +
          '<a class="uo-back" href="' + U.escapeHtml(U.config.storeHome) + '">' + icon('arrow') + t('co.back_to_store') + '</a>' +
          '<h1 class="uo-title">' + t('co.title') + '</h1>' +
          '<p class="uo-sub">' + t('co.subtitle') + '</p>' +
        '</div>' +
        '<div class="uo-layout" data-empty="true">' +
          '<form class="uo-form" novalidate></form>' +
          '<aside class="uo-summary" aria-labelledby="uo-summary-title"></aside>' +
        '</div>' +
      '</main>' +
      '<div class="uo-bar" hidden></div>' +
      '<div class="uo-live" aria-live="polite" role="status"></div>';

    els.form = U.$('.uo-form', root);
    els.summary = U.$('.uo-summary', root);
    els.layout = U.$('.uo-layout', root);
    els.bar = U.$('.uo-bar', root);
    els.live = U.$('.uo-live', root);
  }

  function icon(name) {
    var paths = {
      lock: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4.5" y="10" width="15" height="10" rx="2.6" stroke="currentColor" stroke-width="1.7"/><path d="M8 10V7.6a4 4 0 018 0V10" stroke="currentColor" stroke-width="1.7"/></svg>',
      phone: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6.4 3.5h2.8l1.6 4-2 1.4a11 11 0 005.3 5.3l1.4-2 4 1.6v2.8a2 2 0 01-2.2 2A16 16 0 014.4 5.7a2 2 0 012-2.2z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
      arrow: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 6l6 6-6 6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      chevron: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      check: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l4.4 4.4L19 7.3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      alert: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8v5m0 3.2v.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/></svg>',
      truck: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 7h10v9H3zM13 10h4l3 3v3h-7z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="7" cy="18" r="1.7" stroke="currentColor" stroke-width="1.7"/><circle cx="17" cy="18" r="1.7" stroke="currentColor" stroke-width="1.7"/></svg>',
      store: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9h16v10.5H4z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M3 9l2-4.5h14L21 9" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9.5 19.5V14h5v5.5" stroke="currentColor" stroke-width="1.7"/></svg>',
      card: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2.4" stroke="currentColor" stroke-width="1.7"/><path d="M3 10h18" stroke="currentColor" stroke-width="1.7"/></svg>',
      cash: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="7" width="19" height="10" rx="2" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="2.4" stroke="currentColor" stroke-width="1.7"/></svg>',
      wallet: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3.5 7.5A2.5 2.5 0 016 5h11.5v3" stroke="currentColor" stroke-width="1.7"/><rect x="3.5" y="8" width="17" height="11" rx="2.4" stroke="currentColor" stroke-width="1.7"/><circle cx="16.5" cy="13.5" r="1.2" fill="currentColor"/></svg>',
      calendar: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="2.4" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 10h17M8 3.5v4M16 3.5v4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>'
    };
    return paths[name] || '';
  }

  function field(opts) {
    var id = 'uo-' + opts.name;
    var err = state.errors[opts.name];
    var wrap = U.el('div', { class: 'uo-field' + (opts.wide ? ' uo-field--wide' : '') + (err ? ' is-invalid' : '') });
    var label = U.el('label', { class: 'uo-label', for: id });
    label.appendChild(document.createTextNode(opts.label));
    if (opts.optional) {
      var tag = U.el('span', { class: 'uo-label__hint' });
      tag.textContent = t('common.optional');
      label.appendChild(tag);
    }
    wrap.appendChild(label);

    var input;
    if (opts.tag === 'textarea') {
      input = U.el('textarea', { id: id, name: opts.name, rows: opts.rows || 2, placeholder: opts.placeholder || '', autocomplete: opts.autocomplete || 'off', inputmode: opts.inputmode || null });
    } else if (opts.tag === 'select') {
      input = U.el('select', { id: id, name: opts.name });
    } else {
      input = U.el('input', { id: id, name: opts.name, type: opts.type || 'text', placeholder: opts.placeholder || '', autocomplete: opts.autocomplete || 'off', inputmode: opts.inputmode || null, dir: opts.dir || null });
    }
    if (opts.value) input.value = opts.value;
    wrap.appendChild(input);

    if (opts.hint) {
      var hint = U.el('p', { class: 'uo-hint', id: id + '-hint' });
      hint.textContent = opts.hint;
      wrap.appendChild(hint);
      input.setAttribute('aria-describedby', id + '-hint');
    }
    var errEl = U.el('p', { class: 'uo-error', id: id + '-err' });
    errEl.textContent = err || '';
    if (err) input.setAttribute('aria-invalid', 'true');
    wrap.appendChild(errEl);
    return { wrap: wrap, input: input };
  }

  function renderForm() {
    var f = els.form;
    f.innerHTML = '';
    f.appendChild(contactSection());
    f.appendChild(deliverySection());
    f.appendChild(paymentSection());
    f.appendChild(notesSection());
    f.appendChild(submitSection());
  }

  function stepHead(num, title) {
    var h = U.el('div', { class: 'uo-step__head' });
    var n = U.el('span', { class: 'uo-step__num', 'aria-hidden': 'true' });
    n.textContent = num;
    h.appendChild(n);
    var h2 = U.el('h2', { class: 'uo-step__title' });
    h2.textContent = title;
    h.appendChild(h2);
    return h;
  }

  function contactSection() {
    var s = U.el('section', { class: 'uo-step', 'aria-labelledby': 'uo-step-contact' });
    var head = stepHead('1', t('co.step_contact'));
    U.$('.uo-step__title', head).id = 'uo-step-contact';
    s.appendChild(head);

    var name = field({ name: 'name', label: t('co.name'), placeholder: t('co.name_ph'), value: state.contact.name, autocomplete: 'name', wide: true });
    name.input.addEventListener('input', function () { state.contact.name = name.input.value; clearError('name', name); });
    s.appendChild(name.wrap);

    var phone = field({ name: 'phone', label: t('co.phone'), placeholder: t('co.phone_ph'), type: 'tel', inputmode: 'tel', value: state.contact.phone, autocomplete: 'tel', dir: 'ltr', hint: t('co.phone_hint') });
    phone.input.addEventListener('input', function () { state.contact.phone = phone.input.value; clearError('phone', phone); });
    s.appendChild(phone.wrap);

    var email = field({ name: 'email', label: t('co.email'), placeholder: 'name@example.com', type: 'email', inputmode: 'email', value: state.contact.email, autocomplete: 'email', optional: true, hint: t('co.email_hint'), dir: 'ltr' });
    email.input.addEventListener('input', function () { state.contact.email = email.input.value; clearError('email', email); });
    s.appendChild(email.wrap);

    var signin = U.el('p', { class: 'uo-signin' });
    signin.innerHTML = '<a href="account.html">' + U.escapeHtml(t('co.signin')) + '</a> <span>' + U.escapeHtml(t('co.signin_note')) + '</span>';
    s.appendChild(signin);
    return s;
  }

  function deliverySection() {
    var s = U.el('section', { class: 'uo-step', 'aria-labelledby': 'uo-step-delivery' });
    var head = stepHead('2', t('co.step_delivery'));
    U.$('.uo-step__title', head).id = 'uo-step-delivery';
    s.appendChild(head);

    var seg = U.el('div', { class: 'uo-seg', role: 'radiogroup', 'aria-label': t('co.step_delivery') });
    [['home', t('co.delivery_home'), 'truck'], ['pickup', t('co.delivery_pickup'), 'store']].forEach(function (opt) {
      var active = state.delivery.method === opt[0];
      var btn = U.el('button', {
        type: 'button', class: 'uo-seg__btn' + (active ? ' is-active' : ''),
        role: 'radio', 'aria-checked': active ? 'true' : 'false'
      });
      btn.innerHTML = icon(opt[2]) + '<span>' + U.escapeHtml(opt[1]) + '</span>';
      btn.addEventListener('click', function () {
        if (state.delivery.method === opt[0]) return;
        state.delivery.method = opt[0];
        if (opt[0] === 'pickup') { state.rate = null; state.rateState = 'idle'; }
        renderForm();
        renderSummary();
        if (opt[0] === 'home' && state.delivery.governorate) loadRates();
        syncBar();
      });
      seg.appendChild(btn);
    });
    s.appendChild(seg);

    var panel = U.el('div', { class: 'uo-panel' });
    if (state.delivery.method === 'home') panel.appendChild(homePanel());
    else panel.appendChild(pickupPanel());
    s.appendChild(panel);
    return s;
  }

  function homePanel() {
    var box = U.el('div', { class: 'uo-panel__body' });

    var gov = field({ name: 'governorate', label: t('co.governorate'), tag: 'select' });
    var first = U.el('option', { value: '' });
    first.textContent = t('co.governorate_ph');
    gov.input.appendChild(first);
    U.governorates().forEach(function (g) {
      var o = U.el('option', { value: g.id });
      o.textContent = U.config.lang === 'ar' ? g.name_ar : g.name_en;
      if (g.id === state.delivery.governorate) o.selected = true;
      gov.input.appendChild(o);
    });
    gov.input.addEventListener('change', function () {
      state.delivery.governorate = gov.input.value;
      clearError('governorate', gov);
      if (state.delivery.governorate) loadRates(); else { state.rate = null; state.rateState = 'idle'; }
      renderRateBox();
      renderSummary();
    });
    box.appendChild(gov.wrap);

    var city = field({ name: 'city', label: t('co.city'), placeholder: t('co.city_ph'), value: state.delivery.city, optional: true, autocomplete: 'address-level2' });
    city.input.addEventListener('input', function () { state.delivery.city = city.input.value; });
    box.appendChild(city.wrap);

    var addr = field({ name: 'address', label: t('co.address'), tag: 'textarea', rows: 2, placeholder: t('co.address_ph'), value: state.delivery.address, autocomplete: 'street-address', wide: true });
    addr.input.addEventListener('input', function () { state.delivery.address = addr.input.value; clearError('address', addr); });
    box.appendChild(addr.wrap);

    var landmark = field({ name: 'landmark', label: t('co.landmark'), placeholder: t('co.landmark_ph'), value: state.delivery.landmark, optional: true });
    landmark.input.addEventListener('input', function () { state.delivery.landmark = landmark.input.value; });
    box.appendChild(landmark.wrap);

    var rateBox = U.el('div', { class: 'uo-rate', id: 'uo-rate-box' });
    box.appendChild(rateBox);
    setTimeout(renderRateBox, 0);
    return box;
  }

  function renderRateBox() {
    var box = U.$('#uo-rate-box', els.form);
    if (!box) return;
    box.innerHTML = '';
    if (state.delivery.method !== 'home') return;

    if (state.rateState === 'loading') {
      box.className = 'uo-rate is-loading';
      box.innerHTML = '<div class="uo-skel uo-skel--line"></div><div class="uo-skel uo-skel--line short"></div>';
      var sr = U.el('span', { class: 'uo-sr' });
      sr.textContent = t('co.rate_loading');
      box.appendChild(sr);
      return;
    }
    if (state.rateState === 'unavailable') {
      box.className = 'uo-rate is-error';
      box.innerHTML = '<div class="uo-rate__row" role="alert"><span class="uo-rate__icon">' + icon('alert') + '</span><span>' + U.escapeHtml(t('co.rate_unavail')) + '</span></div>';
      return;
    }
    if (state.rateState === 'error') {
      box.className = 'uo-rate is-error';
      box.innerHTML = '<div class="uo-rate__row"><span class="uo-rate__icon">' + icon('alert') + '</span><span>' +
        U.escapeHtml(t('co.rate_error')) + '</span></div>';
      var retry = U.el('button', { type: 'button', class: 'uo-linkbtn' });
      retry.textContent = t('common.retry');
      retry.addEventListener('click', loadRates);
      box.appendChild(retry);
      return;
    }
    if (state.rateState === 'ready' && state.rate) {
      box.className = 'uo-rate is-ready';
      var eta = U.etaText(state.rate);
      box.innerHTML = '' +
        '<div class="uo-rate__row">' +
          '<span class="uo-rate__icon">' + icon('truck') + '</span>' +
          '<div class="uo-rate__text">' +
            '<strong>' + U.escapeHtml(t('co.rate_title')) + ' — ' + U.money(state.rate.price) + '</strong>' +
            '<span>' + U.escapeHtml(t('co.eta_label')) + ': ' + U.escapeHtml(eta) + '</span>' +
          '</div>' +
          (state.rate.mock ? '<span class="uo-chip uo-chip--demo">' + U.escapeHtml(t('common.demo')) + '</span>' : '') +
        '</div>';
      return;
    }
    box.className = 'uo-rate is-idle';
    box.innerHTML = '<div class="uo-rate__row"><span class="uo-rate__icon">' + icon('truck') + '</span><span>' +
      U.escapeHtml(t('co.rate_pick')) + '</span></div>';
  }

  function pickupPanel() {
    var box = U.el('div', { class: 'uo-panel__body' });
    var err = state.errors.branch_id;
    var list = U.el('div', { class: 'uo-branches' + (err ? ' is-invalid' : ''), role: 'radiogroup', 'aria-label': t('co.delivery_pickup') });

    branches().forEach(function (b) {
      var active = state.delivery.branch_id === b.id;
      var card = U.el('button', { type: 'button', class: 'uo-branch' + (active ? ' is-active' : ''), role: 'radio', 'aria-checked': active ? 'true' : 'false' });
      var name = U.config.lang === 'ar' ? b.name_ar : b.name_en;
      var city = U.config.lang === 'ar' ? b.city_ar : b.city_en;
      var address = U.config.lang === 'ar' ? b.address_ar : b.address_en;
      var hours = U.config.lang === 'ar' ? b.hours_ar : b.hours_en;
      var ready = U.config.lang === 'ar' ? b.ready_ar : b.ready_en;
      card.innerHTML = '' +
        '<span class="uo-branch__radio" aria-hidden="true"></span>' +
        '<span class="uo-branch__body">' +
          '<strong>' + U.escapeHtml(name) + '</strong>' +
          '<span class="uo-branch__city">' + U.escapeHtml(city) + '</span>' +
          '<span class="uo-branch__addr">' + U.escapeHtml(address) + '</span>' +
          '<span class="uo-branch__meta">' + icon('calendar') + U.escapeHtml(t('co.pickup_hours')) + ': ' + U.escapeHtml(hours) + '</span>' +
          '<span class="uo-branch__ready">' + icon('check') + U.escapeHtml(ready) + '</span>' +
        '</span>';
      card.addEventListener('click', function () {
        state.delivery.branch_id = b.id;
        delete state.errors.branch_id;
        renderForm();
        renderSummary();
        syncBar();
      });
      list.appendChild(card);
    });
    box.appendChild(list);
    var errEl = U.el('p', { class: 'uo-error' });
    errEl.textContent = err || '';
    box.appendChild(errEl);

    var notes = U.el('ul', { class: 'uo-facts' });
    [t('co.pickup_free'), t('co.pickup_pay'), t('co.pickup_note')].forEach(function (line) {
      var li = U.el('li');
      li.innerHTML = icon('check') + '<span>' + U.escapeHtml(line) + '</span>';
      notes.appendChild(li);
    });
    box.appendChild(notes);
    return box;
  }

  function paymentSection() {
    var s = U.el('section', { class: 'uo-step', 'aria-labelledby': 'uo-step-payment' });
    var head = stepHead('3', t('co.step_payment'));
    U.$('.uo-step__title', head).id = 'uo-step-payment';
    s.appendChild(head);

    var group = U.el('div', { class: 'uo-pay', role: 'radiogroup', 'aria-label': t('co.step_payment') });

    var cod = U.el('button', { type: 'button', class: 'uo-pay__opt is-active', role: 'radio', 'aria-checked': 'true' });
    cod.innerHTML = '' +
      '<span class="uo-pay__radio" aria-hidden="true"></span>' +
      '<span class="uo-pay__icon">' + icon('cash') + '</span>' +
      '<span class="uo-pay__body">' +
        '<strong>' + U.escapeHtml(t('co.payment_cod')) + '</strong>' +
        '<span>' + U.escapeHtml(t('co.payment_cod_note')) + '</span>' +
      '</span>' +
      '<span class="uo-pay__tag">' + U.escapeHtml(t('co.payment_selected')) + '</span>';
    group.appendChild(cod);

    [['cards', t('co.payment_cards'), 'card'], ['wallets', t('co.payment_wallets'), 'wallet'], ['installments', t('co.payment_installments'), 'calendar']].forEach(function (opt) {
      var row = U.el('div', { class: 'uo-pay__opt is-disabled', 'aria-disabled': 'true' });
      row.innerHTML = '' +
        '<span class="uo-pay__radio" aria-hidden="true"></span>' +
        '<span class="uo-pay__icon">' + icon(opt[2]) + '</span>' +
        '<span class="uo-pay__body">' +
          '<strong>' + U.escapeHtml(opt[1]) + '</strong>' +
          '<span>' + U.escapeHtml(t('co.payment_unavailable_note')) + '</span>' +
        '</span>' +
        '<span class="uo-pay__tag uo-pay__tag--muted">' + U.escapeHtml(t('co.payment_unavailable')) + '</span>';
      group.appendChild(row);
    });
    s.appendChild(group);

    var errEl = U.el('p', { class: 'uo-error' });
    errEl.textContent = state.errors.payment || '';
    s.appendChild(errEl);
    return s;
  }

  function notesSection() {
    var s = U.el('section', { class: 'uo-step', 'aria-labelledby': 'uo-step-notes' });
    var head = stepHead('4', t('co.step_notes'));
    U.$('.uo-step__title', head).id = 'uo-step-notes';
    s.appendChild(head);

    var notes = field({ name: 'notes', label: t('co.notes'), tag: 'textarea', rows: 2, placeholder: t('co.notes_ph'), value: state.notes, optional: true, wide: true });
    notes.input.addEventListener('input', function () { state.notes = notes.input.value; });
    s.appendChild(notes.wrap);

    var consents = U.el('div', { class: 'uo-consents' });

    var updates = checkbox('consent_updates', t('co.consent_updates'), state.consent.updates, function (v) { state.consent.updates = v; });
    consents.appendChild(updates);

    var offers = checkbox('consent_offers', t('co.consent_offers'), state.consent.offers, function (v) { state.consent.offers = v; });
    consents.appendChild(offers);

    var termsWrap = U.el('div', { class: 'uo-check' + (state.errors.terms ? ' is-invalid' : '') });
    var termsId = 'uo-consent_terms';
    var terms = U.el('input', { type: 'checkbox', id: termsId, name: 'consent_terms' });
    terms.checked = !!state.consent.terms;
    terms.addEventListener('change', function () {
      state.consent.terms = terms.checked;
      if (terms.checked) { delete state.errors.terms; termsWrap.classList.remove('is-invalid'); var e = U.$('.uo-error', termsWrap); if (e) e.textContent = ''; }
    });
    var termsLabel = U.el('label', { for: termsId, class: 'uo-check__label' });
    termsLabel.innerHTML = U.escapeHtml(t('co.agree_prefix')) + ' ' +
      '<a href="policies.html#terms">' + U.escapeHtml(t('co.terms_link')) + '</a> ' +
      (U.config.lang === 'ar' ? 'و' : 'and ') +
      '<a href="policies.html#returns">' + U.escapeHtml(t('co.returns_link')) + '</a>';
    termsWrap.appendChild(terms);
    termsWrap.appendChild(termsLabel);
    var termsErr = U.el('p', { class: 'uo-error' });
    termsErr.textContent = state.errors.terms || '';
    termsWrap.appendChild(termsErr);
    consents.appendChild(termsWrap);
    s.appendChild(consents);
    return s;
  }

  function checkbox(name, label, checked, onChange) {
    var wrap = U.el('div', { class: 'uo-check' });
    var id = 'uo-' + name;
    var input = U.el('input', { type: 'checkbox', id: id, name: name });
    input.checked = !!checked;
    input.addEventListener('change', function () { onChange(input.checked); });
    var lab = U.el('label', { for: id, class: 'uo-check__label' });
    lab.textContent = label;
    wrap.appendChild(input);
    wrap.appendChild(lab);
    return wrap;
  }

  function submitSection() {
    var box = U.el('div', { class: 'uo-submit' });
    var btn = U.el('button', { type: 'submit', class: 'uo-btn uo-btn--primary uo-btn--lg', id: 'uo-submit' });
    btn.innerHTML = icon('lock') + '<span>' + U.escapeHtml(t('co.submit_cod')) + '</span>';
    box.appendChild(btn);
    var note = U.el('p', { class: 'uo-submit__note' });
    note.textContent = t('co.vat');
    box.appendChild(note);
    return box;
  }

  /* ------------------------------------------------------------------ *
   * Summary
   * ------------------------------------------------------------------ */

  function renderSummary() {
    var aside = els.summary;
    aside.innerHTML = '';
    if (!state.items.length) return;

    var head = U.el('div', { class: 'uo-summary__head' });
    var toggle = U.el('button', { type: 'button', class: 'uo-summary__toggle', 'aria-expanded': state.summaryOpen ? 'true' : 'false', 'aria-controls': 'uo-summary-body' });
    toggle.setAttribute('aria-label', t('co.summary_toggle'));
    toggle.innerHTML = '' +
      '<span class="uo-summary__title" id="uo-summary-title">' + U.escapeHtml(t('co.summary')) +
      ' <span class="uo-summary__count">' + U.escapeHtml(t('co.summary_count', { n: count() })) + '</span></span>' +
      '<span class="uo-summary__total-mini">' + U.money(total()) + '</span>' +
      '<span class="uo-summary__chev">' + icon('chevron') + '</span>';
    toggle.addEventListener('click', function () {
      state.summaryOpen = !state.summaryOpen;
      toggle.setAttribute('aria-expanded', state.summaryOpen ? 'true' : 'false');
      aside.classList.toggle('is-open', state.summaryOpen);
      var sb = aside.querySelector('.uo-summary__body'); if (sb) sb.classList.toggle('is-open', state.summaryOpen);
    });
    head.appendChild(toggle);
    aside.appendChild(head);

    var body = U.el('div', { class: 'uo-summary__body', id: 'uo-summary-body' });
    if (state.summaryOpen) body.classList.add('is-open');

    var list = U.el('ul', { class: 'uo-lines' });
    state.items.forEach(function (item, index) {
      list.appendChild(lineEl(item, index));
    });
    body.appendChild(list);

    var totals = U.el('dl', { class: 'uo-totals' });
    totals.appendChild(totalRow(t('co.subtotal'), U.money(subtotal())));
    totals.appendChild(totalRow(t('co.shipping'),
      state.delivery.method === 'pickup' ? t('co.rate_free') :
        (state.rate ? U.money(state.rate.price) :
          state.rateState === 'unavailable' ? t('co.rate_unavail_short') :
          state.rateState === 'error' ? t('co.rate_error') :
          state.rateState === 'loading' ? t('co.rate_loading') : t('co.rate_pending'))));
    var grand = totalRow(t('co.total'), U.money(total()), true);
    totals.appendChild(grand);
    body.appendChild(totals);

    if (state.delivery.method === 'home' && state.rate) {
      var eta = U.el('p', { class: 'uo-summary__eta' });
      eta.innerHTML = icon('calendar') + '<span>' + U.escapeHtml(t('co.eta_label')) + ': ' + U.escapeHtml(U.etaText(state.rate)) + '</span>';
      body.appendChild(eta);
    }
    var weightNote = U.el('p', { class: 'uo-summary__note' });
    weightNote.textContent = t('co.weight_note', { w: new Intl.NumberFormat('ar-EG-u-nu-latn').format(weight()), unit: t('common.gram') });
    /* 20261128f: shipping is a flat rate per governorate (store_shipping_rates); the weight note contradicted it. */

    var codNote = U.el('p', { class: 'uo-summary__cod' });
    codNote.innerHTML = icon('cash') + '<span>' + U.escapeHtml(t('co.cod_note_summary', { amount: U.money(total()) })) + '</span>';
    body.appendChild(codNote);

    var help = U.el('div', { class: 'uo-help' });
    help.innerHTML = '<p>' + U.escapeHtml(t('co.help')) + '</p>' +
      '<a href="tel:' + U.escapeHtml(U.config.hotline) + '">' + icon('phone') + '<bdi dir="ltr">' + U.escapeHtml(U.config.hotline) + '</bdi></a>';
    body.appendChild(help);

    aside.appendChild(body);
    syncBar();
  }

  function count() { return state.items.reduce(function (s, i) { return s + i.qty; }, 0); }

  function totalRow(label, value, strong) {
    var row = U.el('div', { class: 'uo-totals__row' + (strong ? ' uo-totals__row--total' : '') });
    var dt = U.el('dt'); dt.textContent = label;
    var dd = U.el('dd'); dd.textContent = value;
    row.appendChild(dt); row.appendChild(dd);
    return row;
  }

  function lineEl(item, index) {
    var v = item.variant;
    var li = U.el('li', { class: 'uo-line' });
    var name = U.config.lang === 'ar' ? v.name_ar : v.name_en;
    var variant = U.config.lang === 'ar' ? v.variant_ar : v.variant_en;

    var thumb = U.el('div', { class: 'uo-line__thumb' + (v.image_svg ? ' has-art' : '') });
    if (v.image_svg) thumb.innerHTML = v.image_svg;
    li.appendChild(thumb);

    var body = U.el('div', { class: 'uo-line__body' });
    var title = U.el('p', { class: 'uo-line__name' });
    title.textContent = name;
    body.appendChild(title);
    if (variant) {
      var meta = U.el('p', { class: 'uo-line__variant' });
      meta.textContent = variant;
      body.appendChild(meta);
    }
    var stockNote = U.el('p', { class: 'uo-line__stock' });
    if (v.stock > 0 && v.stock <= 5) stockNote.textContent = t('co.stock_left', { n: v.stock });
    else stockNote.textContent = '';
    body.appendChild(stockNote);

    var qty = U.el('div', { class: 'uo-qty' });
    var minus = U.el('button', { type: 'button', class: 'uo-qty__btn', 'aria-label': t('co.qty_minus') });
    minus.textContent = '−';
    minus.addEventListener('click', function () { setQty(index, Math.round((item.qty - (v.step || 1)) * 1000) / 1000); });
    var value = U.el('span', { class: 'uo-qty__value', 'aria-label': t('co.qty') });
    value.textContent = new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(item.qty) + ((v.step || 1) !== 1 && v.unit ? ' ' + v.unit : '');
    var plus = U.el('button', { type: 'button', class: 'uo-qty__btn', 'aria-label': t('co.qty_plus') });
    plus.textContent = '+';
    plus.disabled = v.stock ? item.qty >= v.stock : false;
    plus.addEventListener('click', function () { setQty(index, Math.round((item.qty + (v.step || 1)) * 1000) / 1000); });
    qty.appendChild(minus); qty.appendChild(value); qty.appendChild(plus);
    body.appendChild(qty);

    li.appendChild(body);

    var side = U.el('div', { class: 'uo-line__side' });
    var price = U.el('span', { class: 'uo-line__price' });
    price.textContent = U.money(v.price * item.qty);
    side.appendChild(price);
    if (v.compare_at && v.compare_at > v.price) {
      var was = U.el('span', { class: 'uo-line__was' });
      was.textContent = U.money(v.compare_at * item.qty);
      side.appendChild(was);
    }
    var remove = U.el('button', { type: 'button', class: 'uo-line__remove', 'aria-label': t('co.remove_item', { name: name }) });
    remove.textContent = t('co.remove');
    remove.addEventListener('click', function () { setQty(index, 0); });
    side.appendChild(remove);
    li.appendChild(side);
    return li;
  }

  function setQty(index, qty) {
    if (qty <= 0) {
      state.items.splice(index, 1);
      U.setCart(state.items.map(function (i) { return { variant_id: i.variant.id, qty: i.qty }; }));
    } else {
      var max = state.items[index].variant.stock;
      state.items[index].qty = max ? Math.min(qty, max) : qty;
      U.setCart(state.items.map(function (i) { return { variant_id: i.variant.id, qty: i.qty }; }));
    }
    if (!state.items.length) { renderEmpty(); return; }
    renderForm();
    renderSummary();
    if (state.delivery.method === 'home' && state.delivery.governorate) loadRates();
    syncBar();
  }

  /* ------------------------------------------------------------------ *
   * Behaviour
   * ------------------------------------------------------------------ */

  function loadRates() {
    if (!state.delivery.governorate) return;
    state.rateState = 'loading';
    state.rate = null;
    renderRateBox();
    renderSummary();
    var gov = state.delivery.governorate;
    var w = weight();
    U.rpc('store_shipping_rates', {
      governorate: gov, city: state.delivery.city, weight_g: w, subtotal: subtotal(), method: 'home'
    }).then(function (res) {
      if (state.delivery.governorate !== gov) return;
      var rate = (res && res.rates && res.rates[0]) || null;
      if (!rate) { state.rateState = 'unavailable'; }
      else { state.rate = rate; state.rateState = 'ready'; }
      renderRateBox();
      renderSummary();
    }).catch(function () {
      if (state.delivery.governorate !== gov) return;
      state.rateState = 'error';
      renderRateBox();
      renderSummary();
    });
  }

  function clearError(name, f) {
    if (!state.errors[name]) return;
    delete state.errors[name];
    if (f && f.wrap) {
      f.wrap.classList.remove('is-invalid');
      f.input.removeAttribute('aria-invalid');
      var e = U.$('.uo-error', f.wrap);
      if (e) e.textContent = '';
    }
  }

  function validate() {
    var errors = {};
    if (String(state.contact.name).trim().length < 3) errors.name = t('co.err_name');
    if (!U.isEgyptianMobile(state.contact.phone)) errors.phone = t('common.phone_invalid');
    if (state.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(state.contact.email)) errors.email = t('common.email_invalid');

    if (state.delivery.method === 'home') {
      if (!state.delivery.governorate) errors.governorate = t('co.err_gov');
      else if (state.rateState === 'unavailable') errors.governorate = t('co.rate_unavail');
      if (String(state.delivery.address).trim().length < 8) errors.address = t('co.err_address');
    } else if (!state.delivery.branch_id) {
      errors.branch_id = t('co.err_branch');
    }
    if (!state.payment) errors.payment = t('co.err_payment');
    if (!state.consent.terms) errors.terms = t('co.consent_required');
    return errors;
  }

  function submit() {
    if (state.submitting) return;
    var errors = validate();
    state.errors = errors;
    renderForm();
    renderSummary();
    var keys = Object.keys(errors);
    if (keys.length) {
      var first = U.$('.uo-field.is-invalid, .uo-check.is-invalid, .uo-branches.is-invalid', els.form);
      if (first) {
        first.scrollIntoView({ block: 'center', behavior: 'smooth' });
        var input = U.$('input, select, textarea', first);
        if (input) input.focus({ preventScroll: true });
      }
      announce(t('co.fix_errors'));
      return;
    }
    if (!state.items.length) return;
    if (state.delivery.method === 'home' && !state.rate) {
      announce(t('co.rate_error'));
      return;
    }

    state.submitting = true;
    setSubmitting(true);

    var payload = {
      customer: {
        name: String(state.contact.name).trim(),
        phone: U.normalizePhone(state.contact.phone),
        email: state.contact.email ? String(state.contact.email).trim() : null
      },
      delivery: state.delivery.method === 'pickup'
        ? { method: 'pickup', branch_id: state.delivery.branch_id }
        : {
            method: 'home',
            governorate: state.delivery.governorate,
            city: state.delivery.city,
            address: state.delivery.address,
            landmark: state.delivery.landmark
          },
      items: state.items.map(function (i) { return { variant_id: i.variant.id, qty: i.qty }; }),
      payment: { method: 'cod' },
      shipping_price: shippingPrice(),
      notes: state.notes,
      consent: { terms: true, updates: state.consent.updates, offers: state.consent.offers }
    };

    U.rpc('store_order_create', payload).then(function (order) {
      state.submitting = false;
      setSubmitting(false);
      U.saveLastOrder(order);
      if (typeof U.config.onOrderCreated === 'function') U.config.onOrderCreated(order);
      U.setCart([]);
      var url = 'order-confirmation.html?order=' + encodeURIComponent(order.number || '');
      global.location.href = url;
    }).catch(function (err) {
      state.submitting = false;
      setSubmitting(false);
      announce(t('co.submit_error'));
      showBanner((err && err.userMessage) || t('co.submit_error'));
    });
  }

  function setSubmitting(on) {
    var btn = U.$('#uo-submit', els.form);
    if (btn) {
      btn.disabled = on;
      btn.classList.toggle('is-busy', on);
      var span = U.$('span', btn);
      if (span) span.textContent = on ? t('co.submitting') : t('co.submit_cod');
    }
    var barBtn = U.$('.uo-bar__btn', els.bar);
    if (barBtn) {
      barBtn.disabled = on;
      var s2 = U.$('span', barBtn);
      if (s2) s2.textContent = on ? t('co.submitting') : t('co.submit');
    }
    els.layout.classList.toggle('is-busy', on);
  }

  function showBanner(message) {
    var existing = U.$('.uo-banner', root);
    if (existing) existing.remove();
    var banner = U.el('div', { class: 'uo-banner', role: 'alert' });
    banner.innerHTML = icon('alert') + '<span>' + U.escapeHtml(message) + '</span>';
    var close = U.el('button', { type: 'button', class: 'uo-banner__close', 'aria-label': t('common.close') });
    close.textContent = '×';
    close.addEventListener('click', function () { banner.remove(); });
    banner.appendChild(close);
    els.layout.parentNode.insertBefore(banner, els.layout);
  }

  function announce(message) {
    els.live.textContent = '';
    setTimeout(function () { els.live.textContent = message; }, 30);
  }

  function syncBar() {
    if (!state.items.length) { els.bar.hidden = true; return; }
    els.bar.hidden = false;
    els.bar.innerHTML = '';
    var info = U.el('div', { class: 'uo-bar__info' });
    var label = U.el('span', { class: 'uo-bar__label' });
    label.textContent = t('co.total');
    var amount = U.el('strong', { class: 'uo-bar__amount' });
    amount.textContent = U.money(total());
    info.appendChild(label); info.appendChild(amount);
    var btn = U.el('button', { type: 'button', class: 'uo-btn uo-btn--primary uo-bar__btn' });
    btn.innerHTML = '<span>' + U.escapeHtml(t('co.submit')) + '</span>';
    btn.addEventListener('click', submit);
    els.bar.appendChild(info);
    els.bar.appendChild(btn);
  }

  function renderEmpty() {
    els.layout.setAttribute('data-empty', 'true');
    els.form.innerHTML = '' +
      '<div class="uo-empty">' +
        '<div class="uo-empty__art uo-empty__art--big"><svg viewBox="0 0 160 120" width="160" height="120" aria-hidden="true"><ellipse cx="80" cy="108" rx="52" ry="7" fill="currentColor" opacity=".12"/><path d="M34 38h14l10 40h48l9-30H52" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="64" cy="94" r="7" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="104" cy="94" r="7" fill="none" stroke="currentColor" stroke-width="5"/><path d="M76 22l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#F65A00"/><circle cx="110" cy="26" r="4" fill="#FF9E4A"/><circle cx="46" cy="22" r="3" fill="#FF9E4A" opacity=".7"/></svg></div>' +
        '<h2>' + U.escapeHtml(t('co.empty')) + '</h2>' +
        '<p>' + U.escapeHtml(t('co.empty_note')) + '</p>' +
        '<a class="uo-btn uo-btn--primary" href="' + U.escapeHtml(U.config.storeHome) + '">' + U.escapeHtml(t('co.browse')) + '</a>' +
      '<div class="uo-sugg" hidden></div>' +
      '</div>';
    els.summary.innerHTML = '';
    els.bar.hidden = true;
    suggest();
  }

  function suggest() {
    var cfg = window.UNO_CFG; if (!cfg || !window.fetch) return;
    var ar = (U.config.lang || 'ar') === 'ar';
    fetch(cfg.url + '/rest/v1/products?select=id,name_ar,name_en,price,images,is_demo&active=eq.true&stock=gt.0&order=created_at.desc&limit=3', { headers: { apikey: cfg.key, Authorization: 'Bearer ' + cfg.key } })
      .then(function (r) { return r.ok ? r.json() : []; }).then(function (ps) {
        var box = els.form.querySelector('.uo-sugg'); if (!box || !ps || !ps.length) return;
        var cur = ar ? 'ج.م' : 'EGP';
        box.innerHTML = '<h3>' + (ar ? 'ممكن يعجبك' : 'You may like') + '</h3><div class="uo-sugg__row">' + ps.map(function (p) {
          var img = (p.images && p.images[0]) || 'assets/pimg-acc.svg';
          var nm = (ar ? p.name_ar : p.name_en) || p.name_ar || '';
          var price = Number(p.price).toLocaleString(ar ? 'ar-EG' : 'en-US');
          return '<a class="uo-sugg__card" href="store.html?page=product&id=' + encodeURIComponent(p.id) + '"><span class="uo-sugg__img"><img src="' + U.escapeHtml(img) + '" alt="' + U.escapeHtml(nm) + '" loading="lazy"></span><b>' + U.escapeHtml(nm) + '</b><i>' + price + ' ' + cur + '</i>' + (p.is_demo ? '<em>' + (ar ? 'تجريبي' : 'Sample') + '</em>' : '') + '</a>';
        }).join('') + '</div>';
        box.hidden = false;
      }).catch(function () {});
  }

  /* ------------------------------------------------------------------ */

  function init(options) {
    var opts = options || {};
    if (opts.config) U.configure(opts.config);
    U.applyTheme();
    root = typeof opts.root === 'string' ? U.$(opts.root) : (opts.root || U.$('#uno-checkout'));
    if (!root) throw new Error('uno-store: checkout root not found');
    root.classList.add('uo-root');
    root.setAttribute('data-page', 'checkout');
    U.applyTheme(root);

    skeleton();
    els.form.addEventListener('submit', function (e) { e.preventDefault(); submit(); });

    var lines = cartLines();
    if (!lines.length) { renderEmpty(); return; }

    U.rpc('store_variants_get', { variant_ids: lines.map(function (l) { return l.variant_id; }) })
      .then(function (res) {
        var byId = {};
        ((res && res.variants) || []).forEach(function (v) { byId[v.id] = v; });
        state.items = lines.map(function (l) {
          var v = byId[l.variant_id];
          return v ? { variant: v, qty: Math.max(v.step || 1, Number(l.qty) || 1) } : null;
        }).filter(Boolean);
        state.items = state.items.filter(function (i) { return i.variant.stock !== 0; });
        if (!state.items.length) { renderEmpty(); return; }
        state.loading = false;
        els.layout.setAttribute('data-empty', 'false');
        renderForm();
        renderSummary();
        syncBar();
      })
      .catch(function () {
        renderEmpty();
      });
  }

  global.UnoStore.Checkout = { init: init, state: state };
})(window);
