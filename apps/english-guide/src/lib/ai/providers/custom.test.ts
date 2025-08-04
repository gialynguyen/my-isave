import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomModelClient } from './custom';
import { AIProvider, AITask } from '$lib/types';
import type { AIServiceConfig, AIRequest } from '../types';

// Mock fetch globally
global.fetch = vi.fn();

describe('CustomModelClient', () => {
  let client: CustomModelClient;
  let config: AIServiceConfig;

  beforeEach(() => {
    config = {
      provider: AIProvider.CUSTOM,
      apiKey: 'test-api-key',
      baseUrl: 'http://localhost:11434/api',
      model: 'llama3.1'
    };
    client = new CustomModelClient(config);
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default Ollama values', () => {
      const defaultConfig = {
        provider: AIProvider.CUSTOM,
        apiKey: 'test-key'
      };
      const defaultClient = new CustomModelClient(defaultConfig);
      expect(defaultClient.isConfigured()).toBe(true);
    });
  });

  describe('generateResponse - Ollama API', () => {
    it('should generate response using Ollama API format', async () => {
      const mockResponse = {
        response: 'Test response from Ollama',
        model: 'llama3.1',
        done: true,
        prompt_eval_count: 10,
        eval_count: 5
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
        content: 'Test response from Ollama',
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15
        },
        model: 'llama3.1',
        finishReason: 'stop'
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should handle Ollama API errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({
          error: 'Model not found'
        })
      });

      const request: AIRequest = {
        task: AITask.VOCABULARY_EXPLANATION,
        prompt: 'Test prompt'
      };

      await expect(client.generateResponse(request)).rejects.toThrow(
        'Custom model API error: 404 - Model not found'
      );
    });
  });

  describe('generateResponse - OpenAI Compatible API', () => {
    beforeEach(() => {
      config = {
        provider: AIProvider.CUSTOM,
        apiKey: 'test-api-key',
        baseUrl: 'https://custom-api.com/v1',
        model: 'custom-model'
      };
      client = new CustomModelClient(config);
    });

    it('should generate response using OpenAI-compatible API format', async () => {
      const mockResponse = {
        choices: [{
          message: { content: 'Test response from custom API' },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15
        },
        model: 'custom-model'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const request: AIRequest = {
        task: AITask.CONVERSATION_RESPONSE,
        prompt: 'Hello there'
      };

      const result = await client.generateResponse(request);

      expect(result).toEqual({
        content: 'Test response from custom API',
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15
        },
        model: 'custom-model',
        finishReason: 'stop'
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://custom-api.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key'
          }
        })
      );
    });

    it('should work without API key for local models', async () => {
      const noKeyConfig = {
        provider: AIProvider.CUSTOM,
        apiKey: '',
        baseUrl: 'http://localhost:8080/v1'
      };
      const noKeyClient = new CustomModelClient(noKeyConfig);

      const mockResponse = {
        choices: [{
          message: { content: 'Response without auth' },
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

      await noKeyClient.generateResponse(request);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/chat/completions',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    });
  });

  describe('generateStructuredResponse', () => {
    it('should generate structured response and extract JSON', async () => {
      const mockResponse = {
        response: 'Here is the JSON: {"word": "hello", "definition": "a greeting"} as requested.',
        model: 'llama3.1',
        done: true
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

    it('should handle markdown-wrapped JSON', async () => {
      const mockResponse = {
        response: '```json\n{"test": "value"}\n```',
        model: 'llama3.1',
        done: true
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const request: AIRequest = {
        task: AITask.TEST_GENERATION,
        prompt: 'Generate a test'
      };

      const result = await client.generateStructuredResponse(request, {});

      expect(result).toEqual({
        test: 'value'
      });
    });

    it('should handle invalid JSON responses', async () => {
      const mockResponse = {
        response: 'This is not JSON at all',
        model: 'llama3.1',
        done: true
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
        'Failed to parse JSON response from custom model'
      );
    });
  });

  describe('isAvailable', () => {
    it('should check Ollama API availability', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true
      });

      const result = await client.isAvailable();
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith('http://localhost:11434/api/tags');
    });

    it('should check OpenAI-compatible API availability', async () => {
      const openaiCompatibleConfig = {
        provider: AIProvider.CUSTOM,
        apiKey: 'test-key',
        baseUrl: 'https://custom-api.com/v1'
      };
      const openaiCompatibleClient = new CustomModelClient(openaiCompatibleConfig);

      (fetch as any).mockResolvedValueOnce({
        ok: true
      });

      const result = await openaiCompatibleClient.isAvailable();
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        'https://custom-api.com/v1/models',
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer test-key'
          }
        })
      );
    });

    it('should return false when API is unavailable', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Connection refused'));

      const result = await client.isAvailable();
      expect(result).toBe(false);
    });
  });
});