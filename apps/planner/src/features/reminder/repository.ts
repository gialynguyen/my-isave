import { getPostgresEm } from 'server/providers/postgres';
import { ReminderEntity } from './entity';

export const reminderPostgresRepo = getPostgresEm().getRepository(ReminderEntity);
