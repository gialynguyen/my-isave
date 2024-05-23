<script lang="ts" context="module">
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

<div
  class={twMerge(
    'h-full w-full rounded-3xl border border-transparent bg-primary-foreground px-5 py-4',
    className
  )}
>
  {#if title}
    <div>
      {@render title()}
    </div>
  {/if}
  {#if body}
    <div class="mt-3">
      {@render body()}
    </div>
  {/if}
</div>
