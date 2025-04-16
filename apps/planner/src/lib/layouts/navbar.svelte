<script lang="ts" module>
  export type Props = {
    className?: string;
  };
</script>

<script lang="ts">
  import { SidebarTrigger } from '$lib/components/ui/sidebar';
  import { twMerge } from 'tailwind-merge';
  import PageBreadcrumb from './page-breadcrumb.svelte';

  let { className }: Props = $props();
</script>

<div class={twMerge('flex items-center justify-between px-3', className)}>
  <div class="flex items-center gap-2">
    <SidebarTrigger />
    <PageBreadcrumb />
  </div>
  <div></div>
</div>
