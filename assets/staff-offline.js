/* Uno Staff: manager review of POS sales made offline (read only). */
(function () {
  'use strict';
  var S = window.UNO_SA; if (!S) return;
  var T = S.T, esc = S.esc;
  var ST = { pending: ['بانتظار المزامنة', 'Waiting to sync'], synced: ['تمت المزامنة', 'Synced'], failed: ['فشلت، تحتاج مراجعة', 'Failed, needs review'] };
  function errmsg(e) { var m = String(e && e.message || e); return navigator.onLine ? m.replace(/^.*?:\s*/, '') : T(['لا يوجد اتصال', 'No connection']); }
  function show() {
    S.applyTheme();
    S.app.innerHTML = '<div class="wrap">' + S.shellTop() + '<div class="bar"><button class="sm" id="bk">' + T(['رجوع', 'Back']) + '</button><h1>' + T(['مبيعات أوفلاين', 'Offline sales']) + '</h1></div><div class="empty">' + T(['جارٍ التحميل...', 'Loading...']) + '</div></div>';
    S.wire(); document.getElementById('bk').onclick = S.home;
    S.api('POST', 'rpc/pos_offline_review', {}).then(function (rows) {
      var bad = rows.filter(function (r) { return r.status === 'failed'; }).length, wait = rows.filter(function (r) { return r.status === 'pending'; }).length;
      var h = '<div class="panel"><div class="hist" style="font-size:14px">' + T(['فشلت', 'Failed']) + ': <b style="color:var(--bad)">' + bad + '</b> · ' + T(['بانتظار', 'Waiting']) + ': <b>' + wait + '</b> · ' + T(['تمت', 'Synced']) + ': <b>' + (rows.length - bad - wait) + '</b></div><div class="hist" style="margin-top:6px">' + T(['الفاتورة الفاشلة لم تُسجَّل في النظام. بياناتها محفوظة على جهاز الكاشير حتى تُراجَع.', 'A failed sale is not recorded in the system. Its data stays on the cashier device until reviewed.']) + '</div></div>';
      h += rows.length ? rows.map(function (r) {
        return '<div class="job' + (r.status === 'failed' ? ' p-urgent' : '') + '" style="cursor:default"><div class="r"><b>' + esc(r.offline_no) + (r.doc_number ? ' → ' + esc(r.doc_number) : '') + '</b><span class="st s-' + (r.status === 'synced' ? 'approved' : r.status === 'failed' ? 'cancelled' : 'pending_approval') + '">' + T(ST[r.status]) + '</span></div><small>' + (r.total != null ? Number(r.total).toLocaleString() + ' · ' : '') + new Date(r.queued_at).toLocaleString(S.lang() === 'en' ? 'en-GB' : 'ar-EG-u-nu-latn') + (r.device_id ? ' · ' + esc(r.device_id) : '') + '</small>' + (r.error ? '<small style="color:var(--bad)">' + esc(r.error) + '</small>' : '') + '</div>';
      }).join('') : '<div class="empty">' + T(['لا توجد مبيعات أوفلاين مسجلة.', 'No offline sales recorded.']) + '</div>';
      document.querySelector('.wrap .empty').outerHTML = h;
    }).catch(function (e) { document.querySelector('.wrap .empty').textContent = errmsg(e); });
  }
  S.offline = show;
})();
