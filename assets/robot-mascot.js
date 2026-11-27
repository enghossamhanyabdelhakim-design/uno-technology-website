/* ==========================================================================
   Uno mascot face — animated overlay on the real Uno robot art
   Layered: the original mascot image stays untouched as the base, and an SVG
   overlay inside the visor draws LED eyes and a mouth that react.
   API (same shape as robot-face):
     const bot = Mascot.mount(el, { state, theme, shape, src, zoom })
     bot.setState('idle' | 'listening' | 'thinking' | 'speaking' | 'happy')
     bot.setMouthLevel(0..1)
     bot.lookAt(clientX, clientY)
     bot.lookCenter()
     bot.setTheme('auto' | 'light' | 'dark')
     bot.blink()
     bot.destroy()
   window.UNO_vcRobot is aliased to the same object, which is the hook the
   site's voice call screen already looks for.
   ========================================================================== */
(function (global) {
  'use strict';

  var DEFAULT_SRC = 'assets/pose-thumbs.jpg';
  var VISOR_CX = 138.9, VISOR_CY = 70.7, VISOR_TILT = 12.93;

  /* Visor silhouette, traced from the art itself (superellipse fit, IoU 0.95) */
  var VISOR = 'M189.0,82.2C188.3,85.3 187.3,89.0 186.5,91.4C185.6,93.8 184.9,95.0 184.0,96.4C183.1,97.9 182.1,99.1 181.0,100.2C179.8,101.3 178.6,102.3 177.3,103.1C175.9,103.9 174.4,104.6 172.8,105.2C171.2,105.7 169.5,106.2 167.7,106.5C165.8,106.8 163.9,107.0 161.7,107.1C159.5,107.1 157.3,107.1 154.7,106.8C152.1,106.6 150.0,106.4 146.2,105.7C142.3,105.0 136.4,103.7 131.6,102.6C126.7,101.5 120.9,100.1 117.1,99.0C113.3,98.0 111.3,97.3 108.9,96.3C106.5,95.4 104.4,94.5 102.5,93.5C100.6,92.5 98.9,91.5 97.4,90.4C95.9,89.3 94.5,88.1 93.3,86.9C92.1,85.7 91.1,84.5 90.3,83.1C89.4,81.8 88.7,80.4 88.2,78.9C87.7,77.4 87.3,75.9 87.1,74.2C86.9,72.5 86.8,71.1 87.1,68.6C87.4,66.1 88.1,62.3 88.8,59.2C89.5,56.1 90.5,52.4 91.3,50.1C92.2,47.7 92.9,46.5 93.8,45.0C94.7,43.6 95.7,42.4 96.8,41.2C98.0,40.1 99.2,39.2 100.5,38.4C101.9,37.5 103.4,36.9 104.9,36.3C106.5,35.7 108.2,35.3 110.1,35.0C112.0,34.7 113.9,34.5 116.1,34.4C118.2,34.3 120.5,34.4 123.1,34.6C125.7,34.8 127.8,35.1 131.6,35.8C135.5,36.5 141.4,37.7 146.2,38.8C151.1,39.9 156.9,41.4 160.7,42.4C164.5,43.5 166.4,44.2 168.9,45.1C171.3,46.1 173.3,47.0 175.3,48.0C177.2,49.0 178.9,50.0 180.4,51.1C181.9,52.2 183.3,53.3 184.5,54.5C185.7,55.7 186.7,57.0 187.5,58.3C188.4,59.7 189.1,61.0 189.6,62.5C190.1,64.0 190.5,65.5 190.7,67.3C190.9,69.0 191.0,70.4 190.7,72.9C190.4,75.4 189.7,79.1 189.0,82.2Z';
  /* Same shape inset ~10%, so the art's own glass rim and highlight stay visible */
  var VISOR_IN = 'M184.0,81.1C183.3,83.9 182.4,87.2 181.7,89.3C180.9,91.5 180.3,92.5 179.5,93.9C178.7,95.2 177.8,96.3 176.7,97.3C175.7,98.3 174.6,99.1 173.4,99.9C172.2,100.6 170.9,101.2 169.4,101.7C168.0,102.2 166.5,102.6 164.8,102.9C163.1,103.2 161.4,103.4 159.4,103.4C157.5,103.5 155.5,103.4 153.1,103.2C150.8,103.0 148.9,102.8 145.4,102.2C142.0,101.6 136.7,100.4 132.3,99.4C127.9,98.4 122.7,97.1 119.3,96.2C115.9,95.3 114.1,94.6 111.9,93.8C109.7,92.9 107.9,92.1 106.2,91.2C104.4,90.3 102.9,89.4 101.5,88.4C100.2,87.4 98.9,86.4 97.9,85.3C96.8,84.2 95.9,83.1 95.1,81.9C94.4,80.7 93.7,79.4 93.3,78.1C92.8,76.8 92.4,75.4 92.3,73.8C92.1,72.3 92.0,71.0 92.3,68.8C92.5,66.6 93.2,63.2 93.8,60.4C94.4,57.6 95.3,54.3 96.1,52.1C96.8,50.0 97.5,48.9 98.3,47.6C99.1,46.3 100.0,45.2 101.0,44.2C102.1,43.2 103.2,42.3 104.4,41.6C105.6,40.9 106.9,40.2 108.3,39.7C109.8,39.2 111.3,38.8 113.0,38.5C114.7,38.3 116.4,38.1 118.4,38.0C120.3,38.0 122.3,38.0 124.7,38.2C127.0,38.4 128.9,38.6 132.3,39.3C135.8,39.9 141.1,41.0 145.5,42.0C149.8,43.0 155.1,44.3 158.5,45.3C161.9,46.2 163.7,46.9 165.9,47.7C168.1,48.5 169.9,49.4 171.6,50.3C173.4,51.2 174.9,52.1 176.3,53.1C177.6,54.0 178.8,55.1 179.9,56.2C181.0,57.2 181.9,58.4 182.7,59.6C183.4,60.8 184.1,62.0 184.5,63.4C185.0,64.7 185.3,66.1 185.5,67.6C185.7,69.2 185.8,70.4 185.5,72.7C185.3,74.9 184.6,78.3 184.0,81.1Z';

  var LABELS = {
    idle: 'Uno assistant, idle',
    listening: 'Uno assistant, listening',
    thinking: 'Uno assistant, thinking',
    speaking: 'Uno assistant, speaking',
    happy: 'Uno assistant, happy'
  };
  var STATES = ['idle', 'listening', 'thinking', 'speaking', 'happy'];

  function svg() {
    return '' +
    '<svg class="rm-svg" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">' +
      '<defs>' +
        '<linearGradient id="rm-glass" x1="0.15" y1="0" x2="0.55" y2="1">' +
          '<stop offset="0" stop-color="#140d0a"/>' +
          '<stop offset="0.30" stop-color="#0a0706"/>' +
          '<stop offset="0.66" stop-color="#060404"/>' +
          '<stop offset="1" stop-color="#040303"/>' +
        '</linearGradient>' +
        '<radialGradient id="rm-sheen" cx="0.32" cy="0.1" r="0.7">' +
          '<stop offset="0" stop-color="#ffffff" stop-opacity="0.10"/>' +
          '<stop offset="0.55" stop-color="#ffffff" stop-opacity="0.02"/>' +
          '<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>' +
        '</radialGradient>' +
        '<filter id="rm-feather" x="-25%" y="-25%" width="150%" height="150%">' +
          '<feGaussianBlur stdDeviation="1.6"/>' +
        '</filter>' +
        '<filter id="rm-bloom" x="-60%" y="-60%" width="220%" height="220%">' +
          '<feGaussianBlur stdDeviation="2.6"/>' +
        '</filter>' +
        '<radialGradient id="rm-eyefill" cx="0.5" cy="0.42" r="0.62">' +
          '<stop offset="0" stop-color="#ffd75c"/>' +
          '<stop offset="0.55" stop-color="#ffc23c"/>' +
          '<stop offset="1" stop-color="#ffa826"/>' +
        '</radialGradient>' +
        '<radialGradient id="rm-spill">' +
          '<stop offset="0" stop-color="#ff7a12" stop-opacity="0.55"/>' +
          '<stop offset="0.55" stop-color="#ff6a00" stop-opacity="0.18"/>' +
          '<stop offset="1" stop-color="#ff6a00" stop-opacity="0"/>' +
        '</radialGradient>' +
        '<clipPath id="rm-clip"><path d="' + VISOR + '"/></clipPath>' +
        '<mask id="rm-soft"><path d="' + VISOR_IN + '" fill="#fff" filter="url(#rm-feather)"/></mask>' +
        '<pattern id="rm-leds" width="2.7" height="2.7" patternUnits="userSpaceOnUse">' +
          '<circle cx="1.35" cy="1.35" r="0.62" fill="#3a1400" opacity="0.42"/>' +
        '</pattern>' +
      '</defs>' +
      '<g clip-path="url(#rm-clip)">' +
        '<g transform="rotate(' + VISOR_TILT + ' ' + VISOR_CX + ' ' + VISOR_CY + ')">' +
          /* paint out the baked-in eyes and smile with the glass itself */
          '<g mask="url(#rm-soft)">' +
            '<path d="' + VISOR_IN + '" fill="url(#rm-glass)"/>' +
            '<path d="' + VISOR_IN + '" fill="url(#rm-sheen)"/>' +
          '</g>' +
          '<g transform="translate(' + VISOR_CX + ' ' + VISOR_CY + ')">' +
            '<g class="rm-eyes">' +
              /* round LED eyes (idle, listening, speaking, thinking) */
              '<g class="rm-round">' +
                '<ellipse class="rm-spill" cx="-18" cy="-1" rx="19" ry="18"/>' +
                '<ellipse class="rm-spill" cx="18" cy="-1" rx="19" ry="18"/>' +
                '<rect class="rm-bloom" x="-28" y="-13" width="21" height="24" rx="10.5"/>' +
                '<rect class="rm-bloom" x="7" y="-13" width="21" height="24" rx="10.5"/>' +
                '<rect class="rm-eye" x="-27.5" y="-12.5" width="20" height="23" rx="10"/>' +
                '<rect class="rm-eye" x="7.5" y="-12.5" width="20" height="23" rx="10"/>' +
                '<rect class="rm-dots" x="-28.5" y="-13" width="21" height="24" rx="10.5"/>' +
                '<rect class="rm-dots" x="7.5" y="-13" width="21" height="24" rx="10.5"/>' +
              '</g>' +
              /* squint arcs (happy) */
              '<g class="rm-arcs">' +
                '<path class="rm-bloom" d="M-28 2 q9.5 -14 19 0"/>' +
                '<path class="rm-bloom" d="M9 2 q9.5 -14 19 0"/>' +
                '<path class="rm-arc" d="M-28 2 q9.5 -14 19 0"/>' +
                '<path class="rm-arc" d="M9 2 q9.5 -14 19 0"/>' +
              '</g>' +
            '</g>' +
            /* mouth */
            '<g class="rm-mouth">' +
              '<path class="rm-smile" d="M-10 15 q10 8 20 0"/>' +
              '<rect class="rm-open" x="-11" y="18.5" width="22" height="3.6" rx="1.8"/>' +
            '</g>' +
          '</g>' +
        '</g>' +
      '</g>' +
    '</svg>';
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function mount(el, opts) {
    if (!el) throw new Error('Mascot.mount needs an element');
    opts = opts || {};
    var root = el;
    root.classList.add('rm');
    root.setAttribute('data-state', opts.state && STATES.indexOf(opts.state) > -1 ? opts.state : 'idle');
    root.setAttribute('data-theme', opts.theme || 'auto');
    root.setAttribute('data-shape', opts.shape || 'circle');
    if (opts.zoom) root.style.setProperty('--rm-zoom', String(opts.zoom));
    root.setAttribute('role', 'img');
    root.setAttribute('aria-label', LABELS[root.getAttribute('data-state')]);

    var src = opts.src || DEFAULT_SRC;
    root.innerHTML =
      '<span class="rm-glow" aria-hidden="true"></span>' +
      '<span class="rm-body">' +
        '<img class="rm-art" alt="" src="' + src + '" decoding="async">' +
        svg() +
      '</span>';

    var art = root.querySelector('.rm-art');
    var reducedQuery = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var reduced = !!(reducedQuery && reducedQuery.matches);
    root.setAttribute('data-reduced', reduced ? '1' : '0');

    var state = root.getAttribute('data-state');
    /* if mounted inside the site's voice screen, start from its current state */
    var vcHost = root.closest ? root.closest('#vc') : null;
    var VC_IN = { listen: 'listening', think: 'thinking', speak: 'speaking', connect: 'thinking', idle: 'idle', text: 'idle' };
    if (vcHost && VC_IN[vcHost.getAttribute('data-s')]) {
      state = VC_IN[vcHost.getAttribute('data-s')];
      root.setAttribute('data-state', state);
      root.setAttribute('aria-label', LABELS[state]);
    }
    var level = 0, target = 0;
    var blink = 0, blinkStart = -1, nextBlink = 1500;
    var lx = 0, ly = 0, tlx = 0, tly = 0, lean = 0, tlean = 0;
    var t0 = 0, raf = 0, last = 0, destroyed = false;
    var visible = true, io = null;

    function now() { return (global.performance && performance.now) ? performance.now() : Date.now(); }

    function write() {
      root.style.setProperty('--rm-blink', blink.toFixed(3));
      root.style.setProperty('--rm-mouth', level.toFixed(3));
      root.style.setProperty('--rm-lx', lx.toFixed(2));
      root.style.setProperty('--rm-ly', ly.toFixed(2));
      root.setAttribute('aria-label', LABELS[state]);
    }

    function frame(ts) {
      raf = 0;
      if (destroyed || reduced) return;
      if (!visible || document.hidden) { last = ts; raf = global.requestAnimationFrame(frame); return; }
      if (ts - last < 33) { raf = global.requestAnimationFrame(frame); return; }
      var dt = Math.min(64, ts - last); last = ts;

      /* breathing / bobbing, slower when idle */
      var breath = Math.sin(ts / 900);
      root.style.setProperty('--rm-bob', (state === 'speaking' ? breath * 0.5 : breath * 0.8).toFixed(2));
      root.style.setProperty('--rm-tilt', (breath * (state === 'thinking' ? 1.1 : 0.5)).toFixed(2));

      /* mouth level easing toward the target */
      level += (target - level) * (state === 'speaking' ? 0.35 : 0.18);

      /* eye look easing */
      lx += (tlx - lx) * 0.18;
      ly += (tly - ly) * 0.18;
      lean += (tlean - lean) * 0.14;
      root.style.setProperty('--rm-lean', lean.toFixed(2));

      /* blink schedule */
      if (blinkStart < 0 && ts > nextBlink) blinkStart = ts;
      if (blinkStart >= 0) {
        var p = (ts - blinkStart) / 150;
        if (p >= 1) { blink = 0; blinkStart = -1; nextBlink = ts + 2200 + Math.random() * 3200; }
        else blink = p < 0.45 ? p / 0.45 : (1 - (p - 0.45) / 0.55);
      }

      /* glow follows the mouth while speaking */
      root.style.setProperty('--rm-glow', (state === 'speaking' ? 0.35 + level * 0.5 : state === 'listening' ? 0.6 : 0.35).toFixed(2));

      write();
      raf = global.requestAnimationFrame(frame);
    }

    function start() { if (!raf && !reduced && !destroyed) { last = 0; raf = global.requestAnimationFrame(frame); } }
    function stop() { if (raf) { global.cancelAnimationFrame(raf); raf = 0; } }

    var api = {
      el: root,
      setState: function (s) {
        if (STATES.indexOf(s) < 0) return api;
        state = s;
        root.setAttribute('data-state', s);
        if (s !== 'speaking') target = 0;
        if (s === 'thinking') { tlx = -2.2; tly = -2.6; tlean = 0; }
        else if (s === 'listening') { tlx = 0; tly = 0.4; }
        else if (s === 'happy') { tlx = 0; tly = 0; }
        else if (s === 'idle') { tlx = 0; tly = 0; }
        write();
        return api;
      },
      getState: function () { return state; },
      setMouthLevel: function (v) { target = clamp(Number(v) || 0, 0, 1); if (reduced) { level = target; write(); } return api; },
      lookAt: function (x, y) {
        var r = root.getBoundingClientRect();
        if (!r.width) return api;
        var cx = r.left + r.width / 2, cy = r.top + r.height * 0.28;
        var dx = (x - cx) / Math.max(120, r.width);
        var dy = (y - cy) / Math.max(120, r.width);
        tlx = clamp(dx * 9, -6, 6);
        tly = clamp(dy * 9, -4.6, 4.6);
        tlean = clamp(tlx * 0.18, -1.4, 1.4);
        if (reduced) { lx = tlx; ly = tly; write(); }
        return api;
      },
      lookCenter: function () { tlx = 0; tly = 0; tlean = 0; if (reduced) { lx = 0; ly = 0; lean = 0; root.style.setProperty('--rm-lean', '0'); write(); } return api; },
      setTheme: function (t) { root.setAttribute('data-theme', t || 'auto'); return api; },
      blink: function () {
        if (reduced) { blink = 1; write(); global.setTimeout(function () { blink = 0; write(); }, 120); }
        else blinkStart = now();
        return api;
      },
      destroy: function () {
        destroyed = true; stop();
        if (io) { try { io.disconnect(); } catch (e) {} }
        if (reducedQuery && reducedQuery.removeEventListener) reducedQuery.removeEventListener('change', onReduced);
        root.innerHTML = '';
        root.classList.remove('rm');
        root.removeAttribute('role');
        root.removeAttribute('aria-label');
      }
    };

    function onReduced() {
      reduced = !!(reducedQuery && reducedQuery.matches);
      root.setAttribute('data-reduced', reduced ? '1' : '0');
      if (reduced) { stop(); blink = 0; level = 0; lx = 0; ly = 0; write(); } else start();
    }
    if (reducedQuery) {
      if (reducedQuery.addEventListener) reducedQuery.addEventListener('change', onReduced);
      else if (reducedQuery.addListener) reducedQuery.addListener(onReduced);
    }

    if (global.IntersectionObserver) {
      io = new global.IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0.05 });
      io.observe(root);
    }

    if (art && art.complete === false) {
      art.addEventListener('load', function () { root.classList.add('rm-ready'); }, { once: true });
    } else root.classList.add('rm-ready');

    write();
    start();
    return api;
  }

  /* --- site integration ---------------------------------------------------
     The voice call screen already does:
       window.UNO_vcRobot.mount($("#vc-robot"))
       window.UNO_vcRobot.state("listen" | "think" | "speak" | "connect" | "idle" | "text")
     so keep the last instance and translate those keys. */
  var last = null;
  var VC_MAP = { listen: 'listening', think: 'thinking', speak: 'speaking', connect: 'thinking', idle: 'idle', text: 'idle' };

  global.Mascot = { mount: mount, states: STATES.slice() };
  global.Robot = global.Mascot; /* the site's voice call glue (app.js UNO_vcRobot) drives this */
})(window);
