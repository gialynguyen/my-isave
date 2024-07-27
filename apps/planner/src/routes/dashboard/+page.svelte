<script lang="ts">
  import { Box } from '$lib/components/ui/box';
  import { Badge } from '$lib/components/ui/badge';
  import TaskSection from './task-section.svelte';
</script>

{#snippet boxTitle(title: string, totalItems: number)}
  <span class="text-sm font-semibold">{title}</span>
  <Badge variant="secondary" class="mx-1">{totalItems}</Badge>
{/snippet}

<div class="flex h-full w-full">
  <div class="flex w-2/3 flex-col">
    <div class="mb-4 flex h-1/2 min-h-60">
      <TaskSection />
      <Box className="m-2 w-1/2">
        {#snippet title()}
          {@render boxTitle("Today's events", 3)}
        {/snippet}
      </Box>
    </div>
    <div class="mb-6 flex h-1/2 min-h-96">
      <Box className="m-2 w-1/2">
        {#snippet title()}
          {@render boxTitle("Today's Reminder", 3)}
        {/snippet}
      </Box>
      <Box className="m-2 w-1/2">
        {#snippet title()}
          {@render boxTitle('Tracking habits', 3)}
        {/snippet}
      </Box>
    </div>
  </div>
  <div class="ml-4 w-1/3 py-4">Activities</div>
</div>
