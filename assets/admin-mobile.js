/* Admin phone helper (additive): labels table cells for the stacked-card layout and keeps the bulk bar from covering content. */
(function(){
 function label(root){
  [].forEach.call(root.querySelectorAll(".tw table"),function(t){
   if(t.querySelector(".rmx-p,.rmx")||t.classList.contains("rmx")){var w=t.closest(".tw");if(w)w.classList.add("keep");return}
   var hs=[].map.call(t.querySelectorAll("thead th"),function(h){return h.textContent.replace(/\s+/g," ").trim()});
   if(!hs.length)return;
   [].forEach.call(t.querySelectorAll("tbody tr"),function(r){
    var i=0;[].forEach.call(r.children,function(c){
     if(c.tagName!=="TD")return;
     var l=hs[i]||"";if(c.getAttribute("data-l")!==l)c.setAttribute("data-l",l);
     i+=Math.max(1,Number(c.getAttribute("colspan"))||1)})})})}
 function bar(){var b=document.getElementById("bk-bar");document.documentElement.style.setProperty("--bkh",b?(b.offsetHeight+8)+"px":"0px")}
 var q=0;function tick(){if(q)return;q=requestAnimationFrame(function(){q=0;var m=document.getElementById("main");if(m)label(m);bar()})}
 function start(){tick();new MutationObserver(tick).observe(document.body,{childList:true,subtree:true});window.addEventListener("resize",tick)}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
