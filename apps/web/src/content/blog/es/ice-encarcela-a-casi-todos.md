---
id: "ice-jails-nearly-everyone"
title: "ICE encarcela a casi todas las personas que arresta y deporta a la mayoría de ellas"
date: "2026-07-15"
description: "Nuevos datos muestran que ICE ahora encarcela al 90% de las personas que arresta — y que la deportación es el desenlace más común."
type: "post"
byline: "David Eads and PromptQL"
tags:
  - "field-notes"
  - "immigration"
lang: "es"
previewImage: "/images/ddp-arrest-volume.png"
---

<script>
  import ArrestVolumeChart from '$lib/components/charts/ArrestVolumeChart.svelte';
  import DepartureCountriesChart from '$lib/components/charts/DepartureCountriesChart.svelte';
  import StayLengthChart from '$lib/components/charts/StayLengthChart.svelte';
  import Foldout from '$lib/components/Foldout.svelte';
  import NumbersLedger from '$lib/content/ddp-numbers-ledger-es.md';
  import DhsResponse from '$lib/content/ddp-dhs-response.md';
</script>

*Datos recién vinculados muestran que, bajo Trump, ICE ingresó a detención a cerca del 90% de las casi 390,000 personas que arrestó en el interior. Esa tasa casi universal no es nueva: ya había subido a casi el 90% para el final de los años de Biden. Pero ahora ICE realiza aproximadamente el triple de arrestos, lo que hace que la detención sea tanto de alta probabilidad como de alto volumen. La expulsión es ahora el desenlace más común: más de 261,000 personas —cerca de dos tercios de las arrestadas— terminaron en deportación o salida.*

*Este análisis y texto fue generado por [PromptQL](https://promptql.io), una plataforma colaborativa impulsada por IA que da sentido a fuentes de datos, documentos y conocimiento tribal dispersos. Escribí partes significativas de él, lo edité, contacté a fuentes y revisé el análisis de datos.*

*Estoy asesorando a la empresa y he comprobado que la plataforma es lo suficientemente potente y confiable como para apoyarme en ella en experimentos como este y en nuestros [resúmenes de noticias estatales](https://287g.recoveredfactory.net/es/states) de 287(g) Watch.*

*Esta versión en español es una traducción del original en inglés realizada por nosotros.*

<p class="section-break">⁘ ⁘ ⁘</p>


El 13 de julio de 2026, un oficial de ICE Enforcement and Removal Operations en Biddeford, Maine, mató a tiros a un colombiano de 26 años que estaba autorizado para trabajar en Estados Unidos y que no era el objetivo de la orden de arresto — [la segunda muerte por uso de fuerza letal de ICE en una semana](https://apnews.com/article/ice-shooting-maine-immigration-dhs-f26f8c2256aa6f0748582ea4adbb515c). Es apenas el ejemplo más reciente de un régimen de aplicación de la ley funcionando a toda máquina.

El 6 de julio de 2026, el [Deportation Data Project](https://deportationdata.org) [publicó un nuevo conjunto de datos](https://deportationdata.org/news/2026-07-05-joined-arrests-detention-stays-release.html) que vincula cada arresto de ICE con lo que ocurrió después. Eso importa porque, por primera vez, un único registro anonimizado a nivel individual sigue a una persona desde el arresto en el interior, pasando por la detención, hasta la expulsión. Lo que muestra: casi todas las personas que ICE arresta en el interior son encarceladas, y el desenlace más común es la deportación. Los arrestos se triplicaron aproximadamente después del 20 de enero de 2025, mientras que la tasa de detención —que ya venía subiendo durante los años de Biden— se ubica ahora en una meseta del 90%.

DHS ha emitido [más de 40 comunicados de prensa sobre los 'worst of the worst'](https://www.dhs.gov/news/2026/07/13/worst-worst-ice-arrests-murderers-pedophiles-violent-assailants-and-drug) (los peores de los peores) durante la era Trump, ha presumido de un [hito de 10,000 pandilleros arrestados](https://www.dhs.gov/news/2026/06/24/making-america-safe-again-ice-hits-milestone-more-10000-gang-members-arrested-under) y ha celebrado [13 meses seguidos de cero liberaciones en la frontera](https://www.dhs.gov/news/2026/06/19/trump-administration-delivers-13-straight-months-zero-releases-border). Pero la tasa de detención casi universal aplica a todos por igual, no solo a los delincuentes violentos que destacan sus titulares.

En un correo electrónico, un vocero de DHS dijo: “El Deportation Data Project se basa en divulgaciones de información que no han sido revisadas, auditadas ni contextualizadas. Ni DHS ni ICE han verificado la exactitud, la metodología ni el análisis del proyecto y sus resultados.” Pese a decir que no han revisado los datos, el mensaje pasa a afirmar: “La conclusión es que el Deportation Data Project no es preciso.”

Al no haber revisado la información ni la metodología, no pueden saber si es precisa. La respuesta completa hizo más afirmaciones sin aportar pruebas. Está disponible al final de esta publicación junto con nuestra metodología.

El Deportation Data Project no revisa sistemáticamente el material de terceros antes de su publicación, pero dijo que no encontró inexactitudes evidentes en nuestro análisis.

## Casi todas las personas que ICE arresta ahora son encarceladas

De las casi 390,000 personas que ICE arrestó desde la toma de posesión de Trump, cerca de 351,000 (90%) fueron ingresadas a detención. Esa tasa casi universal no es nueva — ya había subido hasta cerca del 90% para el final de los años de Biden, desde un promedio del periodo del 61.3% que oculta ese ascenso. Lo que cambió bajo Trump es el volumen: los arrestos se triplicaron aproximadamente. En conjunto, la detención es ahora de alta probabilidad y de alto volumen — ICE está arrestando a muchas más personas y encarcelando a casi todas.

<!-- chart: arrestos mensuales de ICE en el interior, apilados por detenidos vs. liberados — el volumen de arrestos se triplica aproximadamente después del 20 de enero de 2025 sobre una tasa de detención ya estabilizada cerca del 90%. -->
<ArrestVolumeChart lang="es" />

La custodia indefinida también está creciendo rápido; casi 50,000 personas arrestadas en este periodo permanecían bajo custodia de ICE, el 14.2% de todos los detenidos. Y las personas ahora pasan por más estancias — una mediana de tres periodos de detención por persona, frente a dos.

Lo que cambió no es la rapidez ni la duración de la detención. El ingreso a detención sigue ocurriendo dentro de un día, y la mediana de la estancia completada es de unos 22 días en ambas eras. Lo que cambió es si acaso se libera a alguien, y cuántas personas están siendo arrestadas.

## El desenlace más común es la expulsión

Los datos anteriores de arrestos de ICE publicados por el Deportation Data Project no permitían saber si una detención terminaba en deportación. Esta divulgación vincula cada arresto con el motivo de liberación de su estancia en detención y con la información del propio registro de arresto sobre la fecha de salida, el país de destino y la orden final. Eso hace que el trayecto del arresto a la deportación sea rastreable por persona.

Estos son desenlaces según los datos más recientes, no un recuento final. Cerca de uno de cada ocho arrestos de la era Trump —el 12.8%— no se había resuelto: la persona seguía bajo custodia de ICE cuando se extrajeron los registros. Y como los datos llegan por lotes, los meses más recientes están incompletos. Así que la proporción de abajo es un piso que aumentará a medida que se cierren los casos abiertos — y algunas personas contabilizadas como aún bajo custodia podrían ya haber sido deportadas de maneras que los datos todavía no reflejan.

Aun así, la expulsión o salida es ya el desenlace más grande de la era Trump, en un poco más de dos tercios de todos los arrestos — cerca de 261,000 personas. México es el principal destino, con casi 129,000 salidas, seguido de Guatemala con 42,000 y Honduras con 32,500; Venezuela, El Salvador, Ecuador, Nicaragua y Colombia completan los principales países.

<!-- chart: principales países de salida para los arrestos de la era Trump que terminaron en expulsión o salida. -->
<DepartureCountriesChart lang="es" />

## Dos tercios de los arrestados no tienen ninguna condena penal en EE. UU.

Cuando DHS sugiere que algunas de estas personas tienen antecedentes penales en otros países, puede tener razón, pero eso no es lo que miden estos datos. La propia clasificación de ICE cuenta únicamente las condenas en Estados Unidos, y según esa medida dos tercios de las personas que ha arrestado desde enero de 2025 no tienen ninguna.

El grupo individual más grande que ICE arrestó desde enero de 2025 es el de personas que la propia agencia clasifica como 'other immigration violators' (otros infractores de inmigración) no criminales. Estas personas sumaron 148,782 arrestos, más que los condenados o los acusados. Se trata de personas sin ningún cargo penal en absoluto, lo que significa que su única falta es un asunto civil de inmigración, un patrón documentado a fondo en el [reportaje del Marshall Project sobre un arresto en un control de tránsito en Georgia](https://www.themarshallproject.org/2025/08/15/ice-georgia-traffic-stop-arrest-immigration). Aun así, cerca del 83% de ellas fueron detenidas, frente a alrededor del 23% bajo Biden.

Los desenlaces para las personas con una condena penal y las personas con cargos pendientes (pero sin condena) eran prácticamente indistinguibles, ambas apenas por encima del 94%.

La composición ha ido cambiando mes a mes. En febrero de 2025, los 'other immigration violators' no criminales representaban el 22.8% de los arrestos; para diciembre de 2025 eran el 47.6%.

<!-- chart: distribución de las duraciones de las estancias de detención completadas y mediana de periodos por persona, era Trump versus era Biden. -->
<StayLengthChart lang="es" />

## Los socios policiales locales amplían el alcance de la aplicación de la ley migratoria

La expansión se apoya en parte en las fuerzas del orden locales, a las que DHS ha [cortejado públicamente](https://www.dhs.gov/news/2026/06/09/secretary-mullin-highlights-local-law-enforcement-cooperation-national-sheriffs). Más de 1,720 agencias estatales y locales tienen ahora [acuerdos 287(g)](https://287g.recoveredfactory.net), encabezadas por [Texas](https://287g.recoveredfactory.net/es/state/tx) y [Florida](https://287g.recoveredfactory.net/es/state/fl).

Esos acuerdos aparecen directamente en los datos de arrestos, aunque de forma modesta: cerca de 20,000 arrestos desde la toma de posesión de Trump (alrededor del 5%) llevan el código de aprehensión 287(g) de ICE, y el 93% de ellos terminó en detención, ligeramente por encima de la meseta general del 90%.

Sin embargo, esa proporción es un piso, ya que los arrestos hechos dentro de cárceles locales suelen registrarse con otros códigos. Las tasas de detención varían marcadamente según la región, desde el 99.0% en el área de Newark, New Jersey hasta el 53.1% en Harlingen, Texas. DHS ha atacado repetidamente a los gobernadores de los estados que se resisten, presentando detenciones (detainers) y exigiendo la no liberación en casos como un [caso de agresión en Illinois](https://www.dhs.gov/news/2026/07/09/ice-asks-governor-jb-pritzker-and-illinois-sanctuary-politicians-not-release) y un [cargo de violación en el condado de Fairfax, Virginia](https://www.dhs.gov/news/2026/07/07/ice-lodges-detainer-asking-governor-abigail-spanberger-and-fairfax-sanctuary), y presumiendo de la [expulsión de un hombre indultado por el gobernador de Minnesota](https://www.dhs.gov/news/2026/07/10/deported-dhs-removes-convicted-child-rapist-pardoned-minnesota-governor-tim-walz).

## Lo que estas cifras dicen y lo que no dicen

Todo lo aquí expuesto se refiere a los arrestos de ICE y sus consecuencias, no a la detención de ICE en su conjunto. Muchas estancias de detención comienzan sin un arresto de ICE —lo más frecuente en la frontera, tras un arresto de CBP— y no se incluyen; un lector enfocado en la detención en sí debería recurrir a los conjuntos de datos de estancias de detención. Una estancia de detención se vincula únicamente cuando el ingreso ocurre dentro de un rango de cinco días antes a diez días después del arresto, una tasa de coincidencia del 77%, cómodamente dentro del rango considerado confiable. Los meses posteriores a febrero de 2026 estaban incompletos y fueron excluidos.

Y las etiquetas de criminalidad son las propias clasificaciones administrativas de ICE, no fallos judiciales, una salvedad que juega en contra de usarlas tanto para validar como para refutar el encuadre de los 'worst of the worst'.

<Foldout id="how-we-did-this" label="Cómo lo hicimos">
  <NumbersLedger />
</Foldout>
<Foldout id="dhs-response" label="Respuesta del DHS, 16/7/2026 (en inglés)">
  <DhsResponse />
</Foldout>
