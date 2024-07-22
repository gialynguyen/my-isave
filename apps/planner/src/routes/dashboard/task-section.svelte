<script>
  import { Button } from '$lib/components/ui/button';

  import { Box } from '$lib/components/ui/box';
  import { Badge } from '$lib/components/ui/badge';
  import CreateTaskPopup from 'features/tasks/components/create-task-popup.svelte';
  import { createQuery } from '@tanstack/svelte-query';
  import { jsonFetchWrapper } from '$lib/rpc/planner';
  import { getLocalTimeZone } from '@internationalized/date';

  let { open } = $state({
    open: false
  });

  function openCreateTaskPopup() {
    open = true;
  }

  function closeCreateTaskPopup() {
    open = false;
  }

  let tasksToday = createQuery({
    queryKey: ['tasks-today'],
    queryFn: () => {
      return jsonFetchWrapper((client) =>
        client.tasks.$get({
          query: {
            timezone: getLocalTimeZone(),
            dueDate: 'today',
            page: '1',
            limit: '10'
          }
        })
      );
    }
  });

  $inspect($tasksToday.data);
</script>

<Box className="m-2 w-1/2">
  {#snippet title()}
    <span class="text-sm font-semibold">Today's tasks</span>
    <Badge variant="secondary" class="mx-1">3</Badge>
  {/snippet}
  {#snippet body()}
    <Button variant="secondary" on:click={openCreateTaskPopup}>Add a task</Button>
  {/snippet}
</Box>

{#if open}
  <CreateTaskPopup {open} onClose={closeCreateTaskPopup} />
{/if}
