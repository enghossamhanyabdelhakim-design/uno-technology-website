/*!
 * Uno Store — after the order: confirmation, tracking, returns, warranty.
 *
 * Mount one page per container:
 *   <div id="uno-confirm"></div>     UnoStore.PostPurchase.init({ page: 'confirm', root: '#uno-confirm' });
 *   <div id="uno-track"></div>       UnoStore.PostPurchase.init({ page: 'track',   root: '#uno-track' });
 *   <div id="uno-returns"></div>     UnoStore.PostPurchase.init({ page: 'returns', root: '#uno-returns' });
 *   <div id="uno-warranty"></div>    UnoStore.PostPurchase.init({ page: 'warranty',root: '#uno-warranty' });
 *
 * Backend: store_order_track only. Returns and warranty read the order the same
 * way, so no extra endpoint is needed; a returns submission hands off to the
 * store's WhatsApp line with a structured summary until a returns endpoint exists.
 */
(function (global) {
  'use strict';

  var U = global.UnoStore;
  if (!U) throw new Error('uno-store: load store-core.js first');

  U.i18n.extend({
    ar: {
      'pp.confirm_title': 'تم استلام طلبك',
      'pp.confirm_sub': 'طلبك اتسجل باسم {name}، وهنأكده على الموبايل قبل الشحن.',
      'pp.order_number': 'رقم الطلب',
      'pp.copy_number': 'نسخ رقم الطلب',
      'pp.due_on_delivery': 'المطلوب دفعه عند الاستلام',
      'pp.paid': 'مدفوع',
      'pp.payment': 'طريقة الدفع',
      'pp.delivery': 'الاستلام',
      'pp.delivery_home': 'توصيل للعنوان',
      'pp.delivery_pickup': 'استلام من الفرع',
      'pp.eta': 'التوصيل المتوقع',
      'pp.items': 'المنتجات',
      'pp.next_title': 'إيه اللي جاي؟',
      'pp.next_1': 'هنأكد الطلب على رقم الموبايل اللي كتبته.',
      'pp.next_2': 'بنجهز الطلب ونسلمه لشركة الشحن.',
      'pp.next_3': 'تتبع الطلب في أي وقت برقم الطلب ورقم الموبايل.',
      'pp.track_btn': 'تتبع الطلب',
      'pp.returns_btn': 'طلب استرجاع',
      'pp.warranty_btn': 'فحص الضمان',
      'pp.continue': 'متابعة التسوق',
      'pp.save_note': 'احفظ رقم الطلب، هتحتاجه في التتبع والاسترجاع.',
      'pp.no_order': 'مفيش طلب محفوظ على الجهاز ده.',
      'pp.no_order_note': 'تقدر تتبع طلبك برقم الطلب ورقم الموبايل.',
      'pp.track_title': 'تتبع طلبك',
      'pp.track_sub': 'اكتب رقم الطلب ورقم الموبايل اللي طلبت بيه.',
      'pp.order_number_ph': 'UNO-000000-0000',
      'pp.track_btn_submit': 'اعرض الطلب',
      'pp.tracking': 'بنبحث عن طلبك…',
      'pp.not_found': 'مفيش طلب بالبيانات دي. راجع رقم الطلب ورقم الموبايل.',
      'pp.status_placed': 'اتسجل',
      'pp.status_confirmed': 'اتأكد',
      'pp.status_prepared': 'قيد التجهيز',
      'pp.status_shipped': 'اتشحن',
      'pp.status_delivered': 'اتسلم',
      'pp.status_cancelled': 'ملغي',
      'pp.status_returned': 'مرتجع',
      'pp.timeline': 'مراحل الطلب',
      'pp.updated': 'آخر تحديث',
      'pp.placed_at': 'تاريخ الطلب',
      'pp.delivered_at': 'تاريخ التسليم',
      'pp.address': 'العنوان',
      'pp.branch': 'الفرع',
      'pp.hours': 'مواعيد العمل',
      'pp.help_title': 'محتاج تعديل أو عندك سؤال؟',
      'pp.help_note': 'كلمنا على خط أونو أو واتساب وهنساعدك.',
      'pp.returns_title': 'طلب استرجاع أو استبدال',
      'pp.returns_sub': 'الاسترجاع متاح خلال ١٤ يوم من استلام الطلب، والمنتج لازم يكون غير مستعمل وبكامل تغليفه.',
      'pp.returns_step1': 'بيانات الطلب',
      'pp.returns_step2': 'المنتجات والسبب',
      'pp.returns_step3': 'التأكيد',
      'pp.returns_load': 'هات الطلب',
      'pp.returns_items': 'اختار المنتجات اللي عايز ترجعها',
      'pp.returns_select_all': 'اختار الكل',
      'pp.returns_reason': 'سبب الاسترجاع',
      'pp.returns_reason_ph': 'اختار السبب',
      'pp.reason_damaged': 'المنتج وصل تالف',
      'pp.reason_wrong': 'المنتج غلط أو مش اللي طلبته',
      'pp.reason_missing': 'ناقص أجزاء أو ملحقات',
      'pp.reason_not_working': 'المنتج مش شغال',
      'pp.reason_not_needed': 'مش محتاجه',
      'pp.reason_other': 'سبب تاني',
      'pp.returns_details': 'تفاصيل إضافية',
      'pp.returns_details_ph': 'اشرح المشكلة بإيجاز (اختياري)',
      'pp.returns_refund': 'طريقة استرداد المبلغ',
      'pp.refund_cod': 'الدفع عند الاستلام: استرداد كاش من الفرع أو تحويل محفظة/بنكي بعد استلام المنتج.',
      'pp.refund_card': 'الدفع بالبطاقة: الاسترداد على نفس البطاقة بعد استلام المنتج.',
      'pp.refund_note': 'مصاريف الشحن غير قابلة للاسترداد إلا لو المشكلة من عندنا.',
      'pp.returns_window': 'آخر يوم للاسترجاع: {date}',
      'pp.returns_closed': 'مدة الاسترجاع (١٤ يوم) خلصت للطلب ده. كلمنا لو المشكلة عيب صناعة، الضمان ممكن يغطيها.',
      'pp.returns_submit': 'إرسال طلب الاسترجاع',
      'pp.returns_sending': 'بنرسل الطلب…',
      'pp.returns_ok_title': 'تم تسجيل طلب الاسترجاع',
      'pp.returns_ok_sub': 'هنراجع الطلب ونكلمك على الموبايل خلال يوم عمل. احتفظ برقم المطلب ده.',
      'pp.returns_ref': 'رقم المطلب',
      'pp.returns_wa': 'ابعت التفاصيل على واتساب',
      'pp.returns_wa_note': 'لو تحب ترفع صور للمنتج، ابعتهم على نفس المحادثة.',
      'pp.returns_pick_error': 'اختار منتج واحد على الأقل.',
      'pp.returns_reason_error': 'اختار سبب الاسترجاع.',
      'pp.warranty_title': 'فحص الضمان',
      'pp.warranty_sub': 'اعرف حالة ضمان منتجاتك من رقم الطلب.',
      'pp.warranty_check': 'افحص الضمان',
      'pp.warranty_valid': 'الضمان ساري',
      'pp.warranty_expired': 'الضمان منتهي',
      'pp.warranty_soon': 'الضمان قرب ينتهي',
      'pp.warranty_until': 'ساري لحد {date}',
      'pp.warranty_ended': 'انتهى في {date}',
      'pp.warranty_months': 'مدة الضمان: {n} {unit}',
      'pp.month_1': 'شهر',
      'pp.month_2': 'شهرين',
      'pp.month_few': 'شهور',
      'pp.month_many': 'شهر',
      'pp.warranty_start': 'يبدأ من تاريخ التسليم',
      'pp.warranty_none': 'المنتج ده مش عليه ضمان مسجل. كلمنا لو محتاج مساعدة.',
      'pp.warranty_note': 'الضمان بيغطي عيوب الصناعة. الاستخدام الخاطئ أو التلف مش داخل في الضمان.',
      'pp.warranty_claim': 'عايز تفتح بلاغ ضمان؟',
      'pp.back_store': 'رجوع للمتجر',
      'pp.track_again': 'طلب تاني',
      'pp.days_left': 'فاضل {n} يوم',
      'pp.phone_hint': 'نفس الرقم اللي طلبت بيه.',
      'pp.demo_hint': 'جرّب: UNO-261127-4821 مع 01012345678',
      'pp.wa_text': 'طلب استرجاع لرقم الطلب {order} — المطلب {ref}'
    },
    en: {
      'pp.confirm_title': 'Order received',
      'pp.confirm_sub': 'Order placed for {name}. We will confirm it by phone before shipping.',
      'pp.order_number': 'Order number',
      'pp.copy_number': 'Copy order number',
      'pp.due_on_delivery': 'Due on delivery',
      'pp.paid': 'Paid',
      'pp.payment': 'Payment',
      'pp.delivery': 'Delivery',
      'pp.delivery_home': 'Home delivery',
      'pp.delivery_pickup': 'Branch pickup',
      'pp.eta': 'Estimated delivery',
      'pp.items': 'Items',
      'pp.next_title': 'What happens next',
      'pp.next_1': 'We confirm the order on the number you gave us.',
      'pp.next_2': 'We prepare it and hand it to the courier.',
      'pp.next_3': 'Track it any time with the order number and your mobile.',
      'pp.track_btn': 'Track order',
      'pp.returns_btn': 'Request a return',
      'pp.warranty_btn': 'Check warranty',
      'pp.continue': 'Continue shopping',
      'pp.save_note': 'Keep the order number; you need it for tracking and returns.',
      'pp.no_order': 'No saved order on this device.',
      'pp.no_order_note': 'You can still track with the order number and mobile.',
      'pp.track_title': 'Track your order',
      'pp.track_sub': 'Enter the order number and the mobile you ordered with.',
      'pp.order_number_ph': 'UNO-000000-0000',
      'pp.track_btn_submit': 'Show order',
      'pp.tracking': 'Looking up your order…',
      'pp.not_found': 'No order matches those details. Check the number and mobile.',
      'pp.status_placed': 'Placed',
      'pp.status_confirmed': 'Confirmed',
      'pp.status_prepared': 'Being prepared',
      'pp.status_shipped': 'Shipped',
      'pp.status_delivered': 'Delivered',
      'pp.status_cancelled': 'Cancelled',
      'pp.status_returned': 'Returned',
      'pp.timeline': 'Order stages',
      'pp.updated': 'Last update',
      'pp.placed_at': 'Order date',
      'pp.delivered_at': 'Delivered',
      'pp.address': 'Address',
      'pp.branch': 'Branch',
      'pp.hours': 'Opening hours',
      'pp.help_title': 'Need a change or have a question?',
      'pp.help_note': 'Call the Uno line or WhatsApp us.',
      'pp.returns_title': 'Return or exchange request',
      'pp.returns_sub': 'Returns are open for 14 days from delivery, and the item must be unused and in its full packaging.',
      'pp.returns_step1': 'Order details',
      'pp.returns_step2': 'Items and reason',
      'pp.returns_step3': 'Confirm',
      'pp.returns_load': 'Find order',
      'pp.returns_items': 'Choose the items to return',
      'pp.returns_select_all': 'Select all',
      'pp.returns_reason': 'Reason',
      'pp.returns_reason_ph': 'Choose a reason',
      'pp.reason_damaged': 'Arrived damaged',
      'pp.reason_wrong': 'Wrong item',
      'pp.reason_missing': 'Missing parts',
      'pp.reason_not_working': 'Not working',
      'pp.reason_not_needed': 'No longer needed',
      'pp.reason_other': 'Other reason',
      'pp.returns_details': 'Extra details',
      'pp.returns_details_ph': 'Describe the issue briefly (optional)',
      'pp.returns_refund': 'Refund route',
      'pp.refund_cod': 'Cash on delivery: cash refund at the branch, or a wallet/bank transfer after we receive the item.',
      'pp.refund_card': 'Card payment: refunded to the same card after we receive the item.',
      'pp.refund_note': 'Shipping fees are not refunded unless the fault is ours.',
      'pp.returns_window': 'Last day to return: {date}',
      'pp.returns_closed': 'The 14-day return window has closed for this order. Contact us if it is a manufacturing fault; warranty may cover it.',
      'pp.returns_submit': 'Send return request',
      'pp.returns_sending': 'Sending…',
      'pp.returns_ok_title': 'Return request recorded',
      'pp.returns_ok_sub': 'We will review it and call you within one working day. Keep this reference.',
      'pp.returns_ref': 'Reference',
      'pp.returns_wa': 'Send the details on WhatsApp',
      'pp.returns_wa_note': 'You can send photos of the item in the same chat.',
      'pp.returns_pick_error': 'Choose at least one item.',
      'pp.returns_reason_error': 'Choose a reason.',
      'pp.warranty_title': 'Warranty check',
      'pp.warranty_sub': 'See the warranty state of the items in your order.',
      'pp.warranty_check': 'Check warranty',
      'pp.warranty_valid': 'Warranty active',
      'pp.warranty_expired': 'Warranty ended',
      'pp.warranty_soon': 'Warranty ending soon',
      'pp.warranty_until': 'Active until {date}',
      'pp.warranty_ended': 'Ended on {date}',
      'pp.warranty_months': 'Warranty: {n} {unit}',
      'pp.month_1': 'month',
      'pp.month_2': 'months',
      'pp.month_few': 'months',
      'pp.month_many': 'months',
      'pp.warranty_start': 'Counted from the delivery date',
      'pp.warranty_none': 'No warranty is recorded for this item. Contact us if you need help.',
      'pp.warranty_note': 'Warranty covers manufacturing faults. Misuse or accidental damage is not covered.',
      'pp.warranty_claim': 'Open a warranty claim?',
      'pp.back_store': 'Back to store',
      'pp.track_again': 'Another order',
      'pp.days_left': '{n} days left',
      'pp.phone_hint': 'The same number you ordered with.',
      'pp.demo_hint': 'Try: UNO-261127-4821 with 01012345678',
      'pp.wa_text': 'Return request for order {order} — reference {ref}'
    }
  });

  var t = U.t;
  var STATUS = {
    placed: 'pp.status_placed', confirmed: 'pp.status_confirmed', prepared: 'pp.status_prepared',
    shipped: 'pp.status_shipped', delivered: 'pp.status_delivered',
    cancelled: 'pp.status_cancelled', returned: 'pp.status_returned'
  };

  function icon(name) {
    var paths = {
      check: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l4.4 4.4L19 7.3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      alert: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8v5m0 3.2v.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/></svg>',
      copy: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="8" y="8" width="11" height="12" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M15.5 5.5H6.5A1.5 1.5 0 005 7v9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
      truck: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 7h10v9H3zM13 10h4l3 3v3h-7z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="7" cy="18" r="1.7" stroke="currentColor" stroke-width="1.7"/><circle cx="17" cy="18" r="1.7" stroke="currentColor" stroke-width="1.7"/></svg>',
      store: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9h16v10.5H4z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M3 9l2-4.5h14L21 9" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
      cash: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="7" width="19" height="10" rx="2" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="2.4" stroke="currentColor" stroke-width="1.7"/></svg>',
      phone: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6.4 3.5h2.8l1.6 4-2 1.4a11 11 0 005.3 5.3l1.4-2 4 1.6v2.8a2 2 0 01-2.2 2A16 16 0 014.4 5.7a2 2 0 012-2.2z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
      whatsapp: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3.5a8.4 8.4 0 00-7.2 12.7L3.5 20.5l4.4-1.2A8.4 8.4 0 1012 3.5z" stroke="currentColor" stroke-width="1.6"/><path d="M9.2 8.6c-.4 0-.8.3-1 .6-.3.4-.4 1 .1 1.9.5.9 1.7 2 2.8 2.4.9.4 1.5.3 1.9 0 .3-.2.6-.6.6-1l-1.5-.7-.6.6c-.7-.3-1.5-1-1.8-1.7l.6-.6-.6-1.5z" fill="currentColor"/></svg>',
      shield: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3.5l7 2.6v5.4c0 4-3 7.2-7 9-4-1.8-7-5-7-9V6.1z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8.8 12.2l2.2 2.2 4.2-4.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      arrow: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 6l6 6-6 6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };
    return paths[name] || '';
  }

  /* ------------------------------------------------------------------ *
   * Shell
   * ------------------------------------------------------------------ */

  function shell(root, page, title, sub) {
    root.classList.add('uo-root');
    root.setAttribute('data-page', page);
    U.applyTheme(root);
    root.innerHTML = '' +
      '<header class="uo-head">' +
        '<div class="uo-head__in">' +
          '<a class="uo-brand" href="' + U.escapeHtml(U.config.storeHome) + '">' +
            '<span class="uo-brand__mark" aria-hidden="true"></span>' +
            '<span class="uo-brand__text">أونو<em>Uno</em></span>' +
          '</a>' +
          '<div class="uo-head__meta">' +
            '<a class="uo-head__support" href="tel:' + U.escapeHtml(U.config.hotline) + '">' +
              icon('phone') + '<bdi dir="ltr">' + U.escapeHtml(U.config.hotline) + '</bdi>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</header>' +
      '<main class="uo-page uo-page--narrow" id="uo-pp-main">' +
        '<div class="uo-page__head">' +
          '<a class="uo-back" href="' + U.escapeHtml(U.config.storeHome) + '">' + icon('arrow') + t('pp.back_store') + '</a>' +
          (title ? '<h1 class="uo-title">' + U.escapeHtml(title) + '</h1>' : '') +
          (sub ? '<p class="uo-sub">' + U.escapeHtml(sub) + '</p>' : '') +
        '</div>' +
        '<div class="uo-pp"></div>' +
      '</main>' +
      '<div class="uo-live" aria-live="polite" role="status"></div>';
    return {
      body: U.$('.uo-pp', root),
      live: U.$('.uo-live', root),
      head: U.$('.uo-page__head', root)
    };
  }

  function announce(live, message) {
    live.textContent = '';
    setTimeout(function () { live.textContent = message; }, 30);
  }

  function lookupForm(opts) {
    var form = U.el('form', { class: 'uo-lookup', novalidate: 'novalidate' });
    form.innerHTML = '' +
      '<div class="uo-field">' +
        '<label class="uo-label" for="uo-order-number">' + U.escapeHtml(t('pp.order_number')) + '</label>' +
        '<input id="uo-order-number" name="order_number" type="text" dir="ltr" autocomplete="off" placeholder="' + U.escapeHtml(t('pp.order_number_ph')) + '" value="' + U.escapeHtml(opts.orderNumber || '') + '">' +
        '<p class="uo-error"></p>' +
      '</div>' +
      '<div class="uo-field">' +
        '<label class="uo-label" for="uo-order-phone">' + U.escapeHtml(t('co.phone')) + '</label>' +
        '<input id="uo-order-phone" name="phone" type="tel" inputmode="tel" dir="ltr" autocomplete="tel" placeholder="01xxxxxxxxx" value="' + U.escapeHtml(opts.phone || '') + '">' +
        '<p class="uo-hint">' + U.escapeHtml(t('pp.phone_hint')) + '</p>' +
        '<p class="uo-error"></p>' +
      '</div>' +
      '<button class="uo-btn uo-btn--primary uo-btn--block" type="submit"><span>' + U.escapeHtml(opts.label || t('pp.track_btn_submit')) + '</span></button>' +
      (opts.demoHint ? '<p class="uo-demo-hint">' + U.escapeHtml(t('pp.demo_hint')) + '</p>' : '');
    return form;
  }

  function fieldError(form, name, message) {
    var input = U.$('[name="' + name + '"]', form);
    if (!input) return;
    var wrap = input.parentNode;
    wrap.classList.toggle('is-invalid', !!message);
    var err = U.$('.uo-error', wrap);
    if (err) err.textContent = message || '';
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  /* ------------------------------------------------------------------ *
   * Order card pieces
   * ------------------------------------------------------------------ */

  function statusChip(status) {
    var chip = U.el('span', { class: 'uo-status uo-status--' + status });
    chip.textContent = t(STATUS[status] || 'pp.status_placed');
    return chip;
  }

  function orderMeta(order) {
    var box = U.el('div', { class: 'uo-card uo-card--meta' });
    var rows = [];
    rows.push([t('pp.payment'), order.payment.method === 'cod'
      ? (U.config.lang === 'ar' ? order.payment.label_ar : order.payment.label_en)
      : t('pp.paid')]);
    rows.push([t('pp.delivery'), order.delivery.method === 'pickup' ? t('pp.delivery_pickup') : t('pp.delivery_home')]);
    if (order.delivery.method === 'pickup' && order.delivery.branch) {
      var b = order.delivery.branch;
      rows.push([t('pp.branch'), U.config.lang === 'ar' ? b.name_ar : b.name_en]);
      rows.push([t('pp.hours'), U.config.lang === 'ar' ? b.hours_ar : b.hours_en]);
    } else {
      var govName = U.config.lang === 'ar' ? order.delivery.governorate_ar : order.delivery.governorate_en;
      var addr = U.config.lang === 'ar' ? order.delivery.address_ar : order.delivery.address_en;
      rows.push([t('pp.address'), [addr, govName].filter(Boolean).join(' — ')]);
      if (order.delivery.eta_min_days !== undefined) {
        rows.push([t('pp.eta'), U.etaText({ eta_min_days: order.delivery.eta_min_days, eta_max_days: order.delivery.eta_max_days })]);
      }
    }
    rows.push([t('pp.placed_at'), U.dateTime(order.placed_at)]);
    if (order.delivered_at) rows.push([t('pp.delivered_at'), U.dateTime(order.delivered_at)]);

    var dl = U.el('dl', { class: 'uo-meta' });
    rows.forEach(function (r) {
      if (!r[1]) return;
      var row = U.el('div', { class: 'uo-meta__row' });
      var dt = U.el('dt'); dt.textContent = r[0];
      var dd = U.el('dd'); dd.textContent = r[1];
      row.appendChild(dt); row.appendChild(dd);
      dl.appendChild(row);
    });
    box.appendChild(dl);
    return box;
  }

  function itemsCard(order) {
    var card = U.el('div', { class: 'uo-card' });
    var h = U.el('h3', { class: 'uo-card__title' });
    h.textContent = t('pp.items');
    card.appendChild(h);
    var list = U.el('ul', { class: 'uo-lines uo-lines--readonly' });
    order.items.forEach(function (it) {
      var li = U.el('li', { class: 'uo-line' });
      var name = U.config.lang === 'ar' ? it.name_ar : it.name_en;
      var variant = U.config.lang === 'ar' ? it.variant_ar : it.variant_en;
      var thumb = U.el('div', { class: 'uo-line__thumb' + (it.image_svg ? ' has-art' : '') });
      if (it.image_svg) thumb.innerHTML = it.image_svg;
      li.appendChild(thumb);
      var body = U.el('div', { class: 'uo-line__body' });
      var nm = U.el('p', { class: 'uo-line__name' }); nm.textContent = name; body.appendChild(nm);
      if (variant) { var vr = U.el('p', { class: 'uo-line__variant' }); vr.textContent = variant + ' × ' + it.qty; body.appendChild(vr); }
      li.appendChild(body);
      var side = U.el('div', { class: 'uo-line__side' });
      var price = U.el('span', { class: 'uo-line__price' });
      price.textContent = U.money(it.price * it.qty);
      side.appendChild(price);
      li.appendChild(side);
      list.appendChild(li);
    });
    card.appendChild(list);

    var totals = U.el('dl', { class: 'uo-totals' });
    totals.appendChild(row(t('co.subtotal'), U.money(order.totals.subtotal)));
    totals.appendChild(row(t('co.shipping'), order.totals.shipping ? U.money(order.totals.shipping) : t('co.rate_free')));
    if (order.totals.discount) totals.appendChild(row(t('co.discount'), '−' + U.money(order.totals.discount)));
    totals.appendChild(row(t('co.total'), U.money(order.totals.total), true));
    card.appendChild(totals);
    return card;
  }

  function row(label, value, strong) {
    var r = U.el('div', { class: 'uo-totals__row' + (strong ? ' uo-totals__row--total' : '') });
    var dt = U.el('dt'); dt.textContent = label;
    var dd = U.el('dd'); dd.textContent = value;
    r.appendChild(dt); r.appendChild(dd);
    return r;
  }

  function timeline(order) {
    var card = U.el('div', { class: 'uo-card' });
    var h = U.el('h3', { class: 'uo-card__title' });
    h.textContent = t('pp.timeline');
    card.appendChild(h);
    var ol = U.el('ol', { class: 'uo-timeline' });
    var lastDone = -1;
    order.timeline.forEach(function (step, i) { if (step.done) lastDone = i; });
    order.timeline.forEach(function (step, i) {
      var li = U.el('li', { class: 'uo-timeline__step' + (step.done ? ' is-done' : '') + (i === lastDone ? ' is-current' : '') });
      var dot = U.el('span', { class: 'uo-timeline__dot', 'aria-hidden': 'true' });
      if (step.done) dot.innerHTML = icon('check');
      li.appendChild(dot);
      var body = U.el('div', { class: 'uo-timeline__body' });
      var label = U.el('p', { class: 'uo-timeline__label' });
      label.textContent = t('pp.status_' + step.key);
      body.appendChild(label);
      var when = U.el('p', { class: 'uo-timeline__when' });
      when.textContent = step.at ? U.dateTime(step.at) : (step.done ? '' : '—');
      body.appendChild(when);
      li.appendChild(body);
      ol.appendChild(li);
    });
    card.appendChild(ol);
    var updated = U.el('p', { class: 'uo-card__foot' });
    updated.textContent = t('pp.updated') + ': ' + U.dateTime(order.updated_at);
    card.appendChild(updated);
    return card;
  }

  function helpCard() {
    var card = U.el('div', { class: 'uo-card uo-card--help' });
    card.innerHTML = '' +
      '<div>' +
        '<h3 class="uo-card__title">' + U.escapeHtml(t('pp.help_title')) + '</h3>' +
        '<p>' + U.escapeHtml(t('pp.help_note')) + '</p>' +
      '</div>' +
      '<div class="uo-help__actions">' +
        '<a class="uo-btn uo-btn--ghost" href="tel:' + U.escapeHtml(U.config.hotline) + '">' + icon('phone') + '<bdi dir="ltr">' + U.escapeHtml(U.config.hotline) + '</bdi></a>' +
        '<a class="uo-btn uo-btn--ghost" href="' + U.escapeHtml(U.whatsappLink(t('pp.help_title'))) + '" target="_blank" rel="noopener">' + icon('whatsapp') + U.escapeHtml(t('common.whatsapp')) + '</a>' +
      '</div>';
    return card;
  }

  /* ------------------------------------------------------------------ *
   * Confirmation
   * ------------------------------------------------------------------ */

  function initConfirm(root) {
    var parts = shell(root, 'confirm');
    var order = U.readLastOrder();
    var queryOrder = U.query('order');

    if (!order) {
      parts.body.innerHTML = '' +
        '<div class="uo-empty">' +
          '<div class="uo-empty__art">' + icon('alert') + '</div>' +
          '<h2>' + U.escapeHtml(t('pp.no_order')) + '</h2>' +
          '<p>' + U.escapeHtml(t('pp.no_order_note')) + '</p>' +
          '<a class="uo-btn uo-btn--primary" href="order-tracking.html' + (queryOrder ? '?order=' + encodeURIComponent(queryOrder) : '') + '">' + U.escapeHtml(t('pp.track_btn')) + '</a>' +
        '</div>';
      return;
    }
    if (queryOrder) order.number = queryOrder;

    var name = (order.customer && order.customer.name) || '';
    var wrap = U.el('div', { class: 'uo-confirm' });

    var hero = U.el('div', { class: 'uo-hero' });
    hero.innerHTML = '' +
      '<div class="uo-hero__badge" aria-hidden="true">' + icon('check') + '</div>' +
      '<h1 class="uo-hero__title">' + U.escapeHtml(t('pp.confirm_title')) + '</h1>' +
      '<p class="uo-hero__sub">' + U.escapeHtml(t('pp.confirm_sub', { name: name || '' })) + '</p>';
    wrap.appendChild(hero);

    var ticket = U.el('div', { class: 'uo-ticket' });
    var label = U.el('span', { class: 'uo-ticket__label' });
    label.textContent = t('pp.order_number');
    var number = U.el('strong', { class: 'uo-ticket__number' });
    number.textContent = order.number;
    var copy = U.el('button', { type: 'button', class: 'uo-ticket__copy' });
    copy.innerHTML = icon('copy') + '<span>' + U.escapeHtml(t('pp.copy_number')) + '</span>';
    copy.addEventListener('click', function () {
      var text = order.number;
      var done = function () {
        var span = U.$('span', copy);
        if (span) { span.textContent = t('common.copied'); setTimeout(function () { span.textContent = t('pp.copy_number'); }, 2000); }
      };
      if (global.navigator && navigator.clipboard) navigator.clipboard.writeText(text).then(done, done);
      else done();
    });
    ticket.appendChild(label);
    ticket.appendChild(number);
    ticket.appendChild(copy);
    wrap.appendChild(ticket);

    var due = U.el('div', { class: 'uo-due' });
    due.innerHTML = '' +
      '<span class="uo-due__label">' + U.escapeHtml(t('pp.due_on_delivery')) + '</span>' +
      '<strong class="uo-due__amount">' + U.money(order.totals.total) + '</strong>' +
      '<span class="uo-due__method">' + icon('cash') + U.escapeHtml(order.payment.method === 'cod' ? t('co.payment_cod') : t('pp.paid')) + '</span>';
    wrap.appendChild(due);

    wrap.appendChild(orderMeta(order));
    wrap.appendChild(itemsCard(order));

    var next = U.el('div', { class: 'uo-card uo-card--next' });
    next.innerHTML = '' +
      '<h3 class="uo-card__title">' + U.escapeHtml(t('pp.next_title')) + '</h3>' +
      '<ol class="uo-next">' +
        '<li><span>1</span>' + U.escapeHtml(t('pp.next_1')) + '</li>' +
        '<li><span>2</span>' + U.escapeHtml(t('pp.next_2')) + '</li>' +
        '<li><span>3</span>' + U.escapeHtml(t('pp.next_3')) + '</li>' +
      '</ol>';
    wrap.appendChild(next);

    var actions = U.el('div', { class: 'uo-actions' });
    actions.innerHTML = '' +
      '<a class="uo-btn uo-btn--primary" href="order-tracking.html?order=' + encodeURIComponent(order.number) + '">' + icon('truck') + U.escapeHtml(t('pp.track_btn')) + '</a>' +
      '<a class="uo-btn uo-btn--ghost" href="returns.html?order=' + encodeURIComponent(order.number) + '">' + U.escapeHtml(t('pp.returns_btn')) + '</a>' +
      '<a class="uo-btn uo-btn--ghost" href="warranty.html?order=' + encodeURIComponent(order.number) + '">' + U.escapeHtml(t('pp.warranty_btn')) + '</a>';
    wrap.appendChild(actions);

    var save = U.el('p', { class: 'uo-save-note' });
    save.innerHTML = icon('check') + '<span>' + U.escapeHtml(t('pp.save_note')) + '</span>';
    wrap.appendChild(save);

    parts.body.appendChild(wrap);
    parts.head.classList.add('uo-page__head--hidden');
  }

  /* ------------------------------------------------------------------ *
   * Tracking
   * ------------------------------------------------------------------ */

  function loadOrder(orderNumber, phone) {
    return U.rpc('store_order_track', {
      order_number: orderNumber,
      phone: U.normalizePhone(phone),
      _state: U.query('demo') || undefined
    }).then(function (res) { return res.order; });
  }

  function initTrack(root) {
    var parts = shell(root, 'track', t('pp.track_title'), t('pp.track_sub'));
    var prefillNumber = U.query('order') || '';
    var prefillPhone = (U.readLastOrder() || {}).phone || '';

    var form = lookupForm({ orderNumber: prefillNumber, phone: prefillPhone, label: t('pp.track_btn_submit'), demoHint: U.config.demo });
    var result = U.el('div', { class: 'uo-result' });
    parts.body.appendChild(form);
    parts.body.appendChild(result);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var number = U.$('[name="order_number"]', form).value.trim();
      var phone = U.$('[name="phone"]', form).value.trim();
      fieldError(form, 'order_number', number ? '' : t('common.field_required'));
      fieldError(form, 'phone', U.isEgyptianMobile(phone) ? '' : t('common.phone_invalid'));
      if (!number || !U.isEgyptianMobile(phone)) return;

      var btn = U.$('button[type="submit"] span', form);
      var original = btn.textContent;
      btn.textContent = t('pp.tracking');
      result.innerHTML = '<div class="uo-card"><div class="uo-skel uo-skel--line"></div><div class="uo-skel uo-skel--line short"></div></div>';

      loadOrder(number, phone).then(function (order) {
        btn.textContent = original;
        renderTrackResult(result, order, number, phone);
      }).catch(function (err) {
        btn.textContent = original;
        result.innerHTML = '';
        var note = U.el('div', { class: 'uo-note uo-note--error' });
        note.innerHTML = icon('alert') + '<div><strong>' + U.escapeHtml(t('common.not_found')) + '</strong><p>' +
          U.escapeHtml(err && err.code === 'ORDER_NOT_FOUND' ? t('pp.not_found') : t('common.error_generic')) + '</p></div>';
        result.appendChild(note);
        announce(parts.live, t('pp.not_found'));
      });
    });

    if (prefillNumber && prefillPhone) {
      setTimeout(function () { form.dispatchEvent(new Event('submit', { cancelable: true })); }, 60);
    }
  }

  function renderTrackResult(container, order, number, phone) {
    container.innerHTML = '';
    var head = U.el('div', { class: 'uo-track-head' });
    var left = U.el('div');
    var label = U.el('p', { class: 'uo-track-head__label' });
    label.textContent = t('pp.order_number');
    var num = U.el('p', { class: 'uo-track-head__number' });
    num.textContent = order.number;
    left.appendChild(label); left.appendChild(num);
    head.appendChild(left);
    head.appendChild(statusChip(order.status));
    container.appendChild(head);

    container.appendChild(timeline(order));
    container.appendChild(itemsCard(order));
    container.appendChild(orderMeta(order));
    container.appendChild(helpCard());

    var again = U.el('button', { type: 'button', class: 'uo-linkbtn uo-linkbtn--center' });
    again.textContent = t('pp.track_again');
    again.addEventListener('click', function () {
      container.innerHTML = '';
      var f = U.$('form', U.$('.uo-page', container.closest('.uo-root')));
      if (f) f.reset();
    });
    container.appendChild(again);
  }

  /* ------------------------------------------------------------------ *
   * Returns
   * ------------------------------------------------------------------ */

  function returnDeadline(order) {
    if (!order.delivered_at) return null;
    var d = new Date(order.delivered_at);
    d.setDate(d.getDate() + (U.config.returnWindowDays || 14));
    return d;
  }

  function initReturns(root) {
    var parts = shell(root, 'returns', t('pp.returns_title'), t('pp.returns_sub'));
    var state = { order: null, picked: {}, reason: '', details: '', submitted: null };

    var step1 = U.el('section', { class: 'uo-step uo-step--card' });
    var h1 = U.el('h2', { class: 'uo-step__title' });
    h1.textContent = t('pp.returns_step1');
    step1.appendChild(h1);
    var form = lookupForm({
      orderNumber: U.query('order') || '',
      phone: (U.readLastOrder() || {}).phone || '',
      label: t('pp.returns_load'),
      demoHint: U.config.demo
    });
    step1.appendChild(form);
    parts.body.appendChild(step1);

    var step2 = U.el('section', { class: 'uo-step uo-step--card', hidden: 'hidden' });
    parts.body.appendChild(step2);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var number = U.$('[name="order_number"]', form).value.trim();
      var phone = U.$('[name="phone"]', form).value.trim();
      fieldError(form, 'order_number', number ? '' : t('common.field_required'));
      fieldError(form, 'phone', U.isEgyptianMobile(phone) ? '' : t('common.phone_invalid'));
      if (!number || !U.isEgyptianMobile(phone)) return;

      var btn = U.$('button[type="submit"] span', form);
      btn.textContent = t('pp.tracking');
      loadOrder(number, phone).then(function (order) {
        btn.textContent = t('pp.returns_load');
        state.order = order;
        renderReturnsStep2(step2, state, parts, form, step1);
      }).catch(function () {
        btn.textContent = t('pp.returns_load');
        fieldError(form, 'order_number', t('pp.not_found'));
        announce(parts.live, t('pp.not_found'));
      });
    });
  }

  function renderReturnsStep2(container, state, parts, form, step1) {
    var order = state.order;
    container.hidden = false;
    container.innerHTML = '';
    step1.classList.add('is-collapsed');

    var h = U.el('h2', { class: 'uo-step__title' });
    h.textContent = t('pp.returns_step2');
    container.appendChild(h);

    var deadline = returnDeadline(order);
    var open = deadline && deadline.getTime() >= Date.now() && order.status === 'delivered';

    var summary = U.el('div', { class: 'uo-card uo-card--order' });
    var line = U.el('div', { class: 'uo-order-line' });
    var lineText = U.el('div');
    lineText.innerHTML = '<p class="uo-order-line__label">' + U.escapeHtml(t('pp.order_number')) + '</p>' +
      '<p class="uo-order-line__value">' + U.escapeHtml(order.number) + '</p>';
    line.appendChild(lineText);
    line.appendChild(statusChip(order.status));
    summary.appendChild(line);
    container.appendChild(summary);

    if (!open) {
      var closed = U.el('div', { class: 'uo-note uo-note--warn' });
      closed.innerHTML = icon('alert') + '<div><strong>' + U.escapeHtml(t('pp.returns_closed')) + '</strong></div>';
      container.appendChild(closed);
      container.appendChild(helpCard());
      return;
    }

    var windowNote = U.el('p', { class: 'uo-window' });
    windowNote.innerHTML = icon('check') + '<span>' + U.escapeHtml(t('pp.returns_window', { date: U.date(deadline.toISOString()) })) + '</span>';
    container.appendChild(windowNote);

    var listTitle = U.el('h3', { class: 'uo-card__title' });
    listTitle.textContent = t('pp.returns_items');
    container.appendChild(listTitle);

    var list = U.el('ul', { class: 'uo-pick' });
    order.items.forEach(function (item, i) {
      var li = U.el('li', { class: 'uo-pick__row' });
      var id = 'uo-return-' + i;
      var input = U.el('input', { type: 'checkbox', id: id, name: 'return_item', value: String(i) });
      input.addEventListener('change', function () {
        if (input.checked) state.picked[i] = true; else delete state.picked[i];
        rowErr.textContent = '';
      });
      var label = U.el('label', { for: id, class: 'uo-pick__label' });
      var name = U.config.lang === 'ar' ? item.name_ar : item.name_en;
      var variant = U.config.lang === 'ar' ? item.variant_ar : item.variant_en;
      label.innerHTML = '<strong>' + U.escapeHtml(name) + '</strong>' +
        '<span>' + U.escapeHtml([variant, '× ' + item.qty].filter(Boolean).join(' — ')) + '</span>';
      var price = U.el('span', { class: 'uo-pick__price' });
      price.textContent = U.money(item.price * item.qty);
      var thumb = U.el('div', { class: 'uo-line__thumb' + (item.image_svg ? ' has-art' : '') });
      if (item.image_svg) thumb.innerHTML = item.image_svg;
      li.appendChild(input);
      li.appendChild(thumb);
      li.appendChild(label);
      li.appendChild(price);
      list.appendChild(li);
    });
    container.appendChild(list);

    var rowErr = U.el('p', { class: 'uo-error' });
    container.appendChild(rowErr);

    var selectAll = U.el('button', { type: 'button', class: 'uo-linkbtn' });
    selectAll.textContent = t('pp.returns_select_all');
    selectAll.addEventListener('click', function () {
      order.items.forEach(function (_, i) { state.picked[i] = true; });
      Array.prototype.forEach.call(container.querySelectorAll('input[name="return_item"]'), function (c) { c.checked = true; });
      rowErr.textContent = '';
    });
    container.appendChild(selectAll);

    var reasonWrap = U.el('div', { class: 'uo-field' });
    reasonWrap.innerHTML = '' +
      '<label class="uo-label" for="uo-return-reason">' + U.escapeHtml(t('pp.returns_reason')) + '</label>' +
      '<select id="uo-return-reason" name="reason">' +
        '<option value="">' + U.escapeHtml(t('pp.returns_reason_ph')) + '</option>' +
        '<option value="damaged">' + U.escapeHtml(t('pp.reason_damaged')) + '</option>' +
        '<option value="wrong">' + U.escapeHtml(t('pp.reason_wrong')) + '</option>' +
        '<option value="missing">' + U.escapeHtml(t('pp.reason_missing')) + '</option>' +
        '<option value="not_working">' + U.escapeHtml(t('pp.reason_not_working')) + '</option>' +
        '<option value="not_needed">' + U.escapeHtml(t('pp.reason_not_needed')) + '</option>' +
        '<option value="other">' + U.escapeHtml(t('pp.reason_other')) + '</option>' +
      '</select>' +
      '<p class="uo-error"></p>';
    var select = U.$('select', reasonWrap);
    select.addEventListener('change', function () {
      state.reason = select.value;
      fieldErrorIn(reasonWrap, '');
    });
    container.appendChild(reasonWrap);

    var detailsWrap = U.el('div', { class: 'uo-field' });
    detailsWrap.innerHTML = '' +
      '<label class="uo-label" for="uo-return-details">' + U.escapeHtml(t('pp.returns_details')) + ' <span class="uo-label__hint">' + U.escapeHtml(t('common.optional')) + '</span></label>' +
      '<textarea id="uo-return-details" rows="3" placeholder="' + U.escapeHtml(t('pp.returns_details_ph')) + '"></textarea>';
    var details = U.$('textarea', detailsWrap);
    details.addEventListener('input', function () { state.details = details.value; });
    container.appendChild(detailsWrap);

    var refund = U.el('div', { class: 'uo-note' });
    refund.innerHTML = icon('cash') + '<div><strong>' + U.escapeHtml(t('pp.returns_refund')) + '</strong><p>' +
      U.escapeHtml(order.payment.method === 'cod' ? t('pp.refund_cod') : t('pp.refund_card')) + '</p><p class="uo-note__small">' +
      U.escapeHtml(t('pp.refund_note')) + '</p></div>';
    container.appendChild(refund);

    var submit = U.el('button', { type: 'button', class: 'uo-btn uo-btn--primary uo-btn--block' });
    submit.innerHTML = '<span>' + U.escapeHtml(t('pp.returns_submit')) + '</span>';
    submit.addEventListener('click', function () {
      var picked = Object.keys(state.picked);
      var ok = true;
      if (!picked.length) { rowErr.textContent = t('pp.returns_pick_error'); ok = false; }
      if (!state.reason) { fieldErrorIn(reasonWrap, t('pp.returns_reason_error')); ok = false; }
      if (!ok) return;

      submit.disabled = true;
      var span = U.$('span', submit);
      span.textContent = t('pp.returns_sending');

      var ref = 'RET-' + order.number.replace('UNO-', '') + '-' + String(Math.floor(100 + Math.random() * 899));
      var payload = {
        order_number: order.number,
        items: picked.map(function (i) { return { name_ar: order.items[i].name_ar, qty: order.items[i].qty, price: order.items[i].price }; }),
        reason: state.reason,
        details: state.details,
        refund_route: order.payment.method === 'cod' ? 'cash_or_wallet' : 'card',
        reference: ref
      };

      var finish = function (reference) {
        state.submitted = payload;
        renderReturnSuccess(container, order, reference || ref, state, parts);
      };
      var sender = U.config.returnsSubmit;
      if (typeof sender === 'function') {
        Promise.resolve(sender(payload)).then(function (res) {
          finish((res && res.reference) || ref);
        }).catch(function () {
          submit.disabled = false;
          span.textContent = t('pp.returns_submit');
          announce(parts.live, t('common.error_generic'));
        });
      } else {
        setTimeout(function () { finish(ref); }, 500);
      }
    });
    container.appendChild(submit);
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function fieldErrorIn(wrap, message) {
    wrap.classList.toggle('is-invalid', !!message);
    var err = U.$('.uo-error', wrap);
    if (err) err.textContent = message || '';
  }

  function renderReturnSuccess(container, order, ref, state, parts) {
    container.innerHTML = '';
    var h = U.el('h2', { class: 'uo-step__title' });
    h.textContent = t('pp.returns_step3');
    container.appendChild(h);

    var ok = U.el('div', { class: 'uo-card uo-card--success' });
    ok.innerHTML = '' +
      '<div class="uo-hero__badge uo-hero__badge--sm" aria-hidden="true">' + icon('check') + '</div>' +
      '<h3>' + U.escapeHtml(t('pp.returns_ok_title')) + '</h3>' +
      '<p>' + U.escapeHtml(t('pp.returns_ok_sub')) + '</p>';
    container.appendChild(ok);

    var ticket = U.el('div', { class: 'uo-ticket' });
    ticket.innerHTML = '' +
      '<span class="uo-ticket__label">' + U.escapeHtml(t('pp.returns_ref')) + '</span>' +
      '<strong class="uo-ticket__number">' + U.escapeHtml(ref) + '</strong>';
    container.appendChild(ticket);

    var wa = U.el('a', {
      class: 'uo-btn uo-btn--ghost uo-btn--block',
      href: U.whatsappLink(t('pp.wa_text', { order: order.number, ref: ref })),
      target: '_blank', rel: 'noopener'
    });
    wa.innerHTML = icon('whatsapp') + U.escapeHtml(t('pp.returns_wa'));
    container.appendChild(wa);

    var waNote = U.el('p', { class: 'uo-save-note' });
    waNote.textContent = t('pp.returns_wa_note');
    container.appendChild(waNote);
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    announce(parts.live, t('pp.returns_ok_title'));
  }

  /* ------------------------------------------------------------------ *
   * Warranty
   * ------------------------------------------------------------------ */

  function monthsLabel(n) {
    if (n === 1) return t('pp.month_1');
    if (n === 2) return t('pp.month_2');
    if (n <= 10) return t('pp.month_few');
    return t('pp.month_many');
  }

  function warrantyState(order) {
    var start = order.delivered_at ? new Date(order.delivered_at) : null;
    return order.items.map(function (item) {
      var months = item.warranty_months || 0;
      if (!months || !start) return { item: item, state: 'none' };
      var end = new Date(start);
      end.setMonth(end.getMonth() + months);
      var daysLeft = Math.ceil((end.getTime() - Date.now()) / 86400000);
      var state = daysLeft < 0 ? 'expired' : daysLeft <= 30 ? 'soon' : 'valid';
      return { item: item, state: state, end: end, daysLeft: daysLeft, months: months };
    });
  }

  function initWarranty(root) {
    var parts = shell(root, 'warranty', t('pp.warranty_title'), t('pp.warranty_sub'));
    var form = lookupForm({
      orderNumber: U.query('order') || '',
      phone: (U.readLastOrder() || {}).phone || '',
      label: t('pp.warranty_check'),
      demoHint: U.config.demo
    });
    var result = U.el('div', { class: 'uo-result' });
    parts.body.appendChild(form);
    parts.body.appendChild(result);

    var run = function () {
      var number = U.$('[name="order_number"]', form).value.trim();
      var phone = U.$('[name="phone"]', form).value.trim();
      fieldError(form, 'order_number', number ? '' : t('common.field_required'));
      fieldError(form, 'phone', U.isEgyptianMobile(phone) ? '' : t('common.phone_invalid'));
      if (!number || !U.isEgyptianMobile(phone)) return;
      result.innerHTML = '<div class="uo-card"><div class="uo-skel uo-skel--line"></div><div class="uo-skel uo-skel--line short"></div></div>';
      loadOrder(number, phone).then(function (order) {
        result.innerHTML = '';
        var rows = warrantyState(order);
        var head = U.el('div', { class: 'uo-track-head' });
        head.innerHTML = '<div><p class="uo-track-head__label">' + U.escapeHtml(t('pp.order_number')) +
          '</p><p class="uo-track-head__number">' + U.escapeHtml(order.number) + '</p></div>';
        result.appendChild(head);

        var list = U.el('div', { class: 'uo-warranty' });
        rows.forEach(function (r) {
          var item = r.item;
          var name = U.config.lang === 'ar' ? item.name_ar : item.name_en;
          var variant = U.config.lang === 'ar' ? item.variant_ar : item.variant_en;
          var card = U.el('div', { class: 'uo-warranty__card is-' + r.state });
          var badge = t('pp.warranty_valid');
          if (r.state === 'expired') badge = t('pp.warranty_expired');
          else if (r.state === 'soon') badge = t('pp.warranty_soon');
          else if (r.state === 'none') badge = t('pp.warranty_none');

          card.innerHTML = '' +
            '<div class="uo-warranty__head">' +
              '<span class="uo-warranty__icon">' + icon(r.state === 'none' ? 'alert' : 'shield') + '</span>' +
              '<div class="uo-warranty__names">' +
                '<strong>' + U.escapeHtml(name) + '</strong>' +
                '<span>' + U.escapeHtml(variant || '') + '</span>' +
              '</div>' +
              '<span class="uo-warranty__badge">' + U.escapeHtml(badge) + '</span>' +
            '</div>' +
            '<div class="uo-warranty__meta">' +
              (r.months ? '<span>' + U.escapeHtml(t('pp.warranty_months', { n: r.months, unit: monthsLabel(r.months) })) + '</span>' : '') +
              (r.end ? '<span>' + U.escapeHtml(r.state === 'expired'
                ? t('pp.warranty_ended', { date: U.date(r.end.toISOString()) })
                : t('pp.warranty_until', { date: U.date(r.end.toISOString()) })) + '</span>' : '') +
              (r.state === 'valid' || r.state === 'soon' ? '<span>' + U.escapeHtml(t('pp.days_left', { n: r.daysLeft })) + '</span>' : '') +
            '</div>';
          list.appendChild(card);
        });
        result.appendChild(list);

        var note = U.el('div', { class: 'uo-note' });
        note.innerHTML = icon('shield') + '<div><p>' + U.escapeHtml(t('pp.warranty_note')) + '</p><p class="uo-note__small">' +
          U.escapeHtml(t('pp.warranty_start')) + '</p></div>';
        result.appendChild(note);

        var claim = U.el('a', {
          class: 'uo-btn uo-btn--ghost uo-btn--block',
          href: U.whatsappLink(t('pp.warranty_claim') + ' — ' + order.number),
          target: '_blank', rel: 'noopener'
        });
        claim.innerHTML = icon('whatsapp') + U.escapeHtml(t('pp.warranty_claim'));
        result.appendChild(claim);
        result.appendChild(helpCard());
      }).catch(function () {
        result.innerHTML = '';
        var note = U.el('div', { class: 'uo-note uo-note--error' });
        note.innerHTML = icon('alert') + '<div><strong>' + U.escapeHtml(t('common.not_found')) + '</strong><p>' + U.escapeHtml(t('pp.not_found')) + '</p></div>';
        result.appendChild(note);
      });
    };

    form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
    if (U.$('[name="order_number"]', form).value && U.$('[name="phone"]', form).value) setTimeout(run, 60);
  }

  /* ------------------------------------------------------------------ */

  function init(options) {
    var opts = options || {};
    if (opts.config) U.configure(opts.config);
    U.applyTheme();
    var root = typeof opts.root === 'string' ? U.$(opts.root) : (opts.root || U.$('#uno-store-pp'));
    if (!root) throw new Error('uno-store: post-purchase root not found');
    var page = opts.page || root.getAttribute('data-uno-page') || 'track';
    if (page === 'confirm') initConfirm(root);
    else if (page === 'returns') initReturns(root);
    else if (page === 'warranty') initWarranty(root);
    else initTrack(root);
  }

  global.UnoStore.PostPurchase = { init: init, warrantyState: warrantyState, returnDeadline: returnDeadline };
})(window);
