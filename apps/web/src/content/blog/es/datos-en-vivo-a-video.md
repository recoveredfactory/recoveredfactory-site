---
id: "live-data-to-video"
title: "Cómo convertimos datos en vivo en un video compartible, automáticamente"
date: "2026-06-26"
description: "Toma el atajo: cómo una página web oculta y una GitHub Action convierten datos frescos en video compartible."
type: "post"
byline: "David Eads"
editors:
  - "Tory Lysik"
  - "Ash Ngu"
tags:
  - "field-notes"
lang: "es"
previewImage: "/images/287g-preview.png"
---

<script>
  import ResizedImage from '$lib/components/ResizedImage.svelte';
</script>

En una publicación anterior, compartimos algunas de nuestras teorías sobre [cómo sacarle más provecho a tu sitio web](https://recoveredfactory.net/es/webs-not-dead), y ahora vamos a mostrar cómo puedes hacerlo tú mismo. Vamos a mantenerlo a grandes rasgos y describir el flujo de trabajo para que puedas construirlo tú mismo con tus herramientas favoritas o describírselo a un robot de programación con IA.

Empecemos con el problema: ¡a mí no me gusta hacer video\! Lo hago esporádicamente, pero no es algo habitual ni natural, y probablemente nunca lo será para mí. Hablamos de la persona de quien el gran Ari Shapiro dijo una vez en broma (y con razón) que tenía voz para la ingeniería de software. Es como tener cara para la radio, pero peor.

Puede que no tenga talento para el audio o el video, pero soy bastante bueno en ingeniería, y sé que a veces el truco para escalar no es más esfuerzo, sino mejor automatización. ¿Y si pudiéramos convertir nuestros recursos en video automáticamente y dejarlo listo para publicar en plataformas de video? Ya tenemos todos los ingredientes para hacerlo: hay datos que se actualizan cada pocos días junto con un mapa animado y gráficas en nuestro sitio.

<div class="grid grid-cols-2 gap-3 sm:gap-6 my-6 mx-auto max-w-lg sm:max-w-md">
  <ResizedImage
    src="/images/map-trend-latest-en.gif"
    alt="El video social de mapa y tendencia, versión en inglés, animando el crecimiento de 287(g) a lo largo del tiempo"
    figureClass="my-0 max-w-full"
    unoptimized
  />
  <ResizedImage
    src="/images/map-trend-latest-es.gif"
    alt="El video social de mapa y tendencia, versión en español"
    figureClass="my-0 max-w-full"
    unoptimized
  />
</div>

Eso forma el núcleo de un atajo fundamental que estamos usando para generar video social: una “panadería de recursos” impulsada por la web. La panadería de recursos, el pipeline de datos y el frontend de este proyecto son de [código abierto](https://github.com/recoveredfactory/287g-explorer/) si quieres profundizar.

## El truco: el video es una página web

Los navegadores web llevan ya un buen tiempo pudiendo hacer animaciones basadas en líneas de tiempo y efectos de movimiento bastante sofisticados. Combinado con la tecnología cada vez más madura para ejecutar “navegadores headless” — navegadores web que son invisibles para el usuario pero que una computadora puede “ver” — no necesitamos software de edición de video en absoluto.

Nuestro "video" en realidad es solo una página oculta en nuestro sitio web. Es una pantalla hecha a la medida, dimensionada para el formato vertical 9:16 que ves en Reels, Shorts y TikTok. Esta página especial apila las cosas que queremos frente a la cámara: un titular, el gran conteo de agencias, una gráfica animada, el mapa nacional y una pequeña línea de crédito. Son las mismas cosas que están en el sitio web en vivo.

Luego la grabamos cuadro por cuadro, manejando un navegador invisible con [Playwright](https://playwright.dev/), una biblioteca de automatización de navegadores a la que los ingenieros normalmente recurren para probar aplicaciones web, y unimos los cuadros con [ffmpeg](https://www.ffmpeg.org/) — más abajo explicamos exactamente cómo.

Previsualizar y depurar es más fácil: podemos abrir la página en un navegador, recorrerla hacia adelante y hacia atrás como un video, y diseñarla como diseñarías cualquier página web. Del mismo modo, hereda el marco multilingüe del sitio: podemos capturar videos para cada idioma que soportamos.

<ResizedImage
  src="/images/287g-preview.png"
  alt="La página de video de 287(g) Watch abierta en un navegador, con controles de reproducción y desplazamiento junto al cuadro de video vertical"
  figureClass="my-6 max-w-md"
  caption="Nuestra página de previsualización."
  class="w-full h-auto"
/>

## Un storyboard, escrito como un pequeño script

Un [único archivo corto](https://github.com/recoveredfactory/287g-explorer/blob/main/packages/web/src/lib/video/storyboard.ts) describe los tiempos y las transformaciones, como la lista de tomas de un director: mantener los totales de hoy por un instante, fundir a negro, saltar atrás a diciembre de 2024 (donde comienzan los datos), luego avanzar a través de dieciocho meses de crecimiento y volver a asentarse en hoy. Todo el asunto es solo un puñado de momentos con nombre y duración: una pausa de 1.5 segundos en hoy, un fundido de 0.7 segundos, una pausa de 1.5 segundos en el inicio de diciembre de 2024, etc., lo que en conjunto suma un clip de aproximadamente catorce segundos.

Todo lo que aparece en pantalla — la gráfica dibujándose, los puntos del mapa apareciendo, los contadores subiendo — está atado a un único “cabezal de reproducción” en movimiento, un controlador que garantiza que todos los componentes se rendericen correctamente en un instante dado, de modo que nada se desfase jamás. La arquitectura del cabezal de reproducción también es crítica para el siguiente truco.

## "Hornear": filmar la página cuadro por cuadro

Para convertir esa página en un archivo de video real, un script la abre en un navegador headless — un navegador automatizado, invisible y sin ventana. Lo manejamos con Playwright; solo lo estamos usando para capturar imágenes en lugar de ejecutar pruebas. El motor por debajo es Chromium, el núcleo de código abierto de Chrome.

Cuando empecé a intentar esto hace unos años, pensé que bastaría con hacer clic virtualmente en “reproducir” y ejecutar software de grabación de pantalla para capturar el resultado.

Pero estaba equivocado. La grabación de pantalla en tiempo real puede trabarse o perder cuadros, y ese comportamiento puede variar de sistema a sistema, de ejecución a ejecución. Algo que corre sin problemas en tu máquina local puede portarse mal en hardware en la nube supuestamente mucho más potente. En una prueba de mis primeros experimentos, en lugar de trabarse, un video capturado de esta manera a veces corría a hipervelocidad por razones que nunca pude identificar.

Queremos algo más confiable y menos sensible al entorno de cómputo, así que en su lugar hacemos metódicamente un folioscopio.

Esa arquitectura central del “cabezal de reproducción” nos permite decirle a la página: "muéstrame exactamente cómo te ves a los 0.04 segundos", y luego tomar una captura de pantalla. Después avanzamos a los 0.08 segundos, tomamos otra captura, y repetimos ese ciclo unos cientos de veces. Como estamos haciendo avanzar a manivela una página congelada y tomándonos nuestro tiempo para capturar cada cuadro, cada imagen se renderiza completa y correctamente — el entorno de cómputo no entra en juego.

El resultado es determinista y comprobable: si lo ejecutas dos veces, deberías obtener cuadros verificablemente idénticos. Las imágenes de captura de pantalla que genera son un recurso valioso por sí solas. También es fácil de razonar: el doble de cuadros implica aproximadamente el doble de tiempo de cómputo para renderizar y de espacio para almacenar.

Unos cuantos detalles duramente ganados hacen que esto corra de manera confiable en un servidor común y corriente. Los detalles completos están en la [versión de código abierto](https://github.com/recoveredfactory/287g-explorer); vale la pena destacar un par aquí:

- **Dibujar el mapa sin tarjeta gráfica.** El mapa nacional usa [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/), que pinta con código WebGL que normalmente espera una GPU. Nuestros servidores no tienen una, así que le decimos a Chromium que renderice por software. Es más lento que el hardware gráfico real, pero corre en casi cualquier plataforma con la misma calidad.
- **Cuadros baratos.** Guardamos cada cuadro como JPEG en lugar de PNG. La codificación PNG es la parte lenta de tomar una captura de pantalla, y el video se ve idéntico de cualquier manera — así que es una aceleración gratuita a lo largo de unos cientos de cuadros.
- **Mantener contento a un navegador dentro de un contenedor.** Los navegadores headless necesitan un puñado de flags poco glamorosos para correr de manera confiable en un servidor básico. Consulta el repositorio para más detalles.

Esos cuantos cientos de imágenes fijas luego se unen en un MP4 y un GIF en bucle con ffmpeg, el caballo de batalla de código abierto del procesamiento de video.

## Automatización

Todo esto está conectado a nuestro pipeline automatizado de datos, que corre como una GitHub Action programada. Unas cuantas veces al día, revisamos si los datos han cambiado.

Si llegan datos frescos, el trabajo reconstruye y vuelve a desplegar el sitio, hornea los cuatro cortes — proporciones cuadrada y vertical, en inglés y en español — y los publica en nuestra CDN de CloudFront, de modo que la página pública de descargas siempre ofrece el corte más reciente en cada idioma que soportamos.

El paso final es la subida automatizada de [borradores a YouTube](https://github.com/recoveredfactory/287g-explorer/blob/main/packages/web/scripts/publish-social-youtube.mjs), una [notificación para publicar](https://github.com/recoveredfactory/287g-explorer/blob/main/packages/web/scripts/notify-social-ready.mjs) en Instagram, y pronto también la integración con TikTok.

No nos oponemos categóricamente a la automatización total, pero para este proyecto quisimos trazar una línea deliberada: queremos participación humana, control editorial sobre titulares y descripciones, y una revisión final de cada video que sale. Sabemos que hasta los mejores sistemas pueden estropearse por datos de entrada defectuosos o generar algo equivocado. Preferimos usar nuestro juicio cada pocos días sobre cuál es la mejor manera de publicar y caracterizar estos videos que publicar a ciegas.

En el caso de YouTube, usamos la API oficial de la plataforma y creamos un video en borrador sin publicar. Desafortunadamente, Instagram solo permite publicar directamente al público a través de su API. Así que en ambos casos, cada vez que hay datos nuevos, generamos un borrador en YouTube y enviamos una alerta por correo electrónico avisando que es hora de revisar el borrador y crear manualmente una publicación en Instagram.

## Video social que es solo una página web

La recompensa es que diseñar el video es simplemente diseño web. Sin After Effects, sin reexportaciones manuales, sin números desactualizados, sin un productor web con otras 99 cosas que hacer.

Un cambio de color o de etiqueta es una edición de una línea, y el siguiente renderizado lo recoge. Todo el sistema es solo unos cientos de líneas de pegamento alrededor de herramientas que ya teníamos: nuestro pipeline de datos, un navegador headless, el mismo mapa y las mismas gráficas que corren en el sitio, y ffmpeg.

Y correr esto cuesta apenas unos dólares al mes. En contraste, parece que nuestro MCP de Missouri Vehicle Stops actualmente cuesta alrededor de $50 al mes. Es una disyuntiva clásica y un tema recurrente de nuestras publicaciones: el MCP ofrece una interacción expresiva con los datos a un costo por usuario significativamente más alto que nuestra panadería de recursos.

Es parte de nuestra estrategia general de perseguir las plataformas masivas con recursos autogenerados, compartibles y de alta calidad como estos videos, mientras mantenemos herramientas de datos modernas como el MCP para las personas profundamente comprometidas. Y vale la pena señalar lo que *no* estamos persiguiendo: el circo viral, una audiencia general mal definida, un producto único que sirva a todo el mundo.

## Nos gusta tomar atajos

Los atajos tienen mala fama. Si de lo que hablamos es de hacer trampa, eso es malo. Hacer trampa es malo. Pero si buscas la excelencia y no estás haciendo trampa, ¿qué tienen de malo los atajos si significan que puedes llegar más lejos y quedar menos agotado?

Suele ser un error confundir el *trabajo* con el *valor*. Podría obligarme a hacer algo que me da cierto pavor, con costos de oportunidad significativos, y darme palmaditas en la espalda por ser tan valiente y noble al usar un medio nuevo. Si esa es la nobleza que valoramos, no cuentes conmigo, porque prefiero mucho más escribir una GitHub Action que aproveche recursos que ya existen, de modo que solo tenga que pensar en hacer videos cuando quiera o cuando la situación realmente lo amerite.

Así que, la próxima vez: toma el atajo para que puedas terminar en un lugar más interesante.
