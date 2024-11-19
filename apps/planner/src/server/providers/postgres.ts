import { POSTGRES_PASSWORD, POSTGRES_URL, POSTGRES_USER } from '$env/static/private';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { Migrator } from '@mikro-orm/migrations';
import { MikroORM } from '@mikro-orm/postgresql';
import { ReminderEntity } from 'features/reminder/entity';
import { TaskEntity } from 'features/task/entity';

let orm: Awaited<ReturnType<typeof createPostgresORM>>;

export async function createPostgresORM() {
  const connectedORM = await MikroORM.init({
    entities: [TaskEntity, ReminderEntity],
    clientUrl: POSTGRES_URL,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    debug: true,
    extensions: [EntityGenerator, Migrator]
  });

  if (!orm) {
    orm = connectedORM;
  }

  return connectedORM;
}

export function getPostgresORM() {
  return orm;
}

export function getPostgresEm() {
  return orm.em;
}
