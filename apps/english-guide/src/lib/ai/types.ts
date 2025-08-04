import { AIProvider, AITask, type GenerationOptions } from '$lib/types';

export interface AIServiceConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface AIRequest {
  task: AITask;
  prompt: string;
  options?: GenerationOptions;
  context?: Record<string, any>;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  finishReason?: string;
}

export interface AIService {
  generateResponse(request: AIRequest): Promise<AIResponse>;
  generateStructuredResponse<T>(request: AIRequest, schema: any): Promise<T>;
  isAvailable(): Promise<boolean>;
  isConfigured(): boolean;
}