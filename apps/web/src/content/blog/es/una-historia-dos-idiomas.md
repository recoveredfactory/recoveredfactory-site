---
id: "one-story-two-languages"
title: "Una historia, dos idiomas: cómo resumimos las noticias sobre 287(g)"
date: "2026-07-30"
description: "Cómo escribimos resúmenes bilingües de noticias sobre el programa de ICE para cada estado, y la idea de fondo que hace que funcione."
type: "post"
byline: "David Eads"
editors:
  - "Tory Lysik"
tags:
  - "field-notes"
  - "immigration"
lang: "es"
previewImage: "/images/one-story-two-languages-og.png"
---

<script>
  import ResizedImage from '$lib/components/ResizedImage.svelte';
</script>

<p class="no-drop"><a href="https://287g.recoveredfactory.net">287(g) Watch</a> ya publica una historia continua del programa en <a href="https://287g.recoveredfactory.net/es/states">los 53 estados y territorios que seguimos</a>, incluidos los que nunca han participado y los que ya no lo hacen, en inglés y en español. Las dos ediciones salen del mismo pipeline. Ninguna es traducción de la otra y, sin embargo, juntas cuentan una historia más rica que la que puede contar la cobertura en un solo idioma.</p>

<figure class="rf-resized-image mx-auto my-8 max-w-3xl">
  <div class="grid grid-cols-2 gap-3 sm:gap-5">
    <img
      src="/images/287g-summary-mo-es.png"
      alt="El resumen de noticias en español en la página de Misuri de 287(g) Watch: un titular de dos oraciones en cursivas y luego un texto narrativo con enlaces a los reportajes que respaldan cada desarrollo."
      class="w-full h-auto rounded-lg shadow-xl"
      loading="lazy"
      decoding="async"
    />
    <img
      src="/images/287g-summary-mo-en.png"
      alt="El resumen de noticias en inglés en esa misma página de Misuri, que cubre los mismos desarrollos en el mismo orden pero escrito de forma nativa en inglés, con sus propios enlaces."
      class="w-full h-auto rounded-lg shadow-xl"
      loading="lazy"
      decoding="async"
    />
  </div>
  <figcaption class="rf-image-caption mt-3 text-xs text-slate-500">Misuri, en <a href="https://287g.recoveredfactory.net/es/state/mo#news">español</a> y en <a href="https://287g.recoveredfactory.net/en/state/mo#news">inglés</a>. La misma entrada, los mismos desarrollos, el mismo orden — pero las oraciones rara vez se corresponden, porque ninguna edición se escribió a partir de la otra.</figcaption>
</figure>

Todo lo demás que hay aquí — búsqueda, deduplicación, control de costos — es plomería que vamos a recorrer rápido. La idea que creemos que vale la pena robarse es la del final: **arma un solo esquema neutral respecto al idioma con todo lo que encontraste en todos los idiomas, y luego escríbelo de forma nativa en cada uno.**

El sistema tiene dos mitades: la ingesta, que corre sobre Amazon Web Services, y la composición, que corre en [PromptQL](https://promptql.io), una herramienta colaborativa de conocimiento con IA que trabaja a partir de tus datos y tu documentación, y mantiene esa documentación al día conforme colaboras. Puedes pensarla como una versión turbo y mucho más precisa del concepto de la [LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

Vamos a mantener esto al nivel de *qué hace el sistema*. Nosotros usamos AWS para el ingestor, pero también se podría construir sobre algo como DigitalOcean. Podrías escribir tú mismo un agente compositor o una skill de LLM en lugar de usar PromptQL. Queremos que puedas pasarle la forma de todo esto a un agente de programación y construir el tuyo.

Pero antes: esto solo funciona porque hay un *ecosistema de noticias* al cual seguirle la pista. Muchos de los medios locales que enlazamos necesitan tu apoyo, y también tus comentarios sobre cómo quieres realmente informarte y cómo pueden mejorar. Un sistema como el nuestro lee las noticias y encuentra patrones más grandes. Esperamos que sirva para fortalecer el buen periodismo de terreno que se está haciendo por todo el país, pero de ninguna manera puede reemplazarlo.

## Por qué no funcionan las soluciones obvias

En buena medida, las tendencias del 287(g) [se ven mejor a nivel estatal](https://287g.recoveredfactory.net/es/states).

La participación es voluntaria, pero los estados pueden pasar por encima de las decisiones locales en cualquiera de las dos direcciones: algunos, como [Illinois](https://287g.recoveredfactory.net/es/state/il#news), lo han prohibido, y otros, como [Florida](https://287g.recoveredfactory.net/es/state/fl#news), lo han vuelto obligatorio. Así que la historia en realidad son 53 historias — 50 estados, los dos territorios con acuerdos y Washington D.C. —, cada una avanzando a su propio ritmo. Es más de lo que puede leer, ya no digamos escribir, nuestra publicación de dos personas y sueldos apenas simbólicos.

<ResizedImage
  src="/images/287g-state-index-es.png"
  alt="El índice de estados de 287(g) Watch, con cada estado y territorio, su número de agencias, el desglose por modelo, la población cubierta y un resumen de noticias escrito con IA. Arriba se ven Texas y Florida."
  width={1000}
  figureClass="my-6 max-w-2xl"
  class="rounded-lg shadow-xl"
  caption="Cincuenta y tres jurisdicciones, cada una con su propio arco. Todos estos resúmenes existen también en inglés."
/>

Y las soluciones obvias se caen a pedazos:

- **Leerlo todo tú mismo.** Te quemas en un mes, si es que llegas, sin haber cubierto ni una fracción. No creemos en [ese tipo de autoinmolación](https://recoveredfactory.net/es/por-qué-ir-despacio).

- **Hacerlo a la antigua, con gente.** Puede funcionar. El *Opening Statement* de The Marshall Project lo demuestra, y proyectos que dirigí en [The Marshall Project](https://www.themarshallproject.org/2024/10/21/fact-check-12000-trump-statements-immigrants) y [NPR](https://www.npr.org/2016/07/21/486883610/fact-check-donald-trumps-republican-convention-speech-annotated) sacaron poder real de coordinar a decenas de periodistas. Pero a cuatro horas por estado, 53 textos son más de cinco semanas de trabajo a tiempo completo. La mayoría de las organizaciones va a concluir, con razón, que su gente tiene cosas mejores que hacer.

- **Hacerlo a la moderna, mal.** Apunta un modelo de lenguaje a "las noticias" y pídele un resumen. He visto a editores de la vieja escuela intentar exactamente eso. Lo que regresa es un dato correcto envuelto en un error sutil y a veces gravísimo: el gobernador sí firmó la ley, en marzo — del año *pasado*. URLs alucinadas. Nombres de publicaciones que no existen. Una herramienta de investigación profunda clavó todos los detalles de una cita salvo la raza, la edad y la profesión de la persona citada. Sin editar, eso es basura. Editado, puede quedar *decente*, pero vuelves a tener un problema de trabajo: un esfuerzo de edición enorme en cada ronda, sobre un producto cuyo techo es *decente*.

Así que no construimos un resumidor ingenuo, y tampoco salimos a buscar la fundación de algún multimillonario ante la cual tendríamos que rendir cuentas para financiar el trabajo. Y no nos quemamos. Construimos algo que combina **la historia que cuentan los registros** con **un archivo de la historia que contó la prensa, en los principales idiomas en que la contó.**

## La decisión de la que se desprende todo lo demás

Separa el **recordar** del **escribir**, y mantenlos estrictamente aparte.

*Recordar* es trabajo de máquina: echar una red amplia, jalar todo lo que pueda importar, limpiarlo, etiquetarlo, archivarlo. Este paso debe ser amplio, un poco excesivo y barato. La falla que duele es que se te escape algo. Unos cuantos artículos fuera de tema cuestan fracciones de centavo en procesarse y almacenarse. Una nota que solo existe en español y que nunca viste es un hueco que nada aguas abajo puede rellenar.

*Escribir* es trabajo editorial, incluso cuando quien teclea es un modelo: qué va a la entrada, qué se conecta con qué, qué hacer con un estado que tiene tres artículos y con uno que tiene trescientos, cómo evitar irse por default a las firmas famosas sin dejar de encontrar trabajo de calidad. Criterio, codificado como reglas, prompts y restricciones.

Entonces: un sistema construye la memoria y otro distinto la lee y escribe. Quien escribe no puede tocar la memoria, y la memoria no sabe escribir. El traspaso es una promesa de dos partes: la corrida quedó confirmada, y a quien escribe ya se le avisó. Traza esa línea y las cosas se vuelven más fáciles en ambas direcciones. Cambias de modelo y el archivo queda intacto. Agregas idiomas y el compositor sigue generando texto preciso y legible. Eso es exactamente lo que quieres cuando quien escribe es un modelo de lenguaje.

## Primera parte: construir la memoria

### Un cóctel de búsquedas

Ninguna fuente por sí sola captura toda la amplitud de la cobertura sobre un tema. Nuestras pruebas mostraron poca coincidencia entre lo que devolvían distintos buscadores, y huecos grandes en todos ellos. Así que preparamos un cóctel:

- **APIs de búsqueda amplias** para maximizar la recuperación. Google News es una base decente; Exa es excelente y se lleva bien con los agentes; Perplexity suele ser el más actualizado y el mejor para sacar a flote documentos oficiales, aunque hay que vigilarlo por las alucinaciones.
- **Fuentes que siempre ingerimos**, aparezcan o no en los resultados de búsqueda: el Boletín de Visas del Departamento de Estado y los comunicados de DHS e ICE.
- **Medios que conocemos por nombre** y que la búsqueda mainstream subestima: The Haitian Times, Sahan Journal, voces especializadas como el *Insightful Immigration Blog* de Cyrus Mehta, los noticieros en español.

Para cada lugar corremos varios *tipos* de consulta: la obvia ("acuerdos 287(g) en Hawái") más las oblicuas ("alianza de ICE con la policía local en Hawái"), en inglés y en español. Las oblicuas capturan el universo más amplio de colaboración con ICE.

Y jalamos el texto completo de cada nota, porque los titulares no dan señal suficiente.

Echar una red amplia trae el riesgo de sacar a flote periodismo *pink slime* y medios de propaganda. Nos ha dado gusto encontrar que Exa hace un buen trabajo filtrando ese material en esta etapa del proceso, y más adelante describimos un truco que también parece ayudar.

### Limpiar, etiquetar, agrupar

Todo pasa por el mismo pipeline:

- **Deduplicar**, empezando por la verificación más barata: coincidencias exactas de URL, luego una huella digital del texto para detectar reimpresiones casi idénticas — ambas gratuitas —, y solo después embeddings para lo que sobreviva. La mayoría de los duplicados muere antes de costar nada.
- **Clasificar**: ¿esto trata del tema y de qué tipo de hecho se trata — un acuerdo firmado, una demanda, una votación del cabildo, una redada?
- **Geoetiquetar**: ¿qué estado, qué condado, qué agencia?
- **Agrupar**: juntar los artículos que cubren lo mismo.

Un montón de artículos no sirve de mucho. Una historia sí. Por eso los grupos se enrutan hacia **hilos**, líneas narrativas persistentes como "expansión del 287(g) en Misuri" que viven de una corrida a otra y crecen conforme sigue la cobertura. Cada grupo nuevo se suma a un hilo, abre uno o despierta uno dormido, y el sistema califica su propia confianza en esa decisión. Los enrutamientos de baja confianza se marcan para revisión humana en vez de quedar confirmados u omitidos. Estar en duda se vale; estar en duda y aparentar lo contrario, no.

Y **el resumen de un hilo siempre se reconstruye desde los hechos de base, nunca desde su propio resumen anterior.** Si siembras los resúmenes nuevos con los viejos, arrastras los errores hacia adelante y degradas el resultado en cada corrida. Un resumen nunca desciende de otro resumen. Regresa a las afirmaciones de la fuente.

Tres reglas mantienen todo esto barato.

- **Cada llamada al modelo pasa por una API por lotes, sin excepciones y sin vía rápida.** Eso corta el precio a la mitad a cambio de tiempos de respuesta en horas en lugar de segundos. La latencia no cuesta nada con una cadencia diaria, y la parte de "sin excepciones" elimina toda una categoría de bugs al dejar un solo camino que probar.
- **Clasificar una vez, para siempre**: las etiquetas quedan en caché contra una huella estable del contenido, así que volver a ingerir mañana la misma nota desde otro feed sale gratis.
- **Nada ocioso**: una instancia pequeña de Postgres y un enjambre de funciones que despiertan, trabajan y se duermen. Solo pagamos por lo que usamos.

## El principio Bad Bunny

El español es una pata de la búsqueda, no un paso de posprocesamiento. Llámalo el principio Bad Bunny, por su show de medio tiempo del Super Bowl, donde dijo "God bless America" y a continuación nombró prácticamente todos los países de las Américas. Es un valor central para nosotros, y ya hemos escrito antes sobre por qué los proyectos de Recovered Factory son [multilingües desde el principio](https://recoveredfactory.net/es/cómo-y-por-qué-multilingüe).

<ResizedImage
  src="/images/bad-bunny-flags.gif"
  alt="Bad Bunny bailando en el show de medio tiempo del Super Bowl con banderas de las Américas."
  figureClass="my-6 max-w-lg"
  unoptimized
/>

En concreto: cada jurisdicción recibe una red en español junto a la red en inglés. Términos de búsqueda formulados desde el español (*redadas*, *cita de asilo*, *permiso de trabajo*, *carga pública*), un ángulo de televisión para los *noticieros*, y una pasada acotada a los medios en español y bilingües que conocemos por nombre. Lo hacemos incluso en estados sin un medio en español evidente, porque el punto es atrapar el desarrollo que solo existe en español y que la cobertura en inglés no vio, y porque la cobertura no respeta fronteras estatales ni nacionales. Una historia sobre un sheriff de Georgia puede reventar en una redacción de la Ciudad de México.

Si traduces al final, nunca podrás ser mejor que tu recuperación en inglés. Si buscas en los dos idiomas, no estás traduciendo una historia: estás encontrando más de ella para *todos* los públicos.

## Segunda parte: construir una columna vertebral

Una vez que una corrida de búsqueda queda confirmada — diario, semanal o con la cadencia que sea —, el sistema de escritura despierta, lee el archivo por una puerta de solo lectura y hace una sola cosa antes de escribir una sola frase: **construye una columna vertebral basada primero en lo que ya sabemos, y después en todo el corpus, en todos los idiomas que buscamos.**

La columna es una lista ordenada de puntos: las cosas que la pieza tiene que decir, en el orden en que debería decirlas. Por ejemplo: el gobernador firmó una ley en la primavera pero un tribunal la tumbó en el otoño, mientras activistas presionaban a las ciudades para cambiar sus políticas. Es la estructura de fondo de cualquier producto noticioso narrativo. En nuestro montaje la columna es neutral respecto al idioma, más cerca de unas notas en fichas que de un texto redactado, y tanto la edición en inglés como la edición en español descienden de ese único esquema, y no una de la otra.

**Este es el truco más importante para que esto funcione**, y depende de componer el texto con una herramienta como [PromptQL](https://promptql.io) (o una propia) capaz de inyectar datos precisos junto a tu conocimiento, tus guías y tus reglas editoriales.

### Primero el anclaje, después las noticias

La columna no arranca con los titulares. Siempre que podemos, arranca con lo que ya sabemos, usando registros imperfectos pero autorizados que nos ha tomado mucho tiempo limpiar y entender.

Para el 287(g), eso significa el registro de ICE de agencias participantes: quién ha firmado, bajo qué modelo, con corte al final de la ventana sobre la que escribimos, más un pequeño conjunto de hechos permanentes desarrollados mediante investigación y reporteo. Los datos y los hechos ponen los cimientos.

Una vez establecidos una cronología aproximada y los patrones a partir de fuentes autorizadas, empezamos a llenar el esquema con enlaces a artículos y a buscar puntos noticiosos dentro de esa estructura.

El registro siempre gana: la situación actual de un estado, su número de agencias y su lugar en el ranking nacional salen del registro, no de lo que haya dicho hace seis meses algún resumen nacional. A la columna nunca se le permite afirmar una posición, una ausencia o una caracterización que los registros o nuestro reporteo no sostengan. Es la misma disciplina que *nunca resumas un resumen*, aplicada un nivel más arriba. Genera desde la estructura y los hechos. Nunca desde otro texto generado, y nunca desde una fuente noticiosa que contradiga el registro.

Esto parece funcionar como un filtro efectivo de última milla para dejar fuera el periodismo *pink slime* y los medios de propaganda, pero no lo hemos estudiado a fondo como para entender de verdad qué está pasando.

### Un esquema, todos los idiomas

La mitad noticiosa de la columna se construye a partir de la **unión de la cobertura en todos los idiomas que buscamos**, no del montón en inglés con el español consultado después. Un desarrollo cubierto sobre todo por medios en español se gana un punto en igualdad de condiciones con cualquier otro. Mirar *a través* de los idiomas es el mecanismo que vuelve real, y no aspiracional, el principio Bad Bunny.

Esos puntos los sacamos de artículos individuales, no de los grupos de notas que el archivo ya armó. Los grupos son un enriquecimiento útil, pero tienden a juntar la cobertura de un mismo idioma, así que una nota delgada que solo existe en español puede desaparecer dentro de un hilo dominado por el inglés. El compositor regresa al grano del artículo y construye desde el pozo bilingüe completo, usando los grupos como orientación.

### Selectivo a propósito

La columna consolida sin piedad. Los temas muy cercanos se fusionan, las menciones marginales y aisladas se caen, y hay un techo duro sobre cuántos puntos puede cargar un resumen. Una versión anterior del compositor intentaba descartar lo menos posible, y el resultado era más largo, más plano y menos útil. La palanca de extensión que de verdad funciona es tener menos puntos: una historia estatal apretada, no un volcado de cada votación de cabildo que hay en el corpus.

Lo selectivo también tiene una arista geográfica. Cada resumen se mantiene enfocado en su estado principal. Nada de coletillas del tipo "más allá de Misuri…", nada de conteos multiestatales como color de cierre, nada de historias nacionales sin gancho local. Todas esas son cosas que los modelos de lenguaje, tratando de ser útiles, quieren meter.

Si el pozo dentro del estado queda delgado después de filtrar, el resumen termina antes. Que sea corto es lo correcto. Rellenarlo con material de fuera del estado, no.

Y la puerta temática es más estrecha que "noticias de inmigración sobre este estado". Un desarrollo entra solo si trata de **la policía local trabajando con ICE**: un acuerdo bajo cualquier modelo del 287(g), otro arreglo como las órdenes de retención o el acceso a las cárceles, o el rechazo directo, los litigios o la fiscalización *de esa cooperación*. Detenciones sin socio local, tribunales de inmigración, visas, propuestas en la boleta, redadas solo federales: fuera, por más noticiosas que sean y por más veces que aparezca el nombre del estado.

Algunas jurisdicciones casi no producen cobertura sobre el 287(g) ni sobre otras formas de colaboración de la policía local con ICE en una ventana de tiempo dada. Lo honesto no es inventar una narrativa ni rellenar con noticias generales de inmigración. Normalmente la historia ahí es el registro mismo: qué agencias firmaron y cuándo. El compositor narra ese arco a partir de los datos estructurados y no especula, porque poca cobertura no significa que no esté pasando nada, y el registro a menudo dice lo contrario.

A la inversa, componemos entradas para los estados que no participan en el programa en absoluto. Un estado que no participa puede tener muchísimas noticias sobre el 287(g), porque son blanco del gobierno de Trump.

<ResizedImage
  src="/images/287g-summary-nd-es.png"
  alt="El resumen de Dakota del Norte en 287(g) Watch. Dice con todas sus letras que hay relativamente pocas noticias sobre el 287(g) en el estado, y luego narra el registro: 11 agencias participantes bajo 16 memorandos de entendimiento vigentes, con el estado en el puesto 24.º a nivel nacional."
  width={900}
  figureClass="my-6 max-w-xl"
  class="rounded-lg shadow-xl"
  caption="Dakota del Norte, donde el registro es la historia. El resumen dice en voz alta que la cobertura es escasa, y se niega a concluir que no está pasando nada."
/>

### Escrito dos veces, de forma nativa

Una vez que existe la columna, se redacta dos veces. La edición en inglés se escribe como inglés. La edición en español se escribe como español, con su propio ritmo, sus propios modismos y su propia idea de lo que un público lector en español ya sabe. La misma información, los mismos hechos, el mismo orden (aproximado). Ninguna es traducción de la otra, porque ambas descienden del mismo esquema y no una de la otra.

Ya lo hemos dicho: la mejor manera de hacer contenido multilingüe es [abandonar la paridad estricta](https://recoveredfactory.net/es/cómo-y-por-qué-multilingüe). Este es otro ejemplo de esa idea.

Algunas cosas *sí* son invariables. Los valores que tienen que coincidir entre ediciones — conteos, fechas, los nombres de los estados pares — se calculan una vez y se le entregan idénticos a los dos textos. Las cifras de situación que cambian se publican como tokens de plantilla que el sitio rellena al momento de servir la página, así un resumen escrito en julio sigue siendo cierto en agosto cuando firmen tres sheriffs más. Las dos versiones pueden estar en desacuerdo sobre cómo formular algo. No pueden estar en desacuerdo sobre un número ni sobre un hecho.

## ¡Viva Las Vegas! — o por qué necesitamos editores humanos

Como en todo nuestro trabajo, una persona se queda en el circuito donde haya criterio de por medio y donde algo se publique. Los grupos temáticos de baja confianza esperan revisión. Los monitores rotos nos mandan una alerta en vez de dejar que un modelo de lenguaje busque por su cuenta un parche potencialmente engañoso. Nada llega a un lector sin que una persona real decida que está bien.

La mayoría de nuestros errores han sido de lugares: un artículo del condado de Clark, en Arkansas, quedó enlazado en un párrafo sobre el mucho más famoso condado de Clark, en Nevada, sede de Sin City. Esos los arreglamos a mano mientras afinamos el ingestor y el compositor para evitarlos en la siguiente corrida.

Se parece bastante a editar el trabajo de una persona. He editado muchos boletines de enlaces en mis tiempos, y este proceso suele ser un poco más preciso que un buen reportero escribiendo un resumen con enlaces. Los humanos también confunden lugares, pegan la URL equivocada y se equivocan en los detalles. Por eso, en muchos sentidos, importa menos quién o qué escribió el borrador que las guías de composición y el proceso de edición.

## Si quieres construir uno

La forma, en seis líneas, es lo bastante pequeña como para pasársela a un agente de programación:

1. Busca ampliamente, con varios proveedores, en **todos los idiomas principales en que vive tu historia.**
2. Deduplica empezando por lo más barato, y luego etiqueta y geoetiqueta lo que sobreviva. Guarda las etiquetas en caché para siempre.
3. Agrupa los artículos en líneas narrativas persistentes. Manda las dudosas a una persona.
4. Mantén el archivo y quien escribe en sistemas separados, conectados por una vista de solo lectura.
5. Antes de escribir nada, construye una **columna vertebral**: puntos ordenados, cada uno con sus citas, sacados de todos los idiomas a la vez.
6. Redacta la columna de forma nativa en cada idioma. Calcula una sola vez los números compartidos y entrégaselos a ambas versiones.

Todo lo que está arriba de la línea 5 es plomería que puedes construir como quieras. La línea 5 es la idea central que vuelve utilizable el resultado, y vas a necesitar tiempo para ajustarla y refinarla antes de que se lea bien.

Y ten en cuenta que replicar nuestra escala nacional no sale barato. Esto cuesta unos cuantos dólares como mínimo por corrida de búsqueda y por pasada de composición para llegar a una calidad satisfactoria. Si lo haces para 53 estados y territorios, podrías llegar fácilmente a $200 por una corrida completamente en frío, de principio a fin, aunque las corridas siguientes costarán menos. No es *tan* caro en el gran esquema de las cosas, pero tampoco es dinero de café. Y vas a gastar más al principio, porque tendrás que probarlo y afinarlo.

Si lo intentas, cuéntanos cómo te fue.

## Nuestros próximos pasos

Ahora que tenemos este sistema, vamos a empujarlo hacia lugares más ambiciosos. ¿Por qué solo escribir artículos si también podemos producir video y contenido social?

Esperamos hacer algunas investigaciones sobre nuestro propio corpus: ¿dónde están los huecos en la cobertura en inglés y en la cobertura en español, respectivamente? En la cobertura que se traslapa, ¿en qué se diferencian los ángulos y los enfoques?

Hay preguntas de investigación y refinamientos por hacer: ¿nuestro anclaje en datos está ayudando a filtrar noticias basura, o es un espejismo producto de comparar un número pequeño de corridas? ¿Cómo reducimos los errores geográficos?

Y mantente al pendiente: la próxima semana anunciamos un boletín nacional de inmigración, nuevo y basado en datos, usando estas técnicas.
