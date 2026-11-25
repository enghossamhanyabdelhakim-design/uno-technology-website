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
 log:'<path d="M12 8v5l3 2"/><circle cx="12" cy="12" r="9"/>'
};
function ic(n){return '<svg class="i" viewBox="0 0 24 24">'+I[n]+'</svg>'}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
var ROLES={owner:"المالك / Owner",admin:"مدير / Admin",store_manager:"مدير المتجر / Store manager",content_editor:"محرر المحتوى / Content editor",support:"الدعم / Support"};
var PERM={owner:["users","log","content","store","orders","requests"],admin:["log","content","store","orders","requests"],store_manager:["store","orders"],content_editor:["content"],support:["orders","requests"]};
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
 {id:"content",g:"المحتوى / Content",p:"content",ic:"edit",l:"محتوى الموقع / Site content"},
 {id:"req",g:"العملاء / Customers",p:"requests",ic:"inbox",l:"الطلبات والمحادثات / Requests and chats"},
 {id:"users",g:"الفريق / Team",p:"users",ic:"users",l:"المستخدمون والصلاحيات / Users and roles"},
 {id:"log",g:"الفريق / Team",p:"log",ic:"log",l:"سجل النشاط / Activity log"}
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
   $("#ol").innerHTML=f.length?tbl(["#",bi("العميل","Customer"),bi("الهاتف","Phone"),bi("الإجمالي","Total"),bi("الحالة","Status"),bi("التاريخ","Date"),""],f.map(function(x){return ["#"+x.number,esc(x.customer_name),'<a href="tel:'+esc(x.phone)+'">'+esc(x.phone)+"</a>",money(x.total),pill((OST.filter(function(s){return s[0]===x.status})[0]||[0,x.status])[1],x.status==="new"?"o":x.status==="cancelled"?"r":"g"),dt(x.created_at),'<button class="sec sm" data-e="'+x.id+'" type="button">'+bi("فتح","Open")+"</button>"]})):empty("لا توجد طلبات بعد. هتظهر هنا لما الدفع عند الاستلام يشتغل في المتجر.","No orders yet. They appear here once store checkout is live.");
   [].forEach.call($("#ol").querySelectorAll("[data-e]"),function(b){b.onclick=function(){ordView(rows.filter(function(x){return x.id===b.dataset.e})[0])}})}
  $("#fs").onchange=draw;draw();
 }).catch(function(e){mn.innerHTML='<p class="dirty">'+esc(e.message)+"</p>"});
};
function ordView(o){
 api("GET","order_items?order_id=eq."+o.id+"&select=*").then(function(it){
  openDlg('<h2>'+bi("طلب","Order")+" #"+o.number+'</h2><p><b>'+esc(o.customer_name)+"</b> · "+esc(o.phone)+"<br>"+esc(o.governorate||"")+" "+esc(o.address||"")+"<br>"+bi("الدفع","Payment")+": "+esc(o.payment_method||"")+"<br>"+esc(o.notes||"")+"</p>"+tbl([bi("المنتج","Item"),bi("السعر","Price"),bi("الكمية","Qty")],it.map(function(x){return [esc(x.name),money(x.price),x.qty]}))+'<p style="margin:10px 0"><b>'+bi("الإجمالي","Total")+": "+money(o.total)+'</b> ('+bi("شحن","shipping")+" "+money(o.shipping)+')</p><label class="f"><span>'+bi("الحالة","Status")+'</span><select id="f-s">'+OST.map(function(s){return '<option value="'+s[0]+'">'+esc(s[1])+"</option>"}).join("")+'</select></label><p id="f-er" class="dirty"></p><div class="tb"><button id="f-sv" type="button">'+bi("حفظ الحالة","Save status")+'</button><button class="sec" id="f-cx" type="button">'+bi("إغلاق","Close")+"</button></div>");
  $("#f-s").value=o.status;$("#f-cx").onclick=closeDlg;
  $("#f-sv").onclick=function(){api("PATCH","orders?id=eq."+o.id,{status:$("#f-s").value},"return=minimal").then(function(){closeDlg();status("تم ✓ / Done ✓");RENDER.ord($("#main"))}).catch(function(e){$("#f-er").textContent=e.message})};
 });
}

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

var ST=document.createElement("style");ST.textContent=".dsh{display:grid;gap:14px}.kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}.kpi{background:#fff;border:1px solid var(--ln);border-radius:16px;padding:14px 16px;display:flex;flex-direction:column;gap:2px}.kpi b{font-size:1.5rem;line-height:1.2;font-variant-numeric:tabular-nums}.kpi span{color:var(--mut);font-size:.82rem}.kpi.warn b{color:#b42318}.kpi.hero{grid-column:1/-1;background:linear-gradient(135deg,#F65A00,#FF8A3D);color:#fff;border:0}.kpi.hero span,.kpi.hero em{color:rgba(255,255,255,.88);font-style:normal;font-size:.9rem}.kpi.hero b{font-size:2rem}@media(min-width:900px){.kpi.hero{grid-column:span 2}}.chs{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:12px}.ch{background:#fff;border:1px solid var(--ln);border-radius:16px;padding:14px 16px}.ch h3{font-size:.95rem;margin-bottom:10px}.bar{width:100%;height:auto;display:block}.dn{display:flex;gap:18px;align-items:center;flex-wrap:wrap}.dn ul{list-style:none;padding:0;margin:0;display:grid;gap:6px;font-size:.88rem}.dn li i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-inline-end:8px}.feed{list-style:none;padding:0;margin:0}.feed li{padding:9px 0;border-bottom:1px solid var(--ln);display:flex;flex-wrap:wrap;gap:2px 8px;font-size:.88rem}.feed li:last-child{border:0}.feed em{flex-basis:100%;color:var(--mut);font-style:normal;font-size:.76rem}.sk{border-radius:16px;background:linear-gradient(90deg,#eee7e1 25%,#f8f4f0 37%,#eee7e1 63%);background-size:400% 100%;animation:sk 1.3s infinite}@keyframes sk{to{background-position:-100% 0}}#toasts{position:fixed;inset-inline:0;bottom:calc(16px + env(safe-area-inset-bottom));display:grid;gap:8px;justify-items:center;z-index:200;pointer-events:none}.toast{background:#1F2933;color:#fff;border-radius:12px;padding:11px 18px;font-size:.9rem;box-shadow:0 10px 30px rgba(0,0,0,.25);animation:ti .2s}.toast.bad{background:#b42318}.toast.out{opacity:0;transition:opacity .25s}@keyframes ti{from{transform:translateY(10px);opacity:0}}#pal{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:300;display:flex;justify-content:center;align-items:flex-start;padding:12vh 14px}#pal .bx{background:#fff;border-radius:16px;width:min(560px,100%);box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden}#pal input{width:100%;border:0;border-bottom:1px solid var(--ln);padding:16px 18px;font:inherit;font-size:1rem;outline:0;border-radius:0}#pal ul{list-style:none;margin:0;padding:6px;max-height:50vh;overflow:auto}#pal li{padding:11px 14px;border-radius:10px;cursor:pointer;font-size:.92rem}#pal li.on{background:#FFE9DB;color:var(--od)}#pal small{display:block;padding:8px 18px;color:var(--mut);font-size:.76rem}:focus-visible{outline:2px solid var(--o);outline-offset:2px}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}";document.head.appendChild(ST);
function palette(){if($("#pal"))return;var items=MODS.filter(function(m){return can(m.p)}).map(function(m){return {t:m.l,f:function(){setMod(m.id,true)}}});
 if(can("store")){items.push({t:"+ منتج جديد / New product",f:function(){setMod("prod",true);setTimeout(function(){var b=$("#add");b&&b.click()},500)}});items.push({t:"+ تصنيف جديد / New category",f:function(){setMod("cat",true);setTimeout(function(){var b=$("#add");b&&b.click()},500)}})}
 var o=document.createElement("div");o.id="pal";o.innerHTML='<div class="bx" role="dialog" aria-label="Command palette"><input type="text" placeholder="ابحث أو اكتب أمر / Search or type a command" aria-label="search"><ul></ul><small>↑↓ Enter · Esc</small></div>';document.body.appendChild(o);
 var inp=o.querySelector("input"),ul=o.querySelector("ul"),sel=0,cur=items;function draw(){ul.innerHTML=cur.map(function(x,i){return '<li class="'+(i===sel?"on":"")+'" data-i="'+i+'">'+esc(x.t)+"</li>"}).join("")||"<li>—</li>"}
 function run(i){var x=cur[i];o.remove();if(x)x.f()}
 inp.oninput=function(){var q=inp.value.toLowerCase();cur=items.filter(function(x){return x.t.toLowerCase().indexOf(q)>-1});sel=0;draw()};
 inp.onkeydown=function(e){if(e.key==="Escape")o.remove();else if(e.key==="ArrowDown"){sel=Math.min(sel+1,cur.length-1);draw();e.preventDefault()}else if(e.key==="ArrowUp"){sel=Math.max(sel-1,0);draw();e.preventDefault()}else if(e.key==="Enter")run(sel)};
 ul.onclick=function(e){var l=e.target.closest("li[data-i]");if(l)run(+l.dataset.i)};o.addEventListener("mousedown",function(e){if(e.target===o)o.remove()});draw();inp.focus()}
document.addEventListener("keydown",function(e){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();palette()}});
})();
