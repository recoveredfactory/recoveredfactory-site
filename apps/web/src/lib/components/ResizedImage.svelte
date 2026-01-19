<script lang="ts">
  import { getResizedImageUrl } from '$lib/images';

  type ResizedImageProps = {
    src: string;
    alt?: string;
    width?: number;
    quality?: number;
    loading?: 'lazy' | 'eager';
    decoding?: 'async' | 'sync' | 'auto';
    class?: string;
    figureClass?: string;
    caption?: string;
    captionClass?: string;
  };

  const {
    src = '',
    alt = '',
    width,
    quality,
    loading = 'lazy',
    decoding = 'async',
    class: className = 'w-full h-auto',
    figureClass: figureClassProp,
    caption,
    captionClass = 'mt-2 text-xs text-slate-500',
    children,
    ...rest
  } = $props<ResizedImageProps & { children?: import('svelte').Snippet }>();

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const sanitizeUrl = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.startsWith('/')) return trimmed;
    try {
      const parsed = new URL(trimmed);
      if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
        return parsed.href;
      }
    } catch {
      return '';
    }
    return '';
  };

  const formatInline = (value: string) => {
    const escaped = escapeHtml(value);
    return escaped
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>');
  };

  const renderMarkdown = (value: string) => {
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    let result = '';
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = linkPattern.exec(value)) !== null) {
      const [full, text, url] = match;
      result += formatInline(value.slice(lastIndex, match.index));
      const safeUrl = sanitizeUrl(url);
      if (safeUrl) {
        result += `<a href="${safeUrl}" rel="noopener noreferrer" target="_blank">${formatInline(
          text,
        )}</a>`;
      } else {
        result += formatInline(text);
      }
      lastIndex = match.index + full.length;
    }

    result += formatInline(value.slice(lastIndex));
    return result.replace(/\n/g, '<br />');
  };

  const captionHtml = $derived(caption ? renderMarkdown(caption) : '');

  const figureClass = $derived(
    `mx-auto max-w-md${figureClassProp ? ` ${figureClassProp}` : ''}`,
  );
</script>

{#if src}
  <figure class={figureClass}>
    <img
      {...rest}
      src={getResizedImageUrl(src, { width, quality })}
      alt={alt}
      loading={loading}
      decoding={decoding}
      class={className}
    />
    {#if caption}
      <figcaption class={captionClass}>{@html captionHtml}</figcaption>
    {:else if children}
      <figcaption class={captionClass}>
        {@render children()}
      </figcaption>
    {/if}
  </figure>
{/if}
