import { tbValidator } from '$lib/typebox/hono';
import { today } from '@internationalized/date';
import { createTaskPayloadDto } from 'features/tasks/dtos/create-task';
import { queryTasksConditionsDto } from 'features/tasks/dtos/query-tasks';
import { createTask, queryTasks } from 'features/tasks/services';
import { Hono } from 'hono';

const taskRoutes = new Hono()
  .get('/', tbValidator('query', queryTasksConditionsDto), async (c) => {
    const { dueDate, timezone, page, limit } = c.req.valid('query');
    console.log(page, limit);
    const query: Parameters<typeof queryTasks>[0] = {};

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

    const tasks = await queryTasks(query, {
      page: 1,
      limit: 10
    });
    return c.json(tasks);
  })
  .post('/', tbValidator('json', createTaskPayloadDto), async (c) => {
    const payload = c.req.valid('json');

    const task = await createTask(payload);

    return c.json(task);
  });

export default taskRoutes;
