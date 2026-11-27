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
  function detail(id) {
    page('<div class="empty">' + T(['جارٍ التحميل...', 'Loading...']) + '</div>', 'x');
    var staff = mgr() && can('jobs.assign') ? rpc('jobs_staff').catch(function () { return []; }) : Promise.resolve([]);
    Promise.all([rpc('job_get', { p_job: id }), staff]).then(function (r) {
      var j = r[0], st = r[1], ended = ['approved', 'closed', 'cancelled'].indexOf(j.status) >= 0, mine = j.status !== 'pending_approval';
      var h = '<div class="panel"><div class="r" style="display:flex;justify-content:space-between;gap:8px"><b>' + esc(j.title) + '</b><span class="st s-' + j.status + '">' + T(ST[j.status]) + '</span></div><div class="hist">' + esc(j.job_no) + ' · ' + T(PR[j.priority]) + '</div>' +
        (j.details ? '<p style="margin:8px 0">' + esc(j.details) + '</p>' : '') +
        (j.site_address ? '<div class="hist">' + T(['الموقع', 'Site']) + ': ' + esc(j.site_address) + '</div>' : '') +
        (j.contact_phone ? '<div class="hist"><a href="tel:' + esc(j.contact_phone) + '" style="color:var(--o)" dir="ltr">' + esc(j.contact_phone) + '</a></div>' : '') + '</div>';
      if (j.checklist.length) h += '<div class="panel"><h3>' + T(['قائمة الفحص', 'Checklist']) + '</h3>' + j.checklist.map(function (c) { return '<label class="chk' + (c.done ? ' d' : '') + '"><input type="checkbox" data-c="' + c.id + '"' + (c.done ? ' checked' : '') + (ended ? ' disabled' : '') + '><span>' + esc(c.label) + '</span></label>'; }).join('') + '</div>';
      h += '<div class="panel"><h3>' + T(['القطع المستخدمة', 'Parts used']) + '</h3>' + (j.parts.length ? j.parts.map(function (p) { return '<div class="hist">' + esc(p.name) + ' × ' + esc(p.qty) + (p.item_id ? ' · ' + T([p.consumed_at ? 'تم الخصم من المخزون' : 'تُخصم عند الاعتماد', p.consumed_at ? 'deducted from stock' : 'deducted on approval']) : '') + '</div>'; }).join('') : '<div class="hist">' + T(['لا توجد قطع مسجلة', 'No parts logged']) + '</div>') +
        (ended ? '' : '<div class="hist" style="margin-top:6px">' + T(['اختر قطعة من المخزون لخصمها عند الاعتماد، أو اكتب اسمًا حرًا (بدون خصم).', 'Pick a stock item to deduct it on approval, or type a free name (no deduction).']) + '</div><div class="row2" style="margin-top:8px"><input id="pn" list="pl" autocomplete="off" placeholder="' + T(['اسم القطعة', 'Part name']) + '"><datalist id="pl"></datalist><input id="pq" class="q" type="number" min="0.01" step="any" value="1" inputmode="decimal"><button class="sm" id="pa">+</button></div>') + '</div>';
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
      h += '<div class="panel"><h3>' + T(['السجل', 'History']) + '</h3>' + j.history.map(function (x) { return '<div class="hist">' + T(ST[x.to_status] || ['', '']) + (x.note ? ' · ' + esc(x.note) : '') + ' · ' + new Date(x.at).toLocaleString(S.lang() === 'en' ? 'en-GB' : 'ar-EG') + '</div>'; }).join('') + '</div>';
      document.querySelector('.wrap .empty').outerHTML = h;
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
