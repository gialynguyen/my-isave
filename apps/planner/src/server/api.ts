import { RequestContext } from '@mikro-orm/core';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { logger } from 'hono/logger';
import { getPostgresORM } from './providers/postgres';
import taskRoutes from './routes/tasks';

const app = new Hono().basePath('/api');

app.use(
  createMiddleware(async (_, next) => {
    const orm = getPostgresORM();
    await RequestContext.create(orm.em, next);
  })
);

app.use(logger());

const routes = app.route('/tasks', taskRoutes);

export type ApiRoutes = typeof routes;
export { app };
