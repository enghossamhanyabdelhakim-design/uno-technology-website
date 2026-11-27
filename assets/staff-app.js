/* Uno Staff: installable role-based home. Each person signs in with their own account; tiles come from their permissions. */
(function () {
  'use strict';
  var C = window.UNO_CFG, app = document.getElementById('app'), CL = window.CLOUD;
  var LANG = (function () { try { return localStorage.getItem('uno_sa_lang') || 'ar'; } catch (e) { return 'ar'; } })();
  var THEME = (function () { try { return localStorage.getItem('uno_sa_theme') || 'dark'; } catch (e) { return 'dark'; } })();
  var BUILTIN = {
    owner: ['audit', 'dashv', 'pos', 'users', 'log', 'content', 'store', 'orders', 'requests', 'core', 'chat', 'jobs.view', 'hr.self', 'crm.view'],
    admin: ['audit', 'dashv', 'pos', 'log', 'content', 'store', 'orders', 'requests', 'core', 'chat'],
    store_manager: ['dashv', 'store', 'orders'], content_editor: ['dashv', 'content'], support: ['dashv', 'orders', 'requests', 'chat'], cashier: ['pos']
  };
  var NAMES = { owner: ['المالك', 'Owner'], admin: ['مدير', 'Admin'], store_manager: ['مدير المتجر', 'Store manager'], content_editor: ['محرر المحتوى', 'Content editor'], support: ['الدعم', 'Support'], cashier: ['كاشير', 'Cashier'] };
  var IC = {
    pos: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M16 15h0"/>',
    erp: '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 12l9 4 9-4M3 17l9 4 9-4"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.4a1 1 0 001 .6h8.8a1 1 0 001-.8L20 7H6"/>',
    chat: '<path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/>',
    form: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h7"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    shop: '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9v11h16V9M4 9a3 3 0 006 0 3 3 0 006 0 3 3 0 004 0"/>',
    dash: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0M17 5a3.5 3.5 0 010 7M18 14a6 6 0 013.5 6"/>',
    log: '<path d="M12 8v5l3 2"/><circle cx="12" cy="12" r="9"/>',
    wrench: '<path d="M14.5 6.5a4 4 0 005 5l-9.8 9.8a2.1 2.1 0 01-3-3L16.5 8.5"/><path d="M14.5 6.5l3 3"/>',
    hr: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18M8 15l3 3 5-6"/>',
    crm: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
    box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>'
  };
  /* tiles: any-of perms, href or soon. Sections group them. */
  var TILES = [
    { s: 'work', ic: 'pos', t: ['نقطة البيع', 'Point of sale'], d: ['فاتورة سريعة وكاشير', 'Fast sales and cashier'], p: ['pos', 'pos_sell'], h: 'pos.html' },
    { s: 'work', ic: 'erp', t: ['نظام الإدارة ERP', 'ERP'], d: ['مخزون، مشتريات، حسابات', 'Stock, purchasing, accounting'], p: ['core', 'inventory.view', 'accounting.view', 'purchases.view'], h: 'erp.html' },
    { s: 'work', ic: 'box', t: ['المخزون', 'Inventory'], d: ['أرصدة وجرد واستلام', 'Levels, counts, receiving'], p: ['inventory.view', 'inventory.count.create'], h: 'erp.html#inventory' },
    { s: 'work', ic: 'chat', t: ['دعم العملاء', 'Customer support'], d: ['محادثات ومكالمات العملاء', 'Customer chats and calls'], p: ['chat'], h: 'staff.html' },
    { s: 'work', ic: 'cart', t: ['الطلبات', 'Orders'], d: ['طلبات المتجر', 'Store orders'], p: ['orders'], h: 'admin.html#orders' },
    { s: 'work', ic: 'form', t: ['طلبات الخدمة', 'Service requests'], d: ['طلبات العملاء الواردة', 'Incoming requests'], p: ['requests'], h: 'admin.html#requests' },
    { s: 'work', ic: 'shop', t: ['إدارة المتجر', 'Store'], d: ['منتجات وأسعار وشحن', 'Products, prices, shipping'], p: ['store'], h: 'admin.html#store' },
    { s: 'work', ic: 'edit', t: ['المحتوى', 'Content'], d: ['نصوص وصور الموقع', 'Site text and images'], p: ['content'], h: 'admin.html#content' },
    { s: 'work', ic: 'dash', t: ['لوحة المتابعة', 'Dashboard'], d: ['أرقام اليوم', 'Today at a glance'], p: ['dashv'], h: 'admin.html' },
    { s: 'soon', ic: 'wrench', t: ['أعمال الفنيين', 'Technician jobs'], d: ['مهام الزيارات والتقارير', 'Visits, checklists, reports'], p: ['jobs.view'], soon: 1 },
    { s: 'soon', ic: 'crm', t: ['المبيعات والعملاء', 'Sales and CRM'], d: ['عملاء محتملون ومتابعة', 'Leads and follow-up'], p: ['crm.view'], soon: 1 },
    { s: 'soon', ic: 'hr', t: ['حضوري وإجازاتي', 'My attendance and leave'], d: ['حضور وانصراف وطلبات إجازة', 'Check-in and leave requests'], p: ['hr.self'], soon: 1 },
    { s: 'admin', ic: 'users', t: ['المستخدمون والصلاحيات', 'Users and roles'], d: ['حسابات الفريق', 'Team accounts'], p: ['users'], h: 'admin.html#users' },
    { s: 'admin', ic: 'log', t: ['سجل النشاط', 'Activity log'], d: ['من فعل ماذا', 'Who did what'], p: ['log', 'audit'], h: 'admin.html#log' }
  ];
  var SEC = { work: ['شغلي', 'My work'], soon: ['قريبًا', 'Coming soon'], admin: ['الإدارة', 'Admin'] };
  function T(a) { return a[LANG === 'en' ? 1 : 0]; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function svg(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  function applyTheme() { document.documentElement.setAttribute('data-theme', THEME); document.documentElement.lang = LANG; document.documentElement.dir = LANG === 'en' ? 'ltr' : 'rtl'; }
  function api(method, path, body) {
    return CL.token().then(function (t) {
      var h = { apikey: C.key, Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' };
      return fetch(C.url + '/rest/v1/' + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined }).then(function (r) { return r.text().then(function (x) { var d; try { d = JSON.parse(x); } catch (e) { d = x; } if (!r.ok) throw new Error((d && (d.message || d.error)) || r.status); return d; }); });
    });
  }
  var dip = null; window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); dip = e; var b = document.getElementById('inst'); if (b) b.hidden = false; });
  function shellTop(extra) {
    return '<div class="top"><img src="assets/logo-tu.png" alt=""><div><b>Uno Staff</b><small>' + T(['فريق أونو', 'Uno team']) + '</small></div><span class="sp"></span>' + (extra || '') +
      '<button class="ib" id="lg" aria-label="Language"><b style="font-size:13px">' + (LANG === 'en' ? 'ع' : 'EN') + '</b></button>' +
      '<button class="ib" id="th" aria-label="Theme">' + (THEME === 'dark' ? '<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>' : '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/></svg>')+ '</button></div>';
  }
  function wire() {
    var l = document.getElementById('lg'), t = document.getElementById('th');
    if (l) l.onclick = function () { LANG = LANG === 'en' ? 'ar' : 'en'; try { localStorage.setItem('uno_sa_lang', LANG); } catch (e) {} start(); };
    if (t) t.onclick = function () { THEME = THEME === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('uno_sa_theme', THEME); } catch (e) {} start(); };
  }
  function login(msg) {
    applyTheme();
    app.innerHTML = '<div class="wrap">' + shellTop() + '<form class="login" id="f"><h1>' + T(['تسجيل الدخول', 'Sign in']) + '</h1><p>' + T(['كل فرد بحسابه الخاص وصلاحياته.', 'Each person signs in with their own account.']) + '</p>' +
      '<label for="em">' + T(['البريد الإلكتروني', 'Email']) + '</label><input id="em" type="email" autocomplete="username" inputmode="email" required dir="ltr">' +
      '<label for="pw">' + T(['كلمة المرور', 'Password']) + '</label><input id="pw" type="password" autocomplete="current-password" required dir="ltr">' +
      '<div class="err" id="er">' + esc(msg || '') + '</div><button class="btn" type="submit">' + T(['دخول', 'Sign in']) + '</button></form><p class="note">' + T(['لو نسيت كلمة المرور، اطلب من المالك إعادة ضبطها.', 'If you forgot your password, ask the owner to reset it.']) + '</p></div>';
    wire();
    document.getElementById('f').onsubmit = function (e) {
      e.preventDefault(); var b = this.querySelector('button'); b.disabled = true; document.getElementById('er').textContent = '';
      CL.login(document.getElementById('em').value.trim(), document.getElementById('pw').value).then(start).catch(function (x) { b.disabled = false; document.getElementById('er').textContent = T(['البريد أو كلمة المرور غير صحيحة', 'Wrong email or password']) + (navigator.onLine ? '' : ' (' + T(['لا يوجد اتصال', 'offline']) + ')'); });
    };
  }
  function home(user, role, perms, roleName) {
    applyTheme();
    var can = function (arr) { return role === 'owner' || arr.some(function (p) { return perms.indexOf(p) >= 0; }); };
    var secs = ['work', 'soon', 'admin'], html = '';
    secs.forEach(function (s) {
      var ts = TILES.filter(function (x) { return x.s === s && can(x.p); }); if (!ts.length) return;
      html += '<h2 class="sec">' + T(SEC[s]) + '</h2><div class="grid">' + ts.map(function (x) {
        var tag = x.soon ? '<span class="tag">' + T(['قريبًا', 'Soon']) + '</span>' : '';
        return (x.soon ? '<div class="tile soon">' : '<a class="tile" href="' + x.h + '">') + tag + '<span class="ic">' + svg(x.ic) + '</span><b>' + T(x.t) + '</b><small>' + T(x.d) + '</small>' + (x.soon ? '</div>' : '</a>');
      }).join('') + '</div>';
    });
    if (!html) html = '<div class="empty">' + T(['حسابك مفعل لكن لا توجد صلاحيات بعد. اطلب من المالك تحديد دورك.', 'Your account is active but has no permissions yet. Ask the owner to assign a role.']) + '</div>';
    app.innerHTML = '<div class="wrap">' + shellTop('<span class="net' + (navigator.onLine ? '' : ' off') + '" id="net"><i></i>' + T(navigator.onLine ? ['متصل', 'Online'] : ['بدون إنترنت', 'Offline']) + '</span>') +
      '<div class="hero"><h1>' + T(['أهلاً', 'Hello']) + '، ' + esc((user.email || '').split('@')[0]) + '</h1><p>' + T(['هنا كل اللي تحتاجه لشغلك اليوم.', 'Everything you need for work today.']) + '</p><span class="pill">' + esc(roleName) + '</span></div>' + html +
      '<button class="btn alt" id="inst" hidden>' + T(['تثبيت التطبيق على الجهاز', 'Install the app on this device']) + '</button><button class="btn alt" id="out">' + T(['تسجيل الخروج', 'Sign out']) + '</button>' +
      '<p class="note">' + T(['أضف التطبيق للشاشة الرئيسية من قائمة المتصفح لو لم يظهر زر التثبيت.', 'If no install button appears, use the browser menu: Add to Home screen.']) + '</p></div>';
    wire(); if (dip) document.getElementById('inst').hidden = false;
    document.getElementById('inst').onclick = function () { if (dip) { dip.prompt(); dip = null; this.hidden = true; } };
    document.getElementById('out').onclick = function () { CL.logout(); start(); };
    var upd = function () { var n = document.getElementById('net'); if (!n) return; n.className = 'net' + (navigator.onLine ? '' : ' off'); n.lastChild.nodeValue = ''; n.innerHTML = '<i></i>' + T(navigator.onLine ? ['متصل', 'Online'] : ['بدون إنترنت', 'Offline']); };
    window.ononline = upd; window.onoffline = upd;
  }
  function start() {
    applyTheme();
    if (!CL || !CL.loggedIn()) return login();
    app.innerHTML = '<div class="wrap">' + shellTop() + '<div class="empty">' + T(['جارٍ التحميل...', 'Loading...']) + '</div></div>'; wire();
    var user;
    CL.check().then(function (u) { user = u; return api('GET', 'admin_roles?user_id=eq.' + u.id + '&select=role,active'); }).then(function (r) {
      var x = r && r[0];
      if (!x || x.active === false) { CL.logout(); return login(T(['هذا الحساب غير مفعل كعضو فريق.', 'This account is not enabled as staff.'])); }
      var role = x.role, perms = BUILTIN[role] || [], rn = NAMES[role] ? T(NAMES[role]) : role;
      return Promise.all([
        api('POST', 'rpc/my_perms', {}).then(function (p) { if (p && p.length) perms = p; }).catch(function () {}),
        api('GET', 'staff_roles?key=eq.' + encodeURIComponent(role) + '&select=name_ar,name_en').then(function (s) { if (s && s[0]) rn = LANG === 'en' ? (s[0].name_en || s[0].name_ar) : s[0].name_ar; }).catch(function () {})
      ]).then(function () { home(user, role, perms, rn); });
    }).catch(function (e) {
      if (!navigator.onLine) { app.innerHTML = '<div class="wrap">' + shellTop() + '<div class="empty">' + T(['لا يوجد اتصال. افتح التطبيق وأنت متصل أول مرة.', 'No connection. Open the app online first.']) + '</div></div>'; wire(); return; }
      CL.logout(); login(T(['انتهت الجلسة، سجّل الدخول من جديد.', 'Session ended, please sign in again.']));
    });
  }
  if ('serviceWorker' in navigator) { try { navigator.serviceWorker.register('sw.js'); } catch (e) {} }
  start();
})();
