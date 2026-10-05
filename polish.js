/* NMS Theme Pack — v2.2 polish layer
   Swaps emoji icons for crisp HUD line icons (emoji render differently on
   every device and read as "cheap"). Pure DOM, no dependencies. */
(function(){
  var P = {
    grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M17.5 14l3.5 3.5-3.5 3.5-3.5-3.5z"/>',
    image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="M21 16l-5.5-5.5L5 21"/>',
    bolt:'<path d="M13 2L4.5 13.5H12L11 22l8.5-11.5H12z"/>',
    glyph:'<path d="M4 4h7v4H8v12H4zM13 4h7v7h-4v-3h-3zM13 13h7v7h-7z"/>',
    book:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M9 8h7M9 11.5h5"/>',
    phoneDl:'<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M12 7v7M9 11.5l3 3 3-3M10 18.5h4"/>',
    phone:'<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10.5 18.5h3"/>',
    box:'<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>',
    puzzle:'<path d="M10 3h4v3a2 2 0 1 0 4 0V3h3v7h-3a2 2 0 1 0 0 4h3v7h-7v-3a2 2 0 1 0-4 0v3H3v-7h3a2 2 0 1 0 0-4H3V3z"/>',
    windows:'<path d="M3 5.5l7.5-1v7H3zM12.5 4.2L21 3v8.5h-8.5zM3 12.5h7.5v7L3 18.5zM12.5 12.5H21V21l-8.5-1.2z"/>',
    android:'<path d="M5 10a7 7 0 0 1 14 0v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18z"/><path d="M8 4.5L6.5 2.5M16 4.5l1.5-2M5 11.5h14"/><circle cx="9" cy="8" r=".6"/><circle cx="15" cy="8" r=".6"/>',
    apple:'<path d="M16.5 12.8c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8s-1.8-.8-3-.8C6.9 7.4 5 8.9 5 12c0 1.9.7 3.9 1.6 5.2.8 1.1 1.5 2.1 2.6 2.1 1 0 1.4-.7 2.7-.7s1.6.7 2.7.7 1.8-1 2.5-2c.8-1.1 1.1-2.2 1.1-2.3-.1 0-2.1-.8-2.1-3.2z"/><path d="M14.3 5.3c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .1 1.9-.5 2.5-1.2z"/>',
    laptop:'<rect x="4" y="4" width="16" height="11" rx="1.5"/><path d="M2 19h20l-2-4H4z"/>',
    satellite:'<path d="M5 12l3-3 7 7-3 3z"/><path d="M8 9l3-3 2 2M13 14l2 2 3-3"/><path d="M3 21l4-4M16 3a5 5 0 0 1 5 5M16 6.5A1.5 1.5 0 0 1 17.5 8"/>',
    weather:'<circle cx="9" cy="9" r="3.2"/><path d="M9 2.5v1.5M3.5 9H2M4.8 4.8l1 1M13.2 4.8l-1 1"/><path d="M8 20h9a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6 1.2A3 3 0 0 0 8 20z"/>',
    galaxy:'<circle cx="12" cy="12" r="1.6"/><path d="M12 3c5 0 8 3 7 6.5M21 12c0 5-3 8-6.5 7M12 21c-5 0-8-3-7-6.5M3 12c0-5 3-8 6.5-7"/>',
    repeat:'<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>',
    planet:'<circle cx="12" cy="12" r="6"/><path d="M3.5 15.5C1.8 17.6 1.6 19.2 2.6 19.9c1.7 1.2 7-1.3 11.8-5.6 4.8-4.3 7.7-9 6.5-10.2-.8-.8-2.6-.4-4.7.9"/>',
    bulb:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    warn:'<path d="M12 3L2 20.5h20z"/><path d="M12 10v4.5M12 17.5v.01"/>'
  };
  var MAP = {
    '\u{1F6F8}':'grid','\u{1F5BC}':'image','⚡':'bolt','\u{1F524}':'glyph','\u{1F4D6}':'book',
    '\u{1F4F2}':'phoneDl','\u{1F4F1}':'phone','\u{1F4E6}':'box','\u{1F9E9}':'puzzle','\u{1FA9F}':'windows',
    '\u{1F916}':'android','\u{1F34E}':'apple','\u{1F4BB}':'laptop','\u{1F6F0}':'satellite','\u{1F324}':'weather',
    '\u{1F30C}':'galaxy','\u{1F501}':'repeat','\u{1FA90}':'planet','\u{1F4A1}':'bulb','⚠':'warn'
  };
  var RE = /^\s*(\p{Extended_Pictographic})️?\s*/u;

  function icon(name){
    var s = document.createElement('span');
    s.className = 'pz-ico'; s.setAttribute('aria-hidden','true');
    s.innerHTML = '<svg viewBox="0 0 24 24">' + P[name] + '</svg>';
    return s;
  }
  function swap(el){
    if (el.classList.contains('pz-done')) return;
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) {
      if (!n.nodeValue.trim()) continue;
      var m = n.nodeValue.match(RE);
      if (!m || !MAP[m[1]]) return;
      n.nodeValue = n.nodeValue.slice(m[0].length);
      n.parentNode.insertBefore(icon(MAP[m[1]]), n);
      el.classList.add('pz-done');
      return;
    }
  }
  function run(){
    document.querySelectorAll('.fi, .dl-ico, .tab-btn, .note, .copy-btn').forEach(swap);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
