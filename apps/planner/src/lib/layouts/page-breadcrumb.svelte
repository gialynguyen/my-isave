<script lang="ts" module>
  type ModuleData = {
    pageTitle?: string;
    getPageTitle?: () => string;
  };

  type HistoryItem = {
    url: string;
    title: string;
    timestamp: number;
  };
</script>

<script lang="ts">
  import { afterNavigate } from '$app/navigation';

  import { page } from '$app/state';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb';
  import { Slash } from 'lucide-svelte';
  import { onMount } from 'svelte';

  let routeModules: Record<string, ModuleData> = $state(
    import.meta.glob('/src/routes/**/*.svelte', {
      eager: true
    })
  );

  let navigationHistory: HistoryItem[] = $state([]);
  let currentUrl = $state('');

  let routeId = $derived(page.route.id);

  function formatTitle(segment: string): string {
    // Remove URL parameters and hash
    segment = segment.split('?')[0].split('#')[0];

    // Remove ID patterns like [id] or [slug]
    if (/^\[.*\]$/.test(segment)) {
      return 'Detail';
    }

    // Replace dashes and underscores with spaces
    segment = segment.replace(/[-_]/g, ' ');

    // Capitalize first letter of each word
    return segment
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim();
  }

  function getTitleFromPath(path: string): string {
    // Get the last segment of the path
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    if (!lastSegment) return 'Page';

    return formatTitle(lastSegment);
  }

  function handleNavigationChange() {
    const pathname = page.url.pathname;

    const maxItems = 4;

    // Skip if it's the same URL
    if (currentUrl === pathname) return;

    // If we have a previous URL, add it to history
    if (currentUrl) {
      // Add to history if it's not already the last item
      const lastHistoryItem = navigationHistory[navigationHistory.length - 1];
      if (!lastHistoryItem || lastHistoryItem.url !== currentUrl) {
        navigationHistory = [
          ...navigationHistory,
          { url: currentUrl, title: getTitleFromPath(currentUrl), timestamp: Date.now() }
        ];

        // Limit history length
        if (navigationHistory.length > maxItems) {
          navigationHistory = navigationHistory.slice(navigationHistory.length - maxItems);
        }
      }
    }

    // Update current URL
    currentUrl = pathname;
  }

  onMount(() => {
    // Initialize with current URL
    currentUrl = page.url.pathname;
  });

  afterNavigate(() => {
    handleNavigationChange();
  });

  function getPageTitleFromModule(module: ModuleData | undefined) {
    if (module?.pageTitle) {
      return module.pageTitle;
    }

    if (module?.getPageTitle) {
      return module.getPageTitle();
    }

    return undefined;
  }

  function titleSanitizer(title: string) {
    return title.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
  }

  let breadcrumbItems = $derived.by(() => {
    if (!routeId) return [];

    const relPathToRoutes = '/src/routes/';
    const crumbs = [];

    let completeUrl = '';
    let completeRoute = relPathToRoutes + (relPathToRoutes.slice(-1) == '/' ? '' : '/');

    const routes = routeId.split(/(?<!\))\//).filter((p) => p != '');
    const paths = page.url.pathname.split('/').filter((p) => p != '');

    for (let i = 0; i < paths.length; i++) {
      let path = paths[i];
      let route = routes[i];
      completeUrl += `/${path}`;

      // Note: the slash is trailing here because the prefix always exists as the provided
      // relative path to the routes folder, and we are appending another path to
      // the end later
      completeRoute += `${route}/`;

      // routeModules type is technically undefined so we can detect when a value
      // is passed in or not, but will always be generated in the onMount as a
      // fallback.
      const routeModule =
        routeModules === undefined ? undefined : routeModules[`${completeRoute}+page.svelte`];

      if (!routeModule) {
        continue;
      }

      let url: string | undefined = completeUrl;

      // Don't show a link for the breadcrumb representing the current page
      if (i == paths.length - 1) {
        url = undefined;
      }

      // Don't show a breadcrumb if there is no page for the route
      if (routeModule == undefined) {
        url = undefined;
      }

      crumbs.push({
        // Last crumb gets no url as it is the current page
        url,
        title: getPageTitleFromModule(routeModule) || titleSanitizer(path)
      });
    }

    return crumbs;
  });
</script>

<Breadcrumb.Root>
  <Breadcrumb.List class="sm:gap-1.5">
    {#each breadcrumbItems as crumb}
      <Breadcrumb.Item>
        <Breadcrumb.Link href={crumb.url} class="hover:cursor-pointer"
          >{crumb.title}</Breadcrumb.Link
        >
      </Breadcrumb.Item>
      <Breadcrumb.Separator>
        <Slash />
      </Breadcrumb.Separator>
    {/each}
  </Breadcrumb.List>
</Breadcrumb.Root>
