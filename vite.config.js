import {svelte} from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import {VitePWA} from "vite-plugin-pwa";
import {defineConfig} from "vite";
import {fileURLToPath} from "node:url";

export default defineConfig({
  resolve: {
    alias: {'@shared': fileURLToPath(new URL('./shared/index.ts', import.meta.url))},
  },
  plugins: [
    tailwindcss(),
    svelte(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/sw',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      manifest: false,
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
    {
      name: 'manifest-version',
      transformIndexHtml: (html) => html.replace('/manifest.json', `/manifest.json?v=${Math.floor(Date.now() / 1000)}`),
    },
  ],
})

