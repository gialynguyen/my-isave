<script lang="ts">
  import { Card } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Volume2, Eye, EyeOff, RotateCcw, CheckCircle, XCircle } from 'lucide-svelte';
  import type { VocabularyResponse } from '../../../features/vocabulary/types';
  import type { DifficultyLevel } from '$lib/types';

  interface Props {
    vocabulary: VocabularyResponse;
    showDefinition?: boolean;
    showProgress?: boolean;
    masteryLevel?: number;
    onReveal?: () => void;
    onHide?: () => void;
    onPlayAudio?: () => void;
    onMarkCorrect?: () => void;
    onMarkIncorrect?: () => void;
    onReset?: () => void;
    isFlipped?: boolean;
    disabled?: boolean;
  }

  let {
    vocabulary,
    showDefinition = false,
    showProgress = false,
    masteryLevel = 0,
    onReveal,
    onHide,
    onPlayAudio,
    onMarkCorrect,
    onMarkIncorrect,
    onReset,
    isFlipped = false,
    disabled = false
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

  function getMasteryColor(level: number): string {
    if (level >= 80) return 'bg-green-500';
    if (level >= 60) return 'bg-yellow-500';
    if (level >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  }

  function handleCardClick() {
    if (disabled) return;
    
    if (isFlipped || showDefinition) {
      onHide?.();
    } else {
      onReveal?.();
    }
  }

  function handleAudioClick(event: MouseEvent) {
    event.stopPropagation();
    onPlayAudio?.();
  }

  function handleActionClick(event: MouseEvent, action: () => void) {
    event.stopPropagation();
    action();
  }
</script>

<Card 
  class="vocabulary-card relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
  onclick={handleCardClick}
>
  <!-- Progress indicator -->
  {#if showProgress}
    <div class="absolute top-0 left-0 right-0 h-1 bg-gray-200">
      <div 
        class="h-full transition-all duration-300 {getMasteryColor(masteryLevel)}"
        style="width: {masteryLevel}%"
      ></div>
    </div>
  {/if}

  <div class="p-6">
    <!-- Header with word and difficulty -->
    <div class="flex items-start justify-between mb-4">
      <div class="flex-1">
        <h3 class="text-2xl font-bold text-foreground mb-2">{vocabulary.word}</h3>
        <div class="flex items-center gap-2">
          <Badge variant="outline" class={getDifficultyColor(vocabulary.difficulty)}>
            {vocabulary.difficulty}
          </Badge>
          {#if vocabulary.pronunciation}
            <span class="text-sm text-muted-foreground font-mono">
              /{vocabulary.pronunciation}/
            </span>
          {/if}
        </div>
      </div>
      
      <!-- Audio button -->
      {#if vocabulary.audioUrl}
        <Button
          variant="ghost"
          size="icon"
          onclick={handleAudioClick}
          disabled={disabled}
          class="shrink-0"
        >
          <Volume2 class="h-4 w-4" />
        </Button>
      {/if}
    </div>

    <!-- Definition section -->
    <div class="min-h-[120px] mb-4">
      {#if isFlipped || showDefinition}
        <div class="space-y-3">
          <div>
            <h4 class="text-sm font-semibold text-muted-foreground mb-1">Definition</h4>
            <p class="text-foreground">{vocabulary.definition}</p>
          </div>
          
          {#if vocabulary.examples.length > 0}
            <div>
              <h4 class="text-sm font-semibold text-muted-foreground mb-1">Examples</h4>
              <ul class="space-y-1">
                {#each vocabulary.examples.slice(0, 2) as example}
                  <li class="text-sm text-muted-foreground italic">
                    "{ example }"
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      {:else}
        <div class="flex items-center justify-center h-full">
          <div class="text-center">
            <Eye class="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p class="text-sm text-muted-foreground">Click to reveal definition</p>
          </div>
        </div>
      {/if}
    </div>

    <!-- Tags -->
    {#if vocabulary.tags.length > 0}
      <div class="mb-4">
        <div class="flex flex-wrap gap-1">
          {#each vocabulary.tags.slice(0, 3) as tag}
            <Badge variant="secondary" class="text-xs">
              {tag}
            </Badge>
          {/each}
          {#if vocabulary.tags.length > 3}
            <Badge variant="secondary" class="text-xs">
              +{vocabulary.tags.length - 3} more
            </Badge>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Action buttons -->
    {#if (isFlipped || showDefinition) && (onMarkCorrect || onMarkIncorrect || onReset)}
      <div class="flex items-center justify-between pt-4 border-t">
        <div class="flex gap-2">
          {#if onMarkIncorrect}
            <Button
              variant="outline"
              size="sm"
              onclick={(e) => handleActionClick(e, onMarkIncorrect)}
              disabled={disabled}
              class="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <XCircle class="h-4 w-4 mr-1" />
              Incorrect
            </Button>
          {/if}
          
          {#if onMarkCorrect}
            <Button
              variant="outline"
              size="sm"
              onclick={(e) => handleActionClick(e, onMarkCorrect)}
              disabled={disabled}
              class="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <CheckCircle class="h-4 w-4 mr-1" />
              Correct
            </Button>
          {/if}
        </div>

        {#if onReset}
          <Button
            variant="ghost"
            size="sm"
            onclick={(e) => handleActionClick(e, onReset)}
            disabled={disabled}
          >
            <RotateCcw class="h-4 w-4 mr-1" />
            Reset
          </Button>
        {/if}
      </div>
    {/if}

    <!-- Flip indicator -->
    {#if !showDefinition}
      <div class="absolute bottom-2 right-2">
        {#if isFlipped}
          <EyeOff class="h-4 w-4 text-muted-foreground" />
        {:else}
          <Eye class="h-4 w-4 text-muted-foreground" />
        {/if}
      </div>
    {/if}
  </div>
</Card>

<style>
  .vocabulary-card {
    perspective: 1000px;
  }
</style>