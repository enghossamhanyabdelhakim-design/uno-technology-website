/* Uno Staff: manager overview (read only). One server call; each block appears only if the role may see it. */
(function () {
  'use strict';
  var S = window.UNO_SA; if (!S) return;
  var T = S.T, esc = S.esc;
  function errmsg(e) { var m = String(e && e.message || e); return navigator.onLine ? m.replace(/^.*?:\s*/, '') : T(['لا يوجد اتصال', 'No connection']); }
  function n(v) { return Number(v || 0).toLocaleString(S.lang() === 'en' ? 'en-US' : 'ar-EG-u-nu-latn'); }
  function card(title, href, rows, warn) {
    return '<a class="panel ovc' + (warn ? ' ovw' : '') + '" href="' + href + '"><h3>' + title + '</h3><div class="ovg">' + rows.map(function (r) { return '<div><b' + (r[2] ? ' style="color:var(--bad)"' : '') + '>' + n(r[1]) + '</b><small>' + r[0] + '</small></div>'; }).join('') + '</div></a>';
  }
  function show() {
    S.applyTheme();
    S.app.innerHTML = '<div class="wrap">' + S.shellTop() + '<div class="bar"><button class="sm" id="bk">' + T(['رجوع', 'Back']) + '</button><h1>' + T(['نظرة عامة', 'Overview']) + '</h1></div><div class="empty">' + T(['جارٍ التحميل...', 'Loading...']) + '</div></div>';
    S.wire(); document.getElementById('bk').onclick = S.home;
    S.api('POST', 'rpc/mgr_overview', {}).then(function (o) {
      var h = '';
      if (o.jobs) h += card(T(['أعمال الفنيين', 'Technician jobs']), '#jobs', [[T(['قيد التنفيذ', 'Active']), o.jobs.active], [T(['اليوم', 'Today']), o.jobs.today], [T(['غير معيّنة', 'Unassigned']), o.jobs.unassigned, o.jobs.unassigned > 0], [T(['بانتظار الاعتماد', 'To approve']), o.jobs.pending_approval, o.jobs.pending_approval > 0]]) +
        (o.jobs.urgent.length ? '<div class="panel"><h3>' + T(['عالية الأولوية', 'High priority']) + '</h3>' + o.jobs.urgent.map(function (j) { return '<div class="hist"><b>' + esc(j.job_no) + '</b> · ' + esc(j.title) + '</div>'; }).join('') + '</div>' : '');
      if (o.leads) h += card(T(['المبيعات', 'Sales']), '#crm', [[T(['عملاء محتملون مفتوحون', 'Open leads']), o.leads.open], [T(['متابعة مستحقة', 'Follow-ups due']), o.leads.follow_due, o.leads.follow_due > 0]]);
      if (o.offline) h += card(T(['مبيعات أوفلاين', 'Offline sales']), '#offline', [[T(['بانتظار المزامنة', 'Waiting']), o.offline.pending], [T(['فشلت', 'Failed']), o.offline.failed, o.offline.failed > 0]]);
      if (o.attendance) h += card(T(['حضور اليوم', 'Attendance today']), '#hr', [[T(['داخل الآن', 'In now']), o.attendance.in], [T(['انصرفوا', 'Checked out']), o.attendance.out]]);
      if (o.stock) h += card(T(['المخزون', 'Stock']), 'erp.html', [[T(['نافد', 'Out']), o.stock.out, o.stock.out > 0], [T(['منخفض', 'Low']), o.stock.low, o.stock.low > 0]]) +
        (o.stock.items.length ? '<div class="panel"><h3>' + T(['أصناف تحتاج توريد', 'Items to restock']) + '</h3>' + o.stock.items.map(function (i) { return '<div class="hist">' + esc(i.name) + ' · ' + n(i.qty) + (i.min > 0 ? ' / ' + n(i.min) : '') + '</div>'; }).join('') + '</div>' : '');
      document.querySelector('.wrap .empty').outerHTML = h || '<div class="empty">—</div>';
    }).catch(function (e) { document.querySelector('.wrap .empty').textContent = errmsg(e); });
  }
  S.overview = show;
})();
