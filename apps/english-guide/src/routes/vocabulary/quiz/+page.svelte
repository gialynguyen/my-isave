<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import { Card } from '$lib/components/ui/card';
  import { VocabularyQuiz } from '$lib/components/vocabulary';
  import { ArrowLeft, Target, Settings, Shuffle } from 'lucide-svelte';
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

  interface QuizSettings {
    difficulty: DifficultyLevel | 'mixed';
    questionCount: number;
    timeLimit: number;
    questionTypes: string[];
  }

  let quizState: 'setup' | 'active' | 'complete' = $state('setup');
  let questions: QuizQuestion[] = $state([]);
  let currentQuestionIndex = $state(0);
  let selectedAnswer = $state('');
  let results: QuizResult[] = $state([]);
  let isLoading = $state(false);
  let questionStartTime = $state(0);

  let quizSettings: QuizSettings = $state({
    difficulty: 'mixed',
    questionCount: 10,
    timeLimit: 30,
    questionTypes: ['definition', 'synonym', 'example']
  });

  onMount(() => {
    // Auto-start quiz if coming from a specific word or context
    // For now, we'll show the setup screen
  });

  $inspect("results: ", results);

  async function startQuiz() {
    if (isLoading) return;

    isLoading = true;
    try {
      // Generate quiz questions based on settings
      const generatedQuestions = await generateQuizQuestions();
      
      if (generatedQuestions.length === 0) {
        throw new Error('No questions could be generated');
      }

      questions = generatedQuestions;
      currentQuestionIndex = 0;
      selectedAnswer = '';
      results = [];
      quizState = 'active';
      questionStartTime = Date.now();
    } catch (error) {
      console.error('Error starting quiz:', error);
      // Handle error - show message to user
    } finally {
      isLoading = false;
    }
  }

  async function generateQuizQuestions(): Promise<QuizQuestion[]> {
    // Fetch vocabulary words based on difficulty setting
    const params = new URLSearchParams();
    
    if (quizSettings.difficulty !== 'mixed') {
      params.set('difficulty', quizSettings.difficulty);
    }
    
    params.set('limit', (quizSettings.questionCount * 2).toString()); // Get more words than needed
    
    const response = await fetch(`/api/vocabulary?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch vocabulary words');
    }

    const data = await response.json();
    const vocabularyWords: VocabularyResponse[] = data.items;

    if (vocabularyWords.length === 0) {
      throw new Error('No vocabulary words available');
    }

    // Generate questions from the vocabulary words
    const generatedQuestions: QuizQuestion[] = [];
    const usedWords = new Set<string>();

    for (let i = 0; i < Math.min(quizSettings.questionCount, vocabularyWords.length); i++) {
      const word = vocabularyWords[i];
      if (usedWords.has(word.id)) continue;
      
      usedWords.add(word.id);
      
      // Generate different types of questions
      const questionType = quizSettings.questionTypes[i % quizSettings.questionTypes.length];
      const question = generateQuestion(word, questionType, vocabularyWords);
      
      if (question) {
        generatedQuestions.push(question);
      }
    }

    return generatedQuestions.slice(0, quizSettings.questionCount);
  }

  function generateQuestion(
    word: VocabularyResponse, 
    type: string, 
    allWords: VocabularyResponse[]
  ): QuizQuestion | null {
    const otherWords = allWords.filter(w => w.id !== word.id);
    
    switch (type) {
      case 'definition':
        return {
          word,
          question: `What does "${word.word}" mean?`,
          options: shuffleArray([
            word.definition,
            ...otherWords.slice(0, 3).map(w => w.definition)
          ]),
          correctAnswer: word.definition,
          explanation: `"${word.word}" means: ${word.definition}`
        };
        
      case 'synonym':
        // This is a simplified version - in a real app, you'd have synonym data
        return {
          word,
          question: `Which word is closest in meaning to "${word.word}"?`,
          options: shuffleArray([
            word.word,
            ...otherWords.slice(0, 3).map(w => w.word)
          ]),
          correctAnswer: word.word,
          explanation: `The correct answer is "${word.word}". ${word.definition}`
        };
        
      case 'example':
        if (word.examples.length === 0) return null;
        
        const example = word.examples[0];
        const maskedExample = example.replace(new RegExp(word.word, 'gi'), '____');
        
        return {
          word,
          question: `Fill in the blank: "${maskedExample}"`,
          options: shuffleArray([
            word.word,
            ...otherWords.slice(0, 3).map(w => w.word)
          ]),
          correctAnswer: word.word,
          explanation: `The complete sentence is: "${example}"`
        };
        
      default:
        return null;
    }
  }

  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function handleAnswerSelect(answer: string) {
    selectedAnswer = answer;
  }

  function handleNextQuestion() {
    // Record the result
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const isCorrect = selectedAnswer === questions[currentQuestionIndex].correctAnswer;
    
    results.push({
      questionIndex: currentQuestionIndex,
      selectedAnswer,
      isCorrect,
      timeSpent
    });

    // Move to next question or finish quiz
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      selectedAnswer = '';
      questionStartTime = Date.now();
    } else {
      finishQuiz();
    }
  }

  function handlePreviousQuestion() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      // Restore previous answer if available
      const previousResult = results[currentQuestionIndex];
      selectedAnswer = previousResult?.selectedAnswer || '';
    }
  }

  function handleSubmitQuiz() {
    // Record the final answer before finishing the quiz
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const isCorrect = selectedAnswer === questions[currentQuestionIndex].correctAnswer;
    
    results.push({
      questionIndex: currentQuestionIndex,
      selectedAnswer,
      isCorrect,
      timeSpent
    });

    finishQuiz();
  }

  function finishQuiz() {
    quizState = 'complete';
  }

  function restartQuiz() {
    quizState = 'setup';
    questions = [];
    currentQuestionIndex = 0;
    selectedAnswer = '';
    results = [];
  }

  function goBack() {
    goto('/vocabulary');
  }

  function updateQuizSettings(key: keyof QuizSettings, value: any) {
    quizSettings = { ...quizSettings, [key]: value };
  }
</script>

<svelte:head>
  <title>Vocabulary Quiz - English Guide</title>
  <meta name="description" content="Test your English vocabulary knowledge with AI-generated quizzes" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Back Navigation -->
  <div class="mb-6">
    <Button variant="ghost" onclick={goBack} class="gap-2">
      <ArrowLeft class="h-4 w-4" />
      Back to Vocabulary
    </Button>
  </div>

  {#if quizState === 'setup'}
    <!-- Quiz Setup -->
    <div class="max-w-2xl mx-auto">
      <div class="text-center mb-8">
        <Target class="h-16 w-16 mx-auto mb-4 text-primary" />
        <h1 class="text-3xl font-bold text-foreground mb-2">Vocabulary Quiz</h1>
        <p class="text-muted-foreground">
          Test your vocabulary knowledge with customizable quizzes
        </p>
      </div>

      <Card class="p-6 mb-6">
        <div class="flex items-center gap-2 mb-4">
          <Settings class="h-5 w-5 text-muted-foreground" />
          <h2 class="text-lg font-semibold text-foreground">Quiz Settings</h2>
        </div>

        <div class="space-y-6">
          <!-- Difficulty Level -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">
              Difficulty Level
            </label>
            <div class="flex flex-wrap gap-2">
              <Button
                variant={quizSettings.difficulty === 'mixed' ? 'default' : 'outline'}
                size="sm"
                onclick={() => updateQuizSettings('difficulty', 'mixed')}
              >
                Mixed
              </Button>
              <Button
                variant={quizSettings.difficulty === 'beginner' ? 'default' : 'outline'}
                size="sm"
                onclick={() => updateQuizSettings('difficulty', 'beginner')}
              >
                Beginner
              </Button>
              <Button
                variant={quizSettings.difficulty === 'intermediate' ? 'default' : 'outline'}
                size="sm"
                onclick={() => updateQuizSettings('difficulty', 'intermediate')}
              >
                Intermediate
              </Button>
              <Button
                variant={quizSettings.difficulty === 'advanced' ? 'default' : 'outline'}
                size="sm"
                onclick={() => updateQuizSettings('difficulty', 'advanced')}
              >
                Advanced
              </Button>
            </div>
          </div>

          <!-- Number of Questions -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">
              Number of Questions
            </label>
            <div class="flex gap-2">
              {#each [5, 10, 15, 20] as count}
                <Button
                  variant={quizSettings.questionCount === count ? 'default' : 'outline'}
                  size="sm"
                  onclick={() => updateQuizSettings('questionCount', count)}
                >
                  {count}
                </Button>
              {/each}
            </div>
          </div>

          <!-- Time Limit -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">
              Time per Question (seconds)
            </label>
            <div class="flex gap-2">
              {#each [15, 30, 45, 60] as time}
                <Button
                  variant={quizSettings.timeLimit === time ? 'default' : 'outline'}
                  size="sm"
                  onclick={() => updateQuizSettings('timeLimit', time)}
                >
                  {time}s
                </Button>
              {/each}
            </div>
          </div>
        </div>
      </Card>

      <div class="text-center">
        <Button onclick={startQuiz} disabled={isLoading} size="lg" class="gap-2">
          {#if isLoading}
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          {:else}
            <Shuffle class="h-5 w-5" />
          {/if}
          Start Quiz
        </Button>
      </div>
    </div>
  {:else}
    <!-- Quiz Interface -->
    <div class="max-w-4xl mx-auto">
      <VocabularyQuiz
        {questions}
        {currentQuestionIndex}
        {selectedAnswer}
        showResult={quizState === 'complete'}
        {results}
        timeLimit={quizSettings.timeLimit}
        onAnswerSelect={handleAnswerSelect}
        onNextQuestion={handleNextQuestion}
        onPreviousQuestion={handlePreviousQuestion}
        onSubmitQuiz={handleSubmitQuiz}
        onRestartQuiz={restartQuiz}
        {isLoading}
      />
    </div>
  {/if}
</div>