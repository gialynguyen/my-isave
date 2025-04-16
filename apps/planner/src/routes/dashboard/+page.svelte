<script lang="ts">
  import { Box } from '$lib/components/ui/box';
  import { Badge } from '$lib/components/ui/badge';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Separator } from '$lib/components/ui/separator';
  import TaskSection from './task-section.svelte';
</script>

{#snippet boxTitle(title: string, totalItems: number)}
  <div class="flex items-center justify-between pb-2">
    <h3 class="text-lg font-semibold tracking-tight">{title}</h3>
    <Badge variant="secondary">{totalItems}</Badge>
  </div>
  <Separator class="mb-4" />
{/snippet}

<div class="flex h-[calc(100vh-4rem)] w-full gap-6">
  <div class="flex w-2/3 flex-col gap-6">
    <div class="grid h-[calc(50%-1rem)] grid-cols-2 gap-6">
      <TaskSection />
      <Box className="flex flex-col overflow-hidden">
        {#snippet title()}
          {@render boxTitle("Today's events", 3)}
        {/snippet}
        {#snippet body()}
          <ScrollArea class="flex-1">
            <div class="space-y-4 pr-4">
              <!-- Event content here -->
            </div>
          </ScrollArea>
        {/snippet}
      </Box>
    </div>
    <div class="grid h-[calc(50%-1rem)] grid-cols-2 gap-6">
      <Box className="flex flex-col overflow-hidden">
        {#snippet title()}
          {@render boxTitle("Today's Reminder", 3)}
        {/snippet}
        {#snippet body()}
          <ScrollArea class="flex-1">
            <div class="space-y-4 pr-4">
              <!-- Reminder content here -->
            </div>
          </ScrollArea>
        {/snippet}
      </Box>
      <Box className="flex flex-col overflow-hidden">
        {#snippet title()}
          {@render boxTitle('Tracking habits', 3)}
        {/snippet}
        {#snippet body()}
          <ScrollArea class="flex-1">
            <div class="space-y-4 pr-4">
              <!-- Habits content here -->
            </div>
          </ScrollArea>
        {/snippet}
      </Box>
    </div>
  </div>
  <div class="w-1/3">
    <Box className="h-full">
      {#snippet title()}
        {@render boxTitle('Activities', 0)}
      {/snippet}
      {#snippet body()}
        <ScrollArea class="h-[calc(100vh-8rem)]">
          <div class="space-y-4 pr-4">
            <!-- Activities content here -->
          </div>
        </ScrollArea>
      {/snippet}
    </Box>
  </div>
</div>
