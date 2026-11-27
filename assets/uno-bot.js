/* Uno talking character: layered SVG rig, no external art. Own drawing in the Uno orange/white style.
   API: var b = UnoBot.mount(el, {state}); b.setState('idle|listening|thinking|speaking|happy');
        b.setMouthLevel(0..1)  (drive from an AnalyserNode)   b.say(text)  (keyword gestures)
        b.gesture('wave|thumbs|point|cheer')   b.lookAt(x,y)   b.lookCenter()   b.blink()   b.destroy() */
(function (G) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var reduced = false;
  try { reduced = G.matchMedia && G.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }

  var ART =
    '<svg xmlns="' + NS + '" viewBox="0 0 220 290" class="ub-svg" role="img" aria-label="Uno">' +
    '<defs>' +
    '<linearGradient id="ubW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe3ea"/></linearGradient>' +
    '<linearGradient id="ubO" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a2a"/><stop offset="1" stop-color="#f05a00"/></linearGradient>' +
    '<radialGradient id="ubE" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#fff2a8"/><stop offset=".55" stop-color="#ffc21a"/><stop offset="1" stop-color="#ff8a00"/></radialGradient>' +
    '</defs>' +
    '<ellipse cx="110" cy="276" rx="52" ry="8" fill="#000" opacity=".28" class="ub-sh"/>' +
    '<g class="ub-all">' +
    /* legs */
    '<g class="ub-legs"><rect x="84" y="222" width="18" height="38" rx="8" fill="url(#ubW)"/><rect x="118" y="222" width="18" height="38" rx="8" fill="url(#ubW)"/>' +
    '<rect x="78" y="254" width="30" height="14" rx="7" fill="url(#ubO)"/><rect x="112" y="254" width="30" height="14" rx="7" fill="url(#ubO)"/></g>' +
    /* arms (behind torso) */
    '<g class="ub-armL" transform="translate(66 168)"><g class="ub-armLr">' +
    '<rect x="-8" y="-4" width="16" height="46" rx="8" fill="url(#ubW)" stroke="#c9ced8" stroke-width="1"/>' +
    '<g class="ub-fingerL" opacity="0"><rect x="-3" y="52" width="6" height="22" rx="3" fill="#fff" stroke="#c9ced8"/></g>' +
    '<circle cx="0" cy="48" r="11" fill="url(#ubW)" stroke="#c9ced8" stroke-width="1"/>' +
    '<rect x="-4" y="38" width="8" height="6" rx="3" fill="#2b2f38"/></g></g>' +
    '<g class="ub-armR" transform="translate(154 168)"><g class="ub-armRr">' +
    '<rect x="-8" y="-4" width="16" height="46" rx="8" fill="url(#ubW)" stroke="#c9ced8" stroke-width="1"/>' +
    '<circle cx="0" cy="48" r="11" fill="url(#ubW)" stroke="#c9ced8" stroke-width="1"/>' +
    '<g class="ub-thumb" opacity="0"><rect x="-4" y="26" width="8" height="18" rx="4" fill="#fff" stroke="#c9ced8" transform="translate(0 0)"/></g>' +
    '<rect x="-4" y="38" width="8" height="6" rx="3" fill="#2b2f38"/></g></g>' +
    /* torso */
    '<g class="ub-torso"><rect x="64" y="150" width="92" height="86" rx="30" fill="url(#ubW)" stroke="#c9ced8" stroke-width="1.2"/>' +
    '<rect x="64" y="210" width="92" height="12" rx="4" fill="#23262e"/>' +
    '<path d="M110 166 L132 182 L124 206 L96 206 L88 182 Z" fill="url(#ubO)" class="ub-badge"/>' +
    '<path d="M110 176 L121 185 L117 197 L103 197 L99 185 Z" fill="#fff" opacity=".35"/></g>' +
    /* head */
    '<g class="ub-headp" transform="translate(110 118)"><g class="ub-head">' +
    '<ellipse cx="-62" cy="4" rx="12" ry="17" fill="url(#ubO)" class="ub-ear"/><ellipse cx="62" cy="4" rx="12" ry="17" fill="url(#ubO)" class="ub-ear"/>' +
    '<rect x="-8" y="48" width="16" height="12" rx="4" fill="#23262e"/>' +
    '<rect x="-54" y="-50" width="108" height="100" rx="44" fill="url(#ubW)" stroke="#c9ced8" stroke-width="1.2"/>' +
    '<path d="M-30 -46 Q0 -78 30 -46 Z" fill="url(#ubO)"/><ellipse cx="0" cy="-54" rx="10" ry="5" fill="url(#ubO)"/>' +
    '<rect x="-42" y="-30" width="84" height="64" rx="28" fill="#15171c"/>' +
    '<g class="ub-eyes"><g class="ub-eyeL" transform="translate(-19 -8)"><circle r="12" fill="url(#ubE)" class="ub-ball"/><circle r="12" fill="none" stroke="#ffcf3d" stroke-opacity=".35" stroke-width="3" class="ub-glow"/><circle cx="-3" cy="-4" r="3.4" fill="#fff" opacity=".9" class="ub-spark"/></g>' +
    '<g class="ub-eyeR" transform="translate(19 -8)"><circle r="12" fill="url(#ubE)" class="ub-ball"/><circle r="12" fill="none" stroke="#ffcf3d" stroke-opacity=".35" stroke-width="3" class="ub-glow"/><circle cx="-3" cy="-4" r="3.4" fill="#fff" opacity=".9" class="ub-spark"/></g></g>' +
    '<path class="ub-mouth" d="M-9 18 Q0 24 9 18" fill="#ffc21a" stroke="#ffc21a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<g class="ub-think" opacity="0"><circle cx="40" cy="-70" r="3.4" fill="#ff8a2a"/><circle cx="52" cy="-80" r="4.4" fill="#ff8a2a"/><circle cx="68" cy="-92" r="5.6" fill="#ff8a2a"/></g>' +
    '</g></g>' +
    '</g></svg>';

  function mount(el, opts) {
    opts = opts || {};
    var host = document.createElement('div');
    host.className = 'ub';
    host.innerHTML = ART;
    el.appendChild(host);
    var q = function (s) { return host.querySelector(s); };
    var all = q('.ub-all'), head = q('.ub-head'), torso = q('.ub-torso'), legs = q('.ub-legs'),
      armLr = q('.ub-armLr'), armRr = q('.ub-armRr'), mouth = q('.ub-mouth'),
      eyeL = q('.ub-eyeL'), eyeR = q('.ub-eyeR'), eyes = q('.ub-eyes'), think = q('.ub-think'),
      thumb = q('.ub-thumb'), fingerL = q('.ub-fingerL'), ears = host.querySelectorAll('.ub-ear'),
      glows = host.querySelectorAll('.ub-glow'), badge = q('.ub-badge');
    var state = 'idle', target = 0, level = 0, blinkT = -1, nextBlink = 1200, raf = 0, destroyed = false,
      gx = 0, gy = 0, tgx = 0, tgy = 0, g = null, nextTalkG = 0, last = 0, t0 = 0;
    var aL = 0, aR = 0, tL = 4, tR = -4, hz = 0, hrot = 0, happyUntil = 0;
    var GEST = {
      wave: { d: 2200, f: function (p, t) { return { R: -152 + Math.sin(t * 11) * 16, L: 4, thumb: 0, headRot: -4 }; } },
      thumbs: { d: 1900, f: function (p) { var k = Math.sin(clamp(p, 0, 1) * Math.PI); return { R: -62 * k - 4 * (1 - k), L: 4, thumb: k, headRot: 3 * k }; } },
      point: { d: 2200, f: function (p) { var k = Math.sin(clamp(p, 0, 1) * Math.PI); return { R: -4, L: 96 * k + 4 * (1 - k), finger: k, headRot: -5 * k, look: -1 }; } },
      cheer: { d: 1800, f: function (p, t) { var k = Math.sin(clamp(p, 0, 1) * Math.PI); return { R: -150 * k - 4, L: 150 * k + 4, headRot: Math.sin(t * 9) * 3 * k, bounce: k }; } },
      nod: { d: 900, f: function (p) { return { R: -4, L: 4, headNod: Math.sin(p * Math.PI * 2) * 4 }; } },
      talkR: { d: 1300, f: function (p, t) { var k = Math.sin(clamp(p, 0, 1) * Math.PI); return { R: -52 * k - 4 + Math.sin(t * 7) * 6 * k, L: 4 }; } },
      talkL: { d: 1300, f: function (p, t) { var k = Math.sin(clamp(p, 0, 1) * Math.PI); return { L: 46 * k + 4 + Math.sin(t * 7) * 6 * k, R: -4 }; } }
    };

    function gesture(name) {
      if (!GEST[name]) return api;
      g = { n: name, t: performance.now(), d: GEST[name].d };
      return api;
    }
    function mouthPath(lv, t) {
      /* viseme-ish: open height from level, width alternates with time so the shape varies (o / ee / ah) */
      if (lv < 0.04) {
        var sm = state === 'thinking' ? 3 : (state === 'happy' ? 11 : 7);
        return 'M-' + (7 + sm) + ' 18 Q0 ' + (22 + sm) + ' ' + (7 + sm) + ' 18';
      }
      var h = 3 + lv * 15, w = 13 - lv * 4 + Math.sin(t * 13) * 3.2 * lv;
      return 'M-' + w.toFixed(1) + ' 17 Q0 ' + (17 - 2).toFixed(1) + ' ' + w.toFixed(1) + ' 17 Q0 ' + (17 + h * 1.9).toFixed(1) + ' -' + w.toFixed(1) + ' 17 Z';
    }
    function frame(ts) {
      raf = 0; if (destroyed) return;
      if (!t0) t0 = ts; var t = (ts - t0) / 1000, dt = Math.min(0.25, (ts - (last || ts)) / 1000); last = ts;
      /* mouth level smoothing (fast attack, slower release) */
      var K = function (r) { return 1 - Math.exp(-dt * r); }; var kk = target > level ? K(40) : K(14); level = lerp(level, target, kk);
      if (state !== 'speaking') level = lerp(level, 0, K(20));
      /* gesture */
      var cur = {}, now = performance.now();
      if (g) {
        var p = (now - g.t) / g.d;
        if (p >= 1) g = null; else cur = GEST[g.n].f(p, t);
      }
      if (!g && state === 'speaking' && now > nextTalkG) {
        gesture(Math.random() < 0.5 ? 'talkR' : 'talkL'); nextTalkG = now + 1600 + Math.random() * 1800;
      }
      var wantR = cur.R, wantL = cur.L;
      if (wantR === undefined) wantR = -4; if (wantL === undefined) wantL = 4;
      var armBias = 0;
      if (!g) {
        if (state === 'thinking') { wantR = -158; armBias = 1; }
        else if (state === 'listening') { wantL = 18 + Math.sin(t * 2) * 3; wantR = -18 - Math.sin(t * 2) * 3; }
        else if (state === 'happy') { wantR = -150 + Math.sin(t * 10) * 10; wantL = 150 - Math.sin(t * 10) * 10; }
        else if (state === 'idle') { wantR = -4 - Math.sin(t * 1.4) * 2; wantL = 4 + Math.sin(t * 1.4 + 1) * 2; }
      }
      aR = lerp(aR, wantR, K(11)); aL = lerp(aL, wantL, K(11));
      armRr.setAttribute('transform', 'rotate(' + aR.toFixed(1) + ')');
      armLr.setAttribute('transform', 'rotate(' + aL.toFixed(1) + ')');
      thumb.setAttribute('opacity', (cur.thumb || 0).toFixed(2));
      fingerL.setAttribute('opacity', (cur.finger || 0).toFixed(2));
      /* body motion */
      var bob = reduced ? 0 : Math.sin(t * 2.2) * 2.2 + (cur.bounce ? -Math.abs(Math.sin(t * 9)) * 7 * cur.bounce : 0);
      all.setAttribute('transform', 'translate(0 ' + bob.toFixed(2) + ')');
      /* head: tilt by state, nod with speech energy */
      var htilt = 0, hy = 0;
      if (state === 'listening') htilt = -7 + Math.sin(t * 1.6) * 1.5;
      else if (state === 'thinking') htilt = 8 + Math.sin(t * 1.2);
      else if (state === 'speaking') { htilt = Math.sin(t * 3.1) * 3 + (cur.headRot || 0); hy = level * 3.2; }
      else htilt = Math.sin(t * 0.9) * 1.6 + (cur.headRot || 0);
      if (cur.headNod) hy += cur.headNod;
      hrot = lerp(hrot, htilt, K(9)); hz = lerp(hz, hy, K(18));
      head.setAttribute('transform', 'translate(' + (gx * 3).toFixed(2) + ' ' + hz.toFixed(2) + ') rotate(' + hrot.toFixed(2) + ' 0 50)');
      /* eyes: look + blink + state shape */
      gx = lerp(gx, tgx, K(8)); gy = lerp(gy, tgy, K(8));
      var lx = gx * 5, ly = gy * 4;
      if (state === 'thinking') { lx = -5; ly = -6; }
      if (cur.look) lx = cur.look * 6;
      if (blinkT < 0 && ts > nextBlink) blinkT = ts;
      var bl = 0;
      if (blinkT >= 0) { var bp = (ts - blinkT) / 160; if (bp >= 1) { blinkT = -1; nextBlink = ts + 1800 + Math.random() * 3200; } else bl = bp < 0.45 ? bp / 0.45 : 1 - (bp - 0.45) / 0.55; }
      var happy = state === 'happy' || (cur.thumb || 0) > 0.4;
      var sy = happy ? 0.45 : clamp(1 - bl * 0.92, 0.06, 1), sc = state === 'listening' ? 1.12 : 1;
      var tf = function (x) { return 'translate(' + (x + lx).toFixed(1) + ' ' + (-8 + ly).toFixed(1) + ') scale(' + sc + ' ' + (sy * sc).toFixed(3) + ')'; };
      eyeL.setAttribute('transform', tf(-19)); eyeR.setAttribute('transform', tf(19));
      var gl = state === 'listening' ? 0.55 + Math.sin(t * 5) * 0.25 : (state === 'speaking' ? 0.35 + level * 0.6 : 0.3);
      for (var i = 0; i < glows.length; i++) glows[i].setAttribute('stroke-opacity', gl.toFixed(2));
      for (i = 0; i < ears.length; i++) ears[i].setAttribute('opacity', (state === 'listening' ? 0.7 + Math.sin(t * 6) * 0.3 : 1).toFixed(2));
      think.setAttribute('opacity', state === 'thinking' ? (0.4 + Math.abs(Math.sin(t * 3)) * 0.6).toFixed(2) : 0);
      badge.setAttribute('opacity', (state === 'speaking' ? 0.8 + level * 0.2 : 1).toFixed(2));
      mouth.setAttribute('d', mouthPath(level, t));
      mouth.setAttribute('fill', level > 0.04 ? '#ff7a1a' : 'none');
      raf = G.requestAnimationFrame(frame);
    }
    function start() { if (!raf && !destroyed) raf = G.requestAnimationFrame(frame); }

    var KW = [
      [/(اهلا|أهلا|مرحبا|مرحباً|السلام|ازيك|hello|hi\b|welcome|hey)/i, 'wave'],
      [/(تمام|ممتاز|حاضر|بالتأكيد|طبعا|طبعاً|شكرا|شكراً|great|sure|perfect|thanks|of course)/i, 'thumbs'],
      [/(منتج|متجر|المتجر|خدمات|خدمة|كاميرا|كاميرات|لابتوب|سعر|products?|store|service|camera|price)/i, 'point'],
      [/(مبروك|رائع|congrat|awesome|wonderful)/i, 'cheer']
    ];
    var api = {
      el: host,
      setState: function (s) {
        if (['idle', 'listening', 'thinking', 'speaking', 'happy'].indexOf(s) < 0) return api;
        if (s !== state) { state = s; if (s !== 'speaking') target = 0; nextTalkG = performance.now() + 500; }
        return api;
      },
      getState: function () { return state; },
      setMouthLevel: function (v) { target = clamp(Number(v) || 0, 0, 1); return api; },
      say: function (text) {
        text = String(text || '');
        for (var i = 0; i < KW.length; i++) if (KW[i][0].test(text)) { gesture(KW[i][1]); break; }
        return api;
      },
      gesture: gesture,
      blink: function () { blinkT = performance.now(); return api; },
      lookAt: function (x, y) {
        var r = host.getBoundingClientRect(); if (!r.width) return api;
        tgx = clamp((x - (r.left + r.width / 2)) / (r.width * 0.9), -1, 1);
        tgy = clamp((y - (r.top + r.height * 0.4)) / (r.height * 0.9), -1, 1); return api;
      },
      lookCenter: function () { tgx = 0; tgy = 0; return api; },
      destroy: function () { destroyed = true; if (raf) G.cancelAnimationFrame(raf); try { host.remove(); } catch (e) {} }
    };
    api.setState(opts.state || 'idle');
    if (opts.state) { var m = { listening: 1, thinking: 1, speaking: 1, happy: 1 }; }
    start();
    return api;
  }
  G.UnoBot = { mount: mount };
})(window);
