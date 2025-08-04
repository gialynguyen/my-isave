import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MikroORM, EntityManager } from '@mikro-orm/core';
import { VocabularyRepository, VocabularyProgressRepository } from './repository';
import { VocabularyEntity, VocabularyProgressEntity } from './entity';
import { UserEntity } from '../user/entity';
import { DifficultyLevel } from '$lib/types';

// Mock MikroORM setup
const mockORM = {
  em: {
    findOneOrFail: vi.fn(),
    persist: vi.fn(),
    persistAndFlush: vi.fn(),
    removeAndFlush: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findAndCount: vi.fn(),
    count: vi.fn(),
    createQueryBuilder: vi.fn()
  }
} as unknown as MikroORM;

const mockEM = mockORM.em as unknown as EntityManager;

describe('VocabularyRepository', () => {
  let vocabularyRepo: VocabularyRepository;
  let mockQueryBuilder: any;

  beforeEach(() => {
    vocabularyRepo = new VocabularyRepository(mockEM);
    
    mockQueryBuilder = {
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      orderByRaw: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      execute: vi.fn(),
      getResult: vi.fn()
    };
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('findWithFilters', () => {
    it('should find vocabulary words with basic filters', async () => {
      const mockWords = [
        { id: '1', word: 'hello', difficulty: DifficultyLevel.BEGINNER },
        { id: '2', word: 'world', difficulty: DifficultyLevel.BEGINNER }
      ];
      
      vocabularyRepo.findAndCount = vi.fn().mockResolvedValue([mockWords, 2]);

      const result = await vocabularyRepo.findWithFilters({
        difficulty: DifficultyLevel.BEGINNER,
        limit: 10,
        offset: 0
      });

      expect(result.items).toEqual(mockWords);
      expect(result.total).toBe(2);
      expect(vocabularyRepo.findAndCount).toHaveBeenCalledWith(
        { difficulty: DifficultyLevel.BEGINNER },
        expect.objectContaining({
          limit: 10,
          offset: 0
        })
      );
    });

    it('should filter by tags using overlap', async () => {
      const mockWords = [
        { id: '1', word: 'hello', tags: ['greeting', 'basic'] }
      ];
      
      vocabularyRepo.findAndCount = vi.fn().mockResolvedValue([mockWords, 1]);

      await vocabularyRepo.findWithFilters({
        tags: ['greeting'],
        limit: 10
      });

      expect(vocabularyRepo.findAndCount).toHaveBeenCalledWith(
        { tags: { $overlap: ['greeting'] } },
        expect.any(Object)
      );
    });

    it('should use default pagination when not specified', async () => {
      vocabularyRepo.findAndCount = vi.fn().mockResolvedValue([[], 0]);

      await vocabularyRepo.findWithFilters({});

      expect(vocabularyRepo.findAndCount).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          limit: 20,
          offset: 0
        })
      );
    });
  });

  describe('searchWords', () => {
    it('should search words by word or definition', async () => {
      const mockWords = [
        { id: '1', word: 'hello', definition: 'a greeting' }
      ];
      
      vocabularyRepo.findAndCount = vi.fn().mockResolvedValue([mockWords, 1]);

      await vocabularyRepo.searchWords('hello');

      expect(vocabularyRepo.findAndCount).toHaveBeenCalledWith(
        {
          $or: [
            { word: { $ilike: '%hello%' } },
            { definition: { $ilike: '%hello%' } }
          ]
        },
        expect.any(Object)
      );
    });

    it('should combine search with filters', async () => {
      vocabularyRepo.findAndCount = vi.fn().mockResolvedValue([[], 0]);

      await vocabularyRepo.searchWords('hello', {
        difficulty: DifficultyLevel.BEGINNER,
        tags: ['greeting']
      });

      expect(vocabularyRepo.findAndCount).toHaveBeenCalledWith(
        {
          $or: [
            { word: { $ilike: '%hello%' } },
            { definition: { $ilike: '%hello%' } }
          ],
          difficulty: DifficultyLevel.BEGINNER,
          tags: { $overlap: ['greeting'] }
        },
        expect.any(Object)
      );
    });
  });

  describe('findRandomWords', () => {
    it('should find random words with difficulty filter', async () => {
      const mockWords = [
        { id: '1', word: 'hello', difficulty: DifficultyLevel.BEGINNER }
      ];
      
      vocabularyRepo.createQueryBuilder = vi.fn().mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getResult.mockResolvedValue(mockWords);

      const result = await vocabularyRepo.findRandomWords(DifficultyLevel.BEGINNER, 5);

      expect(vocabularyRepo.createQueryBuilder).toHaveBeenCalledWith('v');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ difficulty: DifficultyLevel.BEGINNER });
      expect(mockQueryBuilder.orderByRaw).toHaveBeenCalledWith('RANDOM()');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockWords);
    });

    it('should find random words without difficulty filter', async () => {
      const mockWords = [
        { id: '1', word: 'hello' },
        { id: '2', word: 'world' }
      ];
      
      vocabularyRepo.createQueryBuilder = vi.fn().mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getResult.mockResolvedValue(mockWords);

      await vocabularyRepo.findRandomWords(undefined, 10);

      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('getStatistics', () => {
    it('should return vocabulary statistics', async () => {
      vocabularyRepo.count = vi.fn().mockResolvedValue(100);
      vocabularyRepo.createQueryBuilder = vi.fn().mockReturnValue(mockQueryBuilder);
      
      mockQueryBuilder.execute
        .mockResolvedValueOnce([
          { difficulty: DifficultyLevel.BEGINNER, count: '50' },
          { difficulty: DifficultyLevel.INTERMEDIATE, count: '30' },
          { difficulty: DifficultyLevel.ADVANCED, count: '20' }
        ])
        .mockResolvedValueOnce([
          { tag: 'greeting' },
          { tag: 'basic' },
          { tag: 'advanced' }
        ]);

      const result = await vocabularyRepo.getStatistics();

      expect(result).toEqual({
        totalWords: 100,
        byDifficulty: {
          [DifficultyLevel.BEGINNER]: 50,
          [DifficultyLevel.INTERMEDIATE]: 30,
          [DifficultyLevel.ADVANCED]: 20
        },
        totalTags: 3
      });
    });
  });

  describe('findWordsForReview', () => {
    it('should find words that need review', async () => {
      const mockWords = [
        { id: '1', word: 'hello' }
      ];
      
      vocabularyRepo.createQueryBuilder = vi.fn().mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getResult.mockResolvedValue(mockWords);

      const result = await vocabularyRepo.findWordsForReview('user1', 5);

      expect(vocabularyRepo.createQueryBuilder).toHaveBeenCalledWith('v');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('v.userProgress', 'vp');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({
        'vp.user': 'user1',
        'vp.nextReview': { $lte: expect.any(Date) }
      });
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockWords);
    });
  });

  describe('findWordsForUser', () => {
    it('should find words for user excluding mastered ones', async () => {
      const mockWords = [
        { id: '1', word: 'hello', difficulty: DifficultyLevel.BEGINNER }
      ];
      
      vocabularyRepo.createQueryBuilder = vi.fn().mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getResult.mockResolvedValue(mockWords);

      const result = await vocabularyRepo.findWordsForUser(
        'user1',
        DifficultyLevel.BEGINNER,
        true,
        10
      );

      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ difficulty: DifficultyLevel.BEGINNER });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith({
        $or: [
          { 'vp.masteryLevel': { $lt: 80 } },
          { 'vp.masteryLevel': null }
        ]
      });
      expect(result).toEqual(mockWords);
    });

    it('should include mastered words when excludeMastered is false', async () => {
      vocabularyRepo.createQueryBuilder = vi.fn().mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getResult.mockResolvedValue([]);

      await vocabularyRepo.findWordsForUser(
        'user1',
        DifficultyLevel.BEGINNER,
        false,
        10
      );

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });
  });
});

describe('VocabularyProgressRepository', () => {
  let progressRepo: VocabularyProgressRepository;
  let mockUser: UserEntity;
  let mockVocabulary: VocabularyEntity;

  beforeEach(() => {
    progressRepo = new VocabularyProgressRepository(mockEM);
    
    mockUser = { id: 'user1' } as UserEntity;
    mockVocabulary = { id: 'vocab1' } as VocabularyEntity;
    
    vi.clearAllMocks();
  });

  describe('findOrCreate', () => {
    it('should return existing progress if found', async () => {
      const existingProgress = {
        id: 'progress1',
        user: mockUser,
        vocabulary: mockVocabulary,
        masteryLevel: 50
      } as VocabularyProgressEntity;
      
      progressRepo.findOne = vi.fn().mockResolvedValue(existingProgress);

      const result = await progressRepo.findOrCreate('user1', 'vocab1');

      expect(result).toBe(existingProgress);
      expect(progressRepo.findOne).toHaveBeenCalledWith({
        user: 'user1',
        vocabulary: 'vocab1'
      });
    });

    it('should create new progress if not found', async () => {
      progressRepo.findOne = vi.fn().mockResolvedValue(null);
      mockEM.findOneOrFail = vi.fn()
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockVocabulary);

      const result = await progressRepo.findOrCreate('user1', 'vocab1');

      expect(result).toBeInstanceOf(VocabularyProgressEntity);
      expect(result.user).toBe(mockUser);
      expect(result.vocabulary).toBe(mockVocabulary);
      expect(result.masteryLevel).toBe(0);
      expect(mockEM.persist).toHaveBeenCalledWith(result);
    });
  });

  describe('updateProgress', () => {
    it('should update progress for correct answer', async () => {
      const mockProgress = {
        id: 'progress1',
        totalAttempts: 4,
        correctAttempts: 2,
        masteryLevel: 50
      } as VocabularyProgressEntity;
      
      progressRepo.findOrCreate = vi.fn().mockResolvedValue(mockProgress);

      const result = await progressRepo.updateProgress('user1', 'vocab1', true);

      expect(result.totalAttempts).toBe(5);
      expect(result.correctAttempts).toBe(3);
      expect(result.masteryLevel).toBe(60); // 3/5 = 60%
      expect(result.lastReviewed).toBeInstanceOf(Date);
      expect(result.nextReview).toBeInstanceOf(Date);
      expect(mockEM.persistAndFlush).toHaveBeenCalledWith(result);
    });

    it('should update progress for incorrect answer', async () => {
      const mockProgress = {
        id: 'progress1',
        totalAttempts: 4,
        correctAttempts: 3,
        masteryLevel: 75
      } as VocabularyProgressEntity;
      
      progressRepo.findOrCreate = vi.fn().mockResolvedValue(mockProgress);

      const result = await progressRepo.updateProgress('user1', 'vocab1', false);

      expect(result.totalAttempts).toBe(5);
      expect(result.correctAttempts).toBe(3);
      expect(result.masteryLevel).toBe(60); // 3/5 = 60%
    });
  });

  describe('getUserProgressStats', () => {
    it('should calculate user progress statistics', async () => {
      const mockProgressRecords = [
        { masteryLevel: 90, nextReview: new Date(Date.now() - 1000) }, // needs review
        { masteryLevel: 85, nextReview: new Date(Date.now() + 1000) }, // mastered, no review needed
        { masteryLevel: 60, nextReview: new Date(Date.now() - 1000) }, // needs review
        { masteryLevel: 40, nextReview: new Date(Date.now() + 1000) }
      ] as VocabularyProgressEntity[];
      
      progressRepo.find = vi.fn().mockResolvedValue(mockProgressRecords);

      const result = await progressRepo.getUserProgressStats('user1');

      expect(result).toEqual({
        totalWords: 4,
        masteredWords: 2, // >= 80%
        averageMasteryLevel: 69, // (90+85+60+40)/4 = 68.75, rounded to 69
        wordsNeedingReview: 2
      });
    });

    it('should handle empty progress records', async () => {
      progressRepo.find = vi.fn().mockResolvedValue([]);

      const result = await progressRepo.getUserProgressStats('user1');

      expect(result).toEqual({
        totalWords: 0,
        masteredWords: 0,
        averageMasteryLevel: 0,
        wordsNeedingReview: 0
      });
    });
  });

  describe('getWordsForReview', () => {
    it('should get words that need review', async () => {
      const mockProgressRecords = [
        {
          id: 'progress1',
          nextReview: new Date(Date.now() - 1000),
          vocabulary: { id: 'vocab1', word: 'hello' }
        }
      ] as VocabularyProgressEntity[];
      
      progressRepo.find = vi.fn().mockResolvedValue(mockProgressRecords);

      const result = await progressRepo.getWordsForReview('user1', 5);

      expect(progressRepo.find).toHaveBeenCalledWith(
        {
          user: 'user1',
          nextReview: { $lte: expect.any(Date) }
        },
        {
          populate: ['vocabulary'],
          orderBy: { nextReview: expect.any(String) },
          limit: 5
        }
      );
      expect(result).toEqual(mockProgressRecords);
    });
  });

  describe('resetProgress', () => {
    it('should reset progress for a word', async () => {
      const mockProgress = {
        id: 'progress1',
        masteryLevel: 80,
        correctAttempts: 8,
        totalAttempts: 10
      } as VocabularyProgressEntity;
      
      progressRepo.findOne = vi.fn().mockResolvedValue(mockProgress);

      await progressRepo.resetProgress('user1', 'vocab1');

      expect(mockProgress.masteryLevel).toBe(0);
      expect(mockProgress.correctAttempts).toBe(0);
      expect(mockProgress.totalAttempts).toBe(0);
      expect(mockProgress.lastReviewed).toBeInstanceOf(Date);
      expect(mockProgress.nextReview).toBeInstanceOf(Date);
      expect(mockEM.persistAndFlush).toHaveBeenCalledWith(mockProgress);
    });

    it('should do nothing if progress not found', async () => {
      progressRepo.findOne = vi.fn().mockResolvedValue(null);

      await progressRepo.resetProgress('user1', 'vocab1');

      expect(mockEM.persistAndFlush).not.toHaveBeenCalled();
    });
  });

  describe('calculateNextReview', () => {
    it('should calculate longer intervals for higher mastery levels', () => {
      // Access private method for testing
      const calculateNextReview = (progressRepo as any).calculateNextReview.bind(progressRepo);
      
      const highMasteryResult = calculateNextReview(90, true);
      const lowMasteryResult = calculateNextReview(30, true);
      
      expect(highMasteryResult.getTime()).toBeGreaterThan(lowMasteryResult.getTime());
    });

    it('should calculate shorter intervals for incorrect answers', () => {
      const calculateNextReview = (progressRepo as any).calculateNextReview.bind(progressRepo);
      
      const correctResult = calculateNextReview(70, true);
      const incorrectResult = calculateNextReview(70, false);
      
      expect(incorrectResult.getTime()).toBeLessThan(correctResult.getTime());
    });

    it('should adjust intervals based on response time', () => {
      const calculateNextReview = (progressRepo as any).calculateNextReview.bind(progressRepo);
      
      const quickResult = calculateNextReview(70, true, 2000); // 2 seconds
      const slowResult = calculateNextReview(70, true, 15000); // 15 seconds
      
      expect(quickResult.getTime()).toBeGreaterThan(slowResult.getTime());
    });
  });
});