<script lang="ts">
  import { page } from '$app/state';
  import { Separator } from '$lib/components/ui/separator';
</script>

<div class="flex h-screen w-screen items-center justify-center">
  {page.status}
  <Separator class="mx-4 h-10 w-0.5" orientation="vertical" />
  {page.error?.message || 'Something error'}
</div>
