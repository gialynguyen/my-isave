import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AIService } from './service';
import { AIProvider, AITask, ProficiencyLevel, DifficultyLevel } from '$lib/types';
import type { ConversationContext, TestAnswer } from '$lib/types';

// Integration tests for AIService
// These tests can be run against real AI providers when API keys are available
// Set environment variables to enable real API testing:
// - OPENAI_API_KEY
// - OPENROUTER_API_KEY
// - CUSTOM_MODEL_URL and CUSTOM_MODEL_KEY (optional)

describe('AIService Integration Tests', () => {
  let aiService: AIService;
  let hasRealProviders = false;

  beforeAll(() => {
    const providers: any = {};
    
    // Check for OpenAI API key
    if (process.env.OPENAI_API_KEY) {
      providers[AIProvider.OPENAI] = {
        provider: AIProvider.OPENAI,
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4o-mini'
      };
      hasRealProviders = true;
    }

    // Check for OpenRouter API key
    if (process.env.OPENROUTER_API_KEY) {
      providers[AIProvider.OPENROUTER] = {
        provider: AIProvider.OPENROUTER,
        apiKey: process.env.OPENROUTER_API_KEY,
        model: 'anthropic/claude-3.5-sonnet'
      };
      hasRealProviders = true;
    }

    // Check for custom model configuration
    if (process.env.CUSTOM_MODEL_URL) {
      providers[AIProvider.CUSTOM] = {
        provider: AIProvider.CUSTOM,
        apiKey: process.env.CUSTOM_MODEL_KEY || '',
        baseUrl: process.env.CUSTOM_MODEL_URL,
        model: process.env.CUSTOM_MODEL_NAME || 'llama3.1'
      };
      hasRealProviders = true;
    }

    if (hasRealProviders) {
      aiService = new AIService({
        providers,
        defaultProvider: AIProvider.OPENAI,
        fallbackOrder: [AIProvider.OPENAI, AIProvider.OPENROUTER, AIProvider.CUSTOM],
        retryOptions: {
          maxRetries: 2,
          baseDelay: 1000,
          maxDelay: 5000
        }
      });
    }
  });

  afterAll(() => {
    // Cleanup if needed
  });

  it('should perform health check on configured providers', async () => {
    if (!hasRealProviders) {
      console.log('Skipping integration test - no API keys provided');
      return;
    }

    const health = await aiService.healthCheck();
    
    expect(health).toBeDefined();
    expect(typeof health.healthy).toBe('boolean');
    expect(health.providers).toBeDefined();
    
    // At least one provider should be healthy if we have real API keys
    const healthyProviders = Object.values(health.providers).filter(Boolean);
    expect(healthyProviders.length).toBeGreaterThan(0);
  });

  it('should generate vocabulary explanation with real AI provider', async () => {
    if (!hasRealProviders) {
      console.log('Skipping integration test - no API keys provided');
      return;
    }

    const result = await aiService.generateVocabularyExplanation(
      'serendipity',
      ProficiencyLevel.INTERMEDIATE
    );

    expect(result).toBeDefined();
    expect(result.word).toBe('serendipity');
    expect(result.definition).toBeDefined();
    expect(result.examples).toBeDefined();
    expect(Array.isArray(result.examples)).toBe(true);
    expect(result.examples.length).toBeGreaterThan(0);
    expect(result.pronunciation).toBeDefined();
    expect(result.difficulty).toBeDefined();
    
    console.log('Vocabulary explanation result:', JSON.stringify(result, null, 2));
  }, 30000); // 30 second timeout for real API calls

  it('should generate conversation response with real AI provider', async () => {
    if (!hasRealProviders) {
      console.log('Skipping integration test - no API keys provided');
      return;
    }

    const context: ConversationContext = {
      scenario: 'Ordering food at a restaurant',
      userLevel: ProficiencyLevel.BEGINNER,
      conversationHistory: [
        {
          id: '1',
          role: 'user',
          content: 'Hello, I would like to order some food.',
          timestamp: new Date()
        }
      ],
      userPreferences: {}
    };

    const response = await aiService.generateConversationResponse(context);

    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
    
    console.log('Conversation response:', response);
  }, 30000);

  it('should generate test questions with real AI provider', async () => {
    if (!hasRealProviders) {
      console.log('Skipping integration test - no API keys provided');
      return;
    }

    const questions = await aiService.generateTest(
      'test-user',
      ['grammar', 'vocabulary'],
      DifficultyLevel.BEGINNER,
      3
    );

    expect(questions).toBeDefined();
    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBe(3);
    
    questions.forEach(question => {
      expect(question.id).toBeDefined();
      expect(question.type).toBeDefined();
      expect(question.content).toBeDefined();
      expect(question.correctAnswer).toBeDefined();
      expect(question.explanation).toBeDefined();
      expect(question.difficulty).toBeDefined();
    });
    
    console.log('Generated test questions:', JSON.stringify(questions, null, 2));
  }, 30000);

  it('should evaluate test answers with real AI provider', async () => {
    if (!hasRealProviders) {
      console.log('Skipping integration test - no API keys provided');
      return;
    }

    const answers: TestAnswer[] = [
      {
        questionId: '1',
        userAnswer: 'went',
        isCorrect: true,
        timeSpent: 5
      },
      {
        questionId: '2',
        userAnswer: 'goed',
        isCorrect: false,
        timeSpent: 8
      },
      {
        questionId: '3',
        userAnswer: 'running',
        isCorrect: true,
        timeSpent: 6
      }
    ];

    const result = await aiService.evaluateTestAnswers(answers);

    expect(result).toBeDefined();
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.totalQuestions).toBe(3);
    expect(result.correctAnswers).toBe(2);
    expect(result.timeSpent).toBe(19);
    expect(result.feedback).toBeDefined();
    expect(typeof result.feedback).toBe('string');
    expect(result.detailedResults).toEqual(answers);
    
    console.log('Test evaluation result:', JSON.stringify(result, null, 2));
  }, 30000);

  it('should handle provider fallback in real scenarios', async () => {
    if (!hasRealProviders) {
      console.log('Skipping integration test - no API keys provided');
      return;
    }

    // Create a service with an invalid provider first, then valid ones
    const fallbackService = new AIService({
      providers: {
        [AIProvider.CUSTOM]: {
          provider: AIProvider.CUSTOM,
          apiKey: 'invalid-key',
          baseUrl: 'http://invalid-url:1234/api'
        },
        ...(process.env.OPENAI_API_KEY ? {
          [AIProvider.OPENAI]: {
            provider: AIProvider.OPENAI,
            apiKey: process.env.OPENAI_API_KEY,
            model: 'gpt-4o-mini'
          }
        } : {}),
        ...(process.env.OPENROUTER_API_KEY ? {
          [AIProvider.OPENROUTER]: {
            provider: AIProvider.OPENROUTER,
            apiKey: process.env.OPENROUTER_API_KEY,
            model: 'anthropic/claude-3.5-sonnet'
          }
        } : {})
      },
      defaultProvider: AIProvider.CUSTOM, // Start with invalid provider
      fallbackOrder: [AIProvider.CUSTOM, AIProvider.OPENAI, AIProvider.OPENROUTER],
      retryOptions: {
        maxRetries: 1,
        baseDelay: 500,
        maxDelay: 2000
      }
    });

    // This should fail on the custom provider but succeed with fallback
    const result = await fallbackService.generateVocabularyExplanation(
      'resilience',
      ProficiencyLevel.INTERMEDIATE
    );

    expect(result).toBeDefined();
    expect(result.word).toBe('resilience');
    expect(result.definition).toBeDefined();
    
    console.log('Fallback test successful - got result from fallback provider');
  }, 45000);

  it('should demonstrate prompt template usage', () => {
    if (!hasRealProviders) {
      console.log('Skipping integration test - no API keys provided');
      return;
    }

    const template = aiService.getPromptTemplate(AITask.VOCABULARY_EXPLANATION);
    
    expect(template).toBeDefined();
    expect(template?.system).toContain('expert English teacher');
    expect(template?.userTemplate).toContain('{word}');
    expect(template?.userTemplate).toContain('{level}');
    expect(template?.responseFormat).toBe('json');
    
    console.log('Vocabulary explanation template:', template);
  });

  it('should demonstrate retry configuration', () => {
    if (!hasRealProviders) {
      console.log('Skipping integration test - no API keys provided');
      return;
    }

    const originalOptions = aiService.getRetryOptions();
    expect(originalOptions).toBeDefined();
    expect(typeof originalOptions.maxRetries).toBe('number');
    expect(typeof originalOptions.baseDelay).toBe('number');
    expect(typeof originalOptions.maxDelay).toBe('number');
    
    // Update retry options
    aiService.updateRetryOptions({
      maxRetries: 5,
      baseDelay: 2000
    });
    
    const updatedOptions = aiService.getRetryOptions();
    expect(updatedOptions.maxRetries).toBe(5);
    expect(updatedOptions.baseDelay).toBe(2000);
    expect(updatedOptions.maxDelay).toBe(originalOptions.maxDelay); // Should remain unchanged
    
    console.log('Retry options updated successfully');
  });
});