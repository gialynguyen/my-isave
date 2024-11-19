<script lang="ts" module>
  export type Props = {
    open: boolean;
    onClose: () => void;
  };
</script>

<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { Calendar } from '$lib/components/ui/calendar';
  import * as Form from '$lib/components/ui/form';
  import * as Popover from '$lib/components/ui/popover';
  import { DateFormatter, getLocalTimeZone, now, type DateValue } from '@internationalized/date';
  import { Textarea } from '$lib/components/ui/textarea';
  import { superForm } from 'sveltekit-superforms';
  import { typebox } from 'sveltekit-superforms/adapters';
  import { type CreateTaskPayload, createTaskPayloadDto } from '../dtos/create-task';
  import { getClient } from '$lib/rpc/planner';
  import { createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { TaskQueryKeys } from '../constants';

  let { open, onClose }: Props = $props();

  const queryClient = useQueryClient();

  const createTask = createMutation({
    mutationFn: (payload: CreateTaskPayload) => {
      return getClient(fetch).tasks.$post({
        json: payload
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: TaskQueryKeys
      });
    }
  });

  let dueDateDisplayFormatter = new DateFormatter('en-US', {
    month: 'short',
    day: 'numeric'
  });

  let dueDateState = $state<{
    openCalendar: boolean;
    dueDate?: DateValue;
  }>({
    openCalendar: false,
    // Bind to popover when bits-ui supports svelte 5
    dueDate: undefined
  });

  const form = superForm<CreateTaskPayload>(
    {
      title: '',
      description: '',
      dueDate: undefined
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

  const { form: formData, enhance } = form;

  function onOpenChange(open: boolean) {
    if (!open) {
      onClose();
    }
  }

  createTask.subscribe((mutation) => {
    if (mutation.isSuccess) {
      onClose();
    }
  });
</script>

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content class="sm:max-w-[760px]">
    <Dialog.Header>
      <Dialog.Title>Create a new task</Dialog.Title>
    </Dialog.Header>
    <div class="mt py-2">
      <form method="post" use:enhance>
        <Form.Field {form} name="title">
          <Form.Control let:attrs>
            <Input
              {...attrs}
              class="border-none text-base font-medium"
              placeholder="Task title"
              bind:value={$formData.title}
            />
            <Form.FieldErrors />
          </Form.Control>
        </Form.Field>

        <Form.Field {form} name="description">
          <Form.Control let:attrs>
            <Textarea
              {...attrs}
              class="resize-none border-none text-base font-medium"
              placeholder="Add description..."
              bind:value={$formData.description}
            />
            <Form.FieldErrors />
          </Form.Control>
        </Form.Field>
      </form>

      <Popover.Root>
        <Popover.Trigger asChild let:builder>
          <Button
            variant="secondary"
            class="h-8 w-fit px-4 py-0 text-[12px] font-light"
            builders={[builder]}
          >
            {dueDateState.dueDate
              ? dueDateDisplayFormatter.format(dueDateState.dueDate.toDate(getLocalTimeZone()))
              : 'Set due date...'}
          </Button>
        </Popover.Trigger>
        <Popover.Content class="mt-4 w-auto p-0">
          <Form.Field {form} name="dueDate">
            <Form.Control>
              <Calendar
                bind:value={dueDateState.dueDate}
                initialFocus
                isDateDisabled={(date) => {
                  return date.compare(now(getLocalTimeZone())) < 0;
                }}
                onValueChange={(date) => {
                  $formData.dueDate = date?.toDate(getLocalTimeZone()).toISOString();
                  dueDateState.openCalendar = false;
                }}
              />
              <Form.FieldErrors />
            </Form.Control>
          </Form.Field>
        </Popover.Content>
      </Popover.Root>
    </div>
    <Dialog.Footer>
      <Button class="h-8 px-8 py-0" type="submit" disabled={$createTask.isPending}>Create</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
