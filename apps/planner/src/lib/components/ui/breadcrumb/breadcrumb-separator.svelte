<script lang="ts">
  import { cn } from '$lib/utils.js';
  import type { WithElementRef } from 'bits-ui';
  import { ChevronRight } from 'lucide-svelte';
  import type { HTMLLiAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLLiAttributes> = $props();
</script>

<li
  role="presentation"
  aria-hidden="true"
  class={cn('[&>svg]:size-3.5', className)}
  bind:this={ref}
  {...restProps}
>
  {#if children}
    {@render children?.()}
  {:else}
    <ChevronRight />
  {/if}
</li>
