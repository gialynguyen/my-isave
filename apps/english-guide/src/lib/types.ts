// Core types for the English Guide app

export enum ProficiencyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  FILL_IN_BLANK = 'fill_in_blank',
  PRONUNCIATION = 'pronunciation',
  CONVERSATION = 'conversation'
}

export enum AIProvider {
  OPENAI = 'openai',
  OPENROUTER = 'openrouter',
  CUSTOM = 'custom'
}

export enum AITask {
  VOCABULARY_EXPLANATION = 'vocabulary_explanation',
  CONVERSATION_RESPONSE = 'conversation_response',
  PRONUNCIATION_ANALYSIS = 'pronunciation_analysis',
  TEST_GENERATION = 'test_generation',
  TEST_EVALUATION = 'test_evaluation'
}

// Learning preferences interface
export interface LearningPreferences {
  preferredAIProvider?: AIProvider;
  studyReminders?: boolean;
  difficultyPreference?: DifficultyLevel;
  focusAreas?: string[];
  dailyGoalMinutes?: number;
}

// Progress tracking interface
export interface ProgressStats {
  vocabularyMastered: number;
  pronunciationAccuracy: number;
  conversationFluency: number;
  totalStudyTime: number;
  streakDays: number;
  lastActiveDate: Date;
}

// Vocabulary progress interface
export interface VocabularyProgress {
  wordId: string;
  masteryLevel: number; // 0-100
  lastReviewed: Date;
  nextReview: Date;
  correctAttempts: number;
  totalAttempts: number;
}

// Conversation message interface
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

// Conversation feedback interface
export interface ConversationFeedback {
  fluencyScore: number;
  grammarScore: number;
  vocabularyScore: number;
  suggestions: string[];
  strengths: string[];
  areasForImprovement: string[];
}

// Pronunciation feedback interface
export interface PronunciationFeedback {
  accuracy: number;
  detectedPhonemes: string[];
  suggestions: string[];
  commonMistakes: string[];
}

// Test question interface
export interface TestQuestion {
  id: string;
  type: QuestionType;
  content: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: DifficultyLevel;
}

// Test answer interface
export interface TestAnswer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

// Test result interface
export interface TestResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  feedback: string;
  detailedResults: TestAnswer[];
}

// AI generation options
export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

// Vocabulary explanation interface
export interface VocabularyExplanation {
  word: string;
  definition: string;
  examples: string[];
  pronunciation: string;
  difficulty: DifficultyLevel;
  synonyms: string[];
  antonyms: string[];
}

// Conversation context interface
export interface ConversationContext {
  scenario: string;
  userLevel: ProficiencyLevel;
  conversationHistory: ConversationMessage[];
  userPreferences: LearningPreferences;
}

// Conversation scenario interface
export interface ConversationScenario {
  id: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  tags: string[];
}

// Conversation response interface
export interface ConversationResponse {
  message: string;
  audioUrl?: string;
  suggestions?: string[];
}

// Phonetic exercise interface
export interface PhoneticExercise {
  id: string;
  phoneme: string;
  words: string[];
  instructions: string;
  difficulty: DifficultyLevel;
}

// Pronunciation result interface
export interface PronunciationResult {
  accuracy: number;
  feedback: PronunciationFeedback;
  audioUrl?: string;
}

// Pronunciation stats interface
export interface PronunciationStats {
  overallAccuracy: number;
  improvedPhonemes: string[];
  challengingPhonemes: string[];
  practiceTime: number;
}

// Vocabulary filters interface
export interface VocabularyFilters {
  difficulty?: DifficultyLevel;
  tags?: string[];
  masteryLevel?: number;
  limit?: number;
  offset?: number;
}