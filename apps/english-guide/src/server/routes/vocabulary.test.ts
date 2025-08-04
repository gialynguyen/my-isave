import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { testClient } from 'hono/testing';
import { Hono } from 'hono';
import { vocabularyRouter } from './vocabulary';
import { createPostgresORM } from '../providers/postgres';
import { VocabularyEntity } from '../../features/vocabulary/entity';
import { UserEntity } from '../../features/user/entity';
import { DifficultyLevel, ProficiencyLevel } from '../../lib/types';
import type { MikroORM } from '@mikro-orm/core';

// Create a test app with the vocabulary router
const testApp = new Hono();
testApp.route('/api/vocabulary', vocabularyRouter);

describe('Vocabulary API Endpoints', () => {
  let orm: MikroORM;
  let testUser: UserEntity;
  let testVocabulary: VocabularyEntity[];

  beforeAll(async () => {
    // Initialize test database
    orm = await createPostgresORM();
    await orm.getSchemaGenerator().refreshDatabase();
  });

  afterAll(async () => {
    await orm.close();
  });

  beforeEach(async () => {
    // Clean up database - delete in correct order due to foreign key constraints
    const em = orm.em.fork();
    await em.nativeDelete('VocabularyProgressEntity', {});
    await em.nativeDelete('ConversationSessionEntity', {});
    await em.nativeDelete('TestResultEntity', {});
    await em.nativeDelete(VocabularyEntity, {});
    await em.nativeDelete(UserEntity, {});

    // Create test user
    testUser = new UserEntity();
    testUser.email = 'test@example.com';
    testUser.name = 'Test User';
    testUser.proficiencyLevel = ProficiencyLevel.INTERMEDIATE;
    await em.persistAndFlush(testUser);

    // Create test vocabulary words
    testVocabulary = [];
    
    const words = [
      {
        word: 'hello',
        definition: 'A greeting used when meeting someone',
        pronunciation: '/həˈloʊ/',
        examples: ['Hello, how are you?', 'She said hello to her neighbor'],
        difficulty: DifficultyLevel.BEGINNER,
        tags: ['greeting', 'common']
      },
      {
        word: 'sophisticated',
        definition: 'Having great knowledge or experience',
        pronunciation: '/səˈfɪstɪˌkeɪtɪd/',
        examples: ['She has sophisticated taste in art', 'The software is quite sophisticated'],
        difficulty: DifficultyLevel.ADVANCED,
        tags: ['adjective', 'formal']
      },
      {
        word: 'understand',
        definition: 'To comprehend the meaning of something',
        pronunciation: '/ˌʌndərˈstænd/',
        examples: ['I understand your concern', 'Do you understand the instructions?'],
        difficulty: DifficultyLevel.INTERMEDIATE,
        tags: ['verb', 'common']
      }
    ];

    for (const wordData of words) {
      const vocab = new VocabularyEntity();
      Object.assign(vocab, wordData);
      testVocabulary.push(vocab);
    }

    await em.persistAndFlush(testVocabulary);
  });

  describe('GET /api/vocabulary', () => {
    it('should return vocabulary words with default pagination', async () => {
      const client = testClient(testApp);
      const response = await client.api.vocabulary.$get();
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('limit');
      expect(data.items).toHaveLength(3);
      expect(data.total).toBe(3);
    });

    it('should filter vocabulary words by difficulty', async () => {
      const client = testClient(testApp);
      const response = await client.api.vocabulary.$get({
        query: { difficulty: DifficultyLevel.BEGINNER }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].word).toBe('hello');
      expect(data.items[0].difficulty).toBe(DifficultyLevel.BEGINNER);
    });

    it('should filter vocabulary words by tags', async () => {
      const client = testClient(testApp);
      const response = await client.api.vocabulary.$get({
        query: { tags: ['common'] }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.items).toHaveLength(2);
      expect(data.items.every((item: any) => item.tags.includes('common'))).toBe(true);
    });

    it('should respect limit and offset parameters', async () => {
      const client = testClient(testApp);
      const response = await client.api.vocabulary.$get({
        query: { limit: '2', offset: '2' }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.items).toHaveLength(1); // Only 1 item left after skipping 2
      expect(data.limit).toBe(2);
      expect(data.page).toBe(2);
    });
  });

  describe('GET /api/vocabulary/search', () => {
    it('should search vocabulary words by query', async () => {
      const client = testClient(testApp);
      const response = await client.api.vocabulary.search.$get({
        query: { q: 'hello' }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].word).toBe('hello');
    });

    it('should return 400 for empty search query', async () => {
      const client = testClient(testApp);
      const response = await client.api.vocabulary.search.$get({
        query: { q: '' }
      });
      
      expect(response.status).toBe(400);
    });

    it('should search with filters', async () => {
      const client = testClient(testApp);
      const response = await client.api.vocabulary.search.$get({
        query: { 
          q: 'understand',
          difficulty: DifficultyLevel.INTERMEDIATE
        }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].word).toBe('understand');
    });
  });

  describe('GET /api/vocabulary/:id', () => {
    it('should return vocabulary word by ID', async () => {
      const client = testClient(testApp);
      const vocabularyId = testVocabulary[0].id;
      
      const response = await client.api.vocabulary[':id'].$get({
        param: { id: vocabularyId }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.id).toBe(vocabularyId);
      expect(data.word).toBe('hello');
    });

    it('should return 404 for non-existent vocabulary word', async () => {
      const client = testClient(testApp);
      const response = await client.api.vocabulary[':id'].$get({
        param: { id: 'non-existent-id' }
      });
      
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/vocabulary/progress', () => {
    it('should record vocabulary progress', async () => {
      const client = testClient(testApp);
      const vocabularyId = testVocabulary[0].id;
      
      const response = await client.api.vocabulary.progress.$post({
        json: {
          userId: testUser.id,
          vocabularyId: vocabularyId,
          correct: true,
          responseTime: 2500
        }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data.vocabularyId).toBe(vocabularyId);
      expect(data.correctAttempts).toBe(1);
      expect(data.totalAttempts).toBe(1);
    });

    it('should return 400 for missing required fields', async () => {
      const client = testClient(testApp);
      
      const response = await client.api.vocabulary.progress.$post({
        json: {
          userId: testUser.id,
          // missing vocabularyId and correct
        }
      });
      
      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid correct field type', async () => {
      const client = testClient(testApp);
      const vocabularyId = testVocabulary[0].id;
      
      const response = await client.api.vocabulary.progress.$post({
        json: {
          userId: testUser.id,
          vocabularyId: vocabularyId,
          correct: 'true' // should be boolean
        }
      });
      
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/vocabulary/spaced-repetition', () => {
    it('should return spaced repetition session', async () => {
      const client = testClient(testApp);
      
      const response = await client.api.vocabulary['spaced-repetition'].$get({
        query: { userId: testUser.id }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('words');
      expect(data).toHaveProperty('totalWords');
      expect(data).toHaveProperty('sessionId');
      expect(Array.isArray(data.words)).toBe(true);
    });

    it('should return 400 for missing userId', async () => {
      const client = testClient(testApp);
      
      const response = await client.api.vocabulary['spaced-repetition'].$get({
        query: {}
      });
      
      expect(response.status).toBe(400);
    });

    it('should respect limit parameter', async () => {
      const client = testClient(testApp);
      
      const response = await client.api.vocabulary['spaced-repetition'].$get({
        query: { userId: testUser.id, limit: '2' }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.words.length).toBeLessThanOrEqual(2);
    });
  });

  describe('POST /api/vocabulary/explain', () => {
    it.skip('should generate vocabulary explanation', async () => {
      // Skipping this test as it requires a valid OpenAI API key
      // In a real test environment, you would mock the AI service
      const client = testClient(testApp);
      
      const response = await client.api.vocabulary.explain.$post({
        json: {
          word: 'hello',
          userLevel: ProficiencyLevel.BEGINNER
        }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('word');
      expect(data).toHaveProperty('definition');
      expect(data).toHaveProperty('examples');
      expect(data.word).toBe('hello');
    });

    it('should return 400 for missing word', async () => {
      const client = testClient(testApp);
      
      const response = await client.api.vocabulary.explain.$post({
        json: {
          userLevel: ProficiencyLevel.BEGINNER
          // missing word
        }
      });
      
      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid user level', async () => {
      const client = testClient(testApp);
      
      const response = await client.api.vocabulary.explain.$post({
        json: {
          word: 'hello',
          userLevel: 'invalid-level'
        }
      });
      
      expect(response.status).toBe(400);
    });
  });
});