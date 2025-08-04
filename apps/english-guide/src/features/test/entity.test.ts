import { describe, it, expect, beforeEach } from 'vitest';
import { TestEntity, TestResultEntity, type TestMetadata, type TestAnswerRecord, type TestResultFeedback, type TestAnalysis } from './entity';
import { UserEntity } from '../user/entity';
import { DifficultyLevel, QuestionType, type TestQuestion } from '$lib/types';

describe('TestEntity', () => {
  let testEntity: TestEntity;

  beforeEach(() => {
    testEntity = new TestEntity();
  });

  it('should create a test entity with default values', () => {
    expect(testEntity.difficulty).toBe(DifficultyLevel.BEGINNER);
    expect(testEntity.questions).toEqual([]);
    expect(testEntity.tags).toEqual([]);
    expect(testEntity.timeLimit).toBe(0);
    expect(testEntity.passingScore).toBe(70);
    expect(testEntity.isActive).toBe(true);
    expect(testEntity.metadata).toEqual({
      totalQuestions: 0,
      estimatedDuration: 0,
      topics: [],
      skillsAssessed: []
    });
  });

  it('should set title and description correctly', () => {
    testEntity.title = 'English Vocabulary Test';
    testEntity.description = 'A comprehensive test for English vocabulary';
    
    expect(testEntity.title).toBe('English Vocabulary Test');
    expect(testEntity.description).toBe('A comprehensive test for English vocabulary');
  });

  it('should handle questions array correctly', () => {
    const testQuestions: TestQuestion[] = [
      {
        id: '1',
        type: QuestionType.MULTIPLE_CHOICE,
        content: 'What is the meaning of "ubiquitous"?',
        options: ['Rare', 'Common', 'Everywhere', 'Hidden'],
        correctAnswer: 'Everywhere',
        explanation: 'Ubiquitous means present, appearing, or found everywhere.',
        difficulty: DifficultyLevel.INTERMEDIATE
      },
      {
        id: '2',
        type: QuestionType.TRUE_FALSE,
        content: 'The word "serendipity" means a pleasant surprise.',
        correctAnswer: 'true',
        explanation: 'Serendipity refers to the occurrence of pleasant or beneficial events by chance.',
        difficulty: DifficultyLevel.ADVANCED
      }
    ];

    testEntity.questions = testQuestions;
    expect(testEntity.questions).toHaveLength(2);
    expect(testEntity.questions[0].type).toBe(QuestionType.MULTIPLE_CHOICE);
    expect(testEntity.questions[1].type).toBe(QuestionType.TRUE_FALSE);
  });

  it('should handle metadata correctly', () => {
    const metadata: TestMetadata = {
      totalQuestions: 10,
      estimatedDuration: 15,
      topics: ['vocabulary', 'grammar'],
      skillsAssessed: ['reading comprehension', 'word knowledge']
    };

    testEntity.metadata = metadata;
    expect(testEntity.metadata.totalQuestions).toBe(10);
    expect(testEntity.metadata.estimatedDuration).toBe(15);
    expect(testEntity.metadata.topics).toContain('vocabulary');
    expect(testEntity.metadata.skillsAssessed).toContain('reading comprehension');
  });

  it('should handle tags correctly', () => {
    testEntity.tags = ['beginner', 'vocabulary', 'practice'];
    expect(testEntity.tags).toHaveLength(3);
    expect(testEntity.tags).toContain('vocabulary');
  });

  it('should set difficulty level correctly', () => {
    testEntity.difficulty = DifficultyLevel.ADVANCED;
    expect(testEntity.difficulty).toBe(DifficultyLevel.ADVANCED);
  });

  it('should set time limit and passing score correctly', () => {
    testEntity.timeLimit = 30; // 30 minutes
    testEntity.passingScore = 80; // 80%
    
    expect(testEntity.timeLimit).toBe(30);
    expect(testEntity.passingScore).toBe(80);
  });
});

describe('TestResultEntity', () => {
  let testResultEntity: TestResultEntity;
  let userEntity: UserEntity;
  let testEntity: TestEntity;

  beforeEach(() => {
    testResultEntity = new TestResultEntity();
    userEntity = new UserEntity();
    testEntity = new TestEntity();
    
    userEntity.email = 'test@example.com';
    userEntity.name = 'Test User';
    testEntity.title = 'Sample Test';
  });

  it('should create a test result entity with default values', () => {
    expect(testResultEntity.score).toBe(0);
    expect(testResultEntity.totalQuestions).toBe(0);
    expect(testResultEntity.correctAnswers).toBe(0);
    expect(testResultEntity.timeSpent).toBe(0);
    expect(testResultEntity.isPassed).toBe(false);
    expect(testResultEntity.answers).toEqual([]);
    expect(testResultEntity.feedback).toEqual({
      overallFeedback: '',
      strengths: [],
      areasForImprovement: [],
      recommendedStudyTopics: []
    });
    expect(testResultEntity.detailedAnalysis).toEqual({
      questionTypePerformance: {},
      difficultyPerformance: {},
      topicPerformance: {},
      timePerQuestion: []
    });
  });

  it('should set user and test relationships correctly', () => {
    testResultEntity.user = userEntity;
    testResultEntity.test = testEntity;
    
    expect(testResultEntity.user).toBe(userEntity);
    expect(testResultEntity.test).toBe(testEntity);
  });

  it('should calculate score and passing status correctly', () => {
    testResultEntity.totalQuestions = 10;
    testResultEntity.correctAnswers = 8;
    testResultEntity.score = 80;
    testResultEntity.isPassed = testResultEntity.score >= 70;
    
    expect(testResultEntity.score).toBe(80);
    expect(testResultEntity.isPassed).toBe(true);
  });

  it('should handle test answers correctly', () => {
    const testAnswers: TestAnswerRecord[] = [
      {
        questionId: '1',
        userAnswer: 'Everywhere',
        correctAnswer: 'Everywhere',
        isCorrect: true,
        timeSpent: 15,
        questionType: QuestionType.MULTIPLE_CHOICE,
        difficulty: DifficultyLevel.INTERMEDIATE
      },
      {
        questionId: '2',
        userAnswer: 'false',
        correctAnswer: 'true',
        isCorrect: false,
        timeSpent: 20,
        questionType: QuestionType.TRUE_FALSE,
        difficulty: DifficultyLevel.ADVANCED
      }
    ];

    testResultEntity.answers = testAnswers;
    expect(testResultEntity.answers).toHaveLength(2);
    expect(testResultEntity.answers[0].isCorrect).toBe(true);
    expect(testResultEntity.answers[1].isCorrect).toBe(false);
  });

  it('should handle feedback correctly', () => {
    const feedback: TestResultFeedback = {
      overallFeedback: 'Good performance overall, but needs improvement in advanced vocabulary.',
      strengths: ['Basic vocabulary', 'Multiple choice questions'],
      areasForImprovement: ['Advanced vocabulary', 'True/false questions'],
      recommendedStudyTopics: ['Advanced vocabulary', 'Context clues']
    };

    testResultEntity.feedback = feedback;
    expect(testResultEntity.feedback.overallFeedback).toContain('Good performance');
    expect(testResultEntity.feedback.strengths).toContain('Basic vocabulary');
    expect(testResultEntity.feedback.areasForImprovement).toContain('Advanced vocabulary');
    expect(testResultEntity.feedback.recommendedStudyTopics).toContain('Context clues');
  });

  it('should handle detailed analysis correctly', () => {
    const analysis: TestAnalysis = {
      questionTypePerformance: {
        [QuestionType.MULTIPLE_CHOICE]: 90,
        [QuestionType.TRUE_FALSE]: 60
      },
      difficultyPerformance: {
        [DifficultyLevel.BEGINNER]: 100,
        [DifficultyLevel.INTERMEDIATE]: 80,
        [DifficultyLevel.ADVANCED]: 50
      },
      topicPerformance: {
        'vocabulary': 75,
        'grammar': 85
      },
      timePerQuestion: [15, 20, 12, 25, 18]
    };

    testResultEntity.detailedAnalysis = analysis;
    expect(testResultEntity.detailedAnalysis.questionTypePerformance[QuestionType.MULTIPLE_CHOICE]).toBe(90);
    expect(testResultEntity.detailedAnalysis.difficultyPerformance[DifficultyLevel.ADVANCED]).toBe(50);
    expect(testResultEntity.detailedAnalysis.topicPerformance['vocabulary']).toBe(75);
    expect(testResultEntity.detailedAnalysis.timePerQuestion).toHaveLength(5);
  });

  it('should handle timestamps correctly', () => {
    const startTime = new Date('2024-01-01T10:00:00Z');
    const endTime = new Date('2024-01-01T10:30:00Z');
    
    testResultEntity.startedAt = startTime;
    testResultEntity.completedAt = endTime;
    
    expect(testResultEntity.startedAt).toBe(startTime);
    expect(testResultEntity.completedAt).toBe(endTime);
  });

  it('should calculate time spent correctly', () => {
    testResultEntity.timeSpent = 1800; // 30 minutes in seconds
    expect(testResultEntity.timeSpent).toBe(1800);
  });
});

describe('TestEntity and TestResultEntity relationships', () => {
  it('should establish correct entity relationships', () => {
    const user = new UserEntity();
    const test = new TestEntity();
    const result = new TestResultEntity();
    
    user.email = 'student@example.com';
    user.name = 'Student';
    
    test.title = 'Integration Test';
    test.difficulty = DifficultyLevel.INTERMEDIATE;
    
    result.user = user;
    result.test = test;
    result.score = 85;
    result.isPassed = true;
    
    // Test that relationships are set correctly
    expect(result.user).toBe(user);
    expect(result.test).toBe(test);
    expect(result.user.email).toBe('student@example.com');
    expect(result.test.title).toBe('Integration Test');
    expect(result.score).toBe(85);
    expect(result.isPassed).toBe(true);
  });
});