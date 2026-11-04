// Fuente: ENCOVI 2025, presentación de resultados (UCAB-IIES, 7 de mayo de 2026).
// Referencia: mayo de 2025. Muestra: 11.352 hogares, levantada de marzo a junio de 2025.
export const SOURCE = {
  name: 'ENCOVI 2025 · UCAB',
  pdf: 'https://cdn.prod.website-files.com/5d14c6a5c4ad42a4e794d0f7/69fcb4f2d5587c07273d00e2_ENCOVI%202025_presentacio%CC%81n_UCAB-07%2005%202026.pdf',
  site: 'https://www.proyectoencovi.com/',
  pdf2024: 'https://cdn.prod.website-files.com/5d14c6a5c4ad42a4e794d0f7/6803aeed2dfc5c19a4ac96cd_ENCOVI%202024_presentacio%CC%81n_integrada.pdf',
  press: 'https://elucabista.com/2026/05/07/encovi-2025-pobreza-y-desigualdad-disminuyen-en-venezuela-sin-evolucion-del-bienestar-social/',
};

// Cifras publicadas tal cual (lámina indicada).
export const ENCOVI = {
  decileAvg: [18.1, 37.6, 53.4, 69.4, 88.5, 109.1, 138.2, 181.3, 247.3, 474.5], // US$ al mes por persona, lám. 38
  decileAvg2023: [10, 21.5, 30.9, 40.7, 51.9, 66.5, 84.4, 111.8, 163.2, 347.2], // lám. 38
  poorPersons: 0.765, extremePersons: 0.385, // lám. 36
  poorHomes: 0.685, extremeHomes: 0.317, // lám. 36
  gini: 0.459, gini2024: 0.539, // lám. 39
  homes: 9.0e6, homeSize: 3.1, population: 28.5e6, // lám. 4 y 5
  sample: 11352,
};

// Ocupados por categoría: % de ocupados y remuneración mensual promedio en US$.
// 2025: ENCOVI 2025, lám. 34. 2024: ENCOVI 2024, lám. 52.
export const WORK = [
  { n: 'Patrono o empleador', s: 2.6, v: 349.6, v24: 344.7 },
  { n: 'Asalariado del sector privado', s: 27.2, v: 230.1, v24: 189.5 },
  { n: 'Trabajador por cuenta propia', s: 41.9, v: 171.0, v24: 202.0 },
  { n: 'Asalariado del sector público', s: 22.2, v: 116.9, v24: 110.9 },
  { n: 'Servicio doméstico', s: 2.2, v: 112.7, v24: 120.1 },
  { n: 'Ayudante familiar', s: 2.4, v: 108.0, v24: 88.0 },
];

// Remuneración por nivel educativo alcanzado, ocupados mayores de 25 años, US$ por hora.
// ENCOVI 2024, lám. 58 (la edición 2025 no lo publica).
export const EDUCATION = [
  { n: 'Sin nivel', v: 3.6 },
  { n: 'Primaria incompleta', v: 6.43 },
  { n: 'Primaria completa', v: 7.52 },
  { n: 'Media incompleta', v: 6.1 },
  { n: 'Media completa', v: 6.4 },
  { n: 'Ingreso a educación superior', v: 9.5 },
];

// Curva de cuantiles del ingreso por persona: tramos log-lineales entre los límites de cada decil.
// Los nodos se ajustaron para que el promedio de cada tramo sea exactamente el promedio publicado del decil
// (ajuste por mínimos cuadrados, ver model.test.ts). Los extremos (p=0 y p=1) son una extrapolación del ajuste.
export const A: [number, number][] = [9.77, 30.20, 46.12, 61.41, 78.06, 99.84, 118.92, 159.46, 205.05, 294.99, 715.25].map((v, i) => [i / 10, v]);
const LA = A.map(([p, v]) => [p, Math.log(v)] as const);

export const MEMBERS = [1, 2, 3, 4, 6]; // "5 o más" se calcula como 6
export const SIZE_TXT = ['de 1 persona', 'de 2 personas', 'de 3 personas', 'de 4 personas', 'de 5 o más personas'];
export const SIZE_LABEL = ['1 persona', '2 personas', '3 personas', '4 personas', '5 o más'];

/** Ingreso por persona (US$) en el percentil p (0–1) de la población. */
export function Q(p: number): number {
  if (p <= 0) return A[0][1];
  if (p >= 1) return A[A.length - 1][1];
  const i = Math.min(9, Math.floor(p * 10));
  const t = (p - A[i][0]) / (A[i + 1][0] - A[i][0]);
  return Math.exp(LA[i][1] + t * (LA[i + 1][1] - LA[i][1]));
}

/** Percentil (0–1) de un ingreso por persona x (inversa de Q). */
export function P(x: number): number {
  if (x <= A[0][1]) return 0;
  if (x >= A[A.length - 1][1]) return 1;
  const lx = Math.log(x);
  let i = 0;
  while (lx > LA[i + 1][1]) i++;
  return A[i][0] + ((lx - LA[i][1]) / (LA[i + 1][1] - LA[i][1])) * (A[i + 1][0] - A[i][0]);
}

export const BASE_AVG = ENCOVI.decileAvg;
const TOT = BASE_AVG.reduce((a, b) => a + b, 0);
export const SHARES = BASE_AVG.map((v) => v / TOT);

// ENCOVI no publica el valor en US$ de sus líneas de pobreza. Las estimamos como el ingreso por persona
// en el que la curva deja por debajo al porcentaje de personas pobres publicado.
export const LINE_EXT = Q(ENCOVI.extremePersons);
export const LINE_POOR = Q(ENCOVI.poorPersons);

// Vulnerable, ingresos medios e ingresos altos: propuesta de este sitio (múltiplos de la línea de pobreza), no oficial.
const r = (n: number) => Math.round(n);
export const CL = [
  { n: 'Pobreza extrema', c: '--c-ext', lt: LINE_EXT, def: `Menos de US$ ${r(LINE_EXT)} por persona al mes` },
  { n: 'Pobreza no extrema', c: '--c-pob', lt: LINE_POOR, def: `Entre US$ ${r(LINE_EXT)} y US$ ${r(LINE_POOR)}` },
  { n: 'Vulnerable', c: '--c-vul', lt: 1.5 * LINE_POOR, def: `Entre US$ ${r(LINE_POOR)} y US$ ${r(1.5 * LINE_POOR)} (hasta 1,5 veces la línea)` },
  { n: 'Ingresos medios', c: '--c-med', lt: 3 * LINE_POOR, def: `Entre US$ ${r(1.5 * LINE_POOR)} y US$ ${r(3 * LINE_POOR)} (hasta 3 veces la línea)` },
  { n: 'Ingresos altos', c: '--c-alt', lt: Infinity, def: `Más de US$ ${r(3 * LINE_POOR)} (más de 3 veces la línea)` },
];

export const G = (si: number) => MEMBERS[si];
export const decOf = (p: number) => Math.min(10, Math.floor(p * 10) + 1);
export const classify = (pc: number) => {
  const i = CL.findIndex((c) => pc < c.lt);
  return i < 0 ? CL.length - 1 : i;
};

/* ---------- Formato (es-VE: punto para miles, coma para decimales) ---------- */
export function nf(n: number, d = 0): string {
  const neg = n < 0;
  const [int, dec] = Math.abs(n).toFixed(d).split('.');
  return (neg ? '−' : '') + int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (dec ? ',' + dec : '');
}
export const usd = (n: number, d = n < 10 ? 1 : 0) => 'US$ ' + nf(n, d);
export const pctTxt = (p: number) => Math.min(99, Math.max(1, Math.round(p * 100))) + ' %';

export const RATIO = BASE_AVG[9] / BASE_AVG[0];
