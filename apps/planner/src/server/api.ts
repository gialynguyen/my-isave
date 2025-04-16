import { RequestContext } from '@mikro-orm/core';
import { apiReference } from '@scalar/hono-api-reference';
import { Hono } from 'hono';
import { openAPISpecs } from 'hono-openapi';
import { createMiddleware } from 'hono/factory';
import { logger } from 'hono/logger';
import { getPostgresORM } from './providers/postgres';
import reminderRoutes from './routes/reminders';
import taskRoutes from './routes/tasks';

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
  .route('/reminders', reminderRoutes)
  .get(
    '/openapi.json',
    openAPISpecs(app, {
      documentation: {
        info: { title: 'Planner API', version: '1.0.0' },
        servers: [
          {
            url: 'http://localhost:3000',
            description: 'Local Server'
          }
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            }
          }
        },
        security: [
          {
            bearerAuth: []
          }
        ]
      }
    })
  )
  .get(
    '/docs',
    apiReference({
      // @ts-ignore
      spec: { url: '/api/openapi.json' }
    })
  );

export type ApiRoutes = typeof routes;
export { app };
