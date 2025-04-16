<script lang="ts" module>
  import type { Snippet } from 'svelte';

  export type Props = {
    className?: string;
    title?: Snippet;
    body?: Snippet;
  };
</script>

<script lang="ts">
  import { twMerge } from 'tailwind-merge';

  let { className, title, body }: Props = $props();
</script>

<div class={twMerge('bg-emphasis h-full w-full rounded-2xl border px-5 py-4', className)}>
  {#if title}
    {@render title()}
  {/if}
  {#if body}
    {@render body()}
  {/if}
</div>
