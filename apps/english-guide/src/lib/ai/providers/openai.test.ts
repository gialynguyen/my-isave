import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIClient } from './openai';
import { AIProvider, AITask } from '$lib/types';
import type { AIServiceConfig, AIRequest } from '../types';

// Mock fetch globally
global.fetch = vi.fn();

describe('OpenAIClient', () => {
  let client: OpenAIClient;
  let config: AIServiceConfig;

  beforeEach(() => {
    config = {
      provider: AIProvider.OPENAI,
      apiKey: 'test-api-key',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini'
    };
    client = new OpenAIClient(config);
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const defaultConfig = {
        provider: AIProvider.OPENAI,
        apiKey: 'test-key'
      };
      const defaultClient = new OpenAIClient(defaultConfig);
      expect(defaultClient.isConfigured()).toBe(true);
    });

    it('should use custom baseUrl and model when provided', () => {
      const customConfig = {
        provider: AIProvider.OPENAI,
        apiKey: 'test-key',
        baseUrl: 'https://custom.openai.com/v1',
        model: 'gpt-4'
      };
      const customClient = new OpenAIClient(customConfig);
      expect(customClient.isConfigured()).toBe(true);
    });
  });

  describe('generateResponse', () => {
    it('should generate a successful response', async () => {
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
        model: 'gpt-4o-mini'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const request: AIRequest = {
        task: AITask.VOCABULARY_EXPLANATION,
        prompt: 'Explain the word "hello"'
      };

      const result = await client.generateResponse(request);

      expect(result).toEqual({
        content: 'Test response',
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15
        },
        model: 'gpt-4o-mini',
        finishReason: 'stop'
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key'
          }
        })
      );
    });

    it('should handle API errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          error: { message: 'Invalid API key' }
        })
      });

      const request: AIRequest = {
        task: AITask.VOCABULARY_EXPLANATION,
        prompt: 'Test prompt'
      };

      await expect(client.generateResponse(request)).rejects.toThrow(
        'OpenAI API error: 401 - Invalid API key'
      );
    });

    it('should validate request parameters', async () => {
      const invalidRequest: AIRequest = {
        task: AITask.VOCABULARY_EXPLANATION,
        prompt: ''
      };

      await expect(client.generateResponse(invalidRequest)).rejects.toThrow(
        'Prompt is required'
      );
    });

    it('should handle missing choices in response', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ choices: [] })
      });

      const request: AIRequest = {
        task: AITask.VOCABULARY_EXPLANATION,
        prompt: 'Test prompt'
      };

      await expect(client.generateResponse(request)).rejects.toThrow(
        'No response from OpenAI API'
      );
    });
  });

  describe('generateStructuredResponse', () => {
    it('should generate a structured JSON response', async () => {
      const mockResponse = {
        choices: [{
          message: { content: '{"word": "hello", "definition": "a greeting"}' },
          finish_reason: 'stop'
        }],
        model: 'gpt-4o-mini'
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

      expect(fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('"response_format":{"type":"json_object"}')
        })
      );
    });

    it('should handle invalid JSON responses', async () => {
      const mockResponse = {
        choices: [{
          message: { content: 'Invalid JSON response' },
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
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer test-api-key'
          }
        })
      );
    });

    it('should return false when API is unavailable', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await client.isAvailable();
      expect(result).toBe(false);
    });

    it('should return false when API returns error status', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const result = await client.isAvailable();
      expect(result).toBe(false);
    });
  });

  describe('isConfigured', () => {
    it('should return true when properly configured', () => {
      expect(client.isConfigured()).toBe(true);
    });

    it('should return false when missing API key', () => {
      const invalidConfig = {
        provider: AIProvider.OPENAI,
        apiKey: ''
      };
      const invalidClient = new OpenAIClient(invalidConfig);
      expect(invalidClient.isConfigured()).toBe(false);
    });
  });
});