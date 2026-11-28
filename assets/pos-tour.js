/* In-app step-by-step tutorial for the till. Client only, no database. Shown once per browser, replay from the "?" pill. */
(function () {
  'use strict';
  var KEY = 'uno.pos.tour.v1';
  var AR = function () { return (document.documentElement.getAttribute('lang') || 'ar') === 'ar'; };
  var STEPS = [
    { s: '#searchInput', ar: ['ابحث أو امسح', 'اكتب اسم الصنف أو امسح الباركود من هنا. الصنف بيتضاف للفاتورة.'], en: ['Search or scan', 'Type an item name or scan its barcode here. The item is added to the cart.'] },
    { s: '#payBtn,#payBtnM', ar: ['الدفع', 'لما الفاتورة تجهز اضغط هنا لاختيار طريقة الدفع وإتمام البيع.'], en: ['Pay', 'When the cart is ready, press here to choose the payment method and finish the sale.'] },
    { s: '#holdBtn,#holdBtnM', ar: ['تعليق الفاتورة', 'علّق الفاتورة الحالية لخدمة عميل تاني، وارجعلها بعدين.'], en: ['Hold the cart', 'Hold the current cart to serve another customer, then come back to it later.'] },
    { s: '#shiftPill', ar: ['الوردية', 'من هنا تفتح وتقفل الوردية وتراجع النقدية.'], en: ['Shift', 'Open and close your shift and review the cash from here.'] },
    { s: '#connPill', ar: ['حالة الاتصال', 'لو النت فصل، البيع بيكمل ويتبعت لما الاتصال يرجع.'], en: ['Connection', 'If the internet drops, sales continue and are sent when the connection returns.'] }
  ];
  var i = 0, box = null, hi = null;
  function vis(sel) { var a = document.querySelectorAll(sel); for (var k = 0; k < a.length; k++) if (a[k].offsetParent) return a[k]; return null; }
  function done() { try { localStorage.setItem(KEY, '1'); } catch (e) {} if (box) box.remove(); if (hi) hi.remove(); box = hi = null; }
  function show() {
    var st = STEPS[i]; var el = vis(st.s);
    while (!el || !el.offsetParent) { if (i >= STEPS.length - 1) return done(); i++; st = STEPS[i]; el = vis(st.s); }
    var ar = AR(), tx = ar ? st.ar : st.en, last = i === STEPS.length - 1;
    if (!box) {
      hi = document.createElement('div'); hi.style.cssText = 'position:fixed;z-index:99998;border:3px solid #ff6a00;border-radius:10px;pointer-events:none;box-shadow:0 0 0 9999px rgba(0,0,0,.55)';
      box = document.createElement('div'); box.setAttribute('role', 'dialog'); box.style.cssText = 'position:fixed;z-index:99999;left:12px;right:12px;bottom:12px;max-width:420px;margin:0 auto;background:#161a20;color:#fff;border:1px solid #2a2f36;border-radius:14px;padding:14px;font-size:16px;line-height:1.5';
      document.body.appendChild(hi); document.body.appendChild(box);
    }
    box.setAttribute('dir', ar ? 'rtl' : 'ltr');
    var r = el.getBoundingClientRect();
    if (r.top > innerHeight / 2) { box.style.top = '12px'; box.style.bottom = 'auto'; } else { box.style.bottom = '12px'; box.style.top = 'auto'; }
    hi.style.left = (r.left - 4) + 'px'; hi.style.top = (r.top - 4) + 'px'; hi.style.width = (r.width + 8) + 'px'; hi.style.height = (r.height + 8) + 'px';
    var b = 'min-height:44px;min-width:88px;border-radius:10px;border:1px solid #3a414b;background:#222831;color:#fff;font-size:16px;padding:0 14px';
    box.innerHTML = '<div dir="ltr" style="font-size:12px;opacity:.7">' + (i + 1) + ' / ' + STEPS.length + '</div><strong style="font-size:18px">' + tx[0] + '</strong><p style="margin:6px 0 12px">' + tx[1] + '</p>'
      + '<div style="display:flex;gap:8px;justify-content:space-between"><button type="button" id="tour-skip" style="' + b + '">' + (ar ? 'تخطي' : 'Skip') + '</button><button type="button" id="tour-next" style="' + b + ';background:#ff6a00;border-color:#ff6a00;color:#111;font-weight:700">' + (last ? (ar ? 'تمام' : 'Done') : (ar ? 'التالي' : 'Next')) + '</button></div>';
    box.querySelector('#tour-skip').onclick = done;
    box.querySelector('#tour-next').onclick = function () { if (last) return done(); i++; show(); };
  }
  function start() { i = 0; if (box) done(); show(); }
  function mount() {
    var m = document.querySelector('.top-meta'); if (!m || document.getElementById('tourPill')) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'tourPill'; b.className = 'pill btn'; b.textContent = '?'; b.setAttribute('aria-label', 'Tutorial'); b.title = 'شرح الاستخدام / Tutorial'; b.style.minWidth = '44px'; b.style.minHeight = '44px';
    b.onclick = start; m.insertBefore(b, m.firstChild);
    var seen = false; try { seen = localStorage.getItem(KEY) === '1'; } catch (e) {}
    if (!seen) setTimeout(start, 1500);
  }
  window.UnoTour = { start: start };
  document.addEventListener('DOMContentLoaded', function () { setTimeout(mount, 800); });
})();
