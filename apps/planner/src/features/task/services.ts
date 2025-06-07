import { serialize, wrap, type FilterObject } from '@mikro-orm/core';
import { getPostgresEm } from 'server/providers/postgres';
import type { CreateTaskPayload } from './dtos/create-task';
import type { TaskDefaultOutput } from './dtos/task-ouput';
import type { UpdateTaskPayloadDto } from './dtos/update-task';
import { TaskEntity } from './entity';
import { taskPostgresRepo } from './repository';

export async function createTask(payload: CreateTaskPayload) {
  const task = new TaskEntity();

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
  filters: Filters,
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
  const queryParams: any = { ...filters };

  // Handle parent task filtering
  if (filters.parentTask === null) {
    // Fetch only root tasks (tasks without a parent)
    queryParams.parentTask = null;
    delete queryParams.parentTaskId;
  } else if (filters.parentTask) {
    // Fetch sub-tasks of a specific parent
    queryParams.parentTask = { id: filters.parentTask };
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

  const taskDTO: TaskDefaultOutput[] = serialize(tasks);

  return taskDTO;
}

export async function updateTask(id: string, payload: UpdateTaskPayloadDto) {
  const task = await taskPostgresRepo.findOneOrFail({ id });
  wrap(task).assign(payload);

  if (task.isCompleted && !task.completedAt) {
    task.completedAt = new Date();
  }

  await getPostgresEm().flush();
  return task;
}

export async function getTaskByShortId(shortId: string) {
  return taskPostgresRepo.findOneOrFail(
    {
      shortId
    },
    {
      populate: ['subTasks'],
      populateWhere: {
        subTasks: {
          isArchived: false,
          isDeleted: false
        }
      }
    }
  );
}

export async function deleteTemporarilyTask(id: string) {
  const knex = taskPostgresRepo.getKnex();
  const cteSelectQuery = knex
    .raw(
      `
      WITH RECURSIVE task_hierarchy AS (
      SELECT id
      FROM task
      WHERE id = ? AND "is_deleted" = false

      UNION ALL

      SELECT t.id
      FROM task t
      INNER JOIN task_hierarchy th ON t."parent_task_id" = th.id
      WHERE t."is_deleted" = false
    )
    SELECT id from task_hierarchy
    `,
      [id]
    )
    .toString();

  const em = getPostgresEm();
  const idsToDeleteResult = await em.getConnection('read').execute(cteSelectQuery);
  const idsToDelete: string[] = idsToDeleteResult.map((row) => row.id);
  if (idsToDelete.length === 0) {
    throw new Error('No tasks found to delete');
  }

  const affectedRows = await em.nativeUpdate(
    TaskEntity,
    { id: { $in: idsToDelete } },
    { isDeleted: true, deletedAt: new Date() }
  );

  return affectedRows;
}
