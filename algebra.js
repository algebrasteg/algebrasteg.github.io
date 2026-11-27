/* Algebrasteg – förenkla uttryck och lös ekvationer med balansmetoden, ett steg i taget. */
(function () {
  'use strict';
  var R = document.getElementById('alg');
  if (!R) return;
  var ANTAL = 5, MI = '−';

  /* ---------- hjälpfunktioner ---------- */
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function blanda(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function nz(a, b) { var v; do { v = rnd(a, b); } while (v === 0); return v; }
  function tal(v) { return v < 0 ? MI + (-v) : '' + v; }
  function norm(s) {
    return String(s).replace(/[٠-٩]/g, function (c) { return c.charCodeAt(0) - 0x660; })
      .replace(/[۰-۹]/g, function (c) { return c.charCodeAt(0) - 0x6F0; })
      .replace(/[−–—]/g, '-').replace(/\s+/g, '').replace(/X/g, 'x');
  }
  function heltal(s, xkoef) {
    s = norm(s);
    if (xkoef && (s === '-' || s === '+')) return s === '-' ? -1 : 1;
    if (!/^[+-]?\d+$/.test(s)) return null;
    return parseInt(s, 10);
  }
  function spara(k, v) { try { localStorage.setItem('alg-' + k, v); } catch (e) {} }
  function hamta(k, d) { try { var v = localStorage.getItem('alg-' + k); return v === null ? d : v; } catch (e) { return d; } }

  /* ---------- termer som HTML ---------- */
  // term: {k: koefficient, x: true/false}
  function kropp(k, x) { var a = Math.abs(k); return x ? (a === 1 ? '' : a) + '<i>x</i>' : '' + a; }
  function termHtml(t, forst, cls) {
    var tecken = t.k < 0 ? (forst ? MI : ' ' + MI + ' ') : (forst ? '' : ' + ');
    return tecken + '<span class="' + (cls || (t.x ? 'tx' : 'tk')) + '">' + kropp(t.k, t.x) + '</span>';
  }
  function termerHtml(ts) {
    if (!ts.length) return '0';
    return ts.map(function (t, i) { return termHtml(t, i === 0); }).join('');
  }
  function frac(t, n) { return '<span class="fr"><span>' + t + '</span><span>' + n + '</span></span>'; }

  /* ---------- sidor i en ekvation ----------
     sida: {a, b, d, f, p}: (a/d)·x + b, eller f(x + p) om f ≠ 0 */
  function S(a, b, d, f, p) { return { a: a || 0, b: b || 0, d: d || 1, f: f || 0, p: p || 0 }; }
  function sidaHtml(s) {
    if (s.f) {
      var inre = '<span class="tx"><i>x</i></span>' + (s.p < 0 ? ' ' + MI + ' ' : ' + ') + '<span class="tk">' + Math.abs(s.p) + '</span>';
      return (s.f === 1 ? '' : s.f) + '(' + inre + ')';
    }
    var h = '', forst = true;
    if (s.a) {
      if (s.d > 1) h += '<span class="tx">' + frac('<i>x</i>', s.d) + '</span>';
      else h += termHtml({ k: s.a, x: true }, true);
      forst = false;
    }
    if (s.b) h += termHtml({ k: s.b, x: false }, forst);
    return h || '<span class="tk">0</span>';
  }
  function ekvHtml(L, Rr) { return '<span class="sd">' + sidaHtml(L) + '</span><span class="lk">=</span><span class="sd">' + sidaHtml(Rr) + '</span>'; }
  function varde(s, x) { return s.f ? s.f * (x + s.p) : s.a * x / s.d + s.b; }
  function harX(s) { return !!(s.f || s.a); }
  function lika(s, t) { return s.a === t.a && s.b === t.b && s.d === t.d && s.f === t.f && s.p === t.p; }

  /* ---------- nivåer ---------- */
  var NIV = {
    forenkla: [
      ['Bara addition', '2x + 4 + 3x'],
      ['Med subtraktion', '7x ' + MI + ' 2x + 8 ' + MI + ' 3'],
      ['Blandad ordning', '4 ' + MI + ' x + 6 + 3x'],
      ['Med parentes', '3(x + 2) + x'],
      ['Minus framför parentes', '5x ' + MI + ' (x ' + MI + ' 3)']
    ],
    ekvation: [
      ['Ett steg', 'x + 5 = 12'],
      ['Två steg', '3x + 4 = 19'],
      ['x i båda leden', '5x + 2 = 2x + 11'],
      ['Negativa tal', '3x + 10 = x + 4'],
      ['Parentes och bråk', '3(x + 2) = 21']
    ]
  };

  /* ---------- generera: förenkla ---------- */
  function genForenkla(niv) {
    for (var forsok = 0; forsok < 200; forsok++) {
      var ts = [], pre = [], post = [], par = null, i, nx, nk;
      if (niv === 1) {
        nx = rnd(2, 3); nk = rnd(1, 2);
        for (i = 0; i < nx; i++) ts.push({ k: rnd(1, 9), x: true });
        for (i = 0; i < nk; i++) ts.push({ k: rnd(1, 9), x: false });
        blanda(ts); if (!ts[0].x && Math.random() < 0.6) ts.push(ts.shift());
      } else if (niv === 2) {
        var a1 = rnd(4, 9), a2 = rnd(1, a1 - 1), k1 = rnd(5, 12), k2 = rnd(1, k1 - 1);
        ts = [{ k: a1, x: true }, { k: -a2, x: true }, { k: k1, x: false }, { k: -k2, x: false }];
        if (Math.random() < 0.5) ts = [ts[0], ts[2], ts[1], ts[3]];
        if (Math.random() < 0.4) { ts.splice(1, 0, { k: rnd(1, 5), x: true }); }
      } else if (niv === 3) {
        nx = rnd(2, 3); nk = rnd(2, 3);
        for (i = 0; i < nx; i++) ts.push({ k: pick([1, -1, 2, -2, 3, -3, 4, 5, -5, 6, 7]), x: true });
        for (i = 0; i < nk; i++) ts.push({ k: nz(-9, 9), x: false });
        blanda(ts);
        if (ts[0].k < 0) { var j = 0; while (j < ts.length && ts[j].k < 0) j++; if (j < ts.length) { var t0 = ts[j]; ts.splice(j, 1); ts.unshift(t0); } }
      } else if (niv === 4) {
        par = { f: rnd(2, 5), p: nz(-6, 6) };
        post = [{ k: nz(-6, 6), x: true }, { k: nz(-9, 9), x: false }];
        if (Math.random() < 0.3) post.pop();
        blanda(post);
      } else {
        par = { f: pick([-1, -1, -2, -3]), p: nz(-6, 6) };
        pre = [{ k: rnd(2, 8), x: true }];
        post = Math.random() < 0.6 ? [{ k: nz(-9, 9), x: false }] : [];
        if (Math.random() < 0.35) { pre = [{ k: rnd(2, 12), x: false }]; post = [{ k: nz(-6, 6), x: true }]; }
      }
      var uppg = { typ: 'forenkla', niv: niv, ts: ts, pre: pre, par: par, post: post };
      var exp = expandera(uppg), A = 0, B = 0, cx = 0, ck = 0;
      exp.forEach(function (t) { if (t.x) { A += t.k; cx++; } else { B += t.k; ck++; } });
      if (A === 0) continue;
      if (cx < 2 && ck < 2 && !par) continue;
      if (niv <= 2 && (A < 0 || B < 0)) continue;
      uppg.A = A; uppg.B = B; uppg.exp = exp;
      return uppg;
    }
    return genForenkla(1);
  }
  function expandera(u) {
    if (!u.par) return u.ts.slice();
    return u.pre.concat([{ k: u.par.f, x: true }, { k: u.par.f * u.par.p, x: false }], u.post);
  }
  function parHtml(u) {
    var f = u.par.f, fa = Math.abs(f), forst = !u.pre.length;
    var tecken = f < 0 ? (forst ? MI : ' ' + MI + ' ') : (forst ? '' : ' + ');
    return tecken + '<span class="tp">' + (fa === 1 ? '' : fa) + '(<i>x</i>' + (u.par.p < 0 ? ' ' + MI + ' ' : ' + ') + Math.abs(u.par.p) + ')</span>';
  }
  function uttrHtml(u) {
    if (!u.par) return termerHtml(u.ts);
    var h = u.pre.map(function (t, i) { return termHtml(t, i === 0); }).join('') + parHtml(u);
    return h + u.post.map(function (t) { return termHtml(t, false); }).join('');
  }
  function svarHtml(A, B) {
    var ts = []; if (A) ts.push({ k: A, x: true }); if (B) ts.push({ k: B, x: false });
    return termerHtml(ts);
  }

  /* ---------- generera: ekvationer ---------- */
  function genEkvation(niv) {
    var L, Rr, s, a, b, c, d, typ;
    for (var forsok = 0; forsok < 500; forsok++) {
      if (niv === 1) {
        typ = pick(['plus', 'plus', 'gang', 'gang', 'minus']);
        if (typ === 'plus') { s = rnd(1, 15); a = rnd(1, 12); L = S(1, a); Rr = S(0, s + a); }
        else if (typ === 'gang') { a = rnd(2, 9); s = rnd(1, 10); L = S(a, 0); Rr = S(0, a * s); }
        else { a = rnd(1, 9); s = rnd(a + 1, 20); L = S(1, -a); Rr = S(0, s - a); }
      } else if (niv === 2) {
        a = rnd(2, 6); s = rnd(1, 8); b = rnd(1, 12);
        if (Math.random() < 0.65) { L = S(a, b); Rr = S(0, a * s + b); }
        else { if (a * s - b <= 0) continue; L = S(a, -b); Rr = S(0, a * s - b); }
      } else if (niv === 3) {
        c = rnd(1, 4); a = c + rnd(1, 4); s = rnd(1, 6); b = rnd(0, 9);
        d = (a - c) * s + b; if (d <= 0 || d === b) continue;
        L = S(a, b); Rr = S(c, d);
        if (Math.random() < 0.3) { L = S(a, 0); Rr = S(c, (a - c) * s); if (Rr.b <= 0) continue; }
      } else if (niv === 4) {
        c = rnd(flytta() ? 1 : 0, 4); a = c + rnd(1, 4); s = nz(-8, 8); b = nz(-12, 12);
        d = (a - c) * s + b; if (d === 0 || d === b) continue;
        if (s > 0 && b > 0 && d > 0) continue;
        if (Math.abs(d) > 40) continue;
        L = S(a, b); Rr = S(c, d);
      } else {
        if (Math.random() < 0.5) {
          a = rnd(2, 5); var p = nz(-6, 6); s = rnd(1, 9); if (s + p === 0) continue;
          L = S(0, 0, 1, a, p); Rr = S(0, a * (s + p));
        } else {
          d = rnd(2, 5); var k = rnd(1, 6); s = d * k; b = nz(-9, 9); if (k + b === 0) continue;
          L = S(1, b, d); Rr = S(0, k + b);
        }
      }
      return { typ: 'ekvation', niv: niv, L0: L, R0: Rr, s: s };
    }
    return genEkvation(1);
  }

  /* ---------- balansmetoden: tillåtna drag ---------- */
  var OPNAMN = { '+': ['Addera', 'adderar'], '-': ['Subtrahera', 'subtraherar'], '*': ['Multiplicera', 'multiplicerar'], '/': ['Dividera', 'dividerar'] };
  var OPTECKEN = { '+': '+', '-': MI, '*': '·', '/': '÷' };
  function bort(v, x) { return { op: v > 0 ? '-' : '+', n: Math.abs(v), x: x }; }
  function opText(m) { return OPTECKEN[m.op] + ' ' + (m.x ? (m.n === 1 ? '' : m.n) + 'x' : m.n); }
  function opTextHtml(m) { return OPTECKEN[m.op] + ' ' + (m.x ? (m.n === 1 ? '' : m.n) + '<i>x</i>' : m.n); }
  function loses(L, Rr) {
    return (L.a === 1 && L.d === 1 && !L.b && !L.f && !harX(Rr)) || (Rr.a === 1 && Rr.d === 1 && !Rr.b && !Rr.f && !harX(L));
  }
  function drag(L, Rr) {
    var m = [];
    if (L.f) {
      m.push({ op: 'exp', tips: 'Multiplicera in parentesen: ' + L.f + ' · x och ' + L.f + ' · ' + (L.p < 0 ? '(' + tal(L.p) + ')' : L.p) + '.' });
      if (!harX(Rr) && Rr.b % L.f === 0) m.push({ op: '/', n: L.f, x: false, tips: 'Dividera med ' + L.f + ' (÷) på båda sidor, så försvinner talet framför parentesen.' });
      return m;
    }
    var xL = !!L.a, xR = !!Rr.a;
    if (xL && xR) {
      var min = Math.abs(L.a) < Math.abs(Rr.a) ? L : Rr, mv = bort(min.a, true);
      mv.tips = (mv.op === '-' ? 'Subtrahera ' : 'Addera ') + opText(mv).slice(2) + ' på båda sidor, så finns x bara på ena sidan.';
      m.push(mv);
      [L, Rr].forEach(function (s) { if (s.b) { var k = bort(s.b, false); k.tips = (k.op === '-' ? 'Subtrahera ' : 'Addera ') + k.n + ' på båda sidor, så försvinner ' + tal(s.b) + '.'; k.sek = true; m.push(k); } });
      return m;
    }
    var X = xL ? L : Rr;
    if (X.b) {
      var k2 = bort(X.b, false);
      k2.tips = (k2.op === '-' ? 'Subtrahera ' : 'Addera ') + k2.n + ' (' + OPTECKEN[k2.op] + ') på båda sidor, så försvinner ' + (X.b > 0 ? '+' : '') + tal(X.b) + ' som står tillsammans med x.';
      m.push(k2);
    } else if (X.d > 1) {
      m.push({ op: '*', n: X.d, x: false, tips: 'Multiplicera med ' + X.d + ' (·) på båda sidor, så försvinner bråkstrecket.' });
    } else if (X.a !== 1) {
      m.push({ op: '/', n: X.a, x: false, tips: 'Dividera med ' + X.a + ' (÷) på båda sidor, så blir det ett x.' });
    }
    return m;
  }
  function tillamp(s, m) {
    s = S(s.a, s.b, s.d, s.f, s.p);
    if (m.op === 'exp') return s.f ? S(s.f, s.f * s.p) : s;
    if (m.op === '/') { if (s.f) return S(1, s.p); return S(s.a / m.n, s.b / m.n, s.d); }
    if (m.op === '*') { if (s.d > 1 && s.d === m.n) return S(s.a, s.b * m.n, 1); return S(s.a * m.n, s.b * m.n, s.d); }
    var v = m.op === '+' ? m.n : -m.n;
    if (m.x) s.a += v; else s.b += v;
    return s;
  }
  function felDrag(L, Rr, m, giltiga) {
    if (m.x && (m.op === '*' || m.op === '/')) return 'Här räcker det att addera eller subtrahera. Multiplicera och dividera gör du bara med tal.';
    for (var i = 0; i < giltiga.length; i++) {
      var g = giltiga[i];
      if (g.op !== 'exp' && g.n === m.n && g.x === m.x && ((g.op === '*' && m.op === '/') || (g.op === '/' && m.op === '*'))) {
        return 'Om du ' + OPNAMN[m.op][1] + ' med ' + m.n + ' blir det ' + (m.op === '*' ? 'ännu fler x' : 'ännu mindre') + '. Prova motsatt räknesätt: ' + OPNAMN[g.op][0].toLowerCase() + ' med ' + m.n + '.';
      }
      if (g.op !== 'exp' && g.n === m.n && g.x === m.x && ((g.op === '+' && m.op === '-') || (g.op === '-' && m.op === '+'))) {
        var t = (g.op === '-' ? '+' : MI) + (m.x ? (m.n === 1 ? '' : m.n) + 'x' : m.n);
        return 'Om du ' + OPNAMN[m.op][1] + ' ' + (m.x ? (m.n === 1 ? '' : m.n) + 'x' : m.n) + ' blir det ' + (m.op === '+' ? 'mer' : 'mindre') + ', men ' + t + ' försvinner inte. Prova motsatt räknesätt.';
      }
    }
    if (L.f && m.op === '/') return 'Dividera med talet framför parentesen, eller multiplicera in parentesen.';
    var X = harX(L) && !harX(Rr) ? L : (harX(Rr) && !harX(L) ? Rr : null);
    if (X && X.b && (m.op === '/' || m.op === '*')) return 'Ta först bort talet ' + tal(X.b) + ' som står tillsammans med x. Sedan kan du ' + (m.op === '/' ? 'dividera' : 'multiplicera') + '.';
    if (m.x && L.a && Rr.a) return 'Ta bort den minsta variabeltermen (x-termen), så blir det inte ett negativt antal x.';
    if (X && !X.b && X.d === 1 && m.op === '/') return 'Dividera med talet som står framför x (' + X.a + ').';
    if (X && !X.b && X.d > 1 && m.op === '*') return 'Multiplicera med talet under bråkstrecket (' + X.d + ').';
    return 'Det draget gör inte ekvationen enklare. Titta på vad som står tillsammans med x, eller tryck på Tips.';
  }

  /* ---------- vågen ---------- */
  function visaVag(T) {
    if (T.niv > 3 || flytta()) return false;
    var ok = true;
    [T.L, T.R].forEach(function (s) { if (s.f || s.d > 1 || s.a < 0 || s.b < 0 || s.a > 10 || s.b > 30) ok = false; });
    return ok;
  }
  function vagSvg(L, Rr, fL, fR) {
    fL = fL || { x: 0, k: 0 }; fR = fR || { x: 0, k: 0 };
    function skal(s, cx, f) {
      var h = '', y = 128, i, rad, kol, x0;
      var xs = s.a, ks = s.b, perX = 5, perK = 8;
      var raderX = Math.ceil(xs / perX), item = [];
      for (i = 0; i < xs; i++) item.push({ t: 'x', bort: i >= xs - f.x });
      var kItems = [];
      for (i = 0; i < ks; i++) kItems.push({ t: 'k', bort: i >= ks - f.k });
      // x-block nederst, vikter ovanpå
      for (i = 0; i < xs; i++) {
        rad = Math.floor(i / perX); kol = i % perX;
        var nirad = Math.min(perX, xs - rad * perX);
        x0 = cx - nirad * 23 / 2 + kol * 23;
        h += '<g class="vx' + (item[i].bort ? ' bort' : '') + '"><rect x="' + (x0 + 1) + '" y="' + (y - 22 - rad * 23) + '" width="21" height="21" rx="5"/><text x="' + (x0 + 11.5) + '" y="' + (y - 7 - rad * 23) + '">x</text></g>';
      }
      var bas = y - raderX * 23;
      for (i = 0; i < ks; i++) {
        rad = Math.floor(i / perK); kol = i % perK;
        var nk = Math.min(perK, ks - rad * perK);
        x0 = cx - nk * 13 / 2 + kol * 13;
        h += '<rect class="vk' + (kItems[i].bort ? ' bort' : '') + '" x="' + (x0 + 1) + '" y="' + (bas - 12 - rad * 13) + '" width="11" height="11" rx="2.5"/>';
      }
      return h;
    }
    return '<svg class="vag" viewBox="0 0 320 170" role="img" aria-label="Våg i balans">' +
      '<path class="vstod" d="M160 52 L146 158 L174 158 Z"/><rect class="vfot" x="120" y="156" width="80" height="8" rx="4"/>' +
      '<rect class="vbalk" x="22" y="44" width="276" height="7" rx="3.5"/><circle class="vled" cx="160" cy="47.5" r="6"/>' +
      '<path class="vtrad" d="M76 51 L14 130 M76 51 L138 130 M244 51 L182 130 M244 51 L306 130"/><circle class="vkrok" cx="76" cy="51" r="3"/><circle class="vkrok" cx="244" cy="51" r="3"/>' +
      '<path class="vskal" d="M10 130 H142 Q138 142 124 142 H28 Q14 142 10 130 Z"/><path class="vskal" d="M178 130 H310 Q306 142 292 142 H196 Q182 142 178 130 Z"/>' +
      skal(L, 76, fL) + skal(Rr, 244, fR) + '</svg>';
  }

  /* ---------- tillstånd ---------- */
  var V = { typ: hamta('typ', 'ekvation'), niv: +hamta('niv', '1'), lage: hamta('lage', 'steg'), metod: hamta('metod', 'balans') };
  function flyttNiv() { return V.niv === 3 || V.niv === 4; }
  function flytta() { return V.typ === 'ekvation' && V.lage === 'steg' && V.metod === 'flytta' && (V.niv === 3 || V.niv === 4); }
  if (!NIV[V.typ]) V.typ = 'ekvation';
  if (!(V.niv >= 1 && V.niv <= 5)) V.niv = 1;
  var runda = null, T = null;

  function startvy() {
    runda = null; T = null;
    document.body.classList.remove('spelar');
    var h = '<div class="v-box"><span class="v-et">1. Välj vad du vill träna</span><div class="a-typ" role="group">' +
      '<button data-typ="forenkla" class="' + (V.typ === 'forenkla' ? 'on' : '') + '"><b class="ik-f">3<i>x</i>+2<i>x</i></b><span>Förenkla uttryck</span><small>Samla variabeltermer och siffertermer</small></button>' +
      '<button data-typ="ekvation" class="' + (V.typ === 'ekvation' ? 'on' : '') + '"><b class="ik-e"><svg viewBox="0 0 40 30" aria-hidden="true"><path d="M20 6 L15 27 H25 Z"/><rect x="3" y="5" width="34" height="3" rx="1.5"/><path d="M2 18 H14 Q13 22 8 22 Q3 22 2 18 Z M26 18 H38 Q37 22 32 22 Q27 22 26 18 Z"/></svg></b><span>Lös ekvationer</span><small>Med balansmetoden</small></button>' +
      '</div><div class="v-tva"><div><span class="v-et">2. Välj nivå</span><div class="v-seg a-niv">';
    for (var i = 1; i <= 5; i++) h += '<button data-niv="' + i + '" class="' + (V.niv === i ? 'on' : '') + '">' + i + '</button>';
    var nv = NIV[V.typ][V.niv - 1];
    h += '</div><p class="a-nivtext"><b>Nivå ' + V.niv + ': ' + nv[0] + '</b>, till exempel ' + nv[1].replace(/x/g, '<i>x</i>') + '</p></div>' +
      '<div><span class="v-et">3. Hur vill du räkna?</span><div class="v-seg a-lage"><button data-lage="steg" class="' + (V.lage === 'steg' ? 'on' : '') + '">Steg för steg<small>Ett steg i taget</small></button>' +
      '<button data-lage="sjalv" class="' + (V.lage === 'sjalv' ? 'on' : '') + '">Själv<small>Skriv bara svaret</small></button></div></div></div>' +
      (V.typ === 'ekvation' && V.lage === 'steg' ? '<div class="a-metod"><span class="v-et">4. Välj metod</span><div class="v-seg"><button data-metod="balans" class="' + (V.metod !== 'flytta' || !flyttNiv() ? 'on' : '') + '">Balansmetoden<small>Samma sak på båda sidor</small></button>' +
        '<button data-metod="flytta" class="' + (V.metod === 'flytta' && flyttNiv() ? 'on' : '') + '"' + (!flyttNiv() ? ' disabled' : '') + '>Flytta över<small>' + (!flyttNiv() ? 'Nivå 3–4 (x i båda leden)' : 'Byter led, byter räknesätt') + '</small></button></div><p class="a-nivtext a-metodtext">' + (V.metod === 'flytta' && flyttNiv() ? '<b>Flytta över:</b> en term som byter led byter räknesätt. + blir ' + MI + ', ' + MI + ' blir +, \u00b7 blir \u00f7. Det är samma sak som balansmetoden, fast kortare. Används när det finns variabeltermer i båda leden.' : '<b>Balansmetoden:</b> gör samma sak på båda sidor av likhetstecknet, så att ekvationen hela tiden är i balans, som en våg.') + '</p></div>' : '') +
      '<div class="v-start"><button id="aStart">Starta</button></div></div>';
    R.innerHTML = h;
    R.removeAttribute('data-typ');
    R.querySelectorAll('[data-typ]').forEach(function (b) { b.onclick = function () { V.typ = b.dataset.typ; spara('typ', V.typ); startvy(); }; });
    R.querySelectorAll('[data-niv]').forEach(function (b) { b.onclick = function () { V.niv = +b.dataset.niv; spara('niv', V.niv); startvy(); }; });
    R.querySelectorAll('[data-lage]').forEach(function (b) { b.onclick = function () { V.lage = b.dataset.lage; spara('lage', V.lage); startvy(); }; });
    R.querySelectorAll('[data-metod]').forEach(function (b) { b.onclick = function () { V.metod = b.dataset.metod; spara('metod', V.metod); startvy(); }; });
    document.getElementById('aStart').onclick = startaRunda;
  }

  function startaRunda() {
    runda = { nr: 0, res: [], sett: {} };
    document.body.classList.add('spelar');
    setTimeout(function () { try { R.scrollIntoView({ block: 'start', behavior: 'instant' }); } catch (e) { R.scrollIntoView(true); } }, 0);
    nyUppgift();
  }
  function nyUppgift() {
    var u, nyckel, f = 0;
    do {
      u = V.typ === 'forenkla' ? genForenkla(V.niv) : genEkvation(V.niv);
      nyckel = V.typ === 'forenkla' ? uttrHtml(u) : ekvHtml(u.L0, u.R0);
    } while (runda.sett[nyckel] && ++f < 30);
    runda.sett[nyckel] = 1;
    T = u; T.fel = 0; T.buf = ''; T.akt = 0; T.msg = ''; T.msgKl = ''; T.forsok = 0;
    if (u.typ === 'forenkla') {
      T.steg = V.lage === 'sjalv' ? 'sjalv' : (u.par ? 'exp' : 'markera');
      T.ts = u.par ? null : u.ts.slice(); T.mark = {};
      if (T.steg === 'exp') {
        T.rutor = [{ v: u.par.f, xk: true, buf: '' }, { v: u.par.f * u.par.p, buf: '' }];
        T.msg = 'Multiplicera in parentesen. Talet framför parentesen multipliceras med <b>båda</b> termerna inuti.';
      } else if (T.steg === 'markera') T.msg = 'Tryck på alla <b>variabeltermer</b>, alltså termerna med x.';
      else { T.rutor = [{ v: null, buf: '' }]; T.msg = 'Förenkla uttrycket och skriv svaret. Skriv variabeltermen först.'; }
    } else {
      T.L = S(T.L0.a, T.L0.b, T.L0.d, T.L0.f, T.L0.p); T.R = S(T.R0.a, T.R0.b, T.R0.d, T.R0.f, T.R0.p);
      T.rader = [{ h: ekvHtml(T.L, T.R) }];
      if (V.lage === 'sjalv') { T.steg = 'sjalv'; T.rutor = [{ v: T.s, buf: '' }]; T.msg = 'Lös ekvationen på papper och skriv vad x är.'; }
      else { T.steg = 'op'; T.op = null; T.msg = flytta() ? 'Vilken term vill du <b>flytta över</b> till andra sidan? Tryck på den.' : 'Vad gör du på <b>båda sidor</b>? Välj räknesätt och skriv talet.'; }
    }
    rita();
  }

  /* ---------- rita ---------- */
  function prickar() {
    var h = '<div class="up-prog">';
    for (var i = 0; i < ANTAL; i++) {
      var k = i < runda.res.length ? (runda.res[i] ? 'hel' : 'halv') : (i === runda.nr ? 'nu' : '');
      h += '<i class="' + k + '"></i>';
    }
    return h + '</div>';
  }
  function ruta(i) {
    var r = T.rutor[i], k = 'a-ruta' + (i === T.akt && !r.ok ? ' sel' : '') + (r.ok ? ' ok' : '') + (r.fel ? ' fel' : '');
    var txt = r.buf === '' ? '&nbsp;' : r.buf.replace(/-/g, MI).replace(/x/g, '<i>x</i>');
    return '<span class="' + k + '" data-r="' + i + '" role="button" tabindex="0">' + txt + '</span>';
  }
  function tangenter(sort) {
    var k;
    if (sort === 'op') k = ['7', '8', '9', '⌫', '4', '5', '6', 'x', '1', '2', '3', null, '0', null, 'OK'];
    else if (sort === 'uttr') k = ['7', '8', '9', '⌫', '4', '5', '6', 'x', '1', '2', '3', '+', '0', '-', 'OK'];
    else k = ['7', '8', '9', '⌫', '4', '5', '6', '-', '1', '2', '3', null, '0', null, 'OK'];
    var okText = sort === 'op' ? 'Gör det' : 'Rätta';
    return '<div class="a-tangent">' + k.map(function (t) {
      if (t === null) return '<span></span>';
      if (t === 'OK') return '<button class="a-ok" data-k="OK">' + okText + '</button>';
      var lab = t === '-' ? MI : (t === 'x' ? '<i>x</i>' : t);
      return '<button data-k="' + t + '" class="' + (t === '⌫' ? 'gra' : (t === 'x' || t === '-' || t === '+' ? 'sym' : '')) + '" aria-label="' + (t === '⌫' ? 'Sudda' : t) + '">' + lab + '</button>';
    }).join('') + '</div>';
  }
  function chip() {
    var nv = NIV[V.typ][V.niv - 1];
    return '<div class="v-bar"><div class="v-chip"><b>' + (V.typ === 'forenkla' ? 'Förenkla uttryck' : 'Ekvationer') + '</b> · Nivå ' + V.niv + ': ' + nv[0] + ' · ' + (V.lage === 'steg' ? 'Steg för steg' : 'Själv') + (flytta() ? ' · Flytta över' : '') + '</div><button class="v-byt" id="aByt">Byt</button></div>';
  }

  function rita() {
    R.setAttribute('data-typ', V.typ);
    var h = chip() + '<div class="up-kort a-kort"><div class="up-topp"><span class="up-uppg">Uppgift ' + (runda.nr + 1) + ' av ' + ANTAL + '</span>' + prickar() + '</div>';
    h += T.typ === 'forenkla' ? ritaForenkla() : ritaEkvation();
    h += '<div class="up-msg ' + (T.msgKl || '') + '" aria-live="polite">' + T.msg + '</div>';
    h += ritaKontroller() + '</div>';
    R.innerHTML = h;
    koppla();
  }

  function ritaForenkla() {
    var u = T, h = '<p class="up-fraga">Förenkla uttrycket</p>' + '<div class="a-leg"><span><i class="lx"></i>variabelterm (med x)</span><span><i class="lk2"></i>sifferterm (bara tal)</span></div>' + '<div class="a-uttr">';
    if (T.steg === 'exp') {
      h += uttrHtml(u) + '</div><div class="a-rad a-ny">' + parHtml({ par: u.par, pre: [] }) + ' = ' + ruta(0) + '<i class="xv">x</i> ' + ruta(1) + '</div>';
      return h;
    }
    if (T.steg === 'sjalv' || (T.steg === 'klar' && V.lage === 'sjalv')) {
      if (T.steg === 'klar') return h + uttrHtml(u) + '</div><div class="a-rad a-svar">= <b>' + svarHtml(T.A, T.B) + '</b></div>';
      h += uttrHtml(u) + '</div><div class="a-rad a-ny">= ' + ruta(0).replace('class="a-ruta', 'class="a-ruta bred') + '</div>';
      return h;
    }
    // markera / xsum / ksum / klar
    var ts = T.ts;
    h += ts.map(function (t, i) {
      var tecken = t.k < 0 ? MI : '+';
      var kl = 'term' + (T.mark[i] ? ' mx' : '') + (T.steg !== 'markera' && !t.x ? ' mk' : '');
      return '<span class="tgrp">' + (i === 0 && t.k > 0 ? '' : '<span class="op">' + tecken + '</span>') + '<button class="' + kl + '" data-t="' + i + '"' + (T.steg !== 'markera' ? ' disabled' : '') + '>' + kropp(t.k, t.x) + '</button></span>';
    }).join('') + '</div>';
    if (T.steg === 'xsum' || T.steg === 'ksum' || T.steg === 'klar') {
      var xs = ts.filter(function (t) { return t.x; }), ks = ts.filter(function (t) { return !t.x; });
      if (xs.length > 1) {
        h += '<div class="a-rad"><span class="a-et tx">variabeltermer</span>' + termerHtml(xs) + ' = ' + (T.steg === 'xsum' ? ruta(0) + '<i class="xv">x</i>' : '<span class="tx">' + kropp(T.A, true).replace(/^/, T.A < 0 ? MI : '') + '</span>') + '</div>';
      }
      if (ks.length > 1 && T.steg !== 'xsum') {
        h += '<div class="a-rad"><span class="a-et tk">siffertermer</span>' + termerHtml(ks) + ' = ' + (T.steg === 'ksum' ? ruta(0) : '<span class="tk">' + tal(T.B) + '</span>') + '</div>';
      }
      if (T.steg === 'klar') h += '<div class="a-rad a-svar">Förenklat: <b>' + svarHtml(T.A, T.B) + '</b></div>';
    }
    return h;
  }

  function ritaEkvation() {
    var h = '<p class="up-fraga">Lös ekvationen' + (V.lage === 'steg' ? (flytta() ? ' genom att flytta över termer' : ' med balansmetoden') : '') + '</p>' + (V.lage === 'steg' ? '<div class="a-leg"><span><i class="lx"></i>variabelterm (med x)</span><span><i class="lk2"></i>sifferterm (bara tal)</span></div>' : '') + '<div class="a-ekv' + (visaVag(T) && V.lage === 'steg' ? ' med-vag' : '') + '"><div class="a-rader">';
    T.rader.forEach(function (r, i) {
      var inne = r.h;
      if (flytta() && T.steg === 'op' && i === T.rader.length - 1) inne = '<span class="sd">' + sidaKnappar(T.L, 'L', T.R) + '</span><span class="lk">=</span><span class="sd">' + sidaKnappar(T.R, 'R', T.L) + '</span>';
      h += '<div class="a-rad' + (r.op ? ' a-oprad' : '') + (i === 0 ? ' a-start' : '') + (inne !== r.h ? ' a-klick' : '') + '">' + inne + '</div>';
    });
    if (T.steg === 'flytt') h += '<div class="a-rad a-ny">' + T.flyttMall.replace(/\{R(\d+)\}/g, function (_, i) { return ruta(+i); }) + '</div>';
    if (T.steg === 'fyll') {
      h += (T.opRad ? '<div class="a-rad a-oprad">' + T.opRad + '</div>' : '') + '<div class="a-rad a-ny">' + T.mall.replace(/\{R(\d+)\}/g, function (_, i) { return ruta(+i); }) + '</div>';
    } else if (T.steg === 'sjalv') {
      h += '<div class="a-rad a-ny"><span class="tx"><i>x</i></span><span class="lk">=</span>' + ruta(0) + '</div>';
    } else if (T.steg === 'kontroll' || T.steg === 'klar') {
      h += '<div class="a-kontroll"><b>Kontroll</b>: sätt in <i>x</i> = ' + tal(T.s) + ' i ekvationen ' + ekvHtml(T.L0, T.R0) + (T.steg === 'kontroll' ? T.kontrollMall.replace(/\{R(\d+)\}/g, function (_, i) { return ruta(+i); }) : T.kontrollHtml) + '</div>';
    }
    h += '</div>';
    if (V.lage === 'steg' && T.steg !== 'kontroll' && T.steg !== 'klar' && visaVag(T)) {
      h += '<div class="a-vag">' + vagSvg(T.L, T.R, T.fadeL, T.fadeR) + '</div>';
    }
    return h + '</div>';
  }

  function ritaKontroller() {
    var h = '';
    if (T.steg === 'op' && flytta()) {
      h += '<div class="up-knappar a-knappar">' + (T.L.f ? '<button class="up-angra" id="aExp">Multiplicera in parentesen</button>' : '') + '<button class="up-angra" id="aTips">Tips</button></div>';
    } else if (T.steg === 'op') {
      h += '<div class="a-opgrid"><div class="a-opv-vanster"><div class="a-opval" role="group" aria-label="Räknesätt">';
      ['+', '-', '*', '/'].forEach(function (o) {
        h += '<button data-op="' + o + '" class="op-' + ({ '+': 'add', '-': 'sub', '*': 'mul', '/': 'div' })[o] + (T.op === o ? ' on' : '') + '"><b>' + OPTECKEN[o] + '</b><span>' + OPNAMN[o][0] + '</span></button>';
      });
      h += '</div><div class="a-bada"><span>På båda sidor:</span><span class="a-opv">' + (T.op ? OPTECKEN[T.op] : '?') + '</span><span class="a-ruta sel bred">' + (T.buf ? T.buf.replace(/x/g, '<i>x</i>') : '&nbsp;') + '</span></div>';
      h += '<div class="up-knappar a-knappar">' + (T.L.f ? '<button class="up-angra" id="aExp">Multiplicera in parentesen</button>' : '') + '<button class="up-angra" id="aTips">Tips</button></div></div>';
      h += '<div class="up-pad-wrap">' + tangenter('op') + '</div></div>';
    } else if (T.steg === 'fyll' || T.steg === 'flytt' || T.steg === 'exp' || T.steg === 'xsum' || T.steg === 'ksum' || T.steg === 'kontroll' || T.steg === 'sjalv') {
      var sort = (T.typ === 'forenkla' && T.steg === 'sjalv') ? 'uttr' : 'tal';
      h += '<div class="up-pad-wrap">' + tangenter(sort) + '</div>';
      if (T.visaSvar) h += '<div class="up-knappar a-knappar"><button class="up-angra" id="aVisa">Visa svaret</button></div>';
    } else if (T.steg === 'klar') {
      h += '<div class="up-knappar"><button class="up-nasta" id="aNasta">' + (runda.nr + 1 < ANTAL ? 'Nästa uppgift →' : 'Se resultatet') + '</button></div>';
    }
    return h;
  }

  /* ---------- händelser ---------- */
  function koppla() {
    var b = document.getElementById('aByt'); if (b) b.onclick = startvy;
    R.querySelectorAll('[data-k]').forEach(function (k) { k.onclick = function () { tangent(k.dataset.k); }; });
    R.querySelectorAll('[data-r]').forEach(function (r) { r.onclick = function () { T.akt = +r.dataset.r; rita(); }; });
    R.querySelectorAll('[data-op]').forEach(function (o) { o.onclick = function () { T.op = o.dataset.op; rita(); }; });
    R.querySelectorAll('[data-t]').forEach(function (t) { t.onclick = function () { markera(+t.dataset.t); }; });
    R.querySelectorAll('[data-f]').forEach(function (t) { t.onclick = function () { tryckFlytt(t.dataset.f); }; });
    var e = document.getElementById('aExp'); if (e) e.onclick = function () { gorDrag({ op: 'exp' }); };
    var tp = document.getElementById('aTips'); if (tp) tp.onclick = tips;
    var n = document.getElementById('aNasta'); if (n) { n.onclick = nasta; try { n.focus({ preventScroll: true }); } catch (x) {} }
    var vs = document.getElementById('aVisa'); if (vs) vs.onclick = visaSvaret;
  }
  function meddela(m, kl) { T.msg = m; T.msgKl = kl || ''; }

  function tangent(k) {
    if (!T) return;
    if (T.steg === 'op') {
      if (k === 'OK') return provaDrag();
      if (k === '⌫') T.buf = T.buf.slice(0, -1);
      else if (k === 'x') { if (T.buf.indexOf('x') < 0) T.buf += 'x'; }
      else if (/^\d$/.test(k)) { if (T.buf.indexOf('x') < 0 && T.buf.length < 3) T.buf += k; }
      else if ('+-*/'.indexOf(k) >= 0) T.op = k;
      return rita();
    }
    if (!T.rutor || T.steg === 'klar' || T.steg === 'markera') return;
    if (k === 'OK') return ratta();
    var r = T.rutor[T.akt]; if (!r || r.ok) return;
    r.fel = false;
    if (k === '⌫') r.buf = r.buf.slice(0, -1);
    else if (k === '-') { if (T.steg === 'sjalv' && T.typ === 'forenkla') r.buf += '-'; else if (r.buf === '') r.buf = '-'; else if (r.buf === '-') r.buf = ''; }
    else if (k === '+') { if (T.steg === 'sjalv' && T.typ === 'forenkla') r.buf += '+'; }
    else if (k === 'x') { if (T.steg === 'sjalv' && T.typ === 'forenkla') r.buf += 'x'; }
    else if (/^\d$/.test(k) && r.buf.length < 14) r.buf += k;
    rita();
  }

  function provaDrag() {
    if (!T.op) { meddela('Välj först ett räknesätt: addera, subtrahera, multiplicera eller dividera.', 'fel'); return rita(); }
    var s = norm(T.buf), mt = /^(\d*)(x?)$/.exec(s);
    if (!s || !mt || (!mt[1] && !mt[2])) { meddela('Skriv vad du vill ' + OPNAMN[T.op][1].replace(/r$/, '') + ', till exempel 3 eller 2x.', 'fel'); return rita(); }
    var m = { op: T.op, n: mt[1] === '' ? 1 : parseInt(mt[1], 10), x: !!mt[2] };
    if (m.n === 0) { meddela('Att ' + OPNAMN[T.op][1].replace(/r$/, '') + ' 0 ändrar ingenting. Välj ett annat tal.', 'fel'); return rita(); }
    gorDrag(m);
  }
  function gorDrag(m) {
    var g = drag(T.L, T.R), traff = null;
    g.forEach(function (d) { if (d.op === m.op && (m.op === 'exp' || (d.n === m.n && d.x === m.x))) traff = d; });
    if (!traff) {
      T.fel++;
      var ft = m.op === 'exp' ? 'Det finns ingen parentes att multiplicera in.' : felDrag(T.L, T.R, m, g);
      if (flytta()) ft = flyttFel(m, g);
      meddela(ft, 'fel');
      return rita();
    }
    if (flytta() && m.op !== 'exp') return startaFlytt(m);
    fortsatt(m);
  }
  function fortsatt(m) {
    var nL = tillamp(T.L, m), nR = tillamp(T.R, m);
    // raden med draget på båda sidor
    if (m.op === 'exp') T.opRad = '';
    else if (flytta()) T.opRad = T.flyttRad;
    else {
      var opv = ' <span class="opv op-' + ({ '+': 'add', '-': 'sub', '*': 'mul', '/': 'div' })[m.op] + '">' + opTextHtml(m) + '</span>';
      var pl = function (s) { var h = sidaHtml(s); return (m.op === '*' || m.op === '/') && (s.b && s.a || s.f) ? (s.f ? h : '(' + h + ')') : h; };
      T.opRad = '<span class="sd">' + pl(T.L) + opv + '</span><span class="lk">=</span><span class="sd">' + pl(T.R) + opv + '</span>';
    }
    // vågen visar vad som tas bort
    T.fadeL = T.fadeR = null;
    if (visaVag(T)) {
      if (m.op === '-') { var f = m.x ? { x: m.n, k: 0 } : { x: 0, k: m.n }; T.fadeL = f; T.fadeR = f; }
      else if (m.op === '/') { T.fadeL = { x: T.L.a - T.L.a / m.n, k: T.L.b - T.L.b / m.n }; T.fadeR = { x: T.R.a - T.R.a / m.n, k: T.R.b - T.R.b / m.n }; }
    }
    // mall med rutor för det som ändrats
    T.rutor = []; T.nyL = nL; T.nyR = nR;
    T.mall = '<span class="sd">' + mallSida(T.L, nL, m) + '</span><span class="lk">=</span><span class="sd">' + mallSida(T.R, nR, m) + '</span>';
    T.akt = 0;
    var namn = m.op === 'exp' ? 'Du multiplicerar in parentesen.' : (flytta() ? 'Rätt! Räkna nu ut den nya ekvationen.' : 'Du ' + OPNAMN[m.op][1] + ' ' + opTextHtml(m).slice(2) + ' på båda sidor.');
    if (!T.rutor.length) {
      klarRad(namn + ' Då blir det ' + ekvHtml(nL, nR) + '.');
      return rita();
    }
    T.steg = 'fyll';
    meddela(namn + ' Skriv den nya ekvationen' + (T.rutor.length > 1 ? ' (tryck på en ruta för att välja den)' : '') + '.', 'ok');
    rita();
  }
  /* ---------- flytta över ---------- */
  function sidaKnappar(s, sd, annan) {
    var b = function (f, inner, kl) { return '<button class="term fl ' + (kl || '') + '" data-f="' + sd + ':' + f + '">' + inner + '</button>'; };
    if (s.f) return b('f', s.f, 'tx') + '(<i>x</i>' + (s.p < 0 ? ' ' + MI + ' ' : ' + ') + Math.abs(s.p) + ')';
    var h = '', forst = true;
    if (s.a) {
      if (s.d > 1) h += '<span class="tx fl-fr"><span><i>x</i></span>' + b('d', s.d, 'tx') + '</span>';
      else if (!s.b && !harX(annan) && s.a !== 1) h += b('k', s.a, 'tx') + '<span class="tx"><i>x</i></span>';
      else h += b('a', (s.a < 0 ? MI : '') + kropp(s.a, true), 'tx');
      forst = false;
    }
    if (s.b) h += (forst ? '' : ' ') + b('b', (s.b < 0 ? MI + ' ' : (forst ? '' : '+ ')) + Math.abs(s.b), 'tk');
    return h || '<span class="tk">0</span>';
  }
  function tryckFlytt(f) {
    var sd = f[0] === 'L' ? T.L : T.R, del = f.slice(2), m;
    if (del === 'a') m = bort(sd.a, true);
    else if (del === 'b') m = bort(sd.b, false);
    else if (del === 'k') m = { op: '/', n: sd.a, x: false };
    else if (del === 'd') m = { op: '*', n: sd.d, x: false };
    else m = { op: '/', n: sd.f, x: false };
    T.flyttFran = f[0];
    gorDrag(m);
  }
  function startaFlytt(m) {
    var fran = T.flyttFran === 'R' ? T.R : T.L, till = T.flyttFran === 'R' ? T.L : T.R;
    var utan, tillH, v, xk = false, symb;
    if (m.op === '+' || m.op === '-') {
      utan = S(fran.a, fran.b, fran.d); if (m.x) utan.a = 0; else utan.b = 0;
      v = m.op === '-' ? -m.n : m.n; xk = m.x;
      tillH = sidaHtml(till) + ' {R0}' + (m.x ? '<span class="tx"><i>x</i></span>' : '');
      symb = (v < 0 ? MI : '+') + ' ' + (m.x ? (m.n === 1 ? '' : m.n) + '<i>x</i>' : m.n);
    } else if (m.op === '/') {
      utan = fran.f ? S(1, fran.p) : S(1, fran.b);
      v = m.n; tillH = frac(sidaHtml(till), '{R0}'); symb = '\u00f7 ' + m.n;
    } else {
      utan = S(1, fran.b); v = m.n; tillH = sidaHtml(till) + ' \u00b7 {R0}'; symb = '\u00b7 ' + m.n;
    }
    var fH = sidaHtml(utan);
    T.flyttM = m;
    T.flyttDelar = [fH, tillH];
    T.flyttMall = T.flyttFran === 'R' ? '<span class="sd">' + tillH + '</span><span class="lk">=</span><span class="sd">' + fH + '</span>' : '<span class="sd">' + fH + '</span><span class="lk">=</span><span class="sd">' + tillH + '</span>';
    T.rutor = [{ v: v, xk: xk, buf: '' }]; T.akt = 0; T.steg = 'flytt';
    var vad = m.op === '+' || m.op === '-' ? 'Termen byter led och byter räknesätt: ' + (m.op === '-' ? '+ blir ' + MI : MI + ' blir +') : (m.op === '/' ? 'Talet multipliceras med x. När det byter led byter det räknesätt: \u00b7 blir \u00f7' : 'x divideras med talet. När det byter led byter det räknesätt: \u00f7 blir \u00b7');
    meddela(vad + '. Skriv ' + (m.op === '+' || m.op === '-' ? 'termen med sitt nya tecken' : 'talet') + ' på andra sidan.', 'ok');
    T.flyttSymb = symb;
    rita();
  }
  function flyttKlar() {
    var r = T.rutor[0], m = T.flyttM;
    var fyllt = T.flyttMall.replace('{R0}', '<span class="opv op-' + ({ '+': 'add', '-': 'sub', '*': 'mul', '/': 'div' })[m.op] + '">' + (m.op === '+' || m.op === '-' ? (r.v < 0 ? MI : '+') + ' ' + (m.x ? (m.n === 1 ? '' : m.n) + '<i>x</i>' : m.n) : m.n) + '</span>').replace(/<span class="tx"><i>x<\/i><\/span>(?=<\/span><span class="lk">|<\/span>$)/, function (x) { return m.x ? '' : x; });
    T.flyttRad = fyllt;
    var bal = (m.op === '-' ? 'Subtrahera ' : m.op === '+' ? 'Addera ' : m.op === '/' ? 'Dividera med ' : 'Multiplicera med ') + (m.x ? (m.n === 1 ? '' : m.n) + 'x' : m.n);
    T.flyttForkl = 'Det är samma sak som balansmetoden: ' + bal.toLowerCase() + ' på båda sidor.';
    fortsatt(m);
    meddela('Rätt! ' + T.flyttForkl + ' ' + (T.steg === 'fyll' ? 'Räkna nu ut den nya ekvationen.' : ''), 'ok');
  }
  function mallSida(gml, ny, m) {
    if (ny.f) return sidaHtml(ny);
    var h = '', forst = true;
    var andrat = function (a, b) { return a !== b || gml.f; };
    if (ny.a) {
      if (ny.d > 1) h += '<span class="tx">' + frac('<i>x</i>', ny.d) + '</span>';
      else if (andrat(gml.a, ny.a) && ny.a !== 1 && !(gml.d > 1)) { T.rutor.push({ v: ny.a, xk: true, buf: '' }); h += '{R' + (T.rutor.length - 1) + '}<span class="tx"><i>x</i></span>'; }
      else h += termHtml({ k: ny.a, x: true }, true);
      forst = false;
    }
    if (ny.b) {
      if (andrat(gml.b, ny.b)) { T.rutor.push({ v: ny.b, buf: '', tecken: !forst }); h += (forst ? '' : ' ') + '{R' + (T.rutor.length - 1) + '}'; }
      else h += termHtml({ k: ny.b, x: false }, forst);
      forst = false;
    }
    if (forst) h = '<span class="tk">0</span>';
    return h;
  }
  function klarRad(text) {
    // flytta raden till historiken och gå vidare
    if (T.opRad) T.rader.push({ h: T.opRad, op: true });
    T.L = T.nyL; T.R = T.nyR; T.fadeL = T.fadeR = null;
    T.rader.push({ h: ekvHtml(T.L, T.R) });
    T.rutor = null;
    if (loses(T.L, T.R)) {
      T.steg = 'kontroll';
      byggKontroll();
      meddela('Nu står x ensamt: <b><i>x</i> = ' + tal(T.s) + '</b>. Kontrollera nu att svaret stämmer: räkna ut ' + (T.kontrollTva ? 'båda leden' : 'vänster led') + '.', 'ok');
    } else {
      T.steg = 'op'; T.op = null; T.buf = '';
      meddela((text ? text + ' ' : 'Rätt! ') + 'Vad gör du nu på båda sidor?', 'ok');
    }
  }
  function insatt(s, x) {
    var xs = x < 0 ? '(' + tal(x) + ')' : '' + x;
    if (s.f) return (s.f === 1 ? '' : s.f + ' · ') + '(' + tal(x) + (s.p < 0 ? ' ' + MI + ' ' : ' + ') + Math.abs(s.p) + ')';
    var h = '';
    if (s.a) {
      if (s.d > 1) h += frac(tal(x), s.d);
      else if (s.a === 1) h += x < 0 ? tal(x) : '' + x;
      else if (s.a === -1) h += MI + xs;
      else h += s.a < 0 ? MI + Math.abs(s.a) + ' · ' + xs : s.a + ' · ' + xs;
    }
    if (s.b) h += (h ? (s.b < 0 ? ' ' + MI + ' ' : ' + ') + Math.abs(s.b) : tal(s.b));
    return h || '0';
  }
  function byggKontroll() {
    T.rutor = []; var h = '<div class="a-kgrid">';
    var vv = varde(T.L0, T.s), hv = varde(T.R0, T.s);
    [['Vänster led', T.L0, vv], ['Höger led', T.R0, hv]].forEach(function (x) {
      if (harX(x[1])) { T.rutor.push({ v: x[2], buf: '' }); h += '<span>' + x[0] + ':</span><span>' + insatt(x[1], T.s) + ' = {R' + (T.rutor.length - 1) + '}</span>'; }
      else h += '<span>' + x[0] + ':</span><span>' + tal(x[2]) + '</span>';
    });
    T.kontrollTva = T.rutor.length > 1;
    T.kontrollMall = h + '</div>';
    T.akt = 0;
  }

  function ratta() {
    var allaOk = true, nagonFel = false;
    if (T.typ === 'forenkla' && T.steg === 'sjalv') return rattaSjalvUttr();
    T.rutor.forEach(function (r) {
      if (r.ok) return;
      var v = heltal(r.buf, r.xk);
      if (r.buf === '' || r.buf === '-') { allaOk = false; return; }
      if (v === r.v) { r.ok = true; r.fel = false; }
      else { r.fel = true; allaOk = false; nagonFel = true; }
    });
    if (nagonFel) {
      T.fel++; T.forsok++;
      var fx = '';
      if (T.steg === 'kontroll') fx = 'Räkna ut ledet igen. Multiplicera före addition och subtraktion.';
      else if (T.steg === 'exp') fx = 'Multiplicera talet framför parentesen med varje term inuti. Tänk på tecknen: ' + MI + ' gånger ' + MI + ' blir +.';
      else if (T.steg === 'xsum') fx = 'Räkna bara med talen framför x (koefficienterna). Ett ensamt x är 1x.';
      else if (T.steg === 'ksum') fx = 'Räkna ihop siffertermerna, och tänk på tecknet framför varje term.';
      else if (T.steg === 'sjalv') fx = 'Inte rätt. Försök igen' + (V.typ === 'ekvation' ? ', och kontrollera genom att sätta in ditt svar.' : '.');
      else if (T.steg === 'flytt') fx = T.flyttM.op === '+' || T.flyttM.op === '-' ? 'Tänk på tecknet. En term som byter led byter räknesätt: + blir ' + MI + ' och ' + MI + ' blir +.' : 'Skriv talet som flyttades. Det byter räknesätt men är samma tal.';
      else fx = 'Rutan som är röd stämmer inte. Gör samma sak med varje tal och räkna igen.';
      if (T.steg === 'sjalv' && T.forsok >= 2) T.visaSvar = true;
      meddela(fx, 'fel');
      // flytta markeringen till första felaktiga rutan
      for (var i = 0; i < T.rutor.length; i++) if (!T.rutor[i].ok) { T.akt = i; break; }
      return rita();
    }
    if (!allaOk) {
      for (var j = 0; j < T.rutor.length; j++) if (!T.rutor[j].ok) { T.akt = j; break; }
      meddela('Fyll i alla rutor först.', 'vx');
      return rita();
    }
    // allt rätt
    if (T.typ === 'ekvation') {
      if (T.steg === 'flytt') { flyttKlar(); return rita(); }
      if (T.steg === 'fyll') { klarRad(''); return rita(); }
      if (T.steg === 'kontroll') {
        T.kontrollHtml = T.kontrollMall.replace(/\{R(\d+)\}/g, function (_, i) { return '<b class="tk">' + tal(T.rutor[+i].v) + '</b>'; });
        T.steg = 'klar';
        meddela('Båda leden blir ' + tal(varde(T.L0, T.s)) + '. Svaret <b>x = ' + tal(T.s) + '</b> stämmer!', 'klar');
        return rita();
      }
      if (T.steg === 'sjalv') { T.steg = 'klar'; byggKontrollKlar(); meddela('Rätt! <b>x = ' + tal(T.s) + '</b>.', 'klar'); return rita(); }
    } else {
      if (T.steg === 'exp') {
        T.ts = T.exp.slice(); T.steg = 'markera'; T.rutor = null;
        meddela('Rätt! ' + parHtml({ par: T.par, pre: [] }) + ' = ' + termerHtml(T.exp.slice(T.pre.length, T.pre.length + 2)) + '. Tryck nu på alla <b>variabeltermer</b>.', 'ok');
        return rita();
      }
      if (T.steg === 'xsum') {
        var ks = T.ts.filter(function (t) { return !t.x; });
        var extra = Math.abs(T.A) === 1 ? ' (1x skriver vi bara som x.)' : '';
        if (ks.length > 1) { T.steg = 'ksum'; T.rutor = [{ v: T.B, buf: '' }]; T.akt = 0; meddela('Rätt!' + extra + ' Räkna nu ihop <b>siffertermerna</b>.', 'ok'); }
        else klarForenkla('Rätt!' + extra);
        return rita();
      }
      if (T.steg === 'ksum') { klarForenkla('Rätt!'); return rita(); }
    }
  }
  function byggKontrollKlar() {
    byggKontroll();
    T.kontrollHtml = T.kontrollMall.replace(/\{R(\d+)\}/g, function (_, i) { return '<b class="tk">' + tal(T.rutor[+i].v) + '</b>'; });
  }
  function klarForenkla(pre) {
    T.steg = 'klar'; T.rutor = null;
    meddela(pre + ' Det förenklade uttrycket är <b>' + svarHtml(T.A, T.B) + '</b>.', 'klar');
  }
  function markera(i) {
    var t = T.ts[i];
    if (T.mark[i]) return;
    if (!t.x) { T.fel++; meddela('<b>' + tal(t.k) + '</b> är en sifferterm, den har inget x. Tryck bara på variabeltermerna.', 'fel'); return rita(); }
    T.mark[i] = 1;
    var kvar = T.ts.filter(function (tt, j) { return tt.x && !T.mark[j]; }).length;
    if (kvar) { meddela('Bra! Det finns ' + (kvar === 1 ? 'en variabelterm' : kvar + ' variabeltermer') + ' till.', 'ok'); return rita(); }
    var xs = T.ts.filter(function (tt) { return tt.x; }), ks = T.ts.filter(function (tt) { return !tt.x; });
    if (xs.length > 1) { T.steg = 'xsum'; T.rutor = [{ v: T.A, xk: true, buf: '' }]; T.akt = 0; meddela('Alla variabeltermer är markerade. Räkna ihop dem. Tänk på tecknet framför varje term.', 'ok'); }
    else if (ks.length > 1) { T.steg = 'ksum'; T.rutor = [{ v: T.B, buf: '' }]; T.akt = 0; meddela('Det finns bara en variabelterm. Räkna nu ihop <b>siffertermerna</b>.', 'ok'); }
    else klarForenkla('Bra!');
    rita();
  }
  function rattaSjalvUttr() {
    var r = T.rutor[0], s = norm(r.buf);
    var mt = s.match(/[+-]?[^+-]+/g);
    if (!s || !mt || mt.join('') !== s) { meddela('Skriv till exempel 5x + 4.', 'vx'); return rita(); }
    var A = 0, B = 0, cx = 0, ck = 0, okForm = true;
    mt.forEach(function (term) {
      var m2 = /^([+-]?)(\d*)(x?)$/.exec(term);
      if (!m2 || (!m2[2] && !m2[3])) { okForm = false; return; }
      var v = (m2[1] === '-' ? -1 : 1) * (m2[2] === '' ? 1 : parseInt(m2[2], 10));
      if (m2[3]) { A += v; cx++; } else { B += v; ck++; }
    });
    if (!okForm) { meddela('Skriv till exempel 5x + 4.', 'vx'); return rita(); }
    if (A === T.A && B === T.B && (cx > 1 || ck > 1)) { meddela('Det stämmer, men det går att förenkla mer. Samla alla variabeltermer till en och alla siffertermer till en.', 'vx'); return rita(); }
    if (A === T.A && B === T.B) { T.steg = 'klar'; meddela('Rätt! Det förenklade uttrycket är <b>' + svarHtml(T.A, T.B) + '</b>.', 'klar'); return rita(); }
    T.fel++; T.forsok++; r.fel = true;
    var tip = A === T.A ? 'Variabeltermen är rätt, men räkna om siffertermen.' : (B === T.B && ck ? 'Siffertermen är rätt, men räkna om variabeltermen.' : 'Inte rätt. Försök igen.');
    if (T.forsok >= 2) T.visaSvar = true;
    meddela(tip, 'fel'); rita();
  }
  function visaSvaret() {
    T.fel = Math.max(T.fel, 1); T.steg = 'klar'; T.visaSvar = false;
    if (T.typ === 'forenkla') meddela('Svaret är <b>' + svarHtml(T.A, T.B) + '</b>. Prova gärna Steg för steg om du vill se hur man gör.', 'vx');
    else { byggKontrollKlar(); meddela('Svaret är <b>x = ' + tal(T.s) + '</b>. Prova gärna Steg för steg om du vill se hur man gör.', 'vx'); }
    rita();
  }
  function flyttTips(d) {
    if (d.op === 'exp') return d.tips;
    if (d.op === '+' || d.op === '-') return 'Flytta ' + (d.op === '-' ? '+' : MI) + (d.x ? (d.n === 1 ? '' : d.n) + 'x' : d.n) + ' till andra sidan. Tryck på den termen.';
    if (d.op === '/') return 'Flytta talet ' + d.n + ' som multipliceras med x. Tryck på det.';
    return 'Flytta talet ' + d.n + ' under bråkstrecket. Tryck på det.';
  }
  function flyttFel(m, g) {
    var X = harX(T.L) && !harX(T.R) ? T.L : (harX(T.R) && !harX(T.L) ? T.R : null);
    if (m.x && T.L.a && T.R.a) return 'Flytta den minsta variabeltermen, så blir det inte ett negativt antal x.';
    if (m.x && X) return 'Variabeltermen ska stå kvar. Flytta en sifferterm eller talet framför x.';
    if (!m.x && (m.op === '+' || m.op === '-') && X && X !== (T.flyttFran === 'L' ? T.L : T.R)) return 'Den siffertermen står redan ensam. Flytta termen som står tillsammans med x.';
    if (X && X.b && (m.op === '/' || m.op === '*')) return 'Flytta först siffertermen ' + tal(X.b) + ' som står tillsammans med x.';
    return 'Den termen hjälper inte nu. Tryck på Tips om du vill ha hjälp.';
  }
  function tips() {
    var g = drag(T.L, T.R).filter(function (d) { return !d.sek; });
    T.fel++;
    meddela('Tips: ' + (g[0] ? (flytta() ? flyttTips(g[0]) : g[0].tips) : 'Försök få x ensamt på ena sidan.'), 'vx');
    rita();
  }
  function nasta() {
    runda.res.push(T.fel === 0);
    runda.nr++;
    if (runda.nr >= ANTAL) return slut();
    nyUppgift();
  }
  function slut() {
    var hela = runda.res.filter(Boolean).length, stj = hela === ANTAL ? 3 : hela >= ANTAL - 2 ? 2 : 1;
    var h = chip() + '<div class="up-kort up-slut"><h2>Bra jobbat!</h2><p>Du har gjort ' + ANTAL + ' uppgifter. <b>' + hela + '</b> av dem blev rätt direkt, utan fel eller tips.</p><div class="up-stj">';
    for (var i = 0; i < 3; i++) h += i < stj ? '★' : '<i>★</i>';
    h += '</div><div class="up-knappar"><button class="up-angra" id="aByt2">Byt övning</button><button class="up-nasta" id="aIgen">Fem nya uppgifter</button></div></div>';
    R.innerHTML = h; T = null;
    document.getElementById('aByt').onclick = startvy;
    document.getElementById('aByt2').onclick = startvy;
    document.getElementById('aIgen').onclick = startaRunda;
  }

  /* ---------- tangentbord (Chromebook) ---------- */
  document.addEventListener('keydown', function (e) {
    if (!T || e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    if (T.steg === 'klar' && k === 'Enter') { e.preventDefault(); return nasta(); }
    if (/^[٠-٩۰-۹]$/.test(k)) k = norm(k);
    if (k === 'Tab' && T.rutor && T.rutor.length > 1) {
      e.preventDefault();
      var n = T.rutor.length, i = T.akt;
      do { i = (i + (e.shiftKey ? n - 1 : 1)) % n; } while (T.rutor[i].ok && i !== T.akt);
      T.akt = i; return rita();
    }
    var map = { 'Enter': 'OK', 'Backspace': '⌫', 'X': 'x', '−': '-', '÷': '/', ':': '/', '·': '*' };
    if (map[k]) k = map[k];
    if (/^[0-9x+\-*/]$/.test(k) || k === 'OK' || k === '⌫') { e.preventDefault(); tangent(k); }
  });

  window.__alg = { V: V, flytta: flytta, genForenkla: genForenkla, genEkvation: genEkvation, drag: drag, tillamp: tillamp, loses: loses, varde: varde, T: function () { return T; } };
  startvy();
})();
