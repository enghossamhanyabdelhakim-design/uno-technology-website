/* Uno companion avatar loader. Runs only on devices where ?robot=1 was used (UNO_ROBOT_ON), on public pages only. */
(function () {
  if (!window.UNO_ROBOT_ON) return;
  if (!/(\/|index\.html|store\.html|blog\.html|tools\.html)$/.test(location.pathname)) return;
  var V = '20261128c', base = 'assets/';
  function css(h) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = base + h + '?v=' + V; document.head.appendChild(l); }
  function js(s) { return new Promise(function (ok, no) { var j = document.createElement('script'); j.src = base + s + '?v=' + V; j.onload = ok; j.onerror = no; document.head.appendChild(j); }); }
  function start() {
    css('uno-avatar.css');
    js('uno-avatar-art.js').then(function () { return js('uno-avatar.js'); }).then(function () { return js('uno-personality.js'); }).then(function () {
      var small = window.innerWidth < 600; var isStore = /store\.html$/.test(location.pathname);
      var a = window.UnoAvatar.create({ size: small ? 92 : 120, side: 'end', theme: 'auto', minimized: small || isStore });
      if (isStore) { var c = document.querySelector('.ua-companion'); if (c) c.classList.add('ua-store'); }
      var lang = (document.documentElement.lang || 'ar').slice(0, 2) === 'en' ? 'en' : 'ar';
      var p = window.UnoPersona.attach(a, { humor: 'light', lang: lang });
      window.UNO_AVATAR = a;
      var seen = false; try { seen = sessionStorage.getItem('uno_ava_greet') === '1'; } catch (e) {}
      if (!seen) {
        setTimeout(function () { try { a.gesture('wave'); if (lang === 'ar') p.speak(p.quip('greet')); else a.say('Hi, I am Uno. Ask me anything.'); sessionStorage.setItem('uno_ava_greet', '1'); } catch (e) {} }, 2500);
      }
      var last = null;
      document.addEventListener('uno:cart', function (e) {
        var n = e && e.detail ? e.detail.count : null;
        if (last !== null && n !== null && n > last) { try { a.gesture('thumbsup'); if (!isStore) a.say(lang === 'ar' ? p.quip('addToCart') : 'Added to your cart.'); } catch (x) {} }
        if (n !== null) last = n;
      });
    }).catch(function () {});
  }
  if (document.readyState === 'complete') setTimeout(start, 600); else window.addEventListener('load', function () { setTimeout(start, 600); });
})();
