/* Uno companion avatar — layered SVG drawn to match the site mascot
   (assets/pose-thumbs.jpg): white helmet with a white bezel around a black
   visor, warm LED eyes, orange ear discs, orange crest, orange chest shield,
   dark under-suit at the joints, orange boot toes. Colours sampled from the
   art. Groups are named for the animator; joints match the CSS origins. */
(function () {
  var W = '#fbf9fb', S = '#e2dbe3', G = '#c9bec9', K = '#150a07', SUIT = '#2a1a14';
  window.UNO_AVATAR_SVG = '' +
'<svg class="ua-svg" viewBox="0 0 200 272" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Uno">' +
'<defs>' +
'<linearGradient id="ua-white" x1="0" y1="0" x2=".2" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="' + W + '"/><stop offset="1" stop-color="' + S + '"/></linearGradient>' +
'<linearGradient id="ua-white2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#f0ebf1"/><stop offset="1" stop-color="#d8d0d9"/></linearGradient>' +
'<linearGradient id="ua-orange" x1="0" y1="0" x2=".1" y2="1"><stop offset="0" stop-color="#ffb03a"/><stop offset=".45" stop-color="#f4761a"/><stop offset="1" stop-color="#a9491e"/></linearGradient>' +
'<linearGradient id="ua-orange2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc04d"/><stop offset=".5" stop-color="#ef6a10"/><stop offset="1" stop-color="#b34d1b"/></linearGradient>' +
'<radialGradient id="ua-ear" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#ffc25c"/><stop offset=".5" stop-color="#f4791a"/><stop offset="1" stop-color="#a8451a"/></radialGradient>' +
'<radialGradient id="ua-led" cx=".5" cy=".42" r=".62"><stop offset="0" stop-color="#fff8d8"/><stop offset=".4" stop-color="#ffd257"/><stop offset="1" stop-color="#ff9d22"/></radialGradient>' +
'<radialGradient id="ua-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff8a24" stop-opacity=".5"/><stop offset="1" stop-color="#ff8a24" stop-opacity="0"/></radialGradient>' +
'<radialGradient id="ua-vis" cx=".38" cy=".18" r=".95"><stop offset="0" stop-color="#4a322a"/><stop offset=".4" stop-color="#22130d"/><stop offset="1" stop-color="#0a0402"/></radialGradient>' +
'<linearGradient id="ua-shine" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
'<linearGradient id="ua-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2620"/><stop offset="1" stop-color="#140b08"/></linearGradient>' +
'</defs>' +

'<ellipse class="ua-shadow" cx="100" cy="256" rx="44" ry="7" fill="#000" opacity=".18"/>' +

/* ================================ legs ================================ */
'<g class="ua-leg ua-leg-l">' +
  '<circle cx="84" cy="184" r="7.5" fill="' + SUIT + '"/>' +
  '<path d="M76 182 h16 q4 0 4 5 l-1 20 q0 4 -4 4 h-14 q-4 0 -4 -4 l-1 -20 q0 -5 4 -5 z" fill="url(#ua-white2)" stroke="#00000014" stroke-width="1"/>' +
  '<g class="ua-shin ua-shin-l">' +
    '<circle cx="84" cy="211" r="6.5" fill="' + SUIT + '"/>' +
    '<path d="M78 211 h12 q3 0 3 4 v17 q0 3 -3 3 h-12 q-3 0 -3 -3 v-17 q0 -4 3 -4 z" fill="url(#ua-white2)" stroke="#00000014" stroke-width="1"/>' +
    '<path d="M72 232 h16 q5 0 5 5 v6 q0 5 -5 5 H72 q-5 0 -5 -5 v-6 q0 -5 5 -5 z" fill="url(#ua-white)" stroke="#00000018" stroke-width="1"/>' +
    '<path d="M66 240 h26 q3 0 3 4 v2 q0 4 -4 4 H67 q-4 0 -4 -4 v-2 q0 -4 3 -4 z" fill="url(#ua-orange2)"/>' +
    '<path d="M74 235 q10 -3 20 0" fill="none" stroke="#ffffff" stroke-width="2" opacity=".75"/>' +
  '</g>' +
'</g>' +
'<g class="ua-leg ua-leg-r">' +
  '<circle cx="116" cy="184" r="7.5" fill="' + SUIT + '"/>' +
  '<path d="M108 182 h16 q4 0 4 5 l1 20 q0 4 -4 4 h-14 q-4 0 -4 -4 l1 -20 q0 -5 1 -5 z" fill="url(#ua-white2)" stroke="#00000014" stroke-width="1"/>' +
  '<g class="ua-shin ua-shin-r">' +
    '<circle cx="116" cy="211" r="6.5" fill="' + SUIT + '"/>' +
    '<path d="M110 211 h12 q3 0 3 4 v17 q0 3 -3 3 h-12 q-3 0 -3 -3 v-17 q0 -4 3 -4 z" fill="url(#ua-white2)" stroke="#00000014" stroke-width="1"/>' +
    '<path d="M112 232 h16 q5 0 5 5 v6 q0 5 -5 5 h-16 q-5 0 -5 -5 v-6 q0 -5 5 -5 z" fill="url(#ua-white)" stroke="#00000018" stroke-width="1"/>' +
    '<path d="M105 240 h26 q3 0 3 4 v2 q0 4 -4 4 h-24 q-4 0 -4 -4 v-2 q0 -4 3 -4 z" fill="url(#ua-orange2)"/>' +
    '<path d="M106 235 q10 -3 20 0" fill="none" stroke="#ffffff" stroke-width="2" opacity=".75"/>' +
  '</g>' +
'</g>' +

/* ================================ torso =============================== */
'<g class="ua-torso">' +
  '<path d="M100 122 q24 0 31 13 q5 9 4 24 q-1 11 -9 14 H74 q-8 -3 -9 -14 q-1 -15 4 -24 q7 -13 31 -13 z" fill="url(#ua-white)" stroke="#00000016" stroke-width="1"/>' +
  '<path d="M100 133 L117 145 L111 166 H89 L83 145 Z" fill="url(#ua-orange2)" stroke="#ef6a10" stroke-width="4" stroke-linejoin="round"/>' +
  '<path d="M100 138 l10 7" fill="none" stroke="#ffffff" stroke-width="2" opacity=".3" stroke-linecap="round"/>' +
  '<path d="M77 168 h46 q4 0 4 5 v5 q0 4 -4 4 H77 q-4 0 -4 -4 v-5 q0 -5 4 -5 z" fill="url(#ua-dark)"/>' +
  '<rect x="92" y="118" width="16" height="9" rx="4" fill="' + SUIT + '"/>' +
'</g>' +

/* ================================= arms =============================== */
'<g class="ua-arm ua-arm-l">' +
  '<circle cx="62" cy="136" r="11" fill="url(#ua-white)" stroke="#00000016" stroke-width="1"/>' +
  '<path d="M62 130 a9 9 0 0 1 9 9" fill="none" stroke="#ffffff" stroke-width="2" opacity=".85"/>' +
  '<g class="ua-fore ua-fore-l">' +
    '<path d="M56 142 h12 q3 0 3 4 v20 q0 3 -3 3 h-12 q-3 0 -3 -3 v-20 q0 -4 3 -4 z" fill="url(#ua-white2)" stroke="#00000014" stroke-width="1"/>' +
    '<circle cx="62" cy="170" r="5.5" fill="' + SUIT + '"/>' +
    '<g class="ua-hand ua-hand-l">' +
      '<path d="M62 171 q9 0 9 9 q0 10 -9 10 q-9 0 -9 -10 q0 -9 9 -9 z" fill="url(#ua-white)" stroke="#00000018" stroke-width="1"/>' +
      '<path class="ua-thumb-l" d="M55 175 q-3 -7 3 -8 q4 -1 3 5 v4 z" fill="url(#ua-white)" stroke="#00000018" stroke-width="1"/>' +
    '</g>' +
  '</g>' +
'</g>' +
'<g class="ua-arm ua-arm-r">' +
  '<circle cx="138" cy="136" r="11" fill="url(#ua-white)" stroke="#00000016" stroke-width="1"/>' +
  '<path d="M138 130 a9 9 0 0 0 -9 9" fill="none" stroke="#ffffff" stroke-width="2" opacity=".85"/>' +
  '<g class="ua-fore ua-fore-r">' +
    '<path d="M132 142 h12 q3 0 3 4 v20 q0 3 -3 3 h-12 q-3 0 -3 -3 v-20 q0 -4 3 -4 z" fill="url(#ua-white2)" stroke="#00000014" stroke-width="1"/>' +
    '<circle cx="138" cy="170" r="5.5" fill="' + SUIT + '"/>' +
    '<g class="ua-hand ua-hand-r">' +
      '<path d="M138 171 q9 0 9 9 q0 10 -9 10 q-9 0 -9 -10 q0 -9 9 -9 z" fill="url(#ua-white)" stroke="#00000018" stroke-width="1"/>' +
      '<path class="ua-thumb-r" d="M145 175 q3 -7 -3 -8 q-4 -1 -3 5 v4 z" fill="url(#ua-white)" stroke="#00000018" stroke-width="1"/>' +
    '</g>' +
  '</g>' +
'</g>' +

/* ================================= head =============================== */
'<g class="ua-head">' +
  /* crest sits behind the shell */
  /* ear discs, half tucked behind the helmet */
  '<circle class="ua-ear-l" cx="51" cy="86" r="15" fill="url(#ua-ear)" stroke="#00000016" stroke-width="1"/>' +
  '<circle class="ua-ear-r" cx="149" cy="86" r="15" fill="url(#ua-ear)" stroke="#00000016" stroke-width="1"/>' +
  /* helmet: wider than tall, flatter on top */
  '<path d="M100 26 q26 0 40 12 q14 12 14 32 q0 22 -13 33 q-13 12 -41 12 q-28 0 -41 -12 q-13 -11 -13 -33 q0 -20 14 -32 q14 -12 40 -12 z" fill="url(#ua-white)" stroke="#00000014" stroke-width="1"/>' +
  /* soft shading under the brow and at the chin */
  '<path d="M100 108 q-24 0 -34 -9 q10 16 34 16 q24 0 34 -16 q-10 9 -34 9 z" fill="#000" opacity=".05"/>' +
  '<path d="M62 44 q13 -13 30 -14" fill="none" stroke="#ffffff" stroke-width="3.4" opacity=".85" stroke-linecap="round"/>' +
  /* orange crest, sitting on the crown in front of the shell */
  '<path d="M82 36 q3 -20 18 -20 q15 0 18 20 q-9 6 -18 6 q-9 0 -18 -6 z" fill="url(#ua-orange)" stroke="#00000014" stroke-width="1"/>' +
  '<path d="M86 34 q5 -14 14 -14" fill="none" stroke="#ffffff" stroke-width="2.4" opacity=".45" stroke-linecap="round"/>' +
  /* white bezel around the visor, then the visor */
  '<rect x="57" y="50" width="86" height="58" rx="27" fill="#ffffff" opacity=".95"/>' +
  '<rect x="60" y="53" width="80" height="52" rx="24" fill="url(#ua-vis)" stroke="#00000040" stroke-width="1"/>' +
  '<rect x="64" y="56" width="72" height="18" rx="9" fill="url(#ua-shine)" opacity=".45"/>' +
  '<g class="ua-face">' +
    '<g class="ua-eyes">' +
      '<circle class="ua-bloom" cx="84" cy="76" r="19" fill="url(#ua-glow)"/>' +
      '<circle class="ua-bloom" cx="116" cy="76" r="19" fill="url(#ua-glow)"/>' +
      '<g class="ua-round">' +
        '<circle class="ua-eye ua-eye-l" cx="84" cy="76" r="9.5" fill="url(#ua-led)"/>' +
        '<circle class="ua-eye ua-eye-r" cx="116" cy="76" r="9.5" fill="url(#ua-led)"/>' +
      '</g>' +
      '<g class="ua-arcs">' +
        '<path d="M75 78 q9 -13 18 0" fill="none" stroke="url(#ua-led)" stroke-width="5.6" stroke-linecap="round"/>' +
        '<path d="M107 78 q9 -13 18 0" fill="none" stroke="url(#ua-led)" stroke-width="5.6" stroke-linecap="round"/>' +
      '</g>' +
    '</g>' +
    '<g class="ua-mouth">' +
      '<path class="ua-smile" d="M91 93 q9 8 18 0" fill="none" stroke="#ffc63c" stroke-width="3.4" stroke-linecap="round"/>' +
      '<ellipse class="ua-open" cx="100" cy="94" rx="6.5" ry="2.4" fill="#ffc63c"/>' +
    '</g>' +
  '</g>' +
'</g>' +
'</svg>';
})();
