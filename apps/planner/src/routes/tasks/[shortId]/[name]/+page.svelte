<script lang="ts" module>
  import { page } from '$app/state';
  import type { TaskManagerFormData } from 'features/task/components/task-manager.svelte';

  export const getPageTitle = () => page.data.task.title;
</script>

<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Textarea } from '$lib/components/ui/textarea';
  import { getClient, jsonFetchWrapper } from '$lib/rpc/planner';
  import { formatTimeAgo } from '$lib/utils/date';
  import { debounce } from '@tanstack/pacer';
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import SubTaskManager, {
    useSubTaskManager
  } from 'features/task/components/sub-task-manager.svelte';
  import TaskManager from 'features/task/components/task-manager.svelte';
  import { TaskQueryKeys } from 'features/task/constants';
  import type { CreateSubTaskPayload } from 'features/task/dtos/create-task';
  import { updateTaskPayloadDto, type UpdateTaskPayloadDto } from 'features/task/dtos/update-task';
  import { superForm } from 'sveltekit-superforms';
  import { typebox } from 'sveltekit-superforms/adapters';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const shortId = page.params.shortId;
  const queryClient = useQueryClient();

  // Fetch task details
  const queryTask = createQuery({
    queryKey: ['task', shortId],
    queryFn: () => {
      return jsonFetchWrapper((client) =>
        client.tasks.byShortId[':shortId'].$get({
          param: {
            shortId
          }
        })
      );
    },
    initialData: data.task,
    enabled: !!shortId,
    refetchOnMount: false
  });

  const updateTask = createMutation({
    mutationFn: (params: { id: string; payload: UpdateTaskPayloadDto }) => {
      return getClient(fetch).tasks[':id'].$patch({
        json: params.payload,
        param: {
          id: params.id
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['task', shortId]
      });
    }
  });

  const createSubTask = createMutation({
    mutationFn: (params: { payload: CreateSubTaskPayload }) => {
      return getClient(fetch).tasks.$post({
        json: {
          ...params.payload
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['task', shortId]
      });
    }
  });

  const deleteTask = createMutation({
    mutationFn: (params: { id: string }) => {
      return getClient(fetch).tasks[':id'].$delete({
        param: {
          id: params.id
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['task', shortId]
      });
    }
  });

  let task = $queryTask.data!;

  let taskDetailForm = superForm<TaskManagerFormData>(task, {
    SPA: true,
    dataType: 'json',
    validators: typebox(updateTaskPayloadDto),
    onChange: debounce(
      (event) => {
        const { paths, get } = event;
        const path = paths[0];
        const value = get(path);

        if (path && value) {
          $updateTask.mutate({
            id: task.id,
            payload: {
              [path]: value
            }
          });
        }
      },
      {
        wait: 500
      }
    )
  });

  const { subTasks, addSubTask, updateSubTask, removeSubTask, onSubtaskEvent } = useSubTaskManager(
    task.subTasks
  );

  onSubtaskEvent('added', (subTask) => {
    $createSubTask.mutate({
      payload: {
        ...subTask,
        parentTask: task.id
      }
    });
  });

  onSubtaskEvent('updated', (task) => {
    if (task.id) {
      $updateTask.mutate({
        id: task.id,
        payload: {
          ...task
        }
      });
    }
  });

  onSubtaskEvent('removed', (task) => {
    if (task.id) {
      $deleteTask.mutate({
        id: task.id
      });
    }
  });

  // Toggle task completion status
  const toggleTaskCompletion = createMutation({
    mutationFn: (params: { id: string; isCompleted: boolean }) => {
      return getClient(fetch).tasks[':id'].$patch({
        json: {
          isCompleted: params.isCompleted
        },
        param: {
          id: params.id
        }
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: ['task', shortId]
      });
      queryClient.invalidateQueries({
        queryKey: TaskQueryKeys
      });
    }
  });
</script>

{#if task}
  <div class="text-primary-foreground container mx-auto px-4 py-8 md:px-6">
    {#if $queryTask.isLoading}
      <p class="text-muted-foreground text-center">Loading task details...</p>
    {:else if $queryTask.error}
      <div
        class="border-destructive bg-destructive/10 flex h-[200px] items-center justify-center rounded-md border p-4"
      >
        <p class="text-destructive text-center">
          Error loading task: {$queryTask.error.message || 'Unknown error'}
        </p>
      </div>
    {:else if $queryTask.data}
      <!-- Main Content Area -->
      <div class="mx-auto max-w-3xl">
        <TaskManager form={taskDetailForm} taskURL={page.url?.toString()}>
          {#snippet subTask()}
            <SubTaskManager
              {subTasks}
              onAddSubTask={addSubTask}
              onUpdateSubTask={updateSubTask}
              onRemoveSubTask={removeSubTask}
              class="mt-4 ml-3"
            />
          {/snippet}
        </TaskManager>

        <div class="mt-4 ml-3 space-y-6">
          <div class="flex items-center justify-end">
            <div class="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onclick={() => $deleteTask.mutate({ id: task.id })}>Delete</Button
              >
            </div>
          </div>

          <div>
            <Textarea
              placeholder="Leave a comment..."
              class="bg-background/50 text-foreground border-border/50 focus:border-primary resize-none"
            />
          </div>

          <div class="text-muted-foreground border-border/50 border-t pt-4 text-sm">
            <div class="flex items-center gap-2">
              <span class="text-foreground font-medium">
                <!-- TODO: Implement user display -->
                gialynguyen
              </span>
              <span>created the issue</span>
              <span class="text-xs">• {formatTimeAgo(new Date(task.createdAt))}</span>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <!-- Not found page  -->
  <div>Not found</div>
{/if}
