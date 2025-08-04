import type { VocabularyEntity, VocabularyProgressEntity } from './entity';
import type { DifficultyLevel, VocabularyFilters } from '$lib/types';

export interface CreateVocabularyRequest {
  word: string;
  definition: string;
  pronunciation: string;
  examples?: string[];
  difficulty?: DifficultyLevel;
  tags?: string[];
  audioUrl?: string;
}

export interface UpdateVocabularyRequest {
  definition?: string;
  pronunciation?: string;
  examples?: string[];
  difficulty?: DifficultyLevel;
  tags?: string[];
  audioUrl?: string;
}

export interface VocabularyResponse {
  id: string;
  word: string;
  definition: string;
  pronunciation: string;
  examples: string[];
  difficulty: DifficultyLevel;
  tags: string[];
  audioUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VocabularyProgressResponse {
  id: string;
  vocabularyId: string;
  masteryLevel: number;
  lastReviewed: Date;
  nextReview: Date;
  correctAttempts: number;
  totalAttempts: number;
}

export interface VocabularyListResponse {
  items: VocabularyResponse[];
  total: number;
  page: number;
  limit: number;
}

export function mapVocabularyEntityToResponse(vocabulary: VocabularyEntity): VocabularyResponse {
  return {
    id: vocabulary.id,
    word: vocabulary.word,
    definition: vocabulary.definition,
    pronunciation: vocabulary.pronunciation,
    examples: vocabulary.examples,
    difficulty: vocabulary.difficulty,
    tags: vocabulary.tags,
    audioUrl: vocabulary.audioUrl,
    createdAt: vocabulary.createdAt,
    updatedAt: vocabulary.updatedAt
  };
}

export function mapVocabularyProgressEntityToResponse(progress: VocabularyProgressEntity): VocabularyProgressResponse {
  return {
    id: progress.id,
    vocabularyId: progress.vocabulary.id,
    masteryLevel: progress.masteryLevel,
    lastReviewed: progress.lastReviewed,
    nextReview: progress.nextReview,
    correctAttempts: progress.correctAttempts,
    totalAttempts: progress.totalAttempts
  };
}