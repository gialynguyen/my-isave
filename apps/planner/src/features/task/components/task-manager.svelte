<script lang="ts" module>
  import { CopyButton } from '$lib/components/copy-button';
  import { Button } from '$lib/components/ui/button';
  import { Calendar } from '$lib/components/ui/calendar';

  import * as Form from '$lib/components/ui/form';
  import { Input } from '$lib/components/ui/input';
  import * as Popover from '$lib/components/ui/popover';
  import { Textarea } from '$lib/components/ui/textarea';
  import { DateFormatter, getLocalTimeZone, now } from '@internationalized/date';
  import type { Snippet } from 'svelte';
  import type { SuperForm } from 'sveltekit-superforms';

  export type TaskManagerFormData = {
    title: string;
    description?: string | undefined;
    dueDate?: string;
    shortId?: string;
  };

  export interface Props {
    form: SuperForm<TaskManagerFormData>;
    taskURL?: string;
    subTask?: Snippet;
    buttons?: Snippet;
  }
</script>

<script lang="ts">
  const { form, subTask, buttons, taskURL }: Props = $props();
  const { form: formData, enhance } = form;

  let dueDateDisplayFormatter = new DateFormatter('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
</script>

<form method="post" use:enhance>
  <div class="mt-2 py-2">
    <Form.Field {form} name="title">
      <Form.Control>
        {#snippet children({ props })}
          <Input
            {...props}
            class="border-none text-2xl font-bold md:text-2xl"
            placeholder="Task title"
            bind:value={$formData.title}
          />
          <Form.FieldErrors class="mb-3" />
        {/snippet}
      </Form.Control>
    </Form.Field>

    {#if $formData.shortId}
      <div class="text-muted-foreground mb-2 ml-3 flex items-center text-sm">
        <span class="bg-muted rounded px-1 py-0.5 font-mono">{$formData.shortId}</span>
        {#if taskURL}
          <CopyButton class="ml-0.5" value={taskURL} />
        {/if}
      </div>
    {/if}

    <Form.Field {form} name="description" class="mt-4">
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

    <Form.Field {form} name="dueDate" class="ml-3 inline-flex">
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

    {@render subTask?.()}
  </div>
  {@render buttons?.()}
</form>
