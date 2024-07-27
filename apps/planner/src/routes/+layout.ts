import { dev } from '$app/environment';
// Disable SSR when running the dev server
export const ssr = !dev;
