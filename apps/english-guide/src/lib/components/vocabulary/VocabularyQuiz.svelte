<script lang="ts">
  import { Card } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { CheckCircle, XCircle, Clock, Trophy, RotateCcw } from 'lucide-svelte';
  import type { VocabularyResponse } from '../../../features/vocabulary/types';
  import type { DifficultyLevel } from '$lib/types';

  interface QuizQuestion {
    word: VocabularyResponse;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }

  interface QuizResult {
    questionIndex: number;
    selectedAnswer: string;
    isCorrect: boolean;
    timeSpent: number;
  }

  interface Props {
    questions: QuizQuestion[];
    currentQuestionIndex?: number;
    selectedAnswer?: string;
    showResult?: boolean;
    results?: QuizResult[];
    timeLimit?: number; // in seconds
    onAnswerSelect?: (answer: string) => void;
    onNextQuestion?: () => void;
    onPreviousQuestion?: () => void;
    onSubmitQuiz?: () => void;
    onRestartQuiz?: () => void;
    isLoading?: boolean;
  }

  let {
    questions,
    currentQuestionIndex = 0,
    selectedAnswer = '',
    showResult = false,
    results = [],
    timeLimit = 30,
    onAnswerSelect,
    onNextQuestion,
    onPreviousQuestion,
    onSubmitQuiz,
    onRestartQuiz,
    isLoading = false
  }: Props = $props();

  let timeRemaining = $state(timeLimit);
  let timer: NodeJS.Timeout | null = null;

  $effect(() => {
    if (!showResult && questions.length > 0) {
      startTimer();
    }
    
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  });

  function startTimer() {
    if (timer) clearInterval(timer);
    timeRemaining = timeLimit;
    
    timer = setInterval(() => {
      timeRemaining--;
      if (timeRemaining <= 0) {
        clearInterval(timer!);
        // Auto-submit when time runs out
        if (onNextQuestion) {
          onNextQuestion();
        }
      }
    }, 1000);
  }

  function handleAnswerSelect(answer: string) {
    if (isLoading || showResult) return;
    onAnswerSelect?.(answer);
  }

  function handleNextQuestion() {
    if (timer) clearInterval(timer);
    onNextQuestion?.();
    if (currentQuestionIndex < questions.length - 1) {
      startTimer();
    }
  }

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

  function getTimeColor(time: number): string {
    const percentage = (time / timeLimit) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 25) return 'text-yellow-600';
    return 'text-red-600';
  }

  function calculateScore(): { score: number; percentage: number } {
    const correct = results.filter(r => r.isCorrect).length;
    const total = results.length;
    return {
      score: correct,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0
    };
  }

  let currentQuestion = $derived(questions[currentQuestionIndex]);
  let isLastQuestion = $derived(currentQuestionIndex === questions.length - 1);
  let canProceed = $derived(selectedAnswer !== '');
  let quizScore = $derived(calculateScore());
</script>

{#if questions.length === 0}
  <Card class="p-8 text-center">
    <div class="text-muted-foreground">
      <Trophy class="h-12 w-12 mx-auto mb-4" />
      <p>No questions available. Please try again later.</p>
    </div>
  </Card>
{:else if showResult}
  <!-- Quiz Results -->
  <Card class="p-6">
    <div class="text-center mb-6">
      <Trophy class="h-16 w-16 mx-auto mb-4 text-yellow-500" />
      <h2 class="text-2xl font-bold mb-2">Quiz Complete!</h2>
      <div class="text-3xl font-bold text-primary mb-2">
        {quizScore.score}/{questions.length}
      </div>
      <div class="text-lg text-muted-foreground">
        {quizScore.percentage}% Correct
      </div>
    </div>

    <!-- Detailed Results -->
    <div class="space-y-4 mb-6">
      {#each results as result, index}
        {@const question = questions[result.questionIndex]}
        <div class="border rounded-lg p-4">
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1">
              <h4 class="font-semibold text-sm text-muted-foreground">
                Question {index + 1}: {question.word.word}
              </h4>
              <p class="text-foreground">{question.question}</p>
            </div>
            <div class="flex items-center gap-2">
              {#if result.isCorrect}
                <CheckCircle class="h-5 w-5 text-green-600" />
              {:else}
                <XCircle class="h-5 w-5 text-red-600" />
              {/if}
              <span class="text-xs text-muted-foreground">
                {result.timeSpent}s
              </span>
            </div>
          </div>
          
          <div class="text-sm space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-muted-foreground">Your answer:</span>
              <span class={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
                {result.selectedAnswer}
              </span>
            </div>
            {#if !result.isCorrect}
              <div class="flex items-center gap-2">
                <span class="text-muted-foreground">Correct answer:</span>
                <span class="text-green-600">{question.correctAnswer}</span>
              </div>
            {/if}
            <p class="text-xs text-muted-foreground italic mt-2">
              {question.explanation}
            </p>
          </div>
        </div>
      {/each}
    </div>

    <div class="flex justify-center">
      <Button onclick={onRestartQuiz} disabled={isLoading}>
        <RotateCcw class="h-4 w-4 mr-2" />
        Take Another Quiz
      </Button>
    </div>
  </Card>
{:else}
  <!-- Quiz Question -->
  <Card class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <Badge variant="outline" class={getDifficultyColor(currentQuestion.word.difficulty)}>
          {currentQuestion.word.difficulty}
        </Badge>
        <span class="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {questions.length}
        </span>
      </div>
      
      <div class="flex items-center gap-2 {getTimeColor(timeRemaining)}">
        <Clock class="h-4 w-4" />
        <span class="font-mono text-sm">
          {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
        </span>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="w-full bg-gray-200 rounded-full h-2 mb-6">
      <div 
        class="bg-primary h-2 rounded-full transition-all duration-300"
        style="width: {((currentQuestionIndex + 1) / questions.length) * 100}%"
      ></div>
    </div>

    <!-- Question -->
    <div class="mb-6">
      <h3 class="text-xl font-semibold mb-4">{currentQuestion.question}</h3>
      
      <!-- Answer Options -->
      <div class="space-y-3">
        {#each currentQuestion.options as option}
          <button
            class="w-full p-4 text-left border rounded-lg transition-all hover:bg-secondary/50 {
              selectedAnswer === option 
                ? 'border-primary bg-primary/10 text-primary' 
                : 'border-border hover:border-primary/50'
            }"
            onclick={() => handleAnswerSelect(option)}
            disabled={isLoading}
          >
            {option}
          </button>
        {/each}
      </div>
    </div>

    <!-- Navigation -->
    <div class="flex items-center justify-between">
      <Button
        variant="outline"
        onclick={onPreviousQuestion}
        disabled={currentQuestionIndex === 0 || isLoading}
      >
        Previous
      </Button>

      <div class="flex gap-2">
        {#if isLastQuestion}
          <Button
            onclick={onSubmitQuiz}
            disabled={!canProceed || isLoading}
          >
            {#if isLoading}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {/if}
            Submit Quiz
          </Button>
        {:else}
          <Button
            onclick={handleNextQuestion}
            disabled={!canProceed || isLoading}
          >
            Next Question
          </Button>
        {/if}
      </div>
    </div>
  </Card>
{/if}