<div align="center">

# OSINT Mapping Tool

A small web app for organizing OSINT research. Jot down identifiers (social handles, phones, vehicles, whatever), pin places on a map (Google or OpenStreetMap), and wire the two together. Nothing leaves your browser.

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)](https://vitejs.dev)
[![License: GPL-3.0](https://img.shields.io/badge/license-%20%20GNU%20GPLv3%20-green)](LICENSE)
[![Local-first](https://img.shields.io/badge/Local--first-✓-success)](#privacy)

</div>

---

## Introduction
### How does the OSINT Mapping tool work?

The **Information tab** is a node graph. Each node is one piece of information: an Instagram account, a phone number, a license plate, a family member. Drag a handle to another node to wire them up. Drop the wire on empty space to spawn a new node already connected (Blender style); right-click does the same thing without dragging. Each type has its own form fields and a brand icon, and you can upload your own icons too.

The **Map tab** is click-to-pin. Drop a pin anywhere, and if the spot is a place the geocoder recognizes (a coffee shop, a school, a park), the name, address, and a fitting icon get filled in for you. There's a search bar for jumping to a place by name. Pins can be linked back to identifiers, so a coffee shop pin can carry "tagged here by @johndoe on March 14" with the relevant Instagram account attached. Pick **Google Maps** (richer POI data, needs an API key) or **OpenStreetMap** (no key, no signup) from the gear icon.

Everything saves out to a single `.osint.json` file you can stash anywhere, share, or version-control.

## Screenshots

![Information tab](./readme_images/Example1.png)
![Map tab](./readme_images/Example2.png)

<br>

<h2 align="center"> 🛠 Stack </h2>

<div align="center">

|Component |Tool |
|:---|:---|
| UI | React 18, Vite |
| Node graph | [`@xyflow/react`](https://reactflow.dev) |
| Maps | [`@vis.gl/react-google-maps`](https://visgl.github.io/react-google-maps/), [`leaflet`](https://leafletjs.com) + [`react-leaflet`](https://react-leaflet.js.org) |
| State | React Context (no Redux / no store libs) |
| Storage | Local JSON files (projects) + `localStorage` (settings, custom icons) |

</div>

<br>

<h2 align="center"> 🚀 Getting started </h2>

You'll need Node 18+ and npm.

```bash
git clone https://github.com/anonymousRAID/OSINT-Mapping-Tool
cd OSINT-Mapping-Tool
npm install
npm run dev
```

Then open <http://localhost:5173>.

To build a production bundle:

```bash
npm run build       # writes to ./dist
npm run preview     # serves ./dist on port 4173
```

<br>

## Setting up Google Maps (optional)

You only need this if you want Google Maps mode. If you'd rather skip Google Cloud entirely, jump to [OpenStreetMap mode](#openstreetmap-mode). Your key lives only in your browser and never gets committed or sent anywhere else.

In Google Cloud Console, pick or create a project and:

1. Under **APIs & Services → Library**, enable **Maps JavaScript API**, **Geocoding API**, and **Places API**. Maps JS is required; the other two power address auto-fill and place-type detection.
2. Under **APIs & Services → Credentials**, make an API key.
3. On that key, set **Application restrictions → HTTP referrers** and add `http://localhost:5173/*` for development. This is the only thing keeping the key safe if it ever leaks.
4. Optional: create a **Map ID** under Maps Management → Map Styles for custom styling. Without one you'll see a console warning but the app still works.

Two ways to feed the key to the app:

**In-app:** Paste it into the Map tab's setup screen and click Save. It goes into `localStorage`. If you already proceeded without one, the gear icon at the top left opens the same settings.

**Config file:** Copy the template:

```bash
cp public/app.config.example.json public/app.config.json
```

Then fill in your values:

```json
{
  "googleMaps": {
    "apiKey": "AIzaSyD…",
    "mapId": "abc123def456…"
  }
}
```

`public/app.config.json` is gitignored, so even if you push commits it won't leak.

If both are set, `localStorage` wins. Clear it from the gear icon to fall back to the file.

## OpenStreetMap mode

Don't feel like dealing with Google Cloud? Open the Map tab's settings (gear icon) and switch the provider to **OpenStreetMap**. Tiles come from openstreetmap.org and search/reverse-geocoding runs through Nominatim. No key, no signup, it's free. POI detection is coarser than Google's, and the per-pin info card doesn't have live place details (rating, hours, etc.) — everything else works the same.

## Saving, opening, and the "Continue recent" list

Click **Save** in the top-right and the project downloads as `<name>.osint.json`. Click **Open Project** on the landing screen to read one back. The format is plain JSON with a schema version, so old files keep loading after upgrades.

While you're working, the app also takes a periodic snapshot to `localStorage`. If you accidentally hit the back arrow without saving (this has happened to me more than once), the project shows up under "Continue recent" on the landing screen with an "unsaved" badge. Pick it and you're back where you were. Up to 5 recent projects are kept per browser.

`.osint.json` is gitignored too, so dropping one in the repo folder won't end up in commits.

## Features in depth

### Information tab

Twenty built-in identifier types across Social, Contact, Personal, Vehicle, and Other, each with its own typed fields (Instagram: username, followers, posts, bio; Vehicle: make, model, year, color, owner; etc.).

Connections:
- Drag a handle from one node to another to wire them up.
- Drag to empty space to get a quick-add popup (this also auto-creates the wire to the new node).
- Right-click the canvas for the same popup without the wire.

Icons:
- Brand icons for common platforms (Instagram, Facebook, X/Twitter, YouTube, TikTok, LinkedIn, Snapchat, Discord, Telegram, Google, Spotify, WhatsApp).
- Upload your own. They get stored per-browser, so they're available across all projects on the same install.

Editing shortcuts (suppressed when you're typing in a field or a modal is open):
- `Ctrl/Cmd + Z` undo, `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y` redo. Up to 20 actions, kept in memory.
- `Ctrl/Cmd + C / V` to copy/paste selected nodes.
- `Ctrl/Cmd + D` to duplicate.
- `Del` or `Backspace` removes the selection (a node or an edge).

Multi-select with a marquee or `Shift+click`. Anything done to a multi-selection counts as one undo step.

### Map tab

Click anywhere to drop a pin. If the spot is a known place — a Google POI in Google mode, a Nominatim hit in OSM mode — the name, address, and a fitting icon get filled in. Otherwise you get coordinates and fill the rest in.

Ten built-in place icons (coffee, food, gym, home, movie, park, amusement park, school, shopping, clothes, library) with light and dark variants that swap with the theme. The icon and color are overridable per-pin.

Clicking a pin opens a card with your notes (visited date, who they were with, free-form notes), the identifiers linked to it, and a link out to the live map. In Google mode the card also shows whatever place details Google has on file (rating, opening hours, phone, website).

A "Connect pins" toggle in the sidebar draws a dashed line between pins in the order they were dropped. Line color is customizable.

### Cross-linking the two tabs

Pins can be linked to one or more identifiers, each link with a short note ("checked in on IG", "registered owner", "previous address"). Click an identifier chip in a pin's card to jump to the Info tab with that node highlighted. Hover an identifier in the Info-tab sidebar and the pins linked to it pulse on the map.

## Project layout

```
src/
  components/                 UI components (tabs, modals, pickers)
  context/                    ProjectContext, NodeHistoryContext, NavigationContext, …
  images/
    icons/                    place-type pin icons (light + dark)
    node_icons/               brand icons for identifiers
  styles/                     global + theme CSS
  utils/                      projectIO, customIcons, appConfig, recentProjects
  identifierTypes.js          identifier type registry + resolvers
  identifierIcons.js          identifier brand-icon registry
  mapIcons.js                 place-type icon registry + Google-types mapping
  pinColors.js                pin color palette
  App.jsx                     landing ↔ project view gate
  main.jsx                    provider stack + root render
public/
  app.config.example.json     template for your API key (committed)
  app.config.json             your real key (gitignored)
```

## Privacy

There's no backend and no analytics. In Google mode the only outbound calls are the tile/Places API requests the browser makes with your own key. In OpenStreetMap mode they go to openstreetmap.org for tiles and nominatim.openstreetmap.org for search — same requests you'd make using their sites directly.

Your settings and custom icon library live in `localStorage` on this browser. Project files (`*.osint.json`) live on whatever disk you saved them to. To wipe everything, clear site data for the origin you're running on and delete the `.osint.json` files.

The repo's `.gitignore` keeps `app.config.json` and `*.osint.json` out of commits, so accidentally working inside the cloned folder won't leak your key or your research.

## License

[GPL-3.0](LICENSE).

## Contributing

PRs welcome. The only hard rule is: don't add anything that ships data off the user's machine. No analytics, no remote sync, no third-party tracking. If you're not sure whether something crosses that line, open an issue first.

<br>
<div text-align="left">
  <p>
    <img src="https://cryptologos.cc/logos/ethereum-eth-logo.svg" height="20px">
    &nbsp;&nbsp;&nbsp;0x59bFD011AaAeA85AF644A574a11836673CAcfCD4
  </p>
  <p>
    <img src="https://cryptologos.cc/logos/litecoin-ltc-logo.svg" width="20">
    &nbsp;&nbsp;LYxKNT7TAWZAM96Vz2HRxyUmvZbqEqiofe
  </p>
</div>
