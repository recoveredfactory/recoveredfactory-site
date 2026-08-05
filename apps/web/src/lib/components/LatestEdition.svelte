<script lang="ts">
  /**
   * Highlights the most recent edition of a newsletter, with a way through to
   * the rest of them.
   *
   * Holds exactly one edition on purpose. This sits on a page whose job is the
   * subscribe ask, and one edition is enough to judge the writing by — several,
   * readable in place, would be a free sample standing in for the thing being
   * asked for. The archive link is the release valve: a reader who wants more
   * can have all of it, one click away and not in the hero.
   *
   * DESIGN TK: the treatment here is a placeholder. Copy is passed in as props
   * so it stays in the page that uses it, in its own language; the edition
   * itself comes from the server (see [lang]/[slug]/+page.server.ts), so there
   * is nothing to hand-edit when a new one ships.
   */
  type LatestEditionProps = {
    kicker: string;
    dateline?: string;
    title: string;
    blurb?: string;
    /** The edition itself — the title links here. */
    href?: string;
    /** The archive index. Deliberately a separate, quieter destination. */
    archiveHref?: string;
    archiveLabel?: string;
  };

  let {
    kicker,
    dateline = '',
    title,
    blurb = '',
    href = '',
    archiveHref = '',
    archiveLabel = '',
  }: LatestEditionProps = $props();
</script>

<section class="rf-edition not-prose">
  <!-- The archive link rides in the section header rather than under the card.
       At the foot of a card, accented and arrowed, it is the "read more" idiom
       and reads as a continuation of the edition — which is wrong twice over:
       the headline is already the link to the edition, and the archive is a
       different place, not more of this one. Up here against the kicker it
       reads as what it is: the section's other destination. -->
  <div class="rf-edition__head">
    <p class="rf-edition__kicker">{kicker}</p>
    {#if archiveHref && archiveLabel}
      <a class="rf-edition__archive" href={archiveHref}>{archiveLabel}</a>
    {/if}
  </div>

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

  </div>
</section>

<style>
  .rf-edition {
    margin: 0;
  }

  /* A masthead rule, not a card header: the kicker and the archive link sit on
     one baseline with a hairline under both, which is a sectioning idiom rather
     than a call to action. */
  .rf-edition__head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.4rem 1.5rem;
    margin: 0 0 1.1rem;
    padding-bottom: 0.7rem;
    border-bottom: 1px solid rgba(15, 23, 42, 0.15);
  }

  /* Kept in step with `.rf-kicker` on the pages that use this. */
  .rf-edition__kicker {
    margin: 0;
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

  /* Muted slate, not the fern accent. The accent is what the subscribe button
     uses; spending it here would put a second call to action on a page that
     wants exactly one. */
  .rf-edition__archive {
    flex: none;
    font-family: 'Jost', sans-serif;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    white-space: nowrap;
    color: rgb(100 116 139);
    text-decoration: none;
  }
  .rf-edition__archive:hover {
    color: var(--color-fern);
    text-decoration: underline;
    text-underline-offset: 4px;
  }

</style>
