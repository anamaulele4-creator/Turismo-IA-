const V='tourist-ai-v3';const CORE=['./','./index.html','./styles.css','./i18n.js','./data.js','./app.js','./manifest.webmanifest','./icon.svg','./icon-192.png'];
const LIVE=['ntfy.sh','mymemory','er-api'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(LIVE.some(h=>u.hostname.includes(h)))return;
e.respondWith(caches.match(e.request).then(r=>{const net=fetch(e.request).then(res=>{if(res.ok||res.type==='opaque'){const cp=res.clone();caches.open(V).then(c=>c.put(e.request,cp))}return res}).catch(()=>r);return r||net}))});
