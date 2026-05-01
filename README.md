# Instagram Follower Analyzer

**See who doesn't follow you back - paste in console, done.**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](tsconfig.json)
[![Preact](https://img.shields.io/badge/Preact-10-purple.svg)](https://preactjs.com)

<!-- TODO: add screenshot -->

---

## How it works

1. Go to [instagram.com](https://instagram.com) and log in
2. Open the browser console and paste the code
3. Click **SCAN** in the floating panel

---

## Features

- See who doesn't follow you back
- See who you don't follow back
- Mutual followers view
- Bulk unfollow with configurable delays and anti-ban cooldowns
- Whitelist to protect accounts from accidental unfollows
- Snapshot history - save and compare scans over time
- Diff view between any two snapshots
- Export any list as CSV, TXT, or JSON
- Dark and light mode
- Draggable, minimizable floating panel
- Runs entirely in the browser - no server, no tracking

---

## Usage - Desktop

1. Go to [instagram.com](https://instagram.com) and log in
2. Open the browser developer console:
   - **Windows/Linux**: `F12` or `Ctrl+Shift+J` (Chrome) / `Ctrl+Shift+K` (Firefox)
   - **Mac**: `Cmd+Option+J` (Chrome) / `Cmd+Option+K` (Firefox)
3. Click the **Console** tab
4. Visit the [landing page](https://santiagolevii.github.io/instagram-follower-analyzer/), click **COPY CODE**
5. Paste into the console and press `Enter`
6. A floating panel appears in the top-right corner
7. Click **SCAN** and wait for it to complete

Re-pasting the script toggles the panel's visibility.

---

## Usage - Bookmarklet

1. Visit the [landing page](https://santiagolevii.github.io/instagram-follower-analyzer/)
2. Drag the **IFA Bookmarklet** link to your bookmarks bar
3. Navigate to instagram.com while logged in
4. Click the bookmarklet in your bookmarks bar

---

## Anti-Ban Protection

Cooldowns are mandatory. Sliders in Settings can only increase values above the minimums.

| Action | Delay | Mandatory cooldown |
|--------|-------|--------------------|
| Scan requests | 800-1500ms (random) | 10s every 10 requests |
| Unfollows | 3000ms default | 15s every 10 unfollows |
| HTTP 429 (scan) | Exponential backoff from 60s | - |
| HTTP 429 (unfollow) | 120s pause | - |

---

## Snapshots and Tracking

Save a snapshot after each scan from the Dashboard. Later scans show:
- New followers (not in snapshot, in current)
- Lost followers (in snapshot, not in current)
- New following / stopped following

Compare any two snapshots via the Snapshots tab.

---

## Whitelist

Click the star icon on any user to whitelist them. Whitelisted users:
- Are never included in "Select All"
- Cannot be selected for bulk unfollow
- Show a gold star badge

Export/import the whitelist as JSON from Settings.

---

## Bulk Unfollow

Select users in the "Not Following Back", "Mutuals", or "Following" tabs and click **Unfollow Selected**. For more than 5 users, a time estimate is shown before confirming.

Progress is shown in real time. Whitelisted users are always skipped.

---

## Privacy and Safety

- All data stays in your browser (localStorage)
- No passwords, no tokens sent anywhere
- Nothing happens without your explicit action
- Only uses Instagram's own internal API with your existing session

---

## Development

```bash
git clone https://github.com/SantiagoLevii/instagram-follower-analyzer
cd instagram-follower-analyzer
npm install
npm run build   # outputs docs/dist.js + updates docs/index.html
npm run dev     # webpack --watch
```

Output: `docs/dist.js` - a single self-contained file.

---

## How it works (technical)

Uses Instagram's internal mobile API (`/api/v1/friendships/`) with the session cookies already present in your browser. No authentication bypass - it works because you're already logged in. The `ds_user_id` cookie provides your user ID, and `csrftoken` authorizes write operations.

---

## Disclaimer

Not affiliated with Instagram or Meta. Use at your own risk. Automating Instagram actions may violate their Terms of Service. The built-in cooldowns reduce risk, but cannot guarantee your account won't be affected.

---

## License

MIT - see [LICENSE](LICENSE)
