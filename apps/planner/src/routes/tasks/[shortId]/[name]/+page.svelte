<script lang="ts" module>
  import { page } from '$app/state';

  export const getPageTitle = () => page.data.task.title;
</script>

<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Textarea } from '$lib/components/ui/textarea';
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import { getClient, jsonFetchWrapper } from '$lib/rpc/planner';
  import { TaskQueryKeys } from 'features/task/constants';
  import { Plus } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  let { data }: { data: any } = $props();

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

<div class="container mx-auto py-8 px-4 md:px-6 text-primary-foreground">
  {#if $taskQuery.isLoading}
    <p class="text-center text-muted-foreground">Loading task details...</p>
  {:else if $taskQuery.error}
    <div class="flex h-[200px] items-center justify-center rounded-md border border-destructive bg-destructive/10 p-4">
      <p class="text-center text-destructive">
        Error loading task: {$taskQuery.error.message || 'Unknown error'}
      </p>
    </div>
  {:else if $taskQuery.data}
    <!-- Main Content Area -->
    <div class="max-w-3xl mx-auto">
      <!-- Title -->
      <h1 class="mb-4 text-3xl font-bold">{$taskQuery.data.title}</h1>
      <div class="mb-2 text-sm text-muted-foreground">
        <span class="font-mono bg-muted px-1 py-0.5 rounded">{$taskQuery.data.shortId}</span>
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
        <Button variant="ghost" size="sm" class="text-muted-foreground -ml-2 px-2 py-1" onclick={addSubIssue}>
          <Plus class="mr-1 h-4 w-4" />
          Add sub-issues
        </Button>
        <!-- Placeholder for potential future sub-issue list -->
      </div>

      <hr class="my-8 border-border/50" />

      <!-- Activity Section -->
      <div class="space-y-6">
        <div class="flex justify-between items-center">
           <h2 class="text-xl font-semibold">Activity</h2>
           <!-- <Button variant="outline" size="sm" class="text-xs">
             Unsubscribe -->
             <!-- TODO: Add notification icon? -->
           <!-- </Button> -->
        </div>

        <!-- Comment Input -->
        <div>
          <!-- TODO: Add user avatar? -->
          <Textarea placeholder="Leave a comment..." class="bg-background/50 text-foreground border-border/50 focus:border-primary resize-none" />
          <div class="mt-2 flex justify-end">
            <Button size="sm">Comment</Button> <!-- TODO: Add submit functionality -->
          </div>
        </div>

        <!-- Placeholder for Activity Feed -->
        <div class="text-muted-foreground text-sm pt-4 border-t border-border/50">
          <!-- Example activity item -->
          <div class="flex items-center gap-2">
            <!-- TODO: User avatar -->
            <span class="font-medium text-foreground">gialynguyen</span>
            <span>created the issue</span>
            <span class="text-xs">• 1y ago</span>
          </div>
          <!-- More activity items would go here -->
        </div>
      </div>
    </div>
  {:else}
     <p class="text-center text-muted-foreground">Task not found.</p>
  {/if}
</div>