import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EntityManager } from '@mikro-orm/core';
import { VocabularyService } from './service';
import { VocabularyEntity, VocabularyProgressEntity } from './entity';
import { UserEntity } from '../user/entity';
import { AIService } from '$lib/ai/service';
import { DifficultyLevel, ProficiencyLevel, AIProvider } from '$lib/types';
import type { VocabularyExplanation } from '$lib/types';

// Mock dependencies
const mockEM = {
  findOneOrFail: vi.fn(),
  persistAndFlush: vi.fn(),
  removeAndFlush: vi.fn()
} as unknown as EntityManager;

const mockAIService = {
  generateVocabularyExplanation: vi.fn()
} as unknown as AIService;

describe('VocabularyService', () => {
  let vocabularyService: VocabularyService;
  let mockVocabularyRepo: any;
  let mockProgressRepo: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    vocabularyService = new VocabularyService({
      entityManager: mockEM,
      aiService: mockAIService
    });

    // Get the repository instances and spy on their methods
    mockVocabularyRepo = (vocabularyService as any).vocabularyRepo;
    mockProgressRepo = (vocabularyService as any).progressRepo;

    // Mock all the methods we need
    mockVocabularyRepo.findWithFilters = vi.fn();
    mockVocabularyRepo.searchWords = vi.fn();
    mockVocabularyRepo.findWordsForUser = vi.fn();
    mockVocabularyRepo.findWordsForReview = vi.fn();
    mockVocabularyRepo.findByDifficulty = vi.fn();
    mockVocabularyRepo.findByTags = vi.fn();
    mockVocabularyRepo.findRandomWords = vi.fn();
    mockVocabularyRepo.getStatistics = vi.fn();
    mockVocabularyRepo.findOneOrFail = vi.fn();

    mockProgressRepo.updateProgress = vi.fn();
    mockProgressRepo.getUserProgressStats = vi.fn();
    mockProgressRepo.getWordsForReview = vi.fn();
    mockProgressRepo.resetProgress = vi.fn();
    mockProgressRepo.getProgressForWords = vi.fn();
    mockProgressRepo.find = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getVocabularyWords', () => {
    it('should return paginated vocabulary words', async () => {
      const mockWords = [
        {
          id: '1',
          word: 'hello',
          definition: 'a greeting',
          difficulty: DifficultyLevel.BEGINNER,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ] as VocabularyEntity[];

      mockVocabularyRepo.findWithFilters.mockResolvedValue({
        items: mockWords,
        total: 1
      });

      const result = await vocabularyService.getVocabularyWords({
        difficulty: DifficultyLevel.BEGINNER,
        limit: 10,
        offset: 0
      });

      expect(result).toEqual({
        items: expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            word: 'hello',
            definition: 'a greeting'
          })
        ]),
        total: 1,
        page: 1,
        limit: 10
      });

      expect(mockVocabularyRepo.findWithFilters).toHaveBeenCalledWith({
        difficulty: DifficultyLevel.BEGINNER,
        limit: 10,
        offset: 0
      });
    });

    it('should calculate correct page number', async () => {
      mockVocabularyRepo.findWithFilters.mockResolvedValue({
        items: [],
        total: 0
      });

      const result = await vocabularyService.getVocabularyWords({
        limit: 10,
        offset: 20
      });

      expect(result.page).toBe(3); // offset 20 / limit 10 + 1 = 3
    });
  });

  describe('searchVocabularyWords', () => {
    it('should search vocabulary words with query and filters', async () => {
      const mockWords = [
        {
          id: '1',
          word: 'hello',
          definition: 'a greeting',
          difficulty: DifficultyLevel.BEGINNER
        }
      ] as VocabularyEntity[];

      mockVocabularyRepo.searchWords.mockResolvedValue({
        items: mockWords,
        total: 1
      });

      const result = await vocabularyService.searchVocabularyWords('hello', {
        difficulty: DifficultyLevel.BEGINNER
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].word).toBe('hello');
      expect(mockVocabularyRepo.searchWords).toHaveBeenCalledWith('hello', {
        difficulty: DifficultyLevel.BEGINNER
      });
    });
  });

  describe('getWordsForUser', () => {
    it('should get words for user based on proficiency level', async () => {
      const mockWords = [
        {
          id: '1',
          word: 'hello',
          difficulty: DifficultyLevel.BEGINNER
        }
      ] as VocabularyEntity[];

      mockVocabularyRepo.findWordsForUser.mockResolvedValue(mockWords);

      const result = await vocabularyService.getWordsForUser(
        'user1',
        ProficiencyLevel.BEGINNER,
        true,
        10
      );

      expect(result).toHaveLength(1);
      expect(result[0].word).toBe('hello');
      expect(mockVocabularyRepo.findWordsForUser).toHaveBeenCalledWith(
        'user1',
        DifficultyLevel.BEGINNER,
        true,
        10
      );
    });

    it('should map proficiency levels correctly', async () => {
      mockVocabularyRepo.findWordsForUser.mockResolvedValue([]);

      await vocabularyService.getWordsForUser('user1', ProficiencyLevel.ADVANCED);

      expect(mockVocabularyRepo.findWordsForUser).toHaveBeenCalledWith(
        'user1',
        DifficultyLevel.ADVANCED,
        expect.any(Boolean),
        expect.any(Number)
      );
    });
  });

  describe('getSpacedRepetitionWords', () => {
    it('should return spaced repetition session', async () => {
      const mockProgressRecords = [
        {
          vocabulary: {
            id: '1',
            word: 'hello',
            definition: 'a greeting'
          }
        }
      ] as VocabularyProgressEntity[];

      mockProgressRepo.getWordsForReview.mockResolvedValue(mockProgressRecords);

      const result = await vocabularyService.getSpacedRepetitionWords('user1', 5);

      expect(result.words).toHaveLength(1);
      expect(result.words[0].word).toBe('hello');
      expect(result.totalWords).toBe(1);
      expect(result.sessionId).toMatch(/^sr_user1_\d+$/);
      expect(mockProgressRepo.getWordsForReview).toHaveBeenCalledWith('user1', 5);
    });
  });

  describe('recordProgress', () => {
    it('should record user progress for a word', async () => {
      const mockProgress = {
        id: 'progress1',
        vocabulary: { id: 'vocab1' },
        masteryLevel: 75,
        correctAttempts: 3,
        totalAttempts: 4
      } as VocabularyProgressEntity;

      mockProgressRepo.updateProgress.mockResolvedValue(mockProgress);

      const result = await vocabularyService.recordProgress('user1', 'vocab1', true, 5000);

      expect(result).toEqual(
        expect.objectContaining({
          id: 'progress1',
          vocabularyId: 'vocab1',
          masteryLevel: 75
        })
      );

      expect(mockProgressRepo.updateProgress).toHaveBeenCalledWith(
        'user1',
        'vocab1',
        true,
        5000
      );
    });
  });

  describe('getUserProgressStats', () => {
    it('should return comprehensive user progress statistics', async () => {
      const mockBasicStats = {
        totalWords: 10,
        masteredWords: 5,
        averageMasteryLevel: 70,
        wordsNeedingReview: 3
      };

      const mockProgressRecords = [
        {
          vocabulary: { difficulty: DifficultyLevel.BEGINNER },
          masteryLevel: 90
        },
        {
          vocabulary: { difficulty: DifficultyLevel.BEGINNER },
          masteryLevel: 60
        },
        {
          vocabulary: { difficulty: DifficultyLevel.INTERMEDIATE },
          masteryLevel: 80
        }
      ] as VocabularyProgressEntity[];

      mockProgressRepo.getUserProgressStats.mockResolvedValue(mockBasicStats);
      mockProgressRepo.find.mockResolvedValue(mockProgressRecords);

      const result = await vocabularyService.getUserProgressStats('user1');

      expect(result).toEqual({
        ...mockBasicStats,
        progressByDifficulty: {
          [DifficultyLevel.BEGINNER]: {
            total: 2,
            mastered: 1,
            averageMastery: 75 // (90 + 60) / 2
          },
          [DifficultyLevel.INTERMEDIATE]: {
            total: 1,
            mastered: 1,
            averageMastery: 80
          },
          [DifficultyLevel.ADVANCED]: {
            total: 0,
            mastered: 0,
            averageMastery: 0
          }
        }
      });
    });
  });

  describe('generateExplanation', () => {
    it('should generate AI-powered vocabulary explanation', async () => {
      const mockExplanation: VocabularyExplanation = {
        word: 'hello',
        definition: 'a greeting',
        examples: ['Hello, how are you?'],
        pronunciation: '/həˈloʊ/',
        difficulty: DifficultyLevel.BEGINNER,
        synonyms: ['hi', 'greetings'],
        antonyms: ['goodbye']
      };

      (mockAIService.generateVocabularyExplanation as any).mockResolvedValue(mockExplanation);

      const result = await vocabularyService.generateExplanation(
        'hello',
        ProficiencyLevel.BEGINNER,
        AIProvider.OPENAI
      );

      expect(result).toEqual(mockExplanation);
      expect(mockAIService.generateVocabularyExplanation).toHaveBeenCalledWith(
        'hello',
        ProficiencyLevel.BEGINNER,
        AIProvider.OPENAI
      );
    });
  });

  describe('getLearningRecommendations', () => {
    it('should provide personalized learning recommendations', async () => {
      const mockUser = {
        id: 'user1',
        proficiencyLevel: ProficiencyLevel.BEGINNER
      } as UserEntity;

      const mockStats = {
        totalWords: 20,
        masteredWords: 10,
        averageMasteryLevel: 70,
        wordsNeedingReview: 5,
        progressByDifficulty: {
          [DifficultyLevel.BEGINNER]: {
            total: 15,
            mastered: 8,
            averageMastery: 50 // Below 60, should be focus area
          },
          [DifficultyLevel.INTERMEDIATE]: {
            total: 5,
            mastered: 2,
            averageMastery: 80
          },
          [DifficultyLevel.ADVANCED]: {
            total: 0,
            mastered: 0,
            averageMastery: 0
          }
        }
      };

      const mockRecommendedWords = [
        { id: '1', word: 'hello' }
      ] as any[];

      mockEM.findOneOrFail.mockResolvedValue(mockUser);
      vocabularyService.getUserProgressStats = vi.fn().mockResolvedValue(mockStats);
      vocabularyService.getWordsForUser = vi.fn().mockResolvedValue(mockRecommendedWords);

      const result = await vocabularyService.getLearningRecommendations('user1');

      expect(result.focusAreas).toContain('beginner level vocabulary');
      expect(result.suggestedDifficulty).toBe(DifficultyLevel.BEGINNER);
      expect(result.recommendedWords).toEqual(mockRecommendedWords);
      expect(result.studyPlan.reviewWords).toBe(5);
      expect(result.studyPlan.newWords).toBe(10); // 15 - 5 review words
      expect(result.studyPlan.estimatedTime).toBe(40); // (5 * 2) + (10 * 3)
    });

    it('should suggest higher difficulty when current level is mastered', async () => {
      const mockUser = {
        id: 'user1',
        proficiencyLevel: ProficiencyLevel.BEGINNER
      } as UserEntity;

      const mockStats = {
        totalWords: 20,
        masteredWords: 18,
        averageMasteryLevel: 90,
        wordsNeedingReview: 2,
        progressByDifficulty: {
          [DifficultyLevel.BEGINNER]: {
            total: 15,
            mastered: 14,
            averageMastery: 85 // Above 80, mastered
          },
          [DifficultyLevel.INTERMEDIATE]: {
            total: 5,
            mastered: 4,
            averageMastery: 80
          },
          [DifficultyLevel.ADVANCED]: {
            total: 0,
            mastered: 0,
            averageMastery: 0
          }
        }
      };

      mockEM.findOneOrFail.mockResolvedValue(mockUser);
      vocabularyService.getUserProgressStats = vi.fn().mockResolvedValue(mockStats);
      vocabularyService.getWordsForUser = vi.fn().mockResolvedValue([]);

      const result = await vocabularyService.getLearningRecommendations('user1');

      expect(result.suggestedDifficulty).toBe(DifficultyLevel.INTERMEDIATE);
    });
  });

  describe('generateVocabularyQuiz', () => {
    it('should generate a vocabulary quiz with AI-powered questions', async () => {
      const mockWords = [
        {
          id: '1',
          word: 'hello',
          definition: 'a greeting',
          examples: ['Hello, how are you?'],
          tags: ['greeting'],
          difficulty: DifficultyLevel.BEGINNER
        }
      ] as VocabularyEntity[];

      const mockExplanation: VocabularyExplanation = {
        word: 'hello',
        definition: 'a greeting',
        examples: ['Hello, how are you?'],
        pronunciation: '/həˈloʊ/',
        difficulty: DifficultyLevel.BEGINNER,
        synonyms: ['hi', 'greetings'],
        antonyms: ['goodbye', 'farewell']
      };

      const mockOtherWords = [
        { id: '2', definition: 'a farewell' },
        { id: '3', definition: 'a question' },
        { id: '4', definition: 'an answer' }
      ] as VocabularyEntity[];

      mockVocabularyRepo.findByDifficulty.mockResolvedValueOnce(mockWords);
      vocabularyService.generateExplanation = vi.fn().mockResolvedValue(mockExplanation);
      mockVocabularyRepo.findByDifficulty.mockResolvedValueOnce(mockOtherWords);
      mockVocabularyRepo.findByTags.mockResolvedValue([]);

      const result = await vocabularyService.generateVocabularyQuiz(
        'user1',
        DifficultyLevel.BEGINNER,
        1
      );

      expect(result.words).toHaveLength(1);
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].word.word).toBe('hello');
      expect(result.questions[0].options).toHaveLength(4);
      expect(result.questions[0].correctAnswer).toBeDefined();
      expect(result.questions[0].explanation).toBeDefined();
    });

    it('should create different types of questions', async () => {
      const mockWords = [
        {
          id: '1',
          word: 'hello',
          definition: 'a greeting',
          examples: ['Hello, how are you?'],
          tags: ['greeting'],
          difficulty: DifficultyLevel.BEGINNER
        }
      ] as VocabularyEntity[];

      const mockExplanation: VocabularyExplanation = {
        word: 'hello',
        definition: 'a greeting',
        examples: ['Hello, how are you?'],
        pronunciation: '/həˈloʊ/',
        difficulty: DifficultyLevel.BEGINNER,
        synonyms: ['hi', 'greetings'],
        antonyms: ['goodbye', 'farewell']
      };

      mockVocabularyRepo.findByDifficulty.mockResolvedValue(mockWords);
      vocabularyService.generateExplanation = vi.fn().mockResolvedValue(mockExplanation);
      mockVocabularyRepo.findByDifficulty.mockResolvedValue([]);
      mockVocabularyRepo.findByTags.mockResolvedValue([]);

      // Mock Math.random to control question type selection
      const originalRandom = Math.random;
      Math.random = vi.fn().mockReturnValue(0.1); // Should select 'definition' type

      const result = await vocabularyService.generateVocabularyQuiz(
        'user1',
        DifficultyLevel.BEGINNER,
        1
      );

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0]).toBeDefined();
      expect(result.questions[0].question).toBeDefined();

      // Restore Math.random
      Math.random = originalRandom;
    });
  });

  describe('batchUpdateProgress', () => {
    it('should update progress for multiple words', async () => {
      const mockResults = [
        { vocabularyId: 'vocab1', correct: true, responseTime: 3000 },
        { vocabularyId: 'vocab2', correct: false, responseTime: 8000 }
      ];

      const mockProgressResponses = [
        { id: 'progress1', vocabularyId: 'vocab1', masteryLevel: 80 },
        { id: 'progress2', vocabularyId: 'vocab2', masteryLevel: 40 }
      ];

      vocabularyService.recordProgress = vi.fn()
        .mockResolvedValueOnce(mockProgressResponses[0])
        .mockResolvedValueOnce(mockProgressResponses[1]);

      const result = await vocabularyService.batchUpdateProgress('user1', mockResults);

      expect(result).toEqual(mockProgressResponses);
      expect(vocabularyService.recordProgress).toHaveBeenCalledTimes(2);
      expect(vocabularyService.recordProgress).toHaveBeenNthCalledWith(
        1, 'user1', 'vocab1', true, 3000
      );
      expect(vocabularyService.recordProgress).toHaveBeenNthCalledWith(
        2, 'user1', 'vocab2', false, 8000
      );
    });
  });

  describe('helper methods', () => {
    it('should map proficiency to difficulty correctly', () => {
      const mapProficiencyToDifficulty = (vocabularyService as any).mapProficiencyToDifficulty;
      
      expect(mapProficiencyToDifficulty(ProficiencyLevel.BEGINNER)).toBe(DifficultyLevel.BEGINNER);
      expect(mapProficiencyToDifficulty(ProficiencyLevel.INTERMEDIATE)).toBe(DifficultyLevel.INTERMEDIATE);
      expect(mapProficiencyToDifficulty(ProficiencyLevel.ADVANCED)).toBe(DifficultyLevel.ADVANCED);
    });

    it('should map difficulty to proficiency correctly', () => {
      const mapDifficultyToProficiency = (vocabularyService as any).mapDifficultyToProficiency;
      
      expect(mapDifficultyToProficiency(DifficultyLevel.BEGINNER)).toBe(ProficiencyLevel.BEGINNER);
      expect(mapDifficultyToProficiency(DifficultyLevel.INTERMEDIATE)).toBe(ProficiencyLevel.INTERMEDIATE);
      expect(mapDifficultyToProficiency(DifficultyLevel.ADVANCED)).toBe(ProficiencyLevel.ADVANCED);
    });

    it('should shuffle array correctly', () => {
      const originalArray = [1, 2, 3, 4, 5];
      const shuffledArray = (vocabularyService as any).shuffleArray(originalArray);
      
      expect(shuffledArray).toHaveLength(originalArray.length);
      expect(shuffledArray.every(item => originalArray.includes(item))).toBe(true);
      expect(shuffledArray).not.toBe(originalArray); // Should be a new array
    });
  });

  describe('CRUD operations', () => {
    it('should create vocabulary word', async () => {
      const createData = {
        word: 'hello',
        definition: 'a greeting',
        pronunciation: '/həˈloʊ/',
        examples: ['Hello there!'],
        difficulty: DifficultyLevel.BEGINNER,
        tags: ['greeting'],
        audioUrl: 'http://example.com/hello.mp3'
      };

      const result = await vocabularyService.createVocabularyWord(createData);

      expect(result.word).toBe('hello');
      expect(result.definition).toBe('a greeting');
      expect(mockEM.persistAndFlush).toHaveBeenCalled();
    });

    it('should update vocabulary word', async () => {
      const mockVocabulary = {
        id: '1',
        word: 'hello',
        definition: 'old definition'
      } as VocabularyEntity;

      mockVocabularyRepo.findOneOrFail.mockResolvedValue(mockVocabulary);

      const updateData = {
        definition: 'new definition',
        pronunciation: '/həˈloʊ/'
      };

      const result = await vocabularyService.updateVocabularyWord('1', updateData);

      expect(mockVocabulary.definition).toBe('new definition');
      expect(mockVocabulary.pronunciation).toBe('/həˈloʊ/');
      expect(mockEM.persistAndFlush).toHaveBeenCalledWith(mockVocabulary);
    });

    it('should delete vocabulary word', async () => {
      const mockVocabulary = { id: '1', word: 'hello' } as VocabularyEntity;
      mockVocabularyRepo.findOneOrFail.mockResolvedValue(mockVocabulary);

      await vocabularyService.deleteVocabularyWord('1');

      expect(mockEM.removeAndFlush).toHaveBeenCalledWith(mockVocabulary);
    });

    it('should get vocabulary word by ID', async () => {
      const mockVocabulary = {
        id: '1',
        word: 'hello',
        definition: 'a greeting'
      } as VocabularyEntity;

      mockVocabularyRepo.findOneOrFail.mockResolvedValue(mockVocabulary);

      const result = await vocabularyService.getVocabularyWordById('1');

      expect(result.word).toBe('hello');
      expect(result.definition).toBe('a greeting');
    });
  });
});