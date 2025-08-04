import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { HTTPException } from 'hono/http-exception';
import { VocabularyService } from '../../features/vocabulary/service';
import { AIService } from '../../lib/ai/service';
import { createPostgresORM } from '../providers/postgres';
import { DifficultyLevel, ProficiencyLevel, AIProvider, type VocabularyFilters } from '../../lib/types';
import { 
  OPENAI_API_KEY, 
  OPENAI_MODEL, 
  OPENROUTER_API_KEY, 
  OPENROUTER_MODEL, 
  AI_DEFAULT_PROVIDER 
} from '$env/static/private';

type Variables = {
  vocabularyService: VocabularyService;
};

const vocabularyRouter = new Hono<{ Variables: Variables }>();

// Middleware to initialize services
vocabularyRouter.use('*', async (c, next) => {
  try {
    const orm = await createPostgresORM();
    const em = orm.em.fork();
    
    // Initialize AI service with default configuration
    const aiService = new AIService({
      providers: {
        [AIProvider.OPENAI]: {
          apiKey: OPENAI_API_KEY || '',
          baseUrl: 'https://api.openai.com/v1',
          model: OPENAI_MODEL || 'gpt-3.5-turbo',
        },
        [AIProvider.OPENROUTER]: {
          apiKey: OPENROUTER_API_KEY || '',
          baseUrl: 'https://api.openrouter.ai/v1',
          model: OPENROUTER_MODEL || 'meta-llama/Meta-Llama-3-8B-Instruct'
        }
      },
      defaultProvider: AI_DEFAULT_PROVIDER as AIProvider || AIProvider.OPENAI,
      fallbackOrder: [AIProvider.OPENROUTER, AIProvider.OPENAI]
    });
    
    const vocabularyService = new VocabularyService({
      entityManager: em,
      aiService
    });
    
    c.set('vocabularyService', vocabularyService);
    await next();
  } catch (error) {
    console.error('Failed to initialize vocabulary service:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// GET /api/vocabulary - Get vocabulary words with filtering and pagination
vocabularyRouter.get('/', 
  validator('query', (value) => {
    const filters: VocabularyFilters = {};
    
    if (value.difficulty && typeof value.difficulty === 'string' && Object.values(DifficultyLevel).includes(value.difficulty as DifficultyLevel)) {
      filters.difficulty = value.difficulty as DifficultyLevel;
    }
    
    if (value.tags) {
      filters.tags = Array.isArray(value.tags) ? value.tags as string[] : [value.tags as string];
    }
    
    if (value.limit && typeof value.limit === 'string') {
      const limit = parseInt(value.limit);
      if (!isNaN(limit) && limit > 0 && limit <= 100) {
        filters.limit = limit;
      }
    }
    
    if (value.offset && typeof value.offset === 'string') {
      const offset = parseInt(value.offset);
      if (!isNaN(offset) && offset >= 0) {
        filters.offset = offset;
      }
    }
    
    return filters;
  }),
  async (c) => {
    try {
      const vocabularyService = c.get('vocabularyService');
      const filters = c.req.valid('query');
      
      const result = await vocabularyService.getVocabularyWords(filters);
      
      return c.json(result);
    } catch (error) {
      console.error('Error fetching vocabulary words:', error);
      throw new HTTPException(500, { message: 'Failed to fetch vocabulary words' });
    }
  }
);

// GET /api/vocabulary/search - Search vocabulary words
vocabularyRouter.get('/search',
  validator('query', (value) => {
    if (!value.q || typeof value.q !== 'string' || value.q.trim().length === 0) {
      throw new HTTPException(400, { message: 'Search query is required' });
    }
    
    const filters: VocabularyFilters = {};
    
    if (value.difficulty && typeof value.difficulty === 'string' && Object.values(DifficultyLevel).includes(value.difficulty as DifficultyLevel)) {
      filters.difficulty = value.difficulty as DifficultyLevel;
    }
    
    if (value.tags) {
      filters.tags = Array.isArray(value.tags) ? value.tags as string[] : [value.tags as string];
    }
    
    if (value.limit && typeof value.limit === 'string') {
      const limit = parseInt(value.limit);
      if (!isNaN(limit) && limit > 0 && limit <= 100) {
        filters.limit = limit;
      }
    }
    
    if (value.offset && typeof value.offset === 'string') {
      const offset = parseInt(value.offset);
      if (!isNaN(offset) && offset >= 0) {
        filters.offset = offset;
      }
    }
    
    return { query: value.q.trim(), filters };
  }),
  async (c) => {
    try {
      const vocabularyService = c.get('vocabularyService');
      const { query, filters } = c.req.valid('query');
      
      const result = await vocabularyService.searchVocabularyWords(query, filters);
      
      return c.json(result);
    } catch (error) {
      console.error('Error searching vocabulary words:', error);
      throw new HTTPException(500, { message: 'Failed to search vocabulary words' });
    }
  }
);

// POST /api/vocabulary/progress - Track user progress for vocabulary words
vocabularyRouter.post('/progress',
  validator('json', (value) => {
    if (!value.userId || typeof value.userId !== 'string') {
      throw new HTTPException(400, { message: 'User ID is required' });
    }
    
    if (!value.vocabularyId || typeof value.vocabularyId !== 'string') {
      throw new HTTPException(400, { message: 'Vocabulary ID is required' });
    }
    
    if (typeof value.correct !== 'boolean') {
      throw new HTTPException(400, { message: 'Correct field must be a boolean' });
    }
    
    const data = {
      userId: value.userId,
      vocabularyId: value.vocabularyId,
      correct: value.correct,
      responseTime: value.responseTime && typeof value.responseTime === 'number' ? value.responseTime : undefined
    };
    
    return data;
  }),
  async (c) => {
    try {
      const vocabularyService = c.get('vocabularyService');
      const { userId, vocabularyId, correct, responseTime } = c.req.valid('json');
      
      const progress = await vocabularyService.recordProgress(userId, vocabularyId, correct, responseTime);
      
      return c.json(progress);
    } catch (error) {
      console.error('Error recording vocabulary progress:', error);
      throw new HTTPException(500, { message: 'Failed to record progress' });
    }
  }
);

// GET /api/vocabulary/spaced-repetition - Get words for spaced repetition review
vocabularyRouter.get('/spaced-repetition',
  validator('query', (value) => {
    if (!value.userId || typeof value.userId !== 'string') {
      throw new HTTPException(400, { message: 'User ID is required' });
    }
    
    let limit = 10;
    if (value.limit && typeof value.limit === 'string') {
      const parsedLimit = parseInt(value.limit);
      if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 50) {
        limit = parsedLimit;
      }
    }
    
    return { userId: value.userId, limit };
  }),
  async (c) => {
    try {
      const vocabularyService = c.get('vocabularyService');
      const { userId, limit } = c.req.valid('query');
      
      const session = await vocabularyService.getSpacedRepetitionWords(userId, limit);
      
      return c.json(session);
    } catch (error) {
      console.error('Error fetching spaced repetition words:', error);
      throw new HTTPException(500, { message: 'Failed to fetch spaced repetition words' });
    }
  }
);

// POST /api/vocabulary/explain - Get AI-generated explanations for vocabulary words
vocabularyRouter.post('/explain',
  validator('json', (value) => {
    if (!value.word || typeof value.word !== 'string' || value.word.trim().length === 0) {
      throw new HTTPException(400, { message: 'Word is required' });
    }
    
    if (!value.userLevel || !Object.values(ProficiencyLevel).includes(value.userLevel)) {
      throw new HTTPException(400, { message: 'Valid user proficiency level is required' });
    }
    
    const data = {
      word: value.word.trim(),
      userLevel: value.userLevel as ProficiencyLevel,
      provider: value.provider || undefined
    };
    
    return data;
  }),
  async (c) => {
    try {
      const vocabularyService = c.get('vocabularyService');
      const { word, userLevel, provider } = c.req.valid('json');
      
      const explanation = await vocabularyService.generateExplanation(word, userLevel, provider);
      
      return c.json(explanation);
    } catch (error) {
      console.error('Error generating vocabulary explanation:', error);
      throw new HTTPException(500, { message: 'Failed to generate explanation' });
    }
  }
);

// GET /api/vocabulary/:id - Get vocabulary word by ID (must be last to avoid conflicts)
vocabularyRouter.get('/:id', async (c) => {
  try {
    const vocabularyService = c.get('vocabularyService');
    const id = c.req.param('id');
    
    if (!id) {
      throw new HTTPException(400, { message: 'Vocabulary ID is required' });
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new HTTPException(404, { message: 'Vocabulary word not found' });
    }
    
    const vocabulary = await vocabularyService.getVocabularyWordById(id);
    
    return c.json(vocabulary);
  } catch (error) {
    console.error('Error fetching vocabulary word:', error);
    if (error instanceof Error && (error.message.includes('not found') || error.message.includes('invalid input syntax'))) {
      throw new HTTPException(404, { message: 'Vocabulary word not found' });
    }
    throw new HTTPException(500, { message: 'Failed to fetch vocabulary word' });
  }
});

export { vocabularyRouter };