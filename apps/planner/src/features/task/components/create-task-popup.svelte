<script lang="ts" module>
  export type Props = {
    open: boolean;
    onClose?: () => void;
    parentTaskId?: string;
  };
</script>

<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { getClient } from '$lib/rpc/planner';
  import { DateFormatter } from '@internationalized/date';
  import { createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { superForm } from 'sveltekit-superforms';
  import { typebox } from 'sveltekit-superforms/adapters';
  import { TaskQueryKeys } from '../constants';
  import { type CreateTaskPayload, createTaskPayloadDto } from '../dtos/create-task';
  import SubTaskManager, { type SubTaskForm } from './sub-task-manager.svelte';
  import TaskManager from './task-manager.svelte';

  let { open = $bindable(false), onClose, parentTaskId = $bindable(undefined) }: Props = $props();

  const queryClient = useQueryClient();
  const createTask = createMutation({
    mutationFn: async (payload: CreateTaskPayload) => {
      // Prepare payload with subtasks if any
      const taskPayload = { ...payload };

      // If we have sub-tasks and this is a parent task (not already a sub-task),
      // include them in the single request
      if (subTasks.length > 0 && !payload.parentTaskId) {
        taskPayload.subTasks = subTasks.map((subTask) => ({
          title: subTask.title,
          description: subTask.description,
          dueDate: subTask.dueDate
        }));
      }

      // Create the task with all subtasks in a single request
      const createdTask = await getClient(fetch).tasks.$post({
        json: taskPayload
      });

      return createdTask;
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: TaskQueryKeys
      });

      onOpenChange(false); // Close the dialog after successful creation
      // Reset form, sub-tasks, and parent task ID when dialog closes
      reset();
      subTasks = [];
      parentTaskId = undefined;
    }
  });

  let dueDateDisplayFormatter = new DateFormatter('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // State for managing sub-tasks
  let subTasks = $state<SubTaskForm[]>([]);

  // Functions for handling subtasks
  function handleAddSubTask(subTask: SubTaskForm) {
    subTasks = [...subTasks, subTask];
  }

  function handleUpdateSubTask(index: number, updatedSubTask: SubTaskForm) {
    subTasks = subTasks.map((task, i) => (i === index ? updatedSubTask : task));
  }

  function handleRemoveSubTask(index: number) {
    subTasks = subTasks.filter((_, i) => i !== index);
  }

  const form = superForm<CreateTaskPayload>(
    {
      title: '',
      description: '',
      dueDate: undefined,
      parentTaskId
    },
    {
      SPA: true,
      validators: typebox(createTaskPayloadDto),
      onUpdate({ form }) {
        if (form.valid) {
          $createTask.mutate(form.data);
        }
      }
    }
  );

  const { form: formData, enhance, reset } = form;

  $effect(() => {
    if (parentTaskId !== undefined) {
      $formData.parentTaskId = parentTaskId;
    }
  });

  function onOpenChange(nextOpen: boolean) {
    open = nextOpen;
    if (!nextOpen) {
      onClose?.();
    }
  }
</script>

<Dialog.Root bind:open {onOpenChange}>
  <Dialog.Content class="sm:max-w-[760px]">
    <Dialog.Header>
      <Dialog.Title>Create a new task</Dialog.Title>
    </Dialog.Header>
    <TaskManager {form}>
      {#snippet subTask()}
        <SubTaskManager
          bind:subTasks
          onAddSubTask={handleAddSubTask}
          onUpdateSubTask={handleUpdateSubTask}
          onRemoveSubTask={handleRemoveSubTask}
        />
      {/snippet}
      {#snippet buttons()}
        <Dialog.Footer>
          <Button class="mt-2 h-8 px-8 py-0" type="submit" disabled={$createTask.isPending}>
            {#if parentTaskId}
              Create Sub-task
            {:else if subTasks.length > 0}
              Create Task with {subTasks.length} Sub-task{subTasks.length > 1 ? 's' : ''}
            {:else}
              Create Task
            {/if}
          </Button>
        </Dialog.Footer>
      {/snippet}
    </TaskManager>
  </Dialog.Content>
</Dialog.Root>
