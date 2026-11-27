/* UNO QR: small QR Code encoder (byte mode, error correction L, versions 1 to 5). Own code, no library. window.UnoQR.svg(text, opts) */
(function () {
  var DATA = [0, 19, 34, 55, 80, 108], ECC = [0, 7, 10, 15, 20, 26];
  var EXP = [], LOG = [];
  (function () { var x = 1; for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
  function gmul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }
  function rs(data, n) {
    var g = [1], i, j;
    for (i = 0; i < n; i++) { var ng = new Array(g.length + 1).fill(0); for (j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= gmul(g[j], EXP[i]); } g = ng; }
    var r = new Array(n).fill(0);
    data.forEach(function (d) { var f = d ^ r[0]; r.shift(); r.push(0); for (var k = 0; k < n; k++) r[k] ^= gmul(g[k + 1], f); });
    return r;
  }
  function utf8(s) { return Array.prototype.slice.call(unescape(encodeURIComponent(s))).map(function (c) { return c.charCodeAt(0); }); }
  function encode(text) {
    var b = utf8(text), v = 0, i;
    for (i = 1; i <= 5; i++) if (b.length + 2 <= DATA[i]) { v = i; break; }
    if (!v) return null;
    var bits = [];
    function put(val, n) { for (var k = n - 1; k >= 0; k--) bits.push((val >> k) & 1); }
    put(4, 4); put(b.length, 8); b.forEach(function (x) { put(x, 8); });
    var cap = DATA[v] * 8; put(0, Math.min(4, cap - bits.length)); while (bits.length % 8) bits.push(0);
    var cw = []; for (i = 0; i < bits.length; i += 8) { var x = 0; for (var k = 0; k < 8; k++) x = (x << 1) | bits[i + k]; cw.push(x); }
    for (i = 0; cw.length < DATA[v]; i++) cw.push(i % 2 ? 0x11 : 0xec);
    cw = cw.concat(rs(cw, ECC[v]));
    var size = 17 + 4 * v, M = [], R = [];
    for (i = 0; i < size; i++) { M.push(new Array(size).fill(0)); R.push(new Array(size).fill(false)); }
    function set(r, c, d) { M[r][c] = d ? 1 : 0; R[r][c] = true; }
    function finder(r, c) { for (var y = -1; y <= 7; y++) for (var x = -1; x <= 7; x++) { var rr = r + y, cc = c + x; if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue; var d = (y >= 0 && y <= 6 && (x === 0 || x === 6)) || (x >= 0 && x <= 6 && (y === 0 || y === 6)) || (y >= 2 && y <= 4 && x >= 2 && x <= 4); set(rr, cc, d); } }
    finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
    for (i = 8; i < size - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    if (v >= 2) { var p = size - 7; for (var y = -2; y <= 2; y++) for (var x = -2; x <= 2; x++) set(p + y, p + x, Math.max(Math.abs(x), Math.abs(y)) !== 1); }
    set(size - 8, 8, true);
    for (i = 0; i < 9; i++) { if (!R[8][i]) { R[8][i] = true; } if (!R[i][8]) { R[i][8] = true; } }
    for (i = 0; i < 8; i++) { R[8][size - 1 - i] = true; R[size - 1 - i][8] = true; }
    var all = []; cw.forEach(function (c) { for (var k = 7; k >= 0; k--) all.push((c >> k) & 1); });
    var pos = [], up = true, idx = 0;
    for (var col = size - 1; col > 0; col -= 2) { if (col === 6) col--; for (var n = 0; n < size; n++) { var row = up ? size - 1 - n : n; for (var dx = 0; dx < 2; dx++) { var cc2 = col - dx; if (!R[row][cc2]) pos.push([row, cc2]); } } up = !up; }
    var fmask = [function (r, c) { return (r + c) % 2 === 0; }, function (r) { return r % 2 === 0; }, function (r, c) { return c % 3 === 0; }, function (r, c) { return (r + c) % 3 === 0; },
      function (r, c) { return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; }, function (r, c) { return (r * c) % 2 + (r * c) % 3 === 0; }, function (r, c) { return ((r * c) % 2 + (r * c) % 3) % 2 === 0; }, function (r, c) { return ((r + c) % 2 + (r * c) % 3) % 2 === 0; }];
    function build(m) {
      var Q = M.map(function (r) { return r.slice(); });
      pos.forEach(function (q, k) { var bit = k < all.length ? all[k] : 0; Q[q[0]][q[1]] = bit ^ (fmask[m](q[0], q[1]) ? 1 : 0); });
      var f = (1 << 3) | m; var rem = f << 10; for (var k = 14; k >= 10; k--) if ((rem >> k) & 1) rem ^= 0x537 << (k - 10);
      var fb = ((f << 10) | rem) ^ 0x5412;
      for (k = 0; k < 15; k++) { var bt = (fb >> k) & 1;
        if (k < 6) Q[k][8] = bt; else if (k === 6) Q[7][8] = bt; else if (k === 7) Q[8][8] = bt; else if (k === 8) Q[8][7] = bt; else Q[8][14 - k] = bt;
        if (k < 8) Q[8][size - 1 - k] = bt; else Q[size - 15 + k][8] = bt;
      }
      Q[size - 8][8] = 1;
      return Q;
    }
    function penalty(Q) {
      var s = 0, r, c, k;
      for (r = 0; r < size; r++) { var run = 1; for (c = 1; c < size; c++) { if (Q[r][c] === Q[r][c - 1]) { run++; if (run === 5) s += 3; else if (run > 5) s++; } else run = 1; } }
      for (c = 0; c < size; c++) { run = 1; for (r = 1; r < size; r++) { if (Q[r][c] === Q[r - 1][c]) { run++; if (run === 5) s += 3; else if (run > 5) s++; } else run = 1; } }
      for (r = 0; r < size - 1; r++) for (c = 0; c < size - 1; c++) if (Q[r][c] === Q[r][c + 1] && Q[r][c] === Q[r + 1][c] && Q[r][c] === Q[r + 1][c + 1]) s += 3;
      var dark = 0; for (r = 0; r < size; r++) for (c = 0; c < size; c++) dark += Q[r][c];
      s += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
      return s;
    }
    var best = null, bs = 1e9;
    for (var m = 0; m < 8; m++) { var Q = build(m); var sc = penalty(Q); if (sc < bs) { bs = sc; best = Q; } }
    return best;
  }
  window.UnoQR = {
    matrix: encode,
    svg: function (text, o) {
      o = o || {}; var Q = encode(text); if (!Q) return '';
      var n = Q.length, q = o.quiet == null ? 2 : o.quiet, s = n + q * 2, d = '';
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (Q[r][c]) d += 'M' + (c + q) + ' ' + (r + q) + 'h1v1h-1z';
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + ' ' + s + '" width="' + (o.size || 96) + '" height="' + (o.size || 96) + '" shape-rendering="crispEdges" role="img" aria-label="QR"><rect width="' + s + '" height="' + s + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
    }
  };
})();
