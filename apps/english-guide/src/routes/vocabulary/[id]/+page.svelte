<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import { WordDefinition } from '$lib/components/vocabulary';
  import { ArrowLeft, Loader2, AlertCircle } from 'lucide-svelte';
  import type { VocabularyResponse } from '../../../features/vocabulary/types';
  import type { VocabularyExplanation, ProficiencyLevel } from '$lib/types';

  let vocabulary: VocabularyResponse | null = $state(null);
  let aiExplanation: VocabularyExplanation | null = $state(null);
  let isLoading = $state(true);
  let isLoadingExplanation = $state(false);
  let error = $state('');
  let audioElement: HTMLAudioElement | null = null;

  // Mock user level - in a real app this would come from user context
  const userLevel: ProficiencyLevel = 'intermediate' as ProficiencyLevel;

  onMount(() => {
    loadVocabularyWord();
  });

  async function loadVocabularyWord() {
    const wordId = $page.params.id;
    
    if (!wordId) {
      error = 'Invalid word ID';
      isLoading = false;
      return;
    }

    try {
      const response = await fetch(`/api/vocabulary/${wordId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          error = 'Word not found';
        } else {
          error = 'Failed to load word details';
        }
        return;
      }

      vocabulary = await response.json();
    } catch (err) {
      console.error('Error loading vocabulary word:', err);
      error = 'Failed to load word details';
    } finally {
      isLoading = false;
    }
  }

  async function generateAIExplanation() {
    if (!vocabulary || isLoadingExplanation) return;

    isLoadingExplanation = true;
    try {
      const response = await fetch('/api/vocabulary/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word: vocabulary.word,
          userLevel: userLevel
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate explanation');
      }

      aiExplanation = await response.json();
    } catch (err) {
      console.error('Error generating AI explanation:', err);
      // Show error to user but don't block the interface
    } finally {
      isLoadingExplanation = false;
    }
  }

  async function refreshAIExplanation() {
    aiExplanation = null;
    await generateAIExplanation();
  }

  function playAudio() {
    if (!vocabulary?.audioUrl) return;

    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    audioElement = new Audio(vocabulary.audioUrl);
    audioElement.play().catch(err => {
      console.error('Error playing audio:', err);
    });
  }

  function goBack() {
    goto('/vocabulary');
  }
</script>

<svelte:head>
  <title>{vocabulary?.word || 'Loading...'} - Vocabulary - English Guide</title>
  <meta name="description" content={vocabulary ? `Learn the word "${vocabulary.word}" with AI-powered explanations and examples` : 'Loading vocabulary word...'} />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Back Navigation -->
  <div class="mb-6">
    <Button variant="ghost" onclick={goBack} class="gap-2">
      <ArrowLeft class="h-4 w-4" />
      Back to Vocabulary
    </Button>
  </div>

  {#if isLoading}
    <!-- Loading State -->
    <div class="flex items-center justify-center py-12">
      <div class="text-center">
        <Loader2 class="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p class="text-muted-foreground">Loading word details...</p>
      </div>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="flex items-center justify-center py-12">
      <div class="text-center">
        <AlertCircle class="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h2 class="text-xl font-semibold text-foreground mb-2">Oops! Something went wrong</h2>
        <p class="text-muted-foreground mb-4">{error}</p>
        <div class="flex gap-2 justify-center">
          <Button onclick={goBack} variant="outline">
            Back to Vocabulary
          </Button>
          <Button onclick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    </div>
  {:else if vocabulary}
    <!-- Word Details -->
    <WordDefinition
      {vocabulary}
      {aiExplanation}
      {isLoadingExplanation}
      onPlayAudio={playAudio}
      onGenerateExplanation={generateAIExplanation}
      onRefreshExplanation={refreshAIExplanation}
      showAIExplanation={true}
    />

    <!-- Related Actions -->
    <div class="mt-8 flex flex-wrap gap-4 justify-center">
      <Button onclick={() => goto('/vocabulary/quiz')} variant="outline">
        Test This Word
      </Button>
      <Button onclick={() => goto('/vocabulary/review')} variant="outline">
        Practice Similar Words
      </Button>
      <Button onclick={() => goto('/vocabulary')} variant="outline">
        Browse More Words
      </Button>
    </div>
  {/if}
</div>