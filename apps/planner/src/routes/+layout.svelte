<script lang="ts">
  import './fonts.css';
  import { ModeWatcher } from 'mode-watcher';
  import Layout from '$lib/layouts/layout.svelte';
  import { browser } from '$app/environment';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

  import '../app.pcss';
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
    <div class="fixed bottom-16 right-16">
      <MultiCreateButton />
    </div>
  </QueryClientProvider>
{/if}

<style>
  :global(body) {
    overflow: hidden;
  }
</style>
