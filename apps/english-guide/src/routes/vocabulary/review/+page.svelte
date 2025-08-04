<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import { SpacedRepetition } from '$lib/components/vocabulary';
  import { ArrowLeft } from 'lucide-svelte';
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

  let session: SpacedRepetitionSession | null = $state(null);
  let progress: SessionProgress | null = $state(null);
  let isLoading = $state(false);
  let isPaused = $state(false);

  // Mock user ID - in a real app this would come from authentication
  const userId = 'mock-user-id';

  onMount(() => {
    // Check if there's an existing session in localStorage
    const savedSession = localStorage.getItem('spacedRepetitionSession');
    const savedProgress = localStorage.getItem('spacedRepetitionProgress');
    
    if (savedSession && savedProgress) {
      try {
        session = JSON.parse(savedSession);
        progress = JSON.parse(savedProgress);
        // Convert date strings back to Date objects
        if (progress) {
          progress.sessionStartTime = new Date(progress.sessionStartTime);
          progress.wordStartTime = new Date(progress.wordStartTime);
        }
      } catch (error) {
        console.error('Error loading saved session:', error);
        // Clear corrupted data
        localStorage.removeItem('spacedRepetitionSession');
        localStorage.removeItem('spacedRepetitionProgress');
      }
    }
  });

  async function startSession() {
    if (isLoading) return;

    isLoading = true;
    try {
      // Fetch words for spaced repetition
      const response = await fetch(`/api/vocabulary/spaced-repetition?userId=${userId}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch spaced repetition words');
      }

      const data = await response.json();
      
      if (!data.words || data.words.length === 0) {
        throw new Error('No words available for review');
      }

      // Create new session
      const newSession: SpacedRepetitionSession = {
        words: data.words,
        totalWords: data.words.length,
        sessionId: `session-${Date.now()}`
      };

      const newProgress: SessionProgress = {
        currentIndex: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        completedWords: [],
        sessionStartTime: new Date(),
        wordStartTime: new Date()
      };

      session = newSession;
      progress = newProgress;
      isPaused = false;

      // Save to localStorage
      saveSession();
    } catch (error) {
      console.error('Error starting spaced repetition session:', error);
      // Show error to user
    } finally {
      isLoading = false;
    }
  }

  function saveSession() {
    if (session && progress) {
      localStorage.setItem('spacedRepetitionSession', JSON.stringify(session));
      localStorage.setItem('spacedRepetitionProgress', JSON.stringify(progress));
    }
  }

  function clearSession() {
    localStorage.removeItem('spacedRepetitionSession');
    localStorage.removeItem('spacedRepetitionProgress');
  }

  async function markCorrect(wordId: string, responseTime: number) {
    if (!session || !progress) return;

    try {
      // Record progress on server
      await fetch('/api/vocabulary/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          vocabularyId: wordId,
          correct: true,
          responseTime
        })
      });

      // Update local progress
      progress.correctAnswers++;
      progress.completedWords.push(wordId);
      
      // Move to next word
      if (progress.currentIndex < session.totalWords - 1) {
        progress.currentIndex++;
        progress.wordStartTime = new Date();
      }

      saveSession();
    } catch (error) {
      console.error('Error recording correct answer:', error);
    }
  }

  async function markIncorrect(wordId: string, responseTime: number) {
    if (!session || !progress) return;

    try {
      // Record progress on server
      await fetch('/api/vocabulary/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          vocabularyId: wordId,
          correct: false,
          responseTime
        })
      });

      // Update local progress
      progress.incorrectAnswers++;
      progress.completedWords.push(wordId);
      
      // Move to next word
      if (progress.currentIndex < session.totalWords - 1) {
        progress.currentIndex++;
        progress.wordStartTime = new Date();
      }

      saveSession();
    } catch (error) {
      console.error('Error recording incorrect answer:', error);
    }
  }

  function skipWord() {
    if (!session || !progress) return;

    // Move to next word without recording progress
    if (progress.currentIndex < session.totalWords - 1) {
      progress.currentIndex++;
      progress.wordStartTime = new Date();
      saveSession();
    }
  }

  function pauseSession() {
    isPaused = true;
    saveSession();
  }

  function resumeSession() {
    isPaused = false;
    if (progress) {
      progress.wordStartTime = new Date();
    }
    saveSession();
  }

  function endSession() {
    clearSession();
    session = null;
    progress = null;
    isPaused = false;
  }

  function restartSession() {
    clearSession();
    session = null;
    progress = null;
    isPaused = false;
    startSession();
  }

  function goBack() {
    goto('/vocabulary');
  }
</script>

<svelte:head>
  <title>Spaced Repetition Review - English Guide</title>
  <meta name="description" content="Review vocabulary words using scientifically-proven spaced repetition technique" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Back Navigation -->
  <div class="mb-6">
    <Button variant="ghost" onclick={goBack} class="gap-2">
      <ArrowLeft class="h-4 w-4" />
      Back to Vocabulary
    </Button>
  </div>

  <!-- Spaced Repetition Interface -->
  <div class="max-w-4xl mx-auto">
    <SpacedRepetition
      {session}
      {progress}
      {isLoading}
      {isPaused}
      onStartSession={startSession}
      onMarkCorrect={markCorrect}
      onMarkIncorrect={markIncorrect}
      onSkipWord={skipWord}
      onPauseSession={pauseSession}
      onResumeSession={resumeSession}
      onEndSession={endSession}
      onRestartSession={restartSession}
    />
  </div>
</div>