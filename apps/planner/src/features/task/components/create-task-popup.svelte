<script lang="ts" module>
  export type Props = {
    open: boolean;
    onClose?: () => void;
    parentTaskId?: string;
  };
</script>

<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { Calendar } from '$lib/components/ui/calendar';
  import * as Form from '$lib/components/ui/form';
  import * as Popover from '$lib/components/ui/popover';
  import { DateFormatter, getLocalTimeZone, now } from '@internationalized/date';
  import { Textarea } from '$lib/components/ui/textarea';
  import { superForm } from 'sveltekit-superforms';
  import { typebox } from 'sveltekit-superforms/adapters';
  import { type CreateTaskPayload, createTaskPayloadDto } from '../dtos/create-task';
  import { getClient } from '$lib/rpc/planner';
  import { createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { TaskQueryKeys } from '../constants';
  import SubTaskManager, { type SubTaskForm } from './sub-task-manager.svelte';

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
    <form method="post" use:enhance>
      <Dialog.Header>
        <Dialog.Title>Create a new task</Dialog.Title>
      </Dialog.Header>
      <div class="mt-2 py-2">
        <Form.Field {form} name="title">
          <Form.Control>
            {#snippet children({ props })}
              <Input
                {...props}
                class="border-none text-base font-medium"
                placeholder="Task title"
                bind:value={$formData.title}
              />
              <Form.FieldErrors />
            {/snippet}
          </Form.Control>
        </Form.Field>

        <Form.Field {form} name="description">
          <Form.Control>
            {#snippet children({ props })}
              <Textarea
                {...props}
                class="resize-none border-none text-base font-medium"
                placeholder="Add description..."
                bind:value={$formData.description}
              />
              <Form.FieldErrors />
            {/snippet}
          </Form.Control>
        </Form.Field>

        <Form.Field {form} name="dueDate" class="inline-flex">
          <Form.Control>
            <Popover.Root>
              <Popover.Trigger>
                {#snippet child({ props })}
                  <Button
                    {...props}
                    class="my-2 h-8 w-fit px-4 py-4 text-[12px] font-light"
                    variant="secondary"
                  >
                    {$formData.dueDate
                      ? dueDateDisplayFormatter.format(new Date($formData.dueDate))
                      : 'Set due date...'}
                  </Button>
                {/snippet}
              </Popover.Trigger>
              <Popover.Content class="mt-4 w-auto p-0">
                {#snippet children()}
                  <Calendar
                    type="single"
                    initialFocus
                    isDateDisabled={(date) => {
                      return date.compare(now(getLocalTimeZone())) < 0;
                    }}
                    onValueChange={(date) => {
                      $formData.dueDate = date?.toDate(getLocalTimeZone()).toISOString();
                    }}
                  />
                  <Form.FieldErrors />
                {/snippet}
              </Popover.Content>
            </Popover.Root>
          </Form.Control>
        </Form.Field>

        {#if !parentTaskId}
          <!-- Sub-tasks section (only show when creating a parent task) -->
          <SubTaskManager
            bind:subTasks
            onAddSubTask={handleAddSubTask}
            onUpdateSubTask={handleUpdateSubTask}
            onRemoveSubTask={handleRemoveSubTask}
          />
        {/if}
      </div>
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
    </form>
  </Dialog.Content>
</Dialog.Root>
