# Andolimpio

¿Cuántos venezolanos viven con menos que tu hogar? Escribes cuánto entra al mes en tu casa y cuántas personas viven en ella, y la página te ubica en la distribución del ingreso del país.

**En vivo:** https://andolimpio.angelcalderon.dev

## Datos

Todo sale de la [ENCOVI 2025](https://cdn.prod.website-files.com/5d14c6a5c4ad42a4e794d0f7/69fcb4f2d5587c07273d00e2_ENCOVI%202025_presentacio%CC%81n_UCAB-07%2005%202026.pdf) (UCAB-IIES, referencia mayo de 2025, 11.352 hogares) y, para trabajo y educación, de la [ENCOVI 2024](https://cdn.prod.website-files.com/5d14c6a5c4ad42a4e794d0f7/6803aeed2dfc5c19a4ac96cd_ENCOVI%202024_presentacio%CC%81n_integrada.pdf). Cada cifra en la página cita su lámina. Los datos están en [`src/lib/model.ts`](src/lib/model.ts).

## Cómo se calcula

La ENCOVI publica el ingreso promedio por persona de cada decil, no los microdatos. Ajustamos una curva de cuantiles por tramos log-lineales cuyo promedio en cada decil es exactamente el publicado, y ubicamos el ingreso por persona del hogar sobre ella.

Supuestos y estimaciones propias (también explicados en la página):

- Los deciles ordenan a la población por ingreso por persona; la presentación no lo precisa.
- La ENCOVI no publica sus líneas de pobreza en dólares. Las estimamos (≈ US$ 75 extrema, ≈ US$ 188 total, por persona al mes) como el ingreso que deja por debajo al porcentaje de personas pobres publicado.
- Vulnerable, ingresos medios e ingresos altos son una propuesta del sitio, no una clasificación oficial.
- Los extremos de la curva son una extrapolación.

## Desarrollo

```sh
npm install
npm run dev     # http://localhost:4321
npm test        # comprueba que la curva reproduce los deciles publicados
npm run build
```

Astro, sin framework de interfaz. El gráfico es un SVG generado en [`src/scripts/calculator.ts`](src/scripts/calculator.ts). Lo que escribes no sale de tu navegador.
