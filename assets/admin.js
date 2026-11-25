(function(){
"use strict";
var BASE=JSON.parse(JSON.stringify(window.UNO)), W;
try{var d=localStorage.getItem("uno_draft");W=d?JSON.parse(d):JSON.parse(JSON.stringify(BASE))}catch(e){W=JSON.parse(JSON.stringify(BASE))}
var LAB={site:"الموقع: النصوص الرئيسية / Site texts",sections:"عناوين الأقسام / Section titles",how:"إزاي بنشتغل / How we work",faq:"أسئلة شائعة / FAQ",form:"نموذج الطلب / Request form",hero2:"الهيرو / Hero chips",nav:"القائمة / Menu",theme:"اللون / Color",images:"الصور الرئيسية / Main images",contact:"بيانات التواصل / Contact",social:"السوشيال ميديا / Social",services:"الخدمات / Services",serviceCats:"تصنيفات الخدمات / Service filters",serviceAll:"كلمة الكل / 'All' label",banners:"البانرات الإعلانية / Ad banners",why:"لماذا نحن / Why us",toolCards:"كروت الأدوات / Tool cards",portfolio:"معرض الأعمال / Portfolio",portfolioSoon:"نص صور قريبًا / 'Coming soon' text",poses:"صور الروبوت / Mascot poses",blog:"المدونة والمقالات / Blog and articles",chatbot:"شات بوت أونو / Uno chatbot",footer:"الفوتر / Footer"};
window.__W=function(){return W};var cur="site", $=function(s){return document.querySelector(s)};
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
var tm;function save(){var s=$("#st");s.className="dirty";s.textContent="جاري الحفظ... / saving...";clearTimeout(tm);tm=setTimeout(function(){try{localStorage.setItem("uno_draft",JSON.stringify(W));s.className="ok";s.textContent="✓ مسودة محفوظة / draft saved"}catch(e){s.className="dirty";s.textContent="تعذر الحفظ (الصور كبيرة؟) / could not save (images too big?)"}},300)}
function isBi(o){var k=o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o);return k&&k.length===2&&k.indexOf("ar")>-1&&k.indexOf("en")>-1&&typeof o.ar==="string"}
function isImg(k,v){return typeof v==="string"&&(/^(img|avatar|logoHeader|logoMark|hero|about|variations)$/.test(k)||/^(assets\/|data:image)/.test(v))}
function title(it,i){if(typeof it==="string")return (it.indexOf("data:")===0?"image":it)||("#"+(i+1));if(typeof it.ar==="string")return (i+1)+". "+(it.ar||it.en);var t=it.t||it.title||it.name||it.slug||it.q;if(t&&typeof t==="object")t=t.en||t.ar;if(!t&&it.url)t=it.url;return (i+1)+". "+(t||"")}
function blank(v){if(typeof v==="string")return "";if(typeof v==="boolean")return v;if(typeof v==="number")return 0;if(Array.isArray(v))return [];var o={};Object.keys(v).forEach(function(k){o[k]=blank(v[k])});return o}
function mkTemplate(arr){var t=arr.length?JSON.parse(JSON.stringify(arr[arr.length-1])):"";if(typeof t==="string")return "";var b=blank(t);if("published" in b)b.published=true;if("cat" in b&&"cat" in t)b.cat=t.cat;if("slug" in b)b.slug="new-"+Date.now().toString(36);return b}
function resize(file,cb){var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){var m=1400,s=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext("2d").drawImage(im,0,0,c.width,c.height);var png=file.type==="image/png";cb(c.toDataURL(png?"image/png":"image/jpeg",.86))};im.src=r.result};r.readAsDataURL(file)}

function node(parent,key,label){
  var v=parent[key], el=document.createElement("div");
  if(typeof v==="boolean"){el.innerHTML='<label class="f"><input type="checkbox"'+(v?' checked':'')+'> <b>'+esc(label)+'</b></label>';el.querySelector("input").onchange=function(){parent[key]=this.checked;save()};return el}
  if(typeof v==="number"){el.innerHTML='<label class="f"><span>'+esc(label)+'</span><input type="number"></label>';var n=el.querySelector("input");n.value=v;n.oninput=function(){parent[key]=+this.value;save()};return el}
  if(typeof v==="string"){
    if(key==="primary"){el.innerHTML='<label class="f"><span>'+esc(label)+' (لون الموقع / site color)</span><input type="color" style="width:80px;height:40px"> <input type="text" style="width:120px;display:inline-block" dir="ltr"></label>';var c=el.querySelector('input[type=color]'),t=el.querySelector('input[type=text]');c.value=v;t.value=v;c.oninput=function(){parent[key]=this.value;t.value=this.value;save()};t.oninput=function(){if(/^#[0-9a-f]{6}$/i.test(this.value)){parent[key]=this.value;c.value=this.value;save()}};return el}
    if(isImg(key,v)){
      el.innerHTML='<div class="f"><span class="hint">'+esc(label)+'</span><div class="img"><img alt=""><div class="ctl"><input type="text" dir="ltr" placeholder="assets/photo.jpg أو رابط / or URL"><div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap"><button class="sec sm up" type="button">رفع صورة / Upload</button><button class="dg sm clr" type="button">مسح / Clear</button><input type="file" accept="image/*" hidden></div><div class="hint">الصور المرفوعة بتتصغر لعرض 1400 بكسل كحد أقصى / Uploads are resized to max 1400 px.</div></div></div></div>';
      var im=el.querySelector("img"),tx=el.querySelector("input[type=text]"),fi=el.querySelector("input[type=file]");
      function show(){im.src=parent[key]||"";im.style.visibility=parent[key]?"visible":"hidden";tx.value=parent[key]&&parent[key].indexOf("data:")===0?"(uploaded image)":(parent[key]||"")}
      show();tx.onchange=function(){if(this.value!=="(uploaded image)"){parent[key]=this.value.trim();show();save()}};
      el.querySelector(".up").onclick=function(){fi.click()};el.querySelector(".clr").onclick=function(){parent[key]="";show();save()};
      fi.onchange=function(){if(fi.files[0]){var nm=fi.files[0].name;resize(fi.files[0],function(u){if(!window.CLOUD||!CLOUD.loggedIn()){parent[key]=u;show();save();return}var st=document.getElementById("st");st.className="dirty";st.textContent="رفع الصورة... / uploading...";fetch(u).then(function(r){return r.blob()}).then(function(b){return CLOUD.upload(b,nm.replace(/\.[^.]+$/,"")+".jpg")}).then(function(url){parent[key]=url;show();save()}).catch(function(e){alert("Upload failed: "+e.message);parent[key]=u;show();save()})})}};return el}
    var big=/^(body)$/.test(key), area=big||v.length>70||/^(d|text|a|summary)$/.test(key);
    el.innerHTML='<label class="f"><span>'+esc(label)+'</span>'+(area?'<textarea class="'+(big?'big':'')+'"></textarea>':'<input type="text">')+'</label>';
    var inp=el.querySelector(area?"textarea":"input");inp.value=v;inp.oninput=function(){parent[key]=this.value;save()};
    if(/^(url|email|phone|whatsapp|link|slug|cat|kw)$/.test(key))inp.setAttribute("dir","ltr");return el}
  if(isBi(v)){
    var big2=key==="body"||v.ar.length>70||v.en.length>70||/^(d|text|a|summary)$/.test(key);
    el.innerHTML='<fieldset><legend>'+esc(label)+'</legend><div class="pair"><label class="f"><span class="l">العربية</span>'+(big2?'<textarea class="'+(key==="body"?'big':'')+'" data-k="ar"></textarea>':'<input type="text" data-k="ar">')+'</label><label class="f"><span class="l">English</span>'+(big2?'<textarea class="'+(key==="body"?'big':'')+'" data-k="en" dir="ltr"></textarea>':'<input type="text" data-k="en" dir="ltr">')+'</label></div>'+(key==="body"?'<div class="hint">HTML مسموح: &lt;h3&gt; &lt;p&gt; &lt;ul&gt;&lt;li&gt; &lt;b&gt; / HTML allowed</div>':'')+'</fieldset>';
    ["ar","en"].forEach(function(l){var i=el.querySelector('[data-k='+l+']');i.value=v[l];i.oninput=function(){v[l]=this.value;save()}});return el}
  if(Array.isArray(v)){
    var box=document.createElement("fieldset");box.innerHTML="<legend>"+esc(label)+" ("+v.length+")</legend>";
    var list=document.createElement("div");box.appendChild(list);
    function draw(){list.innerHTML="";v.forEach(function(it,i){
      var d=document.createElement("details");d.className="it";
      d.innerHTML='<summary><span class="t">'+esc(title(it,i))+'</span><button class="sec sm" data-a="up" type="button">↑</button><button class="sec sm" data-a="dn" type="button">↓</button><button class="sec sm" data-a="cp" type="button">⧉</button><button class="dg sm" data-a="rm" type="button">✕</button></summary><div class="in"></div>';
      var inn=d.querySelector(".in");
      if(typeof it==="object"&&!isBi(it)){Object.keys(it).forEach(function(k){inn.appendChild(node(it,k,k))})}else inn.appendChild(node(v,i,typeof it==="string"?"قيمة / value":"item"));
      d.querySelector("summary").onclick=function(e){var a=e.target.dataset&&e.target.dataset.a;if(!a)return;e.preventDefault();
        if(a==="rm"){if(confirm("حذف؟ / Delete?")){v.splice(i,1)}}else if(a==="up"&&i>0){v.splice(i-1,0,v.splice(i,1)[0])}else if(a==="dn"&&i<v.length-1){v.splice(i+1,0,v.splice(i,1)[0])}else if(a==="cp"){var c=JSON.parse(JSON.stringify(it));if(c&&c.slug)c.slug+="-copy";v.splice(i+1,0,c)}
        save();draw();box.querySelector("legend").textContent=label+" ("+v.length+")"};
      list.appendChild(d)})}
    draw();var add=document.createElement("button");add.type="button";add.className="sec";add.textContent="+ إضافة / Add";add.onclick=function(){v.push(mkTemplate(v));save();draw();box.querySelector("legend").textContent=label+" ("+v.length+")";var ds=list.querySelectorAll("details");if(ds.length)ds[ds.length-1].open=true};box.appendChild(add);el.appendChild(box);return el}
  if(v&&typeof v==="object"){var fs=document.createElement("fieldset");fs.innerHTML="<legend>"+esc(label)+"</legend>";Object.keys(v).forEach(function(k){fs.appendChild(node(v,k,k))});el.appendChild(fs);return el}
  return el;
}
function drawSide(){var s=$("#side");s.innerHTML="";Object.keys(LAB).forEach(function(k){if(!(k in W))return;var b=document.createElement("button");b.type="button";b.textContent=LAB[k];b.className=k===cur?"on":"";b.onclick=function(){cur=k;drawSide();drawMain()};s.appendChild(b)})}
function drawMain(){var m=$("#main");m.innerHTML="<h2>"+esc(LAB[cur])+"</h2>";var holder={x:W[cur]};m.appendChild(node(holder,"x",LAB[cur].split(" / ")[1]||cur));
  // keep reference semantics: node edits holder.x which for primitives must write back
  var chk=setInterval(function(){if(W[cur]!==holder.x){W[cur]=holder.x}},200);window._chk&&clearInterval(window._chk);window._chk=chk}
$("#b-prev").onclick=function(){try{localStorage.setItem("uno_draft",JSON.stringify(W))}catch(e){}window.open("index.html?preview=1","_blank")};
$("#b-exp").onclick=function(){var t="window.UNO="+JSON.stringify(W,null,1)+";\n",b=new Blob([t],{type:"text/javascript"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="content.js";a.click();if(t.length>2500000)alert("الملف كبير ("+Math.round(t.length/1e6*10)/10+" MB) بسبب الصور. الأفضل ترفع الصور كملفات في assets وتكتب مسارها. / The file is large because of embedded images. Prefer uploading image files to assets/ and entering their paths.")};
$("#b-imp").onclick=function(){$("#imp").click()};
$("#imp").onchange=function(){var f=this.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var t=r.result.replace(/^\s*window\.UNO\s*=\s*/,"").replace(/;\s*$/,"");W=JSON.parse(t);save();drawSide();drawMain()}catch(e){alert("ملف غير صالح / Invalid file")}};r.readAsText(f)};
$("#b-rst").onclick=function(){if(confirm("مسح المسودة والرجوع للمحتوى المنشور؟ / Discard the draft and go back to the published content?")){localStorage.removeItem("uno_draft");W=JSON.parse(JSON.stringify(BASE));drawSide();drawMain();$("#st").textContent=""}};
drawSide();drawMain();
})();

(function(){var b=document.getElementById("b-pub");if(!b)return;
b.onclick=function(){var st=document.getElementById("st");st.className="dirty";st.textContent="جاري النشر... / publishing...";CLOUD.save(window.__W()).then(function(){st.className="ok";st.textContent="تم النشر أونلاين ✓ / Published online ✓ "+new Date().toLocaleTimeString()}).catch(function(e){st.className="dirty";st.textContent="فشل: "+e.message})};
var lo=document.getElementById("b-out");if(lo)lo.onclick=function(){CLOUD.logout();location.reload()}})();
