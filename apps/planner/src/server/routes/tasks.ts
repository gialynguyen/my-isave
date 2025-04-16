import { today } from '@internationalized/date';
import { createTaskPayloadDto } from 'features/task/dtos/create-task';
import { queryTasksConditionsDto } from 'features/task/dtos/query-tasks';
import { updateTaskPayloadDto } from 'features/task/dtos/update-task';
import { createTask, getTaskByShortId, queryTasks, updateTask } from 'features/task/services';
import { TaskEntity } from 'features/task/entity';
import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { validator } from 'server/middlewares/validator';
import { getPostgresEm } from 'server/providers/postgres';

const taskRoutes = new Hono()
  .get(
    '/',
    describeRoute({
      summary: 'Query tasks',
      tags: ['Task']
    }),
    validator('query', queryTasksConditionsDto),
    async (c) => {
      const { dueDate, timezone, page, limit, before, last, after, first, parentTaskId } = c.req.valid('query');

      const query: Parameters<typeof queryTasks>[0] = {};
      const pagination: Parameters<typeof queryTasks>[1] = {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        before,
        last: last ? Number(last) : undefined,
        after,
        first: first ? Number(first) : undefined
      };

      if (!limit && !last && !first) {
        switch (dueDate) {
          case 'today': {
            break;
          }
          default: {
            pagination.page = 1;
            pagination.limit = 20;
          }
        }
      }

      if (typeof dueDate === 'string') {
        switch (dueDate) {
          case 'today': {
            const todayValue = today(timezone);
            query.dueDate = {
              $lt: todayValue
                .add({
                  days: 1
                })
                .toDate(timezone)
                .toISOString(),
              $gte: todayValue.toDate(timezone).toISOString()
            };
            break;
          }
        }
      }

      // Handle parent task filtering
      if (parentTaskId !== undefined) {
        query.parentTaskId = parentTaskId === 'null' ? null : parentTaskId;
      }

      const tasks = await queryTasks(query, pagination);
      return c.json(tasks);
    }
  )
  .post(
    '/',
    describeRoute({
      summary: 'Create a task',
      tags: ['Task']
    }),
    validator('json', createTaskPayloadDto),
    async (c) => {
      const payload = c.req.valid('json');

      const task = await createTask(payload);

      return c.json(task);
    }
  )
  .put(
    '/:id',
    describeRoute({
      summary: 'Update a task',
      tags: ['Task']
    }),
    validator('json', updateTaskPayloadDto),
    async (c) => {
      const { id } = c.req.param();
      const payload = c.req.valid('json');
      const task = await updateTask(id, payload);

      return c.json(task);
    }
  )
  .get(
    '/:id',
    describeRoute({
      summary: 'Get a single task by ID',
      tags: ['Task']
    }),
    async (c) => {
      const { id } = c.req.param();
      const em = getPostgresEm();
      const task = await em.findOneOrFail(TaskEntity, { id }, { populate: ['subTasks'] });
      
      return c.json(task);
    }
  )
  .delete(
    '/:id',
    describeRoute({
      summary: 'Delete a task',
      tags: ['Task']
    }),
    async (c) => {
      const { id } = c.req.param();
      const em = getPostgresEm();
      const task = await em.findOneOrFail(TaskEntity, { id });
      
      await em.removeAndFlush(task);
      
      return c.json({ success: true });
    }
  )
  .get(
    '/byShortId/:shortId',
    describeRoute({
      summary: 'Get a single task by short ID',
      tags: ['Task']
    }),
    async (c) => {
      const { shortId } = c.req.param();
      const task = await getTaskByShortId(shortId);
      
      return c.json(task);
    }
  );

export default taskRoutes;
