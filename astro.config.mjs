// @ts-check
import { defineConfig, envField } from "astro/config";
import node from "@astrojs/node";

import tailwindcss from "@tailwindcss/vite";

import solidJs from "@astrojs/solid-js";

// https://astro.build/config
export default defineConfig({
  output: "server",

  env: {
    schema: {
      AGIT_REPOSITORY_STORAGE: envField.string({
        context: "server",
        access: "secret",
      }),
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: node({
    mode: "standalone",
  }),

  integrations: [solidJs()],
});
