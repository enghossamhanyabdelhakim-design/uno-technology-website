/* Uno Technology Services - site engine. Content comes from assets/content.js (window.UNO). */
(function(){
"use strict";
var ICP={"device": "<rect x=\"3\" y=\"4\" width=\"18\" height=\"12\" rx=\"2\"/><path d=\"M8 20h8M12 16v4\"/>", "phone": "<rect x=\"7\" y=\"2\" width=\"10\" height=\"20\" rx=\"2.5\"/><path d=\"M11 18h2\"/>", "cam": "<path d=\"M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2zM15 11l6-3v8l-6-3\"/>", "globe": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M3 12h18M12 3c3 3.500 3 14.500 0 18M12 3c-3 3.500-3 14.500 0 18\"/>", "cart": "<path d=\"M3 4h2l2.500 11h10L20 8H6.500\"/><circle cx=\"9\" cy=\"19\" r=\"1.500\"/><circle cx=\"17\" cy=\"19\" r=\"1.500\"/>", "art": "<path d=\"M12 3a9 9 0 100 18c1.500 0 2-1 1.500-2s0-2 1.500-2h2a3 3 0 003-3c0-5-4-11-8-11z\"/><circle cx=\"8\" cy=\"11\" r=\"1\"/><circle cx=\"12\" cy=\"7.500\" r=\"1\"/><circle cx=\"16\" cy=\"11\" r=\"1\"/>", "print": "<path d=\"M7 9V3h10v6M7 17H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2\"/><rect x=\"7\" y=\"14\" width=\"10\" height=\"7\" rx=\"1\"/>", "cloud": "<path d=\"M7 18a4 4 0 01-.5-8A6 6 0 0118 11a3.500 3.500 0 01-.5 7z\"/>", "plug": "<path d=\"M9 3v5M15 3v5M6 8h12v3a6 6 0 01-12 0zM12 17v4\"/>", "wrench": "<path d=\"M14.500 6.500a4 4 0 005 5L21 13l-8 8a2.100 2.100 0 01-3-3l8-8zM14.500 6.500a4 4 0 00-5.500-4l3 3-2 2-3-3a4 4 0 005 5.500\"/>", "signal": "<path d=\"M5 12.500a10 10 0 0114 0M8 15.500a6 6 0 018 0M12 19h.01M2 9a14 14 0 0120 0\"/>", "building": "<path d=\"M4 21V4h10v17M14 9h6v12M2 21h20M8 8h2M8 12h2M8 16h2\"/>", "puzzle": "<path d=\"M10 4a2 2 0 114 0v2h4v4h-2a2 2 0 100 4h2v6H4v-6h2a2 2 0 100-4H4V6h6z\"/>", "disk": "<ellipse cx=\"12\" cy=\"6\" rx=\"8\" ry=\"3\"/><path d=\"M4 6v12c0 1.700 3.600 3 8 3s8-1.300 8-3V6M4 12c0 1.700 3.600 3 8 3s8-1.300 8-3\"/>", "bell": "<path d=\"M6 17V11a6 6 0 1112 0v6l2 2H4zM10 21h4\"/>", "lock": "<rect x=\"5\" y=\"11\" width=\"14\" height=\"10\" rx=\"2\"/><path d=\"M8 11V8a4 4 0 118 0v3\"/>", "doc": "<path d=\"M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6\"/>", "chat": "<path d=\"M4 4h16v12H9l-5 5z\"/>"},ICM={"💻": "device", "🖥": "device", "📱": "phone", "📹": "cam", "🌐": "globe", "🛒": "cart", "🎨": "art", "🖨": "print", "☁": "cloud", "🔌": "plug", "🔧": "wrench", "📡": "signal", "📶": "signal", "🏢": "building", "🧩": "puzzle", "💽": "disk", "💾": "disk", "🔔": "bell", "🚨": "bell", "🔐": "lock", "📝": "doc"};
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
try{sl=localStorage.getItem("lang");st=localStorage.getItem("theme")}catch(e){}

/* ---------- shell ---------- */
var PAGE=document.body.dataset.page||"home";
function socials(cls){return (C.social||[]).filter(function(s){return s.url}).map(function(s){return '<a class="'+cls+'" href="'+U(s.url)+'" target="_blank" rel="noopener">'+esc(s.name)+'</a>'}).join("")}
function header(){
  var N=C.nav, link=function(href,k,pg){return '<a href="'+href+'"'+(PAGE===pg?' class="act"':'')+'>'+B(N[k])+'</a>'};
  return '<header><div class="wrap nav"><a href="index.html" aria-label="Home"><img src="'+U(C.images.logoHeader)+'" alt="'+U(C.site.name.en)+'"></a><nav>'+
  link("index.html","about","home_")+link("index.html#services","services","x")+link("tools.html","tools","tools")+link("blog.html","blog","blog")+link("index.html#contact","contact","x")+
  '</nav><div class="tools"><button class="icb" id="theme" type="button" aria-label="Dark mode">\u263E</button><button class="lang" id="lang" type="button" aria-label="Language / اللغة"><span class="ar">English</span><span class="en">\u0627\u0644\u0639\u0631\u0628\u064A\u0629</span></button><button class="icb" id="menu" type="button" aria-label="Menu">\u2630</button></div></div></header>';
}
function footer(){
  return '<footer><div class="wrap"><img src="'+U(C.images.logoMark)+'" alt=""><br>'+B(C.footer.text)+' \u00A9 <span id="yr"></span><div class="fsoc">'+socials("fl")+'</div></div></footer>';
}
function shell(){
  var main=$("#app"); document.body.insertAdjacentHTML("afterbegin",header()); document.body.insertAdjacentHTML("beforeend",footer());
  $("#yr").textContent=new Date().getFullYear();
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
function postCard(p){
  var cat=(C.blog.cats.filter(function(c){return c.id===p.cat})[0])||{};
  return '<a class="pc rv" href="blog.html#'+U(p.slug)+'">'+(p.img?'<img src="'+U(p.img)+'" alt="" loading="lazy">':'<div class="pci">'+ico(p.icon||"\uD83D\uDCDD")+'</div>')+
   '<div class="pcb"><small>'+B(cat.t||"")+'</small><h3>'+B(p.title)+'</h3><p>'+B(p.summary)+'</p><span class="more">'+B(C.blog.readMore)+' \u2192</span></div></a>';
}
function home(){
  var S=C.site, x=C.sections, o='';
  var chips=(C.hero2&&C.hero2.chips||[]).map(function(c,i){return '<span class="fx-chip fc'+i+'">'+B(c)+'</span>'}).join("");
  o+='<div class="hero"><div class="hero-fx" aria-hidden="true"><i class="grid"></i><i class="glow g1"></i><i class="glow g2"></i><i class="scan"></i></div><div class="wrap hg"><div class="ht"><span class="tag">'+B(S.name)+'</span><h1>'+B(S.heroTitle,true)+'</h1><p>'+B(S.heroText)+'</p><div class="btns"><a class="btn" href="#request">'+B(S.heroBtn1)+'</a><a class="btn alt" href="#services">'+B(S.heroBtn2)+'</a></div></div>'+
   '<div class="heroimg"><div class="stage"><i class="orb o1"></i><i class="orb o2"></i><i class="orb o3"></i><img class="big" id="hero-bot" src="'+U(C.images.hero)+'" alt="Uno robot" width="440" height="440" fetchpriority="high">'+chips+'<button class="bub" id="hero-ask" type="button">'+B({ar:String(C.chatbot.bubble.ar).replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu,'').trim(),en:String(C.chatbot.bubble.en).replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu,'').trim()})+'<svg class="bub-i" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 4h16v11H9l-5 5z" fill="currentColor"/></svg></button></div></div></div></div>';
  o+='<section id="about"><div class="wrap"><h2>'+B(x.about.t)+'</h2><div class="about"><img src="'+U(C.images.about)+'" alt=""><div><p>'+B(S.about1)+'</p><p>'+B(S.about2)+'</p></div></div><div class="why">'+
   C.why.map(function(w){return '<div class="rv">'+(w.img?'<img class="pose" src="'+U(w.img)+'" alt="" loading="lazy">':'')+'<b>'+B(w.t)+'</b>'+B(w.d)+'</div>'}).join("")+'</div></div></section>';
  if(C.founder){var F0=C.founder;o+='<section id="founder"><div class="wrap"><h2>'+B(x.founder)+'</h2><div class="fcard rv"><img src="'+U(F0.img)+'" alt="'+U(F0.name.en)+'" width="220" height="275" loading="lazy"><div><h3>'+B(F0.name)+'</h3><b class="frole">'+B(F0.role)+'</b><p>'+B(F0.cap)+'</p></div></div></div></section>';}
  o+='<section class="alt-bg"><div class="wrap"><div class="bans">'+C.banners.map(function(b,i){return '<a class="ban rv b'+(i%4)+'" href="'+U(b.link)+'"><div class="bt"><small>'+B(b.tag)+'</small><b>'+B(b.title)+'</b><span>'+B(b.text)+'</span><i class="bb">'+B(b.btn)+'</i></div>'+(b.img?'<img src="'+U(b.img)+'" alt="" loading="lazy">':'')+'</a>'}).join("")+'</div></div></section>';
  var cats=C.serviceCats;
  o+='<section id="services"><div class="wrap"><h2>'+B(x.services.t)+'</h2><p class="sub">'+B(x.services.d)+'</p><div class="chips" id="chips"><button class="chip on" data-f="all">'+B(C.serviceAll)+'</button>'+cats.map(function(c){return '<button class="chip" data-f="'+U(c.id)+'">'+B(c.t)+'</button>'}).join("")+'</div><div class="grid">'+
   C.services.map(function(s){return '<article class="card rv" data-c="'+U(s.cat)+'"><div class="ic">'+(s.img?'<img src="'+U(s.img)+'" alt="">':ico(s.icon))+'</div><h3>'+B(s.t)+'</h3><ul>'+s.items.map(function(i){return '<li>'+B(i)+'</li>'}).join("")+'</ul></article>'}).join("")+'</div></div></section>';
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
  $$(".chip").forEach(function(c){c.onclick=function(){$$(".chip").forEach(function(y){y.classList.remove("on")});c.classList.add("on");var f=c.dataset.f;$$(".card[data-c]").forEach(function(k){k.style.display=(f==="all"||k.dataset.c===f)?"":"none"})}});
  (function(){var f=$("#rq");if(!f)return;var cfg=window.UNO_CFG,k=C.contact;
    function txt(){var d=new FormData(f);return L(F.wamsg)+" "+d.get("service")+(d.get("msg")?"\n"+d.get("msg"):"")+"\n"+(d.get("name")||"")+" "+(d.get("phone")||"")}
    function wa(){var n=intl(k.whatsapp||k.phone).replace("+","");return "https://wa.me/"+n+"?text="+encodeURIComponent(txt())}
    var a=$("#rq-wa");a.onclick=function(){a.href=wa()};
    f.onsubmit=function(e){e.preventDefault();var st=$("#rq-st"),d=new FormData(f);if(!d.get("name").trim()||!d.get("phone").trim()){st.textContent=L({ar:"اكتب الاسم ورقم التليفون.",en:"Please enter your name and phone."});return}
      st.textContent="...";
      fetch(cfg.url+"/rest/v1/requests",{method:"POST",headers:{apikey:cfg.key,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({name:d.get("name").trim(),phone:d.get("phone").trim(),service:d.get("service"),message:(d.get("msg")||"").trim(),lang:h.lang})}).then(function(r){if(!r.ok)throw 0;st.textContent=L(F.ok);f.reset()}).catch(function(){st.textContent=L(F.err)})}})();
  $$(".card[data-c] h3").forEach(function(hh){if(hh.querySelector("button"))return;hh.innerHTML='<button type="button" class="h3b" aria-expanded="false">'+hh.innerHTML+"</button>";var bt=hh.firstChild;bt.onclick=function(){var c=hh.parentNode;c.classList.toggle("open");bt.setAttribute("aria-expanded",c.classList.contains("open"))}});
  var ask=function(){openChat(true)}; $("#hero-ask").onclick=ask; $("#hero-bot").onclick=ask;
}

/* ---------- blog ---------- */
function blog(){
  var P=C.blog.posts.filter(function(p){return p.published!==false}), cats=C.blog.cats;
  var slug=decodeURIComponent((location.hash||"").replace("#","")), post=P.filter(function(p){return p.slug===slug})[0];
  if(post){
    var cat=cats.filter(function(c){return c.id===post.cat})[0]||{};
    var rel=P.filter(function(p){return p.slug!==post.slug&&p.cat===post.cat}).concat(P.filter(function(p){return p.slug!==post.slug&&p.cat!==post.cat})).slice(0,3);
    $("#app").innerHTML='<section><div class="wrap art"><a class="back" href="blog.html">\u2190 '+B(C.blog.back)+'</a><small class="catl">'+B(cat.t||"")+'</small><h1>'+B(post.title)+'</h1>'+(post.img?'<img class="aimg" src="'+U(post.img)+'" alt="">':'')+'<div class="abody">'+B(post.body,true)+'</div><div class="acta"><b>'+B(C.blog.help)+'</b> <a class="btn" href="'+U(ctaBtn())+'">'+B(C.blog.contactBtn)+'</a> <button class="btn alt" type="button" id="askart">'+B(C.blog.askUno)+'</button></div><h2 style="margin-top:50px">'+B(C.blog.related)+'</h2><div class="pgrid3">'+rel.map(postCard).join("")+'</div></div></section>';
    document.title=L(post.title)+" | "+L(C.site.name);
    $("#askart").onclick=function(){openChat(true,L(post.title))};
    window.scrollTo(0,0);
  }else{
    document.title=L(C.sections.blog.t)+" | "+L(C.site.name);
    $("#app").innerHTML='<section><div class="wrap"><h2>'+B(C.sections.blog.t)+'</h2><p class="sub">'+B(C.sections.blog.d)+'</p><div class="bsearch"><input id="bq" type="search" placeholder="'+U(L(C.blog.search))+'"></div><div class="chips" id="bchips"><button class="chip on" data-f="all">'+B(C.serviceAll)+'</button>'+cats.map(function(c){return '<button class="chip" data-f="'+U(c.id)+'">'+B(c.t)+'</button>'}).join("")+'</div><div class="pgrid3" id="plist"></div></div></section>';
    var f="all",qq="";
    function draw(){
      var n=norm(qq), list=P.filter(function(p){return (f==="all"||p.cat===f)&&(!n||norm(L(p.title)+" "+L(p.summary)+" "+(p.kw||"")).indexOf(n)>-1||norm(p.title.ar+" "+p.title.en+" "+p.summary.ar+" "+p.summary.en+" "+(p.kw||"")).indexOf(n)>-1)});
      $("#plist").innerHTML=list.length?list.map(postCard).join(""):'<p class="sub">'+B(C.blog.none)+'</p>';
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
function tools(){
  var order=[["pc",bi("لابتوب / كمبيوتر","Laptop / PC")],["phone",bi("موبايل","Phone")],["cctv",bi("كاميرات مراقبة","CCTV planner")]];
  var cur=(location.hash||"#pc").replace("#",""); if(!T[cur])cur="pc";
  $("#app").innerHTML='<section><div class="wrap"><h2>'+B(C.sections.tools.t)+'</h2><p class="sub">'+B(C.sections.tools.d)+'</p><div class="chips" id="tabs">'+order.map(function(o){return '<button class="chip'+(o[0]===cur?' on':'')+'" data-t="'+o[0]+'">'+ico({pc:"💻",phone:"📱",cctv:"📹"}[o[0]])+B(o[1])+'</button>'}).join("")+'</div><div class="tool"><form id="tf" class="tform"></form><div id="tout" class="tout"></div></div></div></section>';
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
  document.body.insertAdjacentHTML("beforeend",'<button id="chat-fab" type="button" aria-label="Uno chat"><img src="'+U(ch.avatar)+'" alt="Uno"><span class="dot"></span></button><div id="chat" role="dialog" aria-label="Uno assistant" hidden><div class="ch-h"><img src="'+U(ch.avatar)+'" alt=""><div><b>'+B(ch.name)+'</b><small>'+B(ch.status)+'</small></div><button type="button" id="ch-x" aria-label="Close">\u2715</button></div><div class="ch-b" id="ch-b" aria-live="polite"></div><div class="ch-q" id="ch-q"></div><form class="ch-f" id="ch-f"><input id="ch-i" type="text" autocomplete="off" placeholder="'+U(L(ch.placeholder))+'"><button type="submit" aria-label="Send">\u27A4</button></form></div>');
  $("#chat-fab").onclick=function(){openChat()}; $("#ch-x").onclick=function(){closeChat()};
  $("#ch-f").onsubmit=function(e){e.preventDefault();var i=$("#ch-i"),v=i.value.trim();if(!v)return;i.value="";user(v);ask(v)};
}
var HIST=[];
function ask(v){
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
  var k=C.contact||{},n=intl(k.whatsapp||k.phone||"").replace("+","");
  $("#app").innerHTML='<section><div class="wrap soon"><div class="soon-ic">'+ico("\uD83D\uDED2")+'</div><h2>'+B({ar:"متجر أونو",en:"Uno Store"})+'</h2><p class="sub">'+B({ar:"المتجر الإلكتروني قيد التجهيز وهيفتح قريب. لحد ما يفتح، تقدر تطلب أي منتج أو خدمة من خلال واتساب.",en:"The online store is being prepared and opens soon. Until then you can ask for any product or service on WhatsApp."})+'</p><div class="btns">'+(n?'<a class="btn" href="https://wa.me/'+U(n)+'" target="_blank" rel="noopener">'+B({ar:"اطلب على واتساب",en:"Order on WhatsApp"})+'</a>':'')+'<a class="btn alt" href="index.html#services">'+B({ar:"شوف الخدمات",en:"See services"})+'</a></div></div></section>';
  document.title=(h.lang==="en"?"Store | ":"المتجر | ")+((C.site&&C.site.name&&(C.site.name.en))||"Uno");
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
function boot(){
  shell(); setLang(q||sl||C.site.defaultLang||"ar");
  if(PAGE==="home")home(); else if(PAGE==="blog")blog(); else if(PAGE==="tools")tools(); else if(PAGE==="store")store();
  chatUI(); wire(); (function(){var b=$("#mb-chat");if(b)b.onclick=function(){openChat()}})();
  setTheme(st||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"));
  reveal();
  if(PAGE==="home"&&/^#project\//.test(location.hash)){projRoute()}
  else if(PAGE==="home"&&location.hash){var el=$(location.hash);if(el)setTimeout(function(){el.scrollIntoView()},50)}
}
if(PAGE!=="admin")boot();
})();
