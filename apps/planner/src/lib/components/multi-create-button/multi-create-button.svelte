<script lang="ts">
  import { scale } from 'svelte/transition';
  import CreateTaskPopup from 'features/task/components/create-task-popup.svelte';
  import CreateReminderPopup from 'features/reminder/components/create-reminder-popup.svelte';
  import Button from '../ui/button/button.svelte';
  import { onMount } from 'svelte';

  let isOpen = $state(false);
  let rootElement: HTMLDivElement | null = null;
  let taskPopupOpen = $state(false);
  let reminderPopupOpen = $state(false);

  const actions = [
    {
      label: 'New Task',
      icon: '📋',
      onClick: () => {
        taskPopupOpen = true;
        isOpen = false;
      }
    },
    {
      label: 'Add Reminder',
      icon: '⏰',
      onClick: () => {
        reminderPopupOpen = true;
        isOpen = false;
      }
    }
  ];

  function toggleMenu() {
    isOpen = !isOpen;
  }

  function handleClickOutside(event: MouseEvent) {
    if (!isOpen) return;

    if (!(event.target instanceof Node)) {
      isOpen = false;
      return;
    }

    if (rootElement && !rootElement.contains(event.target)) {
      isOpen = false;
    }
  }

  onMount(() => {
    document.addEventListener('mousedown', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  });
</script>

<div bind:this={rootElement} class="fixed right-14 bottom-12 z-50">
  <!-- Main floating button -->
  <Button
    onclick={toggleMenu}
    aria-label={isOpen ? 'Close menu' : 'Open menu'}
    aria-expanded={isOpen}
  >
    <span class="text-lg font-light transition-transform duration-200" class:rotate-45={isOpen}>
      +
    </span>
  </Button>

  <!-- Menu items -->
  {#if isOpen}
    <div
      class="absolute right-0 bottom-12 w-48 overflow-hidden rounded-md border border-[#2E2E35] bg-[#1E1E20] shadow-lg transition-all duration-200"
      role="menu"
      style="transform-origin: bottom right;"
      in:scale={{ duration: 150, start: 0.95, opacity: 0 }}
      out:scale={{ duration: 150, start: 0.95, opacity: 0 }}
    >
      {#each actions as action, i}
        <Button
          variant="outline"
          onclick={action.onClick}
          class="flex w-full justify-start rounded-none border-none px-3 py-2 text-left text-sm text-[#E2E2E4] transition-colors duration-150 hover:bg-[#2E2E35]"
          role="menuitem"
        >
          <span
            class="mr-3 flex h-5 w-5 items-center justify-center rounded bg-[#2E2E35] text-xs font-medium text-[#A1A1AA]"
            >{action.icon}</span
          >
          <span class="font-medium">{action.label}</span>
        </Button>
      {/each}
    </div>
  {/if}
</div>

{#if taskPopupOpen}
  <CreateTaskPopup bind:open={taskPopupOpen} />
{/if}

{#if reminderPopupOpen}
  <CreateReminderPopup open={reminderPopupOpen} onClose={() => (reminderPopupOpen = false)} />
{/if}
