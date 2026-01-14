import type { ComponentType } from 'svelte';
import type { Lang } from '$lib/i18n';

export type ContentType = 'post' | 'page';

export type BlogMeta = {
  id?: string;
  canonicalId?: string;
  type?: ContentType;
  title: string;
  date: string;
  description?: string;
  byline?: string;
  previewImage?: string;
  tags?: string[];
  lang: Lang;
};

export type BlogPost = {
  component: ComponentType;
  meta: BlogMeta;
  slug: string;
  lang: Lang;
};

export type BlogPostSummary = Omit<BlogPost, 'component'>;

type BlogModule = {
  metadata: BlogMeta;
  default: ComponentType;
};

const modulesByLang = {
  en: {
    ...import.meta.glob<BlogModule>('/src/content/blog/en/*.md', { eager: true }),
    ...import.meta.glob<BlogModule>('../../content/blog/en/*.md', { eager: true }),
  },
  es: {
    ...import.meta.glob<BlogModule>('/src/content/blog/es/*.md', { eager: true }),
    ...import.meta.glob<BlogModule>('../../content/blog/es/*.md', { eager: true }),
  },
} satisfies Record<Lang, Record<string, BlogModule>>;

const entriesByLang = {
  en: mapModules(modulesByLang.en, 'en'),
  es: mapModules(modulesByLang.es, 'es'),
} satisfies Record<Lang, BlogPost[]>;

function mapModules(modules: Record<string, BlogModule>, lang: Lang): BlogPost[] {
  const bySlug = new Map<string, BlogPost>();

  for (const [path, mod] of Object.entries(modules)) {
    const slug = path.split('/').pop()?.replace(/\.md$/, '') ?? '';
    if (!slug) continue;

    const meta = {
      ...mod.metadata,
      type: mod.metadata.type ?? 'post',
    };

    bySlug.set(slug, {
      component: mod.default,
      meta,
      slug,
      lang,
    });
  }

  return Array.from(bySlug.values()).sort(
    (a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime(),
  );
}

function getCanonicalId(meta: BlogMeta): string | undefined {
  return meta.canonicalId ?? meta.id;
}

export function getPost(lang: Lang, slug: string): BlogPost | null {
  const entry = entriesByLang[lang].find((post) => post.slug === slug) ?? null;
  if (!entry) return null;
  return entry.meta.type === 'page' ? null : entry;
}

export function getEntry(lang: Lang, slug: string): BlogPost | null {
  return entriesByLang[lang].find((post) => post.slug === slug) ?? null;
}

export function listPosts(lang: Lang): BlogPostSummary[] {
  return entriesByLang[lang]
    .filter((post) => post.meta.type !== 'page')
    .map(({ component: _component, ...rest }) => rest);
}

export function findTranslationSlug(
  fromLang: Lang,
  fromSlug: string,
  toLang: Lang,
): string | null {
  const source = getEntry(fromLang, fromSlug);
  if (!source) return null;

  const canonicalId = getCanonicalId(source.meta);
  if (!canonicalId) return null;

  const match = entriesByLang[toLang].find(
    (post) => getCanonicalId(post.meta) === canonicalId,
  );

  return match?.slug ?? null;
}
