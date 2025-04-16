import { wrap, type FilterObject } from '@mikro-orm/core';
import { getPostgresEm } from 'server/providers/postgres';
import type { CreateTaskPayload } from './dtos/create-task';
import type { UpdateTaskDto } from './dtos/update-task';
import { TaskEntity } from './entity';
import { taskPostgresRepo } from './repository';
import { generateShortId } from './utils/short-id';

export async function createTask(payload: CreateTaskPayload) {
  const task = new TaskEntity();

  task.shortId = generateShortId();
  task.title = payload.title;
  task.description = payload.description;

  if (payload.dueDate) {
    task.dueDate = new Date(payload.dueDate);
  }

  // Handle parent task relationship if provided
  if (payload.parentTaskId) {
    const parentTask = await taskPostgresRepo.findOneOrFail({ id: payload.parentTaskId });
    task.parentTask = parentTask;
  }

  // Create and persist the main task
  const em = getPostgresEm();
  em.persist(task);

  // Handle subtasks if provided
  if (payload.subTasks && payload.subTasks.length > 0) {
    for (const subTaskPayload of payload.subTasks) {
      const subTask = new TaskEntity();
      subTask.title = subTaskPayload.title;
      subTask.description = subTaskPayload.description;

      if (subTaskPayload.dueDate) {
        subTask.dueDate = new Date(subTaskPayload.dueDate);
      }

      // Link subtask to parent task
      subTask.parentTask = task;

      // Add to collection and persist
      task.subTasks.add(subTask);
      em.persist(subTask);
    }
  }

  // Flush all changes to database
  await em.flush();

  return task;
}

export async function queryTasks<Filters extends FilterObject<TaskEntity>>(
  params: {
    dueDate?: Filters['dueDate'];
    parentTaskId?: string | null;
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
  const queryParams: any = { ...params };

  // Handle parent task filtering
  if (params.parentTaskId === null) {
    // Fetch only root tasks (tasks without a parent)
    queryParams.parentTask = null;
    delete queryParams.parentTaskId;
  } else if (params.parentTaskId) {
    // Fetch sub-tasks of a specific parent
    queryParams.parentTask = { id: params.parentTaskId };
    delete queryParams.parentTaskId;
  }

  const tasks = await taskPostgresRepo.find(queryParams, {
    limit,
    offset: page && limit ? (page - 1) * limit : undefined,
    after: after ? { id: after } : undefined,
    first,
    before: before ? { id: before } : undefined,
    last,
    orderBy: {
      dueDate: 'DESC',
      updatedAt: 'DESC'
    },
    populate: ['subTasks']
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

export async function getTaskByShortId(shortId: string) {
  return taskPostgresRepo.findOneOrFail({ shortId }, { populate: ['subTasks'] });
}
