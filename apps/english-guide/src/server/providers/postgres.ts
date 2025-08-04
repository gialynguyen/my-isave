import { POSTGRES_PASSWORD, POSTGRES_URL, POSTGRES_USER } from '$env/static/private';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { Migrator } from '@mikro-orm/migrations';
import { MikroORM } from '@mikro-orm/postgresql';
import { UserEntity } from 'features/user/entity';
import { VocabularyEntity, VocabularyProgressEntity } from 'features/vocabulary/entity';
import { ConversationSessionEntity } from 'features/conversation/entity';
import { TestEntity, TestResultEntity } from 'features/test/entity';

let orm: Awaited<ReturnType<typeof createPostgresORM>>;

export async function createPostgresORM() {
  const connectedORM = await MikroORM.init({
    entities: [
      UserEntity,
      VocabularyEntity,
      VocabularyProgressEntity,
      ConversationSessionEntity,
      TestEntity,
      TestResultEntity
    ],
    clientUrl: POSTGRES_URL,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    debug: true,
    extensions: [EntityGenerator, Migrator],
    migrations: {
      path: 'dist/migrations',
      pathTs: 'src/migrations'
    }
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
  return orm?.em;
}