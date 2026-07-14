---
id: "webs-not-deads"
title: "La web no está muriendo, se está convirtiendo en infraestructura."
date: "2026-05-12"
description: "¿Deberías preocuparte por la muerte de la web? Solo si la estás pensando como un destino."
type: "post"
byline: "David Eads"
editors:
  - "Ash Ngu"
  - "Tory Lysik"
tags:
  - "field-notes"
lang: "es"
previewImage: "/images/factory-default--white-bg.png"
hidePreview: true
---

<script>
  import ResizedImage from '$lib/components/ResizedImage.svelte';
</script>

Lo has escuchado muchas veces en los últimos años: los medios de noticias están en medio de un “[evento de extinción](https://www.npr.org/2025/07/31/nx-s1-5484118/google-ai-overview-online-publishers)” en el que el tráfico web se desploma, las referencias desde buscadores se agotan, la IA se está comiendo la [larga cola](https://www.cjr.org/analysis/traffic-apocalypse-google-ai-overviews-killing-click-throughs-news-sites.php) y [Google Zero](https://www.theverge.com/24167865/google-zero-search-crash-housefresh-ai-overviews-traffic-data-audience) ya llegó. Parte de [esa retórica está inflada](https://www.seoforgooglenews.com/p/google-zero-is-a-lie), pero vi alguna versión de esto suceder en mi último trabajo, y lo veo en las tibias cifras web de nuestros proyectos actuales.

La tecnología web está en todas partes; la web en sí está retrocediendo a un segundo plano. Hay mucho discurso que pregunta "¿está muriendo la web?" y que trata a la web como un destino y mide cuánto sigue yendo la gente allí. Es fácil catastrofizar cuando lo miras así, pero lo que está pasando es algo que podemos aprovechar. Es el fin del mundo tal como lo conocemos, [y me siento bien](https://www.youtube.com/watch?v=Mjvu9ElurIo&list=RDMjvu9ElurIo&start_radio=1).

Una mejor pregunta es: ¿cómo puede la tecnología web apoyar e impulsar la participación, el intercambio de información y la narración en otras plataformas mientras cumple un rol más de nicho? Es un cambio de ser un destino en sí mismo a ser una tecnología fundacional al servicio de otros tipos de experiencias. En la práctica, eso significa diseñar para la web de maneras que se integren con el video y las plataformas sociales: encuestas y registros, descargas de datos, gráficos y mapas animados. La web cose las piezas entre sí; la audiencia más amplia las encuentra en otro lugar.

Mira nuestro [video más reciente](https://www.instagram.com/p/DXht4JTgNXr/) sobre [Missouri Vehicle Stops](https://vsr.recoveredfactory.net) y nota cómo aprovecho el diseño móvil del sitio para destacar rápidamente algunas tendencias importantes. Eso es porque construimos el sitio para que se viera bien y se navegara con fluidez, ante todo, en un formato de video vertical y móvil.

<ResizedImage
  src="/videos/vsr25_scrolling.gif"
  alt="Desplazándose por el sitio web en un video vertical nativo de redes sociales."
  figureClass="my-6 max-w-[300px] px-4 sm:px-0"
  caption="[Missouri Vehicle Stops](https://vsr.recoveredfactory.net) está optimizado para screencasts verticales y para expertos que quieren descargar los datos."
  class="w-full h-auto"
  unoptimized
/>

Nuestro sitio tiene buena participación: los usuarios buscan métricas específicas, dan varios pasos de navegación y 1 de cada 7 visitantes que no rebotan ha descargado los datos: no están consumiendo en nuestro sitio, están remezclando en sus propias herramientas. Aun así, como era de esperarse, el tráfico sigue en apenas unos cientos de visitantes. Al mismo tiempo, nuestra incipiente operación de publicación de video tiene más alcance después de solo dos publicaciones sin nada más que difusión orgánica.

Esa asimetría es poderosa porque nos permite priorizar. Las preguntas de diseño de interacción que atormentaban a las redacciones de prestigio donde trabajé empiezan a volverse más fáciles de responder una vez que preguntas: ¿qué se ve mejor en un screencast vertical?

Por ejemplo: Missouri Vehicle Stops tiene una gran tabla de agencias policiales y decenas de métricas para explorar; es lo que uso en el video para encontrar un departamento con una tasa baja de citaciones. Cuando haces clic en una agencia en esa tabla, ¿a dónde debería llevarte? ¿A una vista de la métrica específica que estabas viendo, o a un panorama general de esa agencia? Ambos son patrones defendibles. No tenemos analíticas claras para conocer la ruta dorada, ni para saber si siquiera existe una.

Pero al hacer el video, quedó claro al instante: ve al grano de una vez. Ir directo a los gráficos y detalles de esa métrica. Pasar por un centro de navegación que te pide hacer clic otra vez agrega segundos preciosos a videos que intentamos mantener por debajo de los dos minutos. Podríamos arreglarlo con edición, pero también podríamos simplemente optimizar el sitio para video desde el arranque.

<ResizedImage
  src="/videos/vsr25_navigation.gif"
  alt="Navegando por el sitio web en un video vertical nativo de redes sociales."
  figureClass="my-6 max-w-[300px] px-4 sm:px-0"
  class="w-full h-auto"
  caption="Teníamos que llegar rápido a los gráficos de Cape Girardeau."
  unoptimized
/>

He trabajado en varios lugares donde era un sacrilegio invertir menos en la presentación web o repensar nuestra relación con la tecnología web. En nuestro caso, la presencia web siempre iba a ser principalmente para una audiencia experta. La alta tasa de descargas es una señal: nuestros usuarios tienen experiencia real y muchos de ellos prefieren explorar los datos en su herramienta preferida antes que en la nuestra, por más hermosa que la hagamos. Esa es la audiencia del sitio-como-destino.

No van a ser muchos, y está bien, porque diseñamos para la remezcla sin sobrediseñar para una audiencia general que de todos modos no viene a nosotros como destino. El video es la remezcla. El sitio es lo que lo hizo posible.

<p class="section-break">⁘ ⁘ ⁘</p>

Tory, como siempre, sigue insistiendo en que Missouri Vehicle Stops sea más agradable y tenga una estética más limpia. No es fanática de la paleta de colores a pesar de ser quien la hizo. Hay mucho que podríamos mejorar, y su instinto es el correcto para el tipo de proyecto en el que la mayoría de nosotros nos formamos. También es el instinto que le estoy pidiendo a nuestro pequeño colectivo que desaprenda. Somos un equipo pequeño con horas finitas y cuentas que pagar. No puedo justificar que esas horas se vayan en pulir el sitio cuando la audiencia en la web a la que eso serviría no es la audiencia que tenemos. Puede que no sea perfecto estéticamente, pero funciona.

Es tentador llamar a esto abandonar el oficio. No creo que lo sea. El oficio es descubrir qué necesita ser la cosa y hacer esa cosa con excelencia. El trabajo que solía hacer —sudar el texto y los bloques interactivos de un reportaje de largo aliento para un sitio de destino— era verdadero oficio para ese escenario. Sudar cómo se lee una herramienta de datos en un clip de noventa segundos para que información significativa llegue a miles de personas que nunca visitarían el sitio directamente es el verdadero oficio para este.

La misma energía, solo que evolucionando con el mundo que nos rodea. ¡Y no soy bueno en esto! Pero estoy tratando de aprender.

<p class="section-break">⁘ ⁘ ⁘</p>

Durante mi último año en una redacción tradicional, varios reporteros más o menos de mi generación me dijeron que no se metieron al periodismo para que los LLM regurgitaran su trabajo, y mucho menos para optimizar su escritura para gente que usa chatbots. Válido. No se siente bien si tu oficio es escribir historias de destino para la web.

Lo que me sacudió es que quienes decían esto entraron al negocio más o menos al mismo tiempo que yo, en la década de 2010: tomaron los puestos de personas que decían que no se habían metido al periodismo para que su narrativa se redujera a un tuit o a una publicación de IG.

La queja se repite porque los escenarios siguen moviéndose. El trabajo consiste en descubrir cómo hacer buen periodismo en los escenarios que realmente tienes, no en el que quisieras tener. Eso significa tratar a la web como lo que es ahora —un lugar donde las cosas se construyen, se preparan y se hacen remezclables, donde ocurren las transacciones, donde la tecnología pega otros sistemas entre sí— y tratar a las plataformas que están aguas abajo de ella como el lugar donde el trabajo, por fin, se ve.

<p class="section-break no-drop">⁘ ⁘ ⁘</p>

Con ese fin, lo próximo será experimentar con animación y exportación de video para Missouri Vehicle Stops, y nos encantaría recibir tus comentarios sobre cómo hacerlo útil y qué te gustaría ver.

También vamos a hacer algo de promoción pagada en el excelente boletín de ciencia de datos [Data Elixir](https://dataelixir.com/). Tenemos la hipótesis de que, aunque la filantropía convencional no está muy entusiasmada con el periodismo de datos fundacional e informativo, puede que haya algunas personas adineradas en el mundo de los datos que sí lo estén.

Estamos invirtiendo en nosotros mismos, pero para que esto siga adelante necesitamos tu apoyo. [Si esto te parece valioso, considera una suscripción pagada, un apoyo único o contratarnos para tu próximo proyecto.](https://recoveredfactory.net/es/support)
