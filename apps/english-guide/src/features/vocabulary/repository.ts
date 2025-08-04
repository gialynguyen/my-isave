import { EntityManager, EntityRepository, QueryOrder, type FilterQuery, type FindOptions } from '@mikro-orm/core';
import { VocabularyEntity, VocabularyProgressEntity } from './entity';
import { UserEntity } from '../user/entity';
import { DifficultyLevel, type VocabularyFilters } from '$lib/types';

export class VocabularyRepository extends EntityRepository<VocabularyEntity> {
  constructor(em: EntityManager) {
    super(em, VocabularyEntity);
  }

  /**
   * Find vocabulary words with optional filtering and pagination
   */
  async findWithFilters(filters: VocabularyFilters = {}): Promise<{
    items: VocabularyEntity[];
    total: number;
  }> {
    const where: FilterQuery<VocabularyEntity> = {};
    
    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }
    
    if (filters.tags && filters.tags.length > 0) {
      // Use simple array containment check for now
      where.tags = { $contains: filters.tags };
    }

    const findOptions: FindOptions<VocabularyEntity> = {
      orderBy: { word: QueryOrder.ASC },
      limit: filters.limit || 20,
      offset: filters.offset || 0
    };

    const [items, total] = await this.findAndCount(where, findOptions);
    
    return { items, total };
  }

  /**
   * Search vocabulary words by word or definition
   */
  async searchWords(query: string, filters: VocabularyFilters = {}): Promise<{
    items: VocabularyEntity[];
    total: number;
  }> {
    const where: FilterQuery<VocabularyEntity> = {
      $or: [
        { word: { $ilike: `%${query}%` } },
        { definition: { $ilike: `%${query}%` } }
      ]
    };
    
    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }
    
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { $contains: filters.tags };
    }

    const findOptions: FindOptions<VocabularyEntity> = {
      orderBy: { word: QueryOrder.ASC },
      limit: filters.limit || 20,
      offset: filters.offset || 0
    };

    const [items, total] = await this.findAndCount(where, findOptions);
    
    return { items, total };
  }

  /**
   * Find words by difficulty level
   */
  async findByDifficulty(difficulty: DifficultyLevel, limit: number = 20): Promise<VocabularyEntity[]> {
    return this.find(
      { difficulty },
      { 
        orderBy: { word: QueryOrder.ASC },
        limit 
      }
    );
  }

  /**
   * Find words by tags
   */
  async findByTags(tags: string[], limit: number = 20): Promise<VocabularyEntity[]> {
    return this.find(
      { tags: { $contains: tags } },
      { 
        orderBy: { word: QueryOrder.ASC },
        limit 
      }
    );
  }

  /**
   * Find random words for practice
   */
  async findRandomWords(difficulty?: DifficultyLevel, count: number = 10): Promise<VocabularyEntity[]> {
    const where: FilterQuery<VocabularyEntity> = {};
    
    if (difficulty) {
      where.difficulty = difficulty;
    }

    // For now, just return ordered results - random selection can be added later
    return this.find(where, {
      orderBy: { word: QueryOrder.ASC },
      limit: count
    });
  }

  /**
   * Get vocabulary statistics
   */
  async getStatistics(): Promise<{
    totalWords: number;
    byDifficulty: Record<DifficultyLevel, number>;
    totalTags: number;
  }> {
    const totalWords = await this.count();
    
    // Get counts by difficulty
    const beginnerCount = await this.count({ difficulty: DifficultyLevel.BEGINNER });
    const intermediateCount = await this.count({ difficulty: DifficultyLevel.INTERMEDIATE });
    const advancedCount = await this.count({ difficulty: DifficultyLevel.ADVANCED });

    const byDifficulty: Record<DifficultyLevel, number> = {
      [DifficultyLevel.BEGINNER]: beginnerCount,
      [DifficultyLevel.INTERMEDIATE]: intermediateCount,
      [DifficultyLevel.ADVANCED]: advancedCount
    };

    // For now, return 0 for total tags - this would need raw SQL to implement properly
    const totalTags = 0;

    return {
      totalWords,
      byDifficulty,
      totalTags
    };
  }

  /**
   * Find words that need review based on spaced repetition
   */
  async findWordsForReview(userId: string, limit: number = 10): Promise<VocabularyEntity[]> {
    // For now, return a simple list - proper spaced repetition would need more complex queries
    return this.find({}, {
      orderBy: { word: QueryOrder.ASC },
      limit
    });
  }

  /**
   * Find words for a user based on their proficiency level and progress
   */
  async findWordsForUser(
    userId: string, 
    difficulty: DifficultyLevel, 
    excludeMastered: boolean = true,
    limit: number = 20
  ): Promise<VocabularyEntity[]> {
    // For now, just return words by difficulty - proper user progress filtering would need joins
    return this.find(
      { difficulty },
      {
        orderBy: { word: QueryOrder.ASC },
        limit
      }
    );
  }
}

export class VocabularyProgressRepository extends EntityRepository<VocabularyProgressEntity> {
  constructor(em: EntityManager) {
    super(em, VocabularyProgressEntity);
  }

  /**
   * Find or create progress record for a user and vocabulary word
   */
  async findOrCreate(userId: string, vocabularyId: string): Promise<VocabularyProgressEntity> {
    let progress = await this.findOne({
      user: userId,
      vocabulary: vocabularyId
    });

    if (!progress) {
      const user = await this.em.findOneOrFail(UserEntity, userId);
      const vocabulary = await this.em.findOneOrFail(VocabularyEntity, vocabularyId);
      
      progress = new VocabularyProgressEntity();
      progress.user = user;
      progress.vocabulary = vocabulary;
      progress.masteryLevel = 0;
      progress.lastReviewed = new Date();
      progress.nextReview = new Date();
      progress.correctAttempts = 0;
      progress.totalAttempts = 0;
      
      this.em.persist(progress);
    }

    return progress;
  }

  /**
   * Update progress after a learning session
   */
  async updateProgress(
    userId: string, 
    vocabularyId: string, 
    correct: boolean,
    responseTime?: number
  ): Promise<VocabularyProgressEntity> {
    const progress = await this.findOrCreate(userId, vocabularyId);
    
    progress.totalAttempts += 1;
    if (correct) {
      progress.correctAttempts += 1;
    }
    
    // Calculate new mastery level based on success rate
    const successRate = progress.correctAttempts / progress.totalAttempts;
    progress.masteryLevel = Math.round(successRate * 100);
    
    // Update review dates using spaced repetition algorithm
    progress.lastReviewed = new Date();
    progress.nextReview = this.calculateNextReview(progress.masteryLevel, correct, responseTime);
    
    await this.em.persistAndFlush(progress);
    return progress;
  }

  /**
   * Get user's progress statistics
   */
  async getUserProgressStats(userId: string): Promise<{
    totalWords: number;
    masteredWords: number;
    averageMasteryLevel: number;
    wordsNeedingReview: number;
  }> {
    const progressRecords = await this.find({ user: userId });
    
    const totalWords = progressRecords.length;
    const masteredWords = progressRecords.filter(p => p.masteryLevel >= 80).length;
    const averageMasteryLevel = totalWords > 0 
      ? progressRecords.reduce((sum, p) => sum + p.masteryLevel, 0) / totalWords 
      : 0;
    
    const now = new Date();
    const wordsNeedingReview = progressRecords.filter(p => p.nextReview <= now).length;
    
    return {
      totalWords,
      masteredWords,
      averageMasteryLevel: Math.round(averageMasteryLevel),
      wordsNeedingReview
    };
  }

  /**
   * Get words that need review for spaced repetition
   */
  async getWordsForReview(userId: string, limit: number = 10): Promise<VocabularyProgressEntity[]> {
    const now = new Date();
    
    return this.find(
      {
        user: userId,
        nextReview: { $lte: now }
      },
      {
        populate: ['vocabulary'],
        orderBy: { nextReview: QueryOrder.ASC },
        limit
      }
    );
  }

  /**
   * Calculate next review date using spaced repetition algorithm
   */
  private calculateNextReview(masteryLevel: number, correct: boolean, responseTime?: number): Date {
    const now = new Date();
    let intervalDays: number;
    
    if (correct) {
      // Increase interval based on mastery level
      if (masteryLevel >= 90) {
        intervalDays = 30; // 1 month for well-mastered words
      } else if (masteryLevel >= 70) {
        intervalDays = 14; // 2 weeks for good mastery
      } else if (masteryLevel >= 50) {
        intervalDays = 7; // 1 week for moderate mastery
      } else if (masteryLevel >= 30) {
        intervalDays = 3; // 3 days for low mastery
      } else {
        intervalDays = 1; // 1 day for very low mastery
      }
      
      // Adjust based on response time if provided
      if (responseTime) {
        if (responseTime < 3000) { // Quick response (< 3 seconds)
          intervalDays = Math.round(intervalDays * 1.2);
        } else if (responseTime > 10000) { // Slow response (> 10 seconds)
          intervalDays = Math.round(intervalDays * 0.8);
        }
      }
    } else {
      // Incorrect answer - review sooner
      if (masteryLevel >= 50) {
        intervalDays = 1; // Review tomorrow
      } else {
        intervalDays = 0.5; // Review in 12 hours
      }
    }
    
    const nextReview = new Date(now);
    nextReview.setTime(now.getTime() + (intervalDays * 24 * 60 * 60 * 1000));
    
    return nextReview;
  }

  /**
   * Reset progress for a specific word (useful for re-learning)
   */
  async resetProgress(userId: string, vocabularyId: string): Promise<void> {
    const progress = await this.findOne({
      user: userId,
      vocabulary: vocabularyId
    });
    
    if (progress) {
      progress.masteryLevel = 0;
      progress.correctAttempts = 0;
      progress.totalAttempts = 0;
      progress.lastReviewed = new Date();
      progress.nextReview = new Date();
      
      await this.em.persistAndFlush(progress);
    }
  }

  /**
   * Get progress for specific words
   */
  async getProgressForWords(userId: string, vocabularyIds: string[]): Promise<VocabularyProgressEntity[]> {
    return this.find(
      {
        user: userId,
        vocabulary: { $in: vocabularyIds }
      },
      {
        populate: ['vocabulary']
      }
    );
  }
}