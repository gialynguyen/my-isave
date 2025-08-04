import { DifficultyLevel, QuestionType } from '$lib/types';

// Test creation and management types
export interface CreateTestRequest {
  title: string;
  description?: string;
  difficulty: DifficultyLevel;
  questions: TestQuestionInput[];
  tags?: string[];
  timeLimit?: number;
  passingScore?: number;
}

export interface TestQuestionInput {
  type: QuestionType;
  content: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: DifficultyLevel;
  topic?: string;
  points?: number;
}

export interface UpdateTestRequest {
  title?: string;
  description?: string;
  difficulty?: DifficultyLevel;
  questions?: TestQuestionInput[];
  tags?: string[];
  timeLimit?: number;
  passingScore?: number;
  isActive?: boolean;
}

// Test taking types
export interface StartTestResponse {
  testId: string;
  resultId: string;
  questions: TestQuestionDisplay[];
  timeLimit: number;
  totalQuestions: number;
}

export interface TestQuestionDisplay {
  id: string;
  type: QuestionType;
  content: string;
  options?: string[];
  points: number;
}

export interface SubmitAnswerRequest {
  resultId: string;
  questionId: string;
  answer: string;
  timeSpent: number;
}

export interface CompleteTestRequest {
  resultId: string;
  totalTimeSpent: number;
}

// Test result and feedback types
export interface TestResultSummary {
  id: string;
  testTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  isPassed: boolean;
  completedAt: Date;
  feedback: TestResultFeedback;
}

export interface TestResultFeedback {
  overallFeedback: string;
  strengths: string[];
  areasForImprovement: string[];
  recommendedStudyTopics: string[];
}

export interface DetailedTestResult extends TestResultSummary {
  answers: TestAnswerDetail[];
  analysis: TestPerformanceAnalysis;
}

export interface TestAnswerDetail {
  questionId: string;
  questionContent: string;
  questionType: QuestionType;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  timeSpent: number;
  points: number;
  earnedPoints: number;
}

export interface TestPerformanceAnalysis {
  questionTypePerformance: Record<QuestionType, QuestionTypeStats>;
  difficultyPerformance: Record<DifficultyLevel, DifficultyStats>;
  topicPerformance: Record<string, TopicStats>;
  timeAnalysis: TimeAnalysis;
}

export interface QuestionTypeStats {
  total: number;
  correct: number;
  percentage: number;
  averageTime: number;
}

export interface DifficultyStats {
  total: number;
  correct: number;
  percentage: number;
  averageTime: number;
}

export interface TopicStats {
  total: number;
  correct: number;
  percentage: number;
  averageTime: number;
}

export interface TimeAnalysis {
  totalTime: number;
  averageTimePerQuestion: number;
  fastestQuestion: number;
  slowestQuestion: number;
  timeDistribution: number[];
}

// Test filtering and search types
export interface TestFilters {
  difficulty?: DifficultyLevel;
  tags?: string[];
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface TestSearchQuery {
  query?: string;
  filters?: TestFilters;
  sortBy?: 'title' | 'difficulty' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// Test statistics and analytics types
export interface TestStatistics {
  totalTests: number;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  popularTests: TestPopularityStats[];
  difficultyDistribution: Record<DifficultyLevel, number>;
}

export interface TestPopularityStats {
  testId: string;
  title: string;
  attempts: number;
  averageScore: number;
  passRate: number;
}

export interface UserTestProgress {
  testsCompleted: number;
  averageScore: number;
  bestScore: number;
  totalTimeSpent: number;
  recentResults: TestResultSummary[];
  strengthAreas: string[];
  improvementAreas: string[];
}

// AI-generated test types
export interface GenerateTestRequest {
  topics: string[];
  difficulty: DifficultyLevel;
  questionCount: number;
  questionTypes?: QuestionType[];
  timeLimit?: number;
  userLevel?: string;
}

export interface AITestGenerationResponse {
  questions: TestQuestionInput[];
  metadata: {
    topics: string[];
    estimatedDuration: number;
    skillsAssessed: string[];
  };
}