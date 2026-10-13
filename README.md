# StudyMate AI — Free-first MVP

বাংলাদেশের SSC/HSC/JSC শিক্ষার্থীদের জন্য একটি মোবাইল-ফ্রেন্ডলি PWA starter project।

## Included
- বাংলা/English study chat UI
- Optional Gemini API integration
- Browser speech recognition + text-to-speech (browser/device support dependent)
- YouTube class search: direct YouTube search without a key; embedded results with YouTube Data API key
- Local notes saved in the current browser
- PWA manifest and service worker

## Run locally
PWA service worker and installation require localhost or HTTPS. From this folder run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

On Android, for a quick UI test you can open `index.html`, but PWA install works properly when served over localhost/HTTPS. To test on a phone and computer on the same Wi-Fi, run:

```bash
python -m http.server 8000 --bind 0.0.0.0
```

Find your computer's local IP and open `http://YOUR-COMPUTER-IP:8000` on the phone. This LAN method may not allow PWA install because it is not HTTPS.

## Enable Gemini AI (optional)
1. Visit https://aistudio.google.com/ and check whether free API access is available for your account/region.
2. Create an API key.
3. In the app, open AI Chat → AI সেটআপ and paste the key.
4. Keep the key private. This starter stores the key in browser localStorage and sends it from the browser. **This is only for personal/local testing, not a public deployment.** Anyone with access to that browser can inspect it. For a public app, move API calls to a backend and apply authentication, quotas and abuse controls.
5. Model IDs and free availability may change; update Model ID in settings if needed.

## Enable YouTube API results (optional)
1. In https://console.cloud.google.com/ create/select a project.
2. Enable YouTube Data API v3.
3. Create an API key and restrict it to YouTube Data API v3 and your deployed website/referrers where possible.
4. Add it in Class Search → API key settings.
5. If you do not add a key, the app opens a normal YouTube search page instead.

## Deploy free (PWA)
You need a static host with HTTPS. For example, GitHub Pages:
1. Create a GitHub repository.
2. Upload the files and `icons/` folder.
3. Enable Pages in repository Settings → Pages.
4. Open the HTTPS URL; use browser menu → Install app / Add to Home screen.

Check the host's current free-plan terms before publishing.

## Limitations
- JSC curriculum may be outdated/discontinued in Bangladesh; this app includes JSC as a user-selectable search label, not as a claim about current exam policy.
- Voice features vary by browser, OS and installed voices; test Bangla on target devices.
- Notes and API keys are local to one browser/device and are not synced between friends.
- No login, shared group database, payments, analytics or backend included.
- API use can be subject to quotas and provider terms; "free" does not mean unlimited.
