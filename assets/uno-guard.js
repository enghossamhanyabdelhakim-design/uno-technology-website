/* Companion guard — placement, collision, safe area, dismissal, a11y.
   Additive wrapper around UnoAvatar.create(); it does not change the avatar.
     var uno = UnoGuard.mount({ theme, size, side, greet: true, storageKey: 'uno.hidden' });
   It lifts the companion above any fixed bottom bar (POS pay bar, cookie bar,
   mobile browser chrome), keeps it inside the safe area, remembers when the
   customer hid it, and exposes hide()/show()/isHidden(). */
(function () {
  'use strict';

  function fixedBottomBars(exclude) {
    var vh = window.innerHeight, out = [];
    var nodes = document.body.querySelectorAll('body *');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el === exclude || exclude && exclude.contains(el)) continue;
      var cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
      var r = el.getBoundingClientRect();
      if (r.width < 60 || r.height < 24) continue;
      if (r.bottom < vh - 8) continue;          // not anchored to the bottom
      if (r.top < vh * 0.45) continue;          // too tall to be a bar
      if (cs.pointerEvents === 'none') continue;
      out.push({ el: el, top: r.top, height: r.height });
    }
    return out;
  }

  function mount(opts) {
    opts = opts || {};
    var uno = UnoAvatar.create(opts);
    var wrap = uno.wrap;
    var key = opts.storageKey || 'uno.companion.hidden';
    var lift = 0;

    // --- hide control and restore chip
    var hideBtn = document.createElement('button');
    hideBtn.className = 'ua-hide';
    hideBtn.type = 'button';
    hideBtn.setAttribute('aria-label', 'إخفاء أونو');
    hideBtn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    wrap.appendChild(hideBtn);

    var chip = document.createElement('button');
    chip.className = 'ua-restore';
    chip.type = 'button';
    chip.setAttribute('aria-label', 'إظهار أونو');
    chip.innerHTML = '<img src="' + (opts.chipIcon || 'assets/pose-thumbs.jpg') + '" alt=""><span>أونو</span>';
    document.body.appendChild(chip);

    function setHidden(on, remember) {
      wrap.style.display = on ? 'none' : '';
      chip.setAttribute('data-show', on ? '1' : '0');
      if (remember !== false) { try { localStorage.setItem(key, on ? '1' : '0'); } catch (e) {} }
      if (!on) { measure(); uno.gesture('wave'); }
    }
    hideBtn.addEventListener('click', function (e) { e.stopPropagation(); setHidden(true); });
    chip.addEventListener('click', function () { setHidden(false); });

    var remembered = false;
    try { remembered = localStorage.getItem(key) === '1'; } catch (e) {}
    if (remembered) setHidden(true, false);

    // --- collision with fixed bottom bars
    function measure() {
      if (wrap.style.display === 'none') return;
      var bars = fixedBottomBars(wrap);
      var max = 0;
      bars.forEach(function (b) {
        var overlap = window.innerHeight - b.top;
        if (overlap > max) max = overlap;
      });
      var target = max > 0 ? max + 8 : 0;
      if (Math.abs(target - lift) > 1) { lift = target; wrap.style.setProperty('--ua-lift', lift + 'px'); }
    }
    var raf = 0;
    function schedule() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; measure(); }); }
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, { passive: true });
    if (window.ResizeObserver) { try { new ResizeObserver(schedule).observe(document.body); } catch (e) {} }
    if (window.MutationObserver) {
      try { new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] }); } catch (e) {}
    }
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) wrap.setAttribute('data-touch', '1');

    measure();

    // --- a11y: the avatar itself is decorative for screen readers, the bubble speaks
    var svg = wrap.querySelector('.ua-svg');
    if (svg) { svg.setAttribute('aria-hidden', 'true'); svg.removeAttribute('role'); svg.removeAttribute('aria-label'); }
    var bubble = wrap.querySelector('.ua-bubble');
    if (bubble) { bubble.setAttribute('role', 'status'); bubble.setAttribute('aria-live', 'polite'); }
    var minBtn = wrap.querySelector('.ua-min');
    if (minBtn) minBtn.setAttribute('aria-expanded', 'true');

    var oldMin = uno.minimize;
    uno.minimize = function (on) {
      var r = oldMin.call(uno, on);
      if (minBtn) minBtn.setAttribute('aria-expanded', String(wrap.getAttribute('data-min') !== '1'));
      return r;
    };

    uno.hide = function () { setHidden(true); return uno; };
    uno.show = function () { setHidden(false); return uno; };
    uno.isHidden = function () { return wrap.style.display === 'none'; };
    uno.measure = measure;
    uno.wrap = wrap;
    uno.chip = chip;
    return uno;
  }

  window.UnoGuard = { mount: mount, fixedBottomBars: fixedBottomBars, version: '1.0.0' };
})();
