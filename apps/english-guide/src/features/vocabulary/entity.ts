import { BaseEntity } from '$lib/postgres-orm';
import { Collection, Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { DifficultyLevel } from '$lib/types';
import { UserEntity } from '../user/entity';

@Entity({ tableName: 'vocabulary' })
export class VocabularyEntity extends BaseEntity {
  @Property({ type: 'string' })
  word!: string;
  
  @Property({ type: 'text' })
  definition!: string;
  
  @Property({ type: 'string' })
  pronunciation!: string;
  
  @Property({ type: 'json' })
  examples: string[] = [];
  
  @Property({ type: 'text' })
  difficulty: DifficultyLevel = DifficultyLevel.BEGINNER;
  
  @Property({ type: 'json' })
  tags: string[] = [];
  
  @Property({ type: 'string', nullable: true })
  audioUrl?: string;
  
  @OneToMany(() => VocabularyProgressEntity, progress => progress.vocabulary)
  userProgress = new Collection<VocabularyProgressEntity>(this);
}

@Entity({ tableName: 'vocabulary_progress' })
export class VocabularyProgressEntity extends BaseEntity {
  @ManyToOne(() => UserEntity)
  user!: UserEntity;
  
  @ManyToOne(() => VocabularyEntity)
  vocabulary!: VocabularyEntity;
  
  @Property({ type: 'integer' })
  masteryLevel: number = 0; // 0-100
  
  @Property({ type: 'timestamp' })
  lastReviewed: Date = new Date();
  
  @Property({ type: 'timestamp' })
  nextReview: Date = new Date();
  
  @Property({ type: 'integer' })
  correctAttempts: number = 0;
  
  @Property({ type: 'integer' })
  totalAttempts: number = 0;
}