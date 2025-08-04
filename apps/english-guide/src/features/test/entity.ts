import { BaseEntity } from '$lib/postgres-orm';
import { Collection, Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { DifficultyLevel, QuestionType, type TestQuestion } from '$lib/types';
import { UserEntity } from '../user/entity';

@Entity({ tableName: 'test' })
export class TestEntity extends BaseEntity {
  @Property({ type: 'string' })
  title!: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ type: 'text' })
  difficulty: DifficultyLevel = DifficultyLevel.BEGINNER;

  @Property({ type: 'json' })
  questions: TestQuestion[] = [];

  @Property({ type: 'json' })
  tags: string[] = [];

  @Property({ type: 'integer' })
  timeLimit: number = 0; // in minutes, 0 means no time limit

  @Property({ type: 'integer' })
  passingScore: number = 70; // percentage

  @Property({ type: 'json' })
  metadata: TestMetadata = {
    totalQuestions: 0,
    estimatedDuration: 0,
    topics: [],
    skillsAssessed: []
  };

  @Property({ type: 'boolean' })
  isActive: boolean = true;

  @OneToMany(() => TestResultEntity, result => result.test)
  results = new Collection<TestResultEntity>(this);
}

@Entity({ tableName: 'test_result' })
export class TestResultEntity extends BaseEntity {
  @ManyToOne(() => UserEntity)
  user!: UserEntity;

  @ManyToOne(() => TestEntity)
  test!: TestEntity;

  @Property({ type: 'integer' })
  score: number = 0; // percentage score

  @Property({ type: 'integer' })
  totalQuestions: number = 0;

  @Property({ type: 'integer' })
  correctAnswers: number = 0;

  @Property({ type: 'integer' })
  timeSpent: number = 0; // in seconds

  @Property({ type: 'timestamp' })
  startedAt: Date = new Date();

  @Property({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Property({ type: 'boolean' })
  isPassed: boolean = false;

  @Property({ type: 'json' })
  answers: TestAnswerRecord[] = [];

  @Property({ type: 'json' })
  feedback: TestResultFeedback = {
    overallFeedback: '',
    strengths: [],
    areasForImprovement: [],
    recommendedStudyTopics: []
  };

  @Property({ type: 'json' })
  detailedAnalysis: TestAnalysis = {
    questionTypePerformance: {} as Record<QuestionType, number>,
    difficultyPerformance: {} as Record<DifficultyLevel, number>,
    topicPerformance: {},
    timePerQuestion: []
  } ;
}

// Supporting interfaces for test entities
export interface TestMetadata {
  totalQuestions: number;
  estimatedDuration: number; // in minutes
  topics: string[];
  skillsAssessed: string[];
}

export interface TestAnswerRecord {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number; // in seconds
  questionType: QuestionType;
  difficulty: DifficultyLevel;
}

export interface TestResultFeedback {
  overallFeedback: string;
  strengths: string[];
  areasForImprovement: string[];
  recommendedStudyTopics: string[];
}

export interface TestAnalysis {
  questionTypePerformance: Record<QuestionType, number>; // percentage by question type
  difficultyPerformance: Record<DifficultyLevel, number>; // percentage by difficulty
  topicPerformance: Record<string, number>; // percentage by topic
  timePerQuestion: number[]; // time spent on each question
}