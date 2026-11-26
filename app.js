nejoin="round"><path d="M5 4h4l2 5-2.500 1.500a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/></svg></button><button type="button" id="ch-x" aria-label="Close">\u2715</button></div><div class="ch-b" id="ch-b" aria-live="polite"></div><div class="ch-q" id="ch-q"></div><form class="ch-f" id="ch-f"><input id="ch-i" type="text" autocomplete="off" placeholder="'+U(L(ch.placeholder))+'"><button type="submit" aria-label="Send">\u27A4</button></form></div>');
  $("#chat-fab").onclick=function(){openChat()}; $("#ch-x").onclick=function(){closeChat()};$("#ch-call").onclick=function(){vcStart()};
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
  window.__U={h:h,C:C,esc:esc,B:B,bi:bi,ico:ico,intl:intl,U:U,$:$,$$:$$};var sc=document.createElement("script");sc.src="assets/store.js?v=20261126g";document.body.appendChild(sc);
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
  document.body.insertAdjacentHTML("beforeend",'<div id="vc" role="dialog" aria-modal="true" aria-label="'+U(vcT("مكالمة صوتية مع أونو","Voice call with Uno"))+'" data-s="think"><div class="vc-top"><span id="vc-tm">00:00</span><span class="vc-live"></span></div><div class="vc-orb"><i></i><i></i><i></i><img src="'+U(ch.avatar)+'" alt="Uno"></div><h2>Uno</h2><p id="vc-st" class="vc-st" aria-live="polite"></p><div id="vc-cap" class="vc-cap" aria-live="polite"></div><div id="vc-act" class="vc-act"></div><div id="vc-chips" class="vc-chips"></div><p id="vc-note" class="vc-note"></p><form id="vc-tf" class="vc-tf" '+(SR?'hidden':'')+'><input id="vc-ti" type="text" autocomplete="off" maxlength="300" placeholder="'+U(vcT("اكتب سؤالك...","Type your question..."))+'"><button type="submit" aria-label="Send">\u27A4</button></form><div class="vc-btns"><button type="button" id="vc-mu" aria-pressed="false" aria-label="Mute"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/><path class="sl" d="M4 4l16 16"/></svg><span>'+vcT("كتم","Mute")+'</span></button><button type="button" id="vc-kb" aria-label="Keyboard"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/></svg><span>'+vcT("كتابة","Type")+'</span></button><button type="button" id="vc-end" class="end" aria-label="End call"><svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 9c-3 0-5.700.8-8 2.400-.5.400-.6 1-.2 1.500l1.500 2c.3.400.9.500 1.300.2l2-1.200c.3-.2.500-.5.500-.9V12c1.600-.5 3.300-.5 4.900 0v1c0 .4.200.700.500.900l2 1.200c.400.300 1 .2 1.300-.2l1.500-2c.400-.5.300-1.100-.2-1.500C17.700 9.800 15 9 12 9z"/></svg><span>'+vcT("إنهاء","End")+'</span></button></div></div>');
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
  if(PAGE==="home")home(); else if(PAGE==="blog")blog(); else if(PAGE==="tools")tools(); else if(PAGE==="store")store();
  chatUI(); wire(); (function(){var b=$("#mb-chat");if(b)b.onclick=function(){openChat()}})();
  setTheme(st||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"));
  reveal();
  if(PAGE==="home"&&/^#project\//.test(location.hash)){projRoute()}
  else if(PAGE==="home"&&location.hash){var el=$(location.hash);if(el)setTimeout(function(){el.scrollIntoView()},50)}
}
if(PAGE!=="admin")boot();
})();
