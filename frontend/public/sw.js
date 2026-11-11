// Makes the app installable in Chrome/Android ("Install app"). Pages always load fresh from the network;
// with no signal, a short message shows instead of the browser's error page (unsent attendance stays saved on the phone).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(fetch(e.request).catch(() => new Response(
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title>' +
    '<body style="font:17px/1.5 system-ui,sans-serif;text-align:center;padding:20vh 24px;background:#f5f5f7;color:#1d1d1f">' +
    '<h1 style="font-size:22px">No internet connection</h1><p>Please check your signal and try again.</p>' +
    '<p dir="rtl" lang="ur">انٹرنیٹ کنکشن نہیں ہے۔ سگنل چیک کر کے دوبارہ کوشش کریں۔</p>' +
    '<button onclick="location.reload()" style="font:inherit;padding:10px 20px;border-radius:12px;border:0;background:#0071e3;color:#fff">Try again</button>',
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  )));
});
