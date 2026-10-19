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
      sources: 'Sources',
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
    deck: 'Making sense of the spectacle. Every weekday, in English and Spanish.',
    latest: {
      heading: 'The latest edition',
      also: 'Also in this edition',
      read: 'Read the edition',
      all: 'Every edition',
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
      sources: 'Fuentes',
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
    deck: 'Para entender el espectáculo. Cada día hábil, en español e inglés.',
    latest: {
      heading: 'La última edición',
      also: 'También en esta edición',
      read: 'Leer la edición',
      all: 'Todas las ediciones',
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
