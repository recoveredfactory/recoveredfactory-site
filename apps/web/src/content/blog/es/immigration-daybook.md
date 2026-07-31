---
id: "immigration-daybook"
title: "Immigration Daybook"
date: "2026-07-31"
type: "page"
hideTitle: true
description: "El boletín algorítmico más cuidado que vas a leer. La aplicación de la ley migratoria en las 53 jurisdicciones, de lunes a viernes, en español e inglés."
byline: "Recovered Factory"
hidePreview: true
lang: "es"
---

<div class="rf-hero not-prose">
  <div class="rf-hero__inner">
    <p class="rf-eyebrow">Muy pronto, de Recovered Factory</p>
    <h1 class="rf-wordmark">Immigration<br />Daybook</h1>
    <p class="rf-deck">{DECKS[ACTIVE_DECK]}</p>
    <ul class="rf-facts">
      <li>De lunes a viernes</li>
      <li>Las 53 jurisdicciones</li>
      <li>Español e inglés</li>
      <li>Gratis</li>
    </ul>
    <div class="rf-hero__cta">
      <SubscribeForm
        buttonClass="bg-fern-strong px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-fern sm:shrink-0"
        id="daybook-subscribe-top"
        inputClass="w-full border border-white/25 bg-white px-5 py-4 text-lg text-slate-800 placeholder:text-slate-400 sm:max-w-[24rem] sm:flex-none"
        lang="es"
        layoutClass="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-2"
        meta={{ deck: ACTIVE_DECK, placement: 'hero' }}
        source="immigration-daybook"
        successClass="mt-6 border border-white/20 bg-cream p-6 text-center sm:p-8"
        tag="newsletter:immigration-daybook"
      />
      <p class="rf-hero__note">Sin spam. Te das de baja cuando quieras.</p>
    </div>
  </div>
</div>

<div class="rf-body not-prose">

<p class="rf-lede">La aplicación de la ley migratoria no es una sola historia nacional. Son cincuenta y tres: 50 estados, dos territorios y D.C. Cada uno avanza a su propio ritmo y casi siempre lo cuentan medios locales que nadie lee fuera del estado. Ninguna redacción del país tiene gente suficiente para seguirlo todo.</p>

<p class="rf-graf">Por eso construimos un sistema que sí puede. Lee en español y en inglés, ancla cada resumen en los registros oficiales y no en lo que dijo un recuento nacional hace seis meses, y enlaza a quienes hicieron el reporteo. Después lo edita una persona: <a href="/es/presentamos-recovered-factory">David Eads</a>, inmigrante él mismo.</p>

<p class="rf-graf">La maquinaria importa justo ahora, y no lo escondemos: el método completo está <a href="/es/una-historia-dos-idiomas">explicado aquí</a>, incluidas las partes de las que todavía no estamos seguros.</p>

<section class="rf-section">
  <LatestEdition
    blurb="TK — una o dos frases sobre lo que trajo la edición, para que quien llega pueda juzgar antes de dejar su correo."
    dateline="TK · Edición del ——"
    kicker="La edición más reciente"
    note="Diseño TK · falta la primera edición"
    title="TK — el titular de la edición más reciente"
  />
</section>

<section class="rf-section">
  <p class="rf-kicker">Qué vas a recibir</p>
  <div class="rf-spec">
    <div class="rf-spec__row">
      <p class="rf-spec__num">01</p>
      <div class="rf-spec__text">
        <p class="rf-spec__label">Qué cambió, y dónde</p>
        <p class="rf-spec__body">Acuerdos nuevos, acuerdos cancelados, votaciones de concejos, demandas y leyes estatales que anulan las decisiones locales en cualquiera de las dos direcciones. Primero el registro: quién firmó, bajo qué modelo y desde cuándo. Después, la cobertura.</p>
      </div>
    </div>
    <div class="rf-spec__row">
      <p class="rf-spec__num">02</p>
      <div class="rf-spec__text">
        <p class="rf-spec__label">Lo que la búsqueda en inglés no encuentra</p>
        <p class="rf-spec__body">El español es una vía de búsqueda, no un paso de traducción. Un hecho que cubrieron sobre todo los medios en español entra en igualdad de condiciones, y así quienes leen cualquiera de las dos ediciones se enteran de historias que de otro modo no habrían visto.</p>
      </div>
    </div>
    <div class="rf-spec__row">
      <p class="rf-spec__num">03</p>
      <div class="rf-spec__text">
        <p class="rf-spec__label">Enlaces a quienes lo reportaron</p>
        <p class="rf-spec__body">Seguimos a un ecosistema de noticias; no lo reemplazamos. Cada punto lleva su cita a la redacción local que lo publicó primero. Muchas de ellas necesitan tu apoyo.</p>
      </div>
    </div>
  </div>
</section>

<section class="rf-section">
  <p class="rf-kicker">Cómo se hace</p>
  <p class="rf-graf">Una búsqueda amplia y multilingüe que alimenta un archivo permanente, y luego un sistema aparte que arma un esquema sin idioma —anclado en registros oficiales antes de mirar un solo titular— y lo escribe de forma nativa en cada lengua. Ninguna edición es la traducción de la otra.</p>
  <p class="rf-graf">Nada llega a quien lee sin que una persona decida que está bien.</p>
</section>

<section class="rf-section rf-section--cta">
  <p class="rf-subscribe__lead">Empieza el lunes.</p>
  <SubscribeForm
    buttonClass="bg-fern-strong px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-fern sm:shrink-0"
    id="daybook-subscribe-foot"
    inputClass="w-full border border-slate-900/20 bg-white px-5 py-4 text-lg text-slate-800 placeholder:text-slate-400 sm:max-w-[24rem] sm:flex-none"
    lang="es"
    layoutClass="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-2"
    meta={{ deck: ACTIVE_DECK, placement: 'foot' }}
    source="immigration-daybook"
    tag="newsletter:immigration-daybook"
  />
  <p class="rf-fineprint">¿Preguntas, correcciones o una historia que se nos escapó? <a href="mailto:davideads@recoveredfactory.net?subject=Immigration%20Daybook">Cuéntanos.</a></p>
</section>

</div>

<script>
  import LatestEdition from '$lib/components/LatestEdition.svelte';
  import SubscribeForm from '$lib/components/SubscribeForm.svelte';

  /**
   * Variantes del lema en prueba. Corre una a la vez: rotarlas en cada recarga
   * le mostraría líneas distintas a la misma persona y haría imposible saber
   * cuál consiguió la suscripción. Cambia ACTIVE_DECK para probar otro mensaje;
   * el id viaja con cada evento de suscripción para poder leer el resultado.
   *
   * Los ids van en paralelo con la página en inglés para que una prueba cubra
   * las dos ediciones. Las líneas están escritas en español, no traducidas: a
   * quien lee en español no le dice lo mismo la coletilla "en dos idiomas".
   */
  const DECKS = {
    raids:
      'Las redadas — y los papeles que las autorizaron. De lunes a viernes, en español e inglés.',
    weekday:
      'Cada día leemos las noticias migratorias en dos idiomas: el trámite, los litigios y las redadas que ya todos tememos.',
    rule:
      'Para quien necesita saber qué dice la norma, no solo qué pasó. Las noticias migratorias del día, en español e inglés.',
    thesis:
      'Las redadas se llevan los titulares. El procedimiento decide el resultado. Seguimos los dos, de lunes a viernes.',
    cull:
      'Cada día leemos decenas de artículos en español e inglés para poder descartar casi todos. Queda la ley, los expedientes y las redadas.',
    discard:
      'Decenas de artículos al día, casi todos descartados. Lo que sobrevive: las normas, los litigios y la aplicación de la ley.',
    lawyer:
      'Lo que un buen abogado de inmigración querría que hubieras leído esta mañana.',
    machine:
      'Una máquina lee todo lo que se publica en dos idiomas. Una persona decide qué importa. Te llega de lunes a viernes.',
  };

  const ACTIVE_DECK = 'raids';
</script>

<style>
  /* ════════════════════════════════════════════════════════
     Immigration Daybook — el extremo fuerte del estilo de la casa.
     Plancha de tinta a todo lo ancho, logotipo a escala de cartel,
     bordes duros, un solo carmesí. Vocabulario Bauhaus / Apple de
     los ochenta: sin esquinas redondeadas, sin degradados, sin
     sombras.

     A propósito seguimos con las tipografías de Recovered Factory
     (Lora + Jost). Se espera que el boletín se apoye en Futura;
     esta página se queda en el estilo de la casa hasta que esa
     decisión esté tomada.
     ════════════════════════════════════════════════════════ */

  /* ── Portada ──────────────────────────────────────────────
     Rompe la columna del artículo a todo lo ancho (el mismo truco
     que la tira de proyectos de Data Elixir) y vuelve a fijar la
     medida del texto por dentro, para que el borde izquierdo del
     logotipo se alinee con el cuerpo de abajo. */
  .rf-hero {
    position: relative;
    left: 50%;
    right: 50%;
    width: 100vw;
    margin-left: -50vw;
    margin-right: -50vw;
    margin-top: -0.75rem;
    margin-bottom: 3.5rem;
    background: #12161d;
    color: var(--color-cream);
  }

  .rf-hero__inner {
    max-width: 42rem;
    margin: 0 auto;
    padding: 3.5rem 1.5rem 3.25rem;
  }

  @media (min-width: 640px) {
    .rf-hero__inner { padding: 5rem 2.5rem 4.25rem; }
  }

  @media (min-width: 1024px) {
    .rf-hero__inner { padding: 6.5rem 4rem 5rem; }
    .rf-hero { margin-bottom: 4.5rem; }
  }

  .rf-eyebrow {
    margin: 0 0 1.75rem;
    font-family: "Jost", sans-serif;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--color-fern-strong);
  }

  /* Escala de cartel. El salto de línea va en el marcado para que
     las dos palabras se apilen a propósito y no donde al viewport
     le toque romper. */
  .rf-wordmark {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: clamp(3rem, 12vw, 6rem);
    line-height: 0.94;
    letter-spacing: -0.035em;
    color: var(--color-cream);
  }

  .rf-deck {
    margin: 2rem 0 0;
    max-width: 30rem;
    font-family: var(--font-display);
    font-size: clamp(1.25rem, 3vw, 1.7rem);
    font-weight: 400;
    font-style: italic;
    line-height: 1.35;
    color: rgba(243, 241, 233, 0.82);
    text-wrap: pretty;
  }

  /* Tira de datos: las condiciones del trato, entre el argumento y
     la petición. Filete carmesí en vez de viñetas. */
  .rf-facts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem 1.4rem;
    margin: 2.25rem 0 0;
    padding: 1.4rem 0 0;
    border-top: 2px solid var(--color-fern-strong);
    list-style: none;
    font-family: "Jost", sans-serif;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(243, 241, 233, 0.72);
  }
  .rf-facts li { margin: 0; }

  /* La petición vive dentro de la plancha: quien ya está
     convencido no tiene que bajar para actuar. */
  .rf-hero__cta { margin-top: 2.25rem; }

  .rf-hero__note {
    margin: 1rem 0 0;
    font-family: "Jost", sans-serif;
    font-size: 0.74rem;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(243, 241, 233, 0.5);
  }

  /* ── Cuerpo ───────────────────────────────────────────────
     Un solo contenedor manda sobre todas las separaciones debajo
     de la portada. La ruta envuelve la página en `.dropcap-prose
     space-y-6`, que añadía 1.5rem de margen superior a cada bloque
     y peleaba con los márgenes de aquí; el resultado se veía
     descuidado. Con un único hijo, space-y no tiene sobre qué
     actuar y el ritmo lo fija la escala de este bloque. */
  .rf-body { display: flow-root; }

  .rf-lede {
    margin: 0;
    font-family: var(--font-body);
    font-size: clamp(1.2rem, 2.2vw, 1.38rem);
    line-height: 1.5;
    font-weight: 500;
    color: rgb(15 23 42);
    text-wrap: pretty;
  }

  .rf-graf {
    margin: 0;
    font-family: var(--font-body);
    font-size: 1.05rem;
    line-height: 1.68;
    color: rgb(51 65 85);
    text-wrap: pretty;
  }

  .rf-lede + .rf-graf { margin-top: 1.5rem; }
  .rf-graf + .rf-graf { margin-top: 1.25rem; }

  .rf-body a {
    color: var(--color-link);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .rf-body a:hover { color: var(--color-fern); }

  /* ── Secciones ────────────────────────────────────────────
     Un único tratamiento de separador para toda la página. El
     filete pertenece a la sección que abre, así ninguna sección
     acaba con una línea suelta arriba y otra separación abajo. */
  .rf-section {
    margin-top: 3.25rem;
    padding-top: 3.25rem;
    border-top: 1px solid rgba(15, 23, 42, 0.2);
  }

  @media (min-width: 640px) {
    .rf-section {
      margin-top: 3.75rem;
      padding-top: 3.75rem;
    }
  }

  .rf-kicker {
    margin: 0 0 1.1rem;
    font-family: "Jost", sans-serif;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    line-height: 1.3;
    text-transform: uppercase;
    color: rgb(15 23 42);
  }

  /* ── Lista de especificaciones ────────────────────────────
     Filas numeradas, etiqueta en serif de display y cuerpo al
     lado. Sin filete arriba ni en la última fila: la línea de la
     sección ya cierra el bloque y duplicarlas era parte del
     desorden. */
  .rf-spec { margin: 0; }

  .rf-spec__row {
    display: grid;
    grid-template-columns: 2.25rem minmax(0, 1fr);
    gap: 0 1.25rem;
    padding: 1.5rem 0;
    border-bottom: 1px solid rgba(15, 23, 42, 0.14);
  }
  .rf-spec__row:first-child { padding-top: 0; }
  .rf-spec__row:last-child { border-bottom: 0; padding-bottom: 0; }

  @media (min-width: 640px) {
    .rf-spec__row {
      grid-template-columns: 3.25rem minmax(0, 1fr);
      gap: 0 2rem;
      padding: 1.85rem 0;
    }
  }

  .rf-spec__num {
    margin: 0;
    font-family: "Jost", sans-serif;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.5;
    letter-spacing: 0.04em;
    color: var(--color-fern);
    font-variant-numeric: tabular-nums;
  }

  .rf-spec__text { min-width: 0; }

  .rf-spec__label {
    margin: 0 0 0.5rem;
    font-family: var(--font-display);
    font-size: clamp(1.12rem, 2.4vw, 1.3rem);
    font-weight: 600;
    line-height: 1.28;
    letter-spacing: -0.01em;
    color: rgb(15 23 42);
    text-wrap: balance;
  }

  .rf-spec__body {
    margin: 0;
    font-family: var(--font-body);
    font-size: 0.98rem;
    line-height: 1.62;
    color: rgb(71 85 105);
    text-wrap: pretty;
  }

  /* ── Petición final ───────────────────────────────────── */
  .rf-subscribe__lead {
    margin: 0 0 1.25rem;
    font-family: var(--font-display);
    font-size: clamp(1.6rem, 3.6vw, 2.1rem);
    font-weight: 600;
    line-height: 1.18;
    letter-spacing: -0.02em;
    color: rgb(15 23 42);
  }

  .rf-fineprint {
    margin: 2rem 0 0;
    font-family: var(--font-display);
    font-style: italic;
    color: rgb(71 85 105);
  }
</style>
