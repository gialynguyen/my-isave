<script lang="ts">
  import { Card } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import VocabularyCard from './VocabularyCard.svelte';
  import { 
    Brain, 
    Clock, 
    Target, 
    TrendingUp, 
    CheckCircle, 
    XCircle, 
    RotateCcw,
    Play,
    Pause
  } from 'lucide-svelte';
  import type { VocabularyResponse } from '../../../features/vocabulary/types';

  interface SpacedRepetitionSession {
    words: VocabularyResponse[];
    totalWords: number;
    sessionId: string;
  }

  interface SessionProgress {
    currentIndex: number;
    correctAnswers: number;
    incorrectAnswers: number;
    completedWords: string[];
    sessionStartTime: Date;
    wordStartTime: Date;
  }

  interface Props {
    session?: SpacedRepetitionSession;
    progress?: SessionProgress;
    isLoading?: boolean;
    isPaused?: boolean;
    onStartSession?: () => void;
    onMarkCorrect?: (wordId: string, responseTime: number) => void;
    onMarkIncorrect?: (wordId: string, responseTime: number) => void;
    onSkipWord?: () => void;
    onPauseSession?: () => void;
    onResumeSession?: () => void;
    onEndSession?: () => void;
    onRestartSession?: () => void;
  }

  let {
    session,
    progress,
    isLoading = false,
    isPaused = false,
    onStartSession,
    onMarkCorrect,
    onMarkIncorrect,
    onSkipWord,
    onPauseSession,
    onResumeSession,
    onEndSession,
    onRestartSession
  }: Props = $props();

  let currentCardFlipped = $state(false);
  let sessionTimer = $state(0);
  let wordTimer = $state(0);
  let timerInterval: NodeJS.Timeout | null = null;

  $effect(() => {
    if (session && progress && !isPaused) {
      startTimers();
    } else {
      stopTimers();
    }

    return () => stopTimers();
  });

  function startTimers() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
      sessionTimer++;
      wordTimer++;
    }, 1000);
  }

  function stopTimers() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function resetWordTimer() {
    wordTimer = 0;
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function handleRevealCard() {
    currentCardFlipped = true;
  }

  function handleHideCard() {
    currentCardFlipped = false;
  }

  function handleMarkCorrect() {
    if (!session || !progress) return;
    
    const currentWord = session.words[progress.currentIndex];
    onMarkCorrect?.(currentWord.id, wordTimer);
    
    currentCardFlipped = false;
    resetWordTimer();
  }

  function handleMarkIncorrect() {
    if (!session || !progress) return;
    
    const currentWord = session.words[progress.currentIndex];
    onMarkIncorrect?.(currentWord.id, wordTimer);
    
    currentCardFlipped = false;
    resetWordTimer();
  }

  function handlePauseResume() {
    if (isPaused) {
      onResumeSession?.();
    } else {
      onPauseSession?.();
    }
  }

  function calculateAccuracy(): number {
    if (!progress) return 0;
    const total = progress.correctAnswers + progress.incorrectAnswers;
    return total > 0 ? Math.round((progress.correctAnswers / total) * 100) : 0;
  }

  function getProgressPercentage(): number {
    if (!session || !progress) return 0;
    return Math.round(((progress.currentIndex + 1) / session.totalWords) * 100);
  }

  let currentWord = $derived(session && progress ? session.words[progress.currentIndex] : null);
  let isSessionComplete = $derived(progress && session && progress.currentIndex >= session.totalWords);
  let accuracy = $derived(calculateAccuracy());
  let progressPercentage = $derived(getProgressPercentage());
</script>

<div class="space-y-6">
  {#if !session}
    <!-- Start Session Screen -->
    <Card class="p-8 text-center">
      <Brain class="h-16 w-16 mx-auto mb-6 text-primary" />
      <h2 class="text-2xl font-bold mb-4">Spaced Repetition Review</h2>
      <p class="text-muted-foreground mb-6 max-w-md mx-auto">
        Review words that need practice based on your learning progress. 
        This scientifically-proven method helps improve long-term retention.
      </p>
      
      <Button 
        onclick={onStartSession} 
        disabled={isLoading}
        size="lg"
      >
        {#if isLoading}
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
        {/if}
        <Play class="h-5 w-5 mr-2" />
        Start Review Session
      </Button>
    </Card>
  {:else if isSessionComplete}
    <!-- Session Complete Screen -->
    <Card class="p-8 text-center">
      <CheckCircle class="h-16 w-16 mx-auto mb-6 text-green-500" />
      <h2 class="text-2xl font-bold mb-4">Session Complete!</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-secondary/30 rounded-lg p-4">
          <div class="text-2xl font-bold text-green-600">{progress?.correctAnswers || 0}</div>
          <div class="text-sm text-muted-foreground">Correct</div>
        </div>
        
        <div class="bg-secondary/30 rounded-lg p-4">
          <div class="text-2xl font-bold text-red-600">{progress?.incorrectAnswers || 0}</div>
          <div class="text-sm text-muted-foreground">Incorrect</div>
        </div>
        
        <div class="bg-secondary/30 rounded-lg p-4">
          <div class="text-2xl font-bold text-primary">{accuracy}%</div>
          <div class="text-sm text-muted-foreground">Accuracy</div>
        </div>
      </div>

      <div class="text-muted-foreground mb-6">
        <p>Session time: {formatTime(sessionTimer)}</p>
        <p>Words reviewed: {session.totalWords}</p>
      </div>

      <div class="flex gap-4 justify-center">
        <Button variant="outline" onclick={onRestartSession}>
          <RotateCcw class="h-4 w-4 mr-2" />
          Start New Session
        </Button>
        
        <Button onclick={onEndSession}>
          <CheckCircle class="h-4 w-4 mr-2" />
          Finish
        </Button>
      </div>
    </Card>
  {:else}
    <!-- Active Session -->
    <div class="space-y-4">
      <!-- Session Header -->
      <Card class="p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <Badge variant="outline" class="bg-blue-50 text-blue-700 border-blue-200">
              <Brain class="h-3 w-3 mr-1" />
              Spaced Repetition
            </Badge>
            
            <div class="text-sm text-muted-foreground">
              Word {(progress?.currentIndex || 0) + 1} of {session.totalWords}
            </div>
          </div>

          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock class="h-4 w-4" />
              {formatTime(sessionTimer)}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onclick={handlePauseResume}
            >
              {#if isPaused}
                <Play class="h-4 w-4" />
              {:else}
                <Pause class="h-4 w-4" />
              {/if}
            </Button>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mt-4">
          <div class="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-primary h-2 rounded-full transition-all duration-300"
              style="width: {progressPercentage}%"
            ></div>
          </div>
        </div>
      </Card>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card class="p-4 text-center">
          <div class="text-lg font-bold text-green-600">{progress?.correctAnswers || 0}</div>
          <div class="text-xs text-muted-foreground">Correct</div>
        </Card>
        
        <Card class="p-4 text-center">
          <div class="text-lg font-bold text-red-600">{progress?.incorrectAnswers || 0}</div>
          <div class="text-xs text-muted-foreground">Incorrect</div>
        </Card>
        
        <Card class="p-4 text-center">
          <div class="text-lg font-bold text-primary">{accuracy}%</div>
          <div class="text-xs text-muted-foreground">Accuracy</div>
        </Card>
        
        <Card class="p-4 text-center">
          <div class="text-lg font-bold text-muted-foreground">{formatTime(wordTimer)}</div>
          <div class="text-xs text-muted-foreground">Word Time</div>
        </Card>
      </div>

      <!-- Current Word Card -->
      {#if currentWord}
        <VocabularyCard
          vocabulary={currentWord}
          isFlipped={currentCardFlipped}
          onReveal={handleRevealCard}
          onHide={handleHideCard}
          onMarkCorrect={handleMarkCorrect}
          onMarkIncorrect={handleMarkIncorrect}
          disabled={isPaused}
        />
      {/if}

      <!-- Session Controls -->
      <Card class="p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Target class="h-4 w-4 text-muted-foreground" />
            <span class="text-sm text-muted-foreground">
              Focus on accuracy over speed
            </span>
          </div>

          <div class="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onclick={onSkipWord}
              disabled={isPaused}
            >
              Skip Word
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onclick={onEndSession}
            >
              End Session
            </Button>
          </div>
        </div>
      </Card>

      <!-- Tips Card -->
      <Card class="p-4 bg-blue-50 border-blue-200">
        <div class="flex items-start gap-3">
          <TrendingUp class="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 class="font-semibold text-blue-900 mb-1">Spaced Repetition Tips</h4>
            <ul class="text-sm text-blue-800 space-y-1">
              <li>• Take your time to really understand each word</li>
              <li>• Be honest about whether you knew the answer</li>
              <li>• Words you get wrong will appear more frequently</li>
              <li>• Regular practice leads to better retention</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  {/if}
</div>