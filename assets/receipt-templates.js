/* UNO receipt and invoice templates. Own layouts, own code. window.UnoReceipt.render(inv, ctx) -> HTML string. */
(function () {
  var TEMPLATES = [
    { id: 'th80', w: '80mm', ar: 'حراري 80 مم · تفصيلي', en: 'Thermal 80 mm · detailed', ar2: 'الشكل المعتاد للكاشير: لوجو، بنود بالتفصيل، ضريبة، QR', en2: 'Standard counter receipt: logo, itemised lines, VAT, QR' },
    { id: 'th80c', w: '80mm', ar: 'حراري 80 مم · مختصر', en: 'Thermal 80 mm · compact', ar2: 'سطر واحد لكل صنف، ورق أقل، للزحمة', en2: 'One line per item, less paper, for busy hours' },
    { id: 'th58', w: '58mm', ar: 'حراري 58 مم', en: 'Thermal 58 mm', ar2: 'للطابعات الصغيرة والبلوتوث', en2: 'For small and Bluetooth printers' },
    { id: 'th80w', w: '80mm', ar: 'حراري 80 مم · جملة', en: 'Thermal 80 mm · wholesale', ar2: 'بيانات العميل، إجمالي الكميات، خانة استلام وتوقيع', en2: 'Customer block, total quantity, receiver signature' },
    { id: 'a4', w: '210mm', ar: 'فاتورة ضريبية A4', en: 'A4 tax invoice', ar2: 'فاتورة كاملة بالجدول والضريبة والتوقيعات', en2: 'Full invoice with table, VAT and signatures' }
  ];
  var CSS = '.rc{--ink:#111;font-family:"Segoe UI",Tahoma,Arial,sans-serif;color:#000;background:#fff;box-sizing:border-box;line-height:1.35}' +
    '.rc *{box-sizing:border-box}.rc table{width:100%;border-collapse:collapse}.rc td,.rc th{padding:1px 0;vertical-align:top}.rc .e{text-align:end}.rc .c{text-align:center}.rc .n{font-variant-numeric:tabular-nums;direction:ltr;unicode-bidi:embed}' +
    '.rc .ql{display:inline-flex;gap:4px;align-items:baseline}.rc .sep{border-top:1px dashed #777;margin:5px 0}.rc .sep2{border-top:2px solid #000;margin:5px 0}.rc .tot td{font-weight:800;font-size:1.25em;padding-top:3px}.rc .sm{font-size:.82em;color:#333}' +
    '.rc .logo{display:block;margin:0 auto 3px;object-fit:contain}.rc .qr{display:flex;justify-content:center;margin:6px 0 2px}.rc .nm{font-weight:700}' +
    '.rc.th{padding:3.5mm 3mm;font-size:11px}.rc.th80,.rc.th80c,.rc.th80w{width:80mm}.rc.th58{width:58mm;font-size:10px;padding:3mm 2mm}' +
    '.rc .co{font-size:1.35em;font-weight:800;text-align:center}.rc .tag{display:inline-block;border:1px solid #000;border-radius:3px;padding:0 4px;font-weight:700;font-size:.85em}' +
    '.rc .sig{display:flex;gap:8px;margin-top:14px}.rc .sig div{flex:1;border-top:1px solid #000;padding-top:2px;text-align:center;font-size:.85em}' +
    '.rc.a4{width:210mm;min-height:297mm;padding:14mm 14mm 12mm;font-size:12.5px;position:relative}' +
    '.rc.a4 .hd{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:3px solid #f26a21;padding-bottom:10px}' +
    '.rc.a4 .ttl{font-size:26px;font-weight:800;letter-spacing:.3px}.rc.a4 .meta td{padding:2px 0 2px 14px}.rc.a4 .meta td:first-child{color:#555}' +
    '.rc.a4 .box{border:1px solid #bbb;border-radius:6px;padding:8px 10px;margin-top:10px}.rc.a4 .box h4{margin:0 0 4px;font-size:11px;color:#666;font-weight:700;text-transform:uppercase}' +
    '.rc.a4 table.it{margin-top:12px;border:1px solid #999}.rc.a4 table.it th{background:#f3f3f3;border:1px solid #999;padding:6px;font-size:11.5px}.rc.a4 table.it td{border:1px solid #ccc;padding:6px}' +
    '.rc.a4 .sum{width:62mm;margin-inline-start:auto;margin-top:10px}.rc.a4 .sum td{padding:3px 0}.rc.a4 .sum .g td{border-top:2px solid #000;font-size:16px;font-weight:800;padding-top:6px}' +
    '.rc.a4 .ft{display:flex;justify-content:space-between;align-items:flex-end;margin-top:22px;gap:12px}.rc.a4 .sig div{padding-top:4px;margin-top:30px}' +
    '@media print{.rc{break-inside:avoid}}';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function abs(p) { try { return new URL(p, document.baseURI).href; } catch (e) { return p; } }
  function qrText(inv, c) {
    return ['UNO', inv.number, new Date(inv.created_at).toISOString().slice(0, 19), (inv.total / 100).toFixed(2), (inv.tax / 100).toFixed(2), c.co.taxNo || ''].join('|');
  }
  function render(inv, c) {
    var ar = c.lang === 'ar', T = function (a, e) { return ar ? a : e; }, M = c.money, id = c.tpl || 'th80';
    var co = c.co, nm = ar ? co.nameAr : co.nameEn, addr = ar ? co.addrAr : co.addrEn;
    var cf = c.cfg || {}, sh = cf.show || {}, tx = cf.text || {}, on = function (k) { return sh[k] !== false; };
    var tv = function (k, a, e) { var v = tx[k + (ar ? '_ar' : '_en')]; return v ? v : T(a, e); };
    var phone = tx.phone || co.phone || '', taxv = co.taxNo || (cf.tax_fallback_phone !== false ? phone : '');
    if (tx['address' + (ar ? '_ar' : '_en')]) addr = tx['address' + (ar ? '_ar' : '_en')];
    var telL = (on('phone') && phone) ? T('هاتف', 'Tel') + ' <span class="n">' + esc(phone) + '</span>' : '';
    var taxL = (on('tax') && taxv) ? tv('tax_label', 'الرقم الضريبي', 'Tax No') + ' <span class="n">' + esc(taxv) + '</span>' : '';
    var hdrL = (on('header') && tx['header' + (ar ? '_ar' : '_en')]) ? '<div class="c sm">' + esc(tx['header' + (ar ? '_ar' : '_en')]) + '</div>' : '';
    var dd = new Date(inv.created_at), p2 = function (x) { return (x < 10 ? '0' : '') + x; };
    c.dt = p2(dd.getDate()) + '/' + p2(dd.getMonth() + 1) + '/' + dd.getFullYear() + ' ' + p2(dd.getHours()) + ':' + p2(dd.getMinutes());
    var disc = (inv.invoice_discount || 0) + (inv.lines || []).reduce(function (s, l) { return s + (l.discount || 0); }, 0);
    var net = inv.total - inv.tax;
    var lname = function (l) { return esc(ar ? l.name_ar : l.name_en); };
    var sp = function (x, cls) { return '<span' + (cls ? ' class="' + cls + '"' : '') + '>' + x + '</span>'; };
    var qparts = function (l, withPrice) { var a = l.qty_kind === 'weight' ? [sp(c.nf(l.qty / 1000, 3), 'n'), sp(esc(c.unitLabel(l)))] : [sp(String(l.qty), 'n')]; if (withPrice) a.push(sp('×'), sp(M(l.unit_price), 'n')); return '<span class="ql">' + a.join('') + '</span>'; };
    var qline = function (l) { return l.qty_kind === 'weight' ? c.nf(l.qty / 1000, 3) + ' ' + esc(c.unitLabel(l)) : String(l.qty); };
    var priceUnit = function (l) { return l.qty_kind === 'weight' ? M(l.unit_price) + ' / ' + esc(c.unitLabel(l)) : M(l.unit_price); };
    var qr = (window.UnoQR && on('qr')) ? window.UnoQR.svg(qrText(inv, c), { size: id === 'th58' ? 84 : 96 }) : '';
    var dir = ar ? 'rtl' : 'ltr', logo = !on('logo') ? '' : '<img class="logo" src="' + abs('assets/logo-circle.png') + '" width="' + (id === 'th58' ? 38 : 46) + '" height="' + (id === 'th58' ? 38 : 46) + '" alt="">';
    var pays = (inv.payments || []).map(function (p) { return '<tr><td>' + esc(c.method(p.method)) + '</td><td class="e n">' + M(p.amount) + '</td></tr>'; }).join('');
    var thL = on('thanks') ? esc(tv('thanks', 'شكراً لزيارتكم', 'Thank you')) : '', fL = on('footer') ? esc(tv('footer', 'الاسترجاع خلال 14 يوم بالإيصال وحالة الصنف سليمة', 'Returns within 14 days with receipt and item in original condition')) : '';
    var foot = (thL || fL) ? '<div class="c sm">' + thL + (thL && fL ? ' · ' : '') + fL + '</div>' : '';
    var head = '<div class="c">' + logo + '</div>' + (on('name') ? '<div class="co">' + esc(nm) + '</div>' : '') + hdrL + '<div class="c sm">' + (on('address') ? esc(addr) : '') + (telL ? '<br>' + telL : '') + (taxL ? '<br>' + taxL : '') + '</div>';
    var info = '<table><tr><td>' + T('فاتورة', 'Invoice') + '</td><td class="e n">' + esc(inv.number) + '</td></tr><tr><td>' + T('التاريخ', 'Date') + '</td><td class="e n">' + esc(c.dt) + '</td></tr>' + (on('cashier') ? '<tr><td>' + T('الكاشير', 'Cashier') + '</td><td class="e">' + esc(c.cashier) + '</td></tr>' : '') +
      (c.customer && on('customer') ? '<tr><td>' + T('العميل', 'Customer') + '</td><td class="e">' + esc(c.customer) + '</td></tr>' : '') + '</table>';
    var totals = '<table><tr><td>' + T('الإجمالي قبل الضريبة', 'Subtotal before VAT') + '</td><td class="e n">' + M(net + disc) + '</td></tr>' +
      (disc ? '<tr><td>' + T('الخصم', 'Discount') + '</td><td class="e n">−' + M(disc) + '</td></tr>' : '') +
      '<tr><td>' + T('ضريبة القيمة المضافة 14%', 'VAT 14%') + '</td><td class="e n">' + M(inv.tax) + '</td></tr>' +
      '<tr class="tot"><td>' + T('الإجمالي', 'Total') + '</td><td class="e n">' + M(inv.total) + '</td></tr>' + pays +
      ((inv.change_due || 0) > 0 ? '<tr><td>' + T('الباقي', 'Change') + '</td><td class="e n">' + M(inv.change_due) + '</td></tr>' : '') + '</table>';
    var body;
    if (id === 'th80c') {
      body = head + '<div class="sep"></div>' + info + '<div class="sep"></div><table>' + inv.lines.map(function (l) {
        return '<tr><td>' + lname(l) + ' ' + qparts(l, false).replace('class="ql"', 'class="ql sm"') + '</td><td class="e n">' + M(l.amount) + '</td></tr>'; }).join('') + '</table><div class="sep"></div>' + totals + '<div class="qr">' + qr + '</div>' + foot;
    } else if (id === 'a4') {
      var n = 0;
      body = '<div class="hd"><div>' + (on('logo') ? '<img src="' + abs('assets/logo-uno-technology.png') + '" height="54" alt="" style="display:block;margin-bottom:6px">' : '') + (on('name') ? '<div class="nm" style="font-size:16px">' + esc(nm) + '</div>' : '') + hdrL + (on('address') ? '<div class="sm">' + esc(addr) + '</div>' : '') + (telL ? '<div class="sm">' + telL + '</div>' : '') + (taxL ? '<div class="sm">' + taxL + '</div>' : '') + '</div>' +
        '<div style="text-align:end"><div class="ttl">' + T('فاتورة ضريبية', 'Tax invoice') + '</div><table class="meta"><tr><td>' + T('رقم الفاتورة', 'Invoice no.') + '</td><td class="n nm">' + esc(inv.number) + '</td></tr><tr><td>' + T('التاريخ', 'Date') + '</td><td class="n">' + esc(c.dt) + '</td></tr>' + (on('cashier') ? '<tr><td>' + T('الكاشير', 'Cashier') + '</td><td>' + esc(c.cashier) + '</td></tr>' : '') + '</table></div></div>' +
        (on('customer') ? '<div class="box"><h4>' + T('العميل', 'Bill to') + '</h4><div class="nm">' + esc(c.customer || T('عميل نقدي', 'Walk-in customer')) + '</div></div>' : '') +
        '<table class="it"><thead><tr><th style="width:28px">#</th><th>' + T('البيان', 'Description') + '</th><th>' + T('الكمية', 'Qty') + '</th><th>' + T('سعر الوحدة', 'Unit price') + '</th><th>' + T('الإجمالي', 'Amount') + '</th></tr></thead><tbody>' +
        inv.lines.map(function (l) { n++; return '<tr><td class="c n">' + n + '</td><td>' + lname(l) + '</td><td class="c n">' + qline(l) + '</td><td class="e n">' + priceUnit(l) + '</td><td class="e n">' + M(l.amount) + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<table class="sum"><tr><td>' + T('الإجمالي قبل الضريبة', 'Subtotal before VAT') + '</td><td class="e n">' + M(net + disc) + '</td></tr>' + (disc ? '<tr><td>' + T('الخصم', 'Discount') + '</td><td class="e n">−' + M(disc) + '</td></tr>' : '') +
        '<tr><td>' + T('ضريبة القيمة المضافة 14%', 'VAT 14%') + '</td><td class="e n">' + M(inv.tax) + '</td></tr><tr class="g"><td>' + T('الإجمالي المستحق', 'Total due') + '</td><td class="e n">' + M(inv.total) + '</td></tr></table>' +
        '<div class="box"><h4>' + T('الدفع', 'Payment') + '</h4><table style="width:62mm">' + pays + '</table></div>' +
        '<div class="ft"><div class="sm" style="max-width:95mm">' + (thL ? thL + '<br>' : '') + (on('footer') ? esc(tx['footer' + (ar ? '_ar' : '_en')] || T('الأسعار بالجنيه المصري وتشمل ضريبة القيمة المضافة. الاسترجاع خلال 14 يوم بالفاتورة وحالة الصنف سليمة. الضمان حسب سياسة الصنف.', 'Prices in EGP and include VAT. Returns within 14 days with this invoice and the item in original condition. Warranty follows the item policy.')) : '') + '</div><div>' + qr + '</div></div>' +
        '<div class="sig"><div>' + T('المستلم', 'Received by') + '</div><div>' + T('البائع', 'Seller') + '</div><div>' + T('ختم الشركة', 'Company stamp') + '</div></div>';
    } else {
      var items = inv.lines.map(function (l) {
        return '<tr><td colspan="2" class="nm">' + lname(l) + '</td></tr><tr><td class="sm">' + qparts(l, true) + '</td><td class="e n">' + M(l.amount) + '</td></tr>'; }).join('');
      var qtySum = inv.lines.reduce(function (s, l) { return s + (l.qty_kind === 'weight' ? 0 : l.qty); }, 0);
      body = head + '<div class="sep"></div>' + info + '<div class="sep"></div><table>' + items + '</table><div class="sep"></div>' +
        (id === 'th80w' ? '<table><tr><td>' + T('عدد الأصناف', 'Lines') + '</td><td class="e n">' + inv.lines.length + '</td></tr><tr><td>' + T('إجمالي القطع', 'Total pieces') + '</td><td class="e n">' + qtySum + '</td></tr></table><div class="sep"></div>' : '') +
        totals + '<div class="qr">' + qr + '</div>' + (id === 'th80w' ? '<div class="sig"><div>' + T('المستلم', 'Received by') + '</div><div>' + T('البائع', 'Seller') + '</div></div>' : '') + foot;
    }
    return '<div class="rc ' + (id === 'a4' ? 'a4' : 'th ' + id) + '" dir="' + dir + '">' + body + '</div>';
  }
  window.UnoReceipt = { TEMPLATES: TEMPLATES, CSS: CSS, render: render };
})();
