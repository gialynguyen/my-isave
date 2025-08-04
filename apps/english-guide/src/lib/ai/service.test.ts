import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIService } from './service';
import { AIProvider, AITask, ProficiencyLevel, DifficultyLevel, QuestionType } from '$lib/types';
import type { ConversationContext, TestAnswer } from '$lib/types';

// Create mock instances
const mockOpenAIInstance = {
  generateResponse: vi.fn(),
  generateStructuredResponse: vi.fn(),
  isAvailable: vi.fn().mockResolvedValue(true),
  isConfigured: vi.fn().mockReturnValue(true)
};

const mockOpenRouterInstance = {
  generateResponse: vi.fn(),
  generateStructuredResponse: vi.fn(),
  isAvailable: vi.fn().mockResolvedValue(true),
  isConfigured: vi.fn().mockReturnValue(true)
};

const mockCustomInstance = {
  generateResponse: vi.fn(),
  generateStructuredResponse: vi.fn(),
  isAvailable: vi.fn().mockResolvedValue(true),
  isConfigured: vi.fn().mockReturnValue(true)
};

// Mock the provider classes
vi.mock('./providers/openai', () => ({
  OpenAIClient: vi.fn().mockImplementation(() => mockOpenAIInstance)
}));

vi.mock('./providers/openrouter', () => ({
  OpenRouterClient: vi.fn().mockImplementation(() => mockOpenRouterInstance)
}));

vi.mock('./providers/custom', () => ({
  CustomModelClient: vi.fn().mockImplementation(() => mockCustomInstance)
}));

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService({
      providers: {
        [AIProvider.OPENAI]: {
          provider: AIProvider.OPENAI,
          apiKey: 'test-openai-key',
          model: 'gpt-4o-mini'
        },
        [AIProvider.OPENROUTER]: {
          provider: AIProvider.OPENROUTER,
          apiKey: 'test-openrouter-key',
          model: 'anthropic/claude-3.5-sonnet'
        },
        [AIProvider.CUSTOM]: {
          provider: AIProvider.CUSTOM,
          apiKey: 'test-custom-key',
          baseUrl: 'http://localhost:11434/api'
        }
      },
      defaultProvider: AIProvider.OPENAI,
      fallbackOrder: [AIProvider.OPENAI, AIProvider.OPENROUTER, AIProvider.CUSTOM]
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateVocabularyExplanation', () => {
    it('should generate vocabulary explanation successfully', async () => {
      const mockExplanation = {
        word: 'hello',
        definition: 'A greeting used when meeting someone',
        examples: ['Hello, how are you?', 'She said hello to her neighbor'],
        pronunciation: '/həˈloʊ/',
        difficulty: 'beginner',
        synonyms: ['hi', 'greetings'],
        antonyms: ['goodbye', 'farewell']
      };

      mockOpenAIInstance.generateStructuredResponse.mockResolvedValue(mockExplanation);

      const result = await aiService.generateVocabularyExplanation('hello', ProficiencyLevel.BEGINNER);

      expect(result).toEqual(mockExplanation);
      expect(mockOpenAIInstance.generateStructuredResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          task: AITask.VOCABULARY_EXPLANATION,
          prompt: expect.stringContaining('Explain the English word "hello"'),
          context: { word: 'hello', level: ProficiencyLevel.BEGINNER }
        }),
        expect.any(Object)
      );
    });

    it('should use specified provider', async () => {
      const mockExplanation = {
        word: 'test',
        definition: 'A procedure to assess knowledge',
        examples: ['Take a test'],
        pronunciation: '/test/',
        difficulty: 'intermediate',
        synonyms: ['exam'],
        antonyms: []
      };

      mockOpenRouterInstance.generateStructuredResponse.mockResolvedValue(mockExplanation);

      await aiService.generateVocabularyExplanation('test', ProficiencyLevel.INTERMEDIATE, AIProvider.OPENROUTER);

      expect(mockOpenRouterInstance.generateStructuredResponse).toHaveBeenCalled();
      expect(mockOpenAIInstance.generateStructuredResponse).not.toHaveBeenCalled();
    });

    it('should fallback to alternative provider on failure', async () => {
      const mockExplanation = {
        word: 'fallback',
        definition: 'Alternative option',
        examples: ['Use fallback'],
        pronunciation: '/ˈfɔlbæk/',
        difficulty: 'intermediate',
        synonyms: ['backup'],
        antonyms: []
      };

      mockOpenAIInstance.generateStructuredResponse.mockRejectedValue(new Error('OpenAI failed'));
      mockOpenRouterInstance.generateStructuredResponse.mockResolvedValue(mockExplanation);

      const result = await aiService.generateVocabularyExplanation('fallback', ProficiencyLevel.INTERMEDIATE);

      expect(result).toEqual(mockExplanation);
      expect(mockOpenAIInstance.generateStructuredResponse).toHaveBeenCalled();
      expect(mockOpenRouterInstance.generateStructuredResponse).toHaveBeenCalled();
    });
  });

  describe('generateConversationResponse', () => {
    it('should generate conversation response', async () => {
      const mockResponse = {
        content: 'Hello! How can I help you today?',
        usage: { promptTokens: 10, completionTokens: 8, totalTokens: 18 }
      };

      mockOpenRouterInstance.generateResponse.mockResolvedValue(mockResponse);

      const context: ConversationContext = {
        scenario: 'Restaurant ordering',
        userLevel: ProficiencyLevel.INTERMEDIATE,
        conversationHistory: [
          { id: '1', role: 'user', content: 'Hello', timestamp: new Date() }
        ],
        userPreferences: {}
      };

      const result = await aiService.generateConversationResponse(context);

      expect(result).toBe('Hello! How can I help you today?');
      expect(mockOpenRouterInstance.generateResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          task: AITask.CONVERSATION_RESPONSE,
          prompt: expect.stringContaining('Restaurant ordering'),
          context: expect.objectContaining({
            scenario: 'Restaurant ordering',
            userLevel: ProficiencyLevel.INTERMEDIATE
          })
        })
      );
    });
  });

  describe('analyzePronunciation', () => {
    it('should analyze pronunciation and provide feedback', async () => {
      const mockFeedback = {
        accuracy: 85,
        detectedPhonemes: ['/h/', '/ə/', '/ˈloʊ/'],
        suggestions: ['Work on the /oʊ/ sound', 'Practice stress on first syllable'],
        commonMistakes: ['Pronouncing as /hɛloʊ/ instead of /həˈloʊ/']
      };

      mockOpenAIInstance.generateStructuredResponse.mockResolvedValue(mockFeedback);

      const audioData = new ArrayBuffer(1024);
      const result = await aiService.analyzePronunciation(audioData, 'hello');

      expect(result).toEqual(mockFeedback);
      expect(mockOpenAIInstance.generateStructuredResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          task: AITask.PRONUNCIATION_ANALYSIS,
          prompt: expect.stringContaining('Analyze pronunciation feedback for the word "hello"'),
          context: { targetWord: 'hello', audioLength: 1024 }
        }),
        expect.any(Object)
      );
    });
  });

  describe('generateTest', () => {
    it('should generate test questions', async () => {
      const mockQuestions = {
        questions: [
          {
            id: '1',
            type: QuestionType.MULTIPLE_CHOICE,
            content: 'What is the past tense of "go"?',
            options: ['went', 'goed', 'gone', 'going'],
            correctAnswer: 'went',
            explanation: 'The past tense of "go" is "went"',
            difficulty: DifficultyLevel.BEGINNER
          },
          {
            id: '2',
            type: QuestionType.FILL_IN_BLANK,
            content: 'I _____ to the store yesterday.',
            correctAnswer: 'went',
            explanation: 'Use past tense "went" for completed actions',
            difficulty: DifficultyLevel.BEGINNER
          }
        ]
      };

      mockOpenAIInstance.generateStructuredResponse.mockResolvedValue(mockQuestions);

      const result = await aiService.generateTest('user123', ['grammar', 'verbs'], DifficultyLevel.BEGINNER, 2);

      expect(result).toEqual(mockQuestions.questions);
      expect(mockOpenAIInstance.generateStructuredResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          task: AITask.TEST_GENERATION,
          prompt: expect.stringContaining('Generate 2 English test questions covering these topics: grammar, verbs'),
          context: {
            userId: 'user123',
            topics: ['grammar', 'verbs'],
            difficulty: DifficultyLevel.BEGINNER,
            questionCount: 2
          }
        }),
        expect.any(Object)
      );
    });
  });

  describe('evaluateTestAnswers', () => {
    it('should evaluate test answers and provide feedback', async () => {
      const mockEvaluation = {
        score: 75,
        feedback: 'Good job! You got 3 out of 4 questions correct. Focus on verb tenses for improvement.'
      };

      mockOpenAIInstance.generateStructuredResponse.mockResolvedValue(mockEvaluation);

      const answers: TestAnswer[] = [
        { questionId: '1', userAnswer: 'went', isCorrect: true, timeSpent: 5 },
        { questionId: '2', userAnswer: 'go', isCorrect: false, timeSpent: 8 },
        { questionId: '3', userAnswer: 'running', isCorrect: true, timeSpent: 6 },
        { questionId: '4', userAnswer: 'walked', isCorrect: true, timeSpent: 4 }
      ];

      const result = await aiService.evaluateTestAnswers(answers);

      expect(result).toEqual({
        score: 75,
        totalQuestions: 4,
        correctAnswers: 3,
        timeSpent: 23,
        feedback: 'Good job! You got 3 out of 4 questions correct. Focus on verb tenses for improvement.',
        detailedResults: answers
      });
    });
  });

  describe('provider management', () => {
    it('should get provider status', async () => {
      const status = await aiService.getProviderStatus();

      expect(status).toEqual({
        [AIProvider.OPENAI]: { available: true, configured: true },
        [AIProvider.OPENROUTER]: { available: true, configured: true },
        [AIProvider.CUSTOM]: { available: true, configured: true }
      });
    });

    it('should get configured providers', () => {
      const providers = aiService.getConfiguredProviders();

      expect(providers).toEqual([AIProvider.OPENAI, AIProvider.OPENROUTER, AIProvider.CUSTOM]);
    });

    it('should perform health check', async () => {
      const health = await aiService.healthCheck();

      expect(health).toEqual({
        healthy: true,
        providers: {
          [AIProvider.OPENAI]: true,
          [AIProvider.OPENROUTER]: true,
          [AIProvider.CUSTOM]: true
        }
      });
    });

    it('should handle unhealthy providers in health check', async () => {
      mockOpenAIInstance.isAvailable.mockResolvedValue(false);
      mockOpenRouterInstance.isAvailable.mockRejectedValue(new Error('Network error'));

      const health = await aiService.healthCheck();

      expect(health).toEqual({
        healthy: true, // Custom is still healthy
        providers: {
          [AIProvider.OPENAI]: false,
          [AIProvider.OPENROUTER]: false,
          [AIProvider.CUSTOM]: true
        }
      });
    });
  });

  describe('rate limiting', () => {
    it('should respect rate limits', async () => {
      const rateLimitedService = new AIService({
        providers: {
          [AIProvider.OPENAI]: {
            provider: AIProvider.OPENAI,
            apiKey: 'test-key'
          }
        },
        defaultProvider: AIProvider.OPENAI,
        fallbackOrder: [AIProvider.OPENAI], // Only OpenAI, no fallback
        rateLimits: {
          [AIProvider.OPENAI]: {
            requestsPerMinute: 1,
            requestsPerHour: 10
          }
        },
        retryOptions: {
          maxRetries: 0, // Disable retries for this test
          baseDelay: 10,
          maxDelay: 100
        }
      });

      // First request should succeed
      mockOpenAIInstance.generateStructuredResponse.mockResolvedValue({ word: 'test' });
      await rateLimitedService.generateVocabularyExplanation('test', ProficiencyLevel.BEGINNER);

      // Second request should be rate limited and fail without fallback
      await expect(
        rateLimitedService.generateVocabularyExplanation('test2', ProficiencyLevel.BEGINNER)
      ).rejects.toThrow('All AI providers failed');
    });
  });

  describe('error handling', () => {
    it('should throw error when all providers fail', async () => {
      mockOpenAIInstance.generateStructuredResponse.mockRejectedValue(new Error('OpenAI failed'));
      mockOpenRouterInstance.generateStructuredResponse.mockRejectedValue(new Error('OpenRouter failed'));
      mockCustomInstance.generateStructuredResponse.mockRejectedValue(new Error('Custom failed'));

      await expect(
        aiService.generateVocabularyExplanation('test', ProficiencyLevel.BEGINNER)
      ).rejects.toThrow('All AI providers failed');
    });

    it('should handle provider not configured error', async () => {
      const limitedService = new AIService({
        providers: {}, // No providers configured
        defaultProvider: AIProvider.OPENAI,
        fallbackOrder: [AIProvider.OPENAI] // Only try OpenAI, no fallback
      });

      await expect(
        limitedService.generateVocabularyExplanation('test', ProficiencyLevel.BEGINNER)
      ).rejects.toThrow('All AI providers failed');
    });
  });

  describe('retry mechanisms', () => {
    it('should retry on retryable errors', async () => {
      const retryService = new AIService({
        providers: {
          [AIProvider.OPENAI]: {
            provider: AIProvider.OPENAI,
            apiKey: 'test-key'
          }
        },
        defaultProvider: AIProvider.OPENAI,
        fallbackOrder: [AIProvider.OPENAI],
        retryOptions: {
          maxRetries: 2,
          baseDelay: 10,
          maxDelay: 100
        }
      });

      const mockExplanation = {
        word: 'test',
        definition: 'A procedure',
        examples: ['Take a test'],
        pronunciation: '/test/',
        difficulty: 'beginner',
        synonyms: ['exam'],
        antonyms: []
      };

      // First call fails with retryable error, second succeeds
      mockOpenAIInstance.generateStructuredResponse
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockExplanation);

      const result = await retryService.generateVocabularyExplanation('test', ProficiencyLevel.BEGINNER);

      expect(result).toEqual(mockExplanation);
      expect(mockOpenAIInstance.generateStructuredResponse).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const retryService = new AIService({
        providers: {
          [AIProvider.OPENAI]: {
            provider: AIProvider.OPENAI,
            apiKey: 'test-key'
          },
          [AIProvider.OPENROUTER]: {
            provider: AIProvider.OPENROUTER,
            apiKey: 'test-key'
          }
        },
        defaultProvider: AIProvider.OPENAI,
        fallbackOrder: [AIProvider.OPENAI, AIProvider.OPENROUTER],
        retryOptions: {
          maxRetries: 2,
          baseDelay: 10,
          maxDelay: 100
        }
      });

      const mockExplanation = {
        word: 'test',
        definition: 'A procedure',
        examples: ['Take a test'],
        pronunciation: '/test/',
        difficulty: 'beginner',
        synonyms: ['exam'],
        antonyms: []
      };

      // Reset mocks to ensure clean state
      vi.clearAllMocks();
      
      // Ensure isAvailable returns true for both providers
      mockOpenAIInstance.isAvailable.mockResolvedValue(true);
      mockOpenRouterInstance.isAvailable.mockResolvedValue(true);
      
      // OpenAI fails with non-retryable error, should fallback to OpenRouter immediately
      mockOpenAIInstance.generateStructuredResponse.mockRejectedValue(new Error('Invalid API key'));
      mockOpenRouterInstance.generateStructuredResponse.mockResolvedValue(mockExplanation);

      const result = await retryService.generateVocabularyExplanation('test', ProficiencyLevel.BEGINNER);

      expect(result).toEqual(mockExplanation);
      expect(mockOpenAIInstance.generateStructuredResponse).toHaveBeenCalledTimes(1);
      expect(mockOpenRouterInstance.generateStructuredResponse).toHaveBeenCalledTimes(1);
    });
  });

  describe('prompt templates', () => {
    it('should use prompt templates for vocabulary explanation', async () => {
      const template = aiService.getPromptTemplate(AITask.VOCABULARY_EXPLANATION);
      
      expect(template).toBeDefined();
      expect(template?.system).toContain('expert English teacher');
      expect(template?.userTemplate).toContain('{word}');
      expect(template?.userTemplate).toContain('{level}');
      expect(template?.responseFormat).toBe('json');
    });

    it('should allow updating prompt templates', () => {
      const newTemplate: PromptTemplate = {
        system: 'Custom system prompt',
        userTemplate: 'Custom user template for {word}',
        responseFormat: 'json'
      };

      aiService.updatePromptTemplate(AITask.VOCABULARY_EXPLANATION, newTemplate);
      const updatedTemplate = aiService.getPromptTemplate(AITask.VOCABULARY_EXPLANATION);

      expect(updatedTemplate).toEqual(newTemplate);
    });

    it('should allow updating retry options', () => {
      const newRetryOptions = {
        maxRetries: 5,
        baseDelay: 2000
      };

      aiService.updateRetryOptions(newRetryOptions);
      const updatedOptions = aiService.getRetryOptions();

      expect(updatedOptions.maxRetries).toBe(5);
      expect(updatedOptions.baseDelay).toBe(2000);
      expect(updatedOptions.maxDelay).toBe(10000); // Should keep existing value
    });
  });
});