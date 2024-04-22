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
    'h-full w-full rounded-3xl border border-transparent bg-primary-foreground px-5 py-4',
    className
  )}
>
  {#if $$slots.title}
    <div>
      <slot name="title" />
    </div>
  {/if}
  {#if $$slots.body}
    <div class="mt-3">
      <slot name="body" />
    </div>
  {/if}
</div>
