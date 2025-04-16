<script lang="ts">
  import '../app.css';
  import './fonts.css';

  import { browser } from '$app/environment';
  import Layout from '$lib/layouts/layout.svelte';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import { ModeWatcher } from 'mode-watcher';

  import { page } from '$app/state';
  import { MultiCreateButton } from '$lib/components/multi-create-button';
  import { Router } from '$lib/router';

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
        refetchOnWindowFocus: false
      }
    }
  });
</script>

<ModeWatcher defaultMode="dark" />

{#if page.error}
  <slot />
{:else}
  <QueryClientProvider client={queryClient}>
    <Router>
      <Layout>
        <slot />
      </Layout>
      <div class="fixed right-16 bottom-16">
        <MultiCreateButton />
      </div>
    </Router>
  </QueryClientProvider>
{/if}

<style>
  :global(body) {
    overflow: hidden;
  }
</style>
