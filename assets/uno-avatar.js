/* Uno companion avatar — behaviour layer.
   Same API shape as robot-face / robot-mascot, plus gesture(name).
     const a = UnoAvatar.mount(el, { theme, size, side, zoom });
     a.setState('idle'|'listening'|'thinking'|'speaking'|'celebrating')
     a.setMouthLevel(0..1)  a.lookAt(x,y)  a.lookCenter()  a.blink()
     a.gesture('wave'|'point'|'nod'|'think'|'celebrate'|'thumbsup'|'walkIn'|'walkOut'|'shrug'|'idle')
     a.say('text', ms)  a.minimize(true)  a.destroy()
   Floating companion: UnoAvatar.create({ ... }) returns the same api plus .el/.bubble. */
(function () {
  'use strict';
  var DUR = { wave: 1700, point: 1500, nod: 1100, think: 1900, celebrate: 1600, thumbsup: 1400, walkIn: 1400, walkOut: 1200, shrug: 1200, idle: 0 };
  var REDUCED = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false, addEventListener: null };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function build(opts, container) {
    var host = document.createElement('div');
    host.className = 'ua';
    host.setAttribute('data-theme', (opts && opts.theme) || 'auto');
    host.setAttribute('data-state', (opts && opts.state) || 'idle');
    host.setAttribute('data-reduced', REDUCED.matches ? '1' : '0');
    if (opts && opts.size) host.style.setProperty('--ua-size', typeof opts.size === 'number' ? opts.size + 'px' : opts.size);
    host.innerHTML = window.UNO_AVATAR_SVG;

    var el = {
      host: host,
      head: host.querySelector('.ua-head'),
      eyes: host.querySelector('.ua-eyes'),
      round: host.querySelector('.ua-round'),
      arcs: host.querySelector('.ua-arcs'),
      smile: host.querySelector('.ua-smile'),
      open: host.querySelector('.ua-open'),
      torso: host.querySelector('.ua-torso'),
      armL: host.querySelector('.ua-arm-l'),
      armR: host.querySelector('.ua-arm-r'),
      foreL: host.querySelector('.ua-fore-l'),
      foreR: host.querySelector('.ua-fore-r'),
      handL: host.querySelector('.ua-hand-l'),
      handR: host.querySelector('.ua-hand-r'),
      thumbL: host.querySelector('.ua-thumb-l'),
      thumbR: host.querySelector('.ua-thumb-r'),
      legL: host.querySelector('.ua-leg-l'),
      legR: host.querySelector('.ua-leg-r'),
      shinL: host.querySelector('.ua-shin-l'),
      shinR: host.querySelector('.ua-shin-r'),
      shadow: host.querySelector('.ua-shadow')
    };

    var state = (opts && opts.state) || 'idle';
    var mouth = 0, mouthTarget = 0;
    var lx = 0, ly = 0, tlx = 0, tly = 0;
    var blinkVal = 0, nextBlink = 2200, blinkStart = -1;
    var gestureName = null, gestureUntil = 0;
    var running = true, visible = true, levelFn = null;
    var audioCtx = null, analyser = null, data = null;
    var api = {};

    function write() {
      var s = host.style;
      s.setProperty('--ua-mouth', mouth.toFixed(3));
      s.setProperty('--ua-lx', lx.toFixed(2));
      s.setProperty('--ua-ly', ly.toFixed(2));
      s.setProperty('--ua-blink', blinkVal.toFixed(3));
    }

    function setState(next) {
      if (!next) return api;
      state = next;
      host.setAttribute('data-state', next);
      if (next === 'speaking') { mouthTarget = Math.max(mouthTarget, 0.35); }
      return api;
    }

    function setMouthLevel(v) { mouthTarget = clamp(Number(v) || 0, 0, 1); return api; }

    function lookAt(x, y) {
      var r = host.getBoundingClientRect();
      if (!r.width) return api;
      var cx = r.left + r.width / 2, cy = r.top + r.height * 0.28;
      var dx = (x - cx) / Math.max(160, window.innerWidth * 0.5);
      var dy = (y - cy) / Math.max(160, window.innerHeight * 0.5);
      tlx = clamp(dx, -1, 1) * 7; tly = clamp(dy, -1, 1) * 5;
      return api;
    }
    function lookCenter() { tlx = 0; tly = 0; return api; }

    function blink() {
      if (REDUCED.matches) return api;
      if (blinkStart < 0) blinkStart = performance.now();
      return api;
    }

    function gesture(name) {
      if (!DUR.hasOwnProperty(name)) return api;
      if (gestureName) host.removeAttribute('data-gesture');
      gestureName = name;
      host.setAttribute('data-gesture', name);
      gestureUntil = performance.now() + DUR[name];
      if (name === 'think') setState('thinking');
      if (name === 'celebrate') setState('celebrating');
      if (name === 'thumbsup' || name === 'wave' || name === 'point') setState('idle');
      return api;
    }

    function tick(now) {
      if (!running) return;
      if (!visible || document.hidden) { requestAnimationFrame(tick); return; }

      // gaze easing
      lx += (tlx - lx) * 0.16; ly += (tly - ly) * 0.16;

      // mouth
      if (levelFn) { try { mouthTarget = clamp(levelFn(), 0, 1); } catch (e) { levelFn = null; } }
      else if (analyser) { analyser.getByteTimeDomainData(data); var sum = 0; for (var i = 0; i < data.length; i++) { var d = (data[i] - 128) / 128; sum += d * d; } mouthTarget = clamp(Math.sqrt(sum / data.length) * 2.6, 0, 1); }
      mouth += (mouthTarget - mouth) * (mouthTarget > mouth ? 0.45 : 0.22);

      // blink
      if (blinkStart >= 0) {
        var t = (now - blinkStart) / 190;
        if (t >= 1) { blinkStart = -1; blinkVal = 0; } else blinkVal = Math.sin(t * Math.PI);
      } else if (!REDUCED.matches && state !== 'speaking' && now > nextBlink) {
        blinkStart = now; nextBlink = now + 2600 + Math.random() * 3200;
      }

      // gesture expiry
      if (gestureName && now > gestureUntil) { host.removeAttribute('data-gesture'); gestureName = null; if (state === 'celebrating' || state === 'thinking') setState('idle'); }

      write();
      requestAnimationFrame(tick);
    }

    var io = null;
    if (window.IntersectionObserver) {
      io = new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.01 });
      io.observe(host);
    }
    function onVis() { visible = !document.hidden; }
    document.addEventListener('visibilitychange', onVis);

    api = {
      el: host,
      setState: setState, setMouthLevel: setMouthLevel, lookAt: lookAt, lookCenter: lookCenter, blink: blink,
      gesture: gesture,
      /* emotion pose, held until cleared or the duration runs out */
      emote: function (name, ms) {
        host.setAttribute('data-emote', name || 'neutral');
        clearTimeout(api._emoteT);
        if (ms) api._emoteT = setTimeout(function () { host.setAttribute('data-emote', 'neutral'); }, ms);
        return api;
      },
      /* short face-only reaction, never blocks the emotion underneath */
      micro: function (name, ms) {
        host.setAttribute('data-mx', name || '');
        clearTimeout(api._mxT);
        api._mxT = setTimeout(function () { host.removeAttribute('data-mx'); }, ms || 420);
        return api;
      },
      clear: function () { host.removeAttribute('data-emote'); host.removeAttribute('data-mx'); host.removeAttribute('data-gesture'); return api; },
      setTheme: function (t) { host.setAttribute('data-theme', t || 'auto'); return api; },
      setSide: function (s) { host.setAttribute('data-side', s || 'end'); return api; },
      linkAudio: function (nodeOrFn) {
        if (typeof nodeOrFn === 'function') { levelFn = nodeOrFn; analyser = null; return api; }
        if (nodeOrFn && nodeOrFn.getByteTimeDomainData) { analyser = nodeOrFn; data = new Uint8Array(analyser.fftSize || 1024); levelFn = null; }
        return api;
      },
      attachStream: function (stream) {
        try {
          audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
          var src = audioCtx.createMediaStreamSource(stream);
          analyser = audioCtx.createAnalyser(); analyser.fftSize = 1024; src.connect(analyser);
          data = new Uint8Array(analyser.fftSize); levelFn = null;
        } catch (e) { /* no audio, mouth stays caller driven */ }
        return api;
      },
      destroy: function () { running = false; if (io) io.disconnect(); document.removeEventListener('visibilitychange', onVis); host.remove(); },
      states: ['idle', 'listening', 'thinking', 'speaking', 'celebrating'],
      emotions: ['neutral', 'happy', 'laugh', 'smirk', 'surprise', 'wink', 'empathy', 'thinking', 'excited', 'sleepy', 'confused', 'proud'],
      micros: ['blinkTwice', 'squint', 'lookAway', 'headShake', 'browFlash', 'mouthPurse', 'eyeRoll', 'tilt'],
      gestures: Object.keys(DUR)
    };

    write();
    if (container) container.appendChild(host);
    requestAnimationFrame(tick);
    return api;
  }

  /* ---------------------------------------------------- floating companion */
  function create(opts) {
    opts = opts || {};
    var side = opts.side || (document.documentElement.dir === 'rtl' ? 'start' : 'end');
    var wrap = document.createElement('div');
    wrap.className = 'ua-companion';
    wrap.setAttribute('data-side', side);
    wrap.setAttribute('data-min', opts.minimized ? '1' : '0');
    wrap.style.setProperty('--ua-size', (opts.size || 132) + 'px');
    wrap.innerHTML = '<div class="ua-bubble" role="status" aria-live="polite" dir="auto"></div>' +
      '<div class="ua-stage"></div>' +
      '<button class="ua-min" type="button" aria-label="تصغير أونو" title="تصغير">' +
      '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>';
    document.body.appendChild(wrap);

    var api = build({ theme: opts.theme, size: opts.size, state: opts.state });
    api.el.setAttribute('data-emote', 'neutral');
    wrap.querySelector('.ua-stage').appendChild(api.el);
    api.el.setAttribute('data-side', side);

    var bubble = wrap.querySelector('.ua-bubble');
    var hideT = null;
    api.bubble = bubble;
    api.wrap = wrap;

    api.say = function (text, ms) {
      if (!text) return api;
      bubble.textContent = text;
      bubble.setAttribute('data-show', '1');
      clearTimeout(hideT);
      hideT = setTimeout(function () { bubble.removeAttribute('data-show'); }, ms || Math.max(2600, text.length * 95));
      return api;
    };

    api.minimize = function (on) {
      var v = on === undefined ? wrap.getAttribute('data-min') !== '1' : !!on;
      wrap.setAttribute('data-min', v ? '1' : '0');
      if (v) bubble.removeAttribute('data-show');
      return api;
    };
    api.toggle = function () { return api.minimize(); };
    wrap.querySelector('.ua-min').addEventListener('click', function (e) { e.stopPropagation(); api.minimize(); });
    api.el.addEventListener('click', function () { if (wrap.getAttribute('data-min') === '1') api.minimize(false); });

    api.pointAt = function (target) {
      var t = typeof target === 'string' ? document.querySelector(target) : target;
      if (!t) return api;
      var r = t.getBoundingClientRect();
      var a = api.el.getBoundingClientRect();
      var dx = (r.left + r.width / 2) - (a.left + a.width / 2);
      var dy = (r.top + r.height / 2) - (a.top + a.height * 0.35);
      var ang = Math.atan2(dy, dx) * 180 / Math.PI;
      api.el.style.setProperty('--ua-point', clamp(ang, -80, 80).toFixed(1) + 'deg');
      api.lookAt(r.left + r.width / 2, r.top + r.height / 2);
      api.gesture('point');
      return api;
    };

    api.watch = function (selector, cfg) {
      cfg = cfg || {};
      var nodes = document.querySelectorAll(selector);
      [].forEach.call(nodes, function (n) {
        n.addEventListener(cfg.on || 'click', function () {
          if (cfg.gesture) api.gesture(cfg.gesture);
          if (cfg.say) api.say(cfg.say);
          if (cfg.point) api.pointAt(cfg.point);
        });
      });
      return api;
    };

    // pointer follow, throttled to one frame
    var queued = false, px = 0, py = 0;
    function onMove(e) { px = e.clientX; py = e.clientY; if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; api.lookAt(px, py); }); } }
    if (opts.follow !== false) window.addEventListener('pointermove', onMove, { passive: true });

    // idle life: a small gesture every so often, never in reduced motion
    var idleT = null;
    if (opts.idle !== false && !REDUCED.matches) {
      var loop = function () {
        idleT = setTimeout(function () {
          var pool = ['thumbsup', 'nod', 'wave'];
          api.gesture(pool[Math.floor(Math.random() * pool.length)]);
          loop();
        }, 14000 + Math.random() * 12000);
      };
      loop();
    }

    var oldDestroy = api.destroy;
    api.destroy = function () { clearTimeout(idleT); window.removeEventListener('pointermove', onMove); wrap.remove(); oldDestroy(); };

    if (opts.greet !== false) setTimeout(function () { api.gesture('wave'); api.say(opts.greetText || 'أهلاً! أنا أونو، تحت أمرك.'); }, opts.greetDelay || 700);

    return api;
  }

  window.UnoAvatar = { mount: function (el, o) { return build(o || {}, el); }, create: create, version: '1.1.0' };
  if (!window.UNO_vcRobot) window.UNO_vcRobot = { mount: function (el, o) { return build(o || {}); }, state: function () {} };
})();
