import { BASE_AVG, CL, ENCOVI, LINE_POOR, MEMBERS, SHARES, SIZE_LABEL, SIZE_TXT, G, P, Q, classify, decOf, nf, pctTxt, usd } from '../lib/model';

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;
const S: { inc: number | null; si: number; hover: number | null } = { inc: 480, si: 2, hover: null };
const g = () => G(S.si);

/* ---------- Densidad (KDE en log10) ---------- */
// El eje se ajusta al rango de los datos para el tamaño de hogar elegido.
let XMIN = 5, XMAX = 10000;
let dens: Float64Array | null = null, densKey = '';
function getDensity(gv: number) {
  const key = String(S.si);
  if (key === densKey && dens) return dens;
  XMIN = gv * Q(0) * 0.6; XMAX = gv * Q(1) * 1.6;
  const N = 900, ys = new Float64Array(N);
  for (let i = 0; i < N; i++) ys[i] = Math.log10(Math.max(0.5, gv * Q((i + 0.5) / N)));
  const M = 220, h = 0.07, a = Math.log10(XMIN), b = Math.log10(XMAX), out = new Float64Array(M);
  for (let j = 0; j < M; j++) {
    const y = a + ((b - a) * j) / (M - 1);
    let s = 0;
    for (let i = 0; i < N; i++) { const d = (y - ys[i]) / h; if (d > -4 && d < 4) s += Math.exp(-0.5 * d * d); }
    out[j] = s;
  }
  dens = out; densKey = key;
  return out;
}

/* ---------- Render ---------- */
function renderRuler(dec: number, gv: number) {
  let li = '', th = '';
  for (let k = 1; k <= 10; k++) {
    const thr = k === 1 ? 0 : gv * Q((k - 1) / 10);
    li += `<li class="${k === dec ? 'me ' : ''}${k === 1 ? 'first ' : ''}${k === 10 ? 'last' : ''}" style="--bg:var(--d${k});--fg:var(--f${k})">${k === dec ? '<span class="tag">Tu hogar</span>' : ''}<div class="blk">${k}</div></li>`;
    th += `<li><b>Grupo ${k}</b><span>${k === 1 ? 'desde US$ 0' : 'desde ' + usd(thr)}</span></li>`;
  }
  $('#ruler').innerHTML = li; $('#thr').innerHTML = th;
}

function renderResult() {
  const gv = g(), inc = S.inc, has = inc !== null && !isNaN(inc);
  const med = gv * Q(0.5);
  const p = has ? P(inc / gv) : 0, dec = has ? decOf(p) : 0;
  renderRuler(dec, gv);

  if (!has) {
    $('#decNum').textContent = '—';
    $('#say').textContent = 'Escribe cuánto entra al mes en tu hogar para ver cómo te comparas.';
    $('#where').textContent = '';
    ['#s1', '#s2', '#s3'].forEach((s) => ($(s).textContent = '—'));
    $('#s1l').textContent = 'Para cada persona del hogar';
    $('#s2l').textContent = 'Frente a un hogar típico como el tuyo';
    $('#s3l').textContent = 'Frente a la línea de pobreza';
    $('#clsText').textContent = '';
    $('#clsDot').style.setProperty('--cc', 'var(--ink2)');
  } else {
    const pc = inc / MEMBERS[S.si], cls = classify(pc), ratio = inc / med, lines = pc / LINE_POOR;
    const less = Math.max(0, Math.min(10, Math.round(p * 10)));
    $('#decNum').textContent = String(less);
    $('#say').innerHTML = `de cada 10 venezolanos viven en hogares con menos ingreso por persona que el tuyo.<span class="sub">${less === 10 ? 'Casi nadie vive con más.' : less === 0 ? 'Casi todos viven con más.' : `Los otros ${10 - less} viven con más.`}</span>`;
    $('#where').textContent = `Tu hogar está en el grupo ${dec} de 10 (más que el ${pctTxt(p)} de la población), contando desde los que menos ganan (1) hasta los que más ganan (10).`;
    $('#s1').innerHTML = `${usd(pc)} <small>al mes</small>`;
    $('#s1l').textContent = `Para cada persona del hogar, unos ${usd(pc / 30.4, pc / 30.4 < 10 ? 1 : 0)} al día`;
    $('#s2').innerHTML = `${nf(ratio, ratio < 10 ? 1 : 0)} <small>veces</small>`;
    $('#s2l').textContent = `Lo que gana un hogar mediano ${SIZE_TXT[S.si]} (${usd(med)} al mes)`;
    $('#s3').innerHTML = `${nf(lines, 1)} <small>líneas</small>`;
    $('#s3l').textContent = `La línea de pobreza estimada es de ${usd(LINE_POOR)} por persona al mes`;
    const c = CL[cls];
    $('#clsDot').style.setProperty('--cc', `var(${c.c})`);
    $('#clsText').innerHTML = `Por lo que le toca a cada persona, tu hogar se ubica en <strong>${c.n}</strong>: ${c.def.charAt(0).toLowerCase() + c.def.slice(1)}.`;
  }
  const w = $('#warn');
  const pcNow = has ? inc / MEMBERS[S.si] : 0;
  w.hidden = !has || (pcNow > Q(0) && pcNow < Q(1));
  if (!w.hidden) w.textContent = `Tu ingreso por persona está fuera del rango que cubren los datos (de ${usd(Q(0), 1)} a ${usd(Q(1))}). Toma la ubicación como aproximada.`;
  return dec;
}

function renderTables(dec: number) {
  const gv = g(), maxAvg = gv * BASE_AVG[9];
  $('#distIntro').textContent = `Montos para un hogar ${SIZE_TXT[S.si]}: el ingreso por persona de ENCOVI 2025 multiplicado por el tamaño del hogar. La desigualdad sigue siendo alta: el 10 % que más gana se lleva cerca del ${nf(SHARES[9] * 100)} % del ingreso total, y el país tiene unos ${nf(ENCOVI.homes / 1e6)} millones de hogares.`;
  $('#tabCap').textContent = `Hogares ${SIZE_TXT[S.si]}. Montos mensuales en dólares; la columna por persona es el promedio publicado por ENCOVI 2025.`;
  let h = '';
  for (let k = 0; k < 10; k++) {
    const from = k === 0 ? 0 : gv * Q(k / 10), avg = gv * BASE_AVG[k];
    h += `<tr class="${dec === k + 1 ? 'me' : ''}"><th scope="row">Grupo ${k + 1}</th><td>${k === 0 ? 'US$ 0' : usd(from)}</td><td>${usd(avg)}<span class="bar" style="width:${Math.max(2, (avg / maxAvg) * 100).toFixed(1)}%"></span></td><td>${usd(avg / MEMBERS[S.si])}</td><td>${nf(SHARES[k] * 100, 1)} %</td></tr>`;
  }
  $('#tbody').innerHTML = h;

  let mh = '<thead><tr><th>Tamaño del hogar</th><th>Grupo 1 (promedio)</th>';
  for (let k = 2; k <= 10; k++) mh += `<th>Grupo ${k}</th>`;
  mh += '</tr></thead><tbody>';
  for (let si = 0; si < 5; si++) {
    const gs = G(si);
    mh += `<tr class="${si === S.si ? 'me' : ''}"><th scope="row">${SIZE_LABEL[si]}</th>`;
    for (let j = 0; j < 10; j++) mh += `<td${si === S.si && dec === j + 1 ? ' class="me"' : ''}>${usd(j === 0 ? gs * BASE_AVG[0] : gs * Q(j / 10))}</td>`;
    mh += '</tr>';
  }
  $('#matrix').innerHTML = mh + '</tbody>';
  $('#matCap').textContent = `Ingreso mensual mínimo del hogar para entrar a cada grupo (US$). En el grupo 1 no hay mínimo: se muestra el promedio.`;
}

function renderYou() {
  const you = $('#you');
  you.hidden = S.inc === null || isNaN(S.inc);
  if (!you.hidden) you.style.left = (Math.min(0.985, Math.max(0.015, P(S.inc! / MEMBERS[S.si]))) * 100).toFixed(2) + '%';
}

/* ---------- Gráfico de densidad ---------- */
type Geo = { L: number; pw: number; a: number; b: number };
const box = $('#densityChart') as HTMLElement & { _geo?: Geo };
function drawChart() {
  const W = Math.max(300, box.clientWidth), H = W < 560 ? 270 : 360, L = 8, R = 8, T = 44, B = 34, pw = W - L - R, ph = H - T - B, base = T + ph;
  const gv = g(), d = getDensity(gv), a = Math.log10(XMIN), b = Math.log10(XMAX);
  const X = (v: number) => L + (pw * (Math.log10(Math.max(XMIN, Math.min(XMAX, v))) - a)) / (b - a);
  const dmax = Math.max(...d);
  const pts = Array.from(d, (v, i) => `${(L + (pw * i) / (d.length - 1)).toFixed(1)},${(base - (v / dmax) * ph * 0.94).toFixed(1)}`);
  const line = 'M' + pts.join('L'), area = `${line}L${L + pw},${base}L${L},${base}Z`;
  const xs = [L, ...Array.from({ length: 9 }, (_, k) => X(gv * Q((k + 1) / 10))), L + pw];
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" font-family="Plus Jakarta Sans, sans-serif"><defs>`;
  for (let k = 1; k <= 10; k++) s += `<clipPath id="cb${k}"><rect x="${xs[k - 1].toFixed(1)}" y="0" width="${Math.max(0, xs[k] - xs[k - 1]).toFixed(1)}" height="${base}"/></clipPath>`;
  s += '</defs>';
  for (let k = 1; k <= 10; k++) s += `<path d="${area}" style="fill:var(--d${k})" clip-path="url(#cb${k})"/>`;
  for (let k = 1; k <= 9; k++) s += `<line x1="${xs[k].toFixed(1)}" x2="${xs[k].toFixed(1)}" y1="${T}" y2="${base}" style="stroke:var(--paper)" stroke-width="2"/>`;
  s += `<path d="${line}" fill="none" style="stroke:var(--ink)" stroke-width="1.4"/>`;
  for (let k = 1; k <= 10; k++) if (xs[k] - xs[k - 1] >= 16) s += `<text x="${((xs[k] + xs[k - 1]) / 2).toFixed(1)}" y="${base - 9}" text-anchor="middle" font-size="12" font-weight="800" style="fill:var(--f${k})">${k}</text>`;
  s += `<line x1="${L}" x2="${L + pw}" y1="${base}" y2="${base}" style="stroke:var(--ink)" stroke-width="1.2"/>`;
  let lastX = -Infinity, first = true;
  for (const t of [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000]) {
    const x = X(t);
    if (t < XMIN || t > XMAX || x - lastX < 46 || x > L + pw - 20) continue;
    s += `<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${base}" y2="${base + 5}" style="stroke:var(--ink)"/><text x="${x.toFixed(1)}" y="${base + 20}" text-anchor="middle" font-size="11.5" style="fill:var(--ink2)">${first ? 'US$ ' : ''}${nf(t)}</text>`;
    lastX = x; first = false;
  }
  if (S.hover !== null) { const hx = X(S.hover); s += `<line x1="${hx.toFixed(1)}" x2="${hx.toFixed(1)}" y1="${T - 6}" y2="${base}" style="stroke:var(--ink)" stroke-width="1.2" stroke-dasharray="4 3"/>`; }
  if (S.inc !== null && !isNaN(S.inc) && S.inc > 0) {
    const ux = X(S.inc), txt = 'Tu hogar: ' + usd(S.inc, 0), tw = txt.length * 6.7 + 18, tx = Math.max(L, Math.min(L + pw - tw, ux - tw / 2));
    s += `<line x1="${ux.toFixed(1)}" x2="${ux.toFixed(1)}" y1="${T - 12}" y2="${base}" style="stroke:var(--sun)" stroke-width="4"/><line x1="${ux.toFixed(1)}" x2="${ux.toFixed(1)}" y1="${T - 12}" y2="${base}" style="stroke:var(--ink)" stroke-width="1"/>`;
    s += `<rect x="${tx.toFixed(1)}" y="4" width="${tw.toFixed(1)}" height="24" rx="12" style="fill:var(--sun)"/><text x="${(tx + tw / 2).toFixed(1)}" y="20" text-anchor="middle" font-size="12.5" font-weight="700" fill="#0E1A2B">${txt}</text>`;
  }
  box.innerHTML = s + '</svg>';
  box._geo = { L, pw, a, b };
}

function readout() {
  const r = $('#readout');
  if (S.hover === null) { r.textContent = 'Mueve el cursor o toca el gráfico para explorar cuánto vale cada nivel de ingreso.'; return; }
  const p = P(S.hover / g());
  r.innerHTML = `Un hogar ${SIZE_TXT[S.si]} que gane <b>${usd(S.hover, 0)}</b> al mes queda en el grupo <b>${decOf(p)}</b> de 10: gana más que el <b>${pctTxt(p)}</b> de la población.`;
}

function renderAll() {
  renderTables(renderResult()); renderYou(); drawChart(); readout();
}

/* ---------- Entradas ---------- */
function parseIncome(v: string): number | null {
  let s = v.trim();
  if (!s) return null;
  if (s.includes(',')) s = s.slice(0, s.lastIndexOf(','));
  else { const m = s.match(/^(.*)\.(\d{1,2})$/); if (m) s = m[1]; }
  const digits = s.replace(/\D/g, '');
  return digits ? Math.min(1000000, parseInt(digits, 10)) : null;
}
const sliderToInc = (t: number) => {
  if (t <= 0) return 0;
  const x = Math.pow(10, (t / 1000) * 3.7);
  return x > 1000 ? Math.round(x / 10) * 10 : x > 100 ? Math.round(x / 5) * 5 : Math.round(x);
};
const incToSlider = (x: number | null) => (!x || x <= 1 ? 0 : Math.min(1000, Math.round((Math.log10(x) / 3.7) * 1000)));

const inc = $<HTMLInputElement>('#inc'), sl = $<HTMLInputElement>('#slider');
const setInc = (v: number | null) => { S.inc = v; inc.value = v === null ? '' : nf(v); sl.value = String(incToSlider(v)); renderAll(); };
inc.addEventListener('input', () => { S.inc = parseIncome(inc.value); sl.value = String(incToSlider(S.inc)); renderAll(); });
inc.addEventListener('blur', () => { if (S.inc !== null) inc.value = nf(S.inc); });
sl.addEventListener('input', () => setInc(sliderToInc(+sl.value)));
document.querySelectorAll<HTMLButtonElement>('.chip').forEach((b) => b.addEventListener('click', () => setInc(+b.dataset.v!)));
document.querySelectorAll<HTMLInputElement>('input[name="size"]').forEach((r) => r.addEventListener('change', () => { S.si = +r.value; renderAll(); }));

function hoverAt(e: PointerEvent) {
  const geo = box._geo; if (!geo) return;
  const t = (e.clientX - box.getBoundingClientRect().left - geo.L) / geo.pw;
  S.hover = t < 0 || t > 1 ? null : Math.pow(10, geo.a + (geo.b - geo.a) * t);
  drawChart(); readout();
}
box.addEventListener('pointermove', hoverAt);
box.addEventListener('pointerdown', hoverAt);
box.addEventListener('pointerleave', () => { S.hover = null; drawChart(); readout(); });
new ResizeObserver(drawChart).observe(box);

setInc(S.inc);
