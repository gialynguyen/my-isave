<script>
  import { Box } from '$lib/components/ui/box';
</script>

<div class="flex h-full w-full">
  <div class="flex w-2/3 flex-col">
    <div class="mb-4 flex h-1/3">
      <Box className="m-2 w-1/2">Today's tasks</Box>
      <Box className="m-2 w-1/2">Today's events</Box>
    </div>
    <div class="mb-6 flex h-2/3">
      <Box className="m-2 w-1/2">Tracking habit</Box>
      <Box className="m-2 w-1/2">Quick notes</Box>
    </div>
  </div>
  <div class="ml-4 w-1/3 py-4">Activities</div>
</div>
