import { wrap, type FilterObject } from '@mikro-orm/core';
import { getPostgresEm } from 'server/providers/postgres';
import type { CreateTaskPayload } from './dtos/create-task';
import type { UpdateTaskDto } from './dtos/update-task';
import { TaskEntity } from './entity';
import { taskPostgresRepo } from './repository';

export async function createTask(payload: CreateTaskPayload) {
  const task = new TaskEntity();

  task.title = payload.title;
  task.description = payload.description;

  if (payload.dueDate) {
    task.dueDate = new Date(payload.dueDate);
  }

  await getPostgresEm().persistAndFlush(task);

  return task;
}

export async function queryTasks<Filters extends FilterObject<TaskEntity>>(
  params: {
    dueDate?: Filters['dueDate'];
  },
  pagination: {
    page?: number;
    limit?: number;
    after?: string;
    first?: number;
    before?: string;
    last?: number;
  }
) {
  const { page, limit, after, first, before, last } = pagination;

  const tasks = await taskPostgresRepo.find(params, {
    limit,
    offset: page && limit ? (page - 1) * limit : undefined,
    after: after ? { id: after } : undefined,
    first,
    before: before ? { id: before } : undefined,
    last,
    orderBy: {
      dueDate: 'DESC',
      updatedAt: 'DESC'
    }
  });

  return tasks;
}

export async function updateTask(id: string, payload: UpdateTaskDto) {
  const task = await taskPostgresRepo.findOneOrFail({ id });
  wrap(task).assign(payload);

  if (task.isCompleted && !task.completedAt) {
    task.completedAt = new Date();
  }

  await getPostgresEm().flush();
  return task;
}
