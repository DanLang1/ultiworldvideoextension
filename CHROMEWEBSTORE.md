# Chrome Web Store Submission Notes

Maintained per the guidance in "Build extensions with coding agents"
(https://developer.chrome.com/docs/extensions/ai/build-with-ai): every code change to
this extension should keep this file in sync, especially the permission justifications.

## Listing

- **Name:** Ultiworld Skip and Resume
- **Version:** 1.0
- **Manifest version:** 3
- **Category:** Productivity
- **Summary:** Set a custom skip duration for video playback and resume videos where you
  left off. Works on ultiworld.com. Not affiliated with Ultiworld.

## Naming & trademark

- The item name intentionally includes "Ultiworld" to make the target site clear. This is
  a known risk: Chrome Web Store can reject or remove extensions that use a third-party
  trademark in the name without authorization. Accepted knowingly.
- To reduce the risk, the listing keeps an explicit "not affiliated with Ultiworld"
  disclaimer, uses no Ultiworld logo/icon/branding, and never claims affiliation or
  endorsement.
- If flagged, the fallback is a brand-neutral name (for example "Custom Video Skip &
  Resume") with "ultiworld.com" only in the description.

## Single purpose

Customize playback of videos on Ultiworld (ultiworld.com): change the skip/rewind
amount used by the left/right arrow keys, and remember/resume the playback position for
videos you have watched.

Single-purpose statement rationale: all functionality relates solely to controlling
playback of the site's own video player on the user's machine.

## Permissions justification

| Permission | Type | Why it is needed |
| --- | --- | --- |
| `storage` | API permission | Persists the user's skip duration and "resume" preference (`chrome.storage.sync`) and the saved playback positions per video (`chrome.storage.local`). No data leaves the user's browser. |

There are no other API permissions. No `tabs`, `scripting`, `webRequest`, network
access, or remote code.

## Host permissions justification

| Host | Why it is needed |
| --- | --- |
| `*://*.ultiworld.com/*` | Content script (`content.js`) must run on Ultiworld pages to read/adjust the site's `<mux-player>` player, capture the skip hotkeys, and save/restore the playback position. `*.ultiworld.com` covers `www` and other subdomains. This is the only site the extension supports. |

The same host is used in `content_scripts[].matches`. No optional hosts are requested.

## Content scripts

- `content.js` runs on `*://*.ultiworld.com/*` (default `document_idle`, main frame only).
- It is registered statically in `manifest.json`; no dynamic injection or `scripting`
  permission is used.

## Popup

- `action.default_popup` = `popup.html`, a small settings UI (skip seconds, resume
  toggle) and a list of saved positions with delete/clear actions.

## Icons

- `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png` (own artwork: user's initials).
- Wired into `icons` (the action falls back to these). `icon128.png` is reused as the
  128x128 store listing icon. No third-party logos.

## Remote code

- **None.** All JavaScript is bundled in the extension package. No external scripts,
  `eval`, `new Function`, or remotely hosted code.

## Data usage / privacy

- **What is stored:** the user's skip duration and resume preference; and, per video, the
  playback timestamp, duration, title, page URL, and last-updated time.
- **Where it is stored:** locally in the browser only (`chrome.storage.sync` for settings,
  `chrome.storage.local` for positions).
- **Transmission:** no data is sent to the developer or any third party.
- **User control:** the popup lists saved positions and lets the user delete individual
  entries or clear all of them; disabling "Resume where I left off" stops new saves.
- **Permissions used for data:** only `storage`.

Data-usage disclosure for the store dashboard: the extension does not collect or
transmit user data; stored values remain on the user's device.

## Store compliance checklist

- [x] Minimal permissions requested (only `storage` + the single host).
- [x] Single, clearly stated purpose.
- [x] No remote code.
- [x] No user data transmitted off-device.
- [x] User-visible way to view/delete stored data.
