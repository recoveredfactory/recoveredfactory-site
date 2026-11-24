<script lang="ts">
  import { onMount } from 'svelte';

  // A recorded assistant conversation, replayed: the question types out, the
  // tool calls tick off, the answer streams in. Every element is in the DOM
  // from the start (hidden, not absent), so the box never changes height and
  // the full text is there for search, screen readers and readers without JS.
  // Plays once when scrolled into view; reduced motion shows the final state.
  // ?bake on the page URL exposes window.__mcpChat for frame-by-frame renders:
  // ?bake renders at full height (a still), ?bake=scroll keeps the fixed-height
  // box and its auto-scroll (an animated GIF).
  type ChatTool = { name: string; args: string };
  type ChatData = { question: string; tools: ChatTool[]; answerHtml: string };

  const {
    data,
    source = '287(g) Watch',
    label = '',
    figureClass = 'my-8',
    captionClass = 'mt-2 text-xs text-slate-500',
    children,
  } = $props<{
    data: ChatData;
    source?: string;
    label?: string;
    figureClass?: string;
    captionClass?: string;
    children?: import('svelte').Snippet;
  }>();

  const TYPE_MS = 1200;
  const SEND_GAP = 200;
  const TOOL_GAP = 120;
  const TOOL_RUN = 380;
  const WORDS_PER_S = 75;
  const FOLLOW_MS = 140; // easing time constant for the auto-scroll

  let root: HTMLElement;
  let answerEl: HTMLElement;
  let viewport: HTMLElement;
  let userEl: HTMLElement;
  let toolEls: HTMLElement[] = $state([]);
  let lastEl: HTMLElement | null = null;
  let following = true;
  let scrollPos = 0;
  let scrollTarget = 0;
  let qChars = $state(Number.MAX_SAFE_INTEGER);
  let sent = $state(true);
  let toolsShown = $state(Number.MAX_SAFE_INTEGER);
  let toolsDone = $state(Number.MAX_SAFE_INTEGER);
  let done = $state(true);
  let baking = $state(false);
  let bakeFull = $state(false);
  let words: HTMLElement[] = [];
  let raf = 0;

  const toolsStart = TYPE_MS + SEND_GAP;
  const toolStartAt = (i: number) => toolsStart + i * (TOOL_GAP + TOOL_RUN);
  const answerStart = () => toolStartAt(data.tools.length) + 150;
  const duration = () => answerStart() + (words.length / WORDS_PER_S) * 1000;

  function setT(ms: number) {
    qChars = Math.min(data.question.length, Math.floor((ms / TYPE_MS) * data.question.length));
    sent = ms >= TYPE_MS + SEND_GAP;
    let shown = 0;
    let finished = 0;
    data.tools.forEach((_, i) => {
      if (ms >= toolStartAt(i)) shown = i + 1;
      if (ms >= toolStartAt(i) + TOOL_RUN) finished = i + 1;
    });
    toolsShown = shown;
    toolsDone = finished;
    const k = ms < answerStart() ? 0 : Math.floor(((ms - answerStart()) / 1000) * WORDS_PER_S);
    words.forEach((w, i) => w.classList.toggle('on', i < k));
    lastEl = k > 0 ? words[Math.min(k, words.length) - 1] : shown > 0 ? toolEls[shown - 1] : userEl;
    answerEl.classList.toggle('streaming', ms < duration());
    done = ms >= duration();
  }

  // Keep the newest line in view, easing toward it; never scroll back up.
  function follow(dt: number) {
    if (!following || !lastEl || !viewport) return true;
    const box = viewport.getBoundingClientRect();
    const bottom = lastEl.getBoundingClientRect().bottom - box.top + viewport.scrollTop + 28;
    scrollTarget = Math.max(scrollTarget, bottom - viewport.clientHeight, 0);
    scrollPos += (scrollTarget - scrollPos) * (1 - Math.exp(-dt / FOLLOW_MS));
    if (Math.abs(scrollTarget - scrollPos) < 0.5) scrollPos = scrollTarget;
    viewport.scrollTop = scrollPos;
    return scrollPos === scrollTarget;
  }

  function play() {
    cancelAnimationFrame(raf);
    following = true;
    scrollPos = scrollTarget = 0;
    if (viewport) viewport.scrollTop = 0;
    const t0 = performance.now();
    let prev = t0;
    const tick = (now: number) => {
      setT(now - t0);
      const settled = follow(now - prev);
      prev = now;
      if (!done || !settled) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  // A reader who scrolls the box takes over from the auto-scroll.
  function stopFollowing() {
    following = false;
  }

  onMount(() => {
    // Wrap each word of the answer so it can stream in.
    const walk = (node: Node) => {
      for (const c of [...node.childNodes]) {
        if (c.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          for (const part of (c.textContent ?? '').split(/(\s+)/)) {
            if (!part) continue;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
            else {
              const s = document.createElement('span');
              s.className = 'w';
              s.textContent = part;
              frag.appendChild(s);
              words.push(s);
            }
          }
          c.replaceWith(frag);
        } else if (c.nodeType === Node.ELEMENT_NODE) walk(c);
      }
    };
    walk(answerEl);
    root.classList.add('js');

    const bake = new URLSearchParams(location.search).get('bake');
    if (bake !== null) {
      baking = true;
      bakeFull = bake !== 'scroll';
      (window as any).__mcpChat = {
        setT,
        duration: duration(),
        step(ms: number, dt: number) {
          setT(ms);
          follow(dt);
        },
        reset() {
          following = true;
          scrollPos = scrollTarget = 0;
          viewport.scrollTop = 0;
        },
      };
      setT(0);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setT(duration());
      return;
    }
    setT(0);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          play();
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  });
</script>

<figure class={`rf-mcp-chat mx-auto ${figureClass}`} aria-label={label || undefined}>
  <div class="chat" bind:this={root}>
    <div class="bar">
      <span class="dot" aria-hidden="true"></span>
      <b>{source}</b>
      <span>connected to an AI assistant</span>
    </div>
    <div
      class="viewport"
      class:bake={bakeFull}
      bind:this={viewport}
      onwheel={stopFollowing}
      ontouchstart={stopFollowing}
      onkeydown={stopFollowing}
      tabindex="0"
      role="region"
      aria-label="Recorded conversation"
    >
    <div class="body">
      <div class="user" bind:this={userEl} class:pending={qChars === 0 && !sent}>
        {#each [...data.question] as ch, i}<span class:off={i >= qChars}>{ch}</span>{/each}
      </div>
      <ol class="tools">
        {#each data.tools as tool, i}
          <li class="tool" bind:this={toolEls[i]} class:pending={i >= toolsShown}>
            {#if i < toolsDone}
              <span class="ok" aria-hidden="true">✓</span>
            {:else}
              <span class="spin" aria-hidden="true"></span>
            {/if}
            <span class="src">{source}</span>
            <code class="name">{tool.name}</code>
            <code class="args">{tool.args}</code>
          </li>
        {/each}
      </ol>
      <div class="answer" bind:this={answerEl}>
        {@html data.answerHtml}
      </div>
    </div>
    </div>
    {#if !baking}
      <div class="foot">
        <button class="replay" type="button" onclick={play} class:pending={!done} tabindex={done ? 0 : -1}>
          Replay
        </button>
      </div>
    {/if}
  </div>
  {#if children}
    <figcaption class={`rf-image-caption ${captionClass}`}>
      {@render children()}
    </figcaption>
  {/if}
</figure>

<style>
  .chat {
    --paper: #fbfaf6;
    --ink: #1e2330;
    --mute: #6b6a63;
    --line: #dcd7c6;
    position: relative;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 14px;
    overflow: hidden;
    color: var(--ink);
    font-family: var(--font-body, 'Inter', sans-serif);
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--line);
    font-size: 13px;
    color: var(--mute);
  }
  .bar b {
    color: var(--ink);
    font-weight: 600;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #2fb26a;
  }
  .viewport {
    height: min(560px, 72vh);
    overflow-y: auto;
    scroll-behavior: auto;
  }
  .viewport:focus-visible {
    outline: 2px solid #c95918;
    outline-offset: -2px;
  }
  .viewport.bake {
    height: auto;
    overflow: visible;
  }
  .body {
    padding: 18px 20px 22px;
  }
  .user {
    margin-left: auto;
    max-width: 85%;
    width: fit-content;
    background: var(--ink);
    color: #f3f1e9;
    border-radius: 14px 14px 4px 14px;
    padding: 10px 14px;
    font-size: 15px;
    line-height: 1.45;
  }
  .tools {
    list-style: none;
    margin: 16px 0 14px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .tool {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: 8px;
    row-gap: 2px;
    width: fit-content;
    max-width: 100%;
    font-size: 13px;
    color: var(--mute);
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 6px 10px;
  }
  .tool code {
    font-family: ui-monospace, 'JetBrains Mono', 'IBM Plex Mono', monospace;
    font-size: 12px;
  }
  .tool .name {
    color: var(--ink);
  }
  .tool .args {
    color: var(--mute);
    word-break: break-word;
  }
  .src {
    font-weight: 600;
    color: var(--ink);
  }
  .ok {
    color: #2fb26a;
    font-weight: 700;
    width: 13px;
  }
  .spin {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid var(--line);
    border-top-color: #d81f48;
    animation: rf-spin 0.7s linear infinite;
    align-self: center;
  }
  @keyframes rf-spin {
    to {
      transform: rotate(360deg);
    }
  }
  .answer {
    font-size: 15px;
    line-height: 1.55;
  }
  .answer :global(p),
  .answer :global(ul) {
    margin: 0 0 12px;
  }
  .answer :global(h2) {
    font-family: var(--font-body, 'Inter', sans-serif);
    font-size: 16px;
    font-weight: 650;
    margin: 18px 0 8px;
  }
  .answer :global(ul) {
    padding-left: 18px;
    list-style: disc;
  }
  .answer :global(li) {
    margin-bottom: 6px;
  }
  .answer :global(li::marker) {
    color: #d81f48;
  }
  .answer :global(a) {
    color: var(--color-link, #c95918);
    text-decoration: underline;
    text-decoration-color: #e9c9b2;
    text-underline-offset: 2px;
  }
  .answer :global(strong) {
    font-weight: 650;
  }
  .answer :global(> :last-child) {
    margin-bottom: 0;
  }
  /* Hidden but still taking up space, so nothing below moves. */
  .js .pending,
  .js .off {
    visibility: hidden;
  }
  .js .answer :global(.w) {
    opacity: 0;
  }
  .js .answer :global(.w.on) {
    opacity: 1;
  }
  /* List markers belong to items whose first word has not arrived yet. */
  .js .answer.streaming :global(li:not(:has(.w.on))) {
    list-style-type: none;
  }
  .foot {
    display: flex;
    justify-content: flex-end;
    padding: 7px 14px;
    border-top: 1px solid var(--line);
  }
  .replay {
    font-size: 12px;
    color: var(--mute);
    background: transparent;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 2px 10px;
    cursor: pointer;
  }
  .replay:hover {
    color: var(--ink);
  }
  @media (min-width: 640px) {
    .user,
    .answer {
      font-size: 16px;
    }
  }
</style>
