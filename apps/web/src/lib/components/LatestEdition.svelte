<script lang="ts">
  /**
   * Highlights the most recent edition of a newsletter. Deliberately holds one
   * edition and nothing else — there is no archive index behind it yet.
   *
   * DESIGN TK: the treatment here is a placeholder. Content is passed in as
   * props so the copy stays in the page that uses it, in its own language.
   */
  type LatestEditionProps = {
    kicker: string;
    dateline?: string;
    title: string;
    blurb?: string;
    href?: string;
    linkLabel?: string;
    note?: string;
  };

  let {
    kicker,
    dateline = '',
    title,
    blurb = '',
    href = '',
    linkLabel = '',
    note = '',
  }: LatestEditionProps = $props();
</script>

<section class="rf-edition not-prose">
  <p class="rf-edition__kicker">{kicker}</p>

  <div class="rf-edition__card">
    {#if dateline}
      <p class="rf-edition__dateline">{dateline}</p>
    {/if}

    <h2 class="rf-edition__title">
      {#if href}
        <a href={href}>{title}</a>
      {:else}
        {title}
      {/if}
    </h2>

    {#if blurb}
      <p class="rf-edition__blurb">{blurb}</p>
    {/if}

    {#if href && linkLabel}
      <p class="rf-edition__more">
        <a href={href}>{linkLabel}</a>
      </p>
    {/if}

    {#if note}
      <p class="rf-edition__note">{note}</p>
    {/if}
  </div>
</section>

<style>
  .rf-edition {
    margin: 0;
  }

  .rf-edition__kicker {
    margin: 0 0 0.9rem;
    font-family: 'Jost', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgb(15 23 42);
  }

  /* A plate, not a card: hard edges and a heavy ink rule on the reading edge,
     so it reads as a specimen of the product rather than a UI widget. */
  .rf-edition__card {
    padding: 1.6rem 1.5rem;
    border: 1px solid rgba(15, 23, 42, 0.15);
    border-left: 6px solid var(--color-fern);
    background: #ffffff;
  }

  @media (min-width: 640px) {
    .rf-edition__card {
      padding: 2.25rem 2.5rem;
    }
  }

  .rf-edition__dateline {
    margin: 0 0 0.85rem;
    font-family: 'Jost', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgb(100 116 139);
  }

  .rf-edition__title {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 3.8vw, 2.1rem);
    font-weight: 600;
    line-height: 1.18;
    letter-spacing: -0.018em;
    color: rgb(15 23 42);
    text-wrap: balance;
  }
  .rf-edition__title a {
    color: inherit;
    text-decoration: none;
  }
  .rf-edition__title a:hover {
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  .rf-edition__blurb {
    margin: 0.9rem 0 0;
    font-family: var(--font-body);
    font-size: 1rem;
    line-height: 1.6;
    color: rgb(71 85 105);
    text-wrap: pretty;
  }

  .rf-edition__more {
    margin: 1.25rem 0 0;
  }
  .rf-edition__more a {
    font-family: 'Jost', sans-serif;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--color-fern);
    text-decoration: none;
  }
  .rf-edition__more a:hover {
    text-decoration: underline;
    text-underline-offset: 5px;
  }

  /* Placeholder marker — delete this along with the `note` prop once the real
     edition and its design land. */
  .rf-edition__note {
    margin: 1.5rem 0 0;
    padding-top: 1rem;
    border-top: 1px dashed rgba(15, 23, 42, 0.2);
    font-family: 'Jost', sans-serif;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgb(148 163 184);
  }
</style>
