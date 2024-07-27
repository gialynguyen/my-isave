<script lang="ts">
  import { Button } from '$lib/components/ui/button';

  import { Box } from '$lib/components/ui/box';
  import { Badge } from '$lib/components/ui/badge';
  import CreateTaskPopup from 'features/tasks/components/create-task-popup.svelte';
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import { getClient, jsonFetchWrapper } from '$lib/rpc/planner';
  import { getLocalTimeZone } from '@internationalized/date';
  import { TaskQueryKeys, TaskQueryKeysMap } from 'features/tasks/constants';
  import { PlayButton } from '$lib/components/play-button';
  import { CircleCheck, EllipsisVertical } from 'lucide-svelte';
  import { groupBy } from 'rambda';

  let { open } = $state({
    open: false
  });

  function openCreateTaskPopup() {
    open = true;
  }

  function closeCreateTaskPopup() {
    open = false;
  }

  const queryClient = useQueryClient();

  let tasksToday = createQuery({
    queryKey: [TaskQueryKeysMap['TASKS_TODAY']],
    queryFn: () => {
      return jsonFetchWrapper((client) =>
        client.tasks.$get({
          query: {
            timezone: getLocalTimeZone(),
            dueDate: 'today'
          }
        })
      );
    }
  });

  let makeTaskDone = createMutation({
    mutationFn: (taskId: string) => {
      return getClient(fetch).tasks[':id'].$put({
        json: {
          isCompleted: true
        },
        param: {
          id: taskId
        }
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: TaskQueryKeys
      });
    }
  });

  let groupTaskByCompletedStatus = $derived.by(() => {
    if (!$tasksToday.data) return { completed: [], pending: [] };
    return groupBy((task) => {
      if (task.isCompleted === true) return 'completed';
      return 'pending';
    }, $tasksToday.data);
  });
</script>

<Box className="m-2 w-1/2 overflow-hidden flex flex-col">
  {#snippet title()}
    <div>
      <span class="text-sm font-semibold">Today's tasks</span>
      <Badge variant="secondary" class="mx-1">
        {#if $tasksToday.data}
          {$tasksToday.data.length > 9 ? '9+' : $tasksToday.data.length}
        {:else}
          0
        {/if}
      </Badge>
    </div>
  {/snippet}
  {#snippet body()}
    <div class="mt-3 flex-1 overflow-scroll scroll-smooth">
      <div>
        {#each groupTaskByCompletedStatus['pending'] as task}
          <div
            class="flex items-center rounded-xl bg-secondary p-2.5 text-sm [&:nth-child(n+1)]:mt-2"
          >
            <PlayButton />
            <div class="ml-2.5">
              <span>{task.title}</span>
            </div>
            <div class="ml-auto">
              <Button
                variant="ghost"
                class="m-0 p-0"
                title="Make done"
                onclick={() => $makeTaskDone.mutate(task.id)}
              >
                <CircleCheck />
              </Button>
              <Button variant="ghost" class="m-0 p-0" title="More">
                <EllipsisVertical />
              </Button>
            </div>
          </div>
        {/each}
      </div>
      <div class="mt-4">
        {#each groupTaskByCompletedStatus['completed'] as task}
          <div
            class="mx-4 flex items-center rounded-xl bg-secondary p-2.5 text-sm italic line-through opacity-60 [&:nth-child(n+1)]:mt-2"
          >
            <div class="ml-2.5">
              <span>{task.title}</span>
            </div>
            <div class="ml-auto flex">
              <CircleCheck color="green" />
            </div>
          </div>
        {/each}
      </div>

      <Button variant="secondary" on:click={openCreateTaskPopup}>Add a task</Button>
    </div>
  {/snippet}
</Box>

{#if open}
  <CreateTaskPopup {open} onClose={closeCreateTaskPopup} />
{/if}
