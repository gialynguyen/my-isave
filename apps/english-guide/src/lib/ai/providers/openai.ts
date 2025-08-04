import { BaseAIService } from '../base';
import type { AIRequest, AIResponse, AIServiceConfig } from '../types';
import type { GenerationOptions } from '$lib/types';

export class OpenAIClient extends BaseAIService {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(config: AIServiceConfig) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.model = config.model || 'gpt-4o-mini';
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    this.validateRequest(request);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: request.options?.model || this.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(request.task)
          },
          {
            role: 'user',
            content: request.prompt
          }
        ],
        temperature: request.options?.temperature || 0.7,
        max_tokens: request.options?.maxTokens || 1000
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`OpenAI API error: ${response.status} - ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    if (!choice) {
      throw new Error('No response from OpenAI API');
    }

    return {
      content: choice.message.content,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      } : undefined,
      model: data.model,
      finishReason: choice.finish_reason
    };
  }

  async generateStructuredResponse<T>(request: AIRequest, schema: any): Promise<T> {
    this.validateRequest(request);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: request.options?.model || this.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(request.task) + '\n\nRespond with valid JSON only.'
          },
          {
            role: 'user',
            content: request.prompt
          }
        ],
        temperature: request.options?.temperature || 0.3,
        max_tokens: request.options?.maxTokens || 1500,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`OpenAI API error: ${response.status} - ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    if (!choice) {
      throw new Error('No response from OpenAI API');
    }

    try {
      return JSON.parse(choice.message.content);
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private getSystemPrompt(task: string): string {
    const prompts = {
      vocabulary_explanation: `You are an expert English teacher helping students learn vocabulary. Provide clear, simple explanations suitable for language learners. Include definitions, examples, and pronunciation guidance.`,
      
      conversation_response: `You are a friendly English conversation partner. Engage naturally in conversation while being patient and encouraging. Provide gentle corrections when needed and ask follow-up questions to keep the conversation flowing.`,
      
      pronunciation_analysis: `You are a pronunciation coach. Analyze speech patterns and provide constructive feedback on pronunciation accuracy. Focus on specific phonemes and common mistakes.`,
      
      test_generation: `You are an English assessment specialist. Create fair, educational test questions that accurately measure language proficiency. Ensure questions are clear and at the appropriate difficulty level.`,
      
      test_evaluation: `You are an English teacher evaluating student responses. Provide fair scoring and constructive feedback that helps students understand their mistakes and improve.`
    };

    return prompts[task as keyof typeof prompts] || 'You are a helpful English learning assistant.';
  }
}