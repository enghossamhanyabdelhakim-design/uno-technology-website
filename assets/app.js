/* Uno Technology Services - site engine. Content comes from assets/content.js (window.UNO). */
(function(){
"use strict";
var ICP={"device": "<rect x=\"3\" y=\"4\" width=\"18\" height=\"12\" rx=\"2\"/><path d=\"M8 20h8M12 16v4\"/>", "phone": "<rect x=\"7\" y=\"2\" width=\"10\" height=\"20\" rx=\"2.5\"/><path d=\"M11 18h2\"/>", "cam": "<path d=\"M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2zM15 11l6-3v8l-6-3\"/>", "globe": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M3 12h18M12 3c3 3.500 3 14.500 0 18M12 3c-3 3.500-3 14.500 0 18\"/>", "cart": "<path d=\"M3 4h2l2.500 11h10L20 8H6.500\"/><circle cx=\"9\" cy=\"19\" r=\"1.500\"/><circle cx=\"17\" cy=\"19\" r=\"1.500\"/>", "art": "<path d=\"M12 3a9 9 0 100 18c1.500 0 2-1 1.500-2s0-2 1.500-2h2a3 3 0 003-3c0-5-4-11-8-11z\"/><circle cx=\"8\" cy=\"11\" r=\"1\"/><circle cx=\"12\" cy=\"7.500\" r=\"1\"/><circle cx=\"16\" cy=\"11\" r=\"1\"/>", "print": "<path d=\"M7 9V3h10v6M7 17H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2\"/><rect x=\"7\" y=\"14\" width=\"10\" height=\"7\" rx=\"1\"/>", "cloud": "<path d=\"M7 18a4 4 0 01-.5-8A6 6 0 0118 11a3.500 3.500 0 01-.5 7z\"/>", "plug": "<path d=\"M9 3v5M15 3v5M6 8h12v3a6 6 0 01-12 0zM12 17v4\"/>", "wrench": "<path d=\"M14.500 6.500a4 4 0 005 5L21 13l-8 8a2.100 2.100 0 01-3-3l8-8zM14.500 6.500a4 4 0 00-5.500-4l3 3-2 2-3-3a4 4 0 005 5.500\"/>", "signal": "<path d=\"M5 12.500a10 10 0 0114 0M8 15.500a6 6 0 018 0M12 19h.01M2 9a14 14 0 0120 0\"/>", "building": "<path d=\"M4 21V4h10v17M14 9h6v12M2 21h20M8 8h2M8 12h2M8 16h2\"/>", "puzzle": "<path d=\"M10 4a2 2 0 114 0v2h4v4h-2a2 2 0 100 4h2v6H4v-6h2a2 2 0 100-4H4V6h6z\"/>", "disk": "<ellipse cx=\"12\" cy=\"6\" rx=\"8\" ry=\"3\"/><path d=\"M4 6v12c0 1.700 3.600 3 8 3s8-1.300 8-3V6M4 12c0 1.700 3.600 3 8 3s8-1.300 8-3\"/>", "bell": "<path d=\"M6 17V11a6 6 0 1112 0v6l2 2H4zM10 21h4\"/>", "lock": "<rect x=\"5\" y=\"11\" width=\"14\" height=\"10\" rx=\"2\"/><path d=\"M8 11V8a4 4 0 118 0v3\"/>", "doc": "<path d=\"M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6\"/>", "chat": "<path d=\"M4 4h16v12H9l-5 5z\"/>"},ICM={"💻": "device", "🖥": "device", "📱": "phone", "📹": "cam", "🌐": "globe", "🛒": "cart", "🎨": "art", "🖨": "print", "☁": "cloud", "🔌": "plug", "🔧": "wrench", "📡": "signal", "📶": "signal", "🏢": "building", "🧩": "puzzle", "💽": "disk", "💾": "disk", "🔔": "bell", "🚨": "bell", "🔐": "lock", "📝": "doc", "🔋": "plug", "🛠": "wrench"};
function ico(e){var k=ICM[String(e||"").replace(/\uFE0F/g,"")]||"puzzle";return '<svg class="svg-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICP[k]+"</svg>"}

var D=window.UNO, C=D, PREVIEW=false;
try{ if(/[?&]preview=1/.test(location.search)){var d=localStorage.getItem("uno_draft"); if(d){C=JSON.parse(d);PREVIEW=true;}} }catch(e){}
window.UNO_C=C;
var h=document.documentElement;
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function B(o,raw){ if(o==null)return ""; if(typeof o==="string")return raw?o:esc(o); var a=o.ar||"",e=o.en||"";
  return '<span class="ar">'+(raw?a:esc(a))+'</span><span class="en">'+(raw?e:esc(e))+'</span>'; }
function L(o){ if(typeof o==="string")return o; return (h.lang==="en"?o.en:o.ar)||o.ar||o.en||""; }
function U(p){ return esc(p||""); }
window.UNO_B=B;

/* ---------- theme colors ---------- */
function hex2rgb(x){x=x.replace("#","");if(x.length===3)x=x.replace(/./g,"$&$&");return [0,2,4].map(function(i){return parseInt(x.substr(i,2),16)})}
function rgb2hex(a){return "#"+a.map(function(v){v=Math.max(0,Math.min(255,Math.round(v)));return (v<16?"0":"")+v.toString(16)}).join("")}
function mix(a,b,t){return a.map(function(v,i){return v*(1-t)+b[i]*t})}
function applyTheme(){
  var p=(C.theme&&C.theme.primary)||"#F65A00", r=hex2rgb(p), s=document.documentElement.style;
  s.setProperty("--o",p); s.setProperty("--od-l",rgb2hex(mix(r,[0,0,0],.22)));
  s.setProperty("--ol-l",rgb2hex(mix(r,[255,255,255],.9))); s.setProperty("--ol-d",rgb2hex(mix(r,[20,23,27],.85)));
  s.setProperty("--od-d",rgb2hex(mix(r,[255,255,255],.25)));
}
applyTheme();

/* ---------- lang / theme state ---------- */
function setLang(l){h.lang=l;h.dir=l==="ar"?"rtl":"ltr";try{localStorage.setItem("lang",l)}catch(e){}; document.title=L(C.site.title); }
function setTheme(t){h.dataset.theme=t;var b=$("#theme");if(b)b.textContent=t==="dark"?"\u2600\uFE0E":"\u263E";try{localStorage.setItem("theme",t)}catch(e){}}
var q=(/#en\b/.test(location.hash)||/[?&]lang=en/.test(location.search))?"en":(/[?&]lang=ar/.test(location.search)?"ar":null), sl=null, st=null;
try{sl=localStorage.getItem("lang");st=localStorage.getItem("theme")}catch(e){}try{if(localStorage.getItem("theme_v")!=="2"){st=null;localStorage.setItem("theme_v","2")}}catch(e){}

/* ---------- shell ---------- */
var PAGE=document.body.dataset.page||"home";
function socials(cls){return (C.social||[]).filter(function(s){return s.url}).map(function(s){return '<a class="'+cls+'" href="'+U(s.url)+'" target="_blank" rel="noopener">'+esc(s.name)+'</a>'}).join("")}
function header(){
  var N=C.nav, link=function(href,k,pg){return '<a href="'+href+'"'+(PAGE===pg?' class="act"':'')+'>'+B(N[k])+'</a>'};
  return '<header><div class="wrap nav"><a href="index.html" aria-label="Home"><img src="'+U(C.images.logoHeader)+'" alt="'+U(C.site.name.en)+'"></a><nav>'+
  link("index.html","about","home_")+link("index.html#services","services","x")+link("tools.html","tools","tools")+'<a href="store.html"'+(PAGE==="store"?' class="act"':"")+'>'+B({ar:"المتجر",en:"Store"})+"</a>"+link("blog.html","blog","blog")+link("index.html#contact","contact","x")+
  '</nav><div class="tools"><a class="hcta" href="index.html#request">'+B({ar:"ابدأ مشروعك",en:"Start a project"})+'</a><a class="icb" href="account.html" id="acct" aria-label="My account / حسابي"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg></a><button class="icb" id="theme" type="button" aria-label="Dark mode">\u263E</button><button class="lang" id="lang" type="button" aria-label="Language / اللغة"><span class="ar">English</span><span class="en">\u0627\u0644\u0639\u0631\u0628\u064A\u0629</span></button><button class="icb" id="menu" type="button" aria-label="Menu">\u2630</button></div></div></header>';
}
function footer(){
  var k=C.contact||{},L2=function(h,t){return '<a href="'+h+'">'+B(t)+'</a>'};
  var ct=[];if(k.phone)ct.push('<a href="tel:'+U(intl(k.phone))+'" dir="ltr">'+esc(k.phone)+'</a>');if(k.whatsapp)ct.push('<a href="https://wa.me/'+U(intl(k.whatsapp).replace("+",""))+'" target="_blank" rel="noopener">WhatsApp</a>');if(k.email)ct.push('<a href="mailto:'+U(k.email)+'" dir="ltr">'+esc(k.email)+'</a>');if(k.address&&(k.address.ar||k.address.en))ct.push('<div class="addr">'+B(k.address)+'</div>');
  var sv=(C.services||[]).slice(0,7).map(function(x){return '<a href="index.html#services">'+B(x.t)+'</a>'}).join("");
  var cta='<div class="fcta"><div class="wrap"><div class="fcta-in"><img src="assets/pose-support.jpg" alt="" width="84" height="84" loading="lazy"><div class="fcta-t"><b>'+B({ar:"عندك مشروع أو محتاج مساعدة تقنية؟",en:"Have a project or need tech help?"})+'</b><span>'+B({ar:"كلمنا ونرد عليك في أقرب وقت.",en:"Talk to us and we will get back to you."})+'</span></div><div class="fcta-b"><a class="btn" href="index.html#request">'+B({ar:"ابدأ مشروعك",en:"Start your project"})+'</a>'+(k.whatsapp?'<a class="btn ghost" href="https://wa.me/'+U(intl(k.whatsapp).replace("+",""))+'" target="_blank" rel="noopener">WhatsApp</a>':"")+(k.phone?'<a class="btn ghost" href="tel:'+U(intl(k.phone))+'">'+B({ar:"اتصل بنا",en:"Call us"})+'</a>':"")+'</div></div></div></div>';
  return cta+'<footer class="ft"><div class="wrap"><div class="fcols"><div class="fb"><img src="'+U(C.images.logoMark)+'" alt="" width="56" height="56"><p>'+B(C.footer.text)+'</p><div class="fsoc">'+socials("fl")+'</div></div>'+
   '<div><h4>'+B({ar:"خدماتنا",en:"Services"})+'</h4>'+sv+'</div>'+
   '<div><h4>'+B({ar:"الموقع",en:"Site"})+'</h4>'+L2("index.html",{ar:"الرئيسية",en:"Home"})+L2("store.html",{ar:"المتجر",en:"Store"})+L2("tools.html",{ar:"أدوات",en:"Tools"})+L2("blog.html",{ar:"المدونة",en:"Blog"})+L2("account.html",{ar:"حسابي",en:"My account"})+L2("privacy.html",{ar:"سياسة الخصوصية",en:"Privacy policy"})+'</div>'+
   '<div><h4>'+B({ar:"تواصل معنا",en:"Contact"})+'</h4>'+ct.join("")+'</div></div>'+
   '<div class="fbar"><span>\u00A9 <span id="yr"></span> '+B(C.site.name)+'</span><button type="button" class="totop" id="totop">'+B({ar:"للأعلى",en:"Back to top"})+' \u2191</button></div></div></footer>';
}
function shell(){
  var main=$("#app"); document.body.insertAdjacentHTML("afterbegin",header()); document.body.insertAdjacentHTML("beforeend",footer());
  $("#yr").textContent=new Date().getFullYear();$("#totop").onclick=function(){window.scrollTo({top:0,behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth"})};
  (function(){
    var I={home:'<path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>',svc:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',store:'<path d="M3 4h2l2.5 11h10L20 8H6.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',tools:'<path d="M14.5 6.5a4 4 0 005 5L21 13l-8 8a2.1 2.1 0 01-3-3l8-8zM14.5 6.5a4 4 0 00-5.500-4l3 3-2 2-3-3a4 4 0 005 5.500"/>',contact:'<path d="M4 4h16v12H9l-5 5z"/>'};
    var T=[["home","index.html",{ar:"الرئيسية",en:"Home"},"home"],["svc","index.html#services",{ar:"خدماتنا",en:"Services"},"services"],["store","store.html",{ar:"المتجر",en:"Store"},"store"],["tools","tools.html",{ar:"أدوات",en:"Tools"},"tools"],["contact","index.html#contact",{ar:"تواصل",en:"Contact"},"contact"]];
    var cur=PAGE==="home"?"home":PAGE==="store"?"store":PAGE==="tools"?"tools":PAGE==="blog"?"":"";
    document.body.insertAdjacentHTML("beforeend",'<nav class="mbar" aria-label="App navigation">'+T.map(function(t){return '<a href="'+t[1]+'" data-k="'+t[3]+'"'+(cur===t[3]?' class="on" aria-current="page"':'')+'><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+I[t[0]]+'</svg><span>'+B(t[2])+'</span></a>'}).join("")+'</nav>');
    if(PAGE==="home"&&"IntersectionObserver" in window){var bar=$(".mbar"),mark=function(k){bar.querySelectorAll("a").forEach(function(a){var on=a.dataset.k===k;a.classList.toggle("on",on);if(on)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")})};
      var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)mark(e.target.id==="services"?"services":e.target.id==="contact"?"contact":"home")})},{rootMargin:"-45% 0px -50% 0px"});
      ["services","contact","about","how","faq","request","founder"].forEach(function(id){var el=document.getElementById(id);if(el){if(id==="services"||id==="contact")io.observe(el);else{var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)mark("home")})},{rootMargin:"-45% 0px -50% 0px"});o.observe(el)}}});
      var h=document.querySelector(".hero");if(h){var o2=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)mark("home")})},{rootMargin:"-30% 0px -60% 0px"});o2.observe(h)}}
  })();
  if("serviceWorker" in navigator&&location.protocol.indexOf("http")===0){try{navigator.serviceWorker.register("sw.js")}catch(e){}}
  if(PREVIEW)document.body.insertAdjacentHTML("afterbegin",'<div class="pvbar">Preview: unpublished draft from the admin panel</div>');
}

/* ---------- contact helpers ---------- */
function phoneDigits(p){return (p||"").replace(/[^\d+]/g,"")}
function intl(p){var d=phoneDigits(p);if(d[0]==="+")return d;if(d.indexOf("00")===0)return "+"+d.slice(2);if(d[0]==="0")return "+20"+d.slice(1);return "+"+d}
function contactItems(){
  var k=C.contact,o=[];
  if(k.phone)o.push('<div class="ci">\uD83D\uDCDE <a href="tel:'+U(intl(k.phone))+'" dir="ltr">'+esc(k.phone)+'</a></div>');
  if(k.whatsapp)o.push('<div class="ci">\uD83D\uDCAC <a href="https://wa.me/'+U(intl(k.whatsapp).replace("+",""))+'" target="_blank" rel="noopener" dir="ltr">WhatsApp</a></div>');
  if(k.email)o.push('<div class="ci">\u2709\uFE0F <a href="mailto:'+U(k.email)+'" dir="ltr">'+esc(k.email)+'</a></div>');
  if(k.address&&(k.address.ar||k.address.en))o.push('<div class="ci">\uD83D\uDCCD '+B(k.address)+'</div>');
  return o.join("");
}
function ctaBtn(){var k=C.contact; if(k.whatsapp)return 'https://wa.me/'+intl(k.whatsapp).replace("+",""); if(k.phone)return 'tel:'+intl(k.phone); return "index.html#contact"}

/* ---------- home ---------- */
function rtime(p){var t=String((p.body&&(p.body.en||p.body.ar))||"").replace(/<[^>]+>/g," ");var w=t.split(/\s+/).filter(Boolean).length;return Math.max(1,Math.round(w/200))}
function rtB(p){var m=rtime(p);return B({ar:m+" دقيقة قراءة",en:m+" min read"})}
function postCard(p){
  var cat=(C.blog.cats.filter(function(c){return c.id===p.cat})[0])||{};
  return '<a class="pc rv" href="blog.html#'+U(p.slug)+'">'+(p.img?'<img src="'+U(p.img)+'" alt="" loading="lazy">':'<div class="pci">'+ico(p.icon||"\uD83D\uDCDD")+'</div>')+
   '<div class="pcb"><small>'+B(cat.t||"")+' <i class="rtm">\u00B7 '+rtB(p)+'</i></small><h3>'+B(p.title)+'</h3><p>'+B(p.summary)+'</p><span class="more">'+B(C.blog.readMore)+' \u2192</span></div></a>';
}
function home(){
  var S=C.site, x=C.sections, o='';
  var chips=(C.hero2&&C.hero2.chips||[]).map(function(c,i){return '<span class="fx-chip fc'+i+'">'+B(c)+'</span>'}).join("");
  o+='<div class="hero"><div class="hero-fx" aria-hidden="true"><i class="grid"></i><i class="glow g1"></i><i class="glow g2"></i><i class="scan"></i></div><div class="wrap hg"><div class="ht"><span class="tag">'+B(S.name)+'</span><h1>'+B(S.heroTitle,true)+'</h1><p>'+B(S.heroText)+'</p><div class="btns"><a class="btn" href="#request">'+B(S.heroBtn1)+'</a><a class="btn alt" href="#services">'+B(S.heroBtn2)+'</a></div></div>'+
   '<div class="heroimg"><div class="hs" id="hs" role="region" aria-roledescription="carousel" aria-label="Uno"><div class="hs-track" id="hs-track">'+(C.banners||[]).filter(function(b){return b&&b.title}).map(function(b,i){return '<a class="hs-s c'+(i%4)+'" href="'+U(b.link)+'"><div class="hs-t"><small>'+B(b.tag)+'</small><b>'+B(b.title)+'</b><span>'+B(b.text)+'</span><i class="hs-b">'+B(b.btn)+'</i></div>'+(b.img?'<div class="hs-i"><img src="'+U(b.img)+'" alt="" width="200" height="200"'+''+'></div>':'')+'</a>'}).join("")+'</div><button class="hs-n hs-p" type="button" aria-label="Previous"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button class="hs-n hs-x" type="button" aria-label="Next"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="hs-d" id="hs-d"></div></div></div></div>'+'</div>';
  o+='<section id="offers" class="offers" hidden><div class="wrap"><h2>'+B({ar:'العروض والخصومات',en:'Offers and discounts'})+'</h2><p class="sub">'+B({ar:'المنتجات اللي عليها خصم دلوقتي من المتجر.',en:'Products currently discounted in the store.'})+'</p><div class="ogrid" id="ogrid"></div><p class="ohint"><a class="btn alt" href="store.html">'+B({ar:'شوف كل المتجر',en:'See the whole store'})+'</a></p></div></section>';
  o+='<section id="about"><div class="wrap"><h2>'+B(x.about.t)+'</h2><div class="about"><img src="'+U(C.images.about)+'" alt=""><div><p>'+B(S.about1)+'</p><p>'+B(S.about2)+'</p></div></div><div class="why">'+
   C.why.map(function(w){return '<div class="rv">'+(w.img?'<img class="pose" src="'+U(w.img)+'" alt="" loading="lazy">':'')+'<b>'+B(w.t)+'</b>'+B(w.d)+'</div>'}).join("")+'</div></div></section>';
  if(C.founder){var F0=C.founder;o+='<section id="founder"><div class="wrap"><h2>'+B(x.founder)+'</h2><div class="fcard rv"><img src="'+U(F0.img)+'" alt="'+U(F0.name.en)+'" width="220" height="275" loading="lazy"><div><h3>'+B(F0.name)+'</h3><b class="frole">'+B(F0.role)+'</b><p>'+B(F0.cap)+'</p></div></div></div></section>';}
  o+='<section class="alt-bg"><div class="wrap"><div class="bans">'+C.banners.map(function(b,i){return '<a class="ban rv b'+(i%4)+'" href="'+U(b.link)+'"><div class="bt"><small>'+B(b.tag)+'</small><b>'+B(b.title)+'</b><span>'+B(b.text)+'</span><i class="bb">'+B(b.btn)+'</i></div>'+(b.img?'<img src="'+U(b.img)+'" alt="" loading="lazy">':'')+'</a>'}).join("")+'</div></div></section>';
  var cats=C.serviceCats;
  o+='<section id="services"><div class="wrap"><h2>'+B(x.services.t)+'</h2><p class="sub">'+B(x.services.d)+'</p><div class="chips" id="chips"><button class="chip on" data-f="all">'+B(C.serviceAll)+'</button>'+cats.map(function(c){return '<button class="chip" data-f="'+U(c.id)+'">'+B(c.t)+'</button>'}).join("")+'</div><div class="grid">'+
   C.services.map(function(s,si){var DS=["software","networking","security","computer-it","pos","design","printing","cloud","electronics","marketing","support","telecom","business-tech"];return '<article class="card rv sc" data-c="'+U(s.cat)+'"><div class="sci"><img src="assets/svc-'+DS[si]+'.webp" alt="" loading="lazy" width="600" height="400"></div><div class="ic">'+(s.img?'<img src="'+U(s.img)+'" alt="">':ico(s.icon))+'</div><h3>'+B(s.t)+'</h3><ul>'+s.items.map(function(i){return '<li>'+B(i)+'</li>'}).join("")+'</ul></article>'}).join("")+'</div></div></section>';
  o+='<section class="strips"><div class="wrap">'+[['software',{ar:'برمجيات وحلول رقمية',en:'Software and digital solutions'}],['security',{ar:'كاميرات مراقبة وأمن',en:'CCTV and security'}],['pos',{ar:'نقاط بيع وإدارة أعمال',en:'POS and business systems'}],['print',{ar:'تصميم وطباعة وإعلان',en:'Design, printing and advertising'}]].map(function(b){return '<a class="strip rv" href="#request"><img src="assets/bn-'+b[0]+'.webp" alt="'+U(L(b[1]))+'" width="1600" height="400" loading="lazy"></a>'}).join('')+'</div></div></section>';
  o+='<section class="alt-bg"><div class="wrap"><h2>'+B(x.tools.t)+'</h2><p class="sub">'+B(x.tools.d)+'</p><div class="grid">'+C.toolCards.map(function(t){return '<a class="card tcard rv" href="'+U(t.link)+'"><div class="ic">'+ico(t.icon)+'</div><h3>'+B(t.t)+'</h3><p>'+B(t.d)+'</p><span class="more">'+B(t.btn)+' \u2192</span></a>'}).join("")+'</div></div></section>';
  o+='<section><div class="wrap"><h2>'+B(x.mascot.t)+'</h2><p class="sub">'+B(x.mascot.d)+'</p><div class="mas"><div class="poses">'+C.poses.map(function(p){return '<img class="pose" style="width:120px;height:120px" src="'+U(p)+'" alt="" loading="lazy">'}).join("")+'</div></div></div></section>';
  normPort();o+='<section id="portfolio" class="alt-bg"><div class="wrap"><h2>'+B(x.portfolio.t)+'</h2><p class="sub">'+B(x.portfolio.d)+'</p><div class="pgrid">'+C.portfolio.map(function(p){return '<a class="pcard rv" href="#project/'+U(p.slug||"")+'" data-slug="'+U(p.slug||"")+'"><div class="pimg">'+(p.img?'<img src="'+U(p.img)+'" alt="" loading="lazy"><em class="smp">'+B(C.portfolioSample||{ar:"",en:""})+'</em>':'<span>'+ico(p.icon)+'</span><small>'+B(C.portfolioSoon)+'</small>')+'</div><h3>'+B(p.t)+'</h3>'+(p.d&&(p.d.ar||p.d.en)?'<p class="pd">'+B(p.d)+'</p>':'')+'<span class="pmore">'+B({ar:"التفاصيل",en:"View details"})+'</span></a>'}).join("")+'</div></div></section>';
  var posts=C.blog.posts.filter(function(p){return p.published!==false}).slice(0,3);
  o+='<section><div class="wrap"><h2>'+B(x.blog.t)+'</h2><p class="sub">'+B(x.blog.d)+'</p><div class="pgrid3">'+posts.map(postCard).join("")+'</div><p style="text-align:center;margin-top:24px"><a class="btn" href="blog.html">'+B(C.blog.all)+'</a></p></div></section>';
  var HW=C.how||{steps:[]};
  o+='<section id="how"><div class="wrap"><h2>'+B(x.how.t||x.how)+'</h2><p class="sub">'+B(HW.d)+'</p><ol class="steps">'+HW.steps.map(function(st,i){return '<li class="rv"><b class="n">'+(i+1)+'</b><h3>'+B(st.t)+'</h3><p>'+B(st.d)+'</p></li>'}).join("")+'</ol></div></section>';
  o+='<section class="alt-bg" id="faq"><div class="wrap"><h2>'+B(x.faq.t||x.faq)+'</h2><div class="faq">'+(C.faq||[]).map(function(f){return '<details class="rv"><summary>'+B(f.q)+'</summary><p>'+B(f.a)+'</p></details>'}).join("")+'</div></div></section>';
  var F=C.form||{};
  o+='<section id="request"><div class="wrap"><h2>'+B(x.request.t||x.request)+'</h2><form id="rq" class="rq" novalidate><label>'+B(F.name)+'<input name="name" required maxlength="80" autocomplete="name"></label><label>'+B(F.phone)+'<input name="phone" required maxlength="30" inputmode="tel" dir="ltr" autocomplete="tel"></label><label>'+B(F.service)+'<select name="service">'+C.services.map(function(sv){return '<option value="'+U(sv.t.en)+'">'+B(sv.t)+'</option>'}).join("")+'<option value="Other">'+B(F.other)+'</option></select></label><label>'+B(F.msg)+'<textarea name="msg" rows="4" maxlength="800"></textarea></label><div class="btns"><button class="btn" type="submit">'+B(F.send)+'</button><a class="btn alt" id="rq-wa" target="_blank" rel="noopener" href="#">'+B(F.wa)+'</a></div><p id="rq-st" class="rq-st" role="status"></p></form></div></section>';
  o+='<section id="contact" class="alt-bg"><div class="wrap"><div class="cta"><h2>'+B(x.contact.t)+'</h2><p style="margin-top:14px">'+B(x.contact.d)+'</p><div class="cinfo">'+contactItems()+'</div><div class="soccs">'+socials("soc")+'</div></div></div></section>';
  $("#app").innerHTML=o;
  (function(){var cfg=window.UNO_CFG;if(!cfg||!cfg.url)return;fetch(cfg.url+"/rest/v1/products?select=id,name_ar,name_en,price,old_price,images,is_demo&active=eq.true&old_price=not.is.null&order=created_at.desc&limit=8",{headers:{apikey:cfg.key,Authorization:"Bearer "+cfg.key}}).then(function(r){return r.json()}).then(function(ps){ps=(ps||[]).filter(function(p){return p.old_price&&Number(p.old_price)>Number(p.price)});var sec=$("#offers");if(!ps.length||!sec)return;if(window.__hsAdd)window.__hsAdd('<a class="hs-s c9" href="#offers"><div class="hs-t"><small>'+B({ar:'عروض',en:'Offers'})+'</small><b>'+B({ar:'خصومات على منتجات من المتجر',en:'Discounts on store products'})+'</b><span>'+B({ar:'شوف المنتجات اللي عليها خصم دلوقتي',en:'See the products discounted right now'})+'</span><i class="hs-b">'+B({ar:'شوف العروض',en:'View offers'})+'</i></div></div>');
   $("#ogrid").innerHTML=ps.map(function(p){var pc=Math.round((1-p.price/p.old_price)*100),nm=h.lang==="en"?(p.name_en||p.name_ar):(p.name_ar||p.name_en),im=(p.images&&p.images[0])||"assets/pimg-acc.svg",cur=h.lang==="en"?"EGP":"ج.م",fm=function(n){return Number(n).toLocaleString(h.lang==="en"?"en-US":"ar-EG")+" "+cur};
    return '<a class="oc" href="store.html"><span class="ob">-'+pc+'%</span>'+(p.is_demo?'<span class="od">'+B({ar:"تجريبي",en:"Demo"})+'</span>':"")+'<img loading="lazy" alt="" src="'+U(im)+'"><b>'+esc(nm)+'</b><span class="op">'+fm(p.price)+'<s>'+fm(p.old_price)+'</s></span></a>'}).join("");sec.hidden=false}).catch(function(){})})();
  $$(".chip").forEach(function(c){c.onclick=function(){$$(".chip").forEach(function(y){y.classList.remove("on")});c.classList.add("on");var f=c.dataset.f;$$(".card[data-c]").forEach(function(k){k.style.display=(f==="all"||k.dataset.c===f)?"":"none"})}});
  (function(){var f=$("#rq");if(!f)return;var cfg=window.UNO_CFG,k=C.contact;
    function txt(){var d=new FormData(f);return L(F.wamsg)+" "+d.get("service")+(d.get("msg")?"\n"+d.get("msg"):"")+"\n"+(d.get("name")||"")+" "+(d.get("phone")||"")}
    function wa(){var n=intl(k.whatsapp||k.phone).replace("+","");return "https://wa.me/"+n+"?text="+encodeURIComponent(txt())}
    var a=$("#rq-wa");a.onclick=function(){a.href=wa()};
    f.onsubmit=function(e){e.preventDefault();var st=$("#rq-st"),d=new FormData(f);if(!d.get("name").trim()||!d.get("phone").trim()){st.textContent=L({ar:"اكتب الاسم ورقم التليفون.",en:"Please enter your name and phone."});return}
      st.textContent="...";
      fetch(cfg.url+"/rest/v1/requests",{method:"POST",headers:{apikey:cfg.key,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({name:d.get("name").trim(),phone:d.get("phone").trim(),service:d.get("service"),message:(d.get("msg")||"").trim(),lang:h.lang})}).then(function(r){if(!r.ok)throw 0;st.textContent=L(F.ok);f.reset()}).catch(function(){st.textContent=L(F.err)})}})();
  $$(".card[data-c] h3").forEach(function(hh){if(hh.querySelector("button"))return;hh.innerHTML='<button type="button" class="h3b" aria-expanded="false">'+hh.innerHTML+"</button>";var bt=hh.firstChild;bt.onclick=function(){var c=hh.parentNode;c.classList.toggle("open");bt.setAttribute("aria-expanded",c.classList.contains("open"))}});
  (function(){var tr=document.getElementById("hs-track");if(!tr)return;var d=document.getElementById("hs-d"),cur=0,tm=0,mo=window.matchMedia("(prefers-reduced-motion:reduce)").matches;
 function sl(){return tr.querySelectorAll(".hs-s")}
 function dots(){var n=sl().length;d.innerHTML="";for(var i=0;i<n;i++){var b=document.createElement("button");b.type="button";b.setAttribute("aria-label",(i+1)+"/"+n);b.onclick=(function(i){return function(){go(i,true)}})(i);d.appendChild(b)}mark()}
 function mark(){var k=d.children;for(var i=0;i<k.length;i++)k[i].className=i===cur?"on":""}
 function go(i,u){var n=sl().length;if(!n)return;cur=(i+n)%n;var el=sl()[cur];tr.scrollTo({left:el.offsetLeft-tr.offsetLeft,behavior:mo?"auto":"smooth"});mark();if(u)rs()}
 function rs(){clearInterval(tm);if(!mo)tm=setInterval(function(){go(cur+1)},5500)}
 tr.addEventListener("scroll",function(){var w=tr.clientWidth,n=sl().length;if(!w||!n)return;var i=Math.round(Math.abs(tr.scrollLeft)/w);if(i!==cur&&i<n){cur=i;mark()}},{passive:true});
 document.querySelector(".hs-p").onclick=function(){go(cur-1,true)};document.querySelector(".hs-x").onclick=function(){go(cur+1,true)};
 var hs=document.getElementById("hs");hs.addEventListener("mouseenter",function(){clearInterval(tm)});hs.addEventListener("mouseleave",rs);hs.addEventListener("touchstart",function(){clearInterval(tm)},{passive:true});
 window.__hsAdd=function(html){tr.insertAdjacentHTML("afterbegin",html);cur=0;tr.style.scrollBehavior="auto";tr.scrollLeft=0;tr.style.scrollBehavior="";dots();rs()};window.addEventListener("resize",function(){tr.style.scrollBehavior="auto";var el=sl()[cur];if(el)tr.scrollLeft=el.offsetLeft-tr.offsetLeft;tr.style.scrollBehavior=""});dots();rs()})();
}

/* ---------- blog ---------- */
function blog(){
  var P=C.blog.posts.filter(function(p){return p.published!==false}), cats=C.blog.cats;
  var slug=decodeURIComponent((location.hash||"").replace("#","")), post=P.filter(function(p){return p.slug===slug})[0];
  if(post){
    var cat=cats.filter(function(c){return c.id===post.cat})[0]||{};
    var rel=P.filter(function(p){return p.slug!==post.slug&&p.cat===post.cat}).concat(P.filter(function(p){return p.slug!==post.slug&&p.cat!==post.cat})).slice(0,3);
    $("#app").innerHTML='<section><div class="wrap art"><a class="back" href="blog.html">\u2190 '+B(C.blog.back)+'</a><div id="rdp"></div><small class="catl">'+B(cat.t||"")+'</small><h1>'+B(post.title)+'</h1><div class="ameta">'+rtB(post)+' <span>\u00B7</span> <a class="shr" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(L(post.title)+" "+location.href)+'">'+B({ar:"مشاركة على واتساب",en:"Share on WhatsApp"})+'</a> <button type="button" class="shr" id="cpl">'+B({ar:"نسخ الرابط",en:"Copy link"})+'</button></div>'+(post.img?'<img class="aimg" src="'+U(post.img)+'" alt="">':'')+'<div class="abody">'+B(post.body,true)+'</div><div class="acta"><b>'+B(C.blog.help)+'</b> <a class="btn" href="'+U(ctaBtn())+'">'+B(C.blog.contactBtn)+'</a> <button class="btn alt" type="button" id="askart">'+B(C.blog.askUno)+'</button></div><h2 style="margin-top:50px">'+B(C.blog.related)+'</h2><div class="pgrid3">'+rel.map(postCard).join("")+'</div></div></section>';
    document.title=L(post.title)+" | "+L(C.site.name);
    $("#askart").onclick=function(){openChat(true,L(post.title))};
    window.scrollTo(0,0);
    $("#cpl").onclick=function(){try{navigator.clipboard.writeText(location.href);this.textContent="\u2713"}catch(e){}};
    if(!window.__rdp){window.__rdp=1;window.addEventListener("scroll",function(){var b=document.getElementById("rdp");if(!b)return;var h=document.documentElement,m=h.scrollHeight-h.clientHeight;b.style.width=(m>0?Math.min(100,h.scrollTop/m*100):0)+"%"},{passive:true})}
  }else{
    document.title=L(C.sections.blog.t)+" | "+L(C.site.name);
    $("#app").innerHTML='<div class="sthero"><div class="wrap"><div class="sth-in"><div><span class="sth-k">'+B({ar:"مدونة أونو",en:"Uno Blog"})+'</span><h1>'+B(C.sections.blog.t)+'</h1><p>'+B(C.sections.blog.d)+'</p><ul class="sth-t"><li>'+P.length+' '+B({ar:"مقال",en:"articles"})+'</li><li>'+B({ar:"عربي وإنجليزي",en:"Arabic and English"})+'</li></ul></div></div></div></div><section><div class="wrap"><div class="bsearch"><input id="bq" type="search" placeholder="'+U(L(C.blog.search))+'"></div><div class="chips" id="bchips"><button class="chip on" data-f="all">'+B(C.serviceAll)+'</button>'+cats.map(function(c){return '<button class="chip" data-f="'+U(c.id)+'">'+B(c.t)+'</button>'}).join("")+'</div><div class="pgrid3" id="plist"></div></div></section>';
    var f="all",qq="";
    function draw(){
      var n=norm(qq), list=P.filter(function(p){return (f==="all"||p.cat===f)&&(!n||norm(L(p.title)+" "+L(p.summary)+" "+(p.kw||"")).indexOf(n)>-1||norm(p.title.ar+" "+p.title.en+" "+p.summary.ar+" "+p.summary.en+" "+(p.kw||"")).indexOf(n)>-1)});
      var ft=(f==="all"&&!n&&list.length>3)?list[0]:null,cat0=ft?(cats.filter(function(c){return c.id===ft.cat})[0]||{}):{};
      $("#plist").innerHTML=list.length?((ft?'<a class="feat" href="blog.html#'+U(ft.slug)+'">'+(ft.img?'<img src="'+U(ft.img)+'" alt="">':'<div class="pci">'+ico(ft.icon||"\uD83D\uDCDD")+'</div>')+'<div class="fb"><small>'+B({ar:"مقال مميز",en:"Featured"})+' \u00B7 '+B(cat0.t||"")+' \u00B7 '+rtB(ft)+'</small><h3>'+B(ft.title)+'</h3><p>'+B(ft.summary)+'</p><span class="more">'+B(C.blog.readMore)+' \u2192</span></div></a>':"")+(ft?list.slice(1):list).map(postCard).join("")):'<p class="sub">'+B(C.blog.none)+'</p>';
      $$(".rv").forEach(function(x){x.classList.add("in")});
    }
    $$("#bchips .chip").forEach(function(c){c.onclick=function(){$$("#bchips .chip").forEach(function(y){y.classList.remove("on")});c.classList.add("on");f=c.dataset.f;draw()}});
    $("#bq").oninput=function(){qq=this.value;draw()}; draw();
  }
}
window.addEventListener("hashchange",function(){if(PAGE==="blog"){blog();reveal()}});

/* ---------- tools ---------- */
function opts(arr,sel){return arr.map(function(o){var t=o[1].ar===o[1].en?o[1].en:o[1].ar+" / "+o[1].en;return '<option value="'+o[0]+'"'+(o[0]===sel?' selected':'')+'>'+esc(t)+'</option>'}).join("")}
function fld(id,lab,optsHtml){return '<label class="fld"><span>'+lab+'</span><select id="'+id+'">'+optsHtml+'</select></label>'}
function bi(a,e){return {ar:a,en:e}}
var T={};
T.pc={
 form:function(){return fld("pc-type",B(bi("نوع الجهاز","Device type")),opts([["laptop",bi("لابتوب","Laptop")],["desktop",bi("كمبيوتر مكتبي (PC)","Desktop PC")]],"laptop"))+
  fld("pc-use",B(bi("الاستخدام الأساسي","Main use")),opts([["office",bi("مذاكرة ومكتب وإنترنت","Study, office, browsing")],["dev",bi("برمجة","Programming")],["design",bi("تصميم وفيديو ومونتاج","Design and video editing")],["gaming",bi("ألعاب","Gaming")],["pos",bi("كاشير ومحل","Shop / POS use")]],"office"))+
  fld("pc-tier",B(bi("مستوى الميزانية","Budget level")),opts([["low",bi("اقتصادي","Economy")],["mid",bi("متوسط","Mid-range")],["high",bi("عالي","High-end")]],"mid"))+
  fld("pc-multi",B(bi("بتفتح برامج وتابات كتير مع بعض؟","Many apps and tabs at once?")),opts([["no",bi("لا","No")],["yes",bi("أيوه","Yes")]],"no"))+
  fld("pc-store",B(bi("حجم الملفات والتخزين","Storage need")),opts([["s",bi("قليل","Light")],["m",bi("متوسط","Medium")],["l",bi("كبير (فيديو وصور وألعاب)","Large (video, photos, games)")]],"m"))+
  fld("pc-move",B(bi("بتتحرك بالجهاز كتير؟ (للابتوب)","Do you carry it a lot? (laptop)")),opts([["no",bi("لا","No")],["yes",bi("أيوه، محتاج خفيف وبطارية كويسة","Yes, light with good battery")]],"no"))},
 calc:function(v){
  var u=v["pc-use"],t=v["pc-tier"],mu=v["pc-multi"]==="yes",s=v["pc-store"],lap=v["pc-type"]==="laptop",mv=v["pc-move"]==="yes";
  var base={office:{cpu:["Intel Core i3 / AMD Ryzen 3 class","Intel Core i5 / AMD Ryzen 5 class","Intel Core i7 / AMD Ryzen 7 class"],ram:[8,16,16],gpu:["Integrated graphics","Integrated graphics","Integrated graphics"]},
   pos:{cpu:["Intel Core i3 / AMD Ryzen 3 class","Intel Core i3 / AMD Ryzen 3 class or better","Intel Core i5 / AMD Ryzen 5 class"],ram:[8,8,16],gpu:["Integrated graphics","Integrated graphics","Integrated graphics"]},
   dev:{cpu:["Intel Core i5 / AMD Ryzen 5 class","Intel Core i5 / AMD Ryzen 5 class or better","Intel Core i7 / AMD Ryzen 7 class"],ram:[16,16,32],gpu:["Integrated graphics","Integrated graphics","Integrated or entry dedicated graphics"]},
   design:{cpu:["Intel Core i5 / AMD Ryzen 5 class (newer generation)","Intel Core i7 / AMD Ryzen 7 class","Intel Core i7-i9 / AMD Ryzen 7-9 class"],ram:[16,32,64],gpu:["Entry dedicated graphics (about 4 GB video memory)","Mid dedicated graphics (about 8 GB video memory)","High dedicated graphics (12 GB video memory or more)"]},
   gaming:{cpu:["Intel Core i5 / AMD Ryzen 5 class","Intel Core i5-i7 / AMD Ryzen 5-7 class","Intel Core i7-i9 / AMD Ryzen 7-9 class"],ram:[16,16,32],gpu:["Entry dedicated graphics (about 4-6 GB video memory)","Mid dedicated graphics (about 8 GB video memory)","High-end dedicated graphics (12 GB video memory or more)"]}}[u];
  var i=t==="low"?0:t==="mid"?1:2, ram=base.ram[i]; if(mu&&ram<16)ram=16; if(mu&&u==="dev"&&ram<32&&t==="high")ram=32;
  var st=s==="s"?"256-512 GB SSD":s==="m"?"512 GB-1 TB SSD":"1-2 TB NVMe SSD (plus an external or second drive for archives)";
  if(u==="pos"&&s!=="l")st="256-512 GB SSD";
  var rows=[[bi("المعالج","Processor"),base.cpu[i]],[bi("الرام","Memory (RAM)"),ram+" GB"+(lap?" ("+(ram>=16?"check if upgradeable":"prefer upgradeable")+")":"")],[bi("التخزين","Storage"),st],[bi("كارت الشاشة","Graphics"),base.gpu[i]]];
  var notes=[bi("استخدم SSD دايمًا، مش هارد ميكانيكي كقرص النظام.","Always use an SSD as the system drive, not a mechanical hard drive.")];
  if(lap){rows.push([bi("الشاشة","Display"),u==="design"?"15-16\", FHD+ or higher, wide color coverage (sRGB 100% or better)":mv?"13-14\" for portability, FHD IPS":"14-15.6\", FHD IPS"]);
    if(mv)notes.push(bi("للتنقل: وزن خفيف وبطارية كبيرة، وراجع مراجعات عمر البطارية الحقيقية.","For travel: light weight and a big battery. Check real battery-life reviews."));
    if(u==="gaming"||u==="design")notes.push(bi("اللابتوب القوي بيسخن ووزنه أعلى. راجع التبريد والشاحن.","Powerful laptops run hot and weigh more. Check cooling and charger size."));}
  else{rows.push([bi("مصدر الطاقة","Power supply"),"Quality unit, 80 Plus rated, "+(u==="gaming"||u==="design"?"sized to the graphics card (650 W or more is typical for mid-high cards)":"450-550 W is typically enough")]);rows.push([bi("اللوحة الأم والتبريد","Motherboard and cooling"),"Chipset matching the CPU, good airflow case, decent CPU cooler"]);}
  if(u==="pos")notes.push(bi("للكاشير الاستقرار أهم من القوة. ضيف طابعة فواتير وقارئ باركود.","For POS, reliability matters more than power. Add a receipt printer and a barcode scanner."));
  notes.push(bi("دي مواصفات إرشادية عامة. الأسعار والموديلات المتاحة وقت الشراء بيحددها السوق، وفريقنا يرشح لك موديلات فعلية.","These are general guideline specs. Prices and models depend on the market at the time, and our team can suggest real models for you."));
  var sum="PC/Laptop request: "+(lap?"Laptop":"Desktop")+", use="+u+", budget="+t+" | "+rows.map(function(r){return r[0].en+": "+(typeof r[1]==="object"?r[1].en:r[1])}).join(" | ");
  return {rows:rows,notes:notes,sum:sum,title:bi("المواصفات المقترحة","Recommended specs")};}
};
T.phone={
 form:function(){return fld("ph-use",B(bi("الاستخدام الأساسي","Main use")),opts([["basic",bi("مكالمات وسوشيال ميديا وتصفح","Calls, social media, browsing")],["photo",bi("تصوير","Photography")],["gaming",bi("ألعاب","Gaming")],["work",bi("شغل وتطبيقات","Work and apps")],["senior",bi("لكبير السن أو للأطفال","For seniors or kids")]],"basic"))+
  fld("ph-tier",B(bi("مستوى الميزانية","Budget level")),opts([["low",bi("اقتصادي","Economy")],["mid",bi("متوسط","Mid-range")],["high",bi("عالي","High-end")]],"mid"))+
  fld("ph-prio",B(bi("أهم أولوية","Top priority")),opts([["battery",bi("البطارية","Battery")],["camera",bi("الكاميرا","Camera")],["perf",bi("الأداء","Performance")],["screen",bi("الشاشة","Screen")]],"battery"))+
  fld("ph-os",B(bi("نظام التشغيل","Operating system")),opts([["any",bi("أي نظام","No preference")],["android",bi("Android","Android")],["ios",bi("iPhone (iOS)","iPhone (iOS)")]],"any"))+
  fld("ph-store",B(bi("بتخزن صور وفيديوهات كتير؟","Lots of photos and videos?")),opts([["no",bi("لا","No")],["yes",bi("أيوه","Yes")]],"no"))},
 calc:function(v){
  var u=v["ph-use"],t=v["ph-tier"],p=v["ph-prio"],os=v["ph-os"],big=v["ph-store"]==="yes",i=t==="low"?0:t==="mid"?1:2;
  var ram=[4,6,8][i],ch=["Entry-level chipset","Mid-range chipset","Flagship-class chipset"][i];
  if(u==="gaming"||p==="perf"){ram=[6,8,12][i];ch=["Gaming-oriented mid-range chipset (check benchmarks)","Upper mid-range chipset","Flagship-class chipset"][i];}
  if(u==="work")ram=Math.max(ram,6);
  var stor=big?["128-256 GB","256-512 GB","512 GB-1 TB"][i]:["64-128 GB","128-256 GB","256-512 GB"][i];
  if(u==="photo"&&!big)stor=["128 GB","256 GB","256-512 GB"][i];
  var scr=p==="screen"||u==="gaming"?["IPS LCD, 90 Hz","AMOLED, 90-120 Hz","LTPO/AMOLED, 120 Hz, high peak brightness"][i]:["IPS LCD, 60-90 Hz","AMOLED, 90 Hz","AMOLED, 120 Hz"][i];
  var bat=p==="battery"||u==="work"?"5000 mAh or larger with fast charging":"4500-5000 mAh, fast charging if possible";
  var cam=p==="camera"||u==="photo"?["Good main sensor with stabilization (OIS if possible)","Main sensor with OIS plus ultra-wide","Flagship camera system, OIS, telephoto optional"][i]:"Decent main camera is enough";
  var rows=[[bi("المعالج","Chipset"),ch],[bi("الرام","RAM"),ram+" GB"],[bi("التخزين","Storage"),stor],[bi("الشاشة","Display"),scr],[bi("البطارية","Battery"),bat],[bi("الكاميرا","Camera"),cam]];
  if(os!=="any")rows.push([bi("النظام","Platform"),os==="ios"?"iPhone with iOS (long update support, closed ecosystem)":"Android (wide choice of brands and prices)"]);
  var notes=[];
  if(u==="senior")notes.push(bi("شاشة كبيرة بخط واضح، صوت عالي، وبطارية تكفي يوم. وضع الخط الكبير والواجهة المبسطة بيساعدوا.","A large screen, loud speaker and all-day battery. Large-font and simple-layout modes help."));
  notes.push(bi("اسأل عن مدة دعم التحديثات والأمان قبل الشراء.","Ask how long software and security updates are supported before buying."));
  notes.push(bi("دي مواصفات إرشادية. الموديلات والأسعار بتتغير، وفريقنا يرشح لك موديلات متاحة.","These are guideline specs. Models and prices change, and our team can suggest models that are available."));
  return {rows:rows,notes:notes,sum:"Phone request: use="+u+", budget="+t+", priority="+p+", OS="+os+" | "+rows.map(function(r){return r[0].en+": "+(typeof r[1]==="object"?r[1].en:r[1])}).join(" | "),title:bi("المواصفات المقترحة","Recommended specs")};}
};
T.cctv={
 form:function(){return fld("cc-place",B(bi("نوع المكان","Location type")),opts([["home",bi("منزل أو فيلا","Home or villa")],["shop",bi("محل","Shop")],["office",bi("مكتب أو شركة","Office or company")],["site",bi("مخزن أو مصنع أو مساحة كبيرة","Warehouse, factory or large area")]],"home"))+
  '<label class="fld"><span>'+B(bi("عدد الكاميرات الداخلية","Indoor cameras"))+'</span><input type="number" id="cc-in" min="0" max="64" value="2"></label>'+
  '<label class="fld"><span>'+B(bi("عدد الكاميرات الخارجية","Outdoor cameras"))+'</span><input type="number" id="cc-out" min="0" max="64" value="2"></label>'+
  fld("cc-res",B(bi("دقة الكاميرا","Camera resolution")),opts([["2",bi("2 ميجابكسل (1080p)","2 MP (1080p)")],["4",bi("4 ميجابكسل","4 MP")],["5",bi("5 ميجابكسل","5 MP")],["8",bi("8 ميجابكسل (4K)","8 MP (4K)")]],"4"))+
  fld("cc-sys",B(bi("نوع النظام","System type")),opts([["auto",bi("اقترح لي","Recommend for me")],["ip",bi("IP (كابل شبكة)","IP (network cable)")],["analog",bi("Analog HD (كابل كواكس موجود)","Analog HD (existing coax cable)")]],"auto"))+
  fld("cc-days",B(bi("مدة الاحتفاظ بالتسجيل","Retention")),opts([["7",bi("7 أيام","7 days")],["14",bi("14 يوم","14 days")],["30",bi("30 يوم","30 days")],["60",bi("60 يوم","60 days")]],"14"))+
  fld("cc-rec",B(bi("طريقة التسجيل","Recording mode")),opts([["cont",bi("مستمر 24 ساعة","Continuous 24/7")],["motion",bi("عند الحركة","On motion")]],"cont"))+
  fld("cc-audio",B(bi("تسجيل صوت؟","Audio recording?")),opts([["no",bi("لا","No")],["yes",bi("نعم","Yes")]],"no"))+
  fld("cc-remote",B(bi("مشاهدة عن بُعد من الموبايل؟","Remote viewing from phone?")),opts([["yes",bi("نعم","Yes")],["no",bi("لا","No")]],"yes"))},
 calc:function(v){
  var inn=Math.max(0,parseInt(v["cc-in"])||0),out=Math.max(0,parseInt(v["cc-out"])||0),n=inn+out;
  if(n<1)return {rows:[],notes:[bi("أدخل عدد كاميرات واحد على الأقل.","Enter at least one camera.")],sum:"",title:bi("نتيجة","Result")};
  var mp=v["cc-res"],days=parseInt(v["cc-days"]),mot=v["cc-rec"]==="motion",place=v["cc-place"],sys=v["cc-sys"];
  if(sys==="auto")sys=(mp==="2"&&v["cc-place"]!=="site")?"ip":"ip";
  var br={"2":1.5,"4":3,"5":4,"8":6}[mp]+(v["cc-audio"]==="yes"?0.064:0);
  var factor=mot?0.5:1, perDay=br*10.8*factor*n, total=perDay*days, withMargin=total*1.2;
  var tb=withMargin/1000, chans=[4,8,16,32,64].filter(function(c){return c>=n})[0]||64;
  var disks=[1,2,4,6,8,10,12,14,16,18,20], per=disks.filter(function(d){return d>=tb})[0];
  var storage;
  if(per)storage="1 x "+per+" TB surveillance-rated drive";
  else{var big=20,cnt=Math.ceil(tb/big);storage=cnt+" x "+big+" TB surveillance-rated drives (check the recorder's bay count)";}
  var totalMbps=(br*n).toFixed(1);
  var rows=[[bi("نوع الجهاز","Recorder type"),sys==="ip"?bi("NVR بعدد "+chans+" قناة (يدعم "+mp+" ميجابكسل أو أعلى لكل قناة)","NVR, "+chans+" channels (supports "+mp+" MP or higher per channel)"):bi("DVR للـ Analog HD بعدد "+chans+" قناة (تأكد إنه يدعم "+mp+" ميجابكسل)","DVR (Analog HD), "+chans+" channels (check it supports "+mp+" MP)")],
   [bi("الكاميرات","Cameras"),bi(n+" كاميرا ("+inn+" داخلية، "+out+" خارجية)، "+mp+" ميجابكسل، "+(sys==="ip"?"IP":"Analog HD")+(out?"؛ الخارجية مقاومة للجو (IP66 أو ما يعادله)":""),n+" ("+inn+" indoor, "+out+" outdoor), "+mp+" MP, "+(sys==="ip"?"IP":"Analog HD")+(out?"; outdoor ones weather-rated (IP66 or similar)":""))],
   [bi("التدفق الكلي التقريبي","Approx. total video rate"),bi(totalMbps+" ميجابت/ث (تسجيل مستمر، تقدير H.265)",totalMbps+" Mbps (continuous, H.265 estimate)")],
   [bi("التخزين اليومي التقريبي","Approx. storage per day"),bi(perDay.toFixed(0)+" جيجا/يوم"+(mot?" (تقدير تسجيل الحركة)":""),perDay.toFixed(0)+" GB/day"+(mot?" (motion recording estimate)":""))],
   [bi("التخزين المطلوب","Storage needed"),bi(total.toFixed(0)+" جيجا لمدة "+days+" يوم، ومع هامش 20% حوالي "+withMargin.toFixed(0)+" جيجا ← "+storage.replace(" x "," × ").replace("surveillance-rated drives (check the recorder's bay count)","هارد مخصص للمراقبة (تأكد من عدد منافذ الهارد في الجهاز)").replace("surveillance-rated drive","هارد مخصص للمراقبة"),total.toFixed(0)+" GB for "+days+" days; with 20% margin about "+withMargin.toFixed(0)+" GB → "+storage)]];
  if(sys==="ip"){var ports=[4,8,16,24,48].filter(function(c){return c>=n+1})[0]||48;rows.push([bi("سويتش PoE","PoE switch"),bi(ports+" منفذ أو أكثر، وقدرة كهربية لا تقل عن "+(n*15)+" وات (حوالي 15 وات للكاميرا كرقم تخطيط آمن، وراجع قدرة كاميرتك)",ports+" ports or more, power budget of at least "+(n*15)+" W (about 15 W per camera as a safe planning figure; check your camera's rated power)")]);rows.push([bi("الكابلات","Cabling"),bi("كابل شبكة Cat6 (أو Cat5e) حتى 100 متر للوصلة، وكابل مخصص للخارج في الأماكن المكشوفة","Cat6 (or Cat5e) network cable, up to 100 m per run; use outdoor-rated cable outside")]);}
  else rows.push([bi("الكابلات والكهرباء","Cabling and power"),bi("كابل كواكس RG59 مع كهرباء، أو كابل فيديو وكهرباء مدمج، ومصدر طاقة مناسب لكل الكاميرات","RG59 coax plus power, or a combined video-power cable; use a regulated power supply sized for all cameras")]);
  rows.push([bi("حماية الكهرباء","Power protection"),bi("يُنصح بجهاز UPS للريكوردر (والسويتش) علشان التسجيل يستمر لو الكهرباء قطعت لحظات","A UPS for the recorder (and PoE switch) is recommended so recording survives short outages")]);
  var lens=place==="site"?bi("مساحات كبيرة: كاميرات ثابتة عدسة 4-6 مم للمسافات، وكاميرا PTZ لو محتاج تتابع الحركة","Wide areas: mix of 4-6 mm fixed cameras for distance and one PTZ if you need to follow activity"):place==="shop"?bi("المحلات: كاميرات دوم عدسة حوالي 2.8 مم لتغطية واسعة، واحدة على الكاشير وواحدة على المدخل","Shops: dome cameras around 2.8 mm for wide coverage, one covering the cash point and one the entrance"):place==="office"?bi("المكاتب: دوم 2.8-3.6 مم للغرف والممرات، واحدة عند المدخل وواحدة عند الاستقبال","Offices: 2.8-3.6 mm domes for rooms and corridors, one at the entrance and one at reception"):bi("المنازل: المدخل والجراج والباب الخلفي ومحيط المبنى، وتجنب توجيه الكاميرا لخصوصيات الجيران","Homes: entrance, garage, back door and perimeter outdoors; avoid pointing at neighbours' private areas");
  rows.push([bi("اقتراح العدسات والمواقع","Lens and placement hint"),lens]);
  if(v["cc-remote"]==="yes")rows.push([bi("المشاهدة عن بعد","Remote viewing"),bi("ريكوردر عليه تطبيق موبايل، ويحتاج إنترنت في المكان وإعداد آمن (كلمة مرور قوية بدون الإعدادات الافتراضية)","Recorder with a phone app; needs internet at the site, and secure setup (strong password, no default credentials)")]);
  var notes=[bi("الأرقام تقدير مبدئي. الاستهلاك الفعلي بيتغير حسب المشهد والضغط وإعدادات الكاميرا.","Figures are a first estimate. Real usage varies with the scene, compression and camera settings."),bi("الأفضل معاينة المكان قبل تحديد المواقع والعدسات والكابلات.","A site visit is best before fixing positions, lenses and cable routes."),bi("تأكد من القوانين المحلية وخصوصية الناس عند تحديد أماكن الكاميرات.","Check local rules and people's privacy when choosing camera positions.")];
  return {rows:rows,notes:notes,sum:"CCTV plan: "+n+" cameras ("+inn+" in/"+out+" out) "+mp+"MP "+sys+", "+days+" days, "+(mot?"motion":"continuous")+" | "+rows.map(function(r){return r[0].en+": "+(typeof r[1]==="object"?r[1].en:r[1])}).join(" | "),title:bi("خطة الكاميرات المقترحة","Suggested CCTV plan")};}
};
/* ---------- tools batch 1: formulas only, every figure is an editable input ---------- */
function num(id,lab,val,min,step){return '<label class="fld"><span>'+lab+'</span><input type="number" id="'+id+'" min="'+(min==null?0:min)+'" step="'+(step||"any")+'" value="'+val+'"></label>'}
function nv(v,id,d){var x=parseFloat(v[id]);return isFinite(x)&&x>=0?x:d}
function fx(n,d){return (Math.round(n*Math.pow(10,d||0))/Math.pow(10,d||0)).toLocaleString("en-US")}
T.stor={
 form:function(){return num("st-n",B(bi("عدد الكاميرات","Number of cameras")),4,1,1)+
  num("st-b",B(bi("معدل البت لكل كاميرا (ميجابت/ث) من إعدادات كاميرتك","Bitrate per camera (Mbps), from your camera settings")),4,0.1)+
  num("st-h",B(bi("ساعات التسجيل في اليوم","Recording hours per day")),24,0.1)+
  num("st-m",B(bi("نسبة التسجيل الفعلية %  (100 = مستمر، أقل لو عند الحركة)","Share of time actually recorded % (100 = continuous, lower for motion)")),100,1)+
  num("st-d",B(bi("عدد أيام الاحتفاظ","Days to keep")),14,1,1)+
  num("st-g",B(bi("هامش أمان %","Safety margin %")),20,0)},
 calc:function(v){
  var n=nv(v,"st-n",1),b=nv(v,"st-b",0),h=Math.min(24,nv(v,"st-h",24)),m=Math.min(100,nv(v,"st-m",100)),d=nv(v,"st-d",1),g=nv(v,"st-g",0);
  var perCamDay=b*3600*h*(m/100)/8/1000, day=perCamDay*n, tot=day*d, mar=tot*(1+g/100);
  var rows=[[bi("تخزين كل كاميرا يوميًا","Per camera per day"),fx(perCamDay,1)+" GB"],[bi("كل الكاميرات يوميًا","All cameras per day"),fx(day,1)+" GB"],[bi("لمدة "+d+" يوم","For "+d+" days"),fx(tot,0)+" GB ("+fx(tot/1000,2)+" TB)"],[bi("مع هامش الأمان","With safety margin"),fx(mar,0)+" GB ("+fx(mar/1000,2)+" TB)"],[bi("المعادلة","Formula"),"Mbps x 3600 x hours x share / 8 / 1000 = GB per camera per day"]];
  return {rows:rows,notes:[bi("1 ميجابت/ث = 0.45 جيجا في الساعة تقريبًا. استخدم 1 تيرا = 1000 جيجا.","1 Mbps is about 0.45 GB per hour. 1 TB = 1000 GB here."),bi("الرقم مبني على المدخلات اللي كتبتها. معدل البت الفعلي بيتغير حسب الدقة والضغط والمشهد، فراجع إعدادات الكاميرا. ولازم قرص مخصص للمراقبة.","The result depends only on your inputs. Real bitrate varies with resolution, compression and scene, so check your camera settings. Use a surveillance-rated drive.")],
   sum:"CCTV storage: "+n+" cameras, "+b+" Mbps, "+h+" h/day, "+m+"% recorded, "+d+" days, margin "+g+"% => "+fx(mar,0)+" GB",title:bi("مساحة التخزين المطلوبة","Storage needed")};}
};
T.net={
 form:function(){return num("nt-u",B(bi("عدد المستخدمين المتصلين معًا","Users online at the same time")),5,1,1)+
  num("nt-vc",B(bi("مكالمات فيديو في نفس الوقت","Simultaneous video calls")),1,0,1)+num("nt-vcm",B(bi("ميجابت/ث لكل مكالمة فيديو (افتراض قابل للتعديل)","Mbps per video call (editable assumption)")),3,0.1)+
  num("nt-st",B(bi("بث فيديو في نفس الوقت","Simultaneous video streams")),2,0,1)+num("nt-stm",B(bi("ميجابت/ث لكل بث (افتراض قابل للتعديل)","Mbps per stream (editable assumption)")),5,0.1)+
  num("nt-cam",B(bi("كاميرات بتبث للموبايل عن بعد","Cameras streamed remotely")),0,0,1)+num("nt-camm",B(bi("ميجابت/ث رفع لكل كاميرا (الستريم الفرعي)","Upload Mbps per camera (sub-stream)")),1,0.1)+
  num("nt-gen",B(bi("تصفح وتحميل عام: ميجابت/ث لكل مستخدم","General browsing: Mbps per user")),1,0.1)+num("nt-h",B(bi("هامش أمان %","Headroom %")),30,0)},
 calc:function(v){
  var u=nv(v,"nt-u",1),vc=nv(v,"nt-vc",0)*nv(v,"nt-vcm",0),st=nv(v,"nt-st",0)*nv(v,"nt-stm",0),cam=nv(v,"nt-cam",0)*nv(v,"nt-camm",0),gen=u*nv(v,"nt-gen",0),h=nv(v,"nt-h",0);
  var down=vc+st+gen, up=vc+cam, dH=down*(1+h/100), uH=up*(1+h/100);
  var rows=[[bi("تحميل (Download) المطلوب","Download needed"),fx(dH,1)+" Mbps"],[bi("رفع (Upload) المطلوب","Upload needed"),fx(uH,1)+" Mbps"],[bi("التفصيل","Breakdown"),"video calls "+fx(vc,1)+" + streams "+fx(st,1)+" + browsing "+fx(gen,1)+" = "+fx(down,1)+" Mbps down; calls "+fx(vc,1)+" + cameras "+fx(cam,1)+" = "+fx(up,1)+" Mbps up"]];
  return {rows:rows,notes:[bi("كل الأرقام افتراضات قابلة للتعديل من عندك. السرعة الفعلية من مزود الخدمة بتختلف عن المعلنة.","All per-use figures are editable assumptions. Real speed from your provider can be lower than advertised."),bi("لو الرفع عندك أقل من المطلوب، قلل جودة بث الكاميرات أو استخدم الستريم الفرعي.","If your upload is below the need, lower camera stream quality or use the sub-stream.")],
   sum:"Internet need: down "+fx(dH,1)+" Mbps, up "+fx(uH,1)+" Mbps, "+u+" users",title:bi("السرعة المقترحة","Suggested speed")};}
};
T.ups={
 form:function(){return num("up-w1",B(bi("جهاز 1: وات","Device 1: watts")),60,0)+num("up-q1",B(bi("العدد","Qty")),1,0,1)+num("up-w2",B(bi("جهاز 2: وات","Device 2: watts")),15,0)+num("up-q2",B(bi("العدد","Qty")),1,0,1)+num("up-w3",B(bi("جهاز 3: وات","Device 3: watts")),0,0)+num("up-q3",B(bi("العدد","Qty")),0,0,1)+
  num("up-pf",B(bi("معامل القدرة للـ UPS (من ورقة بياناته)","UPS power factor (from its datasheet)")),0.6,0.1)+num("up-h",B(bi("هامش أمان %","Headroom %")),25,0)+
  num("up-wh",B(bi("سعة البطارية Wh (اختياري لحساب المدة)","Battery capacity Wh (optional, for runtime)")),0,0)+num("up-ef",B(bi("كفاءة التحويل %","Conversion efficiency %")),85,1)},
 calc:function(v){
  var w=nv(v,"up-w1",0)*nv(v,"up-q1",0)+nv(v,"up-w2",0)*nv(v,"up-q2",0)+nv(v,"up-w3",0)*nv(v,"up-q3",0),pf=Math.min(1,Math.max(0.1,nv(v,"up-pf",0.6))),h=nv(v,"up-h",0),wh=nv(v,"up-wh",0),ef=Math.min(100,nv(v,"up-ef",85));
  var wH=w*(1+h/100),va=wH/pf;
  var rows=[[bi("الحمل الكلي","Total load"),fx(w,0)+" W"],[bi("مع الهامش","With headroom"),fx(wH,0)+" W"],[bi("قدرة UPS المطلوبة","UPS rating needed"),"at least "+fx(va,0)+" VA (= W / power factor)"]];
  if(wh>0&&w>0)rows.push([bi("مدة التشغيل التقريبية","Approx. runtime"),fx(wh*(ef/100)/w*60,0)+" min (= Wh x efficiency / load W)"]);
  return {rows:rows,notes:[bi("الأرقام من المدخلات. اقرأ قدرة كل جهاز من ملصقه، والمدة الفعلية تقل مع عمر البطارية.","Figures come from your inputs. Read each device's watts from its label. Real runtime drops as the battery ages."),bi("لا توصل طابعة ليزر أو أجهزة ثقيلة بالـ UPS.","Do not connect laser printers or heavy loads to a UPS.")],
   sum:"UPS sizing: load "+fx(w,0)+" W, need >= "+fx(va,0)+" VA",title:bi("حجم UPS المطلوب","UPS size needed")};}
};
T.fix={
 form:function(){return fld("fx-p",B(bi("المشكلة","Problem")),opts([["slow",bi("الجهاز بطيء","PC is slow")],["net",bi("مفيش إنترنت","No internet")],["prn",bi("الطابعة مش شغالة","Printer offline")],["cam",bi("الكاميرات لا تظهر","Cameras not showing")]],"slow"))},
 calc:function(v){
  var S={slow:[["أعد تشغيل الجهاز","Restart the device"],["افتح مدير المهام وشوف أكتر برنامج بياخد رام أو معالج","Open Task Manager and check which app uses most CPU or RAM"],["احذف برامج التشغيل التلقائي الغير ضرورية","Disable unneeded startup apps"],["اتأكد من وجود مساحة فاضية على القرص (الأفضل 15% على الأقل)","Check free disk space (keeping about 15% free is a common rule)"],["شغل فحص فيروسات","Run a malware scan"],["لو الجهاز بقرص هارد ميكانيكي، الترقية لـ SSD بتفرق جدًا","If it has a mechanical hard drive, an SSD upgrade helps a lot"]],
   net:[["اتأكد إن باقي الأجهزة عليها نت أم المشكلة في جهاز واحد","Check whether other devices have internet or only this one"],["شوف لمبات الراوتر: لمبة الإنترنت","Look at the router lights, especially the internet light"],["أعد تشغيل الراوتر: افصل الكهرباء 30 ثانية","Restart the router: unplug power for 30 seconds"],["جرب كابل شبكة بدل الواي فاي","Try a network cable instead of Wi-Fi"],["شوف إن الباقة مش خلصت من تطبيق مزود الخدمة","Check that your data plan has not run out in your provider's app"],["لو لسه، اتصل بمزود الخدمة أو احجز معانا فحص شبكة","If still down, call your provider or book a network check with us"]],
   prn:[["اتأكد إن الطابعة شغالة ومفيش ورق محشور أو رسالة خطأ","Check the printer is on with no paper jam or error message"],["اتأكد من الكابل أو من اتصال الواي فاي بنفس الشبكة","Check the cable, or that it is on the same Wi-Fi network"],["من إعدادات الويندوز تأكد إن الطابعة مش في وضع Offline وامسح طابور الطباعة","In Windows settings make sure it is not set to Offline and clear the print queue"],["أعد تشغيل الطابعة والكمبيوتر","Restart the printer and the computer"],["أعد تثبيت تعريف الطابعة من موقع الشركة المصنعة","Reinstall the driver from the manufacturer's website"]],
   cam:[["اتأكد إن الريكوردر شغال ولمبته منورة","Check the recorder is on and its light is lit"],["شوف الهارد: لو رسالة HDD error يبقى محتاج فحص","Look for an HDD error on the recorder: it needs a check"],["اتأكد من الشبكة: كابل الكاميرا والسويتش والإنترنت لو بتشاهد عن بعد","Check the network: camera cable, switch, and internet if viewing remotely"],["اتأكد من وجود كهرباء للكاميرا","Check the camera has power"],["لا تغير كلمات المرور وتنساها. لو نسيتها تواصل معنا","Do not change passwords and forget them. If you forgot them, contact us"]]}[v["fx-p"]];
  return {rows:S.map(function(s,i){return [bi("خطوة "+(i+1),"Step "+(i+1)),bi(s[0],s[1])]}),notes:[bi("لو المشكلة لسه موجودة، فريقنا يقدر يفحص الجهاز.","If the problem remains, our team can check the device.")],sum:"Troubleshooting request: "+v["fx-p"],title:bi("خطوات الفحص","Troubleshooting steps"),wa:"Hello Uno, I need a repair booking. Problem: "+v["fx-p"]};}
};
T.quote={
 form:function(){var o=(C.services||[]).map(function(s,i){return [String(i),s.t]});return fld("qb-s",B(bi("الخدمة المطلوبة","Service")),opts(o,"0"))+
  '<label class="fld"><span>'+B(bi("تفاصيل ما تحتاجه","What you need"))+'</span><input type="text" id="qb-d" maxlength="200" value=""></label>'+'<label class="fld"><span>'+B(bi("اسمك","Your name"))+'</span><input type="text" id="qb-n" maxlength="60" value=""></label>'+num("qb-q",B(bi("الكمية التقريبية","Approx. quantity")),1,1,1)},
 calc:function(v){
  var s=(C.services||[])[parseInt(v["qb-s"])||0],t=s?s.t.en:"";
  var msg="Quote request - Service: "+t+(v["qb-d"]?"; Details: "+v["qb-d"]:"")+"; Qty: "+(v["qb-q"]||1)+(v["qb-n"]?"; Name: "+v["qb-n"]:"");
  return {rows:[[bi("الخدمة","Service"),s?s.t:bi("","")],[bi("التفاصيل","Details"),v["qb-d"]||"-"],[bi("الكمية","Quantity"),String(v["qb-q"]||1)]],notes:[bi("هيتفتح واتساب برسالة جاهزة. مفيش أسعار هنا، الفريق بيرد بعرض سعر.","WhatsApp will open with a ready message. No prices here; the team replies with a quote.")],sum:msg,title:bi("طلب عرض سعر","Quote request"),wa:msg};}
};
function tools(){
  var order=[["pc",bi("لابتوب / كمبيوتر","Laptop / PC")],["phone",bi("موبايل","Phone")],["cctv",bi("كاميرات مراقبة","CCTV planner")],["stor",bi("تخزين الكاميرات","CCTV storage")],["net",bi("سرعة الإنترنت","Internet speed")],["ups",bi("حجم UPS","UPS sizing")],["fix",bi("دليل الأعطال","Troubleshooting")],["quote",bi("طلب عرض سعر","Quote request")]];
  var cur=(location.hash||"#pc").replace("#",""); if(!T[cur])cur="pc";
  $("#app").innerHTML='<section><div class="wrap"><h2>'+B(C.sections.tools.t)+'</h2><p class="sub">'+B(C.sections.tools.d)+'</p><div class="chips" id="tabs">'+order.map(function(o){return '<button class="chip'+(o[0]===cur?' on':'')+'" data-t="'+o[0]+'">'+ico({pc:"💻",phone:"📱",cctv:"📹",stor:"💾",net:"📶",ups:"🔋",fix:"🛠",quote:"📝"}[o[0]])+B(o[1])+'</button>'}).join("")+'</div><div class="tool"><form id="tf" class="tform"></form><div id="tout" class="tout"></div></div></div></section>';
  function show(k){
    cur=k;$$("#tabs .chip").forEach(function(c){c.classList.toggle("on",c.dataset.t===k)});
    $("#tf").innerHTML=T[k].form()+'<button class="btn" type="submit">'+B(bi("احسب","Calculate"))+'</button>';
    $("#tout").innerHTML='<div class="empty"><img class="pose" src="'+U(C.poses[3]||C.poses[0])+'" alt=""><p>'+B(bi("اختار إجاباتك واضغط احسب، وأونو يطلع لك التوصية.","Choose your answers and press Calculate. Uno will show a recommendation."))+'</p></div>';
  }
  $$("#tabs .chip").forEach(function(c){c.onclick=function(){location.hash=c.dataset.t;show(c.dataset.t)}});
  $("#tf").onsubmit=function(e){e.preventDefault();var v={};$$("#tf select, #tf input").forEach(function(x){v[x.id]=x.value});
    var r=T[cur].calc(v);
    $("#tout").innerHTML='<h3>'+B(r.title)+'</h3><table class="rt">'+r.rows.map(function(x){return '<tr><th>'+B(x[0])+'</th><td>'+(typeof x[1]==="object"?B(x[1]):'<span dir="ltr">'+esc(x[1])+'</span>')+'</td></tr>'}).join("")+'</table><ul class="rn">'+r.notes.map(function(n){return '<li>'+B(n)+'</li>'}).join("")+'</ul><div class="acta"><a class="btn" href="'+U(ctaBtn())+'">'+B(C.blog.contactBtn)+'</a> <button class="btn alt" type="button" id="cp">'+B(bi("نسخ الملخص","Copy summary"))+'</button></div>';
    $("#cp").onclick=function(){try{navigator.clipboard.writeText(r.sum);this.textContent="\u2713"}catch(e){}};
    $("#tout").scrollIntoView({behavior:"smooth",block:"nearest"});};
  show(cur);
}

/* ---------- chatbot (rule based, no backend) ---------- */
function norm(s){return String(s||"").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"").replace(/[\u0623\u0625\u0622]/g,"\u0627").replace(/\u0629/g,"\u0647").replace(/\u0649/g,"\u064A").replace(/[^\w\u0600-\u06FF ]/g," ").replace(/\s+/g," ").trim()}
function score(qn,kws){var s=0,w=qn.split(" ");(kws||"").split(/[,\n\s]+/).forEach(function(k){k=norm(k);if(!k)return;var hit=w.some(function(x){return x===k||(k.length>=3&&x.indexOf(k)>-1)});if(hit)s+=k.length>3?2:1});return s}
function brain(text){
  var qn=norm(text),best=null,bs=0,cands=[];
  function add(sc,r){if(sc>0)cands.push([sc,r])}
  var ch=C.chatbot;
  (ch.faqs||[]).forEach(function(f){add(score(qn,f.kw)?score(qn,f.kw)+0.5:0,{a:f.a,links:f.link?[{t:f.linkText||bi("افتح","Open"),u:f.link}]:[]})});
  C.services.forEach(function(s){add(score(qn,s.kw||""),{a:ch.serviceAnswer,svc:s,links:[{t:bi("الخدمات","Services"),u:"index.html#services"}]})});
  C.blog.posts.forEach(function(p){if(p.published===false)return;add(score(qn,(p.kw||"")+","+p.title.ar+","+p.title.en)*0.9,{a:ch.articleAnswer,links:[{t:p.title,u:"blog.html#"+p.slug}]})});
  C.toolCards.forEach(function(t){add(score(qn,t.kw||""),{a:t.botAnswer||ch.toolAnswer,links:[{t:t.t,u:t.link}]})});
  add(score(qn,ch.contactKw||"")?score(qn,ch.contactKw||"")+0.4:0,{a:{ar:ch.contactAnswer.ar,en:ch.contactAnswer.en},contact:true,links:[]});
  add(score(qn,ch.greetKw||"")*0.6,{a:ch.greeting,links:[]});
  cands.sort(function(a,b){return b[0]-a[0]});
  return cands.length?cands[0][1]:{a:ch.fallback,links:[{t:bi("تواصل معنا","Contact us"),u:"index.html#contact"},{t:bi("المدونة","Blog"),u:"blog.html"}]};
}
var chatOpen=false,chatInit=false;
function chatUI(){
  var ch=C.chatbot;
  document.body.insertAdjacentHTML("beforeend",'<button id="chat-fab" type="button" aria-label="Uno chat"><img src="'+U(ch.avatar)+'" alt="Uno"><span class="dot"></span><em class="lbl">'+B({ar:"محتاج مساعدة؟",en:"Need help?"})+'</em></button><div id="chat" role="dialog" aria-label="Uno assistant" hidden><div class="ch-h"><img src="'+U(ch.avatar)+'" alt=""><div><b>'+B(ch.name)+'</b><small>'+B(ch.status)+'</small></div><button type="button" id="ch-call" aria-label="Voice call"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.500 1.500a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/></svg></button><button type="button" id="ch-x" aria-label="Close">\u2715</button></div><div class="ch-b" id="ch-b" aria-live="polite"></div><div class="ch-q" id="ch-q"></div><button type="button" class="ch-sup" id="ch-sup">'+B({ar:"تكلم مع فريق الدعم مباشرة",en:"Talk to support directly"})+'</button><form class="ch-f" id="ch-f"><input id="ch-i" type="text" autocomplete="off" placeholder="'+U(L(ch.placeholder))+'"><button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 20l18-8L3 4v6l11 2-11 2z"/></svg></button></form></div>');
  $("#chat-fab").onclick=function(){openChat()}; $("#ch-x").onclick=function(){closeChat()};$("#ch-call").onclick=function(){vcStart()};
  $("#ch-f").onsubmit=function(e){e.preventDefault();var i=$("#ch-i"),v=i.value.trim();if(!v)return;i.value="";user(v);if(SUP.on){supSend(v)}else ask(v)};$("#ch-sup").onclick=function(){supStart()};
}
var HIST=[];
function kbAsk(v,cfg){
  if(!cfg||!window.fetch)return Promise.resolve(null);
  var ctl=window.AbortController?new AbortController():null,t=setTimeout(function(){ctl&&ctl.abort()},4000);
  return fetch(cfg.url+"/rest/v1/rpc/kb_search",{method:"POST",signal:ctl?ctl.signal:undefined,headers:{"Content-Type":"application/json",apikey:cfg.key,Authorization:"Bearer "+cfg.key},body:JSON.stringify({q:v,lim:3})}).then(function(r){return r.ok?r.json():[]}).then(function(a){clearTimeout(t);var x=a&&a[0];if(!x||x.score<0.3)return null;var ans=h.lang==="ar"?(x.answer_ar||x.answer_en):(x.answer_en||x.answer_ar);return ans||null}).catch(function(){clearTimeout(t);return null})
}
function ask(v){
  var cfg=window.UNO_CFG;
  msg("b typing","\u2026");var tp0=$("#ch-b").lastChild;
  return kbAsk(v,cfg).then(function(a){tp0.remove();if(a){HIST.push({r:"u",t:v},{r:"b",t:a});msg("b",esc(a).replace(/\n/g,"<br>"));return}ask2(v)});
}
function ask2(v){
  var cfg=window.UNO_CFG;msg("b typing","\u2026");var tp=$("#ch-b").lastChild,done=false;
  function local(){if(done)return;done=true;tp.remove();bot(brain(v))}
  if(!cfg||!window.fetch){return local()}
  var to=setTimeout(local,12000);
  fetch(cfg.url+"/functions/v1/chat",{method:"POST",headers:{"Content-Type":"application/json",apikey:cfg.key,Authorization:"Bearer "+cfg.key},body:JSON.stringify({q:v,lang:h.lang,history:HIST})}).then(function(r){return r.json()}).then(function(j){
    if(done)return;clearTimeout(to);
    if(j&&j.a){done=true;tp.remove();HIST.push({r:"u",t:v},{r:"b",t:j.a});msg("b",esc(j.a).replace(/\n/g,"<br>"))}else local()
  }).catch(function(){clearTimeout(to);local()})
}
function msg(cls,html){var b=$("#ch-b");b.insertAdjacentHTML("beforeend",'<div class="m '+cls+'">'+html+'</div>');b.scrollTop=b.scrollHeight}
function user(t){msg("u",esc(t))}
function bot(r){
  var html=B(r.a,false);
  if(r.svc)html+='<br><b>'+B(r.svc.t)+'</b><ul>'+r.svc.items.slice(0,5).map(function(i){return '<li>'+B(i)+'</li>'}).join("")+'</ul>';
  if(r.contact)html+='<div class="cl">'+contactItems().replace(/class="ci"/g,'class="cic"')+'</div>';
  if(r.links&&r.links.length)html+='<div class="lk">'+r.links.map(function(l){return '<a href="'+U(l.u)+'">'+B(l.t)+'</a>'}).join("")+'</div>';
  msg("b",html);
}
function quick(){$("#ch-q").innerHTML=C.chatbot.quick.map(function(q,i){return '<button type="button" data-i="'+i+'">'+B(q.t)+'</button>'}).join("");
  $$("#ch-q button").forEach(function(b){b.onclick=function(){var q=C.chatbot.quick[+b.dataset.i];user(L(q.t));setTimeout(function(){bot(brain(q.q))},300)}})}

/* Live human support (visitor side): RPCs guarded by a per-visitor token */
var SUP={on:false,id:null,tok:null,last:0,t:null,seen:{}};
try{var _s=JSON.parse(localStorage.getItem("uno_sup")||"null");if(_s&&_s.id&&_s.tok){SUP.id=_s.id;SUP.tok=_s.tok}}catch(e){}
function supRpc(fn,body){var c=window.UNO_CFG;if(!c||!window.fetch)return Promise.reject(new Error("offline"));return fetch(c.url+"/rest/v1/rpc/"+fn,{method:"POST",headers:{"Content-Type":"application/json",apikey:c.key,Authorization:"Bearer "+c.key},body:JSON.stringify(body)}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j&&j.message||"error");return j})})}
function supStart(){
  if(SUP.on)return;
  if(SUP.id){supRpc("support_read",{p_id:SUP.id,p_token:SUP.tok,p_after:0}).then(function(r){if(r.status==="open"){supOn(true);r.msgs.forEach(supShow)}else{supForget();supForm()}}).catch(function(){supForget();supForm()});return}
  supForm();
}
function supForget(){SUP.id=null;SUP.tok=null;SUP.last=0;try{localStorage.removeItem("uno_sup")}catch(e){}}
function supForm(){
  msg("b",B({ar:"تمام، هوصلك بفريق الدعم. اكتب اسمك (ورقم موبايلك لو حابب) وابدأ المحادثة.",en:"Sure, I will connect you with the support team. Enter your name (and a phone number if you like) to start."})+'<form class="ch-sf"><input name="n" maxlength="60" required autocomplete="name" placeholder="'+B({ar:"الاسم",en:"Name"})+'"><input name="p" maxlength="30" type="tel" autocomplete="tel" placeholder="'+B({ar:"الموبايل (اختياري)",en:"Phone (optional)"})+'"><button type="submit">'+B({ar:"ابدأ المحادثة",en:"Start chat"})+'</button></form>');
  var f=$("#ch-b").lastChild.querySelector("form");
  f.onsubmit=function(e){e.preventDefault();var n=f.n.value.trim();if(!n)return;f.querySelector("button").disabled=true;
    supRpc("support_open",{p_name:n,p_phone:f.p.value.trim()}).then(function(r){SUP.id=r.id;SUP.tok=r.token;SUP.last=0;try{localStorage.setItem("uno_sup",JSON.stringify({id:r.id,tok:r.token}))}catch(e){}f.remove();supOn();msg("b",B({ar:"اتفتحت المحادثة. اكتب رسالتك وهيرد عليك حد من الفريق هنا.",en:"Chat opened. Type your message and a team member will reply here."}))}).catch(function(){f.querySelector("button").disabled=false;msg("b",B({ar:"مش قادرين نفتح المحادثة دلوقتي. جرّب تاني أو كلمنا واتساب.",en:"We could not open the chat right now. Try again or reach us on WhatsApp."}))})}
}
function supOn(resumed){SUP.on=true;var c=$("#chat");c.classList.add("human");var sm=c.querySelector(".ch-h small");if(sm){sm.dataset.o=sm.innerHTML;sm.textContent=L({ar:"دعم مباشر",en:"Live support"})}$("#ch-i").placeholder=L({ar:"اكتب رسالتك للدعم",en:"Message support"});if(resumed)msg("b",B({ar:"كملنا محادثتك مع الدعم.",en:"Resumed your chat with support."}));clearInterval(SUP.t);SUP.t=setInterval(supPoll,3000)}
function supShow(m){if(SUP.seen[m.id])return;SUP.seen[m.id]=1;SUP.last=Math.max(SUP.last,m.id);if(m.sender==="agent")msg("b ag",esc(m.body).replace(/\n/g,"<br>"));else msg("u",esc(m.body))}
function supPoll(){if(!SUP.on||!SUP.id)return;supRpc("support_read",{p_id:SUP.id,p_token:SUP.tok,p_after:SUP.last}).then(function(r){r.msgs.forEach(function(m){if(m.sender==="agent")supShow(m);else{SUP.seen[m.id]=1;SUP.last=Math.max(SUP.last,m.id)}});if(r.status==="closed"){clearInterval(SUP.t);SUP.on=false;$("#chat").classList.remove("human");supForget();msg("b",B({ar:"الدعم قفل المحادثة. تقدر تبدأ واحدة جديدة من الزرار تحت.",en:"Support closed this chat. You can start a new one with the button below."}))}}).catch(function(){})}
function supSend(v){supRpc("support_send",{p_id:SUP.id,p_token:SUP.tok,p_body:v}).then(function(){supPoll()}).catch(function(e){msg("b",B({ar:"الرسالة متبعتتش. جرّب تاني.",en:"Message not sent. Try again."}))})}
function openChat(greetOnly,topic){
  if(!$("#chat"))return; $("#chat").hidden=false; chatOpen=true; document.body.classList.add("chat-open"); vvFit(); $("#chat-fab").classList.add("hid");
  if(!chatInit){chatInit=true;bot({a:C.chatbot.greeting,links:[]});quick();}
  if(topic){user(L({ar:"عايز أسأل عن: ",en:"I'd like to ask about: "})+topic);setTimeout(function(){bot(brain(topic))},300)}
  setTimeout(function(){$("#ch-i").focus()},50);
}
function vvFit(){var v=window.visualViewport,c=$("#chat");if(!c)return;if(v){c.style.setProperty("--vvh",v.height+"px");c.style.transform="translateY("+(v.offsetTop||0)+"px)";var b=$("#ch-b");if(b)b.scrollTop=b.scrollHeight}}
if(window.visualViewport){visualViewport.addEventListener("resize",function(){if(chatOpen)vvFit()});visualViewport.addEventListener("scroll",function(){if(chatOpen)vvFit()})}
function closeChat(){document.body.classList.remove("chat-open");$("#chat").style.removeProperty("--vvh");$("#chat").style.transform="";$("#chat").hidden=true;chatOpen=false;$("#chat-fab").classList.remove("hid")}
window.UNO_openChat=openChat;

/* ---------- common behaviours ---------- */
var io=window.IntersectionObserver?new IntersectionObserver(function(e){e.forEach(function(x){if(x.isIntersecting){x.target.classList.add("in");io.unobserve(x.target)}})},{threshold:.08}):null;
function reveal(){$$(".rv:not(.in)").forEach(function(x){io?io.observe(x):x.classList.add("in")})}
function wire(){
  var T0=$("#theme");
  T0.onclick=function(){setTheme(h.dataset.theme==="dark"?"light":"dark")};
  $("#lang").onclick=function(){setLang(h.lang==="ar"?"en":"ar");if(projOpen)projRoute();$("#ch-i")&&($("#ch-i").placeholder=L(C.chatbot.placeholder))};
  var nv=$("nav");$("#menu").onclick=function(){nv.classList.toggle("open")};nv.onclick=function(){nv.classList.remove("open")};
  document.body.insertAdjacentHTML("beforeend",'<button id="top-btn" aria-label="Top">\u2191</button>');
  var tb=$("#top-btn");tb.onclick=function(){scrollTo({top:0,behavior:"smooth"})};
  addEventListener("scroll",function(){tb.classList.toggle("show",scrollY>600)});
}

function store(){
  window.__U={h:h,C:C,esc:esc,B:B,bi:bi,ico:ico,intl:intl,U:U,$:$,$$:$$};var sc=document.createElement("script");sc.src="assets/store.js?v=20261127i";document.body.appendChild(sc);
  document.title=(h.lang==="en"?"Store | ":"المتجر | ")+((C.site&&C.site.name&&(C.site.name.en))||"Uno");
}

function account(){
  window.__U={h:h,C:C,esc:esc,B:B,bi:bi,ico:ico,intl:intl,U:U,$:$,$$:$$};var sc=document.createElement("script");sc.src="assets/account.js?v=20261127i";document.body.appendChild(sc);
}

function privacy(){
  var ar=h.lang!=="en",R=function(a,e){return ar?a:e};
  var S=[[R("ما الذي نجمعه","What we collect"),R("عند الطلب: الاسم ورقم الموبايل والعنوان والمنتجات. عند إنشاء حساب: البريد الإلكتروني والاسم والموبايل والعناوين المحفوظة. عند إرسال طلب خدمة أو رسالة: البيانات التي تكتبها. محادثات المساعد الذكي على الموقع قد تُحفظ لتحسين الخدمة.","When you order: name, phone, address and items. When you create an account: email, name, phone and saved addresses. When you send a service request or message: what you write. Chats with the site assistant may be saved to improve the service.")],
  [R("كيف نستخدمها","How we use it"),R("لتنفيذ الطلبات والتواصل معك وتتبع الشحنات ودعم العملاء. لا نبيع بياناتك.","To fulfil orders, contact you, track shipments and support customers. We do not sell your data.")],
  [R("التخزين على جهازك","Storage on your device"),R("نحفظ على جهازك اللغة والوضع الداكن وسلة المشتريات وجلسة الدخول واختيارك بخصوص الكوكيز. هذه ضرورية لعمل الموقع.","We keep your language, dark mode, cart, sign-in session and cookie choice on your device. These are needed for the site to work.")],
  [R("الإعلانات","Advertising"),R("قد يعرض الموقع إعلانات من Google AdSense. لن يتم تحميل الإعلانات إلا بعد موافقتك على إشعار الكوكيز. Google وشركاؤها قد يستخدمون كوكيز لعرض إعلانات. يمكنك رفض الكوكيز وسيعمل الموقع كما هو. لمعرفة المزيد عن كيفية استخدام Google للبيانات ابحث عن سياسة خصوصية Google للإعلانات.","The site may show ads from Google AdSense. Ads load only after you accept the cookie notice. Google and its partners may use cookies to serve ads. You can decline and the site still works. To learn how Google uses data, search for Google's advertising privacy policy.")],
  [R("خدمات نستعين بها","Services we use"),R("الاستضافة على GitHub Pages وقاعدة البيانات والمصادقة على Supabase، وقد نستخدم شركة شحن لتوصيل طلبك وسنشارك معها بيانات التوصيل فقط.","Hosting on GitHub Pages, database and sign-in on Supabase. We may use a courier to deliver your order and will share only the delivery details with it.")],
  [R("حقوقك","Your choices"),R("يمكنك طلب تعديل بياناتك أو حذفها بالتواصل معنا.","You can ask us to correct or delete your data by contacting us.")],
  [R("تواصل معنا","Contact"),R("واتساب وهاتف: 01505946321، فرشوط، قنا، مصر.","WhatsApp and phone: 01505946321, Farshout, Qena, Egypt.")]];
  document.title=R("سياسة الخصوصية | Uno","Privacy policy | Uno");
  $("#app").innerHTML='<div class="sthero"><div class="wrap"><span class="sth-k">'+R("الخصوصية","Privacy")+'</span><h1>'+R("سياسة الخصوصية","Privacy policy")+'</h1><p>'+R("باختصار وبوضوح: ما نجمعه ولماذا.","What we collect and why, in plain words.")+'</p></div></div><section><div class="wrap pv"><nav class="pvt" aria-label="'+R("المحتويات","Contents")+'">'+S.map(function(x,i){return '<a href="#p'+i+'">'+esc(x[0])+'</a>'}).join("")+'</nav><div class="pvb">'+S.map(function(x,i){return '<article class="pvc" id="p'+i+'"><b class="pvn">'+(i+1)+'</b><div><h2>'+esc(x[0])+'</h2><p>'+esc(x[1])+'</p></div></article>'}).join("")+'</div></div></section>';
}

/* ---------- project details (hash routed) ---------- */
var SVCMAP={network:1,cctv:2,office:3,code:0,web:0,pos:4,design:5,print:6,electro:8};
function normPort(){(C.portfolio||[]).forEach(function(p){if(!p.slug&&p.img)p.slug=String(p.img).split("/").pop().replace(/\.\w+$/,"");if(p.svc==null&&SVCMAP[p.slug]!=null)p.svc=SVCMAP[p.slug]})}
var projOpen=false;
function projRoute(){normPort();
  var m=/^#project\/([\w-]+)/.exec(location.hash||""),pr=m&&(C.portfolio||[]).filter(function(x){return x.slug===m[1]})[0];
  var el=$("#proj");
  if(!pr){if(el){el.remove()}document.body.classList.remove("proj-open");projOpen=false;return}
  var sv=C.services[pr.svc]||null,lg=h.lang;
  var rows=sv?sv.items.map(function(it){return "<li>"+B(it)+"</li>"}).join(""):"";
  var wa=intl((C.contact&&(C.contact.whatsapp||C.contact.phone))||"").replace("+","");
  var url=location.href.split("#")[0]+"#project/"+pr.slug;
  var html='<div class="pj-box" role="dialog" aria-modal="true" aria-label="'+U(L(pr.t))+'"><div class="pj-bar"><button type="button" class="pj-x" id="pj-x" aria-label="'+(lg==="ar"?"إغلاق":"Close")+'">'+"\u2715"+'</button></div>'
   +'<div class="pj-gal"><img src="'+U(pr.img)+'" alt="'+U(L(pr.t))+'"><em class="smp">'+B(C.portfolioSample)+'</em></div>'
   +'<div class="pj-in"><h2>'+B(pr.t)+'</h2>'
   +'<p class="pj-note">'+B({ar:"الصورة توضيحية وليست من مشروع فعلي لعميل. هنضيف صور مشاريعنا الحقيقية قريبًا.",en:"This image is illustrative and not from a specific client project. Real project photos will be added soon."})+'</p>'
   +(pr.d&&(pr.d.ar||pr.d.en)?'<p>'+B(pr.d)+'</p>':'')
   +(sv?'<h3>'+B({ar:"الخدمة المستخدمة",en:"Service area"})+'</h3><p class="pj-svc">'+B(sv.t)+'</p><h3>'+B({ar:"نطاق العمل",en:"Typical scope"})+'</h3><ul>'+rows+'</ul>':'')
   +'<div class="pj-cta"><button type="button" class="btn" id="pj-req">'+B({ar:"اطلب مشروع مشابه",en:"Request a similar project"})+'</button>'
   +'<button type="button" class="btn alt" id="pj-share">'+B({ar:"مشاركة",en:"Share"})+'</button></div><p class="rq-st" id="pj-st" role="status"></p></div></div>';
  if(!el){el=document.createElement("div");el.id="proj";document.body.appendChild(el)}
  el.innerHTML=html;document.body.classList.add("proj-open");projOpen=true;
  $("#pj-x").onclick=function(){if(history.length>1&&/^#project/.test(location.hash)){history.back()}else{location.hash="portfolio"}};
  el.onclick=function(e){if(e.target===el)$("#pj-x").click()};
  $("#pj-share").onclick=function(){var t=L(pr.t)+" | Uno Technology",st=$("#pj-st");
    if(navigator.share){navigator.share({title:t,url:url}).catch(function(){})}
    else if(navigator.clipboard){navigator.clipboard.writeText(url).then(function(){st.textContent=lg==="ar"?"تم نسخ الرابط":"Link copied"})}else{st.textContent=url}};
  $("#pj-req").onclick=function(){var f=$("#rq");history.replaceState(null,"","#request");projRoute();
    if(f){var s2=f.querySelector("select[name=service]");if(s2&&sv)s2.value=sv.t.en;var ms=f.querySelector("textarea");if(ms&&!ms.value)ms.value=(lg==="ar"?"عايز مشروع مشابه لـ: ":"I'd like a project similar to: ")+L(pr.t);$("#request").scrollIntoView()}};
  var xb=$("#pj-x");xb&&xb.focus();
}
window.addEventListener("hashchange",function(){if(PAGE==="home")projRoute()});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&projOpen){var b=$("#pj-x");b&&b.click()}});

/* ---------- voice call (browser speech recognition + synthesis + chat function) ---------- */
var VC={mode:"cloud",on:false,mute:false,t0:0,tick:null,rec:null,turns:0,busy:false,speaking:false,sr:null};
var VMAX=180,VTURNS=15,VDAY=30;function vcOwner(){try{if(/[?&]owner(=|&|$)/.test(location.search))localStorage.setItem("uno_owner","1");if(localStorage.getItem("uno_owner")==="1")return true;for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(/^sb-.*auth-token$/.test(k)||k==="uno_sess")return true}}catch(e){}return false}
function vcSR(){return window.SpeechRecognition||window.webkitSpeechRecognition||null}
function vcT(ar,en){return h.lang==="ar"?ar:en}
function vcCap(who,t){var c=$("#vc-cap");if(!c)return;c.innerHTML='<small>'+esc(who)+'</small><p>'+esc(t)+'</p>'}
function vcState(k){var o=$("#vc");if(!o)return;o.setAttribute("data-s",k);var m={listen:vcT("بسمعك...","Listening..."),think:vcT("بفكر...","Thinking..."),speak:vcT("بتكلم...","Speaking..."),connect:vcT("بتوصل...","Connecting..."),idle:vcT("المايك مكتوم","Mic muted"),text:vcT("اكتب سؤالك","Type your question")};$("#vc-st").textContent=m[k]||""}
function vcVoice(){var vs=window.speechSynthesis?speechSynthesis.getVoices():[],l=h.lang==="ar"?"ar":"en";return vs.filter(function(v){return v.lang&&v.lang.toLowerCase().indexOf(l)===0})[0]||null}
function vcSpeak(text,done){
  if(!window.speechSynthesis||!VC.on){done&&done();return}
  var v=vcVoice();
  if(!v&&h.lang==="ar"){$("#vc-note").textContent="جهازك مفيهوش صوت عربي، فبعرض الرد مكتوب.";done&&done();return}
  speechSynthesis.cancel();VC.speaking=true;vcState("speak");
  var parts=String(text).replace(/\s+/g," ").match(/[^.!?؟\n]+[.!?؟]?/g)||[text],i=0;
  (function next(){
    if(!VC.on||i>=parts.length){VC.speaking=false;done&&done();return}
    var u=new SpeechSynthesisUtterance(parts[i++].trim());u.lang=h.lang==="ar"?"ar-EG":"en-US";if(v)u.voice=v;u.rate=1;
    u.onend=next;u.onerror=function(){VC.speaking=false;done&&done()};speechSynthesis.speak(u)})();
}
function vcAsk(q){
  if(VC.busy||!VC.on)return;VC.busy=true;VC.turns++;vcCap(vcT("إنت","You"),q);vcState("think");
  var cfg=window.UNO_CFG,fin=false;
  function out(a){if(fin)return;fin=true;VC.busy=false;if(!VC.on)return;a=String(a||"").replace(/[*_#`]/g,"");vcCap("Uno",a);HIST.push({r:"u",t:q},{r:"b",t:a});
    if(VC.turns>=VTURNS){vcCap("Uno",vcT("خلصنا الحد المسموح للمكالمة. كلمنا على واتساب أو ابدأ مكالمة تانية بعدين.","Call limit reached. Message us on WhatsApp or start another call later."));setTimeout(vcEnd,4000);return}
    vcSay(a)}
  function local(){var r=brain(q);var tmp=document.createElement("div");tmp.innerHTML=B(r.a,false);out(tmp.textContent)}
  if(!cfg||!window.fetch)return local();
  var to=setTimeout(local,14000);
  fetch(cfg.url+"/functions/v1/chat",{method:"POST",headers:{"Content-Type":"application/json",apikey:cfg.key,Authorization:"Bearer "+cfg.key},body:JSON.stringify({q:q,lang:h.lang,history:HIST.slice(-6),voice:true})}).then(function(r){return r.json()}).then(function(j){clearTimeout(to);if(j&&j.a)out(j.a);else if(j&&j.limited)out(vcT("وصلت للحد المسموح حاليًا. جرب بعد شوية أو كلمنا على واتساب.","You've reached the current limit. Try again later or message us on WhatsApp."));else local()}).catch(function(){clearTimeout(to);local()});
}
function vcListen(){
  if(!VC.on||VC.mute||VC.busy)return;var SR=vcSR();if(!SR){vcState("text");return}
  try{var r=new SR();VC.rec=r;r.lang=h.lang==="ar"?"ar-EG":"en-US";r.interimResults=true;r.continuous=false;r.maxAlternatives=1;var fin="",hadErr=false;
    r.onstart=function(){vcState("listen")};
    r.onresult=function(e){var t="";for(var i=e.resultIndex;i<e.results.length;i++){t+=e.results[i][0].transcript;if(e.results[i].isFinal)fin=t}vcCap(vcT("إنت","You"),t)};
    r.onerror=function(e){hadErr=true;if(e.error==="not-allowed"||e.error==="service-not-allowed"){$("#vc-note").textContent=vcT("المايك مش مسموح. فعّل إذن المايك من إعدادات المتصفح، أو اكتب سؤالك.","Microphone blocked. Allow it in browser settings, or type your question.");vcState("text");$("#vc-tf").hidden=false}else if(e.error==="no-speech"||e.error==="aborted"){hadErr=false}};
    r.onend=function(){if(!VC.on||VC.mute||VC.busy)return;if(fin){vcAsk(fin)}else if(!hadErr){setTimeout(vcListen,250)}};
    r.start()}catch(e){vcState("text");$("#vc-tf").hidden=false}
}
function vcTimer(){var s=Math.floor((Date.now()-VC.t0)/1000),m=Math.floor(s/60);$("#vc-tm").textContent=(m<10?"0":"")+m+":"+((s%60)<10?"0":"")+(s%60);if(s>=VMAX){vcCap("Uno",vcT("وقت المكالمة انتهى. شكرًا لك!","Call time is up. Thank you!"));vcEnd()}}
function vcEnd(){
  if(!VC.on)return;VC.on=false;clearInterval(VC.tick);if(VL.ws){try{VL.ws.onclose=null;VL.ws.close()}catch(e){}VL.ws=null}VL.ok=false;vlHalt();vaClose();try{VC.rec&&VC.rec.abort()}catch(e){}try{window.speechSynthesis&&speechSynthesis.cancel()}catch(e){}
  setTimeout(function(){var o=$("#vc");o&&o.remove();document.body.classList.remove("vc-open")},VMAX&&300);
}

/* ---- cloud voice engine: mic capture + VAD + Gemini STT/TTS through the Edge Function ---- */
var VA={ctx:null,stream:null,proc:null,an:null,pan:null,src:null,pre:[],buf:[],rec:false,voiced:0,sil:0,t:0,st:"idle",floor:0.01,cal:0,calN:0,barge:0,lv:null,srcNode:null};
function vaChunk(e){
  if(!VC.on||VC.mute)return;
  if(VC.mode==="live"){vlChunk(e.inputBuffer.getChannelData(0));return}
  if(VC.mode!=="cloud")return;
  var d=e.inputBuffer.getChannelData(0),c=new Float32Array(d),sum=0,i;for(i=0;i<c.length;i++)sum+=c[i]*c[i];
  var rms=Math.sqrt(sum/c.length),dur=c.length/VA.ctx.sampleRate;
  if(VA.calN<6){VA.cal=VA.calN?Math.min(VA.cal,rms):rms;VA.calN++;VA.floor=VA.cal;return}
  var thr=Math.min(0.06,Math.max(0.018,VA.floor*3));
  if(!VA.rec&&rms<thr)VA.floor=VA.floor*0.97+rms*0.03;
  VA.pre.push(c);if(VA.pre.length>6)VA.pre.shift();
  if(VA.st==="speak"){
    if(rms>thr*2.6)VA.barge+=dur*1000;else VA.barge=0;
    if(VA.barge>=260){vaStop();VA.barge=0;VA.st="listen";VA.rec=true;VA.buf=VA.pre.slice();VA.sil=0;VA.t=0;vcState("listen")}
    return}
  if(VA.st!=="listen")return;
  if(!VA.rec){if(rms>thr){VA.voiced+=dur;if(VA.voiced>=0.1){VA.rec=true;VA.buf=VA.pre.slice();VA.sil=0;VA.t=0}}else VA.voiced=0}
  else{VA.buf.push(c);VA.t+=dur;if(rms>thr*0.8)VA.sil=0;else VA.sil+=dur;if(VA.sil>=0.95||VA.t>=12)vaFinish()}
}
function vaWav(chunks,sr){
  var n=0,i,j;chunks.forEach(function(c){n+=c.length});var all=new Float32Array(n),o=0;chunks.forEach(function(c){all.set(c,o);o+=c.length});
  var ratio=sr/16000,m=Math.floor(n/ratio),pcm=new Int16Array(m);
  for(i=0;i<m;i++){var a=Math.floor(i*ratio),b=Math.min(n,Math.floor((i+1)*ratio)),sm=0,k=0;for(j=a;j<b;j++){sm+=all[j];k++}var v=k?sm/k:0;v=Math.max(-1,Math.min(1,v*1.4));pcm[i]=v<0?v*32768:v*32767}
  var buf=new ArrayBuffer(44+m*2),dv=new DataView(buf);function ws(off,t){for(var q=0;q<t.length;q++)dv.setUint8(off+q,t.charCodeAt(q))}
  ws(0,"RIFF");dv.setUint32(4,36+m*2,true);ws(8,"WAVE");ws(12,"fmt ");dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);dv.setUint32(24,16000,true);dv.setUint32(28,32000,true);dv.setUint16(32,2,true);dv.setUint16(34,16,true);ws(36,"data");dv.setUint32(40,m*2,true);
  for(i=0;i<m;i++)dv.setInt16(44+i*2,pcm[i],true);
  var u=new Uint8Array(buf),bin="";for(i=0;i<u.length;i+=8192)bin+=String.fromCharCode.apply(null,u.subarray(i,i+8192));
  return {b64:btoa(bin),secs:m/16000};
}
function vaFinish(){
  if(VA.st!=="listen")return;VA.rec=false;VA.voiced=0;var w=vaWav(VA.buf,VA.ctx.sampleRate);VA.buf=[];VA.pre=[];
  if(w.secs<0.45){vcState("listen");return}
  VA.st="think";vcState("think");vcAudioAsk(w.b64);
}
function vaStop(){try{if(VA.srcNode){VA.srcNode.onended=null;VA.srcNode.stop()}}catch(e){}VA.srcNode=null;VC.speaking=false}
function vaPlay(b64,rate,done){
  try{var bin=atob(b64),n=bin.length>>1,buf=VA.ctx.createBuffer(1,n,rate),ch=buf.getChannelData(0),i;
    for(i=0;i<n;i++){var v=bin.charCodeAt(i*2)|(bin.charCodeAt(i*2+1)<<8);if(v>32767)v-=65536;ch[i]=v/32768}
    var src=VA.ctx.createBufferSource();src.buffer=buf;if(!VA.pan){VA.pan=VA.ctx.createAnalyser();VA.pan.fftSize=512;VA.pan.connect(VA.ctx.destination)}
    src.connect(VA.pan);VA.srcNode=src;VC.speaking=true;VA.st="speak";VA.barge=0;vcState("speak");
    src.onended=function(){if(VA.srcNode===src){VA.srcNode=null;VC.speaking=false;if(VC.on){VA.st="listen";vcState(VC.mute?"idle":"listen");done&&done()}}};
    src.start();return true}catch(e){return false}
}
function vaLevel(){
  var o=$("#vc");if(!o||!VC.on)return;var an=(VA.st==="speak"&&VA.pan)?VA.pan:VA.an;if(!an)return;
  var d=new Uint8Array(an.fftSize),i,s=0;an.getByteTimeDomainData(d);for(i=0;i<d.length;i++){var x=(d[i]-128)/128;s+=x*x}
  o.style.setProperty("--lv",Math.min(1,Math.sqrt(s/d.length)*5).toFixed(2));
}
function vcChips(list){var c=$("#vc-chips");if(!c)return;c.innerHTML="";(list||[]).forEach(function(t){var b=document.createElement("button");b.type="button";b.textContent=t;b.onclick=function(){vaStop();try{speechSynthesis.cancel()}catch(e){}VC.busy=false;vcChips([]);vcAsk(t)};c.appendChild(b)})}
function vcAct(a){
  var c=$("#vc-act");if(!c)return;c.innerHTML="";if(!a||!a.type||a.type==="none")return;
  var k=C.contact||{},ph=intl(k.phone||k.whatsapp||""),wa=intl(k.whatsapp||k.phone||"").replace("+",""),b=document.createElement("button");b.type="button";b.className="vc-actb";
  if(a.type==="request"){var sv=(C.services||[]).filter(function(x){return x.t.en===a.service})[0];b.textContent=vcT("افتح نموذج الطلب","Open the request form")+(sv?" · "+L(sv.t):"");
    b.onclick=function(){vcEnd();setTimeout(function(){if(PAGE!=="home"){location.href="index.html#request";return}var f=$("#rq");if(f){var s2=f.querySelector("select[name=service]");if(s2&&sv)s2.value=sv.t.en;var ms=f.querySelector("textarea");if(ms&&!ms.value&&sv)ms.value=(h.lang==="ar"?"عايز أطلب: ":"I'd like to request: ")+L(sv.t);$("#request").scrollIntoView({behavior:"smooth"})}},350)}}
  else if(a.type==="whatsapp"){b.textContent=vcT("كلمنا على واتساب","Chat on WhatsApp");b.onclick=function(){window.open("https://wa.me/"+wa,"_blank","noopener")}}
  else if(a.type==="call"){b.textContent=vcT("اتصل بينا","Call us");b.onclick=function(){location.href="tel:"+ph}}
  else return;
  c.appendChild(b);
}
function vcAudioAsk(b64){
  VC.turns++;var cfg=window.UNO_CFG,svcs=(C.services||[]).map(function(x){return x.t.en}).join("; "),fin=false;
  var to=setTimeout(function(){if(fin)return;fin=true;vcCloudFail()},25000);
  fetch(cfg.url+"/functions/v1/chat",{method:"POST",headers:{"Content-Type":"application/json",apikey:cfg.key,Authorization:"Bearer "+cfg.key},body:JSON.stringify({audio:b64,lang:h.lang,history:HIST.slice(-6),svcs:svcs})}).then(function(r){return r.json()}).then(function(j){
    if(fin||!VC.on)return;fin=true;clearTimeout(to);
    if(j.limited){vcCap("Uno",vcT("وصلت للحد المسموح حاليًا. جرب بعد شوية أو كلمنا على واتساب.","You've reached the current limit. Try again later or message us on WhatsApp."));vcAct({type:"whatsapp"});VA.st="idle";return}
    if(!j.t&&!j.a){if(j.fail||j.quota){vcCloudFail();return}vcCap("Uno",vcT("ما سمعتكش كويس، ممكن تعيد؟","I didn't catch that, could you repeat?"));VA.st="listen";vcState("listen");return}
    VC.fails=0;vcCap(vcT("إنت","You"),j.t||"…");HIST.push({r:"u",t:j.t||""},{r:"b",t:j.a||""});
    setTimeout(function(){vcCap("Uno",j.a);vcChips(j.chips);vcAct(j.act);vcAfter(j.a)},350);
  }).catch(function(){if(fin)return;fin=true;clearTimeout(to);vcCloudFail()});
}
function vcAfter(a){
  if(VC.turns>=VTURNS){vcCap("Uno",vcT("خلصنا الحد المسموح للمكالمة. كلمنا على واتساب أو ابدأ مكالمة تانية بعدين.","Call limit reached. Message us on WhatsApp or start another call later."));setTimeout(vcEnd,4500);return}
  vcSay(a)
}
function vcSay(a){
  if(VC.mode!=="cloud"||!window.fetch){vcSpeak(a,function(){vcListen()});return}
  var cfg=window.UNO_CFG;VA.st="think";vcState("think");
  fetch(cfg.url+"/functions/v1/chat",{method:"POST",headers:{"Content-Type":"application/json",apikey:cfg.key,Authorization:"Bearer "+cfg.key},body:JSON.stringify({mode:"tts",text:a,lang:h.lang})}).then(function(r){return r.json()}).then(function(j){
    if(!VC.on)return;
    if(j&&j.audio&&vaPlay(j.audio,j.rate||24000))return;
    $("#vc-note").textContent=vcT("الرد الصوتي مش متاح دلوقتي (حد الاستخدام المجاني)، بعرض الرد مكتوب.","Voice replies are unavailable right now (free usage limit), showing text.");
    VA.st="listen";vcState("listen")
  }).catch(function(){VA.st="listen";vcState("listen")});
}
function vcCloudFail(){
  VC.fails=(VC.fails||0)+1;
  if(VC.fails<2){vcCap("Uno",vcT("حصلت مشكلة بسيطة، جرب تقولها تاني.","Small hiccup, please say that again."));VA.st="listen";vcState("listen");return}
  VA.st="idle";VC.mode="browser";$("#vc-note").textContent=vcT("الخدمة السحابية مشغولة دلوقتي، هستخدم صوت المتصفح.","Cloud voice is busy, switching to your browser's voice.");
  if(vcSR())vcListen();else{vcState("text");$("#vc-tf").hidden=false}
}
function vaStart(cb){
  var AC=window.AudioContext||window.webkitAudioContext;
  if(!AC||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return cb(false);
  try{VA.ctx=new AC();VA.ctx.resume&&VA.ctx.resume()}catch(e){return cb(false)}
  navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}}).then(function(st){
    VA.stream=st;VA.src=VA.ctx.createMediaStreamSource(st);VA.an=VA.ctx.createAnalyser();VA.an.fftSize=512;VA.src.connect(VA.an);
    VA.proc=VA.ctx.createScriptProcessor(4096,1,1);VA.src.connect(VA.proc);var z=VA.ctx.createGain();z.gain.value=0;VA.proc.connect(z);z.connect(VA.ctx.destination);VA.proc.onaudioprocess=vaChunk;
    VA.cal=0;VA.calN=0;VA.pre=[];VA.buf=[];VA.rec=false;VA.st="listen";VA.lv=setInterval(vaLevel,60);cb(true)
  }).catch(function(e){cb(false,e&&e.name)});
}
function vaClose(){clearInterval(VA.lv);vaStop();try{VA.proc&&(VA.proc.onaudioprocess=null,VA.proc.disconnect())}catch(e){}try{VA.stream&&VA.stream.getTracks().forEach(function(t){t.stop()})}catch(e){}try{VA.ctx&&VA.ctx.close()}catch(e){}VA.ctx=null;VA.stream=null;VA.pan=null;VA.an=null;VA.st="idle"}

/* ---- Gemini Live (native audio over WebSocket, ephemeral token minted by our Edge Function) ---- */
var VL={ws:null,ok:false,q:[],nt:0,inT:"",outT:"",gotAudio:false};
function vlFallback(msg){
  if(VL.ws){try{VL.ws.onclose=null;VL.ws.onerror=null;VL.ws.close()}catch(e){}VL.ws=null}
  VL.ok=false;if(!VC.on||VC.mode!=="live")return;VC.mode="cloud";vlHalt();VA.st="listen";vcState(VC.mute?"idle":"listen");
  $("#vc-note").textContent=msg||vcT("هستخدم الوضع التقليدي (أبطأ شوية).","Switching to the standard voice mode (a bit slower).")
}
function vlHalt(){VL.q.forEach(function(s){try{s.onended=null;s.stop()}catch(e){}});VL.q=[];VL.nt=0;VC.speaking=false}
function vlPlay(b64){
  if(!VA.ctx)return;var bin=atob(b64),n=bin.length>>1,buf=VA.ctx.createBuffer(1,n,24000),ch=buf.getChannelData(0),i;
  for(i=0;i<n;i++){var v=bin.charCodeAt(i*2)|(bin.charCodeAt(i*2+1)<<8);if(v>32767)v-=65536;ch[i]=v/32768}
  var src=VA.ctx.createBufferSource();src.buffer=buf;if(!VA.pan){VA.pan=VA.ctx.createAnalyser();VA.pan.fftSize=512;VA.pan.connect(VA.ctx.destination)}
  src.connect(VA.pan);var now=VA.ctx.currentTime;if(VL.nt<now+0.03)VL.nt=now+0.03;src.start(VL.nt);VL.nt+=buf.duration;VL.q.push(src);
  src.onended=function(){var k=VL.q.indexOf(src);if(k>=0)VL.q.splice(k,1);if(!VL.q.length&&VC.on&&VC.mode==="live"){VC.speaking=false;if(VA.st==="speak"){VA.st="listen";vcState(VC.mute?"idle":"listen")}}};
  VC.speaking=true;VA.st="speak";vcState("speak")
}
function vlSend(o){if(VL.ws&&VL.ws.readyState===1)VL.ws.send(JSON.stringify(o))}
function vlChunk(c){
  if(!VL.ok||VC.mute)return;
  if(VL.q.length||VA.st==="speak"){var sm0=0,q0;for(q0=0;q0<c.length;q0++)sm0+=c[q0]*c[q0];var r0=Math.sqrt(sm0/c.length);if(r0>0.12)VL.bg=(VL.bg||0)+1;else VL.bg=0;if(VL.bg<3)return}else VL.bg=0;var ratio=VA.ctx.sampleRate/16000,m=Math.floor(c.length/ratio),pcm=new Uint8Array(m*2),i,j;
  for(i=0;i<m;i++){var a=Math.floor(i*ratio),b=Math.min(c.length,Math.floor((i+1)*ratio)),sm=0,k=0;for(j=a;j<b;j++){sm+=c[j];k++}var v=k?sm/k:0;v=Math.max(-1,Math.min(1,v));v=v<0?v*32768:v*32767;v=v|0;pcm[i*2]=v&255;pcm[i*2+1]=(v>>8)&255}
  var bin="";for(i=0;i<pcm.length;i+=8192)bin+=String.fromCharCode.apply(null,pcm.subarray(i,i+8192));
  vlSend({realtimeInput:{audio:{data:btoa(bin),mimeType:"audio/pcm;rate=16000"}}})
}
function vlTick(){try{var c=VA.ctx;if(!c)return;var o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.value=660;g.gain.setValueAtTime(0.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(0.06,c.currentTime+0.01);g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+0.09);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+0.1)}catch(e){}}
function vlMsg(m){
  if(m.voiceActivity){if(m.voiceActivity.type==="ACTIVITY_END"&&!VL.q.length&&VA.st==="listen"&&VL.inT)vcState("think")}
  if(m.serverContent){var sc=m.serverContent;
    if(sc.interrupted){vlHalt();VA.st="listen";vcState("listen")}
    if(sc.inputTranscription&&sc.inputTranscription.text){if(VL.outT){VL.outT="";VL.inT=""}VL.inT+=sc.inputTranscription.text;vcCap(vcT("إنت","You"),VL.inT.trim());vcChips([]);if(VA.st!=="speak")vcState("think")}
    if(sc.modelTurn&&sc.modelTurn.parts)sc.modelTurn.parts.forEach(function(p){if(p.inlineData&&p.inlineData.data){VL.gotAudio=true;vlPlay(p.inlineData.data)}});
    if(sc.outputTranscription&&sc.outputTranscription.text){VL.outT+=sc.outputTranscription.text;vcCap("Uno",VL.outT.trim())}
    if(sc.turnComplete){if(VL.inT||VL.outT)HIST.push({r:"u",t:VL.inT.trim()},{r:"b",t:VL.outT.trim()});VL.inT="";VL.outT="";VC.turns++;
      if(VC.turns>=VTURNS){vcCap("Uno",vcT("خلصنا الحد المسموح للمكالمة. كلمنا على واتساب أو ابدأ مكالمة تانية بعدين.","Call limit reached. Message us on WhatsApp or start another call later."));setTimeout(vcEnd,4500)}
      else if(!VL.q.length){VA.st="listen";vcState(VC.mute?"idle":"listen")}}}
  if(m.toolCall&&m.toolCall.functionCalls){
    var rs=m.toolCall.functionCalls.map(function(f){if(f.name==="ui_action"&&f.args){vcChips((f.args.chips||[]).slice(0,4));var a=f.args.action,sv=f.args.service;if(a&&a!=="none")vcAct({type:a,service:sv})}return {id:f.id,name:f.name,response:{result:"ok"},scheduling:"SILENT"}});
    vlSend({toolResponse:{functionResponses:rs}})}
}
function vlStart(done){
  var cfg=window.UNO_CFG,svcs=(C.services||[]).map(function(x){return x.t.en}).join("; "),fin=false,
  to=setTimeout(function(){if(fin)return;fin=true;done(false)},9000);
  function fail(){if(fin)return;fin=true;clearTimeout(to);done(false)}
  if(!window.WebSocket||!window.fetch)return fail();
  fetch(cfg.url+"/functions/v1/chat",{method:"POST",headers:{"Content-Type":"application/json",apikey:cfg.key,Authorization:"Bearer "+cfg.key},body:JSON.stringify({mode:"live",svcs:svcs,lang:h.lang})}).then(function(r){return r.json()}).then(function(j){
    if(window.UNO_vt)UNO_vt.token=Date.now()-VC.t0;if(fin||!j||!j.token)return fail();
    var ws=new WebSocket("wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token="+encodeURIComponent(j.token));VL.ws=ws;
    ws.onopen=function(){ws.send(JSON.stringify({setup:{model:"models/"+(j.model||"gemini-3.8-live")}}))};
    ws.onmessage=function(ev){
      function go(t){var m;try{m=JSON.parse(t)}catch(e){return}
        if(m.setupComplete&&!fin){fin=true;clearTimeout(to);VL.ok=true;if(window.UNO_vt)UNO_vt.setup=Date.now()-VC.t0;VL.inT="";VL.outT="";VL.q=[];VL.nt=0;done(true);return}
        if(VL.ok)vlMsg(m)}
      if(typeof ev.data==="string")go(ev.data);else if(ev.data&&ev.data.text)ev.data.text().then(go)
    };
    ws.onerror=function(){if(!fin)fail();else if(VL.ok)vlFallback()};
    ws.onclose=function(){if(!fin)fail();else if(VL.ok&&VC.on)vlFallback(vcT("انقطع الاتصال السريع، هكمل بالوضع التقليدي.","Fast connection dropped, continuing in standard mode."))}
  }).catch(fail)
}
function vcStart(){
  if(VC.on)return;
  var day=new Date().toISOString().slice(0,10),n=0;try{var j=JSON.parse(localStorage.getItem("uno_vc2")||"{}");n=j.d===day?j.n:0;if(n>=VDAY&&!vcOwner()){alert(vcT("وصلت للحد اليومي للمكالمات الصوتية. ممكن تكتب في الشات أو تكلمنا على واتساب.","Daily voice call limit reached. You can use the text chat or WhatsApp."));return}localStorage.setItem("uno_vc2",JSON.stringify({d:day,n:n+1}))}catch(e){}
  if(chatOpen)closeChat();
  var ch=C.chatbot,SR=vcSR();
  document.body.insertAdjacentHTML("beforeend",'<div id="vc" role="dialog" aria-modal="true" aria-label="'+U(vcT("مكالمة صوتية مع أونو","Voice call with Uno"))+'" data-s="think"><div class="vc-top"><span id="vc-tm">00:00</span><span class="vc-live"></span></div><div class="vc-orb"><i></i><i></i><i></i><img src="'+U(ch.avatar)+'" alt="Uno"></div><h2>Uno</h2><p id="vc-st" class="vc-st" aria-live="polite"></p><div id="vc-cap" class="vc-cap" aria-live="polite"></div><div id="vc-act" class="vc-act"></div><div id="vc-chips" class="vc-chips"></div><p id="vc-note" class="vc-note"></p><form id="vc-tf" class="vc-tf" '+(SR?'hidden':'')+'><input id="vc-ti" type="text" autocomplete="off" maxlength="300" placeholder="'+U(vcT("اكتب سؤالك...","Type your question..."))+'"><button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 20l18-8L3 4v6l11 2-11 2z"/></svg></button></form><div class="vc-btns"><button type="button" id="vc-mu" aria-pressed="false" aria-label="Mute"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/><path class="sl" d="M4 4l16 16"/></svg><span>'+vcT("كتم","Mute")+'</span></button><button type="button" id="vc-kb" aria-label="Keyboard"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/></svg><span>'+vcT("كتابة","Type")+'</span></button><button type="button" id="vc-end" class="end" aria-label="End call"><svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 9c-3 0-5.700.8-8 2.400-.5.400-.6 1-.2 1.500l1.500 2c.3.400.9.500 1.300.2l2-1.200c.3-.2.500-.5.500-.9V12c1.600-.5 3.300-.5 4.900 0v1c0 .4.200.700.500.900l2 1.200c.400.300 1 .2 1.300-.2l1.500-2c.400-.5.300-1.100-.2-1.500C17.700 9.800 15 9 12 9z"/></svg><span>'+vcT("إنهاء","End")+'</span></button></div></div>');
  document.body.classList.add("vc-open");VC.on=true;VC.fails=0;VC.mute=false;VC.turns=0;VC.busy=false;VC.t0=Date.now();VC.tick=setInterval(vcTimer,1000);
  $("#vc-end").onclick=vcEnd;
  $("#vc-mu").onclick=function(){VC.mute=!VC.mute;this.setAttribute("aria-pressed",VC.mute);this.classList.toggle("on",VC.mute);if(VC.mute){try{VC.rec&&VC.rec.abort()}catch(e){}vaStop();VA.rec=false;VA.buf=[];vcState("idle")}else{if(VC.mode==="cloud"){VA.st="listen";vcState("listen")}else vcListen()}};
  $("#vc-kb").onclick=function(){var f=$("#vc-tf");f.hidden=!f.hidden;if(!f.hidden)$("#vc-ti").focus()};
  $("#vc-tf").onsubmit=function(e){e.preventDefault();var i=$("#vc-ti"),v=i.value.trim();if(!v)return;i.value="";vaStop();VA.rec=false;try{VC.rec&&VC.rec.abort()}catch(e2){}try{speechSynthesis.cancel()}catch(e3){}VC.busy=false;vcAsk(v)};
  document.addEventListener("keydown",function esc2(e){if(!VC.on){document.removeEventListener("keydown",esc2);return}if(e.key==="Escape")vcEnd()});
  if(window.speechSynthesis)speechSynthesis.getVoices();
  var g=vcT("أهلاً! أنا أونو. اتفضل اسألني عن خدماتنا.","Hi! I'm Uno. Ask me about our services.");vcCap("Uno",g);
  vcChips((C.chatbot.quick||[]).slice(0,3).map(function(q){return L(q.t)}));
  vcState("connect");VC.mode="connect";VL.res=undefined;VL.cb=null;VL.ok=false;window.UNO_vt={};
  vlStart(function(r){VL.res=r;if(VL.cb){var f=VL.cb;VL.cb=null;f(r)}});
  vaStart(function(ok,err){
    if(!VC.on)return;
    if(ok){var go=function(lok){if(!VC.on)return;
        if(lok){VC.mode="live";VA.st="listen";$("#vc-note").textContent=vcT("اتكلم عادي بأي لغة، وممكن تقاطعني في أي وقت. الصوت بيتعالج بواسطة Google Gemini (الخدمة المجانية، وجوجل ممكن تستخدمه لتحسين منتجاتها).","Just talk in any language and interrupt anytime. Audio is processed by Google Gemini (free tier; Google may use it to improve its products).");vcState("listen");window.UNO_vt&&(window.UNO_vt.ready=Date.now()-VC.t0)}
        else{VC.mode="cloud";VA.st="listen";$("#vc-note").textContent=vcT("اتكلم عادي، وممكن تقاطعني في أي وقت. الصوت بيتعالج على السيرفر بتاعنا باستخدام Gemini.","Just talk, and interrupt anytime. Audio is processed on our server using Gemini.");vcState("listen")}};
      VA.st="idle";vcState("connect");if(VL.res===undefined)VL.cb=go;else go(VL.res)}
    else{VC.mode="browser";if(VL.ws){try{VL.ws.onclose=null;VL.ws.close()}catch(e){}VL.ws=null}VL.ok=false;
      if(err==="NotAllowedError"||err==="SecurityError"){$("#vc-note").textContent=vcT("المايك مش مسموح. فعّل إذن المايك من إعدادات المتصفح، أو اكتب سؤالك.","Microphone blocked. Allow it in browser settings, or type your question.");vcState("text");$("#vc-tf").hidden=false}
      else if(SR){$("#vc-note").textContent=vcT("الصوت بيتعالج بخدمة التعرف على الكلام في متصفحك.","Speech is processed by your browser's speech recognition service.");vcListen()}
      else{$("#vc-note").textContent=vcT("جهازك مش بيدعم المايك هنا. اكتب سؤالك وهعرضلك الرد.","Microphone is not available here. Type your question and I will show the answer.");vcState("text");$("#vc-tf").hidden=false}}
  });
}
window.UNO_voice=vcStart;
function boot(){
  shell(); setLang(q||sl||C.site.defaultLang||"ar");
  if(PAGE==="home")home(); else if(PAGE==="blog")blog(); else if(PAGE==="tools")tools(); else if(PAGE==="store")store(); else if(PAGE==="account")account(); else if(PAGE==="privacy")privacy();
  if(PAGE==="home"||PAGE==="blog"||PAGE==="tools"||PAGE==="store"){var ad=document.createElement("script");ad.src="assets/ads.js?v=20261127i";document.body.appendChild(ad)}
  chatUI(); wire(); (function(){var b=$("#mb-chat");if(b)b.onclick=function(){openChat()}})();
  setTheme(st||"light");
  reveal();
  if(PAGE==="home"&&/^#project\//.test(location.hash)){projRoute()}
  else if(PAGE==="home"&&location.hash){var el=$(location.hash);if(el)setTimeout(function(){el.scrollIntoView()},50)}
}
if(PAGE!=="admin")boot();
})();
