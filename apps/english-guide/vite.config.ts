import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5174
  },
  preview: {
    port: 4174
  },
  define: {
    // Ensure environment variables are available during build
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});