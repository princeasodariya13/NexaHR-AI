# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flow >> should login as admin and land on dashboard, then logout
- Location: e2e\auth.spec.ts:4:7

# Error details

```
Error: page.waitForURL: net::ERR_ABORTED; maybe frame was detached?
=========================== logs ===========================
waiting for navigation to "/dashboard/admin" until "load"
============================================================
```

```
Error: browserContext.close: Test ended.
Browser logs:

<launching> C:\Users\Prince\AppData\Local\ms-playwright\chromium_headless_shell-1228\chrome-headless-shell-win64\chrome-headless-shell.exe --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=C:\Users\Prince\AppData\Local\Temp\playwright_chromiumdev_profile-hj2ZXA --remote-debugging-pipe --no-startup-window
<launched> pid=23280
[pid=23280][err] [0707/001739.662:INFO:CONSOLE:2478] "%cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_1ybzpk2._.js (2478)
[pid=23280][err] [0707/001739.867:INFO:CONSOLE:2478] "[HMR] connected", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_1ybzpk2._.js (2478)
[pid=23280][err] [0707/001740.154:INFO:CONSOLE:2478] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_1ybzpk2._.js (2478)
[pid=23280][err] [0707/001740.600:INFO:CONSOLE:2478] "[Fast Refresh] done in 554ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_1ybzpk2._.js (2478)
[pid=23280][err] [0707/001740.759:INFO:CONSOLE:2478] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_1ybzpk2._.js (2478)
[pid=23280][err] [0707/001741.301:INFO:CONSOLE:2478] "[Fast Refresh] done in 643ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_1ybzpk2._.js (2478)
[pid=23280][err] [0707/001745.176:INFO:CONSOLE:2478] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_1ybzpk2._.js (2478)
```