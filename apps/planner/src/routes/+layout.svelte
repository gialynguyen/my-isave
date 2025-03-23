<script lang="ts">
  import './fonts.css';
  import '../app.css';

  import { ModeWatcher } from 'mode-watcher';
  import Layout from '$lib/layouts/layout.svelte';
  import { browser } from '$app/environment';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

  import { page } from '$app/stores';
  import { MultiCreateButton } from '$lib/components/multi-create-button';

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

{#if $page.error}
  <slot />
{:else}
  <QueryClientProvider client={queryClient}>
    <Layout>
      <slot />
    </Layout>
    <div class="fixed right-16 bottom-16">
      <MultiCreateButton />
    </div>
  </QueryClientProvider>
{/if}

<style>
  :global(body) {
    overflow: hidden;
  }
</style>
