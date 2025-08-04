import { AIProvider, AITask, type ProficiencyLevel, type DifficultyLevel } from '$lib/types';
import type { 
  AIServiceConfig, 
  AIRequest, 
  AIResponse, 
  AIService as IAIService 
} from './types';
import type {
  VocabularyExplanation,
  ConversationContext,
  PronunciationFeedback,
  TestQuestion,
  TestAnswer,
  TestResult
} from '$lib/types';
import { OpenAIClient } from './providers/openai';
import { OpenRouterClient } from './providers/openrouter';
import { CustomModelClient } from './providers/custom';

interface ProviderConfig {
  [AIProvider.OPENAI]?: AIServiceConfig;
  [AIProvider.OPENROUTER]?: AIServiceConfig;
  [AIProvider.CUSTOM]?: AIServiceConfig;
}

interface AIServiceOptions {
  providers: ProviderConfig;
  defaultProvider?: AIProvider;
  fallbackOrder?: AIProvider[];
  rateLimits?: {
    [key in AIProvider]?: {
      requestsPerMinute: number;
      requestsPerHour: number;
    };
  };
  retryOptions?: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  };
}

interface RateLimitState {
  requests: number[];
  lastReset: number;
}

interface PromptTemplate {
  system: string;
  userTemplate: string;
  responseFormat?: 'text' | 'json';
  examples?: Array<{ input: string; output: string }>;
}

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export class AIService {
  private providers: Map<AIProvider, IAIService> = new Map();
  private rateLimits: Map<AIProvider, RateLimitState> = new Map();
  private defaultProvider: AIProvider;
  private fallbackOrder: AIProvider[];
  private rateLimitConfig: AIServiceOptions['rateLimits'];
  private retryOptions: RetryOptions;
  private promptTemplates: Map<AITask, PromptTemplate> = new Map();

  constructor(options: AIServiceOptions) {
    this.defaultProvider = options.defaultProvider || AIProvider.OPENAI;
    this.fallbackOrder = options.fallbackOrder || [AIProvider.OPENAI, AIProvider.OPENROUTER, AIProvider.CUSTOM];
    this.rateLimitConfig = options.rateLimits || {};
    this.retryOptions = options.retryOptions || {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000
    };

    // Initialize providers
    this.initializeProviders(options.providers);
    
    // Initialize rate limiting
    this.initializeRateLimiting();
    
    // Initialize prompt templates
    this.initializePromptTemplates();
  }

  private initializeProviders(configs: ProviderConfig): void {
    if (configs[AIProvider.OPENAI]) {
      this.providers.set(AIProvider.OPENAI, new OpenAIClient(configs[AIProvider.OPENAI]));
    }
    
    if (configs[AIProvider.OPENROUTER]) {
      this.providers.set(AIProvider.OPENROUTER, new OpenRouterClient(configs[AIProvider.OPENROUTER]));
    }
    
    if (configs[AIProvider.CUSTOM]) {
      this.providers.set(AIProvider.CUSTOM, new CustomModelClient(configs[AIProvider.CUSTOM]));
    }
  }

  private initializeRateLimiting(): void {
    for (const provider of this.providers.keys()) {
      this.rateLimits.set(provider, {
        requests: [],
        lastReset: Date.now()
      });
    }
  }

  private initializePromptTemplates(): void {
    // Vocabulary explanation template
    this.promptTemplates.set(AITask.VOCABULARY_EXPLANATION, {
      system: `You are an expert English teacher specializing in vocabulary instruction. Your role is to help language learners understand new words through clear, comprehensive explanations tailored to their proficiency level.

Guidelines:
- Provide definitions that are appropriate for the learner's level
- Include diverse, contextual examples that show real usage
- Give accurate pronunciation guidance using IPA notation
- Suggest relevant synonyms and antonyms when helpful
- Be encouraging and educational in your approach`,
      userTemplate: `Explain the English word "{word}" for a {level} level learner.

Please provide:
1. A clear, simple definition appropriate for {level} level
2. 3-5 example sentences showing different contexts and uses
3. Pronunciation guide using IPA notation
4. Difficulty level assessment
5. 2-3 synonyms if applicable
6. 2-3 antonyms if applicable

Word: {word}
Learner Level: {level}`,
      responseFormat: 'json'
    });

    // Conversation response template
    this.promptTemplates.set(AITask.CONVERSATION_RESPONSE, {
      system: `You are a friendly, patient English conversation partner helping students practice their speaking skills. Your goal is to maintain engaging, natural conversations while providing gentle guidance and encouragement.

Guidelines:
- Adapt your language complexity to match the student's proficiency level
- Ask follow-up questions to keep conversations flowing naturally
- Provide gentle corrections when needed, but don't interrupt the flow
- Be encouraging and supportive of the student's efforts
- Use the conversation scenario as context for realistic dialogue`,
      userTemplate: `Continue this conversation naturally. 

Scenario: {scenario}
Student Level: {userLevel}
Recent conversation history:
{conversationHistory}

Respond as a helpful conversation partner. Keep the dialogue flowing with follow-up questions or comments related to the scenario.`,
      responseFormat: 'text'
    });

    // Pronunciation analysis template
    this.promptTemplates.set(AITask.PRONUNCIATION_ANALYSIS, {
      system: `You are a pronunciation coach with expertise in phonetics and English language learning. Your role is to analyze pronunciation attempts and provide constructive, actionable feedback.

Guidelines:
- Focus on specific phonemes and sound patterns
- Provide encouraging but accurate feedback
- Suggest specific practice techniques for improvement
- Highlight common mistakes for the target word or sound
- Give a realistic accuracy assessment`,
      userTemplate: `Analyze pronunciation feedback for the word "{targetWord}".

Based on the audio analysis (audio length: {audioLength} bytes), provide constructive feedback including:
1. Overall accuracy score (0-100)
2. Detected phonemes that were pronounced correctly
3. Specific suggestions for improvement
4. Common mistakes learners make with this word

Target word: {targetWord}
Audio data length: {audioLength} bytes`,
      responseFormat: 'json'
    });

    // Test generation template
    this.promptTemplates.set(AITask.TEST_GENERATION, {
      system: `You are an English assessment specialist creating educational test questions. Your goal is to create fair, comprehensive assessments that accurately measure language proficiency while being educational and engaging.

Guidelines:
- Create questions at the appropriate difficulty level
- Ensure questions are clear and unambiguous
- Include proper explanations for correct answers
- Mix different question types for comprehensive assessment
- Focus on practical language skills and real-world usage`,
      userTemplate: `Generate {questionCount} English test questions covering these topics: {topics}

Requirements:
- Difficulty level: {difficulty}
- Question type distribution:
  * Multiple choice: 40%
  * Fill in the blank: 30%
  * True/False: 20%
  * Short answer: 10%

Each question should include:
1. Clear question text
2. Correct answer
3. For multiple choice: 4 options with only one correct
4. Detailed explanation of the correct answer
5. Appropriate difficulty level

Topics: {topics}
Difficulty: {difficulty}
Question count: {questionCount}`,
      responseFormat: 'json',
      examples: [
        {
          input: 'Generate 2 beginner grammar questions',
          output: `{
  "questions": [
    {
      "id": "1",
      "type": "multiple_choice",
      "content": "What is the past tense of 'go'?",
      "options": ["went", "goed", "gone", "going"],
      "correctAnswer": "went",
      "explanation": "The past tense of 'go' is 'went'. This is an irregular verb.",
      "difficulty": "beginner"
    }
  ]
}`
        }
      ]
    });

    // Test evaluation template
    this.promptTemplates.set(AITask.TEST_EVALUATION, {
      system: `You are an experienced English teacher evaluating student test performance. Your role is to provide fair, constructive feedback that helps students understand their performance and identify areas for improvement.

Guidelines:
- Be encouraging while being accurate in assessment
- Provide specific feedback on strengths and weaknesses
- Suggest concrete next steps for improvement
- Consider both accuracy and learning progress
- Focus on helping students learn from their mistakes`,
      userTemplate: `Evaluate this test performance and provide constructive feedback.

Test Results:
- Total questions: {totalQuestions}
- Correct answers: {correctAnswers}
- Total time: {totalTime} seconds

Detailed answers:
{answersDetails}

Please provide:
1. Overall score (0-100)
2. Constructive feedback highlighting strengths and areas for improvement
3. Specific suggestions for study focus
4. Encouragement and next steps for continued learning

Be supportive and educational in your feedback.`,
      responseFormat: 'json'
    });
  }

  async generateVocabularyExplanation(
    word: string, 
    level: ProficiencyLevel, 
    provider?: AIProvider
  ): Promise<VocabularyExplanation> {
    const template = this.promptTemplates.get(AITask.VOCABULARY_EXPLANATION);
    if (!template) {
      throw new Error('Vocabulary explanation template not found');
    }

    const prompt = template.userTemplate
      .replace('{word}', word)
      .replace(/{level}/g, level);

    const request: AIRequest = {
      task: AITask.VOCABULARY_EXPLANATION,
      prompt,
      context: { word, level }
    };

    const schema = {
      word: 'string',
      definition: 'string',
      examples: ['string'],
      pronunciation: 'string',
      difficulty: 'string',
      synonyms: ['string'],
      antonyms: ['string']
    };

    return this.executeStructuredRequestWithRetry<VocabularyExplanation>(request, schema, provider);
  }

  async generateConversationResponse(
    context: ConversationContext, 
    provider?: AIProvider
  ): Promise<string> {
    const { scenario, userLevel, conversationHistory, userPreferences } = context;
    const template = this.promptTemplates.get(AITask.CONVERSATION_RESPONSE);
    if (!template) {
      throw new Error('Conversation response template not found');
    }
    
    const historyText = conversationHistory
      .slice(-10) // Keep last 10 messages for context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = template.userTemplate
      .replace('{scenario}', scenario)
      .replace('{userLevel}', userLevel)
      .replace('{conversationHistory}', historyText);

    const request: AIRequest = {
      task: AITask.CONVERSATION_RESPONSE,
      prompt,
      context: { scenario, userLevel, conversationHistory }
    };

    const response = await this.executeRequestWithRetry(request, provider);
    return response.content;
  }

  async analyzePronunciation(
    audioData: ArrayBuffer, 
    targetWord: string, 
    provider?: AIProvider
  ): Promise<PronunciationFeedback> {
    // Note: This is a simplified implementation. In a real app, you'd need to:
    // 1. Convert audio to text using speech recognition
    // 2. Analyze the phonetic differences
    // 3. Provide specific feedback
    
    const template = this.promptTemplates.get(AITask.PRONUNCIATION_ANALYSIS);
    if (!template) {
      throw new Error('Pronunciation analysis template not found');
    }
    
    const prompt = template.userTemplate
      .replace('{targetWord}', targetWord)
      .replace('{audioLength}', audioData.byteLength.toString());

    const request: AIRequest = {
      task: AITask.PRONUNCIATION_ANALYSIS,
      prompt,
      context: { targetWord, audioLength: audioData.byteLength }
    };

    const schema = {
      accuracy: 'number',
      detectedPhonemes: ['string'],
      suggestions: ['string'],
      commonMistakes: ['string']
    };

    return this.executeStructuredRequestWithRetry<PronunciationFeedback>(request, schema, provider);
  }

  async generateTest(
    userId: string, 
    topics: string[], 
    difficulty: DifficultyLevel, 
    questionCount: number = 10,
    provider?: AIProvider
  ): Promise<TestQuestion[]> {
    const template = this.promptTemplates.get(AITask.TEST_GENERATION);
    if (!template) {
      throw new Error('Test generation template not found');
    }
    
    const topicsText = topics.join(', ');
    
    const prompt = template.userTemplate
      .replace('{questionCount}', questionCount.toString())
      .replace('{topics}', topicsText)
      .replace(/{difficulty}/g, difficulty);

    const request: AIRequest = {
      task: AITask.TEST_GENERATION,
      prompt,
      context: { userId, topics, difficulty, questionCount }
    };

    const schema = {
      questions: [{
        id: 'string',
        type: 'string',
        content: 'string',
        options: ['string'],
        correctAnswer: 'string',
        explanation: 'string',
        difficulty: 'string'
      }]
    };

    const result = await this.executeStructuredRequestWithRetry<{ questions: TestQuestion[] }>(request, schema, provider);
    return result.questions;
  }

  async evaluateTestAnswers(
    answers: TestAnswer[], 
    provider?: AIProvider
  ): Promise<TestResult> {
    const template = this.promptTemplates.get(AITask.TEST_EVALUATION);
    if (!template) {
      throw new Error('Test evaluation template not found');
    }

    const answersText = answers.map(answer => 
      `Question ${answer.questionId}: User answered "${answer.userAnswer}" (${answer.isCorrect ? 'Correct' : 'Incorrect'}) in ${answer.timeSpent}s`
    ).join('\n');

    const correctCount = answers.filter(a => a.isCorrect).length;
    const totalTime = answers.reduce((sum, a) => sum + a.timeSpent, 0);

    const prompt = template.userTemplate
      .replace('{totalQuestions}', answers.length.toString())
      .replace('{correctAnswers}', correctCount.toString())
      .replace('{totalTime}', totalTime.toString())
      .replace('{answersDetails}', answersText);

    const request: AIRequest = {
      task: AITask.TEST_EVALUATION,
      prompt,
      context: { answers, correctCount, totalTime }
    };

    const schema = {
      score: 'number',
      feedback: 'string'
    };

    const result = await this.executeStructuredRequestWithRetry<{ score: number; feedback: string }>(request, schema, provider);
    
    return {
      score: result.score,
      totalQuestions: answers.length,
      correctAnswers: correctCount,
      timeSpent: totalTime,
      feedback: result.feedback,
      detailedResults: answers
    };
  }

  private async executeRequest(
    request: AIRequest, 
    preferredProvider?: AIProvider
  ): Promise<AIResponse> {
    const provider = this.selectProvider(request.task, preferredProvider);
    
    try {
      await this.checkRateLimit(provider);
      const client = this.providers.get(provider);
      
      if (!client) {
        throw new Error(`Provider ${provider} not configured`);
      }

      const response = await client.generateResponse(request);
      this.recordRequest(provider);
      return response;
    } catch (error) {
      console.warn(`Provider ${provider} failed:`, error);
      return this.executeWithFallback(request, provider);
    }
  }

  private async executeRequestWithRetry(
    request: AIRequest, 
    preferredProvider?: AIProvider
  ): Promise<AIResponse> {
    const provider = this.selectProvider(request.task, preferredProvider);
    
    for (let attempt = 0; attempt <= this.retryOptions.maxRetries; attempt++) {
      try {
        await this.checkRateLimit(provider);
        const client = this.providers.get(provider);
        
        if (!client) {
          throw new Error(`Provider ${provider} not configured`);
        }

        const response = await client.generateResponse(request);
        this.recordRequest(provider);
        return response;
      } catch (error) {
        const isLastAttempt = attempt === this.retryOptions.maxRetries;
        const isRetryableError = this.isRetryableError(error);
        
        if (isLastAttempt || !isRetryableError) {
          console.warn(`Provider ${provider} failed after ${attempt + 1} attempts:`, error);
          return this.executeWithFallback(request, provider);
        }
        
        // Wait before retrying with exponential backoff
        const delay = Math.min(
          this.retryOptions.baseDelay * Math.pow(2, attempt),
          this.retryOptions.maxDelay
        );
        console.info(`Retrying ${provider} in ${delay}ms (attempt ${attempt + 1}/${this.retryOptions.maxRetries})`);
        await this.sleep(delay);
      }
    }
    
    // This should never be reached, but TypeScript requires it
    throw new Error('Unexpected retry loop exit');
  }

  private async executeStructuredRequest<T>(
    request: AIRequest, 
    schema: any, 
    preferredProvider?: AIProvider
  ): Promise<T> {
    const provider = this.selectProvider(request.task, preferredProvider);
    
    try {
      await this.checkRateLimit(provider);
      const client = this.providers.get(provider);
      
      if (!client) {
        throw new Error(`Provider ${provider} not configured`);
      }

      const response = await client.generateStructuredResponse<T>(request, schema);
      this.recordRequest(provider);
      return response;
    } catch (error) {
      console.warn(`Provider ${provider} failed:`, error);
      return this.executeStructuredWithFallback<T>(request, schema, provider);
    }
  }

  private async executeStructuredRequestWithRetry<T>(
    request: AIRequest, 
    schema: any, 
    preferredProvider?: AIProvider
  ): Promise<T> {
    const provider = this.selectProvider(request.task, preferredProvider);
    
    for (let attempt = 0; attempt <= this.retryOptions.maxRetries; attempt++) {
      try {
        await this.checkRateLimit(provider);
        const client = this.providers.get(provider);
        
        if (!client) {
          throw new Error(`Provider ${provider} not configured`);
        }

        const response = await client.generateStructuredResponse<T>(request, schema);
        this.recordRequest(provider);
        
        // Validate the response structure
        const validatedResponse = this.validateResponse<T>(response, schema);
        return validatedResponse;
      } catch (error) {
        const isLastAttempt = attempt === this.retryOptions.maxRetries;
        const isRetryableError = this.isRetryableError(error);
        
        if (isLastAttempt || !isRetryableError) {
          console.warn(`Provider ${provider} failed after ${attempt + 1} attempts:`, error);
          return this.executeStructuredWithFallback<T>(request, schema, provider);
        }
        
        // Wait before retrying with exponential backoff
        const delay = Math.min(
          this.retryOptions.baseDelay * Math.pow(2, attempt),
          this.retryOptions.maxDelay
        );
        console.info(`Retrying ${provider} in ${delay}ms (attempt ${attempt + 1}/${this.retryOptions.maxRetries})`);
        await this.sleep(delay);
      }
    }
    
    // This should never be reached, but TypeScript requires it
    throw new Error('Unexpected retry loop exit');
  }

  private async executeWithFallback(
    request: AIRequest, 
    failedProvider: AIProvider
  ): Promise<AIResponse> {
    const fallbackProviders = this.fallbackOrder.filter(p => 
      p !== failedProvider && this.providers.has(p)
    );

    for (const provider of fallbackProviders) {
      try {
        await this.checkRateLimit(provider);
        const client = this.providers.get(provider);
        
        if (!client || !(await client.isAvailable())) {
          continue;
        }

        const response = await client.generateResponse(request);
        this.recordRequest(provider);
        console.info(`Fallback to ${provider} successful`);
        return response;
      } catch (error) {
        console.warn(`Fallback provider ${provider} also failed:`, error);
        continue;
      }
    }

    throw new Error('All AI providers failed');
  }

  private async executeStructuredWithFallback<T>(
    request: AIRequest, 
    schema: any, 
    failedProvider: AIProvider
  ): Promise<T> {
    const fallbackProviders = this.fallbackOrder.filter(p => 
      p !== failedProvider && this.providers.has(p)
    );

    for (const provider of fallbackProviders) {
      try {
        await this.checkRateLimit(provider);
        const client = this.providers.get(provider);
        
        if (!client || !(await client.isAvailable())) {
          continue;
        }

        const response = await client.generateStructuredResponse<T>(request, schema);
        this.recordRequest(provider);
        console.info(`Fallback to ${provider} successful`);
        return response;
      } catch (error) {
        console.warn(`Fallback provider ${provider} also failed:`, error);
        continue;
      }
    }

    throw new Error('All AI providers failed');
  }

  private selectProvider(task: AITask, userPreference?: AIProvider): AIProvider {
    // Use user preference if specified and available
    if (userPreference && this.providers.has(userPreference)) {
      return userPreference;
    }

    // Task-specific provider selection logic
    switch (task) {
      case AITask.VOCABULARY_EXPLANATION:
      case AITask.TEST_GENERATION:
        // Prefer OpenAI for structured tasks
        return this.providers.has(AIProvider.OPENAI) ? AIProvider.OPENAI : this.defaultProvider;
      
      case AITask.CONVERSATION_RESPONSE:
        // Prefer OpenRouter (Claude) for conversations
        return this.providers.has(AIProvider.OPENROUTER) ? AIProvider.OPENROUTER : this.defaultProvider;
      
      case AITask.PRONUNCIATION_ANALYSIS:
      case AITask.TEST_EVALUATION:
        // Use default provider for these tasks
        return this.defaultProvider;
      
      default:
        return this.defaultProvider;
    }
  }

  private async checkRateLimit(provider: AIProvider): Promise<void> {
    const limits = this.rateLimitConfig?.[provider];
    if (!limits) return;

    const state = this.rateLimits.get(provider);
    if (!state) return;

    const now = Date.now();
    const oneMinute = 60 * 1000;
    const oneHour = 60 * 60 * 1000;

    // Clean old requests
    state.requests = state.requests.filter(time => now - time < oneHour);

    // Check minute limit
    const recentRequests = state.requests.filter(time => now - time < oneMinute);
    if (recentRequests.length >= limits.requestsPerMinute) {
      const waitTime = oneMinute - (now - recentRequests[0]);
      throw new Error(`Rate limit exceeded for ${provider}. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    // Check hour limit
    if (state.requests.length >= limits.requestsPerHour) {
      const waitTime = oneHour - (now - state.requests[0]);
      throw new Error(`Hourly rate limit exceeded for ${provider}. Wait ${Math.ceil(waitTime / 60000)} minutes.`);
    }
  }

  private recordRequest(provider: AIProvider): void {
    const state = this.rateLimits.get(provider);
    if (state) {
      state.requests.push(Date.now());
    }
  }

  async getProviderStatus(): Promise<Record<AIProvider, { available: boolean; configured: boolean }>> {
    const status: Record<string, { available: boolean; configured: boolean }> = {};

    for (const [provider, client] of this.providers) {
      status[provider] = {
        configured: client.isConfigured(),
        available: await client.isAvailable()
      };
    }

    return status as Record<AIProvider, { available: boolean; configured: boolean }>;
  }

  getConfiguredProviders(): AIProvider[] {
    return Array.from(this.providers.keys()).filter(provider => {
      const client = this.providers.get(provider);
      return client?.isConfigured() || false;
    });
  }

  async healthCheck(): Promise<{ healthy: boolean; providers: Record<string, boolean> }> {
    const providerHealth: Record<string, boolean> = {};
    let anyHealthy = false;

    for (const [provider, client] of this.providers) {
      try {
        const isHealthy = client.isConfigured() && await client.isAvailable();
        providerHealth[provider] = isHealthy;
        if (isHealthy) anyHealthy = true;
      } catch {
        providerHealth[provider] = false;
      }
    }

    return {
      healthy: anyHealthy,
      providers: providerHealth
    };
  }

  private isRetryableError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || error.status;
    
    // Retry on network errors, timeouts, and temporary server errors
    const retryablePatterns = [
      'network error',
      'timeout',
      'connection',
      'econnreset',
      'enotfound',
      'rate limit',
      'too many requests',
      'server error',
      'internal server error',
      'bad gateway',
      'service unavailable',
      'gateway timeout'
    ];
    
    const retryableCodes = [408, 429, 500, 502, 503, 504];
    
    return retryablePatterns.some(pattern => errorMessage.includes(pattern)) ||
           retryableCodes.includes(errorCode);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private validateResponse<T>(response: T, schema: any): T {
    // Basic validation - in a real implementation, you might use a library like Zod or Joi
    if (!response) {
      throw new Error('Empty response received');
    }
    
    // For now, just return the response as-is
    // In a production app, you'd implement proper schema validation here
    return response;
  }

  // Method to get prompt template for external use (e.g., testing)
  getPromptTemplate(task: AITask): PromptTemplate | undefined {
    return this.promptTemplates.get(task);
  }

  // Method to update prompt templates dynamically
  updatePromptTemplate(task: AITask, template: PromptTemplate): void {
    this.promptTemplates.set(task, template);
  }

  // Method to get retry configuration
  getRetryOptions(): RetryOptions {
    return { ...this.retryOptions };
  }

  // Method to update retry configuration
  updateRetryOptions(options: Partial<RetryOptions>): void {
    this.retryOptions = { ...this.retryOptions, ...options };
  }
}