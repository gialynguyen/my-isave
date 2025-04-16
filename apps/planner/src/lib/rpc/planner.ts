import { hc, type ClientResponse } from 'hono/client';
import { type ApiRoutes } from 'server/api';

let browserClient: ReturnType<typeof hc<ApiRoutes>>['api'];

export function getClient(fetch?: Window['fetch']) {
  const isBrowser = typeof window !== 'undefined';
  const origin = isBrowser ? window.location.origin : '';

  if (isBrowser && browserClient) {
    return browserClient;
  }

  const client = hc<ApiRoutes>(origin + '/', { fetch });

  if (isBrowser) {
    browserClient = client.api;
  }

  return client.api;
}

export async function jsonFetchWrapper<R>(
  fetcher: (c: typeof browserClient) => Promise<ClientResponse<R>>,
  fetch?: Window['fetch']
): Promise<R> {
  const isBrowser = typeof window !== 'undefined';
  const client = getClient(fetch || (isBrowser ? window.fetch : undefined));
  const res = await fetcher(client);
  if (!res.ok) {
    throw new Error('[fetch]: Something error');
  }

  return res.json() as Promise<R>;
}
