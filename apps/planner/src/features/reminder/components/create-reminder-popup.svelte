<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Form from '$lib/components/ui/form';
  import { Input } from '$lib/components/ui/input';
  import { superForm } from 'sveltekit-superforms';
  import { createReminderPayloadDto, type CreateReminderPayload } from '../dtos/create-reminder';
  import { typebox } from 'sveltekit-superforms/adapters';
  import { Textarea } from '$lib/components/ui/textarea';

  const form = superForm<CreateReminderPayload>(
    {
      title: '',
      description: ''
    },
    {
      SPA: true,
      validators: typebox(createReminderPayloadDto)
    }
  );

  const { form: formData, enhance } = form;
</script>

<Dialog.Root open={true}>
  <Dialog.Content class="sm:max-w-[760px]">
    <Dialog.Header>
      <Dialog.Title>Create a new reminder</Dialog.Title>
    </Dialog.Header>
    <div class="mt py-2">
      <form method="post" use:enhance>
        <Form.Field {form} name="title">
          <Form.Control let:attrs>
            <Input
              {...attrs}
              class="border-none text-base font-medium"
              placeholder="Reminder title"
              bind:value={$formData.title}
            />
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
          </Form.Control>
        </Form.Field>
        <!-- dueDate -->

        <!-- Repeat -->
      </form>
    </div>
    <Dialog.Footer>
      <Button class="h-8 px-8 py-0" type="submit">Create</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
