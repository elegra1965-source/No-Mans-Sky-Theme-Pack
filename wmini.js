/* No Man's Sky Theme Pack: live widget previews, shared by the tiles on index.html and the widget pages (2026-11-08).
   Same look in a tile and in a widget (container-query units), same weather rules and daily survey as the Weather Station.
   Everything is read in the visitor's own browser; nothing is sent anywhere except the public weather / Haven / wiki feeds. */
(function () {
  'use strict';
  var SRC = (document.currentScript && document.currentScript.src) || '';
  var BASE = SRC.replace(/[^\/]*$/, '');
  var WX = window.NMS_WX_BASE || 'https://weather.nomansskyhub.app';
  var LSg = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var LSs = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var T = function (s, v) { return window.NMS_T ? NMS_T(s, v) : s; };
  var DN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'], MN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  function dateTxt(d) {
    if (window.NMS_LANG && window.NMS_DATE && NMS_LANG() !== 'en') { try { return NMS_DATE(d, { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase(); } catch (e) {} }
    return DN[d.getDay()] + ' ' + d.getDate() + ' ' + MN[d.getMonth()];
  }
  function glyph(c) { return BASE + 'assets/studio/glyphs/g-' + String(c).toUpperCase() + '.png'; }
  function glyphRow(h) { return String(h).split('').map(function (c) { return '<img src="' + glyph(c) + '" alt="" loading="lazy">'; }).join(''); }
  function calm() { return document.body.classList.contains('calm') || (window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches); }
  function all(root, s) { return [].slice.call((root || document).querySelectorAll(s)); }

  /* ---------- biome pictures (the Weather Station's own set) ---------- */
  var BIOME_IMG = function (k) { return WX + '/hd/card-' + k + '.jpg'; };
  var SCN_KEYS = ['lush', 'volcanic', 'frozen', 'toxic', 'marsh', 'scorched', 'radioactive', 'dead'];
  var scnKey = SCN_KEYS[Math.floor(Math.random() * SCN_KEYS.length)];

  /* ---------- weather (the visitor's saved location from Weather Scan; never asks on its own) ---------- */
  var wxP = null, wxAt = 0;
  function weather(force) {
    var loc = LSg('nms-w-loc'); if (!loc) return Promise.resolve(null);
    if (!force) {
      try { var c = JSON.parse(LSg('nms-w-wx') || 'null'); if (c && c.loc === loc && Date.now() - c.t < 30 * 60000) return Promise.resolve(c.w); } catch (e) {}
      if (wxP && Date.now() - wxAt < 20000) return wxP;
    }
    var s = loc.split(','), la = s[0], lo = s[1]; wxAt = Date.now();
    wxP = Promise.all([
      fetch('https://api.open-meteo.com/v1/forecast?latitude=' + la + '&longitude=' + lo +
        '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,surface_pressure,wind_speed_10m,wind_gusts_10m,dew_point_2m' +
        '&hourly=temperature_2m,precipitation_probability,uv_index&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=2')
        .then(function (r) { if (!r.ok) throw 0; return r.json(); }),
      fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + la + '&longitude=' + lo + '&current=european_aqi')
        .then(function (r) { return r.json(); }).then(function (d) { return d && d.current ? Math.round(d.current.european_aqi) : 0; }).catch(function () { return 0; })
    ]).then(function (a) {
      var d = a[0], c = d.current, H = d.hourly, D = d.daily, i = Math.max(0, H.time.indexOf(c.time.slice(0, 13) + ':00'));
      var hours = []; for (var k = 0; k < 6; k++) { var j = i + k * 2; if (H.temperature_2m[j] != null) hours.push({ h: +H.time[j].slice(11, 13), t: Math.round(H.temperature_2m[j]) }); }
      var w = { t: Math.round(c.temperature_2m), f: Math.round(c.apparent_temperature), code: c.weather_code, wd: Math.round(c.wind_speed_10m), gust: Math.round(c.wind_gusts_10m || 0),
        day: c.is_day ? 1 : 0, uv: Math.round(H.uv_index[i] || 0), pp: Math.round(H.precipitation_probability[i] || 0), aqi: a[1], pr: Math.round(c.surface_pressure), dew: Math.round(c.dew_point_2m),
        hu: Math.round(c.relative_humidity_2m), hi: Math.round(D.temperature_2m_max[0]), lo: Math.round(D.temperature_2m_min[0]), sr: String(D.sunrise[0]).slice(11, 16), ss: String(D.sunset[0]).slice(11, 16), hours: hours, at: Date.now() };
      LSs('nms-w-wx', JSON.stringify({ loc: loc, t: Date.now(), w: w }));
      return w;
    }).catch(function () { try { var c = JSON.parse(LSg('nms-w-wx') || 'null'); return c && c.w || null; } catch (e) { return null; } });
    return wxP;
  }
  /* one tap to allow location, only ever from a button the visitor presses (same key Weather Scan uses) */
  function locate() {
    return new Promise(function (res, rej) {
      if (!navigator.geolocation) return rej(new Error('nogeo'));
      navigator.geolocation.getCurrentPosition(function (p) { LSs('nms-w-loc', p.coords.latitude.toFixed(2) + ',' + p.coords.longitude.toFixed(2)); res(true); }, function (e) { rej(e); }, { timeout: 10000, maximumAge: 3600000 });
    });
  }
  var SAMPLE_W = { t: 14, f: 12, code: 2, wd: 18, gust: 25, day: 1, uv: 2, pp: 20, aqi: 20, pr: 1012, dew: 9, hu: 71, hi: 17, lo: 8, sr: '07:12', ss: '16:19', hours: [], sample: true };

  /* same rules as the Weather Station's translate() */
  var isRain = function (c) { return (c >= 51 && c <= 67) || (c >= 80 && c <= 82); }, isSnow = function (c) { return (c >= 71 && c <= 77) || c === 85 || c === 86; }, isStorm = function (c) { return c >= 95; }, isFog = function (c) { return c === 45 || c === 48; };
  var HAZ = { storm: 'EXTREME', frozen: 'COLD', toxic: 'TOXIC', marsh: 'LOW', scorched: 'HEAT', radioactive: 'RADIATION', night: 'CALM', lush: 'LOW' };
  var COND = function (c) {
    if (c === 0) return 'Clear skies'; if (c <= 2) return 'Light cloud'; if (c === 3) return 'Overcast'; if (isFog(c)) return 'Dense fog'; if (c <= 57) return 'Drizzle'; if (c <= 67) return 'Rainstorms';
    if (c <= 77) return 'Snowfall'; if (c <= 82) return 'Heavy showers'; if (c <= 86) return 'Snowstorm'; return 'Electrical storm';
  };
  function biome(w) {
    var c = w.code, t = w.t, k;
    if (isStorm(c) || w.gust >= 75) k = 'storm'; else if (isSnow(c) || t <= 0) k = 'frozen'; else if (w.aqi >= 60) k = 'toxic'; else if (isRain(c) || isFog(c)) k = 'marsh';
    else if (t >= 30) k = 'scorched'; else if (w.day && w.uv >= 8) k = 'radioactive'; else if (!w.day) k = 'night'; else k = 'lush';
    var M = { storm: ['Volcanic', 'volcanic'], frozen: ['Frozen', 'frozen'], toxic: ['Toxic', 'toxic'], marsh: ['Marsh', 'marsh'], scorched: ['Scorched', 'scorched'], radioactive: ['Radioactive', 'radioactive'], night: ['Dead', 'dead'], lush: ['Lush', 'lush'] };
    var fx = [];
    if (isStorm(c)) fx.push('rain', 'storm'); else if (isRain(c)) fx.push(c >= 51 && c <= 57 ? 'drizzle' : 'rain');
    if (isSnow(c)) fx.push('snow'); if (isFog(c)) fx.push('fog'); if (k === 'toxic') fx.push('mist'); if (k === 'scorched') fx.push('heat');
    if (k === 'night') { fx.push('dim'); if (c <= 2) fx.push('stars'); }
    return { key: k, pool: M[k][0], img: M[k][1], fx: fx.join(' '), haz: HAZ[k] };
  }

  /* ---------- clock ---------- */
  var FACE12 = '0123456789AB'.split('');
  var PLACES = [['UTC', 'UTC', 'UTC'], ['London', 'Europe/London', 'LONDON'], ['New York', 'America/New_York', 'NEW YORK'], ['Los Angeles', 'America/Los_Angeles', 'LOS ANGELES'], ['Berlin', 'Europe/Berlin', 'BERLIN'], ['Tokyo', 'Asia/Tokyo', 'TOKYO'], ['Sydney', 'Australia/Sydney', 'SYDNEY']];
  function clockPrefs() { var p = { mode: 'analog', h24: false, nums: false, tz: 'UTC' }; try { var s = JSON.parse(LSg('nms-w-clk') || 'null'); if (s) { p.mode = s.mode === 'digital' ? 'digital' : 'analog'; p.h24 = !!s.h24; p.nums = !!s.nums; if (s.tz) p.tz = s.tz; } } catch (e) {} return p; }
  var PR = clockPrefs();
  function saveClockPrefs(p) { PR = p; LSs('nms-w-clk', JSON.stringify(p)); clockRefresh(); }
  function placeOf(tz) { for (var i = 0; i < PLACES.length; i++) if (PLACES[i][1] === tz) return PLACES[i]; return PLACES[0]; }
  function worldTime(d) { var p = placeOf(PR.tz), s; try { s = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: !PR.h24, timeZone: p[1] }).format(d); } catch (e) { s = pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()); } return { label: p[2], t: s.toUpperCase() }; }
  function clockHTML(d) {
    var h = d.getHours(), m = d.getMinutes(), s = d.getSeconds(), ap = h < 12 ? 'AM' : 'PM', h12 = (h % 12) || 12;
    if (PR.mode === 'digital') {
      var hh = PR.h24 ? pad(h) : h12, w = worldTime(d);
      return '<div class="scn" style="background-image:url(' + BIOME_IMG(scnKey) + ');background-color:#0a1620"><span class="tag">' + T('TRAVELLER HUD') + '</span>' +
        '<div class="cl"><small>' + T('WORLD CLOCK') + '</small><b>' + w.t + '</b><em>' + w.label + '</em></div>' +
        '<div class="cr"><small>' + T('LOCAL TIME') + ' · ' + (PR.h24 ? '24H' : '12H') + '</small><b>' + hh + ':' + pad(m) + (PR.h24 ? '' : '<sup>' + ap + '</sup>') + '</b><em>' + dateTxt(d) + '</em></div></div>';
    }
    var g = '', nums = '', hi = h % 12, mi = Math.round(m / 5) % 12;
    FACE12.forEach(function (c, i) {
      var a = i * 30 * Math.PI / 180, x = Math.sin(a), y = Math.cos(a);
      g += '<i class="g' + (i === mi ? ' m' : (i === hi ? ' h' : '')) + '" style="--gm:url(' + glyph(c) + ');left:' + (50 + 44.8 * x).toFixed(1) + '%;top:' + (50 - 44.8 * y).toFixed(1) + '%"></i>';
      if (PR.nums) nums += '<span class="nm' + (i === mi ? ' m' : (i === hi ? ' h' : '')) + '" style="left:' + (50 + 32.5 * x).toFixed(1) + '%;top:' + (50 - 32.5 * y).toFixed(1) + '%">' + (i || 12) + '</span>';
    });
    return '<div class="face" data-n="' + (PR.nums ? 1 : 0) + '"><div class="pc" style="--pd:-' + ((Date.now() / 1000) % 7).toFixed(2) + 's"><video class="pv" muted loop playsinline autoplay preload="auto"></video></div>' + g + nums +
      '<div class="hand h" style="transform:rotate(' + (((h % 12) + m / 60) * 30) + 'deg)"></div><div class="hand m" style="transform:rotate(' + ((m + s / 60) * 6) + 'deg)"></div><div class="hand s" style="transform:rotate(' + (s * 6) + 'deg)"></div><i class="dot"></i>' +
      '<div class="ap">' + (PR.h24 ? pad(h) + ':' + pad(m) : ap) + '</div></div>';
  }
  var clocks = [];
  function clockTick(el, d, force) {
    var f = el.firstElementChild;
    if (!force && PR.mode === 'analog' && f && f.classList.contains('face') && f.getAttribute('data-n') === (PR.nums ? '1' : '0')) {
      var hh = d.getHours(), mm = d.getMinutes(), ss = d.getSeconds(), hi = hh % 12, mi = Math.round(mm / 5) % 12;
      all(f, '.g').forEach(function (g, i) { g.className = 'g' + (i === mi ? ' m' : (i === hi ? ' h' : '')); });
      all(f, '.nm').forEach(function (g, i) { g.className = 'nm' + (i === mi ? ' m' : (i === hi ? ' h' : '')); });
      f.querySelector('.hand.h').style.transform = 'rotate(' + (((hh % 12) + mm / 60) * 30) + 'deg)';
      f.querySelector('.hand.m').style.transform = 'rotate(' + ((mm + ss / 60) * 6) + 'deg)';
      f.querySelector('.hand.s').style.transform = 'rotate(' + (ss * 6) + 'deg)';
      f.querySelector('.ap').textContent = PR.h24 ? pad(hh) + ':' + pad(mm) : (hh < 12 ? 'AM' : 'PM');
    } else {
      el.innerHTML = clockHTML(d);
      all(el, 'video.pv').forEach(function (v) { v.src = BASE + 'assets/portal-centre.mp4'; v.muted = true; var p = v.play && v.play(); if (p && p.catch) p.catch(function () {}); });
    }
  }
  var clkTimer = 0;
  function clockLoop() { if (clkTimer) return; clkTimer = setInterval(function () { if (document.hidden) return; var d = new Date(); clocks.forEach(function (e) { clockTick(e, d); }); }, 1000); }
  function clock(el) { el.className = (el.className + ' clk').trim(); clocks.push(el); clockTick(el, new Date(), true); clockLoop(); }
  function clockRefresh() { var d = new Date(); clocks.forEach(function (e) { clockTick(e, d, true); }); }

  /* ---------- exosuit status: the visitor's own device ---------- */
  var bat = { level: .76, charging: false, dis: 3 * 3600 + 12 * 60, chg: Infinity, demo: true }, batEls = [], t0 = Date.now(), hist = [];
  function fmt(sec) { if (!isFinite(sec) || sec <= 0) return ''; var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60); return h ? h + 'h ' + pad(m) + 'm' : m + 'm'; }
  function linkInfo() {
    var c = navigator.connection;
    if (!navigator.onLine) return { bars: 0, txt: 'OFFLINE', short: 'OFFLINE', real: true };
    if (c && c.effectiveType) { var e = c.effectiveType, b = { 'slow-2g': 1, '2g': 1, '3g': 2, '4g': 4 }[e] || 3; if (c.downlink >= 10 && (c.rtt || 999) < 100) b = 5; return { bars: b, txt: e.toUpperCase() + (c.downlink ? ' · ' + c.downlink + ' Mbps' : '') + (c.rtt ? ' · ' + c.rtt + ' ms' : ''), short: e.toUpperCase(), real: true }; }
    return { bars: 0, txt: T('Link data not available on this browser'), short: 'ONLINE', real: false };
  }
  var LV = ['NO SIGNAL', 'WEAK', 'POOR', 'FAIR', 'STRONG', 'EXCELLENT'];
  function statusUpdate() {
    var pc = Math.round(bat.level * 100), eta = bat.charging ? (isFinite(bat.chg) && bat.chg > 0 ? fmt(bat.chg) + ' ' + T('to full') : '') : (isFinite(bat.dis) && bat.dis > 0 ? '≈ ' + fmt(bat.dis) + ' ' + T('left') : '');
    var L = linkInfo(), u = Math.floor((Date.now() - t0) / 1000), up = Math.floor(u / 3600) + 'h ' + pad(Math.floor(u % 3600 / 60)) + 'm';
    batEls.forEach(function (r) {
      all(r, '.v-bp').forEach(function (e) { e.textContent = bat.demo ? '--' : pc + '%'; });
      all(r, '.v-bb').forEach(function (e) { e.style.width = (bat.demo ? 76 : pc) + '%'; });
      all(r, '.v-chg').forEach(function (e) { e.textContent = bat.demo ? T('NOT READABLE HERE') : (bat.charging ? '⚡ ' + T('CHARGING') : T('ON BATTERY')); });
      all(r, '.v-eta').forEach(function (e) { e.textContent = eta; });
      all(r, '.v-sig').forEach(function (e) { e.textContent = L.short; });
      all(r, '.v-up').forEach(function (e) { e.textContent = up; });
      all(r, '.demo').forEach(function (e) { e.style.display = bat.demo ? 'block' : 'none'; });
      all(r, '.v-lbars').forEach(function (e) { var b = ''; for (var j = 1; j <= 5; j++) b += '<i class="' + (j <= L.bars ? 'on' : '') + '" style="height:' + (j * 20) + '%"></i>'; e.innerHTML = b; });
      all(r, '.v-llv').forEach(function (e) { e.textContent = L.real ? LV[L.bars] : '—'; });
      all(r, '.v-ltx').forEach(function (e) { e.textContent = L.txt; });
      all(r, '.v-spark').forEach(function (e) {
        if (bat.demo || hist.length < 2) { e.innerHTML = ''; return; }
        var pts = hist.map(function (v, i) { return (i / (hist.length - 1) * 100).toFixed(1) + ',' + (34 - v * 32).toFixed(1); }).join(' ');
        e.innerHTML = '<polyline points="' + pts + '" fill="none" stroke="#00e5ff" stroke-width="1.2"/>';
      });
    });
  }
  function batInit() {
    if (batInit.done) return; batInit.done = true;
    if (navigator.getBattery) navigator.getBattery().then(function (b) {
      function u() { bat = { level: b.level, charging: b.charging, dis: b.dischargingTime, chg: b.chargingTime, demo: false }; statusUpdate(); }
      u(); hist.push(bat.level); ['levelchange', 'chargingchange', 'dischargingtimechange', 'chargingtimechange'].forEach(function (ev) { b.addEventListener(ev, u); });
      setInterval(function () { hist.push(bat.level); if (hist.length > 30) hist.shift(); statusUpdate(); }, 20000);
    }).catch(function () {});
    setInterval(function () { if (!document.hidden) statusUpdate(); }, 5000);
    try { if (navigator.connection && navigator.connection.addEventListener) navigator.connection.addEventListener('change', statusUpdate); } catch (e) {}
    addEventListener('online', statusUpdate); addEventListener('offline', statusUpdate);
  }
  function status(el) {
    el.className = (el.className + ' mw status').trim();
    el.innerHTML = '<div class="top"><span class="lb">' + T('LIFE SUPPORT') + '</span><b class="t v-bp">--</b></div><div class="bar"><i class="v-bb"></i></div>' +
      '<div class="sm2"><span class="v-chg"></span><span class="v-eta"></span></div>' +
      '<div class="two"><u>' + T('SIGNAL') + '<b class="v-sig">--</b></u><u>' + T('SESSION') + '<b class="v-up">0h 00m</b></u></div>';
    batEls.push(el); batInit(); statusUpdate();
  }

  /* ---------- weather scan (basic weather, a short version of the Weather Station) ---------- */
  var scanEls = [];
  function scanDraw(el, w) {
    var b = biome(w);
    el.innerHTML = '<div class="srow"><div class="ring"><i class="sweep"></i><b class="t">' + w.t + '°</b></div><div class="hz"><span class="lb">' + T('HAZARD') + '</span><b>' + T(b.haz) + '</b><small>' + T(COND(w.code)) + '</small></div></div>' +
      '<div class="chp"><u>' + T('FEELS') + '<b>' + w.f + '°</b></u><u>' + T('WIND') + '<b>' + w.wd + '</b></u><u>' + T('RAIN') + '<b>' + w.pp + '%</b></u></div>' +
      (w.sample ? '<div class="smp">' + T('SAMPLE · TAP TO SCAN') + '</div>' : '');
  }
  function scan(el) { el.className = (el.className + ' mw scan').trim(); scanEls.push(el); scanDraw(el, SAMPLE_W); weather().then(function (w) { if (w) scanEls.forEach(function (e) { scanDraw(e, w); }); }); }

  /* ---------- home planet (summary the Home Planet widget saves on this device) ---------- */
  function home(el) {
    el.className = (el.className + ' mw hp').trim();
    var hp = null; try { hp = JSON.parse(LSg('nms-w-hp') || 'null'); } catch (e) {}
    var hex = hp && /^[0-9A-F]{12}$/.test(hp.hex || '') ? hp.hex : '10A3F2B9C4E1', key = 'lush', bl = hp && hp.biome ? String(hp.biome).toLowerCase() : '';
    if (/swamp|marsh|bog/.test(bl)) key = 'marsh'; else if (/barren|airless|dead|desolate/.test(bl)) key = 'dead'; else SCN_KEYS.forEach(function (k) { if (bl.indexOf(k) >= 0) key = k; });
    if (/frost|ice|snow/.test(bl)) key = 'frozen'; else if (/lava|magma|volcan/.test(bl)) key = 'volcanic'; else if (/desert|scorch|burn/.test(bl)) key = 'scorched'; else if (/toxic|acid/.test(bl)) key = 'toxic'; else if (/radio/.test(bl)) key = 'radioactive';
    el.innerHTML = '<div class="layer" style="background-image:url(' + BIOME_IMG(key) + ')"></div><div class="shade"></div><span class="chip">' + T('HOME PLANET') + '</span>' +
      '<div class="in"><div class="nm">' + esc(hp && hp.name || 'Gospor Sago') + '</div><div class="pgl">' + glyphRow(hex) + '</div><div class="hex">' + hex + '</div>' + (hp ? '' : '<div class="smp">' + T('SAMPLE · SET YOUR HOME PORTAL') + '</div>') + '</div>';
  }

  /* ---------- expedition (wiki list via expedition.js) ---------- */
  var expEls = [], expS = null;
  function expDraw() {
    expEls.forEach(function (el) {
      var X = expS && (expS.live || expS.next);
      if (!X) { el.innerHTML = '<span class="lb">' + T('EXPEDITION') + '</span><b class="t">--</b><span class="sm">' + T('Reading the wiki…') + '</span>'; return; }
      var live = !!expS.live, now = Date.now(), left = live ? X.end - now : X.start - now, L = window.NMSExpedition ? NMSExpedition.left(left) : { d: 0, h: 0, m: 0, s: 0 };
      var p = live ? Math.min(100, Math.max(0, (now - X.start) / (X.end - X.start) * 100)) : 0;
      el.innerHTML = '<span class="lb">' + (live ? '' : T('NEXT') + ' · ') + T('EXPEDITION') + ' ' + X.num + (X.redux ? ' · ' + T('REDUX') : '') + '</span><b class="t tt">' + esc(X.title) + '</b>' +
        '<b class="t">' + L.d + 'd ' + pad(L.h) + 'h</b><span class="sm">' + pad(L.m) + 'm ' + pad(L.s) + 's' + (live ? '' : ' ' + T('to start')) + '</span><div class="bar"><i style="width:' + p.toFixed(1) + '%"></i></div>';
    });
  }
  function exp(el) {
    el.className = (el.className + ' mw exp').trim(); expEls.push(el); expDraw();
    if (!exp.started) {
      exp.started = true;
      if (window.NMSExpedition) NMSExpedition.load().then(function (r) { expS = r; expDraw(); }).catch(function () {});
      setInterval(function () { if (!document.hidden && expS) { var n = Date.now(); if ((expS.live && n >= expS.live.end) || (!expS.live && expS.next && n >= expS.next.start)) expS = NMSExpedition.pick(expS.rows, n); expDraw(); } }, 1000);
    }
  }

  /* ---------- planet of the day ---------- */
  var ORDER = ['Lush', 'Frozen', 'Toxic', 'Scorched', 'Radioactive', 'Volcanic', 'Dead', 'Marsh'];
  var havenP = null, factsP = null;
  function haven() {
    if (!havenP) havenP = fetch(WX + '/data/haven-worlds.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
    havenP.catch(function () { havenP = null; });
    return havenP;
  }
  function facts() { if (!factsP) factsP = fetch(BASE + 'assets/potd-facts.json').then(function (r) { return r.json(); }).catch(function () { factsP = null; return []; }); return factsP; }
  /* exactly the Weather Station's buildSurvey(): same day number, same picks */
  function pickPlanet(H, pool) {
    var day = Math.floor(Date.now() / 86400000), used = {}, found = null;
    ORDER.forEach(function (b, k) {
      var rows = H.P[b] || []; if (!rows.length) return;
      var start = (day + k * 5) % rows.length, p = rows[start];
      for (var t = 0; t < rows.length; t++) { var c = rows[(start + t) % rows.length]; if (!used[c[0]]) { p = c; break; } }
      used[p[0]] = 1; if (b === pool) found = p;
    });
    if (!found) return null;
    var p = found, s = H.sys[p[0]];
    return { name: p[1], raw: p[2], weather: p[3], flora: p[4], fauna: p[5], res: p[6] ? String(p[6]).split('|') : [], by: p[7], extreme: !!p[8], sys: s[0], galaxy: s[1], glyph: s[2], race: s[3], star: s[4], econ: s[5], conflict: s[6] };
  }
  function infoHTML(p) {
    return '<div class="dg"><div><div class="row"><span>' + T('Flora') + '</span><b>' + esc(p.flora) + '</b></div><div class="row"><span>' + T('Fauna') + '</span><b>' + esc(p.fauna) + '</b></div>' +
      '<div class="row"><span>' + T('System') + '</span><b translate="no">' + esc(p.sys) + '</b></div><div class="row"><span>' + T('Galaxy') + '</span><b translate="no">' + esc(p.galaxy) + '</b></div>' +
      '<div class="row"><span>' + T('Race') + '</span><b>' + esc(p.race) + '</b></div><div class="row"><span>' + T('Economy') + '</span><b>' + esc(p.econ) + '</b></div></div>' +
      '<div><div class="pg">' + glyphRow(p.glyph) + '</div><div class="hexl" translate="no">' + esc(String(p.glyph).toUpperCase()) + '</div></div></div>' +
      '<div class="chips">' + p.res.map(function (r) { return '<i>' + esc(r) + '</i>'; }).join('') + '</div>' +
      '<div class="cred">' + T('Charted by') + ' <span translate="no">' + esc(p.by) + '</span>' + (p.extreme ? ' · ' + T('extreme weather') : '') + '. ' + T('Data: Voyager\'s Haven. Planet info and pictures: NMS Almanac.') + '</div>';
  }
  var potds = [];
  function potd(el, opt) {
    opt = opt || {};
    el.className = (el.className + ' pic').trim();
    el.innerHTML = '<div class="layer la"></div><div class="layer lb hide"></div><div class="fxbox"><i class="fx fx-rain"></i><i class="fx fx-rain2"></i><i class="fx fx-drizzle"></i><i class="fx fx-snow"></i><i class="fx fx-storm"></i><i class="fx fx-stars"></i><i class="fx fx-dim"></i><i class="fx fx-fog"></i><i class="fx fx-mist"></i><i class="fx fx-heat"></i></div>' +
      '<i class="scanbar"></i><span class="chip">' + T('CHARTED WORLD') + '</span><div class="pname"><b></b><small></small></div>';
    var S = { el: el, shown: null, busy: false, opt: opt }; potds.push(S);
    el.__potd = S; return S;
  }
  function potdApply(S, w, animate) {
    return haven().then(function (H) {
      var el = S.el, b = biome(w), p = pickPlanet(H, b.pool); if (!p) return null;
      var src = BIOME_IMG(b.img), first = !S.shown, key = b.key + '|' + p.name; S.shown = key; S.planet = p; S.biome = b; S.w = w;
      function setText() {
        el.setAttribute('data-fx', b.fx);
        el.querySelector('.pname b').textContent = p.name; el.querySelector('.pname small').textContent = p.raw + ' · ' + p.weather;
        if (S.opt.onPlanet) S.opt.onPlanet(p, b, w);
      }
      var a = el.querySelector('.la'), bb = el.querySelector('.lb'), sc = el.querySelector('.scanbar'), pn = el.querySelector('.pname');
      if (!animate || first || calm() || S.busy) { a.style.backgroundImage = 'url(' + src + ')'; a.style.clipPath = ''; setText(); return p; }
      S.busy = true; pn.style.opacity = 0; sc.classList.add('on'); sc.classList.remove('up');
      var D1 = 650, D2 = 650, t1 = performance.now(), swapped = false;
      var ease = function (x) { return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
      function step(now) {
        var e = now - t1, y;
        if (e < D1) { y = ease(e / D1) * 100; sc.style.top = y + '%'; a.style.clipPath = 'inset(' + y + '% 0 0 0)'; requestAnimationFrame(step); return; }
        if (!swapped) { swapped = true; a.style.clipPath = 'inset(100% 0 0 0)'; bb.style.backgroundImage = 'url(' + src + ')'; bb.classList.remove('hide'); bb.style.clipPath = 'inset(100% 0 0 0)'; sc.classList.add('up'); setText(); }
        var e2 = e - D1;
        if (e2 < D2) { y = (1 - ease(e2 / D2)) * 100; sc.style.top = y + '%'; bb.style.clipPath = 'inset(' + y + '% 0 0 0)'; requestAnimationFrame(step); return; }
        a.style.backgroundImage = 'url(' + src + ')'; a.style.clipPath = ''; bb.classList.add('hide'); bb.style.clipPath = ''; sc.classList.remove('on'); sc.style.top = '0'; pn.style.opacity = 1; S.busy = false;
      }
      requestAnimationFrame(step); return p;
    }).catch(function () { return null; });
  }
  function potdRun(S, force) {
    return weather(force).then(function (w) { return potdApply(S, w || { t: 17, f: 16, code: 0, wd: 12, gust: 15, day: 1, uv: 3, aqi: 20 }, S.shown ? true : false); });
  }
  /* day rolls over while the page stays open */
  var potdDay = Math.floor(Date.now() / 86400000);
  document.addEventListener('visibilitychange', function () { if (document.hidden) return; var d = Math.floor(Date.now() / 86400000); if (d !== potdDay) { potdDay = d; potds.forEach(function (S) { potdRun(S, true); }); } });

  window.NMSW = { BASE: BASE, WX: WX, weather: weather, locate: locate, biome: biome, COND: COND, SAMPLE_W: SAMPLE_W, glyph: glyph, glyphRow: glyphRow, esc: esc, pad: pad,
    clock: clock, clockPrefs: function () { return PR; }, saveClockPrefs: saveClockPrefs, clockRefresh: clockRefresh, PLACES: PLACES, placeOf: placeOf, newScene: function () { var n; do { n = SCN_KEYS[Math.floor(Math.random() * SCN_KEYS.length)]; } while (n === scnKey); scnKey = n; clockRefresh(); },
    status: status, linkInfo: linkInfo, bat: function () { return bat; }, batInit: batInit, statusUpdate: statusUpdate, batEls: batEls,
    scan: scan, home: home, exp: exp, expState: function () { return expS; },
    potd: potd, potdRun: potdRun, potdApply: potdApply, infoHTML: infoHTML, facts: facts, haven: haven, SCN_KEYS: SCN_KEYS };
})();
