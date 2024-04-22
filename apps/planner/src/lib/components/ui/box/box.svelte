<script lang="ts" context="module">
  export type Props = {
    className?: string;
  };
</script>

<script lang="ts">
  import { twMerge } from 'tailwind-merge';

  let { className }: Props = $props();
</script>

<div
  class={twMerge(
    'h-full w-full rounded-3xl border border-transparent bg-primary-foreground px-4 py-6',
    className
  )}
>
  <slot />
</div>
