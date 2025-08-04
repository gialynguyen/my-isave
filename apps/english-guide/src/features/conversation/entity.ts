import { BaseEntity } from '$lib/postgres-orm';
import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import type { ConversationFeedback, ConversationMessage } from '$lib/types';
import { UserEntity } from '../user/entity';

@Entity({ tableName: 'conversation_session' })
export class ConversationSessionEntity extends BaseEntity {
  @ManyToOne(() => UserEntity)
  user!: UserEntity;
  
  @Property({ type: 'string' })
  scenario!: string;
  
  @Property({ type: 'json' })
  messages: ConversationMessage[] = [];
  
  @Property({ type: 'integer' })
  duration: number = 0; // in seconds
  
  @Property({ type: 'json' })
  feedback: ConversationFeedback = {
    fluencyScore: 0,
    grammarScore: 0,
    vocabularyScore: 0,
    suggestions: [],
    strengths: [],
    areasForImprovement: []
  };
  
  @Property({ type: 'boolean' })
  isCompleted: boolean = false;
}