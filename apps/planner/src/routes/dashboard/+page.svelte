<script>
  import { Box } from '$lib/components/ui/box';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
</script>

<div class="flex h-full w-full">
  <div class="flex w-2/3 flex-col">
    <div class="mb-4 flex max-h-[500px] min-h-60">
      <Box className="m-2 w-1/2">
        <svelte:fragment slot="title">
          <span class="text-sm font-semibold">Today's tasks</span>
          <Badge variant="secondary" class="mx-1">3</Badge>
        </svelte:fragment>
        <svelte:fragment slot="body">
          <Button variant="secondary">Add a task</Button>
        </svelte:fragment>
      </Box>
      <Box className="m-2 w-1/2">
        <svelte:fragment slot="title">
          <span class="text-sm font-semibold">Today's events</span>
          <Badge variant="secondary" class="mx-1">3</Badge>
        </svelte:fragment>
      </Box>
    </div>
    <div class="mb-6 flex max-h-[800px] min-h-96">
      <Box className="m-2 w-1/2">
        <svelte:fragment slot="title">
          <span class="text-sm font-semibold">Tracking habit</span>
          <Badge variant="secondary" class="mx-1">3</Badge>
        </svelte:fragment>
      </Box>
      <Box className="m-2 w-1/2">
        <svelte:fragment slot="title">
          <span class="text-sm font-semibold">Quick notes</span>
          <Badge variant="secondary" class="mx-1">3</Badge>
        </svelte:fragment>
      </Box>
    </div>
  </div>
  <div class="ml-4 w-1/3 py-4">Activities</div>
</div>
