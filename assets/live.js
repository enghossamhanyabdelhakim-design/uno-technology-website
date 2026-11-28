/* mascot preview switch: ?robot=1 turns it on for this device only, ?robot=0 clears it */
try{var _rq=new URLSearchParams(location.search).get('robot');if(_rq==='1')localStorage.setItem('uno_robot','1');if(_rq==='0')localStorage.removeItem('uno_robot');if(localStorage.getItem('uno_robot')==='1')window.UNO_ROBOT_ON=true}catch(e){}
if(window.UNO_ROBOT_ON){var _av=document.createElement("script");_av.src="assets/avatar-loader.js?v=20261129a";document.head.appendChild(_av)}
/* Loads published content from Supabase (falls back to assets/content.js), then starts the site. */
(function(){
var c=window.UNO_CFG,done=false,t;
function go(){if(done)return;done=true;clearTimeout(t);var s=document.createElement("script");s.src="assets/app.js?v=20261129td";document.body.appendChild(s)}
try{
 t=setTimeout(go,2500);
 fetch(c.url+"/rest/v1/site_content?id=eq.1&select=data",{headers:{apikey:c.key}}).then(function(r){return r.json()}).then(function(r){
  var d=r&&r[0]&&r[0].data;
  if(d&&d.site){window.UNO=window.UNO_FILL(d,window.UNO)}
 }).catch(function(){}).then(go);
}catch(e){go()}
})();
;(function(){function ld(){var s=document.createElement("script");s.src="assets/slots.js?v=20261129s2";document.body.appendChild(s)}if(document.readyState==="complete")setTimeout(ld,600);else window.addEventListener("load",function(){setTimeout(ld,600)})})();
