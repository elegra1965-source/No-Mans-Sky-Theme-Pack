/* NMS Theme Pack — expedition dates (2026-10-10)
   Reads the No Man's Sky Wiki's "List of Expeditions" table straight from the browser
   (Fandom allows it) and works out which expedition is live now, or which is next.
   Redux runs listed in the same row count too. Cached for 3 hours; works offline from the cache.
   window.NMSExpedition.load() -> Promise<{ live, next, last, rows }> */
(function () {
  'use strict';
  var URL_ = 'https://nomanssky.fandom.com/api.php?action=parse&page=List_of_Expeditions&prop=wikitext&format=json&origin=*';
  var LS = 'nms_theme_expeditions', TTL = 3 * 3600000;
  // expeditions go live and end around 14:00 UTC (the wiki only gives the day)
  function at(d) { return d ? Date.parse(d + 'T14:00:00Z') : NaN; }
  function dates(cell) { return (String(cell || '').match(/\d{4}-\d{2}-\d{2}/g) || []); }
  function parse(wt) {
    var runs = [];
    String(wt).split(/\n\|-/).forEach(function (chunk) {
      var cells = chunk.split('\n').filter(function (l) { return /^\|(?!\})/.test(l); }).map(function (l) { return l.replace(/^\|\s*/, '').trim(); });
      if (cells.length < 4 || !/^\d+$/.test(cells[0])) return;
      var ti = -1;
      cells.forEach(function (c, i) { if (ti < 0 && /\[\[\s*Expedition\s+\d+\s*:/i.test(c)) ti = i; });
      if (ti < 0) return;
      var tm = cells[ti].match(/\[\[\s*Expedition\s+\d+\s*:\s*([^|\]]+)/i);
      if (!tm) return;
      var s = dates(cells[ti + 1]), e = dates(cells[ti + 2]), num = parseInt(cells[0], 10);
      for (var k = 0; k < Math.max(s.length, 1); k++) {
        if (!s[k]) continue;
        runs.push({ num: num, title: tm[1].trim(), redux: k > 0, start: at(s[k]), end: at(e[k]) });
      }
    });
    return runs.sort(function (a, b) { return a.start - b.start; });
  }
  function pick(runs, now) {
    now = now || Date.now();
    var live = null, next = null, last = null;
    runs.forEach(function (r) {
      if (r.start <= now && (isNaN(r.end) || now < r.end)) { if (!live || r.start > live.start) live = r; }
      else if (r.start > now) { if (!next || r.start < next.start) next = r; }
      else if (!last || r.end > last.end) last = r;
    });
    return { live: live, next: next, last: last, rows: runs };
  }
  function cached() {
    try { var c = JSON.parse(localStorage.getItem(LS) || 'null'); return c && c.runs ? c : null; } catch (e) { return null; }
  }
  function load(force) {
    var c = cached();
    if (c && !force && Date.now() - c.at < TTL) return Promise.resolve(pick(c.runs));
    return fetch(URL_).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) {
      var runs = parse(j && j.parse && j.parse.wikitext && j.parse.wikitext['*']);
      if (!runs.length) throw new Error('empty');
      try { localStorage.setItem(LS, JSON.stringify({ at: Date.now(), runs: runs })); } catch (e) {}
      return pick(runs);
    }).catch(function (e) { if (c) return pick(c.runs); throw e; });
  }
  function left(ms) {
    ms = Math.max(0, ms);
    return { d: Math.floor(ms / 86400000), h: Math.floor(ms % 86400000 / 3600000), m: Math.floor(ms % 3600000 / 60000), s: Math.floor(ms % 60000 / 1000) };
  }
  window.NMSExpedition = { load: load, parse: parse, pick: pick, left: left };
})();
