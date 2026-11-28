/* Uno ad slots: fills banner placements from the ad_slots table (house banners or any image the owner uploads). Own code, no third party. */
(function(){
var P=document.body&&document.body.dataset.page;if(!/^(home|blog|tools|store)$/.test(P||""))return;
if(/checkout|order|account|admin|pos|erp|staff/.test(location.pathname))return;
if(window.__unoSlots)return;window.__unoSlots=1;var c=window.UNO_CFG;if(!c||!c.url)return;
var L=function(){return document.documentElement.lang==="en"?"en":"ar"};
var css=document.createElement("style");css.textContent=".uslot{position:relative;margin:22px auto;max-width:1100px;padding:0 16px;text-align:center}.uslot a{display:inline-block;max-width:100%;line-height:0;border-radius:14px;overflow:hidden;box-shadow:0 6px 22px rgba(0,0,0,.18);transition:transform .25s,box-shadow .25s}.uslot a:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(255,106,0,.28)}.uslot img{max-width:100%;height:auto;display:block}.uslot small{display:block;margin-top:6px;font-size:11px;opacity:.55;letter-spacing:.02em}.uslot-store_sidebar,.uslot-article_inline{max-width:340px;padding:0}.uslot-mobile_sticky{position:fixed;inset:auto 0 var(--uno-tab-h,0px) 0;z-index:60;margin:0;max-width:none;padding:6px 8px calc(6px + env(safe-area-inset-bottom));background:var(--hbg,rgba(255,255,255,.94));border-top:1px solid var(--ln,#e6e6e6);backdrop-filter:blur(8px);display:none}.uslot-mobile_sticky{padding:4px 8px calc(4px + env(safe-area-inset-bottom,0px))}.uslot-mobile_sticky a{box-shadow:none;border-radius:8px}.uslot-mobile_sticky img{width:auto;max-width:100%;max-height:40px;margin:0 auto}.uslot-mobile_sticky small{display:none}.uslot-mobile_sticky .ux{position:absolute;top:-11px;inset-inline-end:10px;width:26px;height:26px;border-radius:50%;border:0;background:#ff6a00;color:#fff;font-size:15px;line-height:26px;cursor:pointer}@media(max-width:720px){.uslot-mobile_sticky{display:block}body.has-sticky-ad{padding-bottom:calc(56px + var(--uno-tab-h,0px))}.uslot-home_mid,.uslot-footer_strip{padding:0 10px}}";document.head.appendChild(css);
var done={};
function fetchSlot(s){return fetch(c.url+"/rest/v1/rpc/ads_get",{method:"POST",headers:{"Content-Type":"application/json",apikey:c.key,Authorization:"Bearer "+c.key},body:JSON.stringify({p_slot:s,p_lang:L()})}).then(function(r){return r.ok?r.json():[]}).catch(function(){return []})}
function el(s,ad){var d=document.createElement("aside");d.className="uslot uslot-"+s;d.dataset.slot=s;d.setAttribute("aria-label",L()==="en"?"Advertisement":"إعلان");
 var img='<img src="'+ad.image+'" alt="'+((ad.alt&&ad.alt[L()])||"").replace(/"/g,"&quot;")+'" loading="lazy" decoding="async">';
 var pic=ad.image_mobile?'<picture><source media="(max-width:640px)" srcset="'+ad.image_mobile+'">'+img+"</picture>":img;
 d.innerHTML=(ad.link?'<a href="'+ad.link+'" rel="sponsored noopener">'+pic+"</a>":'<a href="#" tabindex="-1" onclick="return false">'+pic+"</a>")+"<small>"+(L()==="en"?"Ad":"إعلان")+"</small>";
 if(s==="mobile_sticky"){var x=document.createElement("button");x.className="ux";x.type="button";x.setAttribute("aria-label","close");x.textContent="×";x.onclick=function(){d.remove();document.body.classList.remove("has-sticky-ad");try{sessionStorage.setItem("uno_sticky_x","1")}catch(e){}};d.appendChild(x);document.body.classList.add("has-sticky-ad")}
 return d}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
var gen=0,pend={};
function fill(s,host,mode){if(!host||document.querySelector(".uslot-"+s)||pend[s])return;pend[s]=1;var g=gen;fetchSlot(s).then(function(a){pend[s]=0;if(g!==gen||!a.length||document.querySelector(".uslot-"+s))return;var n=el(s,pick(a));if(mode==="after")host.parentNode.insertBefore(n,host.nextSibling);else if(mode==="before")host.parentNode.insertBefore(n,host);else host.appendChild(n)})}
function when(sel,cb){var t=0,iv=setInterval(function(){var a=document.querySelector(sel);if(a||++t>40){clearInterval(iv);if(a)cb(a)}},250)}
function run(){
 [].forEach.call(document.querySelectorAll("[data-uno-slot]"),function(h){fill(h.dataset.unoSlot,h,"in")});
 if(P==="home"||P==="blog")when("[data-uno-slot]",function(){[].forEach.call(document.querySelectorAll("[data-uno-slot]"),function(h){fill(h.dataset.unoSlot,h,"in")})});
 if(P==="home")when("#services",function(a){fill("home_mid",a,"after")});
 when(".ft",function(a){fill("footer_strip",a,"before")});
 var sx=0;try{sx=sessionStorage.getItem("uno_sticky_x")==="1"||/\/(store|checkout|order)[^\/]*$/.test(location.pathname)}catch(e){}
 if(!sx&&window.matchMedia("(max-width:720px)").matches)fill("mobile_sticky",document.body,"in");
}
run();window.UNO_SLOTS={scan:run};
new MutationObserver(function(m){m.forEach(function(r){if(r.attributeName==="lang"){[].forEach.call(document.querySelectorAll(".uslot"),function(e){e.remove()});document.body.classList.remove("has-sticky-ad");gen++;pend={};run()}})}).observe(document.documentElement,{attributes:true});
})();
