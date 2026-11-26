/* Uno ads: config-driven AdSense slots. Nothing shows until the owner saves a publisher ID in admin > Ads (or turns on house ads). Never loaded on admin, account or checkout. Ads script loads only after the visitor accepts the notice. */
(function(){
var P=document.body.dataset.page,KEY={home:"home",blog:"blog",tools:"tools",store:"store"}[P];if(!KEY)return;
var c=window.UNO_CFG,lang=function(){return document.documentElement.lang==="en"?"en":"ar"};
function T(a,e){return lang()==="en"?e:a}
fetch(c.url+"/rest/v1/ads_config?select=data&id=eq.1",{headers:{apikey:c.key,Authorization:"Bearer "+c.key}}).then(function(r){return r.ok?r.json():[]}).then(function(rows){
 var d=(rows[0]&&rows[0].data)||{},pub=/^pub-\d{8,20}$/.test(d.publisher||"")?d.publisher:"",sl=(d.slots&&d.slots[KEY])||{},slot=/^\d{5,20}$/.test(sl.slot||"")?sl.slot:"",house=!!d.house;
 if(sl.on===false)return;
 if(!(pub&&slot)&&!house)return;
 var anchor={home:"#services",blog:".chips",tools:"#tabs",store:".pg"}[KEY];
 var tries=0,iv=setInterval(function(){var a=document.querySelector(anchor);if(a||++tries>40){clearInterval(iv);if(a)mount(a)}},250);
 function houseAd(box){var i=Math.random()<.5?"security":"technology";box.innerHTML='<a class="hadv" href="index.html#request"><img src="assets/ad-'+i+'.webp" alt="'+T("أونو للخدمات التكنولوجية","Uno Technology Services")+'" width="1200" height="628" loading="lazy"></a>'}
 function mount(a){
  var box=document.createElement("aside");box.className="adslot";box.setAttribute("aria-label",T("إعلان","Advertisement"));box.innerHTML='<small>'+T("إعلان","Ad")+'</small><div class="adin"></div>';
  a.insertAdjacentElement("afterend",box);
  var inn=box.querySelector(".adin");
  if(!(pub&&slot)){houseAd(inn);return}
  var ch=null;try{ch=localStorage.getItem("uno_consent")}catch(e){}
  if(ch==="no"){if(house)houseAd(inn);else box.remove();return}
  if(ch!=="yes"){if(house)houseAd(inn);else box.hidden=true;ask(function(){location.reload()});return}
  inn.innerHTML='<ins class="adsbygoogle" style="display:block" data-ad-client="ca-'+pub+'" data-ad-slot="'+slot+'" data-ad-format="auto" data-full-width-responsive="true"></ins>';
  var s=document.createElement("script");s.async=true;s.crossOrigin="anonymous";s.src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-"+pub;s.onload=function(){try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}};document.head.appendChild(s);
  setTimeout(function(){var ins=inn.querySelector("ins");if(ins&&ins.getAttribute("data-ad-status")!=="filled"){if(house)houseAd(inn);else box.hidden=true}},5000)}
 function ask(done){if(document.getElementById("cns"))return;var b=document.createElement("div");b.id="cns";b.setAttribute("role","dialog");b.setAttribute("aria-label",T("الكوكيز","Cookies"));b.innerHTML='<p>'+T("بنستخدم كوكيز لعرض إعلانات وتحسين الموقع. تقدر توافق أو ترفض، والموقع بيشتغل في الحالتين.","We use cookies to show ads and improve the site. You can accept or decline; the site works either way.")+' <a href="privacy.html">'+T("سياسة الخصوصية","Privacy policy")+'</a></p><div><button type="button" id="cn-y">'+T("موافق","Accept")+'</button><button type="button" id="cn-n" class="alt">'+T("رفض","Decline")+'</button></div>';document.body.appendChild(b);
  function set(v){try{localStorage.setItem("uno_consent",v)}catch(e){}b.remove();done()}document.getElementById("cn-y").onclick=function(){set("yes")};document.getElementById("cn-n").onclick=function(){set("no")}}
}).catch(function(){});
var st=document.createElement("style");st.textContent=".adslot{max-width:1160px;margin:24px auto;padding:0 20px;text-align:center}.adslot small{display:block;color:var(--mut);font-size:.72rem;margin-bottom:4px}.adslot .hadv img{width:100%;height:auto;max-width:728px;border-radius:18px;display:block;margin:auto}#cns{position:fixed;inset-inline:12px;bottom:84px;z-index:70;background:var(--bg);color:var(--ink);border:1px solid var(--ln);border-radius:18px;padding:14px 16px;box-shadow:0 14px 40px rgba(0,0,0,.25);max-width:560px;margin-inline:auto;display:grid;gap:10px}#cns p{margin:0;font-size:.9rem}#cns a{color:var(--o)}#cns div{display:flex;gap:8px}#cns button{flex:1;border:0;background:var(--o);color:#fff;font:inherit;font-weight:700;border-radius:12px;min-height:44px;cursor:pointer}#cns button.alt{background:transparent;color:var(--ink);border:1.5px solid var(--ln)}";document.head.appendChild(st);
})();
