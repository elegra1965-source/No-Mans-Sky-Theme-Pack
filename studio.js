/* NMS Theme Pack — "Make it yours" studio (2026-10-10)
   1. Portal wallpaper: your Traveller name, home galaxy, home planet name and portal address
      (glyphs + hex) and, optionally, your NMS friend code; each line can be switched on or off,
      drawn onto a No Man's Sky wallpaper, for phone or desktop.
   2. Planet of the day: today's worlds from the Weather Station's daily survey
      (real player-charted planets from Voyager's Haven) as a wallpaper.
   3. Expedition countdown: live time left in the current expedition, plus a home-screen widget page.
   Everything is drawn in the browser; nothing is uploaded. */
(function () {
  'use strict';
  var HEX = '0123456789ABCDEF';
  var GN = ['Sunset', 'Bird', 'Face', 'Diplo', 'Eclipse', 'Balloon', 'Boat', 'Bug', 'Dragonfly', 'Galaxy', 'Voxel', 'Fish', 'Tent', 'Rocket', 'Tree', 'Atlas'];
  var B = 'assets/studio/';
  var WX = window.NMS_WX_BASE || 'https://weather.nomansskyhub.app';
  var BGS = [['13', 'The Atlas'], ['10', 'Moonrise'], ['07', 'Atlas II'], ['12', 'Shoreline'], ['03', 'Traveller'], ['11', 'Diplo Plains'], ['08', 'Walker'], ['04', 'Landing'], ['05', 'Rock Arch'], ['14', 'Arch Valley'], ['02', 'Origins'], ['06', 'Beyond'], ['09', 'Hangar'], ['01', 'Interface'], ['stars', 'Deep Space']];
  var SIZES = { phone: [1080, 2400], desk: [2560, 1440] };
  var LSK = 'nms_studio';
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function traveller() { try { var m = document.cookie.match(/(?:^|; )nmsTraveller=([^;]*)/); return m ? JSON.parse(decodeURIComponent(m[1])) : {}; } catch (e) { return {}; } }
  function saved() { try { return JSON.parse(localStorage.getItem(LSK) || '{}') || {}; } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(LSK, JSON.stringify(o)); } catch (e) {} }

  /* ---------- drawing helpers ---------- */
  var imgCache = {};
  function img(src, cors) {
    if (imgCache[src]) return imgCache[src];
    imgCache[src] = new Promise(function (res, rej) {
      var im = new Image(); if (cors) im.crossOrigin = 'anonymous';
      im.onload = function () { res(im); }; im.onerror = function () { delete imgCache[src]; rej(new Error('img ' + src)); };
      im.src = src;
    });
    return imgCache[src];
  }
  var fontsP = null;
  function fonts() {
    if (fontsP) return fontsP;
    var jobs = [];
    try {
      var ff = new FontFace('NMSAlphaStudio', 'url(assets/nms-alphabet.ttf)');
      jobs.push(ff.load().then(function (f) { document.fonts.add(f); }));
    } catch (e) {}
    if (document.fonts && document.fonts.load) jobs.push(document.fonts.load('700 40px Orbitron'), document.fonts.load('900 40px Orbitron'), document.fonts.load('600 40px Rajdhani'));
    fontsP = Promise.all(jobs.map(function (p) { return p.catch(function () {}); }));
    return fontsP;
  }
  var glyphP = null;
  function glyphs() {
    if (!glyphP) glyphP = Promise.all(HEX.split('').map(function (c) { return img(B + 'glyphs/g-' + c + '.png'); }));
    return glyphP;
  }
  function tinted(im, color, size) {
    var c = document.createElement('canvas'); c.width = c.height = size;
    var x = c.getContext('2d'); x.drawImage(im, 0, 0, size, size);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, size, size);
    return c;
  }
  function cover(x, im, W, H, fy) {
    var s = Math.max(W / im.width, H / im.height), w = im.width * s, h = im.height * s;
    x.drawImage(im, (W - w) / 2, (H - h) * (fy == null ? 0.5 : fy), w, h);
  }
  // letter-spaced text (canvas letterSpacing isn't everywhere yet)
  function spaced(x, text, cx, y, sp, align) {
    var chars = String(text).split(''), w = 0;
    chars.forEach(function (ch) { w += x.measureText(ch).width + sp; }); w -= sp;
    var px = align === 'left' ? cx : align === 'right' ? cx - w : cx - w / 2;
    var a = x.textAlign; x.textAlign = 'left';
    chars.forEach(function (ch) { x.fillText(ch, px, y); px += x.measureText(ch).width + sp; });
    x.textAlign = a; return w;
  }
  function fit(x, text, font, max, start, min) {
    var s = start; do { x.font = font.replace('{s}', s); if (x.measureText(text).width <= max) break; s -= 2; } while (s > min);
    return s;
  }
  function corners(x, X, Y, W, H, len, col, lw) {
    x.strokeStyle = col; x.lineWidth = lw; x.beginPath();
    x.moveTo(X, Y + len); x.lineTo(X, Y); x.lineTo(X + len, Y);
    x.moveTo(X + W - len, Y); x.lineTo(X + W, Y); x.lineTo(X + W, Y + len);
    x.moveTo(X + W, Y + H - len); x.lineTo(X + W, Y + H); x.lineTo(X + W - len, Y + H);
    x.moveTo(X + len, Y + H); x.lineTo(X, Y + H); x.lineTo(X, Y + H - len);
    x.stroke();
  }
  function stars(x, W, H, seed) {
    var r = seed || 7; function rnd() { r = (r * 16807) % 2147483647; return r / 2147483647; }
    var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#04070d'); g.addColorStop(1, '#0a1220'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    [['rgba(0,229,255,.22)', .7, .22], ['rgba(240,165,0,.16)', .2, .62], ['rgba(140,80,255,.14)', .8, .78]].forEach(function (n) {
      var rg = x.createRadialGradient(W * n[1], H * n[2], 0, W * n[1], H * n[2], Math.max(W, H) * .55);
      rg.addColorStop(0, n[0]); rg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = rg; x.fillRect(0, 0, W, H);
    });
    for (var i = 0; i < W * H / 2600; i++) {
      var s = rnd(); x.globalAlpha = .25 + rnd() * .75; x.fillStyle = s > .97 ? '#ffd9a0' : s > .94 ? '#a8f3ff' : '#e8f2ff';
      x.beginPath(); x.arc(rnd() * W, rnd() * H, s > .985 ? 2.4 : rnd() * 1.4 + .3, 0, 6.283); x.fill();
    }
    x.globalAlpha = 1;
  }
  function glyphRow(x, G, hex, cx, y, rowW) {
    var slot = rowW / 12, gs = slot * 0.8, X0 = cx - rowW / 2;
    x.fillStyle = 'rgba(4,10,18,.55)'; x.fillRect(X0 - slot * .25, y - slot * .2, rowW + slot * .5, slot * 1.2);
    corners(x, X0 - slot * .25, y - slot * .2, rowW + slot * .5, slot * 1.2, slot * .35, 'rgba(0,229,255,.9)', Math.max(2, slot * .04));
    hex.split('').forEach(function (c, i) {
      var k = HEX.indexOf(c), col = i === 0 ? '#ffc23d' : '#bdf6ff';
      var t = tinted(G[k], col, Math.round(gs));
      x.save(); x.shadowColor = i === 0 ? 'rgba(240,165,0,.95)' : 'rgba(0,229,255,.95)'; x.shadowBlur = gs * .28;
      x.drawImage(t, X0 + i * slot + (slot - gs) / 2, y); x.restore();
    });
    return y + slot;
  }
  function nmsName(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9 .:]/g, '').trim();
  }
  function stamp() { return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(); }

  /* ---------- 1. portal wallpaper ----------
     2026-10-13: every line can be switched on/off (o.show), English name on top with the
     alien-font name under it, a HOME PLANET line naming what the address points to, the hex
     then the glyphs, and the NMS friend code at the bottom. The block is laid out once dry to measure it, then drawn
     bottom-anchored so turning lines off never leaves gaps. */
  var SHOW_DEF = { name: true, alien: true, gal: true, planet: true, glyphs: true, hex: true, code: false };
  function drawPortal(cv, o) {
    var W = SIZES[o.fmt][0], H = SIZES[o.fmt][1], desk = o.fmt === 'desk';
    var sh = o.show || SHOW_DEF;
    cv.width = W; cv.height = H; var x = cv.getContext('2d');
    return Promise.all([fonts(), glyphs(), o.bg === 'stars' ? null : img(B + 'bg-' + o.bg + '-' + (desk ? 'desk' : 'phone') + '.jpg')]).then(function (r) {
      var G = r[1], bg = r[2];
      if (bg) cover(x, bg, W, H, desk ? .5 : .4); else stars(x, W, H, (o.name || 'T').length * 997 + 11);
      var s = desk ? H / 1440 * 1.5 : W / 1080;
      var fade = x.createLinearGradient(0, H * (desk ? .42 : .48), 0, H);
      fade.addColorStop(0, 'rgba(3,7,12,0)'); fade.addColorStop(.45, 'rgba(3,7,12,.78)'); fade.addColorStop(1, 'rgba(3,7,12,.95)');
      x.fillStyle = fade; x.fillRect(0, 0, W, H);
      var cx = W / 2, maxW = Math.min(W - 120 * s, desk ? 1250 * s : W - 120 * s);
      var name = nmsName(o.name) || 'TRAVELLER', hasAddr = /^[0-9A-F]{12}$/.test(o.hex || '');
      var code = String(o.code || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
      var pl = nmsName(o.planet), plKind = o.planetKind === 'system' ? 'HOME SYSTEM' : 'HOME PLANET';
      x.textBaseline = 'alphabetic'; x.textAlign = 'center';
      function lay(go, y) {
        var first = true;
        function gap(v) { if (!first) y += v; first = false; }
        if (sh.name || sh.alien) {
          x.font = '600 ' + Math.round(28 * s) + 'px Orbitron'; x.fillStyle = 'rgba(0,229,255,.9)';
          if (go) spaced(x, 'TRAVELLER', cx, y, 9 * s); first = false;
        }
        if (sh.name) {
          var es = fit(x, name, '900 {s}px Orbitron', maxW, Math.round(64 * s), Math.round(30 * s));
          y += es * 1.3;
          if (go) { x.fillStyle = '#ffffff'; x.save(); x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 12 * s; spaced(x, name, cx, y, 4 * s); x.restore(); }
        }
        if (sh.alien) {
          var ns = fit(x, name, '{s}px NMSAlphaStudio', maxW, Math.round(112 * s), Math.round(50 * s));
          y += ns * (sh.name ? 1.12 : 1.05);
          if (go) { x.save(); x.shadowColor = 'rgba(0,229,255,.85)'; x.shadowBlur = 26 * s; x.fillStyle = '#eaf6ff'; x.fillText(name, cx, y); x.restore(); }
        }
        if (sh.gal) {
          gap(62 * s); x.font = '600 ' + Math.round(30 * s) + 'px Orbitron';
          if (go) { x.fillStyle = '#f0a500'; spaced(x, 'HOME · ' + (o.galaxyName || 'Euclid').toUpperCase() + ' GALAXY', cx, y, 5 * s); }
        }
        var addrOn = hasAddr && (sh.glyphs || sh.hex);
        if (sh.planet && (pl || addrOn)) {
          gap(60 * s);
          var lab = plKind + (pl ? ' · ' : (addrOn ? ' · PORTAL ADDRESS' : ''));
          x.font = '600 ' + Math.round(26 * s) + 'px Orbitron';
          var lw = 0; lab.split('').forEach(function (ch) { lw += x.measureText(ch).width + 6 * s; });
          var pf = pl ? fit(x, pl, '700 {s}px Orbitron', Math.max(200 * s, maxW - lw), Math.round(34 * s), Math.round(20 * s)) : 0;
          if (go) {
            var pw = 0; if (pl) { x.font = '700 ' + pf + 'px Orbitron'; pl.split('').forEach(function (ch) { pw += x.measureText(ch).width + 4 * s; }); }
            var X0 = cx - (lw + pw) / 2;
            x.font = '600 ' + Math.round(26 * s) + 'px Orbitron'; x.fillStyle = 'rgba(0,229,255,.95)'; spaced(x, lab, X0, y, 6 * s, 'left');
            if (pl) { x.font = '700 ' + pf + 'px Orbitron'; x.fillStyle = '#ffffff'; spaced(x, pl, X0 + lw, y, 4 * s, 'left'); }
          }
        }
        if (hasAddr && sh.hex) {
          gap(76 * s); x.font = '700 ' + Math.round(50 * s) + 'px Orbitron';
          if (go) { x.fillStyle = '#ffc23d'; x.save(); x.shadowColor = 'rgba(240,165,0,.6)'; x.shadowBlur = 16 * s; spaced(x, o.hex, cx, y, 13 * s); x.restore(); }
        }
        if (hasAddr && sh.glyphs) {
          gap(sh.hex ? 34 * s : 40 * s);
          var rowW = Math.min(maxW, (desk ? 760 : 960) * s);
          if (go) y = glyphRow(x, G, o.hex, cx, y, rowW); else y += rowW / 12;
        }
        if (sh.code && code) {
          gap(80 * s); x.font = '700 ' + Math.round(30 * s) + 'px Orbitron';
          var cl = 'FRIEND CODE · ' + code;
          if (go) {
            var cw = 0; cl.split('').forEach(function (ch) { cw += x.measureText(ch).width + 5 * s; });
            x.strokeStyle = 'rgba(0,229,255,.35)'; x.lineWidth = Math.max(1, 2 * s); x.beginPath();
            x.moveTo(cx - cw / 2, y - 52 * s); x.lineTo(cx + cw / 2, y - 52 * s); x.stroke();
            x.fillStyle = '#7fefff'; spaced(x, cl, cx, y, 5 * s);
          }
        }
        return y;
      }
      var bottom = H - (desk ? 150 : 240) * s;
      var top0 = 28 * s, end = lay(false, top0);
      lay(true, top0 + (bottom - end));
      x.font = '600 ' + Math.round(20 * s) + 'px Orbitron'; x.fillStyle = 'rgba(207,224,240,.55)';
      spaced(x, 'THEME.NOMANSSKYHUB.APP', cx, H - (desk ? 44 : 70) * s, 4 * s);
    });
  }

  /* home planet name from the address: Galactic Map community edits first, then
     Voyager's Haven (via the map's haven-lookup), else nothing (the user can type one). */
  var MAP = window.NMS_MAP_BASE || 'https://map.nomansskyhub.app';
  var mapP = null;
  function mapEdits() {
    if (!mapP) mapP = fetch(MAP + '/.netlify/functions/system-edit').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
    mapP.catch(function () { mapP = null; });
    return mapP;
  }
  function lookupPlanet(hex, g, gname) {
    var P = Math.max(1, parseInt(hex[0], 16) || 1);
    function pick(bodies, sysName, src) {
      var b = (bodies || [])[P - 1];
      if (b && b.name) return { name: b.name, kind: 'planet', src: src };
      if (sysName) return { name: sysName, kind: 'system', src: src };
      return null;
    }
    return mapEdits().then(function (d) {
      var rec = d && d.systems && d.systems[g + ':1' + hex.slice(1)];
      return rec && rec.data ? pick(rec.data.bodies, rec.data.name, 'Galactic Map') : null;
    }).catch(function () { return null; }).then(function (hit) {
      if (hit) return hit;
      return fetch(MAP + '/.netlify/functions/haven-lookup?addr=' + hex + '&gname=' + encodeURIComponent(gname)).then(function (r) { return r.json(); }).then(function (d) {
        var sy = d && d.found && d.system; if (!sy) return null;
        return pick((sy.planets || []).map(function (p) { return { name: p.name }; }), sy.name, 'Voyager’s Haven');
      }).catch(function () { return null; });
    });
  }

  /* ---------- 2. planet of the day (same worlds as the Weather Station's daily survey) ---------- */
  var ORDER = ['Lush', 'Frozen', 'Toxic', 'Scorched', 'Radioactive', 'Volcanic', 'Dead', 'Marsh'];
  var STAR = { Yellow: '#f0c040', Red: '#ff5a4a', Green: '#4cff9a', Blue: '#5ab8ff', Purple: '#c77dff' };
  var havenP = null;
  function haven() {
    if (!havenP) havenP = fetch(WX + '/data/haven-worlds.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
    havenP.catch(function () { havenP = null; });
    return havenP;
  }
  // exactly the Weather Station's buildSurvey(): same day number, same picks
  function survey(H) {
    var day = Math.floor(Date.now() / 86400000), used = {};
    return ORDER.map(function (b, k) {
      var pool = H.P[b] || []; if (!pool.length) return null;
      var start = (day + k * 5) % pool.length, p = pool[start];
      for (var t = 0; t < pool.length; t++) { var c = pool[(start + t) % pool.length]; if (!used[c[0]]) { p = c; break; } }
      used[p[0]] = 1; var s = H.sys[p[0]];
      return { biome: b, name: p[1], raw: p[2], weather: p[3], by: p[7], extreme: !!p[8], sys: s[0], galaxy: s[1], glyph: s[2], race: s[3], star: s[4], key: b.toLowerCase() };
    }).filter(Boolean);
  }
  function drawPlanet(cv, w, fmt, who) {
    var W = SIZES[fmt][0], H = SIZES[fmt][1], desk = fmt === 'desk';
    cv.width = W; cv.height = H; var x = cv.getContext('2d');
    return Promise.all([fonts(), glyphs(), img(WX + '/hd/hd-' + w.key + '.jpg', true)]).then(function (r) {
      var G = r[1], im = r[2], s = desk ? H / 1440 * 1.1 : W / 1080, cx = W / 2;
      x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      if (desk) {
        cover(x, im, W, H);
        var g = x.createLinearGradient(0, H * .3, 0, H); g.addColorStop(0, 'rgba(3,7,12,0)'); g.addColorStop(.45, 'rgba(3,7,12,.7)'); g.addColorStop(1, 'rgba(3,7,12,.95)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      } else {
        x.filter = 'blur(' + Math.round(26 * s) + 'px) brightness(.55)'; cover(x, im, W, H); x.filter = 'none';
        var pw = W - 80 * s, ph = pw * 9 / 16, py = H * .4;
        x.save(); x.shadowColor = 'rgba(0,229,255,.35)'; x.shadowBlur = 40 * s; x.drawImage(im, (W - pw) / 2, py, pw, ph); x.restore();
        corners(x, (W - pw) / 2 - 8 * s, py - 8 * s, pw + 16 * s, ph + 16 * s, 46 * s, '#00e5ff', 4 * s);
        var gt = x.createLinearGradient(0, H * .62, 0, H); gt.addColorStop(0, 'rgba(3,7,12,0)'); gt.addColorStop(.3, 'rgba(3,7,12,.75)'); gt.addColorStop(1, 'rgba(3,7,12,.92)'); x.fillStyle = gt; x.fillRect(0, 0, W, H);
        x.font = '600 ' + Math.round(26 * s) + 'px Orbitron'; x.fillStyle = 'rgba(0,229,255,.95)';
        spaced(x, 'PLANET OF THE DAY · ' + stamp(), cx, py - 40 * s, 6 * s);
      }
      var y = desk ? H - 700 * s : H * .4 + (W - 80 * s) * 9 / 16 + 120 * s;
      if (desk) { x.font = '600 ' + Math.round(24 * s) + 'px Orbitron'; x.fillStyle = 'rgba(0,229,255,.95)'; spaced(x, 'PLANET OF THE DAY · ' + stamp(), cx, y, 6 * s); y += 84 * s; }
      var ns = fit(x, w.name.toUpperCase(), '900 {s}px Orbitron', W - 120 * s, Math.round(78 * s), Math.round(40 * s));
      x.save(); x.shadowColor = 'rgba(0,229,255,.6)'; x.shadowBlur = 20 * s; x.fillStyle = '#eaf6ff'; spaced(x, w.name.toUpperCase(), cx, y, 3 * s); x.restore();
      y += 56 * s; x.font = '600 ' + Math.round(34 * s) + 'px Rajdhani'; x.fillStyle = 'rgba(207,224,240,.85)';
      x.fillText(w.sys + ' system · ' + w.star + ' star · ' + w.galaxy, cx, y);
      y += 52 * s; x.font = '700 ' + Math.round(26 * s) + 'px Orbitron'; x.fillStyle = '#f0a500';
      spaced(x, (w.raw && w.raw !== w.biome ? w.biome + ' · ' + w.raw : w.biome).toUpperCase() + (w.extreme ? '  ⚠ EXTREME' : ''), cx, y, 4 * s);
      y += 46 * s; x.font = '500 ' + Math.round(30 * s) + 'px Rajdhani'; x.fillStyle = 'rgba(207,224,240,.75)'; x.fillText(w.weather, cx, y);
      y += 40 * s;
      y = glyphRow(x, G, w.glyph, cx, y, Math.min(W - 120 * s, 900 * s));
      y += 64 * s; x.font = '700 ' + Math.round(44 * s) + 'px Orbitron'; x.fillStyle = '#ffc23d'; spaced(x, w.glyph, cx, y, 11 * s);
      y += 54 * s; x.font = '500 ' + Math.round(24 * s) + 'px Rajdhani'; x.fillStyle = 'rgba(207,224,240,.6)';
      x.fillText('Charted by ' + w.by + ' · Voyager’s Haven' + (who ? ' · saved by ' + who : ''), cx, y);
      x.font = '600 ' + Math.round(19 * s) + 'px Orbitron'; x.fillStyle = 'rgba(207,224,240,.5)';
      spaced(x, 'WEATHER.NOMANSSKYHUB.APP · THEME.NOMANSSKYHUB.APP', cx, H - (desk ? 30 : 66) * s, 3 * s);
    });
  }

  /* ---------- export ---------- */
  function exportPng(cv, name, note) {
    note('Preparing your wallpaper…');
    cv.toBlob(function (blob) {
      if (!blob) return note('Couldn’t make the picture on this device.');
      var file = null; try { file = new File([blob], name, { type: 'image/png' }); } catch (e) {}
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      note('Saved ' + name + '. Set it from your Photos / Gallery: Use as → Wallpaper.');
      return file;
    }, 'image/png');
  }
  function sharePng(cv, name, text, note) {
    cv.toBlob(function (blob) {
      var file = null; try { file = new File([blob], name, { type: 'image/png' }); } catch (e) {}
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], text: text }).catch(function () {});
      } else exportPng(cv, name, note);
    }, 'image/png');
  }

  /* ---------- UI ---------- */
  function build() {
    var host = document.getElementById('studio'); if (!host) return;
    var t = traveller(), sv = saved();
    var st = {
      name: sv.name || t.n || '', hex: sv.hex || '', code: sv.code != null ? sv.code : (t.fc || ''), planet: sv.planet || '', pkind: sv.pkind || 'planet', pman: !!sv.pman, show: Object.assign({}, SHOW_DEF, sv.show || {}), g: sv.g != null ? sv.g : (t.g >= 0 ? t.g : 0),
      bg: sv.bg || '13', fmt: sv.fmt || (matchMedia('(min-width: 900px)').matches ? 'desk' : 'phone'), world: 0, pfmt: null
    };
    var GAL = ['Euclid'];
    var root = host.querySelector('.st-root');
    root.innerHTML =
      '<div class="st-tabs" role="tablist">' +
      '<button type="button" class="st-tab on" role="tab" aria-selected="true" data-t="portal"><span>◈ Traveller wallpaper</span><small>Your name and home portal glyphs, built into a wallpaper</small></button>' +
      '<button type="button" class="st-tab" role="tab" aria-selected="false" data-t="planet"><span>◉ Planet of the day</span><small>Wear one of today\'s real player-charted planets</small></button>' +
      '<button type="button" class="st-tab" role="tab" aria-selected="false" data-t="exp"><span>⧗ Expedition countdown</span><small>A live countdown to the end of the current expedition</small></button></div>' +
      // portal wallpaper
      '<div class="st-pane on" data-p="portal"><div class="st-grid">' +
      '<div class="st-form">' +
      '<label class="st-f"><span>Traveller name</span><input id="stName" maxlength="24" placeholder="Your in-game name" autocomplete="off"></label>' +
      '<label class="st-f"><span>Home galaxy</span><select id="stGal"></select></label>' +
      '<label class="st-f"><span>NMS friend code <em>optional · from your Traveller ID</em></span><input id="stCode" maxlength="16" placeholder="e.g. 1ABC-D2EF-3GH4J" autocomplete="off" spellcheck="false"></label>' +
      '<label class="st-f"><span>Home planet name <em id="stPlSrc">found from your address, or type your own</em></span><input id="stPlanet" maxlength="32" placeholder="Enter the full address to look it up" autocomplete="off"></label>' +
      '<details class="st-fold" id="stAddrF"><summary>Portal address <b id="stAddrS"></b></summary><div class="st-fold-b"><em class="st-hint">tap the glyph buttons below, or type the 12-digit hex in the box</em>' +
      '<div class="st-slots" id="stSlots"></div><label class="st-hexl" for="stHex">Hex address</label><input id="stHex" maxlength="12" placeholder="Type hex, e.g. 10A2F9557C30" autocomplete="off" spellcheck="false" inputmode="text">' +
      '<div class="st-pad" id="stPad"></div></div></details>' +
      '<details class="st-fold" id="stShowF"><summary>Show on wallpaper <b id="stShowS"></b></summary><div class="st-fold-b"><div class="st-show" id="stShow"></div></div></details>' +
      '</div>' +
      // 2026-10-14: preview column also holds the background strip and one row of size + download + share
      '<div class="st-side"><div class="st-prev"><canvas id="stCv" aria-label="Wallpaper preview"></canvas></div>' +
      '<div class="st-f st-bgf"><span>Background <em>swipe for more</em></span><div class="st-bgs" id="stBgs"></div></div>' +
      '<div class="st-row"><div class="st-seg" id="stFmt" role="group" aria-label="Size"><button type="button" data-f="phone">Phone</button><button type="button" data-f="desk">Desktop</button></div>' +
      '<div class="st-acts"><button type="button" class="btn btn-primary" id="stSave">⬇ Download wallpaper</button><button type="button" class="btn btn-ghost" id="stShare">Share</button></div></div>' +
      '<p class="st-note" id="stNote" aria-live="polite"></p></div></div></div>' +
      // planet of the day
      '<div class="st-pane" data-p="planet"><p class="st-lead">The Weather Station surveys 8 real, player-charted worlds every day. Pick one of today’s and wear it. Tomorrow there are 8 new ones.</p>' +
      '<div class="st-worlds" id="stWorlds"><p class="st-note">Loading today’s survey…</p></div><div class="st-grid">' +
      '<div class="st-form"><div class="st-f"><span>Size</span><div class="st-seg" id="stPFmt"><button type="button" data-f="phone">Phone</button><button type="button" data-f="desk">Desktop</button></div></div>' +
      '<div class="st-acts"><button type="button" class="btn btn-primary" id="stPSave">⬇ Download today’s planet</button><button type="button" class="btn btn-ghost" id="stPShare">Share</button>' +
      '<a class="btn btn-ghost" id="stPMap" target="_blank" rel="noopener">Fly there on the map →</a></div>' +
      '<p class="st-note" id="stPNote" aria-live="polite"></p></div>' +
      '<div class="st-prev"><canvas id="stPCv" aria-label="Planet of the day preview"></canvas></div></div></div>' +
      // expedition
      '<div class="st-pane" data-p="exp"><div class="st-exp" id="stExp"><div class="st-exp-k" id="stExpK">EXPEDITION</div><div class="st-exp-t" id="stExpT">Reading the Atlas…</div>' +
      '<div class="st-exp-c" id="stExpC">-- : -- : -- : --</div><div class="st-exp-bar"><span id="stExpBar"></span></div><div class="st-exp-s" id="stExpS"></div></div>' +
      '<div class="st-acts st-acts-c"><a class="btn btn-primary" href="countdown.html" target="_blank" rel="noopener">⧗ Open the countdown widget</a></div>' +
      '<p class="st-lead">Open it, then add it to your home screen: on Android, Chrome menu → <b>Add to Home screen</b>; on iPhone, Share → <b>Add to Home Screen</b>. It opens full-screen like an app and keeps counting down to the end of the expedition, then to the next one. Dates come from the No Man’s Sky Wiki.</p></div>';

    /* portal wallpaper */
    var cv = $('stCv'), slots = $('stSlots'), hexIn = $('stHex'), gal = $('stGal'), pad = $('stPad'), note = function (s) { $('stNote').textContent = s; };
    $('stName').value = st.name; hexIn.value = st.hex; $('stCode').value = st.code; $('stPlanet').value = st.planet;
    var SHOWS = [['name', 'Name'], ['alien', 'NMS-font name'], ['gal', 'Home galaxy'], ['planet', 'Planet name'], ['glyphs', 'Glyphs'], ['hex', 'Hex address'], ['code', 'Friend code']];
    $('stShow').innerHTML = SHOWS.map(function (k) { return '<label><input type="checkbox" data-s="' + k[0] + '"' + (st.show[k[0]] ? ' checked' : '') + '><span>' + k[1] + '</span></label>'; }).join('');
    $('stShow').addEventListener('change', function (e) { var c = e.target; if (c.dataset.s) { st.show[c.dataset.s] = c.checked; redraw(); } });
    $('stCode').addEventListener('input', function () { var v = $('stCode').value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 16); if (v !== $('stCode').value) $('stCode').value = v; if (v && !st.show.code) { st.show.code = true; var cb = $('stShow').querySelector('[data-s="code"]'); if (cb) cb.checked = true; } redraw(); });
    $('stPlanet').addEventListener('input', function () { st.pman = !!$('stPlanet').value.trim(); st.pkind = 'planet'; $('stPlSrc').textContent = st.pman ? 'your own name' : 'found from your address, or type your own'; if (!st.pman) { lastLook = ''; } redraw(); });
    var lastLook = '';
    function look() {
      if (st.pman || st.hex.length !== 12) return;
      var k = st.g + ':' + st.hex; if (k === lastLook) return; lastLook = k;
      $('stPlSrc').textContent = 'looking it up…';
      lookupPlanet(st.hex, st.g, GAL[st.g] || 'Euclid').then(function (hit) {
        if (lastLook !== k || st.pman) return;
        st.planet = hit ? hit.name : ''; st.pkind = hit ? hit.kind : 'planet'; $('stPlanet').value = st.planet;
        $('stPlSrc').textContent = hit ? (hit.kind === 'system' ? 'system name' : 'planet name') + ' from ' + hit.src : 'not charted yet, type your own';
        redraw();
      });
    }
    pad.innerHTML = HEX.split('').map(function (c, k) { return '<button type="button" data-k="' + k + '" title="' + GN[k] + ' (' + c + ')"><img src="' + B + 'glyphs/g-' + c + '.png" alt="' + GN[k] + '"><i>' + c + '</i></button>'; }).join('') +
      '<button type="button" data-k="back" title="Backspace">⌫</button>';
    function bgTile(b, dup) {
      return '<button type="button" data-b="' + b[0] + '" title="' + b[1] + '"' + (dup ? ' aria-hidden="true" tabindex="-1"' : '') + (b[0] === 'stars' ? ' class="st-stars"' : ' style="background-image:url(' + B + 'bg-' + b[0] + '-thumb.jpg)"') + '><span>' + b[1] + '</span></button>';
    }
    var autoBg = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    // the row drifts in a loop (a second copy of the tiles makes it seamless); hovering with a
    // mouse, touching, scrolling or picking a tile pauses it, and it drifts on again after a few idle seconds
    $('stBgs').innerHTML = BGS.map(function (b) { return bgTile(b); }).join('') + (autoBg ? BGS.map(function (b) { return bgTile(b, 1); }).join('') : '');
    var pend = 0;
    function redraw() {
      st.name = $('stName').value; st.hex = hexIn.value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 12); st.g = +gal.value || 0;
      st.code = $('stCode').value; if (st.pman) st.planet = $('stPlanet').value.trim();
      save({ name: st.name, hex: st.hex, g: st.g, bg: st.bg, fmt: st.fmt, code: st.code, planet: st.planet, pkind: st.pkind, pman: st.pman, show: st.show });
      look();
      slots.innerHTML = Array.apply(null, Array(12)).map(function (_, i) { var c = st.hex[i]; return '<span class="' + (c ? '' : 'e') + (i === 0 && c ? ' first' : '') + '">' + (c ? '<img src="' + B + 'glyphs/g-' + c + '.png" alt="' + GN[HEX.indexOf(c)] + '">' : i + 1) + '</span>'; }).join('');
      $('stAddrS').textContent = st.hex.length === 12 ? '· ' + st.hex : st.hex.length ? '· ' + st.hex.length + ' of 12' : '· not set';
      var on = SHOWS.filter(function (k) { return st.show[k[0]]; }).length; $('stShowS').textContent = '· ' + on + ' of ' + SHOWS.length;
      if (st.hex.length === 12 && !redraw.full && redraw.typed) $('stAddrF').open = false;
      redraw.full = st.hex.length === 12; redraw.typed = false;
      $('stBgs').querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.b === st.bg); });
      $('stFmt').querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.f === st.fmt); });
      cv.parentNode.classList.toggle('desk', st.fmt === 'desk');
      var my = ++pend;
      clearTimeout(redraw.t); redraw.t = setTimeout(function () {
        drawPortal(cv, { name: st.name, hex: st.hex.length === 12 ? st.hex : '', galaxyName: GAL[st.g] || 'Euclid', bg: st.bg, fmt: st.fmt, code: st.code, planet: st.hex.length === 12 || st.pman ? st.planet : '', planetKind: st.pkind, show: st.show }).then(function () {
          if (my === pend) note(st.hex.length && st.hex.length < 12 ? (12 - st.hex.length) + ' more glyph' + (12 - st.hex.length > 1 ? 's' : '') + ' to add the portal address.' : '');
        }).catch(function () { note('Couldn’t load the background. Check your connection.'); });
      }, 60);
    }
    $('stName').addEventListener('input', redraw); gal.addEventListener('change', redraw);
    hexIn.addEventListener('input', function () { var p = hexIn.selectionStart; hexIn.value = hexIn.value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 12); try { hexIn.setSelectionRange(p, p); } catch (e) {} redraw.typed = true; redraw(); });
    pad.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var v = hexIn.value;
      if (b.dataset.k === 'back') v = v.slice(0, -1); else if (v.length < 12) v += HEX[+b.dataset.k];
      hexIn.value = v; redraw.typed = true; redraw();
    });
    if (st.hex.length < 12) $('stAddrF').open = true;
    var row = $('stBgs');
    function showPick() { var ob = row.querySelector('button.on'); if (ob) row.scrollLeft += ob.getBoundingClientRect().left - row.getBoundingClientRect().left - 8; }
    // touching, scrolling or picking pauses the drift; it starts again after IDLE ms of no interaction
    var IDLE = 6000, pausedUntil = 0;
    function pauseBg() { if (!autoBg) return; pausedUntil = Date.now() + IDLE; row.classList.remove('st-auto'); }
    if (autoBg) {
      var pos = 0, hover = false, last = 0, seen = true, running = true;
      row.classList.add('st-auto');
      row.addEventListener('mouseenter', function () { hover = true; });
      row.addEventListener('mouseleave', function () { hover = false; pausedUntil = Math.max(pausedUntil, Date.now() + 1500); });
      ['touchstart', 'touchmove', 'wheel', 'keydown', 'pointerdown'].forEach(function (ev) { row.addEventListener(ev, pauseBg, { passive: true }); });
      if (window.IntersectionObserver) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }).observe(row);
      (function tick(t) {
        var dt = last ? Math.min(64, t - last) : 16; last = t;
        var go = !hover && seen && row.offsetParent && Date.now() >= pausedUntil;
        if (go) {
          var half = row.scrollWidth / 2;
          if (!running) { running = true; pos = row.scrollLeft; row.classList.add('st-auto'); }
          pos += dt * 0.035; if (half > 0) { while (pos >= half) pos -= half; }
          row.scrollLeft = pos;
        } else running = false;
        requestAnimationFrame(tick);
      })(0);
    } else setTimeout(showPick, 120);
    row.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { st.bg = b.dataset.b; pauseBg(); redraw(); } });
    $('stFmt').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { st.fmt = b.dataset.f; redraw(); } });
    function fname(base) { return base + '-' + (nmsName(st.name).replace(/[^A-Z0-9]+/g, '-').toLowerCase() || 'traveller') + '-' + st.fmt + '.png'; }
    $('stSave').addEventListener('click', function () { exportPng(cv, fname('nms-portal-wallpaper'), note); });
    $('stShare').addEventListener('click', function () { sharePng(cv, fname('nms-portal-wallpaper'), 'My No Man\'s Sky home, made at theme.nomansskyhub.app', note); });
    fetch(B + 'galaxies.json').then(function (r) { return r.json(); }).then(function (list) {
      GAL = list; gal.innerHTML = list.map(function (n, i) { return '<option value="' + i + '">' + (i + 1) + ' · ' + esc(n) + '</option>'; }).join(''); gal.value = st.g; redraw();
    }).catch(function () { gal.innerHTML = '<option value="0">1 · Euclid</option>'; redraw(); });

    /* planet of the day */
    var pcv = $('stPCv'), worlds = [], pnote = function (s) { $('stPNote').textContent = s; };
    st.pfmt = st.fmt;
    function pdraw() {
      $('stPFmt').querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.f === st.pfmt); });
      pcv.parentNode.classList.toggle('desk', st.pfmt === 'desk');
      var w = worlds[st.world]; if (!w) return;
      $('stWorlds').querySelectorAll('button').forEach(function (b, i) { b.classList.toggle('on', i === st.world); });
      $('stPMap').href = 'https://map.nomansskyhub.app/?arrival=1&addr=' + w.glyph + '&galaxy=' + (w.gIndex || 0);
      drawPlanet(pcv, w, st.pfmt, nmsName(st.name) ? st.name : '').then(function () { pnote(''); }).catch(function () { pnote('Couldn’t load the planet picture. Check your connection.'); });
    }
    var plOpen = false;
    function loadPlanets() {
      if (plOpen) return; plOpen = true;
      haven().then(function (H) {
        worlds = survey(H).map(function (w) { w.gIndex = (H.meta && H.meta.galaxies || {})[w.galaxy] || 0; return w; });
        st.world = Math.floor(Date.now() / 86400000) % worlds.length;
        $('stWorlds').innerHTML = worlds.map(function (w, i) {
          return '<button type="button" data-i="' + i + '" style="background-image:url(' + WX + '/hd/card-' + w.key + '.jpg)"><b>' + esc(w.name) + '</b><span>' + esc(w.biome) + '</span></button>';
        }).join('');
        pdraw();
      }).catch(function () { plOpen = false; $('stWorlds').innerHTML = '<p class="st-note">Couldn’t reach the Weather Station’s survey. Try again in a moment.</p>'; });
    }
    $('stWorlds').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { st.world = +b.dataset.i; pdraw(); } });
    $('stPFmt').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { st.pfmt = b.dataset.f; pdraw(); } });
    function pname() { var w = worlds[st.world] || { name: 'planet' }; return 'nms-planet-of-the-day-' + new Date().toISOString().slice(0, 10) + '-' + w.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + st.pfmt + '.png'; }
    $('stPSave').addEventListener('click', function () { if (worlds.length) exportPng(pcv, pname(), pnote); });
    $('stPShare').addEventListener('click', function () { if (worlds.length) sharePng(pcv, pname(), 'Today’s No Man\'s Sky planet of the day, from weather.nomansskyhub.app', pnote); });

    /* expedition */
    var EX = null, expOn = false;
    function pad2(n) { return (n < 10 ? '0' : '') + n; }
    function expTick() {
      if (!EX) return;
      var now = Date.now(), e = EX.live || EX.next;
      if (EX.live && now >= EX.live.end || !EX.live && EX.next && now >= EX.next.start) { EX = NMSExpedition.pick(EX.rows, now); expRender(); return; }
      if (!e) return;
      var l = NMSExpedition.left((EX.live ? e.end : e.start) - now);
      $('stExpC').innerHTML = '<b>' + l.d + '</b><i>d</i> <b>' + pad2(l.h) + '</b><i>h</i> <b>' + pad2(l.m) + '</b><i>m</i> <b>' + pad2(l.s) + '</b><i>s</i>';
      if (EX.live) $('stExpBar').style.width = Math.min(100, (now - e.start) / (e.end - e.start) * 100).toFixed(1) + '%';
    }
    function expRender() {
      var d = function (t) { return window.NMS_DATE ? NMS_DATE(new Date(t), { day: 'numeric', month: 'short' }) : new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); };
      if (EX.live) { $('stExpK').textContent = 'EXPEDITION ' + EX.live.num + (EX.live.redux ? ' · REDUX' : '') + ' · ENDS IN'; $('stExpT').textContent = EX.live.title; $('stExpS').textContent = d(EX.live.start) + ' – ' + d(EX.live.end) + (EX.next ? ' · next: ' + EX.next.title + ', ' + d(EX.next.start) : ''); }
      else if (EX.next) { $('stExpK').textContent = 'NEXT EXPEDITION ' + EX.next.num + ' · STARTS IN'; $('stExpT').textContent = EX.next.title; $('stExpS').textContent = 'Starts ' + d(EX.next.start); $('stExpBar').style.width = '0'; }
      else { $('stExpK').textContent = 'BETWEEN EXPEDITIONS'; $('stExpT').textContent = 'No expedition live'; $('stExpC').textContent = 'Check back soon'; $('stExpS').textContent = EX.last ? 'Last: ' + EX.last.title + ', ended ' + d(EX.last.end) : ''; }
      expTick();
    }
    document.addEventListener('nms-lang', function () { if (EX) expRender(); });
    function loadExp() {
      if (expOn) return; expOn = true;
      if (!window.NMSExpedition) return;
      NMSExpedition.load().then(function (r) { EX = r; expRender(); setInterval(expTick, 1000); })
        .catch(function () { expOn = false; $('stExpT').textContent = 'Couldn’t reach the NMS Wiki'; });
    }

    /* tabs */
    root.querySelector('.st-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.st-tab'); if (!b) return;
      root.querySelectorAll('.st-tab').forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); });
      root.querySelectorAll('.st-pane').forEach(function (p) { p.classList.toggle('on', p.dataset.p === b.dataset.t); });
      if (b.dataset.t === 'planet') loadPlanets();
      if (b.dataset.t === 'exp') loadExp();
      try { history.replaceState(null, '', '#studio-' + b.dataset.t); } catch (e) {}
    });
    var m = location.hash.match(/^#studio-(portal|planet|exp)$/);
    if (m) { var tb = root.querySelector('.st-tab[data-t="' + m[1] + '"]'); if (tb) { var acc = host.querySelector('details'); if (acc) acc.open = true; tb.click(); setTimeout(function () { host.scrollIntoView(); }, 300); } }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
  window.NMSStudio = { drawPortal: drawPortal, drawPlanet: drawPlanet, survey: survey };
})();
