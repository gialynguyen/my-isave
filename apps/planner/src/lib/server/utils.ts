export function isSSR() {
  return !!import.meta.env.SSR;
}
