/* Uno Staff: technician jobs (list, detail, dispatch). Server enforces everything; this only presents it. */
(function () {
  'use strict';
  var S = window.UNO_SA; if (!S) return;
  var T = S.T, esc = S.esc, filter = 'active';
  var ST = { new: ['جديدة', 'New'], assigned: ['معيّنة', 'Assigned'], on_the_way: ['في الطريق', 'On the way'], in_progress: ['قيد التنفيذ', 'In progress'], waiting_parts: ['بانتظار قطع', 'Waiting parts'], pending_approval: ['بانتظار الاعتماد', 'Awaiting approval'], approved: ['معتمدة', 'Approved'], closed: ['مغلقة', 'Closed'], cancelled: ['ملغاة', 'Cancelled'] };
  var PR = { low: ['منخفضة', 'Low'], normal: ['عادية', 'Normal'], high: ['عالية', 'High'], urgent: ['عاجلة', 'Urgent'] };
  function rpc(n, b) { return S.api('POST', 'rpc/' + n, b || {}); }
  function can(p) { var c = S.ctx; return c.role === 'owner' || (c.perms || []).indexOf(p) >= 0; }
  function mgr() { return can('jobs.assign') || can('jobs.approve'); }
  function errmsg(e) { var m = String(e && e.message || e); return navigator.onLine ? m.replace(/^.*?:\s*/, '') : T(['لا يوجد اتصال', 'No connection']); }
  function page(inner, back) {
    S.applyTheme();
    S.app.innerHTML = '<div class="wrap">' + S.shellTop() + '<div class="bar"><button class="sm" id="bk">' + T(['رجوع', 'Back']) + '</button><h1>' + T(['أعمال الفنيين', 'Technician jobs']) + '</h1>' + (back === 'list' && can('jobs.assign') ? '<button class="sm pr" id="nw">+ ' + T(['مهمة', 'Job']) + '</button>' : '') + '</div>' + inner + '</div>';
    S.wire(); document.getElementById('bk').onclick = back === 'list' ? S.home : list;
  }
  function list() {
    page('<div class="empty">' + T(['جارٍ التحميل...', 'Loading...']) + '</div>', 'list');
    var nw = document.getElementById('nw'); if (nw) nw.onclick = form;
    rpc('jobs_list', {}).then(function (rows) {
      var f = { active: function (r) { return ['new', 'assigned', 'on_the_way', 'in_progress', 'waiting_parts'].indexOf(r.status) >= 0; }, review: function (r) { return r.status === 'pending_approval'; }, done: function (r) { return ['approved', 'closed', 'cancelled'].indexOf(r.status) >= 0; } };
      var chips = [['active', ['الجارية', 'Active']], ['review', ['للاعتماد', 'To approve']], ['done', ['المنتهية', 'Done']]];
      var shown = rows.filter(f[filter]);
      var h = '<div class="chips">' + chips.map(function (c) { return '<button class="sm' + (filter === c[0] ? ' on' : '') + '" data-f="' + c[0] + '">' + T(c[1]) + ' (' + rows.filter(f[c[0]]).length + ')</button>'; }).join('') + '</div>';
      h += shown.length ? shown.map(function (r) {
        var pc = r.total_items ? Math.round(100 * r.done_items / r.total_items) : 0;
        return '<button class="job p-' + r.priority + '" data-id="' + r.id + '"><div class="r"><b>' + esc(r.title) + '</b><span class="st s-' + r.status + '">' + T(ST[r.status]) + '</span></div><small>' + esc(r.job_no) + (r.partner_name ? ' · ' + esc(r.partner_name) : '') + (r.site_address ? ' · ' + esc(r.site_address) : '') + '</small>' + (r.total_items ? '<div class="prog"><i style="width:' + pc + '%"></i></div>' : '') + '</button>';
      }).join('') : '<div class="empty">' + T(['لا توجد مهام هنا.', 'No jobs here.']) + '</div>';
      var box = document.querySelector('.wrap .empty'); box.outerHTML = '<div id="jl">' + h + '</div>';
      [].forEach.call(document.querySelectorAll('[data-f]'), function (b) { b.onclick = function () { filter = b.getAttribute('data-f'); list(); }; });
      [].forEach.call(document.querySelectorAll('.job'), function (b) { b.onclick = function () { detail(b.getAttribute('data-id')); }; });
    }).catch(function (e) { document.querySelector('.wrap .empty').textContent = errmsg(e); });
  }
  function form() {
    page('<form class="panel" id="jf"><label>' + T(['عنوان المهمة', 'Job title']) + '</label><input id="jt" required maxlength="120">' +
      '<label>' + T(['التفاصيل', 'Details']) + '</label><textarea id="jd" rows="3"></textarea>' +
      '<label>' + T(['العنوان / الموقع', 'Site address']) + '</label><input id="js">' +
      '<label>' + T(['هاتف العميل', 'Customer phone']) + '</label><input id="jp" type="tel" inputmode="tel" dir="ltr">' +
      '<label>' + T(['الأولوية', 'Priority']) + '</label><select id="jr">' + Object.keys(PR).map(function (k) { return '<option value="' + k + '"' + (k === 'normal' ? ' selected' : '') + '>' + T(PR[k]) + '</option>'; }).join('') + '</select>' +
      '<label>' + T(['قائمة الفحص (بند في كل سطر)', 'Checklist (one item per line)']) + '</label><textarea id="jc" rows="4"></textarea>' +
      '<div class="msg" id="je" hidden></div><div class="acts"><button class="btn" type="submit">' + T(['إنشاء المهمة', 'Create job']) + '</button></div></form>', 'x');
    document.getElementById('jf').onsubmit = function (e) {
      e.preventDefault(); var b = this.querySelector('button'); b.disabled = true;
      rpc('job_create', { p_title: val('jt'), p_details: val('jd') || null, p_site: val('js') || null, p_phone: val('jp') || null, p_priority: val('jr'), p_checklist: val('jc').split('\n').map(function (x) { return x.trim(); }).filter(Boolean), p_ref: 'w' + Date.now() + Math.random().toString(36).slice(2, 7) })
        .then(function (id) { detail(id); }).catch(function (x) { b.disabled = false; var m = document.getElementById('je'); m.hidden = false; m.textContent = errmsg(x); });
    };
  }
  function val(i) { return document.getElementById(i).value.trim(); }

  function shrink(file) {
    return new Promise(function (res, rej) {
      var im = new Image(), u = URL.createObjectURL(file);
      im.onload = function () {
        var m = 1280, k = Math.min(1, m / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
        var q = 0.8, go = function () { c.toBlob(function (b) { if (!b) return rej(new Error('x')); if (b.size > 900000 && q > 0.35) { q -= 0.15; return go(); } res(b); }, 'image/jpeg', q); }; go();
      };
      im.onerror = function () { rej(new Error(T(['تعذر قراءة الصورة', 'Could not read the image']))); }; im.src = u;
    });
  }
  function sb(method, path, body, raw) {
    var C = window.UNO_CFG;
    return window.CLOUD.token().then(function (t) {
      var h = { apikey: C.key, Authorization: 'Bearer ' + t }; if (!raw) h['Content-Type'] = 'application/json';
      return fetch(C.url + '/storage/v1/' + path, { method: method, headers: h, body: raw ? body : JSON.stringify(body) }).then(function (r) { return r.text().then(function (x) { var d; try { d = JSON.parse(x); } catch (e) { d = x; } if (!r.ok) throw new Error(d && d.message || 'HTTP ' + r.status); return d; }); });
    });
  }

  /* Offline photo queue: photos taken without a connection wait in IndexedDB and upload when the network is back. Idempotent: the storage path is fixed at capture and job_photo_add upserts on path. */
  var PQ = { db: null };
  function pqOpen() {
    if (PQ.db) return Promise.resolve(PQ.db);
    return new Promise(function (res, rej) { var r = indexedDB.open('uno_photoq', 1); r.onupgradeneeded = function () { r.result.createObjectStore('q', { keyPath: 'path' }); }; r.onsuccess = function () { PQ.db = r.result; res(PQ.db); }; r.onerror = function () { rej(r.error); }; });
  }
  function pqTx(mode, fn) { return pqOpen().then(function (db) { return new Promise(function (res, rej) { var t = db.transaction('q', mode), st = t.objectStore('q'), out = fn(st); t.oncomplete = function () { res(out && out.result !== undefined ? out.result : undefined); }; t.onerror = function () { rej(t.error); }; }); }); }
  function pqAdd(job, path, blob) { return pqTx('readwrite', function (st) { return st.put({ path: path, job: job, blob: blob, at: Date.now(), err: '' }); }); }
  function pqAll() { return pqTx('readonly', function (st) { return st.getAll(); }); }
  function pqDel(path) { return pqTx('readwrite', function (st) { return st.delete(path); }); }
  function isNet(e) { return !navigator.onLine || e instanceof TypeError || /Failed to fetch|NetworkError|Load failed/i.test(String(e && e.message)); }
  var pqBusy = false;
  function pqFlush() {
    if (pqBusy || !navigator.onLine || !window.indexedDB) return Promise.resolve(0);
    pqBusy = true; var done = 0;
    return pqAll().then(function (items) {
      return items.reduce(function (p, it) {
        return p.then(function () {
          if (it.err) return;
          return sb('POST', 'object/job-photos/' + it.path, it.blob, true).catch(function (e) { if (/exist|duplicate|409/i.test(String(e && e.message))) return; throw e; })
            .then(function () { return rpc('job_photo_add', { p_job: it.job, p_path: it.path }); })
            .then(function () { done++; return pqDel(it.path); })
            .catch(function (e) { if (isNet(e)) throw e; return pqTx('readwrite', function (st) { it.err = errmsg(e) || 'error'; return st.put(it); }); });
        });
      }, Promise.resolve());
    }).catch(function () {}).then(function () { pqBusy = false; return done; });
  }
  window.addEventListener('online', function () { pqFlush().then(function (n) { if (n && document.getElementById('jph') && window.__jpr) window.__jpr(); }); });
  function photos(id, ended) {
    var box = document.getElementById('jph'); if (!box) return;
    window.__jpr = function () { photos(id, ended); };
    rpc('job_photos', { p_job: id }).then(function (ps) {
      var h = '<h3>' + T(['الصور', 'Photos']) + '</h3><div class="jgrid" id="pg">' + ps.map(function () { return '<span class="pth"></span>'; }).join('') + '</div>' + (ps.length ? '' : '<div class="hist">—</div>') +
        (ended ? '' : '<div class="msg" id="pe" hidden></div><label class="btn alt" style="display:grid;place-items:center;cursor:pointer;margin-top:8px">' + T(['إضافة صورة', 'Add photo']) + '<input id="pf" type="file" accept="image/*" capture="environment" hidden></label>');
      box.innerHTML = h;
      if (window.indexedDB) pqAll().then(function (qq) { qq = qq.filter(function (x) { return x.job === id; }); if (!qq.length) return; var pend = qq.filter(function (x) { return !x.err; }).length, bad = qq.length - pend, d = document.createElement('div'); d.className = 'hist'; d.id = 'pqn'; d.textContent = (pend ? T(['صور بانتظار الرفع: ' + pend, 'Photos waiting to upload: ' + pend]) : '') + (bad ? ' ' + T(['(فشل رفع ' + bad + ')', '(' + bad + ' failed)']) : ''); box.appendChild(d); if (pend && navigator.onLine) pqFlush().then(function (n) { if (n) photos(id, ended); }); }).catch(function () {});
      if (ps.length) sb('POST', 'object/sign/job-photos', { expiresIn: 3600, paths: ps.map(function (p) { return p.path; }) }).then(function (r) {
        var cells = document.querySelectorAll('#pg .pth');
        r.forEach(function (x, i) { if (!x.signedURL || !cells[i]) return; var im = document.createElement('img'); im.loading = 'lazy'; im.alt = ps[i].caption || ''; im.src = window.UNO_CFG.url + '/storage/v1' + x.signedURL; im.onclick = function () { window.open(im.src, '_blank'); }; cells[i].appendChild(im); });
      }).catch(function () {});
      var pf = document.getElementById('pf'); if (!pf) return;
      pf.onchange = function () {
        var f = pf.files && pf.files[0]; if (!f) return; var m = document.getElementById('pe'); m.hidden = false; m.textContent = T(['جارٍ الرفع...', 'Uploading...']);
        var path = id + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 7) + '.jpg';
        shrink(f).then(function (b) {
          var queue = function () { return pqAdd(id, path, b).then(function () { m.textContent = T(['اتحفظت الصورة على الجهاز وهتترفع لوحدها لما النت يرجع.', 'Photo saved on this device. It will upload when you are back online.']); photos(id, ended); }); };
          if (!navigator.onLine && window.indexedDB) return queue();
          return sb('POST', 'object/job-photos/' + path, b, true).then(function () { return rpc('job_photo_add', { p_job: id, p_path: path }); }).then(function () { photos(id, ended); })
            .catch(function (e) { if (isNet(e) && window.indexedDB) return queue(); throw e; });
        }).catch(function (e) { m.textContent = errmsg(e); });
      };
    }).catch(function () { box.innerHTML = ''; });
  }
  function detail(id) {
    page('<div class="empty">' + T(['جارٍ التحميل...', 'Loading...']) + '</div>', 'x');
    var staff = mgr() && can('jobs.assign') ? rpc('jobs_staff').catch(function () { return []; }) : Promise.resolve([]);
    Promise.all([rpc('job_get', { p_job: id }), staff]).then(function (r) {
      var j = r[0], st = r[1], ended = ['approved', 'closed', 'cancelled'].indexOf(j.status) >= 0, mine = j.status !== 'pending_approval';
      var h = '<div class="panel"><div class="r" style="display:flex;justify-content:space-between;gap:8px"><b>' + esc(j.title) + '</b><span class="st s-' + j.status + '">' + T(ST[j.status]) + '</span></div><div class="hist">' + esc(j.job_no) + ' · ' + T(PR[j.priority]) + '</div>' +
        (j.details ? '<p style="margin:8px 0">' + esc(j.details) + '</p>' : '') +
        (j.site_address ? '<div class="hist">' + T(['الموقع', 'Site']) + ': ' + esc(j.site_address) + '</div>' : '') +
        (j.contact_phone ? '<div class="hist"><a href="tel:' + esc(j.contact_phone) + '" style="color:var(--o)" dir="ltr">' + esc(j.contact_phone) + '</a></div>' : '') + '</div>';
      (function () {
        var FL = ['assigned', 'on_the_way', 'in_progress', 'pending_approval', 'approved', 'closed'], LB = { assigned: ['معيّنة', 'Assigned'], on_the_way: ['في الطريق', 'On the way'], in_progress: ['تنفيذ', 'Working'], pending_approval: ['اعتماد', 'Review'], approved: ['معتمدة', 'Approved'], closed: ['مغلقة', 'Closed'] };
        var cur = FL.indexOf(j.status === 'waiting_parts' ? 'in_progress' : j.status); if (j.status === 'new') cur = -1;
        if (j.status !== 'cancelled') h += '<div class="jstep" role="list">' + FL.map(function (k, i) { return '<div class="js' + (i < cur ? ' dn' : i === cur ? ' on' : '') + '" role="listitem"><i>' + (i < cur ? '\u2713' : (i + 1)) + '</i><span>' + T(LB[k]) + '</span></div>'; }).join('') + '</div>';
        var cd = j.checklist.filter(function (c) { return c.done; }).length;
        h += '<div class="jstats"><div><b>' + (j.checklist.length ? cd + '/' + j.checklist.length : '\u2014') + '</b><small>' + T(['قائمة الفحص', 'Checklist']) + '</small></div><div><b>' + j.parts.length + '</b><small>' + T(['القطع', 'Parts']) + '</small></div><div><b>' + T(PR[j.priority]) + '</b><small>' + T(['الأولوية', 'Priority']) + '</small></div></div>';
      })();
      if (j.checklist.length) h += '<div class="panel"><h3>' + T(['قائمة الفحص', 'Checklist']) + '</h3>' + j.checklist.map(function (c) { return '<label class="chk' + (c.done ? ' d' : '') + '"><input type="checkbox" data-c="' + c.id + '"' + (c.done ? ' checked' : '') + (ended ? ' disabled' : '') + '><span>' + esc(c.label) + '</span></label>'; }).join('') + '</div>';
      h += '<div class="panel"><h3>' + T(['القطع المستخدمة', 'Parts used']) + '</h3>' + (j.parts.length ? j.parts.map(function (p) { return '<div class="hist">' + esc(p.name) + ' × ' + esc(p.qty) + (p.item_id ? ' · ' + T([p.consumed_at ? 'تم الخصم من المخزون' : 'تُخصم عند الاعتماد', p.consumed_at ? 'deducted from stock' : 'deducted on approval']) : '') + '</div>'; }).join('') : '<div class="hist">' + T(['لا توجد قطع مسجلة', 'No parts logged']) + '</div>') +
        (ended ? '' : '<div class="hist" style="margin-top:6px">' + T(['اختر قطعة من المخزون لخصمها عند الاعتماد، أو اكتب اسمًا حرًا (بدون خصم).', 'Pick a stock item to deduct it on approval, or type a free name (no deduction).']) + '</div><div class="row2" style="margin-top:8px"><input id="pn" list="pl" autocomplete="off" placeholder="' + T(['اسم القطعة', 'Part name']) + '"><datalist id="pl"></datalist><input id="pq" class="q" type="number" min="0.01" step="any" value="1" inputmode="decimal"><button class="sm" id="pa">+</button></div>') + '</div>';
      h += '<div class="panel" id="jph"></div>';
      if (st.length && !ended) h += '<div class="panel"><h3>' + T(['الفني', 'Technician']) + '</h3><select id="as"><option value="">—</option>' + st.map(function (u) { return '<option value="' + u.user_id + '"' + (u.user_id === j.assigned_to ? ' selected' : '') + '>' + esc(u.email) + ' (' + esc(u.role) + ')</option>'; }).join('') + '</select></div>';
      var a = '', b = function (to, ar, en, cls) { return '<button class="btn ' + (cls || '') + '" data-to="' + to + '">' + T([ar, en]) + '</button>'; };
      if (j.status === 'assigned') a += b('on_the_way', 'أنا في الطريق', 'I am on my way', 'alt') + b('in_progress', 'بدء العمل', 'Start work');
      if (j.status === 'on_the_way') a += b('in_progress', 'بدء العمل', 'Start work');
      if (j.status === 'waiting_parts') a += b('in_progress', 'استئناف العمل', 'Resume work');
      if (j.status === 'in_progress') a += b('waiting_parts', 'بانتظار قطع', 'Waiting for parts', 'alt') + b('pending_approval', 'تم الإنجاز، أرسل للاعتماد', 'Done, send for approval');
      if (j.status === 'pending_approval' && can('jobs.approve')) a += b('approved', 'اعتماد', 'Approve') + b('assigned', 'إعادة للفني', 'Send back', 'alt');
      if (j.status === 'approved' && can('jobs.approve')) a += b('closed', 'إغلاق المهمة', 'Close job');
      if (!ended && can('jobs.assign')) a += b('cancelled', 'إلغاء المهمة', 'Cancel job', 'alt bd');
      if (a) h += '<div class="panel"><label>' + T(['ملاحظة (اختياري)', 'Note (optional)']) + '</label><textarea id="nt" rows="2"></textarea><div class="msg" id="je" hidden></div><div class="acts">' + a + '</div></div>';
      h += '<div class="panel"><h3>' + T(['السجل', 'History']) + '</h3>' + j.history.map(function (x) { return '<div class="hist">' + T(ST[x.to_status] || ['', '']) + (x.note ? ' · ' + esc(x.note) : '') + ' · ' + new Date(x.at).toLocaleString(S.lang() === 'en' ? 'en-GB' : 'ar-EG-u-nu-latn') + '</div>'; }).join('') + '</div>';
      document.querySelector('.wrap .empty').outerHTML = h; photos(id, ended);
      var show = function (x) { var m = document.getElementById('je'); if (m) { m.hidden = false; m.textContent = errmsg(x); } else alert(errmsg(x)); };
      [].forEach.call(document.querySelectorAll('[data-c]'), function (c) { c.onchange = function () { rpc('job_check', { p_item: c.getAttribute('data-c'), p_done: c.checked }).then(function () { c.parentNode.classList.toggle('d', c.checked); }).catch(function (x) { c.checked = !c.checked; show(x); }); }; });
      var items = {}, pn = document.getElementById('pn'), tmr = null;
      if (pn) pn.oninput = function () { clearTimeout(tmr); var q = pn.value.trim(); if (q.length < 2) return; tmr = setTimeout(function () { rpc('jobs_items_search', { p_q: q }).then(function (r) { items = {}; r.forEach(function (x) { items[x.name] = x; }); document.getElementById('pl').innerHTML = r.map(function (x) { return '<option value="' + esc(x.name) + '">' + esc(T(['المتاح', 'In stock'])) + ' ' + x.stock + '</option>'; }).join(''); }).catch(function () {}); }, 300); };
      var pa = document.getElementById('pa'); if (pa) pa.onclick = function () { var it = items[val('pn')]; rpc('job_add_part', { p_job: id, p_name: val('pn'), p_qty: Number(val('pq')), p_item: it ? it.id : null }).then(function () { detail(id); }).catch(show); };
      var as = document.getElementById('as'); if (as) as.onchange = function () { if (as.value) rpc('job_assign', { p_job: id, p_user: as.value }).then(function () { detail(id); }).catch(show); };
      [].forEach.call(document.querySelectorAll('[data-to]'), function (x) { x.onclick = function () { x.disabled = true; rpc('job_set_status', { p_job: id, p_to: x.getAttribute('data-to'), p_note: val('nt') || null }).then(function () { detail(id); }).catch(function (e) { x.disabled = false; show(e); }); }; });
    }).catch(function (e) { document.querySelector('.wrap .empty').textContent = errmsg(e); });
  }
  S.jobs = list;
  if (location.hash === '#jobs' && S.ctx && S.ctx.user) list();
})();
