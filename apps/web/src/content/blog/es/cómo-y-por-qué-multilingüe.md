---
id: "multilingual-pt1"
title: "Cómo y por qué hicimos Recovered Factory multilingüe"
date: "2026-04-02"
description: "Invierte en producción y no te preocupes por la paridad. Este es el stack y el razonamiento detrás de una publicación independiente multilingüe."
type: "post"
byline: "David Eads"
editors:
  - "Ash Ngu"
  - "Tory Lysik"
tags:
  - "bench-notes"
lang: "es"
previewImage: "/images/factory-default--white-bg.png"
hidePreview: true
---

<script>
  import ResizedImage from '$lib/components/ResizedImage.svelte';
</script>

Un valor fundamental de este proyecto es el soporte de varios idiomas. Si las tecnologías de internet y de computación tienen el potencial de liberar a las personas y crear un mundo más equitativo, traducir el lenguaje humano podría ser una de las mejores cosas que pueden hacer.

Y sin embargo, la publicación digital multilingüe es principalmente el dominio de organizaciones grandes que pueden aceptar soluciones torpes y costosas. Si quieres publicar en serio en más de un idioma, no como una ocurrencia tardía o un gesto simbólico, lo descubrirás muy rápido.

Últimamente he estado haciendo mucho de esto: para Recovered Factory, para un gran proyecto de cliente que está por venir y para [Luna Limón](https://lunalimon.co.com/calendario). Me ha impactado más que nunca el desajuste entre nuestro mundo globalizado, con potentes herramientas de traducción automática, y el soporte débil y el alto costo de producir contenido en varios idiomas en los sistemas de gestión de contenidos populares.  

Esta es la primera edición de las bench notes de Recovered Factory, donde entramos en las decisiones técnicas y los principios detrás de lo que estamos construyendo y nos metemos en los detalles del oficio. 

Las bench notes a menudo incluirán código de ejemplo abreviado, pero puedes hojear u omitir esas partes si vienes por la arquitectura y no por la plomería. Si *eres* de ese tipo de personas, nuestro [código completo es abierto](https://github.com/recoveredfactory/recoveredfactory-site) y puedes usarlo como referencia o en tus propios proyectos.

Nuestra primera edición analizará por qué publicamos este newsletter y este sitio en inglés y español, y qué hemos aprendido hasta ahora. Las próximas publicaciones explorarán las luchas con la tecnología, los procesos, las técnicas de validación y los nuevos roles para traductores que implica agregar soporte multilingüe para una institución bastante grande que opera un sitio Drupal antiguo con mucho contenido y su propia jerga particular (p. ej. "curate" en el sentido de "miembro del clero" y no el verbo "to curate"). 

## ¿Por qué multilingüe desde el primer día?

América Latina está desempeñando un papel cada vez más importante e innovador en el periodismo global de noticias, de datos y de investigación. Este crecimiento ha sido impulsado por el desarrollo económico, el uso generalizado de teléfonos celulares, el éxito de programas de noticias en redes sociales como [La Pulla](https://www.youtube.com/c/LaPulla) y el surgimiento de proyectos colaborativos a gran escala como [Amazon Underworld](https://amazonunderworld.org/) y [Quinto Elemento Lab](https://quintoelab.org/).

En Recovered Factory queremos ser un destino real para los periodistas de datos latinoamericanos. Sabemos que hay un hambre genuina de material como este más allá de Estados Unidos. Y queremos conectar con estas audiencias y servirles, así que estamos haciendo una apuesta y construyendo RF para que sea multilingüe desde el primer día.

Y va más allá del periodismo de datos. Durante el show de medio tiempo del Superbowl de Bad Bunny, me encantó cuando dijo "God Bless America" y luego procedió a recitar prácticamente todos los países de las Américas.

<ResizedImage
  src="/images/bad-bunny-flags.gif"
  alt="Bad Bunny bailando en el show de medio tiempo del Superbowl con banderas de las Américas."
  figureClass="my-6 max-w-[300px] px-4 sm:px-0"
  class="w-full h-auto"
  unoptimized
/>

Sentado en Colombia mientras escribo esto, lo siento más que nunca: las Américas son un sistema compartido del que Estados Unidos está menos separado de lo que suele pensar. Como [escribió Patrick Iber](https://newrepublic.com/article/192094/greg-grandin-history-americas-review), "puede tener sentido pensar en Estados Unidos como un país latinoamericano rico, en lugar de una rama de Europa misteriosamente gobernada por vaqueros".

Pero aunque el mundo está más interconectado que nunca y la traducción automática se ha vuelto bastante buena (¡hola, DeepL\!), las herramientas y los procesos de producción para la publicación multilingüe se sienten bastante rezagados. Dada esa fricción fundamental, ¿cómo haces que una configuración moderna de publicación y suscripciones funcione en más de un idioma sin crear un desastre total?

## Olvídate de la paridad

La decisión más importante que tomamos fue esta: no exigimos paridad estricta. Ni siquiera exigimos paridad laxa. No la exigimos entre idiomas. Ni entre el correo y la web. Ni entre plataformas sociales.

El español sale cuando está listo. Una publicación en el sitio no tiene que coincidir exactamente con un correo. No todas las piezas tienen que aparecer en ambos idiomas al mismo tiempo, en la misma forma, o siquiera aparecer. Un correo puede agrupar tres publicaciones, o adelantar una pieza más larga en el sitio, o existir completamente por su cuenta.

Esta publicación que estás leyendo es un gran ejemplo: nuestro correo de esta ocasión no repite el contenido de aquí, sino que enlaza a él e incluye algunas actualizaciones de proyectos. Publicaremos una versión en español en las próximas semanas con un correo completamente distinto del que usamos para el inglés. También necesitaremos una versión diferente de este párrafo en español. 

Una vez que sueltas la idea de que cada pieza de contenido debe reflejarse en tus canales principales y en todos los idiomas, todo el sistema se vuelve más simple y el contenido mejora. Puedes hacer lo que tenga sentido según tus recursos y las necesidades de tu audiencia.

Eso es porque, de todos modos, la traducción no funciona así. Traducir no es simplemente hacer una copia y transcribirla en otro idioma. Las cosas aterrizan diferente en distintos idiomas. A veces el momento de publicación importa más en un idioma que en otro. Los elementos visuales como fotos, gráficos y capturas de pantalla necesitan localizarse. A veces llegar a la versión traducida correcta toma más tiempo porque estás tratando de preservar el tono, el ritmo o el contexto en lugar de apresurar una copia rígida.

Un ejemplo pequeño pero llamativo: cuando tradujimos con DeepL la descripción que nuestro querido artista del logo hizo de su trabajo, [la traducción al inglés](https://recoveredfactory.net/en/about-suku-muralist-artist) era perfectamente precisa y aun así se sentía demasiado abstracta. La cita original de Suku se leía bien en español para mí y para todas las personas a quienes les pregunté, pero el inglés necesitaba más edición para ser claro e impactante. Por esta razón, [la versión en español](https://recoveredfactory.net/es/qui%C3%A9n-es-suku) se apega más a la cita original, mientras que el inglés se toma más libertades para lograr el mismo impacto. 

Lo mismo ocurre entre plataformas. El correo es su propio medio. La web es su propio medio. Las redes sociales son su propio medio. Un sistema que insiste en demasiada paridad entre todos ellos no solo es técnicamente incómodo: es editorialmente torpe.

En última instancia, tuvimos que abandonar las herramientas de publicación populares y supuestamente fáciles y construir nuestro sitio nosotros mismos para poder aceptar esa realidad, en lugar de pelear contra ella.

## Un mapa de nuestras necesidades

Nuestras necesidades eran y son bastante simples:

* Newsletter por correo electrónico:  
  * Segmentar y dirigirse a los suscriptores de correo por idioma.  
  * Registro específico por idioma (p. ej. formularios que etiquetan correctamente a los suscriptores cuando se registran).  
* Sitio web  
  * Un sitio multilingüe con detección de idioma y un cambio de idioma sencillo.  
  * La capacidad de vincular las versiones en inglés y español de contenido como la página "acerca de" y las publicaciones individuales.  
  * Divergencia fácil entre idiomas, p. ej. mostrar un formulario en la versión en español del sitio y un formulario diferente en inglés. Tener algunas publicaciones en un idioma, pero no en el otro.

No debería ser *tan* difícil, ¿cierto? Pero después de hacer algo de trabajo detectivesco, encontramos que las opciones para un editor pequeño siguen siendo bastante limitadas.

## True Detective temporada 5: Newsletter Country

Nos pusimos nuestros sombreros de detective e hicimos un montón de investigación, con la esperanza de que alguna de las plataformas convencionales como [Substack](https://substack.com) pudiera manejar nuestras necesidades aparentemente simples. Pero Substack, [Ghost](https://ghost.org/) y [Beehiiv](https://beehiiv.com) requerían hacks serios para funcionar. Al final nos quedamos con [Kit.com](http://Kit.com) (antes ConvertKit) por su buen editor, su robusta segmentación de suscriptores y sus herramientas amigables para desarrolladores. 

Substack y Ghost requieren newsletters separados para cada idioma, con cada sitio enlazado manualmente al otro. Si quieres negociación de idioma, también necesitarás algo de código pegamento en un dominio raíz personalizado para enviar a los usuarios a la versión correcta. Eso también te deja administrando múltiples bases de datos de suscripciones. Con Ghost, además significa pagar y mantener varias cuentas. Eso no es un problema con Substack, ya que es gratuito, pero parte de la razón por la que es gratuito es que [se lucra con anuncios en perturbadores newsletters neonazis y supremacistas blancos](https://www.theguardian.com/media/2026/feb/07/revealed-how-substack-makes-money-from-hosting-nazi-newsletters). La segmentación de usuarios de Beehiiv parecía mejor, pero aun así necesitábamos construir un sitio personalizado y su integración programática, lamentablemente débil, reveló que funcionalidad clave como los formularios de suscripción nativos era básicamente inviable en mis pruebas.

De las plataformas más veteranas, [Mailchimp](https://mailchimp.com) quedó fuera desde el principio porque preferiría no usar un [producto de Intuit](https://www.propublica.org/series/the-turbotax-trap), y su editor de contenido nunca me ha convencido. No exploré a fondo [Constant Contact](https://constantcontact.com) como opción para nosotros, aunque sospecho que también puede manejar nuestro caso de uso. Y una ventaja de Constant Contact es la pureza de su misión. No intenta ser tu sitio web y tu tienda como lo hace Kit. 

Pero Kit terminó ganando por 1\) la novedad, porque he usado Constant Contact en el pasado y quería probar algo nuevo, y 2\) un soporte para desarrolladores lo suficientemente robusto que hizo más llevadero hackear alrededor de las limitaciones.

Mi investigación me persiguió de maneras que no esperaba. Habían pasado bastantes años desde la última vez que examiné seriamente las plataformas de correo y esperaba encontrar mejor soporte multilingüe. El pasado, resulta, siempre está con nosotros. El tiempo es un círculo plano. Y apareció Matthew McConaughey.

Una de las configuraciones de newsletter en inglés y español más notables que encontré en circulación [pertenece a Matthew McConaughey](https://lyricsoflivin.com/hola). Y funciona con Kit, a quienes les encanta destacarla en su marketing.

<ResizedImage
  src="/images/kit-mconaughey.png"
  alt="Imagen de marketing de Matthew McConaughey que parece estar escribiendo en una habitación acogedora."
  width={600}
  figureClass="my-6"
  class="max-w-md mx-auto h-auto"
  caption="Cómo me imagino a mí mismo mientras trabajo en este newsletter."
/>

<ResizedImage
  src="/images/true-detective2.gif"
  alt="Un personaje desgastado interpretado por Matthew McConaughey jugando con una lata de aluminio aplastada."
  width={600}
  figureClass="my-6"
  class="max-w-md mx-auto h-auto"
  caption="Cómo estoy en realidad mientras trabajo en este newsletter, con tres pestañas abiertas en la documentación de la API de Kit a la 1 de la madrugada."
  unoptimized
/>

La comparación con McConaughey es más que un chiste, aunque sus extrañas reflexiones [impulsadas por IA](https://www.statesman.com/news/article/mcconaughey-ai-spanish-voice-elevenlabs-21171195.php) ("[Lyrics of Livin'](https://lyricsoflivin.com/)", que debemos admitir que nos gustan) sean un poco difíciles de tomar en serio. 

McConaughey es del sur de Texas, donde [aprendió algo de español mientras crecía](https://www.youtube.com/watch?v=BOui6N97k-c) (¡las Américas son un sistema compartido\!) y él y su equipo deben ver el mismo valor de publicar en español que vemos nosotros. Al parecer también llegaron a las mismas conclusiones sobre qué plataforma de newsletters soporta mejor la publicación en varios idiomas. Ver la configuración de McConaughey fue evidencia de algo que ya sospechaba: Kit es una de las pocas plataformas que actualmente sirven a creadores donde esto siquiera es posible, precisamente porque muchas de las otras caen en una maraña de hacks cuando lo intentas. 

## El stack

Para Recovered Factory, la configuración se ve así:

- **SvelteKit** para el frontend personalizado.
- **Archivos Markdown** para el almacenamiento y la publicación del contenido. 
- **Paraglide JS** (y el formato de mensajes de InLang) para las cadenas de interfaz traducidas. 
- **Kit** para la gestión de suscriptores y la infraestructura de correo. 
- **Stripe** para los pagos.
- **Etiquetado programático de suscriptores** para rastrear preferencias de idioma y otros metadatos. 
- **Traducción manual con DeepL** y una edición humana extensiva.

La idea clave es que ninguna plataforma lo hace todo. Elegimos herramientas específicas para trabajos específicos y luego las conectamos nosotros mismos. Estamos usando bastante IA y automatización, pero nos aseguramos de verificar esos resultados cuidadosamente con revisión humana en cada etapa — especialmente cuando se trata del control de calidad final. 

### ¿Por qué un frontend personalizado?

Ninguna de las plataformas de newsletter que evalué podía manejar la publicación multilingüe sin chapuzas. (El desglose completo plataforma por plataforma está en el apéndice, si tienes curiosidad.) La versión corta: Ghost, Beehiiv, Kit y las demás asumen un mundo monolingüe en lo que respecta a sus funciones de CMS web.

Eso significó construir un sitio personalizado. De todas las opciones, Kit tenía una API lo suficientemente robusta para soportar lo que necesitaba: un frontend personalizado hablando con un backend de newsletter y suscripciones. Kit maneja la gestión de suscriptores, las automatizaciones y la plomería básica del newsletter. El sitio y la base de código personalizada manejan todo lo que es de cara al público en la web.

El tradeoff central es obvio: el sueño de enviar el correo y que simplemente aparezca en un sitio web decente construido y mantenido por la plataforma queda completamente descartado. Pero podemos optimizar cada plataforma para lo que hace bien, y ese intercambio ha valido la pena.

### Cómo maneja Kit dos idiomas

La configuración multilingüe en Kit se reduce a segmentos y formularios.

**Segmentos:** creamos dos segmentos de suscriptores — `lang-en` y `lang-es` — que rastrean la preferencia de idioma de cada suscriptor. Cuando enviamos un newsletter, apuntamos al segmento apropiado. Un suscriptor puede estar en ambos, y podemos elaborar correos diferentes para cada idioma o enviar una edición bilingüe cuando tenga sentido.

**Formularios:** construimos dos formularios de Kit separados, uno para inglés y otro para español, de modo que los mensajes de confirmación, las secuencias de bienvenida y otras respuestas automatizadas estén localizados. El frontend llama a un pequeño endpoint de API, que a su vez envía el formulario a Kit (el envío directo desde un navegador está prohibido por CORS). El suscriptor nunca ve un selector de idioma ni hace una elección manual: el sitio se encarga de eso.

Estos formularios son cascarones vacíos; el frontend maneja cada aspecto de la presentación. Pero cada uno tiene un ID único, un mensaje de confirmación automatizado localizado, y necesita redirigir de vuelta a nuestro sitio personalizado. En la interfaz de Kit, puedes verlos bajo la pestaña "Grow", en la sección "Landing Pages & Forms", debajo del gráfico de actividad.

<ResizedImage
  src="/images/kit-forms.png"
  alt="Captura de pantalla de la interfaz de formularios de Kit.com."
  width={1200}
  figureClass="my-6 max-w-full"
  class="h-auto"
  caption="La pantalla de formularios de Kit."
/>

En la sección "Incentive" de la configuración de cada formulario, debes configurar la redirección (en este caso, a la ruta `/es` del sitio, porque este es el formulario en español) y editar el correo de respuesta automática.

<ResizedImage
  src="/images/kit-redirect.png"
  alt="Captura de pantalla de la configuración de redirección de formularios de Kit.com, mostrando la redirección en español para este sitio."
  width={1200}
  figureClass="my-6 max-w-full"
  class="h-auto"
  caption="Puedes configurar la redirección en los ajustes del formulario."
/>

Y luego necesitamos personalizar el correo de confirmación automatizado en el idioma que representa el formulario.

<ResizedImage
  src="/images/kit-incentive.png"
  alt="Captura de pantalla del editor de respuestas automáticas de Kit.com en español."
  width={1200}
  figureClass="my-6 max-w-full"
  class="h-auto"
  caption="La pantalla de edición de la respuesta automática de Kit (el 'correo de incentivo')."
/>

Del lado del sitio web, [renderizamos un formulario](https://github.com/recoveredfactory/recoveredfactory-site/blob/main/apps/web/src/lib/components/SubscribeForm.svelte) y luego [ejecutamos un pequeño endpoint de API](https://github.com/recoveredfactory/recoveredfactory-site/blob/main/apps/web/src/routes/api/signup/%2Bserver.ts) que se encarga de hacer `POST` con los datos de suscripción a Kit. Si lo implementas tú mismo, querrás tener en cuenta que Kit a veces exige un desafío captcha al enviar y gran parte de la lógica de programación debe contemplar eso. 

Aquí hay una versión simplificada del componente del formulario (`src/lib/components/SubscribeForm.svelte` relativo a la base de código de Sveltekit):

```svelte
<script lang="ts">
  type Props = {
    lang: string;
    source: string;
  };

  let { lang, source }: Props = $props();

  let status = $state<'idle' | 'loading' | 'success' | 'error' | 'guard'>('idle');
  let errorMessage = $state('');

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (status === 'loading') return;
    status = 'loading';

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    formData.set('lang', lang);
    formData.set('source', source);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        body: formData,
        headers: { accept: 'application/json' },
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload?.ok === false) {
        if (payload?.guard) { status = 'guard'; return; } // bot check required — handle separately
        throw new Error(payload?.error || 'Something went wrong.');
      }

      status = 'success';
      form.reset();
    } catch (err) {
      status = 'error';
      errorMessage = (err as Error)?.message || 'Something went wrong.';
    }
  };
</script>

<form action="/api/signup" method="post" onsubmit={handleSubmit}>
  {#if status === 'success'}
    <p role="status">You're subscribed!</p>
  {:else if status === 'guard'}
    <p>Please complete the verification step.</p> <!-- bot check UI goes here -->
  {:else}
    <input name="email_address" type="email" placeholder="your@email.com" disabled={status === 'loading'} />
    <input name="lang" type="hidden" value={lang} />
    <input name="source" type="hidden" value={source} />
    <button type="submit" disabled={status === 'loading'}>Subscribe</button>
    {#if status === 'error'}
      <p role="alert">{errorMessage}</p>
    {/if}
  {/if}
</form>
```

Y aquí hay una versión simplificada de nuestro pequeño endpoint de API (`src/routes/api/signup/+server.ts` relativo a la base de código de Sveltekit):

```javascript
import { json, redirect } from '@sveltejs/kit';

const FORM_IDS = {
  en: 'XXXXXXX',
  es: 'YYYYYYY',
} as const;

const resolveLang = (value: string) => (value === 'es' ? 'es' : 'en');

export const POST = async ({ request }) => {
  const formData = await request.formData();
  const email = String(formData.get('email_address') ?? '').trim();
  const lang = resolveLang(
    String(formData.get('lang') ?? formData.get('fields[lang]') ?? 'en').toLowerCase(),
  );

  const body = new URLSearchParams();
  body.set('email_address', email);
  body.set('fields[lang]', lang);

  const response = await fetch(
    `https://app.kit.com/forms/${FORM_IDS[lang]}/subscriptions`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    },
  );

  const responseText = await response.text();
  const ok = response.ok || (response.status >= 300 && response.status < 400);
  // Next: parse response from Kit and decide how to respond to the client; 
  // primary outcomes are success + redirect, captcha ("guard"), send back error message
};
```

### Cómo producimos y editamos en dos idiomas

Aunque existe la tentación de intentar poner la producción "sobre rieles" para reducir el esfuerzo requerido, en gran medida hemos optado por la vía manual. Por ejemplo, podríamos intentar llamar a la API de DeepL y generar una traducción a partir de nuestros Google Docs originales o en nuestro sistema de gestión de contenidos. Podríamos intentar escribir código pegamento para sincronizar el Google Doc con un archivo Markdown. 

¡No hacemos nada de eso\! Usamos DeepL para traducir, pero con un humano en el circuito en cada paso, incluido el inicio de la traducción. Típicamente, ni siquiera intento traducir un artículo completo, sino unos cuantos párrafos conectados; reviso el resultado y continúo. Luego lo pasamos con una hablante nativa de español (principalmente Diana Vanessa Riascos-Gamez) para las ediciones finales. 

### InLang, Paraglide JS y las cadenas de UI traducidas

La otra pieza principal es el formato de traducción de [InLang](https://inlang.com/) y [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs), y es un asunto importante.

Paraglide te da una manera sensata y amigable para desarrolladores de gestionar cadenas de interfaz traducidas sin convertir tu aplicación en una casa embrujada de frágiles hacks de i18n. Es parte del ecosistema más amplio de InLang, y es extremadamente bueno — tan bueno que podría hacerte considerar usar un framework de JavaScript solo para tener acceso a él.

Para Recovered Factory, la cantidad de cadenas de UI traducidas sigue siendo lo suficientemente pequeña como para que simplemente las editemos en el formato nativo de mensajes JSON de InLang junto al código. Cada idioma recibe un archivo JSON con pares clave-valor para cosas como etiquetas de navegación, texto de botones, placeholders de formularios y otros textos de interfaz.

Es tan simple como crear `messages/es.json` y `messages/en.json:`
```json
{
  "$schema": "https://inlang.com/schema/inlang-message-format",
  "site_name": "Recovered Factory",
  "nav_about": "Acerca de",
  "nav_donate": "Apoyar",
  "nav_signin": "Iniciar sesión",
  "nav_subscribe": "Regístrate",
  "nav_menu_open_aria": "Abrir menú de navegación",
  "nav_menu_close_aria": "Cerrar menú de navegación",  
  ...
}
```

```json
{
  "$schema": "https://inlang.com/schema/inlang-message-format",
  "site_name": "Recovered Factory",
  "nav_about": "About",
  "nav_donate": "Support",
  "nav_signin": "Sign in",
  "nav_subscribe": "Sign up",
  "nav_menu_open_aria": "Open navigation menu",
  "nav_menu_close_aria": "Close navigation menu",
  ...
}
```

Luego, importas los mensajes como una función o funciones. Por ejemplo, en un componente de Svelte, podrías hacer algo así:
```javascript
<script lang="ts">
import { m } from '$lib/paraglide/messages';
</script>

<h1>{m.site_name()}</h1>
```

Gracias a la ingeniosa arquitectura de Paraglide y al formato de traducción simple de InLang, todas las cadenas de traducción se convierten en funciones tree-shakeable, lo que significa que solo los mensajes que realmente usas entran en tu build final. Y funciona tanto si renderizas del lado del servidor como dinámicamente. 

Dicho esto, he encontrado que Paraglide requiere algunos trucos cuando lo integras con flujos de trabajo más de tipo CMS — típicamente generando los archivos JSON de traducción a partir de la transformación de datos fuente, p. ej. cuando tienes variantes `text_en` y `text_es` que representan la misma cadena en distintos idiomas en una sola fila de base de datos. Pero la fricción entre almacenar las cadenas de traducción "lado a lado" y usar archivos de mensajes por idioma también existe en sistemas más viejos y quisquillosos como los antiguos archivos `.po` (Portable Object) que usa `gettext` de Gnu.

Tenemos otros proyectos en los que estamos generando archivos de traducción desde Airtable y Google Sheets que almacenan las traducciones lado a lado, lo cual escala mejor cuando tienes más cadenas o colaboradores no desarrolladores gestionando las traducciones, pero requiere un paso adicional para generar los archivos de mensajes, y usualmente implica un nivel de complejidad que se beneficia de agregar a tu base de código herramientas más avanzadas para depurar idiomas. Cubriremos esto con más detalle en una publicación futura. 

<ResizedImage
  src="/images/side-by-side-translation.png"
  alt="Captura de pantalla de una base de datos de traducción lado a lado con cadenas EN y ES en Airtable."
  width={1200}
  figureClass="my-6 max-w-full"
  class="h-auto"
  caption="Un sistema de traducción 'lado a lado' en Airtable con claves de traducción y cada idioma representado en una columna."
/>

### Contenido en Markdown con IDs compartidos

El contenido en sí vive como archivos Markdown, y aquí es donde las cosas se ponen un poco caóticas.

Cada publicación existe como un archivo markdown separado por idioma. Están vinculadas por un ID compartido en el frontmatter, de modo que el sitio sabe que `how-we-went-multilingual.md` y `como-nos-hicimos-multilingue.md` son la misma pieza. El sitio usa ese ID compartido para generar los enlaces del selector de idioma y para saber cuándo existe una traducción.

El contenido se organiza entonces en archivos Markdown segregados por idioma en la estructura de directorios: `src/content/en` y `src/content/es` relativos a la base de código de Sveltekit.  
   
Así se ve el frontmatter. Nota el ID compartido y los campos independientes (los editores en español son distintos de los de inglés).

`src/content/en/muscle-memory.md`:
```markdown
---
id: "rf-muscle-memory"
title: "Muscle Memory"
date: "2026-01-28"
description: "Journalism's habits were built for a world that no longer exists. Pretending we can serve everyone equally just hides tradeoffs we're already making."
type: "post"
byline: "David Eads"
editors:
  - "Tory Lysik"
tags:
  - "field-notes"
lang: "en"
previewImage: "/images/factory-default--white-bg.png"
hidePreview: true
---
... post body ...
```

Y `src/content/es/memoria-muscular.md`:
```markdown
---
id: "rf-muscle-memory"
title: "Memoria muscular"
date: "2026-01-28"
description: "Los hábitos del periodismo se crearon para un mundo que ya no existe. Fingir que podemos servir a todo el mundo por igual solo oculta las concesiones que ya estamos haciendo."
type: "post"
byline: "David Eads"
editors:
  - "Tory Lysik"
  - "Diana Vanessa Riascos-Gamez"
tags:
  - "field-notes"
lang: "es"
previewImage: "/images/factory-default--white-bg.png"
hidePreview: true
---

... post body ...
```

Esto no es perfecto, de ninguna manera. Este enfoque facilita manejar los slugs multilingües de las publicaciones, y rastrear el archivo fuente desde una URL como `https://recoveredfactory.net/es/como-nos-hicimos-multilingue` es trivial. Por otro lado, necesitamos escribir un pequeño script para generar una tabla de correspondencias entre las publicaciones, porque con solo mirar los directorios de contenido en inglés y español no es obvio cuál es el archivo Markdown equivalente en el otro idioma. 

Otro enfoque habría sido codificar el ID canónico en el nombre del archivo y representar el slug publicado en el frontmatter. Esto consistiría en archivos como `how-we-went-multilingual-en.md` y `how-we-went-multilingual-es.md`.

Al final, sentí que la decisión era casi como lanzar una moneda al aire. Ambas son opciones razonables, cada una con sus propios pequeños tradeoffs, así que elegí la versión que simplifica un poco la lógica del sitio web, porque no tenemos que leer y establecer dinámicamente el slug publicado, a cambio de la complejidad adicional de necesitar generar una tabla de correspondencias entre publicaciones. Y en la práctica, esto rara vez es un problema, pero aun así introduce algo de fricción mental y requiere herramientas adicionales.

De manera similar, no hay sincronización automatizada, ni memoria de traducción, ni una elegante interfaz de diffs más allá de un script de línea de comandos que te dice qué publicaciones en inglés aún no tienen contraparte en español. Es un proceso manual. Pero funciona bien a nuestra escala actual, y tiene la ventaja de ser sumamente simple de entender: archivos en carpetas, vinculados por un ID.

Si llegamos a superarlo, probablemente pasaremos a algo con una base de datos de contenido de verdad y un flujo de trabajo de traducción. Por ahora, gana la simplicidad.

## Algunas lecciones finales

Si eres un equipo de producto o un editor pequeño tratando de internacionalizar tu trabajo digital, aquí hay algunas lecciones que nos ayudan a lograrlo con éxito en Recovered Factory:

**Olvídate de la paridad.** Entre idiomas, entre canales, entre plataformas. Deja que cada versión de tu contenido sea ella misma. Esto no es una concesión: es mejor pensamiento editorial.

**Tus opciones técnicas están restringidas.** Si quieres ser multilingüe y jugar el juego del creador independiente, vas a terminar construyendo más de lo que quizás esperabas. Las plataformas todavía no están a la altura. Estamos apostando a que aun así vale la pena — la ventaja competitiva de servir genuinamente a varios idiomas es real, y las herramientas están mejorando rápido. DeepL por sí solo ha cambiado lo que es posible, y el ecosistema de InLang es un gran salto adelante para la integración en productos.

**Invierte en producción.** El trabajo manual de mantener dos idiomas en dos plataformas es real. Pero "trabajo real" y "no vale la pena" no son lo mismo. La alternativa — fingir que el contenido multilingüe aparecerá mágicamente sin contemplar la producción — cuesta más a largo plazo, solo que de maneras menos visibles. También hay un costo en no abrazar nuestro mundo multilingüe, globalizado e impulsado por plataformas, y no le restas nada al periodismo por contabilizar honestamente lo que se necesita para producir contenido en este mundo.

Ahí es donde estamos. No es un sistema perfecto, pero sí uno que refleja cómo funcionan realmente el lenguaje y la publicación para un equipo pequeño e independiente como Recovered Factory, y una receta para la sostenibilidad.
