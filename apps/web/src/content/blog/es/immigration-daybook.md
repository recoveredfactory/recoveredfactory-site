---
id: "immigration-daybook"
title: "Immigration Daybook"
date: "2026-07-31"
type: "page"
hideTitle: true
description: "Un boletín nacional sobre inmigración hecho con datos. Cada estado, en dos idiomas, anclado en los registros y no solo en los titulares."
byline: "Recovered Factory"
hidePreview: true
lang: "es"
---

<div class="rf-hero not-prose">
  <div class="rf-hero__inner">
    <p class="rf-eyebrow">Muy pronto, de Recovered Factory</p>
    <h1 class="rf-headline">
      Immigration Daybook
      <span class="rf-headline__turn">Lo que pasa con la aplicación de la ley migratoria, en 53 jurisdicciones y dos idiomas.</span>
    </h1>
  </div>
</div>

<p class="rf-lede">La aplicación de la ley migratoria no es una sola historia nacional. Son cincuenta y tres: 50 estados, dos territorios y D.C. Cada uno avanza a su propio ritmo y casi siempre lo cuentan medios locales que nadie lee fuera del estado.</p>

<p class="rf-lede">Immigration Daybook les sigue la pista a todas. Buscamos en español y en inglés, anclamos cada resumen en los registros oficiales —no en lo que dijo un recuento nacional hace seis meses— y enlazamos a quienes hicieron el reporteo.</p>

<p class="rf-lede">Funciona con el mismo sistema que mueve <a href="https://287g.recoveredfactory.net/es">287(g) Watch</a>, que <a href="/es/una-historia-dos-idiomas">explicamos a detalle aquí</a>. Es gratuito y lo revisa una persona antes de enviarse.</p>

<div class="rf-subscribe not-prose">
  <SubscribeForm
    buttonClass="bg-fern-strong px-5 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-fern sm:shrink-0"
    id="daybook-subscribe-top"
    inputClass="w-full border border-slate-900/15 bg-white/90 px-5 py-4 text-lg text-slate-800 placeholder:text-slate-400 shadow-sm sm:max-w-[28rem] sm:flex-none"
    lang="es"
    source="immigration-daybook"
    tag="newsletter:immigration-daybook"
  />
  <p class="rf-subscribe__note">Gratis · Ediciones en español e inglés</p>
</div>

---

<p class="rf-kicker">Qué vas a recibir</p>

<h2 class="rf-q">Qué cambió, y dónde</h2>

Acuerdos nuevos, acuerdos cancelados, votaciones de concejos, demandas y leyes estatales que anulan las decisiones locales en cualquiera de las dos direcciones. Primero el registro: quién firmó, bajo qué modelo y desde cuándo. Después, la cobertura.

<h2 class="rf-q">Lo que la búsqueda en inglés no encuentra</h2>

El español es una vía de búsqueda, no un paso de traducción. Un hecho que cubrieron sobre todo los medios en español entra en igualdad de condiciones, y así quienes leen cualquiera de las dos ediciones se enteran de historias que de otro modo no habrían visto.

<h2 class="rf-q">Enlaces a quienes lo reportaron</h2>

Seguimos a un ecosistema de noticias; no lo reemplazamos. Cada punto lleva su cita a la redacción local que lo publicó primero. Muchas de ellas necesitan tu apoyo.

---

<p class="rf-kicker">Cómo se hace</p>

Una búsqueda amplia y multilingüe que alimenta un archivo permanente, y luego un sistema aparte que arma un esquema sin idioma —anclado en registros oficiales antes de mirar un solo titular— y lo escribe de forma nativa en cada lengua. Ninguna edición es la traducción de la otra.

Nada llega a quien lee sin que una persona decida que está bien. El método completo está [explicado aquí](/es/una-historia-dos-idiomas), incluidas las partes de las que todavía no estamos seguros.

<div class="rf-subscribe rf-subscribe--foot not-prose">
  <p class="rf-subscribe__lead">Recibe el primer número.</p>
  <SubscribeForm
    buttonClass="bg-fern-strong px-5 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-fern sm:shrink-0"
    id="daybook-subscribe-foot"
    inputClass="w-full border border-slate-900/15 bg-white/90 px-5 py-4 text-lg text-slate-800 placeholder:text-slate-400 shadow-sm sm:max-w-[28rem] sm:flex-none"
    lang="es"
    source="immigration-daybook"
    tag="newsletter:immigration-daybook"
  />
</div>

<p class="rf-fineprint">¿Preguntas, correcciones o una historia que se nos escapó? <a href="mailto:davideads@recoveredfactory.net?subject=Immigration%20Daybook">Cuéntanos.</a></p>

<script>
  import SubscribeForm from '$lib/components/SubscribeForm.svelte';
</script>

<style>
  /* ════════════════════════════════════════════════════════
     Immigration Daybook — mismo vocabulario visual que la
     página de Data Elixir: voz serif, mayúsculas geométricas
     para las etiquetas, filetes finos, un solo acento.
     ════════════════════════════════════════════════════════ */

  hr {
    border: 0;
    border-top: 1px solid rgba(15, 23, 42, 0.16);
    margin: 3.5rem 0;
  }

  .rf-hero { padding: 0; margin: 0.25rem 0 2.75rem; }
  .rf-hero__inner { margin: 0; }

  @media (min-width: 860px) {
    .rf-hero { margin-top: 0.75rem; }
  }

  .rf-eyebrow {
    margin: 0 0 1.1rem;
    font-family: "Jost", sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--color-fern);
  }

  .rf-headline {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 400;
    font-size: clamp(2.4rem, 7vw, 4rem);
    line-height: 1.03;
    letter-spacing: -0.02em;
    color: rgb(15 24 42);
    text-wrap: balance;
  }
  /* La línea de giro carga el argumento: más pequeña y más ligera
     que el nombre al que sigue. */
  .rf-headline__turn {
    display: block;
    margin-top: 0.55em;
    font-size: 0.4em;
    line-height: 1.25;
    letter-spacing: -0.005em;
    color: rgb(48 56 75);
  }

  .rf-lede {
    margin: 0 0 1.75rem;
    font-family: var(--font-body);
    font-size: 1.15rem;
    line-height: 1.6;
    color: rgb(48 56 75);
    text-wrap: pretty;
  }

  .rf-kicker {
    margin: 0 0 1.7rem;
    padding: 0;
    font-family: "Jost", sans-serif;
    font-size: 0.98rem;
    font-weight: 600;
    letter-spacing: 0.17em;
    line-height: 1.3;
    text-transform: uppercase;
    color: rgb(15 23 42);
  }

  .rf-q {
    margin: 2.75rem 0 1.1rem;
    padding: 0.1rem 0 0.1rem 0.95rem;
    border-left: 3px solid var(--color-fern);
    font-family: var(--font-display);
    font-size: clamp(1.35rem, 3.2vw, 1.8rem);
    font-weight: 600;
    line-height: 1.18;
    letter-spacing: -0.01em;
    color: rgb(15 23 42);
    text-wrap: balance;
  }

  .rf-subscribe { margin: 2rem 0 0; }
  .rf-subscribe--foot { margin-top: 2.5rem; }
  .rf-subscribe__lead {
    margin: 0 0 1rem;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 1.05rem;
    line-height: 1.5;
    color: rgb(51 65 85);
  }
  .rf-subscribe__note {
    margin: 1rem 0 0;
    font-family: "Jost", sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgb(71 85 105);
  }

  .rf-fineprint {
    margin: 2.75rem 0 0;
    font-family: var(--font-display);
    font-style: italic;
  }
  .rf-fineprint a { color: var(--color-fern); text-decoration: none; }
  .rf-fineprint a:hover { text-decoration: underline; text-underline-offset: 4px; }
</style>
