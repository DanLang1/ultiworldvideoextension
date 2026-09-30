# Ultiworld Skip and Resume

Simple vibe coded chrome extension to allow adjusting video skip/seek durations.
10s was annoying for me, so you can adjust it to whatever you want, just click on the extension. It also solves the issue of having to click into the video player to jump back and forth.

Also added automated timestamp saving so if you close the tab and reload it should come back about where you left off (within ~30s or so).

Not affiliated with Ultiworld.

## Features

- **Custom skip duration** — the left/right arrow keys skip by a configurable
  number of seconds (default 5) instead of the site default of 10.
- **Resume playback** — remembers your position per video and jumps back to it
  when you reopen the page.
- **Saved positions** — view and manage saved positions from the popup,
  including removing individual entries or clearing all of them.

## Install (unpacked)

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.

After changing any file, click the reload icon on the extension card, then
hard-refresh (`Ctrl+Shift+R`) the video tab so the new content script loads.

## Usage

- Set the skip duration and toggle resume in the extension popup.
- Use `←` / `→` to rewind / fast-forward by the configured amount.

## Files

| File                         | Purpose                                                       |
| ---------------------------- | ------------------------------------------------------------- |
| `manifest.json`              | Extension manifest (MV3): icons, permissions, content script. |
| `content.js`                 | Runs on ultiworld.com: hotkeys, seek, save/resume progress.   |
| `popup.html` / `popup.js`    | Settings and saved-positions UI.                              |
| `icon16.png` … `icon128.png` | Extension icons.                                              |
| `CHROMEWEBSTORE.md`          | Store listing notes and permission justifications.            |

## Permissions

- **`storage`** — saves your preferences and playback positions locally.
- **`*://*.ultiworld.com/*`** — required to run on Ultiworld pages.

No data leaves your browser.

## Development notes

- The player is a Mux `<mux-player>`. Its controls and `<video>` live inside
  several nested shadow roots, so the content script walks shadow roots to find
  them (`deepQuery`).
- Playback positions are stored in `chrome.storage.local` under
  `progress:<videoId>`; settings live in `chrome.storage.sync`.
