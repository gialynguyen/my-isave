import { BaseEntity } from '$lib/postgres-orm';
import { Collection, Entity, OneToMany, Property } from '@mikro-orm/core';
import { type LearningPreferences, ProficiencyLevel, type ProgressStats } from '$lib/types';
import { VocabularyProgressEntity } from '../vocabulary/entity';
import { ConversationSessionEntity } from '../conversation/entity';
import { TestResultEntity } from '../test/entity';

@Entity({ tableName: 'user' })
export class UserEntity extends BaseEntity {
  @Property({ type: 'string', unique: true })
  email!: string;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'text' })
  proficiencyLevel: ProficiencyLevel = ProficiencyLevel.BEGINNER;

  @Property({ type: 'json' })
  learningPreferences: LearningPreferences = {};

  @Property({ type: 'json' })
  progressStats: ProgressStats = {
    vocabularyMastered: 0,
    pronunciationAccuracy: 0,
    conversationFluency: 0,
    totalStudyTime: 0,
    streakDays: 0,
    lastActiveDate: new Date()
  };

  @OneToMany(() => VocabularyProgressEntity, (progress) => progress.user)
  vocabularyProgress = new Collection<VocabularyProgressEntity>(this);

  @OneToMany(() => ConversationSessionEntity, (session) => session.user)
  conversationSessions = new Collection<ConversationSessionEntity>(this);

  @OneToMany(() => TestResultEntity, (result) => result.user)
  testResults = new Collection<TestResultEntity>(this);
}
