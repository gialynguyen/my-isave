<script lang="ts" module>
  export type RouteModule = {
    pageTitle?: string;
    getPageTitle: () => string;
  };
</script>

<script lang="ts">
  import { page } from '$app/state';

  let { children } = $props();

  let routeModules: Record<string, RouteModule> = $state(
    import.meta.glob('/src/routes/**/*.svelte', {
      eager: true
    })
  );

  let currentRouteModule = $derived.by(() => {
    const routeId = page.route.id;
    if (!routeId) return null;

    const relPathToRoutes = '/src/routes';
    const modulePath = `${relPathToRoutes}${routeId}/+page.svelte`;
    const routeModule = routeModules[modulePath];

    return {
      routeId,
      modulePath,
      routeModule
    };
  });
</script>

{@render children?.()}
