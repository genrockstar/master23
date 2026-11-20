# Gen Artz — Windows app

Plan content, write video hooks, schedule posts, track progress, and generate images, video, voice and music with Higgsfield models.

## Build the Windows app (one time)

1. Install **Node.js LTS** from https://nodejs.org (accept the defaults).
2. Unzip this folder anywhere, for example `Documents\GenArtz`.
3. Double-click **`Build Gen Artz.bat`**. The first run downloads Electron, so it takes a few minutes.
4. When it finishes, the `dist` folder opens with:
   - `Gen Artz Setup 1.0.0.exe`: the installer (adds Start menu and desktop shortcuts)
   - `GenArtz-Portable-1.0.0.exe`: runs without installing

Windows SmartScreen may warn the first time because the app isn't code-signed. Click **More info → Run anyway**.

To try it without building, double-click **`Run Gen Artz (dev).bat`**.

## Connect Higgsfield

1. Create an API key at https://console.higgsfield.ai (it has a key ID and a secret, and the secret is shown only once).
2. In Gen Artz, go to **Settings → Higgsfield connection**, paste both, and click **Save key**. The key is encrypted with Windows data protection and stays in the app's main process. The page never sees it.
3. In **Studio**, pick a model and paste its **API endpoint** (from that model's API page in the console). It's saved per model. Soul 2.0 is pre-filled (`higgsfield-ai/soul/v2/standard`).
4. Write a prompt and click **Generate** (or press **Ctrl+Enter**). Jobs are polled every 5 seconds, and finished media lands in the **Library**.

Notes:
- The API is billed from your API balance at console.higgsfield.ai, separately from your higgsfield.ai plan credits.
- Request field names follow Higgsfield's model catalog (`prompt`, `aspect_ratio`, `resolution`, `duration`, `image_references`…). If a model's API page names a field differently, add or override it under **Advanced → Extra JSON**.
- Models marked **Game only** (Inworld TTS, Sonilo Music, Mirelo SFX) are limited to Higgsfield's game pipeline.

## Your data

Everything (ideas, hooks, posts, queue, library links, settings) is stored locally on this PC. Use **Settings → Export backup** to move it or keep a copy. Library items are links to files hosted by the provider, so download anything you want to keep.

## Shortcuts

`Ctrl K` search everything · `Ctrl N` new idea · `Ctrl Enter` generate or save · `Esc` close

## Files

- `app/index.html`: the whole interface (the same file also runs in a browser)
- `main.js`: window, encrypted key storage, Higgsfield API calls
- `preload.js`: the safe bridge between the page and the app
- `package.json`: Electron and electron-builder config
