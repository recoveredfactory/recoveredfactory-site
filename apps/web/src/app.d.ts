declare global {
  namespace App {
    interface Locals {}
    interface PageData {}
    interface PageState {}
    interface Error {}
  }
}

declare module '*.md' {
  import type { ComponentType } from 'svelte';

  export const metadata: Record<string, unknown>;
  const component: ComponentType;
  export default component;
}

export {};
