/* Uno admin shell + modules: dashboard, store (categories, products, orders), requests, users, activity. Permissions are enforced by the database (RLS); the UI only hides what a role cannot use. */
(function(){
"use strict";
var C=window.UNO_CFG,$=function(s){return document.querySelector(s)};
var I={
 dash:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
 box:'<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
 tag:'<path d="M20 12l-8 8-9-9V3h8l9 9z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
 cart:'<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h11L21 7H6"/>',
 edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/>',
 inbox:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6l3.5-7z"/>',
 users:'<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.9"/><path d="M16 3.1a4 4 0 010 7.8"/>',
 log:'<path d="M12 8v5l3 2"/><circle cx="12" cy="12" r="9"/>',
 ads:'<path d="M3 10v4l9 4V6z"/><path d="M12 6l8-3v18l-8-3"/>',
 star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
 kb:'<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/>'
};
function ic(n){return '<svg class="i" viewBox="0 0 24 24">'+I[n]+'</svg>'}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
var ROLES={owner:"المالك / Owner",admin:"مدير / Admin",store_manager:"مدير المتجر / Store manager",content_editor:"محرر المحتوى / Content editor",support:"الدعم / Support"};
var PERM={owner:["users","log","content","store","orders","requests","core","chat"],admin:["log","content","store","orders","requests","core","chat"],store_manager:["store","orders"],content_editor:["content"],support:["orders","requests","chat"]};
var ROLE=null,USER=null,MOD="",PH=window.matchMedia("(max-width:900px)");
function can(p){return !p||(PERM[ROLE]||[]).indexOf(p)>-1}
function api(method,path,body,prefer){return CLOUD.token().then(function(t){var h={apikey:C.key,Authorization:"Bearer "+t,"Content-Type":"application/json"};if(prefer)h.Prefer=prefer;return fetch(C.url+"/rest/v1/"+path,{method:method,headers:h,body:body?JSON.stringify(body):undefined}).then(function(r){return r.text().then(function(x){var d=null;try{d=x?JSON.parse(x):null}catch(e){d=x}if(!r.ok)throw new Error((d&&(d.message||d.msg))||r.status);return d})})})}
function fn(body){return CLOUD.token().then(function(t){return fetch(C.url+"/functions/v1/chat",{method:"POST",headers:{apikey:C.key,Authorization:"Bearer "+C.key,"Content-Type":"application/json","x-admin-token":t},body:JSON.stringify(body)}).then(function(r){return r.json()})})}
function dt(x){try{return new Date(x).toLocaleString()}catch(e){return x||""}}
function money(n){return (Math.round(Number(n||0)*100)/100).toLocaleString()+" EGP"}
function slug(s){return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||("item-"+Date.now().toString(36))}
function status(msg,bad){if(!msg)return;var w=$("#toasts");if(!w){w=document.createElement("div");w.id="toasts";w.setAttribute("aria-live","polite");document.body.appendChild(w)}var t=document.createElement("div");t.className="toast"+(bad?" bad":"");t.textContent=msg;w.appendChild(t);setTimeout(function(){t.classList.add("out");setTimeout(function(){t.remove()},250)},bad?6000:3200)}
function empty(ar,en){return '<p class="hint" style="padding:18px;text-align:center">'+esc(ar)+" / "+esc(en)+"</p>"}
function openDlg(html){$("#dbx").innerHTML=html;$("#dlg").style.display="flex";$("#dlg").scrollTop=0}
function closeDlg(){$("#dlg").style.display="none";$("#dbx").innerHTML=""}
$("#dlg").addEventListener("mousedown",function(e){if(e.target===this)closeDlg()});
function resize(file,cb){var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){var m=1200,s=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext("2d").drawImage(im,0,0,c.width,c.height);c.toBlob(function(b){cb(b)},"image/jpeg",.85)};im.src=r.result};r.readAsDataURL(file)}
function upload(file,done){resize(file,function(b){CLOUD.upload(b,(file.name||"img").replace(/\.[a-z0-9]+$/i,"")+".jpg").then(done).catch(function(e){status("فشل رفع الصورة / Upload failed: "+e.message,1)})})}
function pill(t,c){return '<span class="pill '+(c||"")+'">'+esc(t)+"</span>"}
function bi(ar,en){return esc(ar)+" / "+esc(en)}

/* ---------- navigation ---------- */
var MODS=[
 {id:"dash",g:"نظرة عامة / Overview",ic:"dash",l:"لوحة القيادة / Dashboard"},
 {id:"prod",g:"المتجر / Store",p:"store",ic:"box",l:"المنتجات / Products"},
 {id:"cat",g:"المتجر / Store",p:"store",ic:"tag",l:"التصنيفات / Categories"},
 {id:"ord",g:"المتجر / Store",p:"orders",ic:"cart",l:"الطلبات / Orders"},
 {id:"rv",g:"المتجر / Store",p:"orders",ic:"star",l:"التقييمات / Reviews"},
 {id:"content",g:"المحتوى / Content",p:"content",ic:"edit",l:"محتوى الموقع / Site content"},
 {id:"ptn",g:"المحتوى / Content",p:"content",ic:"star",l:"البراندات والشركاء / Brands & partners"},
 {id:"ads",g:"المحتوى / Content",p:"content",ic:"ads",l:"الإعلانات / Ads"},
 {id:"kb",g:"المحتوى / Content",p:"content",ic:"kb",l:"المعرفة / Knowledge"},
 {id:"sup",g:"العملاء / Customers",p:"chat",ic:"inbox",l:"الدعم المباشر / Live support"},
 {id:"req",g:"العملاء / Customers",p:"requests",ic:"inbox",l:"الطلبات والمحادثات / Requests and chats"},
 {id:"users",g:"الفريق / Team",p:"users",ic:"users",l:"المستخدمون والصلاحيات / Users and roles"},
 {id:"bk",g:"الفريق / Team",p:"users",ic:"kb",l:"نسخة احتياطية / Backup"},
 {id:"log",g:"الفريق / Team",p:"log",ic:"log",l:"سجل النشاط / Activity log"},
 {id:"cco",g:"النظام الداخلي / UNO Core",p:"core",ic:"kb",l:"بيانات الشركة / Company"},
 {id:"cbr",g:"النظام الداخلي / UNO Core",p:"core",ic:"box",l:"الفروع والمخازن / Branches and warehouses"},
 {id:"cun",g:"النظام الداخلي / UNO Core",p:"core",ic:"tag",l:"وحدات القياس / Units"},
 {id:"cpa",g:"النظام الداخلي / UNO Core",p:"core",ic:"users",l:"العملاء والموردون / Partners"},
 {id:"cin",g:"النظام الداخلي / UNO Core",p:"core",ic:"box",l:"المخزون / Inventory"}
];
function buildNav(){
 var side=$("#side"),nav=$("#nav");side.parentNode&&side.parentNode.removeChild(side);nav.innerHTML="";var last="";
 MODS.forEach(function(m){if(!can(m.p))return;
  if(m.g!==last){last=m.g;var g=document.createElement("div");g.className="grp";g.textContent=m.g;nav.appendChild(g)}
  var b=document.createElement("button");b.type="button";b.className="ni";b.dataset.m=m.id;b.title=m.l;b.innerHTML=ic(m.ic)+'<span class="n">'+esc(m.l)+"</span>";b.onclick=function(){setMod(m.id,true)};nav.appendChild(b);
  if(m.id==="content"){var sub=document.createElement("div");sub.className="sub";sub.id="csub";sub.appendChild(side);nav.appendChild(sub)}
 });
}
function setMod(id,fromNav){
 var m=MODS.filter(function(x){return x.id===id})[0];if(!m||!can(m.p))return;MOD=id;
 document.body.className=document.body.className.replace(/\bm-\S+/g,"").trim()+" m-"+id;
 [].forEach.call(document.querySelectorAll("#nav .ni"),function(b){b.classList.toggle("on",b.dataset.m===id)});
 var cs=$("#csub");if(cs)cs.classList.toggle("open",id==="content");
 $("#ttl").textContent=m.l;
 if(id==="content"){if(fromNav&&window.__admin)window.__admin.drawMain();if(PH.matches&&fromNav)return}
 else{var mn=$("#main");mn.innerHTML='<p class="hint">…</p>';RENDER[id]&&RENDER[id](mn)}
 if(PH.matches&&id!=="content")closeNav();
 try{location.hash=id}catch(e){}
}
function openNav(){document.body.classList.add("nav-open")}
function closeNav(){document.body.classList.remove("nav-open")}
$("#hb").onclick=function(){document.body.classList.contains("nav-open")?closeNav():openNav()};
$("#ov").onclick=closeNav;
$("#col").onclick=function(){document.body.classList.toggle("mini");try{localStorage.setItem("uno_mini",document.body.classList.contains("mini")?"1":"")}catch(e){}};
try{if(localStorage.getItem("uno_mini")&&!PH.matches)document.body.classList.add("mini")}catch(e){}
document.addEventListener("click",function(e){var s=$("#side");if(s&&s.contains(e.target)&&MOD!=="content"){MOD="content";setMod("content",false);if(PH.matches)closeNav()}else if(s&&s.contains(e.target)&&PH.matches)closeNav()});

/* ---------- modules ---------- */
var RENDER={};
RENDER.dash=function(mn){
 mn.innerHTML='<div class="dsh"><div class="sk" style="height:120px"></div><div class="sk" style="height:200px"></div><div class="sk" style="height:200px"></div></div>';
 var P=function(p,perm){return can(perm)?api("GET",p).catch(function(){return null}):Promise.resolve(null)};
 Promise.all([P("products?select=id,stock,active","store"),P("categories?select=id","store"),P("orders?select=id,status,total,created_at&order=created_at.desc&limit=500","orders"),P("requests?select=id,created_at,name,phone,service&order=created_at.desc&limit=6","requests"),P("activity_log?select=*&order=created_at.desc&limit=8","log")]).then(function(r){
  var pr=r[0],ct=r[1],od=r[2],rq=r[3],lg=r[4],h="";
  var live=od?od.filter(function(x){return x.status!=="cancelled"}):[];
  h+='<div class="kpis">';
  if(od)h+='<div class="kpi hero"><span>'+bi("إجمالي الطلبات غير الملغاة","Total of non-cancelled orders")+"</span><b>"+money(live.reduce(function(a,x){return a+Number(x.total||0)},0))+"</b><em>"+od.length+" "+bi("طلب","orders")+" · "+od.filter(function(x){return x.status==="new"}).length+" "+bi("جديد","new")+"</em></div>";
  function k(n,l,w){h+='<div class="kpi'+(w?" warn":"")+'"><b>'+n+"</b><span>"+l+"</span></div>"}
  if(pr){k(pr.length,bi("منتجات","Products"));k(pr.filter(function(x){return x.active}).length,bi("ظاهرة للزبائن","Visible"));k(pr.filter(function(x){return x.stock<=0}).length,bi("نفد المخزون","Out of stock"),1);k(pr.filter(function(x){return x.stock>0&&x.stock<=3}).length,bi("مخزون قليل","Low stock"),1)}
  if(ct)k(ct.length,bi("تصنيفات","Categories"));
  h+="</div>";
  if(od){
   var days=[],now=new Date();for(var i=13;i>=0;i--){var d=new Date(now);d.setDate(d.getDate()-i);days.push({k:d.toISOString().slice(0,10),n:0,d:d})}
   od.forEach(function(x){var k=new Date(x.created_at).toISOString().slice(0,10);days.forEach(function(y){if(y.k===k)y.n++})});
   var mx=Math.max.apply(null,days.map(function(y){return y.n}))||1,tot=days.reduce(function(a,y){return a+y.n},0);
   var bars=days.map(function(y,i){var hh=Math.round(y.n/mx*100),on=y.n===mx&&y.n>0;return '<g><title>'+y.k+": "+y.n+'</title><rect x="'+(i*30+4)+'" y="'+(110-hh)+'" width="22" height="'+Math.max(hh,2)+'" rx="5" fill="'+(on?"#F65A00":"#FFD2B5")+'"/></g>'}).join("");
   var sts={};od.forEach(function(x){sts[x.status]=(sts[x.status]||0)+1});var keys=Object.keys(sts),cols=["#F65A00","#FF9A55","#FFD2B5","#8A8F98","#1F2933","#C94700"],acc=0,C2=2*Math.PI*40;
   var arcs=keys.map(function(k2,i){var len=sts[k2]/od.length*C2,el='<circle r="40" cx="60" cy="60" fill="none" stroke="'+cols[i%cols.length]+'" stroke-width="18" stroke-dasharray="'+len+" "+(C2-len)+'" stroke-dashoffset="'+(-acc)+'" transform="rotate(-90 60 60)"/>';acc+=len;return el}).join("");
   h+='<div class="chs"><div class="ch"><h3>'+bi("الطلبات آخر 14 يوم","Orders, last 14 days")+"</h3>"+(tot?'<svg viewBox="0 0 424 120" class="bar" role="img" aria-label="orders per day">'+bars+"</svg>":empty("لا توجد طلبات بعد","No orders yet"))+'</div><div class="ch"><h3>'+bi("حالة الطلبات","Order status")+"</h3>"+(od.length?'<div class="dn"><svg viewBox="0 0 120 120" width="120" height="120">'+arcs+'</svg><ul>'+keys.map(function(k2,i){return '<li><i style="background:'+cols[i%cols.length]+'"></i>'+esc(k2)+" <b>"+sts[k2]+"</b></li>"}).join("")+"</ul></div>":empty("لا توجد طلبات بعد","No orders yet"))+"</div></div>";
  }
  if(pr&&!pr.length)h+='<div class="note" style="display:block;margin:0 0 12px">'+bi("المتجر فاضي: ابدأ بإضافة تصنيف ثم منتجات.","The store is empty: add a category, then products.")+"</div>";
  h+='<div class="chs">';
  if(rq)h+='<div class="ch"><h3>'+bi("آخر طلبات الخدمة","Latest service requests")+"</h3>"+(rq.length?'<ul class="feed">'+rq.map(function(x){return "<li><b>"+esc(x.name)+"</b> <span>"+esc(x.service||"")+"</span><em>"+dt(x.created_at)+"</em></li>"}).join("")+"</ul>":empty("لا توجد طلبات بعد","No requests yet"))+"</div>";
  if(lg)h+='<div class="ch"><h3>'+bi("آخر نشاط","Recent activity")+"</h3>"+(lg.length?'<ul class="feed">'+lg.map(function(x){return "<li><b>"+esc(x.action)+"</b> <span>"+esc(x.entity)+"</span><em>"+esc(x.actor||"")+" · "+dt(x.created_at)+"</em></li>"}).join("")+"</ul>":empty("لا يوجد نشاط مسجل بعد","No activity yet"))+"</div>";
  h+="</div>";
  mn.innerHTML='<div class="dsh">'+h+"</div>";
 });
};
function tbl(heads,rows,raw){return '<div class="tw"><table><thead><tr>'+heads.map(function(x){return "<th>"+x+"</th>"}).join("")+"</tr></thead><tbody>"+rows.map(function(r){return "<tr"+(r._a?' data-i="'+r._a+'"':"")+">"+r.map(function(c){return "<td>"+c+"</td>"}).join("")+"</tr>"}).join("")+"</tbody></table></div>"}


/* brands and partners */
function upPng(file,done){var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){var m=600,k=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);c.toBlob(function(b){CLOUD.upload(b,(file.name||"logo").replace(/\.[a-z0-9]+$/i,"")+".png").then(done).catch(function(e){status("فشل رفع الشعار / Upload failed: "+e.message,1)})},"image/png")};im.onerror=function(){status("ملف غير مدعوم / Unsupported file",1)};im.src=r.result};r.readAsDataURL(file)}
RENDER.ptn=function(mn){
 api("GET","partners?select=*&order=kind.asc,sort.asc,created_at.asc").then(function(rows){
  var K={brand:"براند / Brand",partner:"شريك / Partner"};
  mn.innerHTML='<h2>'+bi("البراندات والشركاء","Brands & partners")+'</h2><p class="hint">'+bi("الشعارات بتظهر في الصفحة الرئيسية بعد ما تضيف أول شعار. الأسماء والشعارات لازم تكون حقيقية.","Logos show on the home page once you add the first one. Use only real names and logos.")+'</p><div class="tb"><button id="add" type="button">+ '+bi("إضافة","Add")+"</button></div>"+(rows.length?tbl(["",bi("الاسم","Name"),bi("النوع","Type"),bi("الترتيب","Sort"),bi("الحالة","Status"),""],rows.map(function(x,i){return [x.logo?'<img class="thumb" src="'+esc(x.logo)+'" alt="">':"",esc(x.name_ar||"")+" / "+esc(x.name_en||""),K[x.kind]||x.kind,x.sort,x.active?pill("ظاهر / Visible","g"):pill("مخفي / Hidden"),'<button class="sec sm" data-e="'+i+'" type="button">'+bi("تعديل","Edit")+"</button>"]})):empty("مفيش شعارات لسه","No logos yet"));
  $("#add").onclick=function(){ptnForm({})};
  [].forEach.call(mn.querySelectorAll("[data-e]"),function(b){b.onclick=function(){ptnForm(rows[b.dataset.e])}});
 }).catch(function(e){mn.innerHTML='<p class="dirty">'+esc(e.message)+"</p>"});
};
function ptnForm(c){
 openDlg('<h2>'+(c.id?bi("تعديل","Edit"):bi("إضافة براند أو شريك","Add brand or partner"))+'</h2><label class="f"><span>'+bi("النوع","Type")+'</span><select id="f-k"><option value="brand">براند بنشتغل بيه / Brand</option><option value="partner">شريك نجاح / Partner</option></select></label><div class="pair"><label class="f"><span>الاسم بالعربي</span><input type="text" id="f-ar"></label><label class="f"><span>English name</span><input type="text" id="f-en" dir="ltr"></label></div><label class="f"><span>'+bi("رابط الموقع (اختياري)","Website (optional)")+'</span><input type="url" id="f-u" dir="ltr" placeholder="https://"></label><div class="pair"><label class="f"><span>'+bi("الترتيب","Sort")+'</span><input type="number" id="f-so"></label><label class="f"><span>'+bi("الحالة","Status")+'</span><select id="f-ac"><option value="1">ظاهر / Visible</option><option value="0">مخفي / Hidden</option></select></label></div><label class="f"><span>'+bi("الشعار (PNG شفاف مفضل)","Logo (transparent PNG preferred)")+'</span><input type="file" id="f-up" accept="image/*"></label><img id="f-im" alt="" style="max-height:70px;background:#fff;border:1px solid #ddd;border-radius:8px;padding:6px;display:none"><div class="er" id="f-er"></div><div class="tb"><button id="f-sv" type="button">'+bi("حفظ","Save")+'</button><button id="f-cx" class="sec" type="button">'+bi("إلغاء","Cancel")+"</button></div>");
 var lg=c.logo||"";function show(){var i=$("#f-im");if(lg){i.src=lg;i.style.display="block"}}
 $("#f-k").value=c.kind||"brand";$("#f-ar").value=c.name_ar||"";$("#f-en").value=c.name_en||"";$("#f-u").value=c.url||"";$("#f-so").value=c.sort||0;$("#f-ac").value=c.active===false?"0":"1";show();
 $("#f-up").onchange=function(){var f=this.files[0];if(f)upPng(f,function(u){lg=u;show()})};
 $("#f-cx").onclick=closeDlg;
 $("#f-sv").onclick=function(){var d={kind:$("#f-k").value,name_ar:$("#f-ar").value.trim()||null,name_en:$("#f-en").value.trim()||null,url:$("#f-u").value.trim()||null,sort:parseInt($("#f-so").value||"0",10)||0,active:$("#f-ac").value==="1",logo:lg||null};
  if(!d.logo){$("#f-er").textContent="الشعار مطلوب / Logo is required";return}
  if(!d.name_ar&&!d.name_en){$("#f-er").textContent="الاسم مطلوب / A name is required";return}
  if(d.url&&!/^https?:\/\//i.test(d.url)){$("#f-er").textContent="الرابط لازم يبدأ بـ https:// / URL must start with https://";return}
  api(c.id?"PATCH":"POST","partners"+(c.id?"?id=eq."+c.id:""),d,"return=minimal").then(function(){closeDlg();status("تم الحفظ ✓ / Saved ✓");RENDER.ptn($("#main"))}).catch(function(e){$("#f-er").textContent=e.message})};
 if(c.id){var dv=document.createElement("button");dv.type="button";dv.className="dg";dv.textContent="حذف / Delete";dv.onclick=function(){if(confirm("حذف نهائي؟ / Delete permanently?"))api("DELETE","partners?id=eq."+c.id,null,"return=minimal").then(function(){closeDlg();RENDER.ptn($("#main"))}).catch(function(e){$("#f-er").textContent=e.message})};$("#f-cx").parentNode.appendChild(dv)}
}

/* categories */
RENDER.cat=function(mn){
 api("GET","categories?select=*&order=sort.asc,created_at.asc").then(function(rows){
  mn.innerHTML='<h2>'+bi("التصنيفات","Categories")+'</h2><div class="tb"><button id="add" type="button">+ '+bi("تصنيف جديد","New category")+"</button></div>"+(rows.length?tbl([ "",bi("الاسم","Name"),"Slug",bi("الترتيب","Sort"),bi("الحالة","Status"),""],rows.map(function(x,i){var r=[x.image?'<img class="thumb" src="'+esc(x.image)+'" alt="">':"",esc(x.name_ar)+" / "+esc(x.name_en),esc(x.slug),x.sort,x.active?pill("ظاهر / Visible","g"):pill("مخفي / Hidden"),'<button class="sec sm" data-e="'+i+'" type="button">'+bi("تعديل","Edit")+"</button>"];return r})):empty("لا توجد تصنيفات بعد","No categories yet"));
  $("#add").onclick=function(){catForm({})};
  [].forEach.call(mn.querySelectorAll("[data-e]"),function(b){b.onclick=function(){catForm(rows[b.dataset.e])}});
 }).catch(function(e){mn.innerHTML='<p class="dirty">'+esc(e.message)+"</p>"});
};
function catForm(c){
 openDlg('<h2>'+(c.id?bi("تعديل تصنيف","Edit category"):bi("تصنيف جديد","New category"))+'</h2><div class="pair"><label class="f"><span>الاسم بالعربي</span><input type="text" id="f-ar"></label><label class="f"><span>English name</span><input type="text" id="f-en" dir="ltr"></label></div><label class="f"><span>Slug (a-z, 0-9, -)</span><input type="text" id="f-sl" dir="ltr"></label><div class="pair"><label class="f"><span>'+bi("الترتيب","Sort")+'</span><input type="number" id="f-so"></label><label class="f"><span>'+bi("الحالة","Status")+'</span><select id="f-ac"><option value="1">ظاهر / Visible</option><option value="0">مخفي / Hidden</option></select></label></div><div class="img"><img id="f-im" alt="" '+(c.image?'src="'+esc(c.image)+'"':"")+'><div class="ctl"><input type="file" id="f-up" accept="image/*"><div class="hint">'+bi("صورة التصنيف (اختياري)","Category image (optional)")+'</div></div></div><p id="f-er" class="dirty"></p><div class="tb"><button id="f-sv" type="button">'+bi("حفظ","Save")+'</button><button class="sec" id="f-cx" type="button">'+bi("إلغاء","Cancel")+"</button>"+(c.id?'<button class="dg" id="f-dl" type="button">'+bi("حذف","Delete")+"</button>":"")+"</div>");
 var img=c.image||"";$("#f-ar").value=c.name_ar||"";$("#f-en").value=c.name_en||"";$("#f-sl").value=c.slug||"";$("#f-so").value=c.sort||0;$("#f-ac").value=c.active===false?"0":"1";
 $("#f-up").onchange=function(){var f=this.files[0];if(f)upload(f,function(u){img=u;$("#f-im").src=u})};
 $("#f-cx").onclick=closeDlg;
 $("#f-sv").onclick=function(){var d={name_ar:$("#f-ar").value.trim(),name_en:$("#f-en").value.trim(),slug:slug($("#f-sl").value||$("#f-en").value),sort:parseInt($("#f-so").value||"0",10)||0,active:$("#f-ac").value==="1",image:img||null};
  if(!d.name_ar||!d.name_en){$("#f-er").textContent="الاسم بالعربي والإنجليزي مطلوب / Both names are required";return}
  api(c.id?"PATCH":"POST","categories"+(c.id?"?id=eq."+c.id:""),d,"return=minimal").then(function(){closeDlg();status("تم الحفظ ✓ / Saved ✓");RENDER.cat($("#main"))}).catch(function(e){$("#f-er").textContent=e.message})};
 if($("#f-dl"))$("#f-dl").onclick=function(){if(confirm("حذف التصنيف؟ المنتجات هتفضل بدون تصنيف. / Delete? Products stay without a category."))api("DELETE","categories?id=eq."+c.id).then(function(){closeDlg();RENDER.cat($("#main"))}).catch(function(e){$("#f-er").textContent=e.message})};
}

/* products */
var CATS=[];
RENDER.prod=function(mn){
 Promise.all([api("GET","products?select=*&order=created_at.desc&limit=1000"),api("GET","categories?select=id,name_ar,name_en&order=sort.asc")]).then(function(r){
  var rows=r[0];CATS=r[1];var cn={};CATS.forEach(function(c){cn[c.id]=c.name_ar+" / "+c.name_en});
  mn.innerHTML='<h2>'+bi("المنتجات","Products")+'</h2><div class="tb"><input type="search" id="q" placeholder="بحث / Search"><select id="fc"><option value="">'+bi("كل التصنيفات","All categories")+"</option>"+CATS.map(function(c){return '<option value="'+c.id+'">'+esc(c.name_ar)+"</option>"}).join("")+'</select><button id="add" type="button">+ '+bi("منتج جديد","New product")+'</button>'+(rows.some(function(x){return x.is_demo})?'<button id="deldemo" type="button" style="color:#b3261e;border-color:#b3261e">'+bi("حذف كل المنتجات التجريبية","Delete all demo products")+"</button>":"")+'</div><div id="pl"></div>';
  function draw(){var q=$("#q").value.trim().toLowerCase(),fc=$("#fc").value,f=rows.filter(function(x){return (!fc||x.category_id===fc)&&(!q||(x.name_ar+" "+x.name_en+" "+(x.brand||"")).toLowerCase().indexOf(q)>-1)});
   $("#pl").innerHTML=f.length?tbl(["",bi("المنتج","Product"),bi("التصنيف","Category"),bi("السعر","Price"),bi("المخزون","Stock"),bi("الحالة","Status"),""],f.map(function(x){return [(x.images&&x.images[0])?'<img class="thumb" src="'+esc(x.images[0])+'" alt="">':"",esc(x.name_ar)+"<br><small class=\"hint\">"+esc(x.name_en)+"</small>",esc(cn[x.category_id]||"-"),money(x.price),x.stock<=0?pill(x.stock+"","r"):pill(x.stock+"",x.stock<=3?"o":"g"),x.active?pill("ظاهر / Visible","g"):pill("مخفي / Hidden"),'<button class="sec sm" data-e="'+x.id+'" type="button">'+bi("تعديل","Edit")+"</button>"]})):empty(rows.length?"مفيش نتائج":"لا توجد منتجات بعد. ابدأ بإضافة منتج.",rows.length?"No results":"No products yet. Add the first product.");
   [].forEach.call($("#pl").querySelectorAll("[data-e]"),function(b){b.onclick=function(){prodForm(rows.filter(function(x){return x.id===b.dataset.e})[0])}})}
  $("#q").oninput=draw;$("#fc").onchange=draw;$("#add").onclick=function(){prodForm({})};draw();var dd=$("#deldemo");if(dd)dd.onclick=function(){if(!confirm("حذف كل المنتجات التجريبية نهائيًا؟ / Delete all demo products permanently?"))return;api("DELETE","products?is_demo=eq.true",null,"return=minimal").then(function(){status("تم الحذف ✓ / Deleted ✓");RENDER.prod($("#main"))}).catch(function(e){status(e.message,1)})};
 }).catch(function(e){mn.innerHTML='<p class="dirty">'+esc(e.message)+"</p>"});
};
function prodForm(p){
 var imgs=(p.images||[]).slice(),specs=Object.keys(p.specs||{}).map(function(k){return [k,String(p.specs[k])]});
 openDlg('<h2>'+(p.id?bi("تعديل منتج","Edit product"):bi("منتج جديد","New product"))+'</h2><div class="pair"><label class="f"><span>الاسم بالعربي</span><input type="text" id="f-ar"></label><label class="f"><span>English name</span><input type="text" id="f-en" dir="ltr"></label></div><div class="pair"><label class="f"><span>'+bi("التصنيف","Category")+'</span><select id="f-ct"><option value="">-</option>'+CATS.map(function(c){return '<option value="'+c.id+'">'+esc(c.name_ar)+" / "+esc(c.name_en)+"</option>"}).join("")+'</select></label><label class="f"><span>'+bi("الماركة","Brand")+'</span><input type="text" id="f-br"></label></div><div class="pair"><label class="f"><span>'+bi("السعر (جنيه)","Price (EGP)")+'</span><input type="number" id="f-pr" min="0" step="0.01"></label><label class="f"><span>'+bi("السعر قبل الخصم (اختياري)","Old price (optional)")+'</span><input type="number" id="f-op" min="0" step="0.01"></label></div><div class="pair"><label class="f"><span>'+bi("المخزون","Stock")+'</span><input type="number" id="f-st" min="0" step="1"></label><label class="f"><span>'+bi("الحالة","Condition")+'</span><select id="f-cd"><option value="new">جديد / New</option><option value="used">مستعمل / Used</option><option value="refurbished">مجدد / Refurbished</option></select></label></div><label class="f"><span>'+bi("الضمان","Warranty")+'</span><input type="text" id="f-wr"></label><div class="pair"><label class="f"><span>الوصف بالعربي</span><textarea id="f-da"></textarea></label><label class="f"><span>Description (EN)</span><textarea id="f-de" dir="ltr"></textarea></label></div><fieldset><legend>'+bi("الصور","Images")+'</legend><div class="ph" id="f-ph"></div><input type="file" id="f-up" accept="image/*" multiple></fieldset><fieldset><legend>'+bi("المواصفات","Specs")+'</legend><div id="f-sp"></div><button class="sec sm" id="f-sa" type="button">+ '+bi("مواصفة","Spec")+'</button></fieldset><div class="pair"><label class="f"><span>'+bi("الظهور في المتجر","Visible in store")+'</span><select id="f-ac"><option value="1">ظاهر / Visible</option><option value="0">مخفي / Hidden</option></select></label><label class="f"><span>'+bi("مميز","Featured")+'</span><select id="f-ft"><option value="0">لا / No</option><option value="1">نعم / Yes</option></select></label></div><label class="f"><span>Slug</span><input type="text" id="f-sl" dir="ltr"></label><p id="f-er" class="dirty"></p><div class="tb"><button id="f-sv" type="button">'+bi("حفظ","Save")+'</button><button class="sec" id="f-cx" type="button">'+bi("إلغاء","Cancel")+"</button>"+(p.id?'<button class="dg" id="f-dl" type="button">'+bi("حذف","Delete")+"</button>":"")+"</div>");
 $("#f-ar").value=p.name_ar||"";$("#f-en").value=p.name_en||"";$("#f-ct").value=p.category_id||"";$("#f-br").value=p.brand||"";$("#f-pr").value=p.price==null?"":p.price;$("#f-op").value=p.old_price==null?"":p.old_price;$("#f-st").value=p.stock==null?0:p.stock;$("#f-cd").value=p.condition||"new";$("#f-wr").value=p.warranty||"";$("#f-da").value=p.desc_ar||"";$("#f-de").value=p.desc_en||"";$("#f-ac").value=p.active===false?"0":"1";$("#f-ft").value=p.featured?"1":"0";$("#f-sl").value=p.slug||"";
 function drawI(){$("#f-ph").innerHTML=imgs.map(function(u,i){return '<div class="pi"><img src="'+esc(u)+'" alt=""><button class="dg sm" data-d="'+i+'" type="button">✕</button></div>'}).join("");[].forEach.call($("#f-ph").querySelectorAll("[data-d]"),function(b){b.onclick=function(){imgs.splice(+b.dataset.d,1);drawI()}})}
 function drawS(){$("#f-sp").innerHTML=specs.map(function(s,i){return '<div class="kv"><input type="text" data-k="'+i+'" value="'+esc(s[0])+'" placeholder="'+bi("الاسم","Name")+'"><input type="text" data-v="'+i+'" value="'+esc(s[1])+'" placeholder="'+bi("القيمة","Value")+'"><button class="dg sm" data-r="'+i+'" type="button">✕</button></div>'}).join("");
  [].forEach.call($("#f-sp").querySelectorAll("input"),function(x){x.oninput=function(){if(x.dataset.k!=null)specs[x.dataset.k][0]=x.value;else specs[x.dataset.v][1]=x.value}});
  [].forEach.call($("#f-sp").querySelectorAll("[data-r]"),function(b){b.onclick=function(){specs.splice(+b.dataset.r,1);drawS()}})}
 drawI();drawS();$("#f-sa").onclick=function(){specs.push(["",""]);drawS()};
 $("#f-up").onchange=function(){var fs=[].slice.call(this.files);status("جاري الرفع... / Uploading...");(function nx(){var f=fs.shift();if(!f){status("تم رفع الصور ✓ / Images uploaded ✓");return}upload(f,function(u){imgs.push(u);drawI();nx()})})()};
 $("#f-cx").onclick=closeDlg;
 $("#f-sv").onclick=function(){var sp={};specs.forEach(function(s){if(s[0].trim())sp[s[0].trim()]=s[1]});
  var d={name_ar:$("#f-ar").value.trim(),name_en:$("#f-en").value.trim(),category_id:$("#f-ct").value||null,brand:$("#f-br").value.trim()||null,price:parseFloat($("#f-pr").value),old_price:$("#f-op").value===""?null:parseFloat($("#f-op").value),stock:parseInt($("#f-st").value||"0",10),condition:$("#f-cd").value,warranty:$("#f-wr").value.trim()||null,desc_ar:$("#f-da").value,desc_en:$("#f-de").value,images:imgs,specs:sp,active:$("#f-ac").value==="1",featured:$("#f-ft").value==="1",slug:slug($("#f-sl").value||$("#f-en").value),updated_at:new Date().toISOString()};
  if(!d.name_ar||!d.name_en){$("#f-er").textContent="الاسم بالعربي والإنجليزي مطلوب / Both names are required";return}
  if(isNaN(d.price)||d.price<0){$("#f-er").textContent="اكتب السعر / Enter the price";return}
  if(isNaN(d.stock)||d.stock<0)d.stock=0;
  api(p.id?"PATCH":"POST","products"+(p.id?"?id=eq."+p.id:""),d,"return=minimal").then(function(){closeDlg();status("تم الحفظ ✓ / Saved ✓");RENDER.prod($("#main"))}).catch(function(e){$("#f-er").textContent=e.message})};
 if($("#f-dl"))$("#f-dl").onclick=function(){if(confirm("حذف المنتج نهائيًا؟ / Delete this product permanently?"))api("DELETE","products?id=eq."+p.id).then(function(){closeDlg();RENDER.prod($("#main"))}).catch(function(e){$("#f-er").textContent=e.message})};
}

/* orders */
var OST=[["new","جديد / New"],["confirmed","مؤكد / Confirmed"],["shipped","تم الشحن / Shipped"],["delivered","تم التسليم / Delivered"],["cancelled","ملغي / Cancelled"]];
RENDER.ord=function(mn){
 api("GET","orders?select=*&order=created_at.desc&limit=300").then(function(rows){
  mn.innerHTML='<h2>'+bi("الطلبات","Orders")+'</h2><div class="tb"><select id="fs"><option value="">'+bi("كل الحالات","All statuses")+"</option>"+OST.map(function(s){return '<option value="'+s[0]+'">'+esc(s[1])+"</option>"}).join("")+'</select></div><div id="ol"></div>';
  function draw(){var fs=$("#fs").value,f=rows.filter(function(x){return !fs||x.status===fs});
   $("#ol").innerHTML=f.length?tbl(["#",bi("العميل","Customer"),bi("الهاتف","Phone"),bi("الإجمالي","Total"),bi("الحالة","Status"),bi("التاريخ","Date"),""],f.map(function(x){return ["#"+x.number+(x.is_test?" "+pill("TEST / تجريبي","r"):""),esc(x.customer_name),'<a href="tel:'+esc(x.phone)+'">'+esc(x.phone)+"</a>",money(x.total),pill((OST.filter(function(s){return s[0]===x.status})[0]||[0,x.status])[1],x.status==="new"?"o":x.status==="cancelled"?"r":"g"),dt(x.created_at),'<button class="sec sm" data-e="'+x.id+'" type="button">'+bi("فتح","Open")+"</button>"]})):empty("لا توجد طلبات بعد. هتظهر هنا لما الدفع عند الاستلام يشتغل في المتجر.","No orders yet. They appear here once store checkout is live.");
   [].forEach.call($("#ol").querySelectorAll("[data-e]"),function(b){b.onclick=function(){ordView(rows.filter(function(x){return x.id===b.dataset.e})[0])}})}
  $("#fs").onchange=draw;draw();
 }).catch(function(e){mn.innerHTML='<p class="dirty">'+esc(e.message)+"</p>"});
};
function ordView(o){
 Promise.all([api("GET","order_items?order_id=eq."+o.id+"&select=*"),api("GET","order_events?order_id=eq."+o.id+"&select=status,created_at&order=created_at.asc").catch(function(){return []}),o.customer_id?api("GET","customers?id=eq."+o.customer_id+"&select=email,name").catch(function(){return []}):Promise.resolve([])]).then(function(rr){var it=rr[0],ev=rr[1],cu=rr[2][0];
  openDlg('<h2>'+bi("طلب","Order")+" #"+o.number+(o.is_test?" "+pill("TEST / تجريبي","r"):"")+'</h2>'+(o.is_test?'<p class="sub">'+bi("طلب تجريبي: فيه منتجات ديمو. المخزون لم يتأثر.","Test order: contains demo items. Stock not reduced.")+"</p>":"")+'<p><b>'+esc(o.customer_name)+"</b> · "+esc(o.phone)+"<br>"+esc(o.governorate||"")+" "+esc(o.address||"")+"<br>"+bi("الدفع","Payment")+": "+esc(o.payment_method||"")+"<br>"+esc(o.notes||"")+"</p>"+tbl([bi("المنتج","Item"),bi("السعر","Price"),bi("الكمية","Qty")],it.map(function(x){return [esc(x.name),money(x.price),x.qty]}))+'<p style="margin:10px 0"><b>'+bi("الإجمالي","Total")+": "+money(o.total)+'</b> ('+bi("شحن","shipping")+" "+money(o.shipping)+')</p>'+(cu?'<p>'+bi("حساب العميل","Customer account")+': <b dir="ltr">'+esc(cu.email||"")+'</b></p>':'<p style="color:var(--mut)">'+bi("طلب كضيف (بدون حساب)","Guest order (no account)")+'</p>')+'<label class="f"><span>'+bi("شركة الشحن","Courier")+'</span><input id="f-c" maxlength="60" value="'+esc(o.courier||"")+'"></label><label class="f"><span>'+bi("رقم الشحنة","Tracking number")+'</span><input id="f-t" dir="ltr" maxlength="60" value="'+esc(o.tracking_number||"")+'"></label><label class="f"><span>'+bi("الحالة","Status")+'</span><select id="f-s">'+OST.map(function(s){return '<option value="'+s[0]+'">'+esc(s[1])+"</option>"}).join("")+'</select></label><h3 style="margin:12px 0 6px">'+bi("سجل الحالة","Status timeline")+'</h3>'+(ev.length?'<ul style="margin:0;padding-inline-start:18px">'+ev.map(function(e){var m=OST.filter(function(x){return x[0]===e.status})[0];return '<li>'+esc(m?m[1]:e.status)+' · '+dt(e.created_at)+'</li>'}).join("")+'</ul>':'<p style="color:var(--mut)">-</p>')+'<p id="f-er" class="dirty"></p><div class="tb"><button id="f-sv" type="button">'+bi("حفظ الحالة","Save status")+'</button><button class="sec" id="f-cx" type="button">'+bi("إغلاق","Close")+"</button></div>");
  $("#f-s").value=o.status;$("#f-cx").onclick=closeDlg;
  $("#f-sv").onclick=function(){api("PATCH","orders?id=eq."+o.id,{status:$("#f-s").value,courier:$("#f-c").value.trim()||null,tracking_number:$("#f-t").value.trim()||null},"return=minimal").then(function(){closeDlg();status("تم ✓ / Done ✓");RENDER.ord($("#main"))}).catch(function(e){$("#f-er").textContent=e.message})};
 });
}

/* ads control panel */
RENDER.ads=function(mn){
 api("GET","ads_config?id=eq.1&select=data").then(function(r){
  var d=(r[0]&&r[0].data)||{},sl=d.slots||{},PG=[["home",bi("الرئيسية","Home")],["blog",bi("المدونة","Blog")],["tools",bi("الأدوات","Tools")],["store",bi("المتجر","Store")]];
  mn.innerHTML='<h2>'+bi("الإعلانات","Ads")+'</h2><div class="card adf"><p class="hint">'+bi("الإعلانات مخفية تمامًا لحد ما تحفظ رقم الناشر ورقم الإعلان لكل صفحة. لا تظهر في لوحة التحكم أو الدفع أو الحساب.","Ads stay hidden until you save a publisher ID and a slot ID per page. They never show in admin, checkout or account.")+'</p><label class="f"><span>'+bi("رقم الناشر (مثال pub-1234567890123456)","Publisher ID (e.g. pub-1234567890123456)")+'</span><input type="text" id="a-pub" dir="ltr" maxlength="40" value="'+esc(d.publisher||"")+'"></label><h3 style="margin:12px 0 4px">'+bi("أماكن الإعلان","Placements")+'</h3>'+PG.map(function(g){var x=sl[g[0]]||{};return '<div class="sl"><input type="checkbox" id="a-on-'+g[0]+'"'+(x.on===false?'':' checked')+' aria-label="on"><span>'+g[1]+'</span><input type="text" id="a-sl-'+g[0]+'" dir="ltr" inputmode="numeric" maxlength="20" placeholder="slot ID" value="'+esc(x.slot||"")+'"></div>'}).join("")+'<label style="display:flex;gap:10px;align-items:center;margin:12px 0"><input type="checkbox" id="a-house"'+(d.house?' checked':'')+'><span>'+bi("إعلانات أونو الخاصة كبديل (وتظهر حتى بدون AdSense)","Uno house ads as fallback (also shown without AdSense)")+'</span></label><label class="f"><span>'+bi("محتوى ads.txt (للنسخ بعد الموافقة)","ads.txt content (to copy after approval)")+'</span><textarea id="a-txt" rows="3" dir="ltr">'+esc(d.ads_txt||"")+'</textarea></label><p class="hint">'+bi("ملف ads.txt لازم يكون في جذر الدومين. على استضافة GitHub Pages الحالية مش هيتحسب لحد ما يبقى للموقع دومين خاص.","ads.txt must be at the domain root. On the current GitHub Pages address it will not count until the site has its own domain.")+'</p><p id="a-er" class="dirty"></p><div class="tb"><button id="a-sv" type="button">'+bi("حفظ","Save")+'</button></div></div>';
  $("#a-sv").onclick=function(){var pub=$("#a-pub").value.trim();if(pub&&!/^pub-\d{8,20}$/.test(pub)){$("#a-er").textContent="Publisher ID must look like pub-1234567890123456";return}
   var slots={};for(var i=0;i<PG.length;i++){var k=PG[i][0],v=$("#a-sl-"+k).value.trim();if(v&&!/^\d{5,20}$/.test(v)){$("#a-er").textContent="Slot IDs are digits only ("+k+")";return}slots[k]={on:$("#a-on-"+k).checked,slot:v}}
   api("PATCH","ads_config?id=eq.1",{data:{publisher:pub,house:$("#a-house").checked,slots:slots,ads_txt:$("#a-txt").value},updated_at:new Date().toISOString()},"return=minimal").then(function(){$("#a-er").textContent="";status("تم ✓ / Saved ✓")}).catch(function(e){$("#a-er").textContent=e.message})};
 }).catch(function(e){mn.innerHTML='<p class="dirty">'+esc(e.message)+"</p>"});
};

/* knowledge review */
var KST=[["draft","مسودة / Draft","o"],["approved","معتمد / Approved","g"],["needs_owner","محتاج رد المالك / Needs owner","o"],["rejected","مرفوض / Rejected","r"]];
RENDER.kb=function(mn){
 api("GET","kb_items?select=*&order=created_at.desc&limit=600").then(function(rows){
  mn.innerHTML='<h2>'+bi("قاعدة المعرفة","Knowledge base")+'</h2><p class="hint" style="margin-bottom:8px">'+bi("الشات بوت بيرد بس من الإجابات المعتمدة. راجع كل مسودة واعتمدها أو عدّلها.","The chatbot answers only from approved items. Review each draft, then approve or edit it.")+'</p><div class="tb"><select id="kf"><option value="">'+bi("كل الحالات","All statuses")+'</option>'+KST.map(function(s){return '<option value="'+s[0]+'">'+esc(s[1])+" ("+rows.filter(function(x){return x.status===s[0]}).length+")</option>"}).join("")+'</select><input id="kq" placeholder="'+esc("بحث / Search")+'"><button id="kadd" type="button">'+bi("إضافة","Add")+'</button><button class="sec" id="kimp" type="button">'+bi("استيراد","Import")+'</button><button class="sec" id="kall" type="button">'+bi("اعتماد المسودات الظاهرة","Approve shown drafts")+'</button></div><div id="kl"></div>';
  var shown=[];
  function setSt(id,st){return api("PATCH","kb_items?id=eq."+id,{status:st},"return=minimal").then(function(){var r=rows.filter(function(x){return x.id===id})[0];if(r)r.status=st})}
  function draw(){var f=$("#kf").value,q=$("#kq").value.trim().toLowerCase();shown=rows.filter(function(x){return(!f||x.status===f)&&(!q||((x.question_ar||"")+" "+(x.question_en||"")+" "+(x.answer_ar||"")+" "+(x.answer_en||"")).toLowerCase().indexOf(q)>-1)}).slice(0,200);
   $("#kl").innerHTML=shown.length?tbl([bi("السؤال","Question"),bi("الإجابة","Answer"),bi("الحالة","Status"),""],shown.map(function(x){var m=KST.filter(function(s){return s[0]===x.status})[0]||[0,x.status,""];return [esc(x.question_ar||"")+'<br><small style="color:var(--mut)">'+esc(x.question_en||"")+"</small>",esc((x.answer_ar||"").slice(0,140))+(x.source?'<br><small style="color:var(--mut)">'+esc(x.source)+"</small>":""),pill(m[1],m[2]),'<button class="sec sm" data-a="'+x.id+'" type="button">'+bi("اعتماد","Approve")+'</button> <button class="sec sm" data-r="'+x.id+'" type="button">'+bi("رفض","Reject")+'</button> <button class="sec sm" data-e="'+x.id+'" type="button">'+bi("تعديل","Edit")+"</button>"]}),1):empty("لا توجد عناصر","No items");
   [].forEach.call($("#kl").querySelectorAll("[data-a]"),function(b){b.onclick=function(){setSt(b.dataset.a,"approved").then(draw)}});
   [].forEach.call($("#kl").querySelectorAll("[data-r]"),function(b){b.onclick=function(){setSt(b.dataset.r,"rejected").then(draw)}});
   [].forEach.call($("#kl").querySelectorAll("[data-e]"),function(b){b.onclick=function(){form(rows.filter(function(x){return x.id===b.dataset.e})[0])}})}
  function form(x){var n=!x;x=x||{status:"draft",variants:[]};
   openDlg('<h2>'+(n?bi("عنصر جديد","New item"):bi("تعديل","Edit"))+'</h2><label class="f"><span>'+bi("السؤال (عربي)","Question (AR)")+'</span><input id="k-qa" value="'+esc(x.question_ar||"")+'"></label><label class="f"><span>'+bi("السؤال (إنجليزي)","Question (EN)")+'</span><input id="k-qe" dir="ltr" value="'+esc(x.question_en||"")+'"></label><label class="f"><span>'+bi("الإجابة (عربي)","Answer (AR)")+'</span><textarea id="k-aa" rows="3">'+esc(x.answer_ar||"")+'</textarea></label><label class="f"><span>'+bi("الإجابة (إنجليزي)","Answer (EN)")+'</span><textarea id="k-ae" dir="ltr" rows="3">'+esc(x.answer_en||"")+'</textarea></label><label class="f"><span>'+bi("صيغ تانية للسؤال (سطر لكل صيغة)","Question variants (one per line)")+'</span><textarea id="k-v" rows="3">'+esc((x.variants||[]).join("\n"))+'</textarea></label><label class="f"><span>'+bi("التصنيف","Category")+'</span><input id="k-c" value="'+esc(x.category||"")+'"></label><label class="f"><span>'+bi("الحالة","Status")+'</span><select id="k-s">'+KST.map(function(s){return '<option value="'+s[0]+'">'+esc(s[1])+"</option>"}).join("")+'</select></label><p id="k-er" class="dirty"></p><div class="tb"><button id="k-sv" type="button">'+bi("حفظ","Save")+'</button><button class="sec" id="k-cx" type="button">'+bi("إغلاق","Close")+"</button></div>");
   $("#k-s").value=x.status;$("#k-cx").onclick=closeDlg;
   $("#k-sv").onclick=function(){var b={question_ar:$("#k-qa").value.trim(),question_en:$("#k-qe").value.trim(),answer_ar:$("#k-aa").value.trim(),answer_en:$("#k-ae").value.trim(),variants:$("#k-v").value.split("\n").map(function(v){return v.trim()}).filter(Boolean),category:$("#k-c").value.trim()||null,status:$("#k-s").value};if(!(b.question_ar||b.question_en)){$("#k-er").textContent="Question required";return}if(b.status==="approved"&&!(b.answer_ar||b.answer_en)){$("#k-er").textContent="An approved item needs an answer";return}if(n)b.source="admin";
    api(n?"POST":"PATCH",n?"kb_items":"kb_items?id=eq."+x.id,b,"return=minimal").then(function(){closeDlg();status("تم ✓ / Saved ✓");RENDER.kb($("#main"))}).catch(function(e){$("#k-er").textContent=e.message})}}
  $("#kf").onchange=draw;$("#kq").oninput=draw;$("#kadd").onclick=function(){form(null)};
  $("#kall").onclick=function(){var d=shown.filter(function(x){return x.status==="draft"&&(x.answer_ar||x.answer_en)});if(!d.length)return;if(!confirm("اعتماد "+d.length+" مسودة؟ / Approve "+d.length+" drafts?"))return;api("PATCH","kb_items?id=in.("+d.map(function(x){return x.id}).join(",")+")",{status:"approved"},"return=minimal").then(function(){status("تم ✓ / Done ✓");RENDER.kb($("#main"))}).catch(function(e){status(e.message,1)})};
  $("#kimp").onclick=function(){openDlg('<h2>'+bi("استيراد","Import")+'</h2><p class="hint">'+bi("سطر لكل عنصر: السؤال | الإجابة (حد أقصى 200). بيتضاف كمسودة.","One item per line: question | answer (max 200). Added as drafts.")+'</p><textarea id="k-imp" rows="8" style="width:100%;box-sizing:border-box"></textarea><p id="k-er" class="dirty"></p><div class="tb"><button id="k-go" type="button">'+bi("استيراد","Import")+'</button><button class="sec" id="k-cx" type="button">'+bi("إغلاق","Close")+"</button></div>");$("#k-cx").onclick=closeDlg;
   $("#k-go").onclick=function(){var L=$("#k-imp").value.split("\n").map(function(l){return l.split("|")}).filter(function(p){return p.length>=2&&p[0].trim()&&p[1].trim()}).slice(0,200).map(function(p){var q=p[0].trim(),a=p.slice(1).join("|").trim(),ar=/[\u0600-\u06FF]/.test(q);return ar?{question_ar:q,answer_ar:a,status:"draft",source:"import"}:{question_en:q,answer_en:a,status:"draft",source:"import"}});if(!L.length){$("#k-er").textContent="No valid lines";return}api("POST","kb_items",L,"return=minimal").then(function(){closeDlg();status("تم ✓ / Imported "+L.length);RENDER.kb($("#main"))}).catch(function(e){$("#k-er").textContent=e.message})}};
  draw();
 }).catch(function(e){mn.innerHTML='<p class="dirty">'+esc(e.message)+"</p>"});
};

/* requests + chat log */


RENDER.req=function(mn){
 Promise.all([api("GET","requests?select=*&order=created_at.desc&limit=200"),api("GET","chat_log?select=*&order=created_at.desc&limit=100").catch(function(){return []})]).then(function(r){
  var wa=function(p){return String(p||"").replace(/[^0-9]/g,"")};
  mn.innerHTML='<h2>'+bi("طلبات الخدمة","Service requests")+"</h2>"+(r[0].length?tbl([bi("التاريخ","Date"),bi("الاسم","Name"),bi("الهاتف","Phone"),bi("الخدمة","Service"),bi("الرسالة","Message")],r[0].map(function(x){return [dt(x.created_at),esc(x.name),'<a href="tel:'+esc(x.phone)+'">'+esc(x.phone)+'</a> · <a target="_blank" rel="noopener" href="https://wa.me/'+wa(x.phone)+'">WhatsApp</a>',esc(x.service),esc(x.message)]})):empty("لا توجد طلبات بعد","No requests yet"))+'<h2 style="margin-top:20px">'+bi("سجل محادثات الشات بوت","Chatbot conversation log")+"</h2>"+(r[1].length?tbl([bi("التاريخ","Date"),bi("سؤال الزائر","Visitor"),bi("رد أونو","Uno")],r[1].map(function(x){return [dt(x.created_at),esc(x.q),esc(x.a)]})):empty("لا توجد محادثات مسجلة بعد","No logged chats yet"));
 }).catch(function(e){mn.innerHTML='<p class="dirty">'+esc(e.message)+"</p>"});
};

/* users and roles */
RENDER.users=function(mn){
 fn({mode:"adm",action:"list"}).then(function(r){
  if(!r||!r.users)throw new Error((r&&r.error)||"failed");
  mn.innerHTML='<h2>'+bi("المستخدمون والصلاحيات","Users and roles")+'</h2><p class="hint" style="margin-bottom:8px">'+bi("الصلاحيات بتتطبق على قاعدة البيانات نفسها، فمفيش مستخدم يقدر يتخطاها حتى لو كلم الـ API مباشرة.","Permissions are enforced by the database itself, so no user can bypass them even by calling the API directly.")+'</p><div class="tb"><button id="add" type="button">+ '+bi("مستخدم جديد","New user")+"</button></div>"+tbl([bi("المستخدم","User"),bi("الدور","Role"),bi("الحالة","Status"),""],r.users.map(function(u){var me=u.user_id===(USER&&USER.id);return [esc(u.name||"")+"<br><small class=\"hint\">"+esc(u.email||"")+"</small>",me?pill(ROLES[u.role]||u.role,"o"):'<select data-r="'+u.user_id+'">'+Object.keys(ROLES).map(function(k){return '<option value="'+k+'"'+(k===u.role?" selected":"")+">"+esc(ROLES[k])+"</option>"}).join("")+"</select>",u.active?pill("نشط / Active","g"):pill("موقوف / Disabled","r"),me?"":'<button class="sec sm" data-t="'+u.user_id+'" data-a="'+(u.active?0:1)+'" type="button">'+(u.active?bi("إيقاف","Disable"):bi("تفعيل","Enable"))+'</button> <button class="sec sm" data-p="'+u.user_id+'" type="button">'+bi("كلمة سر جديدة","Reset password")+'</button> <button class="dg sm" data-x="'+u.user_id+'" type="button">'+bi("حذف","Delete")+"</button>"]}));
  function reload(){RENDER.users(mn)}
  $("#add").onclick=userForm;
  [].forEach.call(mn.querySelectorAll("[data-r]"),function(s){s.onchange=function(){fn({mode:"adm",action:"set_role",user_id:s.dataset.r,role:s.value}).then(function(x){status(x.ok?"تم ✓ / Done ✓":(x.error||"failed"),!x.ok);reload()})}});
  [].forEach.call(mn.querySelectorAll("[data-t]"),function(b){b.onclick=function(){fn({mode:"adm",action:"set_active",user_id:b.dataset.t,active:b.dataset.a==="1"}).then(reload)}});
  [].forEach.call(mn.querySelectorAll("[data-p]"),function(b){b.onclick=function(){if(confirm("إنشاء كلمة سر جديدة؟ / Create a new password?"))fn({mode:"adm",action:"reset_password",user_id:b.dataset.p}).then(function(x){if(x.password)pwDlg(x.password);else status(x.error||"failed",1)})}});
  [].forEach.call(mn.querySelectorAll("[data-x]"),function(b){b.onclick=function(){if(confirm("حذف المستخدم نهائيًا؟ / Delete this user permanently?"))fn({mode:"adm",action:"delete",user_id:b.dataset.x}).then(reload)}});
 }).catch(function(e){mn.innerHTML='<p class="dirty">'+esc(e.message)+"</p>"});
};
function pwDlg(pw){openDlg('<h2>'+bi("كلمة السر","Password")+'</h2><p class="hint">'+bi("بتظهر مرة واحدة بس. ابعتها للمستخدم بشكل آمن (مش في جروب). مش هقدر أعرضها تاني.","Shown once only. Share it with the user privately. It cannot be shown again.")+'</p><div class="pw">'+esc(pw)+'</div><div class="tb" style="margin-top:12px"><button id="f-cx" type="button">'+bi("تم","Done")+"</button></div>");$("#f-cx").onclick=closeDlg}
function userForm(){
 openDlg('<h2>'+bi("مستخدم جديد","New user")+'</h2><label class="f"><span>Email</span><input type="email" id="f-em" dir="ltr"></label><label class="f"><span>'+bi("الاسم","Name")+'</span><input type="text" id="f-nm"></label><label class="f"><span>'+bi("الدور","Role")+'</span><select id="f-ro">'+Object.keys(ROLES).filter(function(k){return k!=="owner"}).map(function(k){return '<option value="'+k+'">'+esc(ROLES[k])+"</option>"}).join("")+'</select></label><p class="hint">'+bi("مدير المتجر: المنتجات والتصنيفات والطلبات فقط. محرر المحتوى: محتوى الموقع فقط. الدعم: الطلبات وطلبات الخدمة. مدير: كل حاجة ما عدا المستخدمين.","Store manager: products, categories and orders only. Content editor: site content only. Support: orders and service requests. Admin: everything except users.")+'</p><p id="f-er" class="dirty"></p><div class="tb"><button id="f-sv" type="button">'+bi("إنشاء","Create")+'</button><button class="sec" id="f-cx" type="button">'+bi("إلغاء","Cancel")+"</button></div>");
 $("#f-cx").onclick=closeDlg;
 $("#f-sv").onclick=function(){this.disabled=true;fn({mode:"adm",action:"create",email:$("#f-em").value,name:$("#f-nm").value,role:$("#f-ro").value}).then(function(x){if(x.password){pwDlg(x.password);RENDER.users($("#main"))}else{$("#f-er").textContent=x.error||"failed";$("#f-sv").disabled=false}})};
}

/* activity */
RENDER.log=function(mn){
 api("GET","activity_log?select=*&order=created_at.desc&limit=150").then(function(rows){
  mn.innerHTML='<h2>'+bi("سجل النشاط","Activity log")+'</h2><p class="hint" style="margin-bottom:8px">'+bi("بيتسجل تلقائيًا من قاعدة البيانات.","Recorded automatically by the database.")+"</p>"+(rows.length?tbl([bi("الوقت","Time"),bi("المستخدم","User"),bi("الإجراء","Action"),bi("العنصر","Item"),bi("تفاصيل","Detail")],rows.map(function(x){return [dt(x.created_at),esc(x.actor),esc(x.action),esc(x.entity),esc((x.detail&&x.detail.name)||"")+(x.detail&&x.detail.status?" · "+esc(x.detail.status):"")]})):empty("لا يوجد نشاط بعد","No activity yet"));
 }).catch(function(e){mn.innerHTML='<p class="dirty">'+esc(e.message)+"</p>"});
};

/* start */
CLOUD.check().then(function(u){USER=u;return api("GET","admin_roles?user_id=eq."+u.id+"&select=role,active")}).then(function(r){
 var x=r&&r[0];if(!x||x.active===false){document.body.innerHTML='<div style="padding:40px;text-align:center;font-family:Cairo,sans-serif"><h2>لا توجد صلاحية / No access</h2><p>هذا الحساب غير مفعل كمستخدم لوحة تحكم. / This account is not enabled for the admin panel.</p><p><button onclick="CLOUD.logout();location.reload()">خروج / Logout</button></p></div>';return}
 ROLE=x.role;$("#rb").textContent=ROLES[ROLE]||ROLE;$("#who").textContent=USER.email||"";buildNav();
 var h=(location.hash||"").replace("#","");var first=MODS.filter(function(m){return m.id===h&&can(m.p)})[0]?h:"dash";
 if(first==="dash"||first!=="content")setMod(first,true);else setMod("content",true);
}).catch(function(e){status("تعذر تحميل الصلاحيات: "+e.message,1)});

var ST=document.createElement("style");ST.textContent="#dlg .f input,#dlg .f textarea,.adf input[type=text],.adf textarea{width:100%;box-sizing:border-box}.adf{max-width:640px}.adf .sl{display:grid;grid-template-columns:auto 1fr 1.2fr;gap:10px;align-items:center;margin:8px 0}.adf .sl input[type=checkbox]{width:20px;height:20px}html[data-theme=dark]{--ink:#F3F4F6;--mut:#A9B0B8;--ln:#2E343C;--bg:#0F1215;color-scheme:dark}html[data-theme=dark] #sb,html[data-theme=dark] .top,html[data-theme=dark] #ctools,html[data-theme=dark] .main,html[data-theme=dark] #dlg .box,html[data-theme=dark] .kpi,html[data-theme=dark] .ch,html[data-theme=dark] input,html[data-theme=dark] select,html[data-theme=dark] textarea,html[data-theme=dark] button.sec,html[data-theme=dark] button.dg,html[data-theme=dark] .thumb,html[data-theme=dark] #pal .bx,html[data-theme=dark] #pal input{background:#171B20;color:var(--ink)}html[data-theme=dark] .card,html[data-theme=dark] details.it,html[data-theme=dark] th{background:#1C2127}html[data-theme=dark] .kpi.hero{background:linear-gradient(135deg,#F65A00,#C94700);color:#fff}html[data-theme=dark] .ni:hover,html[data-theme=dark] .sbh .col:hover,html[data-theme=dark] #side button.on,html[data-theme=dark] #side button:hover{background:#2B1B10;color:#FF8A42}html[data-theme=dark] .ni.on{background:#3A2112;color:#FF8A42}html[data-theme=dark] .rb,html[data-theme=dark] .pill.o{background:#2B1B10;color:#FF8A42}html[data-theme=dark] .note,html[data-theme=dark] .pw{background:#2B2214;border-color:#5A4520;color:#F3E2C0}html[data-theme=dark] .pill{background:#2E343C;color:#ddd}html[data-theme=dark] .pill.g{background:#12351f;color:#7ee2a8}html[data-theme=dark] .pill.r{background:#3b1714;color:#ff9a92}html[data-theme=dark] .sk{background:linear-gradient(90deg,#1c2127 25%,#262d35 37%,#1c2127 63%);background-size:400% 100%}html[data-theme=dark] #pal li.on{background:#3A2112;color:#FF8A42}html[data-theme=dark] .card b,html[data-theme=dark] .kpi.warn b{color:#FF8A42}html[data-theme=dark] .kpi.warn b{color:#ff9a92}html[data-theme=dark] .bar rect[fill=\"#FFD2B5\"]{fill:#4a2a18}html[data-theme=dark] .img img,html[data-theme=dark] .ph .pi img{background:#1C2127}#thm{background:transparent;color:var(--ink);padding:6px;border-radius:10px;display:flex}#thm:hover{background:#FFF1E8}html[data-theme=dark] #thm:hover{background:#2B1B10}.dsh{display:grid;gap:14px}.kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}.kpi{background:#fff;border:1px solid var(--ln);border-radius:16px;padding:14px 16px;display:flex;flex-direction:column;gap:2px}.kpi b{font-size:1.5rem;line-height:1.2;font-variant-numeric:tabular-nums}.kpi span{color:var(--mut);font-size:.82rem}.kpi.warn b{color:#b42318}@media(max-width:600px){.kpi:last-child:nth-child(even){grid-column:1/-1}}.kpi.hero{grid-column:1/-1;background:linear-gradient(135deg,#F65A00,#FF8A3D);color:#fff;border:0}.kpi.hero span,.kpi.hero em{color:rgba(255,255,255,.88);font-style:normal;font-size:.9rem}.kpi.hero b{font-size:2rem}@media(min-width:900px){.kpi.hero{grid-column:span 2}}.chs{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:12px}.ch{background:#fff;border:1px solid var(--ln);border-radius:16px;padding:14px 16px}.ch h3{font-size:.95rem;margin-bottom:10px}.bar{width:100%;height:auto;display:block}.dn{display:flex;gap:18px;align-items:center;flex-wrap:wrap}.dn ul{list-style:none;padding:0;margin:0;display:grid;gap:6px;font-size:.88rem}.dn li i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-inline-end:8px}.feed{list-style:none;padding:0;margin:0}.feed li{padding:9px 0;border-bottom:1px solid var(--ln);display:flex;flex-wrap:wrap;gap:2px 8px;font-size:.88rem}.feed li:last-child{border:0}.feed em{flex-basis:100%;color:var(--mut);font-style:normal;font-size:.76rem}.sk{border-radius:16px;background:linear-gradient(90deg,#eee7e1 25%,#f8f4f0 37%,#eee7e1 63%);background-size:400% 100%;animation:sk 1.3s infinite}@keyframes sk{to{background-position:-100% 0}}#toasts{position:fixed;inset-inline:0;bottom:calc(16px + env(safe-area-inset-bottom));display:grid;gap:8px;justify-items:center;z-index:200;pointer-events:none}.toast{background:#1F2933;color:#fff;border-radius:12px;padding:11px 18px;font-size:.9rem;box-shadow:0 10px 30px rgba(0,0,0,.25);animation:ti .2s}.toast.bad{background:#b42318}.toast.out{opacity:0;transition:opacity .25s}@keyframes ti{from{transform:translateY(10px);opacity:0}}#pal{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:300;display:flex;justify-content:center;align-items:flex-start;padding:12vh 14px}#pal .bx{background:#fff;border-radius:16px;width:min(560px,100%);box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden}#pal input{width:100%;border:0;border-bottom:1px solid var(--ln);padding:16px 18px;font:inherit;font-size:1rem;outline:0;border-radius:0}#pal ul{list-style:none;margin:0;padding:6px;max-height:50vh;overflow:auto}#pal li{padding:11px 14px;border-radius:10px;cursor:pointer;font-size:.92rem}#pal li.on{background:#FFE9DB;color:var(--od)}#pal small{display:block;padding:8px 18px;color:var(--mut);font-size:.76rem}:focus-visible{outline:2px solid var(--o);outline-offset:2px}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}";document.head.appendChild(ST);
function palette(){if($("#pal"))return;var items=MODS.filter(function(m){return can(m.p)}).map(function(m){return {t:m.l,f:function(){setMod(m.id,true)}}});
 if(can("store")){items.push({t:"+ منتج جديد / New product",f:function(){setMod("prod",true);setTimeout(function(){var b=$("#add");b&&b.click()},500)}});items.push({t:"+ تصنيف جديد / New category",f:function(){setMod("cat",true);setTimeout(function(){var b=$("#add");b&&b.click()},500)}})}
 var o=document.createElement("div");o.id="pal";o.innerHTML='<div class="bx" role="dialog" aria-label="Command palette"><input type="text" placeholder="ابحث أو اكتب أمر / Search or type a command" aria-label="search"><ul></ul><small>↑↓ Enter · Esc</small></div>';document.body.appendChild(o);
 var inp=o.querySelector("input"),ul=o.querySelector("ul"),sel=0,cur=items;function draw(){ul.innerHTML=cur.map(function(x,i){return '<li class="'+(i===sel?"on":"")+'" data-i="'+i+'">'+esc(x.t)+"</li>"}).join("")||"<li>—</li>"}
 function run(i){var x=cur[i];o.remove();if(x)x.f()}
 inp.oninput=function(){var q=inp.value.toLowerCase();cur=items.filter(function(x){return x.t.toLowerCase().indexOf(q)>-1});sel=0;draw()};
 inp.onkeydown=function(e){if(e.key==="Escape")o.remove();else if(e.key==="ArrowDown"){sel=Math.min(sel+1,cur.length-1);draw();e.preventDefault()}else if(e.key==="ArrowUp"){sel=Math.max(sel-1,0);draw();e.preventDefault()}else if(e.key==="Enter")run(sel)};
 ul.onclick=function(e){var l=e.target.closest("li[data-i]");if(l)run(+l.dataset.i)};o.addEventListener("mousedown",function(e){if(e.target===o)o.remove()});draw();inp.focus()}
document.addEventListener("keydown",function(e){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();palette()}});

RENDER.rv=function(mn){
 api("GET","product_reviews?select=*,products(name_ar,name_en),customers(name)&order=created_at.desc&limit=300").then(function(rows){
  var ST={pending:["معلّق / Pending","warn"],approved:["معتمد / Approved","ok"],rejected:["مرفوض / Rejected","bad"]};
  mn.innerHTML='<h2>'+bi("تقييمات العملاء","Customer reviews")+'</h2><p class="hint" style="margin-bottom:8px">'+bi("التقييم بيتبعت بس من مشتري موثّق (طلب اتسلّم). التقييم مبيظهرش في المتجر غير بعد اعتمادك.","Only verified buyers (delivered order) can review. A review shows in the store only after you approve it.")+'</p><div class="tb"><select id="rf"><option value="">'+bi("كل الحالات","All statuses")+'</option><option value="pending">'+bi("معلّق","Pending")+'</option><option value="approved">'+bi("معتمد","Approved")+'</option><option value="rejected">'+bi("مرفوض","Rejected")+'</option></select></div><div id="rl"></div>';
  function set(id,st){return api("PATCH","product_reviews?id=eq."+id,{status:st},"return=minimal").then(function(){var r=rows.filter(function(x){return x.id===id})[0];if(r)r.status=st})}
  function draw(){var f=$("#rf").value,sh=rows.filter(function(x){return !f||x.status===f});
   $("#rl").innerHTML=sh.length?tbl([bi("المنتج","Product"),bi("العميل","Customer"),bi("التقييم","Rating"),bi("الرأي","Review"),bi("الحالة","Status"),""],sh.map(function(x){var m=ST[x.status]||[x.status,""];return [esc((x.products&&x.products.name_ar)||""),esc((x.customers&&x.customers.name)||""),"\u2605 "+x.rating,esc(x.body||""),pill(m[0],m[1]),'<button class="sec sm" data-a="'+x.id+'" type="button">'+bi("اعتماد","Approve")+'</button> <button class="sec sm" data-r="'+x.id+'" type="button">'+bi("رفض","Reject")+"</button>"]}),1):empty("لا توجد تقييمات","No reviews yet");
   [].forEach.call($("#rl").querySelectorAll("[data-a]"),function(b){b.onclick=function(){set(b.dataset.a,"approved").then(draw)}});
   [].forEach.call($("#rl").querySelectorAll("[data-r]"),function(b){b.onclick=function(){set(b.dataset.r,"rejected").then(draw)}})}
  $("#rf").onchange=draw;draw();
 }).catch(function(e){mn.innerHTML='<p class="dirty">'+esc(e.message)+"</p>"});
};
/* UNO Core R8: company, branches/warehouses, units, partners */
function coreCrud(mn,cfg){
 api("GET",cfg.t+"?select=*&order=created_at.desc,code.asc").catch(function(){return api("GET",cfg.t+"?select=*")}).then(function(rows){
  mn.innerHTML='<h2>'+bi(cfg.ar,cfg.en)+'</h2><div class="tb"><button id="add" type="button">+ '+bi(cfg.nar,cfg.nen)+'</button><input type="search" id="cq" placeholder="'+bi("بحث","Search").replace(/<[^>]*>/g,"")+'" style="max-width:240px"></div><div id="cl"></div>';
  function draw(){var q=($("#cq").value||"").toLowerCase(),f=rows.filter(function(x){return !q||JSON.stringify(x).toLowerCase().indexOf(q)>-1});
   $("#cl").innerHTML=f.length?tbl(cfg.f.filter(function(c){return c.list}).map(function(c){return bi(c.ar,c.en)}).concat([bi("الحالة","Status"),""]),f.map(function(x){return cfg.f.filter(function(c){return c.list}).map(function(c){var v=x[c.k];if(c.opts){var o=c.opts.filter(function(p){return p[0]===v})[0];v=o?o[1]:v}return esc(v==null?"":v)}).concat([x.active?pill("نشط / Active","g"):pill("موقوف / Inactive"),'<button class="sec sm" data-e="'+x.id+'" type="button">'+bi("تعديل","Edit")+"</button>"])})):empty("لا توجد بيانات بعد","Nothing here yet");
   [].forEach.call($("#cl").querySelectorAll("[data-e]"),function(b){b.onclick=function(){form(rows.filter(function(x){return x.id===b.dataset.e})[0])}})}
  function form(r){r=r||{};
   openDlg('<h2>'+(r.id?bi("تعديل","Edit"):bi(cfg.nar,cfg.nen))+'</h2>'+cfg.f.map(function(c,i){return '<label class="f"><span>'+bi(c.ar,c.en)+'</span>'+(c.opts?'<select id="cf'+i+'">'+c.opts.map(function(o){return '<option value="'+o[0]+'">'+esc(o[1])+"</option>"}).join("")+"</select>":(c.ta?'<textarea id="cf'+i+'" rows="2"></textarea>':'<input type="text" id="cf'+i+'"'+(c.ltr?' dir="ltr"':"")+">"))+"</label>"}).join("")+'<label class="f"><span>'+bi("الحالة","Status")+'</span><select id="cfa"><option value="1">نشط / Active</option><option value="0">موقوف / Inactive</option></select></label><p id="f-er" class="dirty"></p><div class="tb"><button id="f-sv" type="button">'+bi("حفظ","Save")+'</button><button class="sec" id="f-cx" type="button">'+bi("إلغاء","Cancel")+"</button></div>");
   cfg.f.forEach(function(c,i){$("#cf"+i).value=r[c.k]==null?(c.def||""):r[c.k]});$("#cfa").value=r.active===false?"0":"1";
   $("#f-cx").onclick=closeDlg;
   $("#f-sv").onclick=function(){var d={active:$("#cfa").value==="1"},bad="";cfg.f.forEach(function(c,i){var v=$("#cf"+i).value.trim();if(c.req&&!v)bad=bi("الحقول المطلوبة ناقصة","Required fields are missing").replace(/<[^>]*>/g,"");d[c.k]=v||null});
    if(bad){$("#f-er").textContent=bad;return}
    api(r.id?"PATCH":"POST",cfg.t+(r.id?"?id=eq."+r.id:""),d,"return=minimal").then(function(){closeDlg();status("تم الحفظ ✓ / Saved ✓");RENDER[cfg.id]($("#main"))}).catch(function(e){$("#f-er").textContent=e.message})}}
  $("#add").onclick=function(){form()};$("#cq").oninput=draw;draw();
 }).catch(function(e){mn.innerHTML='<p class="dirty">'+esc(e.message)+"</p>"});
}
RENDER.cbr=function(mn){coreCrud(mn,{id:"cbr",t:"core_branches",ar:"الفروع والمخازن",en:"Branches and warehouses",nar:"فرع/مخزن جديد",nen:"New branch/warehouse",f:[{k:"code",ar:"الكود",en:"Code",ltr:1,list:1},{k:"name_ar",ar:"الاسم بالعربي",en:"Arabic name",req:1,list:1},{k:"name_en",ar:"الاسم بالإنجليزي",en:"English name",list:1},{k:"kind",ar:"النوع",en:"Type",def:"branch",list:1,opts:[["branch","فرع / Branch"],["warehouse","مخزن / Warehouse"]]},{k:"address",ar:"العنوان",en:"Address",ta:1},{k:"phone",ar:"الهاتف",en:"Phone",ltr:1}]})};
RENDER.cun=function(mn){coreCrud(mn,{id:"cun",t:"core_units",ar:"وحدات القياس",en:"Units",nar:"وحدة جديدة",nen:"New unit",f:[{k:"code",ar:"الكود",en:"Code",ltr:1,req:1,list:1},{k:"name_ar",ar:"الاسم بالعربي",en:"Arabic name",req:1,list:1},{k:"name_en",ar:"الاسم بالإنجليزي",en:"English name",req:1,list:1}]})};
RENDER.cpa=function(mn){coreCrud(mn,{id:"cpa",t:"core_partners",ar:"العملاء والموردون",en:"Customers and suppliers",nar:"طرف جديد",nen:"New partner",f:[{k:"name",ar:"الاسم",en:"Name",req:1,list:1},{k:"kind",ar:"النوع",en:"Type",def:"customer",list:1,opts:[["customer","عميل / Customer"],["supplier","مورد / Supplier"],["both","الاثنين / Both"]]},{k:"phone",ar:"الهاتف",en:"Phone",ltr:1,list:1},{k:"email",ar:"البريد",en:"Email",ltr:1},{k:"address",ar:"العنوان",en:"Address",ta:1},{k:"tax_id",ar:"الرقم الضريبي",en:"Tax ID",ltr:1},{k:"notes",ar:"ملاحظات",en:"Notes",ta:1}]})};
RENDER.cco=function(mn){
 api("GET","core_company?id=eq.1&select=*").then(function(rr){var r=rr[0]||{id:1};
  var F=[["name_ar","اسم الشركة بالعربي","Company name (Arabic)"],["name_en","اسم الشركة بالإنجليزي","Company name (English)"],["phone","الهاتف","Phone"],["email","البريد","Email"],["address","العنوان","Address"],["tax_id","الرقم الضريبي","Tax ID"],["currency","العملة","Currency"]];
  mn.innerHTML='<h2>'+bi("بيانات الشركة","Company settings")+'</h2><p class="hint" style="margin-bottom:12px">'+bi("نظام داخلي لشركة واحدة. الأرقام الضريبية والبيانات تُدخل من المالك فقط.","Internal single-company system. Tax and company details are entered by the owner only.")+'</p>'+F.map(function(x,i){return '<label class="f"><span>'+bi(x[1],x[2])+'</span><input type="text" id="co'+i+'"></label>'}).join("")+'<p id="co-er" class="dirty"></p><div class="tb"><button id="co-sv" type="button">'+bi("حفظ","Save")+"</button></div>";
  F.forEach(function(x,i){$("#co"+i).value=r[x[0]]||""});
  $("#co-sv").onclick=function(){var d={updated_at:new Date().toISOString()};F.forEach(function(x,i){var v=$("#co"+i).value.trim();d[x[0]]=v||null});if(!d.name_ar||!d.name_en||!d.currency){$("#co-er").textContent="الاسم والعملة مطلوبين / Names and currency are required";return}
   api("PATCH","core_company?id=eq.1",d,"return=minimal").then(function(){status("تم الحفظ ✓ / Saved ✓")}).catch(function(e){$("#co-er").textContent=e.message})};
 }).catch(function(e){mn.innerHTML='<p class="dirty">'+esc(e.message)+"</p>"});
};
/* UNO Core R9: inventory (stock levels and movements) */
var MV=[["opening","رصيد افتتاحي / Opening","+"],["purchase","شراء / Purchase","+"],["return","مرتجع / Return","+"],["transfer_in","تحويل وارد / Transfer in","+"],["sale","بيع / Sale","-"],["transfer_out","تحويل صادر / Transfer out","-"],["adjust","تسوية (+/-) / Adjustment (+/-)","*"]];
RENDER.cin=function(mn){
 Promise.all([api("GET","products?select=id,name_ar,name_en&order=name_en.asc&limit=500"),api("GET","core_branches?select=id,name_ar,name_en,kind&kind=eq.warehouse&active=eq.true"),api("GET","core_stock_levels?select=*"),api("GET","core_stock_moves?select=*&order=created_at.desc&limit=100")]).then(function(r){
  var P=r[0],W=r[1],LV=r[2],MS=r[3],pn={},wn={};P.forEach(function(p){pn[p.id]=p.name_ar+" / "+p.name_en});W.forEach(function(w){wn[w.id]=w.name_ar});
  mn.innerHTML='<h2>'+bi("المخزون","Inventory")+'</h2><p class="hint" style="margin-bottom:12px">'+bi("أرصدة المخازن الداخلية وحركاتها. لا تغيّر مخزون المتجر العام.","Internal warehouse stock and movements. This does not change the public store stock.")+'</p><div class="tb"><button id="add" type="button">+ '+bi("حركة مخزون","Stock movement")+'</button></div>'+(W.length?"":'<p class="dirty">'+bi("أضف مخزنًا أولًا من الفروع والمخازن.","Add a warehouse first under Branches and warehouses.")+"</p>")+'<h3 style="margin:14px 0 6px">'+bi("الأرصدة","Stock levels")+'</h3>'+(LV.length?tbl([bi("المنتج","Product"),bi("المخزن","Warehouse"),bi("الكمية","Qty"),bi("آخر حركة","Last move")],LV.map(function(x){return [esc(pn[x.product_id]||x.product_id),esc(wn[x.warehouse_id]||x.warehouse_id),'<b'+(Number(x.qty)<0?' class="dirty"':"")+">"+esc(Number(x.qty))+"</b>",esc(dt(x.last_move))]})):empty("لا توجد أرصدة بعد","No stock yet"))+'<h3 style="margin:14px 0 6px">'+bi("آخر الحركات","Recent movements")+'</h3>'+(MS.length?tbl([bi("التاريخ","Date"),bi("المنتج","Product"),bi("المخزن","Warehouse"),bi("النوع","Type"),bi("الكمية","Qty"),bi("ملاحظة","Note")],MS.map(function(x){var k=MV.filter(function(m){return m[0]===x.kind})[0];return [esc(dt(x.created_at)),esc(pn[x.product_id]||""),esc(wn[x.warehouse_id]||""),esc(k?k[1]:x.kind),esc(Number(x.qty)),esc(x.note||"")]})):empty("لا توجد حركات","No movements"));
  $("#add").onclick=function(){if(!W.length){status("أضف مخزنًا أولًا / Add a warehouse first",1);return}
   openDlg('<h2>'+bi("حركة مخزون","Stock movement")+'</h2><label class="f"><span>'+bi("المنتج","Product")+'</span><select id="mp">'+P.map(function(p){return '<option value="'+p.id+'">'+esc(pn[p.id])+"</option>"}).join("")+'</select></label><label class="f"><span>'+bi("المخزن","Warehouse")+'</span><select id="mw">'+W.map(function(w){return '<option value="'+w.id+'">'+esc(w.name_ar)+"</option>"}).join("")+'</select></label><div class="pair"><label class="f"><span>'+bi("النوع","Type")+'</span><select id="mk">'+MV.map(function(m){return '<option value="'+m[0]+'">'+esc(m[1])+"</option>"}).join("")+'</select></label><label class="f"><span>'+bi("الكمية","Quantity")+'</span><input type="number" id="mq" min="0" step="any" dir="ltr"></label></div><label class="f"><span>'+bi("ملاحظة","Note")+'</span><input type="text" id="mn"></label><p class="hint">'+bi("في التسوية اكتب الكمية بالسالب للنقص.","For an adjustment, use a negative quantity to reduce.")+'</p><p id="f-er" class="dirty"></p><div class="tb"><button id="f-sv" type="button">'+bi("حفظ","Save")+'</button><button class="sec" id="f-cx" type="button">'+bi("إلغاء","Cancel")+"</button></div>");
   $("#mq").removeAttribute("min");$("#f-cx").onclick=closeDlg;
   $("#f-sv").onclick=function(){var k=$("#mk").value,q=parseFloat($("#mq").value),m=MV.filter(function(x){return x[0]===k})[0];
    if(!q||isNaN(q)){$("#f-er").textContent="الكمية مطلوبة / Quantity is required";return}
    if(m[2]!=="*"&&q<0){$("#f-er").textContent="الكمية لازم تكون موجبة / Quantity must be positive";return}
    var s=m[2]==="-"?-Math.abs(q):q;
    if(s<0){var cur=LV.filter(function(l){return l.product_id===$("#mp").value&&l.warehouse_id===$("#mw").value})[0];if(!cur||Number(cur.qty)+s<0){$("#f-er").textContent="الرصيد غير كافٍ / Not enough stock in this warehouse";return}}
    api("POST","core_stock_moves",{product_id:$("#mp").value,warehouse_id:$("#mw").value,kind:k,qty:s,note:$("#mn").value.trim()||null},"return=minimal").then(function(){closeDlg();status("تم الحفظ ✓ / Saved ✓");RENDER.cin($("#main"))}).catch(function(e){$("#f-er").textContent=e.message})}}
 }).catch(function(e){mn.innerHTML='<p class="dirty">'+esc(e.message)+"</p>"});
};

/* Live support chat (staff side) */
var SUPT=null;
RENDER.sup=function(mn){
 var cur=null,list=[],lastId=0;
 mn.innerHTML='<h2>'+bi("الدعم المباشر","Live support")+'</h2><p class="hint" style="margin-bottom:12px">'+bi("محادثات الزوار اللي اختاروا يتكلموا مع الدعم. الصفحة بتتحدّث كل ٣ ثواني وهي مفتوحة. مفيش إشعارات لما تقفل الصفحة.","Visitors who chose to talk to support. This page refreshes every 3 seconds while open. There are no notifications when it is closed.")+'</p><div class="sup"><div class="sup-l" id="sup-l"></div><div class="sup-c" id="sup-c"><p class="hint" style="padding:18px">'+bi("اختار محادثة","Pick a conversation")+'</p></div></div>';
 function paintList(){$("#sup-l").innerHTML=list.length?list.map(function(c){return '<button type="button" class="sup-i'+(cur&&cur.id===c.id?" on":"")+'" data-id="'+c.id+'"><b>'+esc(c.name)+'</b>'+(c.unread_agent>0?'<span class="sup-n">'+c.unread_agent+'</span>':"")+'<small>'+(c.status==="open"?bi("مفتوحة","Open"):bi("مقفولة","Closed"))+" · "+esc(dt(c.last_at))+"</small></button>"}).join(""):empty("مفيش محادثات","No conversations");
  [].forEach.call(document.querySelectorAll(".sup-i"),function(b){b.onclick=function(){cur=list.filter(function(c){return c.id===b.dataset.id})[0];lastId=0;openC()}})}
 function loadList(){return api("GET","support_chats?select=*&order=last_at.desc&limit=100").then(function(r){list=r;if(cur){var n=r.filter(function(c){return c.id===cur.id})[0];if(n)cur=n}paintList()}).catch(function(e){$("#sup-l").innerHTML='<p class="dirty">'+esc(e.message)+"</p>"})}
 function paintMsgs(ms,full){var box=$("#sup-m");if(!box)return;if(full)box.innerHTML="";ms.forEach(function(m){var d=document.createElement("div");d.className="sup-b "+m.sender;d.textContent=m.body;box.appendChild(d);lastId=Math.max(lastId,m.id)});if(ms.length)box.scrollTop=box.scrollHeight}
 function pull(full){if(!cur)return;return api("GET","support_messages?select=*&chat_id=eq."+cur.id+"&id=gt."+lastId+"&order=id.asc&limit=200").then(function(ms){paintMsgs(ms,full);if(ms.length&&cur.unread_agent>0){api("PATCH","support_chats?id=eq."+cur.id,{unread_agent:0},"return=minimal").then(loadList)}})}
 function openC(){paintList();var c=$("#sup-c");c.innerHTML='<div class="sup-h"><div><b>'+esc(cur.name)+'</b><small>'+esc(cur.phone||"")+'</small></div><button type="button" class="sec sm" id="sup-x">'+(cur.status==="open"?bi("قفل المحادثة","Close chat"):bi("إعادة فتح","Reopen"))+'</button></div><div class="sup-m" id="sup-m"></div><form class="sup-f" id="sup-f"><input id="sup-t" maxlength="1000" autocomplete="off" placeholder="'+"اكتب ردك / Type your reply"+'"><button type="submit">'+bi("إرسال","Send")+'</button></form>';
  $("#sup-x").onclick=function(){api("PATCH","support_chats?id=eq."+cur.id,{status:cur.status==="open"?"closed":"open"},"return=minimal").then(loadList).then(openC)};
  $("#sup-f").onsubmit=function(e){e.preventDefault();var v=$("#sup-t").value.trim();if(!v)return;$("#sup-t").value="";api("POST","support_messages",{chat_id:cur.id,sender:"agent",body:v},"return=minimal").then(function(){return api("PATCH","support_chats?id=eq."+cur.id,{last_at:new Date().toISOString()},"return=minimal")}).then(function(){return pull(false)}).catch(function(er){status(er.message,1)})};
  pull(true)}
 loadList();clearInterval(SUPT);SUPT=setInterval(function(){if(MOD!=="sup"){clearInterval(SUPT);return}loadList();pull(false)},3000);
};
RENDER.bk=function(mn){
 var TB=["orders","order_items","order_events","products","categories","customers","customer_addresses","product_reviews","kb_items","site_content","requests","chat_log","ads_config","activity_log","whatsapp_conversations","whatsapp_messages"];
 mn.innerHTML='<h2>'+bi("نسخة احتياطية","Backup")+'</h2><p class="hint" style="margin-bottom:12px">'+bi("نزّل نسخة من بيانات الموقع على جهازك (مجانًا). الملف فيه بيانات العملاء، فاحفظه في مكان آمن ومتشاركوش.","Download a copy of the site data to your device (free). The file contains customer data, so keep it somewhere safe and do not share it.")+'</p><div class="tb"><button id="bk-all" type="button">'+bi("تنزيل كل البيانات (JSON)","Download all data (JSON)")+'</button></div><p id="bk-st" class="hint" style="margin-top:10px"></p><div id="bk-l"></div>';
 function all(t){var out=[];function pg(o){return api("GET",t+"?select=*&order=created_at.asc.nullslast&limit=1000&offset="+o).catch(function(){return api("GET",t+"?select=*&limit=1000&offset="+o)}).then(function(r){out=out.concat(r);return r.length===1000?pg(o+1000):out})}return pg(0)}
 function dl(name,obj){var b=new Blob([JSON.stringify(obj,null,1)],{type:"application/json"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},4000)}
 var d=new Date().toISOString().slice(0,10);
 $("#bk-l").innerHTML=tbl([bi("الجدول","Table"),""],TB.map(function(t){return [esc(t),'<button class="sec sm" data-t="'+t+'" type="button">'+bi("تنزيل","Download")+"</button>"]}),1);
 [].forEach.call($("#bk-l").querySelectorAll("[data-t]"),function(b){b.onclick=function(){var t=b.dataset.t;$("#bk-st").textContent=t+" ...";all(t).then(function(r){dl("uno-"+t+"-"+d+".json",r);$("#bk-st").textContent=t+": "+r.length+" rows"}).catch(function(e){$("#bk-st").textContent=t+": "+e.message})}});
 $("#bk-all").onclick=function(){var res={exported_at:new Date().toISOString()},i=0,sk=[];function next(){if(i>=TB.length){res.skipped=sk;dl("uno-backup-"+d+".json",res);$("#bk-st").textContent=bi("تم. تم تخطي: ","Done. Skipped: ").replace(/<[^>]*>/g,"")+(sk.join(", ")||"-");return}var t=TB[i++];$("#bk-st").textContent=t+" ("+i+"/"+TB.length+")";all(t).then(function(r){res[t]=r}).catch(function(){sk.push(t)}).then(next)}next()};
};
(function(){var K="uno_adm_theme",r=document.documentElement;function cur(){var v=null;try{v=localStorage.getItem(K)}catch(e){}return v||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light")}function apply(v){r.setAttribute("data-theme",v)}apply(cur());
var b=document.createElement("button");b.id="thm";b.type="button";b.setAttribute("aria-label","theme");function ic(){b.innerHTML=cur()==="dark"?'<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>':'<svg class="i" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/></svg>'}ic();
b.onclick=function(){var v=cur()==="dark"?"light":"dark";try{localStorage.setItem(K,v)}catch(e){}apply(v);ic()};
var rb=document.getElementById("rb");if(rb&&rb.parentNode)rb.parentNode.insertBefore(b,rb)})();
})();
