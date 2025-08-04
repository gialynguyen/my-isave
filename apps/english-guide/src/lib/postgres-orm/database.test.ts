import { describe, it, expect } from 'vitest';
import { defineConfig } from '@mikro-orm/postgresql';
import { UserEntity } from '../../features/user/entity';
import { VocabularyEntity, VocabularyProgressEntity } from '../../features/vocabulary/entity';
import { ConversationSessionEntity } from '../../features/conversation/entity';
import { TestEntity, TestResultEntity } from '../../features/test/entity';
import config from '../../../mikro-orm.config';

describe('Database Configuration and Entity Validation', () => {
  it('should have valid mikro-orm configuration', () => {
    expect(config).toBeDefined();
    expect(config.entities).toBeDefined();
    expect(config.entities).toHaveLength(6);
    expect(config.dbName).toBe('english_guide');
    expect(config.migrations).toBeDefined();
    expect(config.migrations.pathTs).toBe('src/migrations');
  });

  it('should include all required entities in configuration', () => {
    const entityClasses = config.entities;
    
    expect(entityClasses).toContain(UserEntity);
    expect(entityClasses).toContain(VocabularyEntity);
    expect(entityClasses).toContain(VocabularyProgressEntity);
    expect(entityClasses).toContain(ConversationSessionEntity);
    expect(entityClasses).toContain(TestEntity);
    expect(entityClasses).toContain(TestResultEntity);
  });

  it('should validate entity class definitions', () => {
    // Check that entities are properly defined classes
    expect(UserEntity).toBeDefined();
    expect(typeof UserEntity).toBe('function');
    expect(UserEntity.name).toBe('UserEntity');

    expect(VocabularyEntity).toBeDefined();
    expect(typeof VocabularyEntity).toBe('function');
    expect(VocabularyEntity.name).toBe('VocabularyEntity');

    expect(VocabularyProgressEntity).toBeDefined();
    expect(typeof VocabularyProgressEntity).toBe('function');
    expect(VocabularyProgressEntity.name).toBe('VocabularyProgressEntity');

    expect(ConversationSessionEntity).toBeDefined();
    expect(typeof ConversationSessionEntity).toBe('function');
    expect(ConversationSessionEntity.name).toBe('ConversationSessionEntity');

    expect(TestEntity).toBeDefined();
    expect(typeof TestEntity).toBe('function');
    expect(TestEntity.name).toBe('TestEntity');

    expect(TestResultEntity).toBeDefined();
    expect(typeof TestResultEntity).toBe('function');
    expect(TestResultEntity.name).toBe('TestResultEntity');
  });

  it('should create test configuration successfully', () => {
    const testConfig = defineConfig({
      entities: [
        UserEntity,
        VocabularyEntity,
        VocabularyProgressEntity,
        ConversationSessionEntity,
        TestEntity,
        TestResultEntity
      ],
      dbName: 'english_guide_test',
      debug: false,
      migrations: {
        path: 'dist/migrations',
        pathTs: 'src/migrations'
      }
    });

    expect(testConfig).toBeDefined();
    expect(testConfig.entities).toHaveLength(6);
    expect(testConfig.dbName).toBe('english_guide_test');
    expect(testConfig.debug).toBe(false);
  });

  it('should validate entity instantiation without database', () => {
    // Test that entities can be instantiated (basic validation)
    expect(() => new UserEntity()).not.toThrow();
    expect(() => new VocabularyEntity()).not.toThrow();
    expect(() => new VocabularyProgressEntity()).not.toThrow();
    expect(() => new ConversationSessionEntity()).not.toThrow();
    expect(() => new TestEntity()).not.toThrow();
    expect(() => new TestResultEntity()).not.toThrow();
  });
});