import type { UserEntity } from './entity';
import type { LearningPreferences, ProficiencyLevel, ProgressStats } from '$lib/types';

export interface CreateUserRequest {
  email: string;
  name: string;
  proficiencyLevel?: ProficiencyLevel;
  learningPreferences?: LearningPreferences;
}

export interface UpdateUserRequest {
  name?: string;
  proficiencyLevel?: ProficiencyLevel;
  learningPreferences?: LearningPreferences;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  proficiencyLevel: ProficiencyLevel;
  learningPreferences: LearningPreferences;
  progressStats: ProgressStats;
  createdAt: Date;
  updatedAt: Date;
}

export function mapUserEntityToResponse(user: UserEntity): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    proficiencyLevel: user.proficiencyLevel,
    learningPreferences: user.learningPreferences,
    progressStats: user.progressStats,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}
