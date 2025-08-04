import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenRouterClient } from './openrouter';
import { AIProvider, AITask } from '$lib/types';
import type { AIServiceConfig, AIRequest } from '../types';

// Mock fetch globally
global.fetch = vi.fn();

describe('OpenRouterClient', () => {
  let client: OpenRouterClient;
  let config: AIServiceConfig;

  beforeEach(() => {
    config = {
      provider: AIProvider.OPENROUTER,
      apiKey: 'test-api-key',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'anthropic/claude-3.5-sonnet'
    };
    client = new OpenRouterClient(config);
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const defaultConfig = {
        provider: AIProvider.OPENROUTER,
        apiKey: 'test-key'
      };
      const defaultClient = new OpenRouterClient(defaultConfig);
      expect(defaultClient.isConfigured()).toBe(true);
    });
  });

  describe('generateResponse', () => {
    it('should generate a successful response with OpenRouter headers', async () => {
      const mockResponse = {
        choices: [{
          message: { content: 'Test response' },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15
        },
        model: 'anthropic/claude-3.5-sonnet'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const request: AIRequest = {
        task: AITask.CONVERSATION_RESPONSE,
        prompt: 'Hello, how are you?'
      };

      const result = await client.generateResponse(request);

      expect(result).toEqual({
        content: 'Test response',
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15
        },
        model: 'anthropic/claude-3.5-sonnet',
        finishReason: 'stop'
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key',
            'HTTP-Referer': 'https://english-guide.app',
            'X-Title': 'English Guide App'
          }
        })
      );
    });

    it('should handle API errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 402,
        json: () => Promise.resolve({
          error: { message: 'Insufficient credits' }
        })
      });

      const request: AIRequest = {
        task: AITask.VOCABULARY_EXPLANATION,
        prompt: 'Test prompt'
      };

      await expect(client.generateResponse(request)).rejects.toThrow(
        'OpenRouter API error: 402 - Insufficient credits'
      );
    });
  });

  describe('generateStructuredResponse', () => {
    it('should generate structured response and clean markdown formatting', async () => {
      const mockResponse = {
        choices: [{
          message: { content: '```json\n{"word": "hello", "definition": "a greeting"}\n```' },
          finish_reason: 'stop'
        }]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const request: AIRequest = {
        task: AITask.VOCABULARY_EXPLANATION,
        prompt: 'Explain the word "hello"'
      };

      const schema = { word: 'string', definition: 'string' };
      const result = await client.generateStructuredResponse(request, schema);

      expect(result).toEqual({
        word: 'hello',
        definition: 'a greeting'
      });
    });

    it('should handle plain JSON without markdown', async () => {
      const mockResponse = {
        choices: [{
          message: { content: '{"word": "goodbye", "definition": "a farewell"}' },
          finish_reason: 'stop'
        }]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const request: AIRequest = {
        task: AITask.VOCABULARY_EXPLANATION,
        prompt: 'Explain the word "goodbye"'
      };

      const result = await client.generateStructuredResponse(request, {});

      expect(result).toEqual({
        word: 'goodbye',
        definition: 'a farewell'
      });
    });

    it('should handle invalid JSON responses', async () => {
      const mockResponse = {
        choices: [{
          message: { content: 'This is not valid JSON' },
          finish_reason: 'stop'
        }]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const request: AIRequest = {
        task: AITask.VOCABULARY_EXPLANATION,
        prompt: 'Test prompt'
      };

      await expect(client.generateStructuredResponse(request, {})).rejects.toThrow(
        'Failed to parse JSON response'
      );
    });
  });

  describe('isAvailable', () => {
    it('should return true when API is available', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true
      });

      const result = await client.isAvailable();
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/models',
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer test-api-key',
            'HTTP-Referer': 'https://english-guide.app',
            'X-Title': 'English Guide App'
          }
        })
      );
    });

    it('should return false when API is unavailable', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await client.isAvailable();
      expect(result).toBe(false);
    });
  });
});