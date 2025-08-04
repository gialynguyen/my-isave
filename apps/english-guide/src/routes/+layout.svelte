<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { Button } from '$lib/components/ui/button';
  import { BookOpen, Volume2, MessageCircle, Home } from 'lucide-svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
  let currentPath = $derived($page.url.pathname);
</script>

<div class="min-h-screen bg-background">
  <!-- Navigation Header -->
  <header class="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center gap-6">
          <a href="/" class="flex items-center gap-2 text-xl font-bold text-foreground">
            <BookOpen class="h-6 w-6 text-primary" />
            English Guide
          </a>
          
          <nav class="hidden md:flex items-center gap-4">
            <a href="/" class="text-sm font-medium {currentPath === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} transition-colors">
              <div class="flex items-center gap-2">
                <Home class="h-4 w-4" />
                Home
              </div>
            </a>
            <a href="/vocabulary" class="text-sm font-medium {currentPath.startsWith('/vocabulary') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} transition-colors">
              <div class="flex items-center gap-2">
                <BookOpen class="h-4 w-4" />
                Vocabulary
              </div>
            </a>
            <span class="text-sm font-medium text-muted-foreground/50 flex items-center gap-2">
              <Volume2 class="h-4 w-4" />
              Pronunciation
              <span class="text-xs bg-muted px-2 py-1 rounded">Soon</span>
            </span>
            <span class="text-sm font-medium text-muted-foreground/50 flex items-center gap-2">
              <MessageCircle class="h-4 w-4" />
              Conversation
              <span class="text-xs bg-muted px-2 py-1 rounded">Soon</span>
            </span>
          </nav>
        </div>
      </div>
    </div>
  </header>

  <main>
    {@render children?.()}
  </main>
</div>