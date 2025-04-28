<script lang="ts" module>
  import { page } from '$app/state';

  export const getPageTitle = () => page.data.task.title;
</script>

<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import { Textarea } from '$lib/components/ui/textarea';
  import { getClient, jsonFetchWrapper } from '$lib/rpc/planner';
  import { formatTimeAgo } from '$lib/utils/date';
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import { TaskQueryKeys } from 'features/task/constants';
  import { Plus } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const shortId = page.params.shortId;
  const queryClient = useQueryClient();

  // Fetch task details
  const taskQuery = createQuery({
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

  let task = $derived($taskQuery.data);

  // Toggle task completion status
  const toggleTaskCompletion = createMutation({
    mutationFn: (params: { id: string; isCompleted: boolean }) => {
      return getClient(fetch).tasks[':id'].$put({
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

  // Delete task
  const deleteTaskMutation = createMutation({
    mutationFn: () => {
      if (!$taskQuery.data) {
        throw new Error('Task data is not available');
      }

      return getClient(fetch).tasks[':id'].$delete({
        param: {
          id: $taskQuery.data?.id
        }
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: TaskQueryKeys
      });
      goto('/dashboard');
    }
  });

  // Edit task (dispatches event for modal or other UI)
  function editTask() {
    if ($taskQuery.data) {
      window.dispatchEvent(
        new CustomEvent('edit-task', {
          detail: { task: $taskQuery.data }
        })
      );
    }
  }

  // Placeholder function for adding sub-issues
  function addSubIssue() {
    console.log('Add sub-issue clicked for task:', $taskQuery.data?.id);
    // TODO: Implement actual logic, maybe dispatch event or navigate
  }
</script>

{#if task}
  <div class="text-primary-foreground container mx-auto px-4 py-8 md:px-6">
    {#if $taskQuery.isLoading}
      <p class="text-muted-foreground text-center">Loading task details...</p>
    {:else if $taskQuery.error}
      <div
        class="border-destructive bg-destructive/10 flex h-[200px] items-center justify-center rounded-md border p-4"
      >
        <p class="text-destructive text-center">
          Error loading task: {$taskQuery.error.message || 'Unknown error'}
        </p>
      </div>
    {:else if $taskQuery.data}
      <!-- Main Content Area -->
      <div class="mx-auto max-w-3xl">
        <!-- Title -->
        <h1 class="mb-4 text-3xl font-bold">{$taskQuery.data.title}</h1>
        <div class="text-muted-foreground mb-2 text-sm">
          <span class="bg-muted rounded px-1 py-0.5 font-mono">{$taskQuery.data.shortId}</span>
        </div>

        <!-- Description -->
        <div class="mb-6">
          {#if $taskQuery.data.description}
            <p class="text-muted-foreground whitespace-pre-line">
              {$taskQuery.data.description}
            </p>
          {:else}
            <button class="text-muted-foreground hover:text-foreground text-sm" onclick={editTask}>
              Add description...
            </button>
          {/if}
        </div>

        <!-- Sub-issues Button -->
        <div class="mb-8">
          <Button
            variant="ghost"
            size="sm"
            class="text-muted-foreground -ml-2 px-2 py-1"
            onclick={addSubIssue}
          >
            <Plus class="mr-1 h-4 w-4" />
            Add sub-issues
          </Button>
          <!-- Placeholder for potential future sub-issue list -->
        </div>

        <hr class="border-border/50 my-8" />

        <!-- Activity Section -->
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Activity</h2>
            <!-- <Button variant="outline" size="sm" class="text-xs">
               Unsubscribe -->
            <!-- TODO: Add notification icon? -->
            <!-- </Button> -->
          </div>

          <!-- Comment Input -->
          <div>
            <!-- TODO: Add user avatar? -->
            <Textarea
              placeholder="Leave a comment..."
              class="bg-background/50 text-foreground border-border/50 focus:border-primary resize-none"
            />
            <div class="mt-2 flex justify-end">
              <Button size="sm">Comment</Button>
              <!-- TODO: Add submit functionality -->
            </div>
          </div>

          <!-- Placeholder for Activity Feed -->
          <div class="text-muted-foreground border-border/50 border-t pt-4 text-sm">
            <!-- Example activity item -->
            <div class="flex items-center gap-2">
              <!-- TODO: User avatar -->
              <span class="text-foreground font-medium">gialynguyen</span>
              <span>created the issue</span>
              <span class="text-xs">• {formatTimeAgo(new Date(task.createdAt))}</span>
            </div>
            <!-- More activity items would go here -->
          </div>
        </div>
      </div>
    {:else}
      <p class="text-muted-foreground text-center">Task not found.</p>
    {/if}
  </div>
{:else}
  <!-- Not found page  -->
  <div>Not found</div>
{/if}
