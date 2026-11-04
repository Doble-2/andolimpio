import test from 'node:test';
import assert from 'node:assert/strict';
import { A, P, Q, ENCOVI, LINE_EXT, LINE_POOR, SHARES, RATIO, nf, usd, classify, decOf } from './model.ts';

test('cada tramo de la curva promedia lo que publica ENCOVI 2025 para su decil', () => {
  for (let k = 0; k < 10; k++) {
    const [a, b] = [A[k][1], A[k + 1][1]];
    const mean = (b - a) / Math.log(b / a); // promedio de un tramo log-lineal
    assert.ok(Math.abs(mean / ENCOVI.decileAvg[k] - 1) < 0.002, `decil ${k + 1}: ${mean}`);
  }
});

test('las líneas estimadas dejan debajo al % de personas pobres publicado', () => {
  assert.ok(Math.abs(P(LINE_EXT) - 0.385) < 1e-9);
  assert.ok(Math.abs(P(LINE_POOR) - 0.765) < 1e-9);
  assert.ok(LINE_EXT > 70 && LINE_EXT < 80 && LINE_POOR > 180 && LINE_POOR < 195);
  assert.ok(Math.abs(RATIO - 26.2) < 0.1);
});

test('P es la inversa de Q y las partes suman 100 %', () => {
  for (const p of [0.005, 0.1, 0.5, 0.9, 0.97]) assert.ok(Math.abs(P(Q(p)) - p) < 1e-9);
  assert.equal(P(1), 0);
  assert.equal(P(100000), 1);
  assert.ok(Math.abs(SHARES.reduce((a, b) => a + b, 0) - 1) < 1e-9);
});

test('formato venezolano y clasificación', () => {
  assert.equal(nf(1234567), '1.234.567');
  assert.equal(nf(12.5, 1), '12,5');
  assert.equal(usd(480), 'US$ 480');
  assert.equal(classify(10), 0);
  assert.equal(classify(5000), 4);
  assert.equal(decOf(1), 10);
});
