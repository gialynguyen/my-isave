import { EntityManager } from '@mikro-orm/core';
import { VocabularyRepository, VocabularyProgressRepository } from './repository';
import { VocabularyEntity, VocabularyProgressEntity } from './entity';
import { UserEntity } from '../user/entity';
import { AIService } from '$lib/ai/service';
import { 
  DifficultyLevel, 
  ProficiencyLevel, 
  type VocabularyFilters, 
  type VocabularyExplanation,
  type AIProvider 
} from '$lib/types';
import type { 
  CreateVocabularyRequest, 
  UpdateVocabularyRequest,
  VocabularyResponse,
  VocabularyProgressResponse,
  VocabularyListResponse
} from './types';
import { mapVocabularyEntityToResponse, mapVocabularyProgressEntityToResponse } from './types';

export interface VocabularyServiceOptions {
  entityManager: EntityManager;
  aiService: AIService;
}

export interface SpacedRepetitionSession {
  words: VocabularyResponse[];
  totalWords: number;
  sessionId: string;
}

export interface VocabularyStats {
  totalWords: number;
  masteredWords: number;
  averageMasteryLevel: number;
  wordsNeedingReview: number;
  progressByDifficulty: Record<DifficultyLevel, {
    total: number;
    mastered: number;
    averageMastery: number;
  }>;
}

export interface LearningRecommendation {
  recommendedWords: VocabularyResponse[];
  focusAreas: string[];
  suggestedDifficulty: DifficultyLevel;
  studyPlan: {
    newWords: number;
    reviewWords: number;
    estimatedTime: number; // in minutes
  };
}

export class VocabularyService {
  private em: EntityManager;
  private vocabularyRepo: VocabularyRepository;
  private progressRepo: VocabularyProgressRepository;
  private aiService: AIService;

  constructor(options: VocabularyServiceOptions) {
    this.em = options.entityManager;
    this.vocabularyRepo = new VocabularyRepository(this.em);
    this.progressRepo = new VocabularyProgressRepository(this.em);
    this.aiService = options.aiService;
  }

  /**
   * Get vocabulary words with filtering and pagination
   */
  async getVocabularyWords(filters: VocabularyFilters = {}): Promise<VocabularyListResponse> {
    const { items, total } = await this.vocabularyRepo.findWithFilters(filters);
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    
    return {
      items: items.map(mapVocabularyEntityToResponse),
      total,
      page: Math.floor(offset / limit) + 1,
      limit
    };
  }

  /**
   * Search vocabulary words
   */
  async searchVocabularyWords(
    query: string, 
    filters: VocabularyFilters = {}
  ): Promise<VocabularyListResponse> {
    const { items, total } = await this.vocabularyRepo.searchWords(query, filters);
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    
    return {
      items: items.map(mapVocabularyEntityToResponse),
      total,
      page: Math.floor(offset / limit) + 1,
      limit
    };
  }

  /**
   * Get vocabulary words for a specific user based on their level and progress
   */
  async getWordsForUser(
    userId: string, 
    level: ProficiencyLevel,
    excludeMastered: boolean = true,
    limit: number = 20
  ): Promise<VocabularyResponse[]> {
    // Map proficiency level to difficulty level
    const difficulty = this.mapProficiencyToDifficulty(level);
    
    const words = await this.vocabularyRepo.findWordsForUser(
      userId, 
      difficulty, 
      excludeMastered, 
      limit
    );
    
    return words.map(mapVocabularyEntityToResponse);
  }

  /**
   * Get words for spaced repetition review
   */
  async getSpacedRepetitionWords(userId: string, limit: number = 10): Promise<SpacedRepetitionSession> {
    const progressRecords = await this.progressRepo.getWordsForReview(userId, limit);
    const words = progressRecords.map(p => mapVocabularyEntityToResponse(p.vocabulary));
    
    // Generate a session ID for tracking
    const sessionId = `sr_${userId}_${Date.now()}`;
    
    return {
      words,
      totalWords: words.length,
      sessionId
    };
  }

  /**
   * Record user progress for a vocabulary word
   */
  async recordProgress(
    userId: string, 
    vocabularyId: string, 
    correct: boolean,
    responseTime?: number
  ): Promise<VocabularyProgressResponse> {
    const progress = await this.progressRepo.updateProgress(
      userId, 
      vocabularyId, 
      correct, 
      responseTime
    );
    
    return mapVocabularyProgressEntityToResponse(progress);
  }

  /**
   * Get user's vocabulary progress statistics
   */
  async getUserProgressStats(userId: string): Promise<VocabularyStats> {
    const basicStats = await this.progressRepo.getUserProgressStats(userId);
    
    // Get progress by difficulty level
    const progressByDifficulty: Record<DifficultyLevel, {
      total: number;
      mastered: number;
      averageMastery: number;
    }> = {
      [DifficultyLevel.BEGINNER]: { total: 0, mastered: 0, averageMastery: 0 },
      [DifficultyLevel.INTERMEDIATE]: { total: 0, mastered: 0, averageMastery: 0 },
      [DifficultyLevel.ADVANCED]: { total: 0, mastered: 0, averageMastery: 0 }
    };

    // Get detailed progress by difficulty
    const allProgress = await this.progressRepo.find(
      { user: userId },
      { populate: ['vocabulary'] }
    );

    for (const progress of allProgress) {
      const difficulty = progress.vocabulary.difficulty;
      progressByDifficulty[difficulty].total += 1;
      
      if (progress.masteryLevel >= 80) {
        progressByDifficulty[difficulty].mastered += 1;
      }
    }

    // Calculate average mastery by difficulty
    for (const difficulty of Object.keys(progressByDifficulty) as DifficultyLevel[]) {
      const difficultyProgress = allProgress.filter(p => p.vocabulary.difficulty === difficulty);
      if (difficultyProgress.length > 0) {
        const totalMastery = difficultyProgress.reduce((sum, p) => sum + p.masteryLevel, 0);
        progressByDifficulty[difficulty].averageMastery = Math.round(totalMastery / difficultyProgress.length);
      }
    }

    return {
      ...basicStats,
      progressByDifficulty
    };
  }

  /**
   * Generate AI-powered vocabulary explanation
   */
  async generateExplanation(
    word: string, 
    userLevel: ProficiencyLevel,
    provider?: AIProvider
  ): Promise<VocabularyExplanation> {
    return this.aiService.generateVocabularyExplanation(word, userLevel, provider);
  }

  /**
   * Get personalized learning recommendations
   */
  async getLearningRecommendations(userId: string): Promise<LearningRecommendation> {
    const user = await this.em.findOneOrFail(UserEntity, userId);
    const stats = await this.getUserProgressStats(userId);
    
    // Determine focus areas based on progress
    const focusAreas: string[] = [];
    let suggestedDifficulty = this.mapProficiencyToDifficulty(user.proficiencyLevel);
    
    // Analyze weak areas
    for (const [difficulty, progress] of Object.entries(stats.progressByDifficulty)) {
      if (progress.total > 0 && progress.averageMastery < 60) {
        focusAreas.push(`${difficulty} level vocabulary`);
      }
    }
    
    // Suggest difficulty based on current progress
    if (stats.progressByDifficulty[DifficultyLevel.BEGINNER].averageMastery >= 80) {
      suggestedDifficulty = DifficultyLevel.INTERMEDIATE;
    }
    if (stats.progressByDifficulty[DifficultyLevel.INTERMEDIATE].averageMastery >= 80) {
      suggestedDifficulty = DifficultyLevel.ADVANCED;
    }
    
    // Don't suggest higher than user's current proficiency level unless they've mastered it
    const userDifficulty = this.mapProficiencyToDifficulty(user.proficiencyLevel);
    if (suggestedDifficulty > userDifficulty && stats.progressByDifficulty[userDifficulty].averageMastery < 80) {
      suggestedDifficulty = userDifficulty;
    }
    
    // Get recommended words
    const recommendedWords = await this.getWordsForUser(
      userId, 
      user.proficiencyLevel, 
      true, 
      10
    );
    
    // Calculate study plan
    const reviewWords = stats.wordsNeedingReview;
    const newWords = Math.max(5, 15 - reviewWords); // Balance new and review words
    const estimatedTime = (reviewWords * 2) + (newWords * 3); // 2 min per review, 3 min per new word
    
    return {
      recommendedWords,
      focusAreas,
      suggestedDifficulty,
      studyPlan: {
        newWords,
        reviewWords,
        estimatedTime
      }
    };
  }

  /**
   * Create a new vocabulary word
   */
  async createVocabularyWord(data: CreateVocabularyRequest): Promise<VocabularyResponse> {
    const vocabulary = new VocabularyEntity();
    vocabulary.word = data.word;
    vocabulary.definition = data.definition;
    vocabulary.pronunciation = data.pronunciation;
    vocabulary.examples = data.examples || [];
    vocabulary.difficulty = data.difficulty || DifficultyLevel.BEGINNER;
    vocabulary.tags = data.tags || [];
    vocabulary.audioUrl = data.audioUrl;
    
    await this.em.persistAndFlush(vocabulary);
    
    return mapVocabularyEntityToResponse(vocabulary);
  }

  /**
   * Update an existing vocabulary word
   */
  async updateVocabularyWord(
    id: string, 
    data: UpdateVocabularyRequest
  ): Promise<VocabularyResponse> {
    const vocabulary = await this.vocabularyRepo.findOneOrFail(id);
    
    if (data.definition !== undefined) vocabulary.definition = data.definition;
    if (data.pronunciation !== undefined) vocabulary.pronunciation = data.pronunciation;
    if (data.examples !== undefined) vocabulary.examples = data.examples;
    if (data.difficulty !== undefined) vocabulary.difficulty = data.difficulty;
    if (data.tags !== undefined) vocabulary.tags = data.tags;
    if (data.audioUrl !== undefined) vocabulary.audioUrl = data.audioUrl;
    
    await this.em.persistAndFlush(vocabulary);
    
    return mapVocabularyEntityToResponse(vocabulary);
  }

  /**
   * Delete a vocabulary word
   */
  async deleteVocabularyWord(id: string): Promise<void> {
    const vocabulary = await this.vocabularyRepo.findOneOrFail(id);
    await this.em.removeAndFlush(vocabulary);
  }

  /**
   * Get vocabulary word by ID
   */
  async getVocabularyWordById(id: string): Promise<VocabularyResponse> {
    const vocabulary = await this.vocabularyRepo.findOneOrFail(id);
    return mapVocabularyEntityToResponse(vocabulary);
  }

  /**
   * Get random vocabulary words for practice
   */
  async getRandomWords(
    difficulty?: DifficultyLevel, 
    count: number = 10
  ): Promise<VocabularyResponse[]> {
    const words = await this.vocabularyRepo.findRandomWords(difficulty, count);
    return words.map(mapVocabularyEntityToResponse);
  }

  /**
   * Get vocabulary statistics
   */
  async getVocabularyStatistics(): Promise<{
    totalWords: number;
    byDifficulty: Record<DifficultyLevel, number>;
    totalTags: number;
  }> {
    return this.vocabularyRepo.getStatistics();
  }

  /**
   * Reset user progress for a specific word
   */
  async resetWordProgress(userId: string, vocabularyId: string): Promise<void> {
    await this.progressRepo.resetProgress(userId, vocabularyId);
  }

  /**
   * Get user progress for specific words
   */
  async getUserProgressForWords(
    userId: string, 
    vocabularyIds: string[]
  ): Promise<VocabularyProgressResponse[]> {
    const progressRecords = await this.progressRepo.getProgressForWords(userId, vocabularyIds);
    return progressRecords.map(mapVocabularyProgressEntityToResponse);
  }

  /**
   * Batch update progress for multiple words (useful for quiz results)
   */
  async batchUpdateProgress(
    userId: string, 
    results: Array<{
      vocabularyId: string;
      correct: boolean;
      responseTime?: number;
    }>
  ): Promise<VocabularyProgressResponse[]> {
    const updatedProgress: VocabularyProgressResponse[] = [];
    
    for (const result of results) {
      const progress = await this.recordProgress(
        userId,
        result.vocabularyId,
        result.correct,
        result.responseTime
      );
      updatedProgress.push(progress);
    }
    
    return updatedProgress;
  }

  /**
   * Get words that need review based on spaced repetition algorithm
   */
  async getWordsNeedingReview(userId: string, limit: number = 20): Promise<VocabularyResponse[]> {
    const words = await this.vocabularyRepo.findWordsForReview(userId, limit);
    return words.map(mapVocabularyEntityToResponse);
  }

  /**
   * Generate a vocabulary quiz with AI-powered questions
   */
  async generateVocabularyQuiz(
    userId: string,
    difficulty: DifficultyLevel,
    wordCount: number = 10,
    provider?: AIProvider
  ): Promise<{
    words: VocabularyResponse[];
    questions: Array<{
      word: VocabularyResponse;
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
    }>;
  }> {
    // Get words for the quiz
    const words = await this.vocabularyRepo.findByDifficulty(difficulty, wordCount);
    const wordResponses = words.map(mapVocabularyEntityToResponse);
    
    // Generate AI-powered questions for each word
    const questions = [];
    
    for (const word of wordResponses) {
      // Generate explanation to get additional context
      const explanation = await this.generateExplanation(
        word.word, 
        this.mapDifficultyToProficiency(word.difficulty),
        provider
      );
      
      // Create different types of questions
      const questionTypes = ['definition', 'synonym', 'usage'];
      const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
      
      let question: string;
      let options: string[];
      let correctAnswer: string;
      let explanationText: string;
      
      switch (questionType) {
        case 'definition':
          question = `What does "${word.word}" mean?`;
          correctAnswer = word.definition;
          options = [correctAnswer];
          
          // Add some distractors (this would be better with AI generation)
          const otherWords = await this.vocabularyRepo.findByDifficulty(difficulty, 20);
          const distractors = otherWords
            .filter(w => w.id !== word.id)
            .slice(0, 3)
            .map(w => w.definition);
          options.push(...distractors);
          
          explanationText = `"${word.word}" means ${word.definition}. ${explanation.examples[0] || ''}`;
          break;
          
        case 'synonym':
          question = `Which word is closest in meaning to "${word.word}"?`;
          correctAnswer = explanation.synonyms[0] || word.word;
          options = [correctAnswer];
          
          // Add distractors
          options.push(...explanation.antonyms.slice(0, 2));
          options.push(word.word); // Add the original word as a distractor
          
          explanationText = `"${word.word}" is similar to "${correctAnswer}". ${explanation.examples[0] || ''}`;
          break;
          
        case 'usage':
        default:
          question = `Complete the sentence: "${word.examples[0]?.replace(word.word, '____') || `The ____ was very important.`}"`;
          correctAnswer = word.word;
          options = [correctAnswer];
          
          // Add distractors
          const similarWords = await this.vocabularyRepo.findByTags(word.tags, 10);
          const usageDistractors = similarWords
            .filter(w => w.id !== word.id)
            .slice(0, 3)
            .map(w => w.word);
          options.push(...usageDistractors);
          
          explanationText = `The correct word is "${word.word}". ${word.definition}`;
          break;
      }
      
      // Shuffle options
      options = this.shuffleArray(options);
      
      questions.push({
        word,
        question,
        options,
        correctAnswer,
        explanation: explanationText
      });
    }
    
    return {
      words: wordResponses,
      questions
    };
  }

  /**
   * Helper method to map proficiency level to difficulty level
   */
  private mapProficiencyToDifficulty(proficiency: ProficiencyLevel): DifficultyLevel {
    switch (proficiency) {
      case ProficiencyLevel.BEGINNER:
        return DifficultyLevel.BEGINNER;
      case ProficiencyLevel.INTERMEDIATE:
        return DifficultyLevel.INTERMEDIATE;
      case ProficiencyLevel.ADVANCED:
        return DifficultyLevel.ADVANCED;
      default:
        return DifficultyLevel.BEGINNER;
    }
  }

  /**
   * Helper method to map difficulty level to proficiency level
   */
  private mapDifficultyToProficiency(difficulty: DifficultyLevel): ProficiencyLevel {
    switch (difficulty) {
      case DifficultyLevel.BEGINNER:
        return ProficiencyLevel.BEGINNER;
      case DifficultyLevel.INTERMEDIATE:
        return ProficiencyLevel.INTERMEDIATE;
      case DifficultyLevel.ADVANCED:
        return ProficiencyLevel.ADVANCED;
      default:
        return ProficiencyLevel.BEGINNER;
    }
  }

  /**
   * Helper method to shuffle an array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}