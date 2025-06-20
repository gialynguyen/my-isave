<script lang="ts" module>
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Calendar } from '$lib/components/ui/calendar';
  import { Input } from '$lib/components/ui/input';
  import * as Popover from '$lib/components/ui/popover';
  import { Textarea } from '$lib/components/ui/textarea';
  import { cn } from '$lib/utils';
  import { DateFormatter, getLocalTimeZone, now } from '@internationalized/date';
  import { Pencil, X } from 'lucide-svelte';
  import type { Readable } from 'svelte/store';
  import { derived, get, writable } from 'svelte/store';

  export type SubTask = {
    id?: string;
    title: string;
    description?: string;
    dueDate?: string;
  };

  export type Props = {
    subTasks: Readable<SubTask[]>;
    onAddSubTask: (subTask: SubTask) => void;
    onUpdateSubTask: (index: number, subTask: SubTask) => void;
    onRemoveSubTask: (index: number) => void;
    class?: string;
  };

  export function useSubTaskManager(initTasks?: SubTask[]) {
    const subTasks = writable<SubTask[]>(initTasks || []);
    const eventListeners = new Map<'added' | 'updated' | 'removed', Array<(task: SubTask) => void>>(
      new Map([
        ['added', []],
        ['updated', []],
        ['removed', []]
      ])
    );

    const readonlySubTasks = derived(subTasks, ($subTasks) => $subTasks);

    function addSubTask(subTask: SubTask) {
      subTasks.update((tasks) => [...tasks, subTask]);
      dispatch('added', subTask);
    }

    function updateSubTask(index: number, subTask: SubTask) {
      subTasks.update((tasks) => tasks.map((task, i) => (i === index ? subTask : task)));
      dispatch('updated', subTask);
    }

    function removeSubTask(index: number) {
      const removedTask = get(subTasks)[index];
      subTasks.update((tasks) => tasks.filter((_, i) => i !== index));
      dispatch('removed', removedTask);
    }

    function clearSubTasks() {
      subTasks.set([]);
    }

    function on(event: 'added' | 'updated' | 'removed', callback: (task: SubTask) => void) {
      const listeners = eventListeners.get(event);
      if (listeners) {
        listeners.push(callback);
      }
    }

    function dispatch(event: 'added' | 'updated' | 'removed', task: SubTask) {
      const listeners = eventListeners.get(event);
      if (listeners) {
        listeners.forEach((callback) => callback(task));
      }
    }

    return {
      subTasks: readonlySubTasks,
      addSubTask,
      updateSubTask,
      removeSubTask,
      clearSubTasks,
      onSubtaskEvent: on
    };
  }
</script>

<script lang="ts">
  let {
    subTasks,
    onAddSubTask,
    onUpdateSubTask,
    onRemoveSubTask,
    class: className
  }: Props = $props();

  // UI state for the component
  let viewMode = $state('view'); // 'view' | 'create' | 'edit'
  let newTitle = $state('');
  let newDescription = $state('');
  let newDueDate = $state<string | undefined>(undefined);
  let editingIndex = $state<number | null>(null);

  // Helper functions to check the mode
  function isCreateMode() {
    return viewMode === 'create';
  }
  function isEditMode() {
    return viewMode === 'edit';
  }

  let dueDateDisplayFormatter = new DateFormatter('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Function to handle keydown events for subtask fields
  function handleKeyDown(event: KeyboardEvent): void {
    // Check if we're in a subtask field and Enter is pressed
    if (
      event.key === 'Enter' &&
      event.target instanceof Element &&
      (event.target.id === 'subtask-title' ||
        (event.target.id === 'subtask-description' && event.ctrlKey))
    ) {
      event.preventDefault(); // Prevent form submission

      if (isCreateMode() && newTitle.trim()) {
        createSubTask();
      } else if (isEditMode() && newTitle.trim()) {
        saveSubTaskEdit();
      }
    }
  }

  function resetForm() {
    newTitle = '';
    newDescription = '';
    newDueDate = undefined;
    editingIndex = null;
    viewMode = 'view';
  }

  function createSubTask() {
    if (newTitle.trim()) {
      onAddSubTask({
        title: newTitle,
        description: newDescription,
        dueDate: newDueDate
      });
      resetForm();
    }
  }

  function startEditSubTask(index: number) {
    const subTask = get(subTasks)[index];
    newTitle = subTask.title;
    newDescription = subTask.description || '';
    newDueDate = subTask.dueDate;
    editingIndex = index;
    viewMode = 'edit';
  }

  function saveSubTaskEdit() {
    if (editingIndex !== null && newTitle.trim()) {
      onUpdateSubTask(editingIndex, {
        title: newTitle,
        description: newDescription,
        dueDate: newDueDate
      });
      resetForm();
    }
  }
</script>

<div class={cn('mt-2 space-y-3 rounded-lg border px-4 pt-3 pb-2', className)}>
  <h4 class="mb-3 text-sm font-medium">
    {#if isCreateMode()}
      Create Sub-task
    {:else if isEditMode()}
      Edit Sub-task
    {:else}
      Sub-tasks
      {#if $subTasks.length > 0}
        <Badge variant="secondary" class="ml-1">{$subTasks.length}</Badge>
      {/if}
    {/if}
  </h4>

  {#if isCreateMode() || isEditMode()}
    <div class="space-y-3">
      <div>
        <Input
          class="border-none text-base font-medium"
          placeholder="Sub-task title"
          bind:value={newTitle}
          id="subtask-title"
          onkeydown={handleKeyDown}
        />
      </div>

      <div>
        <Textarea
          class="resize-none border-none text-base font-medium"
          placeholder="Sub-task description..."
          bind:value={newDescription}
          id="subtask-description"
          onkeydown={handleKeyDown}
        />
      </div>

      <div>
        <Popover.Root>
          <Popover.Trigger>
            <Button class="h-8 w-fit px-4 py-4 text-[12px] font-light" variant="secondary">
              {newDueDate
                ? dueDateDisplayFormatter.format(new Date(newDueDate))
                : 'Set due date...'}
            </Button>
          </Popover.Trigger>
          <Popover.Content class="mt-4 w-auto p-0">
            <Calendar
              type="single"
              initialFocus
              isDateDisabled={(date) => {
                return date.compare(now(getLocalTimeZone())) < 0;
              }}
              onValueChange={(date) => {
                newDueDate = date?.toDate(getLocalTimeZone()).toISOString();
              }}
            />
          </Popover.Content>
        </Popover.Root>
      </div>
    </div>
  {:else}
    <!-- Sub-tasks list -->
    {#if $subTasks.length > 0}
      <div class="border-muted space-y-2 border-l-2 pl-4">
        {#each $subTasks as subTask, index}
          <div class="bg-muted/30 flex flex-col rounded-md p-2">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">{subTask.title}</span>
              <div class="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="hover:bg-primary-hover h-7 w-7"
                  onclick={() => startEditSubTask(index)}
                >
                  <Pencil />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="hover:bg-destructive-hover h-7 w-7"
                  onclick={() => onRemoveSubTask(index)}
                >
                  <X />
                </Button>
              </div>
            </div>

            {#if subTask.description}
              <p class="text-muted-foreground mt-1 text-xs">{subTask.description}</p>
            {/if}

            {#if subTask.dueDate}
              <div class="mt-2">
                <span class="bg-secondary text-secondary-foreground rounded-sm px-2 py-1 text-xs">
                  Due: {dueDateDisplayFormatter.format(new Date(subTask.dueDate))}
                </span>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  {/if}

  {#if isCreateMode()}
    <div class="flex justify-end">
      <Button
        variant="ghost"
        class="hover:text-secondary-foreground hover:bg-background h-6 px-2 text-xs"
        onclick={() => resetForm()}
      >
        Cancel
      </Button>
      <Button
        variant="default"
        class="h-6 px-2 text-xs"
        onclick={() => createSubTask()}
        disabled={!newTitle.trim()}
      >
        Create
      </Button>
    </div>
  {:else if isEditMode()}
    <div class="flex justify-end">
      <Button
        variant="ghost"
        class="hover:text-secondary-foreground hover:bg-background h-6 px-2 text-xs"
        onclick={() => resetForm()}
      >
        Cancel
      </Button>
      <Button
        variant="default"
        class="h-6 px-2 text-xs"
        onclick={() => saveSubTaskEdit()}
        disabled={!newTitle.trim()}
      >
        Update
      </Button>
    </div>
  {:else}
    <Button
      variant="ghost"
      class="hover:text-secondary-foreground hover:bg-background ml-auto block h-6 px-2 text-xs"
      onclick={() => (viewMode = 'create')}
    >
      + Add sub-task
    </Button>
  {/if}
</div>
