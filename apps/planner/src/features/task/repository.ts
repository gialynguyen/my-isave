import { getPostgresEm } from 'server/providers/postgres';
import { TaskEntity } from './entity';

export const taskPostgresRepo = getPostgresEm().getRepository(TaskEntity);
