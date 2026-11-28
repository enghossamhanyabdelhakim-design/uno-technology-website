/*!
 * Uno store — product page behaviour: swipeable gallery, sticky-bar reveal,
 * and share (trust row and WhatsApp link removed: held for owner).
 * Runs on top of the rendered product page; re-applies after every re-render.
 *
 *   <script src="assets/uno-pdp.js" defer></script>
 *
 */
(function (w, d) {
  'use strict';
    var T = function (ar, en) { return d.documentElement.lang === 'en' ? en : ar; };
  function q(s, r) { return (r || d).querySelector(s); }
  function txt(e) { return e ? String(e.textContent || '').replace(/\s+/g, ' ').trim() : ''; }

  var ICON = {
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 12h.01M18 12h.01"/></svg>',
  };

  function priceText() {
    var b = q('.us-info .us-pr .big');
    return txt(b);
  }

  function buildExtras(info) {
    var p = q('.us-info .us-buy', info);
    if (!p) return;
    if (!q('.uno-ask-share', info) && w.navigator && navigator.share) {
      var sh = d.createElement('button');
      sh.type = 'button'; sh.className = 'uno-ask-share';
      sh.textContent = T('شارك المنتج', 'Share this product');
      sh.onclick = function () { navigator.share({ title: txt(q('h1', info)), url: location.href }).catch(function () { }); };
      p.insertAdjacentElement('afterend', sh);
    }
  }

  function wireSticky(info) {
    var sticky = q('.us-sticky'), buy = q('.us-buy', info);
    if (!sticky || !buy || sticky.__unoWired === buy) return;
    sticky.__unoWired = buy;
    sticky.removeAttribute('data-uno-show');
    var upd = function () {
      if (!buy.isConnected) return;
      var r = buy.getBoundingClientRect();
      if (r.bottom < 56) sticky.setAttribute('data-uno-show', ''); else sticky.removeAttribute('data-uno-show');
    };
    if (!w.__unoStickyScroll) {
      w.__unoStickyScroll = true;
      w.addEventListener('scroll', function () { d.dispatchEvent(new CustomEvent('uno:sticky-check')); }, { passive: true });
    }
    d.addEventListener('uno:sticky-check', upd);
    upd();
  }

  function wireSwipe(info) {
    var main = q('.us-gal .main', info.parentNode || d), thumbs = q('.us-gal .us-thumbs');
    if (!main || !thumbs || main.__unoSwipe) return;
    main.__unoSwipe = true;
    var x0 = null, y0 = null;
    main.addEventListener('pointerdown', function (e) { x0 = e.clientX; y0 = e.clientY; }, { passive: true });
    main.addEventListener('pointerup', function (e) {
      if (x0 == null) return;
      var dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
      if (Math.abs(dx) < 36 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
      var btns = Array.prototype.slice.call(thumbs.querySelectorAll('button'));
      var i = btns.findIndex(function (b) { return b.getAttribute('aria-current') === 'true'; });
      if (i < 0) i = 0;
      var next = dx < 0 ? i + 1 : i - 1;
      if (next >= 0 && next < btns.length) btns[next].click();
    }, { passive: true });
  }

  function init() {
    var info = q('.us-info');
    if (!info) return;
    buildExtras(info);
    wireSticky(info);
    wireSwipe(info);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
  new MutationObserver(function () { init(); }).observe(d.getElementById('app') || d.documentElement, { childList: true, subtree: true });
})(window, document);
