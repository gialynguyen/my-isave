<script module lang="ts">
  type CreateButtonState = {
    buttonStatus: 'collapsed' | 'expanded';
  };

  type TaskPopupState = {
    open: boolean;
  };
</script>

<script lang="ts">
  import { Minus, Plus } from 'lucide-svelte';
  import { twMerge } from 'tailwind-merge';
  import { fly } from 'svelte/transition';
  import CreateTaskPopup from 'features/task/components/create-task-popup.svelte';
  import CreateReminderPopup from 'features/reminder/components/create-reminder-popup.svelte';

  let createButtonState = $state<CreateButtonState>({
    buttonStatus: 'collapsed'
  });

  let taskPopupState = $state<TaskPopupState>({
    open: false
  });

  function toggleButtonStatus() {
    createButtonState.buttonStatus =
      createButtonState.buttonStatus === 'collapsed' ? 'expanded' : 'collapsed';
  }

  function openCreateTaskPopup() {
    taskPopupState.open = true;
    toggleButtonStatus();
  }

  function closeCreateTaskPopup() {
    taskPopupState.open = false;
  }
</script>

<div class="relative">
  <button
    class=" flex h-16 w-16 items-center justify-center rounded-full border border-blue-500"
    onclick={toggleButtonStatus}
  >
    {#if createButtonState.buttonStatus === 'collapsed'}
      <Plus size="24" color="#3b82f6" />
    {:else}
      <Minus size="24" color="#3b82f6" />
    {/if}
  </button>

  {#if createButtonState.buttonStatus === 'expanded'}
    <button
      onclick={openCreateTaskPopup}
      transition:fly={{ duration: 200 }}
      class={twMerge(
        'absolute right-full flex h-10 cursor-pointer items-center pl-2',
        'w-max rounded-bl-lg rounded-tl-lg border-b-2 border-l-2 border-t-2 border-blue-500 text-sm',
        'after:absolute after:-right-3.5 after:block after:h-7 after:w-7 after:rotate-45 after:transform after:rounded-tr-md after:border-r-2 after:border-t-2 after:border-blue-500',
        '-translate-x-8 -translate-y-9 -rotate-6 transform'
      )}
    >
      <span>Create task</span>
    </button>
  {/if}
</div>

{#if taskPopupState.open}
  <CreateTaskPopup open={taskPopupState.open} onClose={closeCreateTaskPopup} />
{/if}

<CreateReminderPopup />
