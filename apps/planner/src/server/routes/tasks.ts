import { tbValidator } from '$lib/typebox/hono';
import { today } from '@internationalized/date';
import { createTaskPayloadDto } from 'features/task/dtos/create-task';
import { queryTasksConditionsDto } from 'features/task/dtos/query-tasks';
import { updateTaskPayloadDto } from 'features/task/dtos/update-task';
import { createTask, queryTasks, updateTask } from 'features/task/services';
import { Hono } from 'hono';

const taskRoutes = new Hono()
  .get('/', tbValidator('query', queryTasksConditionsDto), async (c) => {
    const { dueDate, timezone, page, limit, before, last, after, first } = c.req.valid('query');

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

    const tasks = await queryTasks(query, pagination);
    return c.json(tasks);
  })
  .post('/', tbValidator('json', createTaskPayloadDto), async (c) => {
    const payload = c.req.valid('json');

    const task = await createTask(payload);

    return c.json(task);
  })
  .put('/:id', tbValidator('json', updateTaskPayloadDto), async (c) => {
    const { id } = c.req.param();
    const payload = c.req.valid('json');
    const task = await updateTask(id, payload);

    return c.json(task);
  });

export default taskRoutes;
