<script lang="ts" module>
  export type Props = {
    open?: boolean;
    onClose?: () => void;
  };
</script>

<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Form from '$lib/components/ui/form';
  import * as Select from '$lib/components/ui/select';
  import { Input } from '$lib/components/ui/input';
  import { superForm } from 'sveltekit-superforms';
  import { createReminderPayloadDto, type CreateReminderPayload } from '../dtos/create-reminder';
  import { typebox } from 'sveltekit-superforms/adapters';
  import { Textarea } from '$lib/components/ui/textarea';

  const form = superForm<CreateReminderPayload>(
    {
      title: '',
      description: '',
      repeatSettings: { repeatType: undefined }
    },
    {
      SPA: true,
      dataType: 'json',
      validators: typebox(createReminderPayloadDto)
    }
  );

  const { open, onClose }: Props = $props();

  const { form: formData, enhance } = form;

  function onOpenChange(open: boolean) {
    if (!open) {
      onClose?.();
    }
  }
</script>

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content class="sm:max-w-[760px]">
    <Dialog.Header>
      <Dialog.Title>Create a new reminder</Dialog.Title>
    </Dialog.Header>
    <div class="mt py-2">
      <form method="post" use:enhance>
        <Form.Field {form} name="title">
          <Form.Control>
            {#snippet children({ props })}
              <Input
                {...props}
                class="border-none text-base font-medium"
                placeholder="Reminder title"
                bind:value={$formData.title}
              />
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
            {/snippet}
          </Form.Control>
        </Form.Field>
        <Form.Field {form} name="repeatSettings.repeatType">
          <Form.Control>
            {#snippet children({ props })}
              {#if $formData.repeatSettings != null}
                <Form.Label>Repeat Settings</Form.Label>
                <Select.Root
                  type="single"
                  bind:value={$formData.repeatSettings.repeatType}
                  name={props.name}
                >
                  <Select.Trigger {...props} class="w-[180px] capitalize">
                    {$formData.repeatSettings.repeatType || 'Repeat'}
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="daily" label="Daily" />
                    <Select.Item value="weekly" label="Weekly" />
                    <Select.Item value="monthly" label="Monthly" />
                    <Select.Item value="yearly" label="Yearly" />
                  </Select.Content>
                </Select.Root>
              {/if}
            {/snippet}
          </Form.Control>
        </Form.Field>
      </form>
    </div>
    <Dialog.Footer>
      <Button class="h-8 px-8 py-0" type="submit">Create</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
