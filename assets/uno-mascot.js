/* Uno mascot rig: animates the REAL Uno robot art (the pose images already on the site).
   Each pose image has its painted eyes/mouth removed (blank visor, see uno-bot-*.webp). The face is redrawn live as
   glowing LED eyes and mouth in the visor frame, so the mouth follows the audio level, eyes blink/look, and the pose
   switches (crossfade) for gestures. Same API as UnoBot: setState, setMouthLevel, say, gesture, lookAt, lookCenter, blink, destroy. */
(function (G) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var BASE = 'assets/';
  var RIG = {
    thumbs: { mx: 291.3, my: 140.0, d: 96.8, ang: 15.2 },
    shield: { mx: 208.9, my: 110.8, d: 84.2, ang: -10.6 },
    bulb: { mx: 222.7, my: 145.9, d: 84.7, ang: -14.5 },
    laptop: { mx: 251.5, my: 126.0, d: 85.9, ang: 1.7 },
    support: { mx: 289.9, my: 131.7, d: 87.8, ang: 10.2 },
    wrench: { mx: 247.7, my: 114.8, d: 80.1, ang: -4.9 }
  };
  var AX = 250, AY = 150, AD = 88; /* common anchor so the face stays put across poses */
  var STATE_POSE = { idle: 'thumbs', speaking: 'thumbs', happy: 'thumbs', listening: 'support', thinking: 'laptop' };
  var KW = [
    [/(اهلا|أهلا|مرحبا|مرحباً|السلام|ازيك|hello|hi\b|welcome|hey|شكرا|شكراً|تمام|ممتاز|حاضر|great|sure|thanks|perfect)/i, 'thumbs'],
    [/(كاميرا|كاميرات|مراقبة|حماية|أمان|امان|ضمان|security|camera|surveillance|warranty|protect)/i, 'shield'],
    [/(صيانة|تصليح|إصلاح|اصلاح|فني|تركيب|repair|maintenance|install|fix)/i, 'wrench'],
    [/(كمبيوتر|لابتوب|برمجة|برنامج|موقع|نظام|كاشير|software|laptop|computer|website|pos|system)/i, 'laptop'],
    [/(منتج|منتجات|متجر|المتجر|خدمات|خدمة|سعر|فكرة|اقتراح|products?|store|service|price|idea)/i, 'bulb'],
    [/(دعم|مساعدة|تواصل|واتساب|support|help|contact|whatsapp)/i, 'support']
  ];
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function el(n, a) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); return e; }

  function mount(host0, opts) {
    opts = opts || {};
    var reduced = false; try { reduced = G.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    var host = document.createElement('div'); host.className = 'um';
    host.style.cssText = 'position:relative;width:100%;height:100%;overflow:visible';
    var scaler = document.createElement('div'); scaler.style.cssText = 'position:absolute;left:0;top:0;width:480px;height:480px;transform-origin:0 0';
    var stage = document.createElement('div'); stage.className = 'um-stage'; stage.style.cssText = 'position:absolute;left:0;top:0;width:480px;height:480px;transform-origin:50% 96%;will-change:transform';
    scaler.appendChild(stage); host.appendChild(scaler); host0.appendChild(host);
    function fit() { var w = host.clientWidth || host0.clientWidth || 240, h = host.clientHeight || host0.clientHeight || 240, S = Math.min(w, h) / 480; scaler.style.transform = 'translate(' + ((w - 480 * S) / 2).toFixed(1) + 'px,0) scale(' + S.toFixed(4) + ')'; }
    fit(); try { G.addEventListener('resize', fit); } catch (e) {}
    var destroyed = false, failed = false, loaded = 0, layers = {}, cur = opts.pose || 'thumbs', prev = null, fadeT = 0;
    var state = 'idle', target = 0, level = 0, blinkT = -1, nextBlink = 1500, tgx = 0, tgy = 0, gx = 0, gy = 0, raf = 0, t0 = 0, last = 0;
    var frameN = 0, gestUntil = 0, gestPose = null, nextTalk = 0, popT = 0;

    function build(name) {
      var r = RIG[name], d = r.d, s = AD / d;
      var wrap = document.createElement('div'); wrap.style.cssText = 'position:absolute;inset:0;opacity:0;transform-origin:' + AX + 'px ' + AY + 'px';
      var inner = document.createElement('div');
      inner.style.cssText = 'position:absolute;left:0;top:0;width:480px;height:480px;transform-origin:0 0;transform:translate(' + (AX - r.mx * s) + 'px,' + (AY - r.my * s) + 'px) scale(' + s + ')';
      var img = new Image(); img.alt = ''; img.decoding = 'async'; img.draggable = false;
      img.style.cssText = 'position:absolute;left:0;top:0;width:480px;height:480px;display:block;pointer-events:none';
      img.onload = function () { loaded++; layers[name].ready = true; if (name === cur) wrap.style.opacity = 1; };
      img.onerror = function () { if (name === 'thumbs') { failed = true; if (opts.onfail) opts.onfail(); } };
      img.src = BASE + 'uno-bot-' + name + '.webp?v=20261128h';
      var svg = el('svg', { viewBox: '0 0 480 480', width: 480, height: 480 }); svg.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;overflow:visible';
      var face = el('g', { transform: 'translate(' + (r.mx) + ' ' + (r.my) + ') rotate(' + r.ang + ') translate(0 ' + (0.27 * d) + ')' });
      /* eyes: arc (happy) + orb (open), glow underlay, in visor frame units of d */
      function arcEye(x) {
        var g = el('g', { transform: 'translate(' + x + ' ' + (-0.27 * d + 0.05 * d) + ')' }), rr = 0.2 * d;
        var inn = el('g', {});
        inn.appendChild(el('path', { d: 'M ' + (-rr) + ' 0 A ' + rr + ' ' + rr + ' 0 0 1 ' + rr + ' 0', fill: 'none', stroke: '#ff9a1a', 'stroke-opacity': '.28', 'stroke-width': 0.25 * d, 'stroke-linecap': 'round' }));
        inn.appendChild(el('path', { d: 'M ' + (-rr) + ' 0 A ' + rr + ' ' + rr + ' 0 0 1 ' + rr + ' 0', fill: 'none', stroke: '#ffb82e', 'stroke-width': 0.13 * d, 'stroke-linecap': 'round' }));
        inn.appendChild(el('path', { d: 'M ' + (-rr * .8) + ' -' + (0.005 * d) + ' A ' + rr * .8 + ' ' + rr * .8 + ' 0 0 1 ' + rr * .8 + ' -' + (0.005 * d), fill: 'none', stroke: '#fff1b0', 'stroke-opacity': '.8', 'stroke-width': 0.03 * d, 'stroke-linecap': 'round' }));
        g.appendChild(inn); return { g: g, inn: inn };
      }
      function orbEye(x) {
        var g = el('g', { transform: 'translate(' + x + ' ' + (-0.27 * d) + ')' }), rr = 0.17 * d, inn = el('g', {});
        inn.appendChild(el('circle', { r: rr * 1.55, fill: '#ff9a1a', 'fill-opacity': '.22' }));
        inn.appendChild(el('circle', { r: rr, fill: '#ffb82e' }));
        inn.appendChild(el('circle', { r: rr * .62, fill: '#ffe08a' }));
        inn.appendChild(el('circle', { cx: -rr * .3, cy: -rr * .3, r: rr * .24, fill: '#fff' }));
        g.appendChild(inn); return { g: g, inn: inn };
      }
      var aL = arcEye(-d / 2), aR = arcEye(d / 2), oL = orbEye(-d / 2), oR = orbEye(d / 2);
      var eyesArc = el('g', {}), eyesOrb = el('g', { opacity: 0 });
      eyesArc.appendChild(aL.g); eyesArc.appendChild(aR.g); eyesOrb.appendChild(oL.g); eyesOrb.appendChild(oR.g);
      var mouthG = el('g', { transform: 'translate(0 ' + (0.11 * d) + ')' });
      var mGlow = el('path', { d: '', fill: 'none', stroke: '#ff9a1a', 'stroke-opacity': '.3', 'stroke-width': 0.1 * d, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      var mMain = el('path', { d: '', fill: 'rgba(255,120,10,.0)', stroke: '#ffb82e', 'stroke-width': 0.07 * d, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      mouthG.appendChild(mGlow); mouthG.appendChild(mMain);
      var look = el('g', {}); look.appendChild(eyesArc); look.appendChild(eyesOrb);
      face.appendChild(look); face.appendChild(mouthG); svg.appendChild(face);
      inner.appendChild(img); inner.appendChild(svg); wrap.appendChild(inner); stage.appendChild(wrap);
      return { wrap: wrap, d: d, look: look, eyesArc: eyesArc, eyesOrb: eyesOrb, aL: aL, aR: aR, oL: oL, oR: oR, mGlow: mGlow, mMain: mMain, mouthG: mouthG, ready: false, op: name === cur ? 1 : 0 };
    }
    Object.keys(RIG).forEach(function (n) { layers[n] = null; });
    layers[cur] = build(cur);
    setTimeout(function () { ['support', 'laptop'].forEach(function (n) { if (!layers[n] && !destroyed) layers[n] = build(n); }); }, 600);
    setTimeout(function () { ['shield', 'bulb', 'wrench'].forEach(function (n) { if (!layers[n] && !destroyed) layers[n] = build(n); }); }, 1800);

    function ensure(n) { if (!layers[n]) layers[n] = build(n); return layers[n]; }
    function setPose(n) { if (n === cur || !RIG[n]) return; ensure(n); prev = cur; cur = n; popT = performance.now(); }
    function gesture(n) {
      if (!RIG[n]) return api; setPose(n); gestUntil = performance.now() + 2600; gestPose = n; return api;
    }
    function mouthD(L, d, t) {
      /* closed: LED smile. open: rounded mouth, width/height follow level, with a little viseme wobble */
      if (L < 0.05) { var w = 0.24 * d; return 'M ' + (-w) + ' 0 Q 0 ' + (0.16 * d) + ' ' + w + ' 0'; }
      var h = (0.04 + L * 0.3) * d, w2 = (0.2 - L * 0.05 + Math.sin(t * 14) * 0.03 * L) * d;
      return 'M ' + (-w2) + ' 0 Q ' + (-w2 * .9) + ' ' + (-h * .5) + ' 0 ' + (-h * .5) + ' Q ' + (w2 * .9) + ' ' + (-h * .5) + ' ' + w2 + ' 0 Q ' + (w2 * .9) + ' ' + h + ' 0 ' + h + ' Q ' + (-w2 * .9) + ' ' + h + ' ' + (-w2) + ' 0 Z';
    }
    function frame(ts) {
      raf = 0; if (destroyed) return;
      if (!t0) t0 = ts; var t = (ts - t0) / 1000, dt = Math.min(0.25, (ts - (last || ts)) / 1000); last = ts;
      var K = function (r) { return 1 - Math.exp(-dt * r); }, now = performance.now();
      level = lerp(level, state === 'speaking' ? target : 0, target > level ? K(38) : K(14));
      /* base pose follows state unless a keyword gesture holds a pose */
      if (gestPose && now > gestUntil) gestPose = null;
      if (!gestPose) { var bp = STATE_POSE[state] || 'thumbs'; if (bp !== cur) setPose(bp); }
      if (state === 'speaking' && !gestPose && now > nextTalk) { nextTalk = now + 4200 + Math.random() * 2500; if (Math.random() < 0.35) { var ps = ['bulb', 'shield', 'laptop', 'wrench']; gesture(ps[(Math.random() * ps.length) | 0]); } }
      /* crossfade */
      var fk = K(9);
      Object.keys(layers).forEach(function (n) {
        var L = layers[n]; if (!L) return; var want = (n === cur) ? 1 : 0; L.op = lerp(L.op, want, want ? K(11) : K(24)); if (Math.abs(L.op - want) < 0.01) L.op = want;
        L.wrap.style.opacity = L.ready ? L.op.toFixed(3) : 0;
        L.wrap.style.display = (L.op <= 0.001 && n !== cur) ? 'none' : 'block';
        if (L.op > 0.001) update(L, n, t, now);
      });
      /* whole-figure motion: sway, breathing, speech bob, pop on pose change */
      var pop = clamp(1 - (now - popT) / 320, 0, 1);
      var sway = reduced ? 0 : Math.sin(t * 1.15) * 1.3 + (state === 'listening' ? -2.2 : state === 'thinking' ? 2 : Math.sin(t * 3) * 0.5 * level);
      var bob = reduced ? 0 : Math.sin(t * 2.1) * 1.6 - level * 5;
      var sc = 1 + (reduced ? 0 : Math.sin(t * 2.1) * 0.007) + pop * 0.035;
      stage.style.transform = 'translate(' + (gx * 4).toFixed(2) + 'px,' + bob.toFixed(2) + 'px) rotate(' + sway.toFixed(2) + 'deg) scale(' + sc.toFixed(4) + ')';
      if (!(frameN++ % 30)) fit();
      raf = G.requestAnimationFrame(frame);
    }
    function update(L, n, t, now) {
      var d = L.d; gx = lerp(gx, tgx, 0.1); gy = lerp(gy, tgy, 0.1);
      if (blinkT < 0 && now > nextBlink) blinkT = now;
      var bl = 0; if (blinkT >= 0) { var p = (now - blinkT) / 170; if (p >= 1) { blinkT = -1; nextBlink = now + 1800 + Math.random() * 3400; } else bl = p < 0.45 ? p / 0.45 : 1 - (p - 0.45) / 0.55; }
      var orb = state === 'listening' || state === 'thinking';
      L.eyesArc.setAttribute('opacity', orb ? 0 : 1); L.eyesOrb.setAttribute('opacity', orb ? 1 : 0);
      var lx = gx * 0.06 * d, ly = gy * 0.04 * d; if (state === 'thinking') { lx = -0.07 * d; ly = -0.06 * d; }
      L.look.setAttribute('transform', 'translate(' + lx.toFixed(2) + ' ' + ly.toFixed(2) + ')');
      var k = clamp(1 - bl * 0.9, 0.08, 1), pulse = state === 'listening' ? 1.08 + Math.sin(t * 6) * 0.05 : 1;
      L.aL.inn.setAttribute('transform', 'scale(1 ' + k.toFixed(3) + ')'); L.aR.inn.setAttribute('transform', 'scale(1 ' + k.toFixed(3) + ')');
      var os = 'scale(' + pulse.toFixed(3) + ' ' + (k * pulse).toFixed(3) + ')'; L.oL.inn.setAttribute('transform', os); L.oR.inn.setAttribute('transform', os);
      var md = mouthD(level, d, t); L.mGlow.setAttribute('d', md); L.mMain.setAttribute('d', md);
      L.mMain.setAttribute('fill', level >= 0.05 ? 'rgba(255,110,0,.45)' : 'none');
      L.mouthG.setAttribute('opacity', state === 'thinking' ? 0.7 : 1);
    }
    function start() { if (!raf && !destroyed) raf = G.requestAnimationFrame(frame); }

    var api = {
      el: host,
      setState: function (s) { if (!STATE_POSE[s]) return api; if (s !== state) { state = s; if (s !== 'speaking') target = 0; nextTalk = performance.now() + 2500; if (gestPose && s !== 'speaking') gestUntil = Math.min(gestUntil, performance.now() + 800); } return api; },
      getState: function () { return state; },
      setMouthLevel: function (v) { target = clamp(Number(v) || 0, 0, 1); return api; },
      say: function (text) { text = String(text || ''); for (var i = 0; i < KW.length; i++) if (KW[i][0].test(text)) { gesture(KW[i][1]); break; } return api; },
      gesture: function (n) { var m = { wave: 'thumbs', thumbs: 'thumbs', point: 'bulb', cheer: 'thumbs', idea: 'bulb', shield: 'shield', repair: 'wrench', laptop: 'laptop', support: 'support' }; return gesture(m[n] || n); },
      blink: function () { blinkT = performance.now(); return api; },
      lookAt: function (x, y) { var r = host.getBoundingClientRect(); if (!r.width) return api; tgx = clamp((x - (r.left + r.width / 2)) / (r.width * 0.9), -1, 1); tgy = clamp((y - (r.top + r.height * 0.3)) / (r.height * 0.9), -1, 1); return api; },
      lookCenter: function () { tgx = 0; tgy = 0; return api; },
      destroy: function () { destroyed = true; try { G.removeEventListener('resize', fit); } catch (e) {} if (raf) G.cancelAnimationFrame(raf); try { host.remove(); } catch (e) {} }
    };
    api.setState(opts.state || 'idle'); if (opts.state && STATE_POSE[opts.state]) { var p0 = STATE_POSE[opts.state]; if (p0 !== cur) { layers[cur].wrap.remove(); layers[cur] = null; cur = p0; layers[cur] = build(cur); layers[cur].op = 1; } }
    start();
    return api;
  }
  G.UnoMascot = { mount: mount, rig: RIG };
})(window);
