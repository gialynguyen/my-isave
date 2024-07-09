<script lang="ts" context="module">
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
  import * as Popover from '$lib/components/ui/popover';
  import { getLocalTimeZone, now } from '@internationalized/date';
  import { Textarea } from '$lib/components/ui/textarea';

  let { open, onClose }: Props = $props();
  let taskState = $state({
    dueDate: now(getLocalTimeZone())
  });

  function onOpenChange(open: boolean) {
    if (!open) {
      onClose();
    }
  }
</script>

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content class="sm:max-w-[760px]">
    <Dialog.Header>
      <Dialog.Title>Create a new task</Dialog.Title>
    </Dialog.Header>
    <div class="grid gap-4 py-2">
      <div class="grid grid-cols-4 items-center gap-4">
        <Input
          id="title"
          class="col-span-4 border-none text-base font-medium"
          placeholder="Task title"
        />
      </div>
      <div class="grid grid-cols-4 items-center gap-4">
        <Textarea
          id="description"
          class="col-span-4 resize-none border-none"
          placeholder="Add description..."
        />
      </div>

      <div class="grid grid-cols-4 items-center gap-4">
        <Popover.Root>
          <Popover.Trigger asChild let:builder>
            <Button
              variant="secondary"
              class="h-8 w-fit px-4 py-0 text-[12px] font-light"
              builders={[builder]}
            >
              Set due date...
              <!-- <CalendarIcon class="mr-2 h-4 w-4" /> -->
              <!-- {taskState.dueDate ? df.format(taskState.dueDate.toDate()) : 'Pick a date'} -->
            </Button>
          </Popover.Trigger>
          <Popover.Content class="mt-4 w-auto p-0">
            <Calendar
              bind:value={taskState.dueDate}
              initialFocus
              isDateDisabled={(date) => {
                return date.compare(now(getLocalTimeZone())) < 0;
              }}
            />
          </Popover.Content>
        </Popover.Root>
      </div>
    </div>
    <Dialog.Footer>
      <Button class="h-8 px-8 py-0" type="submit">Create</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
