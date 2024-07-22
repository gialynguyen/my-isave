import { sveltekit } from '@sveltejs/kit/vite';
import { swc } from 'rollup-plugin-swc3';

import type { Server } from 'http';
import { loadEnvFile } from 'process';
import { defineConfig } from 'vitest/config';

loadEnvFile();

export default defineConfig({
  plugins: [
    swc({
      exclude: 'node_modules/',
      jsc: {
        keepClassNames: true,
        parser: {
          syntax: 'typescript',
          decorators: true,
          dynamicImport: true
        },
        target: 'esnext',
        paths: {
          $lib: ['./src/lib'],
          '$lib/*': ['./src/lib/*'],
          features: ['./src/features'],
          'features/*': ['./src/features/*'],
          server: ['./src/server'],
          'server/*': ['./src/server/*']
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
          react: {
            runtime: 'automatic'
          }
        }
      },
      module: {
        allowTopLevelThis: true,
        type: 'nodenext'
      },
      isModule: true,
      minify: false
    }),
    sveltekit(),
    {
      name: 'sveltekit-inject-httpserver',
      configureServer(server) {
        global.httpServer = Promise.resolve(server.httpServer! as Server);
      },
      configurePreviewServer: {
        order: 'pre', // important so that the handler executes _before_ hooks.server.ts
        handler: (server) => {
          global.httpServer = Promise.resolve(server.httpServer as Server);
        }
      }
    }
  ],
  server: {
    port: Number(process.env.HTTP_PORT)!
  },
  esbuild: false,
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}']
  }
});
