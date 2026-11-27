/* ==========================================================================
   Uno robot face — standalone component (no dependencies, ~10 KB)
   API:
     const bot = Robot.mount(el, { state:'idle', theme:'auto', look:true })
     bot.setState('idle' | 'listening' | 'thinking' | 'speaking' | 'happy')
     bot.setMouthLevel(0..1)        // only used while speaking (and a little while listening)
     bot.lookAt(clientX, clientY)   // eyes follow a pointer / touch point
     bot.lookCenter()
     bot.setTheme('auto' | 'light' | 'dark')
     bot.blink()                    // one blink, also works under reduced motion
     bot.destroy()
   The loop writes five CSS variables on the root element (transform/opacity only),
   runs at ~30 fps, and stops when the tab is hidden or the face is off screen.
   prefers-reduced-motion is honoured: no loop, no automatic blink, no idle motion.
   ========================================================================== */
(function (global) {
  'use strict';

  var SVG =
    '<svg class="rf-svg" viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">' +
      '<g class="rf-head">' +
        '<line class="rf-antenna-stem" x1="120" y1="24" x2="120" y2="10"/>' +
        '<circle class="rf-antenna-ring" cx="120" cy="10" r="5"/>' +
        '<circle class="rf-antenna-dot" cx="120" cy="10" r="4.5"/>' +
        '<rect class="rf-shell" x="28" y="22" width="184" height="150" rx="44"/>' +
        '<rect class="rf-ear" x="18" y="78" width="10" height="40" rx="5"/>' +
        '<rect class="rf-ear" x="212" y="78" width="10" height="40" rx="5"/>' +
        '<rect class="rf-face" x="44" y="40" width="152" height="112" rx="30"/>' +
        '<rect class="rf-face-edge" x="44" y="40" width="152" height="112" rx="30"/>' +
        /* brows */
        '<path class="rf-brow rf-brow-l" d="M78 62h28"/>' +
        '<path class="rf-brow rf-brow-r" d="M134 62h28"/>' +
        /* eyes */
        '<g class="rf-eye">' +
          '<g class="rf-eye-in">' +
            '<rect class="rf-eye-white" x="76" y="74" width="32" height="36" rx="15"/>' +
            '<circle class="rf-pupil" cx="92" cy="92" r="7.5"/>' +
          '</g>' +
        '</g>' +
        '<g class="rf-eye">' +
          '<g class="rf-eye-in">' +
            '<rect class="rf-eye-white" x="132" y="74" width="32" height="36" rx="15"/>' +
            '<circle class="rf-pupil" cx="148" cy="92" r="7.5"/>' +
          '</g>' +
        '</g>' +
        /* happy arc eyes */
        '<path class="rf-eye-happy" d="M78 94q14-18 28 0"/>' +
        '<path class="rf-eye-happy" d="M134 94q14-18 28 0"/>' +
        /* cheeks */
        '<circle class="rf-cheek" cx="70" cy="120" r="9"/>' +
        '<circle class="rf-cheek" cx="170" cy="120" r="9"/>' +
        /* mouth */
        '<rect class="rf-mouth-open" x="98" y="112" width="44" height="28" rx="14"/>' +
        '<path class="rf-mouth-smile" d="M100 120q20 16 40 0"/>' +
        '<path class="rf-mouth-line" d="M104 124h32"/>' +
        /* thinking dots */
        '<g class="rf-dots">' +
          '<circle class="rf-dot" cx="104" cy="144" r="3"/>' +
          '<circle class="rf-dot" cx="120" cy="144" r="3"/>' +
          '<circle class="rf-dot" cx="136" cy="144" r="3"/>' +
        '</g>' +
      '</g>' +
    '</svg>';

  var STATES = {
    idle:      { label: 'idle',      base: 0.05 },
    listening: { label: 'listening', base: 0.22 },
    thinking:  { label: 'thinking',  base: 0.10 },
    speaking:  { label: 'speaking',  base: 0.45 },
    happy:     { label: 'happy',     base: 0.0 }
  };

  var LABELS = {
    idle: 'Uno assistant, idle',
    listening: 'Uno assistant, listening',
    thinking: 'Uno assistant, thinking',
    speaking: 'Uno assistant, speaking',
    happy: 'Uno assistant, happy'
  };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function mount(el, opts) {
    if (!el) throw new Error('Robot.mount needs an element');
    opts = opts || {};

    var root = el;
    root.classList.add('rf');
    root.setAttribute('data-state', opts.state && STATES[opts.state] ? opts.state : 'idle');
    root.setAttribute('data-theme', opts.theme || 'auto');
    root.setAttribute('role', 'img');
    root.setAttribute('aria-label', LABELS[root.getAttribute('data-state')]);
    root.innerHTML = SVG;

    var reducedQuery = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var reduced = !!(reducedQuery && reducedQuery.matches);
    var follow = opts.look !== false && !reduced;
    root.setAttribute('data-reduced', reduced ? '1' : '0');

    var state = root.getAttribute('data-state');
    var baseLevel = STATES[state].base;
    var mouthLevel = baseLevel;
    var phase = 0;
    var px = 0, py = 0, tpx = 0, tpy = 0;
    var blink = 0, blinkStart = 0, nextBlink = 0, breathe = 0, breathePhase = 0;
    var raf = null, last = 0, visible = true, destroyed = false;

    function now() { return (global.performance && performance.now) ? performance.now() : Date.now(); }
    nextBlink = now() + 2400 + Math.random() * 2600;

    function write() {
      root.style.setProperty('--rf-px', px.toFixed(3));
      root.style.setProperty('--rf-py', py.toFixed(3));
      root.style.setProperty('--rf-mouth', mouthLevel.toFixed(3));
      root.style.setProperty('--rf-blink', blink.toFixed(3));
      root.style.setProperty('--rf-breathe', breathe.toFixed(4));
    }

    function frame(ts) {
      if (destroyed) return;
      raf = global.requestAnimationFrame(frame);
      if (!visible || document.hidden) { last = ts; return; }
      if (ts - last < 33) return;           /* ~30 fps is plenty and stays light */
      last = ts;

      /* eyes lerp toward the target */
      px += (tpx - px) * 0.2;
      py += (tpy - py) * 0.2;

      /* mouth */
      if (state === 'speaking') {
        phase += 0.28;
        var wobble = 0.62 + 0.38 * Math.sin(phase) + (Math.random() - 0.5) * 0.12;
        mouthLevel = clamp(baseLevel * wobble, 0, 1);
      } else if (state === 'listening') {
        phase += 0.12;
        mouthLevel = baseLevel + 0.04 * Math.sin(phase);
      } else {
        mouthLevel += (baseLevel - mouthLevel) * 0.25;
      }

      /* idle breathing: a very small, slow scale so the face is never frozen */
      if (state === 'idle' || state === 'listening') {
        breathePhase += 0.03;
        breathe = Math.sin(breathePhase) * 0.006;
      } else {
        breathe += (0 - breathe) * 0.2;
      }

      /* blink */
      var t = now();
      if (state !== 'happy' && t >= nextBlink) {
        blinkStart = t;
        nextBlink = t + 2400 + Math.random() * 3600;
      }
      if (blinkStart) {
        var d = (t - blinkStart) / 170;
        if (d >= 1) { blink = 0; blinkStart = 0; }
        else blink = d < 0.5 ? d * 2 : (1 - d) * 2;
      }
      write();
    }

    function start() { if (!raf && !reduced && !destroyed) { last = 0; raf = global.requestAnimationFrame(frame); } }
    function stop() { if (raf) { global.cancelAnimationFrame(raf); raf = null; } }

    /* pause when hidden or off screen */
    function onVis() { visible = !document.hidden; }
    document.addEventListener('visibilitychange', onVis);
    var io = null;
    if (global.IntersectionObserver) {
      io = new IntersectionObserver(function (entries) {
        visible = entries[0] && entries[0].isIntersecting;
      }, { threshold: 0.05 });
      io.observe(root);
    }

    function onReducedChange() {
      reduced = !!(reducedQuery && reducedQuery.matches);
      follow = opts.look !== false && !reduced;
      root.setAttribute('data-reduced', reduced ? '1' : '0');
      if (reduced) { stop(); px = py = tpx = tpy = 0; blink = 0; mouthLevel = baseLevel; write(); }
      else start();
    }
    if (reducedQuery) {
      if (reducedQuery.addEventListener) reducedQuery.addEventListener('change', onReducedChange);
      else if (reducedQuery.addListener) reducedQuery.addListener(onReducedChange);
    }

    var api = {
      el: root,
      get state() { return state; },
      setState: function (name) {
        if (!STATES[name]) return api;
        state = name;
        baseLevel = STATES[name].base;
        root.setAttribute('data-state', name);
        root.setAttribute('aria-label', LABELS[name]);
        if (reduced) { mouthLevel = baseLevel; blink = 0; write(); }
        return api;
      },
      setMouthLevel: function (v) {
        baseLevel = clamp(Number(v) || 0, 0, 1);
        if (state !== 'speaking') mouthLevel = baseLevel;
        if (reduced) { mouthLevel = baseLevel; write(); }
        return api;
      },
      lookAt: function (x, y) {
        if (!follow) return api;
        var r = root.getBoundingClientRect();
        if (!r.width) return api;
        tpx = clamp((x - (r.left + r.width / 2)) / (r.width * 0.75), -1, 1);
        tpy = clamp((y - (r.top + r.height / 2)) / (r.height * 0.75), -1, 1);
        return api;
      },
      blink: function () { blinkStart = now(); if (reduced) { blink = 1; write(); setTimeout(function () { blink = 0; write(); }, 120); } return api; },
      lookCenter: function () { tpx = 0; tpy = 0; if (reduced) { px = py = 0; write(); } return api; },
      setTheme: function (t) { root.setAttribute('data-theme', t || 'auto'); return api; },
      destroy: function () {
        destroyed = true;
        stop();
        document.removeEventListener('visibilitychange', onVis);
        if (io) io.disconnect();
        if (reducedQuery) {
          if (reducedQuery.removeEventListener) reducedQuery.removeEventListener('change', onReducedChange);
          else if (reducedQuery.removeListener) reducedQuery.removeListener(onReducedChange);
        }
        root.innerHTML = '';
        root.removeAttribute('data-state');
        root.removeAttribute('role');
        root.removeAttribute('aria-label');
      }
    };

    write();
    start();
    return api;
  }

  global.Robot = { mount: mount, version: '1.0.0' };
})(window);
