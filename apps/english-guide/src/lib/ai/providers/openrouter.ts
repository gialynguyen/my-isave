import { BaseAIService } from '../base';
import type { AIRequest, AIResponse, AIServiceConfig } from '../types';
import type { GenerationOptions } from '$lib/types';

export class OpenRouterClient extends BaseAIService {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly siteName: string;

  constructor(config: AIServiceConfig) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
    this.model = config.model || 'anthropic/claude-3.5-sonnet';
    this.siteName = 'English Guide App';
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    this.validateRequest(request);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': 'https://english-guide.app',
        'X-Title': this.siteName
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
      throw new Error(`OpenRouter API error: ${response.status} - ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    if (!choice) {
      throw new Error('No response from OpenRouter API');
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

    // OpenRouter doesn't support structured output for all models, so we'll use prompt engineering
    const structuredPrompt = `${request.prompt}\n\nIMPORTANT: Respond with valid JSON only. Do not include any other text or formatting.`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': 'https://english-guide.app',
        'X-Title': this.siteName
      },
      body: JSON.stringify({
        model: request.options?.model || this.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(request.task) + '\n\nAlways respond with valid JSON only.'
          },
          {
            role: 'user',
            content: structuredPrompt
          }
        ],
        temperature: request.options?.temperature || 0.3,
        max_tokens: request.options?.maxTokens || 1500
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`OpenRouter API error: ${response.status} - ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    if (!choice) {
      throw new Error('No response from OpenRouter API');
    }

    try {
      // Clean the response to extract JSON if it's wrapped in markdown or other formatting
      let content = choice.message.content.trim();
      
      // Remove markdown code blocks if present
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': 'https://english-guide.app',
          'X-Title': this.siteName
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private getSystemPrompt(task: string): string {
    const prompts = {
      vocabulary_explanation: `You are an expert English teacher helping students learn vocabulary. Provide clear, simple explanations suitable for language learners. Include definitions, examples, and pronunciation guidance. Be encouraging and patient.`,
      
      conversation_response: `You are a friendly English conversation partner. Engage naturally in conversation while being patient and encouraging. Provide gentle corrections when needed and ask follow-up questions to keep the conversation flowing. Adapt your language level to match the student's proficiency.`,
      
      pronunciation_analysis: `You are a pronunciation coach with expertise in phonetics. Analyze speech patterns and provide constructive feedback on pronunciation accuracy. Focus on specific phonemes, stress patterns, and common mistakes. Be supportive and provide actionable advice.`,
      
      test_generation: `You are an English assessment specialist. Create fair, educational test questions that accurately measure language proficiency. Ensure questions are clear, unambiguous, and at the appropriate difficulty level. Include proper explanations for answers.`,
      
      test_evaluation: `You are an experienced English teacher evaluating student responses. Provide fair scoring and constructive feedback that helps students understand their mistakes and improve. Be encouraging while being accurate in your assessment.`
    };

    return prompts[task as keyof typeof prompts] || 'You are a helpful English learning assistant with expertise in language education.';
  }
}