import { RequestContext } from '@mikro-orm/core';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { logger } from 'hono/logger';
import { getPostgresORM } from './providers/postgres';
import taskRoutes from './routes/tasks';
import reminderRoutes from './routes/reminders';

const app = new Hono().basePath('/api');

app.use(
  createMiddleware(async (_, next) => {
    const orm = getPostgresORM();
    await RequestContext.create(orm.em, next);
  })
);

app.use(logger());

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app
  // API routes
  .route('/tasks', taskRoutes)
  .route('/reminders', reminderRoutes);

export type ApiRoutes = typeof routes;
export { app };
