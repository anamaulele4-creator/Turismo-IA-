// Tourist AI — aplicação (funciona offline, dados no dispositivo)
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => Math.round(n).toLocaleString('pt-PT');
const CAT = { destino:'Destino', hotel:'Alojamento', restaurante:'Restaurante', atividade:'Atividade', transporte:'Transporte' };
const CAT_ICON = { destino:'globe', hotel:'bed', restaurante:'food', atividade:'wave', transporte:'car' };
const CAT_COLOR = { destino:'#12345a', hotel:'#15966a', restaurante:'#ff9f43', atividade:'#0878d1', transporte:'#8e44ad' };
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
  chat: () => store.get('chat', [])
};
function bump(id, field) { const s = db.stats(); s[id] = s[id] || { views:0, leads:0 }; s[id][field]++; store.set('stats', s); }

/* ---------- Dados combinados ---------- */
function allItems() {
  const d = DESTINATIONS.map(x => ({ ...x, category:'destino', place:x.id }));
  const b = db.biz().map(x => ({ ...x, partner:true }));
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
    <img src="${esc(img)}" alt="${esc(x.name)}" loading="lazy" onerror="this.src='${IMG.guide}'">
    <div class="cardbody"><span class="tag">${esc(tag)}</span><h3>${esc(x.name)}</h3><p class="muted">${esc(x.desc)}</p>
    <div class="row"><span class="price">${esc(x.price || (x.category === 'destino' ? x.region : ''))}</span><button class="secondary" data-open="${esc(x.id)}">Ver detalhes</button></div></div></article>`;
}
const empty = msg => `<div class="panel" style="grid-column:1/-1">${msg}</div>`;

/* ---------- Navegação (hash) ---------- */
function go(id) { if (location.hash !== '#' + id) location.hash = id; else show(id); }
function show(id) {
  if (!document.getElementById(id) || !document.getElementById(id).classList.contains('page')) id = 'home';
  $$('.page').forEach(p => p.classList.toggle('active', p.id === id));
  window.scrollTo({ top:0 });
  ({ mapa:initMap, favoritos:renderFavs, parceiro:renderPartner, conta:renderAccount, roteiros:renderTrips, info:renderFx, assistente:renderChat }[id] || (()=>{}))();
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
  $('#homePlaces').innerHTML = [...db.biz().map(x => ({...x, partner:true})), ...PLACES.filter(p => ['hotel','restaurante'].includes(p.category))].slice(0, 6).map(card).join('');
  renderDestinations();
  ['hotel','restaurante','atividade','transporte'].forEach(cat => {
    const inp = $(`.filterInput[data-cat="${cat}"]`), sel = $(`.filterPlace[data-cat="${cat}"]`);
    const q = (inp ? inp.value : '').trim().toLowerCase(), pl = sel ? sel.value : 'todos';
    const list = items.filter(x => x.category === cat && (pl === 'todos' || x.place === pl) && (!q || (x.name + ' ' + x.desc + ' ' + destName(x.place)).toLowerCase().includes(q)));
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
  let html = `<img src="${esc(x.img || IMG.guide)}" alt="" onerror="this.src='${IMG.guide}'"><div class="modalbody"><button class="close" aria-label="Fechar">${ico('close')}</button>
    <span class="tag">${ico(CAT_ICON[x.category])} ${esc(CAT[x.category])}${x.category !== 'destino' ? ' · ' + esc(destName(x.place)) : ' · ' + esc(x.region)}</span>
    <h2 style="margin:10px 0 6px">${esc(x.name)}</h2><p>${esc(x.desc)}</p>`;
  if (x.price) html += `<p><b>Preço:</b> ${esc(x.price)}</p>`;
  if (x.season) html += `<p><b>Melhor época:</b> ${esc(x.season)}</p>`;
  if (x.activities) html += `<p><b>O que fazer:</b></p><ul>${x.activities.slice(0, 6).map(a => `<li>${esc(a)}</li>`).join('')}</ul>`;
  if (near.length) html += `<p><b>Aqui perto:</b> ${near.map(n => `<a href="#" data-open="${esc(n.id)}">${esc(n.name)}</a>`).join(' · ')}</p>`;
  html += `<div class="actions">`;
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
    <div class="actions no-print">${saved ? '' : `<button class="primary" data-savetrip="${t.id}">${ico('save')} Guardar</button>`}<button class="secondary" data-sharetrip="${t.id}">${ico('share')} Partilhar</button><button class="wa" data-watrip="${t.id}">${ico('phone')} WhatsApp</button><button class="secondary" onclick="window.print()">${ico('print')} Imprimir / PDF</button></div></div>`;
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
  const m = norm(msg);
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
  $('#chatbox').innerHTML = h.map(x => `<div class="bubble ${x.r === 'user' ? 'user' : ''}">${x.r === 'user' ? esc(x.t) : x.t}</div>`).join('');
  $('#chatbox').scrollTop = 1e9;
  $('#chatSuggestions').innerHTML = SUGGESTIONS.map(s => `<button class="chip" data-suggest="${esc(s)}">${esc(s)}</button>`).join('');
}
function sendChat(msg) {
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
  e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
  if (waNumber(f.phone).length < 9) return toast('Indica um número de WhatsApp válido, ex.: +258 84 000 0000');
  const d = DESTINATIONS.find(x => x.id === f.place);
  const jitter = () => (Math.random() - .5) * 0.01;
  const list = db.biz(); const user = db.user();
  if (f.id) { const i = list.findIndex(x => x.id === f.id); if (i > -1) list[i] = { ...list[i], ...f }; toast('Negócio atualizado'); }
  else { list.unshift({ ...f, id:'b' + Date.now(), lat:d.lat + jitter(), lng:d.lng + jitter(), owner:user ? user.email : '', created:new Date().toISOString() }); toast('Publicado! Já aparece nas pesquisas e no mapa'); }
  store.set('biz', list); resetBizForm(); renderLists(); renderPartner(); if (map) drawMarkers();
};
function resetBizForm() { const f = $('#businessForm'); f.reset(); f.elements.id.value = ''; $('#bizFormTitle').textContent = 'Publicar o meu negócio'; $('#cancelEdit').classList.add('hidden'); }
$('#cancelEdit').onclick = resetBizForm;
function renderPartner() {
  const list = db.biz(), st = db.stats(), favs = db.favs();
  $('#pListings').textContent = list.length;
  $('#pViews').textContent = list.reduce((a, b) => a + ((st[b.id] || {}).views || 0), 0);
  $('#pLeads').textContent = list.reduce((a, b) => a + ((st[b.id] || {}).leads || 0), 0);
  $('#pFavs').textContent = list.filter(b => favs.includes(b.id)).length;
  $('#myListings').innerHTML = list.length ? list.map(b => `<div class="listitem"><div><strong>${esc(b.name)}</strong><div class="muted small">${esc(CAT[b.category])} · ${esc(destName(b.place))} · ${(st[b.id] || {}).views || 0} visualizações · ${(st[b.id] || {}).leads || 0} contactos</div></div><div class="row"><button class="secondary" data-open="${b.id}">Ver</button><button class="secondary" data-editbiz="${b.id}">Editar</button><button class="danger" data-delbiz="${b.id}">Apagar</button></div></div>`).join('') : '<p class="muted">Ainda não publicaste nenhum negócio.</p>';
}
$('#myListings').addEventListener('click', e => {
  const ed = e.target.closest('[data-editbiz]'), dl = e.target.closest('[data-delbiz]');
  if (ed) { const b = db.biz().find(x => x.id === ed.dataset.editbiz), f = $('#businessForm');
    ['id','name','category','place','phone','price','img','desc'].forEach(k => f.elements[k].value = b[k] || '');
    $('#bizFormTitle').textContent = 'Editar negócio'; $('#cancelEdit').classList.remove('hidden'); f.scrollIntoView({ behavior:'smooth' }); }
  if (dl && confirm('Apagar este negócio?')) { store.set('biz', db.biz().filter(x => x.id !== dl.dataset.delbiz)); renderLists(); renderPartner(); if (map) drawMarkers(); }
});

/* ---------- Conta ---------- */
function renderAccount() {
  const u = db.user();
  $('#accountPanel').innerHTML = u ? `<h3>Olá, ${esc(u.name)}</h3><p class="muted">${esc(u.email)} · ${esc(u.type)}</p>
    <div class="stats"><div class="stat"><strong>${db.favs().length}</strong><span>Favoritos</span></div><div class="stat"><strong>${db.trips().length}</strong><span>Roteiros</span></div><div class="stat"><strong>${db.biz().length}</strong><span>Negócios</span></div><div class="stat"><strong>${new Date(u.since).toLocaleDateString('pt-PT')}</strong><span>Membro desde</span></div></div>
    <div class="actions"><button class="secondary" data-page="favoritos">${heart(true)} Favoritos</button><button class="secondary" data-page="roteiros">${ico('compass')} Roteiros</button><button class="danger" id="logoutBtn">Sair</button></div>`
  : `<form id="accountForm" class="formgrid"><div class="field"><label>Nome</label><input name="name" required placeholder="O teu nome"></div><div class="field"><label>Email</label><input name="email" type="email" required placeholder="tu@email.com"></div><div class="field"><label>Tipo de conta</label><select name="type"><option>Turista</option><option>Empresa parceira</option></select></div><button class="primary">Criar perfil</button></form>`;
  const af = $('#accountForm'); if (af) af.onsubmit = e => { e.preventDefault(); const f = Object.fromEntries(new FormData(af)); store.set('user', { ...f, since:new Date().toISOString() }); updateAccountBtn(); renderAccount(); toast('Bem-vindo(a), ' + f.name + '!'); if (f.type === 'Empresa parceira') go('parceiro'); };
  const lo = $('#logoutBtn'); if (lo) lo.onclick = () => { store.set('user', null); updateAccountBtn(); renderAccount(); };
}
function updateAccountBtn() { const u = db.user(); $('#accountBtn').innerHTML = u ? ico('user') + ' ' + esc(u.name.split(' ')[0]) : 'Entrar'; }
$('#exportBtn').onclick = () => {
  const data = {}; Object.keys(localStorage).filter(k => k.startsWith('tai_') && k !== 'tai_gen').forEach(k => data[k] = localStorage.getItem(k));
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type:'application/json' }));
  a.download = 'tourist-ai-dados.json'; a.click();
};
$('#importFile').onchange = async e => {
  try { const data = JSON.parse(await e.target.files[0].text()); Object.entries(data).forEach(([k, v]) => k.startsWith('tai_') && localStorage.setItem(k, v)); toast('Dados importados'); boot(); } catch { toast('Ficheiro inválido.'); }
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

/* ---------- Arranque ---------- */
function boot() { renderLists(); renderTrips(); updateAccountBtn(); show(location.hash.slice(1) || 'home'); }
boot(); loadFx();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
