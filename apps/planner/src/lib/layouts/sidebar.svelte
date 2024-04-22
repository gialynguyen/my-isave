<script lang="ts">
  import { page } from '$app/stores';
  import { Button } from '$lib/components/ui/button';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { cn } from '$lib/utils';

  let { className = '' } = $props();
  const features = [
    {
      label: 'Dashboard',
      link: '/dashboard'
    },
    {
      label: 'Next 7 days',
      link: '/next-7-days'
    },
    {
      label: 'All my tasks',
      link: '/tasks'
    },
    {
      label: 'Calendar',
      link: '/calendar'
    }
  ];

  let currentFeature = $derived.by(() => {
    return features.find((feature) => feature.link === $page.route.id) || features[0];
  });
</script>

<div class={cn('space-y-4 py-4 pb-12', className)}>
  <h2 class="mb-2 px-4 text-lg font-semibold tracking-tight">Steven Nguyen</h2>
  <ScrollArea class="h-lvh">
    <div class="px-3 py-2">
      <div class="space-y-1">
        {#each features as feature}
          <Button
            href={feature.link}
            variant={feature === currentFeature ? 'secondary' : 'ghost'}
            class="w-full justify-start">{feature.label}</Button
          >
        {/each}
      </div>
    </div>
    <div class="px-3 py-2">
      <h2 class="mb-2 px-4 text-lg font-semibold tracking-tight">My List</h2>
      <div class="space-y-1">
        <Button variant="ghost" class="w-full justify-start">Personal</Button>
        <Button variant="ghost" class="w-full justify-start">Company</Button>
        <Button variant="ghost" class="w-full justify-start">VC-Team</Button>
      </div>
    </div>
  </ScrollArea>
</div>
