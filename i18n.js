// Tourist AI — idiomas (PT é o idioma base)
const I18N = {};

const I18N_TPL = [
  [/^(\d+) resultado\(s\)(?: para “(.*)”)?$/, { en:(a,b)=>`${a} result(s)${b?` for “${b}”`:''}`, fr:(a,b)=>`${a} résultat(s)${b?` pour « ${b} »`:''}`, es:(a,b)=>`${a} resultado(s)${b?` para “${b}”`:''}` }],
  [/^Email ou palavra-passe incorretos\. Restam (\d+) tentativa\(s\)\.$/, { en:a=>`Incorrect email or password. ${a} attempt(s) left.`, fr:a=>`E-mail ou mot de passe incorrect. Il reste ${a} tentative(s).`, es:a=>`Correo o contraseña incorrectos. Quedan ${a} intento(s).` }],
  [/^Demasiadas tentativas\. Conta bloqueada durante (\d+) min\.$/, { en:a=>`Too many attempts. Account locked for ${a} min.`, fr:a=>`Trop de tentatives. Compte bloqué pendant ${a} min.`, es:a=>`Demasiados intentos. Cuenta bloqueada durante ${a} min.` }],
  [/^Conta bloqueada por segurança\. Tenta de novo daqui a (\d+) min\.$/, { en:a=>`Account locked for security. Try again in ${a} min.`, fr:a=>`Compte bloqué par sécurité. Réessayez dans ${a} min.`, es:a=>`Cuenta bloqueada por seguridad. Inténtalo de nuevo en ${a} min.` }],
  [/^Proposta: (.+) MT$/, { en:a=>`Offer: ${a} MT`, fr:a=>`Offre : ${a} MT`, es:a=>`Oferta: ${a} MT` }],
  [/^Acordo: (.+) MT$/, { en:a=>`Deal: ${a} MT`, fr:a=>`Accord : ${a} MT`, es:a=>`Acuerdo: ${a} MT` }],
  [/^(\d+) guia\(s\)$/, { en:a=>`${a} guide(s)`, fr:a=>`${a} guide(s)`, es:a=>`${a} guía(s)` }],
  [/^(\d+) serviço\(s\):$/, { en:a=>`${a} service(s):`, fr:a=>`${a} service(s) :`, es:a=>`${a} servicio(s):` }],
  [/^Olá, (.+)$/, { en:a=>`Hi, ${a}`, fr:a=>`Bonjour, ${a}`, es:a=>`Hola, ${a}` }],
  [/^Bem-vindo\(a\), (.+)!$/, { en:a=>`Welcome, ${a}!`, fr:a=>`Bienvenue, ${a} !`, es:a=>`¡Bienvenido/a, ${a}!` }],
  [/^Dia (\d+)$/, { en:a=>`Day ${a}`, fr:a=>`Jour ${a}`, es:a=>`Día ${a}` }],
  [/^(.+) · (\d+) dia\(s\)$/, { en:(a,b)=>`${a} · ${b} day(s)`, fr:(a,b)=>`${a} · ${b} jour(s)`, es:(a,b)=>`${a} · ${b} día(s)` }],
  [/^Cliente · (.*)$/, { en:a=>`Client · ${a}`, fr:a=>`Client · ${a}`, es:a=>`Cliente · ${a}` }],
  [/^(\d+) pessoa\(s\)(.*)$/, { en:(a,b)=>`${a} person(s)${b}`, fr:(a,b)=>`${a} personne(s)${b}`, es:(a,b)=>`${a} persona(s)${b}` }],
  [/^Recusaste a proposta de (.+)$/, { en:a=>`You declined the offer of ${a}`, fr:a=>`Vous avez refusé l'offre de ${a}`, es:a=>`Rechazaste la oferta de ${a}` }],
  [/^(.+) recusou a proposta de (.+)$/, { en:(a,b)=>`${a} declined the offer of ${b}`, fr:(a,b)=>`${a} a refusé l'offre de ${b}`, es:(a,b)=>`${a} rechazó la oferta de ${b}` }],
  [/^Aceitar a proposta de (.+) MT\?$/, { en:a=>`Accept the offer of ${a} MT?`, fr:a=>`Accepter l'offre de ${a} MT ?`, es:a=>`¿Aceptar la oferta de ${a} MT?` }],
  [/^Taxa: 1 (\w+) = ([\d.,]+) MT · atualizada: (.+?)\. Nas casas de câmbio pode variar\.$/, { en:(a,b,c)=>`Rate: 1 ${a} = ${b} MT · updated: ${c}. Exchange offices may differ.`, fr:(a,b,c)=>`Taux : 1 ${a} = ${b} MT · mis à jour : ${c}. Peut varier dans les bureaux de change.`, es:(a,b,c)=>`Tasa: 1 ${a} = ${b} MT · actualizada: ${c}. En las casas de cambio puede variar.` }]
];

/* ---------- Motor de idioma ---------- */
const I18n = (() => {
  const LANGS = { pt:'Português', en:'English', fr:'Français', es:'Español' };
  const pick = l => { l = String(l || '').slice(0, 2).toLowerCase(); return LANGS[l] ? l : null; };
  let saved = null; try { saved = pick(JSON.parse(localStorage.getItem('tai_lang'))); } catch {}
  const detected = (navigator.languages || [navigator.language]).map(pick).find(Boolean) || 'pt';
  let lang = saved || detected;
  const orig = new WeakMap(), attrOrig = new WeakMap(), ATTRS = ['placeholder', 'aria-label', 'title'];
  let mtCache = {}; const loadCache = () => { try { mtCache = JSON.parse(localStorage.getItem('tai_mt_' + lang)) || {}; } catch { mtCache = {}; } };
  loadCache();
  let busy = false, saveT;
  const hasWords = s => /[A-Za-zÀ-ÿ]{2,}/.test(String(s).replace(/https?:\S+|\bMT\b|\bMZN\b|\bUSD\b|\bEUR\b|\bZAR\b/g, ''));
  const KEEP = new Set(); const keep = list => list.forEach(x => x && KEEP.add(String(x).trim()));
  const queue = new Map(); let running = 0;
  function mt(src, to, from) {
    return fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(src.slice(0, 480))}&langpair=${from || 'pt'}|${to}`)
      .then(r => r.json()).then(j => { const t = j && j.responseData && j.responseData.translatedText; if (!t || j.quotaFinished || /MYMEMORY WARNING|INVALID/i.test(t)) throw 0; return { text:t, from:j.responseData.detectedLanguage }; });
  }
  function pump() {
    while (running < 4 && queue.size) {
      const [src, nodes] = queue.entries().next().value; queue.delete(src); running++;
      const L = lang;
      mt(src, L).then(r => { if (L !== lang) return; mtCache[src] = r.text; clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem('tai_mt_' + lang, JSON.stringify(mtCache)); } catch {} }, 500); apply(document.body); })
        .catch(() => { mtCache[src] = mtCache[src] || null; }).finally(() => { running--; pump(); });
    }
  }
  function lookup(src, dictOnly) {
    if (lang === 'pt') return src;
    const d = I18N[lang] && I18N[lang][src]; if (d) return d;
    for (const [re, f] of I18N_TPL) { const mm = src.match(re); if (mm && f[lang]) return f[lang](...mm.slice(1)); }
    if (dictOnly || KEEP.has(src) || !hasWords(src)) return src;
    if (src in mtCache) return mtCache[src] || src;
    if (!queue.has(src)) { queue.set(src, 1); setTimeout(pump, 0); }
    return src;
  }
  const t = s => { const tr = String(s).trim(); if (!tr) return s; return s.replace(tr, lookup(tr)); };
  function skip(el) { return !el || el.closest('script,style,textarea,[translate="no"],.notranslate,.ic,select.langsel'); }
  function dictOnly(el) { return !!(el && el.closest('[data-nm]')); }
  function doText(n) {
    if (skip(n.parentElement)) return;
    let o = orig.get(n);
    if (o === undefined || (n.nodeValue !== o.out)) { o = { src:n.nodeValue }; }
    const tr = o.src.trim(); if (!tr) return;
    const out = o.src.replace(tr, lookup(tr, dictOnly(n.parentElement)));
    o.out = out; orig.set(n, o); if (n.nodeValue !== out) n.nodeValue = out;
  }
  function doAttrs(el) {
    if (skip(el)) return;
    let m = attrOrig.get(el) || {};
    ATTRS.forEach(a => { if (!el.hasAttribute(a)) return; const v = el.getAttribute(a); let o = m[a];
      if (!o || v !== o.out) o = { src:v }; o.out = lookup(o.src.trim()) || o.src; m[a] = o; if (v !== o.out) el.setAttribute(a, o.out); });
    attrOrig.set(el, m);
  }
  function apply(root) {
    if (!root) return; busy = true;
    try {
      if (root.nodeType === 3) doText(root);
      else {
        const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) doText(n);
        if (root.querySelectorAll) { if (root.matches && root.matches('[placeholder],[aria-label],[title]')) doAttrs(root); root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(doAttrs); }
      }
    } finally { busy = false; }
  }
  const obs = new MutationObserver(ms => { if (busy) return; const set = new Set();
    ms.forEach(m => { if (m.type === 'characterData') set.add(m.target); else if (m.type === 'attributes') set.add(m.target); else m.addedNodes.forEach(x => set.add(x)); });
    set.forEach(apply); });
  function setLang(l, manual) {
    l = pick(l); if (!l || l === lang) return; lang = l; loadCache();
    if (manual !== false) try { localStorage.setItem('tai_lang', JSON.stringify(l)); } catch {}
    document.documentElement.lang = l === 'pt' ? 'pt-MZ' : l;
    // repõe originais e volta a traduzir
    busy = true;
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { const o = orig.get(n); if (o && n.nodeValue === o.out) n.nodeValue = o.src; orig.delete(n); }
    document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(el => { const m = attrOrig.get(el); if (m) Object.entries(m).forEach(([a, o]) => { if (el.getAttribute(a) === o.out) el.setAttribute(a, o.src); }); attrOrig.delete(el); });
    busy = false; apply(document.body); syncSelect();
    if (typeof onLang === 'function') onLang(l);
  }
  function syncSelect() { document.querySelectorAll('select.langsel').forEach(s => s.value = lang); }
  // Deteção do idioma de uma frase escrita pelo utilizador
  const WORDS = {
    pt:'o a os as de do da em para com que nao não sim olá ola obrigado dias quero onde como quanto praia uma um você voce tu eu é e meu minha preço preco',
    en:'the and is are to of in for with what where how much want days day beach hello hi thanks please can i you my best when price',
    fr:'le la les et est sont pour avec quoi où ou comment combien veux jours plage bonjour merci je vous mon meilleure quand prix une un',
    es:'el la los las y es son para con qué que dónde donde cómo cuánto quiero días playa hola gracias yo tú mi mejor cuándo precio una un'
  };
  const WSET = Object.fromEntries(Object.entries(WORDS).map(([k, v]) => [k, new Set(v.split(' '))]));
  function detect(text) {
    const ws = String(text).toLowerCase().match(/[a-zà-ÿ']+/g) || []; if (ws.length < 2) return null;
    const sc = {}; Object.keys(WSET).forEach(l => sc[l] = ws.filter(w => WSET[l].has(w)).length);
    if (/[ãõç]|ção|ções/.test(text)) sc.pt += 2; if (/ñ|¿|¡/.test(text)) sc.es += 2; if (/[èêëàâîïôûù]|qu'|c'est|j'/.test(text)) sc.fr += 2; if (/\b(the|what|where|how|i'm|don't)\b/i.test(text)) sc.en += 2;
    const best = Object.entries(sc).sort((a, b) => b[1] - a[1]);
    return best[0][1] >= 2 && best[0][1] > best[1][1] ? best[0][0] : null;
  }
  // Palavras-chave para o assistente perceber outras línguas
  const KW = [[/\b(days?|jours?|días?|dias?)\b/g,'dias'],[/\b(nights?|nuits?|noches?)\b/g,'noites'],[/\bweek|semaine|semana\b/g,'semana'],[/\b(beach(es)?|plages?|playas?)\b/g,'praia'],
    [/whale ?sharks?|requins?[- ]baleines?|tibur[oó]n(es)? ballena|tiburones/g,'tubarao'],[/\b(whales?|baleines?|ballenas?)\b/g,'baleia'],[/\b(dolphins?|dauphins?|delf[ií]n(es)?)\b/g,'golfinho'],
    [/\b(family|families|kids|children|famille|enfants|familia|niños)\b/g,'familia'],[/\b(diving|dive|plong[ée]e|buceo|bucear)\b/g,'mergulho'],[/\b(when|season|weather|rain|quand|saison|météo|cu[aá]ndo|[ée]poca|clima)\b/g,'epoca'],
    [/\b(food|eat|seafood|restaurants?|manger|fruits de mer|comer|marisco|comida)\b/g,'comer'],[/\b(hotels?|stay|sleep|lodging|h[ôo]tel|dormir|logement|alojamiento)\b/g,'alojamento'],
    [/\b(safe|safety|danger|s[ée]curit[ée]|seguridad|peligro)\b/g,'seguranca'],[/\b(transport|flights?|plane|taxi|vols?|avion|vuelos?)\b/g,'transporte'],
    [/\b(exchange|convert|rate|change|taux|cambio|tasa)\b/g,'cambio'],[/\b(dollars?|d[oó]lares)\b/g,'dolares'],[/\b(history|culture|heritage|histoire|patrimoine|historia|cultura)\b/g,'historia'],
    [/\b(animals|wildlife|lions?|elephants?|animaux|faune|animales|leones)\b/g,'animais'],[/\b(cheap|budget|pas cher|barato|econ[oó]mico)\b/g,'barato'],[/\b(romantic|honeymoon|couple|romantique|rom[aá]ntico|pareja)\b/g,'romantico'],
    [/\b(adventure|aventure|aventura|surf)\b/g,'aventura'],[/\b(malaria|paludisme|vaccines?|vaccins?|vacunas?|health|sant[ée]|salud|mosquito(es)?)\b/g,'malaria'],[/^(hello|hi|hey|bonjour|salut|hola|buenos d[ií]as)\b/,'ola'],
    [/\b(in|at|to|à|au|en)\b/g,'em'],[/\b(with|avec|con)\b/g,'com']];
  function toPT(msg) { let m = String(msg).toLowerCase(); KW.forEach(([re, v]) => m = m.replace(re, v)); return m; }
  // confirm / prompt traduzidos
  const _c = window.confirm.bind(window), _p = window.prompt.bind(window);
  window.confirm = s => _c(t(s)); window.prompt = (s, d) => _p(t(s), d);
  function init() {
    document.documentElement.lang = lang === 'pt' ? 'pt-MZ' : lang;
    apply(document.body); syncSelect();
    obs.observe(document.body, { subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:ATTRS });
    document.addEventListener('change', e => { if (e.target.matches('select.langsel')) setLang(e.target.value); });
  }
  return { keep, LANGS, get lang() { return lang; }, detected, setLang, t, detect, toPT, mt, init, hasSaved:() => !!saved };
})();
