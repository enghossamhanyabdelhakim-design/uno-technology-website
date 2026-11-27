/* Uno Staff: sales leads and follow-up. Server enforces ownership and stage rules. */
(function () {
  'use strict';
  var S = window.UNO_SA; if (!S) return;
  var T = S.T, esc = S.esc, flt = 'open';
  var STG = { new: ['جديد', 'New'], contacted: ['تم التواصل', 'Contacted'], quoted: ['عرض سعر', 'Quoted'], won: ['تم البيع', 'Won'], lost: ['خسارة', 'Lost'] };
  var NK = { call: ['اتصال', 'Call'], visit: ['زيارة', 'Visit'], whatsapp: ['واتساب', 'WhatsApp'], note: ['ملاحظة', 'Note'], stage: ['المرحلة', 'Stage'] };
  function rpc(n, b) { return S.api('POST', 'rpc/' + n, b || {}); }
  function can(p) { var c = S.ctx; return c.role === 'owner' || (c.perms || []).indexOf(p) >= 0; }
  function errmsg(e) { var m = String(e && e.message || e); return navigator.onLine ? m.replace(/^.*?:\s*/, '') : T(['لا يوجد اتصال', 'No connection']); }
  function val(i) { return document.getElementById(i).value.trim(); }
  function dy(x) { return new Date(x + 'T00:00:00').toLocaleDateString(S.lang() === 'en' ? 'en-GB' : 'ar-EG', { day: 'numeric', month: 'short' }); }
  function today() { return new Date(Date.now() + 2 * 3600e3).toISOString().slice(0, 10); }
  function digits(p) { return String(p || '').replace(/\D/g, '').replace(/^0/, '20'); }
  function page(inner, root) {
    S.applyTheme();
    S.app.innerHTML = '<div class="wrap">' + S.shellTop() + '<div class="bar"><button class="sm" id="bk">' + T(['رجوع', 'Back']) + '</button><h1>' + T(['المبيعات والعملاء', 'Sales and CRM']) + '</h1>' + (root && can('crm.edit') ? '<button class="sm pr" id="nw">+ ' + T(['عميل', 'Lead']) + '</button>' : '') + '</div>' + inner + '</div>';
    S.wire(); document.getElementById('bk').onclick = root ? S.home : list;
  }
  function list() {
    page('<div class="empty">' + T(['جارٍ التحميل...', 'Loading...']) + '</div>', true);
    var nw = document.getElementById('nw'); if (nw) nw.onclick = function () { form(); };
    rpc('crm_leads_list', {}).then(function (rows) {
      var f = { open: function (r) { return r.stage !== 'won' && r.stage !== 'lost'; }, won: function (r) { return r.stage === 'won'; }, lost: function (r) { return r.stage === 'lost'; } };
      var ch = [['open', ['المفتوحة', 'Open']], ['won', ['تم البيع', 'Won']], ['lost', ['الخسارة', 'Lost']]];
      var h = '<div class="chips">' + ch.map(function (c) { return '<button class="sm' + (flt === c[0] ? ' on' : '') + '" data-f="' + c[0] + '">' + T(c[1]) + ' (' + rows.filter(f[c[0]]).length + ')</button>'; }).join('') + '</div>';
      var shown = rows.filter(f[flt]);
      h += shown.length ? shown.map(function (r) {
        var late = r.next_follow_day && r.next_follow_day <= today() && f.open(r);
        return '<button class="job' + (late ? ' p-high' : '') + '" data-id="' + r.id + '"><div class="r"><b>' + esc(r.name) + '</b><span class="st s-' + (r.stage === 'won' ? 'approved' : r.stage === 'lost' ? 'cancelled' : 'in_progress') + '">' + T(STG[r.stage]) + '</span></div><small>' + (r.phone ? '<span dir="ltr">' + esc(r.phone) + '</span>' : '') + (r.next_follow_day ? ' · ' + T(['متابعة', 'Follow-up']) + ' ' + dy(r.next_follow_day) + (late ? ' ⚑' : '') : '') + (r.est_value ? ' · ' + Number(r.est_value).toLocaleString() : '') + '</small></button>';
      }).join('') : '<div class="empty">' + T(['لا يوجد عملاء هنا.', 'No leads here.']) + '</div>';
      document.querySelector('.wrap .empty').outerHTML = '<div>' + h + '</div>';
      [].forEach.call(document.querySelectorAll('[data-f]'), function (b) { b.onclick = function () { flt = b.getAttribute('data-f'); list(); }; });
      [].forEach.call(document.querySelectorAll('.job'), function (b) { b.onclick = function () { detail(b.getAttribute('data-id')); }; });
    }).catch(function (e) { document.querySelector('.wrap .empty').textContent = errmsg(e); });
  }
  function form(l) {
    l = l || {};
    page('<form class="panel" id="lf"><label>' + T(['الاسم', 'Name']) + '</label><input id="ln" required value="' + esc(l.name || '') + '">' +
      '<label>' + T(['الهاتف', 'Phone']) + '</label><input id="lp" type="tel" inputmode="tel" dir="ltr" value="' + esc(l.phone || '') + '">' +
      '<label>' + T(['المصدر (مثال: معرض، إحالة)', 'Source (e.g. referral)']) + '</label><input id="lso" value="' + esc(l.source || '') + '">' +
      '<label>' + T(['القيمة التقديرية', 'Estimated value']) + '</label><input id="lv" type="number" min="0" step="any" inputmode="decimal" value="' + esc(l.est_value || '') + '">' +
      '<label>' + T(['موعد المتابعة', 'Next follow-up']) + '</label><input id="lnx" type="date" value="' + esc(l.next_follow_day || '') + '">' +
      '<label>' + T(['تفاصيل', 'Details']) + '</label><textarea id="ld" rows="3">' + esc(l.details || '') + '</textarea>' +
      '<div class="msg" id="le" hidden></div><div class="acts"><button class="btn" type="submit">' + T(['حفظ', 'Save']) + '</button></div></form>');
    document.getElementById('lf').onsubmit = function (e) {
      e.preventDefault(); var b = this.querySelector('button'); b.disabled = true;
      rpc('crm_lead_save', { p: { id: l.id || null, ref: l.id ? null : 'w' + Date.now() + Math.random().toString(36).slice(2, 7), name: val('ln'), phone: val('lp'), source: val('lso'), est_value: val('lv'), next_follow_day: val('lnx'), details: val('ld') } })
        .then(function (id) { detail(id); }).catch(function (x) { b.disabled = false; var m = document.getElementById('le'); m.hidden = false; m.textContent = errmsg(x); });
    };
  }

  function money(n) { return Number(n || 0).toLocaleString(S.lang() === 'en' ? 'en-US' : 'ar-EG'); }
  var QS = { draft: ['مسودة', 'Draft'], sent: ['مرسل', 'Sent'], accepted: ['مقبول', 'Accepted'], rejected: ['مرفوض', 'Rejected'] };
  function quotes(id, l, ed) {
    var box = document.getElementById('qp'); if (!box) return;
    var lines = [];
    rpc('crm_quotes_list', { p_lead: id }).then(function (qs) {
      var h = '<div class="panel"><h3>' + T(['العميل وعروض الأسعار', 'Customer & quotes']) + '</h3>';
      h += l.partner_id ? '<div class="hist">' + T(['مرتبط بسجل عميل', 'Linked to a customer record']) + '</div>' : (ed ? '<div class="acts"><button class="btn alt" id="cv">' + T(['تحويل إلى عميل', 'Convert to customer']) + '</button></div>' : '');
      h += qs.map(function (q) { return '<div class="hist" style="margin-top:8px"><b>#' + q.no + '</b> · ' + T(QS[q.status]) + ' · ' + money(q.total) + ' ' + T(['ج.م', 'EGP']) + '<br>' + q.lines.map(function (x) { return esc(x.name) + ' × ' + x.qty; }).join(' · ') +
        (ed && q.status === 'draft' ? '<div class="acts"><button class="btn alt" data-q="' + q.id + '|sent">' + T(['تم الإرسال', 'Mark sent']) + '</button></div>' : '') +
        (ed && q.status === 'sent' ? '<div class="acts"><button class="btn" data-q="' + q.id + '|accepted">' + T(['مقبول', 'Accepted']) + '</button><button class="btn alt bd" data-q="' + q.id + '|rejected">' + T(['مرفوض', 'Rejected']) + '</button></div>' : '') + '</div>'; }).join('');
      if (ed && l.stage !== 'won' && l.stage !== 'lost') h += '<h3 style="margin-top:12px">' + T(['عرض سعر جديد', 'New quote']) + '</h3><div id="ql"></div><input id="qn" placeholder="' + T(['البند', 'Item']) + '"><div class="row2"><input id="qq" type="number" min="1" value="1" inputmode="decimal"><input id="qp2" type="number" min="0" placeholder="' + T(['السعر', 'Price']) + '" inputmode="decimal"><button class="sm" id="qa">+</button></div><div class="msg" id="qe" hidden></div><div class="acts"><button class="btn" id="qs" disabled>' + T(['حفظ كمسودة', 'Save draft']) + '</button></div>';
      box.innerHTML = h + '</div>';
      var er = function (x) { var m = document.getElementById('qe'); if (m) { m.hidden = false; m.textContent = errmsg(x); } else alert(errmsg(x)); };
      var cv = document.getElementById('cv'); if (cv) cv.onclick = function () { cv.disabled = true; rpc('crm_convert_customer', { p_id: id }).then(function () { detail(id); }).catch(function (x) { cv.disabled = false; er(x); }); };
      [].forEach.call(box.querySelectorAll('[data-q]'), function (b) { b.onclick = function () { var a = b.getAttribute('data-q').split('|'); b.disabled = true; rpc('crm_quote_status', { p_id: a[0], p_status: a[1] }).then(function () { detail(id); }).catch(function (x) { b.disabled = false; er(x); }); }; });
      var qa = document.getElementById('qa'); if (!qa) return;
      var draw = function () { document.getElementById('ql').innerHTML = lines.map(function (x) { return '<div class="hist">' + esc(x.name) + ' × ' + x.qty + ' = ' + money(x.qty * x.price) + '</div>'; }).join(''); document.getElementById('qs').disabled = !lines.length; };
      qa.onclick = function () { var n = val('qn'), q = Number(val('qq')), p = Number(val('qp2')); if (!n || !(q > 0) || !(p >= 0) || val('qp2') === '') return er(T(['أكمل البند والكمية والسعر', 'Complete item, quantity and price'])); lines.push({ name: n, qty: q, price: p }); document.getElementById('qn').value = ''; document.getElementById('qp2').value = ''; draw(); };
      document.getElementById('qs').onclick = function () { var b = this; b.disabled = true; rpc('crm_quote_save', { p: { lead_id: id, lines: lines } }).then(function () { detail(id); }).catch(function (x) { b.disabled = false; er(x); }); };
    }).catch(function () { box.innerHTML = ''; });
  }
  function detail(id) {
    page('<div class="empty">' + T(['جارٍ التحميل...', 'Loading...']) + '</div>');
    rpc('crm_lead_get', { p_id: id }).then(function (l) {
      var closed = l.stage === 'won' || l.stage === 'lost', ed = can('crm.edit');
      var h = '<div class="panel"><div style="display:flex;justify-content:space-between;gap:8px"><b>' + esc(l.name) + '</b><span class="st">' + T(STG[l.stage]) + '</span></div>' +
        (l.phone ? '<div class="row2" style="margin-top:10px"><a class="sm" style="display:grid;place-items:center;text-decoration:none;flex:1" href="tel:' + esc(l.phone) + '">' + T(['اتصال', 'Call']) + '</a><a class="sm" style="display:grid;place-items:center;text-decoration:none;flex:1" target="_blank" rel="noopener" href="https://wa.me/' + digits(l.phone) + '">' + T(['واتساب', 'WhatsApp']) + '</a></div>' : '') +
        '<div class="hist" style="margin-top:8px">' + (l.source ? T(['المصدر', 'Source']) + ': ' + esc(l.source) + ' · ' : '') + (l.est_value ? T(['التقدير', 'Est.']) + ': ' + Number(l.est_value).toLocaleString() + ' · ' : '') + (l.next_follow_day ? T(['المتابعة', 'Follow-up']) + ': ' + dy(l.next_follow_day) : '') + '</div>' +
        (l.details ? '<p style="margin:8px 0 0">' + esc(l.details) + '</p>' : '') + (l.lost_reason ? '<div class="hist">' + T(['سبب الخسارة', 'Lost reason']) + ': ' + esc(l.lost_reason) + '</div>' : '') +
        (ed && !closed ? '<div class="acts"><button class="btn alt" id="eb">' + T(['تعديل البيانات', 'Edit details']) + '</button></div>' : '') + '</div>';
      if (ed && !closed) h += '<div class="panel"><h3>' + T(['تسجيل متابعة', 'Log follow-up']) + '</h3><select id="nk">' + ['call', 'visit', 'whatsapp', 'note'].map(function (k) { return '<option value="' + k + '">' + T(NK[k]) + '</option>'; }).join('') + '</select><label>' + T(['ماذا حدث؟', 'What happened?']) + '</label><textarea id="nb" rows="2"></textarea><label>' + T(['المتابعة القادمة', 'Next follow-up']) + '</label><input id="nn" type="date"><div class="msg" id="ne" hidden></div><div class="acts"><button class="btn" id="na">' + T(['حفظ', 'Save']) + '</button></div></div>' +
        '<div class="panel"><h3>' + T(['المرحلة', 'Stage']) + '</h3><label>' + T(['ملاحظة (إجبارية عند الخسارة)', 'Note (required if lost)']) + '</label><input id="sn"><div class="acts">' + ['contacted', 'quoted', 'won', 'lost'].filter(function (s) { return s !== l.stage; }).map(function (s) { return '<button class="btn ' + (s === 'won' ? '' : 'alt') + (s === 'lost' ? ' bd' : '') + '" data-s="' + s + '">' + T(STG[s]) + '</button>'; }).join('') + '</div></div>';
      h += '<div class="panel"><h3>' + T(['السجل', 'History']) + '</h3>' + (l.notes.length ? l.notes.map(function (n) { return '<div class="hist"><b>' + T(NK[n.kind]) + '</b> · ' + esc(n.body) + ' · ' + new Date(n.at).toLocaleDateString(S.lang() === 'en' ? 'en-GB' : 'ar-EG') + '</div>'; }).join('') : '<div class="hist">—</div>') + '</div>';
      h = h.replace('<div class="panel"><h3>' + T(['السجل', 'History']) + '</h3>', '<div id="qp"></div><div class="panel"><h3>' + T(['السجل', 'History']) + '</h3>');
      document.querySelector('.wrap .empty').outerHTML = h; quotes(id, l, ed);
      var eb = document.getElementById('eb'); if (eb) eb.onclick = function () { form(l); };
      var show = function (x) { var m = document.getElementById('ne'); if (m) { m.hidden = false; m.textContent = errmsg(x); } else alert(errmsg(x)); };
      var na = document.getElementById('na'); if (na) na.onclick = function () { na.disabled = true; rpc('crm_note_add', { p_id: id, p_kind: val('nk'), p_body: val('nb'), p_next: val('nn') || null }).then(function () { detail(id); }).catch(function (x) { na.disabled = false; show(x); }); };
      [].forEach.call(document.querySelectorAll('[data-s]'), function (b) { b.onclick = function () { b.disabled = true; rpc('crm_lead_stage', { p_id: id, p_stage: b.getAttribute('data-s'), p_note: val('sn') || null }).then(function () { detail(id); }).catch(function (x) { b.disabled = false; show(x); }); }; });
    }).catch(function (e) { document.querySelector('.wrap .empty').textContent = errmsg(e); });
  }
  S.crm = list;
})();
