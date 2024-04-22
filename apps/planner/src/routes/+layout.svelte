<script>
  import { ModeWatcher } from 'mode-watcher';
  import Layout from '$lib/layouts/layout.svelte';

  import '../app.pcss';
  import { page } from '$app/stores';
</script>

<ModeWatcher defaultMode="dark" />

{#if $page.error}
  <slot />
{:else}
  <Layout>
    <slot />
  </Layout>
{/if}

<style>
  :global(body) {
    overflow: hidden;
  }
</style>
