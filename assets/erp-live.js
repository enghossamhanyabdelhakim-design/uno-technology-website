/* UNO Core ERP live bridge: no demo mode. Calls erp_* RPCs (single jsonb arg p) with the admin session. */
(function () {
  var C = window.UNO_CFG, CL = window.CLOUD, U = window.UnoERP;
  if (!U) return;
  U.config.demo = false;
  function perr(ar) { return new Error(ar); }
  function msgOf(d, status) {
    var m = (d && (d.message || d.msg)) || ('HTTP ' + status);
    return String(m).replace(/^[A-Z][A-Z_]{2,}:\s*/, '');
  }
  function rpc(name, args) {
    return CL.token().then(function (t) {
      return fetch(C.url + '/rest/v1/rpc/' + name, {
        method: 'POST',
        headers: { apikey: C.key, Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p: args || {} })
      }).then(function (r) {
        return r.text().then(function (x) {
          var d = null; try { d = x ? JSON.parse(x) : null; } catch (e) { d = x; }
          if (!r.ok) throw perr(r.status === 401 || r.status === 403 ? 'ليس لديك صلاحية لهذه العملية.' : msgOf(d, r.status));
          return d;
        });
      }, function () { throw perr('لا يوجد اتصال بالخادم. حاول مرة أخرى.'); });
    });
  }
  U.config.rpc = rpc;

  function login() {
    return new Promise(function (resolve) {
      var o = document.createElement('div');
      o.className = 'erp-login';
      o.innerHTML = '<form><b>UNO Core ERP</b><span>سجّل الدخول بحساب الإدارة</span><input id="elE" type="email" autocomplete="username" placeholder="Email" required><input id="elP" type="password" autocomplete="current-password" placeholder="Password" required><button type="submit">دخول</button><small id="elM"></small></form>';
      document.body.appendChild(o);
      o.querySelector('form').onsubmit = function (ev) {
        ev.preventDefault();
        var m = o.querySelector('#elM'); m.textContent = '...';
        CL.login(o.querySelector('#elE').value.trim(), o.querySelector('#elP').value).then(function () { o.remove(); resolve(); }, function (e) { m.textContent = 'فشل الدخول: ' + e.message; });
      };
    });
  }
  function start() {
    var host = document.getElementById('erp-host');
    // probe permission and connectivity before mounting
    return rpc('erp_meta', {}).then(function () { U.mount(host, { lang: 'ar', theme: 'light', screen: new URLSearchParams(location.search).get('screen') || undefined }); },
      function (e) {
        if (/صلاحية/.test(e.message)) { host.innerHTML = '<div class="erp-login"><form><b>غير مسموح</b><span>' + e.message + '</span><button type="button" id="elOut">تسجيل خروج</button></form></div>'; document.getElementById('elOut').onclick = function () { CL.logout(); location.reload(); }; return; }
        CL.logout(); return login().then(start);
      });
  }
  (CL.loggedIn() ? Promise.resolve() : login()).then(start);
})();
