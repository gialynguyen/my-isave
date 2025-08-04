import { BaseAIService } from '../base';
import type { AIRequest, AIResponse, AIServiceConfig } from '../types';
import type { GenerationOptions } from '$lib/types';

export class CustomModelClient extends BaseAIService {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(config: AIServiceConfig) {
    super(config);
    this.baseUrl = config.baseUrl || 'http://localhost:11434/api'; // Default to Ollama
    this.model = config.model || 'llama3.1';
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    this.validateRequest(request);

    // Check if this is an Ollama-style API or OpenAI-compatible API
    const isOllama = this.baseUrl.includes('ollama') || this.baseUrl.includes('11434');

    if (isOllama) {
      return this.generateOllamaResponse(request);
    } else {
      return this.generateOpenAICompatibleResponse(request);
    }
  }

  private async generateOllamaResponse(request: AIRequest): Promise<AIResponse> {
    const prompt = `${this.getSystemPrompt(request.task)}\n\nUser: ${request.prompt}\nAssistant:`;

    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: request.options?.model || this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: request.options?.temperature || 0.7,
          num_predict: request.options?.maxTokens || 1000
        }
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Custom model API error: ${response.status} - ${error.error || 'Unknown error'}`);
    }

    const data = await response.json();

    return {
      content: data.response,
      usage: data.prompt_eval_count ? {
        promptTokens: data.prompt_eval_count,
        completionTokens: data.eval_count,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      } : undefined,
      model: data.model,
      finishReason: data.done ? 'stop' : 'length'
    };
  }

  private async generateOpenAICompatibleResponse(request: AIRequest): Promise<AIResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Add authorization header if API key is provided
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
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
      throw new Error(`Custom model API error: ${response.status} - ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    if (!choice) {
      throw new Error('No response from custom model API');
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

    // For custom models, we'll use prompt engineering to get structured responses
    const structuredPrompt = `${request.prompt}\n\nIMPORTANT: Respond with valid JSON only. Do not include any other text, explanations, or formatting. The JSON should match this structure: ${JSON.stringify(schema, null, 2)}`;

    const structuredRequest = { ...request, prompt: structuredPrompt };
    const response = await this.generateResponse(structuredRequest);

    try {
      // Clean the response to extract JSON
      let content = response.content.trim();
      
      // Remove markdown code blocks if present
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Try to find JSON in the response if it's mixed with other text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }

      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse JSON response from custom model: ${error}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check if this is an Ollama-style API
      const isOllama = this.baseUrl.includes('ollama') || this.baseUrl.includes('11434');
      
      if (isOllama) {
        const response = await fetch(`${this.baseUrl}/tags`);
        return response.ok;
      } else {
        // Try OpenAI-compatible endpoint
        const headers: Record<string, string> = {};
        if (this.config.apiKey) {
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }
        
        const response = await fetch(`${this.baseUrl}/models`, { headers });
        return response.ok;
      }
    } catch {
      return false;
    }
  }

  private getSystemPrompt(task: string): string {
    const prompts = {
      vocabulary_explanation: `You are an expert English teacher helping students learn vocabulary. Provide clear, simple explanations suitable for language learners. Include definitions, examples, and pronunciation guidance. Be encouraging and patient in your responses.`,
      
      conversation_response: `You are a friendly English conversation partner helping students practice. Engage naturally in conversation while being patient and encouraging. Provide gentle corrections when needed and ask follow-up questions to keep the conversation flowing. Adapt your language level to match the student's proficiency.`,
      
      pronunciation_analysis: `You are a pronunciation coach with expertise in phonetics and language learning. Analyze speech patterns and provide constructive feedback on pronunciation accuracy. Focus on specific phonemes, stress patterns, and common mistakes. Be supportive and provide actionable advice for improvement.`,
      
      test_generation: `You are an English assessment specialist creating educational content. Create fair, educational test questions that accurately measure language proficiency. Ensure questions are clear, unambiguous, and at the appropriate difficulty level. Include proper explanations for answers to help students learn.`,
      
      test_evaluation: `You are an experienced English teacher evaluating student responses. Provide fair scoring and constructive feedback that helps students understand their mistakes and improve. Be encouraging while being accurate in your assessment. Focus on helping students learn from their errors.`
    };

    return prompts[task as keyof typeof prompts] || 'You are a helpful English learning assistant with expertise in language education. Provide clear, educational, and encouraging responses to help students learn English effectively.';
  }
}