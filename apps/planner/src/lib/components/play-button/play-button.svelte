<script lang="ts" context="module">
  export type Props = {
    className?: string;
  };
</script>

<script lang="ts">
  import { Pause, Play } from 'lucide-svelte';

  import { twMerge } from 'tailwind-merge';
  let { className }: Props = $props();

  let state = $state<'playing' | 'pause'>('pause');
</script>

<div
  class={twMerge(
    'flex cursor-pointer items-center justify-center rounded-full border p-2.5',
    state === 'playing' && 'bg-orange-500',
    state === 'pause' && 'border-blue-600',
    className
  )}
>
  {#if state === 'playing'}
    <Pause color="none" fill="#ffffff" stroke-linecap="round" size="16" />
  {:else}
    <Play color="none" fill="#2f6fef" stroke-linecap="round" size="16" />
  {/if}
</div>
