import type { Handle } from '@sveltejs/kit';
import api from './server/api';

export const handle: Handle = async ({ event, resolve }) => {
  // Handle API routes
  if (event.url.pathname.startsWith('/api') || event.url.pathname === '/health') {
    return api.fetch(event.request);
  }

  // Handle SvelteKit routes
  const response = await resolve(event);
  return response;
};