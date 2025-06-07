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
  import { formatTimeAgo } from '$lib/utils/date';
  import { getLocalTimeZone } from '@internationalized/date';
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import { TaskQueryKeys, TaskQueryKeysMap } from 'features/task/constants';
  import { AlertTriangle, CircleCheck, Clock, EllipsisVertical } from 'lucide-svelte';
  import { groupBy } from 'rambda';

  const queryClient = useQueryClient();

  let allTasks = createQuery({
    queryKey: [TaskQueryKeysMap.TASKS],
    queryFn: () => {
      return jsonFetchWrapper((client) =>
        client.tasks.$get({
          query: {
            timezone: getLocalTimeZone(),
            parentTask: 'null' // Only fetch root tasks
          }
        })
      );
    }
  });

  let makeTaskDone = createMutation({
    mutationFn: (taskId: string) => {
      return getClient(fetch).tasks[':id'].$patch({
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

  function isToday(dateString?: string): boolean {
    if (!dateString) return false;
    const taskDate = new Date(dateString);
    const todayDate = new Date();
    return (
      taskDate.getDate() === todayDate.getDate() &&
      taskDate.getMonth() === todayDate.getMonth() &&
      taskDate.getFullYear() === todayDate.getFullYear()
    );
  }

  function isOverdue(dateString?: string): boolean {
    if (!dateString) return false;
    const taskDate = new Date(dateString);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0); // Reset time to start of day
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < todayDate;
  }

  let groupedTasks = $derived.by(() => {
    if (!$allTasks.data) return { overdue: [], today: [], ongoing: [] };

    // Filter out completed tasks and then group the remaining ones
    const incompleteTasks = $allTasks.data.filter((task) => !task.isCompleted);

    return groupBy((task: (typeof incompleteTasks)[number]) => {
      if (isOverdue(task.dueDate)) return 'overdue';
      if (isToday(task.dueDate)) return 'today';
      return 'ongoing';
    })(incompleteTasks);
  });

  function navigateToTaskDetailPage(task: any) {
    const taskNameSlug = task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const taskDetailPath = route('/tasks/[shortId]/[name]', {
      shortId: task.shortId,
      name: taskNameSlug
    });
    goto(taskDetailPath);
  }

  function getTotalIncompleteTasks() {
    if (!$allTasks.data) return 0;
    return $allTasks.data.filter((task) => !task.isCompleted).length;
  }
</script>

<Box className="flex flex-col overflow-hidden">
  {#snippet title()}
    <div class="flex items-center justify-between pb-2">
      <h3 class="text-lg font-semibold tracking-tight">My Tasks</h3>
      <Badge variant="secondary">
        {getTotalIncompleteTasks() > 9 ? '9+' : getTotalIncompleteTasks()}
      </Badge>
    </div>
    <Separator class="mb-4" />
  {/snippet}
  {#snippet body()}
    <ScrollArea class="flex-1">
      <div class="space-y-6 pr-4 pl-2">
        <!-- Overdue Tasks -->
        {#if groupedTasks.overdue?.length}
          <div class="flex flex-col space-y-2">
            <div class="flex items-center gap-2">
              <AlertTriangle class="h-4 w-4 text-red-500" />
              <h4 class="text-sm font-medium text-red-600">
                Overdue ({groupedTasks.overdue.length})
              </h4>
            </div>
            {#each groupedTasks.overdue ?? [] as task}
              <button class="w-full cursor-pointer" onclick={() => navigateToTaskDetailPage(task)}>
                <div
                  class="bg-card hover:bg-muted/50 flex items-center justify-between rounded-lg border-t border-r border-b border-l-4 border-l-red-500 p-3 text-sm shadow-sm transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <PlayButton />
                    <div class="flex flex-col items-start">
                      <span class="font-medium">{task.title}</span>
                      {#if task.dueDate}
                        <span class="text-xs text-red-500">
                          ({formatTimeAgo(new Date(task.dueDate))})
                        </span>
                      {/if}
                    </div>
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
                    <Button variant="ghost" size="icon" class="h-8 w-8" title="More">
                      <EllipsisVertical class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        {/if}

        <!-- Today's Tasks -->
        {#if groupedTasks.today?.length}
          <div class="flex flex-col space-y-2">
            <div class="flex items-center gap-2">
              <Clock class="h-4 w-4 text-orange-500" />
              <h4 class="text-sm font-medium text-orange-600">
                Today ({groupedTasks.today.length})
              </h4>
            </div>
            {#each groupedTasks.today ?? [] as task}
              <button class="w-full cursor-pointer" onclick={() => navigateToTaskDetailPage(task)}>
                <div
                  class="bg-card hover:bg-muted/50 flex items-center justify-between rounded-lg border-t border-r border-b border-l-4 border-l-orange-500 p-3 text-sm shadow-sm transition-colors"
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

        <!-- On-going Tasks -->
        {#if groupedTasks.ongoing?.length}
          <div class="flex flex-col space-y-2">
            <h4 class="text-muted-foreground text-sm font-medium">
              On-going ({groupedTasks.ongoing.length})
            </h4>
            {#each groupedTasks.ongoing ?? [] as task}
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

        {#if !groupedTasks.overdue?.length && !groupedTasks.today?.length && !groupedTasks.ongoing?.length}
          <div class="flex h-[200px] items-center justify-center">
            <p class="text-muted-foreground text-sm">No incomplete tasks found</p>
          </div>
        {/if}
      </div>
    </ScrollArea>
  {/snippet}
</Box>
