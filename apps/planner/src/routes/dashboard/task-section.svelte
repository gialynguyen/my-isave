<script lang="ts">
  import { goto } from '$app/navigation';
  import { PlayButton } from '$lib/components/play-button';
  import { Badge } from '$lib/components/ui/badge';
  import { Box } from '$lib/components/ui/box';
  import { Button } from '$lib/components/ui/button';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Separator } from '$lib/components/ui/separator';
  import { route } from '$lib/router/ROUTES';
  import { getClient, jsonFetchWrapper } from '$lib/rpc/planner';
  import { getLocalTimeZone } from '@internationalized/date';
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import { TaskQueryKeys, TaskQueryKeysMap } from 'features/task/constants';
  import { CircleCheck, EllipsisVertical } from 'lucide-svelte';
  import { groupBy } from 'rambda';

  const queryClient = useQueryClient();

  let tasksToday = createQuery({
    queryKey: [TaskQueryKeysMap['TASKS_TODAY']],
    queryFn: () => {
      return jsonFetchWrapper((client) =>
        client.tasks.$get({
          query: {
            timezone: getLocalTimeZone(),
            dueDate: 'today',
            parentTaskId: 'null' // Only fetch root tasks
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

  function navigateToTaskDetailPage(task: any) {
    const taskNameSlug = task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const taskDetailPath = route('/tasks/[shortId]/[name]', {
      shortId: task.shortId,
      name: taskNameSlug
    });
    goto(taskDetailPath);
  }
</script>

<Box className="flex flex-col overflow-hidden">
  {#snippet title()}
    <div class="flex items-center justify-between pb-2">
      <h3 class="text-lg font-semibold tracking-tight">Today's tasks</h3>
      <Badge variant="secondary">
        {#if $tasksToday.data}
          {$tasksToday.data.length > 9 ? '9+' : $tasksToday.data.length}
        {:else}
          0
        {/if}
      </Badge>
    </div>
    <Separator class="mb-4" />
  {/snippet}
  {#snippet body()}
    <ScrollArea class="flex-1">
      <div class="space-y-6 px-2">
        {#if groupTaskByCompletedStatus.pending?.length}
          <div class="flex flex-col space-y-2">
            {#each groupTaskByCompletedStatus.pending ?? [] as task}
              <button class="w-full cursor-pointer" onclick={() => navigateToTaskDetailPage(task)}>
                <div
                  class="bg-card hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 text-sm shadow-sm transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <PlayButton />
                    <span class="font-medium">{task.title}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8"
                      title="Make done"
                      onclick={(e) => {
                        e.stopPropagation();
                        $makeTaskDone.mutate(task.id);
                      }}
                    >
                      <CircleCheck class="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8"
                      title="Add sub-task"
                      onclick={(e) => {
                        e.stopPropagation();
                        console.log('Add sub-task clicked');
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg
                      >
                    </Button>
                    <Button variant="ghost" size="icon" class="h-8 w-8" title="More">
                      <EllipsisVertical class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        {/if}

        {#if groupTaskByCompletedStatus['completed']?.length}
          <div class="w-full space-y-2">
            <h4 class="text-muted-foreground text-sm font-medium">Completed</h4>
            {#each groupTaskByCompletedStatus['completed'] as task}
              <button
                class="w-full cursor-pointer space-y-2 px-2"
                onclick={() => navigateToTaskDetailPage(task)}
              >
                <div
                  class="bg-muted/50 flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div class="flex items-center gap-3">
                    <span class="text-muted-foreground line-through">{task.title}</span>
                  </div>
                  <CircleCheck class="h-4 w-4 text-green-500" />
                </div>
              </button>
            {/each}
          </div>
        {/if}

        {#if !groupTaskByCompletedStatus['pending']?.length && !groupTaskByCompletedStatus['completed']?.length}
          <div class="flex h-[200px] items-center justify-center">
            <p class="text-muted-foreground text-sm">No tasks for today</p>
          </div>
        {/if}
      </div>
    </ScrollArea>
  {/snippet}
</Box>
