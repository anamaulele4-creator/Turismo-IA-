// Tourist AI — aplicação (funciona offline, dados no dispositivo)
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => Math.round(n).toLocaleString('pt-PT');
const CAT = { destino:'Destino', hotel:'Alojamento', restaurante:'Restaurante', atividade:'Atividade', guia:'Guia turístico', transporte:'Transporte' };
const CAT_ICON = { destino:'globe', hotel:'bed', restaurante:'food', atividade:'wave', guia:'flag', transporte:'car' };
const CAT_COLOR = { destino:'#12345a', hotel:'#15966a', restaurante:'#ff9f43', atividade:'#0878d1', guia:'#e0565b', transporte:'#8e44ad' };
const ico = (n, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const heart = on => ico('heart', on ? 'on' : '');
const destName = id => (DESTINATIONS.find(d => d.id === id) || {}).name || id;

/* ---------- Armazenamento ---------- */
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('tai_' + k)) ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem('tai_' + k, JSON.stringify(v)); }
};
const db = {
  user: () => store.get('user', null),
  favs: () => store.get('favs', []),
  trips: () => store.get('trips', []),
  biz: () => store.get('biz', []),
  stats: () => store.get('stats', {}),
  chat: () => store.get('chat', []),
  remote: () => store.get('remote', {}),
  convs: () => store.get('convs', {})
};
function bump(id, field) { const s = db.stats(); s[id] = s[id] || { views:0, leads:0 }; s[id][field]++; store.set('stats', s); }

/* ---------- Dados combinados ---------- */
function allItems() {
  const d = DESTINATIONS.map(x => ({ ...x, category:'destino', place:x.id }));
  const mine = db.biz(), ids = new Set(mine.map(x => x.id));
  const b = [...mine.map(x => ({ ...x, partner:true, own:true })), ...Object.values(db.remote()).filter(x => !ids.has(x.id) && Date.now() - x.seen < 30 * 864e5).map(x => ({ ...x, partner:true }))];
  return [...d, ...b, ...PLACES];
}
const findItem = id => allItems().find(x => x.id === id);

/* ---------- Cartões ---------- */
function card(x) {
  const fav = db.favs().includes(x.id);
  const tag = x.category === 'destino' ? x.type : `${CAT[x.category]} · ${destName(x.place)}`;
  const img = x.img || IMG.guide;
  return `<article class="card">
    ${x.partner ? '<span class="badge">Parceiro</span>' : ''}
    <button class="fav" data-fav="${esc(x.id)}" aria-label="Favorito">${heart(fav)}</button>
    <img src="${esc(img)}" alt="${esc(x.name)}" loading="lazy">
    <div class="cardbody"><span class="tag">${esc(tag)}</span><h3 data-nm>${esc(x.name)}</h3><p class="muted">${esc(x.desc)}</p>${x.services && x.services.length ? `<p class="small svcmini">${ico('check')} <span>${x.services.length} serviço(s):</span> ${x.services.slice(0, 3).map(id => `<span>${esc(svcName(id))}</span>`).join(', ')}${x.services.length > 3 ? '…' : ''}</p>` : ''}
    <div class="row"><span class="price">${esc(x.price || (x.category === 'destino' ? x.region : ''))}</span><button class="secondary" data-open="${esc(x.id)}">Ver detalhes</button></div></div></article>`;
}
const empty = msg => `<div class="panel" style="grid-column:1/-1">${msg}</div>`;

/* ---------- Navegação (hash) ---------- */
function go(id) { if (location.hash !== '#' + id) location.hash = id; else show(id); }
function show(id) {
  if (!document.getElementById(id) || !document.getElementById(id).classList.contains('page')) id = 'home';
  $$('.page').forEach(p => p.classList.toggle('active', p.id === id));
  $$('.bottomnav button').forEach(b => b.classList.toggle('on', b.dataset.page === id));
  window.scrollTo({ top:0 });
  ({ mensagens:renderInbox, guias:renderGuides, mapa:initMap, favoritos:renderFavs, parceiro:renderPartner, conta:renderAccount, roteiros:renderTrips, info:renderFx, assistente:renderChat }[id] || (()=>{}))();
}
window.addEventListener('hashchange', () => show(location.hash.slice(1)));
document.addEventListener('click', e => {
  const p = e.target.closest('[data-page]'); if (p) { e.preventDefault(); go(p.dataset.page); }
  const f = e.target.closest('[data-fav]'); if (f) toggleFav(f.dataset.fav);
  const o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); openDetail(o.dataset.open); }
  if (e.target.id === 'modal' || e.target.closest('.close')) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function toast(msg) { const t = $('#toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(t._t); t._t = setTimeout(() => t.style.display = 'none', 3200); }

/* ---------- Render das listas ---------- */
function placeOptions(withAll) {
  return (withAll ? '<option value="todos">Todas</option>' : '') + DESTINATIONS.map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join('');
}
function renderLists() {
  const items = allItems();
  $('#homeDestinations').innerHTML = DESTINATIONS.slice(0, 6).map(d => card({ ...d, category:'destino' })).join('');
  $('#homePlaces').innerHTML = [...items.filter(x => x.partner), ...PLACES.filter(p => ['hotel','restaurante'].includes(p.category))].slice(0, 6).map(card).join('');
  renderDestinations(); renderGuides();
  ['hotel','restaurante','atividade','transporte'].forEach(cat => {
    const inp = $(`.filterInput[data-cat="${cat}"]`), sel = $(`.filterPlace[data-cat="${cat}"]`);
    const q = (inp ? inp.value : '').trim().toLowerCase(), pl = sel ? sel.value : 'todos';
    const list = items.filter(x => x.category === cat && (pl === 'todos' || x.place === pl) && (!q || (x.name + ' ' + x.desc + ' ' + destName(x.place)).toLowerCase().includes(q)));
    if (!$('#list-' + cat)) return;
    $('#list-' + cat).innerHTML = list.length ? list.map(card).join('') : empty('Ainda não há resultados aqui. Tens um negócio nesta zona? <a href="#parceiro">Publica-o grátis</a>.');
  });
}
let destRegion = 'Todos';
function renderDestinations() {
  const regions = ['Todos', ...new Set(DESTINATIONS.map(d => d.region))];
  $('#destChips').innerHTML = regions.map(r => `<button class="chip ${r === destRegion ? 'on' : ''}" data-region="${r}">${r}</button>`).join('');
  $('#allDestinations').innerHTML = DESTINATIONS.filter(d => destRegion === 'Todos' || d.region === destRegion).map(d => card({ ...d, category:'destino' })).join('');
}
$('#destChips').addEventListener('click', e => { const c = e.target.closest('[data-region]'); if (c) { destRegion = c.dataset.region; renderDestinations(); } });
$$('.filterPlace').forEach(s => { s.innerHTML = placeOptions(true); s.onchange = renderLists; });
$$('.filterInput').forEach(i => i.oninput = renderLists);

/* ---------- Pesquisa ---------- */
function search() {
  const q = $('#mainSearch').value.trim().toLowerCase(), cat = $('#mainCategory').value;
  const words = q.split(/\s+/).filter(Boolean);
  const res = allItems().filter(x => (cat === 'todos' || x.category === cat) &&
    words.every(w => (x.name + ' ' + x.desc + ' ' + destName(x.place) + ' ' + (x.type || '') + ' ' + CAT[x.category] + ' ' + (x.activities || []).join(' ')).toLowerCase().includes(w)));
  $('#searchSummary').textContent = `${res.length} resultado(s)${q ? ` para “${q}”` : ''}`;
  $('#searchResults').innerHTML = res.length ? res.map(card).join('') : empty('Nada encontrado. Experimenta “praia”, “Maputo”, “mergulho” ou “marisco”.');
  go('pesquisa');
}
$('#searchBtn').onclick = search;
$('#mainSearch').addEventListener('keydown', e => { if (e.key === 'Enter') search(); });

/* ---------- Favoritos ---------- */
function toggleFav(id) {
  let f = db.favs(); const on = f.includes(id);
  f = on ? f.filter(x => x !== id) : [...f, id]; store.set('favs', f);
  toast(on ? 'Removido dos favoritos' : 'Guardado nos favoritos');
  renderLists(); if ($('#favoritos').classList.contains('active')) renderFavs();
  $$(`[data-fav="${CSS.escape(id)}"]`).forEach(b => b.innerHTML = heart(!on) + (b.classList.contains('fav') ? '' : (on ? ' Guardar' : ' Guardado')));
}
function renderFavs() {
  const items = db.favs().map(findItem).filter(Boolean);
  $('#favList').innerHTML = items.length ? items.map(card).join('') : empty('Ainda não guardaste nada. Toca no coração de um cartão para o guardar aqui.');
}

/* ---------- Detalhe ---------- */
function mapsLink(x) {
  const q = x.category === 'destino' ? x.name + ', Moçambique' : `${x.name}, ${destName(x.place)}, Moçambique`;
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
}
function directionsLink(x) { return `https://www.google.com/maps/dir/?api=1&destination=${x.lat},${x.lng}`; }
const waNumber = p => String(p || '').replace(/[^\d]/g, '').replace(/^0+/, '').replace(/^(8\d{8})$/, '258$1');
function openDetail(id) {
  const x = findItem(id); if (!x) return;
  if (x.partner) bump(x.id, 'views');
  const near = x.category === 'destino' ? allItems().filter(p => p.place === x.id && p.category !== 'destino') : [];
  let html = `<img src="${esc(x.img || IMG.guide)}" alt=""><div class="modalbody"><button class="close" aria-label="Fechar">${ico('close')}</button>
    <span class="tag">${ico(CAT_ICON[x.category])} ${esc(CAT[x.category])}${x.category !== 'destino' ? ' · ' + esc(destName(x.place)) : ' · ' + esc(x.region)}</span>
    <h2 style="margin:10px 0 6px" data-nm>${esc(x.name)}</h2><p>${esc(x.desc)}</p>`;
  if (x.price) html += `<p><b>Preço:</b> ${esc(x.price)}</p>`;
  if (x.season) html += `<p><b>Melhor época:</b> ${esc(x.season)}</p>`;
  if (x.services && x.services.length) html += `<p><b>Serviços:</b></p><div class="chips">${x.services.map(id => `<span class="chip static">${ico(svcIcon(id))} ${esc(svcName(id))}</span>`).join('')}</div>`;
  if (x.langs) html += `<p><b>Línguas:</b> ${esc(x.langs)}</p>`;
  if (x.activities) html += `<p><b>O que fazer:</b></p><ul>${x.activities.slice(0, 6).map(a => `<li>${esc(a)}</li>`).join('')}</ul>`;
  if (near.length) html += `<p><b>Aqui perto:</b> ${near.map(n => `<a href="#" data-open="${esc(n.id)}">${esc(n.name)}</a>`).join(' · ')}</p>`;
  html += `<div class="actions">`;
  if (x.partner && !x.own) html += `<button class="primary" data-negotiate="${esc(x.id)}">${ico('chat')} Negociar no chat</button>`;
  if (x.own) html += `<span class="pill">Este é o teu negócio</span>`;
  if (x.phone) html += `<a class="wa" target="_blank" rel="noopener" data-lead="${esc(x.id)}" href="https://wa.me/${waNumber(x.phone)}?text=${encodeURIComponent(`Olá! Vi o ${x.name} no Tourist AI e gostaria de mais informações.`)}">${ico('phone')} WhatsApp</a>`;
  html += `<a class="secondary" target="_blank" rel="noopener" href="${mapsLink(x)}">${ico('search')} Ver no Google Maps</a>`;
  if (x.lat) html += `<a class="secondary" target="_blank" rel="noopener" href="${directionsLink(x)}">${ico('route')} Como chegar</a>`;
  if (x.category === 'destino') html += `<button class="primary" data-plan="${esc(x.id)}">Criar roteiro aqui</button>`;
  html += `<button class="secondary" data-fav="${esc(x.id)}">${heart(db.favs().includes(x.id))} ${db.favs().includes(x.id) ? 'Guardado' : 'Guardar'}</button><button class="secondary" data-share="${esc(x.id)}">${ico('share')} Partilhar</button></div>`;
  if (!x.partner && x.category !== 'destino') html += `<p class="muted small" style="margin-top:12px">Informação indicativa. Confirma preços e horários com o estabelecimento.</p>`;
  html += `</div>`;
  $('#modalbox').innerHTML = html; $('#modal').classList.add('open');
}
function closeModal() { $('#modal').classList.remove('open'); }
$('#modalbox').addEventListener('click', e => {
  const l = e.target.closest('[data-lead]'); if (l) bump(l.dataset.lead, 'leads');
  const ng = e.target.closest('[data-negotiate]'); if (ng) { closeModal(); startConvWithBiz(ng.dataset.negotiate); }
  const p = e.target.closest('[data-plan]'); if (p) { closeModal(); $('#tripDestination').value = p.dataset.plan; go('roteiros'); }
  const s = e.target.closest('[data-share]'); if (s) { const x = findItem(s.dataset.share); share(x.name, `${x.name} — ${x.desc}\n${mapsLink(x)}`); }
  if (e.target.closest('[data-open]')) e.preventDefault();
});
async function share(title, text) {
  if (navigator.share) { try { await navigator.share({ title, text }); return; } catch { return; } }
  try { await navigator.clipboard.writeText(text); toast('Copiado — cola onde quiseres.'); } catch { window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank'); }
}

/* ---------- Mapa ---------- */
let map, layers = {}, mapCat = 'todos', meMarker;
function initMap() {
  if (!window.L) { setTimeout(initMap, 300); return; }
  if (!map) {
    map = L.map('map', { scrollWheelZoom:false }).setView([-19.5, 35.0], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:18, attribution:'© OpenStreetMap' }).addTo(map);
    $('#mapChips').innerHTML = ['todos', ...Object.keys(CAT)].map(c => `<button class="chip ${c === mapCat ? 'on' : ''}" data-mapcat="${c}">${c === 'todos' ? 'Tudo' : ico(CAT_ICON[c]) + ' ' + CAT[c]}</button>`).join('');
    $('#mapChips').onclick = e => { const c = e.target.closest('[data-mapcat]'); if (!c) return; mapCat = c.dataset.mapcat; $$('#mapChips .chip').forEach(b => b.classList.toggle('on', b === c)); drawMarkers(); };
  }
  drawMarkers(); setTimeout(() => map.invalidateSize(), 150);
}
function drawMarkers() {
  if (layers.g) layers.g.remove();
  layers.g = L.layerGroup().addTo(map);
  allItems().filter(x => x.lat && (mapCat === 'todos' || x.category === mapCat)).forEach(x => {
    const icon = L.divIcon({ className:'', html:`<div class="mpin" style="background:${CAT_COLOR[x.category]}">${ico(CAT_ICON[x.category])}</div>`, iconSize:[30,30], iconAnchor:[15,15] });
    L.marker([x.lat, x.lng], { icon }).addTo(layers.g).bindPopup(`<b>${esc(x.name)}</b><br>${esc(CAT[x.category])}<br><a href="#" data-open="${esc(x.id)}">Ver detalhes</a>`);
  });
}
$('#map').addEventListener('click', e => { const o = e.target.closest('[data-open]'); if (o) e.preventDefault(); });
$('#locateBtn').onclick = () => {
  if (!navigator.geolocation) return toast('Localização não disponível neste dispositivo.');
  navigator.geolocation.getCurrentPosition(p => {
    const ll = [p.coords.latitude, p.coords.longitude];
    if (meMarker) meMarker.remove();
    meMarker = L.circleMarker(ll, { radius:9, color:'#0878d1', fillOpacity:.8 }).addTo(map).bindPopup('Estás aqui').openPopup();
    map.setView(ll, 12);
  }, () => toast('Não foi possível obter a localização. Verifica as permissões.'));
};

/* ---------- Gerador de roteiros ---------- */
function tierFor(daily) { return daily >= 20000 ? 'luxo' : daily >= 6500 ? 'medio' : 'economico'; }
const STYLE_EXTRA = {
  'Família':'Escolhe atividades curtas e com sombra; reserva tempo livre à tarde.',
  'Aventura':'Reserva mergulho, surf ou safari com antecedência — vagas esgotam na época alta.',
  'Económica':'Come em mercados e barracas locais e usa chapas para trajetos curtos.',
  'Romântica':'Guarda o fim de tarde para o pôr do sol e um jantar à beira-mar.',
  'Natureza e safari':'Saídas ao amanhecer são as melhores para ver animais.',
  'Praia e cultura':'Alterna manhãs culturais com tardes de praia.'
};
function buildItinerary(destId, days, budget, style) {
  const d = DESTINATIONS.find(x => x.id === destId) || DESTINATIONS[0];
  const daily = budget / days, tierKey = tierFor(daily), t = COST_TIERS[tierKey];
  const need = t.stay + t.food + t.transport + t.activities;
  const acts = d.activities, plan = [];
  for (let i = 0; i < days; i++) {
    const a = k => acts[(i * 3 + k) % acts.length];
    plan.push({ day:i + 1, morning: i === 0 ? 'Chegada, check-in e reconhecimento da zona' : a(0), afternoon: a(1), evening: i === days - 1 ? 'Jantar de despedida e preparar regresso' : a(2) });
  }
  const scale = Math.min(1, daily / need);
  const breakdown = { Alojamento:t.stay * scale * days, Alimentação:t.food * scale * days, Transporte:t.transport * scale * days, Atividades:t.activities * scale * days };
  const reserve = Math.max(0, budget - Object.values(breakdown).reduce((a, b) => a + b, 0));
  const trip = { id:'t' + Date.now() + Math.floor(Math.random()*1000), dest:d.id, destName:d.name, days, budget, style, tier:t.label, need, daily, plan, breakdown, reserve, tip:STYLE_EXTRA[style] || '', season:d.season, created:new Date().toISOString() };
  const g = store.get('gen', []); g.unshift(trip); store.set('gen', g.slice(0, 15));
  return trip;
}
function itineraryHTML(t, saved) {
  const colors = ['#0878d1','#ff9f43','#15966a','#8e44ad','#c7d3e0'];
  const parts = [...Object.entries(t.breakdown), ['Reserva', t.reserve]];
  const warn = t.daily < t.need * 0.75 ? `<div class="notice" style="margin:10px 0">O orçamento está apertado para ${esc(t.destName)}: um nível ${esc(t.tier.toLowerCase())} costuma rondar ${fmt(t.need)} MT por dia por pessoa. Considera menos dias ou opções mais económicas.</div>` : '';
  return `<div class="panel" style="margin-top:18px"><span class="tag">ROTEIRO · NÍVEL ${esc(t.tier.toUpperCase())}</span>
    <h3 style="margin:10px 0 4px">${esc(t.destName)} · ${t.days} dia(s)</h3>
    <p class="muted">Estilo: ${esc(t.style)} · Orçamento: ${fmt(t.budget)} MT · ${fmt(t.daily)} MT/dia · Melhor época: ${esc(t.season)}</p>${warn}
    <div class="budgetbar">${parts.map(([k, v], i) => `<span style="width:${(v / t.budget * 100) || 0}%;background:${colors[i]}" title="${k}"></span>`).join('')}</div>
    <p class="small">${parts.map(([k, v], i) => `<span style="color:${colors[i]}">●</span> ${k}: ${fmt(v)} MT`).join(' &nbsp; ')}</p>
    <div class="list">${t.plan.map(p => `<div class="listitem"><div><strong>Dia ${p.day}</strong><div class="muted"><b>Manhã:</b> ${esc(p.morning)}<br><b>Tarde:</b> ${esc(p.afternoon)}<br><b>Noite:</b> ${esc(p.evening)}</div></div></div>`).join('')}</div>
    ${t.tip ? `<p><b>Dica:</b> ${esc(t.tip)}</p>` : ''}
    <p class="muted small">Custos são estimativas por pessoa, sem voos. Confirma preços e horários antes de reservar.</p>
    <div class="actions no-print">${saved ? '' : `<button class="primary" data-savetrip="${t.id}">${ico('save')} Guardar</button>`}<button class="secondary" data-sharetrip="${t.id}">${ico('share')} Partilhar</button><button class="wa" data-watrip="${t.id}">${ico('phone')} WhatsApp</button><button class="secondary" data-print>${ico('print')} Imprimir / PDF</button></div></div>`;
}
let lastTrip = null;
$('#tripDestination').innerHTML = placeOptions(false);
$('#itineraryForm').onsubmit = e => {
  e.preventDefault();
  lastTrip = buildItinerary($('#tripDestination').value, Math.max(1, Math.min(21, +$('#tripDays').value || 1)), Math.max(0, +$('#tripBudget').value || 0), $('#tripStyle').value);
  $('#itineraryResult').innerHTML = itineraryHTML(lastTrip, false);
  $('#itineraryResult').scrollIntoView({ behavior:'smooth' });
};
function tripText(t) { return `Roteiro Tourist AI — ${t.destName}, ${t.days} dia(s)\nOrçamento: ${fmt(t.budget)} MT\n\n` + t.plan.map(p => `Dia ${p.day}\n• ${p.morning}\n• ${p.afternoon}\n• ${p.evening}`).join('\n\n'); }
function getTrip(id) { return db.trips().find(t => t.id === id) || store.get('gen', []).find(t => t.id === id); }
document.addEventListener('click', e => {
  const s = e.target.closest('[data-savetrip]'); if (s) { const t = getTrip(s.dataset.savetrip); if (!t) return toast('Este roteiro já não está disponível. Gera um novo.'); store.set('trips', [t, ...db.trips().filter(x => x.id !== t.id)]); s.remove(); renderTrips(); toast('Roteiro guardado'); }
  const sh = e.target.closest('[data-sharetrip]'); if (sh) { const t = getTrip(sh.dataset.sharetrip); if (!t) return; share('Roteiro ' + t.destName, tripText(t)); }
  const w = e.target.closest('[data-watrip]'); if (w && getTrip(w.dataset.watrip)) window.open('https://wa.me/?text=' + encodeURIComponent(tripText(getTrip(w.dataset.watrip))), '_blank');
  const v = e.target.closest('[data-viewtrip]'); if (v) { const t = getTrip(v.dataset.viewtrip); $('#itineraryResult').innerHTML = itineraryHTML(t, true); $('#itineraryResult').scrollIntoView({ behavior:'smooth' }); }
  const dl = e.target.closest('[data-deltrip]'); if (dl && confirm('Apagar este roteiro?')) { store.set('trips', db.trips().filter(x => x.id !== dl.dataset.deltrip)); renderTrips(); }
});
function renderTrips() {
  const t = db.trips();
  $('#savedTrips').innerHTML = t.length ? t.map(x => `<div class="listitem"><div><strong>${esc(x.destName)} · ${x.days} dia(s)</strong><div class="muted small">${fmt(x.budget)} MT · ${esc(x.style)} · ${new Date(x.created).toLocaleDateString('pt-PT')}</div></div><div class="row"><button class="secondary" data-viewtrip="${x.id}">Abrir</button><button class="danger" data-deltrip="${x.id}">Apagar</button></div></div>`).join('') : '<p class="muted">Ainda não guardaste roteiros.</p>';
}

/* ---------- Assistente ---------- */
const SUGGESTIONS = ['3 dias em Maputo com 10000 MT', 'Onde ver tubarões-baleia?', 'Melhor praia para família', 'Safari em Moçambique', 'Quando é a melhor época?', 'Câmbio de 100 dólares'];
function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function findDest(msg) {
  const m = norm(msg);
  const alias = { 'ponta': 'pontadoouro', 'ilha de mocambique':'ilhamocambique', 'ibo':'quirimbas', 'pemba':'quirimbas', 'bazaruto':'bazaruto', 'gorongosa':'gorongosa', 'inhaca':'inhaca' };
  for (const [k, v] of Object.entries(alias)) if (m.includes(k)) return DESTINATIONS.find(d => d.id === v);
  return DESTINATIONS.find(d => m.includes(norm(d.name)));
}
function reply(msg) {
  msg = I18n.toPT(msg); const m = norm(msg);
  const dest = findDest(msg);
  const daysM = m.match(/(\d+)\s*(dias?|noites?)/), weekM = /semana/.test(m);
  const budM = m.replace(/(\d)[ .](\d{3})/g, '$1$2').match(/(\d{3,})\s*(mt|meticais|mzn)?/);
  const usdM = m.match(/(\d+)\s*(usd|dolar|dolares|\$)/), eurM = m.match(/(\d+)\s*(eur|euros?|€)/), zarM = m.match(/(\d+)\s*(zar|rand)/);
  if (/cambio|converter|quanto (e|vale)|taxa/.test(m) && (usdM || eurM || zarM)) {
    const [n, c] = usdM ? [+usdM[1], 'USD'] : eurM ? [+eurM[1], 'EUR'] : [+zarM[1], 'ZAR'];
    return `${n} ${c} ≈ <b>${fmt(n * FX[c])} MT</b> (taxa aproximada de ${FX[c]} MT). Nas casas de câmbio o valor pode variar um pouco.`;
  }
  if (dest && (daysM || weekM || budM)) {
    const days = daysM ? Math.min(21, +daysM[1]) : weekM ? 7 : 3;
    const budget = budM ? +budM[1] : days * 6000;
    const style = /famil|crianc/.test(m) ? 'Família' : /aventur|mergulh|surf/.test(m) ? 'Aventura' : /barat|economic/.test(m) ? 'Económica' : /romant|lua de mel|casal/.test(m) ? 'Romântica' : /safari|natureza|animais/.test(m) ? 'Natureza e safari' : 'Praia e cultura';
    lastTrip = buildItinerary(dest.id, days, budget, style);
    return `Aqui está um plano para <b>${esc(dest.name)}</b>, ${days} dia(s), ${fmt(budget)} MT (${esc(style.toLowerCase())}):<br><br>` +
      lastTrip.plan.map(p => `<b>Dia ${p.day}:</b> ${esc(p.morning)} · ${esc(p.afternoon)} · ${esc(p.evening)}`).join('<br>') +
      `<br><br>Nível estimado: <b>${esc(lastTrip.tier)}</b> (~${fmt(lastTrip.daily)} MT/dia).${lastTrip.daily < lastTrip.need * .75 ? ' Atenção: o orçamento está apertado para este destino.' : ''}<br><br><button class="primary" data-savetrip="${lastTrip.id}">${ico('save')} Guardar roteiro</button> <button class="wa" data-watrip="${lastTrip.id}">${ico('phone')} Enviar</button>`;
  }
  if (/tubarao|tubaroes|baleia|jamanta|manta/.test(m)) return `O melhor sítio é o <b>Tofo</b>, em Inhambane — tubarões-baleia todo o ano, com mais avistamentos de outubro a março, e jamantas no Manta Reef. <a href="#" data-open="tofo">Ver Tofo</a> · <a href="#" data-open="tofoscuba">Tofo Scuba</a>`;
  if (/golfinh/.test(m)) return `Vai à <b>Ponta do Ouro</b>, no extremo sul: há encontros responsáveis com golfinhos-roazes. <a href="#" data-open="dolphin">Dolphin Encounters</a>`;
  if (/safari|leao|leoes|elefante|animais|selvagem/.test(m)) return `O grande safari é o <b>Parque Nacional da Gorongosa</b>, no centro do país: leões, elefantes e o Lago Urema. Fica em Chitengo e faz o game drive ao amanhecer. Melhor de maio a novembro. <a href="#" data-open="gorongosa">Ver Gorongosa</a>`;
  if (/famil|crianc/.test(m)) return `Para família, recomendo a <b>Ilha de Inhaca</b> (águas calmas, perto de Maputo) ou <b>Vilankulo</b> (praias rasas e passeios de dhow). <a href="#" data-open="inhaca">Inhaca</a> · <a href="#" data-open="vilankulo">Vilankulo</a>`;
  if (/mergulh|snorkel|surf/.test(m)) return `Para mergulho: <b>Tofo</b> (jamantas e tubarões-baleia) e <b>Ponta do Ouro</b>. Para snorkel fácil: Two Mile Reef em <b>Bazaruto</b>. Surf: Tofinho e Ponta do Ouro.`;
  if (/epoca|quando|clima|chuva|tempo/.test(m)) return `A melhor altura é de <b>maio a novembro</b>: seco, menos calor e menos mosquitos. De dezembro a março é quente e chuvoso, mas é a época alta dos tubarões-baleia no Tofo.`;
  if (/historia|cultura|unesco|patrimonio/.test(m)) return `Para história, a <b>Ilha de Moçambique</b> (Património UNESCO) é imperdível. Em Maputo, vê a Fortaleza, a Estação dos CFM e a Baixa. <a href="#" data-open="ilhamocambique">Ver Ilha de Moçambique</a>`;
  if (/marisco|camarao|comer|restaurante|comida/.test(m)) return `Em Maputo, vai ao <b>Mercado do Peixe</b> (escolhes e grelham na hora) ou ao clássico <b>Costa do Sol</b> pelo camarão. Prova também matapa e frango à zambeziana. <a href="#" data-open="mercadopeixe">Mercado do Peixe</a> · <a href="#" data-open="costadosol">Costa do Sol</a>`;
  if (/hotel|dormir|alojamento|ficar/.test(m)) return dest ? `Em ${esc(dest.name)}: ${allItems().filter(x => x.category === 'hotel' && x.place === dest.id).map(x => `<a href="#" data-open="${esc(x.id)}">${esc(x.name)}</a>`).join(' · ') || 'ainda não tenho alojamento registado aqui — vê no Google Maps.'}` : `Diz-me a cidade e eu mostro opções. <a href="#hoteis">Ver alojamento</a>`;
  if (/seguran|perigo|segur/.test(m)) return `Em geral: evita andar com objetos de valor à vista, usa táxis combinados à noite e confirma as recomendações atuais do teu país, sobretudo para Cabo Delgado, no norte.`;
  if (/malaria|vacina|saude|mosquito/.test(m)) return `Há risco de malária em todo o país. Fala com um médico antes de viajar, usa repelente e dorme com rede.`;
  if (/transporte|chegar|voo|aviao|chapa|taxi/.test(m)) return `Entre cidades distantes, o mais prático é voar com a <b>LAM</b>. Para Ponta do Ouro ou Gorongosa, um 4x4 ajuda. Dentro das cidades, táxis (combina o preço antes) ou chapas. <a href="#transportes">Transportes</a>`;
  if (dest) return `<b>${esc(dest.name)}</b>: ${esc(dest.desc)}<br>Melhor época: ${esc(dest.season)}.<br>Diz-me quantos dias e o orçamento e eu faço o roteiro. Ex.: “${dest.days || 3} dias em ${esc(dest.name)} com 12000 MT”.`;
  if (/^(ola|oi|bom dia|boa tarde|boa noite|hello|hi)\b/.test(m)) return `Olá! Para onde queres ir? Diz-me o destino, os dias e o orçamento — por exemplo, “4 dias no Tofo com 15000 MT”.`;
  return `Posso ajudar com roteiros, praias, safaris, mergulho, comida, época ideal e câmbio. Experimenta: “5 dias em Vilankulo com 20000 MT” ou “onde ver golfinhos?”.`;
}
function renderChat() {
  let h = db.chat();
  if (!h.length) h = [{ r:'bot', t:'Olá! Sou o Tourist AI. Diz-me o destino, quantos dias tens e o teu orçamento, e monto-te um roteiro.' }];
  $('#chatbox').innerHTML = h.map(x => `<div class="bubble ${x.r === 'user' ? 'user' : ''}" ${x.r === 'user' ? 'translate="no"' : ''}>${x.r === 'user' ? esc(x.t) : x.t}</div>`).join('');
  $('#chatbox').scrollTop = 1e9;
  $('#chatSuggestions').innerHTML = SUGGESTIONS.map(s => `<button class="chip" data-suggest="${esc(s)}">${esc(s)}</button>`).join('');
}
function sendChat(msg) {
  const dl = I18n.detect(msg); if (dl && dl !== I18n.lang) I18n.setLang(dl);
  const h = db.chat(); h.push({ r:'user', t:msg }); h.push({ r:'bot', t:reply(msg) }); store.set('chat', h.slice(-40)); renderChat();
}
$('#chatForm').onsubmit = e => { e.preventDefault(); const v = $('#chatInput').value.trim(); if (v) { sendChat(v); $('#chatInput').value = ''; } };
$('#chatSuggestions').onclick = e => { const s = e.target.closest('[data-suggest]'); if (s) sendChat(s.dataset.suggest); };
$('#chatbox').addEventListener('click', e => { if (e.target.closest('[data-open]')) e.preventDefault(); });
$('#clearChat').onclick = () => { store.set('chat', []); renderChat(); };

/* ---------- Transporte ---------- */
$('#transportForm').onsubmit = e => {
  e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
  const when = f.when ? new Date(f.when).toLocaleString('pt-PT', { dateStyle:'short', timeStyle:'short' }) : '';
  const txt = `Olá! Pedido de transporte (via Tourist AI):\nDe: ${f.from}\nPara: ${f.to}\nData: ${when}\nPassageiros: ${f.pax}${f.notes ? '\nNotas: ' + f.notes : ''}\nQual seria o preço?`;
  window.open(`https://wa.me/${waNumber(f.phone)}?text=${encodeURIComponent(txt)}`, '_blank');
};

/* ---------- Parceiros ---------- */
$('#bizPlace').innerHTML = placeOptions(false);
$('#businessForm').onsubmit = e => {
  e.preventDefault(); if (!requireLogin('Entra na tua conta para publicar o negócio.')) return; const f = Object.fromEntries(new FormData(e.target));
  if (waNumber(f.phone).length < 9) return toast('Indica um número de WhatsApp válido, ex.: +258 84 000 0000');
  const d = DESTINATIONS.find(x => x.id === f.place);
  const jitter = () => (Math.random() - .5) * 0.01;
  const list = db.biz(); const user = db.user();
  f.services = $$('#bizServices input:checked').map(c => c.value);
  if (f.category !== 'guia') { delete f.langs; if (f.category !== 'atividade') f.services = []; }
  if (f.id) { const i = list.findIndex(x => x.id === f.id); if (i > -1) list[i] = { ...list[i], ...f }; toast('Negócio atualizado'); }
  else { list.unshift({ ...f, id:'b' + rid(), owner_dev:DEVICE, lat:d.lat + jitter(), lng:d.lng + jitter(), owner:user ? user.email : '', created:new Date().toISOString() }); toast('Publicado! Já aparece nas pesquisas e no mapa'); }
  store.set('biz', list); Live.announceMine(true); Live.connect(); resetBizForm(); renderLists(); renderPartner(); if (map) drawMarkers();
};
function resetBizForm() { const f = $('#businessForm'); f.reset(); toggleSvcFields(); f.elements.id.value = ''; $('#bizFormTitle').textContent = 'Publicar o meu negócio'; $('#cancelEdit').classList.add('hidden'); }
$('#cancelEdit').onclick = resetBizForm;
function renderPartner() {
  const list = db.biz(), st = db.stats(), favs = db.favs();
  $('#pListings').textContent = list.length;
  $('#pViews').textContent = list.reduce((a, b) => a + ((st[b.id] || {}).views || 0), 0);
  $('#pLeads').textContent = list.reduce((a, b) => a + ((st[b.id] || {}).leads || 0), 0);
  $('#pChats').textContent = Object.values(db.convs()).filter(c => c.role === 'negocio').length;
  $('#myListings').innerHTML = list.length ? list.map(b => `<div class="listitem"><div><strong>${esc(b.name)}</strong><div class="muted small">${esc(CAT[b.category])} · ${esc(destName(b.place))} · ${(st[b.id] || {}).views || 0} visualizações · ${(st[b.id] || {}).leads || 0} contactos</div></div><div class="row"><button class="secondary" data-open="${b.id}">Ver</button><button class="secondary" data-editbiz="${b.id}">Editar</button><button class="danger" data-delbiz="${b.id}">Apagar</button></div></div>`).join('') : '<p class="muted">Ainda não publicaste nenhum negócio.</p>';
}
$('#myListings').addEventListener('click', e => {
  const ed = e.target.closest('[data-editbiz]'), dl = e.target.closest('[data-delbiz]');
  if (ed) { const b = db.biz().find(x => x.id === ed.dataset.editbiz), f = $('#businessForm');
    ['id','name','category','place','phone','price','img','desc','langs'].forEach(k => f.elements[k].value = b[k] || ''); toggleSvcFields(); $$('#bizServices input').forEach(c => c.checked = (b.services || []).includes(c.value));
    $('#bizFormTitle').textContent = 'Editar negócio'; $('#cancelEdit').classList.remove('hidden'); f.scrollIntoView({ behavior:'smooth' }); }
  if (dl && confirm('Apagar este negócio?')) { Live.pub(TOPIC.dir, { k:'unbiz', id:dl.dataset.delbiz }); store.set('biz', db.biz().filter(x => x.id !== dl.dataset.delbiz)); renderLists(); renderPartner(); if (map) drawMarkers(); }
});

/* ---------- Conta ---------- */
function updateAccountBtn() { const u = db.user(); $('#accountBtn').innerHTML = u ? ico('user') + ' ' + esc(u.name.split(' ')[0]) : 'Entrar'; }
$('#exportBtn').onclick = () => {
  const data = {}; Object.keys(localStorage).filter(k => k.startsWith('tai_') && !['tai_gen','tai_session','tai_seen'].includes(k)).forEach(k => data[k] = localStorage.getItem(k));
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type:'application/json' }));
  a.download = 'tourist-ai-dados.json'; a.click();
};
$('#importFile').onchange = async e => {
  try { const data = JSON.parse(await e.target.files[0].text()); Object.entries(data).forEach(([k, v]) => k.startsWith('tai_') && k !== 'tai_session' && localStorage.setItem(k, v)); toast('Dados importados'); boot(); } catch { toast('Ficheiro inválido.'); }
};
$('#wipeBtn').onclick = () => { if (confirm('Apagar todos os teus dados deste dispositivo?')) { Object.keys(localStorage).filter(k => k.startsWith('tai_')).forEach(k => localStorage.removeItem(k)); boot(); toast('Dados apagados.'); } };

/* ---------- Câmbio ---------- */
async function loadFx() {
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/MZN'); const j = await r.json();
    if (j.result === 'success') { ['USD','EUR','ZAR'].forEach(c => FX[c] = +(1 / j.rates[c]).toFixed(2)); FX.updated = new Date(j.time_last_update_unix * 1000).toLocaleDateString('pt-PT'); store.set('fx', FX); }
  } catch { const s = store.get('fx', null); if (s) Object.assign(FX, s); }
  renderFx();
}
function renderFx() { const n = +$('#fxAmount').value || 0, c = $('#fxCur').value; $('#fxResult').textContent = `${fmt(n)} ${c} ≈ ${fmt(n * FX[c])} MT`; $('#fxNote').textContent = `Taxa: 1 ${c} = ${FX[c]} MT · atualizada: ${FX.updated}. Nas casas de câmbio pode variar.`; }
$('#fxAmount').oninput = renderFx; $('#fxCur').onchange = renderFx;

/* ---------- Guias e serviços ---------- */
const svc = id => GUIDE_SERVICES.find(s => s.id === id) || { id, name:id, icon:'flag', where:[] };
const svcName = id => svc(id).name, svcIcon = id => svc(id).icon;
const GROUPS = ['Todos', ...new Set(GUIDE_SERVICES.map(s => s.group))];
let svcGroup = 'Todos', guideFilter = '';
$('#svcPlace').innerHTML = '<option value="todos">Todos os destinos</option>' + placeOptions(false);
$('#svcPlace').onchange = renderGuides;
$('#bizServices').innerHTML = GUIDE_SERVICES.map(s => `<label class="check"><input type="checkbox" value="${s.id}"><span>${ico(s.icon)} ${esc(s.name)}</span></label>`).join('');
function toggleSvcFields() {
  const c = $('#businessForm').elements.category.value;
  $('#bizSvcWrap').classList.toggle('hidden', !['guia','atividade'].includes(c));
  $('#bizLangWrap').classList.toggle('hidden', c !== 'guia');
}
$('#businessForm').elements.category.onchange = toggleSvcFields;
function guidesFor(id) { return allItems().filter(x => x.partner && ['guia','atividade'].includes(x.category) && (x.services || []).includes(id)); }
function renderGuides() {
  if (!$('#svcList')) return;
  const pl = $('#svcPlace').value || 'todos';
  $('#svcChips').innerHTML = GROUPS.map(g => `<button class="chip ${g === svcGroup ? 'on' : ''}" data-svcgroup="${esc(g)}">${esc(g)}</button>`).join('');
  const list = GUIDE_SERVICES.filter(s => (svcGroup === 'Todos' || s.group === svcGroup) && (pl === 'todos' || s.where.includes(pl)));
  $('#svcList').innerHTML = list.length ? list.map(s => { const n = guidesFor(s.id).length; return `<article class="svc">
    <div class="svcicon">${ico(s.icon)}</div>
    <div class="svcbody"><span class="small muted">${esc(s.group)}</span><h3>${esc(s.name)}</h3><p class="muted">${esc(s.desc)}</p>
    <p class="small"><b>Onde:</b> ${s.where.map(w => `<span>${esc(destName(w))}</span>`).join(', ')}</p>
    <div class="row"><span class="price">${esc(s.price)}</span><div class="row">${n ? `<button class="secondary" data-svcguides="${s.id}">${n} guia(s)</button>` : ''}<button class="primary" data-reqsvc="${s.id}">Pedir orçamento</button></div></div></div></article>`; }).join('') : empty('Não há serviços deste tipo neste destino. Experimenta outro destino.');
  const g = allItems().filter(x => x.category === 'guia' || (x.partner && x.category === 'atividade' && (x.services || []).length)).filter(x => !guideFilter || (x.services || []).includes(guideFilter));
  $('#guideList').innerHTML = (guideFilter ? `<div style="grid-column:1/-1"><button class="chip on" data-svcguides="">${esc(svcName(guideFilter))} ${ico('close')}</button></div>` : '') +
    (g.length ? g.map(card).join('') : empty('Ainda não há guias parceiros publicados para isto. Publica um pedido no <a href="#mensagens" data-mtabgo="pedidos">Mural de pedidos</a> e os guias respondem com propostas.'));
}
$('#guias').addEventListener('click', e => {
  const g = e.target.closest('[data-svcgroup]'); if (g) { svcGroup = g.dataset.svcgroup; renderGuides(); }
  const r = e.target.closest('[data-reqsvc]'); if (r) openRequestForm(r.dataset.reqsvc, $('#svcPlace').value);
  const sg = e.target.closest('[data-svcguides]'); if (sg) { guideFilter = sg.dataset.svcguides; renderGuides(); if (guideFilter) $('#guideList').scrollIntoView({ behavior:'smooth' }); }
  const mt = e.target.closest('[data-mtabgo]'); if (mt) { e.preventDefault(); openRequestForm('', $('#svcPlace').value); }
});

/* ---------- Tempo real (ntfy.sh) ---------- */
const NTFY = 'https://ntfy.sh/', NS = 'tai-mz-v1-';
function rid() { const a = new Uint8Array(10); crypto.getRandomValues(a); return Array.from(a, b => (b % 36).toString(36)).join(''); }
const DEVICE = store.get('dev', null) || (() => { const d = rid(); store.set('dev', d); return d; })();
const TOPIC = { dir:NS + 'dir', req:NS + 'pedidos', me:NS + 'u-' + DEVICE, biz:id => NS + 'in-' + id, conv:id => NS + 'c-' + id };
function myName() {
  const u = db.user(); if (u && u.name) return u.name;
  let n = store.get('nick', ''); if (n) return n;
  n = (prompt('Como te chamas? O nome aparece para quem negociar contigo.') || '').trim().slice(0, 40);
  if (n) store.set('nick', n); return n;
}
function saveConvs(c) { store.set('convs', c); updateUnread(); }
const Live = {
  es:null, key:'', seen:new Set(store.get('seen', [])), timer:null,
  topics() { return [TOPIC.dir, TOPIC.req, TOPIC.me, ...db.biz().map(b => TOPIC.biz(b.id)), ...Object.keys(db.convs()).map(TOPIC.conv)]; },
  async pub(topic, obj) {
    try { const r = await fetch(NTFY + topic, { method:'POST', body:JSON.stringify({ ...obj, dev:DEVICE, at:Date.now() }) }); return r.ok; } catch { return false; }
  },
  connect() {
    if (typeof EventSource === 'undefined' || typeof fetch === 'undefined') return setLive(false);
    const key = this.topics().join(',');
    if (key === this.key && this.es && this.es.readyState !== 2) return;
    this.key = key; if (this.es) this.es.close();
    this.catchup(key);
    this.es = new EventSource(NTFY + key + '/sse');
    this.es.onopen = () => setLive(true);
    this.es.onerror = () => { setLive(false); if (this.es.readyState === 2) { clearTimeout(this.timer); this.timer = setTimeout(() => { this.key = ''; this.connect(); }, 5000); } };
    this.es.onmessage = e => { try { this.handle(JSON.parse(e.data)); } catch {} };
  },
  async catchup(key) {
    try { const r = await fetch(NTFY + key + '/json?poll=1&since=12h'); const t = await r.text();
      t.split('\n').filter(Boolean).forEach(l => { try { this.handle(JSON.parse(l), true); } catch {} }); setLive(true);
    } catch { setLive(false); }
  },
  handle(m, quiet) {
    if (m.event !== 'message' || this.seen.has(m.id)) return;
    this.seen.add(m.id); store.set('seen', [...this.seen].slice(-1500));
    let d; try { d = JSON.parse(m.message); } catch { return; }
    if (!d || d.dev === DEVICE) return;
    const at = (m.time || 0) * 1000;
    if (m.topic === TOPIC.dir) {
      const r = db.remote();
      if (d.k === 'biz' && d.biz && d.biz.id) r[d.biz.id] = { ...d.biz, seen:at, dev:d.dev };
      if (d.k === 'unbiz' && r[d.id] && r[d.id].dev === d.dev) delete r[d.id];
      store.set('remote', r); later(() => { renderLists(); if (map) drawMarkers(); });
    } else if (m.topic === TOPIC.req) {
      const r = store.get('reqs', {});
      if (d.k === 'req' && d.req) r[d.req.id] = { ...d.req, dev:d.dev, time:at };
      if (d.k === 'unreq' && r[d.id] && r[d.id].dev === d.dev) delete r[d.id];
      store.set('reqs', r); later(renderRequests);
    } else if (d.k === 'conv' && d.conv && d.conv.id) {
      const c = db.convs(); if (c[d.conv.id]) return;
      const asBiz = m.topic !== TOPIC.me;
      c[d.conv.id] = { id:d.conv.id, role:asBiz ? 'negocio' : 'cliente', itemId:d.conv.itemId, itemName:d.conv.itemName, bizId:asBiz ? m.topic.slice((NS + 'in-').length) : d.conv.itemId,
        peer:d.conv.fromName || 'Visitante', phone:d.conv.phone || '', topic:d.conv.title || '', msgs:[], status:'aberta', updated:at, unread:1 };
      saveConvs(c); this.connect(); notify('Nova negociação', `${c[d.conv.id].peer}: ${d.conv.itemName || ''}`, quiet); later(renderInbox);
    } else if (m.topic.startsWith(NS + 'c-')) {
      const id = m.topic.slice((NS + 'c-').length), c = db.convs(), cv = c[id]; if (!cv) return;
      if (cv.msgs.some(x => x.id === m.id)) return;
      cv.msgs.push({ id:m.id, from:'peer', k:d.k, text:String(d.text || '').slice(0, 1000), amount:+d.amount || 0, at });
      cv.msgs.sort((a, b) => a.at - b.at);
      applyStatus(cv); cv.updated = Math.max(cv.updated || 0, at);
      if (!(curConv === id && $('#mensagens').classList.contains('active') && !document.hidden)) cv.unread = (cv.unread || 0) + 1;
      saveConvs(c); notify(cv.peer, d.k === 'offer' ? `Proposta: ${fmt(d.amount)} MT` : d.k === 'accept' ? 'Aceitou a proposta' : String(d.text || ''), quiet);
      later(renderInbox);
    }
  },
  announceMine(force) {
    if (!force && Date.now() - store.get('annAt', 0) < 6 * 36e5) return;
    store.set('annAt', Date.now());
    db.biz().forEach(b => { const { owner, ...pub } = b; this.pub(TOPIC.dir, { k:'biz', biz:pub }); });
  }
};
let laterT = {}; function later(fn) { clearTimeout(laterT[fn.name]); laterT[fn.name] = setTimeout(fn, 120); }
function setLive(on) { const l = $('#liveState'); if (l) { l.textContent = on ? 'Ligado' : 'Sem ligação'; l.classList.toggle('off', !on); } }
function notify(title, body, quiet) {
  if (quiet) return; if (!$('#mensagens').classList.contains('active')) toast(`${title}: ${body}`.slice(0, 90));
  try { if (document.hidden && 'Notification' in window && Notification.permission === 'granted') new Notification(title, { body, icon:'icon-192.png' }); } catch {}
}
function updateUnread() {
  const n = Object.values(db.convs()).reduce((a, c) => a + (c.unread || 0), 0);
  $$('[data-unread]').forEach(b => { b.textContent = n; b.classList.toggle('hidden', !n); });
  document.title = (n ? `(${n}) ` : '') + 'Tourist AI — Descobre. Explora. Vive.';
}
function applyStatus(cv) {
  const last = [...cv.msgs].reverse().find(x => ['offer','accept','reject'].includes(x.k));
  cv.status = last && last.k === 'accept' ? 'fechada' : 'aberta';
  cv.deal = last && last.k === 'accept' ? last.amount : 0;
}

/* ---------- Conversas ---------- */
let curConv = null;
function startConvWithBiz(id) {
  const x = findItem(id); if (!x) return;
  if (!requireLogin('Entra na tua conta para negociar.')) return;
  const name = myName(); if (!name) return toast('Indica o teu nome para começar a negociar.');
  const c = db.convs();
  let cv = Object.values(c).find(v => v.role === 'cliente' && v.itemId === x.id);
  if (!cv) {
    cv = { id:rid(), role:'cliente', itemId:x.id, itemName:x.name, peer:x.name, phone:x.phone || '', msgs:[], status:'aberta', updated:Date.now(), unread:0 };
    c[cv.id] = cv; saveConvs(c); Live.connect();
    Live.pub(TOPIC.biz(x.id), { k:'conv', conv:{ id:cv.id, itemId:x.id, itemName:x.name, fromName:name } }).then(() =>
      sendMsg(cv.id, { k:'msg', text:`Olá! Sou ${name}. Tenho interesse em ${x.name}. Podemos falar sobre o preço?` }));
  }
  curConv = cv.id; go('mensagens'); setMtab('conversas'); renderInbox(); askNotify();
}
async function sendMsg(id, o) {
  const c = db.convs(), cv = c[id]; if (!cv) return;
  const msg = { id:'l' + rid(), from:'me', k:o.k, text:String(o.text || '').slice(0, 1000), amount:+o.amount || 0, at:Date.now(), sending:true };
  cv.msgs.push(msg); applyStatus(cv); cv.updated = msg.at; saveConvs(c); renderInbox();
  const ok = await Live.pub(TOPIC.conv(id), { k:msg.k, text:msg.text, amount:msg.amount });
  const c2 = db.convs(), m2 = c2[id] && c2[id].msgs.find(x => x.id === msg.id);
  if (m2) { delete m2.sending; if (!ok) m2.fail = true; saveConvs(c2); renderInbox(); }
  if (!ok) toast('Sem ligação. Toca na mensagem para reenviar.');
}
async function resend(id, mid) {
  const c = db.convs(), m = c[id].msgs.find(x => x.id === mid); if (!m) return;
  const ok = await Live.pub(TOPIC.conv(id), { k:m.k, text:m.text, amount:m.amount });
  if (ok) { delete m.fail; saveConvs(c); renderInbox(); } else toast('Ainda sem ligação.');
}
function askNotify() { try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch {} }
const hhmm = t => new Date(t).toLocaleTimeString('pt-PT', { hour:'2-digit', minute:'2-digit' });
const initials = n => esc(String(n || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase());
function convTitle(cv) { return cv.role === 'negocio' ? cv.peer : cv.itemName || cv.peer; }
function convSub(cv) { return cv.role === 'negocio' ? `Cliente · ${cv.itemName || ''}${cv.topic ? ' · ' + cv.topic : ''}` : `Negócio${cv.topic ? ' · ' + cv.topic : ''}`; }
function lastText(m) { if (!m) return 'Sem mensagens'; return m.k === 'offer' ? `Proposta: ${fmt(m.amount)} MT` : m.k === 'accept' ? `Acordo: ${fmt(m.amount)} MT` : m.k === 'reject' ? 'Proposta recusada' : m.text; }
function renderInbox() {
  if (!$('#convList')) return;
  const list = Object.values(db.convs()).sort((a, b) => b.updated - a.updated);
  $('#convList').innerHTML = list.length ? list.map(cv => { const lm = cv.msgs[cv.msgs.length - 1]; return `<button class="conv ${cv.id === curConv ? 'on' : ''}" data-conv="${cv.id}">
    <span class="avatar">${initials(convTitle(cv))}</span><span class="convtxt"><b data-nm>${esc(convTitle(cv))}</b><small translate="no">${esc(lastText(lm)).slice(0, 60)}</small></span>
    <span class="convmeta">${lm ? hhmm(lm.at) : ''}${cv.status === 'fechada' ? '<i class="ok">Acordo</i>' : ''}${cv.unread ? `<i class="nbadge">${cv.unread}</i>` : ''}</span></button>`; }).join('')
    : `<div class="emptyconv"><p><b>Ainda não tens negociações.</b></p><p class="muted small">Abre um guia ou negócio parceiro e toca em Negociar no chat, ou publica um pedido no mural.</p><button class="primary" data-page="guias">Ver serviços de guias</button></div>`;
  const cv = curConv && db.convs()[curConv];
  $('#mtab-conversas').classList.toggle('open', !!cv);
  if (!cv) { $('#convView').innerHTML = `<div class="emptychat">${ico('chat')}<p>Escolhe uma conversa para negociar.</p></div>`; return; }
  if (cv.unread && $('#mensagens').classList.contains('active')) { const c = db.convs(); c[cv.id].unread = 0; saveConvs(c); cv.unread = 0; }
  const lastOffer = [...cv.msgs].reverse().find(x => ['offer','accept','reject'].includes(x.k));
  const pending = lastOffer && lastOffer.k === 'offer' ? lastOffer : null;
  const body = cv.msgs.map(m => {
    const mine = m.from === 'me', st = m.fail ? '<em class="fail">Não enviada. Toca para reenviar</em>' : m.sending ? '<em>A enviar…</em>' : '';
    if (m.k === 'offer') return `<div class="msg ${mine ? 'me' : ''} offer" ${m.fail ? `data-resend="${m.id}"` : ''}><span class="small">${mine ? 'A tua proposta' : 'Proposta recebida'}</span><strong>${fmt(m.amount)} MT</strong>${m.text ? `<p>${esc(m.text)}</p>` : ''}
      ${pending === m && !mine ? `<div class="offerbtns"><button class="primary" data-accept="${m.amount}">${ico('check')} Aceitar</button><button class="secondary" data-counter>Contraproposta</button><button class="danger" data-reject="${m.amount}">Recusar</button></div>` : ''}
      ${pending === m && mine ? '<span class="small muted">À espera de resposta</span>' : ''}<time>${hhmm(m.at)}</time>${st}</div>`;
    if (m.k === 'accept' || m.k === 'reject') return `<div class="sysmsg ${m.k}" ${m.fail ? `data-resend="${m.id}"` : ''}>${m.k === 'accept' ? ico('check') + ` ${mine ? 'Aceitaste' : esc(cv.peer) + ' aceitou'} a proposta de <b>${fmt(m.amount)} MT</b>` : `${mine ? 'Recusaste' : esc(cv.peer) + ' recusou'} a proposta de ${fmt(m.amount)} MT`} · ${hhmm(m.at)}${st}</div>`;
    return `<div class="msg ${mine ? 'me' : ''}" ${m.fail ? `data-resend="${m.id}"` : ''}><p translate="no">${esc(m.text)}</p>${!mine && I18n.lang !== (I18n.detect(m.text) || I18n.lang) ? `<button class="trbtn" data-trmsg="${esc(m.text)}">Traduzir</button>` : ''}<time>${hhmm(m.at)}</time>${st}</div>`;
  }).join('');
  const deal = cv.status === 'fechada' ? `<div class="dealbar">${ico('check')} <span>Acordo fechado por <b>${fmt(cv.deal)} MT</b>. Combina o pagamento e os detalhes diretamente.</span>${cv.phone ? `<a class="wa" target="_blank" rel="noopener" href="https://wa.me/${waNumber(cv.phone)}?text=${encodeURIComponent(`Olá! Confirmo o acordo feito no Tourist AI para ${cv.itemName}: ${fmt(cv.deal)} MT.`)}">${ico('phone')} Confirmar</a>` : ''}</div>` : '';
  $('#convView').innerHTML = `<header class="convhead"><button class="iconbtn" data-convback aria-label="Voltar">${ico('left')}</button><span class="avatar">${initials(convTitle(cv))}</span><div><b>${esc(convTitle(cv))}</b><small>${esc(convSub(cv))}</small></div>
    ${cv.itemId && findItem(cv.itemId) ? `<button class="secondary small" data-open="${esc(cv.itemId)}">Ver perfil</button>` : ''}</header>
    ${deal}<div class="msgs" id="msgs">${body || '<p class="muted small center">Começa a conversa.</p>'}</div>
    <form class="offerbar hidden" id="offerBar"><span>${ico('tag')}</span><input type="number" min="1" name="amount" placeholder="Valor em MT" required><input name="text" maxlength="160" placeholder="Condições (opcional)"><button class="primary">Enviar proposta</button><button type="button" class="iconbtn" data-offerclose aria-label="Fechar">${ico('close')}</button></form>
    <form class="composer" id="composer"><button type="button" class="iconbtn tagbtn" data-offeropen title="Fazer proposta de preço">${ico('tag')}<span>Proposta</span></button><input name="text" autocomplete="off" maxlength="1000" placeholder="Escreve uma mensagem…"><button class="sendbtn" aria-label="Enviar">${ico('send')}</button></form>`;
  const ms = $('#msgs'); ms.scrollTop = ms.scrollHeight;
  $('#composer').onsubmit = e => { e.preventDefault(); const t = e.target.elements.text.value.trim(); if (!t) return; e.target.elements.text.value = ''; sendMsg(cv.id, { k:'msg', text:t }); setTimeout(() => { const i = $('#composer input'); if (i) i.focus(); }, 30); };
  $('#offerBar').onsubmit = e => { e.preventDefault(); const f = e.target.elements, a = Math.round(+f.amount.value); if (!(a > 0)) return; sendMsg(cv.id, { k:'offer', amount:a, text:f.text.value.trim() }); };
}
$('#mensagens').addEventListener('click', e => {
  const cvb = e.target.closest('[data-conv]'); if (cvb) { curConv = cvb.dataset.conv; renderInbox(); askNotify(); }
  if (e.target.closest('[data-convback]')) { curConv = null; renderInbox(); }
  if (e.target.closest('[data-offeropen]') || e.target.closest('[data-counter]')) { $('#offerBar').classList.remove('hidden'); $('#offerBar input').focus(); }
  if (e.target.closest('[data-offerclose]')) $('#offerBar').classList.add('hidden');
  const ac = e.target.closest('[data-accept]'); if (ac && confirm(`Aceitar a proposta de ${fmt(ac.dataset.accept)} MT?`)) sendMsg(curConv, { k:'accept', amount:+ac.dataset.accept });
  const rj = e.target.closest('[data-reject]'); if (rj) sendMsg(curConv, { k:'reject', amount:+rj.dataset.reject });
  const rs = e.target.closest('[data-resend]'); if (rs && e.target.closest('.fail')) resend(curConv, rs.dataset.resend);
  const tb = e.target.closest('[data-mtab]'); if (tb) setMtab(tb.dataset.mtab);
  const rr = e.target.closest('[data-replyreq]'); if (rr) replyToRequest(rr.dataset.replyreq);
  const dr = e.target.closest('[data-delreq]'); if (dr) { Live.pub(TOPIC.req, { k:'unreq', id:dr.dataset.delreq }); const r = store.get('reqs', {}); delete r[dr.dataset.delreq]; store.set('reqs', r); renderRequests(); }
});
function setMtab(t) {
  $$('[data-mtab]').forEach(b => b.classList.toggle('on', b.dataset.mtab === t));
  $('#mtab-conversas').classList.toggle('hidden', t !== 'conversas'); $('#mtab-pedidos').classList.toggle('hidden', t !== 'pedidos');
  if (t === 'pedidos') renderRequests();
}

/* ---------- Mural de pedidos ---------- */
$('#reqService').innerHTML = GUIDE_SERVICES.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('') + '<option value="outro">Outro serviço</option>';
$('#reqPlace').innerHTML = placeOptions(false);
function openRequestForm(svcId, place) {
  go('mensagens'); setMtab('pedidos');
  if (svcId) $('#reqService').value = svcId;
  if (place && place !== 'todos') $('#reqPlace').value = place;
  setTimeout(() => { const f = $('#reqForm'); if (f.scrollIntoView) f.scrollIntoView({ behavior:'smooth', block:'center' }); }, 60);
}
$('#reqForm').onsubmit = async e => {
  e.preventDefault(); if (!requireLogin('Entra na tua conta para publicar pedidos.')) return; const name = myName();
  const f = Object.fromEntries(new FormData(e.target));
  const req = { id:rid(), name, service:f.service, place:f.place, date:f.date, pax:+f.pax || 1, budget:+f.budget || 0, notes:String(f.notes || '').slice(0, 200) };
  const ok = await Live.pub(TOPIC.req, { k:'req', req });
  if (!ok) return toast('Sem ligação à internet. Tenta de novo quando estiveres online.');
  const r = store.get('reqs', {}); r[req.id] = { ...req, dev:DEVICE, time:Date.now() }; store.set('reqs', r);
  e.target.reset(); renderRequests(); toast('Pedido publicado. Vais receber as propostas em Conversas.'); askNotify();
};
function renderRequests() {
  if (!$('#reqList')) return;
  const r = store.get('reqs', {}), now = Date.now();
  Object.keys(r).forEach(k => { if (now - r[k].time > 12 * 36e5) delete r[k]; }); store.set('reqs', r);
  const list = Object.values(r).sort((a, b) => b.time - a.time), hasBiz = db.biz().length > 0;
  $('#reqList').innerHTML = list.length ? list.map(q => { const own = q.dev === DEVICE; return `<div class="reqcard">
    <div class="svcicon sm">${ico(svcIcon(q.service))}</div>
    <div style="flex:1"><b>${esc(q.service === 'outro' ? 'Outro serviço' : svcName(q.service))}</b> · ${esc(destName(q.place))}
    <div class="muted small">${esc(q.name)} · ${q.pax} pessoa(s)${q.date ? ' · ' + new Date(q.date).toLocaleDateString('pt-PT') : ''}${q.budget ? ' · orçamento ' + fmt(q.budget) + ' MT' : ''}</div>${q.notes ? `<div class="small">${esc(q.notes)}</div>` : ''}</div>
    ${own ? `<span class="pill">O teu pedido</span><button class="danger small" data-delreq="${q.id}">Remover</button>` : hasBiz ? `<button class="primary" data-replyreq="${q.id}">Enviar proposta</button>` : `<button class="secondary" data-page="parceiro">Sou guia</button>`}</div>`; }).join('')
    : '<div class="panel muted">Ainda não há pedidos no mural. Publica o primeiro.</div>';
}
function replyToRequest(id) {
  const q = store.get('reqs', {})[id]; if (!q || !requireLogin()) return;
  const mine = db.biz(); const biz = mine.find(b => (b.services || []).includes(q.service)) || mine.find(b => b.category === 'guia') || mine[0];
  const a = Math.round(+prompt(`Proposta de ${biz.name} para "${svcName(q.service)}" (${q.pax} pessoa(s)). Valor total em MT:`, q.budget || '')); if (!(a > 0)) return;
  const c = db.convs(), cid = rid();
  c[cid] = { id:cid, role:'negocio', itemId:biz.id, itemName:biz.name, bizId:biz.id, peer:q.name, topic:svcName(q.service), msgs:[], status:'aberta', updated:Date.now(), unread:0 };
  saveConvs(c); Live.connect();
  Live.pub(NS + 'u-' + q.dev, { k:'conv', conv:{ id:cid, itemId:biz.id, itemName:biz.name, fromName:biz.name, phone:biz.phone, title:svcName(q.service) } }).then(async () => {
    await sendMsg(cid, { k:'msg', text:`Olá ${q.name}! Vi o teu pedido de ${svcName(q.service)} em ${destName(q.place)}.` });
    sendMsg(cid, { k:'offer', amount:a, text:`${q.pax} pessoa(s)${q.date ? ', ' + new Date(q.date).toLocaleDateString('pt-PT') : ''}` });
  });
  curConv = cid; setMtab('conversas'); renderInbox();
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) { Live.connect(); if (curConv && $('#mensagens').classList.contains('active')) renderInbox(); } });
window.addEventListener('online', () => { Live.key = ''; Live.connect(); });

/* ---------- Conta segura ---------- */
const AUTH = { iter:310000, minLen:8, maxFails:5, lockMin:5, idleMin:30, rememberDays:7 };
const enc = new TextEncoder();
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function hashPw(pw, salt, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return b64(await crypto.subtle.deriveBits({ name:'PBKDF2', hash:'SHA-256', salt, iterations:iter }, key, 256));
}
function safeEq(a, b) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
const accounts = () => store.get('accounts', {});
function pwScore(p) { let s = 0; if (p.length >= 8) s++; if (p.length >= 12) s++; if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++; return Math.min(s, 4); }
function pwProblem(p, email) {
  if (p.length < AUTH.minLen) return `A palavra-passe precisa de pelo menos ${AUTH.minLen} caracteres.`;
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return 'Usa letras e números na palavra-passe.';
  if (email && email.split('@')[0].length >= 4 && p.toLowerCase().includes(email.split('@')[0].toLowerCase())) return 'A palavra-passe não pode conter o teu email.';
  if (/^(12345678|password|palavrapasse|qwerty123|abc12345)/i.test(p)) return 'Essa palavra-passe é demasiado comum.';
  return '';
}
const Session = {
  get() {
    let s = null; try { s = JSON.parse(sessionStorage.getItem('tai_session')) || store.get('session', null); } catch { s = store.get('session', null); }
    if (!s || !accounts()[s.email]) return null;
    const now = Date.now();
    if (now > s.exp || now - s.last > AUTH.idleMin * 6e4 && !s.remember) { this.end(); return null; }
    return s;
  },
  start(email, remember) {
    const s = { email, remember, last:Date.now(), exp:Date.now() + (remember ? AUTH.rememberDays * 864e5 : 12 * 36e5), token:rid() + rid() };
    if (remember) store.set('session', s); else { try { sessionStorage.setItem('tai_session', JSON.stringify(s)); } catch { store.set('session', s); } }
  },
  touch() { const s = this.get(); if (!s) return; s.last = Date.now(); if (s.remember) store.set('session', s); else try { sessionStorage.setItem('tai_session', JSON.stringify(s)); } catch {} },
  end() { localStorage.removeItem('tai_session'); try { sessionStorage.removeItem('tai_session'); } catch {} }
};
db.user = () => { const s = Session.get(); if (!s) return null; const a = accounts()[s.email]; return a ? { name:a.name, email:a.email, type:a.type, since:a.since } : null; };
['click','keydown','touchstart'].forEach(ev => document.addEventListener(ev, () => { clearTimeout(Session._t); Session._t = setTimeout(() => Session.touch(), 400); }, { passive:true }));
setInterval(() => { const had = !!store.get('_wasIn', false), now = !!db.user(); if (had && !now) { toast('Sessão terminada por inatividade. Entra de novo.'); updateAccountBtn(); if ($('#conta').classList.contains('active')) renderAccount(); } store.set('_wasIn', now); }, 30000);

async function register(f) {
  const email = String(f.email || '').trim().toLowerCase(), name = String(f.name || '').trim().slice(0, 60);
  if (!name) return 'Indica o teu nome.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return 'Email inválido.';
  const p = pwProblem(f.password, email); if (p) return p;
  if (f.password !== f.password2) return 'As palavras-passe não coincidem.';
  const acc = accounts(); if (acc[email]) return 'Já existe uma conta com este email neste dispositivo. Usa Entrar.';
  const salt = crypto.getRandomValues(new Uint8Array(16));
  acc[email] = { email, name, type:f.type || 'Turista', salt:b64(salt), iter:AUTH.iter, hash:await hashPw(f.password, salt, AUTH.iter), since:new Date().toISOString(), fails:0, lockUntil:0 };
  store.set('accounts', acc); Session.start(email, !!f.remember); return '';
}
async function login(f) {
  const email = String(f.email || '').trim().toLowerCase(), acc = accounts(), a = acc[email];
  const generic = 'Email ou palavra-passe incorretos.';
  if (!a) { await hashPw(String(f.password || ''), new Uint8Array(16), AUTH.iter); return generic; }
  if (a.lockUntil > Date.now()) return `Conta bloqueada por segurança. Tenta de novo daqui a ${Math.ceil((a.lockUntil - Date.now()) / 6e4)} min.`;
  const ok = safeEq(await hashPw(String(f.password || ''), unb64(a.salt), a.iter), a.hash);
  if (!ok) {
    a.fails = (a.fails || 0) + 1;
    if (a.fails >= AUTH.maxFails) { a.lockUntil = Date.now() + AUTH.lockMin * 6e4 * Math.pow(2, Math.floor(a.fails / AUTH.maxFails) - 1); store.set('accounts', acc); return `Demasiadas tentativas. Conta bloqueada durante ${Math.round((a.lockUntil - Date.now()) / 6e4)} min.`; }
    store.set('accounts', acc); return `${generic} Restam ${AUTH.maxFails - a.fails} tentativa(s).`;
  }
  a.fails = 0; a.lockUntil = 0; store.set('accounts', acc); Session.start(email, !!f.remember); return '';
}
async function verifyCurrent(pw) { const u = db.user(); if (!u) return false; const a = accounts()[u.email]; return safeEq(await hashPw(pw, unb64(a.salt), a.iter), a.hash); }
function requireLogin(msg) { if (db.user()) return true; toast(msg || 'Entra na tua conta para continuar.'); authMode = 'login'; go('conta'); return false; }

let authMode = 'login';
const pwField = (name, label, auto) => `<div class="field"><label>${label}</label><div class="pwbox"><input name="${name}" type="password" required autocomplete="${auto}" minlength="${name === 'password' && auto === 'current-password' ? 1 : AUTH.minLen}" maxlength="128"><button type="button" class="iconbtn" data-showpw aria-label="Mostrar palavra-passe">${ico('eye')}</button></div></div>`;
function renderAccount() {
  const u = db.user();
  if (u) {
    $('#accountPanel').innerHTML = `<div class="row" style="justify-content:flex-start;gap:14px"><span class="avatar lg">${initials(u.name)}</span><div><h3 style="margin:0">Olá, ${esc(u.name)}</h3><p class="muted" style="margin:2px 0 0">${esc(u.email)} · ${esc(u.type)}</p></div></div>
    <div class="secure">${ico('check')} Sessão protegida. A palavra-passe está guardada cifrada (PBKDF2-SHA256) e a sessão termina sozinha após ${AUTH.idleMin} min sem uso.</div>
    <div class="stats"><div class="stat"><strong>${db.favs().length}</strong><span>Favoritos</span></div><div class="stat"><strong>${db.trips().length}</strong><span>Roteiros</span></div><div class="stat"><strong>${db.biz().length}</strong><span>Negócios</span></div><div class="stat"><strong>${Object.keys(db.convs()).length}</strong><span>Negociações</span></div></div>
    <div class="actions"><button class="secondary" data-page="favoritos">${heart(true)} Favoritos</button><button class="secondary" data-page="roteiros">${ico('compass')} Roteiros</button><button class="secondary" data-page="mensagens">${ico('chat')} Mensagens</button><button class="secondary" id="chgPwBtn">Alterar palavra-passe</button><button class="danger" id="logoutBtn">${ico('logout')} Sair</button></div>
    <form id="chgPwForm" class="formgrid hidden" style="margin-top:16px">${pwField('old', 'Palavra-passe atual', 'current-password')}${pwField('password', 'Nova palavra-passe', 'new-password')}${pwField('password2', 'Repetir nova palavra-passe', 'new-password')}<div class="field" style="justify-content:flex-end"><button class="primary">Guardar</button></div><p class="formerr" id="chgErr"></p></form>
    <details class="danger-zone"><summary>Eliminar conta</summary><form id="delAccForm" class="row" style="margin-top:10px">${pwField('password', 'Confirma com a palavra-passe', 'current-password')}<button class="danger">Eliminar conta</button></form></details>`;
    $('#logoutBtn').onclick = () => { Session.end(); authMode = 'login'; updateAccountBtn(); renderAccount(); toast('Saíste da conta.'); };
    $('#chgPwBtn').onclick = () => $('#chgPwForm').classList.toggle('hidden');
    $('#chgPwForm').onsubmit = async e => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)), err = $('#chgErr');
      if (!await verifyCurrent(f.old)) return err.textContent = 'A palavra-passe atual está errada.';
      const p = pwProblem(f.password, u.email); if (p) return err.textContent = p; if (f.password !== f.password2) return err.textContent = 'As palavras-passe não coincidem.';
      const acc = accounts(), a = acc[u.email], salt = crypto.getRandomValues(new Uint8Array(16)); a.salt = b64(salt); a.iter = AUTH.iter; a.hash = await hashPw(f.password, salt, AUTH.iter);
      store.set('accounts', acc); e.target.reset(); e.target.classList.add('hidden'); err.textContent = ''; toast('Palavra-passe alterada.'); };
    $('#delAccForm').onsubmit = async e => { e.preventDefault(); const pw = new FormData(e.target).get('password');
      if (!await verifyCurrent(pw)) return toast('Palavra-passe errada.'); if (!confirm('Eliminar a tua conta deste dispositivo?')) return;
      const acc = accounts(); delete acc[u.email]; store.set('accounts', acc); Session.end(); updateAccountBtn(); renderAccount(); toast('Conta eliminada.'); };
  } else {
    const reg = authMode === 'register';
    $('#accountPanel').innerHTML = `<div class="tabs"><button class="tab ${reg ? '' : 'on'}" data-auth="login">Entrar</button><button class="tab ${reg ? 'on' : ''}" data-auth="register">Criar conta</button></div>
    <form id="authForm" class="formgrid" autocomplete="on" novalidate>
      ${reg ? `<div class="field"><label>Nome</label><input name="name" required autocomplete="name" maxlength="60" placeholder="O teu nome"></div>` : ''}
      <div class="field"><label>Email</label><input name="email" type="email" required autocomplete="email" placeholder="tu@email.com"></div>
      ${pwField('password', 'Palavra-passe', reg ? 'new-password' : 'current-password')}
      ${reg ? `${pwField('password2', 'Repetir palavra-passe', 'new-password')}<div class="field"><label>Tipo de conta</label><select name="type"><option>Turista</option><option>Empresa parceira</option><option>Guia turístico</option></select></div><div class="field"><label>Força da palavra-passe</label><div class="meter"><span id="pwMeter"></span></div><small class="muted" id="pwHint">Mínimo ${AUTH.minLen} caracteres, com letras e números.</small></div>` : ''}
      <label class="remember"><input type="checkbox" name="remember"> Manter sessão iniciada neste dispositivo (${AUTH.rememberDays} dias)</label>
      <p class="formerr" id="authErr" role="alert"></p>
      <button class="primary" id="authBtn">${reg ? 'Criar conta' : 'Entrar'}</button>
    </form>
    <p class="muted small" style="margin-top:14px">A palavra-passe nunca é guardada em texto: é cifrada com PBKDF2-SHA256 (${AUTH.iter.toLocaleString('pt-PT')} iterações) e sal aleatório. Após ${AUTH.maxFails} tentativas falhadas a conta bloqueia temporariamente.</p>`;
    const af = $('#authForm');
    if (reg) af.elements.password.oninput = () => { const s = pwScore(af.elements.password.value); const m = $('#pwMeter'); m.style.width = (s * 25) + '%'; m.style.background = ['#e5484d','#e5484d','#f5a524','#12a26f','#0a84ff'][s]; $('#pwHint').textContent = ['Muito fraca','Fraca','Razoável','Forte','Muito forte'][s]; };
    af.onsubmit = async e => {
      e.preventDefault(); const btn = $('#authBtn'), err = $('#authErr'); btn.disabled = true; btn.textContent = 'A verificar…'; err.textContent = '';
      const f = Object.fromEntries(new FormData(af)); f.remember = af.elements.remember.checked;
      const msg = await (reg ? register(f) : login(f));
      btn.disabled = false; btn.textContent = reg ? 'Criar conta' : 'Entrar';
      if (msg) { err.textContent = msg; af.elements.password.value = ''; if (af.elements.password2) af.elements.password2.value = ''; return; }
      const u = db.user(); updateAccountBtn(); renderAccount(); toast('Bem-vindo(a), ' + u.name + '!'); Live.announceMine(true);
      if (reg && u.type !== 'Turista') go('parceiro');
    };
  }
}
$('#accountPanel').addEventListener('click', e => {
  const t = e.target.closest('[data-auth]'); if (t) { authMode = t.dataset.auth; renderAccount(); }
  const s = e.target.closest('[data-showpw]'); if (s) { const i = s.parentElement.querySelector('input'); i.type = i.type === 'password' ? 'text' : 'password'; }
});
document.addEventListener('error', e => { const t = e.target; if (t && t.tagName === 'IMG' && !t.dataset.fb) { t.dataset.fb = 1; t.src = IMG.guide; } }, true);
document.addEventListener('click', e => { if (e.target.closest('[data-print]')) window.print(); });

/* ---------- Arranque ---------- */
function onLang() { if ($('#mensagens').classList.contains('active')) renderInbox(); }
$('#mensagens').addEventListener('click', async e => {
  const b = e.target.closest('[data-trmsg]'); if (!b) return;
  if (b.dataset.done) { b.previousElementSibling.textContent = b.dataset.src; b.textContent = I18n.t('Traduzir'); delete b.dataset.done; return; }
  b.textContent = '…';
  try { const r = await I18n.mt(b.dataset.trmsg, I18n.lang, 'Autodetect'); b.dataset.src = b.dataset.trmsg; b.previousElementSibling.textContent = r.text; b.textContent = I18n.t('Original'); b.dataset.done = 1; } catch { b.textContent = I18n.t('Traduzir'); toast('Tradução indisponível agora.'); }
});
function boot() { Live.connect(); Live.announceMine(); updateUnread(); toggleSvcFields(); renderLists(); renderTrips(); updateAccountBtn(); show(location.hash.slice(1) || 'home'); }
I18n.keep([...DESTINATIONS.map(d => d.name), ...PLACES.map(p => p.name), 'Tourist AI', 'Tourist', 'AI', 'WhatsApp', 'Google Maps']);
boot(); loadFx(); I18n.init();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
