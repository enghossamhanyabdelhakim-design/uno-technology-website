/* One language per paragraph for UNO Core screens. Labels written as "عربي / English" show only the chosen language.
   Language key is shared with the site: localStorage uno_lang (ar | en). */
(function () {
  var LANG = "ar"; try { LANG = localStorage.getItem("uno_lang") === "en" ? "en" : "ar"; } catch (e) {}
  window.UNO_LANG = LANG;
  var de = document.documentElement;
  de.lang = LANG; de.dir = LANG === "en" ? "ltr" : "rtl";
  var RE = /([\u0600-\u06FF][^\/]*?)\s\/\s([A-Za-z][^\/\n\u0600-\u06FF]*)/g;
  function fix(s) { return typeof s === "string" && s.indexOf(" / ") > -1 ? s.replace(RE, function (m, a, b) { return LANG === "en" ? b : a; }) : s; }
  window.unoLang = fix;
  var AT = ["placeholder", "title", "aria-label", "alt"];
  function walk(n) {
    if (!n) return;
    if (n.nodeType === 3) { var v = n.nodeValue, f = fix(v); if (f !== v) n.nodeValue = f; return; }
    if (n.nodeType !== 1) return;
    var t = n.nodeName; if (t === "SCRIPT" || t === "STYLE" || t === "TEXTAREA") return;
    for (var i = 0; i < AT.length; i++) { var a = n.getAttribute(AT[i]); if (a) { var g = fix(a); if (g !== a) n.setAttribute(AT[i], g); } }
    for (var c = n.firstChild; c; c = c.nextSibling) walk(c);
  }
  var busy = false;
  function run(muts) {
    if (busy) return; busy = true;
    try {
      muts.forEach(function (m) {
        if (m.type === "characterData") walk(m.target);
        else if (m.type === "attributes") { var a = m.target.getAttribute(m.attributeName); if (a) { var g = fix(a); if (g !== a) m.target.setAttribute(m.attributeName, g); } }
        else [].forEach.call(m.addedNodes, walk);
      });
    } finally { busy = false; }
  }
  function start() {
    walk(document.body); document.title = fix(document.title);
    new MutationObserver(run).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: AT });
    var oc = window.confirm, oa = window.alert;
    window.confirm = function (m) { return oc.call(window, fix(String(m))); };
    window.alert = function (m) { return oa.call(window, fix(String(m))); };
  }
  window.unoLangToggle = function (host) {
    if (!host || document.getElementById("ulg")) return;
    var b = document.createElement("button"); b.type = "button"; b.id = "ulg";
    b.textContent = LANG === "en" ? "عربي" : "EN";
    b.setAttribute("aria-label", LANG === "en" ? "Arabic" : "English");
    b.style.cssText = "min-width:44px;height:36px;border-radius:999px;border:1.5px solid #F65A00;background:transparent;color:#F65A00;font:700 13px inherit;cursor:pointer;padding:0 12px;margin-inline-start:8px";
    b.onclick = function () { try { localStorage.setItem("uno_lang", LANG === "en" ? "ar" : "en"); } catch (e) {} location.reload(); };
    host.appendChild(b);
  };
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
  document.addEventListener("DOMContentLoaded", function () { var h = document.querySelector("header.top"); if (h) window.unoLangToggle(h); });
})();
