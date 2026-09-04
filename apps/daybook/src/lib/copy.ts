import type { Lang } from '$lib/i18n';

/**
 * Every sentence on the site that is not an edition, in both languages.
 *
 * One file so the words have one home. Lines marked TODO(david) are drafts —
 * structure first, prose second — and the Spanish is a working translation
 * rather than an edited one; see `translationEditor` on the editions for who
 * edits those.
 *
 * Strings with markup are rendered with {@html}. They are ours, not the
 * pipeline's, so that is safe.
 */

const en = {
  ui: {
    siteName: 'Immigration Daybook',
    // The other language, written in that language — it is addressed to its reader.
    otherLang: 'Español',
    subscribe: {
      title: 'Get the Daybook in your inbox.',
      placeholder: 'you@example.org',
      button: 'Subscribe',
      terms: 'Free. Every weekday. English and Spanish.',
      // TODO(david): say only what is true of how the list is run.
      privacy: 'We never sell or share your email. Unsubscribe any time.',
      success: 'Check your email to confirm. The next edition follows.',
      guard: 'One security check, then you’re in.',
      guardLink: 'Complete the security check on Kit',
      error: 'Something went wrong. Please try again.',
    },
    share: {
      pitch: 'Send this edition to someone who should have it.',
      whatsapp: 'WhatsApp',
      copy: 'Copy link',
      copied: 'Copied',
      note: 'The link carries “?via” and nothing else — no identifiers, no cross-site tracking.',
    },
    calendar: {
      heading: 'Upcoming',
      window: 'The next four weeks.',
    },
    edition: {
      readInThisLanguage: 'Read in English →',
      translationEditedBy: 'Translation edited by',
      asSent: 'See this edition as it was sent',
      backToWeb: 'Back to the web version',
      plainText: 'Plain text',
      pilot: 'Pre-launch pilot edition. Visible outside production only.',
      editions: (n: number) => (n === 1 ? '1 edition' : `${n} editions`),
    },
    dossier: {
      follow: 'Follow @recoveredfactory on Instagram',
      seePost: 'See the post',
      swipe: 'Swipe for more',
      previous: 'Previous',
      next: 'Next',
      slide: (i: number, of: number) => `Slide ${i} of ${of}`,
      goTo: (i: number) => `Go to ${i}`,
    },
    footer: {
      project:
        'Immigration Daybook is a project of <a href="https://recoveredfactory.net/en">Recovered Factory</a>. Edited by David Eads.',
      manage: 'Manage your subscription',
      rss: 'RSS',
      contact: 'Write to us',
      contactHref: 'mailto:davideads@recoveredfactory.net?subject=Immigration%20Daybook',
    },
  },
  home: {
    metaDescription:
      'A weekday rundown of the immigration system — and a calendar of what’s coming. Effective dates, comment deadlines, court dates. Every edition online, in English and Spanish.',
    // The plate. Deck first, then the terms, then the ask.
    deck: 'We turn the spectacle of the immigration system into evidence. Every weekday, in English and Spanish.',
    // The one sentence in colour.
    fire: 'There’s a lot of <em class="db-fire">fire</em> in the immigration system right now. There’s even more <em class="db-smoke">smoke</em>.',
    fireGrafs: [
      'Thousands of articles, videos, threads, and posts a day, often covering actions that seem designed to create confusion, chaos, and spectacle.',
      'We use algorithms to show where the smoke is thickest, and judgment and expertise to reveal what really matters.',
    ],
    // Spectacle on the left, evidence on the right. Same rows in both languages.
    // TODO(david): draft pairs — the shape is the point, swap the examples.
    pairs: {
      spectacle: 'Spectacle',
      evidence: 'Evidence',
      rows: [
        ['A raid on video.', 'The agreement that put local police in it.'],
        ['A press conference.', 'The Federal Register notice, and its comment deadline.'],
        ['A threat on social media.', 'The docket number, and the hearing date.'],
        ['A number shouted on TV.', 'The same number, checked against the Deportation Data Project.'],
      ],
    },
    latest: {
      heading: 'The latest edition',
      also: 'Also in this edition',
      read: 'Read the edition',
      all: 'Every edition',
    },
    whatsIn: {
      heading: 'What’s in it',
      items: [
        {
          hed: 'A calendar of what’s coming.',
          body: 'Effective dates, comment deadlines, court dates — all backed by primary sources and links to expert analysis. The rules that quietly take force while everyone’s arguing about the outrage of the day.',
        },
        {
          hed: 'The day’s rundown, grounded in reporting and evidence.',
          body: 'When we cite links about deportation, we check them against the <a href="https://deportationdata.org">Deportation Data Project</a>. A reported rule change is checked against the <a href="https://www.federalregister.gov">Federal Register</a> and the <a href="https://www.uscis.gov/policy-manual">USCIS Policy Manual</a>.',
        },
        {
          hed: 'The headlines, from English <em>and</em> Spanish media.',
          body: 'Spanish-language TV news, deeply technical policy blogs, Substack newsletters, social video — from nerdy law blogs to YouTube coverage of ICE raids, we’re watching and bringing you what’s relevant.',
        },
      ],
      shots: [
        {
          src: '/images/immigration-daybook-edition-en.png',
          alt: 'The top of an Immigration Daybook edition dated August 3, 2026. The lead story reports that a federal contract funding legal aid for unaccompanied migrant children has expired, leaving tens of thousands of minors facing immigration court without attorneys. Two bolded follow-up items each end in source links.',
          caption: 'The rundown: what happened, what it means, and who reported it.',
        },
        {
          src: '/images/immigration-daybook-upcoming-en.png',
          alt: 'The Upcoming section of the same edition, a dated calendar split into Today and This Week, each entry carrying a source link to the Federal Register or WR Immigration.',
          caption: 'The calendar: what’s coming, with the primary source or expert citation for each date.',
        },
      ],
    },
    made: {
      heading: 'How it’s made',
      grafs: [
        'This newsletter is proudly algorithmic, and we intend to make it the most carefully crafted algorithmic writing you’ve ever read. The bet isn’t “AI reads the news” — lots of people are doing that, and a lot of it is slop. The bet is that a newsroom can have a brain: something you can actually <em>query</em> about everything it knows, that shows its work instead of asking you to trust it.',
        'The system reads the day’s news and surfaces the patterns it finds. Then a person edits — what it means, whether it’s accurate, and who covered it best. That person is <a href="https://recoveredfactory.net/en/introducing-recovered-factory">David Eads</a>, a data journalist with years of experience covering immigration for publications including NPR and The Marshall Project.',
      ],
    },
    archive: {
      heading: 'Every edition',
      empty: 'No editions yet.',
    },
    close: {
      heading: 'Start today.',
      // TODO(david): the terms now, if they are anything.
      graf: 'August was a free pilot; we’re still figuring out what this should be and how to sustain it. We’d rather have you in the room for the early version than polish it in a vacuum.',
      contact:
        'Questions, corrections, or a story we’re missing? <a href="mailto:davideads@recoveredfactory.net?subject=Immigration%20Daybook">Tell us.</a>',
    },
  },
};

export type Copy = typeof en;

const es: Copy = {
  ui: {
    siteName: 'Immigration Daybook',
    otherLang: 'English',
    subscribe: {
      title: 'Recibe el Daybook en tu correo.',
      placeholder: 'tu@ejemplo.org',
      button: 'Suscríbete',
      terms: 'Gratis. Cada día hábil. En español e inglés.',
      // TODO(david): decir solo lo que es cierto de cómo se maneja la lista.
      privacy: 'Nunca vendemos ni compartimos tu correo. Cancela cuando quieras.',
      success: 'Revisa tu correo para confirmar. La próxima edición viene después.',
      guard: 'Una verificación de seguridad y listo.',
      guardLink: 'Completa la verificación en Kit',
      error: 'Algo salió mal. Intenta de nuevo.',
    },
    share: {
      pitch: 'Envía esta edición a alguien que deba tenerla.',
      whatsapp: 'WhatsApp',
      copy: 'Copiar enlace',
      copied: '¡Copiado!',
      note: 'El enlace lleva “?via” y nada más — sin identificadores, sin rastreo entre sitios.',
    },
    calendar: {
      heading: 'Próximamente',
      window: 'Las próximas cuatro semanas.',
    },
    edition: {
      readInThisLanguage: 'Leer en español →',
      translationEditedBy: 'Traducción editada por',
      asSent: 'Ver esta edición como se envió',
      backToWeb: 'Volver a la versión web',
      plainText: 'Texto plano',
      pilot: 'Edición piloto previa al lanzamiento. Visible solo fuera de producción.',
      editions: (n: number) => (n === 1 ? '1 edición' : `${n} ediciones`),
    },
    dossier: {
      follow: 'Sigue a @recoveredfactory en Instagram',
      seePost: 'Ver la publicación',
      swipe: 'Desliza para ver más',
      previous: 'Anterior',
      next: 'Siguiente',
      slide: (i: number, of: number) => `Diapositiva ${i} de ${of}`,
      goTo: (i: number) => `Ir a ${i}`,
    },
    footer: {
      project:
        'Immigration Daybook es un proyecto de <a href="https://recoveredfactory.net/es">Recovered Factory</a>. Editado por David Eads.',
      manage: 'Administra tu suscripción',
      rss: 'RSS',
      contact: 'Escríbenos',
      contactHref: 'mailto:davideads@recoveredfactory.net?subject=Immigration%20Daybook',
    },
  },
  home: {
    metaDescription:
      'Un resumen diario del sistema migratorio y un calendario de lo que viene. Fechas de entrada en vigor, plazos de comentarios, audiencias. Todas las ediciones en línea, en español e inglés.',
    deck: 'Convertimos el espectáculo del sistema migratorio en evidencia. Cada día hábil, en español e inglés.',
    fire: 'Hay mucho <em class="db-fire">fuego</em> en el sistema migratorio ahora mismo. Hay todavía más <em class="db-smoke">humo</em>.',
    fireGrafs: [
      'Miles de artículos, videos, hilos y publicaciones al día, muchas veces sobre acciones que parecen diseñadas para producir confusión, caos y espectáculo.',
      'Usamos algoritmos para mostrar dónde está más espeso el humo, y criterio y experiencia para revelar lo que de verdad importa.',
    ],
    // TODO(david): borrador — la forma es lo que importa; cambia los ejemplos.
    pairs: {
      spectacle: 'Espectáculo',
      evidence: 'Evidencia',
      rows: [
        ['Una redada en video.', 'El acuerdo que metió a la policía local en ella.'],
        ['Una rueda de prensa.', 'El aviso en el Federal Register, y su plazo de comentarios.'],
        ['Una amenaza en redes.', 'El número de expediente, y la fecha de la audiencia.'],
        ['Una cifra gritada en la tele.', 'La misma cifra, contrastada con el Deportation Data Project.'],
      ],
    },
    latest: {
      heading: 'La última edición',
      also: 'También en esta edición',
      read: 'Leer la edición',
      all: 'Todas las ediciones',
    },
    whatsIn: {
      heading: 'Qué vas a recibir',
      items: [
        {
          hed: 'Un calendario de lo que viene.',
          body: 'Fechas de entrada en vigor, plazos para enviar comentarios, audiencias: todo respaldado por fuentes primarias y con enlaces al análisis de quienes saben. Las normas que entran en vigor en voz baja mientras todo el mundo discute la indignación del día.',
        },
        {
          hed: 'El resumen del día, con reporteo y evidencia detrás.',
          body: 'Cuando citamos enlaces sobre deportación, los contrastamos con el <a href="https://deportationdata.org">Deportation Data Project</a>. Un cambio de norma que se reporta se contrasta con el <a href="https://www.federalregister.gov">Federal Register</a> y el <a href="https://www.uscis.gov/policy-manual">Manual de Políticas de USCIS</a>.',
        },
        {
          hed: 'Los titulares, de medios en inglés <em>y</em> en español.',
          body: 'Noticieros de televisión en español, blogs de política migratoria muy técnicos, boletines de Substack, video social: desde blogs jurídicos especializados hasta cobertura de redadas de ICE en YouTube, estamos mirando y te traemos lo relevante.',
        },
      ],
      shots: [
        {
          src: '/images/immigration-daybook-edition-en.png',
          alt: 'La parte superior de una edición de Immigration Daybook del 3 de agosto de 2026, en inglés. La nota principal informa que venció un contrato federal que financiaba asistencia legal para menores migrantes no acompañados.',
          caption: 'El resumen: qué pasó, qué significa y quién lo reportó. (Edición en inglés.)',
        },
        {
          src: '/images/immigration-daybook-upcoming-en.png',
          alt: 'La sección Próximamente de la misma edición: un calendario con fechas, cada entrada con su enlace al Federal Register o a WR Immigration.',
          caption: 'El calendario: lo que viene, con la fuente primaria o la cita experta de cada fecha.',
        },
      ],
    },
    made: {
      heading: 'Cómo se hace',
      grafs: [
        'Este boletín es orgullosamente algorítmico, y queremos que sea el texto algorítmico más cuidado que hayas leído. La apuesta no es “la IA lee las noticias”: mucha gente hace eso y buena parte sale mal. La apuesta es que una redacción puede tener un cerebro, algo a lo que de verdad puedas <em>preguntarle</em> por todo lo que sabe y que enseñe su trabajo en vez de pedirte que confíes.',
        'El sistema lee las noticias del día y saca a la luz los patrones que encuentra. Después una persona edita: qué significa, si es exacto y quién lo cubrió mejor. Esa persona es <a href="https://recoveredfactory.net/es/presentamos-recovered-factory">David Eads</a>, periodista de datos con años de experiencia cubriendo inmigración para medios como NPR y The Marshall Project.',
      ],
    },
    archive: {
      heading: 'Todas las ediciones',
      empty: 'Aún no hay ediciones.',
    },
    close: {
      heading: 'Empieza hoy.',
      graf: 'Agosto fue un piloto gratuito; seguimos averiguando qué debe ser esto y cómo sostenerlo. Preferimos tenerte dentro desde la versión temprana a pulirla en el vacío.',
      contact:
        '¿Preguntas, correcciones o una historia que se nos escapó? <a href="mailto:davideads@recoveredfactory.net?subject=Immigration%20Daybook">Cuéntanos.</a>',
    },
  },
};

export const copy: Record<Lang, Copy> = { en, es };
