<script lang="ts">
  // English Guide App - Main Page
</script>

<svelte:head>
  <title>English Guide - AI-Powered English Learning</title>
  <meta name="description" content="Learn English with AI-powered vocabulary, pronunciation, and conversation practice" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <header class="text-center mb-12">
    <h1 class="text-4xl font-bold text-foreground mb-4">English Guide</h1>
    <p class="text-xl text-foreground-subtle">AI-Powered English Learning Platform</p>
  </header>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
    <div class="card bg-card p-6 rounded-lg border border-border">
      <h2 class="text-xl font-semibold text-foreground mb-3">Vocabulary Building</h2>
      <p class="text-foreground-subtle mb-4">Expand your vocabulary with AI-powered word learning sessions</p>
      <a href="/vocabulary" class="block">
        <div class="bg-primary text-primary-foreground p-3 rounded text-center hover:bg-primary/90 transition-colors">
          <span class="font-medium">Start Learning</span>
        </div>
      </a>
    </div>

    <div class="card bg-card p-6 rounded-lg border border-border">
      <h2 class="text-xl font-semibold text-foreground mb-3">Pronunciation Training</h2>
      <p class="text-foreground-subtle mb-4">Practice pronunciation with AI feedback and speech analysis</p>
      <div class="bg-primary-subtle p-3 rounded text-center">
        <span class="text-primary font-medium">Coming Soon</span>
      </div>
    </div>

    <div class="card bg-card p-6 rounded-lg border border-border">
      <h2 class="text-xl font-semibold text-foreground mb-3">Conversation Practice</h2>
      <p class="text-foreground-subtle mb-4">Engage in real-life conversations with AI for practical learning</p>
      <div class="bg-primary-subtle p-3 rounded text-center">
        <span class="text-primary font-medium">Coming Soon</span>
      </div>
    </div>
  </div>

  <div class="text-center mt-12">
    <p class="text-foreground-muted">Project structure and core interfaces have been set up successfully!</p>
  </div>
</div>