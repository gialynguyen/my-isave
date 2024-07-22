import type { ClientResponse } from 'hono/client';

export async function fetcher<R>(promise: Promise<ClientResponse<R>>) {
  return promise.then((res) => res.json());
}
