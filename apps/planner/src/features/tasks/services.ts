import type { FilterObject } from '@mikro-orm/core';
import { getPostgresEm } from 'server/providers/postgres';
import type { CreateTaskPayload } from './dtos/create-task';
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
    cursor?: string;
  }
) {
  const { page = 1, limit = 10 } = pagination;

  const tasks = await taskPostgresRepo.find(params, {
    limit,
    offset: (page - 1) * limit,
    orderBy: {
      dueDate: 'ASC',
      createdAt: 'ASC'
    }
  });

  return tasks;
}
