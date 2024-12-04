<script lang="ts">
  import { Plus } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import CreateTaskPopup from 'features/task/components/create-task-popup.svelte';
  import CreateReminderPopup from 'features/reminder/components/create-reminder-popup.svelte';

  let isOpen = $state(false);
  let taskPopupOpen = $state(false);
  let reminderPopupOpen = $state(false);

  const actions = [
    {
      label: 'Task',
      icon: '📋',
      onClick: () => {
        taskPopupOpen = true;
        isOpen = false;
      }
    },
    {
      label: 'Reminder',
      icon: '⏰',
      onClick: () => {
        reminderPopupOpen = true;
        isOpen = false;
      }
    }
  ];

  function getPosition(index: number, total: number) {
    const angleStep = 60 / (total - 1 || 1);
    const angle = 180 + index * angleStep;
    const radius = 70;

    const x = radius * Math.cos((angle * Math.PI) / 180);
    const y = radius * Math.sin((angle * Math.PI) / 180);

    return `translate(${x}px, ${y}px)`;
  }
</script>

<div class="fixed bottom-8 right-8 z-50">
  {#if isOpen}
    <button
      aria-label="Create"
      class="fixed inset-0"
      onclick={() => (isOpen = false)}
      transition:fade={{ duration: 200 }}
    ></button>
  {/if}

  <div class="relative">
    {#if isOpen}
      <div class="absolute bottom-0 right-0 h-0 w-0">
        {#each actions as action, i}
          <button
            class="group absolute bottom-0 right-0 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white shadow-md transition-all duration-200 hover:scale-110 hover:bg-gray-50"
            style="transform: {getPosition(i, actions.length)}"
            onclick={action.onClick}
            transition:scale={{
              duration: 200,
              delay: 50 * i,
              start: 0.8
            }}
          >
            <span class="text-xl">{action.icon}</span>
            <span
              class="pointer-events-none absolute left-0 top-1/2 -translate-x-[115%] -translate-y-1/2 whitespace-nowrap rounded bg-gray-700 px-3 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            >
              {action.label}
            </span>
          </button>
        {/each}
      </div>
    {/if}

    <button
      class="z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-blue-500 shadow-lg shadow-blue-500/30 transition-all duration-200 hover:bg-blue-600 active:bg-blue-700"
      class:bg-blue-700={isOpen}
      onclick={() => (isOpen = !isOpen)}
    >
      <Plus
        size="24"
        color="#fff"
        style="transform: rotate({isOpen ? '45deg' : '0deg'}); transition: transform 0.2s"
      />
    </button>
  </div>
</div>

{#if taskPopupOpen}
  <CreateTaskPopup open={taskPopupOpen} onClose={() => (taskPopupOpen = false)} />
{/if}

{#if reminderPopupOpen}
  <CreateReminderPopup open={reminderPopupOpen} onClose={() => (reminderPopupOpen = false)} />
{/if}
