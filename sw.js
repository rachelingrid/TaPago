// Tá Pago — service worker: funciona offline, recebe arquivos compartilhados e avisa contas a vencer.
const APP = 'tapago-app-v2';
const LIB = 'tapago-lib-v1';
const ARQ_APP = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];
const ARQ_LIB = ['lib/jsQR.js', 'lib/pdf.min.js', 'lib/pdf.worker.min.js', 'lib/tesseract.min.js', 'lib/worker.min.js', 'lib/tesseract-core-lstm.wasm.js', 'lib/por.traineddata.gz'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    await (await caches.open(APP)).addAll(ARQ_APP);
    const lib = await caches.open(LIB);   // bibliotecas grandes: baixa sem travar a instalação
    await Promise.all(ARQ_LIB.map(async u => { if (!(await lib.match(u))) await lib.add(u).catch(() => {}); }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== APP && k !== LIB).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (req.method === 'POST' && url.pathname.endsWith('/compartilhar')) { e.respondWith(receberCompartilhado(req)); return; }
  if (req.method !== 'GET') return;
  const ehLib = url.pathname.includes('/lib/');
  e.respondWith((async () => {
    const c = await caches.open(ehLib ? LIB : APP);
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit && ehLib) return hit;                       // bibliotecas não mudam
    const rede = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(rede); return hit; }
    const r = await rede;
    return r || (req.mode === 'navigate' ? (await caches.open(APP)).match('./index.html') : Response.error());
  })());
});

/* ---------- banco local (mesmo do app) ---------- */
function abrirDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('contas', 2);
    r.onupgradeneeded = () => { const d = r.result; for (const s of ['fotos', 'kv', 'entrada']) if (!d.objectStoreNames.contains(s)) d.createObjectStore(s); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
const op = (db, store, modo, fn) => new Promise((res, rej) => { const t = db.transaction(store, modo); const q = fn(t.objectStore(store)); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); });
const kvGet = (db, k) => op(db, 'kv', 'readonly', o => o.get(k));
const kvPut = (db, k, v) => op(db, 'kv', 'readwrite', o => o.put(v, k));

/* ---------- compartilhar do WhatsApp / e-mail / galeria ---------- */
async function receberCompartilhado(req) {
  try {
    const fd = await req.formData(), files = fd.getAll('arquivos').filter(f => f && f.size);
    const db = await abrirDB();
    for (const f of files) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      await op(db, 'entrada', 'readwrite', o => o.put({ id, nome: f.name || 'compartilhado', tipo: f.type, blob: f, status: 'novo', criado: Date.now() }, id));
    }
    (await self.clients.matchAll({ type: 'window' })).forEach(c => c.postMessage('entrada'));
  } catch (e) {}
  return Response.redirect('./?entrada=1', 303);
}

/* ---------- lembretes ---------- */
const pad = n => String(n).padStart(2, '0');
const hoje = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const dias = (a, b) => { const p = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }; return Math.round((p(b) - p(a)) / 864e5); };
const brl = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const br = s => s.slice(8, 10) + '/' + s.slice(5, 7);

async function verificar() {
  const db = await abrirDB();
  const pagos = ((await kvGet(db, 'pagosNotif')) || []).map(p => p.id);
  const pend = ((await kvGet(db, 'pendentes')) || []).filter(p => !pagos.includes(p.id));
  const cfg = (await kvGet(db, 'cfg')) || { ant: 3, ritual: 0 };
  const notif = (await kvGet(db, 'notificados')) || {};
  const h = hoje();
  let urg = 0;
  for (const p of pend) {
    const d = dias(h, p.venc);
    if (d <= Math.min(cfg.ant, 1)) urg++;
    if (d > cfg.ant || notif[p.id] === h) continue;
    const t = d < 0 ? `⚠️ Vencida há ${-d} dia(s): ${p.nome}` : d === 0 ? `⏰ Vence HOJE: ${p.nome}` : d === 1 ? `Vence amanhã: ${p.nome}` : `Vence em ${d} dias: ${p.nome}`;
    await self.registration.showNotification(t, {
      body: `${brl(p.valor)} · vencimento ${br(p.venc)}`, tag: p.id, icon: 'icon-192.png', badge: 'icon-192.png',
      requireInteraction: d <= 0, renotify: true, vibrate: d <= 0 ? [200, 100, 200, 100, 200] : [120], data: { id: p.id },
      actions: [{ action: 'pago', title: '✓ Tá pago' }, { action: 'abrir', title: 'Abrir' }]
    });
    notif[p.id] = h;
  }
  // revisão semanal
  if (cfg.ritual >= 0 && new Date().getDay() === cfg.ritual && notif.__ritual !== h) {
    const sem = pend.filter(p => dias(h, p.venc) <= 7);
    const tot = sem.reduce((s, p) => s + p.valor, 0);
    await self.registration.showNotification('Revisão da semana 🗓', { body: sem.length ? `${sem.length} conta(s) até ${br(addD(h, 7))}: ${brl(tot)}. Toque para revisar.` : 'Nenhuma conta nos próximos 7 dias. Aproveite para fotografar boletos novos.', tag: 'ritual', icon: 'icon-192.png' });
    notif.__ritual = h;
  }
  await kvPut(db, 'notificados', notif);
  try { urg ? await self.navigator.setAppBadge?.(urg) : await self.navigator.clearAppBadge?.(); } catch (e) {}
}
function addD(s, n) { const [y, m, d] = s.split('-').map(Number); const x = new Date(y, m - 1, d + n); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); }

self.addEventListener('periodicsync', e => { if (e.tag === 'contas-check') e.waitUntil(verificar()); });
self.addEventListener('message', e => { if (e.data === 'verificar') e.waitUntil(verificar()); });
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    if (e.action === 'pago' && e.notification.data?.id) {
      const db = await abrirDB(); const l = (await kvGet(db, 'pagosNotif')) || [];
      l.push({ id: e.notification.data.id, pag: hoje() }); await kvPut(db, 'pagosNotif', l);
      const ws = await clients.matchAll({ type: 'window', includeUncontrolled: true }); ws.forEach(w => w.postMessage('pagos'));
      await verificar();
      return;
    }
    const ws = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of ws) if ('focus' in w) return w.focus();
    return clients.openWindow('./');
  })());
});
