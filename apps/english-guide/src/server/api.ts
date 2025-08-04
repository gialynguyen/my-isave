import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createPostgresORM } from './providers/postgres';
import { vocabularyRouter } from './routes/vocabulary';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Initialize database connection
let dbInitialized = false;

app.use('*', async (c, next) => {
  if (!dbInitialized) {
    try {
      await createPostgresORM();
      dbInitialized = true;
      console.log('Database connection initialized');
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }
  await next();
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: dbInitialized ? 'connected' : 'disconnected'
  });
});

// API routes
app.route('/api/vocabulary', vocabularyRouter);

// Placeholder routes for other features
app.get('/api/users', (c) => {
  return c.json({ message: 'Users endpoint - coming soon' });
});

app.get('/api/conversations', (c) => {
  return c.json({ message: 'Conversations endpoint - coming soon' });
});

export default app;