/* Uno Staff: attendance, leave, tasks. No GPS. Server enforces rules; this only presents them. */
(function () {
  'use strict';
  var S = window.UNO_SA; if (!S) return;
  var T = S.T, esc = S.esc;
  var KIND = { annual: ['سنوية', 'Annual'], sick: ['مرضية', 'Sick'], unpaid: ['بدون أجر', 'Unpaid'], other: ['أخرى', 'Other'] };
  var LS = { pending: ['قيد المراجعة', 'Pending'], approved: ['موافق عليها', 'Approved'], rejected: ['مرفوضة', 'Rejected'], cancelled: ['ملغاة', 'Cancelled'] };
  function rpc(n, b) { return S.api('POST', 'rpc/' + n, b || {}); }
  function can(p) { var c = S.ctx; return c.role === 'owner' || (c.perms || []).indexOf(p) >= 0; }
  function errmsg(e) { var m = String(e && e.message || e); return navigator.onLine ? m.replace(/^.*?:\s*/, '') : T(['لا يوجد اتصال', 'No connection']); }
  function val(i) { return document.getElementById(i).value.trim(); }
  function tm(x) { return x ? new Date(x).toLocaleTimeString(S.lang() === 'en' ? 'en-GB' : 'ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit' }) : '—'; }
  function dy(x) { return new Date(x + 'T00:00:00').toLocaleDateString(S.lang() === 'en' ? 'en-GB' : 'ar-EG-u-nu-latn', { day: 'numeric', month: 'short' }); }
  function today() { var d = new Date(Date.now() + 2 * 3600e3); return d.toISOString().slice(0, 10); }
  function hr() {
    S.applyTheme();
    S.app.innerHTML = '<div class="wrap">' + S.shellTop() + '<div class="bar"><button class="sm" id="bk">' + T(['رجوع', 'Back']) + '</button><h1>' + T(['حضوري وإجازاتي', 'Attendance and leave']) + '</h1></div><div class="empty">' + T(['جارٍ التحميل...', 'Loading...']) + '</div></div>';
    S.wire(); document.getElementById('bk').onclick = S.home;
    var self = can('hr.self'), mgr = can('hr.manage');
    Promise.all([self ? rpc('hr_today') : Promise.resolve(null), rpc('hr_leave_list').catch(function () { return []; }), rpc('tasks_list').catch(function () { return []; }),
      mgr ? rpc('hr_attendance_list', { p_from: today(), p_to: today() }).catch(function () { return []; }) : Promise.resolve([]),
      can('hr.manage') || can('jobs.assign') ? rpc('jobs_staff').catch(function () { return []; }) : Promise.resolve([])]).then(function (r) {
      var td = r[0], leaves = r[1], tasks = r[2], att = r[3], staff = r[4], h = '';
      if (mgr) h += '<div class="jst" style="grid-template-columns:repeat(2,1fr)"><div><b>' + att.filter(function (x) { return x.check_in; }).length + '</b><small>' + T(['حاضر اليوم', 'Present today']) + '</small></div><div><b>' + leaves.filter(function (l) { return l.status === 'pending'; }).length + '</b><small>' + T(['إجازات معلقة', 'Pending leave']) + '</small></div></div>';
      if (self) {
        var a = td && td.today;
        h += '<div class="panel"><h3>' + T(['اليوم', 'Today']) + '</h3><div class="hist" style="font-size:14px">' + T(['حضور', 'In']) + ': <b>' + tm(a && a.check_in) + '</b> · ' + T(['انصراف', 'Out']) + ': <b>' + tm(a && a.check_out) + '</b></div><div class="msg" id="ae" hidden></div><div class="acts">' +
          (!a ? '<button class="btn" id="ci">' + T(['تسجيل حضور', 'Check in']) + '</button>' : !a.check_out ? '<button class="btn" id="co">' + T(['تسجيل انصراف', 'Check out']) + '</button>' : '<div class="hist">' + T(['تم تسجيل يومك. شكرًا.', 'Your day is logged. Thanks.']) + '</div>') + '</div>' +
          '<div class="hist" style="margin-top:8px">' + T(['الموقع لا يُسجَّل. الحضور بالوقت فقط.', 'Location is not recorded. Time only.']) + '</div></div>';
        h += '<div class="panel"><h3>' + T(['طلب إجازة', 'Request leave']) + '</h3><label>' + T(['النوع', 'Type']) + '</label><select id="lk">' + Object.keys(KIND).map(function (k) { return '<option value="' + k + '">' + T(KIND[k]) + '</option>'; }).join('') + '</select>' +
          '<div class="row2"><div style="flex:1"><label>' + T(['من', 'From']) + '</label><input id="lf" type="date" value="' + today() + '"></div><div style="flex:1"><label>' + T(['إلى', 'To']) + '</label><input id="lt" type="date" value="' + today() + '"></div></div>' +
          '<label>' + T(['السبب (اختياري)', 'Reason (optional)']) + '</label><input id="lr"><div class="msg" id="le" hidden></div><div class="acts"><button class="btn" id="ls">' + T(['إرسال الطلب', 'Send request']) + '</button></div></div>';
      }
      if (leaves.length) h += '<div class="panel"><h3>' + T(['الإجازات', 'Leave']) + '</h3>' + leaves.map(function (l) {
        var mine = l.user_id === S.ctx.user.id;
        return '<div class="chk" style="cursor:default;display:block"><div style="display:flex;justify-content:space-between;gap:8px"><b>' + esc(mgr && !mine ? (l.email || '') : T(KIND[l.kind])) + '</b><span class="st s-' + ({ pending: 'pending_approval', approved: 'approved', rejected: 'cancelled', cancelled: 'cancelled' }[l.status] || 'new') + '">' + T(LS[l.status]) + '</span></div><div class="hist">' + T(KIND[l.kind]) + ' · ' + dy(l.from_day) + ' → ' + dy(l.to_day) + (l.reason ? ' · ' + esc(l.reason) : '') + '</div>' +
          (l.status === 'pending' && mgr ? '<div class="row2" style="margin-top:6px"><button class="sm pr" data-d="1" data-id="' + l.id + '">' + T(['موافقة', 'Approve']) + '</button><button class="sm" data-d="0" data-id="' + l.id + '">' + T(['رفض', 'Reject']) + '</button></div>' : '') +
          (l.status === 'pending' && mine ? '<div class="row2" style="margin-top:6px"><button class="sm" data-x="' + l.id + '">' + T(['إلغاء الطلب', 'Cancel request']) + '</button></div>' : '') + '</div>';
      }).join('') + '</div>';
      if (tasks.length || mgr) h += '<div class="panel"><h3>' + T(['المهام', 'Tasks']) + '</h3>' + (tasks.length ? tasks.map(function (t) { return '<label class="chk' + (t.status === 'done' ? ' d' : '') + '"><input type="checkbox" data-t="' + t.id + '"' + (t.status === 'done' ? ' checked' : '') + '><span>' + esc(t.title) + (t.due_day ? ' · ' + dy(t.due_day) : '') + (mgr && t.email ? ' · ' + esc(t.email) : '') + '</span></label>'; }).join('') : '<div class="hist">' + T(['لا توجد مهام', 'No tasks']) + '</div>') +
        (staff.length ? '<label>' + T(['مهمة جديدة', 'New task']) + '</label><input id="tt"><select id="tu" style="margin-top:8px">' + staff.map(function (u) { return '<option value="' + u.user_id + '">' + esc(u.email) + '</option>'; }).join('') + '</select><input id="td" type="date" style="margin-top:8px"><div class="msg" id="te" hidden></div><div class="acts"><button class="btn alt" id="tc">' + T(['إضافة المهمة', 'Add task']) + '</button></div>' : '') + '</div>';
      if (mgr) h += '<div class="panel"><h3>' + T(['حضور اليوم', 'Today attendance']) + '</h3>' + (att.length ? att.map(function (x) { var nm = String(x.email || '?'); return '<div class="emp"><span class="av">' + esc(nm.charAt(0).toUpperCase()) + '</span><main><b>' + esc(nm.split('@')[0]) + '</b><small>' + esc(nm) + '</small></main><span class="att"><span class="ring ' + (x.check_out ? 'out' : 'in') + '" dir="ltr">' + tm(x.check_in) + '</span><small>' + (x.check_out ? T(['انصرف ', 'Out ']) + tm(x.check_out) : T(['حاضر', 'In'])) + '</small></span></div>'; }).join('') : '<div class="hist">' + T(['لا أحد سجّل بعد', 'Nobody yet']) + '</div>') + '</div>';
      document.querySelector('.wrap .empty').outerHTML = h;
      var show = function (id, x) { var m = document.getElementById(id) || document.getElementById('ae'); if (m) { m.hidden = false; m.textContent = errmsg(x); } };
      var go = function (id, fn, eid) { var b = document.getElementById(id); if (b) b.onclick = function () { b.disabled = true; fn().then(hr).catch(function (x) { b.disabled = false; show(eid, x); }); }; };
      go('ci', function () { return rpc('hr_checkin', {}); }, 'ae'); go('co', function () { return rpc('hr_checkout'); }, 'ae');
      go('ls', function () { return rpc('hr_leave_request', { p_kind: val('lk'), p_from: val('lf'), p_to: val('lt'), p_reason: val('lr') || null }); }, 'le');
      go('tc', function () { return rpc('task_create', { p_title: val('tt'), p_user: val('tu'), p_due: val('td') || null }); }, 'te');
      [].forEach.call(document.querySelectorAll('[data-d]'), function (b) { b.onclick = function () { b.disabled = true; rpc('hr_leave_decide', { p_id: b.getAttribute('data-id'), p_approve: b.getAttribute('data-d') === '1' }).then(hr).catch(function (x) { b.disabled = false; alert(errmsg(x)); }); }; });
      [].forEach.call(document.querySelectorAll('[data-x]'), function (b) { b.onclick = function () { rpc('hr_leave_cancel', { p_id: b.getAttribute('data-x') }).then(hr).catch(function (x) { alert(errmsg(x)); }); }; });
      [].forEach.call(document.querySelectorAll('[data-t]'), function (c) { c.onchange = function () { rpc('task_done', { p_id: c.getAttribute('data-t'), p_done: c.checked }).then(function () { c.parentNode.classList.toggle('d', c.checked); }).catch(function (x) { c.checked = !c.checked; alert(errmsg(x)); }); }; });
    }).catch(function (e) { document.querySelector('.wrap .empty').textContent = errmsg(e); });
  }
  S.hr = hr;
})();
