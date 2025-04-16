<script lang="ts">
  import Navbar from './navbar.svelte';
  import Sidebar from './sidebar.svelte';
</script>

<div class="flex">
  <Sidebar>
    <div class="h-svh w-full">
      <Navbar className="h-16" />
      <div class="h-[calc(100%-8rem)] px-6">
        <slot />
      </div>
    </div>
  </Sidebar>
</div>
