import type { EntityDTO, Loaded } from '@mikro-orm/core';
import type { TaskEntity } from '../entity';

export type TaskDefaultOutput = EntityDTO<Loaded<TaskEntity, 'subTasks'>, never>;
