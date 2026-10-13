# No Man's Sky Theme Pack

**Live:** [theme.nomansskyhub.app](https://theme.nomansskyhub.app)

Turn your phone or desktop into a *No Man's Sky* terminal. 76 hand-themed icons, 33 wallpapers, 5 charging animations and the alien alphabet as an installable font. Free, no account, for Android, iPhone, Windows, Mac and Linux.

Part of the [No Man's Sky Hub](https://nomansskyhub.app) family of fan tools.

![No Man's Sky Theme Pack site with the interactive phone mockup](screenshots/01-hero.jpg)

## What's in the pack

- **76 themed icons**, each exported as transparent PNGs in 7 sizes, plus Windows `.ico` versions
- **33 wallpapers** in 6 resolutions each, for phone and desktop
- **5 charging animations** as watermark-free MP4s for Android and iPhone
- **The NMS alien alphabet** as an installable TTF font
- **Widget Kit** for KWGT: two NMS-styled frames, both fonts and a step-by-step clock/date widget guide
- **Setup guides** for Android launchers, iPhone, Windows and Mac

## Make it yours (new)

- **Portal wallpaper:** your Traveller name (in English and in the NMS alphabet), home galaxy, home planet name, home portal address (hex and glyphs) and, if you like, your NMS friend code, on one of 15 No Man's Sky backgrounds for phone (1080x2400) or desktop (2560x1440). Switch each line on or off and watch the preview before you download. The name, galaxy and friend code come from your Hub Traveller ID if you've set one. The planet name is looked up from your address in the [Galactic Map](https://map.nomansskyhub.app)'s community edits, then [Voyager's Haven](https://havenmap.online), or you can type your own.
- **Planet of the day:** the Weather Station surveys 8 real, player-charted worlds from [Voyager's Haven](https://havenmap.online) every day. Pick one of today's and download it as a wallpaper, with its portal glyphs, hex and discoverer, plus a link to fly there on the Galactic Map.
- **Expedition countdown:** live time left in the current expedition (or until the next one), with a [home-screen widget page](https://theme.nomansskyhub.app/countdown.html) that installs like an app. Dates come from the No Man's Sky Wiki's List of Expeditions, redux runs included.

Everything is drawn in your browser; nothing is uploaded. The only thing sent anywhere is your portal address, to look up the planet name.

![Portal wallpaper, planet of the day and the expedition countdown](screenshots/05-make-it-yours.jpg)

![Making a portal wallpaper: tapping in the glyphs, changing the background, planet of the day and the countdown](screenshots/06-make-it-yours.gif)

## The site

- An interactive phone mockup and a live grid of every icon
- A live alien-alphabet translator and glyph chart
- A drag-to-compare before/after slider, and before/after desktops for Windows and macOS
- Platform-aware install as an app (Android prompt, iPhone guide)

![Drag-to-compare: stock icons vs the NMS Theme Pack](screenshots/02-before-after.jpg)

![A Windows desktop before and after the pack](screenshots/03-desktop-transformed.jpg)

## How it's built

A plain HTML/CSS/JavaScript site with no build step. Deployed on Netlify straight from this repo: every push to `main` goes live.

| Path | What it is |
|---|---|
| `index.html` | The download site |
| `polish.css`, `polish.js` | HUD-style card treatment and line icons (v2.2 polish) |
| `studio.js`, `studio.css`, `assets/studio/` | "Make it yours": portal wallpaper, planet of the day and the countdown card |
| `expedition.js`, `countdown.html`, `countdown.webmanifest` | Expedition dates from the NMS Wiki and the installable countdown widget page |
| `preview.html` | Full phone preview |
| `HOW_TO_APPLY_ICONS.html` | Setup guide |
| `android_icon_pack_mapping.xml` | Launcher mapping for icon-pack apps |
| `assets/*.zip` | The downloads: icons, wallpapers, charging animations, widget kit |
| `assets/icons/`, `assets/widgets/` | Icon previews and widget kit files |
| `sw.js`, `manifest.json`, `pwa/` | Install and offline support |

## Credits

- NMS Alphabet font by seontonppa (built with FontStruct), used with permission

## Licence

The code is MIT licensed (see `LICENSE`). Game names, icons and imagery belong to Hello Games and are not covered by that licence.

*An unofficial, fan-made project. Not affiliated with, sponsored by, or endorsed by Hello Games.*

Built by elegra1965.
