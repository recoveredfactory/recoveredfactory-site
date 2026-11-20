<script lang="ts">
  import data from '$lib/data/287g-interstates-chart-data.json';
  import type { Lang } from '$lib/i18n';
  import { AXIS_TEXT } from './chart-utils';
  import { RED, PINK, NEITHER } from './interstates-colors';

  // One bar of every interstate mile in the lower 48, split by who has an
  // agreement on it. Same red/pink as the post's map video.
  const { lang = 'en' } = $props<{ lang?: Lang }>();

  const STRINGS = {
    en: {
      title: 'Every interstate mile in the lower 48',
      both: 'State patrol and a local agency',
      patrolOnly: 'State patrol only',
      localOnly: 'Local agency only',
      none: 'Neither',
      note: "State patrols count where their Task Force agreement reaches every interstate in the state; local agencies count with any type of agreement. Data: ICE's 287(g) list as of Nov. 16, 2026, via 287(g) Watch; Census TIGER/Line roads.",
    },
    es: {
      title: 'Cada milla de autopista interestatal en los 48 estados contiguos',
      both: 'Patrulla estatal y una agencia local',
      patrolOnly: 'Solo la patrulla estatal',
      localOnly: 'Solo una agencia local',
      none: 'Ninguna',
      note: 'Las patrullas estatales cuentan donde su acuerdo Task Force alcanza todas las interestatales del estado; las agencias locales cuentan con cualquier tipo de acuerdo. Datos: lista 287(g) de ICE al 16 de noviembre de 2026, vía 287(g) Watch; carreteras TIGER/Line del Censo.',
    },
  } as const;

  const t = $derived(STRINGS[lang]);
  const o = data.overlap;

  const parts = $derived([
    { key: 'both', label: t.both, value: o.both, color: RED, hatch: false },
    { key: 'patrolOnly', label: t.patrolOnly, value: o.patrolOnly, color: PINK, hatch: false },
    { key: 'localOnly', label: t.localOnly, value: o.localOnly, color: PINK, hatch: true },
    { key: 'none', label: t.none, value: o.none, color: NEITHER, hatch: false },
  ]);

  const total = o.both + o.patrolOnly + o.localOnly + o.none;

  function fill(color: string, hatch: boolean): string {
    return hatch
      ? `background: repeating-linear-gradient(135deg, ${color} 0 2px, color-mix(in srgb, ${color} 30%, transparent) 2px 7px)`
      : `background: ${color}`;
  }
</script>

<figure class="rf-chart my-8">
  <div class="font-display text-lg font-semibold leading-snug text-slate-800">{t.title}</div>

  <div class="mt-3 flex h-10 w-full gap-[3px]" role="img" aria-label={parts.map((p) => `${Math.round(p.value)}% ${p.label}`).join(', ')}>
    {#each parts as p}
      <div style="width: {(p.value / total) * 100}%; {fill(p.color, p.hatch)}"></div>
    {/each}
  </div>

  <div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
    {#each parts as p}
      <div>
        <div class="flex items-center gap-2">
          <span class="inline-block h-3.5 w-3.5 shrink-0" style={fill(p.color, p.hatch)}></span>
          <span class="font-display text-2xl font-semibold tabular-nums leading-none text-slate-900">{Math.round(p.value)}%</span>
        </div>
        <div class="mt-1 text-sm leading-snug text-slate-700">{p.label}</div>
      </div>
    {/each}
  </div>

  <figcaption class="mt-3 text-xs" style="color: {AXIS_TEXT}">{t.note}</figcaption>
</figure>
