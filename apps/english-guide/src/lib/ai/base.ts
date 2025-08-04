import type { AIService, AIServiceConfig, AIRequest, AIResponse } from './types';

export abstract class BaseAIService implements AIService {
  protected config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  abstract generateResponse(request: AIRequest): Promise<AIResponse>;
  abstract generateStructuredResponse<T>(request: AIRequest, schema: any): Promise<T>;
  abstract isAvailable(): Promise<boolean>;

  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.provider);
  }

  protected validateRequest(request: AIRequest): void {
    if (!request.prompt) {
      throw new Error('Prompt is required');
    }
    if (!request.task) {
      throw new Error('Task is required');
    }
  }
}