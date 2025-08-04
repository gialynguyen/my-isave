<script lang="ts">
  import { Card } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Volume2, BookOpen, Lightbulb, RefreshCw, ExternalLink } from 'lucide-svelte';
  import type { VocabularyResponse } from '../../../features/vocabulary/types';
  import type { VocabularyExplanation, DifficultyLevel } from '$lib/types';

  interface Props {
    vocabulary: VocabularyResponse;
    aiExplanation?: VocabularyExplanation;
    isLoadingExplanation?: boolean;
    onPlayAudio?: () => void;
    onGenerateExplanation?: () => void;
    onRefreshExplanation?: () => void;
    showAIExplanation?: boolean;
  }

  let {
    vocabulary,
    aiExplanation,
    isLoadingExplanation = false,
    onPlayAudio,
    onGenerateExplanation,
    onRefreshExplanation,
    showAIExplanation = true
  }: Props = $props();

  function getDifficultyColor(difficulty: DifficultyLevel): string {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function handleAudioClick() {
    onPlayAudio?.();
  }

  function handleGenerateExplanation() {
    onGenerateExplanation?.();
  }

  function handleRefreshExplanation() {
    onRefreshExplanation?.();
  }
</script>

<div class="space-y-6">
  <!-- Main Word Card -->
  <Card class="p-6">
    <!-- Header -->
    <div class="flex items-start justify-between mb-6">
      <div class="flex-1">
        <div class="flex items-center gap-4 mb-3">
          <h1 class="text-3xl font-bold text-foreground">{vocabulary.word}</h1>
          {#if vocabulary.audioUrl}
            <Button
              variant="ghost"
              size="icon"
              onclick={handleAudioClick}
              class="shrink-0"
            >
              <Volume2 class="h-5 w-5" />
            </Button>
          {/if}
        </div>
        
        <div class="flex items-center gap-3 mb-4">
          <Badge variant="outline" class={getDifficultyColor(vocabulary.difficulty)}>
            {vocabulary.difficulty}
          </Badge>
          {#if vocabulary.pronunciation}
            <span class="text-lg text-muted-foreground font-mono">
              /{vocabulary.pronunciation}/
            </span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Basic Definition -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
        <BookOpen class="h-5 w-5" />
        Definition
      </h3>
      <p class="text-foreground leading-relaxed">{vocabulary.definition}</p>
    </div>

    <!-- Examples -->
    {#if vocabulary.examples.length > 0}
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-foreground mb-3">Examples</h3>
        <div class="space-y-2">
          {#each vocabulary.examples as example}
            <div class="bg-secondary/30 rounded-lg p-3">
              <p class="text-foreground italic">"{example}"</p>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Tags -->
    {#if vocabulary.tags.length > 0}
      <div>
        <h3 class="text-lg font-semibold text-foreground mb-3">Categories</h3>
        <div class="flex flex-wrap gap-2">
          {#each vocabulary.tags as tag}
            <Badge variant="secondary" class="text-sm">
              {tag}
            </Badge>
          {/each}
        </div>
      </div>
    {/if}
  </Card>

  <!-- AI-Powered Explanation -->
  {#if showAIExplanation}
    <Card class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-foreground flex items-center gap-2">
          <Lightbulb class="h-5 w-5 text-yellow-500" />
          AI-Powered Explanation
        </h3>
        
        <div class="flex gap-2">
          {#if aiExplanation && onRefreshExplanation}
            <Button
              variant="ghost"
              size="sm"
              onclick={handleRefreshExplanation}
              disabled={isLoadingExplanation}
            >
              <RefreshCw class="h-4 w-4 mr-1 {isLoadingExplanation ? 'animate-spin' : ''}" />
              Refresh
            </Button>
          {/if}
          
          {#if !aiExplanation && onGenerateExplanation}
            <Button
              variant="outline"
              size="sm"
              onclick={handleGenerateExplanation}
              disabled={isLoadingExplanation}
            >
              {#if isLoadingExplanation}
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              {/if}
              Generate Explanation
            </Button>
          {/if}
        </div>
      </div>

      {#if isLoadingExplanation}
        <div class="space-y-4">
          <div class="animate-pulse">
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div class="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      {:else if aiExplanation}
        <div class="space-y-6">
          <!-- AI Definition -->
          {#if aiExplanation.definition}
            <div>
              <h4 class="font-semibold text-foreground mb-2">Simple Explanation</h4>
              <p class="text-foreground leading-relaxed">{aiExplanation.definition}</p>
            </div>
          {/if}

          <!-- AI Examples -->
          {#if aiExplanation.examples && aiExplanation.examples.length > 0}
            <div>
              <h4 class="font-semibold text-foreground mb-2">More Examples</h4>
              <div class="space-y-2">
                {#each aiExplanation.examples as example}
                  <div class="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg">
                    <p class="text-foreground italic">"{example}"</p>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Synonyms and Antonyms -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {#if aiExplanation.synonyms && aiExplanation.synonyms.length > 0}
              <div>
                <h4 class="font-semibold text-foreground mb-2">Similar Words</h4>
                <div class="flex flex-wrap gap-2">
                  {#each aiExplanation.synonyms as synonym}
                    <Badge variant="outline" class="bg-green-50 text-green-700 border-green-200">
                      {synonym}
                    </Badge>
                  {/each}
                </div>
              </div>
            {/if}

            {#if aiExplanation.antonyms && aiExplanation.antonyms.length > 0}
              <div>
                <h4 class="font-semibold text-foreground mb-2">Opposite Words</h4>
                <div class="flex flex-wrap gap-2">
                  {#each aiExplanation.antonyms as antonym}
                    <Badge variant="outline" class="bg-red-50 text-red-700 border-red-200">
                      {antonym}
                    </Badge>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
      {:else}
        <div class="text-center py-8">
          <Lightbulb class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p class="text-muted-foreground mb-4">
            Get an AI-powered explanation with more examples and context
          </p>
          <Button onclick={handleGenerateExplanation} disabled={isLoadingExplanation}>
            <Lightbulb class="h-4 w-4 mr-2" />
            Generate AI Explanation
          </Button>
        </div>
      {/if}
    </Card>
  {/if}

  <!-- Additional Resources -->
  <Card class="p-6">
    <h3 class="text-lg font-semibold text-foreground mb-4">Additional Resources</h3>
    <div class="space-y-3">
      <Button variant="outline" class="w-full justify-start" asChild>
        <a 
          href="https://www.merriam-webster.com/dictionary/{vocabulary.word}" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <ExternalLink class="h-4 w-4 mr-2" />
          View in Merriam-Webster Dictionary
        </a>
      </Button>
      
      <Button variant="outline" class="w-full justify-start" asChild>
        <a 
          href="https://dictionary.cambridge.org/dictionary/english/{vocabulary.word}" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <ExternalLink class="h-4 w-4 mr-2" />
          View in Cambridge Dictionary
        </a>
      </Button>
    </div>
  </Card>
</div>