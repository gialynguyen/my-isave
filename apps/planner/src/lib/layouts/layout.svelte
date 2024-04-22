<script lang="ts">
  import Navbar from './navbar.svelte';
  import Sidebar from './sidebar.svelte';
</script>

<div class="flex">
  <Sidebar className="w-1/4 max-w-64 min-w-56" />
  <div class="h-svh w-full">
    <Navbar className="h-16" />
    <div class="h-[calc(100%-4rem)] px-3">
      <slot />
    </div>
  </div>
</div>
