<script lang="ts" context="module">
  export type Props = {
    open: boolean;
    onClose: () => void;
  };
</script>

<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Label } from '$lib/components/ui/label';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { Calendar } from '$lib/components/ui/calendar';
  import * as Popover from '$lib/components/ui/popover';
  import { cn } from '$lib/utils';
  import { DateFormatter, getLocalTimeZone, now, type DateValue } from '@internationalized/date';
  import { CalendarIcon } from 'lucide-svelte';

  let { open, onClose }: Props = $props();
  let startTime = $state<DateValue>(now(getLocalTimeZone()));
  let endTime = $state<DateValue>(now(getLocalTimeZone()));

  const df = new DateFormatter('en-US', {
    dateStyle: 'long'
  });

  function onOpenChange(open: boolean) {
    if (!open) {
      onClose();
    }
  }
</script>

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Create a new task</Dialog.Title>
    </Dialog.Header>
    <div class="grid gap-4 py-4">
      <div class="grid grid-cols-4 items-center gap-4">
        <Label for="title" class="text-right">Title</Label>
        <Input id="title" class="col-span-3" />
      </div>
      <div class="grid grid-cols-4 items-center gap-4">
        <Label for="description" class="text-right">Description</Label>
        <Input id="description" class="col-span-3" />
      </div>

      <div class="grid grid-cols-4 items-center gap-4">
        <Label for="startTime" class="text-right">Start Date</Label>
        <Popover.Root>
          <Popover.Trigger asChild let:builder>
            <Button
              variant="outline"
              class={cn(
                'w-[280px] justify-start text-left font-normal',
                !startTime && 'text-muted-foreground'
              )}
              builders={[builder]}
            >
              <CalendarIcon class="mr-2 h-4 w-4" />
              {startTime ? df.format(startTime.toDate(getLocalTimeZone())) : 'Pick a date'}
            </Button>
          </Popover.Trigger>
          <Popover.Content class="w-auto p-0">
            <Calendar bind:value={startTime} initialFocus />
          </Popover.Content>
        </Popover.Root>
      </div>
    </div>
    <Dialog.Footer>
      <Button type="submit">Create</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
