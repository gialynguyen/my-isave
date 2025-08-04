import type { ConversationSessionEntity } from './entity';
import { type ConversationMessage, type ConversationFeedback, type ConversationScenario, DifficultyLevel } from '$lib/types';

export interface CreateConversationSessionRequest {
  scenario: string;
}

export interface UpdateConversationSessionRequest {
  messages?: ConversationMessage[];
  duration?: number;
  feedback?: ConversationFeedback;
  isCompleted?: boolean;
}

export interface ConversationSessionResponse {
  id: string;
  userId: string;
  scenario: string;
  messages: ConversationMessage[];
  duration: number;
  feedback: ConversationFeedback;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationSessionListResponse {
  items: ConversationSessionResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface SendMessageRequest {
  content: string;
  audioUrl?: string;
}

export interface SendMessageResponse {
  userMessage: ConversationMessage;
  aiResponse: ConversationMessage;
  feedback?: ConversationFeedback;
}

export const DEFAULT_CONVERSATION_SCENARIOS: ConversationScenario[] = [
  {
    id: 'restaurant-ordering',
    title: 'Ordering at a Restaurant',
    description: 'Practice ordering food and drinks at a restaurant',
    difficulty: DifficultyLevel.BEGINNER,
    tags: ['food', 'dining', 'service']
  },
  {
    id: 'job-interview',
    title: 'Job Interview',
    description: 'Practice common job interview questions and responses',
    difficulty: DifficultyLevel.INTERMEDIATE,
    tags: ['career', 'professional', 'interview']
  },
  {
    id: 'travel-directions',
    title: 'Asking for Directions',
    description: 'Learn to ask for and understand directions while traveling',
    difficulty: DifficultyLevel.BEGINNER,
    tags: ['travel', 'navigation', 'directions']
  },
  {
    id: 'business-meeting',
    title: 'Business Meeting',
    description: 'Practice professional communication in business settings',
    difficulty: DifficultyLevel.ADVANCED,
    tags: ['business', 'professional', 'meeting']
  }
];

export function mapConversationSessionEntityToResponse(session: ConversationSessionEntity): ConversationSessionResponse {
  return {
    id: session.id,
    userId: session.user.id,
    scenario: session.scenario,
    messages: session.messages,
    duration: session.duration,
    feedback: session.feedback,
    isCompleted: session.isCompleted,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  };
}