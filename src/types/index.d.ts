/// <reference types="vite-plugin-pwa/client" />

declare namespace svelteHTML {
  interface HTMLAttributes<T> {
    'onclick_outside'?: (e: CustomEvent) => void;
  }
}
