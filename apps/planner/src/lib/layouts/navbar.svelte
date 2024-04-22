<script lang="ts" context="module">
  export type Props = {
    className?: string;
  };
</script>

<script lang="ts">
  import { twMerge } from 'tailwind-merge';

  let { className }: Props = $props();
</script>

<div class={twMerge('flex justify-end px-3', className)}>
  <div>Navbar</div>
</div>
