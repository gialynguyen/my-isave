<script lang="ts" module>
  export type Props = {
    class?: string;
    value: string;
  };

  import { cn } from '$lib/utils';
  import { CheckCheck, Copy } from 'lucide-svelte';
  import { Button } from '../ui/button';
</script>

<script lang="ts">
  let { class: className, value }: Props = $props();
  let copied = $state(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
</script>

<Button
  size="icon"
  variant="ghost"
  onclick={copyToClipboard}
  class={cn(
    'relative z-10 h-6 w-6 text-zinc-50 hover:bg-zinc-700 hover:text-zinc-50 [&_svg]:h-3 [&_svg]:w-3',
    className
  )}
>
  <span class="sr-only">{copied ? 'Copied' : 'Copy'}</span>
  {#if copied}
    <CheckCheck />
  {:else}
    <Copy />
  {/if}
</Button>
